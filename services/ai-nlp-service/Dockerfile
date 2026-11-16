# syntax=docker/dockerfile:1

########################################
# Stage 1 — builder: install python deps
########################################
FROM python:3.11-slim AS builder

# TORCH_VARIANT=cpu (default, image ~2.5 GB) or cu121 (CUDA 12.1 wheels)
ARG TORCH_VARIANT=cpu

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements.txt .

# torch comes from the variant-specific pytorch index; the rest from PyPI.
RUN if [ "$TORCH_VARIANT" = "cu121" ]; then \
        TORCH_INDEX="https://download.pytorch.org/whl/cu121"; \
    else \
        TORCH_INDEX="https://download.pytorch.org/whl/cpu"; \
    fi \
    && pip install --prefix=/install torch==2.5.1 --index-url "$TORCH_INDEX" \
    && PYTHONPATH=/install pip install --prefix=/install -r requirements.txt

########################################
# Stage 2 — final runtime image
########################################
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# site-packages + console scripts (uvicorn) from the builder stage
COPY --from=builder /install/ /usr/local/

COPY app/ ./app/
COPY models/ ./models/

# Fail the build early when the model artefacts are missing.
# best_model.pt is a ~600 MB checkpoint — it must be present in the build
# context (services/ai-nlp-service/models/) before `docker build`.
RUN test -f /app/models/best_model.pt || (echo "missing best_model.pt" && exit 1) \
 && test -f /app/models/evidence_list_clean.json || (echo "missing evidence_list_clean.json" && exit 1)

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=120s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=3)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
