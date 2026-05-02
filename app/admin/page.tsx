import { Sidebar } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") {
    redirect("/dashboard");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, created_at")
    .order("created_at", { ascending: false });

  const { data: rests } = await supabase.from("restaurants").select("owner_id");
  const countByOwner = new Map<string, number>();
  for (const r of rests ?? []) {
    countByOwner.set(r.owner_id, (countByOwner.get(r.owner_id) ?? 0) + 1);
  }

  const totalUsers = (profiles ?? []).length;
  const totalRestaurants = (rests ?? []).length;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar email={user.email} isSuperadmin={true} />
      <main className="ml-60 min-h-screen px-8 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Админка</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Все зарегистрированные пользователи.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Пользователей"
            value={totalUsers}
            color="green"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            label="Ресторанов"
            value={totalRestaurants}
            color="orange"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <StatCard
            label="Суперадминов"
            value={(profiles ?? []).filter((p) => p.role === "superadmin").length}
            color="purple"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/50">
              <tr>
                <th className="px-5 py-3 font-medium text-zinc-500">Email</th>
                <th className="px-5 py-3 font-medium text-zinc-500">Имя</th>
                <th className="px-5 py-3 font-medium text-zinc-500">Роль</th>
                <th className="px-5 py-3 font-medium text-zinc-500">Ресторанов</th>
                <th className="px-5 py-3 font-medium text-zinc-500">Дата</th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium text-zinc-900">
                    {p.email ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600">
                    {p.display_name ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.role === "superadmin"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {p.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600">
                    {countByOwner.get(p.id) ?? 0}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleString("ru-RU")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
