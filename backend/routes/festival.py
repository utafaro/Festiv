from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId
from core.database import get_db
from core.security import get_current_user
from models.festival import FestivalCreateRequest, FestivalResponse
from routes.sets import format_set
from typing import List

router = APIRouter(prefix="/festivals", tags=["festivals"])

async def format_festival(festival_doc, db) -> FestivalResponse:
    # On récupère et formate tous les sets associés à ce festival
    set_ids = [ObjectId(sid) for sid in festival_doc.get("set_ids", []) if ObjectId.is_valid(sid)]
    cursor = db["sets"].find({"_id": {"$in": set_ids}})
    sets_raw = await cursor.to_list(length=100)
    
    sets_formatted = []
    for s in sets_raw:
        sets_formatted.append(await format_set(s, db))

    return FestivalResponse(
        id=str(festival_doc["_id"]),
        name=festival_doc["name"],
        location=festival_doc["location"],
        genres=festival_doc.get("genres", []),
        tags=festival_doc.get("tags", []),
        start_date=festival_doc["start_date"],
        end_date=festival_doc["end_date"],
        sets=sets_formatted,
        main_page_url=festival_doc.get("main_page_url"),
        ticket_office_url=festival_doc.get("ticket_office_url"),
        akkros_url=festival_doc.get("akkros_url"),
        merch_url=festival_doc.get("merch_url"),
        cover_image_url=festival_doc.get("cover_image_url")
    )

@router.post("", response_model=FestivalResponse, status_code=status.HTTP_201_CREATED)
async def create_festival(data: FestivalCreateRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    # Conversion des URLs optionnelles Pydantic en str pour le stockage propre en DB
    festival = {
        "name": data.name,
        "location": data.location,
        "genres": data.genres,
        "tags": data.tags,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "set_ids": data.set_ids,
        "main_page_url": str(data.main_page_url) if data.main_page_url else None,
        "ticket_office_url": str(data.ticket_office_url) if data.ticket_office_url else None,
        "akkros_url": str(data.akkros_url) if data.akkros_url else None,
        "merch_url": str(data.merch_url) if data.merch_url else None,
        "cover_image_url": str(data.cover_image_url) if data.cover_image_url else None,
        "created_at": datetime.utcnow()
    }
    
    result = await db["festivals"].insert_one(festival)
    return await format_festival({**festival, "_id": result.inserted_id}, db)

@router.get("", response_model=List[FestivalResponse])
async def list_festivals(db=Depends(get_db)):
    cursor = db["festivals"].find()
    festivals = await cursor.to_list(length=50)
    
    # Résolution asynchrone itérative pour chaque festival
    return [await format_festival(f, db) for f in festivals]

@router.get("/{festival_id}", response_model=FestivalResponse)
async def get_festival(festival_id: str, db=Depends(get_db)):
    if not ObjectId.is_valid(festival_id):
        raise HTTPException(400, "Format d'ID de festival invalide")
        
    festival_doc = await db["festivals"].find_one({"_id": ObjectId(festival_id)})
    if not festival_doc:
        raise HTTPException(404, "Festival introuvable")
        
    return await format_festival(festival_doc, db)