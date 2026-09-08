# app/router/proxy.py
import httpx
from fastapi import Request, APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.config import settings


router = APIRouter()

SERVICES = {
    "auth": settings.AUTH_SERVICE_URL,
    "profile": settings.PROFILE_SERVICE_URL,
}

# ✅ مسیرهای هر سرویس
SERVICE_PATHS = {
    "auth": "/auth",
    "profile": "/api/profile",
}

INTERNAL_ONLY = {"triage"}


async def proxy_request(service: str, path: str, request: Request):
    """پروکسی درخواست به سرویس مقصد"""
    
    if service in INTERNAL_ONLY:
        raise HTTPException(status_code=403, detail="Forbidden: Internal service only")
    
    if service not in SERVICES:
        raise HTTPException(status_code=404, detail=f"Service '{service}' not found")
    
    # ✅ مسیر درست بر اساس سرویس
    base_path = SERVICE_PATHS.get(service, f"/api/{service}")
    target_url = f"{SERVICES[service]}{base_path}/{path}"
    
    headers = dict(request.headers)
    headers.pop("host", None)
    
    user_id = getattr(request.state, "user_id", None)
    user_role = getattr(request.state, "user_role", None)
    
    if user_id:
        headers["x-user-id"] = str(user_id)
    if user_role:
        headers["x-user-role"] = str(user_role)
    
    headers["x-gateway-request"] = "true"
    
    if path.startswith("internal/"):
        headers["x-internal-api-key"] = settings.INTERNAL_API_KEY
    
    body = await request.body()
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                params=request.query_params,
                content=body if body else None,
            )
            
            content_type = response.headers.get("content-type", "")
            if "application/json" in content_type:
                response_content = response.json()
            else:
                response_content = {
                    "detail": response.text or "Empty response from upstream",
                    "upstream_status": response.status_code
                }
            
            gateway_response = JSONResponse(
                content=response_content,
                status_code=response.status_code,
            )
            
            # کپی کردن هدرهای مهم از upstream
            for header in ["content-type", "x-request-id"]:
                if header in response.headers:
                    gateway_response.headers[header] = response.headers[header]
            
            return gateway_response
            
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail=f"Service '{service}' unavailable")
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail=f"Timeout connecting to '{service}'")


# ✅ مسیر Auth عمومی (بدون /api)
@router.api_route(
    "/auth/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
)
async def auth_proxy(path: str, request: Request):
    return await proxy_request("auth", path, request)


# ✅ مسیرهای API استاندارد
@router.api_route(
    "/api/{service}/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
)
async def gateway_proxy(service: str, path: str, request: Request):
    return await proxy_request(service, path, request)


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "api-gateway",
        "version": "1.0.0",
        "services": list(SERVICES.keys())
    }