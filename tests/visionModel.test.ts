import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_GROQ_VISION_MODEL,
  groqVisionErrorMessage,
  resolveGroqVisionModel,
} from "../src/lib/visionModel.ts";

test("uses the supported default vision model", () => {
  assert.equal(resolveGroqVisionModel(), DEFAULT_GROQ_VISION_MODEL);
  assert.equal(resolveGroqVisionModel(""), DEFAULT_GROQ_VISION_MODEL);
  assert.equal(DEFAULT_GROQ_VISION_MODEL, "qwen/qwen3.6-27b");
});

test("replaces retired model overrides", () => {
  assert.equal(
    resolveGroqVisionModel("meta-llama/llama-4-scout-17b-16e-instruct"),
    DEFAULT_GROQ_VISION_MODEL,
  );
  assert.equal(resolveGroqVisionModel("qwen/qwen3-32b"), DEFAULT_GROQ_VISION_MODEL);
});

test("keeps a supported explicit override", () => {
  assert.equal(resolveGroqVisionModel("custom/vision-model"), "custom/vision-model");
});

test("maps upstream Groq errors to actionable user messages", () => {
  assert.match(groqVisionErrorMessage(429), /rate-limited/i);
  assert.match(groqVisionErrorMessage(401), /credentials/i);
  assert.match(
    groqVisionErrorMessage(400, "The model has been decommissioned"),
    /qwen\/qwen3\.6-27b/i,
  );
  assert.match(groqVisionErrorMessage(400, "Invalid base64 image"), /image/i);
});
