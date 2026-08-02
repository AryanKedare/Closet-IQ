import {
  CATEGORIES,
  COLOR_FAMILIES,
  OCCASION_TAGS,
  PATTERNS,
  SEASONS,
  STYLE_TAGS,
} from "./constants";
import type { Category, ColorFamily, Pattern } from "./types";

const HEX_RE = /^#[0-9A-F]{6}$/;

export type WardrobeItemAnalysis = {
  name: string;
  brand: string;
  category: Category;
  subCategory: string;
  primaryColor: string;
  secondaryColor: string;
  colorFamily: ColorFamily;
  pattern: Pattern;
  styleTags: string[];
  occasionTags: string[];
  season: string[];
  confidence: number;
};

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[<>]/g, "").trim().slice(0, maxLength);
}

function enumValue<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
): T[number] {
  return typeof value === "string" && allowed.includes(value) ? (value as T[number]) : fallback;
}

function enumList(value: unknown, allowed: readonly string[], max: number): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && allowed.includes(item)))]
    .slice(0, max);
}

function hexColor(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toUpperCase();
  return HEX_RE.test(normalized) ? normalized : fallback;
}

export function normalizeWardrobeItemAnalysis(raw: unknown): WardrobeItemAnalysis {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const confidence = typeof value.confidence === "number" ? value.confidence : Number(value.confidence);

  return {
    name: cleanText(value.name, 80) || "Clothing item",
    brand: cleanText(value.brand, 60),
    category: enumValue(value.category, CATEGORIES, "shirt"),
    subCategory: cleanText(value.subCategory, 40),
    primaryColor: hexColor(value.primaryColor, "#808080"),
    secondaryColor: hexColor(value.secondaryColor),
    colorFamily: enumValue(value.colorFamily, COLOR_FAMILIES, "neutral"),
    pattern: enumValue(value.pattern, PATTERNS, "solid"),
    styleTags: enumList(value.styleTags, STYLE_TAGS, 5),
    occasionTags: enumList(value.occasionTags, OCCASION_TAGS, 5),
    season: enumList(value.season, SEASONS, 4),
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0,
  };
}
