// Live authenticated user id. Existing store queries import this binding.
export let USER_ID = "";

export function setUserId(userId: string | null) {
  USER_ID = userId ?? "";
}

export const DEFAULT_PROFILE = {
  skinToneHex: "#CC9674",
  eyeColorHex: "#1F1919",
  hairColorHex: "#0A0B0B",
  skinToneType: "warm-medium",
};

export const CATEGORIES = [
  "shirt",
  "tshirt",
  "pants",
  "jeans",
  "shorts",
  "jacket",
  "shoes",
  "accessory",
] as const;

export const COLOR_FAMILIES = [
  "neutral",
  "warm-earth",
  "cool-blue",
  "warm-pink",
  "dark",
  "grey",
  "cream",
] as const;

export const PATTERNS = ["solid", "stripe", "plaid", "graphic", "texture"] as const;

export const STYLE_TAGS = [
  "casual",
  "smart-casual",
  "office",
  "minimalist",
  "statement",
  "graphic",
  "street",
  "sporty",
  "retro",
  "date-night",
];

export const OCCASION_TAGS = [
  "casual",
  "smart-casual",
  "office",
  "date-night",
  "going-out",
  "weekend",
];

export const SEASONS = ["spring", "summer", "fall", "winter"];

export const OCCASION_FILTERS = [
  "All",
  "casual",
  "smart-casual",
  "office",
  "date-night",
  "going-out",
  "weekend",
] as const;
