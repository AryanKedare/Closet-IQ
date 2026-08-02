import type { WardrobeItemAnalysis } from "./itemAnalysisSchema";

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.82;

async function fileToAnalysisDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file to use AI analysis.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("The selected image is too large. Choose an image under 15 MB.");
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("The selected image could not be read."));
      element.src = sourceUrl;
    });

    const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable in this browser.");
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export async function analyzeWardrobeItem(
  file: File,
  signal?: AbortSignal,
): Promise<WardrobeItemAnalysis> {
  const image = await fileToAnalysisDataUrl(file);
  const response = await fetch("/api/analyze-item", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
    signal,
  });

  const payload = await response.json().catch(() => null) as
    | { analysis?: WardrobeItemAnalysis; error?: string }
    | null;

  if (!response.ok || !payload?.analysis) {
    throw new Error(payload?.error || `AI analysis failed (${response.status}).`);
  }

  return payload.analysis;
}
