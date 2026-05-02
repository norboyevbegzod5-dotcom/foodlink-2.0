import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MenuTable from "@/components/MenuTable";

export default async function MenuTablePage({
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

  const categories = cats ?? [];
  const catIds = categories.map((c) => c.id);

  let items: Record<string, unknown>[] = [];
  if (catIds.length > 0) {
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .in("category_id", catIds)
      .order("sort_order", { ascending: true });
    items = (data ?? []) as Record<string, unknown>[];
  }

  return (
    <MenuTable
      restaurantId={id}
      currency={r.currency}
      categories={categories}
      initialItems={items}
    />
  );
}
