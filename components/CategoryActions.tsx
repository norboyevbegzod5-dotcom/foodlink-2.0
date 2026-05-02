"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function AddCategoryButton({
  restaurantId,
  count,
}: {
  restaurantId: string;
  count: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function add() {
    const name = window.prompt("Название категории (например: Супы)");
    if (!name?.trim()) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("menu_categories").insert({
      restaurant_id: restaurantId,
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

export function CategoryActions({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function rename() {
    setOpen(false);
    const name = window.prompt("Новое название", categoryName);
    if (!name?.trim() || name.trim() === categoryName) return;
    const supabase = createClient();
    await supabase
      .from("menu_categories")
      .update({ name: name.trim() })
      .eq("id", categoryId);
    router.refresh();
  }

  async function remove() {
    setOpen(false);
    if (!window.confirm(`Удалить категорию «${categoryName}» и все позиции?`))
      return;
    const supabase = createClient();
    await supabase.from("menu_categories").delete().eq("id", categoryId);
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
            <button
              onClick={() => void rename()}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Переименовать
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
