
-- Single fixed user id used throughout the app (no auth)
-- 00000000-0000-0000-0000-000000000001

-- ============ TABLES ============

CREATE TABLE public.user_profile (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'Shreeraj',
  skin_tone_hex TEXT NOT NULL DEFAULT '#CC9674',
  eye_color_hex TEXT NOT NULL DEFAULT '#1F1919',
  hair_color_hex TEXT NOT NULL DEFAULT '#0A0B0B',
  skin_tone_type TEXT NOT NULL DEFAULT 'warm-medium',
  style_preferences TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.wardrobe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  primary_color TEXT NOT NULL,
  secondary_color TEXT,
  color_family TEXT NOT NULL,
  style_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  occasion_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  pattern TEXT NOT NULL DEFAULT 'solid',
  season TEXT[] DEFAULT ARRAY[]::TEXT[],
  brand TEXT,
  image_url TEXT,
  times_worn INTEGER NOT NULL DEFAULT 0,
  last_worn TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wardrobe_user ON public.wardrobe_items(user_id);
CREATE INDEX idx_wardrobe_category ON public.wardrobe_items(category);

CREATE TABLE public.outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  top_id UUID REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  bottom_id UUID REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  shoes_id UUID REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  jacket_id UUID REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  compatibility_score INTEGER NOT NULL DEFAULT 0,
  occasion_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_saved BOOLEAN NOT NULL DEFAULT false,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  worn_count INTEGER NOT NULL DEFAULT 0,
  ai_explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_outfits_user ON public.outfits(user_id);
CREATE INDEX idx_outfits_score ON public.outfits(compatibility_score DESC);

CREATE TABLE public.outfit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE CASCADE,
  worn_date DATE NOT NULL,
  occasion TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_user ON public.outfit_history(user_id);

-- ============ RLS (open in single-user mode) ============

ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read user_profile" ON public.user_profile FOR SELECT USING (true);
CREATE POLICY "Public write user_profile" ON public.user_profile FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update user_profile" ON public.user_profile FOR UPDATE USING (true);

CREATE POLICY "Public read wardrobe" ON public.wardrobe_items FOR SELECT USING (true);
CREATE POLICY "Public write wardrobe" ON public.wardrobe_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update wardrobe" ON public.wardrobe_items FOR UPDATE USING (true);
CREATE POLICY "Public delete wardrobe" ON public.wardrobe_items FOR DELETE USING (true);

CREATE POLICY "Public read outfits" ON public.outfits FOR SELECT USING (true);
CREATE POLICY "Public write outfits" ON public.outfits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update outfits" ON public.outfits FOR UPDATE USING (true);
CREATE POLICY "Public delete outfits" ON public.outfits FOR DELETE USING (true);

CREATE POLICY "Public read history" ON public.outfit_history FOR SELECT USING (true);
CREATE POLICY "Public write history" ON public.outfit_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update history" ON public.outfit_history FOR UPDATE USING (true);
CREATE POLICY "Public delete history" ON public.outfit_history FOR DELETE USING (true);

-- ============ STORAGE BUCKET ============

INSERT INTO storage.buckets (id, name, public) VALUES ('wardrobe-images', 'wardrobe-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read wardrobe images" ON storage.objects FOR SELECT USING (bucket_id = 'wardrobe-images');
CREATE POLICY "Public upload wardrobe images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'wardrobe-images');
CREATE POLICY "Public update wardrobe images" ON storage.objects FOR UPDATE USING (bucket_id = 'wardrobe-images');
CREATE POLICY "Public delete wardrobe images" ON storage.objects FOR DELETE USING (bucket_id = 'wardrobe-images');

-- ============ TIMESTAMPS TRIGGER ============

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_user_profile_updated BEFORE UPDATE ON public.user_profile
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SEED DATA ============

INSERT INTO public.user_profile (id, display_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Shreeraj')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.wardrobe_items (user_id, name, category, primary_color, color_family, pattern, brand, style_tags, occasion_tags, season) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Nike Killshot 2', 'shoes', '#F0EBE0', 'cream', 'solid', 'Nike', ARRAY['casual','smart-casual','retro'], ARRAY['casual','weekend','smart-casual'], ARRAY['spring','summer','fall']),
  ('00000000-0000-0000-0000-000000000001', 'New Balance 1906R', 'shoes', '#8A9BAA', 'grey', 'solid', 'New Balance', ARRAY['casual','sporty','street'], ARRAY['casual','weekend'], ARRAY['spring','summer','fall','winter']),
  ('00000000-0000-0000-0000-000000000001', 'Levi''s Grey Denim Jacket', 'jacket', '#8A8880', 'grey', 'solid', 'Levi''s', ARRAY['casual','smart-casual'], ARRAY['casual','weekend'], ARRAY['spring','fall']),
  ('00000000-0000-0000-0000-000000000001', 'Bershka Brown Leather Jacket', 'jacket', '#2C1A0E', 'warm-earth', 'solid', 'Bershka', ARRAY['statement','smart-casual','date-night'], ARRAY['date-night','going-out','weekend'], ARRAY['fall','winter']),
  ('00000000-0000-0000-0000-000000000001', 'H&M Blue Striped Camp Shirt', 'shirt', '#B8D4E8', 'cool-blue', 'stripe', 'H&M', ARRAY['casual','smart-casual'], ARRAY['casual','weekend','smart-casual'], ARRAY['spring','summer']),
  ('00000000-0000-0000-0000-000000000001', 'H&M Pink Plaid Shirt', 'shirt', '#D4A0A0', 'warm-pink', 'plaid', 'H&M', ARRAY['casual','statement'], ARRAY['casual','weekend'], ARRAY['spring','fall']),
  ('00000000-0000-0000-0000-000000000001', 'Tommy Hilfiger Oxford Shirt', 'shirt', '#A8C8E8', 'cool-blue', 'solid', 'Tommy Hilfiger', ARRAY['smart-casual','office'], ARRAY['office','smart-casual','date-night'], ARRAY['spring','summer','fall']),
  ('00000000-0000-0000-0000-000000000001', 'Batman Camp Shirt', 'shirt', '#0D0D0D', 'dark', 'graphic', NULL, ARRAY['statement','graphic','street'], ARRAY['casual','going-out','weekend'], ARRAY['spring','summer','fall']),
  ('00000000-0000-0000-0000-000000000001', 'Black Linen Camp Shirt', 'shirt', '#1A1A1A', 'dark', 'solid', NULL, ARRAY['smart-casual','date-night','minimalist'], ARRAY['date-night','going-out','smart-casual'], ARRAY['spring','summer']),
  ('00000000-0000-0000-0000-000000000001', 'Cream Seersucker Shirt', 'shirt', '#E8DFD0', 'cream', 'texture', NULL, ARRAY['smart-casual','minimalist'], ARRAY['smart-casual','office','date-night'], ARRAY['spring','summer']),
  ('00000000-0000-0000-0000-000000000001', 'Black Slim Jeans', 'jeans', '#111111', 'dark', 'solid', NULL, ARRAY['casual','smart-casual','minimalist'], ARRAY['casual','weekend','going-out','date-night'], ARRAY['spring','fall','winter']),
  ('00000000-0000-0000-0000-000000000001', 'Dark Navy Chinos', 'pants', '#1F2D4A', 'cool-blue', 'solid', NULL, ARRAY['smart-casual','office'], ARRAY['office','smart-casual','date-night'], ARRAY['spring','fall','winter']),
  ('00000000-0000-0000-0000-000000000001', 'Beige Chinos', 'pants', '#C8A97E', 'warm-earth', 'solid', NULL, ARRAY['casual','smart-casual'], ARRAY['casual','weekend','smart-casual'], ARRAY['spring','summer','fall']),
  ('00000000-0000-0000-0000-000000000001', 'Light Grey Trousers', 'pants', '#C5C5C5', 'grey', 'solid', NULL, ARRAY['smart-casual','office'], ARRAY['office','smart-casual'], ARRAY['spring','summer','fall']),
  ('00000000-0000-0000-0000-000000000001', 'Olive Cargo Pants', 'pants', '#5C6B3A', 'warm-earth', 'solid', NULL, ARRAY['casual','street'], ARRAY['casual','weekend','going-out'], ARRAY['spring','fall','winter']);
