import { supabase } from "@/integrations/supabase/client";
import type { UserProfile, WardrobeItem } from "./types";
import type { AiOutfitCandidate, AiSelectedOutfit } from "./aiOutfitSchema";

export async function generateAiOutfits(args: {
  items: WardrobeItem[];
  profile: UserProfile;
  candidates: AiOutfitCandidate[];
  signal?: AbortSignal;
}): Promise<AiSelectedOutfit[]> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in before generating AI outfits.");

  const response = await fetch("/api/generate-outfits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      profile: {
        skinToneHex: args.profile.skinToneHex,
        eyeColorHex: args.profile.eyeColorHex,
        hairColorHex: args.profile.hairColorHex,
        skinToneType: args.profile.skinToneType,
        stylePreferences: args.profile.stylePreferences,
      },
      items: args.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        subCategory: item.subCategory,
        primaryColor: item.primaryColor,
        secondaryColor: item.secondaryColor,
        colorFamily: item.colorFamily,
        pattern: item.pattern,
        styleTags: item.styleTags,
        occasionTags: item.occasionTags,
        season: item.season,
      })),
      candidates: args.candidates,
    }),
    signal: args.signal,
  });

  const payload = await response.json().catch(() => null) as
    | { outfits?: AiSelectedOutfit[]; error?: string }
    | null;

  if (!response.ok || !payload?.outfits) {
    throw new Error(payload?.error || `AI outfit generation failed (${response.status}).`);
  }

  return payload.outfits;
}
