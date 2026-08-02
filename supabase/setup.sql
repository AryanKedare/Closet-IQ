-- ============================================================================
-- ClosetIQ - complete Supabase setup
-- ============================================================================
-- Use this file for a NEW Supabase project.
--
-- Supabase Dashboard -> SQL Editor -> New query -> paste this file -> Run.
--
-- This script is designed to be safe to run more than once. It does not drop
-- tables or user data. It creates the complete application schema, indexes,
-- storage bucket, row-level security policies, new-user onboarding trigger,
-- and authenticated account-deletion function.
-- ============================================================================

begin;

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------
-- 1. Application tables
-- --------------------------------------------------------------------------

create table if not exists public.user_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'User',
  skin_tone_hex text,
  eye_color_hex text,
  hair_color_hex text,
  skin_tone_type text,
  style_preferences text[] not null default array[]::text[],
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profile_skin_hex_check
    check (skin_tone_hex is null or skin_tone_hex ~ '^#[0-9A-Fa-f]{6}$'),
  constraint user_profile_eye_hex_check
    check (eye_color_hex is null or eye_color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  constraint user_profile_hair_hex_check
    check (hair_color_hex is null or hair_color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

create table if not exists public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  sub_category text,
  primary_color text not null,
  secondary_color text,
  color_family text not null,
  style_tags text[] not null default array[]::text[],
  occasion_tags text[] not null default array[]::text[],
  pattern text not null default 'solid',
  season text[] not null default array[]::text[],
  brand text,
  image_url text,
  times_worn integer not null default 0,
  last_worn timestamptz,
  is_stored boolean not null default false,
  created_at timestamptz not null default now(),
  constraint wardrobe_items_times_worn_check check (times_worn >= 0),
  constraint wardrobe_items_primary_hex_check
    check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint wardrobe_items_secondary_hex_check
    check (secondary_color is null or secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint wardrobe_items_category_check
    check (category in ('shirt', 'tshirt', 'pants', 'jeans', 'shorts', 'jacket', 'shoes', 'accessory')),
  constraint wardrobe_items_pattern_check
    check (pattern in ('solid', 'stripe', 'plaid', 'graphic', 'texture')),
  constraint wardrobe_items_user_id_id_key unique (user_id, id)
);

create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  top_id uuid,
  bottom_id uuid,
  shoes_id uuid,
  jacket_id uuid,
  compatibility_score integer not null default 0,
  occasion_tags text[] not null default array[]::text[],
  is_saved boolean not null default false,
  is_favorite boolean not null default false,
  worn_count integer not null default 0,
  ai_explanation text,
  name text,
  created_at timestamptz not null default now(),
  constraint outfits_compatibility_score_check
    check (compatibility_score between 0 and 100),
  constraint outfits_worn_count_check check (worn_count >= 0),
  constraint outfits_user_id_id_key unique (user_id, id),
  constraint outfits_top_owner_fkey
    foreign key (user_id, top_id)
    references public.wardrobe_items(user_id, id)
    on delete set null,
  constraint outfits_bottom_owner_fkey
    foreign key (user_id, bottom_id)
    references public.wardrobe_items(user_id, id)
    on delete set null,
  constraint outfits_shoes_owner_fkey
    foreign key (user_id, shoes_id)
    references public.wardrobe_items(user_id, id)
    on delete set null,
  constraint outfits_jacket_owner_fkey
    foreign key (user_id, jacket_id)
    references public.wardrobe_items(user_id, id)
    on delete set null
);

create table if not exists public.outfit_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  outfit_id uuid,
  worn_date date not null,
  occasion text,
  notes text,
  rating integer,
  created_at timestamptz not null default now(),
  constraint outfit_history_rating_check
    check (rating is null or rating between 1 and 3),
  constraint outfit_history_outfit_owner_fkey
    foreign key (user_id, outfit_id)
    references public.outfits(user_id, id)
    on delete cascade
);

-- Add feature columns when this script is used on an older ClosetIQ database.
alter table public.user_profile
  add column if not exists onboarding_completed boolean not null default false;

alter table public.wardrobe_items
  add column if not exists is_stored boolean not null default false;

alter table public.outfits
  add column if not exists name text;

alter table public.outfit_history
  add column if not exists rating integer;

-- Onboarding intentionally starts with unset colours.
alter table public.user_profile
  alter column skin_tone_hex drop not null,
  alter column eye_color_hex drop not null,
  alter column hair_color_hex drop not null,
  alter column skin_tone_type drop not null,
  alter column onboarding_completed set default false;

-- --------------------------------------------------------------------------
-- 2. Useful indexes
-- --------------------------------------------------------------------------

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

-- --------------------------------------------------------------------------
-- 3. Automatically maintain user_profile.updated_at
-- --------------------------------------------------------------------------

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

-- --------------------------------------------------------------------------
-- 4. Row-level security and privileges
-- --------------------------------------------------------------------------

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

-- Remove both old development policies and current policy names before recreating.
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

-- --------------------------------------------------------------------------
-- 5. New-user profile provisioning
-- --------------------------------------------------------------------------

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

-- The trigger name is stable, so rerunning the script replaces it cleanly.
drop trigger if exists on_auth_user_created_closetiq on auth.users;
create trigger on_auth_user_created_closetiq
after insert on auth.users
for each row execute function public.handle_new_closetiq_user();

-- Create incomplete onboarding profiles for Auth users who already exist.
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
select
  users.id,
  coalesce(
    nullif(users.raw_user_meta_data ->> 'display_name', ''),
    nullif(users.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(users.email, '@', 1), ''),
    'User'
  ),
  null,
  null,
  null,
  null,
  array[]::text[],
  false
from auth.users as users
left join public.user_profile as profiles on profiles.id = users.id
where profiles.id is null;

-- --------------------------------------------------------------------------
-- 6. Wardrobe image storage
-- --------------------------------------------------------------------------
-- The frontend stores images as: wardrobe-images/<user-id>/<item-id>.webp
-- The bucket is public because the current app stores getPublicUrl() results.
-- Write/list/delete access remains restricted to the authenticated user's folder.

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

-- Remove old combined policy and the split policy names used below.
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

-- --------------------------------------------------------------------------
-- 7. Complete authenticated account deletion
-- --------------------------------------------------------------------------
-- The frontend removes the user's Storage files first, then calls this RPC.
-- No user ID argument is accepted; the function always uses auth.uid().

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

comment on function public.delete_my_account() is
  'Deletes the calling authenticated user and all ClosetIQ database records in one transaction.';

commit;

-- Successful setup returns one row with ready = true.
select
  true as ready,
  'ClosetIQ Supabase setup completed successfully' as message;
