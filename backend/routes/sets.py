from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId
from core.database import get_db
from core.security import get_current_user
from models.festival import SetCreateRequest, SetResponse, ArtistResponse
from routes.artists import format_artist
from typing import List

router = APIRouter(prefix="/sets", tags=["sets"])

async def format_set(set_doc, db) -> SetResponse:
    # On récupère tous les artistes associés à ce set
    artist_ids = [ObjectId(aid) for aid in set_doc.get("artist_ids", []) if ObjectId.is_valid(aid)]
    cursor = db["artists"].find({"_id": {"$in": artist_ids}})
    artists_raw = await cursor.to_list(length=len(artist_ids))
    artists_formatted = [format_artist(a) for a in artists_raw]

    return SetResponse(
        id=str(set_doc["_id"]),
        name=set_doc.get("name"),
        artists=artists_formatted,
        start_time=set_doc["start_time"],
        end_time=set_doc["end_time"],
        date=set_doc["date"]
    )

@router.post("", response_model=SetResponse, status_code=status.HTTP_201_CREATED)
async def create_set(data: SetCreateRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    # Validation que les ID des artistes passés existent et sont valides
    for aid in data.artist_ids:
        if not ObjectId.is_valid(aid) or not await db["artists"].find_one({"_id": ObjectId(aid)}):
            raise HTTPException(400, f"L'artiste avec l'ID {aid} n'existe pas ou est invalide")

    new_set = {
        "name": data.name,
        "artist_ids": data.artist_ids,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "date": data.date,
        "created_at": datetime.utcnow()
    }
    result = await db["sets"].insert_one(new_set)
    return await format_set({**new_set, "_id": result.inserted_id}, db)

@router.get("/{set_id}", response_model=SetResponse)
async def get_set(set_id: str, db=Depends(get_db)):
    if not ObjectId.is_valid(set_id):
        raise HTTPException(400, "Format d'ID invalide")
        
    set_doc = await db["sets"].find_one({"_id": ObjectId(set_id)})
    if not set_doc:
        raise HTTPException(404, "Set introuvable")
    return await format_set(set_doc, db)