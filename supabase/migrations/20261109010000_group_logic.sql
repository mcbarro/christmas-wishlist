-- Family groups, member approval and privacy-preserving reservations.
--
-- The application is zero-account, so the group secret and the member secret
-- are the credentials. Direct table access is denied to anon/authenticated;
-- every operation goes through the SECURITY DEFINER functions below.

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  group_secret text unique not null,
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

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

-- Keep the legacy columns for backwards compatibility, but new rows are
-- scoped by group_id and owner_member_id.
alter table public.wishlist_items
  add column if not exists group_id uuid references public.groups(id) on delete cascade,
  add column if not exists owner_member_id uuid references public.group_members(id) on delete cascade,
  add column if not exists price text;

alter table public.wishlist_items
  alter column group_id drop not null,
  alter column owner_member_id drop not null;

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

-- RLS is enabled and no direct policies are created: anon/authenticated must
-- use the RPCs below. The old open policies from the initial migration are
-- removed because they would expose reservations and allow unapproved writes.
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.item_reservations enable row level security;

drop policy if exists "wishlist_items_select_public" on public.wishlist_items;
drop policy if exists "wishlist_items_insert_public" on public.wishlist_items;
drop policy if exists "wishlist_items_update_public" on public.wishlist_items;
drop policy if exists "wishlist_items_delete_public" on public.wishlist_items;
drop policy if exists "Abilita lettura pubblica" on public.wishlist_items;
drop policy if exists "Abilita inserimento pubblico" on public.wishlist_items;
drop policy if exists "Abilita aggiornamento pubblico" on public.wishlist_items;
drop policy if exists "Abilita eliminazione pubblica" on public.wishlist_items;

revoke all on table public.groups from anon, authenticated;
revoke all on table public.group_members from anon, authenticated;
revoke all on table public.wishlist_items from anon, authenticated;
revoke all on table public.item_reservations from anon, authenticated;

-- Create a group and its first admin member atomically.
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
  select
    v_group_id,
    v_member_id,
    trim(p_name),
    trim(p_display_name),
    true,
    'approved'::text;
end;
$$;

-- Join an existing group. Reusing an existing user_secret returns the same
-- member (multi-device link); a new secret creates a pending member.
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
    select
      v_group.id,
      v_member.id,
      v_group.name,
      v_member.display_name,
      v_member.is_admin,
      v_member.status;
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
  select
    v_group.id,
    v_member.id,
    v_group.name,
    v_member.display_name,
    v_member.is_admin,
    v_member.status;
end;
$$;

-- Resolve a personal link to its group/member. Returns no rows if either
-- secret is invalid.
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
  select
    g.id,
    m.id,
    g.name,
    m.display_name,
    m.is_admin,
    m.status
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret);
end;
$$;

-- Used by the join screen to show the group name before requesting access.
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

-- Approved members can read only their group's wishes.
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

-- Reserve another member's gift. The unique item_id constraint prevents
-- double reservations; ownership is checked here.
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

-- Privacy-critical RPC: reservations on the caller's own wishes are omitted.
-- The frontend must never query public.item_reservations directly.
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

-- Only the RPCs are callable by the public API roles.
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
