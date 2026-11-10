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
