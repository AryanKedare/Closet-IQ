import { storage, BUCKET_ID, ID, ENDPOINT, PROJECT_ID } from "@/integrations/appwrite/client";

async function compressToWebp(file: File): Promise<Blob> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const MAX = 800;
  const ratio = Math.min(1, MAX / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
      "image/webp",
      0.85
    );
  });
}

export async function uploadWardrobeImage(file: File, itemId: string): Promise<string> {
  const blob = await compressToWebp(file);
  const fileObj = new File([blob], `${itemId}.webp`, { type: "image/webp" });

  // Delete existing file first (upsert equivalent)
  try {
    await storage.deleteFile(BUCKET_ID, itemId);
  } catch {}

  await storage.createFile(BUCKET_ID, itemId, fileObj);
  return `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${itemId}/view?project=${PROJECT_ID}`;
}
