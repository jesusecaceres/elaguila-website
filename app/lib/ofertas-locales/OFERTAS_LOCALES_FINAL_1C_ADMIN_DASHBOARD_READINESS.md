# Stack FINAL-1C — Admin / Dashboard Readiness

## Admin review readiness (copy En Venta + Servicios)

**Reference patterns:**
- En Venta: `app/admin/(dashboard)/workspace/clasificados/en-venta/page.tsx` → `ListingsCategoryOpsQueuePage`
- Servicios: `app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx` + status actions

**Ofertas Locales ready for FINAL-2:**
- Table: `ofertas_locales` with `status` lifecycle (`pending_review`, `approved`, `rejected`, …)
- Reviewer needs: business_name, title, offer_type, valid dates, flyer_assets, coupon_assets, contact fields, `internal_notes` (social/AI/featured metadata)
- Approve action: `status → approved`; optionally promote social from metadata to public-safe fields
- Reject action: `status → rejected`
- AI items: on approve, set selected `oferta_local_items.is_active = true` where `review_status = approved`

## Seller dashboard readiness (copy En Venta Mis Anuncios + Servicios dashboard)

**Reference patterns:**
- `app/(site)/dashboard/mis-anuncios/page.tsx` + `EnVentaListingManageCard`
- `app/(site)/dashboard/servicios/page.tsx` + my-listings API

**Ofertas Locales ready for FINAL-3:**
- Query `ofertas_locales` by `owner_id`
- Show: title, business_name, status, submitted_at, valid_until
- Actions: view submission status, resubmit if rejected (seed wizard from row)
- No fake analytics — show zero until FINAL-5

## Recommended next stacks

1. **FINAL-2 — Admin Review Queue** (En Venta/Servicios admin pattern)
2. **FINAL-3 — Seller Dashboard Submission Status + Edit Manage**
3. **FINAL-4 — Public Detail / Business Hub Lite Full Card** (social on approved offers)
4. **FINAL-5 — Analytics Events** (Servicios `servicios_analytics_events` pattern)
5. **FINAL-6 — AI Item Review/Search Completion**
6. **FINAL-7 — Shopping List + Email/SMS + Open Map Route**
