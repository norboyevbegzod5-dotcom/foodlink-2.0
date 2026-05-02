import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ItemForm from "@/components/ItemForm";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
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

  const { data: item } = await supabase
    .from("menu_items")
    .select("*, menu_categories!inner(id, name, restaurant_id)")
    .eq("id", itemId)
    .single();

  if (!item || (item.menu_categories as { restaurant_id: string }).restaurant_id !== id)
    notFound();

  const { data: allCats } = await supabase
    .from("menu_categories")
    .select("id, name")
    .eq("restaurant_id", id)
    .order("sort_order");

  const categories = allCats ?? [];

  const catIds = categories.map((c) => c.id);
  const { data: allItems } = await supabase
    .from("menu_items")
    .select("ikpu, package_code")
    .in("category_id", catIds);

  const ikpuSet = new Set<string>();
  const pkgSet = new Set<string>();
  for (const it of allItems ?? []) {
    if (it.ikpu) ikpuSet.add(it.ikpu);
    if (it.package_code) pkgSet.add(it.package_code);
  }

  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-sm text-zinc-400">
        <Link href={`/dashboard/restaurant/${id}`} className="hover:text-zinc-600">
          Ресторан
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/restaurant/${id}/menu`}
          className="hover:text-zinc-600"
        >
          Категории
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/restaurant/${id}/menu/category/${(item.menu_categories as { id: string }).id}`}
          className="hover:text-zinc-600"
        >
          {(item.menu_categories as { name: string }).name}
        </Link>
        <span>/</span>
        <span className="text-zinc-600">{item.name}</span>
      </div>

      <ItemForm
        restaurantId={id}
        item={{
          id: item.id,
          category_id: item.category_id,
          name: item.name,
          description: item.description ?? "",
          price_yandex_eda: item.price_yandex_eda,
          price_uzum_tezkor: item.price_uzum_tezkor,
          image_path: item.image_path,
          is_active: item.is_active,
          sort_order: item.sort_order,
          product_type: item.product_type ?? "dish",
          ikpu: item.ikpu ?? "",
          package_code: item.package_code ?? "",
          barcode: item.barcode ?? "",
          with_marking: item.with_marking ?? false,
        }}
        categories={categories}
        currency={r.currency}
        existingIkpuValues={Array.from(ikpuSet).sort()}
        existingPackageCodes={Array.from(pkgSet).sort()}
      />
    </div>
  );
}
