import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { ColorSwatch } from "@/components/ColorSwatch";
import { generateOutfits } from "@/lib/outfitGenerator";
import { ShoppingBag, TrendingUp, CheckCircle2, Circle } from "lucide-react";
import type { WardrobeItem } from "@/lib/types";

export const Route = createFileRoute("/gaps")({ component: GapsPage });

// Curated shopping recommendations tuned for warm-medium skin tone.
const RECOMMENDATIONS: Array<Omit<WardrobeItem, "id" | "userId" | "createdAt" | "timesWorn" | "lastWorn">> = [
  {
    name: "Black slim jeans",
    category: "jeans",
    primaryColor: "#111111",
    colorFamily: "dark",
    pattern: "solid",
    styleTags: ["minimalist", "smart-casual", "casual"],
    occasionTags: ["casual", "smart-casual", "going-out", "date-night"],
    season: ["spring", "fall", "winter"],
    brand: null,
    imageUrl: null,
    secondaryColor: null,
    subCategory: "slim",
  },
  {
    name: "Dark navy chinos",
    category: "pants",
    primaryColor: "#1F2D4A",
    colorFamily: "cool-blue",
    pattern: "solid",
    styleTags: ["smart-casual", "office"],
    occasionTags: ["office", "smart-casual", "date-night"],
    season: ["spring", "fall", "winter"],
    brand: null,
    imageUrl: null,
    secondaryColor: null,
    subCategory: "chino",
  },
  {
    name: "Beige / tan chinos",
    category: "pants",
    primaryColor: "#C8A97E",
    colorFamily: "warm-earth",
    pattern: "solid",
    styleTags: ["casual", "smart-casual"],
    occasionTags: ["casual", "weekend", "smart-casual"],
    season: ["spring", "summer", "fall"],
    brand: null,
    imageUrl: null,
    secondaryColor: null,
    subCategory: "chino",
  },
  {
    name: "Olive trousers",
    category: "pants",
    primaryColor: "#5C6B3A",
    colorFamily: "warm-earth",
    pattern: "solid",
    styleTags: ["casual", "smart-casual", "street"],
    occasionTags: ["casual", "weekend", "smart-casual"],
    season: ["spring", "fall", "winter"],
    brand: null,
    imageUrl: null,
    secondaryColor: null,
    subCategory: "trouser",
  },
  {
    name: "Burgundy trousers",
    category: "pants",
    primaryColor: "#5A1A2A",
    colorFamily: "warm-earth",
    pattern: "solid",
    styleTags: ["smart-casual", "statement"],
    occasionTags: ["smart-casual", "date-night", "going-out"],
    season: ["fall", "winter"],
    brand: null,
    imageUrl: null,
    secondaryColor: null,
    subCategory: "trouser",
  },
  {
    name: "White t-shirt",
    category: "tshirt",
    primaryColor: "#F5F5F0",
    colorFamily: "cream",
    pattern: "solid",
    styleTags: ["minimalist", "casual"],
    occasionTags: ["casual", "weekend", "smart-casual"],
    season: ["spring", "summer", "fall"],
    brand: null,
    imageUrl: null,
    secondaryColor: null,
    subCategory: null,
  },
  {
    name: "Black t-shirt",
    category: "tshirt",
    primaryColor: "#101010",
    colorFamily: "dark",
    pattern: "solid",
    styleTags: ["minimalist", "casual", "street"],
    occasionTags: ["casual", "weekend", "going-out"],
    season: ["spring", "summer", "fall", "winter"],
    brand: null,
    imageUrl: null,
    secondaryColor: null,
    subCategory: null,
  },
  {
    name: "White linen shirt",
    category: "shirt",
    primaryColor: "#F2EDE2",
    colorFamily: "cream",
    pattern: "texture",
    styleTags: ["smart-casual", "minimalist", "date-night"],
    occasionTags: ["smart-casual", "date-night", "weekend"],
    season: ["spring", "summer"],
    brand: null,
    imageUrl: null,
    secondaryColor: null,
    subCategory: "linen",
  },
];

