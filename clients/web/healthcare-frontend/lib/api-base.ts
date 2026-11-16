// lib/api-base.ts
// تنها منبع تعریف آدرس پایه API — هیچ import ای ندارد تا چرخه شکل نگیرد
export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_URL ?? "/api/gateway";