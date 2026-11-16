"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Loader2, AlertCircle, CheckCircle2, Plus, Pencil, Trash2,
  User, Stethoscope, HeartPulse, Pill, Activity, RefreshCw, ShieldCheck,
  CalendarDays, Ruler, Weight, Droplets, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import * as api from "@/lib/profile-api";

// ==================== استایل مشترک ====================
const inputCls =
  "w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 text-sm transition-all";

const SEVERITY_LABELS: Record<string, string> = {
  mild: "خفیف",
  moderate: "متوسط",
  severe: "شدید",
  life_threatening: "تهدیدکننده حیات",
};

const SEVERITY_BADGE: Record<string, string> = {
  mild: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  moderate: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  severe: "bg-red-500/10 text-red-600 border-red-500/20",
  life_threatening: "bg-rose-600/10 text-rose-700 border-rose-600/20 dark:text-rose-400",
};

const GENDER_LABELS: Record<string, string> = {
  male: "مرد",
  female: "زن",
  other: "سایر",
  prefer_not_to_say: "ترجیح می‌دهم نگویم",
};

function calcAge(birth?: string): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
  return age > 0 && age < 150 ? age : null;
}

function calcBMI(heightCm?: number | null, weightKg?: number | null): number | null {
  if (!heightCm || !weightKg || heightCm < 30) return null;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("");
}

// ==================== کامپوننت‌های کوچک ====================

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function AvatarUploader({
  url,
  name,
  onUpload,
}: {
  url: string | null;
  name: string;
  onUpload: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      await onUpload(file);
    } catch (x) {
      setErr(x instanceof Error ? x.message : "خطا در آپلود تصویر");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div className="relative shrink-0">
      <div className="relative w-24 h-24 group">
        <Avatar className="w-24 h-24 ring-4 ring-white dark:ring-slate-800 shadow-xl">
          <AvatarImage src={url ?? undefined} />
          <AvatarFallback className="bg-gradient-to-br from-trust-500 to-healing-500 text-white text-2xl font-bold">
            {initials(name) || "؟"}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
        >
          {busy ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePick} />
      </div>
      {err && <p className="absolute -bottom-6 right-0 text-[10px] text-red-500 whitespace-nowrap">{err}</p>}
    </div>
  );
}

function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs p-3 rounded-xl flex items-center gap-2"
    >
      <AlertCircle className="w-4 h-4 shrink-0" />
      {message}
    </motion.div>
  );
}

