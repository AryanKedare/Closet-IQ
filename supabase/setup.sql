-- ClosetIQ: one-shot Supabase setup for a fresh project
-- Run in Supabase Dashboard -> SQL Editor -> New query.
-- Safe to run again: tables are preserved, missing columns are added,
-- and policies, triggers, constraints, and functions are recreated safely.

begin;

create extension if not exists pgcrypto;

-- 1. Core tables ------------------------------------------------------------

create table if not exists public.user_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'User',

  -- Legacy hex fields remain available to the outfit scoring engine.
  skin_tone_hex text,
  eye_color_hex text,
  hair_color_hex text,
  skin_tone_type text,

  -- Personal-colour questionnaire.
  skin_tone text,
  skin_undertone text,
  hair_color text,
  eye_color text,
  contrast_level text,
  recommended_palette text[] not null default array[]::text[],

  -- Optional fit and proportion information.
  body_type text,
  body_proportions text,
  shirt_size text,
  wrist_inches numeric(5,2),
  shoe_size_inches numeric(5,2),

  style_preferences text[] not null default array[]::text[],
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_profile_skin_hex_check
    check (skin_tone_hex is null or skin_tone_hex ~ '^#[0-9A-Fa-f]{6}$'),
  constraint user_profile_eye_hex_check
    check (eye_color_hex is null or eye_color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  constraint user_profile_hair_hex_check
    check (hair_color_hex is null or hair_color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  constraint user_profile_skin_tone_check
    check (
      skin_tone is null
      or skin_tone in ('very-fair','fair','medium','tan','deep-dark')
    ),
  constraint user_profile_skin_undertone_check
    check (
      skin_undertone is null
      or skin_undertone in ('warm','cool','neutral','not-sure')
    ),
  constraint user_profile_hair_color_check
    check (
      hair_color is null
      or hair_color in (
        'black','dark-brown','light-medium-brown','blonde','red-auburn','gray-white'
      )
    ),
  constraint user_profile_eye_color_check
    check (
      eye_color is null
      or eye_color in ('dark-brown','light-brown-amber','hazel','green','blue','gray')
    ),
  constraint user_profile_contrast_level_check
    check (contrast_level is null or contrast_level in ('high','medium','low')),
  constraint user_profile_palette_hex_check
    check (
      recommended_palette <@ array[
        '#F7F7F5','#191919','#888888','#FFFBEA','#D8D0B6',
        '#C49B68','#747A46','#AFC4A9','#C6BAAB','#948274',
        '#79583F','#48240E','#C9632B','#17336F','#74142F',
        '#1E5521','#1856C5','#718CB5','#BBAA32','#B7192A',
        '#D7E7FA','#AEA3C2','#FFFBD8','#EFCFD0','#0A7D78'
      ]::text[]
    ),
  constraint user_profile_wrist_inches_check
    check (wrist_inches is null or wrist_inches between 3 and 15),
  constraint user_profile_shoe_size_inches_check
    check (shoe_size_inches is null or shoe_size_inches between 5 and 18)
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
    check (category in ('shirt','tshirt','pants','jeans','shorts','jacket','shoes','accessory')),
  constraint wardrobe_items_pattern_check
    check (pattern in ('solid','stripe','plaid','graphic','texture'))
);

create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  top_id uuid references public.wardrobe_items(id) on delete set null,
  bottom_id uuid references public.wardrobe_items(id) on delete set null,
  shoes_id uuid references public.wardrobe_items(id) on delete set null,
  jacket_id uuid references public.wardrobe_items(id) on delete set null,
  compatibility_score integer not null default 0,
  occasion_tags text[] not null default array[]::text[],
  is_saved boolean not null default false,
  is_favorite boolean not null default false,
  worn_count integer not null default 0,
  ai_explanation text,
  name text,
  created_at timestamptz not null default now(),
  constraint outfits_score_check check (compatibility_score between 0 and 100),
  constraint outfits_worn_count_check check (worn_count >= 0)
);

create table if not exists public.outfit_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  outfit_id uuid references public.outfits(id) on delete cascade,
  worn_date date not null,
  occasion text,
  notes text,
  rating integer,
  created_at timestamptz not null default now(),
  constraint outfit_history_rating_check
    check (rating is null or rating between 1 and 3)
);

-- Compatibility with older or partially configured ClosetIQ databases.
alter table public.user_profile
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists skin_tone text,
  add column if not exists skin_undertone text,
  add column if not exists hair_color text,
  add column if not exists eye_color text,
  add column if not exists contrast_level text,
  add column if not exists recommended_palette text[] default array[]::text[],
  add column if not exists body_type text,
  add column if not exists body_proportions text,
  add column if not exists shirt_size text,
  add column if not exists wrist_inches numeric(5,2),
  add column if not exists shoe_size_inches numeric(5,2);

alter table public.wardrobe_items
  add column if not exists is_stored boolean not null default false;
alter table public.outfits add column if not exists name text;
alter table public.outfit_history add column if not exists rating integer;

update public.user_profile
set recommended_palette = array[]::text[]
where recommended_palette is null;

alter table public.user_profile
  alter column skin_tone_hex drop not null,
  alter column eye_color_hex drop not null,
  alter column hair_color_hex drop not null,
  alter column skin_tone_type drop not null,
  alter column recommended_palette set default array[]::text[],
  alter column recommended_palette set not null,
  alter column onboarding_completed set default false;