const RATIONALES: Record<string, string> = {
  "Black slim jeans":
    "A foundational dark base. The deep black sharpens warm earth tops and adds contrast against your medium tan skin without competing.",
  "Dark navy chinos":
    "Navy reads sophisticated against warm complexions and pairs cleanly with cream, blue, and earth-toned shirts already in your closet.",
  "Beige / tan chinos":
    "An analogous match to your skin tone — warm and harmonious. They unlock relaxed weekend looks with darker shirts and the leather jacket.",
  "Olive trousers":
    "Earthy, muted green is highly flattering on warm-medium skin. Pairs beautifully with cream, navy, and your Killshot 2s.",
  "Burgundy trousers":
    "A confident statement bottom for date-night looks. The warm red base resonates with your skin's undertone instead of fighting it.",
  "White t-shirt":
    "A neutral anchor that works under every jacket and over every bottom — instantly multiplies the combinations you already have.",
  "Black t-shirt":
    "Pairs with everything, especially with the brown leather jacket and lighter bottoms for sharp contrast.",
  "White linen shirt":
    "Soft cream tones flatter your warm undertone, and the texture adds depth to the smart-casual rotation for warmer months.",
};

const CAPSULE_TARGETS = [
  { category: "shirt",   label: "Shirts",    target: 4, tip: "1 linen, 1 oxford, 1 camp shirt, 1 smart solid" },
  { category: "tshirt",  label: "T-Shirts",  target: 4, tip: "2 neutral solids, 1 graphic, 1 statement" },
  { category: "pants",   label: "Trousers",  target: 3, tip: "Navy or grey chinos, casual trouser, 1 statement colour" },
  { category: "jeans",   label: "Jeans",     target: 3, tip: "Dark slim, casual wash, 1 statement cut" },
  { category: "shorts",  label: "Shorts",    target: 2, tip: "Neutral + one colour for warmer months" },
  { category: "jacket",  label: "Outerwear", target: 3, tip: "Leather or denim, 1 layering piece, 1 smart option" },
  { category: "shoes",   label: "Shoes",     target: 4, tip: "Clean sneaker, loafer/chelsea, tech sneaker, boots" },
] as const;

