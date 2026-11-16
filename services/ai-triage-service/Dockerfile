# ── Build stage ─────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build
ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# ── Runtime stage ───────────────────────────────────────────────────
FROM python:3.11-slim

LABEL org.opencontainers.image.title="ai-triage-service"
LABEL org.opencontainers.image.description="Internal AI orchestrator for healthcare-ai"
LABEL org.opencontainers.image.source="https://github.com/healthcare-ai/ai-triage-service"

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY app/ ./app/

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

EXPOSE 8000

# healthcheck hits /health (public, no auth)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=3)" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips=*"]
