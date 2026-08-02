import { supabase } from "@/integrations/supabase/client";

const BUCKET = "wardrobe-images";

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
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image canvas is unavailable");
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
      "image/webp",
      0.85,
    );
  });
}

export async function getWardrobeImagePath(itemId: string): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Sign in before uploading images");
  return `${data.user.id}/${itemId}.webp`;
}

export async function uploadWardrobeImage(file: File, itemId: string): Promise<string> {
  const blob = await compressToWebp(file);
  const fileObj = new File([blob], `${itemId}.webp`, { type: "image/webp" });
  const path = await getWardrobeImagePath(itemId);

  const { error } = await supabase.storage.from(BUCKET).upload(path, fileObj, {
    contentType: "image/webp",
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
