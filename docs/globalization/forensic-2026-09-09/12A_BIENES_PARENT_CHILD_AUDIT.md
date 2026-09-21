# 12A — G41 BIENES RAÍCES PARENT / CHILD AUDIT

**Audit date:** 2026-09-09
**SOURCE OF TRUTH:** `origin/main` = `a0a4783971b42ea1d71ab2602d4720d0d590baf8` (verified via `git rev-parse origin/main`).
**Primary worktree HEAD** = `d09d979c` — **112 commits STALE**; nothing in this report was read from the working tree.
**Sept sealed ref** = `e3956df893f5041ca22371c999038f297d536eae` (`fix/globalization-final-closeout-2026-09`) — referenced only for containment deltas.
**Third branch** = `fix/br-negocio-inventory-hub-media-hydration-2026-08-27` tip `0d80e891` — referenced only where a G41 row is affected.

Every path:line below was read with `git show origin/main:<path>` / `git grep -n … origin/main`. Rows marked `@Sept` or `@branch` are explicitly labelled.

---

## 0. ANCHOR VERIFICATION (the pre-supplied proven anchor)

The anchor supplied in the mission brief was independently re-verified at `origin/main` and is **CONFIRMED, byte-for-byte, at the exact cited lines**:

| Claim | Verified at origin/main | Status |
|---|---|---|
| Gate module exists | `app/(site)/clasificados/lib/brPublicChildParentVisibility.ts:51-74` (`isBrChildParentGateSatisfied`) | ✅ CONFIRMED |
| Requires `category==="bienes-raices"` | `brPublicChildParentVisibility.ts:67` | ✅ |
| Requires `seller_type==="business"` | `brPublicChildParentVisibility.ts:68` | ✅ |
| Requires `inventory_role==="main"` | `brPublicChildParentVisibility.ts:69` | ✅ |
| Requires same `owner_id` (non-empty) | `brPublicChildParentVisibility.ts:70-71` | ✅ |
| Requires parent active + published | `brPublicChildParentVisibility.ts:72` → `:30-32` (`status==="active" && is_published !== false`) | ✅ |
| Parent resolved by real UUID only | `brPublicChildParentVisibility.ts:57-61` — empty parent id ⇒ `false` (fail-closed) | ✅ |
| Browse consumer | `app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts:86` (`collectBrChildParentIds`), `:88-98` (single batched parent fetch, no N+1), `:99` (`filterBrRowsByActiveParent`) | ✅ CONFIRMED at :86-99 |
| Detail-page consumer | `app/(site)/clasificados/anuncio/[id]/page.tsx:616-646`; the call itself at `:642` (`isBrChildParentGateSatisfied`) | ✅ CONFIRMED at :621-647 (block runs :616-646, call at :642) |
| Fail-closed to "not found" | `anuncio/[id]/page.tsx:643-645` — identical `setFetchedListing(undefined)` outcome as the status check above it; no parent-state leak | ✅ |

**EXTENSION found by this audit — a THIRD adopted consumer the brief did not list:**
`app/lib/saved-search/bienes-raices/bienesRaicesPublicEligibleListing.ts:44-59` re-uses the same gate for saved-search match eligibility (also `bienesRaicesSavedSearchEligibilitySupport.ts`). Full consumer set at `origin/main` (`git grep -ln brPublicChildParentVisibility origin/main -- app/`) = **4 files** (3 BR + 1 Autos analogue `app/lib/clasificados/autos/autosPublicChildParentVisibility.ts`).

**EXTENSION — two BR public fetchers that do NOT adopt the gate (see F-02, P1).**

---

## 1. HISTORICAL LINEAGE — is the protection *currently* in force, not merely committed?

`git log --all --oneline --since=2026-07-14 -i --grep="parent|child|inventory|capacity"` surfaces the establishing work. Commit existence is **not** treated as proof; each row below states whether `origin/main` **source** still uses it.

