# Closet IQ 👗🧠

An AI-powered smart wardrobe app that helps you manage your clothing, build outfits, and get intelligent outfit suggestions — powered by Groq AI, Supabase, and Appwrite.

---

## ✨ Features

- **Wardrobe Management** — Add, categorize, and organize clothing items with photos (camera capture or gallery upload)
- **AI Outfit Suggestions** — Smart outfit recommendations with explanations powered by Groq LLM (`llama-3.3-70b-versatile`)
- **AI Stylist Chat** — Conversational stylist that knows your entire wardrobe
- **Outfit Builder** — Compose and save outfit combinations from your wardrobe
- **Outfit History & Calendar** — Track when you wore what
- **Wardrobe Gap Analysis** — See what's missing from your wardrobe
- **Packing Assistant** — Build packing lists from your wardrobe
- **Authentication** — Secure user auth via Supabase Auth
- **Camera Capture** — Take photos directly in-app on mobile (no gallery step)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TanStack Start, TanStack Router |
| Styling | Tailwind CSS v4, shadcn/ui (Radix UI) |
| Auth + DB | Supabase (PostgreSQL + Auth + Storage) |
| File Storage | Appwrite Storage (wardrobe item images) |
| AI | Groq API — `llama-3.3-70b-versatile` |
| Deployment | Vercel |
| Build Tool | Vite + Bun |

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) ≥ 20 **or** [Bun](https://bun.sh/) ≥ 1.1
- A [Supabase](https://supabase.com/) account (free tier works)
- An [Appwrite](https://appwrite.io/) account (free tier works)
- A [Groq](https://console.groq.com/) API key (free tier available)

---

## 🔧 1 — Supabase Setup

### 1.1 Create a project

1. Go to [supabase.com](https://supabase.com/) → **New project**
2. Choose a name, password, and region → **Create new project**
3. Wait ~2 minutes for provisioning

### 1.2 Run the database migrations

The full schema lives in `supabase/migrations/`. Run both migration files in order via the **SQL Editor** in your Supabase dashboard:

**Tables created:**

| Table | Purpose |
|---|---|
| `user_profile` | Display name, skin/eye/hair tone hex values, style preferences |
| `wardrobe_items` | All clothing items with category, color, tags, image URL |
| `outfits` | Saved outfit combinations (top + bottom + shoes + optional jacket) |
| `outfit_history` | Log of when outfits were worn |

To run migrations:
1. Supabase Dashboard → **SQL Editor** → **New query**
2. Paste the contents of `supabase/migrations/20260424135200_*.sql` → **Run**
3. Paste the contents of `supabase/migrations/20260424_features.sql` → **Run**

> Alternatively, if you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed:
> ```bash
> supabase link --project-ref <your-project-ref>
> supabase db push
> ```

### 1.3 Create a Storage bucket

The migration already includes SQL to create the `wardrobe-images` bucket. If you need to create it manually:

1. Supabase Dashboard → **Storage** → **New bucket**
2. Name: `wardrobe-images`
3. ✅ Public bucket → **Create bucket**

### 1.4 Collect your credentials

Go to **Settings → API** in your Supabase dashboard:

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | **Project URL** |
| `SUPABASE_ANON_KEY` | **anon / public** key |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** key (keep secret — server only) |

---

## 🔧 2 — Appwrite Setup

Appwrite is used for wardrobe item image storage.

### 2.1 Create a project

1. Go to [cloud.appwrite.io](https://cloud.appwrite.io/) → **Create project**
2. Give it a name (e.g., `closet-iq`) → **Create**
3. Note your **Project ID** from the project settings page

### 2.2 Create a database

1. **Databases** → **Create database** → Name it `closet-iq-db`
2. Note the **Database ID**
3. Inside the database, create a collection named `wardrobe_items` — note the **Collection ID** (the app uses Supabase for structured data; this collection can be left empty)

### 2.3 Create a storage bucket

1. **Storage** → **Create bucket**
2. Name: `wardrobe-images` → note the **Bucket ID**
3. Under **Permissions**, add role `Any` with **Create**, **Read**, **Update**, **Delete** permissions (or scope to authenticated users for tighter security)

### 2.4 Add your platform

1. **Overview** → **Add platform** → **Web**
2. **Name**: `closet-iq`
3. **Hostname**: `localhost` for local dev; add your Vercel domain for production

### 2.5 Collect your credentials

| Variable | Where to find it |
|---|---|
| `VITE_APPWRITE_PROJECT_ID` | Project Settings → **Project ID** |
| `VITE_APPWRITE_DATABASE_ID` | Databases → your database → **Database ID** |
| `VITE_APPWRITE_BUCKET_ID` | Storage → your bucket → **Bucket ID** |

---

## 🔧 3 — Groq API Key

1. Go to [console.groq.com](https://console.groq.com/) → **API Keys** → **Create API Key**
2. Copy the key — you won't be able to see it again

| Variable | Value |
|---|---|
| `GROQ_API_KEY` | Your Groq API key |

> ⚠️ This key is **server-side only** — never prefix it with `VITE_`. It is read via `process.env` in the `/api/chat` and `/api/explain` server routes and is never sent to the browser.

---

## 💻 4 — Local Development

### 4.1 Clone & install

```bash
git clone https://github.com/AryanKedare/Closet-IQ.git
cd Closet-IQ
bun install        # or: npm install
```

### 4.2 Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials from the steps above:

```env
# ── Appwrite ──────────────────────────────────────────────────────────────────
VITE_APPWRITE_PROJECT_ID="your_appwrite_project_id"
VITE_APPWRITE_DATABASE_ID="your_appwrite_database_id"
VITE_APPWRITE_BUCKET_ID="your_appwrite_bucket_id"

# ── Supabase ──────────────────────────────────────────────────────────────────
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"   # server-side only
SUPABASE_PUBLISHABLE_KEY="your_supabase_anon_key"            # same as ANON_KEY

# Vite-exposed Supabase (client-side)
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_supabase_anon_key"

# ── AI ────────────────────────────────────────────────────────────────────────
GROQ_API_KEY="your_groq_api_key"                             # server-side only

# ── Seed script (optional) ────────────────────────────────────────────────────
SEED_USER_ID="your-supabase-auth-user-uuid"
SUPABASE_BUCKET_ID="wardrobe-images"
```

> `.env` is git-ignored. Never commit real credentials.

### 4.3 Start the dev server

```bash
bun run dev        # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4.4 (Optional) Seed sample wardrobe data

To pre-populate your wardrobe with sample items without uploading real photos:

1. Set `SEED_USER_ID` in `.env` to your Supabase auth user UUID
   - Find it at: Supabase Dashboard → **Authentication → Users** → copy your UUID
2. Run:

```bash
node seed-wardrobe.mjs
```

This inserts 13 generic clothing items into `wardrobe_items` for your user. To re-seed, delete existing rows first in the Supabase Table Editor, then run again.

To attach real images to seeded items, create a `wardrobe-seed-images/` folder in the project root, add image files, then add a `file` key to each item in `seed-wardrobe.mjs`.

---

## 🚀 5 — Vercel Deployment

### 5.1 Connect the repo

1. Go to [vercel.com](https://vercel.com/) → **Add New Project**
2. Import your GitHub repo (`AryanKedare/Closet-IQ` or your fork)
3. Vercel auto-detects the framework — leave build settings as-is

### 5.2 Add environment variables

In the Vercel project dashboard → **Settings → Environment Variables**, add **all** of the following:

| Variable | Value | Environments |
|---|---|---|
| `VITE_APPWRITE_PROJECT_ID` | Your Appwrite Project ID | Production, Preview, Development |
| `VITE_APPWRITE_DATABASE_ID` | Your Appwrite Database ID | Production, Preview, Development |
| `VITE_APPWRITE_BUCKET_ID` | Your Appwrite Bucket ID | Production, Preview, Development |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | Supabase anon key | Production, Preview, Development |
| `SUPABASE_PUBLISHABLE_KEY` | Same as anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Production, Preview |
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Production, Preview, Development |
| `GROQ_API_KEY` | Your Groq API key | Production, Preview |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` and `GROQ_API_KEY` are **server-side secrets** — do not prefix them with `VITE_`. Vercel keeps them server-side automatically as long as they lack the `VITE_` prefix.

### 5.3 Add your Vercel domain to Appwrite

Once Vercel assigns you a domain (e.g., `closet-iq.vercel.app`):

1. Appwrite Console → your project → **Overview → Add platform → Web**
2. **Hostname**: `closet-iq.vercel.app` (your actual domain)
3. Save

### 5.4 Deploy

Click **Deploy** in Vercel. On every subsequent push to `main`, Vercel automatically redeploys.

---

## 📁 Project Structure

```
Closet-IQ/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── AddItemPanel.tsx     # Add wardrobe item (camera + gallery upload)
│   │   ├── AppShell.tsx         # App layout shell + nav
│   │   └── ui/                  # shadcn/ui primitives
│   ├── integrations/
│   │   ├── appwrite/
│   │   │   └── client.ts        # Appwrite client (reads VITE_ env vars)
│   │   └── supabase/
│   │       ├── client.ts        # Supabase browser client
│   │       ├── client.server.ts # Supabase admin client (service role, server only)
│   │       ├── auth-middleware.ts # Bearer token auth middleware
│   │       └── types.ts         # Generated DB types
│   ├── lib/
│   │   ├── store.ts             # Zustand global state
│   │   └── utils.ts             # Shared utilities
│   └── routes/
│       ├── __root.tsx           # Root layout
│       ├── index.tsx            # Home / landing
│       ├── closet.tsx           # Wardrobe management
│       ├── outfits.tsx          # Outfit browser
│       ├── outfits.$outfitId.tsx # Outfit detail
│       ├── chat.tsx             # AI Stylist chat UI
│       ├── today.tsx            # Today's outfit suggestion
│       ├── calendar.tsx         # Outfit history calendar
│       ├── gaps.tsx             # Wardrobe gap analysis
│       ├── pack.tsx             # Packing assistant
│       ├── trends.tsx           # Wear trends & stats
│       ├── profile.tsx          # User profile & settings
│       ├── api.chat.tsx         # POST /api/chat — streaming Groq LLM
│       └── api.explain.tsx      # POST /api/explain — outfit explanation
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 20260424135200_*.sql # Main schema (tables, RLS, storage bucket)
│       └── 20260424_features.sql # Feature additions
├── .env.example                 # Environment variable template
├── seed-wardrobe.mjs            # CLI script to seed sample wardrobe items
├── vercel.json                  # Vercel deployment config
└── vite.config.ts               # Vite configuration
```

---

## 🌐 API Routes

Both routes are **server-side only** and read `GROQ_API_KEY` from `process.env` — the key is never exposed to the browser.

| Route | Method | Purpose |
|---|---|---|
| `/api/chat` | `POST` | Streaming AI stylist chat using the user's wardrobe as context |
| `/api/explain` | `POST` | One-shot outfit explanation based on selected items and user's colour profile |

### `/api/chat` request body

```json
{
  "message": "What should I wear for a dinner date?",
  "history": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}],
  "wardrobeContext": "- Black Slim Jeans (jeans, dark, solid)\n- ...",
  "userName": "Aryan"
}
```

### `/api/explain` request body

```json
{
  "top":    { "name": "Tommy Hilfiger Oxford Shirt", "color": "#A8C8E8", "pattern": "solid" },
  "bottom": { "name": "Beige Chinos", "color": "#C8A97E" },
  "shoes":  { "name": "Nike Killshot 2", "color": "#F0EBE0" },
  "jacket": null,
  "profile": { "skinHex": "#CC9674", "eyeHex": "#1F1919", "hairHex": "#0A0B0B" }
}
```

---

## 🔒 Security Notes

- **`GROQ_API_KEY`** — server-side only, never prefixed with `VITE_`
- **`SUPABASE_SERVICE_ROLE_KEY`** — server-side only (`client.server.ts`), bypasses RLS, never exposed to the browser
- **Appwrite IDs** — loaded from `VITE_` env vars, not hardcoded in source
- **Input sanitization** — all user inputs to AI routes are sanitized (HTML stripped, length-capped) before being forwarded to Groq
- **`.env`** — git-ignored; never commit real credentials. Only `.env.example` is committed

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes with a descriptive message
4. Open a Pull Request against `main`

---

## 📄 License

MIT — feel free to use this project for personal or commercial purposes.
