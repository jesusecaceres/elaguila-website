# OWNER COMMAND CENTER — CABLE MAP (Business Home bridge)

**Canonical Master Bible**: `docs/owner-command-center/LEONIX_OWNER_COMMAND_CENTER_MASTER_WIRING_AND_CONSTRUCTION_BIBLE_2026-09-09.md`
— controlling architecture/doctrine document and current-state source of truth.

| SYSTEM | OWNER_PURPOSE | CANONICAL_ROUTE | COMPONENT | API | DATA SOURCE | CANONICAL BUSINESS ID | CTA/CONSUMER | STATUS |
|---|---|---|---|---|---|---|---|---|
| Business identity resolution | Which business am I looking at? | `/dashboard/business-tools` | `page.tsx` → `fetchMyBusinesses()` | `GET /api/dashboard/business/diy-concierge/my-businesses` | `business_memberships` + `businesses` (RLS, exact user) | `public.businesses.id` | first active membership chosen as canonical | LIVE |
| Business Home composition | Everything below | `/dashboard/business-tools` | `BusinessConciergeOwnerHome.tsx` | `GET /api/dashboard/business/home?businessId=` | `resolveBusinessHomeAccess()` gate, then N owner-safe repositories | `public.businesses.id`, exact-match membership | page load | LIVE |
| Next Right Move | What matters now | same | `ModuleCard` (NRM) | same (whatMattersNow) | `stewardship/repository.ts` `getCurrentRecommendation` | same | owner reads only | LIVE |
| Needs Your Attention | What matters now | same | `ModuleCard` (attention) | same (needsAttention) | `advisor/repository.ts` `listActiveSignals` | same | owner reads only | LIVE |
| Business Health | Business health | same | health section | same (businessHealth) | `healthMap/repository.ts` latest completed run | same | owner reads only | LIVE |
| Action Plan | Action plan | same | action section | same (actionPlan) | `diyConcierge/repository.ts` `listActionsForBusiness` | same | owner reads only | LIVE |
| What Leonix Understands | Living book counts | same | understand section | same (whatLeonixUnderstands) | `livingBook/repository.ts` facts+unknowns | same | owner reads only | LIVE |
| Work With Leonix | Approvals/service requests/proposals | same | work-with-leonix section | same (workWithLeonix) | `diyConcierge/repository.ts` approvals+service requests, `proposals/repository.ts` | same | owner reads only | LIVE |
| Progress/Results | Outcomes | same | progress section | same (progress) | `outcomes/repository.ts` `listBusinessOutcomes` | same | owner reads only | LIVE |
| Assistant | Assistant readiness | same | assistant section | same (assistant) | `assistant/repository.ts` `listThreadsForBusiness` | same | rendered only when `available===true` | LIVE |
| Learning | Need→lesson mapping | same | (omitted) | same (`learning: null`) | none — no mapping module exists | n/a | intentionally not rendered | HONESTLY_UNAVAILABLE |
| Per-listing coupons/offers | Commercial capability truth | same | capabilities section | `/api/dashboard/listing-package-entitlements` | pre-existing, unrelated to Concierge bridge | listing id | preserved unchanged | LIVE (pre-existing) |

## Ported files (verbatim from Concierge SHA `dbfa1fc3ba886e60dfe58087fd9e8653b9484920`)

50 files under `app/lib/business/**` (advisor, assistant, businessHome, diyConcierge, healthMap,
livingBook, outcomes, proposals, stewardship, repositories, supabaseUserClient, featureFlagLogic,
types) + `app/api/dashboard/business/home/route.ts` + `app/api/dashboard/business/diy-concierge/
my-businesses/route.ts`. Full list in git: `git diff --stat 4cdbfb3a..HEAD -- app/lib/business/
app/api/dashboard/business/`.

## Owner Attention Truth Gate (2026-09-09, second pass)

Canonical contract: `app/(site)/dashboard/lib/ownerAttentionModel.ts` — `OwnerAttentionItem`,
`mapDerivedFeedItemToAttention()`, `mapAdvisorSignalToAttention()`, `sortOwnerAttentionItems()`,
`dedupeOwnerAttentionItems()`, `buildAccountAttentionItems()`. Shared rendering:
`app/(site)/dashboard/components/OwnerAttentionItemCard.tsx`.

| ATTENTION SOURCE | REAL TABLE/RESOLVER | CANONICAL TYPE | PROVENANCE | CONSUMER | CTA DESTINATION |
|---|---|---|---|---|---|
| profile_city | `profiles.home_city` | derived feed → attention item | PROVEN | `/dashboard` OwnerNeedsAttention | `/dashboard/perfil` (exists) |
| inbox | `messages` (read_at IS NULL count) | derived feed → attention item | PROVEN | `/dashboard` | `/dashboard/mensajes` (exists) |
| draft | `listings` (is_published=false/status=draft) | derived feed → attention item | PROVEN | `/dashboard` | `/dashboard/drafts` (exists) |
| moderation | `listings.status` (pending/flagged) + **new**: owner-safe projection of `listing_moderation_reviews` | derived feed → attention item | PROVEN when a review row exists, else honest PARTIAL | `/dashboard` | `/dashboard/mis-anuncios/[id]` (exists) |
| expire_visibility | `listings.republished_at` (computed window) | derived feed → attention item | PROVEN (real end date in evidenceSummary) | `/dashboard` | `/dashboard/mis-anuncios/[id]` (exists) |
| expire_listing | `listings.expires_at` | derived feed → attention item | PROVEN (real date) | `/dashboard` | `/dashboard/mis-anuncios/[id]` (exists) |
| low_views | real analytics summary (`fetchDashboardAnalyticsSummary`) | derived feed → attention item | PROVEN | `/dashboard` | `/dashboard/mis-anuncios/[id]` (exists) |
| payment_attention | canonical `resolveCommercialStateBadges()` over real subscription state | derived feed → attention item | PROVEN (real badge key in evidenceSummary) | `/dashboard` | `/dashboard/mis-anuncios?cat=` (exists) |
| Advisor signals (9 types) | `app/lib/business/advisor/repository.ts` `listActiveSignals()` | `mapAdvisorSignalToAttention()` | PROVEN (deterministic, evidence-backed by Advisor doctrine) | `/dashboard/business-tools` | `/dashboard/business-tools` (same page — no dedicated per-signal route exists yet) |

### New owner-safe evidence endpoint

`POST /api/dashboard/listing-moderation-reasons` — projects `decision`, `reason_category`,
`reason_text`, `reviewed_at` from `public.listing_moderation_reviews` (RLS-enabled, no policies —
admin/service-role only by design) after re-verifying ownership server-side via the existing
`resolveOwnedListingIdentityKeys()` helper (same ownership pattern as
`listing-package-entitlements/route.ts`). Never returns `raw_input`, `raw_result`, `model`,
`confidence`, `reviewed_by`, or `error_message`.

