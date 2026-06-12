# Ofertas Locales — Two-Lane Product Model Plan

## Current problem

Step 1 used generic “Weekly Flyer” vs “Coupon / Promotion” product cards with mixed copy. Step 3 showed coupon text for flyer lane. Step 5 only showed coupon assets for coupon lane (no optional promo files). Step 6 membership mixed with upload assets. AI copy overpromised extraction. External URLs were not clearly reference-only for AI.

## Two-lane model

| Lane | `primaryAdFormat` | Default `offerType` | Primary assets | Supporting assets |
|------|-------------------|---------------------|----------------|-----------------|
| Shopping Specials / Weekly Ad | `shopping_specials` | `weekly_flyer` | flyerAssets | couponAssets (optional) |
| Local Coupons / Promotions | `local_coupons` | `coupon` (+ subtype) | couponAssets | flyerAssets (optional) |

## Data / storage (no migration)

- Draft field: `primaryAdFormat: "shopping_specials" | "local_coupons" | ""`
- Publish: `internal_notes` metadata JSON `primaryAdFormat` (with existing social/metadata prefix)
- Legacy: infer from `offer_type` (`weekly_flyer` → shopping, coupon/promotion types → local coupons)

## Step changes

- **Step 1:** “¿Qué quieres publicar principalmente?” with two lane cards + lane-specific AI addon copy
- **Step 3:** Conditional labels (flyer title/description vs promotion title/coupon text/terms)
- **Step 5:** Lane-specific upload section titles; AI scan format hint; external URL reference-only; page/section optional for PDF; Nota field removed
- **Step 6:** Membership/rewards/digital coupon as external business systems (not uploaded files)

## AI truth copy

- Uploaded PDF/JPG/PNG may be suggested for review before public
- External URLs are reference-only in V1 (not AI scan-ready)
- WebP upload allowed for display but excluded from AI scan eligibility
- No perfect clipping promise

## Preview / public

- Preview card shows primary format badge via `labelForPrimaryAdFormatLane`
- Public cards unchanged in this gate; format available in metadata for future shells

## Admin / owner readiness

- `offer_type` column still populated; metadata `primaryAdFormat` in `internal_notes`
- `parsePrimaryAdFormatFromInternalNotes()` for future admin display
- No admin/dashboard file changes

## Files changed

See audit doc. Forbidden: payment, route optimization, SMS/email, unrelated categories, DB migrations.

## QA checklist

1. Step 1 ES/EN lane selection sets `primaryAdFormat` and `offerType`
2. Shopping lane Step 3 shows flyer title + description labels
3. Coupon lane Step 3 shows promotion title, coupon text, terms
4. Shopping lane Step 5: main flyer + optional coupons
5. Coupon lane Step 5: main coupon + optional promo image
6. External URL shows reference-only message
7. Step 6 membership section copy separates external activation
8. Preview shows primary format badge
9. Publish metadata includes `primaryAdFormat`
10. Legacy drafts infer lane from `offerType`
