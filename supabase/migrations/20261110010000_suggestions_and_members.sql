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
