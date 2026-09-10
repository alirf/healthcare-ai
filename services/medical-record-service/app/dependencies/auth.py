"""Authentication dependencies for FastAPI."""
from typing import Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.config import get_settings
from app.exceptions import InternalAPIKeyError

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """Validate user identity from JWT OR trusted Gateway headers.

    Priority:
    1. If x-gateway-request header exists -> Trust x-user-id/x-user-role (Gateway already validated)
    2. Otherwise -> Validate JWT locally (direct access or other services)
    """
    settings = get_settings()

    is_gateway_request = request.headers.get("x-gateway-request") == "true"
    user_id_from_gateway = request.headers.get("x-user-id")
    user_role_from_gateway = request.headers.get("x-user-role")

    if is_gateway_request and user_id_from_gateway:
        return {
            "sub": user_id_from_gateway,
            "role": user_role_from_gateway,
            "source": "gateway",
        }

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
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

        payload["source"] = "jwt"
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
    """Dependency factory to enforce role-based access control (lowercase roles)."""
    async def role_checker(
        current_user: dict = Depends(get_current_user)
    ) -> dict:
        user_roles = current_user.get("roles", [])
        if isinstance(user_roles, str):
            user_roles = [user_roles]
        user_role = current_user.get("role")
        if user_role:
            user_roles.append(user_role)

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
    """Verify service-to-service API key for internal endpoints."""
    settings = get_settings()

    if x_internal_api_key is None:
        x_internal_api_key = request.headers.get("X-Internal-API-Key")

    if not x_internal_api_key or x_internal_api_key != settings.INTERNAL_API_KEY:
        raise InternalAPIKeyError()

    return True
