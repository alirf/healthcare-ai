"""FastAPI application factory for User Profile Service."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import patient, doctor, internal

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    print(f"🚀 {settings.APP_NAME} starting up...")
    yield
    # Shutdown
    print(f"🛑 {settings.APP_NAME} shutting down...")


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        description="""
        Healthcare AI - User Profile Service
        
        Manages patient and doctor profiles including:
        - Basic demographic information
        - Allergies and reactions
        - Current medications
        - Chronic conditions
        - Profile avatars (stored in object storage)
        
        ## Authentication
        All patient/doctor endpoints require a valid JWT Bearer token.
        Internal endpoints require an `X-Internal-API-Key` header.
        
        ## HIPAA Compliance
        All access to Protected Health Information (PHI) is logged
        in the audit log for compliance purposes.
        """,
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        redirect_slashes=False,
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.DEBUG else [],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(patient.router)
    app.include_router(doctor.router)
    app.include_router(internal.router)
    
    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Handle uncaught exceptions gracefully."""
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )
    
    # Health check endpoint
    @app.get("/health", tags=["Health"])
    async def health_check():
        """Health check endpoint for load balancers and monitoring."""
        return {"status": "healthy", "service": settings.APP_NAME}
    
    # Root endpoint
    @app.get("/", tags=["Root"])
    async def root():
        """Root endpoint with service information."""
        return {
            "service": settings.APP_NAME,
            "version": "1.0.0",
            "docs": "/docs" if settings.DEBUG else None,
        }
    
    return app


# Create the application instance
app = create_application()