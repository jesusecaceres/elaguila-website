# A5.LAUNCH-READINESS-02 — Autos Dealers Yellow Blockers to Green + View My Profile Public Route Fix

## Gate title

A5.LAUNCH-READINESS-02 — Autos Dealers Yellow Blockers to Green + View My Profile Public Route Fix

## Correct repo confirmation

`C:/projects/elaguila-website` (Leonix / El Águila) — branch `main`

## Previous YELLOW blockers (from A5.LAUNCH-READINESS-01)

1. **Per-listing dashboard analytics UI** for paid `autos_classifieds_listings` rows not proven/wired.
2. **Production Stripe publishes main dealer first**; inventory add is post-publish — UX/copy unclear.
3. **Post-publish “Ver mi perfil” / “View my profile”** must open real public Autos ad (`/clasificados/autos/vehiculo/[uuid]`).

## Files inspected

- `app/lib/clasificados/autos/AUTOS_A5_LAUNCH_READINESS_01_FINAL_PUBLISH_SQL_INPUT_OUTPUT_BUSINESS_HUB_ANALYTICS_CTA_TRUTH_AUDIT.md`
- `app/lib/clasificados/autos/autosDealerPublishSuccessCopy.ts`
- `app/lib/clasificados/autos/autosPaidListingAnalyticsHref.ts`
- `app/lib/clasificados/autos/autosDealerInventoryBoostReturnContract.ts`
- `app/(site)/clasificados/autos/pago/exito/AutosPagoExitoClient.tsx`
- `app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx`
- `app/api/clasificados/autos/checkout/verify/route.ts`
- `app/(site)/dashboard/analytics/listing/page.tsx`
- `app/(site)/dashboard/lib/dashboardInventory.ts`
- `app/(site)/dashboard/lib/dashboardMisAnunciosCategories.ts`
- `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts`
- `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx`
- `app/api/dashboard/analytics/listing/route.ts`
- `app/lib/analytics/server/resolveListingAnalyticsIdentity.ts`
- `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx`
- `app/clasificados/autos/filters/autosBrowseFilterContract.ts` (`autosLiveVehiclePath`)

## Files changed (this gate)

- `app/lib/clasificados/autos/autosDealerPublishSuccessCopy.ts` (new)
- `app/lib/clasificados/autos/autosPaidListingAnalyticsHref.ts` (new)
- `app/lib/clasificados/autos/AUTOS_A5_LAUNCH_READINESS_02_YELLOW_BLOCKERS_TO_GREEN_AUDIT.md` (new)
- `app/(site)/clasificados/autos/pago/exito/AutosPagoExitoClient.tsx`
- `app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx`
- `app/api/clasificados/autos/checkout/verify/route.ts`
- `app/(site)/dashboard/analytics/listing/page.tsx` (new)
- `app/(site)/dashboard/lib/dashboardInventory.ts`
- `app/(site)/dashboard/lib/dashboardMisAnunciosCategories.ts`
- `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts`
- `app/(site)/dashboard/lib/fetchDashboardAnalyticsApi.ts`
- `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx`
- `app/api/dashboard/analytics/listing/route.ts`
- `scripts/autos-a5-launch-readiness-02-yellow-blockers-to-green-audit.ts` (new)
- `scripts/autos-a5-launch-readiness-01-final-publish-sql-input-output-business-hub-analytics-cta-truth-audit.ts` (analytics ready assertion)
- `package.json` (verifier script only)

## Ver mi perfil / View my profile result

| Item | Result |
|------|--------|
| **Production path** | Revenue OS success (`/revenue-os/pago/exito`) for `autos_dealer_monthly` |
| **Legacy/bypass path** | `/clasificados/autos/pago/exito` (Stripe verify + internal bypass) |
| **Public route** | `/clasificados/autos/vehiculo/{uuid}?lang=es\|en` via `autosLiveVehiclePath` / `buildAutosDealerPublishedProfileHref` |
| **Source id** | Internal `autos_classifieds_listings.id` UUID |
| **Leonix Ad ID** | Display only on success panels; not used as route lookup |
| **Primary CTA** | “Ver mi perfil” / “View my profile” when listing active |
| **Secondary CTA** | “Administrar inventario” / “Manage inventory” |
| **Webhook delay** | Honest pending copy; no fake public link until entitlement active; refresh hint on Revenue OS |
| **Draft boost return** | Unchanged — `resolveAutosDealerInventoryPackPaymentSuccessPresentation` still returns to draft application |

