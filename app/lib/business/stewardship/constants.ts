/** TODAY-3 — Stewardship Engine constants. */

export const STEWARDSHIP_FLAG_KEY = "business_stewardship_engine";

/** Bumped whenever recommendationRegistry.ts templates change in a way that affects selection or content. */
export const STEWARDSHIP_REGISTRY_VERSION = "stewardship-2026-08-09.1";

/** Bumped whenever sixTests.ts rule logic changes in a way that affects a result. */
export const SIX_TEST_RULE_VERSION = "six-tests-2026-08-09.1";

export const RECOMMENDATION_STATUSES = [
  "draft", "review_required", "approved", "shared_with_owner", "accepted", "declined",
  "postponed", "superseded", "archived",
] as const;

export const RECOMMENDATION_VISIBILITIES = ["owner_and_staff", "staff_only"] as const;

export const PRIMARY_INTERVENTIONS = [
  "free_owner_action",
  "education_guided_self_service",
  "small_corrective_service",
  "leonix_product_or_advertising",
  "ongoing_managed_support",
  "external_specialist_referral",
  "no_action_yet",
] as const;

export const EXPECTED_EFFORTS = ["minutes", "under_1_hour", "half_day", "1_2_days", "ongoing"] as const;

export const COST_BANDS = ["free", "under_100", "100_500", "500_plus", "unknown"] as const;

export const OWNER_DECISIONS = ["accepted", "declined", "postponed"] as const;

export const SIX_TEST_RESULTS = ["pass", "caution", "fail", "blocked"] as const;

export const OVERRIDE_SIX_TEST_EFFECTS = ["unchanged", "requires_reapproval", "test_result_noted"] as const;

export const LEDGER_EVENT_TYPES = [
  "recommendation_created", "recommendation_approved", "recommendation_shared", "owner_accepted",
  "owner_declined", "owner_postponed", "override_recorded", "intentionally_not_recommended",
  "taught_freely", "sold_or_requested", "external_referral", "do_nothing_yet", "review_due",
] as const;

export const MAX_NOTE_LENGTH = 2000;
