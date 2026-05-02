"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function AddItemButton({
  categoryId,
  count,
}: {
  categoryId: string;
  count: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function add() {
    const name = window.prompt("Название блюда");
    if (!name?.trim()) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("menu_items").insert({
      category_id: categoryId,
      name: name.trim(),
      sort_order: count,
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void add()}
      disabled={busy}
      className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors"
    >
      + Добавить
    </button>
  );
}

export function ItemActions({
  itemId,
  itemName,
  imagePath,
  restaurantId,
  categoryId,
}: {
  itemId: string;
  itemName: string;
  imagePath: string | null;
  restaurantId: string;
  categoryId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function duplicate() {
    setOpen(false);
    const supabase = createClient();
    const { data: orig } = await supabase
      .from("menu_items")
      .select("*")
      .eq("id", itemId)
      .single();
    if (!orig) return;
    await supabase.from("menu_items").insert({
      category_id: categoryId,
      name: `${orig.name} (копия)`,
      description: orig.description,
      price_yandex_eda: orig.price_yandex_eda,
      price_uzum_tezkor: orig.price_uzum_tezkor,
      sort_order: orig.sort_order + 1,
    });
    router.refresh();
  }

  async function remove() {
    setOpen(false);
    if (!window.confirm(`Удалить «${itemName}»?`)) return;
    const supabase = createClient();
    if (imagePath) {
      await supabase.storage.from("menu-images").remove([imagePath]);
    }
    await supabase.from("menu_items").delete().eq("id", itemId);
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-zinc-100 bg-white py-1.5 shadow-lg">
            <a
              href={`/dashboard/restaurant/${restaurantId}/menu/item/${itemId}`}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Редактировать
            </a>
            <button
              onClick={() => void duplicate()}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Дублировать
            </button>
            <button
              onClick={() => void remove()}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Удалить
            </button>
          </div>
        </>
      )}
    </div>
  );
}
