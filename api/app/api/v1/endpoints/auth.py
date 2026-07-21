from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.auth import UserCreate, UserLogin, TokenResponse, UserResponse
from app.services.auth_service import AuthService
from app.core.deps import get_current_user
from app.models.user import User
from app.models.revoked_token import RevokedToken
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    user = await AuthService.register(user_in)
    return UserResponse(id=str(user.id), email=user.email, name=user.name, is_active=user.is_active)

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, user_in: UserLogin):
    return await AuthService.login(user_in)

@router.post("/refresh", response_model=TokenResponse)
async def refresh(current_user: User = Depends(get_current_user)):
    # This is simplified; ideally, we'd have a separate refresh token dependency.
    from app.core.security import create_access_token, create_refresh_token
    access_token = create_access_token(subject=str(current_user.id))
    refresh_token = create_refresh_token(subject=str(current_user.id))
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)

@router.delete("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(token: str = Depends(get_current_user)):
    # Assuming token is extracted somehow, here we just show the structure.
    # In a real app we'd pass the actual token string.
    pass
