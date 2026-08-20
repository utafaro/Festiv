from fastapi import APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect, Query
from datetime import datetime, timezone
from bson import ObjectId
from jose import jwt, JWTError
from core.database import get_db
from core.security import get_current_user
from core.config import settings
from models.suivi import (
    PositionSetRequest,
    PositionResponse,
    TargetType,
    GeoPingRequest,
)
from models.festival import SetResponse
from routes.suivi import get_suivi_or_404, ensure_access
from routes.sets import format_set
from typing import List

router = APIRouter(prefix="/suivis/{suivi_id}", tags=["tracking"])


class ConnectionManager:
    def __init__(self):
        self.active: dict[str, list[WebSocket]] = {}

    async def connect(self, suivi_id: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(suivi_id, []).append(ws)

    def disconnect(self, suivi_id: str, ws: WebSocket):
        if suivi_id in self.active:
            self.active[suivi_id] = [w for w in self.active[suivi_id] if w is not ws]
            if not self.active[suivi_id]:
                del self.active[suivi_id]

    async def broadcast(self, suivi_id: str, message: dict):
        for ws in list(self.active.get(suivi_id, [])):
            try:
                await ws.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()


def format_position(position, user) -> PositionResponse:
    return PositionResponse(
        id=str(position["_id"]),
        suivi_id=position["suivi_id"],
        user_id=position["user_id"],
        full_name=user["full_name"],
        avatar=user.get("avatar"),
        target_type=position.get("target_type"),
        lineup_id=position.get("lineup_id"),
        set_id=position.get("set_id"),
        custom_label=position.get("custom_label"),
        note=position.get("note"),
        grouped_with=position.get("grouped_with", []),
        lat=position.get("lat"),
        lng=position.get("lng"),
        geo_updated_at=position.get("geo_updated_at"),
        updated_at=position["updated_at"],
    )

@router.get("/sets", response_model=List[SetResponse])
async def list_suivi_sets(suivi_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    # Agrège les sets de toutes les lineups du suivi. L'autorisation passe par l'appartenance
    # au suivi lui-même (et non par un accès direct à chaque lineup sous-jacente) : un membre
    # invité sur le suivi doit pouvoir voir le programme sans être forcément membre des lineups.
    suivi = await get_suivi_or_404(suivi_id, db)
    await ensure_access(suivi, str(current_user["_id"]), db)
    cursor = db["sets"].find({"lineup_id": {"$in": suivi["lineup_ids"]}}).sort([("date", 1), ("start_time", 1)])
    sets = await cursor.to_list(length=1000)
    return [await format_set(s, db) for s in sets]

@router.put("/position", response_model=PositionResponse)
async def set_position(suivi_id: str, data: PositionSetRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    suivi = await get_suivi_or_404(suivi_id, db)
    await ensure_access(suivi, str(current_user["_id"]), db)
    user_id = str(current_user["_id"])

    lineup_id = None
    set_id = None
    custom_label = None

    if data.target_type == TargetType.set:
        if not data.set_id or not ObjectId.is_valid(data.set_id):
            raise HTTPException(400, "set_id invalide")
        set_doc = await db["sets"].find_one({"_id": ObjectId(data.set_id)})
        if not set_doc or set_doc["lineup_id"] not in suivi["lineup_ids"]:
            raise HTTPException(400, "Ce set ne fait pas partie des lineups de ce suivi")
        set_id = data.set_id
        lineup_id = set_doc["lineup_id"]
    elif data.target_type == TargetType.custom:
        custom_label = (data.custom_label or "").strip()
        if not custom_label:
            raise HTTPException(400, "Merci de préciser où vous êtes")
    else:
        raise HTTPException(400, "target_type invalide")

    for uid in data.grouped_with:
        present = await db["positions"].find_one({"suivi_id": suivi_id, "user_id": uid})
        if not present:
            raise HTTPException(400, f"L'utilisateur {uid} n'a pas de position active dans ce suivi")

    position = {
        "suivi_id": suivi_id,
        "user_id": user_id,
        "target_type": data.target_type,
        "lineup_id": lineup_id,
        "set_id": set_id,
        "custom_label": custom_label,
        "note": data.note,
        "grouped_with": data.grouped_with,
        "updated_at": datetime.now(timezone.utc),
    }
    await db["positions"].update_one(
        {"suivi_id": suivi_id, "user_id": user_id}, {"$set": position}, upsert=True
    )
    saved = await db["positions"].find_one({"suivi_id": suivi_id, "user_id": user_id})
    await manager.broadcast(suivi_id, {"type": "updated"})
    return format_position(saved, current_user)

@router.delete("/position", status_code=status.HTTP_204_NO_CONTENT)
async def clear_position(suivi_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    suivi = await get_suivi_or_404(suivi_id, db)
    await ensure_access(suivi, str(current_user["_id"]), db)
    user_id = str(current_user["_id"])

    position = await db["positions"].find_one({"suivi_id": suivi_id, "user_id": user_id})
    if position:
        if position.get("lat") is not None:
            await db["positions"].update_one(
                {"_id": position["_id"]},
                {"$set": {"target_type": None, "lineup_id": None, "set_id": None, "custom_label": None, "note": None, "grouped_with": []}},
            )
        else:
            await db["positions"].delete_one({"_id": position["_id"]})
        await manager.broadcast(suivi_id, {"type": "updated"})

@router.put("/geo", response_model=PositionResponse)
async def ping_geo(suivi_id: str, data: GeoPingRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    suivi = await get_suivi_or_404(suivi_id, db)
    await ensure_access(suivi, str(current_user["_id"]), db)
    user_id = str(current_user["_id"])

    await db["positions"].update_one(
        {"suivi_id": suivi_id, "user_id": user_id},
        {
            "$set": {"lat": data.lat, "lng": data.lng, "geo_updated_at": datetime.now(timezone.utc)},
            "$setOnInsert": {
                "suivi_id": suivi_id,
                "user_id": user_id,
                "target_type": None,
                "lineup_id": None,
                "set_id": None,
                "custom_label": None,
                "note": None,
                "grouped_with": [],
                "updated_at": datetime.now(timezone.utc),
            },
        },
        upsert=True,
    )
    saved = await db["positions"].find_one({"suivi_id": suivi_id, "user_id": user_id})
    await manager.broadcast(suivi_id, {"type": "updated"})
    return format_position(saved, current_user)

@router.delete("/geo", status_code=status.HTTP_204_NO_CONTENT)
async def clear_geo(suivi_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    suivi = await get_suivi_or_404(suivi_id, db)
    await ensure_access(suivi, str(current_user["_id"]), db)
    user_id = str(current_user["_id"])

    position = await db["positions"].find_one({"suivi_id": suivi_id, "user_id": user_id})
    if position:
        if position.get("target_type"):
            await db["positions"].update_one(
                {"_id": position["_id"]},
                {"$set": {"lat": None, "lng": None, "geo_updated_at": None}},
            )
        else:
            await db["positions"].delete_one({"_id": position["_id"]})
        await manager.broadcast(suivi_id, {"type": "updated"})

@router.get("/positions", response_model=List[PositionResponse])
async def list_positions(suivi_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    suivi = await get_suivi_or_404(suivi_id, db)
    await ensure_access(suivi, str(current_user["_id"]), db)
    cursor = db["positions"].find({"suivi_id": suivi_id})
    positions = await cursor.to_list(length=500)
    result = []
    for p in positions:
        if not p.get("target_type") and p.get("lat") is None:
            continue
        user = await db["users"].find_one({"_id": ObjectId(p["user_id"])})
        if user:
            result.append(format_position(p, user))
    return result


async def _authenticate_ws(token: str, suivi_id: str, db):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
    except JWTError:
        return None

    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        return None

    if not ObjectId.is_valid(suivi_id):
        return None
    suivi = await db["suivis"].find_one({"_id": ObjectId(suivi_id)})
    if not suivi:
        return None

    if suivi["owner_id"] != user_id:
        member = await db["suivi_members"].find_one({
            "suivi_id": suivi_id, "user_id": user_id, "status": "accepted"
        })
        if not member:
            return None

    return user

@router.websocket("/ws")
async def suivi_ws(websocket: WebSocket, suivi_id: str, token: str = Query(...)):
    db = get_db()
    user = await _authenticate_ws(token, suivi_id, db)
    if not user:
        await websocket.close(code=4003)
        return

    await manager.connect(suivi_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(suivi_id, websocket)
