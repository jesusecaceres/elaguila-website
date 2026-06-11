-- Leonix lead CRM pipeline: expanded statuses + follow-up tracking (LEADS-CRM-01).

ALTER TABLE public.leonix_leads
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS follow_up_at timestamptz;

-- Migrate legacy closed -> won before tightening constraint.
UPDATE public.leonix_leads SET status = 'won' WHERE status = 'closed';

ALTER TABLE public.leonix_leads DROP CONSTRAINT IF EXISTS leonix_leads_status_chk;

ALTER TABLE public.leonix_leads ADD CONSTRAINT leonix_leads_status_chk CHECK (
  status IN (
    'new',
    'needs_reply',
    'contacted',
    'waiting_on_client',
    'qualified',
    'won',
    'lost',
    'archived'
  )
);

CREATE INDEX IF NOT EXISTS leonix_leads_follow_up_at_idx
  ON public.leonix_leads (follow_up_at)
  WHERE follow_up_at IS NOT NULL;

COMMENT ON COLUMN public.leonix_leads.last_contacted_at IS
  'When admin last reached out (email/phone). Set via mark contacted action.';

COMMENT ON COLUMN public.leonix_leads.follow_up_at IS
  'Optional follow-up reminder date for sales ops.';
