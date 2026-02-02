"""
User Models
===========
Pydantic models for user authentication and management.
"""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Schema for creating a new user (Admin only)."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Literal["admin", "user"] = "user"


class UserLogin(BaseModel):
    """Schema for user login."""
    username: str
    password: str


class UserResponse(BaseModel):
    """Schema for user response (excludes sensitive data)."""
    id: str
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserInDB(BaseModel):
    """Schema for user stored in database."""
    username: str
    email: str
    password_hash: str
    role: str = "user"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: dict


class TokenData(BaseModel):
    """Schema for decoded token data."""
    username: Optional[str] = None
