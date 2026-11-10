-- Wish deletion and persistent in-app notifications.
--
-- Only the creator of an item may delete it. Before deleting, every member who
-- had reserved the item receives a notification. The item owner never learns
-- whether (or by whom) the gift was reserved, preserving the surprise.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  member_id uuid not null references public.group_members(id) on delete cascade,
  type text not null check (type in ('wish_deleted')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_member_created_idx
  on public.notifications (member_id, created_at desc);

create index if not exists notifications_member_unread_idx
  on public.notifications (member_id, read_at);

alter table public.notifications enable row level security;

revoke all on table public.notifications from anon, authenticated;

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
  v_owner_id uuid;
  v_creator_id uuid;
  v_title text;
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
    raise exception 'NOT_ALLOWED';
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

create or replace function public.get_notifications(
  p_group_id uuid,
  p_user_secret text
)
returns table (
  id uuid,
  type text,
  payload jsonb,
  created_at timestamptz,
  read_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member_id uuid;
begin
  select m.id
  into v_member_id
  from public.group_members m
  where m.group_id = p_group_id
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_member_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  return query
  select
    n.id,
    n.type,
    n.payload,
    n.created_at,
    n.read_at
  from public.notifications n
  where n.group_id = p_group_id
    and n.member_id = v_member_id
  order by n.created_at desc
  limit 50;
end;
$$;

create or replace function public.mark_notifications_read(
  p_group_id uuid,
  p_user_secret text
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member_id uuid;
  v_count integer;
begin
  select m.id
  into v_member_id
  from public.group_members m
  where m.group_id = p_group_id
    and m.user_secret = trim(p_user_secret)
    and m.status = 'approved';

  if v_member_id is null then
    raise exception 'NOT_APPROVED';
  end if;

  update public.notifications n
  set read_at = now()
  where n.group_id = p_group_id
    and n.member_id = v_member_id
    and n.read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.delete_item(text, text, uuid) from public;
revoke all on function public.get_notifications(uuid, text) from public;
revoke all on function public.mark_notifications_read(uuid, text) from public;

grant execute on function public.delete_item(text, text, uuid) to anon, authenticated;
grant execute on function public.get_notifications(uuid, text) to anon, authenticated;
grant execute on function public.mark_notifications_read(uuid, text) to anon, authenticated;
