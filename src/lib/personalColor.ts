export type SkinTone = "very-fair" | "fair" | "medium" | "tan" | "deep-dark";
export type SkinUndertone = "warm" | "cool" | "neutral" | "not-sure";
export type HairColor = "black" | "dark-brown" | "light-medium-brown" | "blonde" | "red-auburn" | "gray-white";
export type EyeColor = "dark-brown" | "light-brown-amber" | "hazel" | "green" | "blue" | "gray";
export type ContrastLevel = "high" | "medium" | "low";

export type PersonalColorAnswers = {
  skinTone: SkinTone | null;
  skinUndertone: SkinUndertone | null;
  hairColor: HairColor | null;
  eyeColor: EyeColor | null;
  contrastLevel: ContrastLevel | null;
};

export type BodyDetails = {
  bodyType: string;
  bodyProportions: string;
  shirtSize: string;
  waistInches: string;
  shoeSizeInches: string;
};

export type PaletteColor = { name: string; hex: string; role: "neutral" | "core" | "accent" };
export type PersonalPalette = {
  name: string;
  description: string;
  colors: PaletteColor[];
};

export const SKIN_TONE_OPTIONS = [
  { value: "very-fair", label: "Very fair", hex: "#F6D7C6" },
  { value: "fair", label: "Fair", hex: "#E8BFA7" },
  { value: "medium", label: "Medium", hex: "#C98F68" },
  { value: "tan", label: "Tan", hex: "#9A6042" },
  { value: "deep-dark", label: "Deep-dark", hex: "#4A2A20" },
] as const;

export const UNDERTONE_OPTIONS = [
  { value: "warm", label: "Golden/peachy (warm)", hex: "#E9A66C" },
  { value: "cool", label: "Pink/rosy (cool)", hex: "#D998A7" },
  { value: "neutral", label: "Olive (neutral)", hex: "#A59A62" },
  { value: "not-sure", label: "Not sure", hex: "#B8AFA8" },
] as const;

export const HAIR_COLOR_OPTIONS = [
  { value: "black", label: "Black", hex: "#171717" },
  { value: "dark-brown", label: "Dark brown", hex: "#4B2E22" },
  { value: "light-medium-brown", label: "Light-medium brown", hex: "#8A6248" },
  { value: "blonde", label: "Blonde", hex: "#D8BC7C" },
  { value: "red-auburn", label: "Red-auburn", hex: "#8C3F28" },
  { value: "gray-white", label: "Gray-white", hex: "#C6C5C2" },
] as const;

export const EYE_COLOR_OPTIONS = [
  { value: "dark-brown", label: "Dark brown", hex: "#3B261F" },
  { value: "light-brown-amber", label: "Light brown-amber", hex: "#A56B34" },
  { value: "hazel", label: "Hazel", hex: "#7B7241" },
  { value: "green", label: "Green", hex: "#55785A" },
  { value: "blue", label: "Blue", hex: "#507DB5" },
  { value: "gray", label: "Gray", hex: "#858D96" },
] as const;

export const CONTRAST_OPTIONS = [
  { value: "high", label: "A lot (high contrast)", hex: "linear-gradient(135deg,#111 0 50%,#fff 50%)" },
  { value: "medium", label: "A little (medium)", hex: "linear-gradient(135deg,#4B3B35 0 50%,#C9A987 50%)" },
  { value: "low", label: "Barely (low contrast)", hex: "linear-gradient(135deg,#BCA99A 0 50%,#D8C9BD 50%)" },
] as const;

const COLORS = {
  white: "#F7F7F5", black: "#191919", grey: "#888888", cream: "#FFFBEA", beige: "#D8D0B6",
  camel: "#C49B68", olive: "#747A46", sage: "#AFC4A9", taupe: "#C6BAAB", darkTaupe: "#948274",
  brown: "#79583F", espresso: "#48240E", rust: "#C9632B", navy: "#17336F", wine: "#74142F",
  forest: "#1E5521", cobalt: "#1856C5", slateBlue: "#718CB5", chartreuse: "#BBAA32", red: "#B7192A",
  babyBlue: "#D7E7FA", dustViolet: "#AEA3C2", butter: "#FFFBD8", dustPink: "#EFCFD0", teal: "#0A7D78",
};

const label = (value: string) => value.replaceAll("-", " ");

function depthScore(answers: PersonalColorAnswers): number {
  const skin = { "very-fair": 0, fair: 1, medium: 2, tan: 3, "deep-dark": 4 }[answers.skinTone ?? "medium"];
  const hair = { black: 4, "dark-brown": 3, "light-medium-brown": 2, blonde: 0, "red-auburn": 2, "gray-white": 0 }[answers.hairColor ?? "dark-brown"];
  const eyes = { "dark-brown": 4, "light-brown-amber": 2, hazel: 2, green: 1, blue: 0, gray: 1 }[answers.eyeColor ?? "dark-brown"];
  return (skin + hair + eyes) / 3;
}

