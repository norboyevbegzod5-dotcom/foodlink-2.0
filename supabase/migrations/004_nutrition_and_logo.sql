-- Add weight and nutrition fields to menu_items
alter table public.menu_items
  add column if not exists weight_grams integer,
  add column if not exists calories numeric(10,2),
  add column if not exists proteins numeric(10,2),
  add column if not exists fats numeric(10,2),
  add column if not exists carbs numeric(10,2);

-- Add logo_path field to restaurants
alter table public.restaurants
  add column if not exists logo_path text;

-- Storage bucket for restaurant logos
insert into storage.buckets (id, name, public)
values ('restaurant-logos', 'restaurant-logos', true)
on conflict (id) do nothing;

-- Storage policies for restaurant logos
create policy "restaurant_logos_public_read"
  on storage.objects for select
  using (bucket_id = 'restaurant-logos');

create policy "restaurant_logos_insert_owner"
  on storage.objects for insert
  with check (
    bucket_id = 'restaurant-logos'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) in (
      select id::text from public.restaurants where owner_id = auth.uid()
    )
  );

create policy "restaurant_logos_update_owner"
  on storage.objects for update
  using (
    bucket_id = 'restaurant-logos'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) in (
      select id::text from public.restaurants where owner_id = auth.uid()
    )
  );

create policy "restaurant_logos_delete_owner"
  on storage.objects for delete
  using (
    bucket_id = 'restaurant-logos'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) in (
      select id::text from public.restaurants where owner_id = auth.uid()
    )
  );
