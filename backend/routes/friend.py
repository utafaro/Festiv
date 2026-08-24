from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timezone
from bson import ObjectId
from core.database import get_db
from core.security import get_current_user
from models.friend import FriendRequest, FriendResponse, FriendStatus
from typing import List

router = APIRouter(prefix="/friends", tags=["friends"])

def format_friend(doc, other_user, direction) -> FriendResponse:
    return FriendResponse(
        id=str(doc["_id"]),
        user_id=str(other_user["_id"]),
        email=other_user["email"],
        full_name=other_user["full_name"],
        avatar=other_user.get("avatar"),
        status=doc["status"],
        direction=direction,
        created_at=doc["created_at"],
    )

async def get_friendship_or_404(friend_id: str, db):
    if not ObjectId.is_valid(friend_id):
        raise HTTPException(400, "Format d'ID invalide")
    doc = await db["friends"].find_one({"_id": ObjectId(friend_id)})
    if not doc:
        raise HTTPException(404, "Relation introuvable")
    return doc

def ensure_party(doc, user_id: str):
    if doc["requester_id"] != user_id and doc["addressee_id"] != user_id:
        raise HTTPException(403, "Vous ne faites pas partie de cette relation")

async def get_friend_ids(user_id: str, db) -> List[str]:
    cursor = db["friends"].find({
        "status": FriendStatus.accepted,
        "$or": [{"requester_id": user_id}, {"addressee_id": user_id}],
    })
    docs = await cursor.to_list(length=1000)
    return [d["addressee_id"] if d["requester_id"] == user_id else d["requester_id"] for d in docs]

async def is_friend(user_a: str, user_b: str, db) -> bool:
    doc = await db["friends"].find_one({
        "status": FriendStatus.accepted,
        "$or": [
            {"requester_id": user_a, "addressee_id": user_b},
            {"requester_id": user_b, "addressee_id": user_a},
        ],
    })
    return doc is not None

async def cascade_delete_friend_memberships(user_a: str, user_b: str, db):
    # Un membre non-ami devient invalide : on retire les invitations/adhésions
    # croisées aux lineups et suivis possédés par l'un ou l'autre.
    a_lineup_ids = [str(l["_id"]) async for l in db["lineups"].find({"owner_id": user_a}, {"_id": 1})]
    b_lineup_ids = [str(l["_id"]) async for l in db["lineups"].find({"owner_id": user_b}, {"_id": 1})]
    await db["lineup_members"].delete_many({"lineup_id": {"$in": a_lineup_ids}, "user_id": user_b})
    await db["lineup_members"].delete_many({"lineup_id": {"$in": b_lineup_ids}, "user_id": user_a})

    a_suivi_ids = [str(s["_id"]) async for s in db["suivis"].find({"owner_id": user_a}, {"_id": 1})]
    b_suivi_ids = [str(s["_id"]) async for s in db["suivis"].find({"owner_id": user_b}, {"_id": 1})]
    await db["suivi_members"].delete_many({"suivi_id": {"$in": a_suivi_ids}, "user_id": user_b})
    await db["suivi_members"].delete_many({"suivi_id": {"$in": b_suivi_ids}, "user_id": user_a})

@router.post("", response_model=FriendResponse, status_code=status.HTTP_201_CREATED)
async def add_friend(data: FriendRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    target = await db["users"].find_one({"email": data.email})
    if not target:
        raise HTTPException(404, "Aucun utilisateur trouvé avec cet email")

    target_id = str(target["_id"])
    if target_id == user_id:
        raise HTTPException(400, "Vous ne pouvez pas vous ajouter vous-même")

    existing = await db["friends"].find_one({
        "$or": [
            {"requester_id": user_id, "addressee_id": target_id},
            {"requester_id": target_id, "addressee_id": user_id},
        ],
    })
    if existing:
        raise HTTPException(400, "Une relation existe déjà avec cet utilisateur")

    doc = {
        "requester_id": user_id,
        "addressee_id": target_id,
        "status": FriendStatus.pending,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db["friends"].insert_one(doc)
    return format_friend({**doc, "_id": result.inserted_id}, target, "sent")

@router.get("/mine", response_model=List[FriendResponse])
async def list_friends(db=Depends(get_db), current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    cursor = db["friends"].find({
        "status": FriendStatus.accepted,
        "$or": [{"requester_id": user_id}, {"addressee_id": user_id}],
    })
    docs = await cursor.to_list(length=500)
    result = []
    for d in docs:
        other_id = d["addressee_id"] if d["requester_id"] == user_id else d["requester_id"]
        other = await db["users"].find_one({"_id": ObjectId(other_id)}) if ObjectId.is_valid(other_id) else None
        if other:
            direction = "sent" if d["requester_id"] == user_id else "received"
            result.append(format_friend(d, other, direction))
    return result

@router.get("/invitations", response_model=List[FriendResponse])
async def list_invitations(db=Depends(get_db), current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    cursor = db["friends"].find({"addressee_id": user_id, "status": FriendStatus.pending})
    docs = await cursor.to_list(length=200)
    result = []
    for d in docs:
        other = await db["users"].find_one({"_id": ObjectId(d["requester_id"])}) if ObjectId.is_valid(d["requester_id"]) else None
        if other:
            result.append(format_friend(d, other, "received"))
    return result

@router.post("/{friend_id}/accept", response_model=FriendResponse)
async def accept_friend(friend_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    doc = await get_friendship_or_404(friend_id, db)
    user_id = str(current_user["_id"])
    if doc["addressee_id"] != user_id:
        raise HTTPException(403, "Seul le destinataire peut accepter cette demande")
    if doc["status"] != FriendStatus.pending:
        raise HTTPException(400, "Cette demande n'est plus en attente")

    await db["friends"].update_one({"_id": ObjectId(friend_id)}, {"$set": {"status": FriendStatus.accepted}})
    updated = await db["friends"].find_one({"_id": ObjectId(friend_id)})
    other = await db["users"].find_one({"_id": ObjectId(updated["requester_id"])})
    return format_friend(updated, other, "received")

@router.delete("/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_friend(friend_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    doc = await get_friendship_or_404(friend_id, db)
    user_id = str(current_user["_id"])
    ensure_party(doc, user_id)
    other_id = doc["addressee_id"] if doc["requester_id"] == user_id else doc["requester_id"]
    was_accepted = doc["status"] == FriendStatus.accepted

    await db["friends"].delete_one({"_id": ObjectId(friend_id)})

    if was_accepted:
        await cascade_delete_friend_memberships(user_id, other_id, db)
