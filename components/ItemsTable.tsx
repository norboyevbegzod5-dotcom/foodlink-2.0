"use client";

import { createClient } from "@/lib/supabase/client";
import { menuImagePublicUrl } from "@/lib/public-url";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type ItemsTableRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_path: string | null;
  price_yandex_eda: number | null;
  price_uzum_tezkor: number | null;
  is_active: boolean;
};

export default function ItemsTable({
  restaurantId,
  currency,
  rows,
  categoryNames,
}: {
  restaurantId: string;
  currency: string;
  rows: ItemsTableRow[];
  categoryNames: Record<string, string>;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkIkpu, setBulkIkpu] = useState("");
  const [bulkPackage, setBulkPackage] = useState("");
  const [busy, setBusy] = useState(false);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const n = rows.length;
  const sel = selectedIds.length;
  const allSelected = n > 0 && sel === n;
  const someSelected = sel > 0 && sel < n;

  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (el) el.indeterminate = someSelected;
  }, [someSelected]);

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function selectAll() {
    setSelectedIds(rows.map((r) => r.id));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function applyIkpuAndPackage() {
    if (selectedIds.length === 0) return;
    const ik = bulkIkpu.trim();
    const pkg = bulkPackage.trim();
    if (!ik && !pkg) {
      alert("Введите ИКПУ и/или код упаковки — пустые поля не меняют карточки.");
      return;
    }
    const payload: { ikpu?: string; package_code?: string } = {};
    if (ik) payload.ikpu = ik;
    if (pkg) payload.package_code = pkg;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("menu_items")
      .update(payload)
      .in("id", selectedIds);
    setBusy(false);
    if (error) {
      if (
        error.message.includes("column") ||
        error.code === "PGRST204" ||
        error.message.includes("schema cache")
      ) {
        alert(
          "Не удалось сохранить ИКПУ и код упаковки: в Supabase выполните SQL из файла supabase/migrations/003_item_external_fields.sql",
        );
      } else {
        alert(error.message);
      }
      return;
    }
    router.refresh();
  }

  async function bulkDelete() {
    if (selectedIds.length === 0) return;
    const label =
      selectedIds.length === 1
        ? "этот товар"
        : `${selectedIds.length} товаров`;
    if (!window.confirm(`Удалить ${label}? Это действие нельзя отменить.`)) {
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const paths = rows
      .filter((r) => selectedIds.includes(r.id) && r.image_path)
      .map((r) => r.image_path as string);
    const uniquePaths = [...new Set(paths)];
    if (uniquePaths.length > 0) {
      await supabase.storage.from("menu-images").remove(uniquePaths);
    }
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .in("id", selectedIds);
    setBusy(false);
    if (error) {
      alert(error.message);
      return;
    }
    clearSelection();
    router.refresh();
  }

  return (
    <div>
      {sel > 0 && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
          <p className="mr-2 text-sm font-medium text-zinc-700">
            Выбрано: {sel}
          </p>
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-zinc-500" htmlFor="bulk-ikpu">
              ИКПУ
            </label>
            <input
              id="bulk-ikpu"
              type="text"
              value={bulkIkpu}
              onChange={(e) => setBulkIkpu(e.target.value)}
              className="w-40 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
              placeholder="Один для всех"
              disabled={busy}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-zinc-500" htmlFor="bulk-pkg">
              Код упаковки
            </label>
            <input
              id="bulk-pkg"
              type="text"
              value={bulkPackage}
              onChange={(e) => setBulkPackage(e.target.value)}
              className="w-40 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
              placeholder="Один для всех"
              disabled={busy}
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void applyIkpuAndPackage()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Применить к выбранным
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void bulkDelete()}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Удалить выбранные
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="text-sm text-zinc-500 hover:text-zinc-800"
            disabled={busy}
          >
            Снять выбор
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/50">
            <tr>
              <th className="w-12 px-3 py-3">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
                  checked={allSelected}
                  onChange={(e) =>
                    e.target.checked ? selectAll() : clearSelection()
                  }
                  disabled={n === 0 || busy}
                  aria-label="Выбрать все"
                />
              </th>
              <th className="w-16 px-3 py-3 font-medium text-zinc-400">Фото</th>
              <th className="px-5 py-3 font-medium text-zinc-400">Название</th>
              <th className="px-5 py-3 font-medium text-zinc-400">Категория</th>
              <th className="px-5 py-3 font-medium text-zinc-400">
                Яндекс ({currency})
              </th>
              <th className="px-5 py-3 font-medium text-zinc-400">
                Uzum ({currency})
              </th>
              <th className="px-5 py-3 font-medium text-zinc-400">Статус</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-16 text-center text-zinc-400"
                >
                  Нет товаров. Сначала{" "}
                  <Link
                    href={`/dashboard/restaurant/${restaurantId}/menu`}
                    className="text-emerald-600 underline"
                  >
                    создайте категорию
                  </Link>{" "}
                  и добавьте позиции.
                </td>
              </tr>
            )}
            {rows.map((item) => {
              const img = menuImagePublicUrl(item.image_path);
              const checked = selectedIds.includes(item.id);
              return (
                <tr
                  key={item.id}
                  className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors"
                >
                  <td className="px-3 py-3 align-middle">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
                      checked={checked}
                      onChange={() => toggle(item.id)}
                      disabled={busy}
                      aria-label={`Выбрать ${item.name}`}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-zinc-100">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-300">
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/dashboard/restaurant/${restaurantId}/menu/item/${item.id}`}
                      className="font-medium text-zinc-900 hover:text-emerald-600"
                    >
                      {item.name}
                    </Link>
                    {item.description && (
                      <p className="mt-0.5 max-w-xs truncate text-xs text-zinc-400">
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                      {categoryNames[item.category_id] ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-zinc-700">
                    {item.price_yandex_eda != null
                      ? Number(item.price_yandex_eda).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-5 py-3 font-mono text-zinc-700">
                    {item.price_uzum_tezkor != null
                      ? Number(item.price_uzum_tezkor).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {item.is_active ? "Активный" : "Скрыт"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
