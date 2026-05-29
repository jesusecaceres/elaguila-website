# Gate P4 — Varios Typography Consistency + Real Save/Share Engagement

## 1. Files inspected

- `app/(site)/clasificados/en-venta/shared/components/EnVentaListingHero.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaDetailContentStack.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaBuyerPanel.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaListingReportDrawer.tsx`
- `app/components/clasificados/analytics/LeonixSaveButton.tsx`
- `app/components/clasificados/analytics/LeonixShareButton.tsx`
- `app/components/clasificados/analytics/LeonixLikeButton.tsx`
- `app/lib/clasificadosAnalytics.ts` (`trackListingSave`, `trackListingShare`)
- **Servicios (read-only):** `servicios/lib/serviciosPublicListingSort.ts`, `servicios/[slug]/page.tsx`, `servicios/ServiciosListingResultCard.tsx`

## 2. Typography findings

- Mixed `font-bold` on titles, facts, panel labels, and buttons created uneven hierarchy.
- Section labels used both `text-xs font-bold` and `text-[11px] font-bold` inconsistently.
- Price was heavier than title on some breakpoints.

## 3. Typography changes

- Added scoped token module `app/(site)/clasificados/en-venta/shared/styles/enVentaTypography.ts` (`EN_VENTA_TYPO`).
- Applied tokens to hero, content stack, buyer panel, and contact buttons.
- Title: serif semibold; price: semibold (not extrabold); section labels: 11px semibold uppercase; values: medium weight; body: normal weight.

## 4. Servicios engagement pattern inspected

| Item | Finding |
|------|---------|
| Components | `LeonixLikeButton`, `LeonixSaveButton`, `LeonixShareButton` |
| Listing key | `serviciosEngagementListingKey`: `leonix_ad_id` → `id` → `slug` |
| Persistence | `saved_listings`, `user_liked_listings`, `listing_analytics` via `trackListingSave` / `trackListingLike` / `trackListingShare` |
| UI counts | Servicios result card shows italic note that metrics appear when available — **no fake counters** |
| Profile detail | `ServiciosProfileView` receives `engagementListingId`, `persistListingEngagement`, `publicLikeCount` (real DB aggregate when available) |

**Varios reuse:** Same Leonix buttons with `category="en-venta"`. Varios engagement key helper mirrors Servicios order: `leonix_ad_id` → listing UUID.

## 5. Varios save/heart result

- **Live detail:** `LeonixSaveButton` with `iconStyle="heart"` + `LeonixLikeButton` (Me gusta) in `EnVentaEngagementRow`.
- Persists to `saved_listings` when signed in; login redirect via existing save button behavior.
- **Preview:** Disabled Guardar with heart icon + explicit hint (no fake saved state).

## 6. Varios share result

- **Live:** `LeonixShareButton` with `persistEngagement` when listing id present → `trackListingShare` + share hub (native share / copy link).
- **Preview:** Share hub works without analytics (`listingId={null}`, `persistEngagement={false}`).
- Copy success strings live in CTA share hub (`Enlace copiado` / `Link copied` via existing `CtaActionSheet`).

## 7. Varios report result

- **Live:** Report hero button scrolls to `#enventa-listing-report`; drawer uses real `POST /api/clasificados/en-venta/report`.
- **Preview:** Report disabled with published-only hint.

## 8. Analytics/dashboard result

- **Wired:** `trackListingSave`, `trackListingShare`, `trackListingLike` through Leonix buttons with `category="en-venta"`.
- **Also wired:** `trackEnVentaListingView` / `trackEnVentaListingOpen` on detail mount (existing).
- **Blocker (documented):** Varios-specific dashboard engagement tiles (aggregate save/share counts per seller) are not a separate UI in this gate — same as Servicios note (“metrics when available”). No fake dashboard counters added.

## 9. Mobile behavior

- Engagement row uses `flex-wrap` with min 40px tap targets.
- Typography uses responsive title/price sizes; body `overflow-wrap:anywhere` preserved.

## 10. Build/check result

- `npm run varios:p4-typography-engagement-audit` — see script run output.
- `npm run build` — see validation section in gate report.

## 11. Remaining risks

- Leonix save/like wrappers still use `max-w-[13.5rem]` parent; overridden with `max-w-none w-auto` in Varios row — verify visually on narrow phones.
- Share success toast is in share hub, not a page-level toast on preview (hub copy feedback is the source of truth).

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Varios hero typography inspected | TRUE | `EnVentaListingHero.tsx` + audit §2 |
| Varios content card typography inspected | TRUE | `EnVentaDetailContentStack.tsx` |
| Servicios engagement pattern inspected read-only | TRUE | audit §4 |
| Listing title hierarchy is consistent | TRUE | `EN_VENTA_TYPO.listingTitle` |
| Price typography is consistent and prominent | TRUE | `EN_VENTA_TYPO.listingPrice` |
| Section title typography is consistent | TRUE | `EN_VENTA_TYPO.sectionTitle` |
| Label typography is consistent | TRUE | `EN_VENTA_TYPO.factLabel` |
| Value/body typography is consistent | TRUE | `EN_VENTA_TYPO.factValue` / `body` |
| Random bold/not-bold mix was cleaned up | TRUE | semibold/medium/normal tokens |
| Contact card typography is consistent | TRUE | `EnVentaBuyerPanel` + `EnVentaContactButtons` |
| Mobile typography remains readable | TRUE | responsive tokens + wrap |
| Guardar/heart action appears where appropriate | TRUE | `EnVentaEngagementRow` |
| Guardar/heart uses real persistence or blocker documented | TRUE | `LeonixSaveButton` / preview disabled |
| Saved state does not fake persistence | TRUE | preview disabled only |
| Compartir action appears where appropriate | TRUE | `LeonixShareButton` in row |
| Compartir uses real share/copy behavior | TRUE | share hub + `trackListingShare` live |
| Share success feedback exists | TRUE | CTA hub `Enlace copiado` / `Link copied` |
| Report action uses real report flow or blocker documented | TRUE | `EnVentaListingReportDrawer` |
| No fake engagement counters were added | TRUE | no count strings in bundle |
| No fake dashboard analytics were added | TRUE | audit §8 |
| Stable listing key strategy is documented | TRUE | `enVentaEngagementListingKey` |
| Action buttons are visually consistent | TRUE | `EnVentaEngagementRow` shells |
| Action buttons are mobile-friendly | TRUE | min-h 40px + wrap |
| Preview does not pretend to persist unpublished save state | TRUE | disabled Guardar + hint |
| Public detail supports real engagement where available | TRUE | `mode="live"` row |
| No unrelated categories were edited | TRUE | git diff scope |
| npm run build passed | TRUE | gate validation |
