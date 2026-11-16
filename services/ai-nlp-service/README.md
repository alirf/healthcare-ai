# ai-nlp-service

Stateless inference microservice for the healthcare-ai platform. It loads the
trained **ParsBERT Evidence Classifier** once at startup and serves exactly one
job:

> Persian free text in -> list of detected evidence codes with confidence scores out.

It performs **no orchestration**: it does not call visit-intake-service, it
does not call triage, it stores nothing anywhere. The visit-intake-service
calls `POST /extract`, then calls triage separately, then pushes the results
to its own database. This service is internal-only and is never routed through
the API gateway (see [Patches](#patches-to-existing-services)).

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/extract` | `X-Internal-API-Key` (skipped when `DEV_MODE=true`) | Persian text -> evidence codes + confidences |
| GET | `/health` | public | `200` when the model is loaded, `503` otherwise |
| GET | `/model-info` | `X-Internal-API-Key` | checkpoint / evidence metadata |

## Project layout

```
services/ai-nlp-service/
├── app/
│   ├── __init__.py
│   ├── main.py                   # create_application() factory + lifespan
│   ├── config.py                 # pydantic_settings, @lru_cache get_settings()
│   ├── exceptions.py             # InternalAPIKeyError, ModelNotLoadedError
│   ├── dependencies/
│   │   ├── __init__.py
│   │   └── auth.py               # verify_internal_api_key (X-Internal-API-Key)
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── nlp.py                # ExtractRequest, DetectedEvidence, ExtractResponse, ...
│   ├── services/
│   │   ├── __init__.py
│   │   ├── evidence_loader.py    # load_evidences(path) -> (eid_list, eid_info)
│   │   ├── classifier.py         # EvidenceClassifier (verbatim training-time class)
│   │   └── nlp_service.py        # NLPService singleton + post-processing
│   └── routers/
│       ├── __init__.py
│       ├── extract.py            # POST /extract, GET /model-info
│       └── health.py             # GET /health
├── models/
│   ├── .gitkeep
│   └── README.md                 # where best_model.pt / evidence_list_clean.json go
├── tests/
│   ├── __init__.py
│   ├── conftest.py               # fake NLPService + fake evidence list
│   ├── test_extract.py
│   ├── test_health.py
│   └── test_auth.py
├── Dockerfile
├── .dockerignore
├── requirements.txt
├── .env.example
└── README.md
```

## Run locally

```bash
cd services/ai-nlp-service

python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate

# CPU-only torch is far smaller than the default CUDA wheel:
pip install torch==2.5.1 --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

# Optional: DEV_MODE=true lets you curl without the internal API key
cp .env.example .env

# Point the paths at your artefacts (or copy them into ./models/)
uvicorn app.main:app --host 0.0.0.0 --port 8005 --reload
```

Notes:

- The first startup downloads the ParsBERT base weights + tokenizer from the
  HuggingFace hub (`HooshvareLab/bert-fa-base-uncased`); the fine-tuned
  checkpoint is loaded from disk afterwards. See [Decisions](#decisions) #12.
- If the checkpoint or evidence file is missing/corrupt, or the checkpoint's
  class count does not match the evidence list, the service **stays alive**
  but reports `503` on `/health` — it never crashes on a bad artefact.

## Run tests

```bash
pytest tests -v
```

Tests never touch torch, the checkpoint or the HuggingFace hub: the
`NLPService` singleton is replaced by `FakeNLPService` (see
`tests/conftest.py`), which reuses the real post-processing logic.

## Docker

```bash
# from the repo root
docker compose build ai-nlp-service
docker compose up -d ai-nlp-service

curl http://localhost:8005/health
```

The image is multi-stage. `TORCH_VARIANT` selects the torch wheel index
(default `cpu`; use `cu121` for CUDA 12.1):

```bash
docker compose build --build-arg TORCH_VARIANT=cu121 ai-nlp-service
```

`best_model.pt` (~600 MB) and `evidence_list_clean.json` must exist in
`services/ai-nlp-service/models/` before the build — the build fails with
`missing best_model.pt` / `missing evidence_list_clean.json` otherwise.

## Example requests

`POST /extract` (via the compose host mapping `8005:8000`):

```bash
curl -X POST http://localhost:8005/extract \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: internal-secret-key-12345" \
  -d '{
        "text": "سلام پوستم قرمز شده. سرم درد میکنه تب هم دارم",
        "threshold": 0.3,
        "top_k": null,
        "apply_hierarchy_filter": true
      }'
```

Example response:

```json
{
  "text": "سلام پوستم قرمز شده. سرم درد میکنه تب هم دارم",
  "detected": [
    {
      "evidence_id": "E_19_0001",
      "name": "skin_lesions",
      "name_fa": "ضایعات پوستی",
      "question_en": "Do you have any lesions, redness or problems on your skin...",
      "question_fa": "آیا ضایعه، قرمزی یا مشکل پوستی مرتبط با علت مراجعه دارید؟",
      "data_type": "B",
      "is_antecedent": false,
      "code_question": "E_19_0001",
      "default_value": 0,
      "value_meaning": {},
      "possible-values": [],
      "confidence": 0.8734
    },
    { "evidence_id": "E_19_0002", "name": "lesion_color", "confidence": 0.5121, "..." : "..." }
  ],
  "threshold": 0.3,
  "apply_hierarchy_filter": true,
  "truncated": false,
  "model_version": "parsbert-v1",
  "inference_time_ms": 34.2
}
```

`detected` is sorted by confidence descending; empty/whitespace text returns
`200` with `detected: []`; text longer than 5000 chars is truncated and
returns `"truncated": true`.

Other endpoints:

```bash
curl http://localhost:8005/health
curl http://localhost:8005/model-info -H "X-Internal-API-Key: internal-secret-key-12345"
```

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `APP_NAME` | `AI NLP Service` | Service title |
| `DEBUG` | `false` | Debug logging level |
| `PORT` | `8000` | Port (container always listens on 8000) |
| `MODEL_PATH` | `./models/best_model.pt` | Checkpoint path (dict: `model_state_dict`, `f1`, `epoch`) |
| `EVIDENCE_PATH` | `./models/evidence_list_clean.json` | Evidence dictionary path |
| `MODEL_NAME` | `HooshvareLab/bert-fa-base-uncased` | Base ParsBERT model |
| `MODEL_VERSION` | `parsbert-v1` | Reported in responses |
| `THRESHOLD` | `0.3` | Default sigmoid threshold (per-request overridable) |
| `MAX_LEN` | `128` | Tokenizer max length |
| `DEVICE` | `""` | Empty = auto-detect (`cuda` if available else `cpu`); env override wins |
| `INTERNAL_API_KEY` | `internal-secret-key-12345` | Shared service-to-service key |
| `DEV_MODE` | `false` | Skip API key check — local testing only, never in production |

## docker-compose.yml addition

Append to the existing `services:` block in `./docker-compose.yml`:

```yaml
  ai-nlp-service:
    build:
      context: ./services/ai-nlp-service
      args:
        TORCH_VARIANT: cpu
    container_name: ai-nlp-service
    restart: unless-stopped
    environment:
      APP_NAME: AI NLP Service
      DEBUG: "false"
      PORT: 8000
      MODEL_PATH: /app/models/best_model.pt
      EVIDENCE_PATH: /app/models/evidence_list_clean.json
      MODEL_NAME: HooshvareLab/bert-fa-base-uncased
      MODEL_VERSION: parsbert-v1
      THRESHOLD: "0.3"
      MAX_LEN: "128"
      INTERNAL_API_KEY: ${INTERNAL_API_KEY:-internal-secret-key-12345}
      DEV_MODE: "false"
    ports:
      - "8005:8000"   # local dev only — remove for production
    networks:
      - healthcare-network
```

No `depends_on` — this service has no external dependencies. Add it to the
existing `healthcare-network` (already exists).

## Patches to existing services

### 1. api-gateway — block `ai-nlp` at the gateway

`services/api-gateway/app/router/proxy.py`:

```diff
@@ ROUTE_PREFIX @@
 ROUTE_PREFIX = {
     "auth": "/auth",       # رفتار فعلی حفظ می‌شود
     "profile": "/profile", # profile-service: /profile/patient, /profile/doctor
     "intake": "",          # visit-intake-service: /visits, /doctor/visits
     "records": "/records", # medical-record-service: /records
 }

-INTERNAL_ONLY = {"triage"}
+INTERNAL_ONLY = {"triage", "ai-nlp"}
```

This prevents `ai-nlp-service` from ever being routed through the gateway.

### 2. visit-intake-service — plumb the service URL (future orchestration)

`services/visit-intake-service/app/config.py` — add to `Settings`:

```diff
@@ class Settings(BaseSettings):
     # medical-record-service (sync hook: register visits on records)
     MEDICAL_RECORD_SERVICE_URL: str = "http://localhost:8000"
+
+    # ai-nlp-service (evidence extraction — orchestration lands in a later task)
+    AI_NLP_SERVICE_URL: str = "http://ai-nlp-service:8000"

     # File Upload
     MAX_ATTACHMENT_SIZE_MB: int = 25
```

`./docker-compose.yml` — add to the existing
`visit-intake-service.environment:` block:

```diff
   visit-intake-service:
     environment:
       DATABASE_URL: postgresql+asyncpg://postgres:password@visits-db:5432/visits_db
       JWT_PUBLIC_KEY_PATH: /app/keys/public.pem
       JWT_ALGORITHM: RS256
+      AI_NLP_SERVICE_URL: http://ai-nlp-service:8000
       MINIO_ENDPOINT: minio:9000
       MINIO_ACCESS_KEY: minioadmin
```

No orchestration code is written yet — only the URL is plumbed.

## Decisions

1. **Routers resolve the singleton at request time** (`nlp_service_module.nlp_service`)
   instead of binding it at import. This is what makes the spec's test seam
   (`monkeypatch app.services.nlp_service.nlp_service`) work; a module-level
   `from ... import nlp_service` would freeze the reference and tests would hit
   the real (unloaded) service.
2. **Strict `>` threshold comparison** (per the spec's hierarchy pseudocode:
   `prob > threshold`). Consequence: `threshold=1.0` always returns `[]`.
3. **The spec's `threshold=0.9` test is inconsistent with its own fixture**
   (predictions `0.87 / 0.51` pass nothing through a strict `> 0.9` filter).
   The test overrides the fake's predictions with a top probability of `0.95`
   so the intent — "only the highest evidence survives" — is actually exercised.
4. **Truncated text is echoed back.** For inputs longer than 5000 chars the
   response `text` field contains the 5000-char prefix that was actually
   embedded (with `"truncated": true`), so callers can verify what was inferred.
5. **Availability check runs before the empty-text short-circuit.** Empty /
   whitespace-only text returns `200` with `detected: []` when the model is
   loaded, but still `503` when the service is degraded — an unavailable
   service should not pretend everything is fine.
6. **Pass-through metadata keeps its source keys.** `value_meaning` and
   `default_value` are already snake_case; the hyphenated `"possible-values"`
   is preserved verbatim in responses (validation accepts both spellings).
   None of the three is ever interpreted by this service.
7. **No `APIRouter(prefix=...)`.** Unlike sibling services, the contract here
   is root-level (`POST /extract`), so routers only carry tags.
8. **Model load runs via `run_in_threadpool` inside the lifespan** so the
   event loop is not blocked during startup; any load failure degrades to
   `503` (`/health`) instead of crashing the container — including the
   class-count sanity check
   (`classifier.weight.shape[0] != len(eid_list)`), which is logged as ERROR
   with both numbers.
9. **`training_f1` / `training_epoch` are coerced** to `float` / `int`
   (checkpoints often store tensors) and returned as `null` when missing or
   uncoercible, per the spec (`checkpoint.get("f1")`, `checkpoint.get("epoch")`).
10. **`hmac.compare_digest`** is used for the API key comparison instead of
    `==` (constant-time; same behaviour, slightly safer). The `DEV_MODE`
    skip matches the spec and the existing dependency signature exactly.
11. **The Docker build sanity-checks both artefacts.** The spec required a
    `test -f best_model.pt` guard; the same guard is added for
    `evidence_list_clean.json` since the service is equally dead without it.
12. **First boot needs HuggingFace access** (or a pre-seeded cache): the
    `EvidenceClassifier` is preserved verbatim, so `BertModel.from_pretrained`
    / `BertTokenizer.from_pretrained` fetch the base model on first run.
    Mount a cache volume (e.g. `HF_HOME=/cache/hf`) to avoid re-downloads or
    to run air-gapped.
13. **Single uvicorn worker (no `--workers N`).** The model is an in-process
    singleton; scale horizontally by replicas, not threads-within-container.
    Inference itself is dispatched to the thread pool
    (`starlette.concurrency.run_in_threadpool`) — never to a process pool.
14. **`requirements.txt` also installs test deps into the image** (single
    file per spec). Accepted bloat (~few MB); split into
    `requirements-dev.txt` if it bothers anyone.
