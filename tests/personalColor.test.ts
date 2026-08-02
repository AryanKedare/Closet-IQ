import assert from "node:assert/strict";
import test from "node:test";
import {
  generatePersonalPalette,
  isPersonalColorComplete,
  type PersonalColorAnswers,
} from "../src/lib/personalColor.ts";

const warmDeep: PersonalColorAnswers = {
  skinTone: "deep-dark",
  skinUndertone: "warm",
  hairColor: "black",
  eyeColor: "dark-brown",
  contrastLevel: "high",
};

const coolLight: PersonalColorAnswers = {
  skinTone: "fair",
  skinUndertone: "cool",
  hairColor: "blonde",
  eyeColor: "blue",
  contrastLevel: "low",
};

test("requires all five personal color answers", () => {
  assert.equal(isPersonalColorComplete(warmDeep), true);
  assert.equal(isPersonalColorComplete({ ...warmDeep, eyeColor: null }), false);
});

test("creates a deep warm high-contrast palette", () => {
  const palette = generatePersonalPalette(warmDeep);
  assert.equal(palette.name, "Clear Warm");
  assert.equal(palette.colors.length, 9);
  assert.ok(palette.colors.some((color) => color.name === "Espresso"));
  assert.ok(palette.colors.some((color) => color.name === "Rust"));
  assert.ok(palette.colors.some((color) => color.name === "Cobalt"));
});

test("creates a soft cool palette for light colouring", () => {
  const palette = generatePersonalPalette(coolLight);
  assert.equal(palette.name, "Soft Cool");
  assert.ok(palette.colors.some((color) => color.name === "Baby blue"));
  assert.ok(palette.colors.some((color) => color.name === "Dust pink"));
  assert.ok(palette.colors.some((color) => color.name === "Dust violet"));
});

test("palette changes when undertone and contrast change", () => {
  const first = generatePersonalPalette(warmDeep).colors.map((color) => color.hex);
  const second = generatePersonalPalette({
    ...warmDeep,
    skinUndertone: "cool",
    contrastLevel: "low",
  }).colors.map((color) => color.hex);
  assert.notDeepEqual(first, second);
});
