/**
 * seed-wardrobe.mjs
 *
 * Populates your Supabase `wardrobe_items` table with a small set of
 * generic sample items so you can explore the app without uploading real
 * clothing first.
 *
 * Usage:
 *   1. Copy .env.example → .env and fill in your Supabase credentials.
 *   2. Set SEED_USER_ID in .env to your own Supabase auth user UUID.
 *   3. Run:  node seed-wardrobe.mjs
 *
 * To re-seed, delete existing rows for your user first, then run again.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join, extname, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

// ── Load .env manually (no dotenv dependency needed in Node 20+) ──────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, ".env");

if (!existsSync(envPath)) {
  console.error("❌  .env file not found. Copy .env.example → .env and fill in your credentials.");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim().replace(/^["']|["']$/g, "")))
);

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
const USER_ID      = env.SEED_USER_ID;
const BUCKET       = env.SUPABASE_BUCKET_ID || "wardrobe-images";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set in .env");
  process.exit(1);
}
if (!USER_ID) {
  console.error("❌  SEED_USER_ID must be set in .env — use your own Supabase auth user UUID.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Generic sample items — replace or extend with your own ───────────────────
// Each item without a `file` key will be inserted without an image.
// To attach images, add a `file` key pointing to a local path relative to
// a `wardrobe-seed-images/` folder you create in the project root.
const ITEMS = [
  // ── JACKETS ──
  {
    name: "Classic Denim Jacket",
    category: "jacket",
    primary_color: "#4A6FA5",
    color_family: "cool-blue",
    pattern: "solid",
    brand: null,
    style_tags: ["casual", "classic"],
    occasion_tags: ["casual"],
    season: ["spring", "fall"],
  },
  {
    name: "Black Bomber Jacket",
    category: "jacket",
    primary_color: "#1A1A1A",
    color_family: "dark",
    pattern: "solid",
    brand: null,
    style_tags: ["casual", "street"],
    occasion_tags: ["casual", "date-night"],
    season: ["fall", "winter"],
  },

  // ── JEANS ──
  {
    name: "Slim Fit Blue Jeans",
    category: "jeans",
    primary_color: "#2B4C7E",
    color_family: "cool-blue",
    pattern: "solid",
    brand: null,
    style_tags: ["classic", "casual"],
    occasion_tags: ["casual"],
    season: ["all"],
  },
  {
    name: "Black Skinny Jeans",
    category: "jeans",
    primary_color: "#1A1A1A",
    color_family: "dark",
    pattern: "solid",
    brand: null,
    style_tags: ["minimal", "dark"],
    occasion_tags: ["casual", "date-night"],
    season: ["all"],
  },

  // ── SHIRTS ──
  {
    name: "White Oxford Shirt",
    category: "shirt",
    primary_color: "#F5F5F5",
    color_family: "neutral",
    pattern: "solid",
    brand: null,
    style_tags: ["classic", "smart-casual"],
    occasion_tags: ["casual", "smart-casual", "formal"],
    season: ["all"],
  },
  {
    name: "Navy Linen Shirt",
    category: "shirt",
    primary_color: "#1F305E",
    color_family: "cool-blue",
    pattern: "solid",
    brand: null,
    style_tags: ["resort", "minimal"],
    occasion_tags: ["casual", "beach"],
    season: ["spring", "summer"],
  },

  // ── T-SHIRTS ──
  {
    name: "White Plain Tee",
    category: "tshirt",
    primary_color: "#FFFFFF",
    color_family: "neutral",
    pattern: "solid",
    brand: null,
    style_tags: ["minimal", "classic"],
    occasion_tags: ["casual"],
    season: ["all"],
  },
  {
    name: "Black Graphic Tee",
    category: "tshirt",
    primary_color: "#0D0D0D",
    color_family: "dark",
    pattern: "graphic",
    brand: null,
    style_tags: ["street", "statement"],
    occasion_tags: ["casual"],
    season: ["all"],
  },
  {
    name: "Grey Hoodie",
    category: "tshirt",
    primary_color: "#6B6B6B",
    color_family: "grey",
    pattern: "solid",
    brand: null,
    style_tags: ["casual", "comfort"],
    occasion_tags: ["casual"],
    season: ["fall", "winter"],
  },

  // ── TROUSERS ──
  {
    name: "Beige Chino Trousers",
    category: "pants",
    primary_color: "#C8B89A",
    color_family: "neutral",
    pattern: "solid",
    brand: null,
    style_tags: ["smart-casual", "classic"],
    occasion_tags: ["casual", "smart-casual"],
    season: ["spring", "summer"],
  },
  {
    name: "Grey Sweatpants",
    category: "pants",
    primary_color: "#9E9E9E",
    color_family: "grey",
    pattern: "solid",
    brand: null,
    style_tags: ["casual", "comfort"],
    occasion_tags: ["casual", "sport"],
    season: ["all"],
  },

  // ── SHOES ──
  {
    name: "White Sneakers",
    category: "shoes",
    primary_color: "#FAFAFA",
    color_family: "neutral",
    pattern: "solid",
    brand: null,
    style_tags: ["minimal", "classic"],
    occasion_tags: ["casual", "smart-casual"],
    season: ["all"],
  },
  {
    name: "Black Chelsea Boots",
    category: "shoes",
    primary_color: "#1A1A1A",
    color_family: "dark",
    pattern: "solid",
    brand: null,
    style_tags: ["smart-casual", "classic"],
    occasion_tags: ["casual", "smart-casual", "date-night"],
    season: ["fall", "winter"],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function mimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (ext === ".png")  return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

async function uploadImage(filePath, storagePath) {
  const abs = join(__dirname, "wardrobe-seed-images", filePath);
  if (!existsSync(abs)) {
    console.warn(`  [skip] image not found: ${abs}`);
    return null;
  }
  const buf = readFileSync(abs);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType: mimeType(filePath), upsert: true });
  if (error) {
    console.error(`  [storage error] ${filePath}:`, error.message);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🌱  Seeding ${ITEMS.length} wardrobe items for user ${USER_ID}...\n`);

  const { data: existing } = await supabase
    .from("wardrobe_items")
    .select("id")
    .eq("user_id", USER_ID)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log("⚠️   Wardrobe items already exist for this user.");
    console.log("    Delete existing rows first if you want to re-seed.\n");
    return;
  }

  let ok = 0;
  let fail = 0;

  for (const item of ITEMS) {
    process.stdout.write(`  ${item.name} ... `);
    try {
      const uuid        = randomUUID();
      const ext         = item.file ? extname(item.file) : "";
      const storagePath = item.file ? `${USER_ID}/${uuid}${ext}` : null;
      const imageUrl    = item.file ? await uploadImage(item.file, storagePath) : null;

      const { error } = await supabase.from("wardrobe_items").insert({
        user_id:         USER_ID,
        name:            item.name,
        category:        item.category,
        sub_category:    null,
        primary_color:   item.primary_color,
        secondary_color: null,
        color_family:    item.color_family,
        pattern:         item.pattern,
        brand:           item.brand ?? null,
        style_tags:      item.style_tags,
        occasion_tags:   item.occasion_tags,
        season:          item.season,
        image_url:       imageUrl,
        times_worn:      0,
      });

      if (error) {
        console.log(`FAIL — ${error.message}`);
        fail++;
      } else {
        console.log(imageUrl ? "✅ OK" : "✅ OK (no image)");
        ok++;
      }
    } catch (err) {
      console.log(`ERROR — ${err.message}`);
      fail++;
    }
  }

  console.log(`\n✅  Done: ${ok} inserted, ${fail} failed.\n`);
}

main().catch(console.error);
