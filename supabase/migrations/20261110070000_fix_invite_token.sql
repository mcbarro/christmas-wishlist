-- Fix one-time invite token generation.
--
-- pgcrypto lives in the `extensions` schema on Supabase, while the function
-- runs with `search_path = public, pg_temp`, so `gen_random_bytes` was not
-- resolvable. Use the built-in `gen_random_uuid` instead: two UUIDs give a
-- 64-character hex token with enough entropy and no schema dependency.

create or replace function public.create_preapproved_member(
  p_group_secret text,
  p_admin_user_secret text,
  p_display_name text
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
  v_member_id uuid;
  v_invite_token text;
  v_placeholder_secret text;
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

  v_invite_token :=
    replace(gen_random_uuid()::text, '-', '') ||
    replace(gen_random_uuid()::text, '-', '');
  v_placeholder_secret := replace(gen_random_uuid()::text, '-', '');

  insert into public.group_members (
    group_id,
    user_secret,
    display_name,
    is_admin,
    status,
    invite_token,
    invite_created_at
  )
  values (
    v_group_id,
    v_placeholder_secret,
    trim(p_display_name),
    false,
    'invited',
    v_invite_token,
    now()
  )
  returning id into v_member_id;

  return query
  select v_member_id, trim(p_display_name), v_invite_token;
end;
$$;

revoke all on function public.create_preapproved_member(text, text, text) from public;
grant execute on function public.create_preapproved_member(text, text, text) to anon, authenticated;
