# Gate OL-5 — Ofertas Locales Upload Size + Storage Readiness Audit

## Gate type
BUILD-REQUIRED

## Summary

| Area | Result |
|------|--------|
| 15 MB flyer blocker | Removed — flyer PDF max 75 MB |
| Type-specific limits | flyer_pdf 75, flyer_image 20, coupon_pdf 30, coupon_image 15 |
| Storage | Vercel Blob (documented; not Supabase) |
| Large file path | Client-direct Blob upload + multipart |
| AI scan | Unchanged (15 MB cap remains) |

## Next gate

Gate OL-6 — Step 5 AI Source + Weekly Ad vs Coupon Upload Logic
