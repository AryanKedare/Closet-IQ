-- Run this in Supabase Dashboard > SQL Editor

-- 1. Outfit naming
ALTER TABLE outfits ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Season rotation / storage mode for wardrobe items
ALTER TABLE wardrobe_items ADD COLUMN IF NOT EXISTS is_stored BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Wear rating on history (1 = didn't feel great, 2 = ok, 3 = loved it)
ALTER TABLE outfit_history ADD COLUMN IF NOT EXISTS rating SMALLINT CHECK (rating BETWEEN 1 AND 3);
