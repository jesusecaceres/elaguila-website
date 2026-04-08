-- Public read of category overlays (safe: no secrets) for merged publish chooser + anon clients.
DROP POLICY IF EXISTS site_category_config_select_public ON public.site_category_config;
CREATE POLICY site_category_config_select_public
  ON public.site_category_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin roster metadata (not Auth.users); service role used by Leonix admin API.
CREATE TABLE IF NOT EXISTS public.admin_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'read_only',
  is_active boolean NOT NULL DEFAULT true,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_team_members_email_lower_idx ON public.admin_team_members (lower(email));

COMMENT ON TABLE public.admin_team_members IS 'Leonix admin roster; operational record only — provision Auth users separately in Supabase.';

ALTER TABLE public.admin_team_members ENABLE ROW LEVEL SECURITY;

-- Minimal internal ticket log (admin-only writes via service role).
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_created_idx ON public.support_tickets (created_at DESC);

COMMENT ON TABLE public.support_tickets IS 'Internal support log; not a public helpdesk — no end-user portal wired yet.';

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
