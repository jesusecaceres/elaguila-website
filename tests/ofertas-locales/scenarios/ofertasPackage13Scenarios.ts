import type {
  OfertaLocalAdminOperationalStatusKey,
  OfertaLocalOwnerOperationalStatusKey,
} from "@/app/lib/ofertas-locales/ofertasLocalesOperationalStatus";

export type OfertaPackage13ScenarioKey =
  | "FLYER_DRAFT"
  | "FLYER_SOURCE_READY"
  | "FLYER_SCAN_QUEUED"
  | "FLYER_SCAN_ACTIVE"
  | "FLYER_SCAN_PARTIAL_FAILURE"
  | "FLYER_REVIEW_INCOMPLETE"
  | "FLYER_READY_FOR_PREVIEW"
  | "FLYER_PAYMENT_REQUIRED"
  | "FLYER_READY_TO_SUBMIT"
  | "FLYER_PENDING_REVIEW"
  | "FLYER_CHANGES_REQUESTED"
  | "FLYER_RESUBMITTED"
  | "FLYER_ACTIVE"
  | "FLYER_EXPIRING"
  | "FLYER_EXPIRED"
  | "FLYER_RENEWAL_SCHEDULED"
  | "COUPON_DRAFT"
  | "COUPON_REVIEW_INCOMPLETE"
  | "COUPON_READY_FOR_PREVIEW"
  | "COUPON_PENDING_REVIEW"
  | "COUPON_CHANGES_REQUESTED"
  | "COUPON_ACTIVE"
  | "COUPON_EXPIRED"
  | "ADMIN_APPROVAL_BLOCKED"
  | "ADMIN_APPROVAL_READY"
  | "ADMIN_ACTIVATION_INCOMPLETE"
  | "ADMIN_RECOVERY_REQUIRED"
  | "SHOPPER_EMPTY_RESULTS"
  | "SHOPPER_PRODUCT_AVAILABLE"
  | "SHOPPER_COUPON_AVAILABLE"
  | "SHOPPER_ITEM_UNAVAILABLE"
  | "SHOPPER_EXPIRED_PARENT";

export type OfertaPackage13Lane = "flyer" | "coupon" | "admin" | "shopper";

export type OfertaPackage13Scenario = {
  key: OfertaPackage13ScenarioKey;
  lane: OfertaPackage13Lane;
  parentId: `qa-ofertas-parent-${string}`;
  leonixAdId: `LNX-${string}`;
  ownerId: `qa-owner-${string}`;
  productKey: "ofertas_locales_flyer_30d" | "ofertas_locales_coupons_30d";
  sourceVersionId: `qa-source-${string}` | null;
  scanJobId: `qa-scan-${string}` | null;
  childIds: readonly `qa-child-${string}`[];
  reviewCounts: {
    total: number;
    approved: number;
    excluded: number;
    unresolved: number;
    failedPages: number;
  };
  commercialState: "not_started" | "checkout_pending" | "paid_entitled" | "partner_courtesy" | "mismatch";
  submissionState: "draft" | "ready" | "pending_review" | "changes_requested" | "resubmitted" | "approved";
  publicTermState: "not_started" | "active" | "expiring" | "expired" | "activation_incomplete";
  renewalState: "none" | "eligible" | "pending_review" | "scheduled";
  expectedOwnerStatus: OfertaLocalOwnerOperationalStatusKey;
  expectedAdminStatus: OfertaLocalAdminOperationalStatusKey;
  expectedPublicEligibility: boolean;
  expectedActions: readonly string[];
  prohibitedActions: readonly string[];
};

const flyerBase = {
  lane: "flyer" as const,
  parentId: "qa-ofertas-parent-flyer-0001" as const,
  leonixAdId: "LNX-QAFLYER1" as const,
  ownerId: "qa-owner-flyer" as const,
  productKey: "ofertas_locales_flyer_30d" as const,
};

const couponBase = {
  lane: "coupon" as const,
  parentId: "qa-ofertas-parent-coupon-0001" as const,
  leonixAdId: "LNX-QACOUPN1" as const,
  ownerId: "qa-owner-coupon" as const,
  productKey: "ofertas_locales_coupons_30d" as const,
};

function scenario(input: Omit<OfertaPackage13Scenario, "childIds"> & { childIds?: readonly `qa-child-${string}`[] }): OfertaPackage13Scenario {
  return { childIds: [], ...input };
}

