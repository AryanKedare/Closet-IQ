import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_GROQ_VISION_MODEL,
  extractJsonObject,
  groqVisionErrorMessage,
  parseGroqError,
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

test("parses Groq error envelopes", () => {
  assert.deepEqual(
    parseGroqError(
      JSON.stringify({
        error: {
          message: "Model access denied",
          type: "invalid_request_error",
          code: "model_permission_denied",
        },
      }),
    ),
    {
      message: "Model access denied",
      type: "invalid_request_error",
      code: "model_permission_denied",
    },
  );
});

test("extracts JSON from strict, fenced, and surrounded model output", () => {
  assert.deepEqual(extractJsonObject('{"name":"shirt"}'), { name: "shirt" });
  assert.deepEqual(extractJsonObject('```json\n{"name":"shirt"}\n```'), { name: "shirt" });
  assert.deepEqual(extractJsonObject('Here is the result: {"name":"shirt"} done'), {
    name: "shirt",
  });
});

test("maps upstream Groq errors to actionable user messages", () => {
  assert.match(groqVisionErrorMessage(429), /rate-limited/i);
  assert.match(groqVisionErrorMessage(401), /credentials/i);
  assert.match(
    groqVisionErrorMessage(400, "The model has been decommissioned"),
    /qwen\/qwen3\.6-27b/i,
  );
  assert.match(groqVisionErrorMessage(400, "Invalid base64 image"), /image/i);
  assert.match(
    groqVisionErrorMessage(
      403,
      JSON.stringify({ error: { message: "Model blocked by project permissions" } }),
    ),
    /Model Permissions/i,
  );
});
