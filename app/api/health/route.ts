import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    const { data: tables, error: tableErr } = await supabase
      .from("restaurants")
      .select("id")
      .limit(1);

    return NextResponse.json({
      ok: true,
      user: user?.email ?? null,
      authError: authErr?.message ?? null,
      tableExists: !tableErr,
      tableError: tableErr?.message ?? null,
      tableCode: tableErr?.code ?? null,
      rows: tables?.length ?? 0,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: String(e),
    });
  }
}
