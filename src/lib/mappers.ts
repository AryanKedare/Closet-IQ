import type { WardrobeItem, UserProfile, Outfit, OutfitHistory, Category, ColorFamily, Pattern } from "./types";

export function mapWardrobeItem(row: any): WardrobeItem {
  return {
    id: row.$id ?? row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category as Category,
    subCategory: row.sub_category,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    colorFamily: row.color_family as ColorFamily,
    styleTags: row.style_tags ?? [],
    occasionTags: row.occasion_tags ?? [],
    pattern: (row.pattern ?? "solid") as Pattern,
    season: row.season ?? [],
    brand: row.brand,
    imageUrl: row.image_url,
    timesWorn: row.times_worn ?? 0,
    lastWorn: row.last_worn,
    createdAt: row.$createdAt ?? row.created_at,
    isStored: row.is_stored ?? false,
  };
}

export function mapProfile(row: any): UserProfile {
  return {
    id: row.$id ?? row.id,
    displayName: row.display_name,
    skinToneHex: row.skin_tone_hex ?? "",
    eyeColorHex: row.eye_color_hex ?? "",
    hairColorHex: row.hair_color_hex ?? "",
    skinToneType: row.skin_tone_type ?? "custom",
    stylePreferences: row.style_preferences ?? [],
    onboardingCompleted: row.onboarding_completed ?? false,
  };
}

export function mapOutfit(row: any): Outfit {
  return {
    id: row.$id ?? row.id,
    userId: row.user_id,
    topId: row.top_id,
    bottomId: row.bottom_id,
    shoesId: row.shoes_id,
    jacketId: row.jacket_id,
    compatibilityScore: row.compatibility_score ?? 0,
    occasionTags: row.occasion_tags ?? [],
    isSaved: row.is_saved ?? false,
    isFavorite: row.is_favorite ?? false,
    wornCount: row.worn_count ?? 0,
    aiExplanation: row.ai_explanation,
    name: row.name ?? null,
    createdAt: row.$createdAt ?? row.created_at,
  };
}

export function mapHistory(row: any): OutfitHistory {
  return {
    id: row.$id ?? row.id,
    userId: row.user_id,
    outfitId: row.outfit_id,
    wornDate: row.worn_date,
    occasion: row.occasion,
    notes: row.notes,
    rating: row.rating ?? null,
  };
}
