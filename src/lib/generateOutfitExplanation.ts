import { streamExplanation } from "./groqExplainer.ts";
import type { Outfit, UserProfile, WardrobeItem } from "./types";

export const FALLBACK_PROFILE: UserProfile = {
  id: "fallback-profile",
  displayName: "Guest",
  skinToneHex: "#CC9674",
  eyeColorHex: "#1F1919",
  hairColorHex: "#0A0B0B",
  skinToneType: "warm-medium",
  stylePreferences: [],
};

export async function generateOutfitExplanation(args: {
  outfit: Outfit;
  top: WardrobeItem | null;
  bottom: WardrobeItem | null;
  shoes: WardrobeItem | null;
  jacket: WardrobeItem | null;
  profile: UserProfile | null;
  save: (outfitId: string, explanation: string) => Promise<void>;
  navigate: (outfitId: string) => Promise<void> | void;
}): Promise<string> {
  if (!args.top || !args.bottom || !args.shoes) {
    throw new Error("This outfit is missing a required item");
  }

  const explanation = await streamExplanation({
    top: args.top,
    bottom: args.bottom,
    shoes: args.shoes,
    jacket: args.jacket,
    profile: args.profile ?? FALLBACK_PROFILE,
  });

  await args.save(args.outfit.id, explanation);
  await args.navigate(args.outfit.id);
  return explanation;
}
