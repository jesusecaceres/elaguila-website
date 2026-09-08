export type OfertaLocalRuntimeSchemaRequirement = {
  object: string;
  migration: string;
  writer: string;
  reader: string;
  missingFailure: string;
  failClosedBehavior: string;
  diagnosticCoverage: string;
};

export const OFERTAS_RUNTIME_SCHEMA_REQUIREMENTS: readonly OfertaLocalRuntimeSchemaRequirement[] = [
  {
    object: "Gemini-compatible scan provider constraint",
    migration: "20260616130000_ofertas_locales_ai_production_bootstrap.sql",
    writer: "ofertasLocalesScanApiHandler",
    reader: "ofertasLocalesAiScanOrchestrator",
    missingFailure: "scan provider insert/update may fail",
    failClosedBehavior: "scan-prep/runtime diagnostics return schema_not_applied or provider unavailable",
    diagnosticCoverage: "Package 7 scan-prep diagnostics plus Package 9 migration-chain audit",
  },
  {
    object: "ofertas_locales.published_at/expires_at",
    migration: "20260731222500_ofertas_locales_30_day_public_term.sql",
    writer: "ofertasLocalesAdminReviewMutations",
    reader: "ofertasLocalesPublicSearchHelpers",
    missingFailure: "public term cannot be enforced",
    failClosedBehavior: "public readers require active term and return no public listing",
    diagnosticCoverage: "30-day public term audit",
  },
  {
    object: "ofertas_locales.leonix_ad_id and commercial fields",
    migration: "20260731235500_ofertas_locales_commercial_activation_identity.sql",
    writer: "ofertasLocalesCommercialServer",
    reader: "checkout/submission/admin/owner helpers",
    missingFailure: "checkout or submission cannot prove identity/payment",
    failClosedBehavior: "checkout/submission returns missing identity or entitlement errors",
    diagnosticCoverage: "commercial and Leonix audits",
  },
  {
    object: "partner organizations/assignments",
    migration: "20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql",
    writer: "ofertasLocalesPartnerOperations",
    reader: "partner courtesy and public ranking helpers",
    missingFailure: "courtesy and badge/ranking unavailable",
    failClosedBehavior: "courtesy validation returns ineligible; public badge hidden",
    diagnosticCoverage: "partner system/ranking/courtesy audits",
  },
  {
    object: "source asset versions and cleanup queue",
    migration: "20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql",
    writer: "ofertasLocalesAssetLifecycle",
    reader: "review/public/replacement/cleanup helpers",
    missingFailure: "replacement/source-version consistency unavailable",
    failClosedBehavior: "approval/replacement blocks or cleanup stays pending",
    diagnosticCoverage: "asset versioning/replacement/cleanup audits",
  },
  {
    object: "scan pages, price cents, bbox/crop fields",
    migration: "20260801013000_ofertas_locales_ai_scan_review_publication.sql",
    writer: "ofertasLocalesScanApiHandler and item review mapper",
    reader: "review workspace, preview, public flyer/search/drawer",
    missingFailure: "scan progress and public item projection unavailable",
    failClosedBehavior: "submission/admin approval blocks failed or unresolved source work",
    diagnosticCoverage: "Package 7 scan/progress/price/bbox/review/parity audits",
  },
  {
    object: "renewal attempts",
    migration: "20260801023000_ofertas_locales_renewal_operations_lifecycle.sql",
    writer: "owner renewal route and webhook fulfillment",
    reader: "owner action center and admin renewal route",
    missingFailure: "same-parent renewal cannot be tracked",
    failClosedBehavior: "renewal API fails; checkout cannot authorize renewal attempt",
    diagnosticCoverage: "Package 8 renewal audits and Package 9 readiness endpoint",
  },
  {
    object: "public term history and activation RPC",
    migration: "20260801023000_ofertas_locales_renewal_operations_lifecycle.sql",
    writer: "activate_due_oferta_local_renewal",
    reader: "admin renewal route and launch diagnostics",
    missingFailure: "renewal approval cannot create immutable term history",
    failClosedBehavior: "activation route returns activation failure and does not publish",
    diagnosticCoverage: "Package 8 activation/term-history audits",
  },
  {
    object: "notification outbox",
    migration: "20260801023000_ofertas_locales_renewal_operations_lifecycle.sql",
    writer: "ofertasLocalesNotificationEvents",
    reader: "readiness diagnostics and future delivery worker",
    missingFailure: "notification events cannot persist",
    failClosedBehavior: "no delivery claimed; pending event insert fails safely",
    diagnosticCoverage: "notification contract/readiness audits",
  },
];
