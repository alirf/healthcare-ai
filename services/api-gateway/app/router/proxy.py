# app/router/proxy.py
import httpx
from fastapi import Request, APIRouter, HTTPException
from fastapi.responses import JSONResponse, Response

from app.config import settings


router = APIRouter()

SERVICES = {
    "auth": settings.AUTH_SERVICE_URL,
    "profile": settings.PROFILE_SERVICE_URL,
    "intake": settings.VISIT_INTAKE_SERVICE_URL,
    "records": settings.RECORD_SERVICE_URL,
}

# پیشوندی که هر سرویس واقعاً روت‌هایش را روش سوار کرده
ROUTE_PREFIX = {
    "auth": "/auth",       # رفتار فعلی حفظ می‌شود
    "profile": "/profile", # profile-service: /profile/patient, /profile/doctor
    "intake": "",          # visit-intake-service: /visits, /doctor/visits
    "records": "/records", # medical-record-service: /records
}

# سرویس‌های داخلی که هرگز نباید از Gateway به بیرون مسیردهی شوند.
# "triage"   : سرویس triage داخلی است
# "ai-nlp"   : سرویس استنتاج ParsBERT فقط بین سرویسی است؛ visit-intake
#              مستقیماً (شبکه‌ی داخلی داکر) به http://ai-nlp-service:8000
#              وصل می‌شود و نباید از بیرون قابل دسترسی باشد.
INTERNAL_ONLY = {"triage", "ai-nlp"}

# این هدرها نباید عیناً از پاسخ upstream به کلاینت کپی بشن؛ Starlette/FastAPI
# خودش باید content-length و content-encoding درست را برای بدنه‌ی جدید بسازد.
HOP_BY_HOP_HEADERS = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade",
    "content-length", "content-encoding",
}


async def proxy_request(service: str, path: str, request: Request):
    """پروکسی درخواست به سرویس مقصد"""

    if service in INTERNAL_ONLY:
        raise HTTPException(status_code=403, detail="Forbidden: Internal service only")

    if service not in SERVICES:
        raise HTTPException(status_code=404, detail=f"Service '{service}' not found")

    # 🔒 مسیرهای internal نباید هرگز از Gateway عبور کنند
    if path.startswith("internal/"):
        raise HTTPException(status_code=403, detail="Internal endpoints are not accessible through the gateway")

    prefix = ROUTE_PREFIX.get(service, f"/api/{service}")
    target_url = f"{SERVICES[service]}{prefix}/{path}" if path else f"{SERVICES[service]}{prefix}"

    headers = dict(request.headers)
    headers.pop("host", None)

    user_id = getattr(request.state, "user_id", None)
    user_role = getattr(request.state, "user_role", None)

    if user_id:
        headers["x-user-id"] = str(user_id)
    if user_role:
        # سرویس‌ها (profile, visit-intake) با lowercase کار می‌کنند
        headers["x-user-role"] = str(user_role).lower()

    headers["x-gateway-request"] = "true"

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
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail=f"Service '{service}' unavailable")
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail=f"Timeout connecting to '{service}'")

    response_headers = {
        k: v for k, v in response.headers.items()
        if k.lower() not in HOP_BY_HOP_HEADERS
    }

    content_type = response.headers.get("content-type", "")

    # اگر پاسخ JSON است، به همان شکل قبلی برگردان.
    # اگر نیست (مثلاً تصویر آواتار یا فایل ضمیمه ویزیت)، بایت‌های خام را عیناً پاس بده
    # -- استفاده از response.json() روی محتوای غیر-JSON خطا می‌داد و درخواست را می‌شکست.
    if "application/json" in content_type:
        return JSONResponse(
            content=response.json() if response.content else {},
            status_code=response.status_code,
            headers=response_headers,
        )

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=response_headers,
        media_type=content_type or None,
    )


@router.api_route(
    "/auth/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
)
async def auth_proxy(path: str, request: Request):
    return await proxy_request("auth", path, request)


@router.api_route(
    "/api/{service}/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
)
async def gateway_proxy(service: str, path: str, request: Request):
    return await proxy_request(service, path, request)


@router.api_route(
    "/api/{service}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
)
async def gateway_proxy_root(service: str, request: Request):
    return await proxy_request(service, "", request)


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "api-gateway",
        "version": "1.0.0",
        "services": list(SERVICES.keys()),
    }
