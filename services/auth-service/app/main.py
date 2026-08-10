from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.auth.router import router as auth_router
from app.core.exceptions import AuthException

# ساخت جداول در دیتابیس
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="سرویس احراز هویت سیستم ویزیت آنلاین"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # در پروداکشن محدود کن
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# هندلر خطاهای سفارشی
@app.exception_handler(AuthException)
async def auth_exception_handler(request: Request, exc: AuthException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

# روترها
app.include_router(auth_router)

@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}