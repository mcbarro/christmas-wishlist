-- Christmas Wishlist - complete ready-to-run schema for the Supabase SQL Editor.
--
-- Recommended deployment: keep this repository connected to Supabase and let
-- GitHub Actions apply the migrations with `supabase db push`.
--
-- Manual setup: paste this entire file into the Supabase SQL Editor and run it
-- once. It is safe to run again.

create extension if not exists pgcrypto;

-- 1. Family groups -----------------------------------------------------------

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  group_secret text unique not null,
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

-- 2. Group members -----------------------------------------------------------

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_secret text not null,
  display_name text not null check (char_length(trim(display_name)) > 0),
  is_admin boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now(),
  unique (group_id, user_secret)
);

-- 3. Wishlist items ----------------------------------------------------------

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null check (char_length(trim(title)) > 0),
  url text,
  image_url text,
  notes text,
  price text,
  added_by text,
  reserved_by text,
  group_id uuid references public.groups(id) on delete cascade,
  owner_member_id uuid references public.group_members(id) on delete cascade
);

alter table public.wishlist_items
  add column if not exists url text,
  add column if not exists image_url text,
  add column if not exists notes text,
  add column if not exists price text,
  add column if not exists added_by text,
  add column if not exists reserved_by text,
  add column if not exists group_id uuid references public.groups(id) on delete cascade,
  add column if not exists owner_member_id uuid references public.group_members(id) on delete cascade;

alter table public.wishlist_items
  alter column group_id drop not null,
  alter column owner_member_id drop not null;

-- 4. Reservations (kept private; accessed only through RPCs) -----------------

