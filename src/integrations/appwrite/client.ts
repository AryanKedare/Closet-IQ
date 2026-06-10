import { Client, Databases, Storage, ID, Query } from 'appwrite';

export const ENDPOINT = 'https://cloud.appwrite.io/v1';
export const PROJECT_ID = '6a28a77d0013aee2a168';
export const DATABASE_ID = '6a28a85a000e81b0b254';
export const BUCKET_ID = '6a28a8e6000b4c079139';

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
export const storage = new Storage(appwriteClient);
export { ID, Query };
