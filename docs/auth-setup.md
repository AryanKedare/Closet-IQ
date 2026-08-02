# ClosetIQ authentication setup

## 1. Apply the database migration

Run the Supabase migrations for the project, including:

`supabase/migrations/20260802193000_add_auth_and_rls.sql`

This enables row-level security, creates per-user policies, provisions a default profile for new users, and scopes wardrobe images to a user-specific folder.

## 2. Enable email/password authentication

In Supabase Dashboard:

1. Open **Authentication → Providers → Email**.
2. Enable Email provider.
3. Choose whether email confirmation is required.
4. Under **Authentication → URL Configuration**, set:
   - Site URL: your production Vercel URL
   - Redirect URLs: production URL, localhost URL, and Vercel preview URL pattern

Recommended local redirect:

`http://localhost:3000/**`

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

## 4. Vercel environment variables

Keep these configured for Production and Preview:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`

The Supabase publishable/anon key is intended for browser use. Data protection comes from the RLS policies in the migration.

## 5. Existing development data

The old application used the shared UUID:

`00000000-0000-0000-0000-000000000001`

New accounts will not see that data because all queries now use the authenticated Supabase user ID. Migrate old rows to a real auth user manually only when that ownership is known.

## 6. Verification checklist

1. Create account A and add one wardrobe item.
2. Sign out.
3. Create account B and confirm account A's item is not visible.
4. Sign in with Google and confirm a profile is created.
5. Upload an image and confirm its storage path starts with the authenticated user ID.
6. Open a protected URL while signed out and confirm it redirects to `/login`.
