import type { BodyDetails } from "./personalColor";

export const WRIST_INCHES_RANGE = { min: 3, max: 15 } as const;
export const FOOT_INCHES_RANGE = { min: 5, max: 18 } as const;

export type ParsedBodyMeasurements = {
  wristInches: number | null;
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
      error: `${label} must be a number in inches, for example 6.8. Leave it blank to skip it.`,
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
  const wrist = parseOptionalInches(
    details.wristInches,
    "Wrist circumference",
    WRIST_INCHES_RANGE.min,
    WRIST_INCHES_RANGE.max,
  );
  if (wrist.error) {
    return { wristInches: null, shoeSizeInches: null, error: wrist.error };
  }

  const foot = parseOptionalInches(
    details.shoeSizeInches,
    "Foot length",
    FOOT_INCHES_RANGE.min,
    FOOT_INCHES_RANGE.max,
  );
  if (foot.error) {
    return { wristInches: wrist.value, shoeSizeInches: null, error: foot.error };
  }

  return {
    wristInches: wrist.value,
    shoeSizeInches: foot.value,
    error: null,
  };
}
