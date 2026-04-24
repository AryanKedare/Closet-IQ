import { supabase } from "@/integrations/supabase/client";
import { USER_ID } from "./constants";

// Compress an image file client-side: max 800px on the longest edge, encoded as WebP.
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
  const path = `${USER_ID}/${itemId}.webp`;
  const { error } = await supabase.storage
    .from("wardrobe-images")
    .upload(path, blob, { contentType: "image/webp", upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("wardrobe-images").getPublicUrl(path);
  return data.publicUrl;
}
