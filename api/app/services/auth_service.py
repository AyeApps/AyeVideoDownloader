from fastapi import HTTPException
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, TokenResponse
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token

class AuthService:
    @staticmethod
    async def register(user_in: UserCreate) -> User:
        user = await User.find_one(User.email == user_in.email)
        if user:
            raise HTTPException(status_code=400, detail="Email already registered")
        hashed_password = get_password_hash(user_in.password)
        new_user = User(email=user_in.email, name=user_in.name, hashed_password=hashed_password)
        await new_user.insert()
        return new_user

    @staticmethod
    async def login(user_in: UserLogin) -> TokenResponse:
        user = await User.find_one(User.email == user_in.email)
        if not user or not verify_password(user_in.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
            
        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))
        return TokenResponse(access_token=access_token, refresh_token=refresh_token, name=user.name)
