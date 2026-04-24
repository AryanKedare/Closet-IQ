import { hexToHsl, hueDistance } from "./color";
import type { WardrobeItem, UserProfile } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Classification helpers
// ─────────────────────────────────────────────────────────────────────────────

const navy = (i: WardrobeItem) =>
  i.colorFamily === "cool-blue" && hexToHsl(i.primaryColor).l < 38;

const veryDark = (i: WardrobeItem) => {
  const { l, s } = hexToHsl(i.primaryColor);
  return l < 18 && s < 25; // near-black
};

const brown = (i: WardrobeItem) => {
  if (i.colorFamily !== "warm-earth") return false;
  const { h, l } = hexToHsl(i.primaryColor);
  return h < 52 && l < 58; // medium-dark brown, not olive/khaki
};

const earth = (i: WardrobeItem) => i.colorFamily === "warm-earth";

const coolBlueNonNavy = (i: WardrobeItem) =>
  i.colorFamily === "cool-blue" && !navy(i); // light/medium blue

const burgundy = (i: WardrobeItem) => {
  if (i.colorFamily !== "warm-pink") return false;
  const { s, l } = hexToHsl(i.primaryColor);
  return l < 48 && s < 72; // dark muted pink = burgundy/wine, behaves as neutral
};

const warmStatement = (i: WardrobeItem): boolean => {
  if (burgundy(i)) return false; // burgundy is a neutral
  if (i.colorFamily === "warm-pink") {
    const { s, l } = hexToHsl(i.primaryColor);
    return s > 60 || l > 50; // bright pink, fuchsia, red
  }
  if (i.colorFamily === "warm-earth") {
    const { h, s, l } = hexToHsl(i.primaryColor);
    return h >= 15 && h <= 45 && s > 55 && l > 38; // orange
  }
  return false;
};

// Neutrals: black, white, cream, grey, beige, navy, burgundy
const neutralItem = (i: WardrobeItem) =>
  ["dark", "grey", "cream", "neutral"].includes(i.colorFamily) ||
  navy(i) ||
  burgundy(i);

// Bottom type helpers
const shortsItem = (i: WardrobeItem) => i.category === "shorts";
const cargo = (i: WardrobeItem) =>
  /cargo|parachute/i.test(i.name) || i.styleTags.includes("utility");
const chinos = (i: WardrobeItem) =>
  i.category === "pants" && !/jogger|track|cargo|parachute/i.test(i.name);
const darkJeans = (i: WardrobeItem) =>
  i.category === "jeans" && hexToHsl(i.primaryColor).l < 45;
const elevatedBottom = (i: WardrobeItem) => chinos(i) || darkJeans(i);

// Top type helpers
const graphicItem = (i: WardrobeItem) => i.pattern === "graphic";
const linenItem = (i: WardrobeItem) => /linen|seersucker/i.test(i.name);
const campShirtItem = (i: WardrobeItem) =>
  /camp|seersucker|resort/i.test(i.name) ||
  (/linen/i.test(i.name) && i.category === "shirt") ||
  (/striped/i.test(i.name) && i.category === "shirt") ||
  i.styleTags.includes("resort");
const formalShirt = (i: WardrobeItem) =>
  i.category === "shirt" &&
  i.styleTags.includes("smart-casual") &&
  !campShirtItem(i) &&
  i.pattern === "solid"; // oxford/structured collared shirt
const collaredTop = (i: WardrobeItem) =>
  i.category === "shirt" || /polo/i.test(i.name);

// Jacket helpers
const leatherJacket = (j: WardrobeItem) => /leather/i.test(j.name);
const denimJacket = (j: WardrobeItem) => /denim/i.test(j.name);

// Shoe helpers
const techSneaker = (s: WardrobeItem) =>
  /1906|nb_/i.test(s.name) || s.styleTags.includes("techy");
const cleanSneaker = (s: WardrobeItem) =>
  /killshot|dunk/i.test(s.name) ||
  (/palermo/i.test(s.name)) || // Puma Palermos are low-profile retro
  (s.styleTags.includes("minimal") && !techSneaker(s));