| Protection | Establishing gate ID in source | Current origin/main source proof | In force? |
|---|---|---|---|
| Public child→parent visibility | Gate **G.2.3.4** (`brPublicChildParentVisibility.ts:2`, `fetchBrPublishedListingsBrowser.ts:82`, `anuncio/[id]/page.tsx:616`) | 3 live consumers, cited above | ✅ YES |
| Parent-pause → child cascade | Gate **G.2.3.2** (`brListingLifecycleService.ts:194-227`) | `applyBrPause` `:259-302`; `:266-268` cascades children **before** the parent write | ✅ YES |
| Archive/Discontinue blocked by live child | Gate **G.2.3.3** (`brListingLifecycleService.ts:231-248`) | `assertNoActiveBrCanonicalChildren` `:237-248`; fail-closed comment `:231-235` | ✅ YES |
| Child resume requires live parent | `brListingLifecycleService.ts:116-146` (`requireActiveBrParentForChildResume`) | called from `applyBrResume` `:304+` | ✅ YES |
| Atomic capacity-derived activation | Package C Build 4 (**C7**) — `supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql:171-296` | `activateBrNegocioListingAtomic` (`app/lib/listingPlans/capacityActivationRpc.ts:90-99`) called at `brListingLifecycleService.ts:326`, `:372`, `brListingPaymentService.ts:209`, `app/api/admin/clasificados/listings/[id]/route.ts:129`, `:198` | ✅ YES |
| No bare `status:'active'` INSERT for children | Package C Build 4 Gate 5 — `AgenteIndividualResidencialPreviewClient.tsx:377-383` (comment) + `:384-386` (`activationMode:"pending_payment"` always) | verified in current source | ✅ YES |
| Commercial write guard on edit | Package C Build 1 decision 11 — `app/api/clasificados/bienes-raices/listing-edit/route.ts:283-301` | `assertCommercialCapacityForWrite` at `:288` | ✅ YES |

**Verifier scripts still present at origin/main** (proof the gates are covered by repo self-tests):
`scripts/gate-g2-3-2-br-parent-child-pause-selftest.ts`, `scripts/gate-g2-3-3-br-archive-disposition-selftest.ts`, `scripts/gate-g2-3-4-br-public-parent-visibility-selftest.ts`, `scripts/gate-g2-3-1-br-lifecycle-mutation-selftest.ts`, `scripts/br13a-property-inventory-sql-contract-audit.ts`, `scripts/br13b-property-inventory-add-flow-audit.ts`, `scripts/br-inv-fix-01c-real-public-inventory-proof-audit.ts`, `scripts/bienes-final-parent-child-publish-inspection-08-audit.ts`, `scripts/bienes-child-inventory-persistence-rehydration-audit.ts`.

---

## 2. THE G41 MATRIX

Each row: **TRUE / FALSE / PARTIAL**, with path:line at `origin/main`.

