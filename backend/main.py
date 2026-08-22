from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import connect_db, close_db
from routes.auth import router as auth_router
from routes.oauth import router as oauth_router
from routes.password import router as password_router
from routes.festival import router as festival_router
from routes.artist import router as artist_router
from routes.lineup import router as lineup_router
from routes.stage import router as stage_router
from routes.sets import router as sets_router
from routes.suivi import router as suivi_router
from routes.tracking import router as tracking_router
from routes.friend import router as friend_router
from starlette.middleware.sessions import SessionMiddleware
from core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(
    title="Mon API",
    description="FastAPI + MongoDB Atlas + Auth complète",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", settings.FRONTEND_URL],
    # Autorise aussi l'accès depuis une IP du réseau local (ex: `vite --host` + test sur mobile),
    # où l'origine envoyée par le navigateur n'est plus "localhost" mais l'IP LAN de la machine de dev.
    allow_origin_regex=r"http://(127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):5173",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY
)


app.include_router(auth_router)
app.include_router(festival_router)
app.include_router(oauth_router)
app.include_router(password_router)
app.include_router(artist_router)
app.include_router(lineup_router)
app.include_router(stage_router)
app.include_router(sets_router)
app.include_router(suivi_router)
app.include_router(tracking_router)
app.include_router(friend_router)


from fastapi.staticfiles import StaticFiles
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return {"status": "ok", "docs": "/docs"}