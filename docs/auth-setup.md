# ClosetIQ authentication setup

## 1. Database layout

ClosetIQ uses normal shared PostgreSQL tables:

- `public.user_profile`
- `public.wardrobe_items`
- `public.outfits`
- `public.outfit_history`

Rows are stored directly in those tables. There is no table path such as `wardrobe_items/<user-id>`.

User isolation is provided by the `user_id` column together with row-level security. For example, every wardrobe item remains a direct row in `public.wardrobe_items`, and authenticated users can only read or modify rows where:

```sql
user_id = auth.uid()
```

The only `<user-id>/...` path mentioned in this setup refers to object names inside the separate Supabase Storage bucket used for image files. It does not refer to database tables.

## 2. Choose the correct SQL file

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

## 3. Running the SQL

1. Open **Supabase Dashboard → SQL Editor**.
2. Choose **New query**.
3. Copy the complete contents of the correct SQL file.
4. Run it.
5. Review the final verification result.

## 4. Enable email/password authentication

In Supabase Dashboard:

1. Open **Authentication → Providers → Email**.
2. Enable Email provider.
3. Choose whether email confirmation is required.
4. Under **Authentication → URL Configuration**, add production, Vercel preview, localhost, and reset-password URLs.

Recommended local redirects:

- `http://localhost:3000/**`
- `http://localhost:3000/reset-password`

## 5. Enable Google OAuth

In Google Cloud Console:

1. Configure the OAuth consent screen.
2. Create an OAuth 2.0 Web client.
3. Add the Supabase callback shown under **Supabase → Authentication → Providers → Google** as an authorized redirect URI.

The callback normally looks like:

`https://<project-ref>.supabase.co/auth/v1/callback`

Enable Google in Supabase and paste the Google Client ID and Client Secret there. Do not expose the Client Secret in frontend or Vercel environment variables.

## 6. New-user onboarding

New email/password and Google users receive an incomplete profile containing only their display name. Before accessing the app, they must provide:

- skin colour
- eye colour
- hair colour
- at least one style preference

The app then sets `onboarding_completed = true`.

## 7. Account deletion

Database deletion works directly against the shared tables using the authenticated UUID:

```sql
delete from public.wardrobe_items where user_id = auth.uid();
```

The protected `/delete-account` page requires the user to type `DELETE`.

Deletion order:

1. Remove the user's image objects from the separate `wardrobe-images` Storage bucket.
2. Call `public.delete_my_account()` with no user ID argument.
3. The function uses `auth.uid()` and deletes matching rows directly from `outfit_history`, `outfits`, `wardrobe_items`, and `user_profile`.
4. It deletes the Auth account in the same transaction.
5. The browser session is cleared and the user returns to `/login`.

If Storage deletion fails, database and Auth deletion do not start.

## 8. Vercel environment variables

Configure these for Preview and Production:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`

## 9. Existing data ownership

The `user_id` column visible in the existing tables must match an actual UUID in **Supabase Authentication → Users**.

After running `supabase/upgrade-existing.sql`, check `orphaned_user_rows`:

- `0`: current rows are linked to Auth users.
- Greater than `0`: some rows use an old or shared UUID. Reassign those rows to the intended Auth user before relying on RLS.

## 10. Verification checklist

1. Run the correct SQL file.
2. Confirm existing wardrobe rows remain directly in `public.wardrobe_items`.
3. Confirm `orphaned_user_rows = 0` for an existing database.
4. Create a new email account and confirm onboarding appears.
5. Complete onboarding and confirm the profile values persist.
6. Sign out and test password recovery.
7. Sign in with Google and confirm onboarding appears.
8. Create two users and confirm they cannot see each other's table rows.
9. Upload an image and verify it appears in the Storage bucket, separately from the database row.
10. Delete a disposable account containing items, outfits, history, and images.
11. Confirm its Storage objects, public-table rows, and Auth user are all gone.
