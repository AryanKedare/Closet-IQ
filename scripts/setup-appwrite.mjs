// Run once to create all Appwrite collections, attributes, indexes, and bucket permissions.
// Usage: APPWRITE_API_KEY=<your_key> node scripts/setup-appwrite.mjs
import { Client, Databases, Storage, Permission, Role, IndexType } from 'node-appwrite';

const ENDPOINT = 'https://cloud.appwrite.io/v1';
const PROJECT_ID = '6a28a77d0013aee2a168';
const DATABASE_ID = '6a28a85a000e81b0b254';
const BUCKET_ID = '6a28a8e6000b4c079139';
const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
  console.error('Error: Set APPWRITE_API_KEY env var before running.');
  console.error('  Go to Appwrite → your project → Settings → API Keys → Create API Key');
  console.error('  Then: APPWRITE_API_KEY=your_key node scripts/setup-appwrite.mjs');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);
const storage = new Storage(client);

const anyPermissions = [
  Permission.read(Role.any()),
  Permission.create(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
];

async function tryCreate(label, fn) {
  try {
    await fn();
    console.log(`  ✓ ${label}`);
  } catch (e) {
    if (e.code === 409) {
      console.log(`  - ${label} (already exists)`);
    } else {
      console.warn(`  ! ${label}: ${e.message}`);
    }
  }
}

async function createCollection(id, name) {
  await tryCreate(`Collection: ${name}`, () =>
    databases.createCollection(DATABASE_ID, id, name, anyPermissions, false)
  );
}

async function str(col, key, size, required, def, array) {
  await tryCreate(`${col}.${key}`, () =>
    databases.createStringAttribute(DATABASE_ID, col, key, size, required, def, array)
  );
}

async function int(col, key, required, def) {
  await tryCreate(`${col}.${key}`, () =>
    databases.createIntegerAttribute(DATABASE_ID, col, key, required, undefined, undefined, def)
  );
}

async function float(col, key, required, def) {
  await tryCreate(`${col}.${key}`, () =>
    databases.createFloatAttribute(DATABASE_ID, col, key, required, undefined, undefined, def)
  );
}

async function bool(col, key, required, def) {
  await tryCreate(`${col}.${key}`, () =>
    databases.createBooleanAttribute(DATABASE_ID, col, key, required, def)
  );
}

async function main() {
  console.log('\n── Creating collections ──');
  await createCollection('wardrobe_items', 'wardrobe_items');
  await createCollection('outfits', 'outfits');
  await createCollection('outfit_history', 'outfit_history');
  await createCollection('user_profile', 'user_profile');

  // Small wait for collections to be ready
  await new Promise(r => setTimeout(r, 1500));

  console.log('\n── wardrobe_items attributes ──');
  await str('wardrobe_items', 'user_id', 36, true);
  await str('wardrobe_items', 'name', 255, true);
  await str('wardrobe_items', 'category', 64, true);
  await str('wardrobe_items', 'sub_category', 64, false);
  await str('wardrobe_items', 'primary_color', 64, true);
  await str('wardrobe_items', 'secondary_color', 64, false);
  await str('wardrobe_items', 'color_family', 64, true);
  await str('wardrobe_items', 'style_tags', 64, false, null, true);
  await str('wardrobe_items', 'occasion_tags', 64, false, null, true);
  await str('wardrobe_items', 'pattern', 64, false, 'solid');
  await str('wardrobe_items', 'season', 64, false, null, true);
  await str('wardrobe_items', 'brand', 128, false);
  await str('wardrobe_items', 'image_url', 512, false);
  await int('wardrobe_items', 'times_worn', false, 0);
  await str('wardrobe_items', 'last_worn', 64, false);
  await bool('wardrobe_items', 'is_stored', false, false);

  console.log('\n── outfits attributes ──');
  await str('outfits', 'user_id', 36, true);
  await str('outfits', 'top_id', 36, false);
  await str('outfits', 'bottom_id', 36, false);
  await str('outfits', 'shoes_id', 36, false);
  await str('outfits', 'jacket_id', 36, false);
  await float('outfits', 'compatibility_score', false, 0);
  await str('outfits', 'occasion_tags', 64, false, null, true);
  await bool('outfits', 'is_saved', false, false);
  await bool('outfits', 'is_favorite', false, false);
  await int('outfits', 'worn_count', false, 0);
  await str('outfits', 'ai_explanation', 5000, false);
  await str('outfits', 'name', 255, false);

  console.log('\n── outfit_history attributes ──');
  await str('outfit_history', 'user_id', 36, true);
  await str('outfit_history', 'outfit_id', 36, false);
  await str('outfit_history', 'worn_date', 32, true);
  await str('outfit_history', 'occasion', 128, false);
  await str('outfit_history', 'notes', 1000, false);
  await int('outfit_history', 'rating', false);

  console.log('\n── user_profile attributes ──');
  await str('user_profile', 'display_name', 128, false, '');
  await str('user_profile', 'skin_tone_hex', 16, false, '');
  await str('user_profile', 'eye_color_hex', 16, false, '');
  await str('user_profile', 'hair_color_hex', 16, false, '');
  await str('user_profile', 'skin_tone_type', 64, false, '');
  await str('user_profile', 'style_preferences', 64, false, null, true);

  console.log('\nWaiting for attributes to become active...');
  await new Promise(r => setTimeout(r, 4000));

  console.log('\n── Creating indexes ──');
  for (const col of ['wardrobe_items', 'outfits', 'outfit_history']) {
    await tryCreate(`${col}: index on user_id`, () =>
      databases.createIndex(DATABASE_ID, col, 'user_id_idx', IndexType.Key, ['user_id'])
    );
  }

  console.log('\n── Updating bucket permissions ──');
  await tryCreate('wardrobe-images bucket: public access', () =>
    storage.updateBucket(
      BUCKET_ID,
      'wardrobe-images',
      anyPermissions,
      false,
      false,
      ['image/webp', 'image/jpeg', 'image/png', 'image/gif'],
      5 * 1024 * 1024
    )
  );

  console.log('\n✅ Appwrite setup complete!\n');
}

main().catch(e => {
  console.error('Setup failed:', e.message);
  process.exit(1);
});