### Deduplication

Derived-feed items and Advisor signals live in disjoint id namespaces (`df:*` / `adv:*`) so no
cross-source collision is possible; `dedupeOwnerAttentionItems()` is a defensive single choke
point if a future source ever reuses an id. No duplicate underlying conditions were found in the
existing sources this pass (each kind/signalType represents one condition, one persisted fact).

### CTA trace result

All 9 derived-feed and 1 (shared) Advisor-signal destinations point to real, existing owner
routes (`/dashboard/perfil`, `/dashboard/mensajes`, `/dashboard/drafts`,
`/dashboard/mis-anuncios/[id]`, `/dashboard/mis-anuncios`, `/dashboard/business-tools`) — verified
present in the route tree. No dead/wrong destination found; no repair needed.

## Category Capability + Commercial Entitlement Gate (2026-09-09, third pass — verification only, no source changes)

Canonical sources traced and confirmed consistent with the Master Bible's pricing/capacity truth
(§12, §14, §18) and with each other — no drift found, no repair required:

| Truth | Canonical source | Cross-checked against | Result |
|---|---|---|---|
| Autos Dealer capacity 10 base | `autosDealerInventoryPolicy.ts` `STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT=10` | `publishCheckoutCheckpoint.ts` `AUTOS_DEALER_BASE_INCLUDED_VEHICLES=10` | MATCH |
| Autos Dealer capacity +10 pack = 20 total | `BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT` = `AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT` | `publishCheckoutCheckpoint.ts` (10+10) | MATCH — rendered live in `AutosDealerInventoryDashboardSection.tsx` ("Inventario activo X/Y", "Espacios restantes") |
| BR Negocio capacity 1 base +3 pack = 4 total | `leonixBrPropertyInventoryPolicy.ts` `computeBrPropertyInventoryCounts()` — aliases of `publishCheckoutCheckpoint.ts` `BR_BASE_INCLUDED_PROPERTIES=1` / `BR_INVENTORY_PACK_MAX_CHILDREN=3` (comment: "these three symbols are aliases of the single authoritative source... must never re-define its own independent property-count truth again") | `publishCheckoutCheckpoint.ts` | MATCH — rendered live in `BrPropertyInventoryDashboardSection.tsx`, wired into `dashboard/mis-anuncios/page.tsx` |
| Coupons/offers shared capability | `dashboardHasCapabilityForKey(entitlementBadges, [...], "coupons_offers")` | Used identically in `dashboard/servicios/page.tsx:516` and `dashboard/restaurantes/page.tsx:404`, both reading the same `resolveBusinessToolsAccess()` → `categoryCommercialPlanPolicy.ts` `CATEGORY_BASE_PACKAGE_KEY`/`CATEGORY_ADDON_PACKAGE_KEY` (restaurantes/servicios only) | MATCH — confirms Master Bible §12's "already repaired... same shared pattern" claim holds in current source |
| Feria excluded from Applications | `dashboard/empleos/[listingId]/page.tsx:239` `supportsApplications = row.lane !== "feria" && isLiveCapability(...)` | Master Bible §12 "Feria should not inherit Applications" | MATCH — honest `feriaNote` shown instead |
| Subscription-category scope (4 categories only) | `derivedDashboardFeed.ts` payment_attention scope (Servicios/Restaurantes/Autos Dealer parent/BR Negocio) | `categoryCommercialPlanPolicy.ts` `CATEGORY_BASE_PACKAGE_KEY` (servicios/restaurantes only for coupons) + registry `commercial.entitlement:"supported"` rows (servicios/restaurantes/autos-negocios/bienes-raices-negocio) | MATCH — flat fixed-term categories (Autos Privado, BR Privado, Rentas, Empleos, Clases, En Venta) correctly have no subscription-bundle commercial badge; they are one-time/fixed-term listing fees, not package entitlement bundles |

### Duplicated allowlists checked for drift — none found

- `listing-package-entitlements/route.ts` `CAPABILITY_CATEGORIES` vs `enable-included-capability/route.ts` `SUPPORTED_CATEGORIES` — both `{restaurantes, servicios}`, and the real security decision lives in `categoryCommercialPlanPolicy.ts`'s `CATEGORY_BASE_PACKAGE_KEY` regardless of either allowlist (both routes end up gated by that single source even if their local pre-check allowlist were removed). Currently in sync — soft duplication, not a live defect.
- `packageEntitlements.ts` vs `printDigitalVisibilityRank.ts` — both define identical local `NOT_CLIENT_READY`/`SEPARATE_MODEL`/V1-category constants (`{servicios, restaurantes, autos, bienes-raices, rentas}`). Currently in sync — soft duplication, not a live defect.

### BUILT_NOT_WIRED found (deferred — not repaired this gate)

`OwnerEntityCapabilities.specialized.businessTools` (`ownerEntityCapabilityRegistry.ts`) is declared `"specialized"` for servicios/restaurantes/autos-negocios/bienes-raices-negocio but has exactly one consumer in the whole repo (`LeonixDashboardShell.tsx`) — and that one match is the unrelated `L.businessTools` nav-label string, not the capability flag. No category workspace or dashboard section reads `capabilities.specialized.businessTools` to gate a CTA. The sidebar's "Negocio" → `/dashboard/business-tools` link is unconditional (always shown to every owner) and independently already fulfills the doorway; that page itself degrades honestly for an owner with no qualifying business (per Gate 1/2). Inspected the safe repair path: `servicios/page.tsx` and `restaurantes/page.tsx` both pass a single `{title, actions}` pair into `OwnerEntitySpecializedTools` via `OwnerEntityWorkspace`, and that title is already the coupons/offers section title — appending an unrelated "Business Tools" CTA into that same titled group would be semantically wrong, and giving it its own group requires widening `OwnerEntityWorkspace`'s specialized-tools prop from one `{title,actions}` to a list of groups, which is a shared-component shape change touching 4+ categories, not a "smallest adapter." Classified BUILT_NOT_WIRED and deferred rather than forced.

### Registry scope note (not a functional defect)

`comida-local`'s `commercial.plan/entitlement/placement/verification` are all `"unsupported"` in the registry, but Comida Local listings do carry real, correctly-rendered commercial truth (`row.package_tier` + `row.payment_status` → `packageLabelWithPrice()` / `getComidaLocalPaymentStatusLabel()` in `mapComidaLocalDashboardListing.ts`, rendered by `ComidaLocalDashboardListings.tsx`). The registry's `commercial.*` fields describe the shared package-entitlement-bundle resolver specifically (`listing_package_entitlements` + `resolveBusinessToolsAccess`), which Comida Local genuinely does not use — it has its own simpler native columns instead. No owner-facing gap exists; the registry's scope is just narrower than its field names might suggest to a future reader. Not edited this gate (would be a documentation-only change with zero behavioral effect, and the registry's per-category rows already carry extensive hand-written audit comments from prior gates that a hasty edit could contradict without full context).

