import { createFileRoute } from "@tanstack/react-router";
import { normalizeAiOutfitSelection } from "@/lib/aiOutfitSchema";
import { extractJsonObject } from "@/lib/visionModel";

const MAX_ITEMS = 250;
const MAX_CANDIDATES = 60;

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

function cleanArray(value: unknown, limit: number): unknown[] {
  return Array.isArray(value) ? value.slice(0, limit) : [];
}

function buildPrompt(body: {
  profile: unknown;
  items: unknown[];
  candidates: unknown[];
}): string {
  return `You are the final outfit curator for ClosetIQ.

A deterministic rule engine has already generated valid outfit candidates. You MUST only choose from those candidates and MUST copy each candidateKey exactly. Never invent, alter, or combine item IDs.

Choose up to 24 outfits that are diverse, wearable, and personalized to the user's profile and style preferences. Avoid repeating one top excessively. Prefer meaningful variety across casual, smart-casual, office, date-night, going-out, and weekend where supported by the candidates.

For each selected candidate return:
- candidateKey: exact key from the provided candidate
- name: short human-friendly outfit name, maximum 80 characters
- score: your stylist score from 0 to 100
- occasionTags: only values already present on the candidate
- explanation: one concise sentence explaining why the combination suits the user

Return JSON only in this exact shape:
{"outfits":[{"candidateKey":"...","name":"...","score":90,"occasionTags":["casual"],"explanation":"..."}]}

USER PROFILE:
${JSON.stringify(body.profile)}

WARDROBE ITEMS:
${JSON.stringify(body.items)}

VALID CANDIDATES:
${JSON.stringify(body.candidates)}`;
}

export const Route = createFileRoute("/api/generate-outfits")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!(await isAuthenticated(request))) {
            return jsonResponse({ error: "Sign in before generating AI outfits." }, 401);
          }

          const body = await request.json().catch(() => null) as
            | { profile?: unknown; items?: unknown; candidates?: unknown }
            | null;
          const items = cleanArray(body?.items, MAX_ITEMS);
          const candidates = cleanArray(body?.candidates, MAX_CANDIDATES);
          if (!body?.profile || items.length === 0 || candidates.length === 0) {
            return jsonResponse({ error: "Wardrobe items and valid candidates are required." }, 400);
          }

          const apiKey = process.env.GROQ_API_KEY;
          if (!apiKey) {
            return jsonResponse({ error: "Missing GROQ_API_KEY in the server environment." }, 500);
          }

          const model = process.env.GROQ_OUTFIT_MODEL || "llama-3.3-70b-versatile";
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: buildPrompt({ profile: body.profile, items, candidates }) }],
              response_format: { type: "json_object" },
              temperature: 0.25,
              max_completion_tokens: 3500,
            }),
          });

          const responseText = await response.text();
          if (!response.ok) {
            console.error("Groq outfit generation failed", {
              status: response.status,
              model,
              response: responseText,
            });
            return jsonResponse(
              { error: `AI outfit generation was rejected by Groq (HTTP ${response.status}).` },
              response.status === 429 ? 429 : 502,
            );
          }

          let envelope: { choices?: Array<{ message?: { content?: string } }> };
          try {
            envelope = JSON.parse(responseText);
          } catch {
            return jsonResponse({ error: "Groq returned an invalid response envelope." }, 502);
          }

          const content = envelope.choices?.[0]?.message?.content;
          if (!content) return jsonResponse({ error: "Groq returned an empty outfit selection." }, 502);

          let parsed: unknown;
          try {
            parsed = extractJsonObject(content);
          } catch {
            console.error("Groq returned invalid outfit JSON", { content });
            return jsonResponse({ error: "Groq returned invalid outfit JSON." }, 502);
          }

          const normalized = normalizeAiOutfitSelection(parsed, candidates as never[], 24);
          if (normalized.length === 0) {
            return jsonResponse({ error: "AI did not select any valid outfit candidates." }, 502);
          }

          return jsonResponse({ outfits: normalized });
        } catch (error) {
          console.error("AI outfit generation error", error);
          return jsonResponse(
            { error: error instanceof Error ? error.message : "AI outfit generation failed." },
            500,
          );
        }
      },
    },
  },
});
