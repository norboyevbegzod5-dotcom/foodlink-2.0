"use client";

import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function branchesToLines(b: unknown): string {
  if (Array.isArray(b)) return b.filter(Boolean).join("\n");
  return "";
}

function linesToBranches(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

const INPUT_CLASS =
  "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors";

export function RestaurantForm({ initial }: { initial: Restaurant }) {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState(() => ({
    name: initial.name ?? "",
    establishment_type: initial.establishment_type ?? "",
    cuisine_main: initial.cuisine_main ?? "",
    city: initial.city ?? "",
    branch_lines: branchesToLines(initial.branch_addresses),
    delivery_schedule: initial.delivery_schedule ?? "",
    max_prep_time_minutes:
      initial.max_prep_time_minutes != null
        ? String(initial.max_prep_time_minutes)
        : "",
    director_full_name: initial.director_full_name ?? "",
    director_phone: initial.director_phone ?? "",
    director_email: initial.director_email ?? "",
    order_urgent_phone_1: initial.order_urgent_phone_1 ?? "",
    order_urgent_phone_2: initial.order_urgent_phone_2 ?? "",
    accounting_phone: initial.accounting_phone ?? "",
    accounting_email: initial.accounting_email ?? "",
    requisites: initial.requisites ?? "",
    taxpayer_registration_code: initial.taxpayer_registration_code ?? "",
    currency: initial.currency ?? "UZS",
    status: initial.status ?? "draft",
  }));

  useEffect(() => {
    if (msg === "Сохранено") {
      const timer = setTimeout(() => setMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  const progress = useMemo(() => {
    const keys = [
      form.name,
      form.establishment_type,
      form.cuisine_main,
      form.city,
      form.director_full_name,
      form.director_phone,
    ] as const;
    const filled = keys.filter((k) => k.trim()).length;
    return Math.round((filled / keys.length) * 100);
  }, [
    form.name,
    form.establishment_type,
    form.cuisine_main,
    form.city,
    form.director_full_name,
    form.director_phone,
  ]);

  const set = useCallback(
    (key: keyof typeof form, value: string) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const maxPrep =
      form.max_prep_time_minutes.trim() === ""
        ? null
        : parseInt(form.max_prep_time_minutes, 10);

    const { error } = await supabaseRef.current
      .from("restaurants")
      .update({
        name: form.name || null,
        establishment_type: form.establishment_type || null,
        cuisine_main: form.cuisine_main || null,
        city: form.city || null,
        branch_addresses: linesToBranches(form.branch_lines),
        delivery_schedule: form.delivery_schedule || null,
        max_prep_time_minutes: Number.isFinite(maxPrep as number) ? maxPrep : null,
        director_full_name: form.director_full_name || null,
        director_phone: form.director_phone || null,
        director_email: form.director_email || null,
        order_urgent_phone_1: form.order_urgent_phone_1 || null,
        order_urgent_phone_2: form.order_urgent_phone_2 || null,
        accounting_phone: form.accounting_phone || null,
        accounting_email: form.accounting_email || null,
        requisites: form.requisites || null,
        taxpayer_registration_code: form.taxpayer_registration_code || null,
        currency: form.currency || "UZS",
        status: form.status as "draft" | "submitted",
      })
      .eq("id", initial.id);

    setSaving(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg("Сохранено");
    router.refresh();
  }

  function field(
    label: string,
    key: keyof typeof form,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) {
    return (
      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </label>
        <input
          {...props}
          value={form[key] as string}
          onChange={(e) => set(key, e.target.value)}
          className={INPUT_CLASS}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Анкета ресторана</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Данные для партнёров и агрегаторов.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50/50 px-5 py-4">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-emerald-800">Заполненность анкеты</span>
          <span className="font-bold text-emerald-700">{progress}%</span>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-emerald-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {msg && (
        <p
          className={`mb-4 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity ${
            msg === "Сохранено"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {msg}
        </p>
      )}

      <form onSubmit={save} className="space-y-8">
        <section className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">О заведении</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {field("Название ресторана", "name", { required: true })}
            {field("Тип заведения", "establishment_type")}
            {field("Основной тип кухни", "cuisine_main")}
            {field("Город", "city")}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Адрес(а) филиалов (каждый с новой строки)
              </label>
              <textarea
                value={form.branch_lines}
                onChange={(e) => set("branch_lines", e.target.value)}
                rows={3}
                className={INPUT_CLASS}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                График работы на доставку
              </label>
              <textarea
                value={form.delivery_schedule}
                onChange={(e) => set("delivery_schedule", e.target.value)}
                rows={2}
                className={INPUT_CLASS}
              />
            </div>
            {field("Макс. время приготовления (мин.)", "max_prep_time_minutes", {
              type: "number",
              min: 0,
            })}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Валюта цен
              </label>
              <input
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                className={INPUT_CLASS}
                placeholder="UZS"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Статус анкеты
              </label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="draft">Черновик</option>
                <option value="submitted">Готово к отправке</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Контакты</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {field("ФИО директора", "director_full_name")}
            {field("Телефон директора", "director_phone", { type: "tel" })}
            {field("Email директора", "director_email", { type: "email" })}
            {field("Срочный телефон (1)", "order_urgent_phone_1", { type: "tel" })}
            {field("Срочный телефон (2)", "order_urgent_phone_2", { type: "tel" })}
            {field("Телефон бухгалтерии", "accounting_phone", { type: "tel" })}
            {field("Email бухгалтерии", "accounting_email", { type: "email" })}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Реквизиты и налоги</h2>
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Реквизиты
              </label>
              <textarea
                value={form.requisites}
                onChange={(e) => set("requisites", e.target.value)}
                rows={5}
                className={`${INPUT_CLASS} font-mono`}
              />
            </div>
            {field("Регистрационный код налогоплательщика", "taxpayer_registration_code")}
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-emerald-500 px-8 py-2.5 font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60 transition-colors"
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </form>
    </div>
  );
}
