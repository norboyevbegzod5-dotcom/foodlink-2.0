import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CategoryForm from "@/components/CategoryForm";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string; catId: string }>;
}) {
  const { id, catId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: r } = await supabase
    .from("restaurants")
    .select("id, owner_id")
    .eq("id", id)
    .single();
  if (!r || r.owner_id !== user.id) redirect("/dashboard");

  const { data: cat } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("id", catId)
    .single();
  if (!cat) notFound();

  const { data: allCats } = await supabase
    .from("menu_categories")
    .select("id, name")
    .eq("restaurant_id", id)
    .order("sort_order");

  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-sm text-zinc-400">
        <Link href={`/dashboard`} className="hover:text-zinc-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" />
          </svg>
        </Link>
        <span>/</span>
        <Link href={`/dashboard/restaurant/${id}/menu`} className="hover:text-zinc-600">
          Каталог
        </Link>
        <span>/</span>
        <Link href={`/dashboard/restaurant/${id}/menu`} className="hover:text-zinc-600">
          Категория
        </Link>
        <span>/</span>
        <span className="text-zinc-600">{cat.name}</span>
      </div>

      <CategoryForm
        restaurantId={id}
        category={{
          id: cat.id,
          name: cat.name,
          description: cat.description ?? "",
          image_path: cat.image_path ?? null,
          sort_order: cat.sort_order,
        }}
        allCategories={allCats ?? []}
      />
    </div>
  );
}
