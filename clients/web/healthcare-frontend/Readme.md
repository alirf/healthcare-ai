# 🏥 سلامت هوشمند - داشبورد بیمار

> پلتفرم ویزیت آنلاین پزشکی با تحلیل هوشمند شرح حال توسط AI

---

## 📋 فهرست مطالب

- [معرفی](#-معرفی)
- [تکنولوژی‌ها](#-تکنولوژیها)
- [نصب و راه‌اندازی](#-نصب-و-راهاندازی)
- [ساختار پروژه](#-ساختار-پروژه)
- [راهنمای توسعه](#-راهنمای-توسعه)
- [راهنمای تغییرات UI](#-راهنمای-تغییرات-ui)
- [اتصال به API Gateway](#-اتصال-به-api-gateway)
- [تعریف رنگ‌ها](#-تعریف-رنگها)
- [عیب‌یابی](#-عیبیابی)

---

## 🎯 معرفی

این پروژه، رابط کاربری (Frontend) پلتفرم **سلامت هوشمند** است که برای بیماران طراحی شده. بیماران می‌توانند از طریق این داشبورد:

- ✅ ویزیت آنلاین با پزشکان متخصص داشته باشند
- 🤖 با هوش مصنوعی گفتگو کنند و شرح حال بدهند
- 💊 از داروخانه آنلاین خرید کنند
- 📋 پرونده پزشکی و سوابق خود را ببینند
- 💰 موجودی کیف پول خود را مدیریت کنند
- 📅 نوبت‌های پزشکی ثبت کنند

---

## 🛠️ تکنولوژی‌ها

| لایه | تکنولوژی | نسخه |
|------|----------|------|
| **Framework** | Next.js (App Router) | 16.3.0 |
| **Language** | TypeScript | 5.7 |
| **Styling** | Tailwind CSS | 4.0 |
| **UI Components** | shadcn/ui (Base UI) | latest |
| **State Management** | Zustand | 5.0 |
| **Animation** | Framer Motion | 11.0 |
| **Icons** | Lucide React | 0.460 |
| **Font** | Vazirmatn (فارسی) | - |
| **Theme** | next-themes | 0.4 |

---

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها

- Node.js ≥ 20
- npm ≥ 10
- API Gateway در حال اجرا (اختیاری برای تست)

### مراحل نصب

```bash
# 1. کلون پروژه
git clone <repo-url>
cd healthcare-frontend

# 2. نصب وابستگی‌ها
npm install

# 3. تنظیم متغیرهای محیطی
# فایل .env.local بساز و این‌ها رو بنویس:
# API_GATEWAY_URL=http://localhost:8000

# 4. اجرای سرور توسعه
npm run dev
```

### دسترسی

بعد از اجرا، سایت در این آدرس‌ها در دسترس است:

| آدرس | توضیح |
|------|-------|
| `http://localhost:3000/dashboard` | داشبورد اصلی |
| `http://localhost:3000/login` | صفحه ورود |

---

## 📁 ساختار پروژه

```
healthcare-frontend/
│
├── 📁 app/                          # صفحات Next.js (App Router)
│   ├── layout.tsx                   # لایه اصلی + فونت + تم
│   ├── page.tsx                     # ریدایرکت به داشبورد
│   ├── loading.tsx                  # اسکلتون لودینگ
│   ├── error.tsx                    # صفحه خطا
│   ├── globals.css                  # استایل‌های عمومی + رنگ‌ها
│   │
│   └── 📁 dashboard/                # صفحه داشبورد
│       ├── layout.tsx               # لایه داشبورد (هدر + سایدبار + فوتر)
│       └── page.tsx                 # محتوای اصلی داشبورد
│
├── 📁 components/
│   ├── 📁 ui/                       # کامپوننت‌های پایه (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── separator.tsx
│   │   └── skeleton.tsx
│   │
│   ├── 📁 layout/                   # کامپوننت‌های لایه
│   │   ├── Header.tsx               # هدر بالای صفحه
│   │   ├── Sidebar.tsx              # منوی کناری (راست)
│   │   ├── MobileNav.tsx            # نویگیشن موبایل (پایین)
│   │   └── Footer.tsx               # فوتر پایین صفحه
│   │
│   └── 📁 dashboard/                # کامپوننت‌های داشبورد
│       ├── Slideshow.tsx            # اسلایدشو تبلیغاتی
│       ├── BigActionButtons.tsx     # دکمه‌های اکشن بزرگ
│       ├── RecentActivity.tsx       # لیست فعالیت‌های اخیر
│       ├── PatientWallet.tsx        # کیف پول بیمار
│       ├── Reminders.tsx            # یادآوری‌ها
│       ├── HealthSummary.tsx        # خلاصه وضعیت سلامتی
│       └── AIRecommendation.tsx     # توصیه هوش مصنوعی
│
├── 📁 lib/                          # توابع کمکی
│   ├── utils.ts                     # cn + فرمت تاریخ
│   ├── api-client.ts                # کلاینت API (Server Actions)
│   └── auth.ts                      # مدیریت احراز هویت
│
├── 📁 stores/                       # مدیریت وضعیت (Zustand)
│   ├── theme-store.ts               # تم روشن/تاریک
│   ├── auth-store.ts                # اطلاعات کاربر
│   └── sidebar-store.ts             # وضعیت منوی کناری
│
├── 📁 types/                        # تایپ‌های TypeScript
│   └── new-layout.ts                # تایپ‌های کامپوننت‌ها
│
├── next.config.ts                   # تنظیمات Next.js
├── tailwind.config.ts               # تنظیمات Tailwind + رنگ‌ها
├── tsconfig.json                    # تنظیمات TypeScript
└── middleware.ts                    # محافظت از روت‌ها
```

---

## 💻 راهنمای توسعه

### اجرای پروژه

```bash
npm run dev          # سرور توسعه (Turbopack)
npm run build        # بیلد برای پروداکشن
npm run start        # اجرای پروداکشن
npm run lint         # بررسی کد
```

### اضافه کردن کامپوننت shadcn/ui

```bash
npx shadcn@latest add <component-name>
# مثال:
npx shadcn@latest add button card badge
```

---

## 🎨 راهنمای تغییرات UI

### جابه‌جایی المان‌ها در داشبورد

برای تغییر ترتیب کارت‌ها، فایل زیر را ویرایش کن:

```
app/dashboard/page.tsx
```

**مثال: جابه‌جایی کیف پول و یادآوری‌ها**

```tsx
// قبل:
<div className="space-y-4">
  <PatientWallet />
  <Reminders />
  <HealthSummary />
  <AIRecommendation />
</div>

// بعد:
<div className="space-y-4">
  <Reminders />           {/* رفت بالا */}
  <PatientWallet />       {/* اومد پایین */}
  <HealthSummary />
  <AIRecommendation />
</div>
```

### تغییر محتوای یک کارت

هر کارت در مسیر خودش قرار دارد:

| کارت | مسیر فایل |
|------|-----------|
| کیف پول | `components/dashboard/PatientWallet.tsx` |
| یادآوری‌ها | `components/dashboard/Reminders.tsx` |
| خلاصه سلامتی | `components/dashboard/HealthSummary.tsx` |
| توصیه AI | `components/dashboard/AIRecommendation.tsx` |
| فعالیت‌ها | `components/dashboard/RecentActivity.tsx` |
| دکمه‌ها | `components/dashboard/BigActionButtons.tsx` |
| اسلایدشو | `components/dashboard/Slideshow.tsx` |

**مثال: تغییر موجودی کیف پول**

```tsx
// components/dashboard/PatientWallet.tsx

// خط ۱۰:
const balance = 2540000;

// تغییر به:
const balance = 5000000;  // ۵ میلیون تومان
```

### تغییر منوی سایدبار

```
components/layout/Sidebar.tsx
```

در آرایه `sidebarItems` می‌توانید آیتم اضافه/حذف/ویرایش کنید.

### تغییر هدر

```
components/layout/Header.tsx
```

---

## 🔌 اتصال به API Gateway

### تنظیمات

در فایل `.env.local`:

```env
API_GATEWAY_URL=http://localhost:8000
```

### دریافت دیتا از سرور

**روش ۱: Server Actions (پیشنهادی)**

```ts
// app/dashboard/actions.ts
"use server";

export async function getWalletBalance(): Promise<number> {
  const response = await fetch(`${process.env.API_GATEWAY_URL}/api/v1/wallet/balance`, {
    headers: { Cookie: "access_token=..." }
  });
  const data = await response.json();
  return data.balance;
}
```

**روش ۲: SWR (کش + رفرش خودکار)**

```ts
import useSWR from "swr";

export function useWallet() {
  const { data, error, isLoading } = useSWR("/api/gateway/wallet/balance", fetcher);
  return { balance: data?.balance, isLoading, error };
}
```

---

## 🎨 تعریف رنگ‌ها

رنگ‌های پروژه در `tailwind.config.ts` تعریف شده‌اند:

| نام رنگ | کد HEX | معنا |
|---------|--------|------|
| **trust-500** | `#1E6B9E` | آبی اعتماد (Primary) |
| **healing-500** | `#2A9D8F` | سبز بهبودی (Secondary) |
| **amber-500** | `#F4A261` | نارنجی اکشن (Accent) |

### استفاده در کد

```tsx
// رنگ متن
<span className="text-trust-500">متن آبی</span>

// رنگ پس‌زمینه
<div className="bg-healing-50">پس‌زمینه سبز روشن</div>

// رنگ border
<Card className="border-amber-200">کارت با border نارنجی</Card>
```

---

## 🔧 عیب‌یابی

### صفحه سفید / لود نمی‌شود

1. Console مرورگر (F12) را چک کنید
2. Terminal را ببینید اروری هست یا نه
3. فایل `lib/auth.ts` را چک کنید - اگر redirect می‌شود، `return true` بگذارید

### ارور `formatRelativeTime not found`

فایل `lib/utils.ts` را چک کنید. باید این تابع را داشته باشد:

```ts
export function formatRelativeTime(date: string | Date): string {
  // ...
}
```

### ارور `Module not found`

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### تغییرات اعمال نمی‌شود

1. فایل را ذخیره کنید (Ctrl + S)
2. صفحه مرورگر را رفرش کنید (F5)
3. اگر نشد، سرور را ری‌استارت کنید:
   ```bash
   Ctrl + C
   npm run dev
   ```

---

## 📄 لایسنس

MIT License - پروژه سلامت هوشمند

---

## 👨‍💻 توسعه‌دهندگان

- تیم Healthcare AI

---

> 💡 **نکته:** این پروژه در حال توسعه است. برای تغییرات بیشتر به مستندات Next.js و Tailwind CSS مراجعه کنید.
