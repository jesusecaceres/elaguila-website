-- Persisted overlays for Clasificados category posture (admin); public site still uses code until wired.
CREATE TABLE IF NOT EXISTS public.site_category_config (
  slug text NOT NULL PRIMARY KEY,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'hidden')),
  sort_order int NOT NULL DEFAULT 0,
  operational_status text NOT NULL DEFAULT 'coming_soon'
    CHECK (operational_status IN ('live', 'staged', 'coming_soon', 'hidden')),
  highlight boolean NOT NULL DEFAULT false,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_category_config_sort_idx ON public.site_category_config (sort_order);

COMMENT ON TABLE public.site_category_config IS 'Admin overrides for category registry; merge with categoryConfig in server code.';

ALTER TABLE public.site_category_config ENABLE ROW LEVEL SECURITY;
