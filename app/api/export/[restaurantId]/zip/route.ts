import { loadRestaurantExportForUser } from "@/lib/export-load";
import { menuImagePublicUrl } from "@/lib/public-url";
import { createClient } from "@/lib/supabase/server";
import archiver from "archiver";
import { NextResponse } from "next/server";

const SCHEMA_VERSION = 1;

type Aggregator = "yandex" | "uzum";

const AGG_NAMES: Record<Aggregator, string> = {
  yandex: "yandex-eda",
  uzum: "uzum-tezkor",
};

export async function GET(
  request: Request,
  context: { params: Promise<{ restaurantId: string }> },
) {
  const { restaurantId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const aggParam = url.searchParams.get("agg");
  const aggregator: Aggregator = aggParam === "uzum" ? "uzum" : "yandex";

  const data = await loadRestaurantExportForUser(restaurantId, user.id);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { restaurant, categories } = data;

  const manifest = {
    schema_version: SCHEMA_VERSION,
    aggregator,
    exported_at: new Date().toISOString(),
    restaurant: {
      ...restaurant,
      branch_addresses: restaurant.branch_addresses,
    },
    menu: categories.map((c) => ({
      id: c.id,
      name: c.name,
      sort_order: c.sort_order,
      items: c.menu_items.map((it) => ({
        id: it.id,
        name: it.name,
        description: it.description,
        price:
          aggregator === "yandex"
            ? it.price_yandex_eda
            : it.price_uzum_tezkor,
        is_active: it.is_active,
        image_file: it.image_path
          ? `images/${it.id}${extFromPath(it.image_path)}`
          : null,
      })),
    })),
  };

  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  archive.on("data", (c: Buffer) => chunks.push(c));

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    archive.once("end", () => resolve(Buffer.concat(chunks)));
    archive.once("error", reject);

    void (async () => {
      try {
        archive.append(JSON.stringify(manifest, null, 2), {
          name: "manifest.json",
        });

        for (const c of categories) {
          for (const it of c.menu_items) {
            if (!it.image_path) continue;
            const imgUrl = menuImagePublicUrl(it.image_path);
            if (!imgUrl) continue;
            try {
              const res = await fetch(imgUrl);
              if (!res.ok) continue;
              const buf = Buffer.from(await res.arrayBuffer());
              archive.append(buf, {
                name: `images/${it.id}${extFromPath(it.image_path)}`,
              });
            } catch {
              /* skip */
            }
          }
        }

        await archive.finalize();
      } catch (e) {
        reject(e);
      }
    })();
  });

  const safeName =
    restaurant.name?.replace(/[^\wа-яА-ЯёЁ0-9]+/g, "_") || "restaurant";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="foodlink-${safeName}-${AGG_NAMES[aggregator]}.zip"`,
    },
  });
}

function extFromPath(p: string): string {
  const m = p.match(/\.[^./]+$/);
  return m ? m[0] : ".jpg";
}
