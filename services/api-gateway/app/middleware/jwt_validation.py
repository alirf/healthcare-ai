# app/middleware/jwt_validation.py
import jwt
from fastapi import Request
from fastapi.responses import JSONResponse
from pathlib import Path
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings


PUBLIC_ROUTES = {
    "/auth/login",
    "/auth/register",
    "/auth/verify-otp",
    "/auth/refresh",
    "/auth/health",
    "/api/auth/login",
    "/api/auth/register", 
    "/api/auth/verify-otp",
    "/api/auth/refresh",
    "/api/auth/health",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/health",
}


class JWTValidationMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, **kwargs):
        super().__init__(app)
        self.public_key = Path(settings.PUBLIC_KEY_PATH).read_text()
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        if any(path.startswith(route) for route in PUBLIC_ROUTES):
            return await call_next(request)
        
        auth_header = request.headers.get("authorization")
        if not auth_header:
            return JSONResponse(
                status_code=401,
                content={"detail": "Token not sent.", "code": "MISSING_TOKEN"}
            )
        
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "The token format is invalid.", "code": "INVALID_TOKEN_FORMAT"}
            )
        
        token = auth_header.replace("Bearer ", "")
        
        try:
            payload = jwt.decode(
                token,
                self.public_key,
                algorithms=["RS256"],
                options={"require": ["exp", "sub", "role"]}
            )
            
            request.state.user_id = payload.get("sub")
            request.state.user_role = payload.get("role")
            request.state.token_payload = payload
            
        except jwt.ExpiredSignatureError:
            return JSONResponse(
                status_code=401,
                content={"detail": "Token has expired.", "code": "TOKEN_EXPIRED"}
            )
        except jwt.InvalidTokenError as e:
            return JSONResponse(
                status_code=401,
                content={"detail": f"Token is invalid: {str(e)}", "code": "INVALID_TOKEN"}
            )
        
        return await call_next(request)