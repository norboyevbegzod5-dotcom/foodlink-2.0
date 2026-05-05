import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(
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

  const exampleData = [
    {
      "Категория": "Пицца",
      "Название товара": "Маргарита",
      "Описание": "Классическая пицца с томатами и моцареллой",
      "Цена Яндекс Еда": 45000,
      "Цена Uzum Tezkor": 44000,
      "Вес (г)": 450,
      "Калории": 250,
      "Белки": 12,
      "Жиры": 10,
      "Углеводы": 30,
      "Тип продукта": "dish",
      "ИКПУ": "",
      "Код упаковки": "",
      "Штрих-код": "",
      "Активный": "да",
    },
    {
      "Категория": "Пицца",
      "Название товара": "Пепперони",
      "Описание": "Острая пицца с салями пепперони",
      "Цена Яндекс Еда": 55000,
      "Цена Uzum Tezkor": 54000,
      "Вес (г)": 480,
      "Калории": 290,
      "Белки": 14,
      "Жиры": 15,
      "Углеводы": 28,
      "Тип продукта": "dish",
      "ИКПУ": "",
      "Код упаковки": "",
      "Штрих-код": "",
      "Активный": "да",
    },
    {
      "Категория": "Напитки",
      "Название товара": "Кола 0.5л",
      "Описание": "Охлаждённый напиток",
      "Цена Яндекс Еда": 12000,
      "Цена Uzum Tezkor": 11000,
      "Вес (г)": 500,
      "Калории": 210,
      "Белки": 0,
      "Жиры": 0,
      "Углеводы": 52,
      "Тип продукта": "drink",
      "ИКПУ": "",
      "Код упаковки": "",
      "Штрих-код": "",
      "Активный": "да",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(exampleData);

  ws["!cols"] = [
    { wch: 15 },  // Категория
    { wch: 25 },  // Название товара
    { wch: 40 },  // Описание
    { wch: 18 },  // Цена Яндекс Еда
    { wch: 18 },  // Цена Uzum Tezkor
    { wch: 10 },  // Вес
    { wch: 10 },  // Калории
    { wch: 8 },   // Белки
    { wch: 8 },   // Жиры
    { wch: 10 },  // Углеводы
    { wch: 14 },  // Тип продукта
    { wch: 15 },  // ИКПУ
    { wch: 15 },  // Код упаковки
    { wch: 15 },  // Штрих-код
    { wch: 10 },  // Активный
  ];

  const instructionData = [
    ["ИНСТРУКЦИЯ ПО ЗАПОЛНЕНИЮ ШАБЛОНА"],
    [""],
    ["1. Категория — название категории меню (товары с одинаковой категорией будут сгруппированы)"],
    ["2. Название товара — обязательное поле"],
    ["3. Описание — описание блюда/напитка"],
    ["4. Цена Яндекс Еда — цена в сумах для Яндекс Еда"],
    ["5. Цена Uzum Tezkor — цена в сумах для Uzum Tezkor"],
    ["6. Вес (г) — вес в граммах"],
    ["7. Калории, Белки, Жиры, Углеводы — пищевая ценность"],
    ["8. Тип продукта — dish (блюдо), drink (напиток), dessert (десерт), combo (комбо), other (другое)"],
    ["9. ИКПУ, Код упаковки, Штрих-код — для внешних систем (опционально)"],
    ["10. Активный — да/нет (по умолчанию да)"],
    [""],
    ["ВАЖНО:"],
    ["• Не меняйте названия колонок в листе 'Товары'"],
    ["• Категории создаются автоматически из уникальных значений колонки 'Категория'"],
    ["• Порядок категорий и товаров определяется порядком строк в файле"],
    ["• Пустые строки игнорируются"],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionData);
  wsInstructions["!cols"] = [{ wch: 80 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Товары");
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Инструкция");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const safeName = restaurant.name?.replace(/[^\wа-яА-ЯёЁ0-9]+/g, "_") || "restaurant";

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="foodlink-template-${safeName}.xlsx"`,
    },
  });
}
