-- Staff follow-up on internal support tickets (admin-only; no public portal).
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS staff_internal_notes text,
  ADD COLUMN IF NOT EXISTS escalation_tag text;

COMMENT ON COLUMN public.support_tickets.staff_internal_notes IS 'Operator notes persisted in DB; not shown to end users.';
COMMENT ON COLUMN public.support_tickets.escalation_tag IS 'Optional routing tag: Billing, Technical, Fraud, Content — enforced in app.';

ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS support_tickets_escalation_tag_check;

ALTER TABLE public.support_tickets
  ADD CONSTRAINT support_tickets_escalation_tag_check
  CHECK (
    escalation_tag IS NULL
    OR escalation_tag IN ('Billing', 'Technical', 'Fraud', 'Content')
  );
