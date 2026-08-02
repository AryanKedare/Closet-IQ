# ClosetIQ authentication setup

## 1. Choose the correct SQL file

### Brand-new Supabase project

Run:

`supabase/setup.sql`

This creates the complete ClosetIQ schema from scratch.

### Existing ClosetIQ database

If Supabase Table Editor already contains these tables:

- `public.user_profile`
- `public.wardrobe_items`
- `public.outfits`
- `public.outfit_history`

run:

`supabase/upgrade-existing.sql`

This preserves current rows while adding authentication, onboarding, RLS, Storage policies, account deletion, missing columns, and indexes.

Before running it in production, create a Supabase database backup.

The final result includes:

- current row counts
- `orphaned_user_rows`
- `upgrade_completed`

`orphaned_user_rows` should be `0`. A non-zero value means some existing `user_id` values do not match an account in `auth.users` and must be reassigned before those rows will be visible through authenticated RLS queries.

Do not run both files on the same new project. Choose the file that matches the database state.

## 2. Running the SQL

1. Open **Supabase Dashboard → SQL Editor**.
2. Choose **New query**.
3. Copy the complete contents of the correct SQL file.
4. Run it.
5. Review the final verification result.

## 3. Enable email/password authentication

In Supabase Dashboard:

1. Open **Authentication → Providers → Email**.
2. Enable Email provider.
3. Choose whether email confirmation is required.
4. Under **Authentication → URL Configuration**, add production, Vercel preview, localhost, and reset-password URLs.

Recommended local redirects:

- `http://localhost:3000/**`
- `http://localhost:3000/reset-password`

## 4. Enable Google OAuth

In Google Cloud Console:

1. Configure the OAuth consent screen.
2. Create an OAuth 2.0 Web client.
3. Add the Supabase callback shown under **Supabase → Authentication → Providers → Google** as an authorized redirect URI.

The callback normally looks like:

`https://<project-ref>.supabase.co/auth/v1/callback`

Enable Google in Supabase and paste the Google Client ID and Client Secret there. Do not expose the Client Secret in frontend or Vercel environment variables.

## 5. New-user onboarding

New email/password and Google users receive an incomplete profile containing only their display name. Before accessing the app, they must provide:

- skin colour
- eye colour
- hair colour
- at least one style preference

The app then sets `onboarding_completed = true`.

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

## 8. Existing data ownership

The `user_id` column visible in the existing tables must match an actual UUID in **Supabase Authentication → Users**.

After running `supabase/upgrade-existing.sql`, check `orphaned_user_rows`:

- `0`: current rows are linked to Auth users.
- Greater than `0`: some rows use an old or shared UUID. Reassign those rows to the intended Auth user before relying on RLS.

## 9. Verification checklist

1. Run the correct SQL file.
2. Confirm `orphaned_user_rows = 0` for an existing database.
3. Create a new email account and confirm onboarding appears.
4. Complete onboarding and confirm the profile values persist.
5. Sign out and test password recovery.
6. Sign in with Google and confirm onboarding appears.
7. Create two users and confirm they cannot see each other's data.
8. Upload an image and confirm its path begins with the Auth user ID.
9. Delete a disposable account containing items, outfits, history, and images.
10. Confirm its Storage folder, public-table rows, and Auth user are all gone.
