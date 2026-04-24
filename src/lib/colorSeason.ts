import { hexToHsl } from "./color";

export type ColorSeason = "spring" | "summer" | "autumn" | "winter";

export interface SeasonInfo {
  season: ColorSeason;
  label: string;
  emoji: string;
  undertone: string;
  description: string;
  bestColorHexes: string[];
  bestColorNames: string[];
  avoidNote: string;
  neutrals: string;
}

export const SEASON_DATA: Record<ColorSeason, Omit<SeasonInfo, "season">> = {
  spring: {
    label: "Spring",
    emoji: "🌸",
    undertone: "Warm + Light",
    description: "Clear, warm, and light. Your palette shines in sunshine-inspired tones.",
    bestColorHexes: ["#E8855A", "#F0C050", "#6DB87C", "#D4A97E", "#E85F5F"],
    bestColorNames: ["Coral", "Golden Yellow", "Apple Green", "Warm Camel", "Warm Red"],
    avoidNote: "Avoid cool grey, pure navy, and black — they can look too harsh against your light warmth.",
    neutrals: "Camel, tan, warm beige, ivory",
  },
  summer: {
    label: "Summer",
    emoji: "☁️",
    undertone: "Cool + Light",
    description: "Soft, cool, and dusty. Your palette evokes lavender fields and hazy afternoons.",
    bestColorHexes: ["#C9B1BD", "#8DAACD", "#B784A7", "#7FA597", "#C0B2C8"],
    bestColorNames: ["Dusty Rose", "Powder Blue", "Mauve", "Sage Green", "Lavender"],
    avoidNote: "Avoid orange, warm yellow, and bright warm colours — they clash with your cool undertone.",
    neutrals: "Soft white, dove grey, blue-grey, cool taupe",
  },
  autumn: {
    label: "Autumn",
    emoji: "🍂",
    undertone: "Warm + Deep",
    description: "Rich, warm, and earthy. Your palette resonates with autumn leaves and warm spices.",
    bestColorHexes: ["#C85820", "#6B7C3C", "#B5451B", "#C8960A", "#7B4B2A"],
    bestColorNames: ["Rust", "Olive", "Terracotta", "Mustard", "Chocolate Brown"],
    avoidNote: "Swap pure black for dark brown. Avoid cool pink, icy colours, and pure white — try ivory instead.",
    neutrals: "Camel, chocolate brown, dark olive, warm taupe",
  },
  winter: {
    label: "Winter",
    emoji: "❄️",
    undertone: "Cool + Deep",
    description: "Clear, cool, and high-contrast. Bold jewel tones and crisp whites are your power moves.",
    bestColorHexes: ["#F8F8F8", "#111111", "#1A3A7B", "#0D5E40", "#C2185B"],
    bestColorNames: ["True White", "Black", "Royal Blue", "Emerald", "Fuchsia"],
    avoidNote: "Avoid warm browns, mustard, orange, and earthy tones — they dull your natural contrast.",
    neutrals: "True white, black, charcoal grey, cool navy",
  },
};

export function detectColorSeason(skinHex: string, _eyeHex: string, hairHex: string): ColorSeason {
  const skin = hexToHsl(skinHex);
  const hair = hexToHsl(hairHex);

  // Warm skin: hue sits in orange/yellow range with meaningful saturation
  const skinWarm = skin.h >= 12 && skin.h <= 55 && skin.s > 12;

  // Overall depth uses average of skin + hair lightness so dark hair pushes towards deep
  const overallDepth = (skin.l + hair.l) / 2;
  const isDeep = overallDepth < 50;

  if (skinWarm && !isDeep) return "spring";
  if (!skinWarm && !isDeep) return "summer";
  if (skinWarm && isDeep) return "autumn";
  return "winter";
}

export function getSeasonInfo(season: ColorSeason): SeasonInfo {
  return { season, ...SEASON_DATA[season] };
}

// ── Style Archetypes ─────────────────────────────────────────────────────────

export type StyleArchetype =
  | "Classic"
  | "Minimalist"
  | "Streetwear"
  | "Edgy"
  | "Preppy"
  | "Romantic"
  | "Bohemian"
  | "Eclectic";

export const ARCHETYPE_INFO: Record<StyleArchetype, { description: string; emoji: string }> = {
  Classic: { emoji: "🎩", description: "Timeless, tailored, and polished. You invest in pieces that never go out of style." },
  Minimalist: { emoji: "◻️", description: "Clean lines, capsule wardrobe, quality over quantity. Less is more." },
  Streetwear: { emoji: "🧢", description: "Urban, relaxed, and effortlessly cool. Comfort meets culture." },
  Edgy: { emoji: "⚡", description: "Bold, dark, and unconventional. You dress to make a statement." },
  Preppy: { emoji: "📚", description: "Structured, collegiate, and polished. Smart but approachable." },
  Romantic: { emoji: "🌹", description: "Soft, elegant, and thoughtfully dressed for every occasion." },
  Bohemian: { emoji: "🪴", description: "Eclectic, layered, and earthy. Free-spirited and creative." },
  Eclectic: { emoji: "🎨", description: "A unique blend of multiple styles. You write your own rules." },
};

const TAG_ARCHETYPE_WEIGHTS: Record<string, Partial<Record<StyleArchetype, number>>> = {
  casual:       { Streetwear: 0.4, Bohemian: 0.4, Minimalist: 0.2 },
  "smart-casual": { Classic: 0.5, Preppy: 0.5 },
  office:       { Classic: 0.6, Preppy: 0.4 },
  minimalist:   { Minimalist: 1.0 },
  statement:    { Edgy: 0.5, Eclectic: 0.5 },
  graphic:      { Streetwear: 0.8, Edgy: 0.2 },
  street:       { Streetwear: 1.0 },
  sporty:       { Streetwear: 0.5, Minimalist: 0.5 },
  retro:        { Preppy: 0.4, Edgy: 0.4, Eclectic: 0.2 },
  "date-night": { Romantic: 0.7, Edgy: 0.3 },
};

export function detectArchetypes(stylePreferences: string[]): StyleArchetype[] {
  const scores: Partial<Record<StyleArchetype, number>> = {};
  for (const tag of stylePreferences) {
    const weights = TAG_ARCHETYPE_WEIGHTS[tag];
    if (!weights) continue;
    for (const [arch, w] of Object.entries(weights) as [StyleArchetype, number][]) {
      scores[arch] = (scores[arch] ?? 0) + w;
    }
  }
  const sorted = (Object.entries(scores) as [StyleArchetype, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([a]) => a);
  if (sorted.length === 0) return ["Eclectic"];
  return sorted.slice(0, 2);
}
