-- ============ TABLES ============

CREATE TABLE public.user_profile (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'User',
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
