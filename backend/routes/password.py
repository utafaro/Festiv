from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from core.database import get_db
from core.security import hash_password
import uuid, smtplib
from email.mime.text import MIMEText
from core.config import settings

router = APIRouter(prefix="/auth", tags=["password"])

class ForgotRequest(BaseModel):
    email: EmailStr

class ResetRequest(BaseModel):
    token: str
    new_password: str

def send_reset_email(to: str, reset_url: str):
    msg = MIMEText(
        f"Clique sur ce lien pour réinitialiser ton mot de passe :\n\n{reset_url}\n\n"
        f"Ce lien expire dans 1 heure.",
        "plain", "utf-8"
    )
    msg["Subject"] = "Réinitialisation de ton mot de passe"
    msg["From"] = settings.SMTP_USER
    msg["To"] = to
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as s:
        s.starttls()
        s.login(settings.SMTP_USER, settings.SMTP_PASS)
        s.send_message(msg)

@router.post("/forgot-password")
async def forgot_password(data: ForgotRequest, db=Depends(get_db)):
    user = await db["users"].find_one({"email": data.email})
    # Toujours répondre 200 (ne pas révéler si l'email existe)
    if not user:
        return {"message": "Si cet email existe, un lien a été envoyé."}

    token = str(uuid.uuid4())
    expiry = datetime.utcnow() + timedelta(hours=1)

    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"reset_token": token, "reset_token_exp": expiry}}
    )

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    send_reset_email(data.email, reset_url)
    return {"message": "Si cet email existe, un lien a été envoyé."}

@router.post("/reset-password")
async def reset_password(data: ResetRequest, db=Depends(get_db)):
    user = await db["users"].find_one({"reset_token": data.token})
    if not user:
        raise HTTPException(400, "Token invalide")

    if user.get("reset_token_exp") < datetime.utcnow():
        raise HTTPException(400, "Token expiré. Refais une demande.")

    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {
            "hashed_password": hash_password(data.new_password),
            "reset_token": None,
            "reset_token_exp": None
        }}
    )
    return {"message": "Mot de passe mis à jour avec succès."}