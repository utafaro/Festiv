from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum

# ==========================================
# 1. MODÈLES SUIVI (session de tracking live, liée à un festival + des lineups)
# ==========================================

class SuiviInDB(BaseModel):
    id: Optional[str] = None
    festival_id: str
    lineup_ids: List[str]
    owner_id: str
    name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SuiviResponse(BaseModel):
    id: str
    festival_id: str
    lineup_ids: List[str]
    owner_id: str
    name: Optional[str] = None
    created_at: datetime

class SuiviCreateRequest(BaseModel):
    festival_id: str
    lineup_ids: List[str] = Field(min_length=1)
    name: Optional[str] = None

class SuiviUpdateRequest(BaseModel):
    name: Optional[str] = None
    lineup_ids: Optional[List[str]] = None


# ==========================================
# 2. MODÈLES MEMBRES / INVITATIONS DE SUIVI (même logique que Lineup)
# ==========================================

class SuiviMemberStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"

class SuiviMemberInDB(BaseModel):
    id: Optional[str] = None
    suivi_id: str
    user_id: str
    status: SuiviMemberStatus = SuiviMemberStatus.pending
    invited_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SuiviMemberResponse(BaseModel):
    id: str
    suivi_id: str
    suivi_name: Optional[str] = None
    festival_id: str
    user_id: str
    email: str
    full_name: str
    status: SuiviMemberStatus

class SuiviInviteRequest(BaseModel):
    email: EmailStr


# ==========================================
# 3. MODÈLES POSITION (pointage live d'un membre)
# ==========================================

class TargetType(str, Enum):
    set = "set"
    custom = "custom"

class PositionInDB(BaseModel):
    id: Optional[str] = None
    suivi_id: str
    user_id: str
    target_type: Optional[TargetType] = None
    lineup_id: Optional[str] = None
    set_id: Optional[str] = None
    custom_label: Optional[str] = None
    note: Optional[str] = None
    grouped_with: List[str] = Field(default_factory=list)
    lat: Optional[float] = None
    lng: Optional[float] = None
    geo_updated_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PositionResponse(BaseModel):
    id: str
    suivi_id: str
    user_id: str
    full_name: str
    avatar: Optional[str] = None
    target_type: Optional[TargetType] = None
    lineup_id: Optional[str] = None
    set_id: Optional[str] = None
    custom_label: Optional[str] = None
    note: Optional[str] = None
    grouped_with: List[str] = []
    lat: Optional[float] = None
    lng: Optional[float] = None
    geo_updated_at: Optional[datetime] = None
    updated_at: datetime

class PositionSetRequest(BaseModel):
    target_type: TargetType
    set_id: Optional[str] = None
    custom_label: Optional[str] = None
    note: Optional[str] = None
    grouped_with: List[str] = []

class GeoPingRequest(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
