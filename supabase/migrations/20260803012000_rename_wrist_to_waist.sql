-- Correct the optional body measurement from wrist circumference to waist circumference.
-- Preserves any value already stored in wrist_inches.

begin;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_profile'
      and column_name = 'wrist_inches'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_profile'
      and column_name = 'waist_inches'
  ) then
    alter table public.user_profile rename column wrist_inches to waist_inches;
  elsif not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_profile'
      and column_name = 'waist_inches'
  ) then
    alter table public.user_profile add column waist_inches numeric(5,2);
  end if;
end;
$$;

alter table public.user_profile
  drop constraint if exists user_profile_wrist_inches_check,
  drop constraint if exists user_profile_waist_inches_check;

alter table public.user_profile
  add constraint user_profile_waist_inches_check
  check (waist_inches is null or waist_inches between 18 and 80);

comment on column public.user_profile.waist_inches is
  'Optional waist circumference in inches.';

commit;
