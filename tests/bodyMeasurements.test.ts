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
    wristInches: null,
    shoeSizeInches: null,
    error: null,
  });
});

test("accepts decimal commas and inch suffixes", () => {
  assert.deepEqual(
    parseBodyMeasurements({
      ...base,
      wristInches: "6,8 in",
      shoeSizeInches: '10.5"',
    }),
    {
      wristInches: 6.8,
      shoeSizeInches: 10.5,
      error: null,
    },
  );
});

test("rejects wrist values outside the database constraint", () => {
  const result = parseBodyMeasurements({ ...base, wristInches: "2.5" });
  assert.equal(result.wristInches, null);
  assert.match(result.error ?? "", /between 3 and 15 inches/i);
});

test("rejects malformed optional measurements before Supabase", () => {
  const result = parseBodyMeasurements({ ...base, shoeSizeInches: "ten inches" });
  assert.match(result.error ?? "", /must be a number/i);
});
