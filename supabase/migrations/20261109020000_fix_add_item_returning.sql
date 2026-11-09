-- Fix `add_item` on projects where the first group migration has already been
-- applied.
--
-- The function returns a column named `id`, and the original body used
-- `RETURNING id INTO v_item_id`. In PL/pgSQL that reference is ambiguous
-- between the output parameter and the table column, so every "add a wish"
-- request failed with PostgreSQL error 42702. Qualifying the table column
-- resolves the conflict.

create or replace function public.add_item(
  p_group_secret text,
  p_user_secret text,
  p_title text,
  p_url text,
  p_image_url text,
  p_notes text,
  p_price text
)
returns table (
  id uuid,
  group_id uuid,
  owner_member_id uuid,
  owner_name text,
  created_at timestamptz,
  title text,
  url text,
  image_url text,
  notes text,
  price text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
  v_member_name text;
  v_item_id uuid;
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

  if coalesce(trim(p_title), '') = '' then
    raise exception 'TITLE_REQUIRED';
  end if;

  insert into public.wishlist_items (
    group_id,
    owner_member_id,
    title,
    url,
    image_url,
    notes,
    price,
    added_by
  )
  values (
    v_group_id,
    v_member_id,
    trim(p_title),
    nullif(trim(p_url), ''),
    nullif(trim(p_image_url), ''),
    nullif(trim(p_notes), ''),
    nullif(trim(p_price), ''),
    v_member_name
  )
  returning wishlist_items.id into v_item_id;

  return query
  select
    i.id,
    i.group_id,
    i.owner_member_id,
    v_member_name,
    i.created_at,
    i.title,
    i.url,
    i.image_url,
    i.notes,
    i.price
  from public.wishlist_items i
  where i.id = v_item_id;
end;
$$;

revoke all on function public.add_item(text, text, text, text, text, text, text) from public;
grant execute on function public.add_item(text, text, text, text, text, text, text) to anon, authenticated;
