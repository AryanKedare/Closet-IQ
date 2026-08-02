# ClosetIQ

ClosetIQ is a multi-user smart wardrobe application that stores a personal closet, generates compatible outfit combinations, tracks wear history, and provides AI-assisted styling explanations and chat.

The current application uses **Supabase for authentication, PostgreSQL data, and image storage**, a deterministic client-side outfit scoring engine for outfit generation, and **Groq** for streaming AI responses.

## Features

- Email/password sign-up and sign-in
- Google OAuth through Supabase Auth
- Password recovery and password reset
- Required first-login onboarding for skin, eye, and hair colours plus style preferences
- Per-user wardrobe management with camera capture or gallery upload
- Client-side WebP image compression before upload
- Deterministic outfit generation and compatibility scoring
- AI outfit explanations streamed from Groq
- AI stylist chat with the signed-in user's wardrobe as context
- Saved, favourite, named, and worn outfits
- Wear calendar, history, ratings, and wardrobe-use counts
- Daily outfit recommendation adjusted for current Dublin weather
- Packing-list builder
- Capsule wardrobe gap analysis
- Curated 2026 trend matching
- Light and dark themes
- Permanent account deletion, including database rows, image objects, and the Supabase Auth user

## Current architecture

| Area | Implementation |
|---|---|
| Application framework | React 19 with TanStack Start and TanStack Router |
| Build tooling | Vite 7 and TypeScript |
| Styling | Tailwind CSS 4 and Radix UI primitives |
| Client state | Zustand |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Image storage | Supabase Storage |
| Outfit generation | Local deterministic TypeScript scoring engine |
| AI | Groq Chat Completions API with SSE streaming |
| Deployment | Vercel SSR configuration |
| Tests | Node's built-in test runner |

> Appwrite is not required by the current runtime. Wardrobe records and image uploads now use Supabase. The Appwrite package may still appear as a legacy dependency until it is removed separately.

## Data model

ClosetIQ stores rows directly in shared PostgreSQL tables:

- `public.user_profile`
- `public.wardrobe_items`
- `public.outfits`
- `public.outfit_history`

There is no database path such as `wardrobe_items/<user-id>`. Every wardrobe item is a normal row in `public.wardrobe_items`.

User separation is enforced through the `user_id` column and Supabase Row Level Security:

```sql
user_id = auth.uid()
```

The profile table uses the authenticated UUID as its primary key:

```sql
user_profile.id = auth.uid()
```

Only image object names use a user-prefixed path inside the separate `wardrobe-images` Storage bucket:

```text
<auth-user-id>/<wardrobe-item-id>.webp
```

The database row itself still remains directly in `public.wardrobe_items`, with the public image URL stored in `image_url`.

## Prerequisites

- Node.js 22 is recommended
- npm, or another package manager compatible with `package.json`
- A Supabase project
- A Groq API key
- A Google Cloud OAuth client only when Google sign-in is enabled

## Supabase setup

### New Supabase project

For a fresh project, use the one-shot script:

```text
supabase/setup.sql
```

1. Open **Supabase Dashboard → SQL Editor → New query**.
2. Paste the complete contents of `supabase/setup.sql`.
3. Run the query.
4. Confirm that it finishes with:

```text
ready = true
```

The script creates the tables, indexes, constraints, RLS policies, `wardrobe-images` bucket, Storage policies, new-user profile trigger, onboarding support, and the authenticated `delete_my_account()` function.

### Existing ClosetIQ database

When the four public tables already exist, do not recreate them manually. Apply the migrations in order:

```text
supabase/migrations/20260802193000_add_auth_and_rls.sql
supabase/migrations/20260802213000_add_profile_onboarding.sql
supabase/migrations/20260802214500_add_account_deletion.sql
```

Create a database backup before changing a production project. Existing `user_id` values must match real UUIDs under **Supabase Authentication → Users**, otherwise those rows will be hidden by RLS.

## Authentication configuration

### Email/password

In **Supabase Dashboard → Authentication → Providers → Email**:

1. Enable the Email provider.
2. Decide whether email confirmation is required.
3. Configure the Site URL and allowed Redirect URLs.

The application uses these public authentication routes:

- `/login`
- `/reset-password`
- `/onboarding`

Password-reset emails return to:

```text
https://your-domain.example/reset-password
```

Add the equivalent production, Vercel preview, and local development URLs to Supabase's redirect allowlist.

