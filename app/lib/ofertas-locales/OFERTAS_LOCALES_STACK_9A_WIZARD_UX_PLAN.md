# Stack 9A — Ofertas Locales Premium Wizard UX Plan

## 1. Current layout issues

- Single scrolling page with ~12 stacked sections feels like one long form.
- Pricing, AI intent, membership, socials, featured intent, assets, and review compete for attention at once.
- No progress indicator — business owners cannot see how far they are.
- Mobile users must scroll extensively to find submit/preview.
- Step context is lost when editing a single area (e.g. socials buried below assets).

## 2. Proposed 7-step wizard structure

| Step | ES | EN |
|------|----|----|
| 1 | Oferta | Offer |
| 2 | Negocio | Business |
| 3 | Detalles | Details |
| 4 | Ubicación | Location |
| 5 | Archivos | Files |
| 6 | Extras | Extras |
| 7 | Revisar | Review |

## 3. Fields per step

**Step 1 — Oferta:** `offerType`, `wantsAiSearchableSpecials` (+ AI helper when checked)

**Step 2 — Negocio:** `businessCategory`, `marketType`, `customMarketType` (if other), `businessName`, `title`, `description` (promo/coupon flows)

**Step 3 — Detalles:** Offer-type conditional — `flyerTitle`, `couponText`, `validFrom`, `validUntil`, `description` (general)

**Step 4 — Ubicación:** `address`, `city`, `state`, `zipCode`, `serviceZipCodes`, `phone`, `whatsapp`, `websiteUrl`, `directionsUrl`

**Step 5 — Archivos:** `flyerAssets` / `couponAssets` via existing asset section

**Step 6 — Extras:** membership/rewards, digital coupon, social links, featured intent, Leonix Partner callout (all optional)

**Step 7 — Revisar:** validation panel, digital-only pricing, preview/save/reset/submit

## 4. Mobile UX plan

- Compact progress bar: `Paso X de 7` + current step title.
- Single step visible at a time; sticky bottom nav (Back / Next).
- Card-style offer type selection (tap targets ≥ 44px).
- Reduced header copy on steps 2–7.

## 5. Desktop UX plan

- Left side rail with 7 step labels + checkmarks for visited steps.
- Main content column max-w-2xl.
- Progress fraction + step title in content header.
- Same Back/Next footer; Review step shows full validation.

## 6. Validation/navigation behavior

- Navigation never blocks — user can go Back/Next freely.
- Each step shows soft “recommended missing” hints (friendly: “Falta poco.” / “Almost there.”).
- Step 7 shows full `OfertasLocalesValidationPanel`.
- No aggressive early errors.

## 7. Save draft behavior

- Unchanged: `useOfertasLocalesDraft` + localStorage persistence.
- Save/reset on Step 7 only (also auto-save on submit).
- Step index not persisted (returns to step 1 on reload — acceptable).

## 8. Preview behavior

- Preview link on Step 7; opens existing `/preview?lang=` route.
- Draft data intact across wizard steps.

## 9. Submit behavior

- Submit for review on Step 7 only.
- Pending review messaging unchanged; no public link; no payment.

## 10. What will not be touched

- Preview components (except if preview link path unchanged)
- Publish API / DB / migrations
- Header/nav, admin, other categories
- Pricing constants, upload API
- Product logic from Stacks 6.5A / 8

## 11. QA URLs

- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=en
