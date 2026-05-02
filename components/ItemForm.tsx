"use client";

import { createClient } from "@/lib/supabase/client";
import { menuImagePublicUrl } from "@/lib/public-url";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface ItemData {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price_yandex_eda: number | null;
  price_uzum_tezkor: number | null;
  image_path: string | null;
  is_active: boolean;
  sort_order: number;
  product_type: string;
  ikpu: string;
  package_code: string;
  barcode: string;
  with_marking: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function ItemForm({
  restaurantId,
  item: initial,
  categories,
  currency,
  existingIkpuValues,
  existingPackageCodes,
}: {
  restaurantId: string;
  item: ItemData;
  categories: Category[];
  currency: string;
  existingIkpuValues: string[];
  existingPackageCodes: string[];
}) {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const [form, setForm] = useState<ItemData>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [ikpuOpen, setIkpuOpen] = useState(false);
  const [pkgOpen, setPkgOpen] = useState(false);
  const [ikpuFilter, setIkpuFilter] = useState("");
  const [pkgFilter, setPkgFilter] = useState("");

  const ikpuRef = useRef<HTMLDivElement>(null);
  const pkgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ikpuRef.current && !ikpuRef.current.contains(e.target as Node))
        setIkpuOpen(false);
      if (pkgRef.current && !pkgRef.current.contains(e.target as Node))
        setPkgOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const set = useCallback(
    <K extends keyof ItemData>(key: K, val: ItemData[K]) => {
      setForm((prev) => ({ ...prev, [key]: val }));
    },
    [],
  );

  async function save() {
    setSaving(true);
    const supabase = supabaseRef.current;

    const coreFields = {
      name: form.name,
      description: form.description.trim() || null,
      category_id: form.category_id,
      price_yandex_eda: form.price_yandex_eda,
      price_uzum_tezkor: form.price_uzum_tezkor,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };

    const extFields = {
      product_type: form.product_type || "dish",
      ikpu: form.ikpu.trim() || null,
      package_code: form.package_code.trim() || null,
      barcode: form.barcode.trim() || null,
      with_marking: form.with_marking,
    };

    let { error } = await supabase
      .from("menu_items")
      .update({ ...coreFields, ...extFields })
      .eq("id", form.id);

    if (error) {
      const { error: errCore } = await supabase
        .from("menu_items")
        .update(coreFields)
        .eq("id", form.id);
      if (errCore) {
        setSaving(false);
        alert(errCore.message);
        return;
      }
      const { error: errExt } = await supabase
        .from("menu_items")
        .update(extFields)
        .eq("id", form.id);
      if (errExt) {
        setSaving(false);
        alert(
          "Основные данные и описание сохранены. Поля ИКПУ / код упаковки / штрих-код не сохранились — в Supabase SQL Editor выполните скрипт из файла supabase/migrations/003_item_external_fields.sql",
        );
        return;
      }
      error = null;
    }

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
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
    const path = `${restaurantId}/${form.id}.${ext}`;

    if (form.image_path) {
      await supabase.storage.from("menu-images").remove([form.image_path]);
    }

    const { error } = await supabase.storage
      .from("menu-images")
      .upload(path, file, { upsert: true });

    if (!error) {
      await supabase
        .from("menu_items")
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
      .from("menu_items")
      .update({ image_path: null })
      .eq("id", form.id);
    set("image_path", null);
  }

  const imgUrl = menuImagePublicUrl(form.image_path);

  const filteredIkpu = existingIkpuValues.filter(
    (v) => v.toLowerCase().includes(ikpuFilter.toLowerCase()) && v !== form.ikpu,
  );
  const filteredPkg = existingPackageCodes.filter(
    (v) =>
      v.toLowerCase().includes(pkgFilter.toLowerCase()) &&
      v !== form.package_code,
  );

  const inputCls =
    "w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* ---- LEFT: Main form ---- */}
      <div className="space-y-6">
        {/* Product section */}
        <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-zinc-800">Продукт</h2>

          <div className="mb-5 flex items-start gap-5">
            <label className="group relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition-colors hover:border-emerald-400 hover:bg-emerald-50/30">
              {imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgUrl} alt="" className="h-full w-full object-cover" />
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
            {imgUrl && (
              <button
                type="button"
                onClick={() => void removeImage()}
                className="mt-2 text-xs text-red-500 hover:text-red-700"
              >
                Удалить фото
              </button>
            )}
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-zinc-600">
              Имя *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls}
              placeholder="Название блюда"
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-600">
                Категория *
              </label>
              <select
                value={form.category_id}
                onChange={(e) => set("category_id", e.target.value)}
                className={inputCls}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-600">
                Порядковый номер
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-600">
              Описание
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder="Описание позиции"
            />
          </div>
        </div>

        {/* External Systems section */}
        <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-zinc-800">
            Внешние системы
          </h2>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-zinc-600">
              Тип продукта
            </label>
            <select
              value={form.product_type}
              onChange={(e) => set("product_type", e.target.value)}
              className={inputCls}
            >
              <option value="dish">Блюдо</option>
              <option value="drink">Напиток</option>
              <option value="dessert">Десерт</option>
              <option value="combo">Комбо</option>
              <option value="other">Другое</option>
            </select>
          </div>

          {/* IKPU with suggestions */}
          <div className="mb-4" ref={ikpuRef}>
            <label className="mb-1.5 block text-sm font-medium text-zinc-600">
              ИКПУ
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.ikpu}
                onChange={(e) => {
                  set("ikpu", e.target.value);
                  setIkpuFilter(e.target.value);
                  setIkpuOpen(true);
                }}
                onFocus={() => setIkpuOpen(true)}
                className={inputCls}
                placeholder="Введите или выберите ИКПУ"
              />
              {ikpuOpen && filteredIkpu.length > 0 && (
                <div className="absolute left-0 right-0 z-20 mt-1 max-h-40 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
                  {filteredIkpu.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        set("ikpu", v);
                        setIkpuOpen(false);
                      }}
                      className="flex w-full px-3.5 py-2 text-left text-sm text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Package code with suggestions */}
          <div className="mb-4" ref={pkgRef}>
            <label className="mb-1.5 block text-sm font-medium text-zinc-600">
              Код упаковки
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.package_code}
                onChange={(e) => {
                  set("package_code", e.target.value);
                  setPkgFilter(e.target.value);
                  setPkgOpen(true);
                }}
                onFocus={() => setPkgOpen(true)}
                className={inputCls}
                placeholder="Введите или выберите код"
              />
              {pkgOpen && filteredPkg.length > 0 && (
                <div className="absolute left-0 right-0 z-20 mt-1 max-h-40 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
                  {filteredPkg.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        set("package_code", v);
                        setPkgOpen(false);
                      }}
                      className="flex w-full px-3.5 py-2 text-left text-sm text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Barcode */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-zinc-600">
              Штрих-код
            </label>
            <input
              type="text"
              value={form.barcode}
              onChange={(e) => set("barcode", e.target.value)}
              className={inputCls}
              placeholder="Штрих-код"
            />
          </div>

          {/* With marking toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-600">
              С маркировкой
            </label>
            <button
              type="button"
              onClick={() => set("with_marking", !form.with_marking)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                form.with_marking ? "bg-emerald-500" : "bg-zinc-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.with_marking
                    ? "translate-x-[22px] translate-y-[4px]"
                    : "translate-x-[4px] translate-y-[4px]"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ---- RIGHT: Sidebar ---- */}
      <div className="space-y-5">
        <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">Статус</h3>
          <select
            value={form.is_active ? "active" : "hidden"}
            onChange={(e) => set("is_active", e.target.value === "active")}
            className={inputCls}
          >
            <option value="active">Активный</option>
            <option value="hidden">Скрыт</option>
          </select>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">Цена</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                Яндекс Еда ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={form.price_yandex_eda ?? ""}
                onChange={(e) =>
                  set(
                    "price_yandex_eda",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                Uzum Tezkor ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={form.price_uzum_tezkor ?? ""}
                onChange={(e) =>
                  set(
                    "price_uzum_tezkor",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className={inputCls}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Отменить
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {saving ? "Сохранение…" : saved ? "Сохранено ✓" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
