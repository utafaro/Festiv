from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from core.config import settings
from core.database import get_db
from core.security import create_access_token, create_refresh_token
from datetime import datetime
import httpx

router = APIRouter(prefix="/auth", tags=["oauth"])

config = Config(environ={
    "GOOGLE_CLIENT_ID": settings.GOOGLE_CLIENT_ID,
    "GOOGLE_CLIENT_SECRET": settings.GOOGLE_CLIENT_SECRET,
})
oauth = OAuth(config)
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# ─── GOOGLE ─────────────────────────────────────
@router.get("/google")
async def google_login(request: Request):
    redirect_uri = settings.FRONTEND_URL.replace("5173", "8000") + "/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo")
    db = get_db()
    return await _upsert_oauth_user(db, user_info["email"],
        user_info.get("name", ""), "google",
        user_info["sub"], user_info.get("picture"))

# ─── GITHUB ─────────────────────────────────────
@router.get("/github")
async def github_login():
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&scope=user:email"
    )
    return RedirectResponse(url)

@router.get("/github/callback")
async def github_callback(code: str):
    async with httpx.AsyncClient() as client:
        # Échange code → access_token
        r = await client.post(
            "https://github.com/login/oauth/access_token",
            data={"client_id": settings.GITHUB_CLIENT_ID,
                  "client_secret": settings.GITHUB_CLIENT_SECRET,
                  "code": code},
            headers={"Accept": "application/json"}
        )
        gh_token = r.json()["access_token"]

        # Récupère profil
        headers = {"Authorization": f"token {gh_token}"}
        user_r = await client.get("https://api.github.com/user", headers=headers)
        emails_r = await client.get("https://api.github.com/user/emails", headers=headers)
        user_info = user_r.json()
        emails = emails_r.json()
        primary_email = next((e["email"] for e in emails if e["primary"]), None)

    db = get_db()
    return await _upsert_oauth_user(db, primary_email,
        user_info.get("name", user_info["login"]), "github",
        str(user_info["id"]), user_info.get("avatar_url"))

# ─── HELPER COMMUN ───────────────────────────────
async def _upsert_oauth_user(db, email, full_name, provider, provider_id, avatar):
    user = await db["users"].find_one({"email": email})
    if not user:
        doc = {"email": email, "full_name": full_name, "provider": provider,
               "provider_id": provider_id, "avatar": avatar,
               "is_active": True, "created_at": datetime.utcnow()}
        result = await db["users"].insert_one(doc)
        user = {**doc, "_id": result.inserted_id}

    user_id = str(user["_id"])
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token(user_id)

    # Redirige le frontend avec les tokens dans l'URL
    redirect = (f"{settings.FRONTEND_URL}/auth/callback"
                f"?access_token={access_token}"
                f"&refresh_token={refresh_token}")
    return RedirectResponse(redirect)