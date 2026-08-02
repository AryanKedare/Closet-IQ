import { createFileRoute } from "@tanstack/react-router";
import { normalizeWardrobeItemAnalysis } from "@/lib/itemAnalysisSchema";
import { groqVisionErrorMessage, resolveGroqVisionModel } from "@/lib/visionModel";
import {
  CATEGORIES,
  COLOR_FAMILIES,
  OCCASION_TAGS,
  PATTERNS,
  SEASONS,
  STYLE_TAGS,
} from "@/lib/constants";

const MAX_IMAGE_CHARACTERS = 4_000_000;
const IMAGE_DATA_URL_RE = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function isAuthenticated(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return false;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return false;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${token}`,
    },
  });
  return response.ok;
}

function analysisPrompt(): string {
  return `Analyze the single clothing item visible in the image and return one JSON object only.

Use exactly these allowed values:
- category: ${CATEGORIES.join(", ")}
- colorFamily: ${COLOR_FAMILIES.join(", ")}
- pattern: ${PATTERNS.join(", ")}
- styleTags: ${STYLE_TAGS.join(", ")}
- occasionTags: ${OCCASION_TAGS.join(", ")}
- season: ${SEASONS.join(", ")}

Return this exact shape:
{
  "name": "short descriptive product name without inventing a brand",
  "brand": "visible brand only, otherwise empty string",
  "category": "one allowed category",
  "subCategory": "short garment subtype such as oxford, polo, bomber, sneaker, chino, or empty string",
  "primaryColor": "dominant clothing colour as #RRGGBB",
  "secondaryColor": "second meaningful clothing colour as #RRGGBB, otherwise empty string",
  "colorFamily": "one allowed colorFamily",
  "pattern": "one allowed pattern",
  "styleTags": ["up to 5 allowed values"],
  "occasionTags": ["up to 5 allowed values"],
  "season": ["allowed values"],
  "confidence": 0.0
}

Rules:
- Analyze the garment, not the wall, floor, hanger, skin, or background.
- Do not invent a brand or material that is not clearly visible.
- Choose the closest allowed enum when uncertain.
- Use confidence from 0 to 1 for the overall classification.
- Output valid JSON only, with no markdown or explanation.`;
}

export const Route = createFileRoute("/api/analyze-item")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!(await isAuthenticated(request))) {
            return jsonResponse({ error: "Sign in before using AI item analysis." }, 401);
          }

          const body = await request.json().catch(() => null) as { image?: unknown } | null;
          const image = typeof body?.image === "string" ? body.image : "";
          if (!image || image.length > MAX_IMAGE_CHARACTERS || !IMAGE_DATA_URL_RE.test(image)) {
            return jsonResponse({ error: "A valid compressed clothing image is required." }, 400);
          }

          const apiKey = process.env.GROQ_API_KEY;
          if (!apiKey) {
            return jsonResponse(
              { error: "Missing GROQ_API_KEY — configure it in the server environment." },
              500,
            );
          }

          const model = resolveGroqVisionModel(process.env.GROQ_VISION_MODEL);
          const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: analysisPrompt() },
                    { type: "image_url", image_url: { url: image } },
                  ],
                },
              ],
              response_format: { type: "json_object" },
              temperature: 0.1,
              max_completion_tokens: 700,
            }),
          });

          if (!groqResponse.ok) {
            const upstream = await groqResponse.text();
            console.error("Groq item analysis failed", {
              status: groqResponse.status,
              model,
              upstream,
            });
            return jsonResponse(
              { error: groqVisionErrorMessage(groqResponse.status, upstream) },
              groqResponse.status === 429 ? 429 : 502,
            );
          }

          const payload = await groqResponse.json() as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const content = payload.choices?.[0]?.message?.content;
          if (!content) {
            return jsonResponse({ error: "The AI returned an empty analysis." }, 502);
          }

          let parsed: unknown;
          try {
            parsed = JSON.parse(content);
          } catch {
            console.error("Groq returned non-JSON item analysis", { model, content });
            return jsonResponse({ error: "The AI returned an invalid analysis. Try again." }, 502);
          }

          return jsonResponse({ analysis: normalizeWardrobeItemAnalysis(parsed) });
        } catch (error) {
          console.error("Item analysis error", error);
          return jsonResponse(
            { error: error instanceof Error ? error.message : "Item analysis failed." },
            500,
          );
        }
      },
    },
  },
});
