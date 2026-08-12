# 🏥 Healthcare AI — User Profile Service
## Complete Documentation

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#tech-stack)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Authentication & Authorization](#auth)
7. [Internal API (Service-to-Service)](#internal-api)
8. [File Structure](#file-structure)
9. [Environment Variables](#env-vars)
10. [Docker Setup](#docker)
11. [Testing](#testing)
12. [Security Considerations](#security)
13. [HIPAA Compliance](#hipaa)

---

## 1. Overview {#overview}

The User Profile Service manages patient and doctor profiles in the Healthcare AI microservices ecosystem. It stores sensitive health information (PHI) including allergies, medications, and chronic conditions, while providing a condensed medical summary to AI Triage and Symptom Intake services.

### Key Responsibilities
- Patient profile management (demographics, health metrics)
- Allergy tracking with severity levels
- Current medication management
- Chronic condition monitoring
- Doctor profile management (specialty, license verification)
- Avatar upload to object storage (MinIO)
- Audit logging for HIPAA compliance
- Medical summary generation for AI services

---

## 2. Architecture {#architecture}

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Port 8080)                   │
│         JWT Validation | Rate Limit | Role Check            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              User Profile Service (Port 8002)                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Patient    │  │   Doctor    │  │  Internal Summary   │  │
│  │  Profiles   │  │  Profiles   │  │     Endpoint        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ PostgreSQL  │  │  MinIO/S3   │  │    Alembic Migs     │  │
│  │   (Data)    │  │  (Avatars)  │  │   (Migrations)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Communication Flow
1. **Client** → Gateway (JWT validated, rate limited)
2. **Gateway** → Profile Service (headers: `x-user-id`, `x-user-role`, `x-gateway-request: true`)
3. **Profile Service** → Trusts Gateway headers OR validates JWT locally
4. **Internal Services** → Profile Service (via `X-Internal-API-Key`)

---

## 3. Technology Stack {#tech-stack}

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | FastAPI | 0.111.0 |
| Server | Uvicorn | 0.30.0 |
| ORM | SQLAlchemy (async) | 2.0.31 |
| Database Driver | asyncpg | 0.29.0 |
| Migrations | Alembic | 1.13.2 |
| Validation | Pydantic | 2.8.2 |
| Settings | pydantic-settings | 2.3.4 |
| JWT | python-jose | 3.3.0 |
| Storage | boto3 (MinIO) | 1.34.0 |
| Testing | pytest + pytest-asyncio | 8.3.0 |

---

## 4. Database Schema {#database-schema}

### 4.1 Entity Relationship Diagram

```
patient_profiles ||--o{ patient_allergies : has
patient_profiles ||--o{ patient_current_medications : has
patient_profiles ||--o{ patient_chronic_conditions : has
doctor_profiles ||--o{ profile_audit_log : audited
```

### 4.2 Tables

#### patient_profiles
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PK | Links to Auth Service user |
| full_name | VARCHAR(100) | NOT NULL | Patient full name |
| birth_date | DATE | NOT NULL | Date of birth |
| gender | VARCHAR(10) | CHECK | male/female/other/prefer_not_to_say |
| height_cm | SMALLINT | CHECK(30-300) | Height in centimeters |
| weight_kg | SMALLINT | CHECK(1-500) | Weight in kilograms |
| blood_type | VARCHAR(5) | CHECK | A+/A-/B+/B-/AB+/AB-/O+/O- |
| phone | VARCHAR(20) | | Contact phone |
| emergency_contact_name | VARCHAR(100) | | Emergency contact |
| emergency_contact_phone | VARCHAR(20) | | Emergency phone |
| profile_image_url | TEXT | | Presigned URL to avatar |
| profile_image_key | TEXT | | MinIO object key |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

#### patient_allergies
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() | Unique ID |
| user_id | UUID | FK → patient_profiles | Patient reference |
| allergy_name | VARCHAR(100) | NOT NULL | Allergen name |
| severity | VARCHAR(20) | CHECK | mild/moderate/severe/life_threatening |
| reaction_description | TEXT | | Description of reaction |
| diagnosed_at | DATE | | When diagnosed |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

#### patient_current_medications
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique ID |
| user_id | UUID | FK → patient_profiles | Patient reference |
| medication_name | VARCHAR(150) | NOT NULL | Drug name |
| dosage | VARCHAR(50) | | e.g., "10mg" |
| frequency | VARCHAR(50) | | e.g., "twice daily" |
| prescribed_by | VARCHAR(100) | | Prescribing doctor |
| start_date | DATE | | Treatment start |
| end_date | DATE | | Treatment end |
| is_active | BOOLEAN | DEFAULT true | Currently taking? |
| notes | TEXT | | Additional notes |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

#### patient_chronic_conditions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique ID |
| user_id | UUID | FK → patient_profiles | Patient reference |
| condition_name | VARCHAR(150) | NOT NULL | Condition name |
| icd10_code | VARCHAR(10) | | ICD-10 medical code |
| diagnosed_at | DATE | | Diagnosis date |
| severity | VARCHAR(20) | CHECK | mild/moderate/severe |
| notes | TEXT | | Additional notes |
| is_active | BOOLEAN | DEFAULT true | Currently active? |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

#### doctor_profiles
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PK | Links to Auth Service user |
| full_name | VARCHAR(100) | NOT NULL | Doctor full name |
| specialty | VARCHAR(100) | NOT NULL | Medical specialty |
| medical_license_number | VARCHAR(50) | UNIQUE NOT NULL | License number |
| license_verified_at | TIMESTAMPTZ | | Verification timestamp |
| license_verified_by | UUID | | Admin who verified |
| education | TEXT | | JSON array of degrees |
| years_of_experience | SMALLINT | | Years practicing |
| hospital_affiliations | TEXT | | JSON array |
| phone | VARCHAR(20) | | Contact phone |
| office_address | TEXT | | Office location |
| profile_image_url | TEXT | | Presigned URL |
| profile_image_key | TEXT | | MinIO object key |
| is_verified | BOOLEAN | DEFAULT false | License verified? |
| is_active | BOOLEAN | DEFAULT true | Active doctor? |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

#### profile_audit_log
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique ID |
| user_id | UUID | NOT NULL | Patient/Doctor affected |
| action | VARCHAR(50) | NOT NULL | create/update/delete/view |
| table_name | VARCHAR(50) | NOT NULL | Table affected |
| record_id | UUID | | Specific record |
| old_values | JSONB | | Previous values |
| new_values | JSONB | | New values |
| performed_by | UUID | NOT NULL | Who made the change |
| performed_at | TIMESTAMPTZ | DEFAULT now() | When |
| ip_address | INET | | Client IP |
| user_agent | TEXT | | Client user agent |

---

## 5. API Reference {#api-reference}

### 5.1 Patient Endpoints

All patient endpoints require `role: PATIENT` in JWT.

#### Get My Profile
```http
GET /api/profile/patient/me
Authorization: Bearer <jwt_token>
```
**Response 200:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "Ali Ahmadi",
  "birth_date": "1990-05-15",
  "gender": "male",
  "height_cm": 175,
  "weight_kg": 70,
  "blood_type": "O+",
  "phone": "+989123456789",
  "emergency_contact_name": "Reza Ahmadi",
  "emergency_contact_phone": "+989987654321",
  "profile_image_url": "https://minio/avatars/...",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:22:00Z",
  "allergies": [...],
  "medications": [...],
  "conditions": [...]
}
```

#### Create Profile
```http
POST /api/profile/patient/me
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "full_name": "Ali Ahmadi",
  "birth_date": "1990-05-15",
  "gender": "male",
  "height_cm": 175,
  "weight_kg": 70,
  "blood_type": "O+",
  "phone": "+989123456789",
  "emergency_contact_name": "Reza Ahmadi",
  "emergency_contact_phone": "+989987654321"
}
```
**Response 201:** Created profile object
**Response 409:** Profile already exists

#### Update Profile
```http
PUT /api/profile/patient/me
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "height_cm": 176,
  "weight_kg": 72
}
```
**Response 200:** Updated profile (partial update supported)

#### Add Allergy
```http
POST /api/profile/patient/me/allergies
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "allergy_name": "Penicillin",
  "severity": "severe",
  "reaction_description": "Difficulty breathing, skin rash",
  "diagnosed_at": "2015-03-10"
}
```
**Response 201:** Created allergy
**Response 409:** Duplicate allergy

#### Update Allergy
```http
PUT /api/profile/patient/me/allergies/{allergy_id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "severity": "life_threatening"
}
```

#### Delete Allergy
```http
DELETE /api/profile/patient/me/allergies/{allergy_id}
Authorization: Bearer <jwt_token>
```
**Response 204:** No content

#### Add Medication
```http
POST /api/profile/patient/me/medications
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "medication_name": "Lisinopril",
  "dosage": "10mg",
  "frequency": "once daily",
  "prescribed_by": "Dr. Smith",
  "start_date": "2024-01-01",
  "notes": "Take in the morning"
}
```

#### Add Condition
```http
POST /api/profile/patient/me/conditions
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "condition_name": "Hypertension",
  "icd10_code": "I10",
  "diagnosed_at": "2020-06-15",
  "severity": "moderate",
  "notes": "Controlled with medication"
}
```

#### Upload Avatar
```http
POST /api/profile/patient/me/avatar
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

