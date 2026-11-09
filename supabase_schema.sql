-- Christmas Wishlist - ready-to-run schema for the Supabase SQL Editor.
--
-- Option 1 (recommended for deployments): keep this repository connected to
-- Supabase and let GitHub Actions run `supabase db push`.
--
-- Option 2 (manual): paste this entire file into the Supabase SQL Editor and
-- run it once. It is safe to run again.

create extension if not exists pgcrypto;

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null check (char_length(trim(title)) > 0),
  url text,
  image_url text,
  notes text,
  price text,
  added_by text,
  reserved_by text
);

-- Keep the script safe for projects that already created an earlier version
-- of the table.
alter table public.wishlist_items
  add column if not exists url text,
  add column if not exists image_url text,
  add column if not exists notes text,
  add column if not exists price text,
  add column if not exists added_by text,
  add column if not exists reserved_by text;

alter table public.wishlist_items enable row level security;

-- The app is intentionally account-free. Access is open to anyone who knows
-- the deployed URL; do not use this schema for sensitive information.
drop policy if exists "wishlist_items_select_public" on public.wishlist_items;
create policy "wishlist_items_select_public"
  on public.wishlist_items
  for select
  using (true);

drop policy if exists "wishlist_items_insert_public" on public.wishlist_items;
create policy "wishlist_items_insert_public"
  on public.wishlist_items
  for insert
  with check (true);

drop policy if exists "wishlist_items_update_public" on public.wishlist_items;
create policy "wishlist_items_update_public"
  on public.wishlist_items
  for update
  using (true)
  with check (true);

drop policy if exists "wishlist_items_delete_public" on public.wishlist_items;
create policy "wishlist_items_delete_public"
  on public.wishlist_items
  for delete
  using (true);

create index if not exists wishlist_items_created_at_idx
  on public.wishlist_items (created_at desc);

create index if not exists wishlist_items_reserved_by_idx
  on public.wishlist_items (reserved_by)
  where reserved_by is not null;

alter table public.wishlist_items replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'wishlist_items'
  ) then
    alter publication supabase_realtime add table public.wishlist_items;
  end if;
end $$;
