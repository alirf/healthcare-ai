"""Pytest configuration and fixtures."""
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.database import Base, get_db


# Use an in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_engine():
    """Create a test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    """Create a test database session."""
    async_session = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session):
    """Create an async test client with overridden DB dependency."""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
def mock_patient_token():
    """Mock JWT token payload for a patient user."""
    return {
        "sub": "550e8400-e29b-41d4-a716-446655440000",
        "roles": ["patient"],
        "email": "patient@example.com",
    }


@pytest.fixture
def mock_doctor_token():
    """Mock JWT token payload for a doctor user."""
    return {
        "sub": "660e8400-e29b-41d4-a716-446655440001",
        "roles": ["doctor"],
        "email": "doctor@example.com",
    }


@pytest.fixture
def mock_internal_key():
    """Mock internal API key."""
    return "test-internal-api-key-12345"