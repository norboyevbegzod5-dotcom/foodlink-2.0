import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ExportCategory } from "@/lib/export-load";
import type { Restaurant } from "@/lib/types";

import path from "path";

Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf"),
      fontWeight: 400,
    },
    {
      src: path.join(process.cwd(), "public", "fonts", "NotoSans-Bold.ttf"),
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "NotoSans", fontSize: 10, color: "#111" },
  h1: { fontSize: 18, marginBottom: 8, fontWeight: 700 },
  h2: { fontSize: 12, marginTop: 14, marginBottom: 6, fontWeight: 700 },
  row: { marginBottom: 4 },
  muted: { color: "#555" },
  category: {
    fontSize: 12,
    marginTop: 14,
    marginBottom: 6,
    fontWeight: 700,
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 4,
  },
  itemCard: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  itemHeader: {
    flexDirection: "row",
    marginBottom: 6,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    objectFit: "cover",
    marginRight: 12,
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
    marginRight: 12,
  },
  itemTitleBlock: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 8,
    color: "#666",
    marginBottom: 3,
  },
  itemStatus: {
    fontSize: 8,
    color: "#059669",
  },
  itemStatusHidden: {
    fontSize: 8,
    color: "#ef4444",
  },
  itemDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
    marginTop: 4,
  },
  detailCell: {
    width: "33%",
    marginBottom: 3,
  },
  detailLabel: {
    fontSize: 7,
    color: "#999",
    marginBottom: 1,
  },
  detailValue: {
    fontSize: 9,
    color: "#333",
  },
});

function field(label: string, value: string | null | undefined) {
  if (value == null || String(value).trim() === "") return null;
  return (
    <Text style={styles.row}>
      <Text style={styles.muted}>{label}: </Text>
      {String(value)}
    </Text>
  );
}

export type Aggregator = "yandex" | "uzum";

const AGG_LABELS: Record<Aggregator, string> = {
  yandex: "Яндекс Еда",
  uzum: "Uzum Tezkor",
};

function restaurantInfoPage(restaurant: Restaurant, logoDataUri: string | null) {
  const branches = Array.isArray(restaurant.branch_addresses)
    ? restaurant.branch_addresses.join("; ")
    : "";

  return (
    <Page size="A4" style={styles.page}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 16 }}>
        {logoDataUri && (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={logoDataUri} style={{ width: 60, height: 60, marginRight: 16, objectFit: "contain" }} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.h1}>Foodlink — анкета ресторана</Text>
        </View>
      </View>
      {field("Название", restaurant.name)}
      {field("Тип заведения", restaurant.establishment_type)}
      {field("Кухня", restaurant.cuisine_main)}
      {field("Город", restaurant.city)}
      {field("Филиалы", branches)}
      {field("График доставки", restaurant.delivery_schedule)}
      {field(
        "Макс. время приготовления (мин)",
        restaurant.max_prep_time_minutes != null
          ? String(restaurant.max_prep_time_minutes)
          : null,
      )}
      {field("Валюта", restaurant.currency)}
      <Text style={styles.h2}>Директор и контакты</Text>
      {field("ФИО директора", restaurant.director_full_name)}
      {field("Телефон директора", restaurant.director_phone)}
      {field("Email директора", restaurant.director_email)}
      {field("Срочный тел. 1", restaurant.order_urgent_phone_1)}
      {field("Срочный тел. 2", restaurant.order_urgent_phone_2)}
      {field("Бухгалтерия (тел.)", restaurant.accounting_phone)}
      {field("Бухгалтерия (email)", restaurant.accounting_email)}
      <Text style={styles.h2}>Реквизиты и налоги</Text>
      {field("Реквизиты", restaurant.requisites)}
      {field("Код налогоплательщика", restaurant.taxpayer_registration_code)}
    </Page>
  );
}

