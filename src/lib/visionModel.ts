export const DEFAULT_GROQ_VISION_MODEL = "qwen/qwen3.6-27b";

const RETIRED_MODELS = new Set([
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "qwen/qwen3-32b",
]);

export function resolveGroqVisionModel(configuredModel?: string): string {
  const model = configuredModel?.trim();
  if (!model || RETIRED_MODELS.has(model)) return DEFAULT_GROQ_VISION_MODEL;
  return model;
}

export function groqVisionErrorMessage(status: number, upstreamMessage = ""): string {
  const message = upstreamMessage.toLowerCase();

  if (status === 429) {
    return "AI analysis is temporarily rate-limited. Wait a moment and try again.";
  }
  if (status === 413 || message.includes("too large") || message.includes("request size")) {
    return "The processed image is still too large for AI analysis. Try a smaller image.";
  }
  if (
    message.includes("decommission") ||
    message.includes("deprecated") ||
    message.includes("model") && message.includes("not found")
  ) {
    return "The configured AI vision model is unavailable. Redeploy with qwen/qwen3.6-27b.";
  }
  if (message.includes("image") || message.includes("base64")) {
    return "Groq rejected the processed image. Try another JPEG, PNG, or WebP photo.";
  }
  if (status === 401 || status === 403) {
    return "Groq rejected the API credentials. Check GROQ_API_KEY in the deployment environment.";
  }

  return "The AI analysis service rejected the request. Try again in a moment.";
}
