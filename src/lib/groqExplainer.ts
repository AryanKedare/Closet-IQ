// Frontend client for /api/explain — streams tokens via SSE.

import type { WardrobeItem, UserProfile } from "./types";

export async function streamExplanation(opts: {
  top: WardrobeItem;
  bottom: WardrobeItem;
  shoes: WardrobeItem;
  jacket: WardrobeItem | null;
  profile: UserProfile;
  onDelta?: (chunk: string) => void;
  onDone?: (full: string) => void;
  onError?: (err: string) => void;
}): Promise<string> {
  try {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        top: {
          name: opts.top.name,
          color: opts.top.primaryColor,
          pattern: opts.top.pattern,
        },
        bottom: {
          name: opts.bottom.name,
          color: opts.bottom.primaryColor,
        },
        shoes: {
          name: opts.shoes.name,
          color: opts.shoes.primaryColor,
        },
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

    if (!res.ok) {
      throw new Error((await res.text()) || `HTTP ${res.status}`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!res.body || !contentType.includes("text/event-stream")) {
      throw new Error(
        `Expected an event stream, received ${contentType || "no content type"}`,
      );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    let done = false;

    while (!done) {
      const { done: streamEnded, value } = await reader.read();
      if (streamEnded) break;
      buffer += decoder.decode(value, { stream: true });

      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line || line.startsWith(":")) continue;
        if (!line.startsWith("data: ")) continue;

        const json = line.slice(6).trim();
        if (json === "[DONE]") {
          done = true;
          break;
        }

        const chunk = JSON.parse(json).choices?.[0]?.delta?.content;
        if (chunk) {
          full += chunk;
          opts.onDelta?.(chunk);
        }
      }
    }

    if (!full.trim()) {
      throw new Error("The explanation service returned an empty response");
    }

    opts.onDone?.(full);
    return full;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    opts.onError?.(message);
    throw error;
  }
}
