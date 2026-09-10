# Medical Record Service (پرونده‌های پزشکی)

سرویس پرونده پزشکی بیمار — پورت **8005** — دیتابیس **medical_records_db** (اصل database-per-service).

## سناریو
بیمار سکته قلبی می‌کند → یک پرونده (`record_type=heart_attack`) باز می‌شود → بیمار با چند پزشک مختلف
روی همین پرونده ویزیت می‌شود → ماه‌ها بعد برمی‌گردد و روی همان پرونده ویزیت جدید انجام می‌دهد.

ویزیت‌ها در `visit-intake-service` زندگی می‌کنند؛ اینجا فقط junction (`record_visits`) با UUID نگه داشته می‌شود
(بدون Foreign Key بین دیتابیس‌ها). فایل‌ها (نتیجه آزمایش، تصویر) در باکت MinIO به نام `medical-records` با presigned URL.

## ساختار
```
app/
  config.py            # Settings (DATABASE_URL, MinIO, INTERNAL_API_KEY, ...)
  database.py          # async engine + get_db
  exceptions.py
  dependencies/auth.py # trusted gateway headers + JWT RS256 fallback + require_role + verify_internal_api_key
  models/record.py     # MedicalRecord, RecordVisit, RecordFile
  schemas/record.py
  services/record_service.py   # منطق اصلی + لینک ویزیت + فایل‌ها + نمای دکتر
  services/storage_service.py  # MinIO (باکت medical-records)
  routers/patient.py   # /records/*
  routers/doctor.py    # /doctor/records/* (حداقلی)
  routers/internal.py  # /internal/records/* (فقط با X-Internal-API-Key)
alembic/               # revision 001
tests/                 # sqlite in-memory + هدرهای gateway (بدون JWT)
```

## اجرا (لوکال)
```powershell
cd D:\med\healthcare-ai\services\medical-record-service
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# ساخت دیتابیس
docker run -d --name medical-records-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=medical_records_db -p 5435:5432 postgres:15-alpine

copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8005
```

## تست
```powershell
pytest -v
```

## اندپوینت‌ها

### بیمار (`/records`)
| Method | Path | توضیح |
|---|---|---|
| POST | `/records` | ساخت پرونده |
| GET | `/records` | لیست پرونده‌های من (`?status_filter=active`) |
| GET | `/records/{id}` | جزئیات + ویزیت‌ها + فایل‌ها (URL تازه) |
| PUT | `/records/{id}` | ویرایش |
| POST | `/records/{id}/close` | بستن (active/archived → closed) |
| POST | `/records/{id}/archive` | بایگانی |
| POST | `/records/{id}/files` | آپلود فایل (multipart + description) |
| GET | `/records/{id}/files` | لیست فایل‌ها |
| DELETE | `/records/{id}/files/{file_id}` | حذف فایل |

### دکتر (`/doctor/records`) — حداقلی
| GET | `/doctor/records` | پرونده بیمارانی که ویزیت‌شان به او تخصیص یافته (از visit-intake) |
| GET | `/doctor/records/{id}` | جزئیات پرونده (فقط بیماران درمان‌شده) |

### داخلی (`/internal/records` — فقط X-Internal-API-Key)
| GET | `/internal/records/patient/{patient_id}` | لیست پرونده‌های بیمار + exists |
| GET | `/internal/records/patient/{patient_id}/exists` | بررسی وجود |
| GET | `/internal/records/{record_id}/exists` | بررسی وجود پرونده |
| GET | `/internal/records/{record_id}/visits` | ویزیت‌های لینک‌شده |
| POST | `/internal/records/{record_id}/visits` | لینک ویزیت `{visit_id, patient_id, added_by?}` |

## انتقال‌های وضعیت پرونده
`active → archived → closed` ، `active → closed` ، `archived → active/closed` — `closed` نهایی است.
