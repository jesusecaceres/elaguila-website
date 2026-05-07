-- Reusable ordered content blocks for public website pages (admin foundation).
-- Access: same pattern as `site_section_content` — Next.js uses Supabase service role
-- for reads/writes; RLS is enabled with no broad anon/authenticated policies.
-- Do not grant public SELECT/INSERT/UPDATE here unless you add explicit reviewed policies.

CREATE TABLE IF NOT EXISTS public.site_page_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL,
  locale text NOT NULL DEFAULT 'es',
  sort_index integer NOT NULL DEFAULT 0,
  block_type text NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_page_blocks_page_key_nonempty CHECK (length(trim(page_key)) > 0),
  CONSTRAINT site_page_blocks_locale_allowed CHECK (locale = ANY (ARRAY['es'::text, 'en'::text, 'neutral'::text])),
  CONSTRAINT site_page_blocks_block_type_nonempty CHECK (length(trim(block_type)) > 0)
);

CREATE INDEX IF NOT EXISTS site_page_blocks_page_key_idx ON public.site_page_blocks (page_key);

CREATE INDEX IF NOT EXISTS site_page_blocks_page_locale_sort_idx
  ON public.site_page_blocks (page_key, locale, sort_index ASC);

CREATE INDEX IF NOT EXISTS site_page_blocks_page_visible_idx ON public.site_page_blocks (page_key, visible);

COMMENT ON COLUMN public.site_page_blocks.page_key IS
  'Stable page identifier (e.g. iglesias). Not necessarily equal to site_section_content.section_key.';

COMMENT ON COLUMN public.site_page_blocks.locale IS 'es | en | neutral — application validates.';

COMMENT ON COLUMN public.site_page_blocks.sort_index IS 'Ascending display order within page_key + locale.';

COMMENT ON COLUMN public.site_page_blocks.block_type IS
  'Allowlisted block kind (hero, rich_text, …). Validated in TypeScript before insert.';

COMMENT ON COLUMN public.site_page_blocks.payload IS 'Type-specific JSON; defaults to empty object.';

COMMENT ON COLUMN public.site_page_blocks.updated_at IS
  'Updated on each row write by application (upsert/replace). No DB-level updated_at trigger in this repo for site_section_content either.';

ALTER TABLE public.site_page_blocks ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.site_page_blocks IS
  'Ordered public content blocks per page_key and locale; payload shapes enforced in app. '
  'RLS enabled with no broad policies — use service role from trusted Next.js server only (same posture as site_section_content). '
  'See docs/site-page-blocks-foundation.md.';
