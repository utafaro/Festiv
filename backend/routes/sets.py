from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId
from core.database import get_db
from core.security import get_current_user
from models.festival import SetCreateRequest, SetUpdateRequest, SetResponse
from routes.artist import format_artist
from routes.stage import format_stage
from routes.lineup import get_lineup_or_404, ensure_access, ensure_owner
from typing import List

router = APIRouter(prefix="/lineups/{lineup_id}/sets", tags=["sets"])

async def format_set(set_doc, db) -> SetResponse:
    # On récupère tous les artistes associés à ce set
    artist_ids = [ObjectId(aid) for aid in set_doc.get("artist_ids", []) if ObjectId.is_valid(aid)]
    artists_raw = []
    if artist_ids:
        cursor = db["artists"].find({"_id": {"$in": artist_ids}})
        artists_raw = await cursor.to_list(length=len(artist_ids))
    artists_formatted = [format_artist(a) for a in artists_raw]

    stage_doc = None
    if set_doc.get("stage_id"):
        stage_doc = await db["stages"].find_one({"_id": ObjectId(set_doc["stage_id"])})

    return SetResponse(
        id=str(set_doc["_id"]),
        lineup_id=set_doc["lineup_id"],
        name=set_doc.get("name"),
        artists=artists_formatted,
        stage=format_stage(stage_doc) if stage_doc else None,
        start_time=set_doc.get("start_time"),
        end_time=set_doc.get("end_time"),
        date=set_doc.get("date")
    )

async def validate_stage(lineup_id: str, stage_id: str, db):
    if not ObjectId.is_valid(stage_id):
        raise HTTPException(400, "Format d'ID de scène invalide")
    stage = await db["stages"].find_one({"_id": ObjectId(stage_id), "lineup_id": lineup_id})
    if not stage:
        raise HTTPException(400, "Scène introuvable pour cette lineup")

async def validate_artists(artist_ids: List[str], db):
    for aid in artist_ids:
        if not ObjectId.is_valid(aid) or not await db["artists"].find_one({"_id": ObjectId(aid)}):
            raise HTTPException(400, f"L'artiste avec l'ID {aid} n'existe pas ou est invalide")

@router.post("", response_model=SetResponse, status_code=status.HTTP_201_CREATED)
async def create_set(lineup_id: str, data: SetCreateRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    lineup = await get_lineup_or_404(lineup_id, db)
    ensure_owner(lineup, str(current_user["_id"]))
    if data.stage_id:
        await validate_stage(lineup_id, data.stage_id, db)
    await validate_artists(data.artist_ids, db)

    new_set = {
        "lineup_id": lineup_id,
        "name": data.name,
        "artist_ids": data.artist_ids,
        "stage_id": data.stage_id,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "date": data.date,
        "created_at": datetime.utcnow()
    }
    result = await db["sets"].insert_one(new_set)
    return await format_set({**new_set, "_id": result.inserted_id}, db)

@router.get("", response_model=List[SetResponse])
async def list_sets(lineup_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    lineup = await get_lineup_or_404(lineup_id, db)
    await ensure_access(lineup, str(current_user["_id"]), db)
    cursor = db["sets"].find({"lineup_id": lineup_id}).sort([("date", 1), ("start_time", 1)])
    sets = await cursor.to_list(length=500)
    return [await format_set(s, db) for s in sets]

@router.put("/{set_id}", response_model=SetResponse)
async def update_set(lineup_id: str, set_id: str, data: SetUpdateRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    lineup = await get_lineup_or_404(lineup_id, db)
    ensure_owner(lineup, str(current_user["_id"]))
    if not ObjectId.is_valid(set_id):
        raise HTTPException(400, "Format d'ID invalide")
    existing = await db["sets"].find_one({"_id": ObjectId(set_id), "lineup_id": lineup_id})
    if not existing:
        raise HTTPException(404, "Set introuvable")

    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
    if update_data.get("stage_id"):
        await validate_stage(lineup_id, update_data["stage_id"], db)
    if "artist_ids" in update_data:
        await validate_artists(update_data["artist_ids"], db)

    if update_data:
        await db["sets"].update_one({"_id": ObjectId(set_id)}, {"$set": update_data})

    updated = await db["sets"].find_one({"_id": ObjectId(set_id)})
    return await format_set(updated, db)

@router.delete("/{set_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_set(lineup_id: str, set_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    lineup = await get_lineup_or_404(lineup_id, db)
    ensure_owner(lineup, str(current_user["_id"]))
    if not ObjectId.is_valid(set_id):
        raise HTTPException(400, "Format d'ID invalide")
    result = await db["sets"].delete_one({"_id": ObjectId(set_id), "lineup_id": lineup_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Set introuvable")
