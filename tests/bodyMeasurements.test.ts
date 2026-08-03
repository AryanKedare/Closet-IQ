import assert from "node:assert/strict";
import test from "node:test";
import { parseBodyMeasurements } from "../src/lib/bodyMeasurements.ts";

const base = {
  bodyType: "",
  bodyProportions: "",
  shirtSize: "",
  wristInches: "",
  shoeSizeInches: "",
};

test("blank optional measurements are stored as null", () => {
  assert.deepEqual(parseBodyMeasurements(base), {
    waistInches: null,
    shoeSizeInches: null,
    error: null,
  });
});

test("accepts waist and foot measurements with inch suffixes", () => {
  assert.deepEqual(
    parseBodyMeasurements({
      ...base,
      wristInches: "32,5 in",
      shoeSizeInches: '10.5"',
    }),
    {
      waistInches: 32.5,
      shoeSizeInches: 10.5,
      error: null,
    },
  );
});

test("rejects waist values outside the database constraint", () => {
  const result = parseBodyMeasurements({ ...base, wristInches: "15" });
  assert.equal(result.waistInches, null);
  assert.match(result.error ?? "", /between 18 and 80 inches/i);
});

test("rejects malformed optional measurements before Supabase", () => {
  const result = parseBodyMeasurements({ ...base, shoeSizeInches: "ten inches" });
  assert.match(result.error ?? "", /must be a number/i);
});