| # | G41 item | Verdict | Proof @ origin/main |
|---|---|---|---|
| 1 | **parent UUID** | **TRUE** | Parent is an ordinary `public.listings` row; its `id uuid` is the anchor. Children point at it via `br_inventory_parent_listing_id uuid` — `supabase/migrations/20260518130600_br_property_inventory_grouping.sql:6`, FK `:31-36` (`references public.listings(id) on delete set null`), index `:42-43`. Written at publish: `leonixPublishRealEstateListingCore.ts:205`. |
| 2 | **inventory group** | **TRUE** | `br_inventory_group_id uuid` — migration `:5`, index `:39-40`, composite active-count index `:48-50`. Written `leonixPublishRealEstateListingCore.ts:204`. Self-heal for a `main` row published without a group id: `:610-621` (`mainListingInventoryPatchAfterInsert`). Grouping-key resolver `leonixBrPropertyInventoryPolicy.ts:115-122` (falls back to `owner:<uuid>`). |
| 3 | **inventory role** | **TRUE** | `inventory_role text` — migration `:7`, CHECK constraint `:17-19` restricts to `'main' \| 'inventory_property'` (null allowed for legacy), index `:45-46`. Resolver `leonixBrPropertyInventoryPolicy.ts:199-206` (`mode:"add"` ⇒ `"inventory_property"`, else `"main"`). Persisted `leonixPublishRealEstateListingCore.ts:206`. |
| 4 | **child UUID** | **TRUE** | Every child is its own real `listings` row with its own `id` and its own `leonix_ad_id` (prefix `BR`, `supabase/migrations/20260508160000_leonix_listings_prefix_bienes_raices_br.sql`). Inserted via `insertListingsRowResilient` (`leonixPublishRealEstateListingCore.ts:563`), id read back at `:565`. Confirmed as design intent in migration comment `:55-56` ("Each property remains its own public.listings row"). |
| 5 | **capacity** | **TRUE (enforced) / DEFECTIVE (semantics)** | Enforced atomically server-side: RPC `br_negocio_activate_listing` — migration `20260810120000…:171-296`; child count `:267-274`, limit `:262`, block `:278-280`, activation `:281-286`. Advisory-lock race close documented `:12`. **BUT** `:276` adds the active parent to the count, and TS mirrors do the same (`commercialWriteGuard.ts:178-194`, esp. `:192-193`; `leonixBrPropertyInventoryPolicy.ts:123-142` — `isActiveBrNegocioInventoryRow` never filters to `inventory_property`). See **F-01 (P0)**. |
| 6 | **included inventory** | **FALSE (P0)** | `BR_BASE_INCLUDED_PROPERTIES = 1` (`app/lib/listingPlans/publishCheckoutCheckpoint.ts:65`). Because the parent occupies that slot (item 5), the base BR Negocio plan yields **0 addable child properties**. See **F-01**. |
| 7 | **add-on capacity** | **PARTIAL (P0 knock-on)** | `BR_TOTAL_ACTIVE_PROPERTY_LIMIT = BR_BASE_INCLUDED_PROPERTIES + BR_INVENTORY_PACK_MAX_CHILDREN` (`publishCheckoutCheckpoint.ts:66`) = 4. Pack key `br_inventory_pack_monthly` (`publishCheckoutCheckpoint.ts:60`); DB limit switch `migration …:256-262` (`v_limit := case when v_pack_active then 4 else 1 end`). With the parent counted, a pack buyer gets **3, not 4** children. Priced $99/mo (`app/lib/listingPlans/revenuePricingMatrix.ts:145,154`). |
| 8 | **checkout identity** | **TRUE** | Entitlement is anchored to the **parent** listing id, never the child: `migration …:248-256` (`e.listing_id = v_parent.id::text`), TS mirror `commercialWriteGuard.ts:272-299`. Child publish itself never opens Stripe: `AgenteIndividualResidencialPreviewClient.tsx:376` `isInventoryAdd` ⇒ `needsPayment = false` ⇒ straight to `activate_pending` (`:393-400`). Dashboard add-on purchase path: `app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts` (add-on-only, `BIENES_INVENTORY_PACK_DASHBOARD_CHECKOUT`). |
| 9 | **entitlement** | **TRUE** | `listing_package_entitlements` rows keyed `package_key='br_inventory_pack_monthly'`, `status='active'`, `revoked_at is null`, window-checked — `migration …:248-256`. Fulfillment `app/lib/listingPlans/revenueBienesNegocioFulfillment.ts:13`, `revenueFulfillment.ts:161,168`. Client read `leonixBrPropertyInventoryPolicy.ts` (`isBrInventoryUpgradeActive`). Subscription lifecycle honored: `migration …:236-246` returns `grace_blocks_new_capacity` / `subscription_suspended` / `subscription_canceled`. |
| 10 | **child creation** | **TRUE** | Two entry points, both funnelling to `publishLeonixListingFromAgenteResidencialDraft` (`leonixPublishRealEstateFromDraftState.ts:468`) with `mode:"add"`: (a) preview publish `AgenteIndividualResidencialPreviewClient.tsx:149` + `:384-386`; (b) bundle queue `brNegocioInventoryBundlePendingPublish.ts:232`. Both **always** insert `status='pending', is_published=false` and then call the server RPC — `AgenteIndividualResidencialPreviewClient.tsx:377-383` documents this explicitly as Gate 5. |
| 11 | **child edit** | **TRUE (same row)** | Route `POST app/api/clasificados/bienes-raices/listing-edit/route.ts:234`. Children are re-read by group `:320-327`, matched by existing child id `:335-341`, and **UPDATEd in place** via `updateOneListing` `:352-359` → `.update(builtPatch.patch).eq("id", input.existing.id)` at `:219-222`. **No INSERT anywhere in this route** — new children in the draft are refused and returned as `skippedNewChildren` `:333-337`, `:373`. Same-row proof echoed back at `:365-369`. |
| 12 | **child preview** | **TRUE** | In-application overlay `BrNegocioChildInventoryFullPreviewOverlay.tsx:5` renders the **same** `AgenteIndividualResidencialPreviewPage` the parent uses — one preview VM builder for parent and child, no divergent child renderer. Standalone hop: `brNegocioInventoryAddModePreviewHandoff.ts` → `/clasificados/bienes-raices/preview/negocio`. |
| 13 | **child public page** | **TRUE** | Same canonical monolith as every BR row: `app/(site)/clasificados/anuncio/[id]/page.tsx`. Lane resolved `:1437` via `resolveBrListingLane` (`bienes-raices/listing/brListingLane.ts:31-45`, child = `inventory_role==="inventory_property" && parentId` at `:35`), dispatched `:1470-1474` to `BienesRaicesNegocioLiveDetailShell`. Branch alias `/clasificados/bienes-raices/anuncio/[id]` is a redirect to the same row. **Parent identity is inherited on the public child page**: `BienesRaicesNegocioLiveDetailShell.tsx:412-442` fetches the parent row, `:189-265` merges parent `business_meta` / `contact_email` / `contact_phone` / `business_name` under the child's own values. |
| 14 | **child analytics** | **PARTIAL (P0 — inherited category-wide)** | Child is a first-class analytics subject in identity terms: `analyticsContext` is built from the child's **own** `listings.id` + `leonix_ad_id` at `BienesRaicesNegocioLiveDetailShell.tsx:465-466` and passed into `AgenteIndividualResidencialPreviewPage` `:475`, reaching the CTA/contact emitters at `BrAgenteResContactSidebar.tsx:44`; save-toggle via `trackListingSaveToggleAuthed` `:7`. No `inventory_role` special-casing anywhere under `app/lib/analytics/` (zero grep hits). **BUT `listing_view` / `listing_open` are never emitted for any BR row, parent or child — see F-07 (P0).** |
| 15 | **parent-inactive cascade** | **TRUE** | Gate G.2.3.2 in `app/lib/clasificados/bienes-raices/brListingLifecycleService.ts`: eligible-children query `:173-192` (scoped by `inventory_role='inventory_property'` **and** `br_inventory_parent_listing_id = parent.id`, `:185-186`), cascade `:204-227`, ordering rule (children **before** parent) `:250-268`. Fail-closed direction documented `:200-203`. Complement Gate G.2.3.3 `:231-248` blocks parent Archive/Discontinue while any canonical child is live; its fail-closed direction is deliberately inverted `:231-235`. Child resume blocked while parent is down: `:116-146`. Public read is belt-and-braces via item 1's gate. |
| 16 | **wrong-owner prevention** | **PARTIAL** | **Public read: TRUE** — `brPublicChildParentVisibility.ts:70-71` requires non-empty, equal `owner_id`. **Edit API: TRUE** — `listing-edit/route.ts:266-268` (403 `owner_mismatch`), and the write itself is double-scoped `.eq("id", …).eq("owner_id", input.ownerId)` `:220-222` plus `.eq("br_inventory_parent_listing_id", input.parentListingId)` `:224-225`; child re-read scoped `.eq("owner_id", bearerUserId)` `:324`. **Capacity RPC: TRUE** — `migration …:193` (target owner) and `:223` (parent owner). **Write-time creation: FALSE** — see **F-03 (P1)**: nothing at insert time verifies the referenced parent belongs to the caller, and RLS does not either (`supabase/migrations/20260421130001_listings_enable_rls_full_policies.sql:74-78`, `with check (owner_id = auth.uid())` only). Mitigated (not closed) because the public gate refuses to render a cross-owner child. |
| 17 | **dashboard inventory tools** | **TRUE** | Owner query carries the columns: `app/(site)/dashboard/lib/ownerListingsQuery.ts:20` (`WITH_BR_INVENTORY`), mapped `:227-228`. Manage card is role-aware: `dashboard/components/LeonixRealEstateListingManageCard.tsx:290` (main-vs-child gate), `:320` (`inventoryRole`), `:434-436` (renders the parent's Leonix Ad ID on a child). Detail view: `dashboard/mis-anuncios/[id]/page.tsx:652-655` (parent ref row), `:792-793` (child "edit" deep-links into the **parent's** application with `&openChildDraftId=br-db-child-<id>`). Feed/list mapping `dashboard/mis-anuncios/page.tsx:1462-1466`, `:2147`. Add-on purchase surface `dashboard/lib/bienesDashboardInventoryAddonCheckout.ts`. |
| 18 | **admin** | **TRUE** | Admin select carries the columns: `app/admin/_lib/listingsAdminSelect.ts:11`. Table renders role/parent badges: `app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx:119-122`. Role-aware action guard: `app/admin/_lib/adminInventoryActionGuard.ts:19-25`, `:69-94`. Admin activation routes through the **same atomic capacity RPC** as the owner path: `app/api/admin/clasificados/listings/[id]/route.ts:15`, `:129`, `:198`. Workspace page `app/admin/(dashboard)/workspace/clasificados/bienes-raices/page.tsx`. |

