"""Pytest configuration and fixtures.

Auth is done through trusted gateway headers (x-gateway-request / x-user-id /
x-user-role), so no JWT mocking is needed.
"""
import os

os.environ.setdefault("INTERNAL_API_KEY", "test-internal-key")

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    async_session = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


PATIENT_ID = "550e8400-e29b-41d4-a716-446655440000"
PATIENT2_ID = "770e8400-e29b-41d4-a716-446655440002"
DOCTOR_ID = "660e8400-e29b-41d4-a716-446655440001"
INTERNAL_HEADERS = {"X-Internal-API-Key": "test-internal-key"}


def auth_headers(user_id: str, role: str) -> dict:
    """Simulate a request forwarded by the API Gateway."""
    return {"x-gateway-request": "true", "x-user-id": user_id, "x-user-role": role}
