-- Fix `join_group` on projects where the first group migration has already been
-- applied.
--
-- `join_group` returns a column named `group_id`, and the member lookup used an
-- unqualified `WHERE group_id = ...`, so PostgreSQL could not tell the output
-- parameter from the table column and rejected every join request with error
-- 42702. Qualify the table columns to resolve the conflict.

create or replace function public.join_group(
  p_group_secret text,
  p_user_secret text,
  p_display_name text
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
  v_group public.groups%rowtype;
  v_member public.group_members%rowtype;
begin
  if coalesce(trim(p_group_secret), '') = ''
    or coalesce(trim(p_user_secret), '') = '' then
    raise exception 'INVALID_SECRET';
  end if;

  select *
  into v_group
  from public.groups g
  where g.group_secret = trim(p_group_secret);

  if not found then
    raise exception 'GROUP_NOT_FOUND';
  end if;

  select *
  into v_member
  from public.group_members
  where group_members.group_id = v_group.id
    and group_members.user_secret = trim(p_user_secret);

  if found then
    if coalesce(trim(p_display_name), '') <> ''
      and v_member.display_name <> trim(p_display_name) then
      update public.group_members
      set display_name = trim(p_display_name)
      where group_members.id = v_member.id;
      v_member.display_name := trim(p_display_name);
    end if;

    return query
    select
      v_group.id,
      v_member.id,
      v_group.name,
      v_member.display_name,
      v_member.is_admin,
      v_member.status;
    return;
  end if;

  if coalesce(trim(p_display_name), '') = '' then
    raise exception 'INVALID_NAME';
  end if;

  insert into public.group_members (
    group_id,
    user_secret,
    display_name,
    is_admin,
    status
  )
  values (
    v_group.id,
    trim(p_user_secret),
    trim(p_display_name),
    false,
    'pending'
  )
  returning * into v_member;

  return query
  select
    v_group.id,
    v_member.id,
    v_group.name,
    v_member.display_name,
    v_member.is_admin,
    v_member.status;
end;
$$;

revoke all on function public.join_group(text, text, text) from public;
grant execute on function public.join_group(text, text, text) to anon, authenticated;
