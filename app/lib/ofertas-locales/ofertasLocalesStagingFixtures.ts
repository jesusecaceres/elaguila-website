export type OfertaLocalStagingFixture = {
  id: string;
  parentState: string;
  productLane: "flyer" | "coupon";
  sourceState: string;
  scanState: string;
  reviewState: string;
  commercialState: string;
  partnerState: string;
  termState: string;
  expectedPublicResult: string;
  expectedOwnerView: string;
  expectedAdminView: string;
};

export const OFERTAS_STAGING_FIXTURES: readonly OfertaLocalStagingFixture[] = [
  { id: "standard_flyer_advertiser", parentState: "draft_to_approved", productLane: "flyer", sourceState: "active_source", scanState: "complete", reviewState: "approved_items", commercialState: "paid_flyer_399", partnerState: "none", termState: "initial_30_day", expectedPublicResult: "flyer pages and searchable products visible", expectedOwnerView: "active term and analytics", expectedAdminView: "paid provenance and source history" },
  { id: "standard_coupon_advertiser", parentState: "draft_to_approved", productLane: "coupon", sourceState: "active_source", scanState: "complete", reviewState: "approved_coupons", commercialState: "paid_coupon_199", partnerState: "none", termState: "initial_30_day", expectedPublicResult: "coupon detail visible without cart/list", expectedOwnerView: "active coupon term", expectedAdminView: "coupon lane provenance" },
  { id: "verified_partner_flyer", parentState: "approved", productLane: "flyer", sourceState: "active_source", scanState: "complete", reviewState: "approved_items", commercialState: "partner_courtesy", partnerState: "verified_active", termState: "active", expectedPublicResult: "badge and priority eligible", expectedOwnerView: "courtesy provenance", expectedAdminView: "partner assignment visible" },
  { id: "verified_partner_coupon", parentState: "approved", productLane: "coupon", sourceState: "active_source", scanState: "complete", reviewState: "approved_coupons", commercialState: "partner_courtesy", partnerState: "verified_active", termState: "active", expectedPublicResult: "coupon visible with partner truth", expectedOwnerView: "courtesy coupon provenance", expectedAdminView: "partner coupon assignment" },
  { id: "active_nearing_renewal", parentState: "approved", productLane: "flyer", sourceState: "active_source", scanState: "complete", reviewState: "approved_items", commercialState: "paid", partnerState: "none", termState: "expires_within_14_days", expectedPublicResult: "current term public", expectedOwnerView: "renewal eligible", expectedAdminView: "current and next term separable" },
  { id: "expired_listing", parentState: "approved_expired", productLane: "coupon", sourceState: "active_source", scanState: "complete", reviewState: "approved_coupons", commercialState: "paid", partnerState: "none", termState: "expired", expectedPublicResult: "not visible", expectedOwnerView: "republish eligible", expectedAdminView: "expired history preserved" },
  { id: "replacement_source_pending", parentState: "approved", productLane: "flyer", sourceState: "replacement_pending", scanState: "queued", reviewState: "not_ready", commercialState: "paid", partnerState: "none", termState: "active", expectedPublicResult: "old source remains public or fail-closed", expectedOwnerView: "scan/review required", expectedAdminView: "replacement blocks activation" },
  { id: "failed_scan_page", parentState: "draft", productLane: "flyer", sourceState: "pending_source", scanState: "failed_page", reviewState: "blocked", commercialState: "authorized", partnerState: "none", termState: "not_started", expectedPublicResult: "not visible", expectedOwnerView: "retry scan guidance", expectedAdminView: "failed page visible" },
  { id: "cleanup_queue_failure", parentState: "approved", productLane: "flyer", sourceState: "removed_source", scanState: "not_applicable", reviewState: "historical", commercialState: "paid", partnerState: "none", termState: "historical", expectedPublicResult: "removed source not used", expectedOwnerView: "cleanup queued truth", expectedAdminView: "cleanup failure reason" },
  { id: "scheduled_renewal_due", parentState: "approved", productLane: "flyer", sourceState: "renewal_source_ready", scanState: "complete", reviewState: "approved_items", commercialState: "renewal_authorized", partnerState: "none", termState: "approved_scheduled_due", expectedPublicResult: "activates only when worker runs", expectedOwnerView: "scheduled activation", expectedAdminView: "due activation retry" },
  { id: "notification_pending", parentState: "approved", productLane: "coupon", sourceState: "active_source", scanState: "complete", reviewState: "approved_coupons", commercialState: "paid", partnerState: "none", termState: "expiring", expectedPublicResult: "unchanged by notification", expectedOwnerView: "pending reminder not sent claim", expectedAdminView: "outbox pending" },
  { id: "coupon_validity_before_parent_term", parentState: "approved", productLane: "coupon", sourceState: "active_source", scanState: "complete", reviewState: "approved_coupons", commercialState: "paid", partnerState: "none", termState: "active_parent_coupon_expired", expectedPublicResult: "coupon hidden/expired by validity", expectedOwnerView: "validity correction needed", expectedAdminView: "coupon date bounded by term" },
];
