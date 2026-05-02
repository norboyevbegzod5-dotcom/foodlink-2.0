-- Add image and description to menu_categories
alter table public.menu_categories
  add column if not exists image_path text,
  add column if not exists description text;
