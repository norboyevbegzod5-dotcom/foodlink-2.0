import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

const SCHEMA_VERSION = 1;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: restaurantId } = await context.params;
  const apiKey = request.headers.get("x-api-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const keyHash = createHash("sha256").update(apiKey).digest("hex");

  let svc;
  try {
    svc = createServiceClient();
  } catch {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { data: keyRow, error: keyErr } = await svc
    .from("api_keys")
    .select("user_id")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (keyErr || !keyRow) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { data: restaurant, error: re } = await svc
    .from("restaurants")
    .select("*")
    .eq("id", restaurantId)
    .maybeSingle();

  if (re || !restaurant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (restaurant.owner_id !== keyRow.user_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rawCats } = await svc
    .from("menu_categories")
    .select("*, menu_items(*)")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true });

  const menu = (rawCats ?? []).map((c: Record<string, unknown>) => {
    const items = [...((c.menu_items as Record<string, unknown>[]) ?? [])].sort(
      (a, b) =>
        (a.sort_order as number) - (b.sort_order as number),
    );
    return {
      id: c.id,
      name: c.name,
      sort_order: c.sort_order,
      items,
    };
  });

  return NextResponse.json({
    schema_version: SCHEMA_VERSION,
    restaurant,
    menu,
  });
}
