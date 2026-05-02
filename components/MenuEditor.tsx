"use client";

import { createClient } from "@/lib/supabase/client";
import { menuImagePublicUrl } from "@/lib/public-url";
import type { MenuCategory, MenuItem } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

type CatWithItems = MenuCategory & { menu_items: MenuItem[] };

const INPUT_CLASS =
  "w-full rounded border border-zinc-200 px-2 py-1 text-zinc-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500";
const PRICE_INPUT_CLASS =
  "ml-1 w-28 rounded border border-zinc-200 px-2 py-1 focus:border-amber-500 focus:ring-1 focus:ring-amber-500";

export function MenuEditor({
  restaurantId,
  currency,
  initialCategories,
}: {
  restaurantId: string;
  currency: string;
  initialCategories: CatWithItems[];
}) {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const [cats, setCats] = useState(initialCategories);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const debounceTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const supabase = supabaseRef.current;

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("menu_categories")
      .select("*, menu_items(*)")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true });
    const rows = (data ?? []) as unknown as CatWithItems[];
    for (const c of rows) {
      c.menu_items = (c.menu_items ?? []).sort(
        (a, b) => a.sort_order - b.sort_order,
      );
    }
    setCats(rows);
    router.refresh();
  }, [supabase, restaurantId, router]);

  const debouncedUpdate = useCallback(
    (itemId: string, patch: Partial<MenuItem>) => {
      const existing = debounceTimers.current.get(itemId);
      if (existing) clearTimeout(existing);
      debounceTimers.current.set(
        itemId,
        setTimeout(async () => {
          debounceTimers.current.delete(itemId);
          await supabase.from("menu_items").update(patch).eq("id", itemId);
        }, 600),
      );
    },
    [supabase],
  );

  const updateLocal = useCallback(
    (catId: string, itemId: string, patch: Partial<MenuItem>) => {
      setCats((prev) =>
        prev.map((cc) =>
          cc.id !== catId
            ? cc
            : {
                ...cc,
                menu_items: cc.menu_items.map((i) =>
                  i.id === itemId ? { ...i, ...patch } : i,
                ),
              },
        ),
      );
    },
    [],
  );

  async function addCategory() {
    const name = window.prompt("Название категории (например: Супы)");
    if (!name?.trim()) return;
    setBusy("cat");
    setMsg(null);
    const { error } = await supabase.from("menu_categories").insert({
      restaurant_id: restaurantId,
      name: name.trim(),
      sort_order: cats.length,
    });
    setBusy(null);
    if (error) {
      setMsg(error.message);
      return;
    }
    await refresh();
  }

  async function renameCategory(c: MenuCategory) {
    const name = window.prompt("Новое название", c.name);
    if (!name?.trim() || name.trim() === c.name) return;
    setBusy(c.id);
    await supabase
      .from("menu_categories")
      .update({ name: name.trim() })
      .eq("id", c.id);
    setBusy(null);
    await refresh();
  }

  async function addItem(categoryId: string) {
    const name = window.prompt("Название блюда");
    if (!name?.trim()) return;
    setBusy("item");
    setMsg(null);
    const cat = cats.find((c) => c.id === categoryId);
    const n = cat?.menu_items?.length ?? 0;
    const { error } = await supabase.from("menu_items").insert({
      category_id: categoryId,
      name: name.trim(),
      sort_order: n,
    });
    setBusy(null);
    if (error) {
      setMsg(error.message);
      return;
    }
    await refresh();
  }

  async function uploadImage(item: MenuItem, file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setMsg("Файл слишком большой (макс. 5 МБ)");
      return;
    }
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${restaurantId}/${item.id}.${ext}`;
    setBusy(item.id);
    const { error: upErr } = await supabase.storage
      .from("menu-images")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setMsg(upErr.message);
      setBusy(null);
      return;
    }
    await supabase.from("menu_items").update({ image_path: path }).eq("id", item.id);
    setMsg(null);
    setBusy(null);
    await refresh();
  }

  async function toggleActive(item: MenuItem) {
    setBusy(item.id);
    await supabase
      .from("menu_items")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);
    setBusy(null);
    await refresh();
  }

  async function copyItem(item: MenuItem, categoryId: string) {
    setBusy(item.id);
    const cat = cats.find((c) => c.id === categoryId);
    const n = cat?.menu_items?.length ?? 0;
    await supabase.from("menu_items").insert({
      category_id: categoryId,
      name: `${item.name} (копия)`,
      description: item.description,
      price_yandex_eda: item.price_yandex_eda,
      price_uzum_tezkor: item.price_uzum_tezkor,
      sort_order: n,
    });
    setBusy(null);
    await refresh();
  }

  async function removeCategory(c: MenuCategory) {
    if (!window.confirm(`Удалить категорию «${c.name}» и все позиции внутри?`))
      return;
    setBusy(c.id);
    await supabase.from("menu_categories").delete().eq("id", c.id);
    setBusy(null);
    await refresh();
  }

  async function removeItem(item: MenuItem) {
    if (!window.confirm(`Удалить «${item.name}»?`)) return;
    setBusy(item.id);
    if (item.image_path) {
      await supabase.storage.from("menu-images").remove([item.image_path]);
    }
    await supabase.from("menu_items").delete().eq("id", item.id);
    setBusy(null);
    await refresh();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Меню</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Категории → блюда → фото и цены ({currency}).
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void addCategory()}
            disabled={!!busy}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            + Категория
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            К списку
          </Link>
        </div>
      </div>

      {msg && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          <span>{msg}</span>
          <button
            type="button"
            onClick={() => setMsg(null)}
            className="ml-2 font-bold text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {cats.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          Добавьте первую категорию (например «Напитки» или «Супы»).
        </p>
      )}

      <div className="space-y-8">
        {cats.map((c) => (
          <section
            key={c.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => void renameCategory(c)}
                className="text-lg font-semibold text-zinc-900 hover:text-amber-800"
                title="Переименовать категорию"
              >
                {c.name}
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void addItem(c.id)}
                  disabled={!!busy}
                  className="text-sm font-medium text-amber-800 hover:underline disabled:opacity-50"
                >
                  + Блюдо
                </button>
                <button
                  type="button"
                  onClick={() => void removeCategory(c)}
                  disabled={!!busy}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  Удалить
                </button>
              </div>
            </div>

            {c.menu_items.length === 0 && (
              <p className="mt-4 text-sm text-zinc-400">Нет блюд. Нажмите «+ Блюдо».</p>
            )}

            <ul className="mt-4 divide-y divide-zinc-100">
              {c.menu_items.map((item) => {
                const img = menuImagePublicUrl(item.image_path);
                return (
                  <li
                    key={item.id}
                    className={`flex flex-col gap-3 py-4 md:flex-row md:items-start ${
                      !item.is_active ? "opacity-50" : ""
                    }`}
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                          Нет фото
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        className={`${INPUT_CLASS} font-medium`}
                        defaultValue={item.name}
                        disabled={busy === item.id}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== item.name) {
                            updateLocal(c.id, item.id, { name: v });
                            debouncedUpdate(item.id, { name: v });
                          }
                        }}
                      />
                      <textarea
                        className={`${INPUT_CLASS} text-sm text-zinc-700`}
                        placeholder="Описание (необязательно)"
                        rows={2}
                        defaultValue={item.description ?? ""}
                        onBlur={(e) => {
                          const v = e.target.value.trim() || null;
                          if (v !== (item.description ?? null)) {
                            updateLocal(c.id, item.id, { description: v });
                            debouncedUpdate(item.id, { description: v });
                          }
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="text-xs text-zinc-500">
                          Яндекс Еда ({currency})
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={PRICE_INPUT_CLASS}
                            defaultValue={item.price_yandex_eda ?? ""}
                            onBlur={(e) => {
                              const v = e.target.value;
                              const num = v === "" ? null : parseFloat(v);
                              if (num !== item.price_yandex_eda) {
                                updateLocal(c.id, item.id, { price_yandex_eda: num });
                                debouncedUpdate(item.id, { price_yandex_eda: num });
                              }
                            }}
                          />
                        </label>
                        <label className="text-xs text-zinc-500">
                          Uzum Tezkor ({currency})
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={PRICE_INPUT_CLASS}
                            defaultValue={item.price_uzum_tezkor ?? ""}
                            onBlur={(e) => {
                              const v = e.target.value;
                              const num = v === "" ? null : parseFloat(v);
                              if (num !== item.price_uzum_tezkor) {
                                updateLocal(c.id, item.id, {
                                  price_uzum_tezkor: num,
                                });
                                debouncedUpdate(item.id, { price_uzum_tezkor: num });
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <label className="flex cursor-pointer items-center text-xs text-zinc-600">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="w-36 text-xs"
                            disabled={busy === item.id}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void uploadImage(item, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className="text-xs text-zinc-500 hover:text-amber-800 hover:underline"
                          onClick={() => void toggleActive(item)}
                          disabled={!!busy}
                        >
                          {item.is_active ? "Скрыть" : "Показать"}
                        </button>
                        <button
                          type="button"
                          className="text-xs text-zinc-500 hover:text-amber-800 hover:underline"
                          onClick={() => void copyItem(item, c.id)}
                          disabled={!!busy}
                        >
                          Копировать
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => void removeItem(item)}
                          disabled={!!busy}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
