import { createClient } from "@/lib/supabase/server";
import type { MenuCategory, MenuItem, Restaurant } from "@/lib/types";
import { normalizeRestaurant } from "@/lib/normalize";

export type ExportCategory = MenuCategory & { menu_items: MenuItem[] };

export async function loadRestaurantExportForUser(
  restaurantId: string,
  userId: string,
): Promise<{ restaurant: Restaurant; categories: ExportCategory[] } | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", restaurantId)
    .single();

  if (!row || row.owner_id !== userId) return null;

  const restaurant = normalizeRestaurant(row as Record<string, unknown>);

  const { data: rawCats } = await supabase
    .from("menu_categories")
    .select("*, menu_items(*)")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true });

  const categories: ExportCategory[] = (rawCats ?? []).map((cat) => {
    const c = cat as MenuCategory & { menu_items: MenuItem[] | null };
    const items = [...(c.menu_items ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    return { ...c, menu_items: items };
  });

  return { restaurant, categories };
}
