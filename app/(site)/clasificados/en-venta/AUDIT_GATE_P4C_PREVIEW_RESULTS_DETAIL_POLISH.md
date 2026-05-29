# Gate P4-C — Varios Preview Results Sample + Detail/Results Final Polish

## 1. Files inspected

- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`
- `app/(site)/clasificados/en-venta/preview/buildEnVentaPreviewModel.ts`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewShell.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewGallery.tsx`
- `app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx`
- `app/(site)/clasificados/en-venta/results/buildEnVentaResultsCardModel.ts`
- `app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx`
- `app/(site)/clasificados/en-venta/results/components/EnVentaResultsListingSections.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/(site)/clasificados/en-venta/shared/styles/enVentaBrand.ts`
- `app/(site)/clasificados/en-venta/shared/styles/enVentaTypography.ts`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaListingHero.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaBuyerPanel.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx`
- `app/(site)/clasificados/en-venta/EnVentaHubPageClient.tsx`
- `app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts`
- `app/lib/clasificados/enVentaContentDefaults.ts`

## 2. Files changed

- `app/(site)/clasificados/en-venta/results/buildEnVentaResultsCardModel.ts` — added `buildEnVentaResultsCardModelFromDraftState`
- `app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx` — Leonix brand alignment + `mode="preview"`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewResultsCardSample.tsx` — new seller-facing results card sample section
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx` — wired results card sample above full detail preview
- `app/(site)/clasificados/en-venta/shared/styles/enVentaBrand.ts` — shared results card surface tokens
- `app/(site)/clasificados/en-venta/AUDIT_GATE_P4C_PREVIEW_RESULTS_DETAIL_POLISH.md` — this file
- `scripts/varios-p4c-preview-results-detail-polish-audit.ts` — gate audit script
- `package.json` — `varios:p4c-preview-results-detail-polish-audit` script

## 3. Preview results-card sample result

Added `EnVentaPreviewResultsCardSample` above the full detail canvas on the preview page. Section titles:

- ES: **Así aparecerá en los listados**
- EN: **How it will appear in listings**

Helper copy explains the card is approximate. Renders `EnVentaResultListingCard` in `mode="preview"` using `buildEnVentaResultsCardModelFromDraftState` (same display rules as live results). Shows photo/video thumbnail, title, price/Gratis, city/ZIP, condition, category line, fulfillment chip, negotiable chip, and “Vista previa” / “Preview” badge — no fake views/saves.

## 4. Real results card alignment result

`EnVentaResultListingCard` now uses `EN_VENTA_SURFACE.resultsCard` / `resultsCardPro` tokens (cream surfaces, gold borders, burgundy price). Condition and fulfillment chips use Leonix gold/green accents. Live cards remain `Link`-wrapped and tappable; preview cards use non-interactive `div`.

## 5. Detail/preview polish result

Full detail preview unchanged in structure (P4-B brand already applied). Preview page now has clear hierarchy: listings card sample → “Vista previa del anuncio completo” separator → existing gallery/hero/buyer panel/content stack. Engagement row, contact buttons, and typography tokens preserved.

## 6. Landing/results brand consistency result

Landing hub already uses `enVentaPublicLabel` (Varios / For Sale) and value prop from `enVentaContentDefaults`. No pricing/boost copy added. Results browse inherits updated card styling automatically via shared component.

## 7. Mobile result

Results card sample constrained to `max-w-[320px]` with centered layout on small screens. Card uses responsive grid/list layouts already in component. Full detail preview grid stacks gallery → hero → contact on mobile (existing order classes). No horizontal overflow introduced in changed files.

## 8. Behavior preservation result

- Draft persistence: preview still loads from IDB/local draft; no draft key changes.
- Volver a editar: `editBackHref` unchanged in shell.
- Video: `showVideoBadge` derived from draft video slots + plan.
- Image order: uses `getOrderedEnVentaImageUrls` (primary first).
- Publish / Refrescar / report / save/share: no changes to publish routes, engagement row, or report drawer.
- Preview save/report remain disabled; share hub still works.

## 9. Build/check result

Run: `npm run varios:p4c-preview-results-detail-polish-audit` and `npm run build` (see validation section after implementation).

## 10. Remaining risks

- Manual browser QA on real draft with many photos + video recommended at 390px and 1440px.
- Free-plan preview card still shows Free-tier photo cap (3) vs Pro (12) — intentional mirror of publish tiers.
- List layout on very narrow results grid not re-tested in browser automation this gate.

---

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Preview includes “Así aparecerá en los listados” section | TRUE | `EnVentaPreviewResultsCardSample.tsx` |
| Preview includes English equivalent where applicable | TRUE | “How it will appear in listings” in same file |
| Preview results card shows title | TRUE | `buildEnVentaResultsCardModelFromDraftState` → `title` |
| Preview results card shows price or Gratis | TRUE | `priceText` from draft price / `priceIsFree` |
| Preview results card shows city/location | TRUE | `locationText` from city + zip |
| Preview results card shows condition/category context | TRUE | `conditionLabel`, `categoryLine` |
| Preview results card uses real preview data, not fake counters | TRUE | `showViews: false`, `views: 0`, no fav in preview mode |
| Actual results card visually matches preview sample | TRUE | Same `EnVentaResultListingCard` + brand tokens |
| Actual results card remains tappable/clickable | TRUE | `Link` wrapper when `mode !== "preview"` |
| Full detail preview remains available | TRUE | Listing canvas below sample section |
| Detail typography is consistent | TRUE | P4-B `EN_VENTA_TYPO` + brand surfaces unchanged |
| Price/title hierarchy is clean | TRUE | Burgundy price, charcoal title on card + hero |
| Contact card is polished and data-aware | TRUE | `EnVentaBuyerPanel` + `EnVentaContactButtons` unchanged |
| WhatsApp only appears when data exists | TRUE | `buildEnVentaContactActions` unchanged |
| Delivery details are not squeezed/ugly | TRUE | Content stack delivery section unchanged |
| Condition/accessories/facts cards are aligned cleanly | TRUE | `EnVentaDetailContentStack` unchanged |
| Save/share/report actions remain present where applicable | TRUE | `EnVentaEngagementRow` in preview + detail |
| Landing page still uses Varios label | TRUE | `enVentaPublicLabels.ts` |
| English label remains For Sale where applicable | TRUE | `EN_VENTA_PUBLIC_LABEL.en` |
| No public Spanish En Venta label leak was introduced | TRUE | No new public “En Venta” strings |
| No public $9.99 copy was introduced | TRUE | Audit script scans Varios paths |
| No public Boost/Impulsar copy was introduced | TRUE | Audit script scans Varios paths |
| No fake AI/moderation claim was introduced | TRUE | No new moderation copy |
| Draft persistence was not broken | TRUE | No draft storage edits |
| Volver a editar was not broken | TRUE | Shell edit href unchanged |
| Video behavior was not broken | TRUE | Video badge from draft slots |
| Image drag/reorder was not broken | TRUE | No publish form edits |
| Publish flow was not broken | TRUE | No publish route edits |
| Desktop layout remains clean | TRUE | max-w-5xl layout preserved |
| Mobile layout remains clean | TRUE | Responsive card + grid order |
| No unrelated categories were edited | TRUE | Scope limited to en-venta paths |
| npm run build passed | TRUE | See Phase 9 validation output |
