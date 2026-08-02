-- ClosetIQ: upgrade an EXISTING Supabase database without deleting current rows
--
-- Use this when public.user_profile, public.wardrobe_items, public.outfits,
-- and public.outfit_history already exist, as shown in the Supabase Table Editor.
--
-- Recommended: create a database backup before running production migrations.

begin;

-- 1. Add only the missing feature columns ----------------------------------

alter table public.user_profile
  add column if not exists onboarding_completed boolean;

-- Existing profiles already contain user-selected/default profile values, so
-- keep them active. Only new Auth users should begin with onboarding incomplete.
update public.user_profile
set onboarding_completed = true
where onboarding_completed is null;

alter table public.user_profile
  alter column onboarding_completed set default false,
  alter column onboarding_completed set not null,
  alter column skin_tone_hex drop not null,
  alter column eye_color_hex drop not null,
  alter column hair_color_hex drop not null,
  alter column skin_tone_type drop not null;

alter table public.wardrobe_items
  add column if not exists is_stored boolean not null default false;

alter table public.outfits
  add column if not exists name text;

alter table public.outfit_history
  add column if not exists rating integer;

-- Add the rating constraint only when it is not already present.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'outfit_history_rating_check'
      and conrelid = 'public.outfit_history'::regclass
  ) then
    alter table public.outfit_history
      add constraint outfit_history_rating_check
      check (rating is null or rating between 1 and 3) not valid;

    alter table public.outfit_history
      validate constraint outfit_history_rating_check;
  end if;
end;
$$;

-- 2. Indexes ----------------------------------------------------------------

create index if not exists wardrobe_items_user_created_idx
  on public.wardrobe_items (user_id, created_at desc);

create index if not exists wardrobe_items_user_category_idx
  on public.wardrobe_items (user_id, category);

create index if not exists outfits_user_score_idx
  on public.outfits (user_id, compatibility_score desc);

create index if not exists outfits_user_saved_idx
  on public.outfits (user_id, is_saved)
  where is_saved = true;

create index if not exists outfit_history_user_date_idx
  on public.outfit_history (user_id, worn_date desc);

create index if not exists outfit_history_outfit_idx
  on public.outfit_history (outfit_id);

-- 3. Automatically maintain user_profile.updated_at -------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_profile_updated_at on public.user_profile;
create trigger set_user_profile_updated_at
before update on public.user_profile
for each row execute function public.set_updated_at();

-- 4. Replace all existing app-table policies with strict owner-only RLS -----
-- The screenshot shows multiple policies on wardrobe_items. Because these four
-- tables belong only to ClosetIQ, remove every existing policy on them to avoid
-- accidentally retaining an old permissive development policy.

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('user_profile', 'wardrobe_items', 'outfits', 'outfit_history')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

alter table public.user_profile enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_history enable row level security;

revoke all on table public.user_profile from anon;
revoke all on table public.wardrobe_items from anon;
revoke all on table public.outfits from anon;
revoke all on table public.outfit_history from anon;

grant select, insert, update, delete on table public.user_profile to authenticated;
grant select, insert, update, delete on table public.wardrobe_items to authenticated;
grant select, insert, update, delete on table public.outfits to authenticated;
grant select, insert, update, delete on table public.outfit_history to authenticated;

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

-- 5. New Auth users receive an incomplete onboarding profile ----------------

create or replace function public.handle_new_closetiq_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profile (
    id,
    display_name,
    skin_tone_hex,
    eye_color_hex,
    hair_color_hex,
    skin_tone_type,
    style_preferences,
    onboarding_completed
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(new.email, '@', 1), ''),
      'User'
    ),
    null,
    null,
    null,
    null,
    array[]::text[],
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_closetiq_user() from public;

drop trigger if exists on_auth_user_created_closetiq on auth.users;
create trigger on_auth_user_created_closetiq
after insert on auth.users
for each row execute function public.handle_new_closetiq_user();

-- Create profiles only for Auth users that do not already have one.
insert into public.user_profile (
  id,
  display_name,
  style_preferences,
  onboarding_completed
)
select
  users.id,
  coalesce(
    nullif(users.raw_user_meta_data ->> 'display_name', ''),
    nullif(users.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(users.email, '@', 1), ''),
    'User'
  ),
  array[]::text[],
  false
from auth.users as users
left join public.user_profile as profiles on profiles.id = users.id
where profiles.id is null;

-- 6. Wardrobe image bucket and owner-only Storage policies ------------------
-- Existing image paths should use: <auth-user-id>/<item-id>.webp

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'wardrobe-images',
  'wardrobe-images',
  true,
  10485760,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users manage own wardrobe images" on storage.objects;
drop policy if exists "Users list own wardrobe images" on storage.objects;
drop policy if exists "Users upload own wardrobe images" on storage.objects;
drop policy if exists "Users update own wardrobe images" on storage.objects;
drop policy if exists "Users delete own wardrobe images" on storage.objects;

create policy "Users list own wardrobe images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users upload own wardrobe images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users update own wardrobe images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users delete own wardrobe images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Complete account deletion ---------------------------------------------
-- The app removes Storage objects first, then calls this function.

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
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  delete from public.outfit_history where user_id = current_user_id;
  delete from public.outfits where user_id = current_user_id;
  delete from public.wardrobe_items where user_id = current_user_id;
  delete from public.user_profile where id = current_user_id;
  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;

commit;

-- Verification summary. orphaned_* should be zero before enabling the app.
select
  (select count(*) from public.user_profile) as profile_rows,
  (select count(*) from public.wardrobe_items) as wardrobe_rows,
  (select count(*) from public.outfits) as outfit_rows,
  (select count(*) from public.outfit_history) as history_rows,
  (
    select count(*)
    from (
      select user_id from public.wardrobe_items
      union all
      select user_id from public.outfits
      union all
      select user_id from public.outfit_history
    ) owned_rows
    left join auth.users users on users.id = owned_rows.user_id
    where users.id is null
  ) as orphaned_user_rows,
  true as upgrade_completed;
