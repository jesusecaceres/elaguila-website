# Gate OL-6 — Ofertas Locales Step 5 Upload Structure + Coupon Honesty Plan

## Current issues

1. Main flyer section allowed multiple flyer asset cards (+ Volante PDF buttons).
2. “Página o sección” appeared on primary weekly flyer PDFs, implying page-by-page uploads.
3. Coupon copy implied individual coupon AI extraction / clipping without honesty about coupon sheets.
4. AI copy could overpromise extraction; WebP mentioned alongside AI scan.
5. Pending vs uploaded file state was unclear; users could advance with unsaved local selections.

## One-primary-flyer strategy

- `sectionMode="primaryMainFlyer"` on shopping-lane flyer bucket.
- Show at most one active flyer asset (first by sort order).
- Hide add buttons when a primary flyer exists; remove/replace via card controls.
- Legacy extras (index 1+) render in `supportingFlyerExtras` section — not deleted.

## Additional coupon / supporting asset strategy

- Shopping lane: `additionalCoupons` on coupon bucket — multiple individual coupons OK.
- Coupon lane: `mainCoupons` on coupon bucket; `additionalPromo` on flyer bucket for supporting images/PDFs.

## Page/section visibility strategy

- Hidden for `primaryMainFlyer` only.
- Shown for coupon assets, supporting extras, and additional promo sections.

## Coupon honesty copy strategy

- Prefer individual coupon uploads; coupon sheets = reference/review file only.
- No automatic clipping promise; no perfect extraction promise.

## AI truth-copy strategy

- PDF/JPG/PNG for AI suggestions; review before publish.
- External URLs reference-only, not scanned.
- WebP allowed for display upload but not promised for AI scan.

## External URL treatment

- Unchanged: reference/display only, not AI scan-ready.

## Persistence protection

- No File/base64 in sessionStorage.
- Uploaded metadata fields unchanged.
- Pending files tracked in component state only; block Siguiente when pending or unuploaded metadata.

## Files to change

- `ofertasLocalesStep5AssetLayout.ts` (new)
- `OfertasLocalesDraftAssetSection.tsx`
- `OfertasLocalesApplicationClient.tsx`
- `ofertasLocalesApplicationCopy.ts`
- Plan, audit, script, `package.json`

## What will not be touched

- Steps 1–4, pricing, upload size limits (OL-5), AI scan algorithm, API routes, publish mapper logic, migrations, public/admin/dashboard.

## QA checklist

- [ ] One primary flyer add flow in shopping lane
- [ ] No page/section on primary flyer
- [ ] Coupon honesty copy both lanes
- [ ] AI copy review-based, no clipping promise
- [ ] Pending upload blocks Siguiente
- [ ] Refresh preserves uploaded metadata