export function isPersonalColorComplete(answers: PersonalColorAnswers): boolean {
  return Boolean(answers.skinTone && answers.skinUndertone && answers.hairColor && answers.eyeColor && answers.contrastLevel);
}

export function skinToneHex(value: SkinTone | null): string {
  return SKIN_TONE_OPTIONS.find((option) => option.value === value)?.hex ?? "#CD9581";
}
export function hairColorHex(value: HairColor | null): string {
  return HAIR_COLOR_OPTIONS.find((option) => option.value === value)?.hex ?? "#20201F";
}
export function eyeColorHex(value: EyeColor | null): string {
  return EYE_COLOR_OPTIONS.find((option) => option.value === value)?.hex ?? "#58453B";
}

export function generatePersonalPalette(answers: PersonalColorAnswers): PersonalPalette {
  const undertone = answers.skinUndertone === "not-sure" || !answers.skinUndertone ? "neutral" : answers.skinUndertone;
  const contrast = answers.contrastLevel ?? "medium";
  const depth = depthScore(answers);
  const isDeep = depth >= 2.7;
  const isLight = depth <= 1.2;

  const neutrals = undertone === "warm"
    ? isDeep ? [["Cream", COLORS.cream], ["Camel", COLORS.camel], ["Espresso", COLORS.espresso]] : [["Cream", COLORS.cream], ["Beige", COLORS.beige], ["Camel", COLORS.camel]]
    : undertone === "cool"
      ? isDeep ? [["White", COLORS.white], ["Navy", COLORS.navy], ["Dark taupe", COLORS.darkTaupe]] : [["White", COLORS.white], ["Grey", COLORS.grey], ["Taupe", COLORS.taupe]]
      : [["Cream", COLORS.cream], ["Taupe", COLORS.taupe], [isDeep ? "Espresso" : "Navy", isDeep ? COLORS.espresso : COLORS.navy]];

  let cores: [string, string][];
  let accents: [string, string][];
  if (undertone === "warm") {
    cores = isLight ? [["Sage", COLORS.sage], ["Camel", COLORS.camel], ["Rust", COLORS.rust]] : [["Olive", COLORS.olive], ["Forest", COLORS.forest], ["Rust", COLORS.rust]];
    accents = [["Teal", COLORS.teal], [contrast === "high" ? "Cobalt" : "Butter", contrast === "high" ? COLORS.cobalt : COLORS.butter], ["Wine", COLORS.wine]];
  } else if (undertone === "cool") {
    cores = isLight ? [["Baby blue", COLORS.babyBlue], ["Dust violet", COLORS.dustViolet], ["Dust pink", COLORS.dustPink]] : [["Navy", COLORS.navy], ["Wine", COLORS.wine], ["Slate blue", COLORS.slateBlue]];
    accents = [[contrast === "high" ? "Cobalt" : "Dust violet", contrast === "high" ? COLORS.cobalt : COLORS.dustViolet], ["Teal", COLORS.teal], ["Red", COLORS.red]];
  } else {
    cores = isLight ? [["Sage", COLORS.sage], ["Slate blue", COLORS.slateBlue], ["Dust pink", COLORS.dustPink]] : [["Olive", COLORS.olive], ["Navy", COLORS.navy], ["Teal", COLORS.teal]];
    accents = [["Wine", COLORS.wine], [contrast === "low" ? "Dust violet" : "Cobalt", contrast === "low" ? COLORS.dustViolet : COLORS.cobalt], ["Rust", COLORS.rust]];
  }

  if (answers.eyeColor === "green" || answers.eyeColor === "hazel") cores[0] = ["Olive", COLORS.olive];
  if (answers.eyeColor === "blue" || answers.eyeColor === "gray") cores[0] = [isLight ? "Baby blue" : "Slate blue", isLight ? COLORS.babyBlue : COLORS.slateBlue];
  if (answers.hairColor === "red-auburn") accents[0] = ["Forest", COLORS.forest];

  const colors: PaletteColor[] = [
    ...neutrals.map(([name, hex]) => ({ name, hex, role: "neutral" as const })),
    ...cores.map(([name, hex]) => ({ name, hex, role: "core" as const })),
    ...accents.map(([name, hex]) => ({ name, hex, role: "accent" as const })),
  ];

  return {
    name: `${contrast === "high" ? "Clear" : contrast === "low" ? "Soft" : "Balanced"} ${undertone === "warm" ? "Warm" : undertone === "cool" ? "Cool" : "Neutral"}`,
    description: `${label(answers.skinTone ?? "medium")} skin with ${label(undertone)} undertones, ${label(contrast)} contrast, and ${isDeep ? "deep" : isLight ? "light" : "medium"} overall colouring.`,
    colors,
  };
}