### Counts

| Verdict | Count | Items |
|---|---|---|
| **TRUE** | **13** | 1, 2, 3, 4, 8, 9, 10, 11, 12, 13, 15, 17, 18 |
| **PARTIAL** | **4** | 5 (enforcement TRUE, count semantics defective) · 7 (delivers 3 of 4) · 14 (identity TRUE, `listing_view` missing) · 16 (read/edit TRUE, write-time creation FALSE) |
| **FALSE** | **1** | 6 (included inventory = 0) |

Strict tally over the 18 rows: **TRUE 13 · PARTIAL 4 · FALSE 1**.

---

## 3. FINDINGS

### F-01 — **P0** · BR Negocio base plan delivers **0 of 1** included properties; pack delivers **3 of 4**

The commercial *parent* row is counted as an inventory capacity slot at all three layers.

- DB (authoritative): `supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql:276`
  `v_count := v_count + case when coalesce(v_parent_active, false) and v_parent.id <> p_listing_id then 1 else 0 end;`
  against `v_limit := case when v_pack_active then 4 else 1 end` (`:262`) and the block at `:278-280`.
- Server TS preflight: `app/lib/listingPlans/commercialWriteGuard.ts:178-194` — `countActiveBrInventory` explicitly adds `parentActive` at `:192-193` ("Parent counts toward the property limit", `:180`).
- Client-side tally: `app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts:123-129` — `isActiveBrNegocioInventoryRow` accepts **any** BR-negocio row, never filtering `inventory_role === "inventory_property"`; consumed by `countActiveBrInventoryListings:130-142` and `computeBrPropertyInventoryCounts:151+`, which drives the "can add property" UI at `AgenteIndividualResidencialPreviewClient.tsx:358-374`.

