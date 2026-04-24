import { hexToHsl, hueDistance, isNeutral } from "./color";
import type { WardrobeItem, Outfit, UserProfile } from "./types";

// ---------- Component scores ----------

function colorHarmonyScore(top: WardrobeItem, bottom: WardrobeItem) {
  const a = hexToHsl(top.primaryColor);
  const b = hexToHsl(bottom.primaryColor);
  const dist = hueDistance(a.h, b.h);
  const oneNeutral = isNeutral(top.primaryColor) || isNeutral(bottom.primaryColor);

  // Scale every output to /40 (component is 40 pts max).
  const scale = 40 / 100;

  if (oneNeutral) return 95 * scale;
  if (dist <= 30) return 85 * scale;          // analogous
  if (dist >= 150 && dist <= 210) return 90 * scale; // complementary
  // clashing: both saturated, mid hue distance
  if (a.s > 25 && b.s > 25) return 50 * scale;
  return 70 * scale;                           // moderate harmony
}

function skinAffinityScore(top: WardrobeItem, bottom: WardrobeItem, profile: UserProfile) {
  // Component is 20 pts max.
  let score = 14; // baseline
  const warmFavored = ["warm-earth", "cream", "dark"];
  const items = [top, bottom];

  for (const it of items) {
    if (warmFavored.includes(it.colorFamily)) score += 4;
    if (it.colorFamily === "cool-blue") score += 2; // navy works well
    const { s, l } = hexToHsl(it.primaryColor);
    if (it.colorFamily === "grey" && s < 8 && l > 60) score -= 2.5; // washed-out grey
  }

  // Use profile.skinToneType to nudge for warm tones — already baked in but log usage.
  if (profile.skinToneType === "warm-medium") {
    // small bonus when both items lean warm
    if (warmFavored.includes(top.colorFamily) && warmFavored.includes(bottom.colorFamily)) score += 1;
  }

  return Math.max(0, Math.min(20, score));
}

function styleScore(top: WardrobeItem, bottom: WardrobeItem) {
  // Component 20 pts max.
  const shared = top.styleTags.filter((t) => bottom.styleTags.includes(t));
  let score = shared.length > 0 ? 20 : 12;

  const isStatement = (it: WardrobeItem) =>
    it.styleTags.includes("statement") || it.styleTags.includes("graphic") || it.pattern === "graphic";
  const isSmartCasual = (it: WardrobeItem) => it.styleTags.includes("smart-casual") || it.styleTags.includes("office");

  if ((isStatement(top) && isSmartCasual(bottom)) || (isStatement(bottom) && isSmartCasual(top))) {
    score -= 20;
  }
  return Math.max(0, score);
}

function patternScore(top: WardrobeItem, bottom: WardrobeItem) {
  // Component 10 pts max. Hard-block on graphic + graphic.
  const a = top.pattern;
  const b = bottom.pattern;
  if (a === "graphic" && b === "graphic") return -1000; // forces 0 / blocked
  if (a === "solid" || b === "solid") return 10;

  if ((a === "stripe" && b === "plaid") || (a === "plaid" && b === "stripe")) return 10 - 25;
  if ((a === "graphic" && b === "plaid") || (a === "plaid" && b === "graphic")) return 10 - 20;
  if ((a === "stripe" && b === "graphic") || (a === "graphic" && b === "stripe")) return 10 - 15;
  if (a === "texture" && b === "texture") return 10 - 10;

  return 8;
}

function shoeHarmonyScore(top: WardrobeItem, bottom: WardrobeItem, shoes: WardrobeItem) {
  // Component 10 pts max.
  const sf = shoes.colorFamily;
  if (sf === "cream" || sf === "grey" || sf === "neutral") return 10;
  if (sf === "dark") {
    return bottom.colorFamily === "dark" || bottom.colorFamily === "warm-earth" ? 10 : 6;
  }
  // bright/statement shoes
  const isQuiet = (it: WardrobeItem) =>
    it.colorFamily === "neutral" ||
    it.colorFamily === "cream" ||
    it.colorFamily === "grey" ||
    it.colorFamily === "dark";
  if (isQuiet(top) && isQuiet(bottom)) return 10;
  return 4;
}

