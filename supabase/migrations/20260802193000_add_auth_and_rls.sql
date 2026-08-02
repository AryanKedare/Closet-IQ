-- ClosetIQ multi-user authentication and row-level security.

alter table public.user_profile enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_history enable row level security;

-- Replace any permissive development policies with account-scoped policies.
drop policy if exists "user_profile_all" on public.user_profile;
drop policy if exists "wardrobe_items_all" on public.wardrobe_items;
drop policy if exists "outfits_all" on public.outfits;
drop policy if exists "outfit_history_all" on public.outfit_history;
drop policy if exists "Users manage own profile" on public.user_profile;
drop policy if exists "Users manage own wardrobe" on public.wardrobe_items;
drop policy if exists "Users manage own outfits" on public.outfits;
drop policy if exists "Users manage own outfit history" on public.outfit_history;

create policy "Users manage own profile"
on public.user_profile
for all
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users manage own wardrobe"
on public.wardrobe_items
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users manage own outfits"
on public.outfits
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users manage own outfit history"
on public.outfit_history
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Create a default ClosetIQ profile for every email/password or OAuth account.
create or replace function public.handle_new_closetiq_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profile (
    id,
    display_name,
    skin_tone_hex,
    eye_color_hex,
    hair_color_hex,
    skin_tone_type,
    style_preferences
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'User'),
    '#CC9674',
    '#1F1919',
    '#0A0B0B',
    'warm-medium',
    '[]'::jsonb
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_closetiq on auth.users;
create trigger on_auth_user_created_closetiq
after insert on auth.users
for each row execute procedure public.handle_new_closetiq_user();

-- Backfill a profile for auth users created before this migration.
insert into public.user_profile (
  id,
  display_name,
  skin_tone_hex,
  eye_color_hex,
  hair_color_hex,
  skin_tone_type,
  style_preferences
)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'display_name', users.raw_user_meta_data ->> 'full_name', split_part(users.email, '@', 1), 'User'),
  '#CC9674',
  '#1F1919',
  '#0A0B0B',
  'warm-medium',
  '[]'::jsonb
from auth.users as users
on conflict (id) do nothing;

-- Wardrobe image objects are stored under <user-id>/<filename>.
drop policy if exists "Users manage own wardrobe images" on storage.objects;
create policy "Users manage own wardrobe images"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
