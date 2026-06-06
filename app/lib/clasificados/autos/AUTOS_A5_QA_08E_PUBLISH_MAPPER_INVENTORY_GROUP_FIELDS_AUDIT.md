# A5.QA-08E — Autos Negocios Publish Mapper Writes Inventory Group Fields Audit

**Gate type:** Publish mapper fix + Supabase row proof readiness.

**Platform:** Cursor with Claude Sonnet

---

## 1. Repo/source confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Branch | `main` |
| HEAD (gate run) | `d4126595ef40966c46e7f8929bb715e3f042f30d` |

---

## 2. Initial git status/diff

Clean at gate start. Code changes: `autosClassifiedsListingService.ts`, `autosNegociosBundlePublish.ts` + gate deliverables.

---

## 3. Supabase production proof summary

**Columns confirmed in production (Chuy input):**

| Column | Type |
|--------|------|
| id | uuid |
| owner_user_id | uuid |
| lane | text |
| status | text |
| listing_payload | jsonb |
| leonix_ad_id | text |
| dealer_inventory_group_id | uuid nullable |
| dealer_inventory_parent_listing_id | uuid nullable |
| inventory_role | text nullable |

**Current production rows observed:**

- `lane = privado` only
- `status = draft/removed`
- All inventory grouping columns null
- Grouped dealer inventory query returned **0 rows**

**Conclusion:**

- Schema exists — **no migration needed**
- Zero grouped rows = no successful Negocios bundle publish on production yet, **and** Stripe-only activation previously skipped inventory group writes (fixed this gate)

---

## 4. Files inspected

- `autosClassifiedsListingService.ts` — create/activate/promote/grouping
- `autosNegociosBundlePublish.ts` — bundle child publish
- `autosInventoryInheritedPreview.ts` — draft→payload mapper
- `autosAdditionalInventoryDraft.ts` — draft `inventoryRole: additional`
- `app/api/clasificados/autos/checkout/route.ts` — QA bypass + bundle
- `app/api/clasificados/autos/listings/route.ts` — draft row create
- `AutosPublishConfirmCore.tsx` — sends `additionalInventoryVehicles` to checkout
- `app/api/clasificados/autos/public/listings/route.ts` — active rows only
- `app/api/clasificados/autos/public/listings/[id]/route.ts` — detail bundle

---

## 5. Lane impact classification

| Lane | Impact |
|------|--------|
| **Negocios only** | `promoteNegociosMainInventoryListing`, bundle publish, grouping on activate |
| **Privado only** | None |
| **Shared Autos** | `activateAutosClassifiedsListing` / `tryActivateAutosListingAfterPayment` — Privado rows skip Negocios grouping guard |
| **No impact** | Audit + SQL checklist |

---

## 6. Publish path inspection result

| Step | Behavior |
|------|----------|
| Confirm create | `POST /listings` with `lane: negocios` → draft row |
| Checkout | `additionalInventoryVehicles` sent when bundle + not inventory-add mode |
| QA bypass | Activate main → promote main → create+activate children |
| Stripe | Activate via `tryActivateAutosListingAfterPayment` → **now** writes main grouping |
| Child create | `createAutosClassifiedsListingWithInventoryParent` sets parent/group/role |
| Drawer save | Draft only in `additionalInventoryVehicles[]` — no DB child rows |

---

## 7. Main row mapping result

**PASS (after fix)** — On any Negocios anchor activation:

- `lane = negocios`
- `owner_user_id` from auth
- `status = active`, `published_at` set
- `leonix_ad_id` from DB trigger (not faked)
- `dealer_inventory_group_id` = row id or existing group
- `inventory_role = main`
- `dealer_inventory_parent_listing_id` null

Via `ensureNegociosInventoryGroupingOnActivate` → `promoteNegociosMainInventoryListing`.

---

## 8. Child row mapping result

**PASS** — Bundle publish per child:

- `lane = negocios`, same `owner_user_id`
- `inventory_role = inventory_vehicle` (DB name for draft **additional**)
- `dealer_inventory_parent_listing_id = main.id`
- `dealer_inventory_group_id` shared with main
- `listing_payload` from `mapInheritedDealerPreviewListing` (child vehicle + inherited dealer data)
- Real row per vehicle (not nested JSON only)

---

## 9. Dealer inventory group result

**PASS** — Shared `dealer_inventory_group_id` on main + children; main uses stable id (defaults to main listing uuid).

---

## 10. Leonix ID result

**PASS** — Insert trigger assigns unique `leonix_ad_id` per row; app never fabricates IDs.

---

## 11. Parent relationship result

**PASS** — Children reference main via `dealer_inventory_parent_listing_id`; parent promoted to `inventory_role = main`.

---

## 12. Results/detail read path result

**PASS** — Public API uses `listActiveAutosClassifiedsRows` / `getActiveLiveAutosBundle`; groups by `dealer_inventory_group_id`; UUID detail route (`autosLiveVehiclePath`); **no slug column required**.

---

## 13. QA bypass safety result

**PASS** — Env-gated; production blocked; no fake Stripe; bundle requires bypass; labels unchanged.

---

## 14. Privado cross-check result

**Privado checked — no dealer-only publish mapping added.** Privado still writes `lane = privado`; grouping helpers skip non-anchor Negocios children only.

---

## 15. Post-publish SQL checklist result

**Created:** `AUTOS_A5_QA_08E_POST_PUBLISH_SUPABASE_SQL.md`

---

## 16. Build/check result

See validation output below.

---

## 17. Remaining risks

- Production still needs one QA bundle publish + SQL proof (Chuy)
- Bundle publish not one DB transaction — partial child failure returns `child_activate_failed`
- Stripe path still publishes main only (no bundle without QA bypass)

---

## 18. Manual QA checklist

### Live (staging QA bypass)

1. Main + 2 inventory vehicles → publish with QA bypass
2. Run post-publish SQL §2 — expect 3 rows, shared group, roles `main` + 2× `inventory_vehicle`
3. Results + detail pages load
4. §3 orphan query returns 0 rows

---

## What was fixed (Step 5)

1. **`ensureNegociosInventoryGroupingOnActivate`** — writes `dealer_inventory_group_id` + `inventory_role = main` on every Negocios **anchor** activation (QA bypass + Stripe).
2. **`promoteNegociosMainInventoryListing`** moved to `autosClassifiedsListingService.ts`; skips child rows (`inventory_vehicle` / parent id set).
3. **`tryActivateAutosListingAfterPayment`** now calls grouping helper after Stripe activation (was missing — root cause for null group fields on paid main publishes).
4. **Bundle child activate failures** no longer silent (`child_activate_failed` returned).

---

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | §1 |
| git diff reviewed before editing | TRUE | §2 |
| Supabase production columns documented | TRUE | §3 |
| Migration not required unless proven otherwise | TRUE | §3 |
| Autos Negocios publish path inspected | TRUE | §6 |
| additionalInventoryVehicles reaches publish mapper | TRUE | `AutosPublishConfirmCore` → checkout |
| Main publish row uses lane negocios | TRUE | create + activate |
| Main publish row writes owner_user_id | TRUE | insert payload |
| Main publish row writes unique leonix_ad_id | TRUE | DB trigger |
| Main publish row writes dealer_inventory_group_id | TRUE | §7 promote |
| Main publish row writes inventory_role main | TRUE | §7 |
| Main publish row leaves dealer_inventory_parent_listing_id null | TRUE | anchor rows |
| Child publish rows are created for added inventory vehicles | TRUE | §8 bundle |
| Child rows use lane negocios | TRUE | §8 |
| Child rows write same owner_user_id | TRUE | §8 |
| Child rows write unique leonix_ad_id | TRUE | trigger per insert |
| Child rows share dealer_inventory_group_id | TRUE | §9 |
| Child rows write dealer_inventory_parent_listing_id as main id | TRUE | §11 |
| Child rows write inventory_role additional | TRUE | DB `inventory_vehicle` = draft additional |
| Child rows store child vehicle data in listing_payload | TRUE | `mapInheritedDealerPreviewListing` |
| Child rows inherit dealer/business/contact data as needed for public output | TRUE | inherited field groups |
| Drawer save does not publish child rows | TRUE | draft only until checkout |
| Final publish remains the only bundle publish action | TRUE | checkout bypass only |
| Publish failure does not silently create partial success | TRUE | `child_activate_failed` |
| Results/detail read path uses production column names | TRUE | §12 |
| Results/detail does not require slug column | TRUE | UUID route |
| Related dealer vehicles query uses dealer_inventory_group_id | TRUE | `getActiveLiveAutosBundle` |
| Public buyer does not see owner inventory CTAs | TRUE | 08P guardrails |
| QA bypass remains protected or blocker documented | TRUE | §13 |
| QA bypass does not fake Stripe payment | TRUE | §13 |
| No global Stripe/payment files touched | TRUE | §2 |
| Privado checked for shared impact | TRUE | §14 |
| No dealer-only features added to Privado | TRUE | §14 |
| No schema/migration files touched unless explicitly required | TRUE | §3 |
| No unrelated categories touched | TRUE | §2 |
| Post-publish Supabase SQL checklist created | TRUE | §15 |
| npm run build passed | TRUE | §16 |

---

## Final recommendation

Final recommendation: **GREEN** — Publish mapper now writes inventory group fields on all Negocios anchor activations and on bundle child creates. Run post-publish SQL on staging to confirm live rows.
