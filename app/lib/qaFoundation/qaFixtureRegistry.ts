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
 * Status verified live 2026-08-26 (Gate G1, read-only Supabase introspection) and updated
 * 2026-08-27 (Gate G1.5 follow-up, BR/Rentas schema reconstruction):
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
 *     G1_STAGING_MIGRATION_LOG.md). Ofertas/Autos schema is STILL not bootstrapped — those
 *     categories remain genuinely out of scope (see their own registry rows below). Bienes/
 *     Rentas' shared `public.listings` table (and its trigger/RLS/leonix_ad_id dependencies,
 *     plus leonix_professional_identities for BR/Rentas Community Trust) WAS reconstructed on
 *     Staging in the 2026-08-27 follow-up — directly from production's live pg_catalog shape,
 *     not migration replay, since `listings` predates migration tracking and has no clean
 *     CREATE TABLE anywhere in the repo. See the bienes-raices/rentas staging entries below for
 *     exactly what was verified and what still gates them at 'pending' rather than 'ready'.
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
    qaAccountEmail: "qa-owner-temp@staging-test.leonixmedia.invalid",
    qaAccountRole: "seller_owner",
    applicationOrListingId: null,
    status: "pending",
    notes:
      "Schema reconstructed 2026-08-27 (Gate G1.5 follow-up) directly from production's LIVE " +
      "`public.listings` shape (pg_catalog introspection, not migration replay -- `listings` " +
      "predates migration tracking and has no clean CREATE TABLE in the repo). Reconstructed: " +
      "all 56 live columns, description/title/inventory_role CHECK constraints, all 6 secondary " +
      "indexes (incl. the partial unique leonix_ad_id index), RLS enabled+forced with the same 5 " +
      "live policies (owner-scoped insert/read/update for `authenticated`, plus two public-read " +
      "policies), and all 6 live triggers (leonix_ad_id allocation, lifecycle audit x3 -- " +
      "production genuinely fires log_listing_lifecycle_audit() from TWO separate AFTER UPDATE " +
      "triggers, reproduced faithfully rather than silently deduped, owner-change guard, " +
      "owner_id default). Also created the leonix_professional_identities table + widened " +
      "leonix_endorsement_votes CHECK constraints/RPC for BR Negocio Community Trust voting, " +
      "merged with Staging's existing Gate G1 comida-local widening so neither is dropped -- " +
      "verified this matches production's current combined constraint/RPC state exactly. " +
      "Deliberately NOT reproduced: the repo's publish_attempt_key column/index " +
      "(20260804120000_listings_publish_attempt_idempotency_key.sql) -- verified that migration " +
      "is NOT actually live on production (column and index both absent there), so Staging " +
      "intentionally matches production's true state, not the repo's migration history. " +
      "Verified end-to-end in TWO separate rolled-back transactions (single-statement DO blocks " +
      "that INSERT, read back, then RAISE an exception to force atomic rollback of everything " +
      "including trigger side effects): a bienes-raices row correctly allocated leonix_ad_id " +
      "'BR-2026-000001', wrote exactly 1 lifecycle-audit row, read back with matching " +
      "category/title/is_published, and round-tripped a leonix_professional_identities row + " +
      "toggle_leonix_endorsement_vote() call (vote_active=true, vote_count=1) for the BR Negocio " +
      "identity target type. Confirmed zero residual rows afterward in listings, " +
      "listing_lifecycle_audit, leonix_professional_identities, leonix_endorsement_votes, and " +
      "the leonix_ad_id_counters BR bucket. get_advisors shows only pre-existing-pattern findings " +
      "(RLS-enabled-no-policy on the two service-role-only tables, by design; " +
      "function_search_path_mutable / anon-executable-SECURITY-DEFINER on functions copied " +
      "byte-for-byte from production's live definitions -- not a regression introduced here). " +
      "GAP: the `listing-images` Storage bucket (public, 10MB limit, jpeg/png/webp) that BR/" +
      "Rentas media uploads target does not exist on Staging -- Staging has ZERO storage buckets " +
      "at all. Bucket creation was not attempted via raw `insert into storage.buckets` SQL " +
      "because that bypasses the Storage service's own setup (storage.objects RLS policies etc.) " +
      "and is outside what execute_sql/apply_migration are meant for; needs the Supabase " +
      "dashboard, Storage Management API, or `supabase storage` CLI instead. Status is 'pending' " +
      "not 'ready': the schema is proven working, but Staging's `listings` table has zero real " +
      "rows -- no BR listing has actually been published through the app yet, and the missing " +
      "storage bucket would block a real photo upload during that publish flow today.",
    lastVerifiedAt: "2026-08-27",
  },
  {
    category: "rentas",
    environment: "staging",
    supabaseProjectRef: "cgeehvnfyrdoperdotdh",
    qaAccountEmail: "qa-owner-temp@staging-test.leonixmedia.invalid",
    qaAccountRole: "seller_owner",
    applicationOrListingId: null,
    status: "pending",
    notes:
      "Same `public.listings` reconstruction as bienes-raices (see that entry for full detail) -- " +
      "both categories share the identical table/trigger/policy set, so there is nothing Rentas- " +
      "specific to rebuild beyond what's already covered there. Rentas-specific pieces verified " +
      "separately: leonix_listings_prefix('rentas') resolves to 'RENT' (confirmed live in the " +
      "trigger function), and the partial index listings_rentas_active_expires_at_idx (category=" +
      "'rentas' AND status='active' AND is_published=true AND expires_at IS NOT NULL) exists and " +
      "was exercised. Verified end-to-end in its own rolled-back transaction: a rentas row " +
      "correctly allocated leonix_ad_id 'RENT-2026-000001', wrote exactly 1 lifecycle-audit row, " +
      "and matched the active-rentas partial index predicate on read-back; confirmed zero " +
      "residual rows afterward (including in the RENT leonix_ad_id_counters bucket). Checked " +
      "revenueRentasFulfillment.ts (the Stripe-webhook activation path) directly: it only ever " +
      "touches public.listings (status/is_published/published_at/expires_at/listing_json) and " +
      "public.leonix_payment_records (already present on Staging) -- no additional Rentas-only " +
      "table exists that this reconstruction could have missed. Same `listing-images` Storage " +
      "bucket gap as bienes-raices applies here too (shared media pipeline). Status is 'pending' " +
      "for the same reason: schema proven working, zero real rows published through the app yet.",
    lastVerifiedAt: "2026-08-27",
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
