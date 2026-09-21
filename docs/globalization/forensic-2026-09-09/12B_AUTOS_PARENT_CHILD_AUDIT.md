# 12B — G40 AUTOS PARENT / CHILD AUDIT (DEALER INVENTORY)

**Audit date:** 2026-09-09 · **Mode:** read-only forensic · **Scope:** Autos Dealer (`negocios`) parent ↔ inventory-child lifecycle, G40 matrix.

## Refs used (verified, re-checked immediately before writing)

| Label | SHA | How verified |
|---|---|---|
| **TRUE current / production** | `origin/main` = `a0a4783971b42ea1d71ab2602d4720d0d590baf8` | `git rev-parse origin/main` → re-run at write time, unchanged. Tip: *"feat(classifieds): install final owner-approved landing imagery"*, Wed Sep 9 12:15:08 2026 −0700 |
| Sealed September branch | `e3956df893f5041ca22371c999038f297d536eae` | `git rev-parse e3956df8` |
| Local primary worktree (**STALE**, 112 behind) | `d09d979c` | `git rev-parse HEAD` — **not read for any claim below** |

Every code claim is read via `git show origin/main:<path>` / `git grep -n … origin/main`. `/c/projects/elaguila-website-final-audit-fixes` was not read. Sept-only code is labelled `@e3956df8`.

**Prior work cited, not re-derived:**
- `06_DATA_ROUND_TRIP_FIELD_AUDIT.md` §2.7 (dealer parent = **SAFE**), §2.8 (dealer inventory child = **DESTRUCTIVE**, `{...parent, ...childSlice}`), §5 (`autosClassifiedsListingService.ts:266-276`, child loop `:355-361` — same-row UPDATE, identity columns never touched).
- `11_REVENUE_STRIPE_PROMO_ENTITLEMENT_AUDIT.md` (checkout/promo/entitlement; `activePaidEditCheckoutOwnership.ts` absent from `origin/main`).
- `10_ANALYTICS_EVENT_COVERAGE.md` (autos emitters).
- `13_BUSINESS_HUB_CONNECTION_TRUST_ADDRESS_AUDIT.md` Part A (dealer renders `PreviewDealerBusinessStack.tsx`).

---

# STEP 0 — HEADLINE ANSWER TO THE KEY QUESTION

> **Does Autos have an equivalent parent-visibility gate to Bienes Raíces, or can an orphaned/inactive dealer's child vehicles stay publicly visible?**

## **YES — Autos HAS the gate on `origin/main`. TRUE.**

`app/lib/clasificados/autos/autosPublicChildParentVisibility.ts` (74 lines) exists on `origin/main` and is an explicit, self-documented port of the BR reference. Its own header, verbatim at `:5-9`:

```
 * Mirrors Bienes Raíces Negocio's proven `isBrChildParentGateSatisfied`
 * (app/(site)/clasificados/lib/brPublicChildParentVisibility.ts), which closed the identical
 * class of bug for BR — I.13B's own research confirmed Autos never had an equivalent gate: a
 * suspended/removed dealer's `inventory_vehicle` children stayed publicly listed and directly
 * reachable at their own detail URL.
```

**Gate predicate** (`autosPublicChildParentVisibility.ts:40-62`):

```
if (child.inventory_role !== "inventory_vehicle") return true;      // :44  non-children pass
const parentId = child.dealer_inventory_parent_listing_id …;         // :46
if (!parentId) return false;                                          // :47  orphan → hidden
const parent = parentsById.get(parentId); if (!parent) return false;  // :49-50
return parent.lane === "negocios"                                     // :56
    && parent.inventory_role === "main"                               // :57
    && Boolean(parentOwnerId) && childOwnerId === parentOwnerId       // :58-59  same owner
    && parent.status === "active";                                    // :60 via isAutosRowActive :30-32
```

**Structural equivalence to the BR reference** (`app/(site)/clasificados/lib/brPublicChildParentVisibility.ts:51-74`):

