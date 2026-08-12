import time
import json
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # اطلاعات درخواست
        method = request.method
        path = request.url.path
        query = str(request.query_params)
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        user_id = getattr(request.state, "user_id", "anonymous")
        user_role = getattr(request.state, "user_role", "none")
        
        # ارسال درخواست
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as exc:
            status_code = 500
            raise exc
        finally:
            process_time = (time.time() - start_time) * 1000  # میلی‌ثانیه
            
            log_entry = {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "method": method,
                "path": path,
                "query": query if query else None,
                "status_code": status_code,
                "process_time_ms": round(process_time, 2),
                "client_ip": client_ip,
                "user_id": user_id,
                "user_role": user_role,
                "user_agent": user_agent,
            }
            
            # لاگ در stdout (در Docker با json formatter قابل جمع‌آوری است)
            print(json.dumps(log_entry, ensure_ascii=False))
        
        # اضافه کردن هدر زمان پاسخ
        response.headers["X-Process-Time"] = str(round(process_time, 2))
        return response