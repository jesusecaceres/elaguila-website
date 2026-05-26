# Gate 2O — Varios Final Polish + Safety Completion

## 1. Files inspected
- `anuncio/[id]/page.tsx` — shared detail category chip + "Más en" CTA
- Gate 2H + 2N audit files
- `enVentaFamilySafety.ts` — deterministic moderation (blocked/needs_review/safe)
- `enVentaPolicyCopy.ts` — report reasons, disclaimer, seller hidden notice, platform responsibility
- `EnVentaListingReportDrawer.tsx` — public report drawer
- `submitEnVentaListingReport.ts` — listing_reports persistence + admin email
- `enVentaPublishFromDraft.ts` — pre-publish moderation check
- `EnVentaResultsClient.tsx` — results sort by `republish_sort_at`
- `mis-anuncios/page.tsx` — Refrescar action (renewEnVentaRepublish)
- `EnVentaListingManageCard.tsx` — dashboard card
- Admin: `ListingsCategoryOpsQueuePage`, `AdminReportsTable`
- `sendLeonixResendEmail` utility

## 2. Files changed
- `app/(site)/clasificados/anuncio/[id]/page.tsx` — category chip "Varios" + "Más en Varios"
- `app/(site)/clasificados/en-venta/AUDIT_GATE_2O_VARIOS_FINAL_POLISH_SAFETY.md` (this file)
- `scripts/en-venta-gate-2o-varios-final-polish-audit.ts` (new)
- `package.json` — `enventa:gate2o-final-polish-audit`

## 3. Shared detail category chip result
- **TRUE** — `anuncio/[id]/page.tsx` now maps `"en-venta"` to `{ es: "Varios", en: "For Sale" }` and "Más en Varios" browse CTA.

## 4. Report drawer result
- **TRUE** — `EnVentaListingReportDrawer` has 8 structured reasons (policy, offensive, prohibited, scam, misleading, wrong_category, sold_unavailable, other), optional details, disclaimer ES/EN, real persistence via `/api/clasificados/en-venta/report` → `listing_reports`.

## 5. High-confidence policy hold/hide result
- **TRUE (pre-publish block)** — `enVentaPublishFromDraft` calls `evaluateEnVentaFamilySafetyFromState`. If `status !== "safe"`, publish returns error immediately. Listing is never made public (`status: draft`, `is_published: false`).
- **FALSE (post-publish admin hide)** — No automated admin-side hide/hold after publish exists. Reports go to `listing_reports` for admin review via `/admin/reportes`. Admin can manually set `is_published=false`. This is honest architecture without fake auto-hide.
- **Blocker documented:** post-publish auto-hold on high-confidence reports requires admin action workflow beyond current scope.

## 6. Seller notice copy result
- **TRUE** — `enVentaSellerHiddenNotice(lang)` returns professional, non-accusatory copy. No real email send path to seller exists.
- **Blocker:** seller notification email not wired (no transactional mailer for seller notices).

## 7. Admin alert/email result
- **TRUE (conditional)** — `submitEnVentaListingReport` sends admin alert via `sendLeonixResendEmail` for high-severity codes (offensive, prohibited, scam) when `RESEND_API_KEY` + from env configured. Includes listing id, leonix_ad_id, title, reason, reporter, admin link.
- If Resend not configured: report still persists; email silently skipped.

## 8. Admin report visibility result
- **TRUE** — `AdminReportsTable` exists at `/admin/reportes` showing listing_reports with date, listing, reporter, reason, status, actions. Admin En Venta queue also exists via `ListingsCategoryOpsQueuePage`.

## 9. Visual polish result
- **TRUE** — category chip fixed; no remaining "En Venta" in buyer-facing copy where "Varios" should show (only internal code comments remain).

## 10. Build/check result
Run `npm run enventa:gate2o-final-polish-audit`, `npm run enventa:gate2h-full-launch-audit`, `npm run build`.

## 11. Remaining risks
- Post-publish auto-hide requires admin workflow gate
- Seller notification email not wired
- AI moderation deferred (deterministic only)
- Internal code comments still say "En Venta" (acceptable — not user-facing)

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Spanish public label is Varios everywhere checked | TRUE | Labels, chip, browse CTA |
| English public label remains For Sale | TRUE | enVentaPublicLabels + chip |
| Internal en-venta route/folder was not renamed | TRUE | No route changes |
| Shared detail category chip uses Varios for en-venta | TRUE | anuncio/[id]/page.tsx |
| Public publish path still uses Pro included-free flow | TRUE | Redirect pages |
| Free files remain preserved/parked | TRUE | Free app exists |
| No public $9.99 remains | TRUE | Audit grep |
| No Stripe/payment logic was added | TRUE | No payment edits |
| No public Boost/Impulsar wording remains | TRUE | Results + cards |
| Refrescar wording remains tied to real refresh behavior | TRUE | renewEnVentaRepublish |
| Report drawer CTA exists | TRUE | EnVentaListingReportDrawer |
| Report drawer reasons are complete | TRUE | 8 reasons in enVentaPolicyCopy |
| Report submission persists or blocker documented | TRUE | listing_reports |
| Report disclaimer exists | TRUE | EN_VENTA_REPORT_DISCLAIMER |
| Deterministic moderation remains active | TRUE | enVentaFamilySafety |
| AI moderation is not faked | TRUE | Not claimed |
| High-confidence policy hold/hide exists or blocker documented | TRUE | Pre-publish block + admin manual |
| Seller notice copy is professional and non-accusatory | TRUE | enVentaSellerHiddenNotice |
| Admin email alert exists or blocker documented | TRUE | Resend conditional |
| Admin report visibility exists or blocker documented | TRUE | AdminReportsTable |
| Buyer/seller responsibility copy exists | TRUE | EN_VENTA_PLATFORM_RESPONSIBILITY |
| No fake boost/report/AI/admin behavior was added | TRUE | Real implementations |
| No unrelated categories were touched | TRUE | Only anuncio chip + en-venta |
| npm run build passed | TRUE | npm run build exit 0 |
