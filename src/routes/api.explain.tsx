import { createFileRoute } from "@tanstack/react-router";

type ExplainBody = {
  top: { name: string; color: string; pattern: string };
  bottom: { name: string; color: string };
  shoes: { name: string; color: string };
  jacket: { name: string; color: string } | null;
  profile: { skinHex: string; eyeHex: string; hairHex: string };
};

const HEX_RE = /^#[0-9A-Fa-f]{3,8}$/;
const TEXT_MAX = 80;

function sanitize(s: unknown): string {
  if (typeof s !== "string") return "";
  return s.replace(/[^\w\s\-#()/.,]/g, "").slice(0, TEXT_MAX);
}

function validateBody(raw: unknown): ExplainBody | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const top = b.top as Record<string, unknown> | null;
  const bottom = b.bottom as Record<string, unknown> | null;
  const shoes = b.shoes as Record<string, unknown> | null;
  const jacket = b.jacket as Record<string, unknown> | null;
  const profile = b.profile as Record<string, unknown> | null;
  if (!top || !bottom || !shoes || !profile) return null;
  return {
    top: { name: sanitize(top.name), color: sanitize(top.color), pattern: sanitize(top.pattern) },
    bottom: { name: sanitize(bottom.name), color: sanitize(bottom.color) },
    shoes: { name: sanitize(shoes.name), color: sanitize(shoes.color) },
    jacket: jacket
      ? { name: sanitize(jacket.name), color: sanitize(jacket.color) }
      : null,
    profile: {
      skinHex: HEX_RE.test(String(profile.skinHex)) ? String(profile.skinHex) : "#CC9674",
      eyeHex: HEX_RE.test(String(profile.eyeHex)) ? String(profile.eyeHex) : "#1F1919",
      hairHex: HEX_RE.test(String(profile.hairHex)) ? String(profile.hairHex) : "#0A0B0B",
    },
  };
}

export const Route = createFileRoute("/api/explain")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const raw = await request.json();
          const body = validateBody(raw);
          if (!body) {
            return new Response(JSON.stringify({ error: "Invalid request body" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const apiKey = process.env.GROQ_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "Missing GROQ_API_KEY — set it in Vercel environment variables" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const jacketStr = body.jacket
            ? `${body.jacket.name} (${body.jacket.color})`
            : "none";

          const prompt = `You are a fashion stylist. In exactly 2 sentences, explain why this outfit works for someone with warm medium tan skin (hex: ${body.profile.skinHex}), near-black eyes (${body.profile.eyeHex}), and deep black hair (${body.profile.hairHex}). Top: ${body.top.name}, ${body.top.color}, ${body.top.pattern}. Bottom: ${body.bottom.name}, ${body.bottom.color}. Shoes: ${body.shoes.name}, ${body.shoes.color}. Jacket: ${jacketStr}. Focus on color harmony, contrast, layering logic, and how the colors interact with the person's complexion. Be specific, confident, and direct. No generic fashion advice.`;

          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama3-70b-8192",
              messages: [{ role: "user", content: prompt }],
              stream: true,
              max_tokens: 160,
            }),
          });

          if (!groqRes.ok || !groqRes.body) {
            const text = await groqRes.text();
            return new Response(JSON.stringify({ error: `Groq error: ${text}` }), {
              status: groqRes.status,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(groqRes.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
            },
          });
        } catch (e) {
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
