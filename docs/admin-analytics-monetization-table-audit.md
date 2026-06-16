# Admin Analytics & Monetization Table Audit

**Gate:** ADMIN-ANALYTICS-MONETIZATION-TABLE-AUDIT-01  
**Date:** 2026-06-12  
**Scope:** Audit/proof only — no UI, schema, Stripe, or public-page changes in this gate.

## Executive summary

Leonix admin is **operationally capable** for listing moderation across all six source-table families, but **analytics truth** and **monetization visibility** are **PARTIAL**, not fully green. The global `listing_analytics` pipeline and category monetization read model exist and are honest about gaps, yet several categories lack emitters, several siloed analytics tables are never read by admin/dashboard, package entitlements are not overlaid on queue rows, and live Supabase state must still be verified independently of repo migrations.

**Overall verdict: PARTIAL**

| Area | Verdict |
|---|---|
| Admin listing operations | **PARTIAL** |
| Admin analytics truth | **PARTIAL** |
| Admin monetization visibility | **PARTIAL** |
| Promo/entitlement operations | **PARTIAL** |
| Stripe/payment readiness | **PARTIAL** (foundation only; activation deferred) |
| Sales rep monetization tracking | **PARTIAL** |

---

## A. Listing table coverage matrix

Legend: **TRUE** / **FALSE** / **PARTIAL** — blockers cite repo files only.

| Category slug | Source table | Queue route | Live route (`?scope=live`) | Row actions | Edit/manage | Public view | Seller profile | Archive | Restore/Suspend | Republish | Featured | Verify Leonix | Leonix Ad ID | Blocker / file |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **en-venta** | `public.listings` | TRUE `/admin/workspace/clasificados/en-venta` | TRUE | TRUE `ClassifiedAdminRowActions` variant=`listings` | TRUE `/admin/workspace/clasificados/listings/[id]/edit` | TRUE `/clasificados/anuncio/[id]` | TRUE `/admin/usuarios/[owner_id]` | TRUE `status=removed` | TRUE suspend/unsuspend | TRUE PATCH `republish` | TRUE `admin_promoted` | TRUE `leonix_verified` | TRUE `listings.leonix_ad_id` | En Venta Pro expiration partial if `republished_at` missing — `categoryListingMonetization.ts` |
| **rentas** | `public.listings` (+ BR merge via `detail_pairs`) | TRUE `/admin/workspace/clasificados/rentas` | TRUE | TRUE | TRUE edit + `/admin/workspace/clasificados/rentas/[id]` inspector | TRUE `rentasListingPublicPath` | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE `leonix_ad_id` | Leonix audit capped at 400 rows — `adminClasificadosCategoryOpsAudit.ts` |
| **bienes-raices** | `public.listings` | TRUE `/admin/workspace/clasificados/bienes-raices` | TRUE | TRUE | TRUE edit | TRUE `/clasificados/anuncio/[id]` or BR preview paths | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE `leonix_ad_id` | No category-specific analytics emitter |
| **clases** | `public.listings` | TRUE `/admin/workspace/clasificados/clases` | TRUE | TRUE | TRUE edit | TRUE `/clasificados/anuncio/[id]` | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | PARTIAL derived UUID display — `formatLeonixAdId` | `NOT_CLIENT_READY` monetization — `categoryListingMonetization.ts`; no analytics emitter |
| **comunidad** | `public.listings` | TRUE `/admin/workspace/clasificados/comunidad` | TRUE | TRUE | TRUE edit | TRUE `/clasificados/anuncio/[id]` | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | PARTIAL derived UUID | `NOT_CLIENT_READY`; no analytics emitter |
| **busco** | `public.listings` | TRUE `/admin/workspace/clasificados/busco` | TRUE | TRUE | TRUE edit | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | PARTIAL derived UUID | `NOT_CLIENT_READY`; legacy `trackEvent` only |
| **restaurantes** | `restaurantes_public_listings` | TRUE `/admin/workspace/clasificados/restaurantes` | TRUE | TRUE variant=`restaurante` | FALSE no staff editor — `restaurantes/page.tsx` | TRUE `/clasificados/restaurantes/[slug]` | PARTIAL owner link if present | TRUE `status=archived` | TRUE suspend/unsuspend | TRUE | TRUE `promoted` | TRUE `leonix_verified` | TRUE `leonix_ad_id` | No staff content editor |
| **servicios** | `servicios_public_listings` | TRUE `/admin/workspace/clasificados/servicios` | TRUE | TRUE variant=`servicios` + inline status forms | PARTIAL inline status only — `servicios/actions.ts` | TRUE `/clasificados/servicios/[slug]` | PARTIAL | PARTIAL archive → `listing_status=rejected` | TRUE | TRUE | TRUE `promoted` | TRUE | TRUE `leonix_ad_id` | Archive semantics ambiguous — `app/api/admin/servicios/listings/[id]/route.ts` |
| **empleos** | `empleos_public_listings` | TRUE `/admin/workspace/clasificados/empleos` | TRUE | TRUE variant=`empleos` + moderate API | PARTIAL advertiser panel link only | TRUE `/clasificados/empleos/[slug]` | PARTIAL | TRUE `lifecycle_status=archived` | TRUE | TRUE | TRUE `admin_promoted` | TRUE (+ `verified_employer`) | TRUE `leonix_ad_id` | Client-rendered queue — `empleos/page.tsx` |
| **autos** | `autos_classifieds_listings` | TRUE `/admin/workspace/clasificados/autos` | TRUE | TRUE variant=`autos` | PARTIAL `/dashboard/mis-anuncios/[id]` | TRUE `/clasificados/autos/vehiculo/[id]` | PARTIAL | PARTIAL archive → `status=cancelled` | TRUE | TRUE | PARTIAL uses `featured` not `admin_promoted` | TRUE | TRUE `leonix_ad_id` | Feature column divergence — `autos/page.tsx`, PATCH route |
| **viajes / travel** | `viajes_staged_listings` | TRUE `/admin/workspace/clasificados/travel` | TRUE | TRUE variant=`viajes` | PARTIAL `/dashboard/viajes` | TRUE `/clasificados/viajes/...` | PARTIAL | TRUE `lifecycle_status=unpublished` | TRUE strict `is_public` guards | TRUE | TRUE `admin_promoted` | TRUE | TRUE `leonix_ad_id` | Slug mismatch travel vs viajes; analytics stub — `viajesPublicIntegration.ts` |