// ---------- Layering ----------

export function canLayer(top: WardrobeItem, jacket: WardrobeItem): { allowed: boolean; penalty: number } {
  if (top.category === "jacket") return { allowed: false, penalty: 0 };
  if (jacket.category !== "jacket") return { allowed: false, penalty: 0 };

  const isLeather = /leather/i.test(jacket.name);
  const isDenim = /denim/i.test(jacket.name);
  const isStructured = /blazer|leather|denim/i.test(jacket.name);

  let penalty = 0;
  if (isLeather) {
    return { allowed: true, penalty: 0 };
  }
  if (isDenim) {
    if (/linen camp/i.test(top.name)) penalty -= 10;
  }
  if (top.pattern === "graphic" && isStructured) penalty -= 15;
  if (top.pattern !== "solid" && jacket.pattern !== "solid") penalty -= 20;

  return { allowed: true, penalty };
}

// ---------- Main scoring ----------

export function scoreOutfit(
  top: WardrobeItem,
  bottom: WardrobeItem,
  shoes: WardrobeItem,
  jacket: WardrobeItem | null,
  profile: UserProfile
): number {
  const colorH = colorHarmonyScore(top, bottom);
  const skin = skinAffinityScore(top, bottom, profile);
  const style = styleScore(top, bottom);
  const pat = patternScore(top, bottom);
  if (pat <= -500) return 0; // blocked
  const shoe = shoeHarmonyScore(top, bottom, shoes);

  let total = colorH + skin + style + pat + shoe;

  if (jacket) {
    const layer = canLayer(top, jacket);
    if (!layer.allowed) return 0;
    total += layer.penalty;
    // small jacket-shoe harmony nudge
    if (jacket.colorFamily === shoes.colorFamily) total += 2;
  }

  return Math.max(0, Math.min(100, Math.round(total)));
}

// ---------- Combination engine ----------

export function generateOutfits(items: WardrobeItem[], profile: UserProfile) {
  const tops = items.filter((i) => i.category === "shirt" || i.category === "tshirt");
  const bottoms = items.filter((i) => ["pants", "jeans", "shorts"].includes(i.category));
  const shoesArr = items.filter((i) => i.category === "shoes");
  const jackets = items.filter((i) => i.category === "jacket");

  const results: Array<{
    topId: string;
    bottomId: string;
    shoesId: string;
    jacketId: string | null;
    score: number;
    occasionTags: string[];
  }> = [];

  for (const t of tops) {
    for (const b of bottoms) {
      for (const s of shoesArr) {
        const baseScore = scoreOutfit(t, b, s, null, profile);
        if (baseScore >= 60) {
          results.push({
            topId: t.id,
            bottomId: b.id,
            shoesId: s.id,
            jacketId: null,
            score: baseScore,
            occasionTags: intersectTags([t.occasionTags, b.occasionTags, s.occasionTags]),
          });
        }
        // Try each jacket as a separate layered outfit
        for (const j of jackets) {
          const layered = scoreOutfit(t, b, s, j, profile);
          if (layered >= 60) {
            results.push({
              topId: t.id,
              bottomId: b.id,
              shoesId: s.id,
              jacketId: j.id,
              score: layered,
              occasionTags: intersectTags([t.occasionTags, b.occasionTags, s.occasionTags, j.occasionTags]),
            });
          }
        }
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

function intersectTags(lists: string[][]) {
  if (lists.length === 0) return [];
  const sets = lists.map((l) => new Set(l));
  const first = lists[0];
  const out: string[] = [];
  for (const tag of first) {
    if (sets.every((s) => s.has(tag))) out.push(tag);
  }
  // If nothing overlaps, return union (so filters still work)
  if (out.length === 0) {
    const union = new Set<string>();
    lists.forEach((l) => l.forEach((t) => union.add(t)));
    return Array.from(union);
  }
  return out;
}
