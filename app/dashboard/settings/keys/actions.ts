"use server";

import { createClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";
import { redirect } from "next/navigation";

export async function createApiKeyAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const label = String(formData.get("label") ?? "").trim() || null;
  const raw = `fl_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(raw).digest("hex");
  const keyPrefix = raw.slice(0, 14);

  const { error } = await supabase.from("api_keys").insert({
    user_id: user.id,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    label,
  });

  if (error) {
    redirect("/dashboard/settings/keys?error=1");
  }

  redirect(`/dashboard/settings/keys/created?key=${encodeURIComponent(raw)}`);
}