**Cross-cutting listing ops proof:** `app/admin/_lib/classifiedsOpsContract.ts`, `app/admin/_lib/adminClasificadosCategoryOpsAudit.ts`, `ClassifiedAdminRowActions.tsx`, category queue pages under `app/admin/(dashboard)/workspace/clasificados/`.

---

## B. Analytics truth matrix

**Strict TRUE rule (this audit):** analytics is **TRUE** only if all six hold: (1) event emitted, (2) stored, (3) stable listing key, (4) dashboard reads, (5) admin reads, (6) honest degraded state.

| Category | Emitter | API route | Storage table (migration) | Stable key | Dashboard reader | Admin reader | Degraded state | Can analytics be called? | Proof files |
|---|---|---|---|---|---|---|---|---|---|
| **en-venta** | PARTIAL — `enVentaAnalyticsExtended.ts`, legacy `listingAnalytics.ts` | TRUE `/api/analytics/events`, `/api/clasificados/listings/[id]/views` | TRUE `listing_analytics` — `20250311000000_listing_analytics.sql`, extended `20260507180000`, G2A `20260602120000` | `leonix_ad_id` → UUID | TRUE `dashboardAnalyticsSummary.ts`, `fetchOwnerDashboardAnalyticsServer.ts` | TRUE `adminUserRollups.ts` | TRUE `listingAnalyticsReadIsDegraded` | **PARTIAL** | `app/lib/listingAnalytics.ts`, `app/lib/listingAnalyticsEventTypes.ts` |
| **rentas** | PARTIAL — `rentasAnalytics.ts` (workaround events) | TRUE `/api/analytics/events` | TRUE `listing_analytics` | `leonix_ad_id` → UUID | TRUE | TRUE | TRUE | **PARTIAL** | `ownerEngagementListingKeys.ts` |
| **bienes-raices** | **FALSE** — no category emitter found | PARTIAL global only | TRUE `listing_analytics` | `leonix_ad_id` | TRUE (if events existed) | TRUE rollups | TRUE | **FALSE** | — |
| **clases** | **FALSE** | PARTIAL global only | TRUE `listing_analytics` | mixed UUID | TRUE keys collected | TRUE | TRUE | **FALSE** | — |
| **comunidad** | **FALSE** | PARTIAL global only | TRUE `listing_analytics` | mixed UUID | TRUE | TRUE | TRUE | **FALSE** | — |
| **busco** | PARTIAL legacy `trackEvent` | PARTIAL | TRUE `listing_analytics` | UUID | TRUE | TRUE | TRUE | **PARTIAL** | `listingAnalytics.ts` |
| **restaurantes** | TRUE — `restaurantesAnalytics.ts` → `/api/analytics/events` | TRUE | TRUE `listing_analytics` | slug → `leonix_ad_id` | TRUE | TRUE | TRUE non-throwing | **TRUE** | Best-in-class G2B pipeline |
| **servicios** | PARTIAL dual — global + `servicios_analytics_events` | TRUE `/api/clasificados/servicios/analytics`, `/api/analytics/events` | TRUE both tables — `20260411120000_servicios_leads_reviews_analytics.sql` | slug-primary | TRUE global + engagement rollups | TRUE list counts | TRUE | **PARTIAL** — silo table unread | `serviciosAnalytics.ts`, `servicios_analytics_events` |
| **empleos** | PARTIAL — `empleosAnalyticsExtended.ts` | TRUE `/api/analytics/events`, applications API | TRUE `listing_analytics` + `empleos_job_applications` — `20260410210000_empleos_public_listings.sql` | slug-primary | TRUE global | TRUE | TRUE | **PARTIAL** — applications not in totals | `empleos_job_applications` |
| **autos** | PARTIAL — global + `autos_classifieds_analytics_events` | TRUE autos analytics APIs | TRUE both — `20260408140000_autos_classifieds_analytics_events.sql` | `leonix_ad_id` | TRUE global side-writes | TRUE | TRUE `db_not_configured` | **PARTIAL** — silo unread; some event types not in DB CHECK | `autosAnalyticsEvents.ts`, `listingAnalyticsEventTypes.ts` |
| **viajes** | **FALSE** — `viajesTrack()` stub/no-op | PARTIAL inquiry only `/api/clasificados/viajes/inquiry` | TRUE `viajes_staged_listings`, `viajes_public_inquiries` — `20260410180000`, `20260423140000` | slug + `leonix_ad_id` | TRUE keys but zero events | PARTIAL mock admin placeholders | N/A | **FALSE** | `viajesPublicIntegration.ts`, `AdminViajesAnalyticsPlaceholders.tsx` |
| **comida-local** *(supporting)* | TRUE emitter | TRUE `/api/analytics/events` | TRUE `20260604120000_comida_local_public_listings.sql` | slug | **FALSE** not in `collectOwnerListingKeysForAnalytics` | **FALSE** | TRUE | **FALSE** | `ownerEngagementListingKeys.ts` gap |

