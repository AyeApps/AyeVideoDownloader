from pydantic import BaseModel, EmailStr
from typing import Optional

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(UserLogin):
    name: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    name: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    is_active: bool
