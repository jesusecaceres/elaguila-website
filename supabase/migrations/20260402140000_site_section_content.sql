-- Key/value CMS payloads for section workspaces (Tienda storefront, Home, Contacto, etc.).
-- Read/write from Next.js with service role only (same pattern as tienda_catalog_items).

CREATE TABLE IF NOT EXISTS public.site_section_content (
  section_key text PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_section_content_updated_idx ON public.site_section_content (updated_at DESC);

ALTER TABLE public.site_section_content ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.site_section_content IS 'Editorial payloads keyed by workspace; empty {} means code defaults apply.';
