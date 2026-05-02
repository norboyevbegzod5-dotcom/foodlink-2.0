"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function AddItemWithCategoryButton({
  restaurantId,
  categories,
}: {
  restaurantId: string;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function addToCategory(categoryId: string) {
    setOpen(false);
    const name = window.prompt("Название блюда");
    if (!name?.trim()) return;
    setBusy(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("menu_items")
      .insert({
        category_id: categoryId,
        name: name.trim(),
        sort_order: 0,
      })
      .select("id")
      .single();
    setBusy(false);
    if (data) {
      router.push(
        `/dashboard/restaurant/${restaurantId}/menu/item/${data.id}`,
      );
    } else {
      router.refresh();
    }
  }

  if (categories.length === 0) {
    return (
      <a
        href={`/dashboard/restaurant/${restaurantId}/menu`}
        className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 transition-colors"
      >
        Сначала создайте категорию
      </a>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors"
      >
        {busy ? "Создание…" : "+ Добавить товар"}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-zinc-100 bg-white py-1.5 shadow-lg">
            <p className="px-4 py-1.5 text-xs font-medium text-zinc-400">
              Выберите категорию
            </p>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => void addToCategory(c.id)}
                className="flex w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {c.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
