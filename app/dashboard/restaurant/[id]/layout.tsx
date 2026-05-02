import { TabNav } from "@/components/TabNav";

export default async function RestaurantSectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const base = `/dashboard/restaurant/${id}`;

  const tabs = [
    { href: base, label: "Ресторан", activeKind: "exact" as const },
    {
      href: `${base}/menu`,
      label: "Категории",
      activeKind: "menuCategories" as const,
    },
    { href: `${base}/items`, label: "Товары", activeKind: "items" as const },
    {
      href: `${base}/export`,
      label: "Экспорт",
      activeKind: "prefix" as const,
    },
  ];

  return (
    <div>
      <TabNav restaurantBase={base} tabs={tabs} />
      {children}
    </div>
  );
}
