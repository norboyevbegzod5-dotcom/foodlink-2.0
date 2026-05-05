import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

interface RowData {
  "Категория"?: string;
  "Название товара"?: string;
  "Описание"?: string;
  "Цена Яндекс Еда"?: number | string;
  "Цена Uzum Tezkor"?: number | string;
  "Вес (г)"?: number | string;
  "Калории"?: number | string;
  "Белки"?: number | string;
  "Жиры"?: number | string;
  "Углеводы"?: number | string;
  "Тип продукта"?: string;
  "ИКПУ"?: string;
  "Код упаковки"?: string;
  "Штрих-код"?: string;
  "Активный"?: string;
}

function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
  return isNaN(num) ? null : num;
}

function parseBoolean(val: unknown): boolean {
  if (val === null || val === undefined || val === "") return true;
  const str = String(val).toLowerCase().trim();
  return str !== "нет" && str !== "no" && str !== "false" && str !== "0";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, owner_id")
    .eq("id", restaurantId)
    .single();

  if (!restaurant || restaurant.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const sheetName = workbook.SheetNames.find(
      (name) => name.toLowerCase() === "товары" || name.toLowerCase() === "items"
    ) || workbook.SheetNames[0];

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<RowData>(sheet);

    if (rows.length === 0) {
      return NextResponse.json({ error: "No data found in file" }, { status: 400 });
    }

    const categoryMap = new Map<string, string>();
    const categoryOrder: string[] = [];

    for (const row of rows) {
      const catName = row["Категория"]?.toString().trim();
      if (catName && !categoryMap.has(catName)) {
        categoryOrder.push(catName);
      }
    }

    const { data: existingCategories } = await supabase
      .from("menu_categories")
      .select("id, name, sort_order")
      .eq("restaurant_id", restaurantId);

    let maxSortOrder = 0;
    for (const cat of existingCategories ?? []) {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
      if (cat.sort_order > maxSortOrder) maxSortOrder = cat.sort_order;
    }

    const newCategories: { restaurant_id: string; name: string; sort_order: number }[] = [];
    for (const catName of categoryOrder) {
      if (!categoryMap.has(catName.toLowerCase())) {
        maxSortOrder++;
        newCategories.push({
          restaurant_id: restaurantId,
          name: catName,
          sort_order: maxSortOrder,
        });
      }
    }

    if (newCategories.length > 0) {
      const { data: insertedCategories, error: catError } = await supabase
        .from("menu_categories")
        .insert(newCategories)
        .select("id, name");

      if (catError) {
        return NextResponse.json({ error: `Category error: ${catError.message}` }, { status: 500 });
      }

      for (const cat of insertedCategories ?? []) {
        categoryMap.set(cat.name.toLowerCase(), cat.id);
      }
    }

    const itemSortOrders = new Map<string, number>();
    for (const [, catId] of categoryMap) {
      itemSortOrders.set(catId, 0);
    }

    const { data: existingItems } = await supabase
      .from("menu_items")
      .select("category_id, sort_order")
      .in("category_id", Array.from(categoryMap.values()));

    for (const item of existingItems ?? []) {
      const current = itemSortOrders.get(item.category_id) ?? 0;
      if (item.sort_order > current) {
        itemSortOrders.set(item.category_id, item.sort_order);
      }
    }

    const itemsToInsert: {
      category_id: string;
      name: string;
      description: string | null;
      price_yandex_eda: number | null;
      price_uzum_tezkor: number | null;
      weight_grams: number | null;
      calories: number | null;
      proteins: number | null;
      fats: number | null;
      carbs: number | null;
      product_type: string;
      ikpu: string | null;
      package_code: string | null;
      barcode: string | null;
      is_active: boolean;
      sort_order: number;
    }[] = [];

    for (const row of rows) {
      const catName = row["Категория"]?.toString().trim();
      const itemName = row["Название товара"]?.toString().trim();

      if (!catName || !itemName) continue;

      const categoryId = categoryMap.get(catName.toLowerCase());
      if (!categoryId) continue;

      const currentSort = itemSortOrders.get(categoryId) ?? 0;
      const newSort = currentSort + 1;
      itemSortOrders.set(categoryId, newSort);

      const productType = row["Тип продукта"]?.toString().toLowerCase().trim() || "dish";
      const validTypes = ["dish", "drink", "dessert", "combo", "other"];

      itemsToInsert.push({
        category_id: categoryId,
        name: itemName,
        description: row["Описание"]?.toString().trim() || null,
        price_yandex_eda: parseNumber(row["Цена Яндекс Еда"]),
        price_uzum_tezkor: parseNumber(row["Цена Uzum Tezkor"]),
        weight_grams: parseNumber(row["Вес (г)"]),
        calories: parseNumber(row["Калории"]),
        proteins: parseNumber(row["Белки"]),
        fats: parseNumber(row["Жиры"]),
        carbs: parseNumber(row["Углеводы"]),
        product_type: validTypes.includes(productType) ? productType : "dish",
        ikpu: row["ИКПУ"]?.toString().trim() || null,
        package_code: row["Код упаковки"]?.toString().trim() || null,
        barcode: row["Штрих-код"]?.toString().trim() || null,
        is_active: parseBoolean(row["Активный"]),
        sort_order: newSort,
      });
    }

    if (itemsToInsert.length === 0) {
      return NextResponse.json({ error: "No valid items found in file" }, { status: 400 });
    }

    const { error: itemError } = await supabase
      .from("menu_items")
      .insert(itemsToInsert);

    if (itemError) {
      return NextResponse.json({ error: `Item error: ${itemError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      categoriesCreated: newCategories.length,
      itemsCreated: itemsToInsert.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
