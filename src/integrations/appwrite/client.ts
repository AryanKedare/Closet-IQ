import { Client, Databases, Storage, ID, Query } from 'appwrite';

export const ENDPOINT    = 'https://cloud.appwrite.io/v1';
export const PROJECT_ID  = import.meta.env.VITE_APPWRITE_PROJECT_ID!;
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID!;
export const BUCKET_ID   = import.meta.env.VITE_APPWRITE_BUCKET_ID!;

export const COLLECTIONS = {
  WARDROBE_ITEMS: 'wardrobe_items',
  OUTFITS: 'outfits',
  OUTFIT_HISTORY: 'outfit_history',
  USER_PROFILE: 'user_profile',
} as const;

const appwriteClient = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID);

export const databases = new Databases(appwriteClient);
export const storage   = new Storage(appwriteClient);
export { ID, Query };
