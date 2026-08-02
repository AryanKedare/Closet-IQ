-- Personal-colour onboarding and optional fit details.

alter table public.user_profile
  add column if not exists skin_tone text,
  add column if not exists skin_undertone text,
  add column if not exists hair_color text,
  add column if not exists eye_color text,
  add column if not exists contrast_level text,
  add column if not exists recommended_palette text[] not null default array[]::text[],
  add column if not exists body_type text,
  add column if not exists body_proportions text,
  add column if not exists shirt_size text,
  add column if not exists wrist_inches numeric(5,2),
  add column if not exists shoe_size_inches numeric(5,2);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_profile_skin_tone_check') then
    alter table public.user_profile add constraint user_profile_skin_tone_check
      check (skin_tone is null or skin_tone in ('very-fair','fair','medium','tan','deep-dark'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_profile_skin_undertone_check') then
    alter table public.user_profile add constraint user_profile_skin_undertone_check
      check (skin_undertone is null or skin_undertone in ('warm','cool','neutral','not-sure'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_profile_hair_color_check') then
    alter table public.user_profile add constraint user_profile_hair_color_check
      check (hair_color is null or hair_color in ('black','dark-brown','light-medium-brown','blonde','red-auburn','gray-white'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_profile_eye_color_check') then
    alter table public.user_profile add constraint user_profile_eye_color_check
      check (eye_color is null or eye_color in ('dark-brown','light-brown-amber','hazel','green','blue','gray'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_profile_contrast_level_check') then
    alter table public.user_profile add constraint user_profile_contrast_level_check
      check (contrast_level is null or contrast_level in ('high','medium','low'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_profile_wrist_inches_check') then
    alter table public.user_profile add constraint user_profile_wrist_inches_check
      check (wrist_inches is null or wrist_inches between 3 and 15);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_profile_shoe_size_inches_check') then
    alter table public.user_profile add constraint user_profile_shoe_size_inches_check
      check (shoe_size_inches is null or shoe_size_inches between 5 and 18);
  end if;
end;
$$;

comment on column public.user_profile.recommended_palette is
  'Ordered #RRGGBB palette generated from skin tone, undertone, hair, eyes, and contrast.';
