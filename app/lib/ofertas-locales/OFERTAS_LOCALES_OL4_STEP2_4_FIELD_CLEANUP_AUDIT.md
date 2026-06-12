# Gate OL-4 — Ofertas Locales Step 2–4 Field Logic Cleanup Audit

## Gate type
BUILD-REQUIRED

## Files changed

- `OfertasLocalesApplicationClient.tsx`
- `ofertasLocalesApplicationCopy.ts`
- `ofertasLocalesDraftPersistence.ts`
- `ofertasLocalesFormatting.ts`
- `ofertasLocalesPreviewHelpers.ts`
- `ofertasLocalesApplicationHelpers.ts`
- `ofertasLocalesPublishMapper.ts`
- `ofertasLocalesWizardSteps.ts`
- `preview/OfertasLocalesPreviewCard.tsx`
- Plan + audit + script + `package.json`

## Results summary

| Area | Result |
|------|--------|
| Duplicate title | Step 2 only; Step 3 description/coupon focus |
| City default | Empty fresh draft; legacy localStorage cleared |
| ZIP input | Text string, leading-zero safe |
| Service ZIPs | Hidden from UI; backend field preserved |
| Map URL | Hidden from UI; generated directions preferred |
| Persistence | OL-2 sessionStorage + field migration |

## TRUE/FALSE table

See gate final output — all acceptance rows TRUE after validation.

## Next gate

Gate OL-5 — Step 5 Upload + AI Source Logic
