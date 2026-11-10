-- Admin member removal.
--
-- Removing a member revokes access immediately: the status becomes `removed`,
-- the session secret is replaced and any invite token is cleared. Wishes and
-- gift ideas stay in the group so the family does not lose them; reservations,
-- hidden items and notifications belonging to the removed member are cleared.

alter table public.group_members
  drop constraint if exists group_members_status_check;

alter table public.group_members
  add constraint group_members_status_check
  check (status in ('pending', 'approved', 'invited', 'removed'));

create or replace function public.remove_member(
  p_group_secret text,
  p_admin_user_secret text,
  p_member_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_admin_id uuid;
  v_target_status text;
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

  if p_member_id = v_admin_id then
    raise exception 'CANNOT_REMOVE_SELF';
  end if;

  select m.status
  into v_target_status
  from public.group_members m
  where m.id = p_member_id
    and m.group_id = v_group_id
    and m.status <> 'removed';

  if v_target_status is null then
    raise exception 'MEMBER_NOT_FOUND';
  end if;

  delete from public.item_reservations r
  where r.reserved_by_member_id = p_member_id;

  delete from public.hidden_items h
  where h.member_id = p_member_id;

  delete from public.notifications n
  where n.member_id = p_member_id;

  update public.group_members m
  set
    status = 'removed',
    user_secret = replace(gen_random_uuid()::text, '-', ''),
    invite_token = null
  where m.id = p_member_id;

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
    'schema_version', 7,
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
      'member_removal'
    )
  );
$$;

revoke all on function public.remove_member(text, text, uuid) from public;
revoke all on function public.get_app_capabilities() from public;

grant execute on function public.remove_member(text, text, uuid) to anon, authenticated;
grant execute on function public.get_app_capabilities() to anon, authenticated;
