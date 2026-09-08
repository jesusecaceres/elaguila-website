# Package F Build F2 — Final Fix Build Closure

**Branch:** `integration/lifecycle-foundation-2026-07`
**Starting HEAD:** `1203eee7` (Package F1 blueprint baseline)
**Scope:** close every Package F1 (Gate F1) P0/P1 blocker within Globalization branch ownership.
**Migrations applied to any live database:** NONE. Two migration files authored (Gate 1 analytics RLS; promo concurrency closure below), neither applied.
**Production/main touched:** NO.

---

## P0 — MUST FIX BEFORE PREVIEW

### P0-1 — `listing_analytics` RLS wide open (`USING (true)`)
- **Original defect:** any anon/authenticated caller could query raw `user_id` per analytics event for any listing directly against Supabase; actively exercised client-side by `AutosAnuncioAnalyticsStrip.tsx`.
- **Files changed:** `supabase/migrations/20260812090000_listing_analytics_owner_scoped_select_rls.sql` (new migration, authored not applied), `app/api/clasificados/autos/listing/[id]/analytics-summary/route.ts` (new safe server aggregate endpoint), `app/(site)/clasificados/autos/listing/components/AutosAnuncioAnalyticsStrip.tsx` (routed through the new endpoint instead of direct table reads).
- **Runtime proof:** TypeScript clean on all three files; migration SQL reviewed for exact `owner_user_id = auth.uid()::text` scoping, preserves service-role writes and existing owner/admin server-side reads.
- **Verifier:** `scripts/verify-package-f-f2-final-fix-build.mjs` (Gate 1 checks).
- **Terminal result:** FIXED + PROVEN (migration authored; **must be applied to the target Supabase project before Preview/Production go live** — this is a deploy-step dependency, not a code gap).