export const OFERTAS_PACKAGE_13_SCENARIOS: readonly OfertaPackage13Scenario[] = [
  scenario({ ...flyerBase, key: "FLYER_DRAFT", sourceVersionId: null, scanJobId: null, reviewCounts: { total: 0, approved: 0, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "not_started", submissionState: "draft", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "source_required", expectedAdminStatus: "source_missing", expectedPublicEligibility: false, expectedActions: ["continue_application"], prohibitedActions: ["public_link", "admin_approve", "shopping_list_public"] }),
  scenario({ ...flyerBase, key: "FLYER_SOURCE_READY", sourceVersionId: "qa-source-flyer-v1", scanJobId: null, reviewCounts: { total: 0, approved: 0, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "not_started", submissionState: "draft", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "scan_waiting", expectedAdminStatus: "commercially_ineligible", expectedPublicEligibility: false, expectedActions: ["start_scan"], prohibitedActions: ["public_link", "admin_approve"] }),
  scenario({ ...flyerBase, key: "FLYER_SCAN_QUEUED", sourceVersionId: "qa-source-flyer-v1", scanJobId: "qa-scan-flyer-queued", reviewCounts: { total: 0, approved: 0, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "not_started", submissionState: "draft", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "scan_in_progress", expectedAdminStatus: "scan_unresolved", expectedPublicEligibility: false, expectedActions: ["wait"], prohibitedActions: ["retry_scan", "admin_approve"] }),
  scenario({ ...flyerBase, key: "FLYER_SCAN_ACTIVE", sourceVersionId: "qa-source-flyer-v1", scanJobId: "qa-scan-flyer-active", reviewCounts: { total: 2, approved: 0, excluded: 0, unresolved: 2, failedPages: 0 }, commercialState: "not_started", submissionState: "draft", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "scan_in_progress", expectedAdminStatus: "scan_unresolved", expectedPublicEligibility: false, expectedActions: ["wait"], prohibitedActions: ["duplicate_scan", "admin_approve"] }),
  scenario({ ...flyerBase, key: "FLYER_SCAN_PARTIAL_FAILURE", sourceVersionId: "qa-source-flyer-v1", scanJobId: "qa-scan-flyer-partial", reviewCounts: { total: 4, approved: 2, excluded: 0, unresolved: 2, failedPages: 1 }, commercialState: "not_started", submissionState: "draft", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "scan_needs_attention", expectedAdminStatus: "operational_recovery", expectedPublicEligibility: false, expectedActions: ["retry_scan", "replace_source"], prohibitedActions: ["admin_approve", "fake_worker_success"] }),
  scenario({ ...flyerBase, key: "FLYER_REVIEW_INCOMPLETE", sourceVersionId: "qa-source-flyer-v1", scanJobId: "qa-scan-flyer-review", childIds: ["qa-child-flyer-item-1"], reviewCounts: { total: 5, approved: 3, excluded: 0, unresolved: 2, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "draft", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "review_required", expectedAdminStatus: "review_unresolved", expectedPublicEligibility: false, expectedActions: ["continue_review"], prohibitedActions: ["admin_approve", "public_link"] }),
  scenario({ ...flyerBase, key: "FLYER_READY_FOR_PREVIEW", sourceVersionId: "qa-source-flyer-v1", scanJobId: "qa-scan-flyer-ready", childIds: ["qa-child-flyer-item-1"], reviewCounts: { total: 5, approved: 5, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "ready", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "ready_to_submit", expectedAdminStatus: "ready_for_review", expectedPublicEligibility: false, expectedActions: ["preview", "submit"], prohibitedActions: ["public_link"] }),
  scenario({ ...flyerBase, key: "FLYER_PAYMENT_REQUIRED", sourceVersionId: "qa-source-flyer-v1", scanJobId: "qa-scan-flyer-ready", reviewCounts: { total: 5, approved: 5, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "not_started", submissionState: "ready", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "payment_required", expectedAdminStatus: "commercially_ineligible", expectedPublicEligibility: false, expectedActions: ["complete_payment"], prohibitedActions: ["admin_approve", "public_link"] }),
  scenario({ ...flyerBase, key: "FLYER_READY_TO_SUBMIT", sourceVersionId: "qa-source-flyer-v1", scanJobId: "qa-scan-flyer-ready", childIds: ["qa-child-flyer-item-1"], reviewCounts: { total: 5, approved: 5, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "ready", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "ready_to_submit", expectedAdminStatus: "ready_for_review", expectedPublicEligibility: false, expectedActions: ["submit"], prohibitedActions: ["public_link"] }),
  scenario({ ...flyerBase, key: "FLYER_PENDING_REVIEW", sourceVersionId: "qa-source-flyer-v1", scanJobId: "qa-scan-flyer-ready", childIds: ["qa-child-flyer-item-1"], reviewCounts: { total: 5, approved: 5, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "pending_review", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "submitted_for_review", expectedAdminStatus: "approval_ready", expectedPublicEligibility: false, expectedActions: ["admin_review"], prohibitedActions: ["public_link"] }),
  scenario({ ...flyerBase, key: "FLYER_CHANGES_REQUESTED", sourceVersionId: "qa-source-flyer-v1", scanJobId: "qa-scan-flyer-ready", childIds: ["qa-child-flyer-item-1"], reviewCounts: { total: 5, approved: 5, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "changes_requested", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "changes_requested", expectedAdminStatus: "changes_requested", expectedPublicEligibility: false, expectedActions: ["correct_and_resubmit"], prohibitedActions: ["second_payment", "term_start", "public_link"] }),
  scenario({ ...flyerBase, key: "FLYER_RESUBMITTED", sourceVersionId: "qa-source-flyer-v1", scanJobId: "qa-scan-flyer-ready", childIds: ["qa-child-flyer-item-1"], reviewCounts: { total: 5, approved: 5, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "resubmitted", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "resubmitted", expectedAdminStatus: "resubmitted", expectedPublicEligibility: false, expectedActions: ["admin_review"], prohibitedActions: ["second_parent", "public_link"] }),
  scenario({ ...flyerBase, key: "FLYER_ACTIVE", sourceVersionId: "qa-source-flyer-v1", scanJobId: "qa-scan-flyer-ready", childIds: ["qa-child-flyer-item-1"], reviewCounts: { total: 5, approved: 5, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "approved", publicTermState: "active", renewalState: "none", expectedOwnerStatus: "published", expectedAdminStatus: "active", expectedPublicEligibility: true, expectedActions: ["public_link", "shopping_list", "business_hub"], prohibitedActions: ["cart", "fake_redemption"] }),
  scenario({ ...flyerBase, key: "FLYER_EXPIRING", sourceVersionId: "qa-source-flyer-v1", scanJobId: "qa-scan-flyer-ready", childIds: ["qa-child-flyer-item-1"], reviewCounts: { total: 5, approved: 5, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "approved", publicTermState: "expiring", renewalState: "eligible", expectedOwnerStatus: "expiring_soon", expectedAdminStatus: "expiring", expectedPublicEligibility: true, expectedActions: ["renew", "public_link"], prohibitedActions: ["term_extension_without_approval"] }),
  scenario({ ...flyerBase, key: "FLYER_EXPIRED", sourceVersionId: "qa-source-flyer-v1", scanJobId: "qa-scan-flyer-ready", childIds: ["qa-child-flyer-item-1"], reviewCounts: { total: 5, approved: 5, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "approved", publicTermState: "expired", renewalState: "eligible", expectedOwnerStatus: "expired", expectedAdminStatus: "expired", expectedPublicEligibility: false, expectedActions: ["renew"], prohibitedActions: ["public_link", "active_badge"] }),
  scenario({ ...flyerBase, key: "FLYER_RENEWAL_SCHEDULED", sourceVersionId: "qa-source-flyer-v2", scanJobId: "qa-scan-flyer-renewal", childIds: ["qa-child-flyer-item-renewal"], reviewCounts: { total: 5, approved: 5, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "approved", publicTermState: "active", renewalState: "scheduled", expectedOwnerStatus: "renewal_scheduled", expectedAdminStatus: "renewal_scheduled", expectedPublicEligibility: true, expectedActions: ["view_renewal_status"], prohibitedActions: ["overlap_term", "lost_days"] }),
  scenario({ ...couponBase, key: "COUPON_DRAFT", sourceVersionId: null, scanJobId: null, reviewCounts: { total: 0, approved: 0, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "not_started", submissionState: "draft", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "source_required", expectedAdminStatus: "source_missing", expectedPublicEligibility: false, expectedActions: ["continue_application"], prohibitedActions: ["shopping_list", "cart"] }),
  scenario({ ...couponBase, key: "COUPON_REVIEW_INCOMPLETE", sourceVersionId: "qa-source-coupon-v1", scanJobId: "qa-scan-coupon-review", childIds: ["qa-child-coupon-1"], reviewCounts: { total: 3, approved: 1, excluded: 0, unresolved: 2, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "draft", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "review_required", expectedAdminStatus: "review_unresolved", expectedPublicEligibility: false, expectedActions: ["continue_review"], prohibitedActions: ["shopping_list", "admin_approve"] }),
  scenario({ ...couponBase, key: "COUPON_READY_FOR_PREVIEW", sourceVersionId: "qa-source-coupon-v1", scanJobId: "qa-scan-coupon-ready", childIds: ["qa-child-coupon-1"], reviewCounts: { total: 3, approved: 3, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "ready", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "ready_to_submit", expectedAdminStatus: "ready_for_review", expectedPublicEligibility: false, expectedActions: ["preview", "submit"], prohibitedActions: ["shopping_list", "cart", "fake_redemption"] }),
  scenario({ ...couponBase, key: "COUPON_PENDING_REVIEW", sourceVersionId: "qa-source-coupon-v1", scanJobId: "qa-scan-coupon-ready", childIds: ["qa-child-coupon-1"], reviewCounts: { total: 3, approved: 3, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "pending_review", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "submitted_for_review", expectedAdminStatus: "approval_ready", expectedPublicEligibility: false, expectedActions: ["admin_review"], prohibitedActions: ["shopping_list", "public_link"] }),
  scenario({ ...couponBase, key: "COUPON_CHANGES_REQUESTED", sourceVersionId: "qa-source-coupon-v1", scanJobId: "qa-scan-coupon-ready", childIds: ["qa-child-coupon-1"], reviewCounts: { total: 3, approved: 3, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "changes_requested", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "changes_requested", expectedAdminStatus: "changes_requested", expectedPublicEligibility: false, expectedActions: ["correct_and_resubmit"], prohibitedActions: ["second_payment", "term_start", "shopping_list"] }),
  scenario({ ...couponBase, key: "COUPON_ACTIVE", sourceVersionId: "qa-source-coupon-v1", scanJobId: "qa-scan-coupon-ready", childIds: ["qa-child-coupon-1"], reviewCounts: { total: 3, approved: 3, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "approved", publicTermState: "active", renewalState: "none", expectedOwnerStatus: "published", expectedAdminStatus: "active", expectedPublicEligibility: true, expectedActions: ["public_link", "business_hub", "share"], prohibitedActions: ["shopping_list", "cart", "quantity", "fake_redemption", "wallet"] }),
  scenario({ ...couponBase, key: "COUPON_EXPIRED", sourceVersionId: "qa-source-coupon-v1", scanJobId: "qa-scan-coupon-ready", childIds: ["qa-child-coupon-1"], reviewCounts: { total: 3, approved: 3, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "approved", publicTermState: "expired", renewalState: "eligible", expectedOwnerStatus: "expired", expectedAdminStatus: "expired", expectedPublicEligibility: false, expectedActions: ["renew"], prohibitedActions: ["public_link", "shopping_list", "active_badge"] }),
  scenario({ ...flyerBase, key: "ADMIN_APPROVAL_BLOCKED", lane: "admin", sourceVersionId: "qa-source-admin-blocked", scanJobId: "qa-scan-admin-blocked", reviewCounts: { total: 2, approved: 1, excluded: 0, unresolved: 1, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "pending_review", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "review_required", expectedAdminStatus: "review_unresolved", expectedPublicEligibility: false, expectedActions: ["show_blockers"], prohibitedActions: ["admin_approve"] }),
  scenario({ ...flyerBase, key: "ADMIN_APPROVAL_READY", lane: "admin", sourceVersionId: "qa-source-admin-ready", scanJobId: "qa-scan-admin-ready", childIds: ["qa-child-admin-ready"], reviewCounts: { total: 2, approved: 2, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "pending_review", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "submitted_for_review", expectedAdminStatus: "approval_ready", expectedPublicEligibility: false, expectedActions: ["admin_approve", "admin_reject"], prohibitedActions: ["public_link_before_approval"] }),
  scenario({ ...flyerBase, key: "ADMIN_ACTIVATION_INCOMPLETE", lane: "admin", sourceVersionId: "qa-source-admin-activation", scanJobId: "qa-scan-admin-activation", childIds: ["qa-child-admin-activation"], reviewCounts: { total: 2, approved: 2, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "approved", publicTermState: "activation_incomplete", renewalState: "none", expectedOwnerStatus: "approved_activation_pending", expectedAdminStatus: "activation_incomplete", expectedPublicEligibility: false, expectedActions: ["inspect_activation"], prohibitedActions: ["public_link"] }),
  scenario({ ...flyerBase, key: "ADMIN_RECOVERY_REQUIRED", lane: "admin", sourceVersionId: "qa-source-admin-recovery", scanJobId: "qa-scan-admin-recovery", reviewCounts: { total: 2, approved: 1, excluded: 0, unresolved: 1, failedPages: 1 }, commercialState: "paid_entitled", submissionState: "pending_review", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "scan_needs_attention", expectedAdminStatus: "operational_recovery", expectedPublicEligibility: false, expectedActions: ["inspect_recovery"], prohibitedActions: ["fake_worker_success"] }),
  scenario({ ...flyerBase, key: "SHOPPER_EMPTY_RESULTS", lane: "shopper", sourceVersionId: null, scanJobId: null, reviewCounts: { total: 0, approved: 0, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "not_started", submissionState: "draft", publicTermState: "not_started", renewalState: "none", expectedOwnerStatus: "source_required", expectedAdminStatus: "source_missing", expectedPublicEligibility: false, expectedActions: ["show_empty_state"], prohibitedActions: ["fake_results"] }),
  scenario({ ...flyerBase, key: "SHOPPER_PRODUCT_AVAILABLE", lane: "shopper", sourceVersionId: "qa-source-shopper-product", scanJobId: "qa-scan-shopper-product", childIds: ["qa-child-shopper-product"], reviewCounts: { total: 1, approved: 1, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "approved", publicTermState: "active", renewalState: "none", expectedOwnerStatus: "published", expectedAdminStatus: "active", expectedPublicEligibility: true, expectedActions: ["open_product_drawer", "flyer_viewer", "business_hub", "shopping_list"], prohibitedActions: ["cart"] }),
  scenario({ ...couponBase, key: "SHOPPER_COUPON_AVAILABLE", lane: "shopper", sourceVersionId: "qa-source-shopper-coupon", scanJobId: "qa-scan-shopper-coupon", childIds: ["qa-child-shopper-coupon"], reviewCounts: { total: 1, approved: 1, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "approved", publicTermState: "active", renewalState: "none", expectedOwnerStatus: "published", expectedAdminStatus: "active", expectedPublicEligibility: true, expectedActions: ["open_coupon_drawer", "business_hub", "share"], prohibitedActions: ["shopping_list", "cart", "quantity", "fake_redemption"] }),
  scenario({ ...flyerBase, key: "SHOPPER_ITEM_UNAVAILABLE", lane: "shopper", sourceVersionId: "qa-source-shopper-unavailable", scanJobId: "qa-scan-shopper-unavailable", childIds: ["qa-child-shopper-unavailable"], reviewCounts: { total: 1, approved: 0, excluded: 1, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "approved", publicTermState: "active", renewalState: "none", expectedOwnerStatus: "published", expectedAdminStatus: "active", expectedPublicEligibility: false, expectedActions: ["show_unavailable_state"], prohibitedActions: ["drawer_open", "shopping_list"] }),
  scenario({ ...flyerBase, key: "SHOPPER_EXPIRED_PARENT", lane: "shopper", sourceVersionId: "qa-source-shopper-expired", scanJobId: "qa-scan-shopper-expired", childIds: ["qa-child-shopper-expired"], reviewCounts: { total: 1, approved: 1, excluded: 0, unresolved: 0, failedPages: 0 }, commercialState: "paid_entitled", submissionState: "approved", publicTermState: "expired", renewalState: "eligible", expectedOwnerStatus: "expired", expectedAdminStatus: "expired", expectedPublicEligibility: false, expectedActions: ["show_expired_state"], prohibitedActions: ["public_search_result", "active_badge"] }),
];

export const OFERTAS_PACKAGE_13_REQUIRED_SCENARIO_KEYS: readonly OfertaPackage13ScenarioKey[] =
  OFERTAS_PACKAGE_13_SCENARIOS.map((scenario) => scenario.key);