### Google OAuth

1. Configure an OAuth consent screen in Google Cloud.
2. Create an OAuth 2.0 Web application client.
3. In Supabase, open **Authentication → Providers → Google**.
4. Copy the Supabase callback URL into Google's authorized redirect URIs.
5. Add the Google Client ID and Client Secret to Supabase.

The callback normally resembles:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

The Google Client Secret belongs in Supabase, not in frontend or Vercel `VITE_` variables.

## Environment variables

Copy the example file:

```bash
cp .env.example .env
```

The application runtime requires:

```env
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_supabase_publishable_or_anon_key"
GROQ_API_KEY="your_groq_api_key"
```

`VITE_SUPABASE_ANON_KEY` is also accepted as a client-key fallback by the Supabase client.

`GROQ_API_KEY` is server-side only. Never prefix it with `VITE_`.

The optional seed script additionally reads:

```env
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
SEED_USER_ID="an_existing_supabase_auth_user_uuid"
SUPABASE_BUCKET_ID="wardrobe-images"
```

The service-role key is only needed for trusted administrative tools such as the seed script. The browser application does not require it.

## Local development

```bash
git clone https://github.com/AryanKedare/Closet-IQ.git
cd Closet-IQ
npm install
cp .env.example .env
npm run dev
```

Open the local URL printed by Vite.

Useful commands:

```bash
npm run dev       # development server
npm run build     # production build
npm run preview   # preview the production build
npm test          # Node test suite
npm run lint      # ESLint
npm run format    # Prettier
```

## Optional sample data

The repository includes `seed-wardrobe.mjs`, which inserts sample items directly into `public.wardrobe_items` for one existing Supabase Auth user.

1. Create or sign up a test user.
2. Copy that user's UUID from **Supabase Authentication → Users**.
3. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SEED_USER_ID` in `.env`.
4. Run:

```bash
node seed-wardrobe.mjs
```

The script refuses to seed when that user already has wardrobe rows. Optional seed images are uploaded to the Storage bucket under the user's UUID.

## Application routes

### Public routes

| Route | Purpose |
|---|---|
| `/login` | Email/password sign-in, sign-up, and Google OAuth |
| `/reset-password` | Request a reset email or set a new password from a recovery session |
| `/onboarding` | Required colour-profile and style-preference setup |

### Protected routes

| Route | Purpose |
|---|---|
| `/` | Dashboard |
| `/closet` | Add, edit, store, and remove wardrobe items |
| `/outfits` | Generate and browse outfit combinations |
| `/outfits/$outfitId` | Outfit details and explanation |
| `/today` | Weather-adjusted daily outfit pick |
| `/chat` | Streaming AI stylist chat |
| `/calendar` | Wear history calendar and ratings |
| `/pack` | Minimal packing list from selected occasions |
| `/gaps` | Capsule gaps and combination-unlock recommendations |
| `/trends` | Static curated 2026 trend matching |
| `/profile` | Colour profile and style preferences |
| `/delete-account` | Permanent account deletion |

The root route restores the Supabase session, redirects signed-out users to `/login`, and redirects users with incomplete profiles to `/onboarding`.

## Outfit generation

Outfit generation does not call an LLM. `src/lib/outfitGenerator.ts` evaluates combinations locally using rules for:

- colour-family harmony
- hue and lightness relationships
- skin-profile affinity
- pattern clashes
- shoe formality
- top/bottom formality
- layering compatibility
- occasion tags
- selected style coherence

Scores are composed from colour, skin, pattern, shoe, and style components. Invalid combinations are blocked before scoring. Generated outfits are then written to `public.outfits` for the active user.

## AI routes

Both AI endpoints run on the server and stream Groq's SSE response to the browser.

| Route | Method | Purpose |
|---|---|---|
| `/api/chat` | `POST` | Wardrobe-aware stylist conversation |
| `/api/explain` | `POST` | Two-sentence explanation of an outfit's colour and styling logic |

The current Groq model configured in both routes is:

```text
llama-3.3-70b-versatile
```

The routes sanitize and limit incoming text before sending it to Groq. They return JSON errors for invalid input, missing configuration, or upstream failures.

## Image handling

When a user selects or captures an image:

1. The browser loads it into a canvas.
2. The longest side is limited to 800 pixels.
3. The image is encoded as WebP at 0.85 quality.
4. It is uploaded to the `wardrobe-images` Supabase Storage bucket.
5. The resulting public URL is written to the item's `image_url` column.

Storage policies restrict upload, update, list, and delete operations to the signed-in user's object prefix.

## Account deletion

The delete-account flow requires the user to type `DELETE` exactly.

Deletion proceeds in this order:

1. List and remove the signed-in user's image objects from Supabase Storage.
2. Call `public.delete_my_account()` without accepting a user ID from the browser.
3. The function resolves the caller with `auth.uid()`.
4. Delete matching rows from `outfit_history`, `outfits`, `wardrobe_items`, and `user_profile`.
5. Delete the Supabase Auth user in the same database transaction.
6. Clear the local session and return to `/login`.

If Storage deletion fails, database and Auth deletion are not started.

## Testing

The current automated test covers the successful outfit-explanation flow. It verifies that the client:

1. sends exactly one `POST` request to `/api/explain`;
2. parses a successful SSE response;
3. saves the explanation;
4. navigates only after saving succeeds.

Run it with:

```bash
npm test
```

## Deployment to Vercel

The repository includes `vercel.json` for TanStack Start SSR deployment.

1. Import the repository into Vercel.
2. Add these variables to Preview and Production:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
GROQ_API_KEY
```

