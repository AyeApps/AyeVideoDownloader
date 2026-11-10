
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import ALGORITHM
from app.models.revoked_token import RevokedToken
from app.models.user import User

logger = get_logger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(
    request: Request,
    bearer_token: str | None = Depends(oauth2_scheme),
    token: str | None = None
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
        except HTTPException:
            raise
        except Exception:  # noqa: BLE001 — DB puede no estar disponible; continuamos sin verificar revocación
            logger.warning("No se pudo verificar revocación del token (DB no disponible)")

        payload = jwt.decode(
            auth_token,
            settings.JWT_SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"verify_aud": False}
        )
        token_type = payload.get("type")
        if token_type is not None and token_type != "access":
            raise credentials_exception
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
        except HTTPException:
            raise
        except Exception:  # noqa: BLE001 — DB puede no estar disponible; continuamos sin verificar revocación
            logger.warning("No se pudo verificar revocación del token (DB no disponible)")

        # Stateless user verified by cryptographic signature from aye-auth
        return User(
            id=user_id,
            email=email,
            name=name,
            hashed_password="",
            is_active=True
        )
    except JWTError:
        raise credentials_exception

async def get_optional_current_user(
    request: Request,
    bearer_token: str | None = Depends(oauth2_scheme),
    token: str | None = None
) -> User | None:
    auth_token = bearer_token or token
    if not auth_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            auth_token = auth_header.replace("Bearer ", "").strip()
            
    if not auth_token:
        return None
        
    return await get_current_user(request=request, bearer_token=bearer_token, token=token)

