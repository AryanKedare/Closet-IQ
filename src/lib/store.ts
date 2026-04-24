import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { USER_ID, DEFAULT_PROFILE } from "./constants";
import { mapWardrobeItem, mapProfile, mapOutfit, mapHistory } from "./mappers";
import type { WardrobeItem, UserProfile, Outfit, OutfitHistory } from "./types";
import { generateOutfits } from "./outfitGenerator";

type ThemeMode = "light" | "dark";

type State = {
  profile: UserProfile | null;
  items: WardrobeItem[];
  outfits: Outfit[];
  history: OutfitHistory[];
  loading: boolean;
  generating: boolean;
  theme: ThemeMode;
  loadAll: () => Promise<void>;
  saveProfile: (p: Partial<UserProfile>) => Promise<void>;
  addItem: (item: Omit<WardrobeItem, "id" | "userId" | "createdAt" | "timesWorn">, file?: File) => Promise<WardrobeItem>;
  deleteItem: (id: string) => Promise<void>;
  generate: () => Promise<void>;
  toggleSaved: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  markWorn: (outfitId: string, occasion?: string) => Promise<void>;
  setExplanation: (outfitId: string, text: string) => Promise<void>;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
};

const initialTheme: ThemeMode =
  typeof window !== "undefined" && localStorage.getItem("closetiq-theme") === "dark"
    ? "dark"
    : typeof window !== "undefined" && localStorage.getItem("closetiq-theme") === "light"
      ? "light"
      : typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

function applyTheme(t: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
  try {
    localStorage.setItem("closetiq-theme", t);
  } catch {}
}

if (typeof document !== "undefined") {
  applyTheme(initialTheme);
}

