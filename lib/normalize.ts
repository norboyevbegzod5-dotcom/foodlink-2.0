import type { Restaurant } from "@/lib/types";

export function normalizeRestaurant(row: Record<string, unknown>): Restaurant {
  const branches = row.branch_addresses;
  return {
    ...(row as unknown as Restaurant),
    branch_addresses: Array.isArray(branches)
      ? branches.map(String)
      : [],
  };
}