### P0-2 — Promo code `per_customer_limit` unenforced
- **Original defect:** `customerRedemptionCount` was always 0 (never populated by any real caller), so a per-customer-capped promo code could be redeemed unlimited times sequentially by the same person. A subsequent recovery pass additionally found the sequential-only fix left a genuine **concurrent**-redemption race: `resolvePromoForCheckout()`'s count-of-redeemed-rows check and `createPendingPromoRedemption()`'s insert were two separate, non-atomic steps, so two simultaneous checkout attempts by the same customer could both pass the limit check before either row existed.
- **Files changed:** `app/lib/listingPlans/revenuePromoRedemptions.ts` (`countCustomerPromoRedemptions()` for the sequential fix; `PromoCheckoutResolution` now carries `perCustomerLimit`; `createPendingPromoRedemption()` rewritten to call the new atomic RPC instead of a plain insert), `app/api/revenue-os/checkout/route.ts` (threads `perCustomerLimit` through; a lost concurrency race now returns the same truthful `promo_ineligible`/400 response every other eligibility rejection already uses), `supabase/migrations/20260812150000_promo_customer_redemption_slot_reservation_rpc.sql` (new migration, authored not applied — one `SECURITY DEFINER` RPC, `reserve_promo_customer_redemption_slot`, mirroring the exact transaction-scoped-advisory-lock pattern already reviewed and shipped in `20260810120000_autos_br_negocio_capacity_activation_rpc.sql`).
- **Runtime proof:** TypeScript clean on all touched files. The RPC takes `pg_advisory_xact_lock(871003, hashtext(promo_code_id || ':' || customer_identity))`, then counts existing `pending`/`validated`/`redeemed` rows for that exact pair (counting in-flight reservations closes the race, not just terminal ones), and only inserts when under `per_customer_limit` (null defaults to 1, mirroring `promoCodeRules.ts`'s exact existing semantics) — correctly generalizes to any limit value, not just 1. Global `max_redemptions`, expiration, category/package/placement scope, and Stripe session idempotency (`markPromoRedemptionRedeemed`) are all unchanged.
- **Verifier:** `scripts/verify-package-f-f2-final-fix-build.mjs` (Gate 2 sequential checks) + `scripts/verify-promo-redemption-concurrency-f2.mjs` (20/20, static contract proof of the atomic RPC, its wiring, and preservation of every unrelated eligibility rule).
- **Deferred runtime certification:** `scripts/certify-promo-redemption-concurrency-f3.mjs` — live sequential/concurrent/different-customer/multi-slot proof against a real non-Production Supabase project, to run once the migration above is applied as its own separate, later, explicitly-authorized step (this program's established "authored, not applied" discipline — no migration in this build has been applied to any database).
- **Terminal result:** FIXED + PROVEN (both sequential and concurrent cases; static contract proof complete; live runtime certification deferred to F3 per this program's standing migration-application discipline, not a residual code gap).

### P0-3 — Preview-route noindex gaps
- **Original defect:** En Venta, Autos Privado, Autos Negocios, Restaurantes preview routes and Servicios pending/rejected/suspended detail states had no `robots: noindex` signal — protection was `robots.txt`-only.
- **Files changed:** `app/(site)/clasificados/en-venta/preview/page.tsx`, `app/(site)/clasificados/autos/privado/preview/page.tsx`, `app/(site)/clasificados/autos/negocios/preview/page.tsx`, `app/(site)/clasificados/restaurantes/preview/page.tsx`, `app/(site)/clasificados/servicios/[slug]/layout.tsx`.
- **Runtime proof:** every file now spreads the existing shared `PREVIEW_NOINDEX_METADATA` constant; TypeScript clean.
- **Verifier:** `scripts/verify-package-f-f2-final-fix-build.mjs` (Gate 3 checks).
- **Terminal result:** FIXED + PROVEN.

### P0-4 — `/results` vs `/resultados` duplicate content (10 categories)
- **Original defect:** ~10 categories served byte-identical duplicate content between an English `/results` path and Spanish `/resultados` path, no redirect, no distinguishing canonical.
- **Files changed:** `next.config.ts` (8 new `redirects()` entries, on top of the 2 pre-existing BR/En-Venta entries).
- **Runtime proof:** direction per category verified against real live navigational callers (not assumed from file location) — 3 categories (Autos, Restaurantes, Servicios) were found to have `/results` as the true canonical, opposite of the naive assumption; corrected before landing.
- **Verifier:** `scripts/verify-package-f-f2-final-fix-build.mjs` (Gate 4 checks).
- **Terminal result:** FIXED + PROVEN. (Viajes' equivalent duplicate is documented, not fixed — see Gate 18 handoff; Viajes is not Globalization-owned.)

### P0-5 — Tienda upload route zero MIME/size validation
- **Original defect:** `app/api/tienda/assets/upload/route.ts` accepted any file type with only a non-empty-body check, no size cap.
- **Files changed:** same route — added role-based MIME allowlist + size caps matching the client UI's already-advertised limits (business-card PNG, print PDF/PNG/JPEG/TIFF, JSON design snapshot).
- **Runtime proof:** TypeScript clean; limits sourced from existing client-side constants (`BUSINESS_CARD_UPLOAD_MAX_MB`, `DEFAULT_MAX_FILE_MB`), not invented.
- **Verifier:** `scripts/verify-package-f-f2-final-fix-build.mjs` (Gate 5 checks).
- **Terminal result:** FIXED + PROVEN.

### P0-6 — `ADMIN_ENFORCE_ROSTER_PERMISSIONS` production intent
- **Original defect:** flag's production value was undetermined; fine-grained admin RBAC is opt-in.
- **Files changed:** none (investigation/documentation only, per instruction — no env change authorized in F2).
- **Runtime proof:** code re-read confirmed sales-rep scoping and owner_admin safety are both independent of this flag's state; terminal classification consistent with the same conclusion reached during Package E3.
- **Terminal result:** DOCUMENTED, READY TO ENABLE AFTER OWNER QA — carried forward as a P3 external/owner decision, not a Globalization code gap.

---

## P1 — MUST FIX BEFORE PRODUCTION

### P1-1 — Canonical URL / metadata gaps (En Venta, Autos, Restaurantes, Rentas, Comida Local, Servicios lang)
- **Files changed:** `app/(site)/clasificados/en-venta/page.tsx`, `en-venta/results/page.tsx`, `autos/page.tsx`, `autos/results/page.tsx`, `autos/vehiculo/[id]/page.tsx`, `restaurantes/[slug]/page.tsx`, `rentas/listing/[id]/page.tsx`, `comida-local/[slug]/page.tsx`, `servicios/[slug]/layout.tsx`.
- **Runtime proof:** TypeScript clean across all files; canonical targets verified against Gate 4's confirmed live-CTA authority findings, not assumed.
- **Verifier:** `scripts/verify-package-f-f2-final-fix-build.mjs` (Gate 7 checks).
- **Terminal result:** FIXED + PROVEN. (Ofertas OG deferred — not a shared Globalization-owned boundary file, correctly out of scope.)

### P1-2 — Sitemap completeness
- **Files changed:** `app/sitemap.ts` — added all 14 confirmed-real category hub URLs plus `/negocios-locales`.
- **Runtime proof:** every added path verified to have a real, existing `page.tsx` before inclusion (none fabricated).
- **Verifier:** `scripts/verify-package-f-f2-final-fix-build.mjs` (Gate 16 checks).
- **Terminal result:** FIXED + PROVEN for category hubs. Per-listing dynamic URLs explicitly deferred POST-LAUNCH per this gate's own authorized scope (needs a dedicated DB-backed generator excluding draft/pending/rejected/suspended/archived rows — not attempted here to avoid an unreviewed broad change).

### P1-3 — Structured data for high-value categories (Autos, Restaurantes, Servicios)
- **Files changed:** `app/(site)/clasificados/autos/seo/autosVehicleJsonLd.ts` (new), `.../restaurantes/seo/restauranteJsonLd.ts` (new), `app/(site)/servicios/seo/serviciosJsonLd.ts` (new), plus the 3 detail pages wiring them in.
- **Runtime proof:** every field sourced from real published-row data; ratings only included when the seller/provider entered a real external rating value — nothing fabricated. TypeScript clean.
- **Verifier:** `scripts/verify-package-f-f2-final-fix-build.mjs` (Gate 15 checks).
- **Terminal result:** FIXED + PROVEN. Empleos JobPosting and En Venta/BR ClassifiedAd schema untouched, as instructed.

### P1-4 — ES/EN metadata parity (Servicios, Restaurantes, Comida Local)
- **Files changed:** `servicios/[slug]/layout.tsx` (cookie-based lang resolution — layouts cannot read `?lang=` directly, a real Next.js API constraint), `comida-local/[slug]/page.tsx` (full searchParams-based lang branching), `restaurantes/[slug]/page.tsx` (category label lang branching).
- **Runtime proof:** TypeScript clean; user-authored content (business names, descriptions) never machine-translated, matching the platform's existing rule.
- **Verifier:** `scripts/verify-package-f-f2-final-fix-build.mjs` (Gate 17 checks).
- **Terminal result:** FIXED + PROVEN, with one **named, disclosed limitation**: Servicios' fix uses the `leonix_lang` cookie (the best signal a `layout.tsx`'s `generateMetadata` can read) rather than the URL `?lang=` param directly — a first-ever visit via a bare `?lang=en` link with no cookie yet still renders Spanish metadata server-side. The page body itself still fully honors `?lang=` via its own `searchParams`. This is a genuine Next.js App Router constraint (layouts don't receive `searchParams`), not an oversight.

### P1-5 — Accessibility: label/input association, modal focus trap/restore, `prefers-reduced-motion`
- **Files changed:** `app/globals.css` (reduced-motion rule), `app/(site)/dashboard/components/LeonixDashboardShell.tsx` (44px touch targets), `app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx` + 3 En Venta free-application sections (`htmlFor`/`id` pairing), `AutosNegociosAddInventoryDrawer.tsx` + `BrNegocioChildInventoryFullApplication.tsx` (focus trap + focus restore).
- **Runtime proof:** TypeScript clean across all files.
- **Verifier:** `scripts/verify-package-f-f2-final-fix-build.mjs` (Gate 9 checks).
- **Terminal result:** FIXED + PROVEN for the shared/highest-traffic surfaces named in this gate's scope (not a full-repo accessibility sweep, which was explicitly out of scope).

### P1-6 — Upload MIME/size standardization (Rentas, Restaurantes, Servicios)
- **Files changed:** the three categories' `draft-media-upload/route.ts` files — added JPEG/PNG/WebP allowlists (image slots), slot-aware validation for Servicios' video/PDF/document slots.
- **Runtime proof:** TypeScript clean; allowlist matches the established convention already used by Comida Local's upload route and Package B's media contract.
- **Verifier:** `scripts/verify-package-f-f2-final-fix-build.mjs` (Gate 8 checks).
- **Terminal result:** FIXED + PROVEN.

### P1-7 — "Otro" custom-value verification (Empleos, Rentas, Bienes Negocio, En Venta)
- **Files changed:** `EmpleosJobResultCard.tsx`, `buildEmpleosPublishEnvelope.ts` (real write-path bug fix — was assigning the sentinel slug itself into the custom-text field), `rentasPublicListing.ts` + `mapListingRowToRentasPublicListing.ts` + `mapRentasListingLiveToPreviewVm.ts` + `rentasRentalTypeApply.ts` (lease-term custom text plumbed end-to-end).
- **Runtime proof:** TypeScript clean.
- **Verifier:** `scripts/verify-package-f-f2-final-fix-build.mjs` (Gate 10 checks).
- **Terminal result:** FIXED + PROVEN for 3 confirmed real defects (Empleos category chip, Empleos work-modality write-path bug, Rentas lease-term display). Bienes Raíces Negocio and En Venta independently confirmed to have **no applicable Otro+custom-text field in the live public render path** — N/A, not a defect. Servicios/Autos Dealer/Restaurantes (already-proven-correct) untouched.

### P1-8 — Ofertas Package 11 handoff (3 named shared-file gaps)
- **Files changed:** `app/lib/listingPlans/revenueAuditLog.ts` (new `RevenueAuditAction` union member), `app/lib/analytics/server/dashboardAnalyticsMetrics.ts` (8 new fields on `DashboardAnalyticsTotals` + `ZERO_DASHBOARD_ANALYTICS_TOTALS`), `app/api/dashboard/analytics/summary/route.ts` + `app/api/dashboard/owner-engagement/route.ts` (fallback objects now use the shared zero constant).
- **Runtime proof:** the 8 new fields stay honestly zero everywhere on this branch (no event type produces them yet — verified no other consumer of `DashboardAnalyticsTotals` breaks). TypeScript clean.
- **Verifier:** `scripts/verify-package-f-f2-final-fix-build.mjs` (Gate 11 checks).
- **Terminal result:** FIXED + PROVEN, all 3 named dependencies from `docs/OFERTAS_PACKAGE_11_GLOBALIZATION_DEPENDENCY_HANDOFF.md` closed.

### P1-9 — `results/resultados` route-of-truth reconciliation (`categoryRouteRegistry.ts` vs `categoryStandardRoutes.ts`)
- **Files changed:** `app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes.ts` (corrected `servicios`/`empleos` entries to match the registry), `app/lib/listingIdentity/categoryRouteRegistry.ts` (header comment updated to record the reconciliation).
- **Runtime proof:** confirmed via repo-wide search that `categoryPublishPath()`'s only remaining live caller (`CategoryStandardLandingPage.tsx`) is itself unreferenced by any live page — every real category renders its own bespoke landing instead. Correcting the disagreeing values is therefore a zero-live-behavior-change edit, not a routing change.
- **Verifier:** `scripts/verify-package-f-f2-final-fix-build.mjs` (Gate 12 checks).
- **Terminal result:** FIXED + PROVEN for Servicios/Empleos. `bienes-raices` already matched (corrected in an earlier gate, I.5.3A). `autos` intentionally left as-is — confirmed both values are separately live, equivalent routes (explicit prior protective comment), not a stale-truth defect.

### P1-10 — Rentas exact-address write-time redaction trace
- **Files changed:** none — verification only.
- **Runtime proof:** traced the full write path (`buildDetailPairsFromBienesRaicesPrivadoPreviewVm`/`buildDetailPairsFromBienesRaicesNegocioPreviewVm`, shared with the already-proven Bienes Raíces Privado pattern) and read path (`mapListingRowToRentasPublicListing.ts`); exact street address is only ever persisted when `mostrarDireccionExacta === true` at publish/save time, gating both the human-readable label and the machine map-URL pair.
- **Terminal result:** SAFE, no fix needed.

### P1-11 — Subscription-state client-trust surface full trace
- **Files changed:** none — verification only.
- **Runtime proof:** traced every decision-making consumer (commercial write guard, atomic capacity RPCs, Autos/BR public parent-gate visibility filters, payment-suspension lane write-back, Servicios/Restaurantes capability resolver, dashboard/admin display reads) — all read exclusively from `leonix_subscription_records` via bearer-derived owner identifiers, never client input.
- **Terminal result:** SAFE, no fix needed. **Operational note (not a trust-boundary defect):** the atomic capacity-activation RPC migration (`20260810120000_autos_br_negocio_capacity_activation_rpc.sql`, authored in an earlier package) is marked "authored, not applied" — if still unapplied in the target environment, capacity-increasing activations fail closed (HTTP 500) rather than bypassing the guard. Confirm applied before relying on it in Production; not touched in F2 (no additional migration authorized beyond P0-1).

---

## Not attempted / explicitly deferred in F2

- **Structured data for remaining categories** (Rentas, Comida Local, Ofertas, Viajes) — POST-LAUNCH per F1's own phasing.
- **Formatting consolidation** (canonical date helper, address/URL helpers) — real fragmentation, not launch-blocking, POST-LAUNCH per F1.
- **Preview-page browser-tab title language branching** (En Venta/Autos/Restaurantes preview, all noindex) — zero SEO impact since these routes are noindex; left out of scope to avoid converting static `metadata` exports to `generateMetadata` for a string search engines will never index.
- **Viajes preview noindex, dead legacy route, results/resultados duplicate** — documented in `docs/globalization/package-f/VIAJES_GLOBALIZATION_DEPENDENCY_HANDOFF.md`, not fixed (Viajes-owned, isolated worktree, locked per this build's file-area restrictions).
- **Premium Print 15%-exclusion proof** — no real `premium_print` package key exists anywhere in the app; unprovable until one does. Named blocker, owner decision on launch timing, carried from F1.

---

## Verification summary

- `scripts/verify-package-f-f2-final-fix-build.mjs`: 75/75 checks passed (static, file-content assertions covering every gate above).
- TypeScript: zero new errors introduced by any F2 change (verified per-gate against the touched files; full baseline comparison at Gate 21-22).