const slideItem = (s: WardrobeItem) => /croc|slide/i.test(s.name);
const loaferChelsea = (s: WardrobeItem) => /loafer|chelsea|boot/i.test(s.name);

// ─────────────────────────────────────────────────────────────────────────────
// Hard blocks — return true = this outfit combination is never allowed
// ─────────────────────────────────────────────────────────────────────────────

function hardBlock(
  top: WardrobeItem,
  bottom: WardrobeItem,
  shoes: WardrobeItem,
  jacket: WardrobeItem | null
): boolean {
  // ── Color: navy + black reads muddy and flat
  if ((navy(top) && veryDark(bottom)) || (navy(bottom) && veryDark(top))) return true;
  // ── Color: navy + brown looks dated
  if ((navy(top) && brown(bottom)) || (navy(bottom) && brown(top))) return true;
  // ── Color: earth tone + cool blue (non-navy) is a clash unless very muted
  if (earth(top) && coolBlueNonNavy(bottom)) {
    if (hexToHsl(bottom.primaryColor).s > 30) return true;
  }
  if (earth(bottom) && coolBlueNonNavy(top)) {
    if (hexToHsl(top.primaryColor).s > 30) return true;
  }

  // ── Pattern: graphic + any non-solid = always blocked
  const tp = top.pattern, bp = bottom.pattern;
  if (tp === "graphic" && bp !== "solid") return true;
  if (bp === "graphic" && tp !== "solid") return true;
  // ── Pattern: stripe + plaid = hard clash
  if ((tp === "stripe" && bp === "plaid") || (tp === "plaid" && bp === "stripe")) return true;

  // ── Graphic tee must be anchored by plain casual bottoms — never chinos/trousers
  if (graphicItem(top) && chinos(bottom)) return true;

  // ── Shorts: leather jacket over shorts is always blocked
  if (shortsItem(bottom) && jacket && leatherJacket(jacket)) return true;
  // ── Shorts: formal/oxford shirt with shorts is always blocked
  if (shortsItem(bottom) && formalShirt(top)) return true;

  // ── Denim-on-denim: same lightness shade = blocked
  if (jacket && denimJacket(jacket) && bottom.category === "jeans") {
    const jl = hexToHsl(jacket.primaryColor).l;
    const bl = hexToHsl(bottom.primaryColor).l;
    if (Math.abs(jl - bl) < 15) return true;
  }

  // ── Technical sneakers blocked when outfit is clearly elevated
  if (techSneaker(shoes)) {
    const clearlyElevated = (collaredTop(top) || linenItem(top)) && elevatedBottom(bottom);
    if (clearlyElevated) return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Score components — must sum to 100 maximum
// colorScore(40) + skinScore(20) + patternScore(10) + shoeScore(15) + styleScore(15) = 100
// ─────────────────────────────────────────────────────────────────────────────

function colorScore(top: WardrobeItem, bottom: WardrobeItem): number {
  const MAX = 40;

  // Warm statement colors require a neutral anchor (everything else must be neutral)
  if (warmStatement(top) && !neutralItem(bottom)) return Math.round(MAX * 0.35);
  if (warmStatement(bottom) && !neutralItem(top)) return Math.round(MAX * 0.35);

  // Both neutrals = elevated, intentional, maximum harmony
  if (neutralItem(top) && neutralItem(bottom)) return MAX;

  // One neutral + one non-neutral = safest and most wearable formula
  if (neutralItem(top) || neutralItem(bottom)) return Math.round(MAX * 0.92);

  // Two earth tones = analogous, always work together
  if (earth(top) && earth(bottom)) return Math.round(MAX * 0.9);

  // Monochromatic: same color family, different shades = intentional
  if (top.colorFamily === bottom.colorFamily) {
    const ld = Math.abs(hexToHsl(top.primaryColor).l - hexToHsl(bottom.primaryColor).l);
    return ld > 15 ? Math.round(MAX * 0.88) : Math.round(MAX * 0.62); // too similar = lower
  }

  // Generic hue math for everything else
  const ah = hexToHsl(top.primaryColor), bh = hexToHsl(bottom.primaryColor);
  const dist = hueDistance(ah.h, bh.h);
  if (dist >= 150 && dist <= 210) return Math.round(MAX * 0.85); // complementary
  if (dist <= 30) return Math.round(MAX * 0.80); // analogous
  if (ah.s > 30 && bh.s > 30) return Math.round(MAX * 0.48); // both saturated = clash
  return Math.round(MAX * 0.68); // moderate
}

function skinScore(top: WardrobeItem, bottom: WardrobeItem, profile: UserProfile): number {
  const MAX = 20;
  let score = 13; // baseline

  // Top is near the face — dominant factor for skin affinity
  if (neutralItem(top) && top.colorFamily !== "grey") score += 3;
  if (top.colorFamily === "cream") score += 3;
  if (top.colorFamily === "dark") score += 2;
  if (top.colorFamily === "warm-earth") score += 3;
  if (navy(top)) score += 2;
  if (burgundy(top)) score += 2;

  // Washed-out grey as top = penalty (washes out warm skin)
  if (top.colorFamily === "grey") {
    const { s, l } = hexToHsl(top.primaryColor);
    if (l > 65 && s < 12) score -= 3;
  }
  // Cool pastel blue as top = penalty
  if (coolBlueNonNavy(top) && hexToHsl(top.primaryColor).l > 55) score -= 2;

  // Warm-medium skin type specific bonuses (profile.skinToneType)
  if (profile.skinToneType === "warm-medium") {
    if (earth(top) && earth(bottom)) score += 1; // both warm earth = cohesion
    if (warmStatement(top)) score -= 1; // warm statement ok but less optimal vs neutrals
  }

  return Math.max(0, Math.min(MAX, score));
}

function patternScore(top: WardrobeItem, bottom: WardrobeItem): number {
  const MAX = 10;
  const tp = top.pattern, bp = bottom.pattern;

  // Solid + anything = always full marks
  if (tp === "solid" || bp === "solid") return MAX;

  // Remaining valid combos (graphic+graphic, graphic+non-solid, stripe+plaid already blocked)
  if (tp === "stripe" && bp === "stripe") return 6;
  if ((tp === "stripe" && bp === "texture") || (tp === "texture" && bp === "stripe")) return 7;
  if (tp === "texture" && bp === "texture") return 5;

  return 6; // any other non-blocked combo
}

function shoeScore(top: WardrobeItem, bottom: WardrobeItem, shoes: WardrobeItem): number {
  const MAX = 15;
  const elevated = elevatedBottom(bottom) || collaredTop(top) || linenItem(top);
  const darkBottom = hexToHsl(bottom.primaryColor).l < 40;

  // Clean minimal sneakers — most versatile, best contrast at ankle with dark bottoms
  if (cleanSneaker(shoes)) {
    return darkBottom ? MAX : Math.round(MAX * 0.92);
  }

  // Technical/chunky sneakers — casual and streetwear only
  if (techSneaker(shoes)) {
    return elevated ? 0 : Math.round(MAX * 0.75);
  }

  // Loafers / chelsea boots — elevate any outfit, correct for date-night
  if (loaferChelsea(shoes)) {
    return elevated ? MAX : Math.round(MAX * 0.85);
  }

  // Slides / crocs — casual and beach only
  if (slideItem(shoes)) {
    const beachy = top.occasionTags.includes("beach") || bottom.occasionTags.includes("beach");
    return elevated ? Math.round(MAX * 0.45) : (beachy ? Math.round(MAX * 0.87) : Math.round(MAX * 0.62));
  }

  // Statement shoes (e.g. red Pumas): need quiet outfit to carry them
  if (warmStatement(shoes as WardrobeItem)) {
    return neutralItem(top) && neutralItem(bottom) ? Math.round(MAX * 0.88) : Math.round(MAX * 0.55);
  }

  // Default: shoe color harmony
  const sf = shoes.colorFamily;
  if (sf === "cream" || sf === "neutral" || sf === "grey") return Math.round(MAX * 0.87);
  if (sf === "dark") return Math.round(MAX * 0.82);
  return Math.round(MAX * 0.65);
}

function styleScore(
  top: WardrobeItem,
  bottom: WardrobeItem,
  shoes: WardrobeItem,
  jacket: WardrobeItem | null
): number {
  const MAX = 15;
  let score = 7; // baseline

  // Linen signals intentional dressing — always boosts occasion readability
  if (linenItem(top) || linenItem(bottom)) score += 2;

  // Tonal / monochromatic = trending and intentional
  if (top.colorFamily === bottom.colorFamily) score += 2;

  // Quiet luxury: both neutrals, no graphic, minimal aesthetic
  if (neutralItem(top) && neutralItem(bottom) && !graphicItem(top)) score += 2;

  // Optimal warm-skin formula: dark/navy bottom + light/cream top + clean shoes
  const topLight = hexToHsl(top.primaryColor).l > 68;
  const botDark = hexToHsl(bottom.primaryColor).l < 40;
  if (topLight && botDark && (cleanSneaker(shoes) || loaferChelsea(shoes))) score += 3;

  // Leather jacket elevates any outfit it's added to
  if (jacket && leatherJacket(jacket) && !shortsItem(bottom) && !cargo(bottom)) score += 2;

  // Style tag coherence
  const shared = top.styleTags.filter((t) => bottom.styleTags.includes(t));
  if (shared.length > 0) score += Math.min(shared.length, 2);

  // Graphic tee correctly anchored: neutral bottom = intentional, high coherence
  if (graphicItem(top) && neutralItem(bottom)) score += 1;

  // Mismatched formality penalty: smart-casual top + street/utility bottom
  if (
    (collaredTop(top) || top.styleTags.includes("smart-casual")) &&
    (bottom.styleTags.includes("street") || cargo(bottom))
  ) score -= 3;

  // Camp shirt moved to smart-casual territory with chinos (2024 trend)
  if (campShirtItem(top) && chinos(bottom) && (cleanSneaker(shoes) || loaferChelsea(shoes))) score += 1;

  return Math.max(0, Math.min(MAX, score));
}

// ─────────────────────────────────────────────────────────────────────────────
// Layering rules
// ─────────────────────────────────────────────────────────────────────────────

export function canLayer(
  top: WardrobeItem,
  jacket: WardrobeItem
): { allowed: boolean; penalty: number } {
  if (top.category === "jacket") return { allowed: false, penalty: 0 };
  if (jacket.category !== "jacket") return { allowed: false, penalty: 0 };

  let penalty = 0;

  if (leatherJacket(jacket)) {
    // Leather jacket pairs correctly with plain tees, camp shirts, oxford shirts
    // Penalise heavy graphic/statement tops under leather
    if (graphicItem(top) && top.styleTags.includes("statement")) penalty -= 8;
    if (top.pattern !== "solid" && top.pattern !== "graphic") penalty -= 5;
  }

  if (denimJacket(jacket)) {
    // Denim jacket is casual only — penalise non-solid tops
    if (top.pattern !== "solid") penalty -= 5;
    // Penalise elevated/smart-casual tops under denim jacket
    if (formalShirt(top)) penalty -= 8;
  }

  return { allowed: true, penalty };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main scorer
// ─────────────────────────────────────────────────────────────────────────────

export function scoreOutfit(
  top: WardrobeItem,
  bottom: WardrobeItem,
  shoes: WardrobeItem,
  jacket: WardrobeItem | null,
  profile: UserProfile
): number {
  if (hardBlock(top, bottom, shoes, jacket)) return 0;

  const c = colorScore(top, bottom);
  if (c === 0) return 0;

  const sk = skinScore(top, bottom, profile);
  const p = patternScore(top, bottom);
  const sh = shoeScore(top, bottom, shoes);
  const st = styleScore(top, bottom, shoes, jacket);

  let total = c + sk + p + sh + st;

  if (jacket) {
    const layer = canLayer(top, jacket);
    if (!layer.allowed) return 0;
    total += layer.penalty;
    // Minor harmony bonuses between jacket and rest of outfit
    if (jacket.colorFamily === bottom.colorFamily) total += 2;
    if (jacket.colorFamily === shoes.colorFamily) total += 1;
  }

  return Math.max(0, Math.min(100, Math.round(total)));
}

// ─────────────────────────────────────────────────────────────────────────────
// Occasion derivation — derived from outfit composition, not just tag intersection
// ─────────────────────────────────────────────────────────────────────────────

function deriveOccasions(
  top: WardrobeItem,
  bottom: WardrobeItem,
  shoes: WardrobeItem,
  jacket: WardrobeItem | null
): string[] {
  const tags = new Set<string>(["casual", "weekend"]);

  const hasShorts = shortsItem(bottom);
  const hasGraphic = graphicItem(top);
  const hasCargo = cargo(bottom);
  const hasTech = techSneaker(shoes);
  const hasSlide = slideItem(shoes);
  const hasLeather = jacket && leatherJacket(jacket);
  const hasDenim = jacket && denimJacket(jacket);
  const hasElevated = elevatedBottom(bottom);
  const hasCollared = collaredTop(top);
  const hasLinen = linenItem(top) || linenItem(bottom);
  const hasCleanShoe = cleanSneaker(shoes) || loaferChelsea(shoes);
  const hasPlaidTop = top.pattern === "plaid";

  // Athletic context
  if (
    top.styleTags.includes("athletic") ||
    bottom.styleTags.includes("athletic") ||
    top.occasionTags.includes("sport")
  ) {
    tags.add("sport");
  }

  // SMART-CASUAL: at least one elevated piece + no blockers
  if (!hasShorts && !hasGraphic && !hasCargo && !hasTech && !hasSlide && !hasPlaidTop) {
    if (hasElevated || hasCollared || hasLinen) {
      tags.add("smart-casual");
    }
  }

  // DATE-NIGHT: elevated bottom + structured top + clean shoes
  if (hasElevated && !hasShorts && !hasGraphic && !hasCargo && !hasTech && !hasSlide) {
    if (hasCleanShoe && (hasCollared || hasLinen || hasLeather)) {
      tags.add("date-night");
    }
  }

  // GOING-OUT: leather jacket combination with dark/statement outfit
  if (hasLeather && !hasShorts) {
    tags.add("going-out");
    if (hasElevated) tags.add("date-night");
  }

  // Denim jacket = casual/weekend only — strip elevated occasions
  if (hasDenim) {
    tags.delete("smart-casual");
    tags.delete("date-night");
    tags.delete("going-out");
  }

  // Plaid shirt = casual only
  if (hasPlaidTop) {
    tags.delete("smart-casual");
    tags.delete("date-night");
    tags.delete("going-out");
  }

  // Shorts = strictly casual + weekend (never elevated)
  if (hasShorts) {
    tags.delete("smart-casual");
    tags.delete("date-night");
    tags.delete("going-out");
  }

  // Cargo = strictly casual/streetwear
  if (hasCargo) {
    tags.delete("smart-casual");
    tags.delete("date-night");
    tags.delete("going-out");
  }

  // Remove sport from elevated occasions
  if (tags.has("smart-casual") || tags.has("date-night")) {
    tags.delete("sport");
  }

  return Array.from(tags);
}

// ─────────────────────────────────────────────────────────────────────────────
// Combination engine
// ─────────────────────────────────────────────────────────────────────────────

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
        const base = scoreOutfit(t, b, s, null, profile);
        if (base >= 55) {
          results.push({
            topId: t.id,
            bottomId: b.id,
            shoesId: s.id,
            jacketId: null,
            score: base,
            occasionTags: deriveOccasions(t, b, s, null),
          });
        }
        for (const j of jackets) {
          const layered = scoreOutfit(t, b, s, j, profile);
          if (layered >= 55) {
            results.push({
              topId: t.id,
              bottomId: b.id,
              shoesId: s.id,
              jacketId: j.id,
              score: layered,
              occasionTags: deriveOccasions(t, b, s, j),
            });
          }
        }
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
