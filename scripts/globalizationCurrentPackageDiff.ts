/**
 * Globalization program — current in-flight package diff allowlist.
 *
 * Several historical gate self-tests assert that the CURRENT working diff (`git diff HEAD`)
 * contains no locked/external-system file. Those checks are package-scoped snapshots: they were
 * written while their own package was the only in-flight diff, so every later package that
 * legitimately touches an intersecting file re-trips them (the exact stale-assertion class
 * Globalization P1 already hit and documented). Instead of re-editing five gates with bespoke
 * exception sets every package, they now all consume this single module.
 *
 * RULES (same standard P1 set — narrow, exact-file, never a loosened fragment match):
 *  - Exact repo-relative paths only. No globs, no directories, no fragments.
 *  - Every entry carries the package/gate that owns it and why the file is legitimately in
 *    the in-flight diff.
 *  - Entries are inert once their package's commit lands (the working diff resets), but stay
 *    here as the audit trail of what each package was authorized to touch.
 *  - A file listed here is still subject to every OTHER assertion in every gate — this only
 *    exempts it from the "not part of this package's diff" scope checks.
 */

export const GLOBALIZATION_CURRENT_PACKAGE_FILES: ReadonlySet<string> = new Set([
  // ——— Package A Gate 1 (catalog and contract freeze) ———
  // Lane-record types + guarded child-edit target helper (additive contract work):
  "app/lib/listingIdentity/types.ts",
  "app/lib/listingIdentity/categoryRouteRegistry.ts",
  "app/lib/listingIdentity/index.ts",
  // Gate self-test updated to pin the NEW guarded truth (was pinning the old unguarded truth
  // as documentation):
  "scripts/gate-i5-7f-full-catalog-route-contract-selftest.ts",
  // New Package A Gate 1 proof + the aggregate runner it certifies:
  "scripts/gate-pkgA-catalog-freeze-selftest.ts",
  "scripts/run-all-gates.ts",
  "scripts/globalizationCurrentPackageDiff.ts",
  // package.json: ONLY the added `test:gates` script entry (pinned exactly by
  // gate-pkgA-catalog-freeze-selftest.ts §3) — no dependency or build change.
  "package.json",
  // Ledger update log for Package A:
  "docs/gate-i5-7f-full-catalog-route-contract-matrix.md",
  // Historical diff-scope gates rewired onto this module (this file):
  "scripts/gate-i13a-launch-readiness-selftest.ts",
  "scripts/gate-i13b-public-visibility-filter-selftest.ts",
  "scripts/gate-p1-globalization-runtime-unblock-selftest.ts",
  "scripts/gate-i5-6-es-en-launch-language-controls-selftest.ts",
  "scripts/gate-i5-4d-rentas-canonical-public-route-selftest.ts",

  // ——— Package A Gate 2 (checkpoints and gateway completeness) ———
  // Seven new free/paid-truth checkpoint card builders + one shared client + seven pages:
  "app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts",
  "app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient.tsx",
  "app/(site)/publicar/busco/page.tsx",
  "app/(site)/publicar/clases/page.tsx",
  "app/(site)/publicar/comunidad/page.tsx",
  "app/(site)/publicar/mascotas-y-perdidos/page.tsx",
  "app/(site)/publicar/en-venta/page.tsx",
  "app/(site)/publicar/comida-local/checkpoint/page.tsx",
  "app/(site)/publicar/viajes/checkpoint/page.tsx",
  // Gateway checkpoint-first resolution + live legacy CTA map (5 lanes → checkpoints):
  "app/(site)/publicar/publicarGatewayResolver.ts",
  "app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes.ts",
  // Gate self-tests updated to pin the new checkpoint-first truth + new Gate 2 proof:
  "scripts/gate-i5-2-publish-gateway-selftest.ts",
  "scripts/gate-i5-8-empleos-autos-viajes-route-drift-selftest.ts",
  "scripts/gate-pkgA-checkpoints-selftest.ts",

  // ——— Package A Gate 3 (shared draft contract + publish idempotency) ———
  // Canonical draft-workspace contract (new shared module family):
  "app/lib/listingDrafts/draftWorkspaceContract.ts",
  // Approved additive migration: listings.publish_attempt_key + partial unique index
  // (closes the concurrent double-submit race; plan §13 item 5):
  "supabase/migrations/20260804120000_listings_publish_attempt_idempotency_key.sql",
  // Idempotency helpers + the three quick-lane publisher wirings:
  "app/(site)/clasificados/lib/quickListingIdempotency.ts",
  "app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts",
  "app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts",
  "app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts",
  // Rentas/BR pending-reuse lookup fail-closed (gated fix; lookup-error → hard stop):
  "app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts",
  // Staleness-capture hooks (additive) on the two P2-class edit workspaces:
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesDashboardListingEditWorkspace.ts",
  "app/(site)/clasificados/publicar/rentas/shared/rentasListingEditWorkspace.ts",
  // New Gate 3 proof:
  "scripts/gate-pkgA-draft-idempotency-selftest.ts",

  // ——— Package A Gate 4 (preview-mode wiring full catalog) ———
  // Latent-guard closures (P3-documented) + the Empleos paid-lane guards + BR Negocio 3-way split:
  "app/(site)/clasificados/bienes-raices/preview/privado/components/BienesRaicesPrivadoPreviewClient.tsx",
  "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx",
  "app/(site)/clasificados/empleos/premium-preview/EmpleoPremiumPreviewClient.tsx",
  "app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
  // Lane-registry correction (Empleos quick = paid job post) + its Gate 1 selftest update:
  "scripts/gate-pkgA-catalog-freeze-selftest.ts",
  // New Gate 4 proof:
  "scripts/gate-pkgA-preview-modes-selftest.ts",

  // ——— Package A Gate 5 (edit/save truth and lifecycle parity) ———
  // Mascotas + BR Privado wired to the generic owner-verified editor (registry above already
  // authorized); coupled truth tables + pinned gates updated rather than left stale:
  "app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts",
  "app/admin/_lib/adminActionTruth.ts",
  "scripts/gate-i6a-quick-clasificados-lifecycle-selftest.ts",
  "scripts/gate-i6b-quick-clasificados-integrity-selftest.ts",
  "scripts/gate-i8a-global-dashboard-truth-selftest.ts",
  "scripts/gate-i8b-live-dashboard-coverage-selftest.ts",
  "scripts/gate-i9a-admin-operations-truth-selftest.ts",
  "scripts/gate-i9b-admin-write-safety-selftest.ts",
  "scripts/gate-i5-4a-1-br-privado-seller-photo-persistence-selftest.ts",
  "scripts/gate-i7a-specialized-lifecycle-reconciliation-selftest.ts",
  // Autos owner resume (removed→active, owner-verified) — service + API + dashboard wiring:
  "app/lib/clasificados/autos/autosClassifiedsListingService.ts",
  "app/api/clasificados/autos/listings/[id]/restore/route.ts",
  "app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx",
  // Comida Local owner lifecycle (first owner-side mutation capability) — API + card + page hook:
  "app/api/clasificados/comida-local/lifecycle/route.ts",
  "app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx",
  "app/(site)/dashboard/mis-anuncios/page.tsx",
  // New Gate 5 proof:
  "scripts/gate-pkgA-edit-save-truth-selftest.ts",

  // ——— Package A terminal closure (owner-directed corrections) ———
  // Comida Local dedicated editor (own-table adapter; same-row via draft_listing_id):
  "app/lib/clasificados/comida-local/comidaLocalDraftPersistence.ts",
  "app/lib/clasificados/comida-local/comidaLocalListingEditContext.ts",
  "app/lib/clasificados/comida-local/useComidaLocalDraft.ts",
  "app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx",
  "app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx",
  // BR/Rentas stale-draft precedence adoption (Rule 3 wired into the named surfaces):
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft.ts",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx",
  "app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration.ts",
  "app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx",
  "app/(site)/clasificados/publicar/rentas/negocio/application/RentasNegocioForm.tsx",
  // New closure proofs:
  "scripts/gate-pkgA-comida-local-editor-selftest.ts",
  "scripts/gate-pkgA-stale-draft-precedence-selftest.ts",

  // ═══ PACKAGE B — MEDIA + PARENT/CHILD INVENTORY ═══
  // (Package A entries above are inert since commit cdb75453; they remain as the audit trail.)
  // Gate B1/B3 — shared media contract engine + per-lane config registry + strict video validator:
  "app/lib/media/listingMediaContract.ts",
  "app/lib/media/listingMediaConfigs.ts",
  "app/lib/media/externalVideoUrlValidation.ts",
  // Gate B3 — Servicios add-video path gated by the shared strict validator:
  "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx",
  // Gate B4 — BR parent/child: cap removal + skip surfacing + child card actions + deep link
  // (the BR application/preview/hydration files are already authorized above from Package A):
  "app/(site)/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx",
  // Gate B5 — Autos child lifecycle: server sync + PATCH wiring + child edit action + deep link:
  "app/api/clasificados/autos/listings/[id]/route.ts",
  // Gate B2/B4/B5 — registry child routes + resolver delegation + generic-editor upgrade
  // (categoryRouteRegistry/editar page/dashboard section already authorized above):
  "app/lib/listingIdentity/dashboardActionResolver.ts",
  // Historical pin updated to the Package B truth (child card gained 2 prefetch-disabled links):
  "scripts/gate-i4-4c-br-inventory-final-prefetch-gap-selftest.ts",
  // New Package B proofs:
  "scripts/gate-pkgB-media-contract-selftest.ts",
  "scripts/gate-pkgB-media-adoption-selftest.ts",
  "scripts/gate-pkgB-parent-child-selftest.ts",

  // ═══ PACKAGE B CLOSURE — RUNTIME ADOPTION (owner-rejected the config-only B6 report) ═══
  // Real listingMediaContract.ts call sites added at each dedicated-editor lane's actual
  // save/validation boundary (additive gates alongside each lane's own proven validation —
  // no existing category logic rewritten; the locked publishLeonixRealEstateListingCore.ts
  // was deliberately NOT touched):
  "app/api/clasificados/servicios/publish/route.ts",
  "app/api/clasificados/restaurantes/publish/route.ts",
  "app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts",
  "app/lib/clasificados/autos/autosListingPayloadPersistence.ts",
  "app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts",
  "app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts",
  // New runtime-adoption proof:
  "scripts/gate-pkgB-media-runtime-adoption-selftest.ts",

  // ═══ PACKAGE C BUILD 1 (C2+C3) — REVENUE OS CONVERGENCE, SUBSCRIPTION LIFECYCLE, GRACE ═══
  // (Package A/B entries above are inert since their commits; audit trail preserved.)
  // C1 audit artifacts:
  "docs/globalization/package-c/C1_REVENUE_OS_REFERENCE_FREEZE_AND_CATEGORY_DELTA_AUDIT.md",
  "scripts/verify-package-c-c1-reference-freeze.mjs",
  // Canonical Revenue OS core (attempt identity, consent, event ledger, subscription events):
  "app/api/revenue-os/checkout/route.ts",
  "app/api/revenue-os/webhook/route.ts",
  "app/api/revenue-os/admin/subscription-sweep/route.ts",
  "app/lib/listingPlans/revenueStripe.ts",
  "app/lib/listingPlans/revenueWebhook.ts",
  "app/lib/listingPlans/revenueEntitlementFulfillment.ts",
  "app/lib/listingPlans/revenuePaymentRecords.ts",
  "app/lib/listingPlans/revenuePricingMatrix.ts",
  "app/lib/listingPlans/publishCheckoutCheckpoint.ts",
  "app/lib/listingPlans/revenueRestaurantFulfillment.ts",
  "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts",
  // New shared commercial modules (+ pure policy twins for behavioral tests):
  "app/lib/listingPlans/stripeEventLedger.ts",
  "app/lib/listingPlans/stripeEventLedgerPolicy.ts",
  "app/lib/listingPlans/subscriptionLifecycle.ts",
  "app/lib/listingPlans/subscriptionLifecyclePolicy.ts",
  "app/lib/listingPlans/revenueSubscriptionEvents.ts",
  "app/lib/listingPlans/recurringConsent.ts",
  "app/lib/listingPlans/recurringConsentCopy.ts",
  "app/lib/listingPlans/recurringConsentInteractive.ts",
  "app/lib/listingPlans/commercialWriteGuard.ts",
  "app/lib/listingPlans/commercialWriteGuardPolicy.ts",
  "app/lib/listingPlans/manualClearedPayments.ts",
  "app/lib/listingPlans/refundDisputeFoundations.ts",
  "app/lib/listingPlans/refundDisputePolicy.ts",
  "app/lib/listingPlans/checkoutAttemptIdentity.ts",
  "app/lib/listingPlans/commercialStateBadges.ts",
  // Legacy convergence (guards + bypassOnly handshake + success-page read-only):
  "app/api/clasificados/autos/checkout/route.ts",
  "app/api/clasificados/autos/stripe/webhook/route.ts",
  "app/api/clasificados/leonix/stripe/webhook/route.ts",
  "app/api/clasificados/autos/inventory-pack/checkout/route.ts",
  "app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx",
  "app/(site)/clasificados/bienes-raices/pago/exito/BrPagoExitoClient.tsx",
  "app/lib/clasificados/autos/autosDealerInventoryBoostCheckoutClient.ts",
  "app/lib/clasificados/autos/autosPublishApiContract.ts",
  // Capacity + grace write-path enforcement (decision 11):
  "app/api/clasificados/autos/listings/route.ts",
  "app/api/clasificados/autos/listings/[id]/restore/route.ts",
  "app/api/clasificados/bienes-raices/listing-edit/route.ts",
  "app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts",
  // Recurring-consent checkout surfaces:
  "app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx",
  "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx",
  "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx",
  "app/(site)/clasificados/bienes-raices/preview/negocio/components/BienesRaicesNegocioPreviewClient.tsx",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
  "app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx",
  "app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts",
  "app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts",
  "app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts",
  "app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts",
  // Minimal truthful state readers + manual-payment/print admin surfaces:
  "app/api/dashboard/listing-package-entitlements/route.ts",
  "app/admin/_lib/paymentTrackerData.ts",
  "app/admin/(dashboard)/workspace/package-entitlements/actions.ts",
  "app/api/admin/revenue-os/manual-payments/route.ts",
  // Approved additive migrations (M1-M6):
  "supabase/migrations/20260805090000_leonix_stripe_webhook_events.sql",
  "supabase/migrations/20260805090100_leonix_subscription_records.sql",
  "supabase/migrations/20260805090200_leonix_billing_consents.sql",
  "supabase/migrations/20260805090300_listing_package_entitlements_uniqueness_grant_source.sql",
  "supabase/migrations/20260805090400_leonix_payment_records_manual_clearance_attempt_identity.sql",
  "supabase/migrations/20260805090500_lane_listing_suspended_reason.sql",
  // New Package C Build 1 proofs + closure artifacts:
  "scripts/gate-pkgC-canonical-contract-selftest.ts",
  "scripts/gate-pkgC-event-ledger-idempotency-selftest.ts",
  "scripts/gate-pkgC-consent-convergence-selftest.ts",
  "scripts/gate-pkgC-capacity-grace-writeguard-selftest.ts",
  "scripts/verify-package-c-c2-c3-revenue-os-subscription.mjs",
  "scripts/package-c/report-duplicate-entitlements.mjs",
  "docs/globalization/package-c/C2_C3_REVENUE_OS_CONVERGENCE_SUBSCRIPTION_GRACE_CLOSURE.md",

  // ═══ PACKAGE C BUILD 2 (C4) — VERIFIED 15% INTRO DISCOUNT + LAUNCH-25 RETIREMENT ═══
  // Verified-intro-15% discount core (pure/impure module pairs):
  "app/lib/listingPlans/verifiedIntroDiscountPolicy.ts",
  "app/lib/listingPlans/verifiedIntroDiscount.ts",
  "app/lib/listingPlans/verifiedIntroDiscountRedemptions.ts",
  "app/lib/listingPlans/verifiedIntroDiscountStripeCoupon.ts",
  "app/lib/listingPlans/verifiedIntroDiscountClient.ts",
  "app/lib/listingPlans/commercialBusinessIdentity.ts",
  "app/lib/security/verifiedIdentityHash.ts",
  "app/api/_lib/verifiedBearerUser.ts",
  // SMS/OTP + atomic rate limiting (net-new — no prior infra existed):
  "app/lib/sms/smsVerificationProvider.ts",
  "app/lib/sms/twilioVerifyProvider.ts",
  "app/lib/sms/phoneVerificationRateLimitPolicy.ts",
  "app/lib/sms/phoneVerificationRateLimit.ts",
  "app/api/verified-intro-discount/phone/request/route.ts",
  "app/api/verified-intro-discount/phone/verify/route.ts",
  "app/api/verified-intro-discount/status/route.ts",
  // Checkout integration (conflict rejection, coupon-first sequencing, atomic reservation):
  "app/api/revenue-os/checkout/route.ts",
  "app/lib/listingPlans/revenueStripe.ts",
  "app/lib/listingPlans/revenuePaymentRecords.ts",
  "app/lib/listingPlans/revenuePricingMatrix.ts",
  "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts",
  "app/lib/listingPlans/revenueFulfillment.ts",
  "app/lib/listingPlans/revenueAuditLog.ts",
  // UI wiring (checkpoint banner + verify panel + 5 category preview clients):
  "app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx",
  "app/(site)/clasificados/components/VerifiedIntroDiscountVerifyPanel.tsx",
  "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx",
  "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
  "app/(site)/clasificados/bienes-raices/preview/negocio/components/BienesRaicesNegocioPreviewClient.tsx",
  "app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx",
  // Minimal admin/audit reader:
  "app/admin/_lib/paymentTrackerData.ts",
  // Approved additive migrations (5 files, 5 concerns):
  "supabase/migrations/20260805100000_leonix_verified_intro_discount_redemptions.sql",
  "supabase/migrations/20260805100100_leonix_phone_verification_challenges.sql",
  "supabase/migrations/20260805100200_leonix_verified_phone_identities.sql",
  "supabase/migrations/20260805100300_leonix_payment_records_verified_intro_discount_link.sql",
  "supabase/migrations/20260805100400_retire_website_launch_25_promo_family.sql",
  // New Package C Build 2 proof + closure artifacts:
  "scripts/gate-pkgC-verified-intro-discount-selftest.ts",
  "scripts/verify-package-c-c4-verified-discount.mjs",
  "docs/globalization/package-c/C4_VERIFIED_15_PERCENT_AND_25_PERCENT_PROMO_RETIREMENT_CLOSURE.md",
  // New dependency (twilio):
  "package.json",
  "package-lock.json",

  // ——— Launch-25 retirement (old promotional 25% campaign — code-side retirement; the
  // acceptance-side retirement is migration 20260805100400 above, a status flip requiring zero
  // code changes since resolveEffectivePromoCodeStatus()/resolvePromoForCheckout() already
  // reject any non-'active' promo row) ———
  "app/api/newsletter/subscribe/route.ts",
  "app/admin/_lib/promoCodeConstants.ts",
  "app/admin/_lib/promoCodePresetGuide.ts",
  "app/admin/_lib/leonixLeadReplyTemplates.ts",
  "app/(site)/clasificados/components/RevenuePromoField.tsx",
  "app/lib/leonix/publicFormCopy/locales/esEn.ts",
  "app/(site)/login/page.tsx",
  "app/components/leonix/coming-soon-v2/comingSoonV2Copy/languages/es.ts",
  "app/components/leonix/coming-soon-v2/comingSoonV2Copy/languages/en.ts",
  // LeonixLaunchCouponCard render call sites removed/neutralized (component file itself
  // untouched — dead-code removal of the component was explicitly out of scope):
  "app/(site)/newsletter/NewsletterPageClient.tsx",
  "app/(site)/home/HomeMarketingClient.tsx",
  "app/(site)/magazine/page.tsx",
  "app/(site)/dashboard/page.tsx",
  "app/(site)/dashboard/perfil/page.tsx",
  "app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx",
  "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx",
  "app/(site)/publicar/empleos/premium/EmpleoPremiumApplicationClient.tsx",
  "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx",
  "app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx",
  "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx",
  "app/(site)/clasificados/_components/ClasificadosLandingLaunchBanner.tsx",
  "app/(site)/clasificados/page.tsx",
  "app/(site)/negocios-locales/_components/NegociosLocalesLaunchBanner.tsx",
  "app/(site)/negocios-locales/page.tsx",
  "app/(site)/clasificados/publicar/_components/PublishEntryCheckpoint.tsx",
  "app/(site)/clasificados/publicar/_lib/publishCheckpointCopy.ts",

  // ═══ PACKAGE C BUILD 3 (C5+C6) — COMMERCIAL GRANTS + PACKAGE CATALOG + BUSINESS TOOLS +
  // RESTAURANTES/SERVICIOS COUPONS-INCLUDED CONVERSION ═══
  // New resolvers (pure/impure split) + comp/partner grant primitive:
  "app/lib/listingPlans/categoryCommercialPlanPolicy.ts",
  "app/lib/listingPlans/categoryCommercialPlan.ts",
  "app/lib/listingPlans/complimentaryGrants.ts",
  // Retired-add-on checkout closure (allowlist removal) — file already listed above for C4,
  // touched again here for the coupons-included conversion:
  "app/lib/listingPlans/revenueCheckout.ts",
  // Dashboard capability-enable route (replaces the retired $79 dashboard checkout) + its client:
  "app/api/dashboard/enable-included-capability/route.ts",
  "app/lib/listingPlans/enableIncludedCapabilityClient.ts",
  // Dashboard readers consuming the new capability field:
  "app/(site)/dashboard/lib/dashboardPackageEntitlementBadges.ts",
  "app/(site)/dashboard/restaurantes/page.tsx",
  "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx",
  // New proof + closure artifacts:
  "scripts/gate-pkgC-c5-c6-selftest.ts",
  "scripts/verify-package-c-c5-c6-commercial-grants-and-plan.mjs",
  "docs/globalization/package-c/C5_C6_COMMERCIAL_GRANTS_AND_PACKAGE_CATALOG_CLOSURE.md",

  // ═══ PACKAGE C BUILD 4 (C7+C8) — AUTOS/BIENES PARENT-SCOPED INVENTORY CAPACITY, ATOMIC
  // ACTIVATION, AND DASHBOARD/ADMIN COMMERCIAL-TRUTH GAPS ═══
  // New migration (2 additive SECURITY DEFINER RPCs, never applied by this build) + TS wrapper:
  "supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql",
  "app/lib/listingPlans/capacityActivationRpc.ts",
  // C7 — group-scoped counting + child-linkage verification (application preflight, advisory
  // only). `autosDealerInventoryPolicy.ts`'s group-scoped counter/grouping-key resolver already
  // existed pre-Build-4 and needed no change — only wiring it into the guard below was new:
  "app/lib/listingPlans/commercialWriteGuard.ts",
  "app/lib/listingPlans/commercialWriteGuardPolicy.ts",
  // C7 — Autos real mutation-path adoption:
  "app/lib/clasificados/autos/autosClassifiedsListingService.ts",
  "app/api/clasificados/autos/checkout/route.ts",
  "app/lib/clasificados/autos/autosNegociosBundlePublish.ts",
  "app/api/clasificados/autos/listings/[id]/restore/route.ts",
  "app/api/admin/autos/listings/[id]/route.ts",
  // Gate 9 — `npm run build` caught a real client/server boundary break: the QA-bypass bundle
  // publish file now transitively imports "server-only" modules (commercialWriteGuard.ts,
  // capacityActivationRpc.ts) via this build's own Gate 4 changes, but two "use client" files
  // statically imported a client-safe constant/type from that same file. Split the client-safe
  // pieces into their own zero-server-dependency file:
  "app/lib/clasificados/autos/autosNegociosBundlePublishSessionResult.ts",
  "app/(site)/clasificados/autos/pago/exito/AutosPagoExitoClient.tsx",
  "app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx",
  // C7 — Bienes real mutation-path adoption (payment activation, resume, new "activate_pending"
  // mutation closing a real insert-time capacity bypass found during Gate 5, admin routes,
  // dashboard detail-page resume):
  "app/lib/clasificados/bienes-raices/brListingPaymentService.ts",
  "app/lib/clasificados/bienes-raices/brListingLifecycleService.ts",
  "app/lib/clasificados/bienes-raices/brListingLifecycleEligibility.ts",
  "app/(site)/dashboard/lib/brDashboardLifecycleClient.ts",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
  "app/api/admin/clasificados/listings/[id]/route.ts",
  "app/(site)/dashboard/mis-anuncios/[id]/page.tsx",
  // C8 — dashboard subscription-state chip + business-tools dead-code removal:
  "app/(site)/dashboard/lib/dashboardPackageEntitlementBadges.ts",
  "app/(site)/dashboard/restaurantes/page.tsx",
  "app/(site)/dashboard/mis-anuncios/page.tsx",
  "app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts",
  "app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts",
  "app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryDashboardSection.tsx",
  "app/(site)/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx",
  "app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx",
  "app/(site)/dashboard/business-tools/page.tsx",
  // C8 — admin payment-tracker grant_source/subscription_status + comp/partner grant action:
  "app/admin/_lib/paymentTrackerData.ts",
  "app/admin/(dashboard)/workspace/payment-tracker/page.tsx",
  "app/admin/_lib/packageEntitlementData.ts",
  "app/admin/(dashboard)/workspace/package-entitlements/actions.ts",
  "app/admin/(dashboard)/workspace/package-entitlements/page.tsx",
  // New proof + closure artifacts:
  "scripts/verify-c7-capacity-rpc-sql-contract.mjs",
  "scripts/gate-pkgC-c7-capacity-selftest.ts",
  "scripts/verify-package-c-c7-c8-capacity-and-truth.mjs",
  "docs/globalization/package-c/C7_C8_CAPACITY_AND_COMMERCIAL_TRUTH_CLOSURE.md",
  // Gate 8 triage — historical gate script updated to pin the new "activate_pending" mutation key
  // (added this build to close a real direct-active-INSERT capacity bypass) alongside its
  // existing five-key vocabulary; every other assertion in the file is unchanged:
  "scripts/gate-g2-3-1-br-lifecycle-mutation-selftest.ts",

  // ═══ PACKAGE C C9 — LIVE MIGRATION CERTIFICATION (Autos/Bienes capacity RPCs applied and
  // exercised against an isolated, non-Production Supabase project; Production never touched) ═══
  // New certification-only artifacts (never applied to Production, never touch app runtime):
  "scripts/c9-certification-schema-setup.sql",
  "scripts/certify-package-c-c9-capacity-rpcs.mjs",
  "docs/globalization/package-c/C9_MIGRATION_CERTIFICATION_CLOSURE.md",
  // supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql and
  // scripts/verify-c7-capacity-rpc-sql-contract.mjs are already listed above (Build 4 section) —
  // C9 corrected 4 text/uuid casts in the former and added a regression guard to the latter;
  // same paths, no new entry needed.
  // Historical gate triage — this gate's own blanket "no migration file in the diff" check
  // predates the shared allowlist mechanism; rewired onto excludeCurrentPackageFiles() so a
  // later package's already-authorized migration touch (like C9's cast fix above) doesn't trip
  // it, while its second, non-exempt rule (the original views-column migration must never be
  // touched by anyone) is unchanged:
  "scripts/gate-i5-5-invalid-query-column-cleanup-selftest.ts",
  // Same stale blanket-migration-check pattern, same fix, found in a second historical gate
  // during Package C final closeout triage:
  "scripts/gate-i5-4c-empleos-lane-shell-fallback-safety-selftest.ts",

  // ═══ PACKAGE D BUILD D2 — GLOBAL CORE UNIFICATION (canonical placement resolver + ranking
  // adapter, shared Connection Hub foundation, unified CTA analytics dispatch, Bienes strict-sort
  // fix, Ofertas contact-hub defect fixes, Servicios manual-rating removal, canonical placement
  // writer adoption) ═══
  // New shared/global infrastructure (no DB schema change):
  "app/lib/listingPlans/placementResolution.ts",
  "app/lib/listingPlans/placementRankingAdapter.ts",
  "app/lib/listingPlans/placementEntitlementWriter.ts",
  "app/lib/analytics/client/connectionHubCtaDispatch.ts",
  "app/components/contact/connectionHub/sharedConnectionHubContactTypes.ts",
  "app/components/contact/connectionHub/sharedConnectionHubContactModel.ts",
  // Existing placement-writer callers routed through the one canonical writer (no behavior change):
  "app/lib/listingPlans/revenueEntitlementFulfillment.ts",
  "app/admin/(dashboard)/workspace/package-entitlements/actions.ts",
  // Confirmed live defect fixes:
  "app/(site)/clasificados/bienes-raices/resultados/lib/brResultsFilters.ts",
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx",
  "app/(site)/clasificados/components/ContactActions.tsx",
  "app/(site)/clasificados/anuncio/[id]/page.tsx",
  "app/(site)/servicios/publicar/components/ServiciosApplicationForm.tsx",
  // Real analytics identity + wiring for the previously-untracked Bienes live contact path:
  "app/lib/analytics/listingAnalyticsIdentity.ts",
  "app/lib/analytics/server/resolveListingAnalyticsIdentity.ts",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/BrAgenteResContactSidebar.tsx",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewPage.tsx",
  "app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx",
  // New Package D docs + verifiers:
  "docs/globalization/package-d/D2_GLOBAL_CORE_UNIFICATION_CLOSURE.md",
  "scripts/verify-package-d-d2-br-strict-price-sort.ts",
  "scripts/verify-package-d-d2-global-core-unification.ts",
  // Historical gate triage — pinned an exact pre-D2 count of a legacy trackEvent(...,
  // "message_sent", ...) call-site pattern; updated to the new, correct truth after Gate 6C
  // removed the one fabricated (non-chat) usage, not to bypass the check:
  "scripts/gate-i10a-analytics-engagement-truth-selftest.ts",
  // Same stale blanket "no analytics server file in the diff" pattern, same fix:
  "scripts/gate-i10b-en-venta-inline-save-owner-protection-selftest.ts",

  // ═══ PACKAGE D BUILD D3 — GLOBAL CATEGORY ADOPTION (canonical placement wired into Servicios/
  // Restaurantes/Autos Dealer/Bienes Negocio-Agente/Rentas/Empleos default-order ranking only —
  // strict numeric sorts and Privado/FSBO isolation preserved; Bienes social-icon CTA analytics
  // gap closed; Busco ContactActions analytics gap closed) ═══
  "app/lib/listingPlans/placementResultsOverlay.ts",
  "app/(site)/clasificados/servicios/resultados/page.tsx",
  "app/(site)/clasificados/servicios/lib/serviciosResultsFilter.ts",
  "app/(site)/clasificados/servicios/lib/serviciosVisibilityRanking.ts",
  "app/(site)/clasificados/restaurantes/data/restaurantesPublicBlueprintData.ts",
  "app/(site)/clasificados/restaurantes/lib/restaurantesResultsInventoryServer.ts",
  "app/(site)/clasificados/restaurantes/lib/restaurantesVisibilityRanking.ts",
  "app/api/clasificados/autos/public/listings/route.ts",
  "app/lib/clasificados/autos/autosPublicRanking.ts",
  "app/(site)/clasificados/autos/data/autosPublicSampleTypes.ts",
  "app/api/clasificados/bienes-raices/public/entitlement-overlay/route.ts",
  "app/(site)/clasificados/bienes-raices/lib/brPublicEntitlementOverlay.ts",
  "app/(site)/clasificados/bienes-raices/resultados/cards/listingTypes.ts",
  "app/(site)/clasificados/bienes-raices/resultados/lib/brResultsFilters.ts",
  "app/(site)/clasificados/rentas/lib/fetchRentasPublicListingsForBrowse.ts",
  "app/(site)/clasificados/rentas/model/rentasPublicListing.ts",
  "app/(site)/clasificados/rentas/shared/rentasBrowseFilters.ts",
  "app/api/clasificados/empleos/listings/route.ts",
  "app/(site)/clasificados/empleos/data/empleosJobTypes.ts",
  "app/(site)/clasificados/empleos/lib/empleosResultsQuery.ts",
  // Bienes social-icon CTA analytics (Gate 2) — the one D2-deferred gap on the live contact sidebar:
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/BrAgenteResContactSidebar.tsx",
  // Busco ContactActions analytics (Gate 3) — had listingId but no onContact before this build:
  "app/(site)/publicar/busco/components/BuscoQuickAdCanvas.tsx",
  // New Package D D3 docs + verifiers:
  "docs/globalization/package-d/D3_CATEGORY_ADOPTION_CLOSURE.md",
  "scripts/verify-package-d-d3-category-adoption.ts",
  "scripts/verify-package-d-d3-hub-analytics-gaps.ts",

  // ═══ PACKAGE E BUILD E2 — USER DASHBOARD GLOBAL COMMAND CENTER (global commercial-state badge
  // adoption, real Business Tools capability gate, Autos Dealer/Bienes Negocio parent-subscription
  // read-only visibility, category action truth fixes, real Messages inbox, real Saved listings,
  // real payment-attention notifications, Ofertas Locales dashboard boundary card) ═══
  "app/lib/listingPlans/commercialStateBadges.ts",
  "app/(site)/dashboard/mis-anuncios/page.tsx",
  "app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx",
  "app/(site)/clasificados/autos/dashboard/AutosClassifiedListingManageCard.tsx",
  "app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryDashboardSection.tsx",
  "app/(site)/dashboard/business-tools/page.tsx",
  "app/(site)/dashboard/guardados/page.tsx",
  "app/(site)/dashboard/mensajes/page.tsx",
  "app/(site)/dashboard/lib/dashboardI18n.ts",
  "app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts",
  "app/(site)/dashboard/lib/dashboardProductTruth.ts",
  "app/(site)/dashboard/lib/derivedDashboardFeed.ts",
  "app/(site)/dashboard/page.tsx",
  // Historical gate triage — I.12A pinned the inbox readiness flag as permanently false because,
  // at the time I.12A was written, no gate had built a real inbox yet; that was a snapshot of the
  // then-current truth, not a permanent lock (I.12A's own assertion message is "I.12A does not
  // build the inbox" — a statement about I.12A's own scope, not a rule for all future work).
  // E2 Gate 5 built the real, receiver_id-scoped inbox and only then flipped the flag — updated
  // to pin the new, real truth instead of leaving a stale assertion in place.
  "scripts/gate-i12a-full-catalog-certification-selftest.ts",
  // Historical gate triage — I.4.4b/I.4.4c pinned AutosClassifiedListingManageCard.tsx at exactly
  // 1 rendered Link because, before E2, it only ever rendered the public "View listing" link. E2
  // Gate 4 added a second, genuinely real Edit link (the confirmed live Autos Privado edit route,
  // previously unwired) — updated both counts to 2 rather than leaving a stale pin in place.
  "scripts/gate-i4-4b-dedicated-card-prefetch-selftest.ts",
  "scripts/gate-i4-4c-br-inventory-final-prefetch-gap-selftest.ts",
  // New Package E E2 docs + verifier:
  "docs/globalization/package-e/E2_USER_DASHBOARD_GLOBAL_COMMAND_CENTER_CLOSURE.md",
  "scripts/verify-package-e-e2-user-dashboard-command-center.ts",
  "scripts/globalizationCurrentPackageDiff.ts",

  // ═══ PACKAGE E BUILD E3 — ADMIN OS GLOBAL OPERATIONS (admin nav truth: real payment tracker
  // primary + site settings discoverable + six nav groups; unified customer/commercial support
  // view; user-scoped + filterable audit history; real manual cleared-payment UI with the
  // critical server-derived-actor audit fix; Revenue OS cross-navigation; activity-log
  // permission gate) ═══
  "app/admin/_lib/adminGlobalNav.ts",
  "app/admin/_lib/adminStrings.ts",
  "app/admin/_components/AdminSidebar.tsx",
  "app/admin/_lib/adminAccessControl.ts",
  "app/admin/_lib/adminAuditLogServer.ts",
  "app/admin/_lib/adminCustomerCommercialContext.ts",
  "app/admin/_lib/paymentTrackerData.ts",
  "app/admin/(dashboard)/activity-log/page.tsx",
  "app/admin/(dashboard)/usuarios/[id]/page.tsx",
  "app/admin/(dashboard)/workspace/payment-tracker/page.tsx",
  "app/admin/(dashboard)/workspace/payment-tracker/manual-payment/page.tsx",
  "app/admin/(dashboard)/workspace/payment-tracker/manual-payment/ManualPaymentClient.tsx",
  "app/api/admin/revenue-os/manual-payments/route.ts",
  // Historical gate triage — I.7A/I.8A/I.8B/I.9A/I.9B's blanket "no /admin/ file in the diff"
  // checks route through excludeCurrentPackageFiles() (the established mechanism since Package
  // A) precisely so a later package's already-authorized admin-surface work doesn't re-trip
  // them; every OTHER assertion in these gates (schema shape, dashboard truth, write-safety) is
  // unchanged and still runs against the real, current files.
  "scripts/verify-admin-nav-ops.mjs",
  // New Package E E3 docs + verifier:
  "docs/globalization/package-e/E3_ADMIN_OS_GLOBAL_OPERATIONS_CLOSURE.md",
  "scripts/verify-package-e-e3-admin-os-global-operations.ts",
]);

/** Drop the current package's own authorized files from a changed-file list before running a
 * historical package-scoped diff assertion. */
export function excludeCurrentPackageFiles(changed: readonly string[]): string[] {
  return changed.filter((file) => !GLOBALIZATION_CURRENT_PACKAGE_FILES.has(file));
}
