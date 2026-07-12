# Bienes Raíces Full-Page Print/Digital Entitlement E2E Closeout

**Task classification:** BATTLEFIELD ARCHITECTURE BUILD — Bienes Full-Page Print/Digital Entitlement E2E Audit + Closeout  
**Date:** 2026-07-12  
**Status:** Implementation contract closed for public overlay + ranking; owner production QA still required.

---

## End-to-end architecture

```
Admin `/admin/workspace/package-entitlements`
  → createPackageEntitlementAction / revoke / extend / attach
  → table `listing_package_entitlements`
     (category=bienes-raices, listing_source=listings, package_tier=full_page|premium|…)
  → shared resolver `packageEntitlements.ts` + `listingPackageEntitlementPlacement.ts`
  → optional promo code link via existing `leonix_promo_codes` upsert (not CMS coupon content)
  → owner/listing scope: per `listing_id` (parent and each child are separate UUIDs)
  → publish: BR bundle creates unique parent/child listing rows; entitlements are NOT denormalized into listing rows
  → public overlay API `/api/clasificados/bienes-raices/public/entitlement-overlay`
  → landing + results clients apply overlay
  → `filterBrListings` filters first, then `compareBrSponsoredRank`
  → results cards / Patrocinadores lane use Destacada/Promo badges only when entitlement-active
  → dashboard mis-anuncios + LeonixRealEstateListingManageCard show Destacado/Prioridad + dates
  → Admin tracker lists entitlements with revoke/extend
  → analytics metadata: sponsored + placement_lane + package_entitlement_tier (no promo secrets)
  → expiration/revocation: server active-window filter drops priority immediately
```

## Scope rule (parent / child)

- Entitlement attaches to **one listing UUID** (`listing_id`).
- Children **do not** auto-inherit parent full-page placement.
- Admin must assign (or attach) entitlement to each property that should rank as sponsored.
- Each property keeps its own UUID, Leonix ID, public route, card, and analytics identity.

## Fixes in this closeout

| Area | Change |
|---|---|
| Admin | Duplicate active entitlement guard; BR `listings` source hint; duplicate error message |
| Promo/package | Existing create → promo upsert chain reused (no new redemption UI) |
| Public overlay | New API + client applicator (closes C5C BR browser gap) |
| Landing/results | Overlay after browse fetch |
| Ranking | Sponsored lane after filters via `compareBrSponsoredRank` |
| Public card / lane | Badges + Patrocinadores only when entitlement-driven |
| Dashboard | Package entitlement badge + start/end on BR manage cards |
| Analytics | Safe sponsored metadata on BR events when `sponsored=true` |
| Verifier | `verify:bienes-full-page-entitlement-e2e-01` |

## Blockers

None requiring a new migration for this pipeline. Table `listing_package_entitlements` already exists and is used by Admin + shared server hydrate.

## Verification

- `npm run verify:bienes-full-page-entitlement-e2e-01`
- `npm run verify:package-entitlement-model`
- `npm run verify:bienes-parent-child-analytics-truth-01` (identity contract)
- `npm run build`

## READY TO COMMIT

YES for this implementation contract only (after verifiers + build pass).  
READY TO PUSH: NO unless owner commands push.  
Owner production QA still required with a real test entitlement window.