function GapsPage() {
  const items = useStore((s) => s.items);
  const profile = useStore((s) => s.profile);

  const ranked = useMemo(() => {
    if (!profile) return [];
    const baselineCount = generateOutfits(items, profile).length;
    return RECOMMENDATIONS.map((rec) => {
      const synthetic: WardrobeItem = {
        ...rec,
        id: `__synthetic__${rec.name}`,
        userId: profile.id,
        createdAt: new Date().toISOString(),
        timesWorn: 0,
        lastWorn: null,
      };
      const newCount = generateOutfits([...items, synthetic], profile).length;
      const unlocked = Math.max(0, newCount - baselineCount);
      return { rec, unlocked };
    }).sort((a, b) => b.unlocked - a.unlocked);
  }, [items, profile]);

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((it) => m.set(it.category, (m.get(it.category) ?? 0) + 1));
    return m;
  }, [items]);

  const expectedCategories = ["shirt", "tshirt", "pants", "jeans", "shoes", "jacket"];

  const capsuleProgress = useMemo(() => {
    const totalTarget = CAPSULE_TARGETS.reduce((s, t) => s + t.target, 0);
    const totalOwned = CAPSULE_TARGETS.reduce((s, t) => {
      return s + Math.min(categoryCounts.get(t.category) ?? 0, t.target);
    }, 0);
    return { totalTarget, totalOwned, pct: Math.round((totalOwned / totalTarget) * 100) };
  }, [categoryCounts]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gap advisor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What you own, where you're light, and what would unlock the most new combinations — tuned to your
          warm medium skin tone.
        </p>
      </div>

      {/* Capsule wardrobe progress */}
      <section className="card-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Capsule wardrobe</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              A curated 23-piece capsule — the base that unlocks the most combinations.
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums">
              {capsuleProgress.totalOwned}
              <span className="text-sm font-normal text-muted-foreground">/{capsuleProgress.totalTarget}</span>
            </p>
            <p className="text-xs text-muted-foreground">{capsuleProgress.pct}% complete</p>
          </div>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${capsuleProgress.pct}%` }}
          />
        </div>

        <div className="mt-4 space-y-2">
          {CAPSULE_TARGETS.map(({ category, label, target, tip }) => {
            const owned = categoryCounts.get(category) ?? 0;
            const met = owned >= target;
            const slots = Array.from({ length: target });
            return (
              <div key={category} className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {met ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{label}</span>
                    <div className="flex gap-0.5">
                      {slots.map((_, i) => (
                        <span
                          key={i}
                          className={`block h-2 w-4 rounded-sm ${i < owned ? "bg-primary" : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {owned}/{target}
                    </span>
                  </div>
                  {!met && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{tip}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Wardrobe coverage</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {expectedCategories.map((c) => {
            const n = categoryCounts.get(c) ?? 0;
            return (
              <div key={c} className="rounded-lg border border-border bg-surface-elevated p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{c}</p>
                <p className={`mt-1 text-2xl font-bold tabular-nums ${n === 0 ? "text-destructive" : ""}`}>{n}</p>
                {n === 0 && <p className="text-[10px] text-destructive">Gap</p>}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Recommended next purchases</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {ranked.map(({ rec, unlocked }) => (
            <div key={rec.name} className="card-surface flex gap-4 p-4">
              <div
                className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: rec.primaryColor + "30" }}
              >
                <ColorSwatch hex={rec.primaryColor} size={36} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{rec.name}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {rec.category} · {rec.colorFamily}
                    </p>
                  </div>
                  {unlocked > 0 && (
                    <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      <TrendingUp className="h-3 w-3" />+{unlocked}
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {RATIONALES[rec.name]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {ranked.every((r) => r.unlocked === 0) && (
        <div className="card-surface flex items-center gap-3 p-5">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            Your wardrobe is well-balanced — these picks would still complement your skin tone but won't
            unlock many new combinations beyond what you already have.
          </p>
        </div>
      )}

      <GapSimulator items={items} profile={profile} />
    </div>
  );
}

// ── Interactive gap simulator ─────────────────────────────────────────────────
const SIM_CATEGORIES = ["shirt", "tshirt", "pants", "jeans", "shorts", "jacket", "shoes"] as const;
const SIM_COLOR_FAMILIES = [
  { value: "dark", label: "Dark / Black" },
  { value: "grey", label: "Grey" },
  { value: "cream", label: "Cream / White" },
  { value: "neutral", label: "Neutral / Beige" },
  { value: "warm-earth", label: "Warm Earth / Olive" },
  { value: "cool-blue", label: "Cool Blue / Navy" },
  { value: "warm-pink", label: "Warm Pink / Burgundy" },
] as const;

function GapSimulator({ items, profile }: { items: WardrobeItem[]; profile: any }) {
  const [cat, setCat] = useState<string>("pants");
  const [cf, setCf] = useState<string>("warm-earth");

  const baseline = useMemo(() => (profile ? generateOutfits(items, profile).length : 0), [items, profile]);

  const simResult = useMemo(() => {
    if (!profile) return null;
    const fake: WardrobeItem = {
      id: "__sim__",
      userId: profile.id,
      name: `Simulated ${cf} ${cat}`,
      category: cat as any,
      primaryColor: { dark: "#111", grey: "#888", cream: "#F5F0E8", neutral: "#C8A97E", "warm-earth": "#7B5B3A", "cool-blue": "#1F2D4A", "warm-pink": "#5A1A2A" }[cf] ?? "#888",
      colorFamily: cf as any,
      pattern: "solid",
      styleTags: ["casual", "smart-casual"],
      occasionTags: ["casual", "smart-casual"],
      season: ["spring", "summer", "fall", "winter"],
      timesWorn: 0,
      createdAt: new Date().toISOString(),
      isStored: false,
    };
    const newCount = generateOutfits([...items, fake], profile).length;
    return { unlocked: Math.max(0, newCount - baseline), total: newCount };
  }, [cat, cf, items, profile, baseline]);

  return (
    <section className="card-surface p-5">
      <h2 className="text-lg font-semibold tracking-tight">Gap simulator</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        See exactly how many new outfits any hypothetical item would unlock before you buy it.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</label>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {SIM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Colour family</label>
          <select
            value={cf}
            onChange={(e) => setCf(e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {SIM_COLOR_FAMILIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>

      {simResult && (
        <div className="mt-4 rounded-lg border border-border bg-surface-elevated p-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 flex-shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: { dark: "#111", grey: "#888", cream: "#F5F0E8", neutral: "#C8A97E", "warm-earth": "#7B5B3A", "cool-blue": "#1F2D4A", "warm-pink": "#5A1A2A" }[cf] ?? "#888" }}
            />
            <div>
              <p className="font-semibold">
                {simResult.unlocked > 0
                  ? `+${simResult.unlocked} new outfits unlocked`
                  : "No new outfits unlocked"}
              </p>
              <p className="text-xs text-muted-foreground">
                {simResult.total} total outfits with this item · {baseline} without
              </p>
            </div>
            {simResult.unlocked > 0 && (
              <div className="ml-auto flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                <TrendingUp className="h-4 w-4" />
                +{simResult.unlocked}
              </div>
            )}
          </div>
          {simResult.unlocked === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Your existing wardrobe already covers this colour + category well. Try a different combination.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
