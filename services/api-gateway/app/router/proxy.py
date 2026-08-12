import httpx
from fastapi import Request, APIRouter, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse

from app.config import settings


router = APIRouter()

# جدول مسیریابی سرویس‌ها
SERVICES = {
    "auth": settings.AUTH_SERVICE_URL,
    # در آینده اضافه می‌شوند:
    # "patients": "http://profile-service:3002",
    # "intake": "http://symptom-intake-service:3003",
    # "doctor-review": "http://doctor-review-service:3005",
    # "prescriptions": "http://prescription-service:3006",
    # "notifications": "http://notification-service:3007",
}

# مسیرهایی که فقط داخلی هستند و نباید از بیرون دسترسی داشته باشند
INTERNAL_ONLY = {"triage"}


async def proxy_request(service: str, path: str, request: Request):
    """پروکسی درخواست به سرویس مقصد"""
    
    if service in INTERNAL_ONLY:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    if service not in SERVICES:
        raise HTTPException(status_code=404, detail=f"Service '{service}' not found")
    
    target_url = f"{SERVICES[service]}/api/{service}/{path}"
    
    # آماده‌سازی هدرها
    headers = dict(request.headers)
    headers.pop("host", None)
    
    # اضافه کردن هدرهای داخلی از JWT
    user_id = getattr(request.state, "user_id", None)
    user_role = getattr(request.state, "user_role", None)
    
    if user_id:
        headers["x-user-id"] = str(user_id)
    if user_role:
        headers["x-user-role"] = str(user_role)
    
    # حذف authorization از هدرهای ارسالی به سرویس داخلی
    # (چون سرویس‌ها فقط به x-user-id و x-user-role اعتماد می‌کنند)
    headers.pop("authorization", None)
    
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
            
            # برگرداندن پاسخ
            return JSONResponse(
                content=response.json() if response.content else {},
                status_code=response.status_code,
                headers=dict(response.headers)
            )
            
        except httpx.ConnectError:
            raise HTTPException(
                status_code=503,
                detail=f"Service '{service}' is not available"
            )
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=504,
                detail=f"Timeout while connecting to service '{service}'"
            )


@router.api_route(
    "/api/{service}/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
)
async def gateway_proxy(service: str, path: str, request: Request):
    return await proxy_request(service, path, request)


# مسیر سلامتی Gateway
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "api-gateway",
        "version": "1.0.0"
    }