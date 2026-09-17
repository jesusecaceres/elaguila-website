-- Business Development & Growth Engine, Gate D — first-class assessment review-decision states.
--
-- Gate C only had "needs_review -> reviewed" (ACCEPT AS WORKING GUIDANCE). This migration adds the
-- two states Gate C explicitly deferred: 'needs_correction' and 'rejected', matching the smallest
-- additive model possible:
--   - status gains two new allowed values (widened CHECK, no column removed/renamed);
--   - the existing reviewed_at/reviewed_by_roster_id/reviewed_by_auth_user_id/reviewed_by_role/
--     operator_review_notes columns are reused generically as "review decision metadata" for ALL
--     three decisions (accept/needs_correction/reject), not only acceptance — they were already
--     actor+timestamp+note fields with no column literally named "accepted_*", so no new column is
--     needed to record who made a correction/rejection decision, when, or why.
--   - the existing reviewed_atomic/reviewed_requires_status CHECK constraints are widened to match.
--
-- No data is deleted, no column is dropped, no existing row is touched. Fully additive/backward
-- compatible. NOT applied remotely by this migration file's authoring session — see the Gate D
-- migration-integration audit in that gate's final report.

ALTER TABLE public.business_growth_assessments
  DROP CONSTRAINT IF EXISTS business_growth_assessments_status_check;

ALTER TABLE public.business_growth_assessments
  ADD CONSTRAINT business_growth_assessments_status_check
  CHECK (status IN ('draft', 'needs_review', 'reviewed', 'needs_correction', 'rejected', 'superseded'));

ALTER TABLE public.business_growth_assessments
  DROP CONSTRAINT IF EXISTS business_growth_assessments_reviewed_requires_status_chk;

ALTER TABLE public.business_growth_assessments
  ADD CONSTRAINT business_growth_assessments_reviewed_requires_status_chk
  CHECK (status IN ('reviewed', 'needs_correction', 'rejected', 'superseded') OR reviewed_at IS NULL);

COMMENT ON COLUMN public.business_growth_assessments.status IS
  'draft | needs_review | reviewed (accepted as working guidance) | needs_correction (preserved, reviewer left a correction note, not accepted) | rejected (preserved, reviewer left a reason, never shown as working guidance) | superseded (replaced by a newer version).';
COMMENT ON COLUMN public.business_growth_assessments.operator_review_notes IS
  'Generic review-decision note — populated for accept (optional), needs_correction (the correction to incorporate), and rejected (the reason) alike. Never AI-authored; always the human reviewer''s own words.';