3. Add the production and preview URLs to Supabase Authentication's allowed Redirect URLs.
4. Ensure `/reset-password` is allowed for each environment.
5. Deploy.

The Vercel configuration serves static files from `dist/client` and routes remaining requests through the SSR function.

## Project structure

```text
Closet-IQ/
├── src/
│   ├── components/                 reusable application UI
│   ├── integrations/supabase/      Supabase browser client and generated types
│   ├── lib/
│   │   ├── auth.tsx                session provider
│   │   ├── store.ts                Zustand state and Supabase mutations
│   │   ├── outfitGenerator.ts      local outfit rules and scoring
│   │   ├── groqExplainer.ts        browser SSE client
│   │   ├── imageUpload.ts          compression and Storage upload
│   │   └── deleteAccount.ts        complete account-deletion client
│   └── routes/
│       ├── __root.tsx              auth and onboarding route guard
│       ├── login.tsx               sign-in and sign-up
│       ├── reset-password.tsx      password recovery
│       ├── onboarding.tsx          required profile setup
│       ├── closet.tsx              wardrobe management
│       ├── outfits.tsx             outfit generation and browser
│       ├── outfits.$outfitId.tsx   outfit details
│       ├── chat.tsx                stylist UI
│       ├── today.tsx               weather-adjusted recommendation
│       ├── calendar.tsx            wear history
│       ├── pack.tsx                packing assistant
│       ├── gaps.tsx                wardrobe gap advisor
│       ├── trends.tsx              trend matching
│       ├── profile.tsx             profile editor
│       ├── delete-account.tsx      destructive account settings
│       ├── api.chat.tsx            Groq chat endpoint
│       └── api.explain.tsx         Groq explanation endpoint
├── supabase/
│   ├── setup.sql                   complete fresh-project setup
│   └── migrations/                 incremental database changes
├── tests/                           Node tests
├── seed-wardrobe.mjs               optional sample-data utility
├── .env.example                    environment template
├── vercel.json                     Vercel SSR routing
└── vite.config.ts                  TanStack Start, React, Tailwind, and chunking
```

## Current limitations

- The Today page currently fetches weather for **Dublin, Ireland** rather than the user's location.
- Trend data is a static curated 2026 list, not a live fashion feed.
- Some gap-advisor copy and recommendations are currently tuned toward a warm-medium colour profile.
- The automated test suite currently focuses on the outfit-explanation success path rather than full end-to-end coverage.
- The `appwrite` dependency remains in `package.json` even though current runtime code uses Supabase Storage.

## Security notes

- RLS restricts each table to the current Supabase Auth UUID.
- The browser receives only the Supabase publishable/anon key.
- `GROQ_API_KEY` must remain server-side.
- The service-role key should only be used by trusted local or administrative scripts.
- The account-deletion RPC does not accept a browser-supplied user ID.
- Do not commit `.env` or production credentials.

## Contributing

1. Create a branch from `main`.
2. Make focused changes.
3. Run the relevant checks:

```bash
npm test
npm run lint
npm run build
```

4. Open a pull request describing the change and its validation.

## License

No license file is currently included in this repository. Add a `LICENSE` file before treating the project as licensed for redistribution or commercial reuse.