| BR predicate | Autos predicate | Match |
|---|---|---|
| `category === "bienes-raices"` | `lane === "negocios"` | ✅ lane/category anchor |
| `seller_type === "business"` | (folded into `lane === "negocios"`, which *is* the business lane) | ✅ equivalent |
| `inventory_role === "main"` | `inventory_role === "main"` | ✅ identical |
| same `owner_id` | same `owner_user_id` | ✅ identical |
| parent active / published | `parent.status === "active"` | ✅ identical |

**Three enforcement call sites on `origin/main`** — all in `app/lib/clasificados/autos/autosClassifiedsListingService.ts` (import at `:31`):

| # | Surface | path:line | Mechanism |
|---|---|---|---|
| 1 | **Public results / landing pool** | `autosClassifiedsListingService.ts:204-205` inside `listActiveAutosClassifiedsRows()` (`:467`) | `parentsById` built from the same `status='active'` fetch → a suspended/removed parent is absent from the map → every child of it is dropped. Consumed by `app/api/clasificados/autos/public/listings/route.ts:25`. |
| 2 | **Dealer inventory group page** | `autosClassifiedsListingService.ts:493-494` inside `listActiveDealerInventoryByGroupId()` (`:182`) | Same shape, scoped to `dealer_inventory_group_id`. Consumed by `app/api/clasificados/autos/public/dealer/[dealerInventoryGroupId]/route.ts:25` → `app/(site)/clasificados/autos/dealer/[dealerInventoryGroupId]/page.tsx:16`. |
| 3 | **Direct child detail URL** | `autosClassifiedsListingService.ts:786-791` inside `getActiveLiveAutosBundle()` (`:769`) | Explicit single-parent fetch + `isAutosChildParentGateSatisfied(row, parentsById)` → `return null`. Consumed by `app/(site)/clasificados/autos/vehiculo/[id]/page.tsx:17` (metadata → `robots:{index:false}`) and `:48` (page body → not-found), and by `app/api/clasificados/autos/public/listings/[id]/route.ts:19-22` (→ HTTP 404). |

