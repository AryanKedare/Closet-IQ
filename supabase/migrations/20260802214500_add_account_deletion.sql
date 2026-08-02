-- Permanently delete the authenticated ClosetIQ account and all database rows.
-- Storage files are removed through the Storage API before this function runs.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.outfit_history
  where user_id = current_user_id;

  delete from public.outfits
  where user_id = current_user_id;

  delete from public.wardrobe_items
  where user_id = current_user_id;

  delete from public.user_profile
  where id = current_user_id;

  delete from auth.users
  where id = current_user_id;
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;

comment on function public.delete_my_account() is
  'Deletes the calling authenticated user, profile, wardrobe, outfits, and outfit history in one transaction.';
