from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timezone
from bson import ObjectId
from core.database import get_db
from core.security import get_current_user
from models.festival import StageCreateRequest, StageResponse
from routes.lineup import get_lineup_or_404, ensure_access
from typing import List

router = APIRouter(prefix="/lineups/{lineup_id}/stages", tags=["stages"])

def format_stage(stage) -> StageResponse:
    return StageResponse(
        id=str(stage["_id"]),
        lineup_id=stage["lineup_id"],
        name=stage["name"],
    )

@router.post("", response_model=StageResponse, status_code=status.HTTP_201_CREATED)
async def create_stage(lineup_id: str, data: StageCreateRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    lineup = await get_lineup_or_404(lineup_id, db)
    await ensure_access(lineup, str(current_user["_id"]), db)

    # Une scène est réutilisable : si son nom existe déjà pour cette lineup, on la renvoie telle quelle.
    existing = await db["stages"].find_one({"lineup_id": lineup_id, "name": data.name})
    if existing:
        return format_stage(existing)

    stage = {
        "lineup_id": lineup_id,
        "name": data.name,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db["stages"].insert_one(stage)
    return format_stage({**stage, "_id": result.inserted_id})

@router.get("", response_model=List[StageResponse])
async def list_stages(lineup_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    lineup = await get_lineup_or_404(lineup_id, db)
    await ensure_access(lineup, str(current_user["_id"]), db)
    cursor = db["stages"].find({"lineup_id": lineup_id}).sort("name", 1)
    stages = await cursor.to_list(length=200)
    return [format_stage(s) for s in stages]
