import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function ExportPage({
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

  const { data: r, error } = await supabase
    .from("restaurants")
    .select("id, name, owner_id")
    .eq("id", id)
    .single();

  if (error || !r) notFound();
  if (r.owner_id !== user.id) redirect("/dashboard");

  const cards = [
    {
      label: "Яндекс Еда — PDF",
      desc: "Анкета + меню с ценами для Яндекс Еда",
      href: `/api/export/${id}/pdf?agg=yandex`,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      label: "Uzum Tezkor — PDF",
      desc: "Анкета + меню с ценами для Uzum Tezkor",
      href: `/api/export/${id}/pdf?agg=uzum`,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-500",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      label: "Яндекс Еда — ZIP",
      desc: "manifest.json + images/ для Яндекс Еда",
      href: `/api/export/${id}/zip?agg=yandex`,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
    {
      label: "Uzum Tezkor — ZIP",
      desc: "manifest.json + images/ для Uzum Tezkor",
      href: `/api/export/${id}/zip?agg=uzum`,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Экспорт</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Скачайте анкету и меню отдельно для каждого агрегатора.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <a
            key={c.href}
            href={c.href}
            className="flex items-center gap-4 rounded-xl border border-zinc-100 bg-white p-6 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/30"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.iconBg} ${c.iconColor}`}
            >
              {c.icon}
            </div>
            <div>
              <p className="font-semibold text-zinc-900">{c.label}</p>
              <p className="text-xs text-zinc-500">{c.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