export function RestaurantPdfDocument({
  restaurant,
  categories,
  aggregator,
  imageMap,
  logoDataUri,
}: {
  restaurant: Restaurant;
  categories: ExportCategory[];
  aggregator: Aggregator;
  imageMap: Record<string, string>;
  logoDataUri: string | null;
}) {
  const label = AGG_LABELS[aggregator];

  return (
    <Document>
      {restaurantInfoPage(restaurant, logoDataUri)}

      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Меню — {label}</Text>
        {categories.map((c) => (
          <View key={c.id}>
            <Text style={styles.category}>{c.name}</Text>
            {c.menu_items.map((it) => {
              const imgSrc = imageMap[it.id];
              const ext = it as Record<string, string | number | boolean | null>;
              return (
                <View key={it.id} style={styles.itemCard} wrap={false}>
                  <View style={styles.itemHeader}>
                    {imgSrc ? (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <Image src={imgSrc} style={styles.itemImage} />
                    ) : (
                      <View style={styles.itemImagePlaceholder} />
                    )}
                    <View style={styles.itemTitleBlock}>
                      <Text style={styles.itemName}>{it.name}</Text>
                      {it.description ? (
                        <Text style={styles.itemDesc}>{it.description}</Text>
                      ) : null}
                      <Text
                        style={
                          it.is_active
                            ? styles.itemStatus
                            : styles.itemStatusHidden
                        }
                      >
                        {it.is_active ? "Активный" : "Скрыт"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemDetails}>
                    <View style={styles.detailCell}>
                      <Text style={styles.detailLabel}>Категория</Text>
                      <Text style={styles.detailValue}>{c.name}</Text>
                    </View>
                    <View style={styles.detailCell}>
                      <Text style={styles.detailLabel}>
                        {label} ({restaurant.currency})
                      </Text>
                      <Text style={styles.detailValue}>
                        {(aggregator === "yandex"
                          ? it.price_yandex_eda
                          : it.price_uzum_tezkor) != null
                          ? String(
                              aggregator === "yandex"
                                ? it.price_yandex_eda
                                : it.price_uzum_tezkor,
                            )
                          : "—"}
                      </Text>
                    </View>
                    <View style={styles.detailCell}>
                      <Text style={styles.detailLabel}>Порядок</Text>
                      <Text style={styles.detailValue}>{it.sort_order}</Text>
                    </View>
                    {ext.product_type && (
                      <View style={styles.detailCell}>
                        <Text style={styles.detailLabel}>Тип продукта</Text>
                        <Text style={styles.detailValue}>
                          {String(ext.product_type)}
                        </Text>
                      </View>
                    )}
                    {ext.ikpu && (
                      <View style={styles.detailCell}>
                        <Text style={styles.detailLabel}>ИКПУ</Text>
                        <Text style={styles.detailValue}>
                          {String(ext.ikpu)}
                        </Text>
                      </View>
                    )}
                    {ext.package_code && (
                      <View style={styles.detailCell}>
                        <Text style={styles.detailLabel}>Код упаковки</Text>
                        <Text style={styles.detailValue}>
                          {String(ext.package_code)}
                        </Text>
                      </View>
                    )}
                    {ext.barcode && (
                      <View style={styles.detailCell}>
                        <Text style={styles.detailLabel}>Штрих-код</Text>
                        <Text style={styles.detailValue}>
                          {String(ext.barcode)}
                        </Text>
                      </View>
                    )}
                    {ext.with_marking && (
                      <View style={styles.detailCell}>
                        <Text style={styles.detailLabel}>Маркировка</Text>
                        <Text style={styles.detailValue}>Да</Text>
                      </View>
                    )}
                    {ext.weight_grams != null && (
                      <View style={styles.detailCell}>
                        <Text style={styles.detailLabel}>Вес (г)</Text>
                        <Text style={styles.detailValue}>
                          {String(ext.weight_grams)}
                        </Text>
                      </View>
                    )}
                    {(ext.calories != null || ext.proteins != null || ext.fats != null || ext.carbs != null) && (
                      <View style={styles.detailCell}>
                        <Text style={styles.detailLabel}>КБЖУ</Text>
                        <Text style={styles.detailValue}>
                          {[
                            ext.calories != null ? `${ext.calories} ккал` : null,
                            ext.proteins != null ? `Б: ${ext.proteins}` : null,
                            ext.fats != null ? `Ж: ${ext.fats}` : null,
                            ext.carbs != null ? `У: ${ext.carbs}` : null,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </Page>
    </Document>
  );
}
