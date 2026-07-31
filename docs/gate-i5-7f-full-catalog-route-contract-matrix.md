# Gate I.5.7F — Full-Catalog Route Contract Matrix

Status as of Work Package I.5.8, branch `integration/lifecycle-foundation-2026-07`. This is the
single ledger for full-catalog route truth — Work Package I.5.8 updated it in place rather than
creating a competing document.

This document is **evidence-backed documentation, not an implementation plan**. It records the
current truth of every registered category/pipeline's route surfaces, enforced by
[`scripts/gate-i5-7f-full-catalog-route-contract-selftest.ts`](../scripts/gate-i5-7f-full-catalog-route-contract-selftest.ts)
and, for the specific fixes below, by
[`scripts/gate-i5-8-empleos-autos-viajes-route-drift-selftest.ts`](../scripts/gate-i5-8-empleos-autos-viajes-route-drift-selftest.ts),
[`scripts/gate-i5-8-bienes-autos-parent-child-action-protection-selftest.ts`](../scripts/gate-i5-8-bienes-autos-parent-child-action-protection-selftest.ts),
[`scripts/gate-i6a-quick-clasificados-lifecycle-selftest.ts`](../scripts/gate-i6a-quick-clasificados-lifecycle-selftest.ts),
[`scripts/gate-i6b-quick-clasificados-integrity-selftest.ts`](../scripts/gate-i6b-quick-clasificados-integrity-selftest.ts),
[`scripts/gate-i6c-quick-listing-fail-closed-identity-selftest.ts`](../scripts/gate-i6c-quick-listing-fail-closed-identity-selftest.ts),
[`scripts/gate-i7a-specialized-lifecycle-reconciliation-selftest.ts`](../scripts/gate-i7a-specialized-lifecycle-reconciliation-selftest.ts),
[`scripts/gate-i8a-global-dashboard-truth-selftest.ts`](../scripts/gate-i8a-global-dashboard-truth-selftest.ts),
[`scripts/gate-i8b-live-dashboard-coverage-selftest.ts`](../scripts/gate-i8b-live-dashboard-coverage-selftest.ts),
[`scripts/gate-i9a-admin-operations-truth-selftest.ts`](../scripts/gate-i9a-admin-operations-truth-selftest.ts),
and
[`scripts/gate-i9b-admin-write-safety-selftest.ts`](../scripts/gate-i9b-admin-write-safety-selftest.ts).
It does not claim the two route systems are unified, and it does not repair every stale value it
documents — see [Unresolved Route Debt](#unresolved-route-debt).

## Work Package I.9B update log

Closes the highest-risk gap I.9A confirmed but deliberately left unfixed: Admin's Auto Dealer and
Bienes Raíces Negocio write routes acted directly on whatever UUID was in the request, with no
server-side guard preventing a parent-only lifecycle action from being applied to (or through) an
inventory child row.

- **`adminInventoryActionGuard.ts` — new.** One small, shared target-row validator,
  `assertAutosDealerActionAllowed()` / `assertBrNegocioActionAllowed()`. Both reuse the existing,
  canonical role predicates rather than re-deriving them — `isDealerInventoryMainListing`/
  `isDealerInventoryVehicle` (Autos) and `isBrNegocioListing`/`isBrInventoryMainListing`/
  `isBrInventoryProperty` (Bienes) — never a new identity system. Every input must be a
  freshly-fetched server row; nothing here ever trusts a client-supplied role, category, parent
  id, or owner id.
- **Deliberately asymmetric between the two pipelines — evidence-based, not stylistic.**
  - **Autos**: a standalone, never-grouped dealer listing (the common single-vehicle-dealer case)
    is confirmed, by direct inspection of `promoteNegociosMainInventoryListing()`
    (`autosClassifiedsListingService.ts:448-465`), to keep `inventory_role = null` until a second
    vehicle is added — `inventory_role` is only promoted to `"main"` lazily, not proactively at
    publish. Treating every un-tagged standalone listing as "unresolved" would fail-close the
    majority case, a real regression. So a listing with `lane = "negocios"` and no parent id at
    all is still treated as the parent — the same, already-proven convention the owner dashboard
    already uses (`dashboardInventory.ts`'s `isDealerMain`).
  - **Bienes Raíces**: confirmed, by direct inspection of `leonixPublishRealEstateListingCore.ts:
    592-604`, that `inventory_role: "main"` is set proactively at publish time for the default
    (non-multi-property) Negocio case, via `mainListingInventoryPatchAfterInsert()`. Strict
    matching (`isBrInventoryMainListing`, requiring the literal `inventory_role === "main"`) is
    therefore safe and is used as-is — no fail-open fallback. A Bienes Raíces Negocio listing
    published before this system existed will fail closed on the one parent-only action
    (`archive`) until its `inventory_role` is backfilled — an explicitly accepted, conservative
    consequence of Objective B's "do not infer parent role merely from missing parent ID," not an
    overlooked regression.
- **Scope of the new restriction, per pipeline (Objective A's matrix, using the owner-dashboard's
  established `resolveDashboardActions()` precedent — parent-only structural actions vs.
  reversible per-row flags — as evidence):**
  - **Auto Dealers**: `archive`, `remove_public`, `restore_active` are now **parent-only**.
    `suspend`, `unsuspend`, `promote_on`, `promote_off`, `verify_on`, `verify_off`, `republish`
    remain **allowed for both** roles, unchanged — each is a per-row, reversible flag/status
    write with no cross-row effect and no evidence restricting it.
  - **Bienes Raíces Negocio**: only `archive` is **parent-only** (the generic `listings` route has
    no separate `remove_public`/`restore_active` actions). `suspend`, `unsuspend`, `promote_on`,
    `promote_off`, `verify_on`, `verify_off`, `republish` remain allowed for both, unchanged.
  - The destructive hard-delete action (`deleteListingAction`) was **not** reclassified or
    touched — it remains its own separately-invoked, more-cautiously-gated tool outside this
    per-row action set, exactly as I.9A already recorded.
- **Wired into both touched routes, authorization-first, write-last.** Both
  `app/api/admin/autos/listings/[id]/route.ts` and
  `app/api/admin/clasificados/listings/[id]/route.ts` (the latter scoped narrowly to
  `category === "bienes-raices"` — every other category on this shared route is provably
  untouched) now call the guard immediately after the existing `requireAdminCookie` check and the
  row fetch, and strictly before the `.update()` call. A rejected action returns the deterministic
  `admin_inventory_action_forbidden` code with HTTP 403 — never a raw database error, never
  role-specific detail.
- **Identity preservation confirmed, not just claimed.** Neither route's `patch` object for any
  action ever includes the parent id, group id, owner id, category, or Leonix Ad ID columns —
  confirmed by source-level test assertion, not just design intent. Every write remains
  `.eq("id", id)` — the exact target row, never a substituted parent/child id.
- **Generic listings safety (Objective D) — audited, no additional defect found.** Rentas, En
  Venta, Bienes Raíces Privado, Comunidad, Clases, Busco, Mascotas y Perdidos, and Autos Privado
  have no inventory/parent-child concept at all on the shared `listings`/`autos_classifieds_listings`
  tables — confirmed unaffected by the new guard (it only activates for `category ===
  "bienes-raices"` on the generic route, and for `lane === "negocios"` with a resolvable role on
  the Autos route). The pre-existing `invalid_action` 400 fail-closed default for unsupported
  transitions, and the absence of `category`/`owner_id`/`owner_user_id` from every action's patch
  object, were both confirmed already correct — no additional repair was needed or made.
- **`adminActionTruth.ts` updated only after the real protection landed.** `inspectParentChild`
  moved from `stale_or_unsafe` to `working_with_adapter` for `autos_negocios` and
  `bienes_raices_negocio` — not bare `working`, since only the specific structural actions listed
  above are now role-gated; the rest of each pipeline's action set was already accurately
  classified and is unchanged.
- **I.9A's report-authorization fix (`updateListingReportStatusAction` → `can_manage_reports`)
  confirmed intact, unchanged.**

## Per-pipeline Admin write-safety truth (Auto Dealers / Bienes Raíces Negocio)

| Action | Auto Dealer allowed role | Auto Dealer authorization | Auto Dealer identity validation | Auto Dealer row scope | Auto Dealer parent/child preservation | Bienes Negocio allowed role | Bienes Negocio status | Remaining gap |
|---|---|---|---|---|---|---|---|---|
| `archive` | parent only | `requireAdminCookie`, before guard, before write | server-fetched row; role resolved from `inventory_role`/`lane`/parent id, never client-supplied | exact `id` only | parent/group id never in patch | parent only | same contract, generic route | none — genuinely protected |
| `remove_public` | parent only | same | same | exact `id` only | same | not applicable (action doesn't exist on generic route) | n/a | none |
| `restore_active` | parent only | same | same | exact `id` only | same | not applicable | n/a | none |
| `suspend` / `unsuspend` | allowed for both | same | same | exact `id` only | same | allowed for both | same | none — reversible per-row flag, no restriction needed |
| `promote_on` / `promote_off` | allowed for both | same | same | exact `id` only | same | allowed for both | same | none |
| `verify_on` / `verify_off` | allowed for both | same | same | exact `id` only | same | allowed for both | same | none |
| `republish` | allowed for both | same | same | exact `id` only | same | allowed for both | same | none |
| `remove` (hard delete) | not part of this action set | `requireLeonixAdminPermission("can_manage_ads")` (`deleteListingAction`, unchanged) | n/a | listings table only | n/a | not part of this action set | unchanged | intentionally kept as its own separately-gated tool, not reclassified |

**Not fixed in this package (unchanged from I.9A, still real, still documented):** the 3-pattern
authorization-check duplication across the other 19 untouched `app/api/admin/**` routes; owner
email exposure via `adminProfilesQuery.ts` remains ungated beyond the base cookie and unaudited on
read; no dedicated coupon/offers-addon Admin status view exists. All three remain out of this
package's narrow, evidence-scoped fix list.

## Work Package I.9A update log

First package to audit the **staff-facing Admin surface** (`app/admin/`), architecturally
separate from every prior package in this ledger (all of which covered the owner-facing dashboard
or the public route/registry system). Confirmed by direct inspection: Admin has **zero** usage of
the canonical `ListingIdentity`/`categoryRouteRegistry.ts`/`resolveDashboardActions()` system
anywhere — it is an entirely separate, ad-hoc identity/route system
(`app/admin/_lib/listingsAdminSelect.ts`, `classifiedsOpsContract.ts`, per-route inline path
building). This package does not unify the two systems (out of scope, too large) — it audits,
classifies, and organizes Admin truthfully, and fixes two small, safe, evidence-backed real bugs.

- **`adminListingClassification.ts` — new.** Mirrors the owner-dashboard's
  `classifyOwnerDashboardRow()` (I.8A), but for Admin, and — for the first time — has Admin
  express its classification in terms of the canonical `CanonicalCategoryKey` pipeline vocabulary
  instead of inventing a third parallel one. Purely a classification helper (group + pipeline);
  never sees an owner id.
- **`adminActionTruth.ts` — new.** Classifies, per pipeline and per action, whether a real
  handler exists, using only confirmed evidence from direct source inspection of all 20
  `app/api/admin/**` route files plus every Admin category queue page:
  - **Dedicated-route pipelines** (real `app/api/admin/{category}/listings/[id]/route.ts` PATCH
    handler, confirmed `requireAdminCookie` + real `.update()`): Restaurantes, Servicios, Empleos
    (+ moderate route), Autos Negocios, Viajes (+ staged-listings moderate route).
  - **Generic-route pipelines** (shared `app/api/admin/clasificados/listings/[id]/route.ts`,
    category-branching PATCH against the shared `listings` table): Rentas (both lanes), En Venta,
    Bienes Raíces (both lanes), Comunidad, Clases, Busco, Mascotas y Perdidos, Autos Privado.
    Classified `working_with_adapter`, deliberately not collapsed into bare `working` — the route
    branches per category and that distinction is preserved, not flattened.
  - **Comida Local — confirmed real Admin queue page, but literally no write handler at all.**
    Direct inspection of `app/admin/(dashboard)/workspace/clasificados/comida-local/page.tsx`
    found no suspend/archive `onClick`, no `fetch` to `/api/admin`, only a GET search form and a
    queue/live toggle link. Classified `ui_only_no_handler` — there was no misleading button to
    fix (there is no button at all), so nothing was hidden/disabled; this is a genuine, honest
    capability gap, recorded here per Objective G rather than silently assumed working.
  - **`remove` (hard delete) is deliberately never classified as a routine `working` action for
    any pipeline.** The real handler (`deleteListingAction`) exists, is authorization-gated, and
    genuinely deletes Mux assets + soft-removes the row — but this package keeps it classified
    `blocked`/`intentionally_unsupported` in the generic per-row action truth table rather than
    certifying it as a routine, safe-to-wire action; it remains its own separately-invoked,
    more-cautiously-gated tool.
  - **Real, confirmed gap: no parent/child protection at the Admin API layer.** The owner-facing
    `resolveDashboardActions()` has an explicit, tested guard preventing a child inventory row's
    action from acting on/appearing as its parent (I.5.8). Admin has no equivalent — its
    write routes (`restaurantes/[id]`, `servicios/[id]`, `clasificados/listings/[id]`, etc.) act
    directly on whatever UUID is in the URL, with zero `inventory_role`/parent-check before
    mutating. `inspectParentChild` is classified `stale_or_unsafe` for `bienes_raices_negocio`
    and `autos_negocios` to record this honestly. **Not fixed in this package** — retrofitting a
    guard into 6+ live write routes is a real behavior change to production write paths, outside
    this package's "narrow additive changes" scope; recorded as a remaining gap.
- **`adminStatusAttention.ts` — new.** Per Objective H's "reuse or adapt existing display-only
  status normalization," this does **not** duplicate the owner-dashboard's status mapping tables
  — it calls `resolveOwnerDashboardStatusDisplay()` (I.8A/I.8B) directly, since Restaurantes/
  Servicios/Empleos/Viajes use identical DB status vocabularies in Admin as in the owner
  dashboard (same tables, same columns). Adds only genuinely Admin-specific attention reasons on
  top (unsupported pipeline, unknown status, suspended, pending moderation, payment required,
  expired entitlement, missing owner, parent/child inconsistency, incomplete Admin action) — all
  strictly gated on caller-supplied, already-verified facts; nothing is inferred or fabricated.
- **Real security fix: `updateListingReportStatusAction` was missing its documented
  authorization gate.** `app/admin/_lib/leonixAdminGate.ts`'s own header comment already
  documented `can_manage_reports -> updateListingReportStatusAction` as the intended permission
  gate, but the function itself had no `requireLeonixAdminPermission()` call at all — unlike its
  siblings in the same file (`setListingPublishedAction`, `deleteListingAction`, both correctly
  gated on `can_manage_ads`). Fixed by adding the one missing, already-intended call. Confirmed
  `submitListingReportAction` (the public "report this listing" action, called from public
  listing pages, not staff) correctly remains ungated — it is not a staff action and was never
  supposed to be.
- **Real, evidence-backed contract fix: `busco` was missing from
  `CLASSIFIEDS_OPS_CONTRACTS`.** A real, working Admin queue page already existed
  (`app/admin/(dashboard)/workspace/clasificados/busco/page.tsx`, backed by the shared `listings`
  table, covered by the same generic write route as Rentas/En Venta/Comunidad/Clases) — same bug
  class already fixed for Clases/Comunidad on the owner-dashboard side (Gate I.6B). Added with the
  confirmed-real `"BUSCO"` Leonix prefix (`listingsLeonixPrefixForCategory("busco")`,
  `app/(site)/clasificados/lib/leonixAdIdAllocator.ts`). **Ofertas Locales was deliberately NOT
  added** — it is a locked system for this package (Ofertas/Cupones); its real, separate
  `ofertas_locales` table and Admin surface were not inspected or touched.
- **Auth-check consistency — audited, not refactored.** All 21 `app/api/admin/**` routes do
  perform a real cookie check before any write, but via three different code paths (direct
  `requireAdminCookie` import in 8 files, a wrapper `assertAdminLeadExportAccess()` in 7 files,
  and a hand-inlined literal duplicate of the same check in 5 files that never calls the shared
  helper). No route is unprotected, but this is a real consistency/maintainability risk — a
  future change to admin-cookie logic could silently miss the 5 inlined files. **Not refactored
  in this package** (would touch 13+ live write route files, outside this package's narrow-change
  scope) — recorded as a remaining gap, not silently normalized away.
- **Owner PII exposure — audited, not changed.** Admin can resolve any listing's `owner_id` to
  the owner's full profile including email (`app/admin/_lib/adminProfilesQuery.ts`), gated only
  by the base admin cookie — no per-role redaction, no read-audit-logging (only writes are
  audited via `auditAdminWrite`/`appendAdminAuditLog`). Recorded as a remaining gap; not a write
  behavior change, so out of this package's fix scope.
- **Entitlement/promo-code Admin writers confirmed real and pre-existing — not touched.**
  `listing_package_entitlements` create/revoke/extend/attach and `leonix_promo_codes`
  create/revoke already exist, are authorization-gated (`assertCanManageEntitlement`/
  `assertCanManagePromoCode`), and are unmodified by this package (verified in the new test).
  `leonix_payment_records` (the Stripe/payment table itself) has no Admin write path anywhere —
  confirmed webhook-only by design, correctly left that way.
- **No dedicated Admin view of Restaurante coupon add-on / Servicios offers-addon status exists
  per listing** — confirmed absent (only a generic `addOnKeys` list inside promo-code redemption
  usage rows). Documented as a real gap, not built here.

## Per-pipeline Admin operations truth

| Pipeline | Admin discovery | Canonical identity | Owner visibility | Normalized status | View/Preview/Edit context | Moderation | Lifecycle controls | Payment visibility | Entitlement visibility | Report handling | Parent/child inspection | Incomplete actions | Remaining Admin gap |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `restaurantes` | dedicated table + page | sourceId UUID | real (`owner_user_id` → profiles) | reused from I.8A/I.8B, truthful | real | via `listing_reports` (auth now fixed) | working (dedicated route) | real (`listing_package_entitlements`/payment tracker) | real | connected, auth gap now closed | not applicable | `remove` intentionally not routine | consistency of the 3-pattern cookie-check duplication |
| `servicios` | dedicated table + page | sourceId UUID | real | reused, truthful | real | same as above | working (dedicated route) | real | real | connected | not applicable | `remove` not routine | same as above |
| `empleos` | dedicated table + page + moderate route | sourceId UUID | real | reused, truthful | real | dedicated moderate route, real | working (dedicated route) | real | real | connected | not applicable | `remove` not routine | same as above |
| `autos_negocios` | dedicated table + page | sourceId UUID | real | own logic, not re-audited this pass | real | via `listing_reports` | working (dedicated route) | real | real | connected | **confirmed unsafe** — no parent/child guard at Admin API layer | `remove` not routine | parent/child guard gap (documented, not fixed) |
| `autos_privado` | shared `listings` table | sourceId UUID | real | shared centralized helper | real | via `listing_reports` | working_with_adapter (generic route) | real | real | connected | not applicable | `remove` not routine | consistency gap |
| `bienes_raices_negocio` | shared `listings` table + inventory badges | sourceId UUID, `br_inventory_group_id` | real | own logic | real | via `listing_reports` | working_with_adapter (generic route) | real | real | connected | **confirmed unsafe** — same gap as Autos Negocios | `remove` not routine | parent/child guard gap |
| `bienes_raices_privado` | shared `listings` table | sourceId UUID | real | shared centralized helper | real | via `listing_reports` | working_with_adapter | real | real | connected | not applicable | `remove` not routine | consistency gap |
| `rentas_negocio`/`rentas_privado` | shared `listings` table + dedicated inspector route | sourceId UUID | real | shared centralized helper | real | via `listing_reports` | working_with_adapter | real | real | connected | not applicable | `remove` not routine | consistency gap |
| `en_venta` | shared `listings` table | sourceId UUID | real | shared centralized helper | real | via `listing_reports` | working_with_adapter | real | real | connected | not applicable | `remove` not routine | consistency gap |
| `comida_local` | dedicated table + page | sourceId UUID | real | own dedicated translator, truthful | real (view only) | via `listing_reports` | **`ui_only_no_handler` — confirmed no write handler at all** | not applicable | not applicable | connected | not applicable | suspend/archive/etc genuinely absent | build real lifecycle actions if ever prioritized |
| `ofertas_locales` | **out of scope — locked system (Ofertas/Cupones)** | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | not inspected or touched by this package |
| `busco` | **fixed in I.9A** — real page, was missing from `CLASSIFIEDS_OPS_CONTRACTS` | sourceId UUID | real | shared centralized helper | real | via `listing_reports` | working_with_adapter (generic route) | real | real | connected | not applicable | `remove` not routine | consistency gap |
| `clases`/`comunidad` | shared `listings` table | sourceId UUID | real | shared centralized helper | real | via `listing_reports` | working_with_adapter | real | real | connected | not applicable | `remove` not routine | consistency gap |
| `mascotas_y_perdidos` | shared `listings` table | sourceId UUID | real | shared centralized helper | real; **Edit/owner-context honestly `blocked`** — no safe editor exists (same fact as I.6B/I.8B) | via `listing_reports` | working_with_adapter | real | real | connected | not applicable | `remove` not routine; Edit blocked | build a safe editor if ever prioritized |
| `viajes` | dedicated table + page + moderate route | sourceId UUID (table is slug-keyed for public) | real | reused, truthful | `working_with_adapter` — lane-ambiguous (same finding as I.7A) | dedicated moderate route, real | working (dedicated route) | real | real | connected | not applicable | `remove` not routine | lane-ambiguity, consistency gap |

## Work Package I.8B update log

**Correction to I.8A's own claim.** I.8A's report stated the classification helper existed and
was tested, but did not clearly state whether it was actually wired into the live render path —
it was not; `classifyOwnerDashboardRow()` was built and unit-tested but never imported by
`mis-anuncios/page.tsx`. I.8B corrects this directly.

- **Classification is now live-wired, not test-only.** `mis-anuncios/page.tsx` now imports and
  calls `classifyOwnerDashboardRow()` in all four flat-list card-family branches (Autos Privado,
  Bienes/Rentas, En Venta, the generic catch-all) and all four dedicated-card-family call sites
  (Restaurantes, Servicios, Empleos, Viajes). Every rendered card now carries a real, translated
  group badge (`ownerDashboardGroupLabel()` — "Negocio"/"Privado y clasificado"/"Inventario"/
  "Requiere atención") sourced directly from the helper's output — the smallest additive
  organization compatible with the existing card designs (a badge, not a redesign or new section
  hierarchy). Business organization (which visual group a card belongs to) and Business Hub
  eligibility (whether coupons/offers/inventory actions can ever appear) remain two separate
  truths, exactly as before — Rentas Negocio and Viajes' business lane still classify `business`
  organizationally but `businessHubEligible: false`, since no live `resolveDashboardActions()`
  branch exists for either.
- **Unsupported pipelines no longer silently disappear.** A real gap was found and fixed: because
  `categoryFilteredListings` requires `listingRowCategoryKey(row) === categoryFilter` and no tab
  is ever `"other"`, a row with a genuinely unmodeled category could never appear under *any* tab
  — not shown as "unsupported," simply invisible regardless of which tab the owner selected. Since
  restructuring the tab-filter architecture itself was out of this package's additive scope, these
  rows are now surfaced through the existing I.8A attention panel instead (new
  `unsupported_pipeline` attention reason) with a real link to the generic per-listing workspace
  — visible, truthful, and never fabricating a category-specific action for a category the
  dashboard doesn't otherwise understand.
- **Mascotas y Perdidos is now discoverable in Mis Anuncios.** Added as a real tab
  (`"mascotas"` in `MIS_ANUNCIOS_CATEGORY_KEYS`/`MIS_ANUNCIOS_CATEGORY_DEFS`, real
  `/publicar/mascotas-y-perdidos/quick` and `/clasificados/mascotas-y-perdidos/results` routes),
  and `listingRowCategoryKey()` now recognizes `"mascotas-y-perdidos"` — previously, rows with
  this category value were fetched by the same owner-scoped `fetchOwnerListingsForDashboard`
  query as every other `listings`-table category (confirmed unfiltered, same fact already
  established for Clases/Comunidad in I.6B) but could never appear under any tab, for the exact
  same "unmatched category" reason described above. `classifyOwnerDashboardRow()` was corrected
  to classify it `private` (not `unsupported` as I.8A originally had it) — it has real rows, a
  canonical UUID, and a safe public route (Gate I.6B); "no safe Edit route yet" is an
  action-availability fact, not a reason to exclude it from organizational grouping. It reuses the
  existing generic catch-all card exactly as Busco/Clases/Comunidad already do — that card never
  renders an Edit or Preview button at all, so Edit stays correctly absent with zero new gating
  logic required, and no Business Hub action was ever possible from that code path. No dedicated
  Mascotas editor or architecture was built.
- **Status display audit — completed for every live card family.** Two more real, evidence-backed
  bugs found and fixed (same bug class as Empleos/Viajes in I.8A — raw/default-green status):
  - **Restaurantes and Servicios** both render through the generic `DashboardCategoryListingCard`
    with a hardcoded-emerald pill showing the raw, untranslated DB status string — confirmed via
    each table's real CHECK constraint (`restaurantes_public_listings.status` ∈
    `{published, suspended, archived}`; `servicios_public_listings.listing_status` — a 9-value
    enum that already matches `ListingLifecycleStatus`'s own vocabulary 1:1). A suspended or
    archived restaurant, or a pending-payment service listing, previously displayed in the same
    green as a live one. Both now resolve through `resolveOwnerDashboardStatusDisplay()`, extended
    with a confirmed-real mapping table for each.
  - **Autos Privado** (`AutosClassifiedListingManageCard.tsx`) unconditionally rendered
    `isSold ? "Sold" : "Active"` — any status other than `"sold"` (paused, removed, expired,
    flagged, pending, ...) displayed as green "Active." Corrected to accept an optional,
    pre-resolved `uiStatus` prop (same pattern already used by the En Venta card and the generic
    catch-all card), computed by the page via the existing `resolveListingUiStatus`/
    `normalizeUiStatus` pipeline. Backward compatible — the prop is optional, so no other caller
    of this shared component is affected.
  - **Every other live card family was audited and confirmed already truthful, not touched:**
    Auto Dealers (parent/child) already delegates to a real `autosListingStatusLabelEs/En()`
    translator with no colored pill at all; Bienes/Rentas (`LeonixRealEstateListingManageCard`)
    already has its own hand-rolled but genuinely truthful 3-state pill (active/paused/archived)
    plus a neutral (not green) fallback for anything else; En Venta/Clases/Comunidad/Busco/
    Mascotas already share the centralized `resolveListingUiStatus`/`listingUiStatusLabel`
    pipeline; Comida Local already has its own dedicated, real `statusLabel()` translator.
    "Global status completion" is not claimed loosely — every family in Objective C's list was
    individually inspected and is either confirmed-truthful or corrected, recorded per-family in
    [Per-pipeline dashboard truth](#per-pipeline-dashboard-truth) below.
  - Unknown/unmapped raw status values still never display as active/published anywhere touched
    by this package (unchanged contract from I.8A, re-verified). No database status value and no
    status write path was altered by any of the above — display-only throughout.

## Work Package I.8A update log

**Retracted/corrected by I.8B, above:** this log's `dashboardOwnerClassification.ts` bullet
implied the classification helper shaped the dashboard; it did not — the helper existed and was
unit-tested but was never imported by `mis-anuncios/page.tsx`. It also classified Mascotas
`unsupported`, which conflated a real, already-fixed fact (a safe public route existed since I.6B)
with an actually-true-but-separate fact (Mascotas wasn't wired into the Mis Anuncios tab system
yet). Both are corrected above, not silently edited away.

Objective: one truthful global owner Mis Anuncios experience across the whole catalog — not a
redesign, not Admin, not Analytics. Three new, additive, pure helpers were added; the existing
Mis Anuncios page/components were wired to them narrowly, without restructuring the page's
existing per-source fetch/render architecture (documented in full below in
[Per-pipeline dashboard truth](#per-pipeline-dashboard-truth)).

- **`dashboardOwnerClassification.ts` — new.** One shared function,
  `classifyOwnerDashboardRow()`, answers three questions for any row from any pipeline: which
  organizational group it belongs in (`business` / `private` / `inventory_child` /
  `unsupported`), which canonical `CanonicalCategoryKey` pipeline it maps to, and whether it
  genuinely qualifies for Business Hub tooling. Business Hub eligibility is computed from the
  real, currently-live `resolveDashboardActions()` branches (restaurantes, servicios,
  bienes_raices_negocio, autos_negocios) — **not** from each adapter's `supportsBusinessHub`
  flag, which is broader than reality for two pipelines: Rentas Negocio and Viajes' business lane
  both declare `supportsBusinessHub: true` but `resolveDashboardActions()` never actually emits a
  coupons/offers/inventory action for either. This helper reports the narrower, true set. Never
  takes an owner id — cannot infer eligibility from ownership alone by construction.
- **`dashboardOwnerStatusDisplay.ts` — new.** Extends the existing `getStatusLabel`/
  `ListingLifecycleStatus` table (`app/lib/clasificados/listingLifecycleDomain.ts`) to the two
  dedicated-table categories that had no truthful status display at all: Empleos and Viajes. Both
  previously rendered their raw, untranslated DB status string inside a hardcoded-emerald pill on
  `DashboardCategoryListingCard` (e.g. a rejected Empleos listing showed the literal string
  `"rejected"` in a green "success" pill). Activates the previously-dead
  `mapEmpleosStatusToCanonical()` (zero importers before this package) — and fixes a real bug in
  it while activating it: `"pending_review"` was missing from its mapping table and silently fell
  back to `"draft"`, mislabeling a listing genuinely awaiting review as a draft. Adds a new
  Viajes mapper against the real, confirmed `ViajesStagedLifecycleStatus` enum
  (`viajesStagedListingTypes.ts`); `"changes_requested"` has no 1:1 canonical equivalent and is
  deliberately left unmapped (falls to an honest "unknown/needs attention" display, raw status
  preserved) rather than guessed. Never shows an unrecognized raw status as active/published.
  Rentas/BR/En Venta/Clases/Comunidad/Busco keep using their existing, already-centralized
  `resolveListingUiStatus`/`listingUiStatusLabel` pipeline, untouched — this helper only fills the
  two gaps that had nothing.
- **`dashboardAttentionItems.ts` — new.** One pure, additive attention-item resolver — no I/O, no
  background jobs, no notifications. Wired into the Mis Anuncios page as a compact panel (top of
  page, above the category selector) aggregating from data the page already computes: Empleos and
  Viajes rows (via the new status helper above) and Rentas rows (via the same
  `resolveListingLifecycle`/`RENTAS_LISTING_LIFECYCLE_CONFIG` the Rentas card's own renewal button
  already uses). Every item type maps to a real Objective D bullet (payment required, not public,
  suspended, expired, missing edit/public route, inventory child needing parent, addon inactive,
  renewal available) and is strictly gated on real, caller-supplied truth — the resolver
  distinguishes an *unevaluated* route (`undefined`, no claim made) from a *confirmed-missing* one
  (`null`, produces an info-severity item) so a category this pass didn't wire in full never gets
  a false "missing route" claim. Renewal items only ever appear when the caller passes a real,
  already-verified `hasRealAction: true` (Rentas today) — an expired listing with no real renewal
  path shows only the honest "expired" note, never a fabricated renewal CTA.
- **`DashboardCategoryListingCard.tsx` — narrow, backward-compatible addition.** New optional
  `statusTone` prop selects the status pill's color from the resolved display tone; omitted (any
  caller not yet updated — Restaurantes, Servicios, Autos-classified still pass only the raw
  `status` string today) keeps the exact previous hardcoded-emerald look, so this change cannot
  regress any category it wasn't specifically wired into.
- **`dashboardInventory.ts` — additive field.** `DashboardInventoryItem` gained an optional
  `statusDisplay` field, populated only by `buildEmpleosInventoryItems`/`buildViajesInventoryItems`
  today; every other builder is untouched.
- **`mis-anuncios/page.tsx` — narrow wiring only, not a rewrite.** The Empleos/Viajes card call
  sites now pass the resolved status label/tone instead of the raw string; one new `useMemo`
  aggregates attention items from data the page already fetches; one new, compact panel renders
  it. The existing 2,100+-line per-row render dispatch (`visible.map()`, the BR/Autos inventory
  sections, the dedicated-category blocks) was **not** restructured — this package deliberately
  did not rebuild the page.

## Per-pipeline dashboard truth

Objective D/Master-Ledger table for Work Package I.8A. `Discovery` = does a real owner query
surface this pipeline in Mis Anuncios (or its own dedicated dashboard) today. `Group` = the new
classification helper's output. `Hub` = Business Hub eligibility per the same helper (see the
I.8A update log above for why this is narrower than each adapter's `supportsBusinessHub` flag for
Rentas Negocio and Viajes business).

| Pipeline | Discovery | Group | Identity | Status display | Edit | Preview | Public | Lifecycle actions | Hub | Inventory/add-on | Leads | Analytics | Billing/renewal | Remaining gap |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `restaurantes` | yes, dedicated table + own `/dashboard/restaurantes` page, also surfaced on Mis Anuncios via `DashboardCategoryListingCard`, now with a live classification badge | business | sourceId UUID | **fixed in I.8B** — was raw untranslated string in a hardcoded-emerald pill (suspended/archived showed green); now truthful against the confirmed real `{published,suspended,archived}` DB enum | real | real | real | pause/resume via dedicated page (not re-audited here) | **yes** (parent, `couponsActive` entitlement, server-verified) | coupon-edit, real | none (global leads not built, per Objective H) | omitted (`analytics: "unproven"` per resolver comment) | no renewal path found | status audit complete |
| `servicios` | yes, dedicated table + own `/dashboard/servicios` page, also on Mis Anuncios, now with a live classification badge | business | sourceId UUID | **fixed in I.8B**, same pattern as Restaurantes; confirmed real 9-value DB enum already matches `ListingLifecycleStatus` 1:1 | real | real | real | own dedicated page | **yes** (parent, `offersActive` entitlement, server-verified) | offers-edit, real | none | real (`/dashboard/analytics`) | no renewal path found | status audit complete |
| `bienes_raices_negocio` | yes, shared `listings` table + dedicated inventory-grouping section | business (parent) / inventory_child (child) | sourceId UUID, `br_inventory_group_id` grouping | own hand-rolled pill logic (`LeonixRealEstateListingManageCard`), not the centralized helper — pre-existing, not touched | real, parent-only (I.5.7A.1 protection) | real, parent-only | real | pause/resume/archive/mark sold; BR-Negocio-only global attention line (Gate G.2.2) | **yes**, parent only — but `resolveDashboardActions()` is called with a hardcoded `entitlement: {}` at both live call sites, so the resolver itself never actually emits `manageInventory`; real inventory-management functionality exists via a separate legacy href fallback, not through the entitlement-gated resolver path (pre-existing architecture, confirmed again here) | `BrNegocioListingInventoryActions` (real actions for parent, static label only for child) | none | real (`genericWorkspaceAnalyticsHref`, both roles) | inventory-pack checkout exists (not a base-listing renewal) | resolver/entitlement wiring gap noted above is a real, confirmed, pre-existing architecture split — not resolved in I.8A |
| `bienes_raices_privado` | yes, shared `listings` table | private | sourceId UUID | shared centralized helper (unaffected) | **missing** (pre-existing, unchanged) | real | real | pause/resume/archive | no (correctly) | not_applicable | none | omitted | none | no confirmed edit route (unchanged) |
| `autos_negocios` | yes, shared `autos_classifieds_listings` table + dedicated inventory section | business (parent) / inventory_child (child) | sourceId UUID | own logic, not re-audited | real, parent-only | real, **child-bound** (confirmed asymmetry vs BR) | real | group-level pause/resume via dedicated section | **yes**, parent — `manageInventory` genuinely ungated (no entitlement check), documented pre-existing asymmetry vs Bienes | real, parent | none | real when `status === "active"` | inventory-pack checkout exists | ungated-vs-BR asymmetry is pre-existing, not resolved here |
| `autos_privado` | yes, shared table, now with a live classification badge | private | sourceId UUID | **fixed in I.8B** — `AutosClassifiedListingManageCard` previously showed every non-"sold" status as green "Active" (paused/removed/expired/flagged all displayed as Active); now accepts a real resolved `uiStatus` from the existing `resolveListingUiStatus` pipeline | real | real | real | pause/resume/archive | no (correctly) | not_applicable | none | omitted | none | no exported href-builder constant (pre-existing); status audit complete |
| `rentas_negocio` | yes, shared `listings` table | business (organizational — seller_type=business) | sourceId UUID | shared centralized helper; **now feeds I.8A attention center** (pending_payment/expired/renewal via `resolveListingLifecycle`) | **real** (I.7A fix) | real | real (dedicated `/clasificados/rentas/listing/{id}`) | pause/resume/archive/mark sold + **real renewal button** (`rentas_30d`, Revenue OS checkout) | **no** — `supportsBusinessHub: true` on the adapter, but `resolveDashboardActions()` never emits any coupons/offers/inventory action for Rentas; I.8A's classifier reports this correctly rather than the aspirational flag | none live | none | omitted | **real, live** — confirmed working renewal CTA | I.7A-confirmed query-error-falls-to-INSERT gap in the shared BR/Rentas publish core, deliberately deferred (locked-adjacent); no reuse protection outside `pending_payment` activation |
| `rentas_privado` | yes | private | sourceId UUID | same pipeline as Negocio | real (I.7A) | real | real | same as Negocio, same real renewal button | no | none | none | omitted | real | same deferred gaps as Negocio |
| `empleos` | yes, dedicated table, own `/dashboard/empleos` page + Mis Anuncios tab | private | sourceId UUID (own table, not `listings`) | **fixed in I.8A** — was raw untranslated string in a hardcoded-emerald pill; now truthful (including the `pending_review` mapping bug fixed while activating `mapEmpleosStatusToCanonical`) | real (dedicated `/dashboard/empleos/{id}`) | real, lane-specific | real | publish/pause/archive via `PATCH lifecycle_status` (I.7A repaired existing-identity fail-closed on create/update) | no | not_applicable | none | real (`provenInventoryAnalyticsHref` includes empleos) | no renewal path found | now feeds I.8A attention center (pending_review/rejected/unknown/not-public) |
| `en_venta` | yes, shared `listings` table | private | sourceId UUID | shared centralized helper (unaffected) | real, generic editor (I.6A) | real | real | pause/resume/archive/republish | no | not_applicable | none | omitted | republish window (not a paid renewal) | unchanged |
| `comida_local` | yes, dedicated table + dedicated section component | business (organizational) | sourceId UUID | own dedicated component, not re-audited | real | real | category_specific | not re-audited | no (no live resolver action) | not_applicable | none | omitted | none | results route stale (dupes entry), pre-existing, not touched |
| `ofertas_locales` | **confirmed intentionally excluded from Mis Anuncios** — has its own dedicated `/dashboard/ofertas-locales` surface | not_applicable | n/a | n/a | n/a | n/a | n/a | n/a | not_applicable (own surface) | dedicated | none | omitted | n/a | intentional separation, confirmed again by I.8A, not a gap |
| `busco` | yes, shared `listings` table | private | sourceId UUID | shared centralized helper | real, generic editor (I.6A) | real | real | archive | no | not_applicable | none | omitted | none | unchanged |
| `clases` | yes | private | sourceId UUID | shared centralized helper | real, generic editor (I.6A) | real | real | archive | no | not_applicable | none | omitted | none | unchanged |
| `comunidad` | yes | private | sourceId UUID | shared centralized helper | real, generic editor (I.6A) | real | real | archive | no | not_applicable | none | omitted | none | unchanged |
| `mascotas_y_perdidos` | **fixed in I.8B — now discoverable.** Real tab added (`"mascotas"` in `MIS_ANUNCIOS_CATEGORY_KEYS`), `listingRowCategoryKey()` recognizes it, real owner-scoped rows already flowed through the existing unfiltered `fetchOwnerListingsForDashboard` query (same fact as Clases/Comunidad, I.6B) | private (corrected from I.8A's `unsupported` — real rows, real UUID, real public route now existed even then; I.8A's classification was the stale part, not the underlying facts) | sourceId UUID | shared centralized helper (unaffected) | **missing**, no safe editor exists yet — unchanged, correctly still absent (`categoryRouteRegistry.ts` `editRoute()` still returns `null`) | n/a | real (I.6B) | archive, via the same generic mechanism as Busco/Clases/Comunidad | no | not_applicable | none | omitted | none | Edit remains the one real, confirmed, unbuilt gap — reported here, not fabricated |
| `viajes` | yes, but via its **own dedicated `/dashboard/viajes` page, entirely bypassing the registry/resolver** (I.7A finding, confirmed again) | business (business lane, organizational) / private (private lane) | sourceId UUID (own `viajes_staged_listings` table, slug-keyed for public/edit/preview) | **fixed in I.8A**, same pattern as Empleos — real `ViajesStagedLifecycleStatus` enum now mapped truthfully | real, via the dedicated page's own hrefs, not through the registry | real, same | real (I.7A fix, `oferta/[slug]`) | publish/unpublish via the dedicated page | **no** — same reasoning as Rentas Negocio: adapter says `supportsBusinessHub: true`, resolver never emits a hub action | none live | none | omitted | no renewal path found | dedicated dashboard still bypasses the canonical registry/resolver entirely — architecture gap, not a truth gap; now feeds I.8A attention center |

## Work Package I.7A update log

- **Empleos — publish CTA reconciled.** The landing page's hero "Publish a job" button
  (`EmpleosLandingPageClient.tsx`) called the legacy `categoryStandardRoutes.categoryPublishPath("empleos")`
  builder (`/clasificados/publicar/empleos`), which only reaches the real application form via an
  extra (safe, tested) redirect hop. It now calls `EMPLEOS_PUBLISH_HUB_PATH` (`empleosLandingRoutes.ts`)
  directly — the same constant the registry's `applicationRoute` already used — removing the
  indirection. The redirect shim itself (`/clasificados/publicar/empleos/page.tsx`) is left in place
  as a compatibility path for any other still-uncorrected inbound link.
- **Empleos — existing-listing identity now fails closed.** `upsertEmpleosListingFromEnvelope()`
  (`empleosPublicListingsDbServer.ts`) previously treated a candidate `listingId` that was
  malformed, or well-formed but pointing at no existing row, the same as "no candidate at all" —
  silently minting/reusing an id and inserting under it. It now distinguishes the two: no
  `listingId` supplied at all still inserts normally (truly new application, unchanged); a
  supplied `listingId` that is not a valid UUID, or is valid but matches no row, now fails closed
  with the shared `quick_listing_existing_identity_invalid` code (reused from
  `quickListingIdempotency.ts`, the same constant I.6C introduced for Quick Clasificados) instead
  of inserting. Owner-mismatch (`forbidden`) and lane-mismatch (`lane_mismatch`) were already
  fail-closed and are unchanged. `app/api/clasificados/empleos/listings/route.ts` now maps the new
  code to `400`. No caller changes were needed for draft preservation — the application clients
  already only clear local state on a successful response.
- **Rentas — Edit corrected.** Both `rentas_negocio` and `rentas_privado` adapters declared
  `editRoute: () => null` despite a real, live, working edit entry point
  (`rentasDashboardEditHref()` in `LeonixRealEstateListingManageCard.tsx`, backed by a confirmed
  real API, `/api/clasificados/rentas/listing-edit`). Both adapters now mirror that exact href
  shape (`/clasificados/publicar/rentas/{negocio,privado}?edit=1&source=dashboard&mode=listing-edit&listingId=...&lane=...&lang=...&returnTo=...`,
  plus `leonixAdId` when known) instead of returning null — same bug class and fix pattern as the
  Restaurantes (I.5.7E) and En Venta/Busco/Clases/Comunidad (I.6A) Edit corrections.
- **Rentas — reuse-vs-insert query-error gap identified, deliberately NOT fixed here.** Audit
  confirmed `leonixPublishRealEstateListingCore.ts`'s pending-payment reuse check silently falls
  through to INSERT when the reuse lookup itself errors (the same "verification failure becomes a
  silent insert" bug class I.6C fixed for Quick Clasificados) — but that function is genuinely
  shared with Bienes Raíces (`category === "rentas" || (category === "bienes-raices" && sellerType
  === "business")` gates the exact same reuse block). Bienes Raíces is a locked system for this
  package. Fixing the query-error branch would necessarily change live Bienes Raíces publish
  behavior too, so this package leaves it untouched and records it here as a real, confirmed,
  unresolved gap rather than silently repairing it out of scope. See
  [Rentas duplicate-row protection gap](#rentas-duplicate-row-protection-gap).
- **Rentas — two-live-renderer / default-lane decision: OWNER DECISION REQUIRED, unchanged.** Two
  live public renderers exist for a Rentas row today (the dedicated `/clasificados/rentas/listing/{id}`
  canonical route, and the shared `/clasificados/anuncio/{id}` shell, deliberately kept as a
  compatibility fallback since Gate I.5.4D) with only the former sharing Preview's exact
  WYSIWYG contract. Deciding whether to retire/redirect the shell path, or formally adopt it, is a
  genuine product/architecture decision, not a code bug — not resolved here, consistent with the
  ledger's pre-existing "Rentas default-lane decision" entry in
  [Unresolved Route Debt](#unresolved-route-debt).
- **Viajes — `publicRoute()` corrected.** The registry's "two competing detail trees, confirmed
  ambiguity" framing (Gate I.5A) was re-audited and found stale:
  `/clasificados/viajes/negocio/[slug]` is dead, production-disabled demo-catalog code that never
  reads real data; `/clasificados/viajes/oferta/[slug]` is the one real, live, correctly-lane-aware
  public detail route, serving both the Negocios and Privado lanes from `viajes_staged_listings`,
  gated on `is_public = true`. `publicRoute()` now echoes a precomputed `identity.publicUrl`
  (same pattern already used by the Empleos adapter for the same slug-vs-UUID reason) instead of
  unconditionally returning null.
- **Viajes — `editRoute()`/`previewRoute()` deliberately left null.** Real, working, lane-specific
  edit/preview destinations do exist (`/publicar/viajes/{negocios,privado}?stagedId=...`,
  `/clasificados/viajes/preview/{negocios,privado}?stagedId=...`) — but no live code today
  constructs a `ListingIdentity` for the `viajes` pipeline carrying the lane needed to build them
  generically, and the real `/dashboard/viajes` page builds these hrefs itself, entirely bypassing
  this registry/`resolveDashboardActions` pipeline. Returning null here is the honest state, not a
  guess — see [Viajes registry/live-UI gap](#viajes-registrylive-ui-gap).

## Work Package I.6C update log

- **Unknown listing category now fails closed — corrected.** I.6B's `coerceCategoryKey()` last-
  resort fallback (any category value not in `CATEGORY_KEYS`, not `"bienes-raices"`, and not an En
  Venta slug) still silently mapped to `"en-venta"` — the exact same bug class as the Mascotas
  root cause, just for any *future or malformed* unmodeled category instead of a specific known
  one. **"Unknown categories fail closed" was not actually true after I.6B; it is TRUE only as of
  this package.** Fixed by adding `isRecognizedListingCategory()` in
  `app/(site)/clasificados/anuncio/[id]/page.tsx`, run before `mapDbListingRowToListing()` on
  every live-fetched row; a genuinely unrecognized category now takes the exact same fail-closed
  path already used for unpublished/removed/inactive rows (`setFetchedListing(undefined)`,
  rendering the existing truthful not-found state) instead of reaching `coerceCategoryKey`'s
  fallback at all. Every previously-supported category, including Mascotas y Perdidos, is
  unchanged — `isRecognizedListingCategory` mirrors the exact same set of values
  `coerceCategoryKey` maps to a real category.
- **Existing-listing identity verification failure no longer falls back to INSERT.** I.6B's
  `verifyQuickListingReusable` already fails closed and *reports* why (missing, invalid UUID,
  not-found, owner-mismatch, category-mismatch, query-error), but all four publishers (En Venta,
  Busco, Clases, Comunidad) still unconditionally fell back to a fresh INSERT on any verification
  failure — including invalid/unauthorized/wrong-category candidates, not just a genuinely absent
  one. That meant a failed *existing*-listing identity could silently become a *new* listing
  instead of a hard stop. Each publisher now branches three ways: no candidate id at all → INSERT
  (unchanged, truly-new behavior); a candidate id that verifies → UPDATE that exact row
  (unchanged); a candidate id that fails verification for any reason → fail closed, return the new
  deterministic `quick_listing_existing_identity_invalid` error
  (`quickListingExistingIdentityInvalidMessage()` in `quickListingIdempotency.ts`), never INSERT,
  never expose the raw Supabase/Postgres error (logged internally via
  `logQuickListingReuseFailure()` only). The local draft and the session-persisted candidate id are
  both left untouched on this path — the caller components already only clear/persist them on a
  successful publish, so no caller changes were needed. The user can still explicitly start a new
  listing through the existing start-over action; a failed identity check no longer does that for
  them silently.
- **Duplicate prevention claim corrected.** Still not perfect idempotency — see
  [Duplicate-Row Prevention Scope](#duplicate-row-prevention-scope), unchanged by this package.
  What changed here is narrower and orthogonal: ordinary retries of the same in-progress
  submission remain mitigated (I.6B), and now a *broken* existing-identity check is guaranteed to
  never silently create a second row either. The one remaining, explicitly-documented gap is still
  the true concurrent first-submit race, which requires server-side idempotency support/schema
  work out of scope here.

## Work Package I.6B update log

- **Mascotas y Perdidos public rendering — repaired.** Root cause (Gate I.6A finding, deepened):
  the shared multi-category shell's `CATEGORY_KEYS` allowlist
  (`app/(site)/clasificados/anuncio/[id]/page.tsx`) omitted `"mascotas-y-perdidos"`, silently
  coercing every real Mascotas listing to render as En Venta. Fixed by adding the category to the
  allowlist and adding a dedicated dispatch branch rendering a new, small, category-specific
  component (`MascotasPerdidosPublishedDetailPage.tsx`, built from this category's own
  `detail_pairs` contract — notice type, last-known location, contact — mirroring the same field
  layout as the existing Preview client for genuine WYSIWYG parity, not a copy of the En Venta
  renderer). The registry's `publicRoute` is now real (`/clasificados/anuncio/{id}`); `editRoute`
  remains intentionally null — public rendering being fixed does not by itself create a safe
  category-specific edit surface.
- **Every other shell-served category protected.** Regression-tested (`gate-i6b-*`) at the source
  level (the shell cannot be imported into a Node test — it statically imports a `.png` asset,
  same DOM-bound-file limitation as elsewhere in this repo's test convention) to confirm every
  previously-accepted category remains in the allowlist unchanged, every category's own dispatch
  branch/hook is untouched, and the last-resort `"en-venta"` fallback is still scoped only to
  genuinely unmodeled category values, not widened.
- **Duplicate-row prevention added for En Venta, Busco, Clases, and Comunidad.** A new small
  shared helper (`app/(site)/clasificados/lib/quickListingIdempotency.ts`) verifies — server-side,
  via the same RLS-enforced `listings` table every publisher already uses — that a session-
  persisted candidate listing UUID genuinely belongs to the current owner and expected category
  before a publisher UPDATEs it instead of inserting a new row. At the time of this package, any
  verification failure (missing, invalid, not-found, owner-mismatch, category-mismatch,
  query-error) fell back to the original insert-only behavior — **corrected in Work Package I.6C**:
  only a genuinely absent candidate (no existing-listing intention at all) still falls back to
  INSERT; a present-but-failed-verification candidate now fails closed instead, see the
  [I.6C update log](#work-package-i6c-update-log). See
  [Duplicate-Row Prevention Scope](#duplicate-row-prevention-scope) for exactly what window this
  protects and the remaining, explicitly-documented race.
- **Clases/Comunidad dashboard discovery corrected.** `fetchOwnerListingsForDashboard` was
  confirmed (direct inspection) to query by `owner_id` only, with no category filter — Clases/
  Comunidad rows were already being fetched, and the existing generic Mis Anuncios card already
  renders working View public/Edit/Results/Archive actions for them. Only the stale `ready: false`
  / `manageHref: () => null` declarations in `dashboardMisAnunciosCategories.ts` were wrong; both
  now mirror the already-working `busco` entry's exact shape. No new dashboard architecture was
  built. The category route **registry's** `dashboardRoute` field remains `null` for both — that
  field specifically means "no dedicated category tab," which is still accurate; the generic
  cross-category workspace is a separate, already-existing system.

## Duplicate-row prevention scope

**What is protected:** the exact scenario the I.6A audit found — a retry or refresh of the *same
in-progress submission* (before it fully completes) now updates the row that submission already
created, instead of inserting a second one. The candidate UUID is written to a plan/category-
scoped sessionStorage key as soon as the row id is known (before the slower photo-upload step),
verified server-side before every reuse, and cleared once the submission fully completes.

**What is NOT claimed:** perfect idempotency. Two truly concurrent submit clicks that both fire
before either request's row id round-trips back to the browser can still both reach the insert
branch and create two rows — the pre-existing `disabled={busy}` button guard narrows this window
but does not eliminate it, and closing it fully would require either a server-side idempotency key
(not present in the current schema, and adding one is out of scope — no migrations were made) or
a more invasive request-serialization change. This is the one remaining race condition, stated
plainly rather than glossed over.

The mechanism deliberately does **not** persist across a later, unrelated visit to the same
publish form — once cleared on success, a genuinely new submission starts fresh. Editing an
already-published listing later is the dashboard's generic `/editar` page's job (Gate I.6A), not
this mechanism's.

## Work Package I.5.8 update log

- **Empleos results duplication — resolved.** `buildEmpleosResultadosUrl` (the shared builder
  behind ~30 live public call sites) and `EMPLEOS_RESULTS_PATH` now both generate
  `/clasificados/empleos/resultados`, matching the registry. The legacy `/results` URL remains
  live as an unchanged compatibility wrapper page.
- **Autos legacy publish-map entry — correction to the prior finding, not a fix.** Direct
  re-verification proved `categoryPublishPath("autos")`'s value (`/clasificados/publicar/autos`)
  is a real, compiled route with a confirmed live caller
  (`app/(site)/negocios-locales/_lib/negociosLocalesLanes.ts`) — it was **not** stale. Left
  completely untouched.
- **Viajes legacy publish-map entry — resolved.** Confirmed the mapped folder does not exist in
  the compiled route manifest and has zero live callers, then corrected the value to match the
  real, registry-declared `applicationRoute` (`/publicar/viajes`). Zero live behavior change,
  since nothing called the old value.
- **Bienes/Autos parent-child action protection — regression coverage added**, exercised through
  the actual `resolveDashboardActions` resolver (not just adapter internals or comments).

## Work Package I.6A update log

- **En Venta, Busco, Clases, Comunidad — Edit corrected.** Same bug class as the Restaurantes
  fix (Gate I.5.7E): the registry declared `editRoute: () => null` for all four, but a real,
  generic, owner-verified, UPDATE-by-UUID edit page
  (`app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx`) already existed and was already
  live-wired in the UI for every `listings`-table category. All four now resolve to
  `/dashboard/mis-anuncios/{id}/editar?lang=`, matching the exact, confirmed real query shape
  (no invented params). The generic editor covers title/price/description/photos/status only —
  not each category's full field set.
- **Duplicate-row risk documented, not repaired.** For all four categories, re-running the
  category's own publish/quick-form flow always INSERTs a fresh row (no update-if-exists check
  against a canonical listing ID) — there is no way to target the category's own creation UI at
  an already-published listing, only the generic editor above. This is a real, structural risk on
  double-submit or "go back and republish," documented in each adapter's `knownLimitations`, not
  fixed in this package (would require new product UI, out of a route-closure package's scope).
- **Mascotas y Perdidos public-route root cause identified, deliberately left unsafe-to-flip.**
  Deepened the prior "confirmed gap" finding: result cards do navigate to the shared
  `/clasificados/anuncio/{id}` shell, and the shell does fetch the row — but its category
  allowlist (`CATEGORY_KEYS` in `app/(site)/clasificados/anuncio/[id]/page.tsx`) does not include
  `"mascotas-y-perdidos"`, so `coerceCategoryKey()` silently rewrites the row to `"en-venta"` and
  renders the wrong layout (wrong cross-links, no lost/found/adoption badge, price shown
  incorrectly, notice-type/location shown only as raw generic rows). `publicRoute()` remains
  `null` on purpose — pointing it at a URL that mis-renders would be worse than the honest gap.
  Fixing the shell is out of scope for a Quick-Clasificados-only package, since that same shared
  file also serves Rentas/Bienes Raíces/Autos/Empleos/Servicios (all locked for this package).
  `gate-i6a-quick-clasificados-lifecycle-selftest.ts` now source-level-asserts the allowlist gap
  is still present, closing the "invisible to the test suite" coverage gap Gate I.5.7F left open.
- **`/publicar/community/` "separate tree" concern retracted.** Direct inspection confirms it is
  not a standalone routable page at all — it is purely the shared implementation
  (`CommunityQuickApplicationClient({kind})`) both `/publicar/clases/quick` and
  `/publicar/comunidad/quick` import from. Not a duplicate product, not a fork.

## Runtime authority

Two route systems are simultaneously live today, on **non-overlapping runtime surfaces**
(confirmed in Gate I.5.7D-R):

- **`app/lib/listingIdentity/categoryRouteRegistry.ts`** ("the registry") — serves the `/publicar`
  gateway resolver, the Clasificados landing hub's per-category cards, and — transitively, through
  `dashboardActionResolver.ts` — every dashboard action button (Edit, Preview, View public,
  Analytics, secondary-manage links).
- **`app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes.ts`** ("the legacy
  builder") — serves each category's own landing-page default publish CTA (only 2 real call
  sites: Empleos' hero CTA, and the generic `CategoryStandardLandingPage.tsx` shared template) and
  the majority of results/search/browse link generation across Busco/Clases/Comunidad/Mascotas/
  Servicios/generic components.

Neither system imports or delegates to the other. Preview and Edit-URL generation for BR
Negocio/Autos Negocios inventory children is **not owned by either system** — see
[External Safety Protections](#external-safety-protections).

## Confirmed global contracts

Proven true across the catalog, enforced by the self-test:

- Every adapter's `sourceId` is a real database UUID, never a slug or draft ID.
- Unsupported route capabilities fail closed to `null` — never a guessed or fabricated URL.
- ES/EN language is appended consistently (`&lang=es|en`), defaulting to `es`.
- Restaurantes existing-listing **Edit** is now supported (Gate I.5.7E) — `mode=listing-edit`,
  distinct from the coupon-only `mode=coupon-edit` sub-flow.
- Bienes Raíces (both lanes) canonical results route is `/clasificados/bienes-raices/resultados`
  (Gate I.5.7C) — the shared `BR_RESULTS` constant no longer generates the legacy `/results` slug.
- All dashboard actions require server-verified ownership (`ownerVerified`) before any route is
  resolved — the resolver's only hard rejection; every other omission is per-action.
- Exactly two pipelines (`bienes_raices_negocio`, `autos_negocios`) declare parent/child inventory
  support; exactly two (`restaurantes`, `servicios`) declare the coupon/offer add-on sub-flow.
  `autos_privado` and `bienes_raices_privado` are registered as separate adapters specifically so
  their exclusion from parent/child behavior is explicit, not implied by omission.

## Category adapters

Differences that are genuine, evidence-backed product behavior — not accidental duplication:

- **Servicios** publish is a real 2-hop funnel: a paywall/checkpoint page
  (`/clasificados/publicar/servicios/checkpoint`) precedes the deep application form
  (`/publicar/servicios`). Neither route system alone models this; both are correct for their hop.
- **Bienes/Autos Negocio vs Privado** — separate adapters per lane; Negocio carries
  `supportsParentChildInventory: true` and an inventory-pack `secondaryManageRoute`, Privado does
  not.
- **En Venta** — application route is a documented temporary exception (no modern `/publicar/`
  hub exists). Edit is now the generic Mis Anuncios editor (I.6A) — the category's own Pro/Free
  form has no "edit existing" mode.
- **Ofertas Locales** — has its own dedicated `/dashboard/ofertas-locales` surface, deliberately
  excluded from Mis Anuncios. Cupones is confirmed **not** a separate pipeline — `/cupones` renders
  the identical component with `surface="cupones"`.
- **Clases / Comunidad** — share one implementation (`CommunityQuickApplicationClient({kind})`,
  confirmed by direct inspection, not a fork). `dashboardRoute()` intentionally returns `null` —
  confirmed `ready:false` in the live Mis Anuncios config, meaning no *dedicated category tab*
  exists — but a generic, non-category-gated per-listing workspace/editor is reachable once the
  owner has the listing's UUID (I.6A).
- **Autos Negocios Preview** is genuinely bound to a child vehicle's own `sourceId` (unlike Edit)
  — `AutosNegociosPreviewClient` fetches and hydrates by whatever ID it's given.

## External safety protections

**Neither route system provides parent/child edit safety on its own.** The self-test proves this
directly: calling `BIENES_RAICES_NEGOCIO_ADAPTER.editRoute()` or `AUTOS_NEGOCIOS_ADAPTER.editRoute()`
with a child identity (populated `parentSourceId`) still substitutes the **parent's** ID —
unconditionally, with no internal role check. The real protection is external and lives in two
independent layers that must both be bypassed for the Gate I.5.7A.1-class defect to reappear:

1. `dashboardActionResolver.ts` — a single shared line excludes `edit` (and, for Bienes only,
   `preview`) for a `child` role on exactly `bienes_raices_negocio` and `autos_negocios`.
2. `LeonixRealEstateListingManageCard.tsx`'s `isBrNegocioMainRow` gate (Gate I.5.7A.1) and the
   analogous check in `AutosDealerInventoryDashboardSection.tsx` — independently refuse to even
   attempt resolving an edit/preview href for non-main rows.

Autos' inventory-pack `secondaryManageRoute` additionally carries a confirmed **asymmetry**: Bienes
gates it on an active entitlement (`inventoryPackActive`); Autos does not (renders unconditionally
for any parent) — an existing live behavior difference, not something introduced here.

## Unresolved route debt

| Item | Current evidence |
|---|---|
| ~~Empleos results duplication~~ | **Resolved in Work Package I.5.8.** `buildEmpleosResultadosUrl` and `EMPLEOS_RESULTS_PATH` now both generate `/clasificados/empleos/resultados`. Legacy `/results` remains a live compatibility wrapper. |
| ~~Autos stale publish-map entry~~ | **Not actually stale — corrected finding, not a fix.** Gate I.5.7D-R's original claim was wrong: `categoryPublishPath("autos")` → `/clasificados/publicar/autos` is a real, compiled route with a confirmed live caller (`negociosLocalesLanes.ts`). Left untouched in Work Package I.5.8 after re-verification. |
| ~~Viajes stale publish-map entry~~ | **Resolved in Work Package I.5.8.** `categoryPublishPath("viajes")` confirmed to map to a nonexistent folder with zero live callers, then corrected to the real `applicationRoute` (`/publicar/viajes`). Zero live behavior change. |
| **Bienes/Autos parent-child protection lives outside the registry** | Still true — see [External Safety Protections](#external-safety-protections). Work Package I.5.8 added executable regression coverage for this (`gate-i5-8-bienes-autos-parent-child-action-protection-selftest.ts`) but did not change the architecture itself — a structural risk remains if any future caller invokes `adapter.editRoute()` directly without the external gate. |
| ~~Autos child-action regression coverage gap~~ | **Addressed in Work Package I.5.8.** `gate-i5-8-bienes-autos-parent-child-action-protection-selftest.ts` now exercises the real `resolveDashboardActions()` resolver for both Bienes and Autos Negocio parent/child identities. |
| **Rentas default-lane decision** | **OWNER DECISION REQUIRED, unchanged as of I.7A.** Both lanes share one `hubRoute` (`/clasificados/publicar/rentas`) distinct from either lane's own `applicationRoute`. The dashboard's default Rentas publish CTA goes straight to Privado, skipping the hub chooser — a product decision, not a bug, but undocumented in the registry itself. I.7A re-confirmed this is genuinely a product choice (which lane/renderer is canonical for public Rentas at launch), not a code bug, and left it untouched. |
| **Missing quick-category test coverage** | Before Gate I.5.7F, Ofertas Locales, Cupones, Comida Local, and each quick-listing category (Busco/Clases/Comunidad/Mascotas/Viajes) had no dedicated route-contract test, only generic pass-through coverage via `gate-i5-1`. The matrix now covers all 17 pipelines uniformly. |
| ~~En Venta / Busco / Clases / Comunidad missing Edit~~ | **Resolved in Work Package I.6A.** All four now resolve to the real, generic, owner-verified `/dashboard/mis-anuncios/{id}/editar` page — same bug class and fix pattern as the Restaurantes correction (I.5.7E). |
| ~~En Venta / Busco / Clases / Comunidad duplicate-row risk on republish~~ | **Mitigated in Work Package I.6B, not eliminated.** Each publisher now verifies and reuses a session-persisted, owner+category-checked canonical UUID instead of always inserting. This closes the in-flight retry/refresh window. It does NOT protect a later, unrelated visit to the same form (by design — that's the generic editor's job) or two truly concurrent submit clicks racing before either round-trips a row id (documented, not solved — see [Duplicate-Row Prevention Scope](#duplicate-row-prevention-scope)). |
| ~~Mascotas public-route root cause~~ | **Repaired in Work Package I.6B.** The shared `anuncio/[id]` shell's `CATEGORY_KEYS` allowlist now includes `mascotas-y-perdidos`, and a dedicated `MascotasPerdidosPublishedDetailPage` component renders it correctly. `publicRoute()` is now real. Editing remains unsupported (no safe category-specific editor exists yet). |
| **Future shared facade / legacy-builder retirement** | Still explicitly deferred — Gate I.5.7D-R's Table G places this as the last wave (Wave 8/9), after the smaller corrections land and prove the pattern repeatedly. Not attempted here. |
| ~~Empleos publish-CTA slug disagreement~~ | **Resolved in Work Package I.7A.** `EmpleosLandingPageClient.tsx`'s hero CTA now calls the canonical `EMPLEOS_PUBLISH_HUB_PATH` (`/publicar/empleos`) directly instead of the legacy `categoryStandardRoutes` builder's `/clasificados/publicar/empleos`. The legacy value still works via a tested, single-hop redirect shim, kept for any other still-uncorrected inbound link. |
| ~~Empleos existing-identity duplicate-row risk~~ | **Fixed in Work Package I.7A.** `upsertEmpleosListingFromEnvelope()` now fails closed (shared `quick_listing_existing_identity_invalid` code) on an invalid or not-found candidate `listingId`, instead of silently inserting under it. Owner/lane mismatch were already fail-closed. |
| ~~Rentas missing Edit~~ | **Resolved in Work Package I.7A.** Both `rentas_negocio`/`rentas_privado` adapters now resolve `editRoute()` to the real, live href shape already used by `LeonixRealEstateListingManageCard.tsx`'s `rentasDashboardEditHref()`, instead of returning null. |
| **Rentas duplicate-row protection gap** | **Confirmed, deliberately NOT fixed in I.7A.** `leonixPublishRealEstateListingCore.ts`'s pending-payment reuse-vs-insert check silently falls through to INSERT if the reuse lookup query itself errors — the same bug class I.6C fixed for Quick Clasificados. Left untouched because this function is genuinely shared with the locked Bienes Raíces pipeline (the same reuse block runs for `category === "bienes-raices" && sellerType === "business"`); a scoped Rentas-only fix isn't possible without touching locked BR publish behavior. Also: outside `activationMode === "pending_payment"`, Rentas has no reuse-vs-insert protection of any kind — every immediate/free-activation publish always inserts. Both are real, evidence-backed gaps, not resolved here. |
| ~~Viajes public-route "confirmed ambiguity"~~ | **Corrected finding in Work Package I.7A, not merely resolved — the prior finding itself was stale.** Direct re-inspection found `/clasificados/viajes/negocio/[slug]` is dead, production-disabled demo code (never reads real data), while `/clasificados/viajes/oferta/[slug]` is the one real, live, lane-aware public detail route. `publicRoute()` now echoes `identity.publicUrl` (same pattern as Empleos) instead of unconditionally returning null. |
| **Viajes registry/live-UI gap** | Still true as of I.7A. The real, working Viajes dashboard experience (`/dashboard/viajes`, edit/preview/view-public all functioning) is delivered entirely by that page's own bespoke, hand-written route-building logic — it never constructs a `ListingIdentity` or calls `resolveDashboardActions()`/the registry. `editRoute()`/`previewRoute()` remain honestly null here rather than fabricated, since this registry cannot currently determine which lane (negocios/privado) a given identity used. |

## Full pipeline matrix

Classification legend: `supported` · `intentionally_unsupported` (confirmed absent by design) ·
`category_specific` (adapter behavior, not a gap) · `protected_externally` (resolves a value here,
but real safety is enforced one layer above) · `missing` (confirmed gap or stale value) ·
`not_applicable`.

| Pipeline | Family | Application | Edit | Preview | Public | Results | Dashboard | Secondary manage | Parent/child |
|---|---|---|---|---|---|---|---|---|---|
| `restaurantes` | Negocios | supported | **supported** (I.5.7E) | intentionally_unsupported | category_specific | supported | supported | supported (coupon-edit) | no |
| `servicios` | Negocios | supported (2-hop) | supported | supported | category_specific | supported | supported | supported (offers-edit) | no |
| `bienes_raices_negocio` | Negocios | supported | protected_externally | protected_externally | supported | **supported `/resultados`** (I.5.7C) | supported | category_specific (inventory) | **yes** |
| `bienes_raices_privado` | Clasificados | supported | missing | supported | supported | supported (shared) | supported | not_applicable | no |
| `autos_negocios` | Negocios | supported | protected_externally | supported (child-bound) | supported | supported | supported | category_specific (inventory, ungated) | **yes** |
| `autos_privado` | Clasificados | supported | supported | supported | supported | supported | supported | not_applicable | no |
| `rentas_negocio` | Negocios | supported | **supported** (I.7A) | supported | supported | stale (`/results`) | supported | not_applicable | no |
| `rentas_privado` | Clasificados | supported | **supported** (I.7A) | supported | supported | stale (`/results`) | supported | not_applicable | no |
| `empleos` | Clasificados | **supported** (I.7A, CTA fixed) | supported | intentionally_unsupported (lane-ambiguous) | category_specific | **supported `/resultados`** (I.5.8) | supported | not_applicable | no |
| `en_venta` | Clasificados | category_specific (temp exception) | **supported** (I.6A, generic editor) | supported | supported | supported | supported | not_applicable | no |
| `comida_local` | Negocios | supported | missing | supported | category_specific | stale (dupes entry) | supported | not_applicable | no |
| `ofertas_locales` | Negocios | supported | supported | supported | category_specific | supported | supported (dedicated) | not_applicable | no |
| `busco` | Clasificados | supported | **supported** (I.6A, generic editor) | supported | supported | supported | supported | not_applicable | no |
| `clases` | Clasificados | supported | **supported** (I.6A, generic editor) | supported | supported | supported | intentionally_unsupported (no dedicated tab) | not_applicable | no |
| `comunidad` | Clasificados | supported | **supported** (I.6A, generic editor) | supported | supported | supported | intentionally_unsupported (no dedicated tab) | not_applicable | no |
| `mascotas_y_perdidos` | Clasificados | supported | missing (no safe editor) | supported | **supported** (I.6B, shell allowlist fixed) | supported | intentionally_unsupported (no dedicated *registry* tab — same meaning as Clases/Comunidad above; **now a real generic Mis Anuncios tab as of I.8B**, same non-dedicated pattern) | not_applicable | no |
| `viajes` | Negocios | supported | missing (registry can't determine lane; real route lives outside the registry — see notes) | missing (same reasoning) | **category_specific** (I.7A, echoes `publicUrl`; prior "ambiguous trees" finding was stale) | supported | supported | not_applicable | no |

`cupones` is intentionally absent — confirmed to be a filtered view (`surface="cupones"`) over
`ofertas_locales`, not its own pipeline.

## Identity, ES/EN, and per-pipeline notes

| Pipeline | Identity authority | ES/EN | Known limitation | Recommended future gate |
|---|---|---|---|---|
| restaurantes | `sourceId` | full | Preview route unconfirmed | Confirm/build Preview route |
| servicios | `sourceId` | full | Save-by-slug requires primed `existingPublicSlug` | Audit all save call sites |
| bienes_raices_negocio | `sourceId`, parent-substituted for edit/preview via `identityListingIdForEdit` | full | Child protection external; 4-child hydration cap | Formalize protection contract |
| bienes_raices_privado | `sourceId` | full | No confirmed distinct edit route | Confirm/build edit route |
| autos_negocios | `sourceId` (preview child-bound; edit parent-substituted) | full | No per-child edit UI; inventory limit unenforced | Dedicated child-action regression gate |
| autos_privado | `sourceId` | full | No exported href-builder constant (shape reproduced) | Export a real constant |
| rentas_negocio/privado | `sourceId` | full | **Edit resolved (I.7A)** — mirrors the real `rentasDashboardEditHref()` shape. Reuse-vs-insert query-error-falls-to-INSERT gap confirmed but deliberately not fixed (shared with locked Bienes Raíces publish core); no reuse protection at all outside `pending_payment` activation. Default-lane/two-renderer question remains OWNER DECISION REQUIRED. | Server-side idempotency key for the shared BR/Rentas publish core (needs schema work, out of scope); resolve default-lane product decision |
| empleos | `sourceId` | full | **Publish-CTA slug disagreement resolved (I.7A)** — landing CTA now calls the canonical hub directly. Results duplication resolved (I.5.8). Existing-identity duplicate-row risk fixed (I.7A) — invalid/not-found candidate ids now fail closed instead of silently inserting. Lane-ambiguous preview remains intentionally unsupported. | Confirm a lane-resolvable identity so Preview could someday be generically resolved |
| en_venta | `sourceId` | full | No modern publish hub; Storefront lane unrepresented; Edit resolved (I.6A) but generic-only; republish duplicate-row risk mitigated, not eliminated (I.6B) | Build modern hub; build prefill-from-existing edit |
| comida_local | `sourceId` | full | Results route unconfirmed distinct from landing | Confirm/build results route |
| ofertas_locales | `sourceId` | full | No confirmed payment/checkout route | Confirm monetization contract |
| busco | `sourceId` | full | Edit resolved (I.6A, generic editor); legacy hub CTA disagreement; republish duplicate-row risk mitigated, not eliminated (I.6B) | Fix legacy CTA; build prefill-from-existing edit |
| clases/comunidad | `sourceId` | full | Generic dashboard discovery now exposed (I.6B) — registry `dashboardRoute` still correctly null (no dedicated tab); Edit resolved (I.6A, generic editor); republish duplicate-row risk mitigated, not eliminated (I.6B); shared implementation confirmed intentional (not an unconfirmed fork) | Build prefill-from-existing edit if ever prioritized |
| mascotas_y_perdidos | `sourceId` | full | **Public detail repaired (I.6B)** — shared shell allowlist fixed, dedicated renderer added. **Now discoverable in Mis Anuncios (I.8B)** — real tab, classified private, View public/Archive available. Edit remains unsupported (no safe category-specific editor exists). | Build a safe category-specific edit surface if ever prioritized |
| viajes | `sourceId` (staged rows are actually slug-keyed; public detail is reached by slug, not sourceId) | full | **Public-route "ambiguity" corrected (I.7A)** — the prior finding was stale; `/clasificados/viajes/oferta/[slug]` is the one real live route, now echoed via `identity.publicUrl`. Edit/Preview remain honestly null in the registry — the real, working `/dashboard/viajes` page builds those hrefs itself and never goes through this registry/resolver at all. | Wire a lane-carrying Viajes `ListingIdentity` construction path if this pipeline is ever migrated onto the shared resolver |

---

*Generated for Gate I.5.7F. Do not treat this document as evidence that the two route systems have
been unified — they have not. See [Unresolved Route Debt](#unresolved-route-debt) for what remains.*
