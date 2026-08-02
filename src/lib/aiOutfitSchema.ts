import { OCCASION_TAGS } from "./constants";

export type AiOutfitCandidate = {
  key: string;
  topId: string;
  bottomId: string;
  shoesId: string;
  jacketId: string | null;
  localScore: number;
  occasionTags: string[];
};

export type AiSelectedOutfit = AiOutfitCandidate & {
  name: string;
  score: number;
  explanation: string;
};

function cleanText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  return cleaned.slice(0, maxLength) || fallback;
}

function cleanOccasions(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const allowed = new Set<string>(OCCASION_TAGS);
  const filtered = [...new Set(value.filter((tag): tag is string => typeof tag === "string" && allowed.has(tag)))];
  return filtered.length > 0 ? filtered.slice(0, 5) : fallback;
}

function numericScore(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

export function normalizeAiOutfitSelection(
  raw: unknown,
  candidates: AiOutfitCandidate[],
  limit = 24,
): AiSelectedOutfit[] {
  const byKey = new Map(candidates.map((candidate) => [candidate.key, candidate]));
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const rows = Array.isArray(value.outfits) ? value.outfits : [];
  const seen = new Set<string>();
  const selected: AiSelectedOutfit[] = [];

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const key = typeof record.candidateKey === "string" ? record.candidateKey : "";
    const candidate = byKey.get(key);
    if (!candidate || seen.has(key)) continue;
    seen.add(key);

    const aiScore = numericScore(record.score, candidate.localScore);
    const blendedScore = Math.round(candidate.localScore * 0.65 + aiScore * 0.35);

    selected.push({
      ...candidate,
      name: cleanText(record.name, "AI-curated outfit", 80),
      score: Math.max(0, Math.min(100, blendedScore)),
      occasionTags: cleanOccasions(record.occasionTags, candidate.occasionTags),
      explanation: cleanText(
        record.explanation,
        "Selected from your valid wardrobe combinations by the AI stylist.",
        420,
      ),
    });

    if (selected.length >= limit) break;
  }

  return selected;
}
