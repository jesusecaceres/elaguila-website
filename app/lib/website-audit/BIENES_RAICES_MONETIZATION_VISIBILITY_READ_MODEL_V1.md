# Bienes Raíces Monetization Visibility Read Model V1 Audit

**Task:** Wire Bienes Raíces monetization visibility truth into the public landing/results/card system without faking paid status, without touching Stripe, and without touching promo-code redemption.

**Date:** 2026-07-07
**Status:** ✅ COMPLETE

---

## GATE 0 — SNAPSHOT / SITE CHECK

### Git Status
```
git status --short: (no changes)
git diff --name-only: (no changes)
```

### Files Inspected
- `app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx` - Results client
- `app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts` - Live browse query
- `app/(site)/clasificados/bienes-raices/resultados/lib/mapBrListingRowToCard.ts` - Row mapper
- `app/(site)/clasificados/bienes-raices/resultados/cards/listingTypes.ts` - Card types
- `app/(site)/clasificados/bienes-raices/resultados/cards/BadgeStack.tsx` - Badge stack
- `app/(site)/clasificados/components/categoryStandard/CategoryVisibilityCta.tsx` - Visibility CTA
- `app/lib/listingPlans/revenuePricingMatrix.ts` - Revenue matrix (read-only reference)
- `supabase/migrations/20260630120000_stripe_revenue_os_schema_and_entitlement_contract_01.sql` - Schema reference

---

## GATE 1 — CURRENT BIENES MONETIZATION FIELD ANALYSIS

### Current Live Select Fields
From `fetchBrPublishedListingsBrowser.ts`:
- Baseline: id, title, description, city, price, is_free, images, detail_pairs, listing_json, profile_json, contact_json, seller_type, business_name, owner_id, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role, created_at, status, is_published
- Rich timestamps: updated_at, published_at, republish_sort_at, republished_at

### Current Mapper Logic
From `mapBrListingRowToCard.ts`:
- seller_type === "business" → negocio badge
- facets.branch === "bienes_raices_negocio" or "rentas_negocio" → negocio badge
- No mapping of featured/promoted/package fields

### Revenue Matrix
From `revenuePricingMatrix.ts`:
- br_agent_monthly (agent_business, placementEligible: true)
- br_fsbo_45d (private_seller, placementEligible: true)
- Both have unresolved owner decisions (FSBO final lock, +4 properties add-on)

### Schema Reference
From `20260630120000_stripe_revenue_os_schema_and_entitlement_contract_01.sql`:
- leonix_payment_records has: package_key, placement_tier, placement_entitlement_id
- leonix_promo_code_redemptions has: package_key, placement_tier
- These are in separate Revenue OS tables, NOT in listings table

### Monetization Fields Found
**In listings table:**
- seller_type (existing, used for negocio badge)
- NO package_tier
- NO package_key
- NO package_entitlement_id
- NO placement_tier
- NO placement_tier_key
- NO is_featured
- NO featured_until
- NO is_promoted
- NO promoted_until
- NO is_verified
- NO verified_at

**In Revenue OS tables (separate):**
- leonix_payment_records: package_key, placement_tier, placement_entitlement_id
- leonix_promo_code_redemptions: package_key, placement_tier
- leonix_placement_entitlements: (exists but not inspected in detail)

### Deferred/Missing Fields
All monetization/placement fields are currently missing from the listings table. They exist in separate Revenue OS tables but are not joined into the public browse query.

---

## GATE 2 — CREATE CATEGORY-LOCAL READ MODEL

### Created File
`app/(site)/clasificados/bienes-raices/resultados/lib/brMonetizationVisibilityReadModel.ts`

### Read Model Design
Pure, read-only helper that:
- Derives sellerKind from seller_type (privado/negocio)
- Derives adPlanKey from sellerKind (paid_private/paid_business)
- Returns negocio badge for business listings
- Returns FALSE for isFeatured, isPromoted, isVerified (no real fields exist)
- Returns warnings documenting deferred fields
- Does NOT fake destacada/promocionada badges

