/**
 * Gate G1.5 — TRUE QA fixture registry.
 *
 * Records, per category and environment, whether a real QA identity/record exists to test
 * against. This is NOT a source of truth for application behavior — it is a manually-maintained
 * ledger someone updates after actually verifying a fixture exists (or creating one through a
 * real signup/publish flow). Never fabricate an entry here to make a gate look TRUE.
 *
 * No secrets: no passwords, tokens, API keys, or service-role credentials. Emails here are
 * QA-only addresses on the reserved .invalid TLD (RFC 2606) or otherwise clearly non-production.
 *
 * Status verified live 2026-08-26 (Gate G1, read-only Supabase introspection):
 *   - PRODUCTION (xuieateniufcrsfdomwl, "Leonix Media"): has the full marketplace schema
 *     (Servicios/Restaurantes/Comida Local/Ofertas/Autos/Bienes/Rentas + Revenue OS + Community
 *     Trust), consistent with prior repo documentation describing it as the single real
 *     production project. Real customer data may exist there — do not query beyond schema-level
 *     introspection without explicit authorization, and never for QA purposes.
 *   - STAGING (cgeehvnfyrdoperdotdh, "Leonix Media Staging"): this project also independently
 *     hosts an unrelated product's live schema (~85 "leo_*"/"business_*" tables — an AI
 *     business-advisor platform). It shares a handful of early-ancestor tables with Production
 *     (listing_package_entitlements, admin_team_members) but had ZERO marketplace-category
 *     tables until Gate G1 bootstrapped them. Servicios/Restaurantes/Comida Local/Revenue
 *     OS/Community Trust schema was applied to Staging in Gate G1 (41 repo migrations replayed,
 *     2 scoped down to skip tables genuinely out of scope for this environment, 2 corrected for
 *     real production/repo drift found during verification — see
 *     G1_STAGING_MIGRATION_LOG.md). Ofertas/Autos/Bienes/Rentas schema was NOT bootstrapped —
 *     those categories mostly key off the generic `listings` table, which does not exist on
 *     Staging and was intentionally out of Gate G1's scope.
 *   - "Leonix Certification" (mvasgrdzmupsnuicwyjl): a narrower, documented one-off sandbox from
 *     an earlier migration-certification exercise (27 tables). Not used by this registry.
 */

export type QaFixtureCategory =
  | "servicios"
  | "restaurantes"
  | "comida-local"
  | "ofertas-locales"
  | "autos-dealer"
  | "autos-privado"
  | "bienes-raices"
  | "rentas";

export type QaFixtureEnvironment = "staging" | "production";

export type QaFixtureStatus = "ready" | "pending" | "schema_missing" | "unknown";

export type QaFixtureEntry = {
  category: QaFixtureCategory;
  environment: QaFixtureEnvironment;
  supabaseProjectRef: string;
  /** Real QA account email if one exists for this category/environment; null if none. Never a
   * production customer address. */
  qaAccountEmail: string | null;
  qaAccountRole: "seller_owner" | "buyer_visitor" | "admin" | null;
  /** Real row id of a listing/application usable for QA; null if none exists yet. */
  applicationOrListingId: string | null;
  status: QaFixtureStatus;
  /** Why this status is what it is — always fill in, never leave a TRUE/ready status unexplained. */
  notes: string;
  lastVerifiedAt: string;
};

