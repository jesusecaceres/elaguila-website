-- Admin audit trail + team invite intents (service-role only; no anon reads).
-- Unlocks real rows on Activity log + Team when migrations are applied.

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  target_type text,
  target_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON public.admin_audit_log (created_at DESC);

COMMENT ON TABLE public.admin_audit_log IS 'Append-only admin actions from server (cookie-auth). No PII in meta by convention.';

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Team: record invite intent only — does not create Supabase Auth users or send email by itself.
CREATE TABLE IF NOT EXISTS public.admin_team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  note text
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_team_invites_email_lower_idx ON public.admin_team_invites (lower(email));

COMMENT ON TABLE public.admin_team_invites IS 'Recorded invite intent for staff; Auth/email delivery is a separate step.';

ALTER TABLE public.admin_team_invites ENABLE ROW LEVEL SECURITY;
