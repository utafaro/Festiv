from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId
from core.database import get_db
from core.security import get_current_user
from models.suivi import (
    SuiviCreateRequest,
    SuiviUpdateRequest,
    SuiviResponse,
    SuiviInviteRequest,
    SuiviMemberResponse,
    SuiviMemberStatus,
)
from typing import List

router = APIRouter(prefix="/suivis", tags=["suivis"])

def format_suivi(suivi) -> SuiviResponse:
    return SuiviResponse(
        id=str(suivi["_id"]),
        festival_id=suivi["festival_id"],
        lineup_ids=suivi["lineup_ids"],
        owner_id=suivi["owner_id"],
        name=suivi.get("name"),
        created_at=suivi["created_at"],
    )

def format_member(member, user, suivi=None) -> SuiviMemberResponse:
    return SuiviMemberResponse(
        id=str(member["_id"]),
        suivi_id=member["suivi_id"],
        suivi_name=suivi.get("name") if suivi else None,
        festival_id=suivi["festival_id"] if suivi else "",
        user_id=member["user_id"],
        email=user["email"],
        full_name=user["full_name"],
        status=member["status"],
    )

async def get_suivi_or_404(suivi_id: str, db):
    if not ObjectId.is_valid(suivi_id):
        raise HTTPException(400, "Format d'ID de suivi invalide")
    suivi = await db["suivis"].find_one({"_id": ObjectId(suivi_id)})
    if not suivi:
        raise HTTPException(404, "Suivi introuvable")
    return suivi

async def ensure_access(suivi, user_id: str, db):
    if suivi["owner_id"] == user_id:
        return
    member = await db["suivi_members"].find_one({
        "suivi_id": str(suivi["_id"]),
        "user_id": user_id,
        "status": SuiviMemberStatus.accepted,
    })
    if not member:
        raise HTTPException(403, "Accès refusé à ce suivi")

def ensure_owner(suivi, user_id: str):
    if suivi["owner_id"] != user_id:
        raise HTTPException(403, "Seul le propriétaire du suivi peut effectuer cette action")

async def ensure_lineup_access(lineup_id: str, user_id: str, db):
    if not ObjectId.is_valid(lineup_id):
        raise HTTPException(400, f"Format d'ID de lineup invalide: {lineup_id}")
    lineup = await db["lineups"].find_one({"_id": ObjectId(lineup_id)})
    if not lineup:
        raise HTTPException(404, f"Lineup introuvable: {lineup_id}")
    if lineup["owner_id"] != user_id:
        member = await db["lineup_members"].find_one({
            "lineup_id": lineup_id, "user_id": user_id, "status": "accepted"
        })
        if not member:
            raise HTTPException(403, f"Accès refusé à la lineup {lineup_id}")
    return lineup

