# Gate 1 — Ofertas Locales — Product Foundation

## 1. Gate summary

Gate 1 creates the isolated **Ofertas Locales** product foundation under `app/lib/ofertas-locales/`. This vertical covers weekly flyers, coupons, featured deals, and future AI-searchable specials for local businesses.

No public pages, API routes, database migrations, admin/dashboard UI, header/nav changes, or analytics implementation were added in this gate.

## 2. Files created

| File | Purpose |
|------|---------|
| `ofertasLocalesTypes.ts` | Offer, business, market, draft, searchable item, and scan job types |
| `ofertasLocalesConstants.ts` | Product name, planned routes, labels, pricing, feature lists, limits |
| `createEmptyOfertaLocalDraft.ts` | Safe empty draft factory |
| `ofertasLocalesValidation.ts` | Preview and future-publish validation |
| `ofertasLocalesFormatting.ts` | Phone, ZIP, URL, search, price, and date helpers |
| `ofertasLocalesAnalyticsEvents.ts` | Planned V1/V2 event name constants only |
| `OFERTAS_LOCALES_GATE_1_FOUNDATION_AUDIT.md` | This audit document |
| `scripts/ofertas-locales-gate-1-foundation-audit.ts` | Static gate verification script |

## 3. Product foundation created

- **Offer types:** `weekly_flyer`, `coupon`, `promotion`, `seasonal_special`, `bundle`, `featured_deal`
- **Business categories:** supermarket, carnicería, panadería, produce market, restaurant, tire shop, auto service, beauty salon, tax service, retail, event hall, other service
- **Market types:** mexican, latino, asian, indian, middle_eastern, american, international, specialty, general, other
- **Draft model:** `OfertaLocalDraft` with contact, location, validity dates, asset placeholders, and featured flag
- **Future V2 types:** `OfertaLocalSearchableItemDraft`, `OfertaLocalScanJobStatus`

## 4. Version 1 scope preserved

Version 1 (future gates) will support:

- Admin-managed offers
- Public landing/results
- ZIP/city/category/offer-type filters
- Flyer/PDF/image/coupon viewer
- Valid dates
- Call/directions/share buttons
- QR-friendly pages
- No AI search yet

## 5. Version 2 scope preserved

Version 2 (future gates) will support:

- Manual item entry
- Item search
- Item-to-flyer flow
- Review/approve workflow
- Google Document AI scan jobs
- AI Searchable Specials +$199/mo add-on

## 6. Pricing constants included

| Package | Amount |
|---------|--------|
| Digital Coupon Listing | $99/mo |
| Digital Weekly Specials | $199/mo |
| Founding Weekly Partner | $499/mo for 3 months |
| Quarter Local Deals | $599/mo |
| Half Growth | $899/mo |
| Full Authority | $1,399/mo |
| Premium Community Campaign | $2,000/mo |
| AI Searchable Specials Add-On | +$199/mo |
| Coupon Boost | +$49–$99/mo |

## 7. Analytics event names planned but not implemented

**Version 1:** `offer_view`, `result_card_click`, `flyer_open`, `pdf_click`, `coupon_click`, `phone_click`, `whatsapp_click`, `email_click`, `website_click`, `directions_click`, `share_click`, `save_click`, `like_click`, `qr_source_click`, `newsletter_source_click`

**Version 2:** `item_search`, `item_result_click`, `item_to_flyer_open`, `filter_apply`, `scan_started`, `scan_completed`, `scan_failed`, `scan_review_edited`, `scan_review_approved`, `approved_item_published`

No tracking code, API calls, or localStorage counters were added.

## 8. What was intentionally not touched

- `app/(site)/**` — no public routes or pages
- `app/api/**` — no API routes
- `app/admin/**` — no admin UI
- `app/(site)/dashboard/**` — no dashboard changes
- `supabase/**` — no migrations or schema
- Header/nav, `categoryConfig`, search/results, Stripe/payment
- Existing clasificados categories and behavior

## 9. TRUE/FALSE audit checklist

| Requirement | TRUE/FALSE | Evidence |
|-------------|------------|----------|
| Foundation lib files exist | TRUE | `app/lib/ofertas-locales/*` |
| Offer type constants created | TRUE | `OFERTAS_LOCALES_OFFER_TYPE_OPTIONS` |
| Business category constants created | TRUE | `OFERTAS_LOCALES_BUSINESS_CATEGORY_OPTIONS` |
| Pricing constants created | TRUE | `OFERTAS_LOCALES_PRICING` |
| Empty draft helper created | TRUE | `createEmptyOfertaLocalDraft()` |
| Preview validation created | TRUE | `validateOfertaLocalDraftForPreview()` |
| Future publish validation created | TRUE | `validateOfertaLocalDraftForFuturePublish()` |
| Formatting helpers created | TRUE | `ofertasLocalesFormatting.ts` |
| Analytics names planned only | TRUE | `ofertasLocalesAnalyticsEvents.ts` |
| No public route created | TRUE | No `app/(site)/ofertas-locales/` |
| No API route created | TRUE | No `app/api/ofertas-locales/` |
| No migration created | TRUE | No `ofertas_locales` in supabase |
| No header/nav touched | TRUE | Gate scope lock |
| Audit script passes | PENDING | Run `npm run ofertas-locales:gate-1-foundation-audit` |

