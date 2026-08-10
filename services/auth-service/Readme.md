# 📚 داکیومنت سرویس احراز هویت (Auth Service)

## Healthcare AI — سیستم ویزیت آنلاین

---

## ۱. معرفی سرویس

| مشخصه | مقدار |
|-------|-------|
| **نام سرویس** | Auth Service |
| **وظیفه** | مدیریت هویت، احراز هویت و کنترل دسترسی کاربران |
| **پورت** | 8001 |
| **آدرس پایه** | `http://localhost:8001` |
| **مستندات API** | `http://localhost:8001/docs` (Swagger UI) |
| **تکنولوژی** | FastAPI + Python + PostgreSQL + Redis |
| **الگوریتم توکن** | JWT با RS256 |

---

## ۲. معماری سرویس

```
┌─────────────────────────────────────────┐
│           Auth Service (Port 8001)      │
├─────────────────────────────────────────┤
│  ┌─────────────┐    ┌──────────────┐  │
│  │  FastAPI    │    │   JWT RS256  │  │
│  │  Router     │───►│   (Private)  │  │
│  └─────────────┘    └──────────────┘  │
│         │                               │
│  ┌─────────────┐    ┌──────────────┐  │
│  │  Service    │    │   Argon2id   │  │
│  │  Layer      │───►│   Hashing    │  │
│  └─────────────┘    └──────────────┘  │
│         │                               │
│  ┌─────────────┐    ┌──────────────┐  │
│  │  PostgreSQL │    │    Redis     │  │
│  │  (Users)    │    │  (RateLimit) │  │
│  └─────────────┘    └──────────────┘  │
└─────────────────────────────────────────┘
```

---

## ۳. مدل‌های داده

### ۳.۱ جدول کاربران (`users`)

| ستون | نوع | توضیحات |
|------|-----|---------|
| `id` | UUID | شناسه یکتای کاربر |
| `phone_number` | VARCHAR(20) | شماره موبایل (یکتا) |
| `email` | VARCHAR(255) | ایمیل (یکتا، اختیاری) |
| `password_hash` | TEXT | هش رمز عبور (Argon2id) |
| `role` | VARCHAR(20) | نقش: PATIENT / DOCTOR / ADMIN |
| `is_phone_verified` | BOOLEAN | وضعیت تایید شماره |
| `is_active` | BOOLEAN | وضعیت فعال بودن حساب |
| `created_at` | TIMESTAMPTZ | تاریخ ثبت‌نام |
| `updated_at` | TIMESTAMPTZ | تاریخ آخرین به‌روزرسانی |

### ۳.۲ جدول کدهای OTP (`otp_codes`)

| ستون | نوع | توضیحات |
|------|-----|---------|
| `id` | UUID | شناسه یکتا |
| `user_id` | UUID | شناسه کاربر |
| `phone_number` | VARCHAR(20) | شماره مقصد |
| `code_hash` | TEXT | هش کد OTP (SHA-256) |
| `purpose` | VARCHAR(20) | هدف: REGISTER / LOGIN / RESET_PASSWORD |
| `expires_at` | TIMESTAMPTZ | زمان انقضا |
| `is_used` | BOOLEAN | آیا استفاده شده؟ |

### ۳.۳ جدول توکن‌های Refresh (`refresh_tokens`)

| ستون | نوع | توضیحات |
|------|-----|---------|
| `id` | UUID | شناسه یکتا |
| `user_id` | UUID | شناسه کاربر |
| `token_hash` | TEXT | هش توکن |
| `device_info` | TEXT | اطلاعات دستگاه |
| `expires_at` | TIMESTAMPTZ | زمان انقضا |
| `revoked` | BOOLEAN | آیا ابطال شده؟ |

---

## ۴. API Endpoints

### ۴.۱ ثبت‌نام کاربر جدید

```
POST /auth/register
```

**Request:**
```json
{
  "phone_number": "09121234567",
  "password": "MySecurePass123",
  "email": "user@example.com",
  "role": "PATIENT"
}
```

**Response (201):**
```json
{
  "message": "کد تایید به شماره موبایل ارسال شد",
  "user_id": "7bf48862-74a9-4709-9c54-bbbb1c6ca303"
}
```

**خطاهای ممکن:**
| کد | خطا | توضیح |
|----|-----|-------|
| 409 | کاربر وجود دارد | شماره موبایل قبلاً ثبت شده |
| 429 | محدودیت نرخ | بیش از 3 OTP در 10 دقیقه |

---

### ۴.۲ تایید کد OTP

```
POST /auth/verify-otp
```

**Request:**
```json
{
  "phone_number": "09121234567",
  "code": "107065"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
  "expires_in": 900,
  "token_type": "bearer",
  "user": {
    "id": "7bf48862-74a9-4709-9c54-bbbb1c6ca303",
    "phone_number": "09121234567",
    "role": "PATIENT",
    "is_phone_verified": true
  }
}
```

---

### ۴.۳ ورود با رمز عبور

```
POST /auth/login
```

**Request:**
```json
{
  "phone_number": "09121234567",
  "password": "MySecurePass123"
}
```

**Response (200):** مشابه `verify-otp`

**نکات امنیتی:**
- پیام خطای یکسان برای «کاربر وجود ندارد» و «رمز اشتباه است»
- محدودیت 5 تلاش در 15 دقیقه

---

### ۴.۴ دریافت اطلاعات کاربر

