from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum

# ==========================================
# 1. MODÈLES ARTISTE (Artist)
# ==========================================

# Schéma en base MongoDB
class ArtistInDB(BaseModel):
    id: Optional[str] = None
    name: str
    nationality: Optional[str] = None
    genres: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Réponse publique
class ArtistResponse(BaseModel):
    id: str
    name: str
    nationality: Optional[str] = None
    genres: List[str]

# Requête de création
class ArtistCreateRequest(BaseModel):
    name: str
    nationality: Optional[str] = None
    genres: List[str] = []


# ==========================================
# 2. MODÈLES LINEUP (planning partageable, lié à un festival)
# ==========================================

# Schéma en base MongoDB
class LineupInDB(BaseModel):
    id: Optional[str] = None
    festival_id: str
    owner_id: str
    name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Réponse publique
class LineupResponse(BaseModel):
    id: str
    festival_id: str
    owner_id: str
    name: Optional[str] = None
    created_at: datetime

# Requête de création
class LineupCreateRequest(BaseModel):
    festival_id: str
    name: Optional[str] = None

# Requête de modification
class LineupUpdateRequest(BaseModel):
    name: Optional[str] = None


# ==========================================
# 3. MODÈLES MEMBRES / INVITATIONS DE LINEUP
# ==========================================

class LineupMemberStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"

# Schéma en base MongoDB
class LineupMemberInDB(BaseModel):
    id: Optional[str] = None
    lineup_id: str
    user_id: str
    status: LineupMemberStatus = LineupMemberStatus.pending
    invited_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Réponse publique (enrichie avec les infos de l'utilisateur invité et de la lineup)
class LineupMemberResponse(BaseModel):
    id: str
    lineup_id: str
    lineup_name: Optional[str] = None
    festival_id: str
    user_id: str
    email: str
    full_name: str
    status: LineupMemberStatus

# Requête d'invitation
class LineupInviteRequest(BaseModel):
    email: EmailStr


# ==========================================
# 4. MODÈLES SCÈNE / LIEU (Stage)
# ==========================================

# Schéma en base MongoDB — une scène appartient à une lineup et est réutilisable
# pour tous les sets de cette lineup.
class StageInDB(BaseModel):
    id: Optional[str] = None
    lineup_id: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Réponse publique
class StageResponse(BaseModel):
    id: str
    lineup_id: str
    name: str

# Requête de création
class StageCreateRequest(BaseModel):
    name: str


# ==========================================
# 5. MODÈLES SET / CONCERT (Set)
# ==========================================

# Schéma en base MongoDB
class SetInDB(BaseModel):
    id: Optional[str] = None
    lineup_id: str
    name: Optional[str] = None  # Optionnel (ex: "Closing Set", "Opening")
    artist_ids: List[str] = Field(default_factory=list) # Références aux IDs des artistes
    stage_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    date: Optional[datetime] = None # Date spécifique du set
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Réponse publique (On embarque l'objet ArtistResponse complet et la scène pour le front)
class SetResponse(BaseModel):
    id: str
    lineup_id: str
    name: Optional[str] = None
    artists: List[ArtistResponse]
    stage: Optional[StageResponse] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    date: Optional[datetime] = None

# Requête de création
class SetCreateRequest(BaseModel):
    name: Optional[str] = None
    artist_ids: List[str] = []
    stage_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    date: Optional[datetime] = None

# Requête de modification
class SetUpdateRequest(BaseModel):
    name: Optional[str] = None
    artist_ids: Optional[List[str]] = None
    stage_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    date: Optional[datetime] = None


# ==========================================
# 6. MODÈLES FESTIVAL (Festival)
# ==========================================

# Schéma en base MongoDB
class FestivalInDB(BaseModel):
    id: Optional[str] = None
    owner_id: Optional[str] = None  # Optionnel : festivals créés avant l'introduction de ce champ
    name: str
    location: str
    genres: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list) # 0, 1 ou plusieurs tags
    start_date: datetime
    end_date: datetime
    #set_ids: List[str] = Field(default_factory=list) # Références aux IDs des sets associés
    
    # Liens et médias (Utilisation de HttpUrl converti en str en base)
    main_page_url: Optional[str] = None
    ticket_office_url: Optional[str] = None
    akkros_url: Optional[str] = None
    merch_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Réponse publique (Enrichie avec les Sets et les Artistes pour Festiv)
class FestivalResponse(BaseModel):
    id: str
    owner_id: Optional[str] = None
    name: str
    location: str
    genres: List[str]
    tags: List[str]
    start_date: datetime
    end_date: datetime
    #sets: List[SetResponse] # Liste des sets complets ordonnés
    
    main_page_url: Optional[str] = None
    ticket_office_url: Optional[str] = None
    akkros_url: Optional[str] = None
    merch_url: Optional[str] = None
    cover_image_url: Optional[str] = None

# Requête de création / Modification
class FestivalCreateRequest(BaseModel):
    name: str
    location: str
    genres: List[str]
    tags: List[str] = []
    start_date: datetime
    end_date: datetime
    #set_ids: List[str] = []
    
    main_page_url: Optional[str] = None
    ticket_office_url: Optional[str] = None
    akkros_url: Optional[str] = None
    merch_url: Optional[str] = None
    cover_image_url: Optional[str] = None


class FestivalUpdateRequest(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    genres: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    main_page_url: Optional[str] = None
    ticket_office_url: Optional[str] = None
    akkros_url: Optional[str] = None
    merch_url: Optional[str] = None
    cover_image_url: Optional[str] = None