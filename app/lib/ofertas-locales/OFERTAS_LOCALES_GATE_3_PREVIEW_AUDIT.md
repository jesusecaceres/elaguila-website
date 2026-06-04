# Gate 3 — Ofertas Locales — Preview Shell

## 1. Gate summary

Gate 3 adds a read-only shopper-facing preview at `/publicar/ofertas-locales/preview/` that renders the local draft from Gate 2 persistence. Businesses can see how offers will look before publish exists.

No database publish, API, checkout, admin, public results, file upload, or analytics tracking was implemented.

## 2. Files created/changed

| File | Purpose |
|------|---------|
| `preview/page.tsx` | Server page + metadata |
| `preview/OfertasLocalesPreviewClient.tsx` | Load draft, empty state |
| `preview/OfertasLocalesPreviewCard.tsx` | Shopper-facing preview UI |
| `preview/ofertasLocalesPreviewCopy.ts` | Preview copy constants |
| `ofertasLocalesPreviewHelpers.ts` | Label/contact/draft-content helpers |
| `OfertasLocalesApplicationClient.tsx` | Link to preview route |
| `ofertasLocalesApplicationCopy.ts` | Preview link copy |
| `scripts/ofertas-locales-gate-3-preview-audit.ts` | Static verification |

## 3. Preview route behavior

- Reads draft via `useOfertasLocalesDraft` / `leonix:ofertas-locales:draft:v1`
- Shows loading while hydrating from localStorage
- Shows empty state when draft has no business name, title, or offer type
- Renders full preview card when content exists

## 4. Draft persistence behavior

Same persistence as Gate 2 — no new storage keys. Malformed JSON falls back to empty state via existing merge logic.

## 5. Shopper-facing UI sections

A. Preview notice (ES + EN)  
B. Offer hero (type, title, business, category, market, dates, expiry warnings)  
C. Offer content (description, coupon, flyer title, asset placeholders)  
D. Business/location + contact CTAs (call, WhatsApp, website, directions)  
E. Membership/rewards block (conditional)  
F. Digital coupon block (conditional)  
G. Magazine pickup partner note (conditional, non-primary)  
H. Future AI search teaser  
I. Back to edit + disabled publish  

## 6. Membership/rewards preview behavior

Shown when `requiresMembershipForDeals` or membership URL/label/note exist. CTA links to membership URL when valid.

## 7. Digital coupon preview behavior

Shown when digital coupon URL or note exists. Button: Activate Digital Coupons / Activar cupones digitales.

## 8. Magazine pickup partner preview behavior

Shown when `isMagazinePickupPartner` or distribution status ≠ `not_offered`. Light partner-pricing note only.

## 9. Future AI teaser note

Small badge: “Future upgrade: searchable item specials.” Does not claim live item search.

## 10. What was intentionally not implemented

- Real publish, API, DB, Stripe/checkout
- File upload for flyer/coupon assets
- Analytics event tracking
- Public results / landing pages
- Header/nav entry

## 11. Auth/layout note

Preview inherits `PublishAuthGateLayout` from `app/(site)/publicar/layout.tsx`. No custom auth added.

## 12. TRUE/FALSE audit checklist

| Requirement | TRUE/FALSE | Evidence |
|-------------|------------|----------|
| Preview route created | TRUE | `/publicar/ofertas-locales/preview` |
| Reads local draft only | TRUE | `useOfertasLocalesDraft` |
| Empty state | TRUE | `OfertasLocalesPreviewClient` |
| Draft form links to preview | TRUE | `OfertasLocalesApplicationClient` |
| No API/DB/Stripe | TRUE | scope lock |
| Auth inherited | TRUE | `/publicar` layout |
| Audit script passes | PENDING | run gate-3 audit |
| Build passes | PENDING | run `npm run build` |

## 13. Recommended next gate

**Gate 4 — Ofertas Locales — Flyer/Coupon Upload Shell**

Wire asset upload placeholders to real client-side or API upload (still no DB publish until publish-readiness gate).
