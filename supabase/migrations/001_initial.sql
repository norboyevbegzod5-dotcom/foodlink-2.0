-- Foodlink: profiles, restaurants, menu, RLS, storage, API keys
-- Run in Supabase SQL Editor or via CLI after linking project.

create extension if not exists "pgcrypto";

-- Profiles (synced from auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'owner' check (role in ('owner', 'superadmin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Restaurants
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  currency text not null default 'UZS',
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  name text,
  establishment_type text,
  cuisine_main text,
  city text,
  branch_addresses jsonb not null default '[]'::jsonb,
  delivery_schedule text,
  max_prep_time_minutes integer,
  director_full_name text,
  director_phone text,
  director_email text,
  order_urgent_phone_1 text,
  order_urgent_phone_2 text,
  accounting_phone text,
  accounting_email text,
  requisites text,
  taxpayer_registration_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger restaurants_updated_at
  before update on public.restaurants
  for each row execute function public.set_updated_at();

-- Menu
create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  sort_order integer not null default 0,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger menu_categories_updated_at
  before update on public.menu_categories
  for each row execute function public.set_updated_at();

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories (id) on delete cascade,
  name text not null,
  description text,
  image_path text,
  price_yandex_eda numeric(12, 2),
  price_uzum_tezkor numeric(12, 2),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger menu_items_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- API keys (hashed)
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key_hash text not null,
  key_prefix text not null,
  label text,
  created_at timestamptz not null default now()
);

create unique index if not exists api_keys_key_hash_idx on public.api_keys (key_hash);

-- RLS
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.api_keys enable row level security;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'superadmin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Profiles: user sees own row; superadmin sees all
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_superadmin());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

-- Restaurants
create policy "restaurants_select"
  on public.restaurants for select
  using (owner_id = auth.uid() or public.is_superadmin());

create policy "restaurants_insert"
  on public.restaurants for insert
  with check (owner_id = auth.uid());

create policy "restaurants_update"
  on public.restaurants for update
  using (owner_id = auth.uid());

create policy "restaurants_delete"
  on public.restaurants for delete
  using (owner_id = auth.uid());

-- Categories: via restaurant ownership
create policy "menu_categories_select"
  on public.menu_categories for select
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = menu_categories.restaurant_id
        and (r.owner_id = auth.uid() or public.is_superadmin())
    )
  );

create policy "menu_categories_insert"
  on public.menu_categories for insert
  with check (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "menu_categories_update"
  on public.menu_categories for update
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = menu_categories.restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "menu_categories_delete"
  on public.menu_categories for delete
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = menu_categories.restaurant_id and r.owner_id = auth.uid()
    )
  );

-- Items: via category -> restaurant
create policy "menu_items_select"
  on public.menu_items for select
  using (
    exists (
      select 1
      from public.menu_categories c
      join public.restaurants r on r.id = c.restaurant_id
      where c.id = menu_items.category_id
        and (r.owner_id = auth.uid() or public.is_superadmin())
    )
  );

create policy "menu_items_insert"
  on public.menu_items for insert
  with check (
    exists (
      select 1
      from public.menu_categories c
      join public.restaurants r on r.id = c.restaurant_id
      where c.id = category_id and r.owner_id = auth.uid()
    )
  );

create policy "menu_items_update"
  on public.menu_items for update
  using (
    exists (
      select 1
      from public.menu_categories c
      join public.restaurants r on r.id = c.restaurant_id
      where c.id = menu_items.category_id and r.owner_id = auth.uid()
    )
  );

create policy "menu_items_delete"
  on public.menu_items for delete
  using (
    exists (
      select 1
      from public.menu_categories c
      join public.restaurants r on r.id = c.restaurant_id
      where c.id = menu_items.category_id and r.owner_id = auth.uid()
    )
  );

-- API keys: only owner
create policy "api_keys_select_own"
  on public.api_keys for select
  using (user_id = auth.uid());

create policy "api_keys_insert_own"
  on public.api_keys for insert
  with check (user_id = auth.uid());

create policy "api_keys_delete_own"
  on public.api_keys for delete
  using (user_id = auth.uid());

-- Storage bucket (create in Dashboard or here)
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

-- Storage policies
create policy "menu_images_public_read"
  on storage.objects for select
  using (bucket_id = 'menu-images');

create policy "menu_images_insert_owner"
  on storage.objects for insert
  with check (
    bucket_id = 'menu-images'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) in (
      select id::text from public.restaurants where owner_id = auth.uid()
    )
  );

create policy "menu_images_update_owner"
  on storage.objects for update
  using (
    bucket_id = 'menu-images'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) in (
      select id::text from public.restaurants where owner_id = auth.uid()
    )
  );

create policy "menu_images_delete_owner"
  on storage.objects for delete
  using (
    bucket_id = 'menu-images'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) in (
      select id::text from public.restaurants where owner_id = auth.uid()
    )
  );
