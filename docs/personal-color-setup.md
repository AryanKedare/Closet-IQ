# Personal colour onboarding setup

Apply this migration after the existing ClosetIQ authentication and onboarding migrations:

```text
supabase/migrations/20260803004500_add_personal_color_profile.sql
```

It adds these fields to `public.user_profile` without deleting existing rows:

- `skin_tone`
- `skin_undertone`
- `hair_color`
- `eye_color`
- `contrast_level`
- `recommended_palette`
- `body_type`
- `body_proportions`
- `shirt_size`
- `wrist_inches`
- `shoe_size_inches`

The first five categorical answers are required by the onboarding UI. Body and sizing fields are optional.

`recommended_palette` stores the ordered list of generated `#RRGGBB` colours. The browser recalculates it whenever the five personal-colour answers change and persists it when onboarding or Profile is saved.

Existing users remain signed in and keep their current data. They can complete or update the new fields from the Personal colour analysis section on `/profile`.

## Verification

1. Create a new Auth user and confirm six sequential onboarding screens appear.
2. Confirm the first five questions cannot be skipped.
3. Confirm the sixth fit-details screen can be completed with every field blank.
4. Navigate away during onboarding, return, and confirm the draft and current step are restored.
5. Complete onboarding and confirm all categorical fields plus `recommended_palette` are stored in `public.user_profile`.
6. Change undertone or contrast on `/profile` and confirm the palette changes immediately.
7. Save Profile and confirm AI outfit generation receives the palette and optional body details.
