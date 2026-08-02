# ClosetIQ authentication setup

## 1. Apply the database migrations

Run both authentication migrations in order:

- `supabase/migrations/20260802193000_add_auth_and_rls.sql`
- `supabase/migrations/20260802213000_add_profile_onboarding.sql`

They enable row-level security, create account-scoped policies, provision profiles, require new users to complete onboarding, and scope wardrobe images to a user-specific folder.

## 2. Enable email/password authentication

In Supabase Dashboard:

1. Open **Authentication → Providers → Email**.
2. Enable Email provider.
3. Choose whether email confirmation is required.
4. Under **Authentication → URL Configuration**, set:
   - Site URL: your production Vercel URL
   - Redirect URLs: production URL, localhost URL, Vercel preview URL pattern, and `/reset-password` paths

Recommended local redirects:

- `http://localhost:3000/**`
- `http://localhost:3000/reset-password`

The application sends password recovery emails with this callback:

`<site-origin>/reset-password`

## 3. Enable Google OAuth

In Google Cloud Console:

1. Create or select a project.
2. Configure the OAuth consent screen.
3. Create an OAuth 2.0 Client ID for a Web application.
4. Add the Supabase callback URL shown in **Supabase → Authentication → Providers → Google** as an authorized redirect URI.

It normally has this shape:

`https://<project-ref>.supabase.co/auth/v1/callback`

In Supabase Dashboard:

1. Open **Authentication → Providers → Google**.
2. Enable Google.
3. Paste the Google Client ID and Client Secret.
4. Save.

Do not put the Google Client Secret in Vercel or frontend environment variables.

## 4. New-user onboarding

New email/password and Google users receive an incomplete profile containing only their display name. Before accessing the application, they must provide:

- skin colour
- eye colour
- hair colour
- at least one style preference

The application stores those values and sets `onboarding_completed = true`. Existing profiles are marked complete when the onboarding migration runs, so current users are not forced to repeat setup.

## 5. Vercel environment variables

Keep these configured for Production and Preview:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`

The Supabase publishable/anon key is intended for browser use. Data protection comes from the RLS policies in the migration.

## 6. Existing development data

The old application used the shared UUID:

`00000000-0000-0000-0000-000000000001`

New accounts will not see that data because all queries now use the authenticated Supabase user ID. Migrate old rows to a real auth user manually only when that ownership is known.

## 7. Verification checklist

1. Create a new account and confirm onboarding appears before the dashboard.
2. Confirm setup cannot finish without at least one style preference.
3. Complete onboarding and confirm the chosen colours appear on the profile page.
4. Sign out and use **Forgot password?** to request a reset link.
5. Open the reset link and confirm a new password can be saved.
6. Create account B and confirm account A's wardrobe is not visible.
7. Sign in with Google and confirm onboarding is required.
8. Upload an image and confirm its storage path starts with the authenticated user ID.
9. Open a protected URL while signed out and confirm it redirects to `/login`.
