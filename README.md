# Closet IQ 👗🧠

An AI-powered smart wardrobe app that helps you manage your clothing, build outfits, and get intelligent outfit suggestions — powered by Groq AI and Supabase/Appwrite.

## ✨ Features

- **Wardrobe Management** — Add, categorize, and organize your clothing items with images
- **AI Outfit Suggestions** — Get smart outfit recommendations with explanations powered by Groq LLM
- **Outfit Builder** — Compose and save outfit combinations from your wardrobe
- **Wardrobe Seeding** — Quickly populate your wardrobe with sample items via the seed script
- **Authentication** — Secure user auth via Appwrite
- **Cloudflare Workers** — API routes deployed to the edge via Cloudflare Workers

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TanStack Start, TanStack Router |
| Styling | Tailwind CSS v4, shadcn/ui (Radix UI) |
| Backend / DB | Supabase + Appwrite |
| AI | Groq API (LLM outfit explanations) |
| Deployment | Cloudflare Workers (via Wrangler) + Vercel |
| Build Tool | Vite + Bun |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 20 or [Bun](https://bun.sh/)
- An [Appwrite](https://appwrite.io/) account (free tier works)
- A [Supabase](https://supabase.com/) account (free tier works)
- A [Groq](https://console.groq.com/) API key (free tier available)

### 1. Clone the repo

```bash
git clone https://github.com/AryanKedare/Closet-IQ.git
cd Closet-IQ
```

### 2. Install dependencies

```bash
bun install
# or
npm install
```

### 3. Set up environment variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
APPWRITE_PROJECT_ID="your_appwrite_project_id"
APPWRITE_DATABASE_ID="your_appwrite_database_id"
APPWRITE_BUCKET_ID="your_appwrite_bucket_id"
VITE_APPWRITE_PROJECT_ID="your_appwrite_project_id"
VITE_APPWRITE_DATABASE_ID="your_appwrite_database_id"
VITE_APPWRITE_BUCKET_ID="your_appwrite_bucket_id"

# Get your key at https://console.groq.com
GROQ_API_KEY="your_groq_api_key"
```

### 4. Run locally

```bash
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. (Optional) Seed sample wardrobe data

```bash
node seed-wardrobe.mjs
```

## 📁 Project Structure

```
Closet-IQ/
├── api/               # Cloudflare Worker API routes
├── scripts/           # Utility scripts
├── src/
│   ├── components/    # Reusable UI components (shadcn/ui based)
│   ├── hooks/         # Custom React hooks
│   ├── integrations/  # Supabase & Appwrite client setup
│   ├── lib/           # Shared utilities
│   ├── routes/        # TanStack Router file-based routes
│   └── router.tsx     # Router configuration
├── supabase/          # Supabase migrations & config
├── .env.example       # Environment variable template
├── seed-wardrobe.mjs  # Wardrobe seeding script
└── vite.config.ts     # Vite configuration
```

## 🌐 Deployment

### Vercel
A `vercel.json` is included. Just connect your GitHub repo to Vercel and add the environment variables in the Vercel dashboard.

### Cloudflare Workers
Configure `wrangler.jsonc` and deploy:

```bash
bunx wrangler deploy
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Open a Pull Request

## 📄 License

MIT — feel free to use this project for personal or commercial purposes.
