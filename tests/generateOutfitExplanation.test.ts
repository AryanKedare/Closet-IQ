import assert from "node:assert/strict";
import test from "node:test";
import { generateOutfitExplanation } from "../src/lib/generateOutfitExplanation.ts";
import type { Outfit, UserProfile, WardrobeItem } from "../src/lib/types.ts";

const item = (id: string, name: string, category: WardrobeItem["category"]): WardrobeItem => ({
  id,
  userId: "user-1",
  name,
  category,
  primaryColor: "#112233",
  colorFamily: "dark",
  styleTags: [],
  occasionTags: [],
  pattern: "solid",
  season: [],
  timesWorn: 0,
  createdAt: "2026-08-02T00:00:00.000Z",
  isStored: false,
});

const outfit: Outfit = {
  id: "outfit-1",
  userId: "user-1",
  topId: "top-1",
  bottomId: "bottom-1",
  shoesId: "shoes-1",
  jacketId: null,
  compatibilityScore: 90,
  occasionTags: [],
  isSaved: false,
  isFavorite: false,
  wornCount: 0,
  createdAt: "2026-08-02T00:00:00.000Z",
};

const profile: UserProfile = {
  id: "profile-1",
  displayName: "Aryan",
  skinToneHex: "#CC9674",
  eyeColorHex: "#1F1919",
  hairColorHex: "#0A0B0B",
  skinToneType: "warm-medium",
  stylePreferences: [],
};

test("successful card action calls /api/explain, saves, then navigates", async () => {
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const events: string[] = [];
  const encoder = new TextEncoder();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"choices":[{"delta":{"content":"These colors work well."}}]}\n\n',
          ),
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    });
  };

  try {
    const result = await generateOutfitExplanation({
      outfit,
      top: item("top-1", "Black shirt", "shirt"),
      bottom: item("bottom-1", "Blue jeans", "jeans"),
      shoes: item("shoes-1", "White shoes", "shoes"),
      jacket: null,
      profile,
      save: async (outfitId, explanation) => {
        events.push(`save:${outfitId}:${explanation}`);
      },
      navigate: async (outfitId) => {
        events.push(`navigate:${outfitId}`);
      },
    });

    assert.equal(result, "These colors work well.");
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.input, "/api/explain");
    assert.equal(calls[0]?.init?.method, "POST");
    assert.deepEqual(events, [
      "save:outfit-1:These colors work well.",
      "navigate:outfit-1",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