create table if not exists public.item_reservations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references public.wishlist_items(id) on delete cascade,
  reserved_by_member_id uuid not null references public.group_members(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists groups_group_secret_idx
  on public.groups (group_secret);

create index if not exists group_members_group_id_idx
  on public.group_members (group_id);

create index if not exists group_members_status_idx
  on public.group_members (group_id, status);

create index if not exists wishlist_items_group_id_idx
  on public.wishlist_items (group_id);

create index if not exists wishlist_items_owner_member_id_idx
  on public.wishlist_items (owner_member_id);

create index if not exists item_reservations_reserved_by_idx
  on public.item_reservations (reserved_by_member_id);

-- 5. Security ----------------------------------------------------------------

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.item_reservations enable row level security;

-- Remove the old open policies from earlier versions of the app.
drop policy if exists "wishlist_items_select_public" on public.wishlist_items;
drop policy if exists "wishlist_items_insert_public" on public.wishlist_items;
drop policy if exists "wishlist_items_update_public" on public.wishlist_items;
drop policy if exists "wishlist_items_delete_public" on public.wishlist_items;
drop policy if exists "Abilita lettura pubblica" on public.wishlist_items;
drop policy if exists "Abilita inserimento pubblico" on public.wishlist_items;
drop policy if exists "Abilita aggiornamento pubblico" on public.wishlist_items;
drop policy if exists "Abilita eliminazione pubblica" on public.wishlist_items;

-- Direct table access is denied. All operations use the SECURITY DEFINER
-- functions below, which validate the group/member secrets.
revoke all on table public.groups from anon, authenticated;
revoke all on table public.group_members from anon, authenticated;
revoke all on table public.wishlist_items from anon, authenticated;
revoke all on table public.item_reservations from anon, authenticated;

-- 6. Group and member functions ---------------------------------------------

create or replace function public.create_group(
  p_group_secret text,
  p_name text,
  p_user_secret text,
  p_display_name text
)
returns table (
  group_id uuid,
  member_id uuid,
  group_name text,
  display_name text,
  is_admin boolean,
  status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
begin
  if coalesce(trim(p_group_secret), '') = ''
    or coalesce(trim(p_user_secret), '') = '' then
    raise exception 'INVALID_SECRET';
  end if;

  if coalesce(trim(p_name), '') = ''
    or coalesce(trim(p_display_name), '') = '' then
    raise exception 'INVALID_NAME';
  end if;

  insert into public.groups (group_secret, name)
  values (trim(p_group_secret), trim(p_name))
  returning id into v_group_id;

  insert into public.group_members (
    group_id,
    user_secret,
    display_name,
    is_admin,
    status
  )
  values (
    v_group_id,
    trim(p_user_secret),
    trim(p_display_name),
    true,
    'approved'
  )
  returning id into v_member_id;

  return query
  select v_group_id, v_member_id, trim(p_name), trim(p_display_name), true, 'approved'::text;
end;
$$;

create or replace function public.join_group(
  p_group_secret text,
  p_user_secret text,
  p_display_name text
)
returns table (
  group_id uuid,
  member_id uuid,
  group_name text,
  display_name text,
  is_admin boolean,
  status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group public.groups%rowtype;
  v_member public.group_members%rowtype;
begin
  if coalesce(trim(p_group_secret), '') = ''
    or coalesce(trim(p_user_secret), '') = '' then
    raise exception 'INVALID_SECRET';
  end if;

  select *
  into v_group
  from public.groups g
  where g.group_secret = trim(p_group_secret);

  if not found then
    raise exception 'GROUP_NOT_FOUND';
  end if;

  select *
  into v_member
  from public.group_members
  where group_members.group_id = v_group.id
    and group_members.user_secret = trim(p_user_secret);

  if found then
    if coalesce(trim(p_display_name), '') <> ''
      and v_member.display_name <> trim(p_display_name) then
      update public.group_members
      set display_name = trim(p_display_name)
      where id = v_member.id;
      v_member.display_name := trim(p_display_name);
    end if;

    return query
    select v_group.id, v_member.id, v_group.name, v_member.display_name, v_member.is_admin, v_member.status;
    return;
  end if;

  if coalesce(trim(p_display_name), '') = '' then
    raise exception 'INVALID_NAME';
  end if;

  insert into public.group_members (
    group_id,
    user_secret,
    display_name,
    is_admin,
    status
  )
  values (
    v_group.id,
    trim(p_user_secret),
    trim(p_display_name),
    false,
    'pending'
  )
  returning * into v_member;

  return query
  select v_group.id, v_member.id, v_group.name, v_member.display_name, v_member.is_admin, v_member.status;
end;
$$;

create or replace function public.get_session(
  p_group_secret text,
  p_user_secret text
)
returns table (
  group_id uuid,
  member_id uuid,
  group_name text,
  display_name text,
  is_admin boolean,
  status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  select g.id, m.id, g.name, m.display_name, m.is_admin, m.status
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret);
end;
$$;

create or replace function public.get_group_by_secret(
  p_group_secret text
)
returns table (
  group_id uuid,
  group_name text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  select g.id, g.name
  from public.groups g
  where g.group_secret = trim(p_group_secret);
end;
$$;

-- 7. Wishlist functions ------------------------------------------------------

create or replace function public.get_group_items(
  p_group_secret text,
  p_user_secret text
)
returns table (
  id uuid,
  group_id uuid,
  owner_member_id uuid,
  owner_name text,
  created_at timestamptz,
  title text,
  url text,
  image_url text,
  notes text,
  price text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
begin
  select g.id, m.id
  into v_group_id, v_member_id
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_group_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  return query
  select
    i.id,
    i.group_id,
    i.owner_member_id,
    owner.display_name,
    i.created_at,
    i.title,
    i.url,
    i.image_url,
    i.notes,
    i.price
  from public.wishlist_items i
  join public.group_members owner on owner.id = i.owner_member_id
  where i.group_id = v_group_id
  order by i.created_at desc;
end;
$$;

create or replace function public.add_item(
  p_group_secret text,
  p_user_secret text,
  p_title text,
  p_url text,
  p_image_url text,
  p_notes text,
  p_price text
)
returns table (
  id uuid,
  group_id uuid,
  owner_member_id uuid,
  owner_name text,
  created_at timestamptz,
  title text,
  url text,
  image_url text,
  notes text,
  price text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
  v_member_name text;
  v_item_id uuid;
begin
  select g.id, m.id, m.display_name
  into v_group_id, v_member_id, v_member_name
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_group_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  if coalesce(trim(p_title), '') = '' then
    raise exception 'TITLE_REQUIRED';
  end if;

  insert into public.wishlist_items (
    group_id,
    owner_member_id,
    title,
    url,
    image_url,
    notes,
    price,
    added_by
  )
  values (
    v_group_id,
    v_member_id,
    trim(p_title),
    nullif(trim(p_url), ''),
    nullif(trim(p_image_url), ''),
    nullif(trim(p_notes), ''),
    nullif(trim(p_price), ''),
    v_member_name
  )
  returning wishlist_items.id into v_item_id;

  return query
  select
    i.id,
    i.group_id,
    i.owner_member_id,
    v_member_name,
    i.created_at,
    i.title,
    i.url,
    i.image_url,
    i.notes,
    i.price
  from public.wishlist_items i
  where i.id = v_item_id;
end;
$$;

create or replace function public.reserve_item(
  p_group_secret text,
  p_user_secret text,
  p_item_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
  v_owner_id uuid;
begin
  select g.id, m.id
  into v_group_id, v_member_id
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_group_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  select i.owner_member_id
  into v_owner_id
  from public.wishlist_items i
  where i.id = p_item_id
    and i.group_id = v_group_id;

  if v_owner_id is null then
    raise exception 'ITEM_NOT_FOUND';
  end if;

  if v_owner_id = v_member_id then
    raise exception 'OWN_ITEM';
  end if;

  insert into public.item_reservations (item_id, reserved_by_member_id)
  values (p_item_id, v_member_id)
  on conflict (item_id) do nothing;

  if not found then
    raise exception 'ALREADY_RESERVED';
  end if;

  return true;
end;
$$;

create or replace function public.release_item(
  p_group_secret text,
  p_user_secret text,
  p_item_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
begin
  select g.id, m.id
  into v_group_id, v_member_id
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_group_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  delete from public.item_reservations r
  where r.item_id = p_item_id
    and r.reserved_by_member_id = v_member_id;

  return found;
end;
$$;

-- 8. Privacy-preserving reservation and approval functions -------------------

create or replace function public.get_safe_reservations(
  p_group_id uuid,
  p_user_secret text
)
returns table (
  item_id uuid,
  reserved_by_name text,
  is_mine boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member_id uuid;
begin
  select m.id
  into v_member_id
  from public.group_members m
  where m.group_id = p_group_id
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_member_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  return query
  select
    r.item_id,
    m.display_name as reserved_by_name,
    (r.reserved_by_member_id = v_member_id) as is_mine
  from public.item_reservations r
  join public.wishlist_items i on i.id = r.item_id
  join public.group_members m on m.id = r.reserved_by_member_id
  where i.group_id = p_group_id
    and i.owner_member_id <> v_member_id;
end;
$$;

create or replace function public.get_pending_members(
  p_group_id uuid,
  p_user_secret text
)
returns table (
  member_id uuid,
  display_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admin_id uuid;
begin
  select m.id
  into v_admin_id
  from public.group_members m
  where m.group_id = p_group_id
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved'
    and m.is_admin = true;

  if v_admin_id is null then
    raise exception 'NOT_ADMIN';
  end if;

  return query
  select m.id, m.display_name, m.created_at
  from public.group_members m
  where m.group_id = p_group_id
    and m.status = 'pending'
  order by m.created_at asc;
end;
$$;

create or replace function public.approve_member(
  p_group_id uuid,
  p_admin_user_secret text,
  p_member_id uuid,
  p_approve boolean
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admin_id uuid;
begin
  select m.id
  into v_admin_id
  from public.group_members m
  where m.group_id = p_group_id
    and m.user_secret = trim(p_admin_user_secret)
    and m.status = 'approved'
    and m.is_admin = true;

  if v_admin_id is null then
    raise exception 'NOT_ADMIN';
  end if;

  if p_approve then
    update public.group_members
    set status = 'approved'
    where id = p_member_id
      and group_id = p_group_id
      and status = 'pending';
  else
    delete from public.group_members
    where id = p_member_id
      and group_id = p_group_id
      and status = 'pending';
  end if;

  return found;
end;
$$;

-- 9. API permissions ---------------------------------------------------------

revoke all on function public.create_group(text, text, text, text) from public;
revoke all on function public.join_group(text, text, text) from public;
revoke all on function public.get_session(text, text) from public;
revoke all on function public.get_group_by_secret(text) from public;
revoke all on function public.get_group_items(text, text) from public;
revoke all on function public.add_item(text, text, text, text, text, text, text) from public;
revoke all on function public.reserve_item(text, text, uuid) from public;
revoke all on function public.release_item(text, text, uuid) from public;
revoke all on function public.get_safe_reservations(uuid, text) from public;
revoke all on function public.get_pending_members(uuid, text) from public;
revoke all on function public.approve_member(uuid, text, uuid, boolean) from public;

grant execute on function public.create_group(text, text, text, text) to anon, authenticated;
grant execute on function public.join_group(text, text, text) to anon, authenticated;
grant execute on function public.get_session(text, text) to anon, authenticated;
grant execute on function public.get_group_by_secret(text) to anon, authenticated;
grant execute on function public.get_group_items(text, text) to anon, authenticated;
grant execute on function public.add_item(text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.reserve_item(text, text, uuid) to anon, authenticated;
grant execute on function public.release_item(text, text, uuid) to anon, authenticated;
grant execute on function public.get_safe_reservations(uuid, text) to anon, authenticated;
grant execute on function public.get_pending_members(uuid, text) to anon, authenticated;
grant execute on function public.approve_member(uuid, text, uuid, boolean) to anon, authenticated;

-- 10. Gift ideas, member list, deletion, notifications and bulk import ----------

-- Gift ideas for other members and the approved-members list.
--
-- `owner_member_id` is the person the wish is for. `created_by_member_id` is
-- the person who added it. For a normal wish they are the same; for a gift
-- idea suggested by A for B, owner = B and creator = A.
--
-- A suggestion must never be returned to its owner B. The privacy filter is
-- applied in get_group_items, not in the frontend.

alter table public.wishlist_items
  add column if not exists created_by_member_id uuid
    references public.group_members(id) on delete set null;

update public.wishlist_items
set created_by_member_id = owner_member_id
where created_by_member_id is null;

create index if not exists wishlist_items_created_by_member_id_idx
  on public.wishlist_items (created_by_member_id);

-- The return shape changes, so the old function must be dropped first.
drop function if exists public.get_group_items(text, text);

create or replace function public.get_group_items(
  p_group_secret text,
  p_user_secret text
)
returns table (
  id uuid,
  group_id uuid,
  owner_member_id uuid,
  owner_name text,
  created_by_member_id uuid,
  created_by_name text,
  created_at timestamptz,
  title text,
  url text,
  image_url text,
  notes text,
  price text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
begin
  select g.id, m.id
  into v_group_id, v_member_id
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_group_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  return query
  select
    i.id,
    i.group_id,
    i.owner_member_id,
    owner.display_name,
    coalesce(i.created_by_member_id, i.owner_member_id),
    creator.display_name,
    i.created_at,
    i.title,
    i.url,
    i.image_url,
    i.notes,
    i.price
  from public.wishlist_items i
  join public.group_members owner on owner.id = i.owner_member_id
  left join public.group_members creator
    on creator.id = coalesce(i.created_by_member_id, i.owner_member_id)
  where i.group_id = v_group_id
    and not (
      i.owner_member_id = v_member_id
      and coalesce(i.created_by_member_id, i.owner_member_id) <> v_member_id
    )
  order by i.created_at desc;
end;
$$;

create or replace function public.get_group_members(
  p_group_secret text,
  p_user_secret text
)
returns table (
  member_id uuid,
  display_name text,
  is_admin boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
begin
  select g.id, m.id
  into v_group_id, v_member_id
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_group_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  return query
  select
    m.id,
    m.display_name,
    m.is_admin,
    m.created_at
  from public.group_members m
  where m.group_id = v_group_id
    and m.status = 'approved'
  order by m.display_name asc, m.created_at asc;
end;
$$;

-- The old seven-argument version is replaced by one that also accepts the
-- recipient. A default keeps existing callers working.
drop function if exists public.add_item(text, text, text, text, text, text, text);

create or replace function public.add_item(
  p_group_secret text,
  p_user_secret text,
  p_title text,
  p_url text,
  p_image_url text,
  p_notes text,
  p_price text,
  p_owner_member_id uuid default null
)
returns table (
  id uuid,
  group_id uuid,
  owner_member_id uuid,
  owner_name text,
  created_by_member_id uuid,
  created_by_name text,
  created_at timestamptz,
  title text,
  url text,
  image_url text,
  notes text,
  price text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
  v_member_name text;
  v_owner_id uuid;
  v_owner_name text;
  v_item_id uuid;
begin
  select g.id, m.id, m.display_name
  into v_group_id, v_member_id, v_member_name
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_group_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  if coalesce(trim(p_title), '') = '' then
    raise exception 'TITLE_REQUIRED';
  end if;

  v_owner_id := coalesce(p_owner_member_id, v_member_id);

  if v_owner_id = v_member_id then
    v_owner_name := v_member_name;
  else
    select m.id, m.display_name
    into v_owner_id, v_owner_name
    from public.group_members m
    where m.id = p_owner_member_id
      and m.group_id = v_group_id
      and m.status = 'approved';

    if v_owner_id is null then
      raise exception 'MEMBER_NOT_FOUND';
    end if;
  end if;

  insert into public.wishlist_items (
    group_id,
    owner_member_id,
    created_by_member_id,
    title,
    url,
    image_url,
    notes,
    price,
    added_by
  )
  values (
    v_group_id,
    v_owner_id,
    v_member_id,
    trim(p_title),
    nullif(trim(p_url), ''),
    nullif(trim(p_image_url), ''),
    nullif(trim(p_notes), ''),
    nullif(trim(p_price), ''),
    v_member_name
  )
  returning wishlist_items.id into v_item_id;

  return query
  select
    i.id,
    i.group_id,
    i.owner_member_id,
    v_owner_name,
    coalesce(i.created_by_member_id, i.owner_member_id),
    v_member_name,
    i.created_at,
    i.title,
    i.url,
    i.image_url,
    i.notes,
    i.price
  from public.wishlist_items i
  where i.id = v_item_id;
end;
$$;

revoke all on function public.get_group_items(text, text) from public;
revoke all on function public.get_group_members(text, text) from public;
revoke all on function public.add_item(text, text, text, text, text, text, text, uuid) from public;

grant execute on function public.get_group_items(text, text) to anon, authenticated;
grant execute on function public.get_group_members(text, text) to anon, authenticated;
grant execute on function public.add_item(text, text, text, text, text, text, text, uuid) to anon, authenticated;

-- Wish deletion and persistent in-app notifications.
--
-- Only the creator of an item may delete it. Before deleting, every member who
-- had reserved the item receives a notification. The item owner never learns
-- whether (or by whom) the gift was reserved, preserving the surprise.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  member_id uuid not null references public.group_members(id) on delete cascade,
  type text not null check (type in ('wish_deleted')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_member_created_idx
  on public.notifications (member_id, created_at desc);

create index if not exists notifications_member_unread_idx
  on public.notifications (member_id, read_at);

alter table public.notifications enable row level security;

revoke all on table public.notifications from anon, authenticated;

create or replace function public.delete_item(
  p_group_secret text,
  p_user_secret text,
  p_item_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
  v_member_name text;
  v_owner_id uuid;
  v_creator_id uuid;
  v_title text;
begin
  select g.id, m.id, m.display_name
  into v_group_id, v_member_id, v_member_name
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_group_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  select
    i.owner_member_id,
    coalesce(i.created_by_member_id, i.owner_member_id),
    i.title
  into v_owner_id, v_creator_id, v_title
  from public.wishlist_items i
  where i.id = p_item_id
    and i.group_id = v_group_id;

  if v_owner_id is null then
    raise exception 'ITEM_NOT_FOUND';
  end if;

  if v_creator_id <> v_member_id then
    raise exception 'NOT_ALLOWED';
  end if;

  insert into public.notifications (group_id, member_id, type, payload)
  select
    v_group_id,
    r.reserved_by_member_id,
    'wish_deleted',
    jsonb_build_object(
      'item_title', v_title,
      'deleted_by_name', v_member_name
    )
  from public.item_reservations r
  where r.item_id = p_item_id
    and r.reserved_by_member_id <> v_member_id;

  delete from public.wishlist_items i
  where i.id = p_item_id
    and i.group_id = v_group_id;

  return found;
end;
$$;

create or replace function public.get_notifications(
  p_group_id uuid,
  p_user_secret text
)
returns table (
  id uuid,
  type text,
  payload jsonb,
  created_at timestamptz,
  read_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member_id uuid;
begin
  select m.id
  into v_member_id
  from public.group_members m
  where m.group_id = p_group_id
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_member_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  return query
  select
    n.id,
    n.type,
    n.payload,
    n.created_at,
    n.read_at
  from public.notifications n
  where n.group_id = p_group_id
    and n.member_id = v_member_id
  order by n.created_at desc
  limit 50;
end;
$$;

create or replace function public.mark_notifications_read(
  p_group_id uuid,
  p_user_secret text
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member_id uuid;
  v_count integer;
begin
  select m.id
  into v_member_id
  from public.group_members m
  where m.group_id = p_group_id
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_member_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  update public.notifications n
  set read_at = now()
  where n.group_id = p_group_id
    and n.member_id = v_member_id
    and n.read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.delete_item(text, text, uuid) from public;
revoke all on function public.get_notifications(uuid, text) from public;
revoke all on function public.mark_notifications_read(uuid, text) from public;

grant execute on function public.delete_item(text, text, uuid) to anon, authenticated;
grant execute on function public.get_notifications(uuid, text) to anon, authenticated;
grant execute on function public.mark_notifications_read(uuid, text) to anon, authenticated;

-- Bulk import for Amazon wishlists and a feature-capability probe.
--
-- The CI migration step is allowed to continue on error, so the frontend must
-- be able to discover which RPCs are available instead of assuming that the
-- latest build and the latest database always match.

create or replace function public.add_items(
  p_group_secret text,
  p_user_secret text,
  p_items jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
  v_member_name text;
  v_inserted integer;
begin
  select g.id, m.id, m.display_name
  into v_group_id, v_member_id, v_member_name
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_group_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_IMPORT';
  end if;

  if jsonb_array_length(p_items) > 100 then
    raise exception 'IMPORT_LIMIT';
  end if;

  insert into public.wishlist_items (
    group_id,
    owner_member_id,
    created_by_member_id,
    title,
    url,
    image_url,
    notes,
    price,
    added_by
  )
  select
    v_group_id,
    v_member_id,
    v_member_id,
    trim(item.title),
    nullif(trim(item.url), ''),
    nullif(trim(item.image_url), ''),
    nullif(trim(item.notes), ''),
    nullif(trim(item.price), ''),
    v_member_name
  from jsonb_to_recordset(p_items)
    as item(title text, url text, image_url text, notes text, price text)
  where coalesce(trim(item.title), '') <> '';

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

create or replace function public.get_app_capabilities()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'schema_version', 2,
    'features', jsonb_build_array(
      'suggestions',
      'delete_notifications',
      'member_filter',
      'budget_filter',
      'amazon_import'
    )
  );
$$;

revoke all on function public.add_items(text, text, jsonb) from public;
revoke all on function public.get_app_capabilities() from public;

grant execute on function public.add_items(text, text, jsonb) to anon, authenticated;
grant execute on function public.get_app_capabilities() to anon, authenticated;


-- 11. Wish editing, hidden wishes and capability update -----------------------

-- Wish editing and per-member hidden wishes.
--
-- Hiding is always private to the member who chose it. A member can hide a
-- wish they can see, and can reveal it again later. The owner of a wish never
-- learns that someone hid it.

create table if not exists public.hidden_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  member_id uuid not null references public.group_members(id) on delete cascade,
  item_id uuid not null references public.wishlist_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (member_id, item_id)
);

create index if not exists hidden_items_member_group_idx
  on public.hidden_items (member_id, group_id);

alter table public.hidden_items enable row level security;

revoke all on table public.hidden_items from anon, authenticated;

-- The return shape changes again: add hidden_by_me.
drop function if exists public.get_group_items(text, text);

create or replace function public.get_group_items(
  p_group_secret text,
  p_user_secret text
)
returns table (
  id uuid,
  group_id uuid,
  owner_member_id uuid,
  owner_name text,
  created_by_member_id uuid,
  created_by_name text,
  created_at timestamptz,
  title text,
  url text,
  image_url text,
  notes text,
  price text,
  hidden_by_me boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
begin
  select g.id, m.id
  into v_group_id, v_member_id
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_group_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  return query
  select
    i.id,
    i.group_id,
    i.owner_member_id,
    owner.display_name,
    coalesce(i.created_by_member_id, i.owner_member_id),
    creator.display_name,
    i.created_at,
    i.title,
    i.url,
    i.image_url,
    i.notes,
    i.price,
    (h.id is not null)
  from public.wishlist_items i
  join public.group_members owner on owner.id = i.owner_member_id
  left join public.group_members creator
    on creator.id = coalesce(i.created_by_member_id, i.owner_member_id)
  left join public.hidden_items h
    on h.item_id = i.id
    and h.member_id = v_member_id
    and h.group_id = v_group_id
  where i.group_id = v_group_id
    and not (
      i.owner_member_id = v_member_id
      and coalesce(i.created_by_member_id, i.owner_member_id) <> v_member_id
    )
  order by i.created_at desc;
end;
$$;

create or replace function public.update_item(
  p_group_secret text,
  p_user_secret text,
  p_item_id uuid,
  p_title text,
  p_url text,
  p_image_url text,
  p_notes text,
  p_price text,
  p_owner_member_id uuid default null
)
returns table (
  id uuid,
  group_id uuid,
  owner_member_id uuid,
  owner_name text,
  created_by_member_id uuid,
  created_by_name text,
  created_at timestamptz,
  title text,
  url text,
  image_url text,
  notes text,
  price text,
  hidden_by_me boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
  v_member_name text;
  v_current_owner_id uuid;
  v_creator_id uuid;
  v_owner_id uuid;
  v_owner_name text;
begin
  select g.id, m.id, m.display_name
  into v_group_id, v_member_id, v_member_name
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_group_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  select
    i.owner_member_id,
    coalesce(i.created_by_member_id, i.owner_member_id)
  into v_current_owner_id, v_creator_id
  from public.wishlist_items i
  where i.id = p_item_id
    and i.group_id = v_group_id;

  if v_current_owner_id is null then
    raise exception 'ITEM_NOT_FOUND';
  end if;

  if v_creator_id <> v_member_id then
    raise exception 'NOT_ALLOWED';
  end if;

  if coalesce(trim(p_title), '') = '' then
    raise exception 'TITLE_REQUIRED';
  end if;

  v_owner_id := coalesce(p_owner_member_id, v_current_owner_id);

  if v_owner_id = v_member_id then
    v_owner_name := v_member_name;
  else
    select m.id, m.display_name
    into v_owner_id, v_owner_name
    from public.group_members m
    where m.id = v_owner_id
      and m.group_id = v_group_id
      and m.status = 'approved';

    if v_owner_id is null then
      raise exception 'MEMBER_NOT_FOUND';
    end if;
  end if;

  update public.wishlist_items i
  set
    owner_member_id = v_owner_id,
    title = trim(p_title),
    url = nullif(trim(p_url), ''),
    image_url = nullif(trim(p_image_url), ''),
    notes = nullif(trim(p_notes), ''),
    price = nullif(trim(p_price), '')
  where i.id = p_item_id
    and i.group_id = v_group_id;

  return query
  select
    i.id,
    i.group_id,
    i.owner_member_id,
    v_owner_name,
    coalesce(i.created_by_member_id, i.owner_member_id),
    v_member_name,
    i.created_at,
    i.title,
    i.url,
    i.image_url,
    i.notes,
    i.price,
    false
  from public.wishlist_items i
  where i.id = p_item_id;
end;
$$;

create or replace function public.hide_item(
  p_group_secret text,
  p_user_secret text,
  p_item_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
  v_owner_id uuid;
begin
  select g.id, m.id
  into v_group_id, v_member_id
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_group_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  select i.owner_member_id
  into v_owner_id
  from public.wishlist_items i
  where i.id = p_item_id
    and i.group_id = v_group_id;

  if v_owner_id is null then
    raise exception 'ITEM_NOT_FOUND';
  end if;

  if v_owner_id = v_member_id then
    raise exception 'ITEM_NOT_FOUND';
  end if;

  insert into public.hidden_items (group_id, member_id, item_id)
  values (v_group_id, v_member_id, p_item_id)
  on conflict (member_id, item_id) do nothing;

  return true;
end;
$$;

create or replace function public.unhide_item(
  p_group_secret text,
  p_user_secret text,
  p_item_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
begin
  select g.id, m.id
  into v_group_id, v_member_id
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_group_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  delete from public.hidden_items h
  where h.group_id = v_group_id
    and h.member_id = v_member_id
    and h.item_id = p_item_id;

  return found;
end;
$$;

create or replace function public.get_app_capabilities()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'schema_version', 3,
    'features', jsonb_build_array(
      'suggestions',
      'delete_notifications',
      'member_filter',
      'budget_filter',
      'amazon_import',
      'edit_items',
      'hide_items',
      'multi_group',
      'bookmarklet'
    )
  );
$$;

revoke all on function public.get_group_items(text, text) from public;
revoke all on function public.update_item(text, text, uuid, text, text, text, text, text, uuid) from public;
revoke all on function public.hide_item(text, text, uuid) from public;
revoke all on function public.unhide_item(text, text, uuid) from public;
revoke all on function public.get_app_capabilities() from public;

grant execute on function public.get_group_items(text, text) to anon, authenticated;
grant execute on function public.update_item(text, text, uuid, text, text, text, text, text, uuid) to anon, authenticated;
grant execute on function public.hide_item(text, text, uuid) to anon, authenticated;
grant execute on function public.unhide_item(text, text, uuid) to anon, authenticated;
grant execute on function public.get_app_capabilities() to anon, authenticated;


-- 12. Pre-approved member links --------------------------------------------

-- Admin-created, pre-approved members.
--
-- The admin chooses the display name and the app generates a high-entropy
-- member secret. The database creates the member already approved and returns
-- its id/name. The app builds a personal link for that member, so the invited
-- person can open it and use the group immediately without a pending approval.

create or replace function public.create_preapproved_member(
  p_group_secret text,
  p_admin_user_secret text,
  p_display_name text,
  p_user_secret text
)
returns table (
  member_id uuid,
  display_name text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_admin_id uuid;
  v_member_id uuid;
begin
  select g.id, m.id
  into v_group_id, v_admin_id
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_admin_user_secret)
    and m.status = 'approved'
    and m.is_admin = true;

  if v_admin_id is null then
    raise exception 'NOT_ADMIN';
  end if;

  if coalesce(trim(p_display_name), '') = '' then
    raise exception 'INVALID_NAME';
  end if;

  if char_length(trim(p_user_secret)) < 16 then
    raise exception 'INVALID_SECRET';
  end if;

  insert into public.group_members (
    group_id,
    user_secret,
    display_name,
    is_admin,
    status
  )
  values (
    v_group_id,
    trim(p_user_secret),
    trim(p_display_name),
    false,
    'approved'
  )
  returning id into v_member_id;

  return query
  select v_member_id, trim(p_display_name);
end;
$$;

create or replace function public.get_app_capabilities()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'schema_version', 4,
    'features', jsonb_build_array(
      'suggestions',
      'delete_notifications',
      'member_filter',
      'budget_filter',
      'amazon_import',
      'edit_items',
      'hide_items',
      'multi_group',
      'bookmarklet',
      'preapproved_members'
    )
  );
$$;

revoke all on function public.create_preapproved_member(text, text, text, text) from public;
revoke all on function public.get_app_capabilities() from public;

grant execute on function public.create_preapproved_member(text, text, text, text) to anon, authenticated;
grant execute on function public.get_app_capabilities() to anon, authenticated;