### Output State
```typescript
{
  sellerKind: "privado" | "negocio"
  adPlanKey: "paid_private" | "paid_business" | "unknown"
  adPlanLabelEs: string
  adPlanLabelEn: string
  isFeatured: false
  isPromoted: false
  isVerified: false
  activePlacementSignals: string[]
  badgesToAdd: BrListingBadge[]
  warnings: string[]
}
```

### Date Handling
Deferred until featured_until/promoted_until fields exist. When added:
- Only active if date is now or future
- Expired dates must not create active badges

---

## GATE 3 — EXTEND BIENES LIVE SELECT SAFELY

### Updated File
`app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts`

### Changes
- Added comment documenting deferred monetization/placement fields
- Did NOT add fields to select (they don't exist in DB yet)
- Preserved existing shrink-safe select strategy
- Existing timestamp fallback remains intact

### Deferred Fields Documented
- package_tier, package_key, package_entitlement_id
- placement_tier, placement_tier_key
- is_featured, featured_until
- is_promoted, promoted_until
- is_verified, verified_at

### Safety
- Public browse still works if optional monetization columns are missing
- No migration required
- No breaking changes

---

## GATE 4 — EXTEND TYPES SAFELY

### Updated Files
- `app/(site)/clasificados/bienes-raices/resultados/lib/mapBrListingRowToCard.ts` - Added optional monetization fields to BrListingDbRow
- `app/(site)/clasificados/bienes-raices/resultados/cards/listingTypes.ts` - Added optional monetization metadata to BrNegocioListing

### BrListingDbRow Extensions
```typescript
package_tier?: string | null
package_key?: string | null
package_entitlement_id?: string | null
placement_tier?: string | null
placement_tier_key?: string | null
is_featured?: boolean | null
featured_until?: string | null
is_promoted?: boolean | null
promoted_until?: string | null
is_verified?: boolean | null
verified_at?: string | null
```

### BrNegocioListing Extensions
```typescript
adPlanLabel?: string
adPlanKey?: "paid_private" | "paid_business" | "unknown"
monetizationWarnings?: string[]
placementSignals?: string[]
```

### TypeScript Safety
- All additions are optional
- Existing cards do not require new props
- Demo listings do not break
- Strict-safe maintained

---

## GATE 5 — MAP REAL BADGES

### Updated File
`app/(site)/clasificados/bienes-raices/resultados/lib/mapBrListingRowToCard.ts`

### Changes
- Imported resolveBrMonetizationVisibility
- Replaced inline negocio logic with read model call
- Used monetization.sellerKind instead of isNegocio
- Used monetization.badgesToAdd instead of inline badges array
- Added monetization metadata to return object

### Badge Rules
- Business/negocio seller → negocio badge (preserved)
- Real active featured/highlighted → destacada badge (deferred, no field exists)
- Real active promoted → promocionada badge (deferred, no field exists)
- No active package/placement signal → no destacada/promocionada
- Paid private/business does NOT automatically equal featured

### Ad Plan Mapping
- sellerKind privado → paid_private / Privado pagado
- sellerKind negocio → paid_business / Negocio pagado

### No Fake Badges
- isFeatured always FALSE (no real field)
- isPromoted always FALSE (no real field)
- Warnings document deferred fields

---

## GATE 6 — CTA AREA CONSISTENCY

### Existing CTA
`CategoryVisibilityCta.tsx` already supports bienes-raices and says:
- ES: "Nada aparece como Destacado sin un paquete activo."
- EN: "Nothing is marked Featured without an active package."

### CTA Placement
- Landing: lower visibility CTA preserved
- Results: compact lower visibility CTA preserved after results/empty state
- No extra CTA rows in results
- No checkout link added (no proven checkout route exists)

### No Changes Needed
CTA copy is already honest and category-consistent. No changes made.

---

## GATE 7 — DO NOT CHANGE SORTING YET

### Current Sorting
- Preserved as-is
- Uses republish_sort_at when available
- Falls back to timestamp max
- No fake sorting added

### Ranking Deferred
Deferred to future gate: BIENES-RAICES-CATEGORY-RANKING-RULES-V1

Reasons:
- No real active placement field exists in listings table
- No reliable mapping from Revenue OS tables to browse order
- No fake priority should be added

---

## GATE 8 — AUDIT DOC

### TRUE/FALSE Audit Checklist

- Bienes live listing path inspected: TRUE
- Revenue matrix inspected: TRUE
- Promo code direct sorting avoided: TRUE
- Read-only monetization helper created: TRUE
- Optional monetization fields shrink-safe selected: TRUE (deferred, documented)
- Missing optional DB columns do not break browse: TRUE
- Paid private/business derived from seller/category truth: TRUE
- DESTACADA only from real active featured/highlight signal: TRUE (deferred, no field)
- PROMO only from real active promoted signal: TRUE (deferred, no field)
- No fake highlighted badges: TRUE
- Results page kept clean order: TRUE
- Landing CTA preserved: TRUE
- Results CTA preserved lower: TRUE
- Filter drawer untouched: TRUE
- Sorting/ranking unchanged unless proven safe: TRUE
- Admin/dashboard/auth/Supabase/Stripe untouched: TRUE
- Other categories untouched: TRUE
- npm run build passed: TRUE

---

## Implementation Summary

### Files Changed
- `app/(site)/clasificados/bienes-raices/resultados/lib/brMonetizationVisibilityReadModel.ts` (created)
- `app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts` (comment added)
- `app/(site)/clasificados/bienes-raices/resultados/lib/mapBrListingRowToCard.ts` (updated)
- `app/(site)/clasificados/bienes-raices/resultados/cards/listingTypes.ts` (extended)

### What Changed
- Created pure read-only monetization visibility helper
- Documented deferred monetization fields in live select
- Extended types with optional monetization fields
- Integrated read model into row mapper
- Preserved existing negocio badge behavior
- No fake destacada/promocionada badges
- No sorting changes
- No CTA changes (already correct)

### Monetization Fields Found
**In listings table:**
- seller_type (existing, used for negocio badge)

**Deferred (not in listings table):**
- package_tier, package_key, package_entitlement_id
- placement_tier, placement_tier_key
- is_featured, featured_until
- is_promoted, promoted_until
- is_verified, verified_at

**In Revenue OS tables (separate):**
- leonix_payment_records: package_key, placement_tier, placement_entitlement_id
- leonix_promo_code_redemptions: package_key, placement_tier

### Deferred/Missing Fields
All monetization/placement fields are missing from the listings table. They exist in separate Revenue OS tables but are not joined into public browse. Future implementation will require:
1. Adding fields to listings table via migration
2. Extending live select to include them
3. Updating read model to parse dates and active states
4. Adding destacada/promocionada badges when active

### Badges
- negocio preserved: TRUE
- destacada only real active featured/highlight: TRUE (deferred, no field)
- promocionada only real active promoted: TRUE (deferred, no field)
- no fake highlighted badge: TRUE

### CTA / Placement
- landing visibility CTA preserved: TRUE
- results visibility CTA preserved lower: TRUE
- no extra CTA rows in results: TRUE
- no checkout link added unless proven: TRUE

### Sorting
- current sorting preserved: TRUE
- paid/highlighted ranking deferred unless real source exists: TRUE

### Preserved
- landing page visual standard: TRUE
- results page visual standard: TRUE
- filter drawer untouched: TRUE
- active filters preserved: TRUE
- sort/view controls preserved: TRUE
- listings/empty state preserved: TRUE
- admin/dashboard/auth/Supabase/Stripe untouched: TRUE
- other categories untouched: TRUE

---

## FINAL SUMMARY

### Checks
- git status --short: (pending - no commits made)
- git diff --name-only: (pending - no commits made)
- npm run build: PASSED (exit code 0)

### READY FOR BROWSER QA
YES

### QA URLS
- https://leonixmedia.com/clasificados/bienes-raices?lang=es
- https://leonixmedia.com/clasificados/bienes-raices/resultados?state=CA&lang=es
- https://leonixmedia.com/clasificados/bienes-raices/resultados?lang=es
