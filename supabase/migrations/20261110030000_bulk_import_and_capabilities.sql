-- Bulk import for Amazon wishlists and a feature-capability probe.
--
-- The CI migration step is allowed to continue on error, so the frontend must
-- be able to discover which RPCs are available instead of assuming that the
-- latest build and the latest database always match.

create or replace function public.add_items(
  p_group_secret text,
  p_user_secret text,
  p_items jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
  v_member_name text;
  v_inserted integer;
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

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_IMPORT';
  end if;

  if jsonb_array_length(p_items) > 100 then
    raise exception 'IMPORT_LIMIT';
  end if;

  insert into public.wishlist_items (
    group_id,
    owner_member_id,
    created_by_member_id,
    title,
    url,
    image_url,
    notes,
    price,
    added_by
  )
  select
    v_group_id,
    v_member_id,
    v_member_id,
    trim(item.title),
    nullif(trim(item.url), ''),
    nullif(trim(item.image_url), ''),
    nullif(trim(item.notes), ''),
    nullif(trim(item.price), ''),
    v_member_name
  from jsonb_to_recordset(p_items)
    as item(title text, url text, image_url text, notes text, price text)
  where coalesce(trim(item.title), '') <> '';

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

create or replace function public.get_app_capabilities()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'schema_version', 2,
    'features', jsonb_build_array(
      'suggestions',
      'delete_notifications',
      'member_filter',
      'budget_filter',
      'amazon_import'
    )
  );
$$;

revoke all on function public.add_items(text, text, jsonb) from public;
revoke all on function public.get_app_capabilities() from public;

grant execute on function public.add_items(text, text, jsonb) to anon, authenticated;
grant execute on function public.get_app_capabilities() to anon, authenticated;