### Supporting engagement tables

| Table | Migration in repo | Referenced by app | Dashboard reader | Admin reader | Notes |
|---|---|---|---|---|---|
| `listing_analytics` | TRUE `20250311000000`, `20260507180000`, `20260602120000` | Extensive | TRUE | TRUE | Open SELECT RLS (`USING (true)`) — security concern |
| `servicios_analytics_events` | TRUE `20260411120000` | INSERT via API | **FALSE** | **FALSE** | Siloed |
| `autos_classifieds_analytics_events` | TRUE `20260408140000` | INSERT via API | **FALSE** | **FALSE** | Siloed |
| `saved_listings` | TRUE `20260513160000` | TRUE | PARTIAL servicios counts | PARTIAL | G2A identity cols in `20260602120000` |
| `user_liked_listings` | TRUE `20260506200000` | TRUE | PARTIAL servicios | PARTIAL | — |
| `messages` | TRUE `20250313000001` | TRUE | PARTIAL via `message_sent` events | PARTIAL | Not counted from `messages` table directly |
| `servicios_public_leads` | TRUE `20260411120000` | TRUE | FALSE in analytics totals | PARTIAL leads inbox API | — |
| `empleos_job_applications` | TRUE `20260410210000` | TRUE | FALSE in analytics totals | PARTIAL applications API | — |
| `viajes_public_inquiries` | TRUE `20260423140000` | TRUE | FALSE rollup | PARTIAL | No dashboard rollup |
| `leonix_promo_codes` | TRUE `20260522120000` | TRUE | FALSE | TRUE workspace | — |
| `listing_package_entitlements` | TRUE `20260521120000` | TRUE | PARTIAL API | TRUE `adminUserRollups.ts` | Not per-listing queue overlay |
| `leonix_payment_records` | TRUE `20260526120000` | TRUE | **FALSE** | PARTIAL sales tracker | NEEDS_LIVE_SUPABASE_PROOF for production rows |
| `notifications` / `notification_preferences` | **FALSE** — no migration | Referenced? none found | **FALSE** | **FALSE** | Not in repo migrations |

