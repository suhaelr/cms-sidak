
-- Regions table
CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('province', 'city')),
  parent_id UUID REFERENCES public.regions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Admins manage regions" ON public.regions FOR ALL USING (public.is_admin(auth.uid()));

-- SPPG Kitchens table
CREATE TABLE public.sppg_kitchens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  region_id UUID REFERENCES public.regions(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sppg_kitchens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read kitchens" ON public.sppg_kitchens FOR SELECT USING (true);
CREATE POLICY "Admins manage kitchens" ON public.sppg_kitchens FOR ALL USING (public.is_admin(auth.uid()));

-- Finding categories reference
CREATE TABLE public.finding_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finding_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read finding_categories" ON public.finding_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage finding_categories" ON public.finding_categories FOR ALL USING (public.is_admin(auth.uid()));

-- Sanction types reference
CREATE TABLE public.sanction_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sanction_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sanction_types" ON public.sanction_types FOR SELECT USING (true);
CREATE POLICY "Admins manage sanction_types" ON public.sanction_types FOR ALL USING (public.is_admin(auth.uid()));

-- Inspections table
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  region_id UUID REFERENCES public.regions(id),
  kitchen_id UUID REFERENCES public.sppg_kitchens(id),
  summary TEXT,
  publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','submitted','verified','approved','published')),
  show_identity BOOLEAN NOT NULL DEFAULT false,
  show_media BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  verified_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published inspections" ON public.inspections FOR SELECT USING (publication_status = 'published' OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage inspections" ON public.inspections FOR ALL USING (public.is_admin(auth.uid()));

-- Inspection checklists
CREATE TABLE public.inspection_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  item_label TEXT NOT NULL,
  value_bool BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.inspection_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read checklists of published" ON public.inspection_checklists FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.inspections WHERE id = inspection_id AND (publication_status = 'published' OR public.is_admin(auth.uid())))
);
CREATE POLICY "Admins manage checklists" ON public.inspection_checklists FOR ALL USING (public.is_admin(auth.uid()));

-- Findings
CREATE TABLE public.findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('ringan','sedang','berat')),
  description TEXT NOT NULL,
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read findings of published" ON public.findings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.inspections WHERE id = inspection_id AND (publication_status = 'published' OR public.is_admin(auth.uid())))
);
CREATE POLICY "Admins manage findings" ON public.findings FOR ALL USING (public.is_admin(auth.uid()));

-- Media
CREATE TABLE public.medias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo','video')),
  url TEXT NOT NULL,
  caption TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read public media" ON public.medias FOR SELECT USING (
  is_public = true OR public.is_admin(auth.uid())
);
CREATE POLICY "Admins manage medias" ON public.medias FOR ALL USING (public.is_admin(auth.uid()));

-- Follow-ups
CREATE TABLE public.followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES public.findings(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'belum' CHECK (status IN ('belum','proses','selesai','perlu_sidak_ulang')),
  pic TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read followups of published" ON public.followups FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.inspections WHERE id = inspection_id AND (publication_status = 'published' OR public.is_admin(auth.uid())))
);
CREATE POLICY "Admins manage followups" ON public.followups FOR ALL USING (public.is_admin(auth.uid()));

-- Sanctions
CREATE TABLE public.sanctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES public.inspections(id),
  kitchen_id UUID REFERENCES public.sppg_kitchens(id),
  violation_summary TEXT NOT NULL,
  sanction_type TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','tindak_lanjut','selesai','dicabut')),
  follow_up_status TEXT NOT NULL DEFAULT 'belum' CHECK (follow_up_status IN ('belum','proses','selesai')),
  is_public BOOLEAN NOT NULL DEFAULT false,
  show_identity BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sanctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read public sanctions" ON public.sanctions FOR SELECT USING (is_public = true OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage sanctions" ON public.sanctions FOR ALL USING (public.is_admin(auth.uid()));

-- News
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image TEXT,
  region_id UUID REFERENCES public.regions(id),
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published news" ON public.news FOR SELECT USING (status = 'published' OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage news" ON public.news FOR ALL USING (public.is_admin(auth.uid()));

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  file_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read public documents" ON public.documents FOR SELECT USING (is_public = true OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage documents" ON public.documents FOR ALL USING (public.is_admin(auth.uid()));

-- Complaints
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no TEXT NOT NULL UNIQUE,
  name TEXT,
  contact TEXT NOT NULL,
  region_id UUID REFERENCES public.regions(id),
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','verified','in_progress','resolved','rejected')),
  public_status_message TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert complaints" ON public.complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read own complaint by ticket" ON public.complaints FOR SELECT USING (true);
CREATE POLICY "Admins manage complaints" ON public.complaints FOR ALL USING (public.is_admin(auth.uid()));

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  entity TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  changes_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Updated_at triggers for all tables
CREATE TRIGGER update_sppg_kitchens_updated_at BEFORE UPDATE ON public.sppg_kitchens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_followups_updated_at BEFORE UPDATE ON public.followups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sanctions_updated_at BEFORE UPDATE ON public.sanctions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