## Shared Specialized-Tools Multi-Group Gate (2026-09-09, fourth pass)

Repairs the one BUILT_NOT_WIRED item from the prior pass.

| SYSTEM | OWNER_PURPOSE | COMPONENT | SHAPE | CONSUMERS | STATUS |
|---|---|---|---|---|---|
| Specialized-tools contract | Let a category's own tools and Business Tools coexist | `OwnerEntityWorkspace.tsx` `specialized` prop | `OwnerEntitySpecializedGroup \| OwnerEntitySpecializedGroup[]` (was: single group only) | all 10 `<OwnerEntityWorkspace>` callers | LIVE |
| Business Tools group adapter | Turn `capabilities.specialized.businessTools` into a real CTA | `app/(site)/dashboard/lib/ownerBusinessToolsSpecializedGroup.ts` | `(CapabilityState, lang) => {title,actions} \| null` | servicios, restaurantes, AutosDealerInventoryDashboardSection, mis-anuncios/[id] (BR Negocio path) | LIVE |
| Destination | Same doorway the sidebar "Negocio" nav already uses | `/dashboard/business-tools?lang=` | n/a | same 4 callers | LIVE (no new route) |

### Per-category resolution (registry-driven, no per-caller hardcoding)

| Category | Registry `specialized.businessTools` | Group rendered? |
|---|---|---|
| Servicios | `specialized` | YES — 2nd group alongside coupons/offers |
| Restaurantes | `specialized` | YES — 2nd group alongside coupons |
| Autos Dealer (autos-negocios) | `specialized` | YES — 2nd group alongside inventory (actions+children preserved) |
| Bienes Raíces Negocio | `specialized` | YES — 2nd group alongside property-management actions, via `mis-anuncios/[id]/page.tsx`'s existing `capabilities` lookup (`isBrNegocio → "bienes-raices-negocio"`) |
| Empleos, Empleos listing, Viajes, Ofertas Locales (collection+entity), all other generic-page categories (en-venta, rentas-privado, bienes-raices-privado, clases, comunidad, busco, mascotas-y-perdidos), Comida Local | `unsupported` (default) | NO — `ownerBusinessToolsSpecializedGroup` returns `null`, group omitted automatically |

### Backward compatibility proof

`OwnerEntityWorkspace` normalizes `specialized` via `Array.isArray(specialized) ? specialized : [specialized]`, so every caller that still passes a single `{title, actions, children?}` object (6 of 10) needed zero changes. Each surviving group renders inside a `Fragment` (no wrapping DOM node), so the single-group case is byte-identical in layout/spacing to the pre-gate output. Confirmed by `scripts/verify-owner-shared-specialized-tools-01.ts` (33/33 PASS).

## Owner Lifecycle + Same-Row Gate (2026-09-09, fifth pass — verification only, no source changes)

Canonical lifecycle mutation routes traced per category, all confirmed same-row (mutate by
existing id/slug, never insert) and, where capacity-increasing, capacity/grace-guarded:

| Category | Mutation entry point | Server route/RPC | Same-row proof |
|---|---|---|---|
| En Venta, Rentas Privado, BR Privado, Clases, Comunidad, Busco, Mascotas, Autos Privado | `mis-anuncios/[id]/page.tsx` `pauseListing`/`resumeListing`/`archiveListing`/`markStatus` | `applyOwnerListingPatch(sb, row.id, userId, patch)` | direct `row.id` patch, no insert |
| Servicios | `manageListing(slug, action)` | `POST /api/clasificados/servicios/manage` | `.update(...).eq("slug", slug).eq("owner_user_id", ownerUserId)` |
| Comida Local | `mutateLifecycle(listingId, action)` | `POST /api/clasificados/comida-local/lifecycle` | `.update({status}).eq("id", listingId).eq("owner_user_id", ...).eq("status", expectedFrom)` (compare-and-swap) |
| Empleos | `patchStatus(next)` | `PATCH /api/clasificados/empleos/listings/{listingId}` | RESTful by-id |
| Autos Dealer (parent+child) | `unpublish(id)` / `restore(id)` | `/api/clasificados/autos/listings/{id}/unpublish\|restore` → `assertCommercialCapacityForWrite` → `activateAutosDealerListingAtomic` | compare-and-swap `fromStatus:"removed"`, capacity/grace preflight, "FINAL financial authority" per source comment |
| Bienes Raíces Negocio (parent+child) | `callBrLifecycleMutation(listingId, mutation)` | `POST /api/clasificados/bienes-raices/listing-lifecycle` → `applyBrLifecycleMutation` → `activateBrNegocioListingAtomic` | same atomic-RPC family as Autos Dealer; source comment: "an inventory child must never resume while its own parent is paused/archived/sold" |
| Restaurantes | n/a | n/a | registry `lifecycle.pause/reactivate: "unsupported"` — no pause/resume UI exists, honestly absent |
| Ofertas Locales, Viajes | outer surface only | `OfertasLocalesOwnerRenewalActionCenter` (unmodified), Viajes resubmit vocabulary (unmodified) | delegated to existing protected components, internals not opened |

### Parent/child identity safety

- **Autos Dealer**: editing a child vehicle uses `autosDealerInventoryEditHref({listingId: parentId})&editVehicleId={row.id}` — the specific vehicle id is always carried through; restore/unpublish resolve `parentListingId` correctly whether the clicked id is the parent or a child.
- **Bienes Raíces Negocio**: editing a child property routes to the parent's edit workspace with `openChildDraftId=br-db-child-{row.id}` — the specific property id is always carried through. Neither category's edit path can silently rename/reuse a different child's identity.

### Existing focused verifiers run (all pure-logic/source-inspection, no DB/network)

- `npx tsx scripts/gate-g1-owner-lifecycle-contract-selftest.ts` — PASS
- `node scripts/verify-rentas-lifecycle-renewal-dashboard-global-engine-01.mjs` — PASS (explicitly: "verified same-row renewal fulfillment and idempotency present")
- `node scripts/verify-leonix-paid-listing-lifecycle-engine-01.mjs` — PASS ("retrofit matrix complete enough for prior paid categories")
- `npx tsx scripts/gate-i7a-specialized-lifecycle-reconciliation-selftest.ts` — NOT_APPLICABLE (its own stale git-diff-scope assertion from an earlier, narrower gate; not a lifecycle-correctness finding)

## Owner Actionability + CTA Truth Gate (2026-09-09, sixth pass)

