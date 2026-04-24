// Frontend client for /api/explain — streams tokens via SSE.

import type { WardrobeItem, UserProfile } from "./types";

export async function streamExplanation(opts: {
  top: WardrobeItem;
  bottom: WardrobeItem;
  shoes: WardrobeItem;
  jacket: WardrobeItem | null;
  profile: UserProfile;
  onDelta: (chunk: string) => void;
  onDone: (full: string) => void;
  onError: (err: string) => void;
}) {
  try {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        top: { name: opts.top.name, color: opts.top.primaryColor, pattern: opts.top.pattern },
        bottom: { name: opts.bottom.name, color: opts.bottom.primaryColor },
        shoes: { name: opts.shoes.name, color: opts.shoes.primaryColor },
        jacket: opts.jacket
          ? { name: opts.jacket.name, color: opts.jacket.primaryColor }
          : null,
        profile: {
          skinHex: opts.profile.skinToneHex,
          eyeHex: opts.profile.eyeColorHex,
          hairHex: opts.profile.hairColorHex,
        },
      }),
    });

    if (!res.ok || !res.body) {
      const txt = await res.text();
      opts.onError(txt || `HTTP ${res.status}`);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    let done = false;

    while (!done) {
      const { done: d, value } = await reader.read();
      if (d) break;
      buffer += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line || line.startsWith(":")) continue;
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") {
          done = true;
          break;
        }
        try {
          const parsed = JSON.parse(json);
          const c = parsed.choices?.[0]?.delta?.content;
          if (c) {
            full += c;
            opts.onDelta(c);
          }
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }
    opts.onDone(full);
  } catch (e) {
    opts.onError(e instanceof Error ? e.message : "Unknown error");
  }
}
