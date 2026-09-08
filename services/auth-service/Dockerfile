FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ✅ مسیر ساده چون context = ./services/auth-service
COPY keys/ ./keys/
COPY app/ ./app/
COPY main.py .

# 🔍 دیباگ
RUN ls -la /app/keys/

# ایجاد کاربر non-root
RUN adduser --disabled-password --gecos '' appuser

RUN chown -R appuser:appuser /app/keys && \
    chmod 600 /app/keys/private.pem && \
    chmod 644 /app/keys/public.pem

USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3001"]