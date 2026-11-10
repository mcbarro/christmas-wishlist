-- One-time admin invites.
--
-- A pre-created member starts as `invited` with a unique invite token and an
-- unrevealed placeholder secret. The admin shares a link containing only the
-- invite token. The first time the recipient explicitly confirms, claim_invite
-- assigns their new user_secret, approves the member and clears the token.
-- The same invite link can no longer be used.

alter table public.group_members
  add column if not exists invite_token text,
  add column if not exists invite_created_at timestamptz,
  add column if not exists invite_used_at timestamptz;

create unique index if not exists group_members_invite_token_idx
  on public.group_members (invite_token)
  where invite_token is not null;

alter table public.group_members
  drop constraint if exists group_members_status_check;

do $$
declare
  v_constraint text;
begin
  select conname
  into v_constraint
  from pg_constraint
  where conrelid = 'public.group_members'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%'
  limit 1;

  if v_constraint is not null then
    execute format(
      'alter table public.group_members drop constraint %I',
      v_constraint
    );
  end if;
end;
$$;

alter table public.group_members
  add constraint group_members_status_check
  check (status in ('pending', 'approved', 'invited'));

-- Replace the v5 pre-approved member function: it no longer accepts the final
-- user secret and it creates an invited row instead of an approved one.
drop function if exists public.create_preapproved_member(text, text, text, text);

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

  v_invite_token := encode(gen_random_bytes(24), 'hex');
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

create or replace function public.get_invite(
  p_group_secret text,
  p_invite_token text
)
returns table (
  group_id uuid,
  group_name text,
  member_id uuid,
  display_name text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  select g.id, g.name, m.id, m.display_name
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.invite_token = trim(p_invite_token)
    and m.status = 'invited';
end;
$$;

create or replace function public.claim_invite(
  p_group_secret text,
  p_invite_token text,
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
declare
  v_group_id uuid;
  v_group_name text;
  v_member_id uuid;
  v_display_name text;
begin
  if coalesce(trim(p_invite_token), '') = '' then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if char_length(trim(p_user_secret)) < 16 then
    raise exception 'INVALID_SECRET';
  end if;

  select g.id, g.name, m.id, m.display_name
  into v_group_id, v_group_name, v_member_id, v_display_name
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.invite_token = trim(p_invite_token)
    and m.status = 'invited'
  for update of m;

  if v_member_id is null then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  update public.group_members m
  set
    user_secret = trim(p_user_secret),
    status = 'approved',
    invite_token = null,
    invite_used_at = now()
  where m.id = v_member_id;

  return query
  select
    v_group_id,
    v_member_id,
    v_group_name,
    v_display_name,
    false,
    'approved'::text;
end;
$$;

-- Invited rows must never be usable as a normal session through their
-- placeholder secret.
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
  select g.id, m.id, g.name, m.display_name, m.is_admin, m.status
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where g.group_secret = trim(p_group_secret)
    and m.user_secret = trim(p_user_secret)
    and m.status in ('pending', 'approved');
end;
$$;

create or replace function public.get_app_capabilities()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'schema_version', 5,
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
      'one_time_invites'
    )
  );
$$;

revoke all on function public.create_preapproved_member(text, text, text) from public;
revoke all on function public.get_invite(text, text) from public;
revoke all on function public.claim_invite(text, text, text) from public;
revoke all on function public.get_session(text, text) from public;
revoke all on function public.get_app_capabilities() from public;

grant execute on function public.create_preapproved_member(text, text, text) to anon, authenticated;
grant execute on function public.get_invite(text, text) to anon, authenticated;
grant execute on function public.claim_invite(text, text, text) to anon, authenticated;
grant execute on function public.get_session(text, text) to anon, authenticated;
grant execute on function public.get_app_capabilities() to anon, authenticated;
