from fastapi import Request
from fastapi.responses import JSONResponse


# مسیرهایی که نیاز به نقش خاص دارند
PROTECTED_ROUTES = {
    "/api/doctor-review/": ["DOCTOR", "ADMIN"],
    "/api/prescriptions/create": ["DOCTOR", "ADMIN"],
    "/api/prescriptions/approve": ["DOCTOR", "ADMIN"],
    "/api/admin/": ["ADMIN"],
}


class RoleCheckerMiddleware:
    async def __call__(self, request: Request, call_next):
        path = request.url.path
        user_role = getattr(request.state, "user_role", None)
        
        for route_prefix, allowed_roles in PROTECTED_ROUTES.items():
            if path.startswith(route_prefix):
                if user_role not in allowed_roles:
                    return JSONResponse(
                        status_code=403,
                        content={
                            "detail": "Forbidden: You do not have the required role to access this resource",
                            "code": "FORBIDDEN",
                            "required_roles": allowed_roles,
                            "your_role": user_role
                        }
                    )
                break
        
        return await call_next(request)