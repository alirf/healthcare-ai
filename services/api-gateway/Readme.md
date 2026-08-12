# 🏥 Healthcare AI - API Gateway

> **نقطه ورود مرکزی سیستم ویزیت آنلاین**  
> Single Entry Point برای تمام سرویس‌های میکروسرویس Healthcare AI

---

## 📋 فهرست مطالب

- [معرفی](#معرفی)
- [معماری](#معماری)
- [مسئولیت‌ها](#مسئولیتها)
- [جدول مسیریابی](#جدول-مسیریابی)
- [نصب و راه‌اندازی](#نصب-و-راهاندازی)
- [متغیرهای محیطی](#متغیرهای-محیطی)
- [میان‌افزارها](#میانافزارها)
- [تست‌ها](#تستها)
- [ساختار پروژه](#ساختار-پروژه)
- [سرویس‌های متصل](#سرویسهای-متصل)
- [نکات امنیتی](#نکات-امنیتی)
- [توسعه‌دهندگان](#توسعهدهندگان)

---

## 🎯 معرفی

API Gateway تنها نقطه ورود عمومی سیستم Healthcare AI است. تمام درخواست‌های کلاینت‌ها (اپ بیمار و اپ پزشک) از این Gateway عبور می‌کنند و به سرویس داخلی مناسب هدایت می‌شوند.

### چرا API Gateway؟

- ✅ **یکپارچگی** - یک نقطه ورود واحد برای همه کلاینت‌ها
- ✅ **امنیت** - اعتبارسنجی JWT در یک نقطه متمرکز
- ✅ **محدودیت نرخ** - جلوگیری از سوءاستفاده و حملات
- ✅ **لاگ‌گیری** - ثبت متمرکز تمام درخواست‌ها
- ✅ **مسیریابی** - هدایت هوشمند به سرویس‌های داخلی

---

## 🏗️ معماری

```
┌─────────────────┐
│   Client Apps   │
│ (Patient/Doctor)│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         🔐 API Gateway              │
│  ┌─────────────────────────────┐   │
│  │  • JWT Validation           │   │
│  │  • Rate Limiting (Redis)    │   │
│  │  • Role-Based Access        │   │
│  │  • Centralized Logging      │   │
│  │  • CORS Management          │   │
│  └─────────────────────────────┘   │
└────────┬────────┬────────┬─────────┘
         │        │        │
         ▼        ▼        ▼
    ┌────────┐ ┌─────┐ ┌──────────┐
    │  Auth  │ │ ... │ │  Profile │
    │Service │ │     │ │ Service  │
    │ :3001  │ │     │ │  :3002   │
    └────────┘ └─────┘ └──────────┘
```

---

## ⚡ مسئولیت‌ها

| مسئولیت | توضیح | وضعیت |
|---------|-------|-------|
| **Routing** | هدایت درخواست‌ها به سرویس داخلی مناسب | ✅ |
| **JWT Validation** | اعتبارسنجی توکن با کلید عمومی RS256 | ✅ |
| **Rate Limiting** | محدودیت نرخ درخواست با Redis | ✅ |
| **Logging** | ثبت متمرکز لاگ‌ها با زمان پاسخ | ✅ |
| **CORS** | مدیریت Cross-Origin Resource Sharing | ✅ |
| **Role Checking** | بررسی دسترسی بر اساس نقش کاربر | ✅ |
| **Circuit Breaker** | قطع سریع در صورت down شدن سرویس | 🔄 آینده |

---

## 🗺️ جدول مسیریابی

| مسیر | سرویس مقصد | پورت | دسترسی |
|------|-----------|------|--------|
| `/api/auth/**` | Auth Service | 3001 | عمومی/احراز هویت‌شده |
| `/api/patients/**` | Profile Service | 3002 | احراز هویت‌شده |
| `/api/intake/**` | Symptom Intake Service | 3003 | احراز هویت‌شده |
| `/api/doctor-review/**` | Doctor Review Service | 3005 | فقط DOCTOR/ADMIN |
| `/api/prescriptions/**` | Prescription Service | 3006 | فقط DOCTOR/ADMIN |
| `/api/notifications/**` | Notification Service | 3007 | احراز هویت‌شده |
| `/api/triage/**` | AI Triage Service | 3004 | 🚫 فقط داخلی |

> ⚠️ **نکته:** مسیرهای `/api/triage/**` فقط بین سرویس‌ها قابل دسترسی هستند و از بیرون expose نشده‌اند.

---

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها

- Docker & Docker Compose
- Python 3.11+ (برای توسعه محلی)
- Redis
- کلیدهای RSA (در پوشه `keys/`)

### راه‌اندازی با Docker Compose

```bash
# از روت پروژه
docker-compose up --build -d

# بررسی وضعیت سرویس‌ها
docker-compose ps

# مشاهده لاگ‌ها
docker-compose logs -f api-gateway
```

### راه‌اندازی محلی (توسعه)

```bash
# وارد پوشه Gateway
cd api-gateway

# ساخت محیط مجازی
python -m venv venv
source venv/bin/activate  # Linux/Mac
# یا
venv\\Scripts\\activate  # Windows

# نصب وابستگی‌ها
pip install -r requirements.txt

# کپی کلید عمومی
mkdir -p keys
cp ../keys/public.pem keys/

# اجرا
uvicorn app.main:app --reload --port 8080
```

### بررسی سلامتی

```bash
curl http://localhost:8080/health
```

**پاسخ:**
```json
{
  "status": "healthy",
  "service": "api-gateway",
  "version": "1.0.0"
}
```

---

## 🔧 متغیرهای محیطی

فایل `.env` را در پوشه `api-gateway/` بسازید:

```env
# ─── Gateway ─────────────────────────
GATEWAY_PORT=8080
GATEWAY_HOST=0.0.0.0

# ─── Redis ───────────────────────────
REDIS_URL=redis://localhost:6379

# ─── Services ────────────────────────
AUTH_SERVICE_URL=http://localhost:3001
# PROFILE_SERVICE_URL=http://localhost:3002
# INTAKE_SERVICE_URL=http://localhost:3003

# ─── JWT ─────────────────────────────
PUBLIC_KEY_PATH=keys/public.pem

# ─── Rate Limiting ───────────────────
RATE_LIMIT_PUBLIC=10       # درخواست/دقیقه (IP-based)
RATE_LIMIT_AUTH=60         # درخواست/دقیقه (user-based)
RATE_LIMIT_AI_TRIAGE=5     # درخواست/دقیقه (AI Triage)

# ─── CORS ────────────────────────────
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

---

## 🛡️ میان‌افزارها

### ۱. JWT Validation

توکن JWT را با کلید عمومی RS256 اعتبارسنجی می‌کند. اطلاعات کاربر در هدرهای داخلی ارسال می‌شود:

```
x-user-id: <user_id>
x-user-role: <PATIENT|DOCTOR|ADMIN>
```

### ۲. Rate Limiting

| نوع مسیر | محدودیت | شناسه |
|----------|---------|-------|
| عمومی (لاگین/ثبت‌نام) | 10 درخواست/دقیقه | IP Address |
| احراز هویت‌شده | 60 درخواست/دقیقه | User ID |
| AI Triage | 5 درخواست/دقیقه | User ID |

**پاسخ در صورت عبور:**
```json
{
  "detail": "تعداد درخواست‌ها بیش از حد مجاز است",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 45
}
```

### ۳. Role Checker

مسیرهای محافظت‌شده بر اساس نقش:

| مسیر | نقش‌های مجاز |
|------|-------------|
| `/api/doctor-review/**` | `DOCTOR`, `ADMIN` |
| `/api/prescriptions/create` | `DOCTOR`, `ADMIN` |
| `/api/admin/**` | `ADMIN` |

**پاسخ در صورت عدم دسترسی:**
```json
{
  "detail": "شما اجازه دسترسی به این منبع را ندارید",
  "code": "FORBIDDEN",
  "required_roles": ["DOCTOR", "ADMIN"],
  "your_role": "PATIENT"
}
```

### ۴. Logging

تمام درخواست‌ها به صورت JSON لاگ می‌شوند:

```json
{
  "timestamp": "2026-08-11T14:30:00",
  "method": "POST",
  "path": "/api/auth/login",
  "status_code": 200,
  "process_time_ms": 45.23,
  "client_ip": "192.168.1.100",
  "user_id": "anonymous",
  "user_role": "none",
  "user_agent": "Mozilla/5.0..."
}
```

---

## 🧪 تست‌ها

### تست‌های دستی با cURL

#### ۱. سلامتی Gateway
```bash
curl http://localhost:8080/health
```

#### ۲. ثبت‌نام
```bash
curl -X POST http://localhost:8080/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "09123456789",
    "password": "Test123!",
    "role": "PATIENT"
  }'
```

#### ۳. لاگین
```bash
curl -X POST http://localhost:8080/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "09123456789",
    "password": "Test123!"
  }'
```

#### ۴. دسترسی با توکن
```bash
curl http://localhost:8080/api/auth/profile \\
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### ۵. دسترسی بدون توکن (باید 401 بدهد)
```bash
curl http://localhost:8080/api/auth/profile
```

#### ۶. تست Rate Limit
```bash
for i in {1..12}; do
  curl -X POST http://localhost:8080/api/auth/login \\
    -H "Content-Type: application/json" \\
    -d '{"phone":"09123456789","password":"wrong"}'
done
```

#### ۷. تست دسترسی بیمار به مسیر پزشک
```bash
curl http://localhost:8080/api/doctor-review/pending \\
  -H "Authorization: Bearer <PATIENT_TOKEN>"
```

### سناریوهای End-to-End

| # | سناریو | نتیجه مورد انتظار |
|---|--------|-------------------|
| 1 | ثبت‌نام → OTP → تایید → توکن | `201` → `200` → `200` + tokens |
| 2 | ورود با رمز صحیح / نادرست | `200` / `401` |
| 3 | دسترسی بدون توکن | `401 MISSING_TOKEN` |
| 4 | دسترسی با توکن منقضی | `401 TOKEN_EXPIRED` |
| 5 | Refresh Token → Access Token جدید | `200` + new token |
| 6 | Logout → استفاده مجدد از Refresh | `200` → `401` blacklisted |
| 7 | عبور از Rate Limit | `429 RATE_LIMIT_EXCEEDED` |
| 8 | بیمار به مسیر پزشک | `403 FORBIDDEN` |

---

## 📁 ساختار پروژه

```
api-gateway/
├── app/
│   ├── __init__.py
│   ├── main.py                    # نقطه ورود FastAPI
│   ├── config.py                  # تنظیمات و متغیرهای محیطی
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── jwt_validation.py      # اعتبارسنجی JWT
│   │   ├── rate_limiter.py        # محدودیت نرخ (Redis)
│   │   ├── logging_middleware.py  # لاگ‌گیری متمرکز
│   │   └── role_checker.py        # بررسی نقش کاربر
│   ├── router/
│   │   ├── __init__.py
│   │   └── proxy.py               # پروکسی و مسیریابی
│   └── utils/
│       ├── __init__.py
│       └── redis_client.py        # کلاینت Redis
├── keys/
│   └── public.pem                 # کلید عمومی RS256
├── Dockerfile
├── requirements.txt
└── .env                           # متغیرهای محیطی
```

---

## 🔗 سرویس‌های متصل

| سرویس | وضعیت | پورت | مسیر |
|-------|-------|------|------|
| Auth Service | ✅ فعال | 3001 | `/api/auth/**` |
| Profile Service | 🔄 آینده | 3002 | `/api/patients/**` |
| Symptom Intake | 🔄 آینده | 3003 | `/api/intake/**` |
| AI Triage | 🔄 آینده | 3004 | `/api/triage/**` (internal) |
| Doctor Review | 🔄 آینده | 3005 | `/api/doctor-review/**` |
| Prescription | 🔄 آینده | 3006 | `/api/prescriptions/**` |
| Notification | 🔄 آینده | 3007 | `/api/notifications/**` |

---

## 🔒 نکات امنیتی

- **کلید عمومی RS256** برای اعتبارسنجی JWT استفاده می‌شود (بدون نیاز به کلید خصوصی)
- **هدر Authorization** از درخواست‌های داخلی حذف می‌شود
- **هدرهای `x-user-id` و `x-user-role`** به سرویس‌های داخلی ارسال می‌شوند
- **شبکه داخلی Docker** از دسترسی مستقیم به سرویس‌ها جلوگیری می‌کند
- **Rate Limiting** با Redis در سطح IP و User اعمال می‌شود
- **CORS** فقط برای originهای مجاز فعال است

---

## 📚 مستندات API

- **Swagger UI:** `http://localhost:8080/docs`
- **ReDoc:** `http://localhost:8080/redoc`
- **OpenAPI JSON:** `http://localhost:8080/openapi.json`

---

## 🛠️ توسعه‌دهندگان

| نام | نقش |
|-----|-----|
| [نام شما] | معمار و توسعه‌دهنده اصلی |

---

## 📄 لایسنس

این پروژه متعلق به تیم Healthcare AI است.

---

<div align="center">

**🚀 Healthcare AI - API Gateway v1.0.0**

*ساخته شده با ❤️ و FastAPI*

</div>