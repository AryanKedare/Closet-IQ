import type {
  BodyDetails,
  ContrastLevel,
  EyeColor,
  HairColor,
  PersonalColorAnswers,
  SkinTone,
  SkinUndertone,
} from "./personalColor";

export type Category =
  | "shirt"
  | "tshirt"
  | "pants"
  | "jeans"
  | "shorts"
  | "jacket"
  | "shoes"
  | "accessory";

export type ColorFamily =
  | "neutral"
  | "warm-earth"
  | "cool-blue"
  | "warm-pink"
  | "dark"
  | "grey"
  | "cream";

export type Pattern = "solid" | "stripe" | "plaid" | "graphic" | "texture";

export type WardrobeItem = {
  id: string;
  userId: string;
  name: string;
  category: Category;
  subCategory?: string | null;
  primaryColor: string;
  secondaryColor?: string | null;
  colorFamily: ColorFamily;
  styleTags: string[];
  occasionTags: string[];
  pattern: Pattern;
  season: string[];
  brand?: string | null;
  imageUrl?: string | null;
  timesWorn: number;
  lastWorn?: string | null;
  createdAt: string;
  isStored: boolean;
};

export type UserProfile = {
  id: string;
  displayName: string;
  skinToneHex: string;
  eyeColorHex: string;
  hairColorHex: string;
  skinToneType: string;
  stylePreferences: string[];
  onboardingCompleted: boolean;
  skinTone?: SkinTone | null;
  skinUndertone?: SkinUndertone | null;
  hairColor?: HairColor | null;
  eyeColor?: EyeColor | null;
  contrastLevel?: ContrastLevel | null;
  recommendedPalette?: string[];
  bodyDetails?: BodyDetails;
};

export type UserProfileUpdate = Partial<UserProfile> & Partial<PersonalColorAnswers>;

export type Outfit = {
  id: string;
  userId: string;
  topId: string | null;
  bottomId: string | null;
  shoesId: string | null;
  jacketId: string | null;
  compatibilityScore: number;
  occasionTags: string[];
  isSaved: boolean;
  isFavorite: boolean;
  wornCount: number;
  aiExplanation?: string | null;
  name?: string | null;
  createdAt: string;
};

export type OutfitHistory = {
  id: string;
  userId: string;
  outfitId: string;
  wornDate: string;
  occasion?: string | null;
  notes?: string | null;
  rating?: number | null;
};
