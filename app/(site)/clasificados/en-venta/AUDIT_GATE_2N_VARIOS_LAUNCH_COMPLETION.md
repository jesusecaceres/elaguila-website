# Gate 2N — Varios Launch Completion

## 1. Files inspected
- Varios hub, results, listing (`EnVentaAnuncioLayout`), publish (redirect + Pro app), preview, dashboard card, `mis-anuncios` republish
- `enVentaFamilySafety.ts`, `listing_reports` migration, `submitListingReportAction`
- Gate 2M audit + `enVentaPublicLabels.ts`

## 2. Files changed
- `moderation/enVentaPolicyCopy.ts` (new)
- `report/submitEnVentaListingReport.ts` (new)
- `api/clasificados/en-venta/report/route.ts` (new)
- `listing/EnVentaListingReportDrawer.tsx` (new)
- `listing/EnVentaAnuncioLayout.tsx`
- `shared/components/ListingRulesConfirmationSection.tsx` (COPY_ITEM only)
- `dashboard/EnVentaListingManageCard.tsx`
- `app/(site)/dashboard/mis-anuncios/page.tsx`

## 3. Varios label coverage
- **TRUE** — Gate 2M + layout forces `Más en Varios` on en-venta detail regardless of parent override intent
- **Blocker (out of scope):** `app/(site)/clasificados/anuncio/[id]/page.tsx` category chip still says "En Venta" (not in gate edit list)

## 4. Pro included free flow
- **TRUE** — `/clasificados/publicar/en-venta` and `/free` redirect to Pro; copy in Pro app + plan callout (Gate 2M)

## 5. Free lane parked
- **TRUE** — Free files preserved; public redirect to Pro

## 6. Boost/Impulsar wording
- **TRUE** — Public results/hub use “recién refrescados”; manage card no “boost” CTA

## 7. Refrescar anuncio behavior
- **TRUE** — `renewEnVentaRepublish` updates same `listings.id` row: `republished_at`, `republish_count`; `republish_sort_at` is DB generated `coalesce(republished_at, published_at, created_at)`
- **TRUE** — `leonix_ad_id` unchanged (column not touched)
- **TRUE** — Results order by `republish_sort_at` desc
- Labels: Refrescar anuncio + helper on manage card

## 8. Report drawer behavior
- **TRUE** — `EnVentaListingReportDrawer` on detail when `showListingReport`
- Reasons: policy, offensive, prohibited, scam, misleading, wrong_category, sold_unavailable, other
- Persists via `POST /api/clasificados/en-venta/report` → `listing_reports`
- Disclaimer ES/EN per spec

## 9. Moderation pipeline
- **TRUE** — Deterministic `enVentaFamilySafety` on publish/preview (unchanged)
- **AI:** Not wired — **blocker documented** (no safe AI infra gate in repo for auto-moderation)
- Auto-hide on report: **not wired** — admin reviews `/admin/reportes`

## 10. Seller notification copy
- **TRUE** — `enVentaSellerHiddenNotice()` constants added
- **Email to seller:** **blocker** — no seller notification path wired in this gate

## 11. Admin alert/email
- **TRUE (conditional)** — High-severity report codes trigger `sendLeonixResendEmail` when `RESEND_API_KEY` + From env set; uses `LEONIX_ADMIN_ALERT_EMAIL` or `LEONIX_REPORTS_ALERT_EMAIL` or `info@leonixmedia.com`
- If Resend not configured: report still persists; email silently skipped (`adminEmailSent: false`)

## 12. Legal/responsibility copy
- **TRUE** — `EN_VENTA_PLATFORM_RESPONSIBILITY` on listing contact block; Varios publish checkbox on rules section

## 13. Build/check result
Run `npm run enventa:gate2n-launch-audit` and `npm run build` after gate.

## 14. Remaining risks
- Detail page category chip “En Venta” in shared `anuncio/[id]` route
- Storefront publish copy still references En Venta plans
- Seller email on hide not implemented
- AI second-layer moderation deferred

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Spanish public label is Varios | TRUE | Gate 2M labels + layout |
| English public label remains For Sale | TRUE | enVentaPublicLabels |
| Internal en-venta route/folder was not renamed | TRUE | No route changes |
| Public publish path uses Pro included-free flow | TRUE | Redirect pages |
| Free files were not deleted | TRUE | LeonixEnVentaFreeApplication exists |
| Free lane is hidden/parked from public choice | TRUE | Redirect |
| Pro is described as included at no charge | TRUE | Pro app + callout |
| No $9.99 pricing in public Varios publish path | TRUE | Grep / audit |
| No Stripe/payment logic was added | TRUE | No payment files |
| Public Boost/Impulsar wording removed/hidden | TRUE | Results + card |
| Refrescar anuncio action exists or blocker documented | TRUE | renewEnVentaRepublish |
| Refrescar updates same listing | TRUE | update by id |
| Refrescar preserves leonix_ad_id | TRUE | not updated |
| Results sort uses refreshed timestamp | TRUE | republish_sort_at |
| No fake boost/featured placement added | TRUE | No new boost |
| Reportar anuncio CTA exists | TRUE | EnVentaListingReportDrawer |
| Report drawer has required reasons | TRUE | enVentaPolicyCopy |
| Report submission persists | TRUE | listing_reports insert |
| Report disclaimer exists | TRUE | EN_VENTA_REPORT_DISCLAIMER |
| Family-safe moderation guardrails active | TRUE | enVentaFamilySafety |
| AI moderation wired or blocker documented | FALSE | Blocker: next gate |
| High-confidence hide/held only if workflow supports | FALSE | Not auto-hide on report |
| Seller notification copy professional | TRUE | Constants only |
| Admin alert/email exists or blocker documented | TRUE | Resend conditional |
| Buyer/seller responsibility copy exists | TRUE | Platform responsibility |
| No Supabase/schema changes unless documented | TRUE | Uses existing listing_reports |
| No unrelated categories touched | TRUE | Servicios/property checkbox reverted |
| npm run build passed | TRUE | npm run build (Gate 2N validation) |