---

## C. Monetization readiness matrix

Global: **no `membership_tier` leakage** in monetization resolver (`categoryListingMonetization.ts`, verified by `verify-category-listing-monetization-read-model.mjs`). **Republish ≠ Featured ≠ Verify** enforced as separate tool keys. **Stripe checkout activation deferred** everywhere.

| Category | Read model coverage | Plan/tier source | membership_tier leak | business_lite/premium leak | Republish ≠ featured | Featured ≠ verify | Verify = trust | Package entitlement overlay | Promo linkage | Sales rep attribution | Payment tracker | Stripe deferred | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| en-venta | TRUE | `detail_pairs` → free/pro | FALSE | FALSE | TRUE | TRUE | TRUE | PARTIAL gap warning | PARTIAL workspace | PARTIAL tracker | PARTIAL | TRUE | `en_venta_expiration_partial` |
| rentas | TRUE | `categoryAdPlans` rentas tiers | FALSE | FALSE | TRUE | TRUE | TRUE | PARTIAL not passed | PARTIAL | PARTIAL | PARTIAL | TRUE | `expires_at` gaps |
| bienes-raices | TRUE | `categoryAdPlans` BR tiers | FALSE | FALSE | TRUE | TRUE | TRUE | PARTIAL | PARTIAL | PARTIAL | PARTIAL | TRUE | `featured_until` missing |
| clases | PARTIAL | `NOT_CLIENT_READY` | FALSE | FALSE | N/A unsupported | N/A | PARTIAL | FALSE | FALSE | FALSE | FALSE | TRUE | Scaffold |
| comunidad | PARTIAL | `NOT_CLIENT_READY` | FALSE | FALSE | N/A | N/A | PARTIAL | FALSE | FALSE | FALSE | FALSE | TRUE | Scaffold |
| busco | PARTIAL | `NOT_CLIENT_READY` | FALSE | FALSE | N/A | N/A | PARTIAL | FALSE | FALSE | FALSE | FALSE | TRUE | Scaffold |
| restaurantes | TRUE | `categoryAdPlans` restaurantes paid | FALSE | FALSE | TRUE | TRUE | TRUE | PARTIAL | PARTIAL | PARTIAL | PARTIAL | TRUE | `featured_until` schema gap |
| servicios | TRUE | row plan fields or gap | FALSE | FALSE | TRUE | TRUE | TRUE | PARTIAL | PARTIAL | PARTIAL | PARTIAL | TRUE | `servicios_plan_missing` |
| empleos | PARTIAL | `NOT_V1_MONETIZATION` | FALSE | FALSE | PARTIAL featured unsupported | TRUE | TRUE | PARTIAL | PARTIAL | PARTIAL | PARTIAL | TRUE | Separate model TBD |
| autos | TRUE | `categoryAdPlans` autos lanes | FALSE | FALSE | TRUE | TRUE | TRUE | PARTIAL | PARTIAL | PARTIAL | PARTIAL + row Stripe cols | PARTIAL read-only | Autos Stripe not in unified tracker |
| viajes | PARTIAL | `NOT_V1_MONETIZATION` | FALSE | FALSE | PARTIAL | PARTIAL | TRUE | PARTIAL | PARTIAL | PARTIAL | PARTIAL | TRUE | `viajes_expiration_missing` |
| mascotas-y-perdidos | PARTIAL | `NOT_CLIENT_READY` | FALSE | FALSE | N/A | N/A | PARTIAL | FALSE | FALSE | FALSE | FALSE | TRUE | Scaffold |

