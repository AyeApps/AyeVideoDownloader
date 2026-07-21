from beanie import Document, Indexed
from datetime import datetime
from pydantic import Field, EmailStr

class User(Document):
    email: Indexed(EmailStr, unique=True)
    name: str
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
