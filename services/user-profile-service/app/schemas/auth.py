"""Authentication dependencies for FastAPI."""
from typing import Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.config import get_settings
from app.exceptions import InternalAPIKeyError

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """Validate JWT token and return user payload.
    
    This dependency is used for patient-facing endpoints.
    The JWT is signed by the Auth Service using RS256.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    settings = get_settings()
    
    try:
        # Read public key from file
        with open(settings.JWT_PUBLIC_KEY_PATH, "r") as f:
            public_key = f.read()
        
        payload = jwt.decode(
            credentials.credentials,
            public_key,
            algorithms=[settings.JWT_ALGORITHM],
        )
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )
        
        return payload
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT public key not found",
        )


def require_role(required_role: str):
    """Dependency factory to enforce role-based access control.
    
    Usage:
        @router.get("/me")
        async def get_profile(current_user: dict = Depends(require_role("patient"))):
            ...
    """
    async def role_checker(
        current_user: dict = Depends(get_current_user)
    ) -> dict:
        user_roles = current_user.get("roles", [])
        if required_role not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role}",
            )
        return current_user
    
    return role_checker


async def verify_internal_api_key(
    request: Request,
    x_internal_api_key: Optional[str] = None
) -> bool:
    """Verify service-to-service API key for internal endpoints.
    
    Internal endpoints should NOT be exposed through the API Gateway.
    They are only accessible directly between microservices.
    """
    settings = get_settings()
    
    # Get from header if not passed directly
    if x_internal_api_key is None:
        x_internal_api_key = request.headers.get("X-Internal-API-Key")
    
    if not x_internal_api_key or x_internal_api_key != settings.INTERNAL_API_KEY:
        raise InternalAPIKeyError()
    
    return True