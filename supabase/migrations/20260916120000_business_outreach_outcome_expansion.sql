-- WHOLE-PRODUCT PARTIAL-CLOSURE — Outreach contact-attempt outcome expansion (N_OUTREACH /
-- O_CONTACT_ATTEMPTS). Reuses the existing business_sales_notes / business_follow_ups CRM domain
-- (Gate BCO-4A) rather than creating a second, duplicate "contact attempt" table — a contact
-- attempt already IS a business_sales_notes row with a non-null contact_method; the only real gap
-- was that the outcome CHECK constraint could not distinguish "spoke with staff" from "spoke with
-- the decision maker", and had no "meeting requested" outcome, both of which the canonical Staff
-- Command Center Master Integration Bible §12 event form requires. Purely additive: every existing
-- stored value stays valid, so no backfill/data migration is needed.
ALTER TABLE public.business_sales_notes DROP CONSTRAINT IF EXISTS business_sales_notes_outcome_check;

ALTER TABLE public.business_sales_notes
  ADD CONSTRAINT business_sales_notes_outcome_check CHECK (
    outcome IS NULL OR outcome IN (
      'reached', 'no_answer', 'left_message', 'scheduled_follow_up', 'not_interested', 'interested', 'other',
      'spoke_with_staff', 'spoke_with_decision_maker', 'meeting_requested'
    )
  );

COMMENT ON COLUMN public.business_sales_notes.outcome IS
  'Contact-attempt result (Staff Bible §12). reached/left_message/scheduled_follow_up are pre-existing legacy values kept for historical rows; new attempts should prefer the more specific spoke_with_staff / spoke_with_decision_maker / meeting_requested / no_answer / interested / not_interested set.';
