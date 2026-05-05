import { loadRestaurantExportForUser } from "@/lib/export-load";
import {
  RestaurantPdfDocument,
  type Aggregator,
} from "@/lib/pdf/restaurant-document";
import { menuImagePublicUrl, restaurantLogoPublicUrl } from "@/lib/public-url";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

const AGG_NAMES: Record<Aggregator, string> = {
  yandex: "yandex-eda",
  uzum: "uzum-tezkor",
};

async function fetchImageAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

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

  const imageMap: Record<string, string> = {};
  const fetches: Promise<void>[] = [];

  let logoDataUri: string | null = null;
  const logoUrl = restaurantLogoPublicUrl(data.restaurant.logo_path);
  if (logoUrl) {
    fetches.push(
      fetchImageAsDataUri(logoUrl).then((dataUri) => {
        if (dataUri) logoDataUri = dataUri;
      }),
    );
  }

  for (const cat of data.categories) {
    for (const item of cat.menu_items) {
      if (!item.image_path) continue;
      const imgUrl = menuImagePublicUrl(item.image_path);
      if (!imgUrl) continue;
      fetches.push(
        fetchImageAsDataUri(imgUrl).then((dataUri) => {
          if (dataUri) imageMap[item.id] = dataUri;
        }),
      );
    }
  }
  await Promise.all(fetches);

  const buffer = await renderToBuffer(
    <RestaurantPdfDocument
      restaurant={data.restaurant}
      categories={data.categories}
      aggregator={aggregator}
      imageMap={imageMap}
      logoDataUri={logoDataUri}
    />,
  );

  const safeName =
    data.restaurant.name?.replace(/[^\wа-яА-ЯёЁ0-9]+/g, "_") || "restaurant";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="foodlink-${safeName}-${AGG_NAMES[aggregator]}.pdf"`,
    },
  });
}