### Repairs

| CTA | Was | Now | Files |
|---|---|---|---|
| Google/Yelp (Restaurantes) | BUILT_NOT_WIRED — `externalReputation` prop never called | WORKS | `app/(site)/dashboard/restaurantes/page.tsx` |
| Google/Yelp (Servicios) | BUILT_NOT_WIRED | WORKS | `app/api/clasificados/servicios/my-listings/route.ts`, `app/(site)/dashboard/servicios/page.tsx` |
| Empleos "Aplicaciones" anchor | WRONG_DESTINATION — scrolled past the real content | WORKS | `app/(site)/dashboard/components/OwnerEntityActivity.tsx`, `OwnerEntityWorkspace.tsx`, `app/(site)/dashboard/empleos/[listingId]/page.tsx` |

### Corrected routing note (supersedes a Gate 6 attribution)

Autos Privado does **not** reach `mis-anuncios/[id]/page.tsx` — that page's `fetchOwnerListingForWorkspace` queries only `public.listings`, which never contains `autos_classifieds_listings` rows. Autos Privado is fully rendered inside `AutosDealerInventoryDashboardSection.tsx`'s `privadoRows.map(...)` branch (despite the "Dealer"-sounding filename), with its own real CTAs: `autosLiveVehiclePath` (public), `autosPrivadoPreviewHref` (preview), `autosPaidListingAnalyticsHref` (analytics), `autosPrivadoEditHref` (edit), and the same `unpublish`/`restore` same-row mutations Gate 6 already verified route to `/api/clasificados/autos/listings/{id}/unpublish|restore`.

### Full CTA classification (this pass)

| CTA class | Result |
|---|---|
| Edit/Administrar (all categories) | WORKS (real listingId/slug in every href, confirmed Gates 4/6/7) |
| Ver público / Preview / Resultados | WORKS |
| Analíticas | WORKS |
| Leads (Servicios) | WORKS — real `mailto:` |
| Applications (Empleos) | WORKS (repaired this gate) |
| Messages (`/dashboard/mensajes`) | WORKS (existing route, unchanged) |
| Business Tools (4 categories, Gate 5) | WORKS — real `/dashboard/business-tools?lang=` |
| Coupons/Offers (Servicios, Restaurantes) | WORKS (Gate 4) |
| Inventory / Add vehicle / Add property | WORKS (Gate 6) |
| Community Trust | WORKS (read-only, real endorsements, shared component) |
| Google / Yelp | WORKS (repaired this gate, Servicios + Restaurantes) |
| Pause/Reactivate/Renew/Archive/Mark Sold | WORKS (Gate 6) |
| Approvals / Service Requests / Proposals | HONESTLY_DISABLED — real counts/data, no fake button, no review route exists yet |
| Ofertas campaign/AI-review anchors | WORKS (checked for the same anchor-placement bug as Empleos; not affected) |

## Cross-Category Owner Experience Consistency Gate (2026-09-09, seventh pass)

### Category owner experience matrix

| Category | Entry | Workspace | Primary Action | Specialized | Activity | Status |
|---|---|---|---|---|---|---|
| Servicios | `/dashboard/servicios` (Layer A+B+C) | `OwnerEntityWorkspace` | Editar (burgundy) | Coupons/Offers + Business Tools (2 groups, Gate 5) | Leads | LIVE |
| Restaurantes | `/dashboard/restaurantes` (A+B+C) | `OwnerEntityWorkspace` | Editar (burgundy) | Coupons + Business Tools (2 groups) | — (no leads support) | LIVE |
| Comida Local | via `ComidaLocalDashboardListings` adapter | `OwnerEntityWorkspace` | Editar | none (registry: unsupported) | — | LIVE |
| Autos Privado | via `AutosDealerInventoryDashboardSection`'s `privadoRows` branch | `OwnerEntityWorkspace` | Editar | none | — | LIVE |
| Autos Dealer | via `AutosDealerInventoryDashboardSection`'s `groups` branch | `OwnerEntityWorkspace` | Editar (parent) | Inventory + Business Tools (2 groups) | — | LIVE |
| Bienes Privado | generic `mis-anuncios/[id]/page.tsx` | `OwnerEntityWorkspace` | Editar | none | Leads (messages) | LIVE |
| Bienes Negocio | generic `mis-anuncios/[id]/page.tsx` (+ library card `LeonixRealEstateListingManageCard`) | `OwnerEntityWorkspace` | Editar (parent workspace) | Property tools + Business Tools (2 groups) | Leads | LIVE — library card tone repaired this gate |
| Rentas | generic `mis-anuncios/[id]/page.tsx` | `OwnerEntityWorkspace` | Editar | none | Leads | LIVE |
| Empleos | `/dashboard/empleos` (A+B+C) | `OwnerEntityWorkspace` | Editar | Applications (anchor repaired Gate 7) | Applications | LIVE |
| En Venta/Varios | generic `mis-anuncios/[id]/page.tsx` | `OwnerEntityWorkspace` | Editar | none | Activity | LIVE |
| Clases | generic `mis-anuncios/[id]/page.tsx` | `OwnerEntityWorkspace` | Editar | none | Activity | LIVE |
| Comunidad/Eventos | generic `mis-anuncios/[id]/page.tsx` | `OwnerEntityWorkspace` | Editar | none | Activity | LIVE |
| Busco | generic `mis-anuncios/[id]/page.tsx` | `OwnerEntityWorkspace` | Editar | none | Activity | LIVE |
| Mascotas | generic `mis-anuncios/[id]/page.tsx` | `OwnerEntityWorkspace` | Editar | none | Activity | LIVE |
| Ofertas Locales (outer only) | `/dashboard/ofertas-locales` (A+B+C) | `OwnerEntityWorkspace` | Editar/Renew (specialized) | Campaign + AI review (protected internals) | — | LIVE, protected |
| Viajes (outer only) | `/dashboard/viajes` (A+B+C) | shared collection grammar | resubmit vocabulary | none | — | LIVE, protected |

### Repair this pass

`app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx` — Archive (2 occurrences)
and Mark Sold (2 occurrences) used non-canonical colors (stone-gray and gold/tan respectively)
instead of the locked Red semantic (Master Bible §10) every other category's equivalent action
already uses. Fixed to the exact canonical `border-red-300/70 bg-red-50 text-red-800
hover:border-red-400 hover:bg-red-100` already defined in `DashboardListingActionBar.tsx`. Every
other tone on this card (pause=amber, resume=green, primary=`#7A1E2C` exact burgundy) was already
correct and left untouched. The card's bespoke (non-`ActionItem`) button architecture itself is
not a defect — it's the Master-Bible-exempted "Mis Anuncios library, not the full workspace"
tier — and was not rewritten (would be a broad, out-of-scope refactor of mature, audited code).

