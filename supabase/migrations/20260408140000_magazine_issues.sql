-- Admin-native magazine issues: public hub/archive resolve via API when published rows exist.
CREATE TABLE IF NOT EXISTS public.magazine_issues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year text NOT NULL,
  month_slug text NOT NULL,
  title_es text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  is_featured boolean NOT NULL DEFAULT false,
  cover_url text,
  pdf_url text,
  flipbook_url text,
  published_at timestamptz,
  display_order int NOT NULL DEFAULT 0,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT magazine_issues_year_month_unique UNIQUE (year, month_slug)
);

CREATE INDEX IF NOT EXISTS magazine_issues_status_idx ON public.magazine_issues (status);
CREATE INDEX IF NOT EXISTS magazine_issues_year_month_idx ON public.magazine_issues (year, month_slug);

COMMENT ON TABLE public.magazine_issues IS 'Leonix magazine metadata; public /api/magazine/manifest uses published+archived rows when present.';
COMMENT ON COLUMN public.magazine_issues.is_featured IS 'At most one published row should be featured; enforced in application layer.';

ALTER TABLE public.magazine_issues ENABLE ROW LEVEL SECURITY;
