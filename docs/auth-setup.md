# ClosetIQ authentication setup

## 1. Fresh Supabase project

For a brand-new Supabase project, run one file:

`supabase/setup.sql`

Steps:

1. Open **Supabase Dashboard → SQL Editor**.
2. Choose **New query**.
3. Copy the complete contents of `supabase/setup.sql`.
4. Run the query.
5. Confirm the final result says `ready = true`.

The script creates:

- `user_profile`
- `wardrobe_items`
- `outfits`
- `outfit_history`
- indexes and foreign keys
- row-level security policies
- the `wardrobe-images` bucket
- per-user storage policies
- automatic profile creation for new Auth users
- required onboarding support
- the secure `delete_my_account()` function

The script can be run again without deleting existing tables or user data.

## 2. Existing ClosetIQ installation

Do not replace an existing production database with the fresh-project script. Apply the incremental migrations in order:

- `supabase/migrations/20260802193000_add_auth_and_rls.sql`
- `supabase/migrations/20260802213000_add_profile_onboarding.sql`
- `supabase/migrations/20260802214500_add_account_deletion.sql`

## 3. Enable email/password authentication

In Supabase Dashboard:

1. Open **Authentication → Providers → Email**.
2. Enable Email provider.
3. Choose whether email confirmation is required.
4. Under **Authentication → URL Configuration**, set:
   - Site URL: your production URL
   - Redirect URLs: production, Vercel preview, localhost, and reset-password URLs

Recommended local redirects:

- `http://localhost:3000/**`
- `http://localhost:3000/reset-password`

The application sends password recovery emails to:

`<site-origin>/reset-password`

## 4. Enable Google OAuth

In Google Cloud Console:

1. Configure the OAuth consent screen.
2. Create an OAuth 2.0 Web client.
3. Add the Supabase callback shown under **Supabase → Authentication → Providers → Google** as an authorized redirect URI.

The callback normally looks like:

`https://<project-ref>.supabase.co/auth/v1/callback`

Then enable Google in Supabase and paste the Google Client ID and Client Secret there.

Do not expose the Google Client Secret in frontend or Vercel environment variables.

## 5. New-user onboarding

New email/password and Google users receive an incomplete profile containing only their display name. Before accessing the app, they must provide:

- skin colour
- eye colour
- hair colour
- at least one style preference

The app stores these values and sets `onboarding_completed = true`.

## 6. Account deletion

The protected `/delete-account` page requires the user to type `DELETE`.

Deletion order:

1. Remove every object under `wardrobe-images/<authenticated-user-id>/`.
2. Call `public.delete_my_account()` with no user ID argument.
3. The function uses `auth.uid()` and deletes outfit history, outfits, wardrobe items, the profile, and the Auth account in one transaction.
4. Clear the browser session and return to `/login`.

If Storage deletion fails, database and Auth deletion do not start.

## 7. Vercel environment variables

Configure these for Preview and Production:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`

The Supabase browser key is protected by row-level security.

## 8. Existing development data

The earlier app used this shared UUID:

`00000000-0000-0000-0000-000000000001`

New accounts will not see those rows. Only migrate old rows when the correct account owner is known.

## 9. Verification checklist

1. Run `supabase/setup.sql` in a disposable Supabase project.
2. Create a new email account and confirm onboarding appears.
3. Complete onboarding and confirm the profile values persist.
4. Sign out and test password recovery.
5. Sign in with Google and confirm onboarding appears.
6. Create two users and confirm they cannot see each other's data.
7. Upload an image and confirm its path begins with the Auth user ID.
8. Delete a disposable account containing items, outfits, history, and images.
9. Confirm its Storage folder, public-table rows, and Auth user are all gone.
