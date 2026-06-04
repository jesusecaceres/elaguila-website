# Gate 2 — Ofertas Locales — Publish Draft UI Shell

## 1. Gate summary

Gate 2 creates the first business-facing draft UI at `/publicar/ofertas-locales/`. The shell wires all Version 1 draft fields to the Gate 1 / Gate 1A foundation with local-only state, validation panel, pricing preview, and disabled preview/publish actions.

No real publish, API, database, checkout, admin, analytics tracking, or file upload was implemented.

## 2. Files created

| File | Purpose |
|------|---------|
| `app/(site)/publicar/ofertas-locales/page.tsx` | Server page + metadata |
| `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx` | Draft form shell |
| `app/(site)/publicar/ofertas-locales/OfertasLocalesValidationPanel.tsx` | Validation display |
| `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts` | UI copy constants |
| `app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts` | localStorage helpers |
| `app/lib/ofertas-locales/useOfertasLocalesDraft.ts` | Draft state + autosave hook |
| `scripts/ofertas-locales-gate-2-draft-ui-audit.ts` | Static gate verification |

## 3. UI sections implemented

1. Hero / product explanation (digital-first positioning)
2. Offer type selection
3. Business details (category, market, name, title, description)
4. Offer details (flyer title, coupon text, valid dates)
5. Location and contact (address, city, state, ZIP, service ZIPs, phone, WhatsApp, website, directions)
6. Rewards / membership / digital coupons
7. Magazine pickup partner (interest, status, estimates, notes)
8. Pricing preview (CFO regular + pickup partner rates)
9. Future upload placeholders (flyer/PDF, coupon image/PDF)
10. Validation panel + local save / reset + disabled preview/publish CTAs

## 4. Foundation helpers used

- `createEmptyOfertaLocalDraft()` — via `useOfertasLocalesDraft`
- `validateOfertaLocalDraftForPreview()` / `validateOfertaLocalDraftForFuturePublish()`
- `normalizeOfertaLocalPhoneInput()`, `normalizeOfertaLocalZipInput()`, `normalizeOfertaLocalUrlInput()`
- `OFERTAS_LOCALES_PRICING`, offer/business/market options, membership CTA defaults, magazine status options

## 5. Pricing strategy surfaced

Full CFO pricing table with regular and pickup partner monthly rates. Partner note: earned by active Leonix magazine pickup/display participation.

## 6. Membership/rewards fields surfaced

`requiresMembershipForDeals`, `membershipUrl`, `membershipCtaLabel`, `membershipNote`, `digitalCouponUrl`, `digitalCouponNote` with EN/ES helper copy.

## 7. Magazine pickup partner fields surfaced

`isMagazinePickupPartner`, `magazineDistributionStatus`, `magazineMonthlyDropEstimate`, `magazinePickupNotes` — framed as distribution/partner rate option, not core supermarket product.

## 8. What was intentionally not implemented

- Real publish / preview routes
- File upload (flyer/coupon assets)
- API routes
- Database / migrations
- Stripe / checkout
- Analytics event tracking
- Header/nav entry for Ofertas Locales
- Admin / dashboard

## 9. Auth/layout note

Route lives under `app/(site)/publicar/ofertas-locales/` and **inherits** `PublishAuthGateLayout` from `app/(site)/publicar/layout.tsx`. No duplicate auth logic was added.

## 10. TRUE/FALSE audit checklist

| Requirement | TRUE/FALSE | Evidence |
|-------------|------------|----------|
| Draft UI route created | TRUE | `/publicar/ofertas-locales` |
| Uses Ofertas foundation | TRUE | lib imports |
| CFO pricing surfaced | TRUE | pricing table in client |
| Membership fields surfaced | TRUE | section 6 |
| Digital coupon fields surfaced | TRUE | section 6 |
| Magazine pickup fields surfaced | TRUE | section 7 |
| Validation panel created | TRUE | `OfertasLocalesValidationPanel.tsx` |
| Upload placeholder only | TRUE | disabled placeholders |
| Preview placeholder only | TRUE | disabled button |
| Publish placeholder only | TRUE | disabled button |
| No API route | TRUE | scope lock |
| No migration | TRUE | scope lock |
| No Stripe | TRUE | scope lock |
| Auth inherited from /publicar layout | TRUE | no custom auth |
| Audit script passes | PENDING | run gate-2 audit |

## 11. Recommended next gate

**Gate 3 — Ofertas Locales — Preview Shell**

- Add preview route under `/publicar/ofertas-locales/preview` or `/clasificados/ofertas-locales/preview`
- Render draft as read-only shopper-facing card
- Still no DB publish until publish-readiness gate
