import { create } from "zustand";
import { databases, storage, ID, Query, DATABASE_ID, BUCKET_ID, COLLECTIONS } from "@/integrations/appwrite/client";
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
  renameOutfit: (outfitId: string, name: string) => Promise<void>;
  rateWear: (historyId: string, rating: number) => Promise<void>;
  deleteHistory: (historyId: string) => Promise<void>;
  toggleStored: (itemId: string) => Promise<void>;
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
      let profileDoc;
      try {
        profileDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.USER_PROFILE, USER_ID);
      } catch {
        profileDoc = await databases.createDocument(DATABASE_ID, COLLECTIONS.USER_PROFILE, USER_ID, {
          display_name: "Shreeraj",
          skin_tone_hex: DEFAULT_PROFILE.skinToneHex,
          eye_color_hex: DEFAULT_PROFILE.eyeColorHex,
          hair_color_hex: DEFAULT_PROFILE.hairColorHex,
          skin_tone_type: DEFAULT_PROFILE.skinToneType,
          style_preferences: [],
        });
      }

      const [itemsRes, outfitsRes, historyRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.WARDROBE_ITEMS, [
          Query.equal("user_id", USER_ID),
          Query.orderDesc("$createdAt"),
          Query.limit(500),
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.OUTFITS, [
          Query.equal("user_id", USER_ID),
          Query.orderDesc("compatibility_score"),
          Query.limit(500),
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.OUTFIT_HISTORY, [
          Query.equal("user_id", USER_ID),
          Query.orderDesc("worn_date"),
          Query.limit(500),
        ]),
      ]);

      set({
        profile: mapProfile(profileDoc),
        items: itemsRes.documents.map(mapWardrobeItem),
        outfits: outfitsRes.documents.map(mapOutfit),
        history: historyRes.documents.map(mapHistory),
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
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.USER_PROFILE, USER_ID, {
      display_name: next.displayName,
      skin_tone_hex: next.skinToneHex,
      eye_color_hex: next.eyeColorHex,
      hair_color_hex: next.hairColorHex,
      skin_tone_type: next.skinToneType,
      style_preferences: next.stylePreferences ?? [],
    });
    set({ profile: next });
  },

  addItem: async (item, file) => {
    const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.WARDROBE_ITEMS, ID.unique(), {
      user_id: USER_ID,
      name: item.name,
      category: item.category,
      sub_category: item.subCategory ?? null,
      primary_color: item.primaryColor,
      secondary_color: item.secondaryColor ?? null,
      color_family: item.colorFamily,
      style_tags: item.styleTags ?? [],
      occasion_tags: item.occasionTags ?? [],
      pattern: item.pattern,
      season: item.season ?? [],
      brand: item.brand ?? null,
      times_worn: 0,
      is_stored: false,
    });
    let mapped = mapWardrobeItem(doc);

    if (file) {
      const { uploadWardrobeImage } = await import("./imageUpload");
      const url = await uploadWardrobeImage(file, mapped.id);
      const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.WARDROBE_ITEMS, mapped.id, { image_url: url });
      mapped = mapWardrobeItem(updated);
    }

    set({ items: [mapped, ...get().items] });
    return mapped;
  },

  deleteItem: async (id) => {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.WARDROBE_ITEMS, id);
    // Also remove image from storage (best effort)
    try { await storage.deleteFile(BUCKET_ID, id); } catch {}
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
    const activeItems = items.filter((i) => !i.isStored);
    const candidates = generateOutfits(activeItems, profile);

    // Delete all unsaved outfits
    const { documents: unsaved } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.OUTFITS, [
      Query.equal("user_id", USER_ID),
      Query.equal("is_saved", false),
      Query.limit(500),
    ]);
    await Promise.all(unsaved.map((doc) => databases.deleteDocument(DATABASE_ID, COLLECTIONS.OUTFITS, doc.$id)));

    if (candidates.length > 0) {
      await Promise.all(
        candidates.map((c) =>
          databases.createDocument(DATABASE_ID, COLLECTIONS.OUTFITS, ID.unique(), {
            user_id: USER_ID,
            top_id: c.topId ?? null,
            bottom_id: c.bottomId ?? null,
            shoes_id: c.shoesId ?? null,
            jacket_id: c.jacketId ?? null,
            compatibility_score: c.score,
            occasion_tags: c.occasionTags,
            is_saved: false,
            is_favorite: false,
            worn_count: 0,
          })
        )
      );
    }

    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.OUTFITS, [
      Query.equal("user_id", USER_ID),
      Query.orderDesc("compatibility_score"),
      Query.limit(500),
    ]);
    set({ outfits: documents.map(mapOutfit), generating: false });
  },

  toggleSaved: async (id) => {
    const o = get().outfits.find((x) => x.id === id);
    if (!o) return;
    const next = !o.isSaved;
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.OUTFITS, id, { is_saved: next });
    set({ outfits: get().outfits.map((x) => (x.id === id ? { ...x, isSaved: next } : x)) });
  },

  toggleFavorite: async (id) => {
    const o = get().outfits.find((x) => x.id === id);
    if (!o) return;
    const next = !o.isFavorite;
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.OUTFITS, id, { is_favorite: next, is_saved: true });
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

    const histDoc = await databases.createDocument(DATABASE_ID, COLLECTIONS.OUTFIT_HISTORY, ID.unique(), {
      user_id: USER_ID,
      outfit_id: outfitId,
      worn_date: today,
      occasion: occasion ?? null,
      notes: null,
    });
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.OUTFITS, outfitId, {
      worn_count: o.wornCount + 1,
      is_saved: true,
    });

    const itemIds = [o.topId, o.bottomId, o.shoesId, o.jacketId].filter(Boolean) as string[];
    const updates = itemIds
      .map((id) => get().items.find((i) => i.id === id))
      .filter(Boolean) as WardrobeItem[];
    await Promise.all(
      updates.map((it) =>
        databases.updateDocument(DATABASE_ID, COLLECTIONS.WARDROBE_ITEMS, it.id, {
          times_worn: it.timesWorn + 1,
          last_worn: new Date().toISOString(),
        })
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
      history: [mapHistory(histDoc), ...get().history],
    });
  },

  setExplanation: async (outfitId, text) => {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.OUTFITS, outfitId, { ai_explanation: text });
    set({
      outfits: get().outfits.map((x) => (x.id === outfitId ? { ...x, aiExplanation: text } : x)),
    });
  },

  renameOutfit: async (outfitId, name) => {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.OUTFITS, outfitId, { name });
    set({ outfits: get().outfits.map((x) => (x.id === outfitId ? { ...x, name } : x)) });
  },

  rateWear: async (historyId, rating) => {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.OUTFIT_HISTORY, historyId, { rating });
    set({ history: get().history.map((h) => (h.id === historyId ? { ...h, rating } : h)) });
  },

  deleteHistory: async (historyId) => {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.OUTFIT_HISTORY, historyId);
    set({ history: get().history.filter((h) => h.id !== historyId) });
  },

  toggleStored: async (itemId) => {
    const item = get().items.find((i) => i.id === itemId);
    if (!item) return;
    const next = !item.isStored;
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.WARDROBE_ITEMS, itemId, { is_stored: next });
    set({ items: get().items.map((i) => (i.id === itemId ? { ...i, isStored: next } : i)) });
  },
}));