## Dashboard per-listing analytics result

| Item | Result |
|------|--------|
| **Route** | `/dashboard/analytics/listing?source_table=autos_classifieds_listings&source_id={uuid}&category=autos&lang=…` |
| **API** | `GET /api/dashboard/analytics/listing` with owner check via `resolveAutosRow` |
| **Parent dealer row** | Analytics link on active rows in `AutosDealerInventoryDashboardSection` |
| **Child inventory row** | Same per-row analytics link when child is independently active |
| **source_table** | `autos_classifieds_listings` |
| **source_id** | Internal UUID |
| **Leonix ID** | Display/reference only (`canonical_ad_id` query optional) |
| **Metrics** | Real events or honest zero; no fake saves/messages/leads in UI |
| **Owner safety** | API returns 403 for non-owner |
| **Zero state** | Honest empty activity message |

## Production inventory flow clarity result

| Item | Result |
|------|--------|
| **Main dealer publish** | Base `autos_dealer_monthly` activates main dealer listing/profile first |
| **Post-publish inventory** | Copy states vehicles are added/managed after activation via Manage inventory |
| **Boost 20-slot** | Unchanged — Inventory Boost entitlement separate; draft/dashboard return preserved |
| **Child draft behavior** | Draft vehicles not implied live on base checkout; manage inventory CTA provided |

## Public route proof

| Surface | Route | Table |
|---------|-------|-------|
| Success CTA | `/clasificados/autos/vehiculo/{uuid}` | `autos_classifieds_listings` |
| Dashboard public link | Same | Same |
| Admin public link | `autosLiveVehiclePath(r.id)` | Same |
| Child public link | Same pattern with child UUID | Same |

## What was intentionally locked

- Autos Privado publish/application
- Bienes Raíces, Rentas, Servicios, Restaurantes, En Venta
- Supabase migrations
- Global Stripe product/price matrix
- Unrelated dirty files (ofertas-locales, servicios, etc.)

## TRUE/FALSE audit table

| Check | Result |
|-------|--------|
| Previous YELLOW audit read | TRUE |
| Ver mi perfil opens real public Autos listing | TRUE |
| Success CTA uses internal UUID route | TRUE |
| Dashboard public link opens real Autos listing | TRUE |
| Admin public link opens real Autos listing | TRUE |
| Child public link opens child listing where applicable | TRUE |
| Per-listing dashboard analytics wired | TRUE |
| Autos analytics resolves autos_classifieds_listings | TRUE |
| Analytics source_id is internal UUID | TRUE |
| Leonix ID display only | TRUE |
| Metrics real or honest zero | TRUE |
| No fake saves/messages/leads | TRUE |
| Production inventory flow copy clear | TRUE |
| Main dealer publish behavior clear | TRUE |
| Manage inventory CTA works | TRUE |
| Draft boost return preserved | TRUE |
| Dashboard boost return preserved | TRUE |
| No Supabase migration touched | TRUE |
| No global Stripe rewrite | TRUE |
| Autos Privado untouched | TRUE |
| Build passed | TRUE |
| Ready for Chuy QA | TRUE |

Final recommendation: **GREEN**

## Manual QA for Chuy

1. Complete Autos Negocios payment/publish flow.
2. On success page, click Ver mi perfil / View my profile.
3. Confirm it opens the real public Autos dealer ad.
4. Confirm Leonix ID appears.
5. Confirm Business Hub/contact card appears.
6. Confirm images/media appear.
7. Confirm like/share appear and work.
8. Return to dashboard.
9. Click public link from dashboard.
10. Confirm same public ad opens.
11. Click analytics for dealer listing.
12. Confirm analytics page opens.
13. Confirm metrics are real or honest zero.
14. Open admin Autos listing.
15. Click public link.
16. Confirm same public ad opens.
17. If child inventory exists, open child public link.
18. Confirm child route opens child ad.
19. Confirm Manage inventory CTA works.
20. Confirm Autos Privado unchanged.
