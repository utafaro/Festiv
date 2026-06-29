from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import connect_db, close_db
from routes.auth import router as auth_router
from routes.oauth import router as oauth_router
from routes.password import router as password_router
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
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY
)


app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(password_router)

@app.get("/")
async def root():
    return {"status": "ok", "docs": "/docs"}