-- Admin reissue of a one-time invite for an existing member.
--
-- The member keeps their id, so wishes, suggestions and reservations stay
-- attached to them. Reissuing clears their current session secret and previous
-- invite token, then returns a fresh one-time token. Claiming the new link
-- assigns a new secret and approves the member again.

create or replace function public.reissue_invite(
  p_group_secret text,
  p_admin_user_secret text,
  p_member_id uuid
)
returns table (
  member_id uuid,
  display_name text,
  invite_token text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_admin_id uuid;
  v_member_name text;
  v_invite_token text;
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
    raise exception 'CANNOT_REINVITE_SELF';
  end if;

  select m.display_name
  into v_member_name
  from public.group_members m
  where m.id = p_member_id
    and m.group_id = v_group_id
    and m.status in ('pending', 'approved', 'invited', 'removed');

  if v_member_name is null then
    raise exception 'MEMBER_NOT_FOUND';
  end if;

  v_invite_token :=
    replace(gen_random_uuid()::text, '-', '') ||
    replace(gen_random_uuid()::text, '-', '');

  update public.group_members m
  set
    status = 'invited',
    user_secret = replace(gen_random_uuid()::text, '-', ''),
    invite_token = v_invite_token,
    invite_created_at = now(),
    invite_used_at = null
  where m.id = p_member_id;

  return query
  select p_member_id, v_member_name, v_invite_token;
end;
$$;

create or replace function public.get_app_capabilities()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'schema_version', 8,
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
      'member_reinvite'
    )
  );
$$;

revoke all on function public.reissue_invite(text, text, uuid) from public;
revoke all on function public.get_app_capabilities() from public;

grant execute on function public.reissue_invite(text, text, uuid) to anon, authenticated;
grant execute on function public.get_app_capabilities() to anon, authenticated;
