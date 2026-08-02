import assert from "node:assert/strict";
import test from "node:test";
import { normalizeWardrobeItemAnalysis } from "../src/lib/itemAnalysisSchema.ts";

test("normalizes valid wardrobe analysis output", () => {
  const analysis = normalizeWardrobeItemAnalysis({
    name: " Navy Oxford Shirt ",
    brand: "Visible Brand",
    category: "shirt",
    subCategory: "oxford",
    primaryColor: "#1f2d4a",
    secondaryColor: "#ffffff",
    colorFamily: "cool-blue",
    pattern: "solid",
    styleTags: ["smart-casual", "office", "not-allowed"],
    occasionTags: ["office", "smart-casual"],
    season: ["spring", "fall"],
    confidence: 0.91,
  });

  assert.deepEqual(analysis, {
    name: "Navy Oxford Shirt",
    brand: "Visible Brand",
    category: "shirt",
    subCategory: "oxford",
    primaryColor: "#1F2D4A",
    secondaryColor: "#FFFFFF",
    colorFamily: "cool-blue",
    pattern: "solid",
    styleTags: ["smart-casual", "office"],
    occasionTags: ["office", "smart-casual"],
    season: ["spring", "fall"],
    confidence: 0.91,
  });
});

test("replaces unsupported or unsafe model values", () => {
  const analysis = normalizeWardrobeItemAnalysis({
    name: "<script>alert(1)</script>",
    category: "dress",
    primaryColor: "blue",
    secondaryColor: "#12",
    colorFamily: "electric",
    pattern: "polka-dot",
    styleTags: ["street", "street", "luxury"],
    occasionTags: "casual",
    season: ["summer", "monsoon"],
    confidence: 4,
  });

  assert.equal(analysis.category, "shirt");
  assert.equal(analysis.primaryColor, "#808080");
  assert.equal(analysis.secondaryColor, "");
  assert.equal(analysis.colorFamily, "neutral");
  assert.equal(analysis.pattern, "solid");
  assert.deepEqual(analysis.styleTags, ["street"]);
  assert.deepEqual(analysis.occasionTags, []);
  assert.deepEqual(analysis.season, ["summer"]);
  assert.equal(analysis.confidence, 1);
  assert.equal(analysis.name.includes("<"), false);
  assert.equal(analysis.name.includes(">"), false);
});
