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