This is a **wider** enforcement surface than BR, which gates at two points (`fetchBrPublishedListingsBrowser.ts:86-99` and `anuncio/[id]/page.tsx:621-647`). Autos additionally gates the group page, and the detail gate is server-side (BR's list gate is a browser-side fetch).

**Fourth consumer — Saved Search** reuses the same predicate rather than cloning it: `app/lib/saved-search/autos/autosPublicEligibleListing.ts:28` imports it, with the header at `:14` naming `autosPublicChildParentVisibility.ts:40-62` as *"reused verbatim."* Same discipline on the BR side (`bienesRaicesPublicEligibleListing.ts:24`).

**Self-test present on `origin/main`:** `scripts/gate-i13b-public-visibility-filter-selftest.ts:25`. Also asserted as a required file by `scripts/gate-i7a-specialized-lifecycle-reconciliation-selftest.ts:384`, and by `scripts/verify-saved-search-autos-02.ts:388` (asserts the eligibility module imports it).

### The one real hole: the gate is **application-layer only**

`supabase/migrations/20260409120000_autos_classifieds_listings.sql:39-42`:

```sql
create policy "autos_classifieds_listings_select_active"
  on public.autos_classifieds_listings
  for select
  using (status = 'active');
```

There is **no RLS-level parent predicate**. A direct PostgREST read with the publishable anon key returns every `status='active'` row, **orphaned inventory children included**. Severity is contained because Autos public reads never use the anon client — `app/(site)/clasificados/autos/components/public/useAutosPublicListingsFetch.ts:21` fetches the server route `/api/clasificados/autos/public/listings`, which uses the admin client through the gated service. A repo-wide `git grep -n "autos_classifieds_listings" origin/main -- "app/(site)"` shows **no browser-side Supabase query** against the table. Classified **P2 defense-in-depth**, not P0. (Note: BR is structurally more exposed here since its list gate lives in a *browser* fetch module — out of scope for this file.)

---

# STEP 1 — THE G40 MATRIX

Every row proven with `path:line` at `origin/main`.

| # | G40 capability | Verdict | Proof (`origin/main` unless labelled) |
|---|---|---|---|
| 1 | **parent UUID** | **TRUE** | `autos_classifieds_listings.id uuid primary key default gen_random_uuid()` — `supabase/migrations/20260409120000_autos_classifieds_listings.sql:5`; read at `autosClassifiedsListingService.ts:38`. Public permalink is the UUID (no slug column) — `app/(site)/clasificados/autos/contracts/autosCanonicalIdentity.ts:6`. |
| 2 | **inventory group** | **TRUE** | Column `dealer_inventory_group_id uuid` — `supabase/migrations/20260518124700_autos_dealer_inventory_grouping.sql:5`; index `:39-40`; row mapper `autosClassifiedsListingService.ts:41-44`; grouping key resolver `autosDealerInventoryPolicy.ts:41-46`. |
| 3 | **inventory role** | **TRUE** | Column `inventory_role text` with CHECK `in ('main','inventory_vehicle')` — migration `:7`, `:17-19`; index `:45-46`; strict mapper `autosClassifiedsListingService.ts:49-52` (anything else → `null`); helpers `autosDealerInventoryPolicy.ts:29-39`. |
| 4 | **child UUID** | **TRUE** | Children are real rows, not embedded JSON: `createAutosClassifiedsListing` INSERT at `autosClassifiedsListingService.ts:142-147` returns `.select().single()`; migration header `20260518124700_…:2` — *"every vehicle remains a real row."* FK `dealer_inventory_parent_listing_id → autos_classifieds_listings(id) on delete set null` (migration `:31-35`). |
| 5 | **capacity** | **TRUE (present)** — but **DEFECTIVE**, see §2.1 | `STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT = 10` (`autosDealerInventoryPolicy.ts:6`); atomic authority is the RPC `autos_dealer_activate_listing` (`app/lib/listingPlans/capacityActivationRpc.ts:66-75`, migration `supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql`). TS counters `autosDealerInventoryPolicy.ts:48-65`. |
| 6 | **included inventory** | **TRUE** | Base plan `autos_dealer_monthly` = 10 vehicles included (`app/lib/listingPlans/publishCheckoutCheckpoint.ts:57`; pricing `app/lib/listingPlans/revenuePricingMatrix.ts:105`). |
| 7 | **add-on capacity** | **TRUE** | `AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT` (`publishCheckoutCheckpoint.ts:79`) → `BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT` (`autosDealerInventoryPolicy.ts:8`); selected via `resolveDealerActiveVehicleLimit()` (`:86-89`) and `app/api/clasificados/autos/listings/route.ts:76-85`. |
| 8 | **checkout identity** | **TRUE** | Base: `app/api/clasificados/autos/checkout/route.ts:169-173` requires a real `listingId`, `assertAutosListingOwner`; `client_reference_id: listingId` `:361`; `setAutosListingPendingPayment(listingId, session.id)` `:366`. Add-on: `app/api/clasificados/autos/inventory-pack/checkout/route.ts:79-89`. **No identity fork** — contrast Empleos (`06_…md` §2.9). |
| 9 | **entitlement** | **TRUE** | `listingHasActiveDealerInventoryPack()` — `app/lib/clasificados/autos/autosDealerInventoryPackEntitlement.ts:6-25`, reads `listing_package_entitlements` scoped to `listing_id` + `AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY`, with expiry via `isListingPackageEntitlementRowActive`. Consumed at `checkout/route.ts:187` and `listings/route.ts:56-73`. |
| 10 | **child creation** | **TRUE** | `createAutosClassifiedsListingWithInventoryParent()` — `autosClassifiedsListingService.ts:161-181`. Forces `inventoryRole:"inventory_vehicle"` `:172`, `dealerInventoryParentListingId: parent.id` `:171`, shared `groupId` `:170`, then promotes the parent to `main` `:175`. |
| 11 | **child edit** | **TRUE (reachable) / DESTRUCTIVE (already proven)** | Entry `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx:578` → `autosDealerInventoryEditHref(...) + "&editVehicleId=<childId>"` (builder `app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts:97-100`); consumed `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx:129-140` (opens the drawer on that child). Data verdict cited from `06_…md` §2.8 — **not re-derived**. |
| 12 | **child preview** | **TRUE** | `app/(site)/publicar/autos/negocios/components/AutosNegociosChildInventoryPreviewOverlay.tsx:38` → `mapInheritedDealerPreviewListing(parentListing, child)` and `:39-45` builds sibling related-cards; renders the real `AutoDealerPreviewPage` (`:6`). |
| 13 | **child public page** | **TRUE** | Same canonical detail route as any vehicle: `app/(site)/clasificados/autos/vehiculo/[id]/page.tsx:74` → `AutosLiveVehicleClient`. Gated by row 18 below. |
| 14 | **child analytics** | **TRUE** | Child rows carry their own `autos_classifieds_listings.id`, used as the analytics source id: `app/(site)/clasificados/autos/lib/recordAutosGlobalAnalytics.ts:10` (`AUTOS_ANALYTICS_SOURCE_TABLE`), `:14`; profile-view emitter mounted per-listing at `AutosLiveVehicleClient.tsx:17`. Per-listing summary `app/api/clasificados/autos/listing/[id]/analytics-summary/route.ts`. Emitter coverage cited from `10_ANALYTICS_EVENT_COVERAGE.md`. |
| 15 | **parent-inactive cascade** | **TRUE (by visibility gate, not by status write)** | No status cascade exists — `markAutosClassifiedsListingRemovedIfOwner` (`autosClassifiedsListingService.ts:446-450`) flips only the one row. The cascade is *derived*: the I.13B gate hides every child of a non-`active` parent at all three public surfaces (§0). Documented deliberately at `autosClassifiedsListingService.ts:464-466`: *"a restored child stays publicly hidden while its parent is non-live (the I.13B parent-liveness gate is downstream of status)."* Same architecture as the BR reference. |
| 16 | **wrong-owner prevention** | **TRUE — strongest surface in the file** | Five independent layers: (a) child create requires `parent.owner_user_id === input.ownerUserId` (`:167`); (b) `assertAutosListingOwner` on every edit (`:216-220`, called `:246`); (c) the UPDATE itself is owner-scoped, not just the read — `.eq("id", listingId).eq("owner_user_id", ownerUserId)` (`:279-281`, comment *"Defense in depth"* `:280`); (d) the child-sync loop only touches ids in `ownedChildIds`, which is built from an `owner_user_id`-scoped query and explicitly excludes the parent's own id (`:334-347`, self-parenting excluded `:339`); (e) the gate itself requires `childOwnerId === parentOwnerId` (`autosPublicChildParentVisibility.ts:58-59`). Anti-enumeration preserved: "not found" and "forbidden" return the same code (`:248-251`). |
| 17 | **dashboard inventory tools** | **TRUE** | `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx` (list + per-child actions, edit href `:578`); value drawer `AutosNegociosInventoryValueDrawer.tsx` / `…Trigger.tsx`; href builders `app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts:92-120` (`autosDealerListingEditHref`, `autosDealerInventoryEditHref`, `autosDealerInventoryAddonHref`, `autosDealerListingPreviewHref`, `autosDealerBackToEditHrefFromPreview`). Capability truth row: `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts:111`. |
| 18 | **admin** | **TRUE** | `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx` — `listAllAutosClassifiedsRowsForAdmin` (`:16`, service `autosClassifiedsListingService.ts:498`), visibility buckets `autosClassifiedsVisibility.ts` (`:22-24`), republish capability `classifiedsRepublishCapability` (`:13`), row actions `ClassifiedAdminRowActions`, monetization summary `AdminListingMonetizationSummary`. Parent/child role is surfaced through `autosClassifiedsRowToDashboardRow` (`:418`), which carries `dealer_inventory_group_id` / `dealer_inventory_parent_listing_id` / `inventory_role` (`:474-476`). |

### G40 tally

**18 / 18 TRUE.** Two carry defects that do not negate the capability:
- **#5 capacity** — present and atomic, but mis-counts (§2.1).
- **#11 child edit** — reachable, but destructive on save (`06_…md` §2.8).

**Zero FALSE rows ⇒ no Reference-Implementation lines are required for the G40 matrix itself.** The Reference-Implementation rule is applied instead to the §2 regressions below.

---

# STEP 2 — HISTORICAL PROTECTIONS: DOES `origin/main` STILL USE THEM?

Search executed: `git log --all --oneline --since=2026-07-14 -i --grep="parent\|child\|inventory\|capacity\|dealer"`. Containment proven per commit with `git merge-base --is-ancestor <sha> origin/main; echo $?` — **a commit existing is not proof.**

| SHA | Date | Title | In `origin/main`? | In `e3956df8`? |
|---|---|---|---|---|
| `b32ff613` | 2026-09-01 | feat: complete Autos globalization adoption | **NO** | YES |
| `651abd4e` | 2026-09-02 | fix(globalization): protect child listing identity integrity | **NO** | YES |
| `10618f41` | 2026-09-03 | fix(capacity): exclude commercial parents from inventory limits | **NO** | YES |
| `b3473f89` | 2026-09-03 | fix(globalization): reconcile autos staging schema and ad identity | **NO** | YES |
| `db688c04` | 2026-09-08 | feat(globalization): business reputation adoption — Autos Dealer + Rentas Negocio | **NO** | YES |

**All five September Autos commits are absent from production.** Below, each is assessed for *containment* (does main have equivalent functionality elsewhere?) and *impact*.

---

## 2.1 `10618f41` — parent row eats a purchased inventory slot · **P1, LIVE**

`git show --stat 10618f41`:

```
 .../AutosDealerInventoryDashboardSection.tsx              |   8 +-
 .../autos/autosClassifiedsListingService.ts               |   8 +-
 .../autos/autosDealerInventoryPolicy.ts                   |  46 +-
 app/lib/listingPlans/commercialWriteGuard.ts              |  26 +-
 scripts/verify-c7-capacity-rpc-sql-contract.mjs           |  35 +-
 ...verify-gate6c2-parent-excluded-capacity-counting.ts    | 197 +
 ...0000_fix_parent_inventory_capacity_counting.sql        | 289 +
```

Its own message states the defect: *"Autos dealer and Bienes Negocio agent parent rows were silently consuming one of their own purchased inventory slots (capacity RPCs, the Autos preflight counter, and the dashboard tally all counted them), delivering 9/19 real vehicles and 0/3 real properties instead of the locked 10/20 vehicles and 1/4 properties."*

**Containment check — does `origin/main` have equivalent functionality? NO.**

1. The migration is **not present**: `git ls-tree -r --name-only origin/main -- supabase/migrations | grep -i capacity` returns only `20260810120000_autos_br_negocio_capacity_activation_rpc.sql` — the *original* RPC, never the `CREATE OR REPLACE` correction.
2. The TS counter on `origin/main` still counts every active `negocios` row, parent included — `autosDealerInventoryPolicy.ts:48-51`:
   ```
   export function countActiveDealerVehicles(rows, excludeListingId?) {
     return rows.filter((row) => row.lane === "negocios" && row.status === "active" && …).length;
   }
   ```
   No `inventory_role !== "main"` predicate anywhere in the file (95 lines total; `git show origin/main:…/autosDealerInventoryPolicy.ts | wc -l` = 95, versus the corrected version's 141).
3. The dashboard/API tally uses the un-scoped, un-excluded counter: `app/api/clasificados/autos/listings/route.ts:105` — `summarizeDealerInventory(countActiveDealerVehicles(rows), limit)` — **no `groupScopeParent`, no parent exclusion**.

**Impact on production:** a dealer paying $399/mo for "10 vehicles" can activate only **9** children (the `main` parent row consumes slot 1). With the $129/mo Inventory Boost they get **19**, not 20. The dashboard remaining-slots figure is wrong by exactly 1 in every dealer account.

**Reference-Implementation line**

| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **YES** |
| REFERENCE CATEGORY | Autos + Bienes Raíces Negocio (the same commit fixes both) |
| REFERENCE PATH | `10618f41` @`e3956df8` — `supabase/migrations/20260903…_fix_parent_inventory_capacity_counting.sql` (`CREATE OR REPLACE` on the existing RPCs) + `app/lib/clasificados/autos/autosDealerInventoryPolicy.ts` + `app/lib/listingPlans/commercialWriteGuard.ts` + verifier `scripts/verify-gate6c2-parent-excluded-capacity-counting.ts` |
| TARGET PATH | `app/lib/clasificados/autos/autosDealerInventoryPolicy.ts:48-51`, `app/lib/listingPlans/commercialWriteGuard.ts:266`, `app/api/clasificados/autos/listings/route.ts:105`, plus the missing migration |
| DIFFERENCE | Production counts `inventory_role === "main"` parent rows toward the paid vehicle limit, at all three layers (RPC, preflight counter, dashboard tally); the corrected version excludes them and fixes the grouping-key mismatch between the preflight counter and the parent it is scoped to |
| **ACTION** | **FIX REGRESSION** (cherry-pick `10618f41`; additive `CREATE OR REPLACE` migration, no destructive schema change) |

---

## 2.2 `651abd4e` — child identity-substitution guard · **P1, LIVE**

`git show --stat 651abd4e`:

```
 app/api/clasificados/autos/listings/[id]/route.ts              |  14 +
 app/api/clasificados/bienes-raices/listing-edit/route.ts       |  28 +-
 app/lib/clasificados/autos/autosChildIdentityGuard.ts          |  69 +   (NEW)
 app/lib/clasificados/autos/autosClassifiedsListingService.ts   |  20 +
 app/lib/clasificados/bienes-raices/brChildIdentityGuard.ts     |  73 +   (NEW)
 scripts/verify-build2-parent-child-identity-guards.ts          | 188 +   (NEW)
```

**Containment check — NO equivalent on `origin/main`, for either category:**

```
git cat-file -e origin/main:app/lib/clasificados/autos/autosChildIdentityGuard.ts  → does not exist
git cat-file -e origin/main:app/lib/clasificados/bienes-raices/brChildIdentityGuard.ts → does not exist
```

The guard's own contract (Sept version, `autosChildIdentityGuard.ts:32-51`): a change is a *substitution* only when both sides carry a VIN and the VINs differ, **or** (VIN missing on either side) when year **and** make **and** model all change together. Ordinary corrections — price, mileage, description, photos, financing, a single typo, adding a previously-missing VIN — are explicitly allowed.

**Impact on production:** `updateAutosClassifiedsListingDraft` (`origin/main:autosClassifiedsListingService.ts:236-306`) accepts **any** `listing_payload`. Because the write path is deliberately identity-preserving (`:262-266` — *"Never touches `status`, Stripe fields, entitlement state, `dealer_inventory_group_id`, `dealer_inventory_parent_listing_id`, `inventory_role`, or `lane`"*), an owner can retype a **completely different vehicle** into an existing row and it silently inherits that row's UUID, `leonix_ad_id`, published_at, likes, and full analytics history. On a dealer child this launders a 2024 F-150 into the view/CTA history of a 2020 Civic. `origin/main` returns 409 on other errorCodes at `app/api/clasificados/autos/listings/[id]/route.ts:126-135` but has no `AUTOS_LISTING_IDENTITY_SUBSTITUTION_BLOCKED` branch.

**Reference-Implementation line**

| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **YES — but only on the sealed branch, not on `origin/main`** |
| REFERENCE CATEGORY | Autos + Bienes Raíces (paired implementation, one commit) |
| REFERENCE PATH | `651abd4e` @`e3956df8` — `app/lib/clasificados/autos/autosChildIdentityGuard.ts:40-62`, wired at `autosClassifiedsListingService.ts:264-282`, surfaced at `app/api/clasificados/autos/listings/[id]/route.ts:135-148`; verifier `scripts/verify-build2-parent-child-identity-guards.ts` |
| TARGET PATH | `app/lib/clasificados/autos/autosClassifiedsListingService.ts:236-306` (guard insertion point is immediately after `sanitizeAutosListingPayloadForPersistence`, `:261`) and `app/api/clasificados/autos/listings/[id]/route.ts:126` |
| DIFFERENCE | Production has no identity check at all — a wholesale vehicle swap on an existing row is accepted and inherits that row's identity and history |
| **ACTION** | **FIX REGRESSION** (cherry-pick `651abd4e`; pure-function guard, runs before any write, leaves the row untouched on rejection) |

---

## 2.3 `b32ff613` — "complete Autos globalization adoption" · **P2**

14 files, +126/−48. Touches the analytics identity plumbing (`autosListingAnalyticsClient.ts` −43/+? net simplification, `AutosVehicleProfileViewAnalytics.tsx`, `autosClassifiedsAnalyticsService.ts` +16, `app/api/clasificados/autos/public/analytics/event/route.ts` +4, `app/api/clasificados/autos/public/listings/[id]/route.ts` +4), the engagement strips on all three preview surfaces (`AutosNegociosPreviewEngagementStrip.tsx`, `AutosNegociosDealershipPreviewPage.tsx`, `AutoPrivadoPreviewPage.tsx`, `AutosEngagementRow.tsx`, +5/+6 each), both application clients (+20 each), and `autosDealerCustomLinks.ts`.

**Containment:** partial. `origin/main` already carries the *modules* (`AutosEngagementRow.tsx`, `autosListingAnalyticsClient.ts`, `recordAutosGlobalAnalytics.ts`, the public analytics event route) — the commit is a **wiring/normalisation** pass, not new capability. Nothing in the G40 matrix flips FALSE because of its absence. Classified **P2 polish/consistency**, merge-when-convenient.

## 2.4 `b3473f89` — Leonix Ad ID reconciliation · **P2**

Two files only, both additive and neither present on `origin/main`:

```
 scripts/verify-autos-leonix-ad-id-reconciliation.mjs                 | 80 +
 supabase/migrations/20260903090000_autos_leonix_ad_id_reconciliation.sql | 58 +
```

`origin/main` does have the base Leonix Ad ID infrastructure — `supabase/migrations/20260506150000_leonix_ad_id_all_classifieds.sql` covers `autos_classifieds_listings`, and the column is read at `autosClassifiedsListingService.ts:39` and surfaced at `AutosLiveVehicleClient.tsx:~240`. The missing piece is a *reconciliation/backfill* pass over staging drift, not the identity system itself. **P2 — data-hygiene migration.**

## 2.5 `db688c04` — business reputation (Google/Yelp) shared drawer · **P2**

**Containment: `origin/main` genuinely lacks the shared component.**

```
git grep -l "SharedConnectionHubReviewDrawer" origin/main -- app/   → (no results)
git grep -l "SharedConnectionHubReviewDrawer" e3956df8 -- app/      → 9 files, incl.
   app/components/contact/connectionHub/renderers/SharedConnectionHubReviewDrawer.tsx
```

So the commit message's claim that the drawer already existed is true **only on the sealed branch**; on production the component does not exist at all, and every category still uses a bespoke renderer.

**What Autos does have on `origin/main`:** the full data pipeline is already live — `googleReviewsUrl` / `yelpReviewsUrl` are declared on the listing type (`app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts:262`, `:266`), defaulted and normalised (`autoDealerDraftDefaults.ts:125-127`, `:190-191`), captured in the application (`AutosNegociosApplication.tsx:554-555`, `:563-564`), inherited into the child step (`AutosInventoryInheritedDealerStep.tsx:112-113`), presence-checked (`autoDealerPresence.ts:94`, `:96`) and mapped into the business-hub contact model (`mapAutosDealerToBusinessHubContact.ts:92`, `:100`). Rendering uses the bespoke `AutosNegociosHubReviewLinkButton.tsx`, consumed at `DealerBusinessStack.tsx:26,:343` and `PreviewDealerBusinessStack.tsx:36,:636` (the latter being the surface `13_…md` Part A proved is the one dealers actually see).

**Verdict:** renderer-only inconsistency, no data loss, no G40 impact. **P2.**

**Reference-Implementation line**

| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **NO on `origin/main`** / YES on `e3956df8` |
| REFERENCE CATEGORY | cross-category shared renderer (Restaurantes, Comida Local, BR Agente, Rentas, Servicios all consume it @`e3956df8`) |
| REFERENCE PATH | `app/components/contact/connectionHub/renderers/SharedConnectionHubReviewDrawer.tsx` @`e3956df8` |
| TARGET PATH | `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx:343` and `…/preview/dealershipPreview/PreviewDealerBusinessStack.tsx:636` |
| DIFFERENCE | Production renders Google/Yelp as two bespoke link buttons instead of the shared reputation drawer; the underlying URL pipeline is identical and already complete |
| **ACTION** | **ADOPT EXISTING** — but the shared component must land first (it is not on `origin/main`), so this is gated behind porting `db688c04` in full |

---

# STEP 3 — WHAT THE PARENT/CHILD ARCHITECTURE GETS RIGHT

Recorded because it is the pattern other categories should copy, and because it bounds the blast radius of §2:

1. **Children are first-class rows, never embedded JSON.** Migration `20260518124700_…:2`. Every child therefore has its own UUID, Leonix Ad ID, status, analytics stream, and public URL.
2. **The write path is identity-preserving by construction.** `updateAutosClassifiedsListingDraft` writes only `listing_payload` + `lang` + `updated_at` (`autosClassifiedsListingService.ts:275-279`); the contract is stated at `:262-266` and holds for parent, child, and privado alike. Same-row UPDATE by real UUID — never an INSERT. This is exactly what Empleos fails to do (`06_…md` §2.9).
3. **Activation is serialised through an atomic RPC, with no bypass.** `activateAutosClassifiedsListing` routes `negocios` through `activateAutosDealerListingAtomic` (`:552-566`), and the comment at `:545-549` states the rule explicitly: *"a QA bypass must never be a capacity backdoor."*
4. **Status writes are verified, not assumed.** `updateAutosListingStatus:520-538` re-reads the row and fails if the status did not stick, and additionally requires a non-empty `published_at` when activating.
5. **Zero-row writes are no longer silent.** Gate I.13A added explicit `console.error` on zero-row matches in both `ensureDealerInventoryParentMain` (`:110-116`) and `promoteNegociosMainInventoryListing` (`:183-187`).
6. **Owner pause/resume is symmetric and admin-safe.** `markAutosClassifiedsListingRemovedIfOwner:446` / `markAutosClassifiedsListingRestoredIfOwner:461` — strictly `removed ↔ active`; never restores from `suspended` (admin moderation is not owner-reversible), documented `:453-460`.
7. **Add-on purchase is parent-only.** `inventory-pack/checkout/route.ts:91-112` rejects an `inventory_vehicle` child with `child_listing_not_eligible` / 422 — a gap the comment notes the canonical validator did not cover.

---

# STEP 4 — EVIDENCE GAPS

1. **No live DB query executed.** All schema claims come from migration files at `origin/main`. Whether production Supabase actually has every migration applied (and in particular whether any out-of-band SQL already fixed the §2.1 counting) was **not** verified — the Supabase MCP server is unauthenticated in this session.
2. **No runtime execution.** The parent-gate behaviour is proven by code path, not by suspending a real dealer and observing a child 404.
3. **`countActiveDealerVehicles` vs the RPC.** The TS preflight counter is proven defective (§2.1). Whether the deployed `autos_dealer_activate_listing` RPC body *also* counts the parent was inferred from `10618f41`'s own commit message plus the absence of the corrective migration, not from reading production's installed function body.
4. **Verifier scripts were not run.** `scripts/gate-i13b-public-visibility-filter-selftest.ts` and `scripts/verify-saved-search-autos-02.ts` exist on `origin/main` and assert the gate; their pass/fail status was not executed.
5. **`AutosLiveVehicleClient.tsx` line offsets.** Section-specific line numbers in the 190-250 range were read from a sliced view; the imports block (`:1-20`) is exact.

---

# STEP 5 — VERDICT

| Question | Answer |
|---|---|
| Does Autos have a BR-equivalent parent-visibility gate? | **YES — TRUE.** `autosPublicChildParentVisibility.ts:40-62`, enforced at 3 public surfaces + saved search. Not an ADOPT EXISTING item. |
| Can an orphaned/inactive dealer's children stay publicly visible? | **NO** through any application surface. **YES** through a raw anon PostgREST query (RLS has no parent predicate) — P2 defense-in-depth. |
| G40 matrix | **18 / 18 TRUE**, 0 FALSE. |
| P1 regressions on production | 2 — capacity mis-count (`10618f41`), child identity substitution (`651abd4e`). Both **FIX REGRESSION**, both cherry-pickable from `e3956df8`. |
| P2 items | 3 — analytics wiring (`b32ff613`), Ad-ID reconciliation migration (`b3473f89`), shared reputation drawer (`db688c04`). |