**Net effect at origin/main:** an agent on the base BR Negocio plan can activate **zero** inventory children; a $99/mo pack buyer gets **3**, not the 4 the pricing matrix advertises (`app/lib/listingPlans/revenuePricingMatrix.ts:145` — "+3 properties" is the add-on, on top of a base of 1 that the parent eats).

**REFERENCE-IMPLEMENTATION RULE**
- PROVEN REFERENCE EXISTS: **YES**
- REFERENCE CATEGORY: **Autos (dealer inventory) @Sept** — and the BR half of the same commit
- REFERENCE PATH: `10618f41` "fix(capacity): exclude commercial parents from inventory limits" (@Sept `e3956df8`, **NOT** in origin/main) — Gate 6C.2: `app/lib/listingPlans/commercialWriteGuard.ts` (`if (row.inventory_role !== "inventory_vehicle") return false;`), plus `supabase/migrations/…_fix_parent_inventory_capacity_counting.sql` (`CREATE OR REPLACE` on both RPCs, +289 lines), `app/lib/clasificados/autos/autosDealerInventoryPolicy.ts`, verifier `scripts/verify-gate6c2-parent-excluded-capacity-counting.ts`
- TARGET PATH: `supabase/migrations/20260810120000_…:276` · `app/lib/listingPlans/commercialWriteGuard.ts:178-194` · `app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts:123-129`
- DIFFERENCE: origin/main counts `inventory_role='main'`; Sept restricts the count to `inventory_role='inventory_property'` only
- **ACTION: ADOPT EXISTING** (cherry-pick/merge `10618f41`). Its own commit message states the measured delta: *"0/3 real properties instead of the locked 1/4 properties"*.

