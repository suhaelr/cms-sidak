
CREATE TABLE public.hero_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage hero_slides" ON public.hero_slides FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Public read active hero_slides" ON public.hero_slides FOR SELECT USING (is_active = true);

-- Insert dummy slides
INSERT INTO public.hero_slides (title, image_url, sort_order) VALUES
  ('Inspeksi Dapur SPPG Jakarta', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80', 1),
  ('Pemeriksaan Kualitas Bahan Makanan', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80', 2),
  ('Sidak Kebersihan Dapur Program MBG', 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1920&q=80', 3),
  ('Monitoring Proses Pengolahan Makanan', 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=1920&q=80', 4),
  ('Verifikasi Standar Gizi Makanan', 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1920&q=80', 5);
