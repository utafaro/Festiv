from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class AuthProvider(str, Enum):
    local = "local"
    google = "google"
    github = "github"

# Schéma en base MongoDB
class UserInDB(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    full_name: str
    hashed_password: Optional[str] = None
    provider: AuthProvider = AuthProvider.local
    provider_id: Optional[str] = None
    avatar: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    reset_token: Optional[str] = None
    reset_token_exp: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Réponse publique (sans mot de passe)
class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    avatar: Optional[str] = None
    provider: AuthProvider

# Signup
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str

# Signin
class SignInRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

# Tokens
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse
