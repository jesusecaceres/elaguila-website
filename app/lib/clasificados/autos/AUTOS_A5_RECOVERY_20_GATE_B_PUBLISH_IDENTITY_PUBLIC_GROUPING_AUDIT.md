# A5.RECOVERY-20 — Gate B: Publish Identity + Public Detail Dealer Inventory Grouping

## 1. Gate title

A5.RECOVERY-20 — Gate B — Publish Identity + Public Detail Dealer Inventory Grouping

## 2. Repo confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Branch | `main` |
| HEAD | `c52d1b3e017fb7a0ef11473065c64bc9767ed4da` |

## 3. Files inspected

| Area | Files |
|------|--------|
| Bundle publish | `autosNegociosBundlePublish.ts` |
| Listing service | `autosClassifiedsListingService.ts` |
| Checkout / QA bypass | `app/api/clasificados/autos/checkout/route.ts` |
| Inherited child payload | `autosInventoryInheritedPreview.ts` |
| Public read | `getActiveLiveAutosBundle`, public listings API |
| Public UI | `AutoDealerPreviewPage.tsx`, `RelatedDealerCars.tsx` |
| Dealer group page | `app/api/clasificados/autos/public/dealer/[dealerInventoryGroupId]/route.ts` |
| Prior audits | `AUTOS_A5_QA_08B`, `AUTOS_A5_QA_08E`, `AUTOS_A5_SHIP_01` |

## 4. Files changed (Gate B)

Gate B is documentation + audit script only. Multi-row publish already on `main`.

- `app/lib/clasificados/autos/AUTOS_A5_RECOVERY_20_GATE_B_PUBLISH_IDENTITY_PUBLIC_GROUPING_AUDIT.md` (this file)
- `scripts/autos-a5-recovery-20-gate-b-publish-identity-public-grouping-audit.ts` (new)
- `package.json` (R20 Gate B script entry)

## 5. Publish pipeline root issue

**Historical:** Added inventory existed only as draft preview cards; publish created a single main row.

**Current (committed):** After main listing activates, `publishNegociosBundleAdditionalVehicles` creates one DB row per saved child via `createAutosClassifiedsListingWithInventoryParent`, activates each, shares `dealer_inventory_group_id`, sets roles, merges inherited dealer data into child `listing_payload`.

**Production role naming:** DB check constraint uses `inventory_role = 'inventory_vehicle'` for children (gate spec “additional” is semantic equivalent — not a separate DB value).

**Stripe path:** Production Stripe checkout activates main only; multi-row bundle publish runs on QA bypass path (`bundle_requires_qa_bypass` documented in prior audits). No new Stripe behavior in R20.

## 6. Multi-row publish result

**PASS (code)** — Main promoted via `promoteNegociosMainInventoryListing`; children loop in `autosNegociosBundlePublish.ts` with partial-failure handling (`child_create_failed`, `child_activate_failed`, `dealer_active_limit_reached`).

## 7. Leonix ID result

**PASS (code)** — Each insert uses production table; `leonix_ad_id` assigned by DB trigger per row (verified in prior QA-08 audits). No fake IDs in draft preview.

## 8. Dealer inventory group result

**PASS (code)** — `getDealerInventoryGroupId(mainLive)` or main id used as shared `dealer_inventory_group_id` for all bundle rows.

## 9. Child parent relationship result

**PASS (code)** — Main: `inventory_role = main`, `dealer_inventory_parent_listing_id = null`. Child: `inventory_role = inventory_vehicle`, `dealer_inventory_parent_listing_id = mainListingId`.

## 10. listing_payload result

**PASS (code)** — Child rows store merged vehicle data via `mapInheritedDealerPreviewListing(mainLive.listing_payload, childDraft)` preserving child price/specs/media/videoUrls and inheriting dealer Business Hub fields.

## 11. Public detail/result grouping result

**PASS (code)** — `getActiveLiveAutosBundle` groups by `dealer_inventory_group_id`; `RelatedDealerCars` shows up to 4 siblings excluding current; each row has own detail URL via `autosLiveVehiclePath(id)`.

