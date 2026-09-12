-- WHOLE-PRODUCT PARTIAL-CLOSURE — Growth Engine -> Outcomes linkage (AL_OUTCOMES / BV_MEASUREMENT).
-- Reuses the canonical Program 7 business_outcomes domain (the same table recommendation/
-- commitment/creative-job execution already reports results through) rather than creating a
-- second, Growth-only outcomes table. Additive nullable columns only, mirroring the exact
-- composite same-business FK convention already used by recommendation_id/commitment_id/
-- creative_job_id on this same table (business_outcomes_id_business_id_uk was already created by
-- 20260811170000_business_program7_foundation.sql; business_growth_campaigns_id_business_id_uk and
-- business_growth_solutions_id_business_id_uk were already created by
-- 20260910120000_business_growth_engine_foundation.sql — no new UNIQUE needed on either side).
ALTER TABLE public.business_outcomes
  ADD COLUMN IF NOT EXISTS growth_campaign_id uuid NULL,
  ADD COLUMN IF NOT EXISTS growth_solution_id uuid NULL;

ALTER TABLE public.business_outcomes
  ADD CONSTRAINT business_outcomes_growth_campaign_business_fkey
    FOREIGN KEY (growth_campaign_id, business_id)
    REFERENCES public.business_growth_campaigns(id, business_id) ON DELETE SET NULL,
  ADD CONSTRAINT business_outcomes_growth_solution_business_fkey
    FOREIGN KEY (growth_solution_id, business_id)
    REFERENCES public.business_growth_solutions(id, business_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS business_outcomes_growth_campaign_idx
  ON public.business_outcomes (business_id, growth_campaign_id) WHERE growth_campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS business_outcomes_growth_solution_idx
  ON public.business_outcomes (business_id, growth_solution_id) WHERE growth_solution_id IS NOT NULL;

COMMENT ON COLUMN public.business_outcomes.growth_campaign_id IS
  'Optional link to the Growth Engine campaign (business_growth_campaigns) this outcome measures. Never required — recommendation/commitment/creative-job-sourced outcomes leave this null.';
COMMENT ON COLUMN public.business_outcomes.growth_solution_id IS
  'Optional link to the Growth Engine solution (business_growth_solutions) this outcome measures, for a solution measured before/without a full campaign.';
