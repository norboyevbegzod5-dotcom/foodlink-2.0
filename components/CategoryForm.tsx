"use client";

import { createClient } from "@/lib/supabase/client";
import { menuImagePublicUrl } from "@/lib/public-url";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

interface CategoryData {
  id: string;
  name: string;
  description: string;
  image_path: string | null;
  sort_order: number;
}

export default function CategoryForm({
  restaurantId,
  category: initial,
  allCategories,
}: {
  restaurantId: string;
  category: CategoryData;
  allCategories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const [form, setForm] = useState<CategoryData>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = useCallback(
    <K extends keyof CategoryData>(key: K, val: CategoryData[K]) => {
      setForm((prev) => ({ ...prev, [key]: val }));
    },
    [],
  );

  async function save() {
    setSaving(true);
    const supabase = supabaseRef.current;
    const { error } = await supabase
      .from("menu_categories")
      .update({
        name: form.name,
        description: form.description || null,
        sort_order: form.sort_order,
      })
      .eq("id", form.id);
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function uploadImage(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Файл слишком большой (макс. 5 МБ)");
      return;
    }
    setUploading(true);
    const supabase = supabaseRef.current;
    const ext = file.name.split(".").pop();
    const path = `${restaurantId}/cat_${form.id}.${ext}`;

    if (form.image_path) {
      await supabase.storage.from("menu-images").remove([form.image_path]);
    }

    const { error } = await supabase.storage
      .from("menu-images")
      .upload(path, file, { upsert: true });

    if (!error) {
      await supabase
        .from("menu_categories")
        .update({ image_path: path })
        .eq("id", form.id);
      set("image_path", path);
    }
    setUploading(false);
  }

  async function removeImage() {
    if (!form.image_path) return;
    const supabase = supabaseRef.current;
    await supabase.storage.from("menu-images").remove([form.image_path]);
    await supabase
      .from("menu_categories")
      .update({ image_path: null })
      .eq("id", form.id);
    set("image_path", null);
  }

  const imgUrl = menuImagePublicUrl(form.image_path);

  return (
    <div className="mt-4">
      <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-zinc-800">
          Общие настройки
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
          {/* Left: image + sort + status */}
          <div className="flex flex-col items-start gap-4">
            {/* Image */}
            <label className="group relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition-colors hover:border-emerald-400 hover:bg-emerald-50/30">
              {imgUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      void removeImage();
                    }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white shadow hover:bg-red-600"
                  >
                    ×
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-zinc-400 group-hover:text-emerald-500">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="text-[10px] font-medium">Фото</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadImage(f);
                }}
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                </div>
              )}
            </label>

            {/* Category (parent) — read-only for context */}
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-zinc-600">
                Категория
              </label>
              <select
                disabled
                value={form.id}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-500"
              >
                {allCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort order */}
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-zinc-600">
                Порядковый номер
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* Status — always active for now */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-zinc-600">Статус</label>
              <div className="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full bg-emerald-500 transition-colors">
                <span className="absolute left-[22px] h-4 w-4 rounded-full bg-white shadow transition-transform" />
              </div>
            </div>
          </div>

          {/* Right: text fields */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-600">
                Название *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                placeholder="Название категории"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-600">
                Описание
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full resize-none rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                placeholder="Описание категории"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-zinc-200 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Отменить
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          {saving ? "Сохранение…" : saved ? "Сохранено ✓" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