export const useStore = create<State>((set, get) => ({
  profile: null,
  items: [],
  outfits: [],
  history: [],
  loading: false,
  generating: false,
  theme: initialTheme,

  setTheme: (t) => {
    applyTheme(t);
    set({ theme: t });
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },

  loadAll: async () => {
    set({ loading: true });
    try {
      // Ensure profile exists.
      let { data: profileRow } = await supabase
        .from("user_profile")
        .select("*")
        .eq("id", USER_ID)
        .maybeSingle();
      if (!profileRow) {
        const { data: ins } = await supabase
          .from("user_profile")
          .insert({
            id: USER_ID,
            display_name: "Shreeraj",
            skin_tone_hex: DEFAULT_PROFILE.skinToneHex,
            eye_color_hex: DEFAULT_PROFILE.eyeColorHex,
            hair_color_hex: DEFAULT_PROFILE.hairColorHex,
            skin_tone_type: DEFAULT_PROFILE.skinToneType,
          })
          .select()
          .single();
        profileRow = ins!;
      }

      const [itemsRes, outfitsRes, historyRes] = await Promise.all([
        supabase.from("wardrobe_items").select("*").eq("user_id", USER_ID).order("created_at", { ascending: false }),
        supabase.from("outfits").select("*").eq("user_id", USER_ID).order("compatibility_score", { ascending: false }),
        supabase.from("outfit_history").select("*").eq("user_id", USER_ID).order("worn_date", { ascending: false }),
      ]);

      set({
        profile: mapProfile(profileRow),
        items: (itemsRes.data ?? []).map(mapWardrobeItem),
        outfits: (outfitsRes.data ?? []).map(mapOutfit),
        history: (historyRes.data ?? []).map(mapHistory),
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  saveProfile: async (p) => {
    const cur = get().profile;
    if (!cur) return;
    const next = { ...cur, ...p };
    await supabase
      .from("user_profile")
      .update({
        display_name: next.displayName,
        skin_tone_hex: next.skinToneHex,
        eye_color_hex: next.eyeColorHex,
        hair_color_hex: next.hairColorHex,
        skin_tone_type: next.skinToneType,
        style_preferences: next.stylePreferences,
      })
      .eq("id", USER_ID);
    set({ profile: next });
  },

  addItem: async (item, file) => {
    const { data, error } = await supabase
      .from("wardrobe_items")
      .insert({
        user_id: USER_ID,
        name: item.name,
        category: item.category,
        sub_category: item.subCategory ?? null,
        primary_color: item.primaryColor,
        secondary_color: item.secondaryColor ?? null,
        color_family: item.colorFamily,
        style_tags: item.styleTags,
        occasion_tags: item.occasionTags,
        pattern: item.pattern,
        season: item.season,
        brand: item.brand ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    let mapped = mapWardrobeItem(data);

    if (file) {
      const { uploadWardrobeImage } = await import("./imageUpload");
      const url = await uploadWardrobeImage(file, mapped.id);
      const { data: upd } = await supabase
        .from("wardrobe_items")
        .update({ image_url: url })
        .eq("id", mapped.id)
        .select()
        .single();
      mapped = mapWardrobeItem(upd);
    }

    set({ items: [mapped, ...get().items] });
    return mapped;
  },

  deleteItem: async (id) => {
    await supabase.from("wardrobe_items").delete().eq("id", id);
    // Cascade in DB removes outfits that reference this item; mirror that in memory.
    set({
      items: get().items.filter((i) => i.id !== id),
      outfits: get().outfits.filter(
        (o) => o.topId !== id && o.bottomId !== id && o.shoesId !== id && o.jacketId !== id
      ),
    });
  },

  generate: async () => {
    const { items, profile } = get();
    if (!profile) return;
    set({ generating: true });
    const candidates = generateOutfits(items, profile);

    // Replace all generated outfits for this user, preserving saved ones.
    await supabase.from("outfits").delete().eq("user_id", USER_ID).eq("is_saved", false);

    if (candidates.length > 0) {
      const rows = candidates.slice(0, 200).map((c) => ({
        user_id: USER_ID,
        top_id: c.topId,
        bottom_id: c.bottomId,
        shoes_id: c.shoesId,
        jacket_id: c.jacketId,
        compatibility_score: c.score,
        occasion_tags: c.occasionTags,
      }));
      await supabase.from("outfits").insert(rows);
    }

    const { data } = await supabase
      .from("outfits")
      .select("*")
      .eq("user_id", USER_ID)
      .order("compatibility_score", { ascending: false });
    set({ outfits: (data ?? []).map(mapOutfit), generating: false });
  },

  toggleSaved: async (id) => {
    const o = get().outfits.find((x) => x.id === id);
    if (!o) return;
    const next = !o.isSaved;
    await supabase.from("outfits").update({ is_saved: next }).eq("id", id);
    set({ outfits: get().outfits.map((x) => (x.id === id ? { ...x, isSaved: next } : x)) });
  },

  toggleFavorite: async (id) => {
    const o = get().outfits.find((x) => x.id === id);
    if (!o) return;
    const next = !o.isFavorite;
    await supabase.from("outfits").update({ is_favorite: next, is_saved: true }).eq("id", id);
    set({
      outfits: get().outfits.map((x) =>
        x.id === id ? { ...x, isFavorite: next, isSaved: true } : x
      ),
    });
  },

  markWorn: async (outfitId, occasion) => {
    const today = new Date().toISOString().slice(0, 10);
    const o = get().outfits.find((x) => x.id === outfitId);
    if (!o) return;
    const { data: histRow } = await supabase
      .from("outfit_history")
      .insert({ user_id: USER_ID, outfit_id: outfitId, worn_date: today, occasion: occasion ?? null })
      .select()
      .single();
    await supabase.from("outfits").update({ worn_count: o.wornCount + 1, is_saved: true }).eq("id", outfitId);

    // increment times_worn for each item in the outfit
    const itemIds = [o.topId, o.bottomId, o.shoesId, o.jacketId].filter(Boolean) as string[];
    const items = get().items;
    const updates = itemIds
      .map((id) => items.find((i) => i.id === id))
      .filter(Boolean) as WardrobeItem[];
    await Promise.all(
      updates.map((it) =>
        supabase
          .from("wardrobe_items")
          .update({ times_worn: it.timesWorn + 1, last_worn: new Date().toISOString() })
          .eq("id", it.id)
      )
    );

    set({
      outfits: get().outfits.map((x) =>
        x.id === outfitId ? { ...x, wornCount: x.wornCount + 1, isSaved: true } : x
      ),
      items: get().items.map((it) =>
        itemIds.includes(it.id)
          ? { ...it, timesWorn: it.timesWorn + 1, lastWorn: new Date().toISOString() }
          : it
      ),
      history: histRow ? [mapHistory(histRow), ...get().history] : get().history,
    });
  },

  setExplanation: async (outfitId, text) => {
    await supabase.from("outfits").update({ ai_explanation: text }).eq("id", outfitId);
    set({
      outfits: get().outfits.map((x) => (x.id === outfitId ? { ...x, aiExplanation: text } : x)),
    });
  },
}));