@router.post("", response_model=SuiviResponse, status_code=status.HTTP_201_CREATED)
async def create_suivi(data: SuiviCreateRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    if not ObjectId.is_valid(data.festival_id):
        raise HTTPException(400, "Format d'ID de festival invalide")
    if not await db["festivals"].find_one({"_id": ObjectId(data.festival_id)}):
        raise HTTPException(404, "Festival introuvable")

    user_id = str(current_user["_id"])
    for lineup_id in data.lineup_ids:
        lineup = await ensure_lineup_access(lineup_id, user_id, db)
        if lineup["festival_id"] != data.festival_id:
            raise HTTPException(400, f"La lineup {lineup_id} n'appartient pas à ce festival")

    suivi = {
        "festival_id": data.festival_id,
        "lineup_ids": data.lineup_ids,
        "owner_id": user_id,
        "name": data.name,
        "created_at": datetime.utcnow(),
    }
    result = await db["suivis"].insert_one(suivi)
    return format_suivi({**suivi, "_id": result.inserted_id})

@router.get("/mine", response_model=List[SuiviResponse])
async def list_my_suivis(db=Depends(get_db), current_user=Depends(get_current_user)):
    cursor = db["suivis"].find({"owner_id": str(current_user["_id"])})
    suivis = await cursor.to_list(length=200)
    return [format_suivi(s) for s in suivis]

@router.get("/shared", response_model=List[SuiviResponse])
async def list_shared_suivis(db=Depends(get_db), current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    cursor = db["suivi_members"].find({"user_id": user_id, "status": SuiviMemberStatus.accepted})
    memberships = await cursor.to_list(length=200)
    suivi_ids = [ObjectId(m["suivi_id"]) for m in memberships if ObjectId.is_valid(m["suivi_id"])]
    if not suivi_ids:
        return []
    cursor = db["suivis"].find({"_id": {"$in": suivi_ids}})
    suivis = await cursor.to_list(length=200)
    return [format_suivi(s) for s in suivis]

@router.get("/invitations", response_model=List[SuiviMemberResponse])
async def list_invitations(db=Depends(get_db), current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    cursor = db["suivi_members"].find({"user_id": user_id, "status": SuiviMemberStatus.pending})
    invitations = await cursor.to_list(length=200)
    result = []
    for m in invitations:
        suivi = await db["suivis"].find_one({"_id": ObjectId(m["suivi_id"])}) if ObjectId.is_valid(m["suivi_id"]) else None
        result.append(format_member(m, current_user, suivi))
    return result

@router.post("/invitations/{member_id}/accept", response_model=SuiviMemberResponse)
async def accept_invitation(member_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    if not ObjectId.is_valid(member_id):
        raise HTTPException(400, "Format d'ID invalide")
    member = await db["suivi_members"].find_one({"_id": ObjectId(member_id)})
    if not member or member["user_id"] != str(current_user["_id"]):
        raise HTTPException(404, "Invitation introuvable")

    await db["suivi_members"].update_one(
        {"_id": ObjectId(member_id)}, {"$set": {"status": SuiviMemberStatus.accepted}}
    )
    updated = await db["suivi_members"].find_one({"_id": ObjectId(member_id)})
    suivi = await db["suivis"].find_one({"_id": ObjectId(updated["suivi_id"])}) if ObjectId.is_valid(updated["suivi_id"]) else None
    return format_member(updated, current_user, suivi)

@router.delete("/invitations/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invitation(member_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    if not ObjectId.is_valid(member_id):
        raise HTTPException(400, "Format d'ID invalide")
    member = await db["suivi_members"].find_one({"_id": ObjectId(member_id)})
    if not member:
        raise HTTPException(404, "Invitation introuvable")

    suivi = None
    if ObjectId.is_valid(member["suivi_id"]):
        suivi = await db["suivis"].find_one({"_id": ObjectId(member["suivi_id"])})

    user_id = str(current_user["_id"])
    is_owner = suivi and suivi["owner_id"] == user_id
    is_invitee = member["user_id"] == user_id
    if not (is_owner or is_invitee):
        raise HTTPException(403, "Vous ne pouvez pas supprimer cette invitation")

    await db["suivi_members"].delete_one({"_id": ObjectId(member_id)})

@router.get("/{suivi_id}", response_model=SuiviResponse)
async def get_suivi(suivi_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    suivi = await get_suivi_or_404(suivi_id, db)
    user_id = str(current_user["_id"])
    if suivi["owner_id"] != user_id:
        member = await db["suivi_members"].find_one({"suivi_id": suivi_id, "user_id": user_id})
        if not member:
            raise HTTPException(403, "Accès refusé à ce suivi")
    return format_suivi(suivi)

@router.put("/{suivi_id}", response_model=SuiviResponse)
async def update_suivi(suivi_id: str, data: SuiviUpdateRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    suivi = await get_suivi_or_404(suivi_id, db)
    ensure_owner(suivi, str(current_user["_id"]))

    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
    if "lineup_ids" in update_data:
        if not update_data["lineup_ids"]:
            raise HTTPException(400, "Le suivi doit contenir au moins une lineup")
        user_id = str(current_user["_id"])
        for lineup_id in update_data["lineup_ids"]:
            lineup = await ensure_lineup_access(lineup_id, user_id, db)
            if lineup["festival_id"] != suivi["festival_id"]:
                raise HTTPException(400, f"La lineup {lineup_id} n'appartient pas à ce festival")

    if update_data:
        await db["suivis"].update_one({"_id": ObjectId(suivi_id)}, {"$set": update_data})

    updated = await db["suivis"].find_one({"_id": ObjectId(suivi_id)})
    return format_suivi(updated)

@router.delete("/{suivi_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_suivi(suivi_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    suivi = await get_suivi_or_404(suivi_id, db)
    ensure_owner(suivi, str(current_user["_id"]))

    await db["suivi_members"].delete_many({"suivi_id": suivi_id})
    await db["custom_spots"].delete_many({"suivi_id": suivi_id})
    await db["positions"].delete_many({"suivi_id": suivi_id})
    await db["suivis"].delete_one({"_id": ObjectId(suivi_id)})

@router.get("/{suivi_id}/members", response_model=List[SuiviMemberResponse])
async def list_members(suivi_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    suivi = await get_suivi_or_404(suivi_id, db)
    await ensure_access(suivi, str(current_user["_id"]), db)
    cursor = db["suivi_members"].find({"suivi_id": suivi_id})
    members = await cursor.to_list(length=200)
    result = []
    for m in members:
        user = await db["users"].find_one({"_id": ObjectId(m["user_id"])})
        if user:
            result.append(format_member(m, user, suivi))
    return result

@router.post("/{suivi_id}/invite", response_model=SuiviMemberResponse, status_code=status.HTTP_201_CREATED)
async def invite_member(suivi_id: str, data: SuiviInviteRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    suivi = await get_suivi_or_404(suivi_id, db)
    ensure_owner(suivi, str(current_user["_id"]))

    invited_user = await db["users"].find_one({"email": data.email})
    if not invited_user:
        raise HTTPException(404, "Aucun utilisateur trouvé avec cet email")

    invited_id = str(invited_user["_id"])
    if invited_id == suivi["owner_id"]:
        raise HTTPException(400, "Vous ne pouvez pas vous inviter vous-même")

    existing = await db["suivi_members"].find_one({"suivi_id": suivi_id, "user_id": invited_id})
    if existing:
        raise HTTPException(400, "Cet utilisateur est déjà invité ou membre du suivi")

    member = {
        "suivi_id": suivi_id,
        "user_id": invited_id,
        "status": SuiviMemberStatus.pending,
        "invited_by": str(current_user["_id"]),
        "created_at": datetime.utcnow(),
    }
    result = await db["suivi_members"].insert_one(member)
    return format_member({**member, "_id": result.inserted_id}, invited_user, suivi)
