import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AddItemWithCategoryButton } from "@/components/AddItemWithCategory";
import ItemsTable from "@/components/ItemsTable";

export default async function AllItemsPage({
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

  const { data: r } = await supabase
    .from("restaurants")
    .select("id, owner_id, currency")
    .eq("id", id)
    .single();
  if (!r || r.owner_id !== user.id) redirect("/dashboard");

  const { data: cats } = await supabase
    .from("menu_categories")
    .select("id, name")
    .eq("restaurant_id", id)
    .order("sort_order");

  const catMap = new Map((cats ?? []).map((c) => [c.id, c.name]));

  const { data: items } = await supabase
    .from("menu_items")
    .select("*")
    .in("category_id", Array.from(catMap.keys()))
    .order("sort_order", { ascending: true });

  const rows = items ?? [];

  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-sm text-zinc-400">
        <Link href={`/dashboard/restaurant/${id}`} className="hover:text-zinc-600">
          Ресторан
        </Link>
        <span>/</span>
        <span className="text-zinc-600">Товары</span>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">
          Товары
          <span className="ml-2 text-base font-normal text-zinc-400">
            · {rows.length} позиций
          </span>
        </h1>
        <AddItemWithCategoryButton
          restaurantId={id}
          categories={cats ?? []}
        />
      </div>

      <ItemsTable
        restaurantId={id}
        currency={r.currency}
        rows={rows}
        categoryNames={Object.fromEntries(catMap)}
      />
    </div>
  );
}
