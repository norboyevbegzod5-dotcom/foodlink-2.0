import { createClient } from "@/lib/supabase/server";
import { menuImagePublicUrl } from "@/lib/public-url";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AddCategoryButton, CategoryActions } from "@/components/CategoryActions";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: r, error: re } = await supabase
    .from("restaurants")
    .select("id, owner_id, currency")
    .eq("id", id)
    .single();

  if (re || !r) notFound();
  if (r.owner_id !== user.id) redirect("/dashboard");

  const { data: cats } = await supabase
    .from("menu_categories")
    .select("*, menu_items(id, image_path)")
    .eq("restaurant_id", id)
    .order("sort_order", { ascending: true });

  type CatRow = {
    id: string;
    name: string;
    sort_order: number;
    created_at: string;
    menu_items: { id: string; image_path: string | null }[] | null;
  };

  const categories = (cats ?? []) as CatRow[];

  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-sm text-zinc-400">
        <Link href={`/dashboard/restaurant/${id}`} className="hover:text-zinc-600">
          Ресторан
        </Link>
        <span>/</span>
        <span className="text-zinc-600">Категории</span>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">Категории</h1>
        <AddCategoryButton restaurantId={id} count={categories.length} />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/50">
            <tr>
              <th className="w-16 px-5 py-3 font-medium text-zinc-400">Фото</th>
              <th className="px-5 py-3 font-medium text-zinc-400">Название</th>
              <th className="px-5 py-3 font-medium text-zinc-400">Позиций</th>
              <th className="px-5 py-3 font-medium text-zinc-400">Дата</th>
              <th className="px-5 py-3 font-medium text-zinc-400">Статус</th>
              <th className="w-16 px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-zinc-400">
                  Нет категорий. Нажмите «+ Добавить».
                </td>
              </tr>
            )}
            {categories.map((c) => {
              const firstImg = (c.menu_items ?? []).find((i) => i.image_path);
              const thumb = firstImg
                ? menuImagePublicUrl(firstImg.image_path)
                : null;
              const itemCount = (c.menu_items ?? []).length;

              return (
                <tr
                  key={c.id}
                  className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-zinc-100">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-300">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/dashboard/restaurant/${id}/menu/category/${c.id}`}
                      className="font-medium text-zinc-900 hover:text-emerald-600"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-zinc-500">{itemCount}</td>
                  <td className="px-5 py-3 text-zinc-400">
                    {new Date(c.created_at).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      Активный
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <CategoryActions categoryId={c.id} categoryName={c.name} />
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
