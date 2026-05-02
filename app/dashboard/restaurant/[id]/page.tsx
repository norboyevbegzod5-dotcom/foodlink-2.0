import { RestaurantForm } from "@/components/RestaurantForm";
import { createClient } from "@/lib/supabase/server";
import { normalizeRestaurant } from "@/lib/normalize";
import { notFound, redirect } from "next/navigation";

export default async function RestaurantPage({
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

  const { data: row, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !row) notFound();
  if (row.owner_id !== user.id) redirect("/dashboard");

  const restaurant = normalizeRestaurant(row as Record<string, unknown>);

  return <RestaurantForm initial={restaurant} />;
}
