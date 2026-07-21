from beanie import Document, Indexed
from datetime import datetime
from pydantic import Field

class RevokedToken(Document):
    token: Indexed(str, unique=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "revoked_tokens"