-- Add personal-profile constraints when upgrading an existing table.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_profile_skin_tone_check'
  ) then
    alter table public.user_profile
      add constraint user_profile_skin_tone_check
      check (
        skin_tone is null
        or skin_tone in ('very-fair','fair','medium','tan','deep-dark')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'user_profile_skin_undertone_check'
  ) then
    alter table public.user_profile
      add constraint user_profile_skin_undertone_check
      check (
        skin_undertone is null
        or skin_undertone in ('warm','cool','neutral','not-sure')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'user_profile_hair_color_check'
  ) then
    alter table public.user_profile
      add constraint user_profile_hair_color_check
      check (
        hair_color is null
        or hair_color in (
          'black','dark-brown','light-medium-brown','blonde','red-auburn','gray-white'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'user_profile_eye_color_check'
  ) then
    alter table public.user_profile
      add constraint user_profile_eye_color_check
      check (
        eye_color is null
        or eye_color in ('dark-brown','light-brown-amber','hazel','green','blue','gray')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'user_profile_contrast_level_check'
  ) then
    alter table public.user_profile
      add constraint user_profile_contrast_level_check
      check (contrast_level is null or contrast_level in ('high','medium','low'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'user_profile_palette_hex_check'
  ) then
    alter table public.user_profile
      add constraint user_profile_palette_hex_check
      check (
        recommended_palette <@ array[
          '#F7F7F5','#191919','#888888','#FFFBEA','#D8D0B6',
          '#C49B68','#747A46','#AFC4A9','#C6BAAB','#948274',
          '#79583F','#48240E','#C9632B','#17336F','#74142F',
          '#1E5521','#1856C5','#718CB5','#BBAA32','#B7192A',
          '#D7E7FA','#AEA3C2','#FFFBD8','#EFCFD0','#0A7D78'
        ]::text[]
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'user_profile_wrist_inches_check'
  ) then
    alter table public.user_profile
      add constraint user_profile_wrist_inches_check
      check (wrist_inches is null or wrist_inches between 3 and 15);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'user_profile_shoe_size_inches_check'
  ) then
    alter table public.user_profile
      add constraint user_profile_shoe_size_inches_check
      check (shoe_size_inches is null or shoe_size_inches between 5 and 18);
  end if;
end;
$$;

comment on column public.user_profile.recommended_palette is
  'Ordered #RRGGBB palette generated from skin tone, undertone, hair, eyes, and contrast.';
comment on column public.user_profile.wrist_inches is
  'Optional wrist circumference in inches.';
comment on column public.user_profile.shoe_size_inches is
  'Optional foot length or shoe measurement in inches.';

-- 2. Indexes ----------------------------------------------------------------

create index if not exists wardrobe_items_user_created_idx
  on public.wardrobe_items (user_id, created_at desc);
create index if not exists wardrobe_items_user_category_idx
  on public.wardrobe_items (user_id, category);
create index if not exists outfits_user_score_idx
  on public.outfits (user_id, compatibility_score desc);
create index if not exists outfits_user_saved_idx
  on public.outfits (user_id, is_saved) where is_saved = true;
create index if not exists outfit_history_user_date_idx
  on public.outfit_history (user_id, worn_date desc);
create index if not exists outfit_history_outfit_idx
  on public.outfit_history (outfit_id);

-- 3. Updated-at trigger ------------------------------------------------------

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

-- 4. Row-level security ------------------------------------------------------

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

drop policy if exists "user_profile_all" on public.user_profile;
drop policy if exists "wardrobe_items_all" on public.wardrobe_items;
drop policy if exists "outfits_all" on public.outfits;
drop policy if exists "outfit_history_all" on public.outfit_history;
drop policy if exists "Users manage own profile" on public.user_profile;
drop policy if exists "Users manage own wardrobe" on public.wardrobe_items;
drop policy if exists "Users manage own outfits" on public.outfits;
drop policy if exists "Users manage own outfit history" on public.outfit_history;

create policy "Users manage own profile"
on public.user_profile for all to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users manage own wardrobe"
on public.wardrobe_items for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users manage own outfits"
on public.outfits for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users manage own outfit history"
on public.outfit_history for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 5. Automatic profile creation and onboarding -----------------------------

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
    skin_tone,
    skin_undertone,
    hair_color,
    eye_color,
    contrast_level,
    recommended_palette,
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
    null,
    null,
    null,
    null,
    null,
    array[]::text[],
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

-- Backfill only Auth users that do not have a profile yet.
insert into public.user_profile (
  id,
  display_name,
  recommended_palette,
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
  array[]::text[],
  false
from auth.users as users
left join public.user_profile as profiles on profiles.id = users.id
where profiles.id is null;

-- 6. Wardrobe image bucket and policies ------------------------------------
-- Expected object path: <auth-user-id>/<item-id>.webp

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
  array['image/webp','image/jpeg','image/png']
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
on storage.objects for select to authenticated
using (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users upload own wardrobe images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users update own wardrobe images"
on storage.objects for update to authenticated
using (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users delete own wardrobe images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Complete authenticated account deletion -------------------------------
-- The frontend deletes Storage objects first, then invokes this RPC.

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

select
  true as ready,
  'ClosetIQ Supabase setup completed successfully with personal colour profiles' as message;
