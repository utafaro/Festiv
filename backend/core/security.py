from datetime import datetime, timedelta
import hashlib
import bcrypt
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings
from .database import get_db


bearer_scheme = HTTPBearer()


def _hash_pre_bcrypt(password: str) -> bytes:
    """
    Méthode la plus courante : On transforme le mot de passe en une clé unique 
    de taille fixe (SHA-256) pour que bcrypt ne dépasse jamais les 72 octets.
    """
    # 1. On encode le texte en octets
    password_bytes = password.encode('utf-8')
    # 2. On génère le sha256 (toujours 64 caractères)
    sha256_hex = hashlib.sha256(password_bytes).hexdigest()
    # 3. On retourne les octets prêts pour bcrypt
    return sha256_hex.encode('utf-8')


def hash_password(password: str) -> str:
    """
    Génère un sel et hache le mot de passe de manière sécurisée.
    """
    # Pré-hachage pour la sécurité de taille
    prepared_password = _hash_pre_bcrypt(password)
    
    # Génération du sel unique (standard de bcrypt)
    salt = bcrypt.gensalt()
    
    # Hachage
    hashed_bytes = bcrypt.hashpw(prepared_password, salt)
    
    # On transforme en chaîne de caractères (string) pour stocker en Base de Données
    return hashed_bytes.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compare le mot de passe texte avec le hash de la base de données.
    """
    try:
        prepared_password = _hash_pre_bcrypt(plain_password)
        hashed_bytes = hashed_password.encode('utf-8')
        
        # La fonction native de bcrypt fait la comparaison de manière sécurisée
        return bcrypt.checkpw(prepared_password, hashed_bytes)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(user_id: str, remember_me: bool = False):
    days = settings.REFRESH_TOKEN_EXPIRE_DAYS * (30 if remember_me else 1)
    expire = datetime.utcnow() + timedelta(days=days)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "refresh"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY,
                            algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            raise credentials_exception
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Vérifie que le token n'est pas blacklisté
    db = get_db()
    blacklisted = await db["token_blacklist"].find_one({"token": credentials.credentials})
    if blacklisted:
        raise HTTPException(status_code=401, detail="Token révoqué")

    db = get_db()
    from bson import ObjectId
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise credentials_exception
    return user