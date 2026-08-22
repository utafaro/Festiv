from fastapi import APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect, Query
from datetime import datetime, timezone
from bson import ObjectId
from jose import jwt, JWTError
from core.database import get_db
from core.security import get_current_user
from core.config import settings
from models.festival import (
    LineupCreateRequest,
    LineupUpdateRequest,
    LineupResponse,
    LineupInviteRequest,
    LineupMemberResponse,
    LineupMemberStatus,
)
from routes.friend import is_friend
from typing import List

router = APIRouter(prefix="/lineups", tags=["lineups"])


class ConnectionManager:
    def __init__(self):
        self.active: dict[str, list[WebSocket]] = {}

    async def connect(self, lineup_id: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(lineup_id, []).append(ws)

    def disconnect(self, lineup_id: str, ws: WebSocket):
        if lineup_id in self.active:
            self.active[lineup_id] = [w for w in self.active[lineup_id] if w is not ws]
            if not self.active[lineup_id]:
                del self.active[lineup_id]

    async def broadcast(self, lineup_id: str, message: dict):
        for ws in list(self.active.get(lineup_id, [])):
            try:
                await ws.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()

def format_lineup(lineup) -> LineupResponse:
    return LineupResponse(
        id=str(lineup["_id"]),
        festival_id=lineup["festival_id"],
        owner_id=lineup["owner_id"],
        name=lineup.get("name"),
        created_at=lineup["created_at"],
    )

def format_member(member, user, lineup=None) -> LineupMemberResponse:
    return LineupMemberResponse(
        id=str(member["_id"]),
        lineup_id=member["lineup_id"],
        lineup_name=lineup.get("name") if lineup else None,
        festival_id=lineup["festival_id"] if lineup else "",
        user_id=member["user_id"],
        email=user["email"],
        full_name=user["full_name"],
        status=member["status"],
    )

async def get_lineup_or_404(lineup_id: str, db):
    if not ObjectId.is_valid(lineup_id):
        raise HTTPException(400, "Format d'ID de lineup invalide")
    lineup = await db["lineups"].find_one({"_id": ObjectId(lineup_id)})
    if not lineup:
        raise HTTPException(404, "Lineup introuvable")
    return lineup

async def ensure_access(lineup, user_id: str, db):
    if lineup["owner_id"] == user_id:
        return
    member = await db["lineup_members"].find_one({
        "lineup_id": str(lineup["_id"]),
        "user_id": user_id,
        "status": LineupMemberStatus.accepted,
    })
    if not member:
        raise HTTPException(403, "Accès refusé à cette lineup")

def ensure_owner(lineup, user_id: str):
    if lineup["owner_id"] != user_id:
        raise HTTPException(403, "Seul le propriétaire de la lineup peut effectuer cette action")

@router.post("", response_model=LineupResponse, status_code=status.HTTP_201_CREATED)
async def create_lineup(data: LineupCreateRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    if not ObjectId.is_valid(data.festival_id):
        raise HTTPException(400, "Format d'ID de festival invalide")
    if not await db["festivals"].find_one({"_id": ObjectId(data.festival_id)}):
        raise HTTPException(404, "Festival introuvable")

    lineup = {
        "festival_id": data.festival_id,
        "owner_id": str(current_user["_id"]),
        "name": data.name,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db["lineups"].insert_one(lineup)
    return format_lineup({**lineup, "_id": result.inserted_id})

@router.get("/mine", response_model=List[LineupResponse])
async def list_my_lineups(db=Depends(get_db), current_user=Depends(get_current_user)):
    cursor = db["lineups"].find({"owner_id": str(current_user["_id"])})
    lineups = await cursor.to_list(length=200)
    return [format_lineup(l) for l in lineups]

@router.get("/shared", response_model=List[LineupResponse])
async def list_shared_lineups(db=Depends(get_db), current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    cursor = db["lineup_members"].find({"user_id": user_id, "status": LineupMemberStatus.accepted})
    memberships = await cursor.to_list(length=200)
    lineup_ids = [ObjectId(m["lineup_id"]) for m in memberships if ObjectId.is_valid(m["lineup_id"])]
    if not lineup_ids:
        return []
    cursor = db["lineups"].find({"_id": {"$in": lineup_ids}})
    lineups = await cursor.to_list(length=200)
    return [format_lineup(l) for l in lineups]

@router.get("/invitations", response_model=List[LineupMemberResponse])
async def list_invitations(db=Depends(get_db), current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    cursor = db["lineup_members"].find({"user_id": user_id, "status": LineupMemberStatus.pending})
    invitations = await cursor.to_list(length=200)
    result = []
    for m in invitations:
        lineup = await db["lineups"].find_one({"_id": ObjectId(m["lineup_id"])}) if ObjectId.is_valid(m["lineup_id"]) else None
        result.append(format_member(m, current_user, lineup))
    return result

@router.post("/invitations/{member_id}/accept", response_model=LineupMemberResponse)
async def accept_invitation(member_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    if not ObjectId.is_valid(member_id):
        raise HTTPException(400, "Format d'ID invalide")
    member = await db["lineup_members"].find_one({"_id": ObjectId(member_id)})
    if not member or member["user_id"] != str(current_user["_id"]):
        raise HTTPException(404, "Invitation introuvable")

    await db["lineup_members"].update_one(
        {"_id": ObjectId(member_id)}, {"$set": {"status": LineupMemberStatus.accepted}}
    )
    updated = await db["lineup_members"].find_one({"_id": ObjectId(member_id)})
    lineup = await db["lineups"].find_one({"_id": ObjectId(updated["lineup_id"])}) if ObjectId.is_valid(updated["lineup_id"]) else None
    return format_member(updated, current_user, lineup)

@router.delete("/invitations/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invitation(member_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    if not ObjectId.is_valid(member_id):
        raise HTTPException(400, "Format d'ID invalide")
    member = await db["lineup_members"].find_one({"_id": ObjectId(member_id)})
    if not member:
        raise HTTPException(404, "Invitation introuvable")

    lineup = None
    if ObjectId.is_valid(member["lineup_id"]):
        lineup = await db["lineups"].find_one({"_id": ObjectId(member["lineup_id"])})

    user_id = str(current_user["_id"])
    is_owner = lineup and lineup["owner_id"] == user_id
    is_invitee = member["user_id"] == user_id
    if not (is_owner or is_invitee):
        raise HTTPException(403, "Vous ne pouvez pas supprimer cette invitation")

    await db["lineup_members"].delete_one({"_id": ObjectId(member_id)})

@router.get("/{lineup_id}", response_model=LineupResponse)
async def get_lineup(lineup_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    # Un membre en attente peut voir la fiche de la lineup (festival concerné, nom) pour
    # décider s'il accepte l'invitation — le contenu (sets/scènes) reste lui gardé pour les membres acceptés.
    lineup = await get_lineup_or_404(lineup_id, db)
    user_id = str(current_user["_id"])
    if lineup["owner_id"] != user_id:
        member = await db["lineup_members"].find_one({"lineup_id": lineup_id, "user_id": user_id})
        if not member:
            raise HTTPException(403, "Accès refusé à cette lineup")
    return format_lineup(lineup)

@router.put("/{lineup_id}", response_model=LineupResponse)
async def update_lineup(lineup_id: str, data: LineupUpdateRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    lineup = await get_lineup_or_404(lineup_id, db)
    ensure_owner(lineup, str(current_user["_id"]))

    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
    if update_data:
        await db["lineups"].update_one({"_id": ObjectId(lineup_id)}, {"$set": update_data})

    updated = await db["lineups"].find_one({"_id": ObjectId(lineup_id)})
    return format_lineup(updated)

async def cascade_delete_lineup(lineup_id: str, db):
    await db["sets"].delete_many({"lineup_id": lineup_id})
    await db["stages"].delete_many({"lineup_id": lineup_id})
    await db["lineup_members"].delete_many({"lineup_id": lineup_id})
    await db["positions"].delete_many({"lineup_id": lineup_id})
    await db["suivis"].update_many(
        {"lineup_ids": lineup_id}, {"$pull": {"lineup_ids": lineup_id}}
    )
    await db["lineups"].delete_one({"_id": ObjectId(lineup_id)})

@router.delete("/{lineup_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lineup(lineup_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    lineup = await get_lineup_or_404(lineup_id, db)
    ensure_owner(lineup, str(current_user["_id"]))
    await cascade_delete_lineup(lineup_id, db)

@router.get("/{lineup_id}/members", response_model=List[LineupMemberResponse])
async def list_members(lineup_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    lineup = await get_lineup_or_404(lineup_id, db)
    await ensure_access(lineup, str(current_user["_id"]), db)
    cursor = db["lineup_members"].find({"lineup_id": lineup_id})
    members = await cursor.to_list(length=200)
    result = []
    for m in members:
        user = await db["users"].find_one({"_id": ObjectId(m["user_id"])})
        if user:
            result.append(format_member(m, user, lineup))
    return result

@router.post("/{lineup_id}/invite", response_model=LineupMemberResponse, status_code=status.HTTP_201_CREATED)
async def invite_member(lineup_id: str, data: LineupInviteRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    lineup = await get_lineup_or_404(lineup_id, db)
    ensure_owner(lineup, str(current_user["_id"]))

    invited_user = await db["users"].find_one({"email": data.email})
    if not invited_user:
        raise HTTPException(404, "Aucun utilisateur trouvé avec cet email")

    invited_id = str(invited_user["_id"])
    if invited_id == lineup["owner_id"]:
        raise HTTPException(400, "Vous ne pouvez pas vous inviter vous-même")

    if not await is_friend(lineup["owner_id"], invited_id, db):
        raise HTTPException(400, "Vous ne pouvez ajouter que vos amis à une lineup")

    existing = await db["lineup_members"].find_one({"lineup_id": lineup_id, "user_id": invited_id})
    if existing:
        raise HTTPException(400, "Cet utilisateur est déjà invité ou membre de la lineup")

    member = {
        "lineup_id": lineup_id,
        "user_id": invited_id,
        "status": LineupMemberStatus.pending,
        "invited_by": str(current_user["_id"]),
        "created_at": datetime.now(timezone.utc),
    }
    result = await db["lineup_members"].insert_one(member)
    return format_member({**member, "_id": result.inserted_id}, invited_user, lineup)


async def _authenticate_ws(token: str, lineup_id: str, db):
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

    if not ObjectId.is_valid(lineup_id):
        return None
    lineup = await db["lineups"].find_one({"_id": ObjectId(lineup_id)})
    if not lineup:
        return None

    if lineup["owner_id"] != user_id:
        member = await db["lineup_members"].find_one({
            "lineup_id": lineup_id, "user_id": user_id, "status": LineupMemberStatus.accepted
        })
        if not member:
            return None

    return user

@router.websocket("/{lineup_id}/ws")
async def lineup_ws(websocket: WebSocket, lineup_id: str, token: str = Query(...)):
    db = get_db()
    user = await _authenticate_ws(token, lineup_id, db)
    if not user:
        await websocket.close(code=4003)
        return

    await manager.connect(lineup_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(lineup_id, websocket)
