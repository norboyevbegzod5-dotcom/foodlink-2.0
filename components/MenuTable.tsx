"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";

interface Category {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  product_type: string | null;
  is_active: boolean;
  price_yandex_eda: number | null;
  price_uzum_tezkor: number | null;
  sort_order: number;
}

const PRODUCT_TYPES: Record<string, string> = {
  dish: "Простой",
  drink: "Напиток",
  dessert: "Десерт",
  combo: "Комбо",
  other: "Другое",
};

export default function MenuTable({
  restaurantId,
  currency,
  categories,
  initialItems,
}: {
  restaurantId: string;
  currency: string;
  categories: Category[];
  initialItems: Record<string, unknown>[];
}) {
  const supabaseRef = useRef(createClient());
  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const [items, setItems] = useState<MenuItem[]>(() =>
    initialItems.map((r) => ({
      id: r.id as string,
      category_id: r.category_id as string,
      name: r.name as string,
      description: (r.description as string) ?? null,
      product_type: (r.product_type as string) ?? "dish",
      is_active: r.is_active as boolean,
      price_yandex_eda: r.price_yandex_eda as number | null,
      price_uzum_tezkor: r.price_uzum_tezkor as number | null,
      sort_order: r.sort_order as number,
    })),
  );

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCat, setFilterCat] = useState("all");

  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const persist = useCallback(
    (itemId: string, patch: Partial<MenuItem>) => {
      const existing = debounceTimers.current.get(itemId);
      if (existing) clearTimeout(existing);
      debounceTimers.current.set(
        itemId,
        setTimeout(async () => {
          debounceTimers.current.delete(itemId);
          await supabaseRef.current
            .from("menu_items")
            .update(patch)
            .eq("id", itemId);
        }, 600),
      );
    },
    [],
  );

  const updateLocal = useCallback(
    (itemId: string, patch: Partial<MenuItem>) => {
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
      );
    },
    [],
  );

  const updateField = useCallback(
    (itemId: string, patch: Partial<MenuItem>) => {
      updateLocal(itemId, patch);
      persist(itemId, patch);
    },
    [updateLocal, persist],
  );

  const toggleStatus = useCallback(
    async (itemId: string, current: boolean) => {
      const next = !current;
      updateLocal(itemId, { is_active: next });
      await supabaseRef.current
        .from("menu_items")
        .update({ is_active: next })
        .eq("id", itemId);
    },
    [updateLocal],
  );

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (search && !it.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (filterType !== "all" && (it.product_type ?? "dish") !== filterType)
        return false;
      if (filterStatus === "active" && !it.is_active) return false;
      if (filterStatus === "hidden" && it.is_active) return false;
      if (filterCat !== "all" && it.category_id !== filterCat) return false;
      return true;
    });
  }, [items, search, filterType, filterStatus, filterCat]);

  const selectCls =
    "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-sm text-zinc-400">
        <Link href={`/dashboard/restaurant/${restaurantId}`} className="hover:text-zinc-600">
          Ресторан
        </Link>
        <span>/</span>
        <span className="text-zinc-600">Меню</span>
      </div>

      <h1 className="mb-5 text-2xl font-bold text-zinc-900">Меню</h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Поиск…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={selectCls}
        >
          <option value="all">Тип</option>
          {Object.entries(PRODUCT_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={selectCls}
        >
          <option value="all">Статус</option>
          <option value="active">Активный</option>
          <option value="hidden">Неактивный</option>
        </select>

        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className={selectCls}
        >
          <option value="all">Категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/50">
            <tr>
              <th className="w-10 px-4 py-3 text-center font-medium text-zinc-400">#</th>
              <th className="px-4 py-3 font-medium text-zinc-400">Название</th>
              <th className="px-4 py-3 font-medium text-zinc-400">Категория</th>
              <th className="px-4 py-3 font-medium text-zinc-400">Тип</th>
              <th className="px-4 py-3 font-medium text-zinc-400">Статус</th>
              <th className="px-4 py-3 font-medium text-zinc-400">
                Uzum Tezkor ({currency})
              </th>
              <th className="px-4 py-3 font-medium text-zinc-400">
                Yandex Eats ({currency})
              </th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-zinc-400">
                  Нет позиций
                </td>
              </tr>
            )}
            {filtered.map((item, idx) => (
              <tr
                key={item.id}
                className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/40 transition-colors"
              >
                <td className="px-4 py-2.5 text-center text-zinc-400">
                  {idx + 1}
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/dashboard/restaurant/${restaurantId}/menu/item/${item.id}`}
                    className="font-medium text-zinc-900 hover:text-emerald-600"
                  >
                    {item.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-zinc-500">
                  {catMap.get(item.category_id) ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-zinc-500">
                  {PRODUCT_TYPES[item.product_type ?? "dish"] ?? "Простой"}
                </td>
                <td className="px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => void toggleStatus(item.id, item.is_active)}
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                      item.is_active
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {item.is_active ? "Активный" : "Неактивный"}
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="number"
                    step="1"
                    defaultValue={item.price_uzum_tezkor ?? ""}
                    onChange={(e) =>
                      updateField(item.id, {
                        price_uzum_tezkor: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="w-24 rounded border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                    placeholder="—"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="number"
                    step="1"
                    defaultValue={item.price_yandex_eda ?? ""}
                    onChange={(e) =>
                      updateField(item.id, {
                        price_yandex_eda: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="w-24 rounded border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                    placeholder="—"
                  />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/dashboard/restaurant/${restaurantId}/menu/item/${item.id}`}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 inline-flex"
                    title="Редактировать"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-sm text-zinc-400">
        Показано {filtered.length} из {items.length} позиций
      </div>
    </div>
  );
}
