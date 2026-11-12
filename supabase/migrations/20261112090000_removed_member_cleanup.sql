-- Cleanup of wishes created by members who have been removed.
--
-- Admins could not delete wishes created by someone else, so wishes left behind
-- by a removed member had no owner able to remove them. The item list now
-- exposes whether the current admin may clean up such an item, and delete_item
-- allows that specific case while preserving the normal creator-only rule.

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
  hidden_by_me boolean,
  can_admin_delete boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
  v_is_admin boolean;
begin
  select g.id, m.id, m.is_admin
  into v_group_id, v_member_id, v_is_admin
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
    (h.id is not null),
    (v_is_admin and coalesce(creator.status = 'removed', false))
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
  v_is_admin boolean;
  v_owner_id uuid;
  v_creator_id uuid;
  v_creator_status text;
  v_title text;
begin
  select g.id, m.id, m.display_name, m.is_admin
  into v_group_id, v_member_id, v_member_name, v_is_admin
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
    if not v_is_admin then
      raise exception 'NOT_ALLOWED';
    end if;

    select m.status
    into v_creator_status
    from public.group_members m
    where m.id = v_creator_id
      and m.group_id = v_group_id;

    if v_creator_status is distinct from 'removed' then
      raise exception 'NOT_ALLOWED';
    end if;
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

create or replace function public.get_app_capabilities()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'schema_version', 9,
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
      'item_ratings',
      'member_removal',
      'member_reinvite',
      'removed_member_cleanup'
    )
  );
$$;

revoke all on function public.get_group_items(text, text) from public;
revoke all on function public.delete_item(text, text, uuid) from public;
revoke all on function public.get_app_capabilities() from public;

grant execute on function public.get_group_items(text, text) to anon, authenticated;
grant execute on function public.delete_item(text, text, uuid) to anon, authenticated;
grant execute on function public.get_app_capabilities() to anon, authenticated;
