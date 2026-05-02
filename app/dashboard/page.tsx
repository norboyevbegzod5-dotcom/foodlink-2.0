import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/lib/types";
import { createRestaurantAction } from "@/app/dashboard/actions";
import { StatCard } from "@/components/StatCard";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("restaurants")
    .select("id, name, city, updated_at, status")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  const restaurants = (rows ?? []) as Pick<
    Restaurant,
    "id" | "name" | "city" | "updated_at" | "status"
  >[];

  const total = restaurants.length;
  const submitted = restaurants.filter((r) => r.status === "submitted").length;

  const { count: menuItemsCount } = await supabase
    .from("menu_items")
    .select("id", { count: "exact", head: true })
    .in(
      "category_id",
      (
        await supabase
          .from("menu_categories")
          .select("id")
          .in(
            "restaurant_id",
            restaurants.map((r) => r.id),
          )
      ).data?.map((c) => c.id) ?? [],
    );

  const { count: catCount } = await supabase
    .from("menu_categories")
    .select("id", { count: "exact", head: true })
    .in(
      "restaurant_id",
      restaurants.map((r) => r.id),
    );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Главная</h1>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ресторанов"
          value={total}
          color="green"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatCard
          label="Категорий меню"
          value={catCount ?? 0}
          color="blue"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          }
        />
        <StatCard
          label="Позиций меню"
          value={menuItemsCount ?? 0}
          color="orange"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="Готово к отправке"
          value={submitted}
          color="purple"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-900">Рестораны</h2>
        <form action={createRestaurantAction}>
          <button
            type="submit"
            className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 transition-colors"
          >
            + Добавить ресторан
          </button>
        </form>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/50">
            <tr>
              <th className="px-5 py-3 font-medium text-zinc-500">Название</th>
              <th className="px-5 py-3 font-medium text-zinc-500">Город</th>
              <th className="px-5 py-3 font-medium text-zinc-500">Статус</th>
              <th className="px-5 py-3 font-medium text-zinc-500">Обновлено</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {restaurants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-zinc-400">
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
                <td className="px-5 py-3.5 text-zinc-400">
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
