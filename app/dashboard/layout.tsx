import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const isSuperadmin = profile?.role === "superadmin";

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar email={user.email} isSuperadmin={isSuperadmin} />
      <main className="ml-60 min-h-screen px-8 py-8">{children}</main>
    </div>
  );
}
