# Autos public ranking & placement policy

**Scope:** Leonix paid Autos (`autos_classifieds_listings` → public API → landing/results).  
**Non-goals:** Generic `listings` table browse; paid search ads; consumer-facing “Boost” product naming (use Renew / Refresh / Republish only).

## 1. Seller-type balancing

| Rule | Implementation |
| ---- | -------------- |
| Dealers may receive a **visible premium band** | Results: `partitionAutosResultsVisibility` — featured dealer cap (`FEATURED_CAP`). Landing: `getLandingDealerSpotlightListings` — dealers only, featured first then recency. |
| Private sellers must not disappear | Landing: dedicated `getLandingPrivateFreshListings` section. Results: if the “recent” slice (first `RECENT_LANE_CAP` non-featured rows, sort=`newest`) would be **all dealer**, the last slot is **replaced** with the first available private row from the same filtered pool (`autosPublicResultsVisibility.ts`). |
| Main grid remains mixed | `mainGridPool` is the remainder of non-featured rows after removing recent-lane duplicates — private rows stay unless filtered out by the shopper. |

## 2. Paid priority vs fairness

- **`featured` flag** (DB column on paid row): only **dealer** (`lane === "negocios"`) rows expose `featured: true` on the public card (`mapAutosClassifiedsToPublic.ts`). That controls the **featured band**, not the entire results set.
- **Heuristic tie-break** (`compareAutosListingFairTieBreak`): small bonus for featured dealer + completeness; **does not** remove private listings from the grid.

## 3. Freshness / renew / republish

- **`publicSortTimestamp`:** `max(published_at, updated_at)` attached to each `AutosPublicListing` in the mapper.
- **“Más reciente” sort:** `compareNewestAutosPublic` (`autosPublicRanking.ts`) sorts by that timestamp first, then year, then price, then fairness tie-break.
- **Meaning:** Updating a listing (payload edit, successful republish flow, admin touch) bumps `updated_at` in Supabase → listing can rise in **newest** order without a separate “boost” column. There is **no** dedicated renew SKU wired in this repo slice; copy must not promise paid boosts.

## 4. Landing vs results

| Surface | Ordering |
| ------- | -------- |
| Landing | Three explicit bands: dealer spotlight → (existing) body/need/dealer directory blocks → **private fresh** → **mixed latest** (excluding IDs already shown). See `autosLandingArrangement.ts` + `AutosLandingPage.tsx`. |
| Results | Same inventory source as landing (`useAutosPublicListingsFetch`); sort + partition apply on the client after `applyAutosPublicFilters`. |

## 5. Demo inventory

- When `NEXT_PUBLIC_LEONIX_AUTOS_PUBLIC_DEMO=1`, sample rows may include `publicSortTimestamp` to illustrate refresh ordering (`sampleAutosPublicInventory.ts`).
