from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId
from core.database import get_db
from core.security import get_current_user
from models.festival import ArtistCreateRequest, ArtistResponse
from typing import List

router = APIRouter(prefix="/artists", tags=["artists"])

def format_artist(artist) -> ArtistResponse:
    return ArtistResponse(
        id=str(artist["_id"]),
        name=artist["name"],
        nationality=artist.get("nationality"),
        genres=artist.get("genres", [])
    )

@router.post("", response_model=ArtistResponse, status_code=status.HTTP_201_CREATED)
async def create_artist(data: ArtistCreateRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    # Vérification si l'artiste existe déjà
    if await db["artists"].find_one({"name": data.name}):
        raise HTTPException(400, "Cet artiste existe déjà")

    artist = {
        "name": data.name,
        "nationality": data.nationality,
        "genres": data.genres,
        "created_at": datetime.utcnow()
    }
    result = await db["artists"].insert_one(artist)
    return format_artist({**artist, "_id": result.inserted_id})

@router.get("", response_model=List[ArtistResponse])
async def list_artists(db=Depends(get_db)):
    cursor = db["artists"].find()
    artists = await cursor.to_list(length=100)
    return [format_artist(artist) for artist in artists]

@router.get("/{artist_id}", response_model=ArtistResponse)
async def get_artist(artist_id: str, db=Depends(get_db)):
    if not ObjectId.is_valid(artist_id):
        raise HTTPException(400, "Format d'ID invalide")
        
    artist = await db["artists"].find_one({"_id": ObjectId(artist_id)})
    if not artist:
        raise HTTPException(404, "Artiste introuvable")
    return format_artist(artist)