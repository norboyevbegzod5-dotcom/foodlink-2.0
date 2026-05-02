import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/lib/types";
import { createRestaurantAction } from "@/app/dashboard/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function RestaurantsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("restaurants")
    .select("id, name, city, establishment_type, cuisine_main, updated_at, status")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  const restaurants = (rows ?? []) as (Pick<
    Restaurant,
    "id" | "name" | "city" | "updated_at" | "status"
  > & { establishment_type: string | null; cuisine_main: string | null })[];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Рестораны</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Управление карточками ресторанов, анкетами и меню.
          </p>
        </div>
        <form action={createRestaurantAction}>
          <button
            type="submit"
            className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 transition-colors"
          >
            + Добавить ресторан
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/50">
            <tr>
              <th className="px-5 py-3 font-medium text-zinc-500">Название</th>
              <th className="hidden px-5 py-3 font-medium text-zinc-500 md:table-cell">
                Тип / Кухня
              </th>
              <th className="px-5 py-3 font-medium text-zinc-500">Город</th>
              <th className="px-5 py-3 font-medium text-zinc-500">Статус</th>
              <th className="hidden px-5 py-3 font-medium text-zinc-500 sm:table-cell">
                Обновлено
              </th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {restaurants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-zinc-400">
                  Пока нет ресторанов. Нажмите «Добавить ресторан».
                </td>
              </tr>
            )}
            {restaurants.map((r) => (
              <tr
                key={r.id}
                className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors"
              >
                <td className="px-5 py-3.5 font-medium text-zinc-900">
                  {r.name || "Без названия"}
                </td>
                <td className="hidden px-5 py-3.5 text-zinc-500 md:table-cell">
                  {[r.establishment_type, r.cuisine_main]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td className="px-5 py-3.5 text-zinc-600">{r.city || "—"}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      r.status === "submitted"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {r.status === "draft" ? "Черновик" : "Готово"}
                  </span>
                </td>
                <td className="hidden px-5 py-3.5 text-zinc-400 sm:table-cell">
                  {new Date(r.updated_at).toLocaleDateString("ru-RU")}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/dashboard/restaurant/${r.id}`}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Открыть →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
