import { createApiKeyAction } from "@/app/dashboard/settings/keys/actions";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ApiKeysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, key_prefix, label, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-amber-800 underline">
          ← К ресторанам
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900">API-ключи</h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-600">
        Ключ передаётся в заголовке{" "}
        <code className="rounded bg-zinc-100 px-1">X-API-Key</code> для запроса{" "}
        <code className="rounded bg-zinc-100 px-1">GET /api/v1/restaurants/&#123;id&#125;</code>.
        Сохраните ключ при создании — он показывается один раз.
      </p>

      <form action={createApiKeyAction} className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-600">Подпись (необязательно)</label>
          <input
            name="label"
            placeholder="Партнёр / скрипт"
            className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Создать ключ
        </button>
      </form>

      <ul className="mt-8 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {(keys ?? []).length === 0 && (
          <li className="p-6 text-sm text-zinc-500">Ключей пока нет.</li>
        )}
        {(keys ?? []).map((k) => (
          <li key={k.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
            <span className="font-mono text-zinc-800">{k.key_prefix}…</span>
            <span className="text-zinc-500">
              {k.label ?? "—"} ·{" "}
              {k.created_at ? new Date(k.created_at).toLocaleString("ru-RU") : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
