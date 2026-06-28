from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId
from core.database import get_db
from core.security import (hash_password, verify_password,
    create_access_token, create_refresh_token, get_current_user)
from models.user import SignUpRequest, SignInRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

def format_user(user) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user["full_name"],
        avatar=user.get("avatar"),
        provider=user.get("provider", "local")
    )

@router.post("/signup", response_model=TokenResponse)
async def signup(data: SignUpRequest, db=Depends(get_db)):
    if await db["users"].find_one({"email": data.email}):
        raise HTTPException(400, "Email déjà utilisé")

    user = {
        "email": data.email,
        "full_name": data.full_name,
        "hashed_password": hash_password(data.password),
        "provider": "local",
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    result = await db["users"].insert_one(user)
    user_id = str(result.inserted_id)

    access_token = create_access_token({"sub": user_id})
    return TokenResponse(
        access_token=access_token,
        user=format_user({**user, "_id": result.inserted_id})
    )

@router.post("/signin", response_model=TokenResponse)
async def signin(data: SignInRequest, db=Depends(get_db)):
    user = await db["users"].find_one({"email": data.email})
    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(401, "Email ou mot de passe incorrect")

    user_id = str(user["_id"])
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token(user_id, remember_me=data.remember_me)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=format_user(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return format_user(current_user)

@router.post("/refresh")
async def refresh_token(token: str, db=Depends(get_db)):
    from jose import jwt, JWTError
    from core.config import settings
    try:
        payload = jwt.decode(token, settings.SECRET_KEY,
                            algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Token invalide")
        user_id = payload.get("sub")
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(401, "Utilisateur introuvable")
        new_access = create_access_token({"sub": user_id})
        return {"access_token": new_access, "token_type": "bearer"}
    except JWTError:
        raise HTTPException(401, "Token expiré ou invalide")