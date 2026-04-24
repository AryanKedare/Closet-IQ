import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join, extname, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = "https://viezphgdfxqhkmpygzos.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZXpwaGdkZnhxaGttcHlnem9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzA2MDUsImV4cCI6MjA5MjYwNjYwNX0.14Ppx4W0cjrceVqlgyo5jz5pQ4a7rszKkVcoQJZaw9Y";
const USER_ID = "00000000-0000-0000-0000-000000000001";
const BUCKET = "wardrobe-images";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ITEMS = [
  // ── JACKETS ──
  {
    file: "JACKETS/Berska Brown Leather Jacket.jpg",
    name: "Bershka Brown Leather Jacket",
    category: "jacket",
    primary_color: "#2C1A0E",
    color_family: "warm-earth",
    pattern: "solid",
    brand: "Bershka",
    style_tags: ["smart-casual", "warm-earth", "leather"],
    occasion_tags: ["casual", "date-night"],
    season: ["fall", "winter"],
  },
  {
    file: "JACKETS/Levis Grey Denim.jpg",
    name: "Levi's Grey Denim Jacket",
    category: "jacket",
    primary_color: "#8A8880",
    color_family: "grey",
    pattern: "solid",
    brand: "Levi's",
    style_tags: ["casual", "denim", "classic"],
    occasion_tags: ["casual"],
    season: ["spring", "fall"],
  },

  // ── JEANS ──
  {
    file: "JEANS/Baggy jeans with patch.png",
    name: "Baggy Patch Jeans",
    category: "jeans",
    primary_color: "#2A2A2A",
    color_family: "dark",
    pattern: "graphic",
    brand: null,
    style_tags: ["street", "oversized"],
    occasion_tags: ["casual"],
    season: ["all"],
  },
  {
    file: "JEANS/BAGGY JEANS WITH SEAM DETAIL.png",
    name: "Baggy Jeans with Seam Detail",
    category: "jeans",
    primary_color: "#1F2D4A",
    color_family: "cool-blue",
    pattern: "solid",
    brand: null,
    style_tags: ["street", "oversized"],
    occasion_tags: ["casual"],
    season: ["all"],
  },
  {
    file: "JEANS/Bootcut Regular Jeans.png",
    name: "Bootcut Regular Jeans",
    category: "jeans",
    primary_color: "#B8D4E8",
    color_family: "cool-blue",
    pattern: "solid",
    brand: null,
    style_tags: ["classic"],
    occasion_tags: ["casual"],
    season: ["all"],
  },
  {
    file: "JEANS/Grey Denim Jeans .jpg",
    name: "Grey Denim Jeans",
    category: "jeans",
    primary_color: "#5A5A5A",
    color_family: "grey",
    pattern: "solid",
    brand: null,
    style_tags: ["classic", "minimal"],
    occasion_tags: ["casual"],
    season: ["all"],
  },
  {
    file: "JEANS/WASHED DENIM P&B.jpg",
    name: "P&B Washed Denim Jeans",
    category: "jeans",
    primary_color: "#C8B89A",
    color_family: "neutral",
    pattern: "solid",
    brand: "P&B",
    style_tags: ["casual", "washed"],
    occasion_tags: ["casual"],
    season: ["spring", "summer"],
  },

  // ── SHIRTS ──
  {
    file: "SHIRT/BATMAN SHIRT.jpg",
    name: "Batman Camp Shirt",
    category: "shirt",
    primary_color: "#0D0D0D",
    color_family: "dark",
    pattern: "graphic",
    brand: null,
    style_tags: ["statement", "street"],
    occasion_tags: ["casual"],
    season: ["spring", "summer"],
  },
  {
    file: "SHIRT/BLUE SHIRT.jpg",
    name: "Blue Oxford Shirt",
    category: "shirt",
    primary_color: "#A8C8E8",
    color_family: "cool-blue",
    pattern: "solid",
    brand: "Tommy Hilfiger",
    style_tags: ["smart-casual", "classic"],
    occasion_tags: ["casual", "smart-casual"],
    season: ["spring", "summer"],
  },
  {
    file: "SHIRT/H&M Black Shirt.jpg",
    name: "H&M Black Linen Shirt",
    category: "shirt",
    primary_color: "#1A1A1A",
    color_family: "dark",
    pattern: "solid",
    brand: "H&M",
    style_tags: ["minimal", "dark"],
    occasion_tags: ["casual", "date-night"],
    season: ["all"],
  },
  {
    file: "SHIRT/H&M BLUE STRIPPED.jpg",
    name: "H&M Blue Striped Shirt",
    category: "shirt",
    primary_color: "#B8D4F0",
    color_family: "cool-blue",
    pattern: "stripe",
    brand: "H&M",
    style_tags: ["casual", "resort"],
    occasion_tags: ["casual", "beach"],
    season: ["spring", "summer"],
  },
  {
    file: "SHIRT/Loose Fit Seersucker resort shirt.png",
    name: "Loose Fit Seersucker Resort Shirt",
    category: "shirt",
    primary_color: "#E8E0D0",
    color_family: "cream",
    pattern: "texture",
    brand: null,
    style_tags: ["resort", "summer", "minimal"],
    occasion_tags: ["casual", "beach"],
    season: ["summer"],
  },
  {
    file: "SHIRT/Pink Shirt H&M.jpg",
    name: "H&M Pink Checked Shirt",
    category: "shirt",
    primary_color: "#D4A0A0",
    color_family: "warm-pink",
    pattern: "plaid",
    brand: "H&M",
    style_tags: ["smart-casual"],
    occasion_tags: ["casual", "smart-casual"],
    season: ["spring", "fall"],
  },

  // ── SHOES ──
  {
    file: "SHOES/Black Shoes Nike.png",
    name: "Nike Dunk Low Black/White",
    category: "shoes",
    primary_color: "#0D0D0D",
    color_family: "dark",
    pattern: "solid",
    brand: "Nike",
    style_tags: ["street", "sporty", "sneaker"],
    occasion_tags: ["casual"],
    season: ["all"],
  },
  {
    file: "SHOES/Crocs.jpg",
    name: "Crocs Olive Slides",
    category: "shoes",
    primary_color: "#7A8A4A",
    color_family: "warm-earth",
    pattern: "solid",
    brand: "Crocs",
    style_tags: ["casual", "comfort"],
    occasion_tags: ["casual", "beach"],
    season: ["spring", "summer"],
  },
  {
    file: "SHOES/KILLSHOTS 2.png",
    name: "Nike Killshot 2 Cream/Gum",
    category: "shoes",
    primary_color: "#F0EDE0",
    color_family: "cream",
    pattern: "solid",
    brand: "Nike",
    style_tags: ["classic", "minimal", "retro"],
    occasion_tags: ["casual", "smart-casual"],
    season: ["all"],
  },
  {
    file: "SHOES/NB_1906r.jpg",
    name: "New Balance 1906R Grey",
    category: "shoes",
    primary_color: "#8090A8",
    color_family: "grey",
    pattern: "solid",
    brand: "New Balance",
    style_tags: ["sporty", "techy", "sneaker"],
    occasion_tags: ["casual", "sport"],
    season: ["all"],
  },
  {
    file: "SHOES/Puma Red Palermos.jpg",
    name: "Puma Palermo Red Suede",
    category: "shoes",
    primary_color: "#C04040",
    color_family: "warm-pink",
    pattern: "solid",
    brand: "Puma",
    style_tags: ["retro", "sporty"],
    occasion_tags: ["casual"],
    season: ["all"],
  },

  // ── T-SHIRTS / TOPS ──
  {
    file: "T-SHIRT/Black QuaterZip H&M.jpg",
    name: "H&M Black Quarter-Zip",
    category: "tshirt",
    primary_color: "#0D0D0D",
    color_family: "dark",
    pattern: "solid",
    brand: "H&M",
    style_tags: ["casual", "minimal"],
    occasion_tags: ["casual"],
    season: ["fall", "winter"],
  },
  {
    file: "T-SHIRT/Compression Black.jpg",
    name: "Champion Black Compression Shirt",
    category: "tshirt",
    primary_color: "#0D0D0D",
    color_family: "dark",
    pattern: "solid",
    brand: "Champion",
    style_tags: ["athletic", "sporty"],
    occasion_tags: ["sport"],
    season: ["all"],
  },
  {
    file: "T-SHIRT/DARK BLUE JUMPER.jpg",
    name: "Navy Cashmere Jumper",
    category: "tshirt",
    primary_color: "#1A2440",
    color_family: "cool-blue",
    pattern: "solid",
    brand: "John Henry",
    style_tags: ["smart-casual", "classic", "knitwear"],
    occasion_tags: ["casual", "smart-casual"],
    season: ["fall", "winter"],
  },
  {
    file: "T-SHIRT/Dark BLUE POLO.jpg",
    name: "Dark Navy Crew Neck T-Shirt",
    category: "tshirt",
    primary_color: "#1A1A2E",
    color_family: "dark",
    pattern: "solid",
    brand: null,
    style_tags: ["minimal", "dark"],
    occasion_tags: ["casual"],
    season: ["all"],
  },
  {
    file: "T-SHIRT/Dark Grey TankTop.jpg",
    name: "H&M Dark Grey Tank Top",
    category: "tshirt",
    primary_color: "#3A3A3A",
    color_family: "grey",
    pattern: "solid",
    brand: "H&M",
    style_tags: ["minimal", "athletic"],
    occasion_tags: ["casual", "sport"],
    season: ["spring", "summer"],
  },
  {
    file: "T-SHIRT/DRY FIT H&M GREEN.jpg",
    name: "H&M Green Camo Dry-Fit Vest",
    category: "tshirt",
    primary_color: "#2D4A2D",
    color_family: "warm-earth",
    pattern: "graphic",
    brand: "H&M",
    style_tags: ["athletic", "street"],
    occasion_tags: ["casual", "sport"],
    season: ["spring", "summer"],
  },
  {
    file: "T-SHIRT/DRY FIT TSHIRT BLACK.jpg",
    name: "H&M Black Camo Dry-Fit Vest",
    category: "tshirt",
    primary_color: "#1A1A1A",
    color_family: "dark",
    pattern: "graphic",
    brand: "H&M",
    style_tags: ["athletic", "dark"],
    occasion_tags: ["casual", "sport"],
    season: ["spring", "summer"],
  },
  {
    file: "T-SHIRT/FUSHIA PINK H&M.jpg",
    name: "H&M Fuchsia Turbo Graphic Tee",
    category: "tshirt",
    primary_color: "#C04060",
    color_family: "warm-pink",
    pattern: "graphic",
    brand: "H&M",
    style_tags: ["statement", "street"],
    occasion_tags: ["casual"],
    season: ["spring", "summer"],
  },
  {
    file: "T-SHIRT/GREEN POLO.JPG",
    name: "Olive Green Striped Polo",
    category: "tshirt",
    primary_color: "#4A5A28",
    color_family: "warm-earth",
    pattern: "stripe",
    brand: null,
    style_tags: ["casual", "retro", "polo"],
    occasion_tags: ["casual"],
    season: ["spring", "summer"],
  },
  {
    file: "T-SHIRT/Grey Oversized Fit Vest top.png",
    name: "Grey Oversized Graphic Vest",
    category: "tshirt",
    primary_color: "#3A3A3A",
    color_family: "grey",
    pattern: "graphic",
    brand: "H&M",
    style_tags: ["street", "oversized"],
    occasion_tags: ["casual"],
    season: ["spring", "summer"],
  },
  {
    file: "T-SHIRT/IMG_7132.jpg",
    name: "Toyota Land Cruiser Orange Longsleeve",
    category: "tshirt",
    primary_color: "#D47050",
    color_family: "warm-earth",
    pattern: "graphic",
    brand: "P&B",
    style_tags: ["statement", "casual"],
    occasion_tags: ["casual"],
    season: ["spring", "summer"],
  },
  {
    file: "T-SHIRT/IRELAND JERSY RUGBY.jpg",
    name: "Ireland Rugby Jersey",
    category: "tshirt",
    primary_color: "#28A050",
    color_family: "warm-earth",
    pattern: "graphic",
    brand: null,
    style_tags: ["statement", "sport"],
    occasion_tags: ["casual", "sport"],
    season: ["all"],
  },
  {
    file: "T-SHIRT/NIRVANA HOODIE.jpg",
    name: "H&M Nirvana Unplugged Hoodie",
    category: "tshirt",
    primary_color: "#0D0D0D",
    color_family: "dark",
    pattern: "graphic",
    brand: "H&M",
    style_tags: ["street", "statement", "grunge"],
    occasion_tags: ["casual"],
    season: ["fall", "winter"],
  },
  {
    file: "T-SHIRT/P&B Orange Tshirt.jpg",
    name: "P&B Toyota Land Cruiser Orange Tee",
    category: "tshirt",
    primary_color: "#D47050",
    color_family: "warm-earth",
    pattern: "graphic",
    brand: "P&B",
    style_tags: ["statement", "casual"],
    occasion_tags: ["casual"],
    season: ["spring", "summer"],
  },
  {
    file: "T-SHIRT/P&B RED Sweatshirt.jpg",
    name: "P&B Red Sweatshirt",
    category: "tshirt",
    primary_color: "#C03020",
    color_family: "warm-pink",
    pattern: "solid",
    brand: "P&B",
    style_tags: ["casual", "minimal"],
    occasion_tags: ["casual"],
    season: ["fall", "winter"],
  },
  {
    file: "T-SHIRT/PINK Sweatshirt.jpg",
    name: "H&M Pink Sweatshirt",
    category: "tshirt",
    primary_color: "#C8A8C8",
    color_family: "warm-pink",
    pattern: "solid",
    brand: "H&M",
    style_tags: ["casual", "minimal", "pastel"],
    occasion_tags: ["casual"],
    season: ["spring", "fall"],
  },
  {
    file: "T-SHIRT/POLO BLUE.jpg",
    name: "Primark Navy Polo",
    category: "tshirt",
    primary_color: "#1A2040",
    color_family: "cool-blue",
    pattern: "solid",
    brand: "Primark",
    style_tags: ["smart-casual", "classic", "polo"],
    occasion_tags: ["casual", "smart-casual"],
    season: ["all"],
  },
  {
    file: "T-SHIRT/RED TSHIRT.jpg",
    name: "Lauren Red Graphic T-Shirt",
    category: "tshirt",
    primary_color: "#C02818",
    color_family: "warm-pink",
    pattern: "graphic",
    brand: "Lauren",
    style_tags: ["statement", "casual"],
    occasion_tags: ["casual"],
    season: ["spring", "summer"],
  },

  // ── TROUSERS ──
  {
    file: "TROUSERS/Beige Trousers .jpg",
    name: "Beige Linen Drawstring Trousers",
    category: "pants",
    primary_color: "#D8CEB8",
    color_family: "neutral",
    pattern: "solid",
    brand: null,
    style_tags: ["smart-casual", "resort", "minimal"],
    occasion_tags: ["casual", "smart-casual"],
    season: ["spring", "summer"],
  },
  {
    file: "TROUSERS/Bonkers Black Joggers.jpg",
    name: "Bonkers Black Wide-Leg Joggers",
    category: "pants",
    primary_color: "#0D0D0D",
    color_family: "dark",
    pattern: "solid",
    brand: "Bonkers",
    style_tags: ["street", "oversized"],
    occasion_tags: ["casual"],
    season: ["all"],
  },
  {
    file: "TROUSERS/Interlock tracksuit bottoms.png",
    name: "Grey Interlock Tracksuit Bottoms",
    category: "pants",
    primary_color: "#A8A8A0",
    color_family: "grey",
    pattern: "solid",
    brand: null,
    style_tags: ["athletic", "casual"],
    occasion_tags: ["casual", "sport"],
    season: ["all"],
  },
  {
    file: "TROUSERS/Khaki Parachute.JPG",
    name: "Khaki Parachute Trousers",
    category: "pants",
    primary_color: "#B0903A",
    color_family: "warm-earth",
    pattern: "solid",
    brand: null,
    style_tags: ["street", "utility", "oversized"],
    occasion_tags: ["casual"],
    season: ["spring", "summer"],
  },
  {
    file: "TROUSERS/P&B Grey Joggers.jpg",
    name: "P&B Grey Wide-Leg Joggers",
    category: "pants",
    primary_color: "#607080",
    color_family: "grey",
    pattern: "solid",
    brand: "P&B",
    style_tags: ["casual", "athletic"],
    occasion_tags: ["casual", "sport"],
    season: ["all"],
  },
  {
    file: "TROUSERS/SHORTS BLACK.jpg",
    name: "Primark Black Jersey Shorts",
    category: "shorts",
    primary_color: "#0D0D0D",
    color_family: "dark",
    pattern: "solid",
    brand: "Primark",
    style_tags: ["casual", "athletic"],
    occasion_tags: ["casual", "sport"],
    season: ["spring", "summer"],
  },
];

function mimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

async function uploadImage(filePath, storagePath) {
  const abs = join(__dirname, "Wardrope", filePath);
  if (!existsSync(abs)) {
    console.warn(`  [skip] file not found: ${abs}`);
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

async function main() {
  console.log(`Seeding ${ITEMS.length} wardrobe items...\n`);

  // Optional: skip if data already exists
  const { data: existing } = await supabase
    .from("wardrobe_items")
    .select("id")
    .eq("user_id", USER_ID)
    .limit(1);
  if (existing && existing.length > 0) {
    console.log("Wardrobe items already exist. Skipping insert (delete existing rows first to re-seed).");
    return;
  }

  let ok = 0;
  let fail = 0;

  for (const item of ITEMS) {
    process.stdout.write(`  ${item.name} ... `);
    try {
      const uuid = randomUUID();
      const ext = extname(item.file);
      const storagePath = `${USER_ID}/${uuid}${ext}`;

      const imageUrl = await uploadImage(item.file, storagePath);

      const { error } = await supabase.from("wardrobe_items").insert({
        user_id: USER_ID,
        name: item.name,
        category: item.category,
        sub_category: null,
        primary_color: item.primary_color,
        secondary_color: null,
        color_family: item.color_family,
        pattern: item.pattern,
        brand: item.brand,
        style_tags: item.style_tags,
        occasion_tags: item.occasion_tags,
        season: item.season,
        image_url: imageUrl,
        times_worn: 0,
      });

      if (error) {
        console.log(`FAIL — ${error.message}`);
        fail++;
      } else {
        console.log(imageUrl ? "OK" : "OK (no image)");
        ok++;
      }
    } catch (err) {
      console.log(`ERROR — ${err.message}`);
      fail++;
    }
  }

  console.log(`\nDone: ${ok} inserted, ${fail} failed.`);
}

main().catch(console.error);