**Admin monetization chip:** `AdminListingMonetizationSummary.tsx` + `buildAdminListingMonetizationInput.ts` — readonly, honest gap warnings, no Stripe mutation.

**Proof scripts:** `scripts/verify-category-listing-monetization-read-model.mjs`, `scripts/verify-admin-monetization-readonly-visibility.mjs`.

---

## D. Supabase migration/table proof

### Tables definitely created by repo migrations

| Table | Migration file(s) |
|---|---|
| `public.listing_analytics` | `20250311000000_listing_analytics.sql`, `20260507180000_listing_analytics_schema_complete.sql`, `20260602120000_g2a_global_analytics_identity.sql` |
| `public.saved_listings` | `20260513160000_saved_listings_canonical.sql` |
| `public.user_liked_listings` | `20260506200000_user_liked_listings.sql` |
| `public.messages` | `20250313000001_messages.sql` |
| `public.restaurantes_public_listings` | `20260408120000_restaurantes_public_listings.sql` |
| `public.servicios_public_listings` | `20260402160000_servicios_public_listings.sql` |
| `public.servicios_analytics_events` | `20260411120000_servicios_leads_reviews_analytics.sql` |
| `public.servicios_public_leads` | `20260411120000_servicios_leads_reviews_analytics.sql` |
| `public.empleos_public_listings` | `20260410210000_empleos_public_listings.sql` |
| `public.empleos_job_applications` | `20260410210000_empleos_public_listings.sql` |
| `public.autos_classifieds_listings` | `20260409120000_autos_classifieds_listings.sql` |
| `public.autos_classifieds_analytics_events` | `20260408140000_autos_classifieds_analytics_events.sql` |
| `public.viajes_staged_listings` | `20260410180000_viajes_staged_listings.sql` |
| `public.viajes_public_inquiries` | `20260423140000_viajes_public_inquiries.sql` |
| `public.leonix_promo_codes` | `20260522120000_leonix_promo_codes.sql` |
| `public.listing_package_entitlements` | `20260521120000_listing_package_entitlements.sql`, `20260521130000_listing_package_entitlements_optional_listing_id.sql` |
| `public.leonix_payment_records` | `20260526120000_leonix_payment_records.sql` |
| `public.listing_reports` | `20250312000001_listing_reports.sql` |

### Tables referenced by app but base CREATE not in migrations

| Table | Repo evidence | Status |
|---|---|---|
| `public.listings` | Many ALTER migrations (`20260509120000_classifieds_republish_capability.sql`, `20260508140000_classifieds_admin_ops_columns.sql`, etc.) | **NEEDS_LIVE_SUPABASE_PROOF** for base table existence |
| `public.notifications` | Not found in migrations or app reads | **NOT IN REPO** |
| `public.notification_preferences` | Not found | **NOT IN REPO** |

### Columns added by migrations (selected, listings family)

| Column(s) | Migration |
|---|---|
| `listings.leonix_verified`, `listings.admin_promoted` | `20260508140000_classifieds_admin_ops_columns.sql` |
| `listings.republished_at`, `republish_count`, `republish_override` | `20260509120000_classifieds_republish_capability.sql` |
| `listings.detail_pairs` | `20250316200000_listings_detail_pairs.sql`, `20260407140000_ensure_listings_detail_pairs.sql` |
| `listing_analytics.source_table`, `source_id`, `canonical_ad_id` | `20260602120000_g2a_global_analytics_identity.sql` |

### Columns referenced by code — verify live

| Column / table | Referenced in | Live proof needed |
|---|---|---|
| `featured_until` / `promoted_until` on vertical tables | `categoryListingMonetization.ts` | **NEEDS_LIVE_SUPABASE_PROOF** — gap fires when absent |
| `leonix_payment_records` rows | `paymentTrackerData.ts` | **NEEDS_LIVE_SUPABASE_PROOF** |
| `expires_at` on viajes/rentas rows | monetization resolver | **NEEDS_LIVE_SUPABASE_PROOF** |
| All migration files applied to production project | deployment | **NEEDS_LIVE_SUPABASE_PROOF** |

