export interface RegionRef {
  name: string;
  type?: string;
  parent?: RegionRef | null;
}

export interface Region {
  id: string;
  name: string;
  type: string;
  parent_id?: string | null;
}

export interface RegionsResponse {
  data: Region[];
}

export interface Kitchen {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  region_id?: string | null;
  status: string;
}

export interface FindingCategory {
  id: string;
  name: string;
  description?: string | null;
}

export interface SanctionType {
  id: string;
  name: string;
  description?: string | null;
}

export interface NewsCategory {
  id: string;
  slug: string;
  full_label: string;
  short_label: string;
  badge_color: string;
  is_builtin: boolean;
  sort_order: number;
  article_count?: number;
}

export interface Inspection {
  id: string;
  date: string;
  region_id?: string | null;
  kitchen_id?: string | null;
  summary?: string | null;
  publication_status: string;
  show_identity?: boolean;
  show_media?: boolean;
  regions?: RegionRef | null;
  sppg_kitchens?: { code: string; name: string } | null;
  findings?: { severity: string }[];
}

export interface Finding {
  id: string;
  inspection_id: string;
  category: string;
  severity: string;
  description: string;
  recommendation?: string | null;
}

export interface FollowUp {
  id: string;
  inspection_id: string;
  finding_id?: string | null;
  action_type: string;
  deadline?: string | null;
  status: string;
  pic?: string | null;
  notes?: string | null;
}

export interface Sanction {
  id: string;
  inspection_id?: string | null;
  kitchen_id?: string | null;
  violation_summary: string;
  sanction_type: string;
  date: string;
  status: string;
  follow_up_status: string;
  is_public?: boolean;
  show_identity?: boolean;
  sppg_kitchens?: { code: string; name: string; regions?: RegionRef | null } | null;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  cover_image?: string | null;
  cover_image_source?: string | null;
  region_id?: string | null;
  published_at?: string | null;
  status?: string;
  is_highlight?: boolean;
  is_breaking?: boolean;
  tags?: string[];
  created_at?: string;
  regions?: RegionRef | null;
  related?: NewsArticleSummary[];
}

export interface NewsArticleSummary {
  id: string;
  title: string;
  slug: string;
  published_at?: string | null;
}

export interface Document {
  id: string;
  title: string;
  category: string;
  version: string;
  file_url?: string | null;
  is_public?: boolean;
  published_at?: string | null;
}

export interface Complaint {
  id: string;
  ticket_no: string;
  name?: string | null;
  contact: string;
  region_id?: string | null;
  topic: string;
  content: string;
  attachment_url?: string | null;
  status: string;
  public_status_message?: string | null;
  internal_notes?: string | null;
  regions?: RegionRef | null;
  created_at?: string;
}

export interface ComplaintUpdates {
  status: string;
  public_status_message?: string;
  internal_notes?: string;
}

export interface DashboardStats {
  counts: {
    inspections: number;
    findings: number;
    followups_done: number;
    sanctions_active: number;
    complaints_new: number;
    documents_public: number;
  };
  inspection_dates: string[];
  recent_inspections: Inspection[];
  recent_complaints: Complaint[];
}

export interface NewsComment {
  id: string;
  article_slug: string;
  user_id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  is_anonymous?: boolean;
  likes: number;
  dislikes: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
  } | null;
}