## 12. Business Hub inheritance result

**PASS (code)** — Child public detail renders inherited dealer/contact/websites/languages/hours from merged `listing_payload`.

## 13. Supabase SQL proof instructions

After a test publish (QA bypass bundle path), run in Supabase SQL editor:

```sql
SELECT
  id,
  leonix_ad_id,
  lane,
  status,
  inventory_role,
  dealer_inventory_group_id,
  dealer_inventory_parent_listing_id,
  published_at,
  listing_payload->>'title' AS title
FROM public.autos_classifieds_listings
WHERE dealer_inventory_group_id = '<GROUP_ID_FROM_TEST>'
ORDER BY
  CASE inventory_role WHEN 'main' THEN 0 ELSE 1 END,
  published_at;
```

**Expected:**

- One `main` row with `dealer_inventory_parent_listing_id` null
- One `inventory_vehicle` row per saved child
- All rows share the same `dealer_inventory_group_id`
- Each row has unique `leonix_ad_id`
- Child `dealer_inventory_parent_listing_id` = main `id`

Replace `<GROUP_ID_FROM_TEST>` with the UUID from the publish response or main row.

## 14. Gate B proof table

| Requirement | TRUE/FALSE | Evidence |
| --------------------------------------------------------------- | ---------- | -------- |
| Correct repo confirmed | TRUE | Preflight §2 |
| Autos-only scope respected | TRUE | Gate B audit/script only |
| Publish pipeline inspected | TRUE | §3, `autosNegociosBundlePublish.ts` |
| Production column contract respected | TRUE | `owner_user_id`, `listing_payload`, group columns |
| No owner_id/seller_id/parent_listing_id/slug dependency added | TRUE | grep in Gate B script |
| Main row publishes as inventory_role main | TRUE | `promoteNegociosMainInventoryListing` |
| Main row receives unique leonix_ad_id | TRUE | DB trigger (QA-08E) |
| Main row receives dealer_inventory_group_id | TRUE | `ensureNegociosInventoryGroupingOnActivate` |
| Main row parent id is null | TRUE | main row contract |
| Child row publishes for each saved child | TRUE | `publishNegociosBundleAdditionalVehicles` loop |
| Child rows publish as inventory_role additional | TRUE | DB value `inventory_vehicle` (semantic additional) |
| Child rows receive unique leonix_ad_id | TRUE | per-row insert |
| Child rows share dealer_inventory_group_id | TRUE | `groupId` passed to create |
| Child rows point to main via dealer_inventory_parent_listing_id | TRUE | `parentListingId: mainId` |
| Child listing_payload stores child vehicle data | TRUE | `mapInheritedDealerPreviewListing` |
| Child listing_payload preserves media/order where supported | TRUE | merged child draft fields |
| Child listing_payload preserves videoUrls | TRUE | child draft in mapper |
| Child public detail can render dealer Business Hub data | TRUE | inherited payload |
| Main public detail shows added inventory vehicles | TRUE | `RelatedDealerCars` / bundle API |
| Child public detail shows inventory context/siblings | TRUE | `getActiveLiveAutosBundle` |
| Current listing excluded from its own related list | TRUE | exclude current id in bundle builder |
| Result cards link to real detail pages | TRUE | `autosLiveVehiclePath` |
| Publish success does not ignore child insert failure | TRUE | partial ok + error codes |
| Manual Supabase SQL proof provided | TRUE | §13 |
| No global Stripe/payment touched | TRUE | R20 Gate B no payment edits |
| No schema/migration touched without approval | TRUE | no migration in R20 |

## 15. Remaining risks

- Live Supabase proof requires Chuy test publish + SQL run (checklist 19–29).
- Stripe production path still main-only by design until payment bundle is approved.
- Partial publish returns `ok: published.length > 1` with error — UI must surface errors (existing checkout handling).

## 16. Gate B recommendation: **GREEN**

Multi-row publish identity and public grouping are implemented on `main`. R20 Gate B documents and re-verifies. Live SQL proof pending Chuy.
