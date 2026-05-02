export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: "owner" | "superadmin";
};

export type Restaurant = {
  id: string;
  owner_id: string;
  currency: string;
  status: "draft" | "submitted";
  name: string | null;
  establishment_type: string | null;
  cuisine_main: string | null;
  city: string | null;
  branch_addresses: string[];
  delivery_schedule: string | null;
  max_prep_time_minutes: number | null;
  director_full_name: string | null;
  director_phone: string | null;
  director_email: string | null;
  order_urgent_phone_1: string | null;
  order_urgent_phone_2: string | null;
  accounting_phone: string | null;
  accounting_email: string | null;
  requisites: string | null;
  taxpayer_registration_code: string | null;
  created_at: string;
  updated_at: string;
};

export type MenuCategory = {
  id: string;
  restaurant_id: string;
  sort_order: number;
  name: string;
};

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_path: string | null;
  price_yandex_eda: number | null;
  price_uzum_tezkor: number | null;
  sort_order: number;
  is_active: boolean;
  product_type?: string | null;
  ikpu?: string | null;
  package_code?: string | null;
  barcode?: string | null;
  with_marking?: boolean | null;
};
