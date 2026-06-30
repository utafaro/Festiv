from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime

# ==========================================
# 1. MODÈLES ARTISTE (Artist)
# ==========================================

# Schéma en base MongoDB
class ArtistInDB(BaseModel):
    id: Optional[str] = None
    name: str
    nationality: Optional[str] = None
    genres: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

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
# 2. MODÈLES SET / CONCERT (Set)
# ==========================================

# Schéma en base MongoDB
class SetInDB(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None  # Optionnel (ex: "Closing Set", "Opening")
    artist_ids: List[str] = Field(default_factory=list) # Références aux IDs des artistes
    start_time: datetime
    end_time: datetime
    date: datetime # Date spécifique du set
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Réponse publique (On embarque l'objet ArtistResponse complet pour le front)
class SetResponse(BaseModel):
    id: str
    name: Optional[str] = None
    artists: List[ArtistResponse]
    start_time: datetime
    end_time: datetime
    date: datetime

# Requête de création
class SetCreateRequest(BaseModel):
    name: Optional[str] = None
    artist_ids: List[str]
    start_time: datetime
    end_time: datetime
    date: datetime


# ==========================================
# 3. MODÈLES FESTIVAL (Festival)
# ==========================================

# Schéma en base MongoDB
class FestivalInDB(BaseModel):
    id: Optional[str] = None
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
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Réponse publique (Enrichie avec les Sets et les Artistes pour Festiv)
class FestivalResponse(BaseModel):
    id: str
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
    
    main_page_url: Optional[HttpUrl] = None
    ticket_office_url: Optional[HttpUrl] = None
    akkros_url: Optional[HttpUrl] = None
    merch_url: Optional[HttpUrl] = None
    cover_image_url: Optional[HttpUrl] = None