---

### F-02 — **P1** · Two public BR fetchers bypass the G.2.3.4 parent gate

`filterBrRowsByActiveParent` is adopted by exactly three BR consumers (browse fetch, detail page, saved search). Two other **public-facing** BR row fetchers apply only the row-level `isListingRowActiveAndPublishedForBrowse` rule and never the parent gate:

- `app/(site)/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser.ts:60` — related-inventory rail; selects `inventory_role` and `br_inventory_parent_listing_id` at `:16` but only uses them for grouping at `:71-73`.
- `app/(site)/clasificados/bienes-raices/lib/fetchBrSimilarOtherClientListingsBrowser.ts:99` — cross-owner "similar properties" rail; same shape at `:18`, `:84-88`.

Residual exposure is narrowed by the pause cascade (F-01's sibling gate G.2.3.2) and by the FK's `on delete set null` (migration `:31-36`, which makes a parent-deleted child fail the gate anywhere the gate *is* applied). It is **not** closed for: a parent whose `inventory_role`/`seller_type`/`owner_id` is mutated, a client-crafted child row (see F-03), or any future fetcher.

**REFERENCE-IMPLEMENTATION RULE**
- PROVEN REFERENCE EXISTS: **YES**
- REFERENCE CATEGORY: **Bienes Raíces (same category, adjacent file)**
- REFERENCE PATH: `app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts:86-99` (batched parent fetch + `filterBrRowsByActiveParent`, explicitly no-N+1)
- TARGET PATH: `fetchBrRelatedInventoryListingsBrowser.ts:60` · `fetchBrSimilarOtherClientListingsBrowser.ts:99`
- DIFFERENCE: target files stop at the row-level eligibility filter and never collect/resolve parents
- **ACTION: ADOPT EXISTING** — the helper trio (`collectBrChildParentIds` / batched `.in("id", parentIds)` / `filterBrRowsByActiveParent`) is a ~12-line lift-and-shift.

---

### F-03 — **P1** · RLS does not enforce parent ownership, role, or the child gate

`supabase/migrations/20260421130001_listings_enable_rls_full_policies.sql`:
- anon SELECT `:13-38` — BR branch `:29-33` is `is_published = true and status in ('active','sold')`; **no parent-gate predicate**;
- authenticated SELECT `:40-71` — same;
- INSERT `:74-78` — `with check (owner_id = auth.uid())` only. Nothing constrains `br_inventory_parent_listing_id`, `inventory_role`, `status`, or `is_published`;
- UPDATE `:80-85` — `owner_id = auth.uid()` on both sides.

Consequently an authenticated client holding the anon key can insert a row with `inventory_role='inventory_property'`, `status='active'`, `is_published=true`, and an arbitrary parent uuid. The **only** thing preventing publicity is the app-layer gate — which F-02 shows is not universally applied. The publish path itself is well-behaved (`AgenteIndividualResidencialPreviewClient.tsx:377-386` always inserts pending and delegates activation to the `SECURITY DEFINER` RPC), but the path is not the boundary; RLS is.

**REFERENCE-IMPLEMENTATION RULE**
- PROVEN REFERENCE EXISTS: **PARTIAL** — the *pure* rule is already written and tested (`brPublicChildParentVisibility.ts:51-74`) but has no SQL twin. The closest structural precedent is the `SECURITY DEFINER` capacity RPC (`migration 20260810120000…:171-296`), which does perform the parent identity/ownership checks in SQL (`:193`, `:218-226`).
- REFERENCE CATEGORY: Bienes Raíces (SQL layer, same migration family)
- REFERENCE PATH: `supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql:187-226`
- TARGET PATH: `supabase/migrations/20260421130001_listings_enable_rls_full_policies.sql:13-38` (SELECT predicate) and `:74-78` (INSERT check)
- DIFFERENCE: no SQL-level expression of the parent gate exists on the `listings` policies
- **ACTION: NET NEW** — an additive migration adding (a) a child-gate `exists(...)` predicate to both BR SELECT branches, and (b) an INSERT/UPDATE `with check` that either forbids client-set `inventory_role='inventory_property'` outright or requires the referenced parent to be a same-owner `main` BR business row.

---

### F-04 — **P2** · No child identity-integrity guard at origin/main

Sept commit `651abd4e` "protect child listing identity integrity" (@Sept `e3956df8`, **NOT** in `origin/main`) introduced `app/lib/clasificados/bienes-raices/brChildIdentityGuard.ts` (+73) and `app/lib/clasificados/autos/autosChildIdentityGuard.ts` (+69), wired into `app/api/clasificados/bienes-raices/listing-edit/route.ts` (+28) and the Autos route (+14), with verifier `scripts/verify-build2-parent-child-identity-guards.ts` (+188).

Verified absent at origin/main: `git ls-tree -r --name-only origin/main | grep -i childIdentity` → **no matches**.

**REFERENCE-IMPLEMENTATION RULE**
- PROVEN REFERENCE EXISTS: **YES** — REFERENCE CATEGORY: **Sept sealed branch (BR + Autos)** — REFERENCE PATH: `651abd4e` → `app/lib/clasificados/bienes-raices/brChildIdentityGuard.ts`
- TARGET PATH: `app/api/clasificados/bienes-raices/listing-edit/route.ts` (currently relies on `:220-225` scoping alone)
- DIFFERENCE: origin/main has scoped-update protection but no dedicated, testable identity-integrity assertion
- **ACTION: ADOPT EXISTING**

---

### F-05 — **P2** · Inherited-parent-hub freeze in the child editor (third branch)

`app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx:160` refreshes `parentHubRef.current` only inside the heavy bootstrap effect, whose dep array at `:204-206` deliberately omits `parentHubSnapshot`. A child editor opened before the parent's async hydration settles never recovers the inherited professional/contact block. Fixed on the third branch by `5d3f27cf` (`:209-231`, a narrow effect keyed on `parentHubIdentityKey`). **Public-page inheritance is unaffected** — `BienesRaicesNegocioLiveDetailShell.tsx:412-442` fetches the parent independently.

- PROVEN REFERENCE EXISTS: **YES** — REFERENCE CATEGORY: third branch `fix/br-negocio-inventory-hub-media-hydration-2026-08-27`
- REFERENCE PATH: `5d3f27cf` → `BrNegocioChildInventoryFullApplication.tsx:209-231`
- TARGET PATH: same file `:204-208` @origin/main · DIFFERENCE: missing sync effect
- **ACTION: ADOPT EXISTING (merge the third branch)**

---

### F-06 — **P2** · Child application has no unsaved-changes leave guard

`BrNegocioChildInventoryFullApplication.tsx:304-315` registers a `beforeunload` handler that **only flushes the draft** — it never calls `preventDefault()` and never sets `returnValue`, so no browser confirmation appears. The shared guard `app/lib/businessApplications/useBusinessApplicationLeaveGuard.ts:35` (which does `e.preventDefault(); e.returnValue = ""` at `:53-54`) is not imported. Notably, third-branch commit `629c5a46` fixed the four *top-level* lanes but **did not touch this file** — the child editor is a net-new gap even relative to that branch.

- PROVEN REFERENCE EXISTS: **YES** — REFERENCE CATEGORY: Servicios / Restaurantes
- REFERENCE PATH: `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx:17` + `:615`
- TARGET PATH: `BrNegocioChildInventoryFullApplication.tsx:304-315`
- **ACTION: NET NEW** (no existing commit covers it)

---

### F-07 — **P0** · No `listing_view` / `listing_open` analytics on ANY Bienes Raíces public detail (parent, child, or privado)

`trackBrListingViewGlobal` / `trackBrListingOpenGlobal` (`app/lib/clasificados/bienes-raices/brGlobalAnalytics.ts:110`, `:114`) have exactly **one** emitter: `app/(site)/clasificados/bienes-raices/listing/BrLiveDetailAnalyticsMount.tsx:13-14`.

That component is mounted from exactly **one** place: `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx:774` (`{premiumBr ? <BrLiveDetailAnalyticsMount … /> : null}`).

That mount point is **unreachable for a `category='bienes-raices'` row**: `app/(site)/clasificados/anuncio/[id]/page.tsx:1431` (`if (listing.category === "bienes-raices")`) **returns** at `:1462-1476` — before `if (useEnVentaPublishedDetail)` at `:1479`. Neither `BienesRaicesPrivadoLiveDetailShell.tsx` nor `BienesRaicesNegocioLiveDetailShell.tsx` mounts it (each imports only `trackListingSaveToggleAuthed`, `:7`). `BrEngagementRow.tsx` (the other `bienesRaicesGlobalAnalytics` consumer) is likewise mounted only from `EnVentaAnuncioLayout.tsx:960` and `bienes-raices/shell/BienesRaicesPreviewCard.tsx:245`, never from the live shells.

**Net effect:** the BR dashboard's view/impression metrics are structurally zero for every real Bienes Raíces listing. Contact/CTA and save-toggle events *do* fire (`BrAgenteResContactSidebar.tsx:44`, shells `:7`), so the funnel shows conversions with no denominator.

> **Note — brief correction.** The mission brief cites "BR dispatch `:1473`, EnVenta `:1495`". At `origin/main` the true lines are **BR dispatch `:1431`, BR return `:1462-1476` (shell selection `:1470-1474`), EnVenta `:1479`** — and the EnVenta branch is *not* a BR code path.

- PROVEN REFERENCE EXISTS: **YES** — REFERENCE CATEGORY: En Venta (the correct mount pattern, same component)
- REFERENCE PATH: `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx:51` (import) + `:774` (mount)
- TARGET PATH: `app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx` (covers NEG + CHILD) and `.../BienesRaicesPrivadoLiveDetailShell.tsx`
- DIFFERENCE: the BR live shells never mount `BrLiveDetailAnalyticsMount`; the ready-built `analyticsContext` at `BienesRaicesNegocioLiveDetailShell.tsx:465-466` is already the exact prop shape it needs
- **ACTION: FIX REGRESSION** — a one-line mount in each shell; no new module.

---

## 4. EVIDENCE GAPS

1. **No runtime execution.** All verdicts are static-source verdicts at `origin/main`. The routes are auth-gated and no live session was available; the capacity arithmetic in F-01 is derived from the SQL/TS source and the Sept commit's own measured statement, not from an observed run.
2. **Migration-vs-deployed-DB drift not checked.** This audit reads `supabase/migrations/*`; whether the production database actually has `br_negocio_activate_listing` at the `:276` revision was not confirmed (would require `list_migrations` against the live project).
3. **`br_inventory_group_id` mutation paths not exhaustively traced.** F-03's exposure assumes an attacker can set the column; the *legitimate* paths that rewrite an existing row's group id (e.g. re-parenting) were not enumerated.
4. **Verifier scripts were inventoried, not executed.** Presence of `scripts/gate-g2-3-4-…-selftest.ts` is cited as coverage evidence only.
5. **`BR_INVENTORY_PACK_MAX_CHILDREN`'s own definition** was inferred from `BR_TOTAL_ACTIVE_PROPERTY_LIMIT = BASE + MAX_CHILDREN = 4` and the DB's literal `4`; the constant's own line in `publishCheckoutCheckpoint.ts` was not separately quoted.
