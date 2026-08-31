from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.config import settings
from app.core.security import ALGORITHM
from app.models.user import User
from app.models.revoked_token import RevokedToken

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme),
    token: Optional[str] = None
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Extract token from Bearer header, query param, or Authorization header directly
    auth_token = bearer_token or token
    if not auth_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            auth_token = auth_header.replace("Bearer ", "").strip()
            
    if not auth_token:
        raise credentials_exception
        
    try:
        # Check revocation if DB connected
        try:
            is_revoked = await RevokedToken.find_one(RevokedToken.token == auth_token)
            if is_revoked:
                raise credentials_exception
        except Exception:
            pass

        payload = jwt.decode(
            auth_token,
            settings.jwt_secret_key,
            algorithms=[ALGORITHM],
            options={"verify_aud": False}
        )
        user_id: str = payload.get("sub")
        email: str = payload.get("email", "user@ayeapps.com")
        name: str = payload.get("name", "")
        if user_id is None:
            raise credentials_exception

        try:
            user = await User.get(user_id)
            if user:
                if not user.is_active:
                    raise HTTPException(status_code=400, detail="Inactive user")
                return user
        except Exception:
            pass

        # Stateless user verified by cryptographic JWT signature from aye-auth
        return User(
            id=user_id,
            email=email,
            name=name,
            hashed_password="",
            is_active=True
        )
    except JWTError:
        raise credentials_exception