### Not repaired (flagged only)

- `LeonixRealEstateListingManageCard.tsx`'s secondary "Editar" shortcut link uses a gold/tan color
  differing from its row-siblings (Ver público/Vista previa, both neutral/cream). Softer case, no
  explicit rule violated (the card's real primary doorway is correctly burgundy elsewhere) —
  deferred for a deliberate product decision, not force-fixed under this gate's mandate.
- Pre-existing, unrelated lint finding in the same file (`messagesTotal` unused parameter,
  confirmed present in committed HEAD) — out of scope, not touched.

## FINAL SOURCE INTEGRATION CERTIFICATION (2026-09-09, eighth pass)

Certifies the accumulated Gates 2-8 Owner Command Center source as one coherent, integrated
system, immediately prior to owner/browser QA.

### Result summary

| Check | Result |
|---|---|
| Focused verifiers (6 run) | 22/22 + 33/33 + OK + PASS + PASS + 182/182 |
| TypeScript baseline | 2 new errors found and fixed → 0 new errors (byte-identical to established 7-error e2e-only baseline) |
| Lint (74 accumulated files) | 0 new problems (1 pre-existing, unrelated finding) |
| `git diff --check` | PASS |
| Final production build | PASS — exit 0, "Compiled successfully in 86s", all 8 gates' routes present |
| 15-point final static contract | 15/15 PASS |

### Integration repair applied

`app/(site)/dashboard/servicios/page.tsx` — Gate 7's Google/Yelp `externalReviewLinks` construction
used an array-literal-plus-`.filter()` pattern whose inferred type didn't satisfy the
`OwnerExternalReviewLink[]` type-predicate filter (TS2322/TS2677). Replaced with the same
explicit-empty-array-plus-`.push()` pattern already proven to compile cleanly in the sibling
`restaurantes/page.tsx`. Zero behavioral change — pure type-inference fix, confirmed by two
follow-up full `tsc` re-runs, the second landing byte-identical to the established baseline.

### Environment note

A genuinely active competing heavy process (a different worktree's `next build`, confirmed via
`Get-CimInstance Win32_Process` command-line inspection) and a node-process spike to 48 with free
memory dropping to ~1.3GB were observed early in this gate. Per instruction, this session did not
compete for RAM during that window — it completed lightweight verification (focused verifiers,
lint, diff-check) instead, then re-checked process count and memory before running `tsc`/build
once conditions cleared (1 process, 5-7GB free). No ENVIRONMENT_BLOCKED state was ultimately
reached — the certification completed in full.

## Product/UX Completion Gate (2026-09-09, eighth pass — not committed)

### Repair

| Action | Category | Was | Now |
|---|---|---|---|
| Mark Sold | generic entity workspace (`mis-anuncios/[id]/page.tsx`) | fired immediately, no confirm | confirms (text matches BR's card) |
| Mark Sold | En Venta (`EnVentaListingManageCard` via `mis-anuncios/page.tsx`) | fired immediately, no confirm | confirms (text matches BR's card) |
| Archive | Empleos list (`empleos/page.tsx`) | fired immediately, no confirm | confirms |
| Archive | Empleos detail (`empleos/[listingId]/page.tsx`) | fired immediately, no confirm | confirms |

BR Negocio's card and the generic entity workspace's own Archive action already confirmed and
were not changed. All four repaired call sites use the app's existing native `confirm()`/
`window.confirm()` pattern — no new UI/interaction pattern introduced.

### Investigated, not changed

Empleos' Archive label reads "Archivar anuncio," not the Master Bible §10 example "Cerrar
vacante" — confirmed via `OWNER_COMMAND_CENTER_PACKAGE3_GATE3C_AUDIT.md` that no distinct
close-vacancy mutation exists; the generic label is the honest one for this identical underlying
action. Not renamed.

### UX review summary (all 16 categories)

Every category was traced against the 8 UX dimensions (navigation, information hierarchy,
primary action, status comprehension, empty/unavailable states, action completion, category
consistency, ES/EN language). All SHIP_READY except the confirm-dialog gap above (now repaired).
No dashboard islands, no competing primary CTAs, no raw internal status/jargon leakage, no fake
empty-state data found anywhere.

## UI + Responsive Completion Gate (2026-09-09, ninth pass — not committed)

### Repair

| Component | Was | Now |
|---|---|---|
| `OwnerEntityDetailGrid.tsx` | `OwnerEntityDetailItem` had no way to opt out of `truncate`/2-column sizing | new optional `wide?: boolean` — `col-span-full` + no truncate when `true`; default `false` leaves every other caller byte-identical |
| Autos Dealer parent capacity lines (`AutosDealerInventoryDashboardSection.tsx`) | "10 de 10 vehículos activos" / "Te quedan N espacios disponibles" risked clipping in the 2-column mobile detail grid | marked `wide: true` — always renders in full |

### Shared-component responsive audit (all confirmed already correct, no changes)

`LeonixDashboardShell` (single nav mechanism per breakpoint), `OwnerEntityPerformance` (metrics
flex-wrap), `DashboardListingActionBar` (single tone→color mapping, CTA semantics guaranteed
consistent by construction), `DashboardMobileActionSheet` (scrollable, full-width stacked
buttons, `md:hidden`), `OwnerEntityHeader` (badge wrap, mobile-stretch CTA), BR Negocio's own
capacity paragraph (already full-width, not through the narrow grid).

### Deferred, re-evaluated, not changed

Real-estate secondary "Editar" shortcut color — re-checked from a pure visual-system angle: does
not violate the locked CTA semantics (the card's real primary doorway is already correctly
burgundy elsewhere); subjective preference only, left deferred.

## FINAL SHIP-READINESS SOURCE/BUILD CERTIFICATION (2026-09-09, tenth pass — not committed)

Heavy validation authorized and performed for the Gate 10 (UX) + Gate 11 (UI) candidate on top of
checkpoint `ea99e57c`/`d715d0f3`.

| Check | Result |
|---|---|
| Candidate diff scope | 10 files (6 app + 4 docs), 86/-10 lines, all traceable to Gate 10 or 11 |
| Focused verifiers | 22/22 + 33/33 + OK + PASS + PASS + 182/182 |
| TypeScript baseline | byte-identical to established 7-error e2e-only baseline — 0 new |
| Lint | 0 new findings (6 pre-existing, confirmed unrelated) |
| `git diff --check` | PASS |
| Production build | PASS — exit 0, "Compiled successfully in 2.2min" |
| Regression trace | lifecycle, specialized tools, Business Tools, external reputation, Empleos applications, category adapters, Ofertas/Viajes boundary — all intact |

**Source-fixable ship blockers: NONE. Runtime owner QA: NOT performed (§33.3 distinction still
applies — this is a source/build certification, not a browser QA pass).**

## Known gaps (not launch blockers, per Master Bible §47)

- No multi-business switcher UI — first active membership wins. A second membership only
  surfaces as `otherBusinessCount > 0` with a hint string.
- Promise Keeper has no dedicated owner route; due/blocked signals already reach the owner via
  the Advisor `needsAttention` signals this bridge already consumes.

## PRE-QA 100% PRODUCT COMPLETION PASS (2026-09-09) — wiring changes

| System | Route/Component | Change | Data source (unchanged) |
|---|---|---|---|
| Rentas lifecycle | `mis-anuncios/page.tsx` → `LeonixRealEstateListingManageCard` | `onMarkSold` now `undefined` when `catKey === "rentas"` (was unconditional) | registry truth: `rentas-privado`/`rentas-negocio` `lifecycle.markSold: "unsupported"` |
| Autos Privado lifecycle | `AutosClassifiedListingManageCard.tsx`, wired from `mis-anuncios/page.tsx` | new `onReactivate` prop → `markStatus(id, "active")`, rendered only when `status === "removed"`; Archive recolored to canonical red | registry: `autos-privado` `lifecycle.reactivate: "supported"` |
| Servicios coupons/offers | `servicios/page.tsx` → `OwnerEntityWorkspace` | new `footerHint` via `serviciosOffersInactiveDashboardHint(lang)` whenever the offers group has zero actions | same entitlement truth (`offersEntitlementActive`), no new data source |
| Bienes Negocio inventory | `BrNegocioListingInventoryActions.tsx` | one canonical add-property CTA (was two duplicates); "Activar inventario" gated behind `!upgradeActive` | `computeBrPropertyInventoryCounts` (unchanged) |
| Business Tools | `BusinessConciergeOwnerHome.tsx` + `dashboardI18n.ts` (`businessHomeCopy.workWithLeonixReadOnlyNote`) | disclosure line shown when pending approvals/service-requests count > 0; Business Identity section gained a subtle ring accent | `home.workWithLeonix` (unchanged) |
| Business Tools hierarchy (Gate 14.1 hard close) | `BusinessConciergeOwnerHome.tsx` | What Matters Now promoted to `LX_DASH.pageHero` with a real umbrella heading (`t.whatMattersTitle`, previously unused); Business Health + Action Plan grouped into a shared `md:grid-cols-2` row; Understands/Work With Leonix/Progress/Assistant left as plain-panel supporting tier | unchanged — presentation only |
| Detail-grid long text | `viajes/page.tsx`, `ofertas-locales/page.tsx`, `ofertas-locales/[id]/page.tsx`, `empleos/page.tsx`, `empleos/[listingId]/page.tsx` | `wide: true` added to moderation notes, rejection notes, next-action copy, company name | unchanged |
| Global shell | `LeonixDashboardShell.tsx` | account panel name/email gained `break-words`/`break-all` | unchanged |

**Investigated, confirmed NOT a defect**: `contactHub`/`translateAd` registry fields describe
public-listing-page capabilities (Connection Hub, Translate Ad control), not an owner-dashboard
action — true for every category, not Comida-Local-specific. No dashboard consumer of these two
fields exists anywhere in the repo, by design.

**Investigated, confirmed unreachable, left unfixed**: Autos Privado has no link to the generic
`/dashboard/mis-anuncios/{id}` page, so that page's missing `"autos"` capability-key branch
(which would fail open if ever reached) is latent, not live.
- Learning stays `null` until a real recommendation→lesson mapping module exists.

## FINAL PRE-QA SOURCE/BUILD CERTIFICATION (2026-09-09)

| Check | Result |
|---|---|
| Candidate scope | 12 app files + 4 docs, 0 unrelated files |
| Owner Attention / Shared Specialized Tools / lifecycle / paid-lifecycle verifiers | 22/22, 33/33, PASS, PASS |
| Whole-product final reconciliation | 182/182 PASS |
| Rentas verifier | 7/8 substantive checks PASS; 1 scope-boundary false positive on `BrNegocioListingInventoryActions.tsx`, investigated and explained (see PROGRESS.md Gate 15) |
| Full `tsc --noEmit` | byte-identical to the 7-error e2e-only baseline — 0 new |
| Full production build | PASS — exit 0, "Compiled successfully in 89s" |
| Architecture regression trace | zero core/protected files touched — one shell, both parent-child identities, shared analytics/entitlement/media, exact business membership auth, protected Ofertas/Viajes internals all intact |

**PRE-QA PRODUCT CONSTRUCTION: COMPLETE. FINAL PRE-QA SOURCE/BUILD CERTIFICATION: PASS.
OWNER QA: NOT YET PERFORMED — its purpose from here is final runtime confirmation/polish of an
already-complete product, not continuation of construction.**

Subsequently committed as `f2508a9a566216ce0bc2eba78449510ff1fc9ab3`, pushed, Preview READY.

## FINAL PRE-RELEASE PRODUCT-CONSTRUCTION AUDIT (2026-09-10) — Gate 16

Last construction gate before main/Production, on top of `f2508a9a`. Four parallel evidence-only
passes (mechanical defect scan, dead/built-not-wired scan, cognitive-load review, skeptical
spot-check of 5 prior fixes) found and repaired 5 real defects — no speculative features, no
protected-engine changes:

| System | Route/Component | Defect | Fix |
|---|---|---|---|
| En Venta renewal CTA | `EnVentaListingManageCard.tsx` | Full-width gold-gradient renew button visually outranked the canonical primary "Administrar anuncio" doorway, on the default-selected (highest-traffic) category | Resized to match the card's other secondary-button convention |
| Viajes error copy | `viajes/page.tsx` (3 sites) | Raw JS/HTTP error strings shown to the owner, inconsistent with this file's own established safe-copy pattern | Routed through `dashboardSafeMutationErrorCopy(lang)`, same as the file's existing load path |
| Restaurantes error copy | `restaurantes/page.tsx` | Internal "Supabase RLS policies" terminology leaked into an owner-facing error message (both languages) | Replaced with honest, human copy, zero internal terms |
| Mis Anuncios Archive CTA | `mis-anuncios/page.tsx` | Generic-category Archive button used literal `stone-*` classes instead of the locked canonical red destructive semantic | Corrected to the same canonical red palette used elsewhere in the file for the same action |
| Account Command Center CTA | `OwnerBusinessGrowthEntry.tsx` | Duplicate "Publicar" CTA — same action already rendered as the page's own primary CTA in the header | Removed the redundant copy |

Reviewed and judged NOT a defect (documented reasoning, no change): `OwnerRecentActivity`'s
shared panel chrome with real content sections (correct "one Leonix system" consistency, not a
competing-cards violation); Business Tools' uniform secondary tier below the promoted hero tier
(standard hero + supporting-detail pattern); 2 dead zero-consumer legacy components (never
rendered, left as pre-existing debt); capability-registry fields with no consumer yet
(self-documented forward-declared truth).

Verification: `git diff --check` PASS; lint 0 new findings (9 confirmed pre-existing); all 6
canonical verifiers PASS (22/22, 33/33, OK, PASS, PASS, 182/182); full `tsc --noEmit` 0 new errors
(byte-identical to the session-wide 7-error e2e-only baseline); full production build PASS
("Compiled successfully in 2.9min").

**FINAL PRODUCT CONSTRUCTION CERTIFICATION: 100% PASS.** Not committed yet — left for PM review of
this gate's report before the final release commit.

Subsequently committed as `e8217f0e88bb824d78fd2b99cf8cd80c4c663ab3`, pushed. A fast-forward to
`main` was then attempted and correctly blocked — `main` had advanced 265 commits since this
branch's common ancestor (`3f4c6fe2`). See below.

## MAIN RECONCILIATION (2026-09-10) — Gate 17

Merged `origin/main` (`a0a4783971b42ea1d71ab2602d4720d0d590baf8`) into the certified feature branch
(normal merge, no rebase/squash). 54 files overlapped between the two histories; 5 required real
conflict resolution:

| File | Resolution |
|---|---|
| `app/lib/business/proposals/{logic,repository}.ts` | Feature's version confirmed a strict content superset of main's — kept feature's |
| `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts` | Comment-only conflict (both sides independently removed the same dead code) — kept one |
| `app/(site)/dashboard/components/LeonixDashboardShell.tsx` | Kept main's real single-DOM-copy/overflow fixes; kept feature's `spaceCounts` Mis Espacios feature; removed the now-dead `renderSidebarBottom()` (both its call sites were eliminated by main's restructuring); re-inserted the certified mobile "current section" label into main's new trigger button |
| `app/(site)/dashboard/business-tools/page.tsx` | Main's side was the stale pre-Gate-1 generic tool-card directory — kept `BusinessConciergeOwnerHome` entirely; caught and fixed a real clean-merge regression (silently dropped import) |

All 5 Gate 16 fixes reverified intact post-merge. `tsc --noEmit`: 0 new errors across the entire
merged codebase (byte-identical to the 7-error e2e-only baseline). Production build PASS. Whole-
product verifier: 174/182 — the 8 failures are diff-based protected-file guards correctly flagging
main's own legitimate history (admin/, Stripe, Ofertas backend, Recursos, Community Trust registry,
Living Business Book) arriving via the merge, not damage; confirmed none of those files were
touched by this reconciliation itself.

**PRODUCT CONSTRUCTION CERTIFICATION: still 100% PASS on the merged tree. MAIN: not touched.
PRODUCTION: not touched.**

## ABSOLUTE FINAL GREEN-LIGHT AUDIT (2026-09-10) — Gate 18

Independent 18-phase source audit of `79a96f7e` (same commit as Gate 17) via 7 parallel research
passes plus fresh verifiers/typecheck/lint/diff-check/build. Found and repaired 5 small CTA-color/
copy defects (color/copy-only, zero behavior change):

| File | Defect | Fix |
|---|---|---|
| `LeonixRealEstateListingManageCard.tsx` | FSBO "Archivar" gray/tan instead of canonical red | Matched sibling BR Negocio branch's red classes |
| `EnVentaListingManageCard.tsx` | "Marcar vendido" button + confirm-dialog OK button neutral/dark instead of red | Canonical red on both |
| `busquedas-guardadas/page.tsx` | Pause/Reactivate/Delete all one neutral color | Amber/green/red per canonical tone |
| `perfil/page.tsx`, `seguridad/page.tsx` | Raw caught-exception message shown to owner, "Unknown error" fallback | Reused existing `dashboardSafeMutationErrorCopy(lang)` helper |
| `notificaciones/page.tsx` | Owner-facing copy said "migrable a Supabase después" | Vendor-neutral copy |

**Escalated, not patched:** Autos Privado and Bienes Raíces Privado/FSBO have no wired renewal
flow despite being fixed-term paid listings — registry honestly marks `renew` unsupported for
both. Pre-existing gap (not introduced by any recent gate); touches payment/entitlement scope,
so reported `⚠️ CHUY DECISION REQUIRED` rather than built.

**Reconfirmed non-blocking:** homepage `HomeBusinessToolsSection.tsx` still live-links to the
orphaned pre-integration business-tools sub-routes (already noted in Gate 17); `OwnerRecentActivity`
permanent honest-empty-state is by design (Bible §26), not a defect.

Post-fix validation: 0 new TypeScript errors (byte-identical 7-error e2e baseline), 0 new lint
findings, whole-product verifier 182/182 (up from 174/182 — Gate 17's protected-file diff
artifacts cleared now that the tree is fully committed and clean), full production build PASS.
**MAIN: not touched. PRODUCTION: not touched.**

## ZERO-GAP CLOSEOUT (2026-09-10) — Gate 19

Attempted to close all 4 Gate 18 findings. 2 closed, 2 escalated:

| Item | Outcome |
|---|---|
| Homepage links to orphaned business-tools sub-routes | **CLOSED** — `HomeBusinessToolsSection.tsx`'s Business Health/DIY Concierge cards now point to the certified `/dashboard/business-tools` page instead of the pre-integration sub-routes. Idea-builder links investigated and confirmed to be a genuinely distinct, still-real tool — not a gap. `proximo-paso`/`what-we-understand` confirmed to have zero inbound links anywhere — orphaned but not a live navigation defect. |
| `LeonixRealEstateListingManageCard.tsx` FSBO "Editar" color inconsistency | **CLOSED** — traced to a real, distinct edit-form destination; the prior gold tint was a hex-drifted near-copy of the theme's specialized-capability token (wrong semantic family regardless). Given an outlined/tinted burgundy treatment: same family as the row's primary manage doorway, visually subordinate so it doesn't compete with it. |
| Autos Privado renewal flow | **⚠️ ESCALATED — CHUY DECISION REQUIRED.** Pricing/duration are already locked truth; the real blocker is that `autos_classifieds_listings` has no `expires_at` column and no expiration is ever computed for this category today — a genuine schema gap requiring a Supabase migration, not a UI wiring fix. |
| Bienes Raíces Privado/FSBO renewal flow | **⚠️ ESCALATED — CHUY DECISION REQUIRED.** Identical finding — the generic `listings` table has no `expires_at` column either, and no expiration is computed for FSBO today. |

Validation: 0 new lint findings, `tsc --noEmit` byte-identical to the 7-error e2e baseline, `git
diff --check` clean, Owner Attention 22/22, Shared Specialized Tools 33/33, Paid Listing Lifecycle
Engine PASS, whole-product reconciliation 182/182, one production build PASS.

**Construction is NOT reported as 100% — 2 real items remain open pending a Chuy product decision.
MAIN: not touched. PRODUCTION: not touched. No Supabase/Vercel/Stripe changes.**

## FINAL FIXED-TERM RENEWAL CONSTRUCTION (2026-09-10) — Gate 20

Chuy's decision: build real expiration + same-row renewal for both remaining categories — not
evergreen. Reused the proven Rentas architecture; no new payment system, no duplicate engine.

| System | Autos Privado | Bienes Raíces Privado/FSBO |
|---|---|---|
| Term / price | 30 days, $24.99 | 45 days, $49.99 |
| Schema | New: `autos_classifieds_listings.expires_at` (migration `20260910120000_autos_privado_lifecycle_expires_at.sql`, applied to Leonix Media Staging) | Already existed: `listings.expires_at` (shared with Rentas) |
| Lifecycle config | `AUTOS_PRIVADO_LISTING_LIFECYCLE_CONFIG` | `BR_FSBO_LISTING_LIFECYCLE_CONFIG` |
| Checkout ownership gate | `validateAutosPrivadoRenewalCheckoutOwnership` | `validateBienesFsboRenewalCheckoutOwnership` |
| Fulfillment renewal branch | `revenueAutosPrivadoFulfillment.ts` + `tryRenewAutosPrivadoListingAfterPayment` | `revenueBienesFsboFulfillment.ts` |
| Owner dashboard CTA | `AutosDealerInventoryDashboardSection.tsx` (`privadoRows` — the real live card; `mis-anuncios`'s `AutosClassifiedListingManageCard` path is legacy/dead for this category) | `mis-anuncios/page.tsx` → `LeonixRealEstateListingManageCard.tsx` (existing `lifecycle`/`onRenew` props, previously Rentas-only) |
| Public visibility | `listActiveAutosClassifiedsRows` + `getActiveLiveAutosBundle` | Shared `isListingRowActiveAndPublishedForBrowse` predicate |

Both share: same-row only (never inserts, never changes ID/owner/media/analytics), status is never
mutated by renewal (expiration is purely `expires_at` vs now, exactly like Rentas), and a shared
webhook-retry idempotency guard (`isRenewalAlreadyApplied`/`markRenewalPaymentApplied`) so a
redelivered "renewal succeeded" event can never double-extend a term.

New verifier `verify-owner-command-center-gate20-fixed-term-renewal-01.mjs`: 8/8 PASS. All other
canonical verifiers re-run clean (2 verifiers show fully-explained scope-boundary exceptions — their
"no migration"/"Bienes files unchanged" guards correctly flagging this gate's own authorized,
intentional changes). 0 new TypeScript errors, 0 new lint findings, production build PASS.

**CONSTRUCTION: 100% — all 4 items from Gate 18 are now genuinely closed.**
**MAIN: not touched. PRODUCTION: not touched.** Migration applied only to Leonix Media Staging
(matching QA data); Production Supabase was never touched, and the migration file is committed for
the normal release process.

## Servicios Golden receiver checkpoint (2026-09-11)

Receiver fast-forwarded `d1b2994d` → current `origin/main` `9fcadb4daf599e15fca62adcb647abbf96ce6bd8`. Incoming main was Admin OS only; Owner Command Center shell, workspaces, Saved Listings/Guardados, Saved Search dashboard registry, and Servicios owner adapters were not in that diff.

| CONTRACT | RECEIVER CONSUMER | CURRENT-MAIN STATUS | OWNER OF REMAINING WORK |
|---|---|---|---|
| Servicios coupons/offers display | `/dashboard/servicios`, `/dashboard/business-tools`, `coupons_offers` via listing-package-entitlements | LIVE-SHARED | SERVICIOS GOLDEN persist (SRV-GOLDEN-02) |
| Servicios edit identity | `serviciosListingEditHref` → `/publicar/servicios?mode=listing-edit&listingId=` | LIVE | SERVICIOS GOLDEN write-key (SRV-GOLDEN-01 / DASH-23) |
| Pause/Resume presentation | `/dashboard/servicios`, Mis Anuncios → `POST /api/clasificados/servicios/manage` | LIVE | SERVICIOS GOLDEN commercial fail-closed (DASH-27) |
| Guardados persistence | `/dashboard/guardados` + `savedListingsDashboardResolve` | LIVE-SHARED | SERVICIOS GOLDEN public Save mounts (DASH-53) |
| Saved Search dashboard | `/dashboard/busquedas-guardadas` `CATEGORY_REGISTRY` | autos / bienes-raices / rentas only | SERVICIOS GOLDEN / shared adoption (DASH-58/59/60) |

**OWNER COMMAND CENTER REQUIRED PRODUCT SOURCE WORK: NONE PROVEN.**
Next receiver action: targeted recheck after Golden contracts land on current main, then final source certification. No owner QA before that.

## Full DASH-01–76 TRUE/FALSE (2026-09-11, product SHA `9fcadb4d`)

**Worktree:** `C:\projects\elaguila-website-owner-command-center`
**Branch:** `integration/owner-command-center-globalization-2026-08`
**Source HEAD certified (Prompt 1):** `394d6fdbb98891278ab2436135136e55c9fba1c7`
**origin/main:** `9fcadb4daf599e15fca62adcb647abbf96ce6bd8`
**OCC required product work:** NONE
**UNKNOWN:** NONE
**Optional / non-blocking:** DASH-32, DASH-33, DASH-40
**QA:** NOT RUN
**QA AUTHORIZED:** NO
**Runtime Golden listing:** NOT TESTED
**Prompt 1 cert (2026-09-11):** 7/7 targeted verifiers PASS; `tsc` 7 e2e-only baseline 0 new; production build PASS (Compiled successfully in 2.9min). Isolated Preview recorded after push. Product source unchanged.

Canonical table: `docs/launch-lifecycle/SERVICIOS_OWNER_DASHBOARD_RUNTIME_LEDGER_2026-09-11.md` §25B.

| Bucket | Items |
|---|---|
| A TRUE source-complete | DASH-06, 11, 20, 29, 30, 52, 56, 57, 62 |
| B TRUE + runtime deferred | DASH-01–05, 07–10, 12–17, 19, 21, 22, 24–26, 28, 31–51, 54, 55, 61, 63–76 |
| C BLOCKED external Golden | DASH-18, 23, 27, 53, 58, 59, 60 |
| D OCC work still required | NONE |
| UNKNOWN | NONE |

No second dashboard shell, Saved Listing engine, Saved Search engine, Servicios lifecycle engine, or commercial-state engine.
