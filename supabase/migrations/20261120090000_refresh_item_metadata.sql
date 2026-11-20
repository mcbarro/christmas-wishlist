-- Refresh metadata for an existing wish.
--
-- The creator or a group admin can re-read the source link and update the
-- preview image, price and (when the client decides the old title is invalid)
-- the title. Empty values never erase existing data.

create or replace function public.refresh_item_metadata(
  p_group_secret text,
  p_user_secret text,
  p_item_id uuid,
  p_image_url text,
  p_price text,
  p_title text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
  v_is_admin boolean;
  v_creator_id uuid;
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

  select coalesce(i.created_by_member_id, i.owner_member_id)
  into v_creator_id
  from public.wishlist_items i
  where i.id = p_item_id
    and i.group_id = v_group_id;

  if v_creator_id is null then
    raise exception 'ITEM_NOT_FOUND';
  end if;

  if v_creator_id <> v_member_id and not v_is_admin then
    raise exception 'NOT_ALLOWED';
  end if;

  update public.wishlist_items i
  set
    image_url = coalesce(nullif(trim(p_image_url), ''), i.image_url),
    price = coalesce(nullif(trim(p_price), ''), i.price),
    title = coalesce(nullif(trim(p_title), ''), i.title)
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
    'schema_version', 10,
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
      'removed_member_cleanup',
      'item_refresh'
    )
  );
$$;

revoke all on function public.refresh_item_metadata(text, text, uuid, text, text, text) from public;
revoke all on function public.get_app_capabilities() from public;

grant execute on function public.refresh_item_metadata(text, text, uuid, text, text, text) to anon, authenticated;
grant execute on function public.get_app_capabilities() to anon, authenticated;