export const QA_FIXTURE_REGISTRY: readonly QaFixtureEntry[] = [
  {
    category: "servicios",
    environment: "staging",
    supabaseProjectRef: "cgeehvnfyrdoperdotdh",
    qaAccountEmail: "qa-owner-temp@staging-test.leonixmedia.invalid",
    qaAccountRole: "seller_owner",
    applicationOrListingId: null,
    status: "pending",
    notes:
      "Schema ready (servicios_public_listings + leads/reviews/analytics + leonix_ad_id trigger, " +
      "verified working end-to-end in a rolled-back transaction during Gate G1). No real listing " +
      "row exists yet — someone needs to actually publish a Servicios application through the app " +
      "against Staging using the QA account before this becomes 'ready'.",
    lastVerifiedAt: "2026-08-26",
  },
  {
    category: "restaurantes",
    environment: "staging",
    supabaseProjectRef: "cgeehvnfyrdoperdotdh",
    qaAccountEmail: "qa-owner-temp@staging-test.leonixmedia.invalid",
    qaAccountRole: "seller_owner",
    applicationOrListingId: null,
    status: "pending",
    notes:
      "Schema ready (restaurantes_public_listings, verified working end-to-end in a rolled-back " +
      "transaction during Gate G1; confirmed production has NO DB trigger for leonix_ad_id here " +
      "— relies entirely on the app-layer allocateNextRestauranteLeonixAdId() RPC call, matched " +
      "on Staging). No real listing row exists yet.",
    lastVerifiedAt: "2026-08-26",
  },
  {
    category: "comida-local",
    environment: "staging",
    supabaseProjectRef: "cgeehvnfyrdoperdotdh",
    qaAccountEmail: "qa-owner-temp@staging-test.leonixmedia.invalid",
    qaAccountRole: "seller_owner",
    applicationOrListingId: null,
    status: "pending",
    notes:
      "Schema ready including the Community Trust comida-local extension (widened CHECK " +
      "constraints + toggle_leonix_endorsement_vote comida_local_listing branch), verified with a " +
      "real end-to-end vote (professional/clean/cl_tasty_food all recorded correctly, then rolled " +
      "back) using the existing QA account. No real listing row and no real $129/mo Stripe " +
      "checkout has been exercised on Staging yet.",
    lastVerifiedAt: "2026-08-26",
  },
  {
    category: "ofertas-locales",
    environment: "staging",
    supabaseProjectRef: "cgeehvnfyrdoperdotdh",
    qaAccountEmail: null,
    qaAccountRole: null,
    applicationOrListingId: null,
    status: "schema_missing",
    notes:
      "ofertas_locales / oferta_local_items / oferta_local_scan_jobs tables do not exist on " +
      "Staging. Out of Gate G1's explicit scope (Servicios/Restaurantes/Comida Local/Revenue " +
      "OS/Community Trust/draft-publish/analytics/payment only). Needs its own scoped migration " +
      "pass before QA is possible here.",
    lastVerifiedAt: "2026-08-26",
  },
  {
    category: "autos-dealer",
    environment: "staging",
    supabaseProjectRef: "cgeehvnfyrdoperdotdh",
    qaAccountEmail: null,
    qaAccountRole: null,
    applicationOrListingId: null,
    status: "schema_missing",
    notes:
      "autos_classifieds_listings does not exist on Staging. Out of Gate G1's explicit scope.",
    lastVerifiedAt: "2026-08-26",
  },
  {
    category: "autos-privado",
    environment: "staging",
    supabaseProjectRef: "cgeehvnfyrdoperdotdh",
    qaAccountEmail: null,
    qaAccountRole: null,
    applicationOrListingId: null,
    status: "schema_missing",
    notes: "Same table (autos_classifieds_listings) as autos-dealer; not present on Staging.",
    lastVerifiedAt: "2026-08-26",
  },
  {
    category: "bienes-raices",
    environment: "staging",
    supabaseProjectRef: "cgeehvnfyrdoperdotdh",
    qaAccountEmail: null,
    qaAccountRole: null,
    applicationOrListingId: null,
    status: "schema_missing",
    notes:
      "Keys off the generic `listings` table, which does not exist on Staging. Out of Gate G1's " +
      "explicit scope.",
    lastVerifiedAt: "2026-08-26",
  },
  {
    category: "rentas",
    environment: "staging",
    supabaseProjectRef: "cgeehvnfyrdoperdotdh",
    qaAccountEmail: null,
    qaAccountRole: null,
    applicationOrListingId: null,
    status: "schema_missing",
    notes: "Same generic `listings` table gap as bienes-raices.",
    lastVerifiedAt: "2026-08-26",
  },
  // Production rows are deliberately NOT populated with any account/listing identifiers by this
  // registry. Production QA identities are a separate, already-existing operational concern
  // ("Production smoke identities exist in Production" per the Gate G task) outside Gate G1's
  // read-only introspection scope, and this file must never guess or fabricate one.
  {
    category: "servicios",
    environment: "production",
    supabaseProjectRef: "xuieateniufcrsfdomwl",
    qaAccountEmail: null,
    qaAccountRole: null,
    applicationOrListingId: null,
    status: "unknown",
    notes:
      "Production smoke-test identities are stated to exist but were not enumerated by Gate G1 " +
      "(out of scope — this session only ran read-only schema introspection against Production, " +
      "never account/PII lookups). Whoever owns Production QA access should fill this row in.",
    lastVerifiedAt: "2026-08-26",
  },
  {
    category: "restaurantes",
    environment: "production",
    supabaseProjectRef: "xuieateniufcrsfdomwl",
    qaAccountEmail: null,
    qaAccountRole: null,
    applicationOrListingId: null,
    status: "unknown",
    notes: "See servicios/production note above.",
    lastVerifiedAt: "2026-08-26",
  },
  {
    category: "comida-local",
    environment: "production",
    supabaseProjectRef: "xuieateniufcrsfdomwl",
    qaAccountEmail: null,
    qaAccountRole: null,
    applicationOrListingId: null,
    status: "unknown",
    notes:
      "In addition to the servicios/production note: the Comida Local Community Trust migration " +
      "(20260826120000_leonix_endorsement_votes_comida_local.sql) has NOT been applied to " +
      "Production yet (verified live — Production's toggle_leonix_endorsement_vote function has " +
      "no comida_local_listing branch, and its CHECK constraints only allow " +
      "servicios/restaurantes). It is additive/backward-compatible and staging-verified, but " +
      "applying it to Production requires separate explicit authorization.",
    lastVerifiedAt: "2026-08-26",
  },
] as const;

export function getQaFixture(
  category: QaFixtureCategory,
  environment: QaFixtureEnvironment,
): QaFixtureEntry | null {
  return (
    QA_FIXTURE_REGISTRY.find((e) => e.category === category && e.environment === environment) ??
    null
  );
}
