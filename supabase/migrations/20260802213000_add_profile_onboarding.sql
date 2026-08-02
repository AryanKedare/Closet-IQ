-- Require newly created users to provide their own colour profile and style preferences.

alter table public.user_profile
  add column if not exists onboarding_completed boolean;

-- Profiles that existed before onboarding was introduced keep their current setup.
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

-- New email/password and OAuth users start with an incomplete, unset profile.
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
    style_preferences,
    onboarding_completed
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1),
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

drop trigger if exists on_auth_user_created_closetiq on auth.users;
create trigger on_auth_user_created_closetiq
after insert on auth.users
for each row execute procedure public.handle_new_closetiq_user();

-- Create incomplete profiles for auth users that do not yet have one.
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
    users.raw_user_meta_data ->> 'display_name',
    users.raw_user_meta_data ->> 'full_name',
    split_part(users.email, '@', 1),
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
