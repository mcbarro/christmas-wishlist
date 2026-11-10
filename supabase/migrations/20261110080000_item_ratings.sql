-- Wish ratings.
--
-- Every self-added wish has a rating from 1 to 5 in 0.5 steps, default 2.5.
-- Only the member who created the wish can change it, and suggestions added
-- for another member have no rating. The client sorts suggestions first, then
-- by rating descending.

alter table public.wishlist_items
  add column if not exists rating numeric(2,1) not null default 2.5;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.wishlist_items'::regclass
      and conname = 'wishlist_items_rating_check'
  ) then
    alter table public.wishlist_items
      add constraint wishlist_items_rating_check
      check (
        rating >= 1
        and rating <= 5
        and (rating * 2) = floor(rating * 2)
      );
  end if;
end;
$$;

-- The return shape changes: add rating.
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
  rating numeric,
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
    i.rating,
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

create or replace function public.set_item_rating(
  p_group_secret text,
  p_user_secret text,
  p_item_id uuid,
  p_rating numeric
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
  v_creator_id uuid;
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

  select
    i.owner_member_id,
    coalesce(i.created_by_member_id, i.owner_member_id)
  into v_owner_id, v_creator_id
  from public.wishlist_items i
  where i.id = p_item_id
    and i.group_id = v_group_id;

  if v_owner_id is null then
    raise exception 'ITEM_NOT_FOUND';
  end if;

  -- Suggestions added for another member never have a rating.
  if v_creator_id <> v_member_id or v_owner_id <> v_creator_id then
    raise exception 'NOT_ALLOWED';
  end if;

  if p_rating is null
     or p_rating < 1
     or p_rating > 5
     or (p_rating * 2) <> floor(p_rating * 2) then
    raise exception 'INVALID_RATING';
  end if;

  update public.wishlist_items i
  set rating = p_rating
  where i.id = p_item_id
    and i.group_id = v_group_id;

  return true;
end;
$$;

create or replace function public.get_app_capabilities()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'schema_version', 6,
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
      'preapproved_members',
      'one_time_invites',
      'item_ratings'
    )
  );
$$;

revoke all on function public.get_group_items(text, text) from public;
revoke all on function public.set_item_rating(text, text, uuid, numeric) from public;
revoke all on function public.get_app_capabilities() from public;

grant execute on function public.get_group_items(text, text) to anon, authenticated;
grant execute on function public.set_item_rating(text, text, uuid, numeric) to anon, authenticated;
grant execute on function public.get_app_capabilities() to anon, authenticated;
