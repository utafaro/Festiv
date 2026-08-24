from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, timezone
from enum import Enum

class FriendStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"

class FriendInDB(BaseModel):
    id: Optional[str] = None
    requester_id: str
    addressee_id: str
    status: FriendStatus = FriendStatus.pending
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FriendResponse(BaseModel):
    id: str
    user_id: str
    email: str
    full_name: str
    avatar: Optional[str] = None
    status: FriendStatus
    direction: str
    created_at: datetime

class FriendRequest(BaseModel):
    email: EmailStr
