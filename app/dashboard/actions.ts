"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createRestaurantAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("restaurants")
    .insert({
      owner_id: user.id,
      name: "Новый ресторан",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    redirect("/dashboard");
  }
  redirect(`/dashboard/restaurant/${data.id}`);
}
