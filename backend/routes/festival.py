from fastapi import APIRouter, HTTPException, Depends, status, Form, UploadFile, File
from datetime import datetime
from bson import ObjectId
from core.database import get_db
from core.security import get_current_user
from models.festival import FestivalCreateRequest, FestivalResponse
from typing import List
import os
import shutil
from pydantic import ValidationError

router = APIRouter(prefix="/festivals", tags=["festivals"])

async def format_festival(festival_doc, db) -> FestivalResponse:

    return FestivalResponse(
        id=str(festival_doc["_id"]),
        name=festival_doc["name"],
        location=festival_doc["location"],
        genres=festival_doc.get("genres", []),
        tags=festival_doc.get("tags", []),
        start_date=festival_doc["start_date"],
        end_date=festival_doc["end_date"],
        main_page_url=festival_doc.get("main_page_url"),
        ticket_office_url=festival_doc.get("ticket_office_url"),
        akkros_url=festival_doc.get("akkros_url"),
        merch_url=festival_doc.get("merch_url"),
        cover_image_url=festival_doc.get("cover_image_url")
    )

UPLOAD_DIR = "static/uploads/festivals"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", response_model=FestivalResponse, status_code=status.HTTP_201_CREATED)
async def create_festival(festival_data: str = Form(...), file: UploadFile = File(None), db=Depends(get_db), current_user=Depends(get_current_user)):

    try:
        data = FestivalCreateRequest.model_validate_json(festival_data)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors())
    
    cover_image_url = str(data.cover_image_url) if data.cover_image_url else None

    if file:
        # Générer un nom unique pour éviter les collisions (ex: timestamp + nom_origine)
        filename = f"{int(datetime.utcnow().timestamp())}_{file.filename.replace(' ', '_')}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Sauvegarde physique du fichier
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            # L'URL finale qui sera accessible publiquement
            cover_image_url = f"/static/uploads/festivals/{filename}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erreur lors de la sauvegarde de l'image: {str(e)}")
        finally:
            await file.close()

    # Conversion des URLs optionnelles Pydantic en str pour le stockage propre en DB
    festival = {
        "name": data.name,
        "location": data.location,
        "genres": data.genres,
        "tags": data.tags,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "main_page_url": str(data.main_page_url) if data.main_page_url else None,
        "ticket_office_url": str(data.ticket_office_url) if data.ticket_office_url else None,
        "akkros_url": str(data.akkros_url) if data.akkros_url else None,
        "merch_url": str(data.merch_url) if data.merch_url else None,
        "cover_image_url": cover_image_url,
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