image: <file>
```
**Constraints:**
- Max size: 5MB
- Allowed types: JPEG, PNG, WebP
- Returns presigned URL valid for 7 days

**Response 200:**
```json
{
  "profile_image_url": "https://minio:9000/profile-images/avatars/patients/..."
}
```

### 5.2 Doctor Endpoints

All doctor endpoints require `role: DOCTOR` in JWT.

#### Get My Doctor Profile
```http
GET /api/profile/doctor/me
Authorization: Bearer <jwt_token>
```

#### Create Doctor Profile
```http
POST /api/profile/doctor/me
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "full_name": "Dr. Sarah Johnson",
  "specialty": "Cardiology",
  "medical_license_number": "MD12345678",
  "years_of_experience": 15,
  "phone": "+989123456789",
  "office_address": "123 Medical Center Dr"
}
```

#### Update Doctor Profile
```http
PUT /api/profile/doctor/me
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "phone": "+989987654321"
}
```

---

## 6. Authentication & Authorization {#auth}

### Dual Authentication Strategy

The Profile Service supports two authentication modes:

#### Mode 1: Gateway Trust (Production)
When request comes through API Gateway:
- Gateway validates JWT
- Gateway adds headers: `x-user-id`, `x-user-role`, `x-gateway-request: true`
- Profile Service trusts these headers (skips JWT validation)
- **Fastest** — no double JWT decode

#### Mode 2: Direct JWT (Testing/Development)
When accessing Profile Service directly:
- Profile Service validates JWT using RS256 public key
- Requires `Authorization: Bearer <token>` header
- **Slower** but secure for direct access

### Role-Based Access Control (RBAC)

| Endpoint | Required Role |
|----------|--------------|
| `/api/profile/patient/*` | PATIENT |
| `/api/profile/doctor/*` | DOCTOR |
| `/internal/profile/*` | Internal API Key only |

---

## 7. Internal API (Service-to-Service) {#internal-api}

Internal endpoints are **NOT** exposed through API Gateway. They use `X-Internal-API-Key` header.

### Get Medical Summary
```http
GET /internal/profile/patient/{user_id}/summary
X-Internal-API-Key: <shared_secret>
```

**Response 200:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "Ali Ahmadi",
  "age": 34,
  "gender": "male",
  "bmi": 22.9,
  "blood_type": "O+",
  "allergies": [
    {"name": "Penicillin", "severity": "severe"}
  ],
  "current_medications": [
    {"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily", "prescribed_by": "Dr. Smith"}
  ],
  "chronic_conditions": [
    {"name": "Hypertension", "severity": "moderate", "icd10_code": "I10"}
  ]
}
```

**Usage:** Called automatically by AI Triage at start of each consultation.

### Check Profile Exists
```http
GET /internal/profile/patient/{user_id}/exists
X-Internal-API-Key: <shared_secret>
```

**Response 200:**
```json
{"exists": true}
```

### Get Doctor Profile
```http
GET /internal/profile/doctor/{user_id}
X-Internal-API-Key: <shared_secret>
```

---

## 8. File Structure {#file-structure}

```
user-profile-service/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app factory
│   ├── config.py               # Pydantic settings
│   ├── database.py             # SQLAlchemy async engine
│   ├── exceptions.py           # Custom HTTP exceptions
│   ├── models/
│   │   ├── __init__.py
│   │   ├── patient.py          # PatientProfile, Allergy, Medication, Condition
│   │   ├── doctor.py           # DoctorProfile
│   │   └── audit.py            # ProfileAuditLog
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── patient.py          # Pydantic models for patient
│   │   └── doctor.py           # Pydantic models for doctor
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── patient.py          # Patient endpoints
│   │   ├── doctor.py           # Doctor endpoints
│   │   └── internal.py         # Internal service endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── profile_service.py  # Business logic
│   │   ├── storage_service.py  # MinIO/S3 operations
│   │   └── audit_service.py    # HIPAA audit logging
│   ├── dependencies/
│   │   ├── __init__.py
│   │   ├── auth.py             # JWT validation + Gateway trust
│   │   └── db.py               # DB session utilities
│   └── utils/
│       ├── __init__.py
│       └── helpers.py          # Age/BMI calculations
├── alembic/
│   ├── versions/
│   │   ├── __init__.py
│   │   └── 001_initial_migration.py
│   └── env.py                  # Async alembic config
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # Pytest fixtures
│   ├── test_patient.py         # Patient endpoint tests
│   └── test_internal.py        # Internal API tests
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── alembic.ini
└── .env.example
```

---

## 9. Environment Variables {#env-vars}

### Required

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL async connection string |
| `JWT_PUBLIC_KEY_PATH` | `./keys/public.pem` | Path to RSA public key |
| `JWT_ALGORITHM` | `RS256` | JWT signing algorithm |
| `INTERNAL_API_KEY` | — | Shared secret for service-to-service |

### Object Storage (MinIO)

| Variable | Default | Description |
|----------|---------|-------------|
| `MINIO_ENDPOINT` | `minio:9000` | MinIO server address |
| `MINIO_ACCESS_KEY` | — | Access key |
| `MINIO_SECRET_KEY` | — | Secret key |
| `MINIO_BUCKET_NAME` | `profile-images` | Bucket for avatars |
| `MINIO_SECURE` | `false` | Use HTTPS? |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `false` | Enable debug mode |
| `APP_NAME` | `User Profile Service` | Service name |
| `MAX_AVATAR_SIZE_MB` | `5` | Max upload size |
| `ALLOWED_IMAGE_TYPES` | `image/jpeg,image/png,image/webp` | Valid MIME types |

---

## 10. Docker Setup {#docker}

### Build & Run

```bash
# Create network
docker network create healthcare-network

# Start all services
docker-compose up --build

# Or start only profile service
docker-compose up --build profile-service
```

### Service Ports

| Service | External Port | Internal Port |
|---------|--------------|---------------|
| API Gateway | 8080 | 8080 |
| Auth Service | 3001 | 3001 |
| Profile Service | 3002 | 8002 |
| PostgreSQL (Auth) | 5432 | 5432 |
| PostgreSQL (Profile) | — | 5432 |
| Redis | 6379 | 6379 |
| MinIO API | 9000 | 9000 |
| MinIO Console | 9001 | 9001 |

---

## 11. Testing {#testing}

### Run Tests

```bash
# Install dev dependencies
pip install -r requirements.txt

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

### Test Structure

| File | Coverage |
|------|----------|
| `test_patient.py` | CRUD operations, allergies, medications, conditions, avatar |
| `test_internal.py` | Internal API key validation, medical summary |

### Mock JWT for Testing

```python
# conftest.py
@pytest.fixture
def mock_patient_token():
    return {
        "sub": "550e8400-e29b-41d4-a716-446655440000",
        "roles": ["patient"],
        "email": "patient@example.com",
    }
```

---

## 12. Security Considerations {#security}

### Defense in Depth

| Layer | Implementation |
|-------|---------------|
| **Transport** | TLS 1.3 (HTTPS) |
| **Authentication** | JWT RS256 + Gateway trust headers |
| **Authorization** | Role-based (PATIENT/DOCTOR/ADMIN) |
| **Input Validation** | Pydantic + SQL CHECK constraints |
| **SQL Injection** | SQLAlchemy ORM (parameterized) |
| **File Upload** | MIME whitelist, size limit, random filename |
| **Rate Limiting** | Per-user (Gateway level) |
| **Internal API** | Shared secret + IP whitelist |

### File Upload Security
- **Type validation:** Whitelist JPEG, PNG, WebP
- **Size limit:** 5MB max
- **Random filename:** UUID-based, prevents path traversal
- **Presigned URLs:** 7-day expiration
- **Old avatar deletion:** Automatic cleanup on new upload

---

## 13. HIPAA Compliance {#hipaa}

### Audit Logging

Every access to PHI is logged:

| Action | Logged |
|--------|--------|
| View profile | ✅ user_id, ip, timestamp |
| Create record | ✅ old=null, new=values |
| Update record | ✅ old=values, new=values |
| Delete record | ✅ old=values, new=null |
| Upload avatar | ✅ old_url, new_url |

### Audit Log Retention
- Minimum: 6 years (HIPAA requirement)
- Storage: PostgreSQL JSONB (queryable)
- Backup: Encrypted, separate from application data

### Data Encryption
- **At rest:** PostgreSQL encryption + volume encryption
- **In transit:** TLS 1.3
- **Backups:** Encrypted with AES-256

---

## 🔗 Integration with Other Services

### AI Triage Service
```python
# At start of consultation
async def start_consultation(user_id: UUID):
    summary = await profile_client.get_medical_summary(user_id)
    # summary includes allergies, medications, conditions
    # passed to LLM as system context
```

### Symptom Intake Service
```python
# Pre-fill known information
async def get_intake_context(user_id: UUID):
    profile = await profile_client.get_patient_summary(user_id)
    return {
        "known_allergies": profile.allergies,
        "current_medications": profile.medications,
        "chronic_conditions": profile.conditions,
    }
```

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Async](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [Alembic Migrations](https://alembic.sqlalchemy.org/)
- [MinIO Python SDK](https://min.io/docs/minio/linux/developers/python/API.html)
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/index.html)

---

*Generated for Healthcare AI Microservices Project*
*Version: 1.0.0*
*Last Updated: 2026-08-12*
