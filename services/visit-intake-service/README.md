# Visit Intake Service

Healthcare AI microservice that manages the full lifecycle of an online consultation.

## Data model

| Table | Purpose |
|---|---|
| `visits` | One consultation session (patient, optional doctor, optional `medical_record_id`, status, timestamps) |
| `visit_messages` | Patient intake messages — text and/or file attachment (file bytes in MinIO `visit-files` bucket) |
| `visit_symptoms` | Symptoms with `source = manual \| ai`, severity, body part, onset, confidence, model version |
| `ai_disease_suggestions` | Probable diseases from the AI diagnostic service + doctor decision (accepted/rejected) |
| `ai_prescription_drafts` | AI-written prescription drafts for the doctor (old drafts become `superseded`) |
| `chat_messages` | Doctor-patient chat during the consultation |
| `final_prescriptions` + `prescription_items` | Final prescription issued by the doctor (one per visit) |

### Visit lifecycle

```
intake → ai_processing → doctor_assigned → in_chat → prescription_pending → completed → closed
   └──────────────→ cancelled (from early states)
```

- Patient creates a visit, sends messages (text/file), selects symptoms, then `POST /visits/{id}/submit`.
- AI services (internal API key) read the context, push detected symptoms / disease suggestions / prescription draft, then set status `doctor_assigned`.
- Doctor claims the visit from the queue → chat opens → doctor accepts/rejects suggestions → issues the final prescription → visit `completed`.

## Run locally

```bash
cd services/visit-intake-service
python -m venv .venv && .venv/Scripts/activate   # Windows
pip install -r requirements.txt
copy .env.example .env

# create the database (database-per-service)
docker exec -it postgres psql -U postgres -c "CREATE DATABASE visits_db;"

alembic upgrade head
uvicorn app.main:app --reload --port 8004
```

## Docker Compose (add to root docker-compose.yml)

```yaml
visit-intake-service:
  build: ./services/visit-intake-service
  container_name: visit-intake-service
  env_file: ./services/visit-intake-service/.env
  ports:
    - "8004:8000"
  volumes:
    - ./keys:/app/keys:ro
  depends_on:
    - postgres
    - minio
  networks:
    - healthcare-network
```

## Tests

```bash
pytest tests/ -v
```

Auth in tests uses trusted gateway headers (`x-gateway-request: true`, `x-user-id`, `x-user-role`), so no JWT is needed.