## 10. Recommended next gate

**Gate 2 — Ofertas Locales — Publish Draft UI (isolated)**

- Add `app/(site)/publicar/ofertas-locales/` application shell using foundation types
- Wire empty draft + validation + formatting into a client form
- Auth gate via existing `PublishAuthGateLayout` pattern
- Still no DB migration until publish-readiness gate

---

## Gate 1A — Pricing + Partner Strategy Correction

### Final CFO pricing table (USD / month)

| Package | Regular | Pickup partner |
|---------|---------|----------------|
| Digital Coupon Listing | $199 | $149 |
| Digital Weekly Specials | $399 | $299 |
| Quarter Local Deals | $799 | $599 |
| Half Growth | $1,199 | $899 |
| Full Authority | $1,799 | $1,399 |
| Special Placement Campaign | $2,750 | $2,250 |
| AI Searchable Specials Add-On | +$249 | +$199 |
| Coupon Boost Add-On | +$149 | +$99 |

Partner pricing is earned by active Leonix magazine pickup/display participation (`pickup_partner_discount` / `magazine_pickup_partner`).

### Digital-first supermarket positioning

For supermarkets, the primary value is **not** print advertising. Core value:

- Leonix digital traffic
- Shopper intent
- Local discovery
- ZIP / city / category search
- Connection to classifieds, services, restaurants, businesses, newsletters, QR campaigns, and future AI search

Magazine pickup/display is a partner discount lever and distribution strategy, not the core value sold.

### Flipp vs Leonix positioning

> Flipp is a flyer platform. Leonix is a local community traffic platform that can host weekly specials inside a broader ecosystem of classifieds, services, restaurants, businesses, newsletters, QR campaigns, and future AI item search.

### Pickup partner discount strategy

The pickup partner rate is the target sellable rate. The regular price protects perceived value and gives the business a reason to join the Leonix distribution network.

### Membership / rewards CTA foundation

Optional draft fields: `membershipUrl`, `membershipCtaLabel`, `membershipNote`, `requiresMembershipForDeals`, `digitalCouponUrl`, `digitalCouponNote`.

Default CTA labels: Join Rewards, Sign up before you go, Activate digital coupons (EN) / Unirme a recompensas, Regístrate antes de ir, Activar cupones digitales (ES).

Not required for preview or future publish validation.

### Magazine distribution partner foundation

Optional draft fields: `isMagazinePickupPartner`, `magazinePickupNotes`, `magazineDistributionStatus`, `magazineMonthlyDropEstimate`.

Distribution status options: `not_offered`, `invited`, `active`, `paused`, `declined`.

Ofertas Locales creates a natural reason to connect with supermarkets and local businesses and invite them to become Leonix magazine pickup/distribution partners.

### Analytics events planned but not implemented (Gate 1A additions)

- `membership_signup_click`
- `digital_coupon_activation_click`
- `magazine_pickup_info_click`

No tracking code, API calls, or localStorage counters were added.

### What was intentionally not touched (Gate 1A)

- `app/(site)/**`, `app/api/**`, `app/admin/**`, dashboard, `supabase/**`
- Header/nav, `categoryConfig`, search/results, Stripe/payment
- Existing clasificados categories and behavior
- No public membership or magazine pickup UI

### Gate 1A TRUE/FALSE checklist

| Requirement | TRUE/FALSE | Evidence |
|-------------|------------|----------|
| Final CFO pricing updated | TRUE | `OFERTAS_LOCALES_PRICING` |
| Pickup partner pricing added | TRUE | `pickupPartnerPriceMonthly` on all packages |
| Digital-first positioning documented | TRUE | `OFERTAS_LOCALES_DIGITAL_FIRST_VALUE_PROPS` |
| Flipp vs Leonix positioning documented | TRUE | `OFERTAS_LOCALES_FLIPP_VS_LEONIX_POSITIONING` |
| Membership/rewards fields created | TRUE | `OfertaLocalDraft` membership fields |
| Digital coupon fields created | TRUE | `digitalCouponUrl`, `digitalCouponNote` |
| Magazine pickup fields created | TRUE | `isMagazinePickupPartner`, etc. |
| Magazine distribution status options | TRUE | `OFERTAS_LOCALES_MAGAZINE_DISTRIBUTION_STATUS_OPTIONS` |
| New analytics events planned only | TRUE | `ofertasLocalesAnalyticsEvents.ts` |
| No public/API/migration changes | TRUE | Gate scope lock |