function SavedBadge({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="inline-flex items-center gap-1 text-xs text-healing-600 font-medium"
        >
          <CheckCircle2 className="w-4 h-4" />
          ذخیره شد
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function SectionCard({
  icon: Icon,
  iconCls,
  title,
  desc,
  onAdd,
  children,
}: {
  icon: typeof HeartPulse;
  iconCls: string;
  title: string;
  desc: string;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden h-fit">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconCls)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-foreground">{title}</h3>
              <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
            </div>
          </div>
          {onAdd && (
            <Button variant="outline" size="sm" onClick={onAdd} className="h-8 text-xs gap-1 shrink-0">
              <Plus className="w-3.5 h-3.5" />
              افزودن
            </Button>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function EmptyList({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-4 text-center">
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

// ==================== فرم پروفایل بیمار ====================

function PatientForm({ profile, onChanged }: { profile: api.PatientProfile | null; onChanged: () => void }) {
  const isEdit = !!profile;
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    birth_date: profile?.birth_date ?? "",
    gender: profile?.gender ?? ("prefer_not_to_say" as api.PatientProfile["gender"]),
    height_cm: profile?.height_cm?.toString() ?? "",
    weight_kg: profile?.weight_kg?.toString() ?? "",
    blood_type: profile?.blood_type ?? "",
    phone: profile?.phone ?? "",
    emergency_contact_name: profile?.emergency_contact_name ?? "",
    emergency_contact_phone: profile?.emergency_contact_phone ?? "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.profile_image_url ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.full_name.trim().length < 2) {
      setError("نام و نام خانوادگی را کامل وارد کنید");
      return;
    }
    if (!form.birth_date) {
      setError("تاریخ تولد را انتخاب کنید");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: api.PatientProfilePayload = {
        full_name: form.full_name.trim(),
        birth_date: form.birth_date,
        gender: form.gender as api.PatientProfile["gender"],
        height_cm: form.height_cm ? parseInt(form.height_cm, 10) : null,
        weight_kg: form.weight_kg ? parseInt(form.weight_kg, 10) : null,
        blood_type: (form.blood_type || null) as api.PatientProfile["blood_type"],
        phone: form.phone.trim() || null,
        emergency_contact_name: form.emergency_contact_name.trim() || null,
        emergency_contact_phone: form.emergency_contact_phone.trim() || null,
      };
      if (isEdit) {
        await api.updatePatientProfile(payload);
      } else {
        await api.createPatientProfile(payload);
      }
      onChanged();
      flashSaved();
    } catch (x) {
      setError(x instanceof Error ? x.message : "خطا در ذخیره اطلاعات");
    } finally {
      setSaving(false);
    }
  };

  const age = calcAge(form.birth_date);
  const bmi = calcBMI(form.height_cm ? parseInt(form.height_cm, 10) : null, form.weight_kg ? parseInt(form.weight_kg, 10) : null);

  return (
    <Card className="overflow-hidden">
      <div className="h-24 bg-gradient-to-l from-trust-500 to-healing-500 relative">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 blur-2xl -translate-y-1/2 translate-x-1/4" />
      </div>
      <CardContent className="p-5 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-5">
          <div className="rounded-full ring-4 ring-card">
            <AvatarUploader
              url={avatarUrl}
              name={form.full_name || "کاربر"}
              onUpload={async (file) => {
                const res = await api.uploadPatientAvatar(file);
                setAvatarUrl(res.profile_image_url);
                onChanged();
              }}
            />
          </div>
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground">{form.full_name || "پروفایل بیمار"}</h2>
              <Badge className="bg-trust-500/10 text-trust-600 border border-trust-500/20 text-[10px] gap-1">
                <User className="w-3 h-3" />
                بیمار
              </Badge>
              {age !== null && <Badge variant="outline" className="text-[10px]">{age.toLocaleString("fa-IR")} سال</Badge>}
              {bmi !== null && <Badge variant="outline" className="text-[10px]">BMI: {bmi.toLocaleString("fa-IR")}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isEdit ? "اطلاعات پایه سلامتی شما (برای پزشک در هر ویزیت قابل مشاهده است)" : "برای استفاده کامل از سامانه، پروفایل خود را تکمیل کنید"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="نام و نام خانوادگی">
              <input type="text" value={form.full_name} onChange={set("full_name")} className={inputCls} placeholder="مثلاً: علی رضایی" />
            </Field>
            <Field label="تاریخ تولد">
              <input type="date" value={form.birth_date} onChange={set("birth_date")} className={inputCls} dir="ltr" />
            </Field>
            <Field label="جنسیت">
              <select value={form.gender} onChange={set("gender")} className={inputCls}>
                <option value="male">مرد</option>
                <option value="female">زن</option>
                <option value="other">سایر</option>
                <option value="prefer_not_to_say">ترجیح می‌دهم نگویم</option>
              </select>
            </Field>
            <Field label="گروه خونی">
              <select value={form.blood_type} onChange={set("blood_type")} className={inputCls} dir="ltr">
                <option value="">انتخاب کنید</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="قد (سانتی‌متر)">
              <input type="number" min={30} max={300} value={form.height_cm} onChange={set("height_cm")} className={inputCls} dir="ltr" placeholder="175" />
            </Field>
            <Field label="وزن (کیلوگرم)">
              <input type="number" min={1} max={500} value={form.weight_kg} onChange={set("weight_kg")} className={inputCls} dir="ltr" placeholder="70" />
            </Field>
            <Field label="شماره تماس">
              <input type="tel" value={form.phone} onChange={set("phone")} className={inputCls} dir="ltr" placeholder="09123456789" />
            </Field>
            <Field label="نام تماس اضطراری">
              <input type="text" value={form.emergency_contact_name} onChange={set("emergency_contact_name")} className={inputCls} placeholder="مثلاً: همسر" />
            </Field>
            <Field label="شماره تماس اضطراری">
              <input type="tel" value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} className={inputCls} dir="ltr" placeholder="09129876543" />
            </Field>
          </div>

          <FormError message={error} />

          <div className="flex items-center justify-between pt-1">
            <SavedBadge show={saved} />
            <Button
              type="submit"
              disabled={saving}
              className="h-10 bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white shadow-lg shadow-trust-500/25"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "ذخیره تغییرات" : "ساخت پروفایل"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ==================== بخش حساسیت‌ها ====================

function AllergySection({ items, onChanged }: { items: api.Allergy[]; onChanged: () => void }) {
  const empty = { allergy_name: "", severity: "moderate" as api.Allergy["severity"], reaction_description: "", diagnosed_at: "" };
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setForm(empty);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const startEdit = (a: api.Allergy) => {
    setForm({
      allergy_name: a.allergy_name,
      severity: a.severity,
      reaction_description: a.reaction_description ?? "",
      diagnosed_at: a.diagnosed_at ?? "",
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.allergy_name.trim().length < 2) {
      setError("نام حساسیت را وارد کنید");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload: api.AllergyPayload = {
        allergy_name: form.allergy_name.trim(),
        severity: form.severity,
        reaction_description: form.reaction_description.trim() || undefined,
        diagnosed_at: form.diagnosed_at || undefined,
      };
      if (editingId) await api.updateAllergy(editingId, payload);
      else await api.addAllergy(payload);
      onChanged();
      reset();
    } catch (x) {
      setError(x instanceof Error ? x.message : "خطا در ذخیره");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.deleteAllergy(id);
      onChanged();
    } catch (x) {
      setError(x instanceof Error ? x.message : "خطا در حذف");
    }
  };

  return (
    <SectionCard
      icon={HeartPulse}
      iconCls="bg-rose-50 dark:bg-rose-900/20 text-rose-500"
      title="حساسیت‌ها"
      desc={`${items.length.toLocaleString("fa-IR")} مورد ثبت شده`}
      onAdd={() => (showForm ? reset() : setShowForm(true))}
    >
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={submit}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-rose-200 dark:border-rose-800/40 p-4 space-y-3 bg-rose-50/40 dark:bg-rose-900/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="نام حساسیت">
                  <input type="text" value={form.allergy_name} onChange={(e) => setForm((f) => ({ ...f, allergy_name: e.target.value }))} className={inputCls} placeholder="مثلاً: پنی‌سیلین" />
                </Field>
                <Field label="شدت">
                  <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as api.Allergy["severity"] }))} className={inputCls}>
                    <option value="mild">خفیف</option>
                    <option value="moderate">متوسط</option>
                    <option value="severe">شدید</option>
                    <option value="life_threatening">تهدیدکننده حیات</option>
                  </select>
                </Field>
                <Field label="واکنش / توضیحات">
                  <input type="text" value={form.reaction_description} onChange={(e) => setForm((f) => ({ ...f, reaction_description: e.target.value }))} className={inputCls} placeholder="مثلاً: تنگی نفس" />
                </Field>
                <Field label="تاریخ تشخیص">
                  <input type="date" value={form.diagnosed_at} onChange={(e) => setForm((f) => ({ ...f, diagnosed_at: e.target.value }))} className={inputCls} dir="ltr" />
                </Field>
              </div>
              <FormError message={error} />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={busy} className="h-9 text-xs bg-rose-500 hover:bg-rose-600 text-white">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "ذخیره تغییرات" : "افزودن حساسیت"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={reset} className="h-9 text-xs">انصراف</Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {!showForm && <FormError message={error} />}

      {items.length === 0 ? (
        <EmptyList text="حساسیتی ثبت نشده است" />
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0">
                <HeartPulse className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{a.allergy_name}</p>
                {a.reaction_description && <p className="text-[11px] text-muted-foreground truncate">{a.reaction_description}</p>}
              </div>
              <Badge variant="outline" className={cn("text-[10px] shrink-0", SEVERITY_BADGE[a.severity])}>
                {SEVERITY_LABELS[a.severity]}
              </Badge>
              <button onClick={() => startEdit(a)} className="w-7 h-7 rounded-lg hover:bg-trust-50 dark:hover:bg-trust-900/20 flex items-center justify-center text-muted-foreground hover:text-trust-500 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => remove(a.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ==================== بخش داروها ====================

function MedicationSection({ items, onChanged }: { items: api.Medication[]; onChanged: () => void }) {
  const empty = {
    medication_name: "", dosage: "", frequency: "", prescribed_by: "",
    start_date: "", end_date: "", notes: "", is_active: true,
  };
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setForm(empty);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const startEdit = (m: api.Medication) => {
    setForm({
      medication_name: m.medication_name,
      dosage: m.dosage ?? "",
      frequency: m.frequency ?? "",
      prescribed_by: m.prescribed_by ?? "",
      start_date: m.start_date ?? "",
      end_date: m.end_date ?? "",
      notes: m.notes ?? "",
      is_active: m.is_active,
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.medication_name.trim().length < 2) {
      setError("نام دارو را وارد کنید");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload: api.MedicationPayload = {
        medication_name: form.medication_name.trim(),
        dosage: form.dosage.trim() || undefined,
        frequency: form.frequency.trim() || undefined,
        prescribed_by: form.prescribed_by.trim() || undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        notes: form.notes.trim() || undefined,
        is_active: form.is_active,
      };
      if (editingId) await api.updateMedication(editingId, payload);
      else await api.addMedication(payload);
      onChanged();
      reset();
    } catch (x) {
      setError(x instanceof Error ? x.message : "خطا در ذخیره");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.deleteMedication(id);
      onChanged();
    } catch (x) {
      setError(x instanceof Error ? x.message : "خطا در حذف");
    }
  };

  return (
    <SectionCard
      icon={Pill}
      iconCls="bg-amber-50 dark:bg-amber-900/20 text-amber-500"
      title="داروهای جاری"
      desc={`${items.length.toLocaleString("fa-IR")} مورد ثبت شده`}
      onAdd={() => (showForm ? reset() : setShowForm(true))}
    >
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={submit}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 p-4 space-y-3 bg-amber-50/40 dark:bg-amber-900/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="نام دارو">
                  <input type="text" value={form.medication_name} onChange={(e) => setForm((f) => ({ ...f, medication_name: e.target.value }))} className={inputCls} placeholder="مثلاً: لوزارتان" />
                </Field>
                <Field label="دوز">
                  <input type="text" value={form.dosage} onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} className={inputCls} dir="ltr" placeholder="50mg" />
                </Field>
                <Field label="دفعات مصرف">
                  <input type="text" value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))} className={inputCls} placeholder="روزی یک بار" />
                </Field>
                <Field label="تجویزکننده">
                  <input type="text" value={form.prescribed_by} onChange={(e) => setForm((f) => ({ ...f, prescribed_by: e.target.value }))} className={inputCls} placeholder="دکتر ..." />
                </Field>
                <Field label="تاریخ شروع">
                  <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} className={inputCls} dir="ltr" />
                </Field>
                <Field label="تاریخ پایان">
                  <input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} className={inputCls} dir="ltr" />
                </Field>
                <Field label="یادداشت" className="sm:col-span-2">
                  <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={inputCls} placeholder="نکات مهم مصرف..." />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded accent-healing-500"
                />
                در حال مصرف
              </label>
              <FormError message={error} />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={busy} className="h-9 text-xs bg-amber-500 hover:bg-amber-600 text-white">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "ذخیره تغییرات" : "افزودن دارو"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={reset} className="h-9 text-xs">انصراف</Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {!showForm && <FormError message={error} />}

      {items.length === 0 ? (
        <EmptyList text="دارویی ثبت نشده است" />
      ) : (
        <div className="space-y-2">
          {items.map((m) => (
            <div key={m.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-colors", m.is_active ? "border-border hover:bg-muted/40" : "border-border/50 opacity-60")}>
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                <Pill className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{m.medication_name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {[m.dosage, m.frequency].filter(Boolean).join(" • ") || "—"}
                </p>
              </div>
              <Badge variant="outline" className={cn("text-[10px] shrink-0", m.is_active ? "bg-healing-500/10 text-healing-600 border-healing-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20")}>
                {m.is_active ? "در حال مصرف" : "قطع شده"}
              </Badge>
              <button onClick={() => startEdit(m)} className="w-7 h-7 rounded-lg hover:bg-trust-50 dark:hover:bg-trust-900/20 flex items-center justify-center text-muted-foreground hover:text-trust-500 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => remove(m.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ==================== بخش بیماری‌های مزمن ====================

function ConditionSection({ items, onChanged }: { items: api.Condition[]; onChanged: () => void }) {
  const empty = {
    condition_name: "", icd10_code: "", diagnosed_at: "",
    severity: "moderate" as api.Condition["severity"], notes: "", is_active: true,
  };
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setForm(empty);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const startEdit = (c: api.Condition) => {
    setForm({
      condition_name: c.condition_name,
      icd10_code: c.icd10_code ?? "",
      diagnosed_at: c.diagnosed_at ?? "",
      severity: c.severity,
      notes: c.notes ?? "",
      is_active: c.is_active,
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.condition_name.trim().length < 2) {
      setError("نام بیماری را وارد کنید");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload: api.ConditionPayload = {
        condition_name: form.condition_name.trim(),
        icd10_code: form.icd10_code.trim() || undefined,
        diagnosed_at: form.diagnosed_at || undefined,
        severity: form.severity,
        notes: form.notes.trim() || undefined,
        is_active: form.is_active,
      };
      if (editingId) await api.updateCondition(editingId, payload);
      else await api.addCondition(payload);
      onChanged();
      reset();
    } catch (x) {
      setError(x instanceof Error ? x.message : "خطا در ذخیره");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.deleteCondition(id);
      onChanged();
    } catch (x) {
      setError(x instanceof Error ? x.message : "خطا در حذف");
    }
  };

  return (
    <SectionCard
      icon={Activity}
      iconCls="bg-violet-50 dark:bg-violet-900/20 text-violet-500"
      title="بیماری‌های مزمن"
      desc={`${items.length.toLocaleString("fa-IR")} مورد ثبت شده`}
      onAdd={() => (showForm ? reset() : setShowForm(true))}
    >
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={submit}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-violet-200 dark:border-violet-800/40 p-4 space-y-3 bg-violet-50/40 dark:bg-violet-900/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="نام بیماری">
                  <input type="text" value={form.condition_name} onChange={(e) => setForm((f) => ({ ...f, condition_name: e.target.value }))} className={inputCls} placeholder="مثلاً: فشار خون" />
                </Field>
                <Field label="کد ICD-10">
                  <input type="text" value={form.icd10_code} onChange={(e) => setForm((f) => ({ ...f, icd10_code: e.target.value }))} className={inputCls} dir="ltr" placeholder="I10" />
                </Field>
                <Field label="شدت">
                  <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as api.Condition["severity"] }))} className={inputCls}>
                    <option value="mild">خفیف</option>
                    <option value="moderate">متوسط</option>
                    <option value="severe">شدید</option>
                  </select>
                </Field>
                <Field label="تاریخ تشخیص">
                  <input type="date" value={form.diagnosed_at} onChange={(e) => setForm((f) => ({ ...f, diagnosed_at: e.target.value }))} className={inputCls} dir="ltr" />
                </Field>
                <Field label="یادداشت" className="sm:col-span-2">
                  <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={inputCls} placeholder="توضیحات تکمیلی..." />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded accent-violet-500"
                />
                هنوز فعال است
              </label>
              <FormError message={error} />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={busy} className="h-9 text-xs bg-violet-500 hover:bg-violet-600 text-white">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "ذخیره تغییرات" : "افزودن بیماری"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={reset} className="h-9 text-xs">انصراف</Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {!showForm && <FormError message={error} />}

      {items.length === 0 ? (
        <EmptyList text="بیماری مزمنی ثبت نشده است" />
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-colors", c.is_active ? "border-border hover:bg-muted/40" : "border-border/50 opacity-60")}>
              <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{c.condition_name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {c.icd10_code ? `ICD-10: ${c.icd10_code}` : "—"}
                </p>
              </div>
              <Badge variant="outline" className={cn("text-[10px] shrink-0", SEVERITY_BADGE[c.severity])}>
                {SEVERITY_LABELS[c.severity]}
              </Badge>
              <button onClick={() => startEdit(c)} className="w-7 h-7 rounded-lg hover:bg-trust-50 dark:hover:bg-trust-900/20 flex items-center justify-center text-muted-foreground hover:text-trust-500 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => remove(c.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ==================== فرم پروفایل پزشک ====================

function DoctorForm({ profile, onChanged }: { profile: api.DoctorProfile | null; onChanged: () => void }) {
  const isEdit = !!profile;
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    specialty: profile?.specialty ?? "",
    medical_license_number: profile?.medical_license_number ?? "",
    years_of_experience: profile?.years_of_experience?.toString() ?? "",
    phone: profile?.phone ?? "",
    office_address: profile?.office_address ?? "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.profile_image_url ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.full_name.trim().length < 2 || !form.specialty.trim() || !form.medical_license_number.trim()) {
      setError("نام، تخصص و شماره نظام پزشکی الزامی است");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: api.DoctorProfilePayload = {
        full_name: form.full_name.trim(),
        specialty: form.specialty.trim(),
        medical_license_number: form.medical_license_number.trim(),
        years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience, 10) : null,
        phone: form.phone.trim() || null,
        office_address: form.office_address.trim() || null,
      };
      if (isEdit) await api.updateDoctorProfile(payload);
      else await api.createDoctorProfile(payload);
      onChanged();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (x) {
      setError(x instanceof Error ? x.message : "خطا در ذخیره اطلاعات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="h-24 bg-gradient-to-l from-violet-500 to-purple-500 relative">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 blur-2xl -translate-y-1/2 translate-x-1/4" />
      </div>
      <CardContent className="p-5 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-5">
          <div className="rounded-full ring-4 ring-card">
            <AvatarUploader
              url={avatarUrl}
              name={form.full_name || "پزشک"}
              onUpload={async (file) => {
                const res = await api.uploadDoctorAvatar(file);
                setAvatarUrl(res.profile_image_url);
                onChanged();
              }}
            />
          </div>
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground">{form.full_name || "پروفایل پزشک"}</h2>
              <Badge className="bg-violet-500/10 text-violet-600 border border-violet-500/20 text-[10px] gap-1">
                <Stethoscope className="w-3 h-3" />
                پزشک
              </Badge>
              {profile && (
                profile.is_verified ? (
                  <Badge className="bg-healing-500/10 text-healing-600 border border-healing-500/20 text-[10px] gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    تأیید شده
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/20">
                    در انتظار تأیید نظام پزشکی
                  </Badge>
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isEdit ? "این اطلاعات برای بیماران در ویزیت نمایش داده می‌شود" : "پروفایل حرفه‌ای خود را تکمیل کنید"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="نام و نام خانوادگی">
              <input type="text" value={form.full_name} onChange={set("full_name")} className={inputCls} placeholder="دکتر ..." />
            </Field>
            <Field label="تخصص">
              <input type="text" value={form.specialty} onChange={set("specialty")} className={inputCls} placeholder="مثلاً: متخصص داخلی" />
            </Field>
            <Field label="شماره نظام پزشکی">
              <input type="text" value={form.medical_license_number} onChange={set("medical_license_number")} className={inputCls} dir="ltr" placeholder="123456" />
            </Field>
            <Field label="سابقه کار (سال)">
              <input type="number" min={0} max={80} value={form.years_of_experience} onChange={set("years_of_experience")} className={inputCls} dir="ltr" placeholder="10" />
            </Field>
            <Field label="شماره تماس مطب">
              <input type="tel" value={form.phone} onChange={set("phone")} className={inputCls} dir="ltr" placeholder="02112345678" />
            </Field>
            <Field label="آدرس مطب">
              <input type="text" value={form.office_address} onChange={set("office_address")} className={inputCls} placeholder="تهران، خیابان ..." />
            </Field>
          </div>

          <FormError message={error} />

          <div className="flex items-center justify-between pt-1">
            <SavedBadge show={saved} />
            <Button
              type="submit"
              disabled={saving}
              className="h-10 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg shadow-violet-500/25"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "ذخیره تغییرات" : "ساخت پروفایل"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ==================== صفحه اصلی ====================

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState<api.Role | null>(null);
  const [profile, setProfile] = useState<api.PatientProfile | null>(null);
  const [doctor, setDoctor] = useState<api.DoctorProfile | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const hint = api.getRoleFromToken();
    try {
      if (hint === "doctor") {
        try {
          const d = await api.getDoctorProfile();
          setRole("doctor");
          setDoctor(d);
        } catch (e) {
          if (e instanceof api.ApiError && e.status === 404) {
            setRole("doctor");
            setDoctor(null);
          } else throw e;
        }
      } else {
        // پیش‌فرض بیمار؛ اگر 403 بود یعنی نقش پزشک است
        try {
          const p = await api.getPatientProfile();
          setRole("patient");
          setProfile(p);
        } catch (e) {
          if (e instanceof api.ApiError && e.status === 403) {
            try {
              const d = await api.getDoctorProfile();
              setRole("doctor");
              setDoctor(d);
            } catch (e2) {
              if (e2 instanceof api.ApiError && e2.status === 404) {
                setRole("doctor");
                setDoctor(null);
              } else throw e2;
            }
          } else if (e instanceof api.ApiError && e.status === 404) {
            setRole("patient");
            setProfile(null);
          } else throw e;
        }
      }
    } catch (x) {
      setError(x instanceof Error ? x.message : "خطا در بارگذاری پروفایل");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* هدر صفحه */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">پروفایل کاربری</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              اطلاعات شما نزد AI Triage در هر ویزیت به‌صورت خودکار برای پزشک ارسال می‌شود
            </p>
          </div>
          {!loading && (
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-9 text-xs gap-1.5">
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              بروزرسانی
            </Button>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-[300px] rounded-xl" />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[280px] rounded-xl" />
            ))}
          </div>
        </div>
      ) : error && !role ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <Button variant="outline" size="sm" onClick={load} className="h-9 text-xs">
                تلاش مجدد
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : role === "doctor" ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <DoctorForm profile={doctor} onChanged={load} />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
          <PatientForm profile={profile} onChanged={load} />
          {profile && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <AllergySection items={profile.allergies} onChanged={load} />
              <MedicationSection items={profile.medications} onChanged={load} />
              <ConditionSection items={profile.conditions} onChanged={load} />
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