---

## E. Admin preparedness verdict

| Dimension | Verdict | Rationale |
|---|---|---|
| **Admin listing operations** | **PARTIAL** | All six source tables have admin queue routes and `ClassifiedAdminRowActions` PATCH flows. Staff content edit exists only for `public.listings` categories. Vertical tables rely on inline forms or advertiser dashboards. Archive semantics differ (servicios→rejected, autos→cancelled). |
| **Admin analytics truth** | **PARTIAL** | Global `listing_analytics` + identity pipeline is real for instrumented categories (restaurantes best). Bienes-raices, clases, comunidad, viajes lack truthful emitters. Silo tables (`servicios_analytics_events`, `autos_classifieds_analytics_events`) write but are not read by admin/dashboard. Viajes admin shows explicit mock placeholders. |
| **Admin monetization visibility** | **PARTIAL** | Category listing monetization read model is honest and listing-level (no account-tier leakage). Admin chips show plan/tools/gaps. Package entitlements, promo codes, and sales rep data are **not** overlaid on per-listing queue rows. |
| **Promo/entitlement operations** | **PARTIAL** | Schema + admin workspace surfaces exist (`leonix_promo_codes`, `listing_package_entitlements`, promo/sales workspace routes). Per-listing attachment not visible in queue. |
| **Stripe/payment readiness** | **PARTIAL** | `leonix_payment_records` schema + read layer exist; Stripe fields are read-only hints (Autos row columns). No checkout activation. Deferred by design in verify scripts. |
| **Sales rep monetization tracking** | **PARTIAL** | Attribution fields on promo codes / entitlement metadata; aggregated in sales tracker — not per listing row. |

---

## Blockers / needs live Supabase proof

1. **`public.listings` base table** — assumed pre-existing; only ALTER migrations in repo. Confirm columns (`leonix_ad_id`, `admin_promoted`, `leonix_verified`, republish cols) applied in production.
2. **`leonix_payment_records`** — migration exists; confirm table populated and sales tracker not returning `unavailable: true`.
3. **Per-vertical optional columns** — `featured_until`, `expires_at`, servicios plan fields — confirm which exist live vs. gap warnings only.
4. **Migration apply state** — all files under `supabase/migrations/` must be applied to production (`xuieateniufcrsfdomwl`) — not verified in this doc-only gate.
5. **Analytics RLS** — `listing_analytics` open SELECT policy should be reviewed in production security audit.
6. **Viajes analytics** — admin must not treat mock placeholders as real (`AdminViajesAnalyticsPlaceholders.tsx`).
7. **Comida local** — events may write to `listing_analytics` but owner rollup keys omit this table (`ownerEngagementListingKeys.ts`).

---

## Files inspected (minimum set)

- `app/admin/_lib/adminClasificadosCategoryOpsAudit.ts`
- `app/admin/_lib/classifiedsOpsContract.ts`
- `app/admin/_lib/listingsAdminSelect.ts`
- `app/admin/(dashboard)/workspace/clasificados/**/*`
- `app/lib/listingPlans/categoryListingMonetization.ts`
- `app/admin/(dashboard)/workspace/clasificados/_components/AdminListingMonetizationSummary.tsx`
- `app/(site)/dashboard/lib/dashboardInventory.ts`
- `app/(site)/dashboard/lib/dashboardAnalyticsSummary.ts`
- `app/lib/listingAnalytics.ts`
- `app/lib/listingAnalyticsEventTypes.ts`
- `app/lib/ownerEngagementListingKeys.ts`
- `app/api/analytics/**`
- `supabase/migrations/**/*`
- `scripts/verify-category-listing-monetization-read-model.mjs`
- `scripts/verify-admin-monetization-readonly-visibility.mjs`
- `scripts/verify-admin-listings-actions-column.mjs`
- `scripts/verify-admin-classifieds-queue-polish.mjs`
- `package.json`

---

## Gate constraints honored

- No public page edits
- No admin UI edits (this gate)
- No dashboard UI edits
- No schema/migration changes
- No Stripe/payment activation
- No category business-logic changes