```
GET /auth/me
```

**Header:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "7bf48862-74a9-4709-9c54-bbbb1c6ca303",
  "phone_number": "09121234567",
  "email": "user@example.com",
  "role": "PATIENT",
  "is_phone_verified": true,
  "is_active": true,
  "created_at": "2026-08-10T14:45:23"
}
```

---

### ۴.۵ تمدید Access Token

```
POST /auth/refresh
```

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
  "expires_in": 900,
  "token_type": "bearer",
  "user": { ... }
}
```

**نکته:** توکن قبلی ابطال و توکن جدید صادر می‌شود.

---

### ۴.۶ خروج از حساب

```
POST /auth/logout
```

**Header:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "message": "با موفقیت خارج شدید"
}
```

---

### ۴.۷ درخواست بازیابی رمز عبور

```
POST /auth/forgot-password
```

**Request:**
```json
{
  "phone_number": "09121234567",
  "purpose": "RESET_PASSWORD"
}
```

---

### ۴.۸ تغییر رمز عبور

```
POST /auth/reset-password
```

**Request:**
```json
{
  "phone_number": "09121234567",
  "code": "107065",
  "new_password": "NewSecurePass456"
}
```

---

## ۵. ساختار توکن JWT

### Access Token
```json
{
  "sub": "7bf48862-74a9-4709-9c54-bbbb1c6ca303",
  "role": "PATIENT",
  "phone_verified": true,
  "iat": 1786397181,
  "exp": 1786398081,
  "type": "access",
  "iss": "Healthcare Auth Service"
}
```

### Refresh Token
```json
{
  "sub": "7bf48862-74a9-4709-9c54-bbbb1c6ca303",
  "iat": 1786397181,
  "exp": 1787001981,
  "type": "refresh",
  "iss": "Healthcare Auth Service"
}
```

---

## ۶. مکانیزم‌های امنیتی

| مکانیزم | توضیحات |
|---------|---------|
| **Argon2id** | هش رمز عبور با الگوریتم برنده مسابقه Password Hashing Competition |
| **RS256** | امضای JWT با کلید خصوصی، تایید با کلید عمومی |
| **Rate Limiting** | 5 تلاش ورود / 3 OTP در 10 دقیقه |
| **User Enumeration Prevention** | پیام یکسان برای خطاهای ورود |
| **Token Blacklist** | ابطال توکن‌ها در Redis |
| **OTP Hashing** | کدهای OTP به صورت SHA-256 ذخیره می‌شوند |
| **Short-lived Access Token** | 15 دقیقه اعتبار |
| **Refresh Token Rotation** | تمدید = ابطال قدیمی + صدور جدید |

---

## ۷. نصب و راه‌اندازی

### ۷.۱ پیش‌نیازها
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker Desktop (اختیاری)

### ۷.۲ مراحل نصب

```bash
# ۱. کلون پروژه
git clone <repository-url>
cd healthcare-ai/services/auth-service

# ۲. محیط مجازی
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# ۳. نصب پکیج‌ها
pip install -r requirements.txt

# ۴. تنظیم متغیرهای محیطی (فایل .env)

# ۵. تولید کلیدهای RS256
mkdir keys
python -c "from cryptography.hazmat.primitives.asymmetric import rsa; from cryptography.hazmat.primitives import serialization; key = rsa.generate_private_key(public_exponent=65537, key_size=2048); open('keys/private.pem','wb').write(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())); open('keys/public.pem','wb').write(key.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo))"

# ۶. راه‌اندازی دیتابیس
docker-compose up -d  # یا PostgreSQL/Redis محلی

# ۷. اجرا
python main.py
```

---

## ۸. تست API

### ۸.۱ جریان کامل ثبت‌نام تا ورود

| مرحله | Endpoint | ورودی |
|-------|----------|-------|
| ۱ | `POST /auth/register` | شماره + رمز + نقش |
| ۲ | (دریافت OTP از ترمینال) | — |
| ۳ | `POST /auth/verify-otp` | شماره + کد |
| ۴ | (دریافت توکن) | — |
| ۵ | `GET /auth/me` | Bearer Token |
| ۶ | `POST /auth/login` | شماره + رمز |

### ۸.۲ تست با cURL

```bash
# ثبت‌نام
curl -X POST http://localhost:8001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"09121234567","password":"SecurePass123","role":"PATIENT"}'

# ورود
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"09121234567","password":"SecurePass123"}'

# اطلاعات کاربر
curl http://localhost:8001/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## ۹. نقشه راه توسعه

| ویژگی | وضعیت | اولویت |
|-------|-------|--------|
| ثبت‌نام + OTP | ✅ کامل | بالا |
| ورود با رمز | ✅ کامل | بالا |
| ورود با OTP | ✅ کامل | بالا |
| تمدید توکن | ✅ کامل | بالا |
| خروج + ابطال | ✅ کامل | بالا |
| بازیابی رمز | ✅ کامل | بالا |
| Rate Limiting | ✅ کامل | بالا |
| ارسال SMS واقعی | ⬜ نیاز به سرویس پیامک | متوسط |
| OAuth (Google) | ⬜ آینده | پایین |
| Two-Factor Auth | ⬜ آینده | پایین |

---

**نسخه:** 1.0.0  
**تاریخ آخرین به‌روزرسانی:** 2026-08-11  
**نویسنده:** تیم توسعه Healthcare AI

---
