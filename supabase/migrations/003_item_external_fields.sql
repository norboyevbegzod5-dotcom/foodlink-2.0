-- Add external system fields to menu_items
alter table public.menu_items
  add column if not exists product_type text default 'dish',
  add column if not exists ikpu text,
  add column if not exists package_code text,
  add column if not exists barcode text,
  add column if not exists with_marking boolean not null default false;
