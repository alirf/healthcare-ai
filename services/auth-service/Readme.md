# Auth Service

بخشی از سیستم Healthcare AI — مسئول ثبت‌نام، احراز هویت و صدور توکن کاربران.

## مشخصات

| مورد | مقدار |
|---|---|
| پورت (host — از بیرون) | `8001` |
| پورت (container — داخلی) | `8000` |
| آدرس پایه (local) | `http://localhost:8001` |
| مستندات Swagger | `http://localhost:8001/docs` |
| تکنولوژی | FastAPI + PostgreSQL + Redis |
| هش رمز عبور | Argon2id |
| توکن | JWT با RS256 (کلید private/public در `./keys`) |

> نکته: داخل کد و Dockerfile همیشه پورت `8000` استفاده می‌شه؛ `8001` فقط نگاشت بیرونی در `docker-compose.yml` است.

## Endpoints

| Method | Path | توضیح |
|---|---|---|
| POST | `/auth/register` | ثبت‌نام + ارسال OTP |
| POST | `/auth/verify-otp` | تایید OTP → صدور access/refresh token |
| POST | `/auth/login` | ورود با شماره + رمز عبور |
| GET | `/auth/me` | اطلاعات کاربر (نیاز به `Authorization: Bearer`) |
| POST | `/auth/refresh` | تمدید access token (refresh token قبلی باطل می‌شود) |
| POST | `/auth/logout` | خروج و ابطال refresh token |
| POST | `/auth/forgot-password` | درخواست OTP برای بازیابی رمز |
| POST | `/auth/reset-password` | تغییر رمز با OTP |

## متغیرهای محیطی ضروری (`.env`)

```dotenv
DATABASE_URL=postgresql://admin:changeme@postgres:5432/auth_db
REDIS_URL=redis://redis:6379
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
JWT_ACCESS_EXPIRATION=900       # 15 دقیقه
JWT_REFRESH_EXPIRATION=604800   # 7 روز
PORT=8000
```

## اجرا

```bash
docker compose up --build auth-service
```

برای اجرای مستقیم (بدون داکر):
```bash
pip install -r requirements.txt
python main.py
```

## نکات امنیتی مهم

- خطای «کاربر وجود ندارد» و «رمز اشتباه است» پیام یکسان دارند (جلوگیری از user enumeration).
- محدودیت نرخ: ۵ تلاش ورود در ۱۵ دقیقه، ۳ درخواست OTP در ۱۰ دقیقه (روی Redis).
- OTP به‌صورت SHA-256 هش می‌شود، نه متن ساده.
- Access token کوتاه‌عمر (۱۵ دقیقه)؛ هر تمدید، refresh token قبلی را باطل می‌کند.
- توکن‌های ابطال‌شده در Redis blacklist می‌شوند.
- کلید خصوصی JWT هرگز نباید وارد ایمیج داکر یا گیت شود — فقط از طریق volume در runtime mount می‌شود.