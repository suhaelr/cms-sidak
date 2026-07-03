CREATE TABLE news_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  full_label TEXT NOT NULL,
  short_label TEXT NOT NULL,
  badge_color TEXT NOT NULL DEFAULT 'muted',
  is_builtin BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO news_categories (slug, full_label, short_label, badge_color, is_builtin, sort_order) VALUES
  ('sidak', 'Sidak SPPG', 'SIDAK', 'sky', true, 1),
  ('laporan', 'Kajian & Evaluasi', 'KAJIAN', 'violet', true, 2),
  ('berita_umum', 'Berita Umum', 'BERITA', 'emerald', true, 3)
ON CONFLICT (slug) DO NOTHING;

-- Map legacy category labels to new slugs
UPDATE news SET category = 'sidak' WHERE category IN ('Temuan', 'Sidak');
UPDATE news SET category = 'laporan' WHERE category IN ('Edukasi', 'Kajian');
UPDATE news SET category = 'berita_umum' WHERE category IN ('Tindak Lanjut', 'Kebijakan', 'Berita');
