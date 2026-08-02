export const DEFAULT_GROQ_VISION_MODEL = "qwen/qwen3.6-27b";

const RETIRED_MODELS = new Set([
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "qwen/qwen3-32b",
]);

export type GroqErrorInfo = {
  message: string;
  type: string;
  code: string;
};

export function resolveGroqVisionModel(configuredModel?: string): string {
  const model = configuredModel?.trim();
  if (!model || RETIRED_MODELS.has(model)) return DEFAULT_GROQ_VISION_MODEL;
  return model;
}

export function parseGroqError(upstream: string): GroqErrorInfo {
  try {
    const parsed = JSON.parse(upstream) as {
      error?: { message?: unknown; type?: unknown; code?: unknown };
    };
    return {
      message: typeof parsed.error?.message === "string" ? parsed.error.message : upstream,
      type: typeof parsed.error?.type === "string" ? parsed.error.type : "",
      code: typeof parsed.error?.code === "string" ? parsed.error.code : "",
    };
  } catch {
    return { message: upstream, type: "", code: "" };
  }
}

export function extractJsonObject(content: string): unknown {
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("No JSON object found");
    return JSON.parse(withoutFence.slice(start, end + 1));
  }
}

export function groqVisionErrorMessage(status: number, upstream = ""): string {
  const info = parseGroqError(upstream);
  const message = info.message.toLowerCase();

  if (status === 429) {
    return "AI analysis is temporarily rate-limited. Wait a moment and try again.";
  }
  if (status === 413 || message.includes("too large") || message.includes("request size")) {
    return "The processed image is still too large for AI analysis. Try a smaller image.";
  }
  if (
    message.includes("decommission") ||
    message.includes("deprecated") ||
    message.includes("does not exist") ||
    message.includes("model_not_found") ||
    (message.includes("model") && message.includes("not found"))
  ) {
    return "The configured AI vision model is unavailable. Use qwen/qwen3.6-27b.";
  }
  if (
    status === 403 &&
    (message.includes("permission") ||
      message.includes("allowed") ||
      message.includes("blocked") ||
      message.includes("organization") ||
      message.includes("project"))
  ) {
    return "Qwen 3.6 Vision is blocked by Groq Model Permissions. Allow qwen/qwen3.6-27b for this Groq project.";
  }
  if (status === 401 || status === 403) {
    return "Groq rejected the API credentials. Check GROQ_API_KEY and its project access.";
  }
  if (message.includes("image") || message.includes("base64")) {
    return "Groq rejected the processed image. Try another JPEG, PNG, or WebP photo.";
  }
  if (message.includes("reasoning_format") || message.includes("reasoning effort")) {
    return "Groq rejected the reasoning configuration for the vision request.";
  }

  const diagnostic = [info.type, info.code].filter(Boolean).join("/");
  return diagnostic
    ? `Groq rejected the vision request (${diagnostic}). Check the server log for details.`
    : `Groq rejected the vision request with HTTP ${status}. Check the server log for details.`;
}
