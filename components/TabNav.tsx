"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type RestaurantTabKind =
  | "exact"
  | "menuCategories"
  | "items"
  | "prefix";

function tabIsActive(
  pathname: string,
  restaurantBase: string,
  tab: { href: string; activeKind: RestaurantTabKind },
): boolean {
  switch (tab.activeKind) {
    case "exact":
      return pathname === tab.href;
    case "menuCategories":
      return (
        pathname === tab.href ||
        pathname.startsWith(`${restaurantBase}/menu/category`)
      );
    case "items":
      return (
        pathname.startsWith(tab.href) ||
        pathname.includes(`${restaurantBase}/menu/item/`)
      );
    case "prefix":
      return pathname.startsWith(tab.href);
    default:
      return false;
  }
}

export function TabNav({
  restaurantBase,
  tabs,
}: {
  /** e.g. `/dashboard/restaurant/[id]` — used for active-state paths that are not a single href prefix */
  restaurantBase: string;
  tabs: {
    href: string;
    label: string;
    activeKind: RestaurantTabKind;
  }[];
}) {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-zinc-200 pb-3">
      {tabs.map((tab) => {
        const isActive = tabIsActive(pathname, restaurantBase, tab);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-emerald-500 text-white"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
