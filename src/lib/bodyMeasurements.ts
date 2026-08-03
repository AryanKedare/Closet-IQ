import type { BodyDetails } from "./personalColor";

export const WAIST_INCHES_RANGE = { min: 18, max: 80 } as const;
export const FOOT_INCHES_RANGE = { min: 5, max: 18 } as const;

export type ParsedBodyMeasurements = {
  waistInches: number | null;
  shoeSizeInches: number | null;
  error: string | null;
};

function parseOptionalInches(
  raw: string,
  label: string,
  min: number,
  max: number,
): { value: number | null; error: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null, error: null };

  const normalized = trimmed
    .toLowerCase()
    .replace(",", ".")
    .replace(/\s*(?:inches|inch|in|\")\s*$/, "")
    .trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return {
      value: null,
      error: `${label} must be a number in inches, for example 32. Leave it blank to skip it.`,
    };
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < min || value > max) {
    return {
      value: null,
      error: `${label} must be between ${min} and ${max} inches. Leave it blank to skip it.`,
    };
  }

  return { value, error: null };
}

export function parseBodyMeasurements(details: BodyDetails): ParsedBodyMeasurements {
  const waist = parseOptionalInches(
    details.waistInches,
    "Waist circumference",
    WAIST_INCHES_RANGE.min,
    WAIST_INCHES_RANGE.max,
  );
  if (waist.error) {
    return { waistInches: null, shoeSizeInches: null, error: waist.error };
  }

  const foot = parseOptionalInches(
    details.shoeSizeInches,
    "Foot length",
    FOOT_INCHES_RANGE.min,
    FOOT_INCHES_RANGE.max,
  );
  if (foot.error) {
    return { waistInches: waist.value, shoeSizeInches: null, error: foot.error };
  }

  return {
    waistInches: waist.value,
    shoeSizeInches: foot.value,
    error: null,
  };
}
