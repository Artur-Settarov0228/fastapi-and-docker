from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    full_name: str
    email: str
    phone: Optional[str] = None
    location: str
    role: Optional[str] = "Foydalanuvchi"


class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    location: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    role: Optional[str] = None
