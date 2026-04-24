import { createFileRoute } from "@tanstack/react-router";

const MAX_MSG = 300;
const MAX_HISTORY = 8;

function sanitize(s: unknown): string {
  if (typeof s !== "string") return "";
  return s.replace(/[<>]/g, "").slice(0, MAX_MSG);
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const raw = await request.json() as any;
          const message = sanitize(raw?.message);
          const wardrobeContext = sanitize(raw?.wardrobeContext);
          const historyRaw: any[] = Array.isArray(raw?.history) ? raw.history.slice(-MAX_HISTORY) : [];
          const history = historyRaw
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({ role: m.role as "user" | "assistant", content: sanitize(m.content) }));

          if (!message) {
            return new Response(JSON.stringify({ error: "No message" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            });
          }

          const apiKey = process.env.GROQ_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "Missing GROQ_API_KEY" }), {
              status: 500, headers: { "Content-Type": "application/json" },
            });
          }

          const systemPrompt = `You are a personal fashion stylist for Shreeraj. You know his exact wardrobe:

${wardrobeContext}

Shreeraj has warm medium tan skin, near-black eyes, and deep black hair. He is based in Dublin, Ireland.

Answer his questions concisely (2-4 sentences max). When recommending outfits, reference specific items from his wardrobe by name. Use styling principles: colour harmony, occasion matching, layering logic. Be direct, specific, and helpful — never generic.`;

          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: message },
              ],
              stream: true,
              max_tokens: 300,
              temperature: 0.7,
            }),
          });

          if (!groqRes.ok || !groqRes.body) {
            const text = await groqRes.text();
            return new Response(JSON.stringify({ error: `Groq error: ${text}` }), {
              status: groqRes.status, headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(groqRes.body, {
            headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
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
