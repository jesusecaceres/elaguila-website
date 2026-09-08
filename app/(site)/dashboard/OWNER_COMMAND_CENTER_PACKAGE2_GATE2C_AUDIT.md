# Owner Command Center — Package 2, Gate 2C Audit

Canonical action resolver + "Administrar anuncio" entry.

## 1. Boundary

```
WORKTREE: C:\projects\elaguila-website-owner-command-center
BRANCH:   integration/owner-command-center-globalization-2026-08
HEAD:     7cf69d6c8abc970305e6b384322821134e14700d (unchanged before/after)
```
Verified before editing — matched expected values; working tree contained only Package 1
+ Gate 2A + Gate 2B's already-known changes, no unexpected source changes.

## 2. Canonical action contract

**Source of truth confirmed (Task 2C-1):** three layers exist, as the Package 1.5 survey
found — `dashboardActionResolver.ts`/`categoryRouteRegistry.ts` (the deep, per-pipeline
href resolver, untouched this gate), `categoryDashboardActionContract.ts` (legacy,
Servicios/Restaurantes-only, its Servicios branch's *consumption* retired — see §3), and
`dashboardMisAnunciosCategoryTools.ts` (the layer that actually builds what renders on
Mis Anuncios cards — this is where Gate 2C's consolidation work lives, since it's the
layer closest to what the owner sees). No fifth layer was invented; presentation
consolidates around the existing `CATEGORY_LISTING_TOOL_TRUTH`/`buildInventoryListingActions`
contract, extended with a semantic `tone` vocabulary shared by every card.

**Canonical vocabulary locked** (`dashboardMisAnunciosCategoryTools.ts`, all via shared
functions, not inline literals):
`openPanelLabel` = "Administrar anuncio"/"Manage listing" (EN fixed from "Manage ad"),
`editListingLabel` = "Editar anuncio"/"Edit listing" (unchanged, already correct),
`publicViewLabel` = "Ver público"/"View public" (unchanged), `previewLabel` =
"Vista previa"/"Preview" (unchanged), `analyticsLabel` = "Analíticas"/"Analytics"
(unchanged), `pauseListingLabel` (EN fixed "Pause ad"→"Pause listing"),
`resumeListingLabel` (ES "Restaurar"→"Reactivar anuncio", EN "Restore"→"Reactivate
listing"), `archiveListingLabel` (EN fixed "Archive ad"→"Archive listing"), plus three
new functions: `markSoldListingLabel`, `republishListingLabel` (added for future/cross-
file reuse), `manageInventoryLabel`, `offersAndCouponsLabel`, `applicationsLabel`
(centralized SPECIAL vocabulary, exported for reuse — not force-wired into every
existing inventory/offers call site across the codebase, which was out of this gate's
"Mis Anuncios cards only" scope per Task 2C-7).

## 3. Servicios duplicate resolution (Task 2C-4)

**Confirmed and fixed.** The Mis Anuncios Servicios card could previously show two
competing primary-looking buttons for the same listing: the real edit action (labeled
"Editar anuncio", tone `primary`, resolving through `canonical.get("edit")?.href ??
opts?.serviciosEditHref ?? item.editHref`) **and** a second action pushed whenever
`item.actionContract?.manageUrl` existed, labeled "Administrar anuncio" but pointing at
`/dashboard/servicios?listingSlug=...` — a different destination built by the legacy
`buildServiciosDashboardActionContract()`.

**Path that survived:** the first one. It is now labeled `openPanelLabel(lang)` =
"Administrar anuncio"/"Manage listing" (previously "Editar anuncio") since it's the
listing's one true doorway, still resolving through the exact same href chain
(`canonical.get("edit")?.href ?? opts?.serviciosEditHref ?? item.editHref` — unchanged).
The second branch (the `item.actionContract?.manageUrl` push) is deleted outright — not
disabled, not hidden behind a flag, removed.

**Verified not broken:** `buildServiciosDashboardActionContract()` itself and
`item.actionContract` are untouched — their other fields (`publicUrl`, `editUrl`,
`resultsUrl`, `listingId`) are still real and still consumed elsewhere
(`dashboardInventory.ts`'s href-building, `mis-anuncios/page.tsx`'s
`serviciosListingEditHref` call). The dedicated `/dashboard/servicios` page (which builds
its own separate action set, not through this function) is unaffected — no route lost.
Pause/resume (`/api/clasificados/servicios/manage`) and the leads panel are untouched;
only the one duplicate CTA push was deleted.

## 4. Destination per category (Task 2C-3)

| Category | Primary destination | Status |
|---|---|---|
| En Venta | `/dashboard/mis-anuncios/{id}` | Added (card previously had no primary doorway at all — "Ver detalles" to the public page was the visually-dominant button; now demoted, relabeled "Ver público") |
| Restaurantes | `/dashboard/restaurantes` | Fixed (existing action, was rendered with no `tone` — now `tone: "primary"`) |
| Servicios | Single canonical `serviciosListingEditHref(...)`-equivalent chain | Fixed (duplicate retired, §3) |
| Empleos | `/dashboard/empleos/{listingId}` (`item.editHref`) | Relabeled from "Gestionar vacante"/"Manage listing" (no tone) to canonical, `tone: "primary"` |
| Rentas (both lanes) | `/dashboard/mis-anuncios/{id}` | Added (same as En Venta — no primary doorway existed) |
| Bienes Raíces Privado | `/dashboard/mis-anuncios/{id}` | Added |
| Bienes Raíces Negocio | `/dashboard/mis-anuncios/{id}` | Added (parent and child rows both — the existing BR-Negocio-specific global lifecycle descriptor system for pause/resume/archive/discontinue was left fully intact) |
| Clases / Comunidad / Busco / Mascotas | `/dashboard/mis-anuncios/{id}` (generic workspace, same as En Venta) | Inherited automatically — these categories already route through `EnVentaListingManageCard`/generic workspace per the existing architecture; no separate edit needed |
| Viajes | `item.editHref` (existing route, left as-is — not integrated into the registry) | Relabeled from "Gestionar envío"/"Manage submission" to canonical, `tone: "primary"`. Registry integration explicitly NOT attempted — "do not redesign Viajes" |
| Autos Privado | `editHref` (`/publicar/autos/privado?edit=1&source=dashboard&listingId={id}`) | **PACKAGE-2 ADAPTER** — smallest truthful adapter per Task 2C-19; no generic workspace exists for Autos, so the canonical label points at the real existing edit route. Relabeled from plain "Editar" (secondary-styled) to "Administrar anuncio" (primary-styled) |
| Autos Dealer (parent) | `parentCanonical.get("edit")?.href ?? autosDealerListingEditHref(...)` (existing route) | **PACKAGE-2 ADAPTER** — same reasoning; relabeled from "Editar anuncio"/"Edit listing" (plain) to canonical primary styling. Dealer parent/child identity, `editVehicleId` contracts, inventory relationships, entitlement behavior all untouched — only this one link's label/style changed |
| Comida Local | Not modified — no tool-truth "manage" key exists for this category at all (confirmed absent in `CATEGORY_LISTING_TOOL_TRUTH["comida-local"]`); no primary doorway added since none can be built truthfully without inventing one | Deferred, correctly not fabricated |
| Ofertas Locales | Out of scope — deliberately separate hub, not part of Mis Anuncios' category set | Not touched |

## 5. Lifecycle action classification (Task 2C-5)

`DashboardActionKind` (`app/lib/listingIdentity/dashboardActionTypes.ts`) already
reserves `"lifecycle"` as a valid kind, with an explicit code comment stating it's
reserved for a future gate that changes `DashboardAction.href` from required to optional
(lifecycle actions today are live `onClick` handlers, not navigable hrefs, so the
resolver's current `DashboardAction` shape can't represent them without that change).
**This gate did not extend the resolver's emission logic** — doing so would mean
changing `DashboardAction`'s shape, which is a mutation-architecture change explicitly
out of scope ("Do NOT change mutation endpoints... this is classification/routing/
presentation consolidation").

Instead, lifecycle classification was completed at the **presentation layer**, where it
actually affects what the owner sees: `ActionItem`/`ListingPanelAction`'s `tone` field
gained `"positive"` (resume/reactivate — green), `"warning"` (pause — amber), `"danger"`
(archive/destructive — red), and `"premium"` (specialized/add-on — gold), rendered via
`DashboardListingActionBar`'s `actionClass()` using color-only fragments matching
Package 1's `LX_DASH.btnPositive/btnWarning/btnDanger/btnPremium` tokens (not reusing
those tokens' full button classes directly, which would have conflicted with the
wrapper's own sizing/padding classes — a bug caught and fixed during implementation).
Every pause/resume/archive action already wired in `dashboardMisAnunciosCategoryTools.ts`
(Servicios, Empleos) now carries the matching tone; the same tones are available to (and
now used by) the three bespoke cards.

## 6. Vocabulary normalization on Mis Anuncios (Tasks 2C-6/2C-7/2C-8)

Within `dashboardMisAnunciosCategoryTools.ts` and the three bespoke cards: "Gestionar
vacante" and "Gestionar envío" no longer appear as primary labels anywhere on a Mis
Anuncios card (confirmed by verifier + grep — the one remaining "Gestionar vacante"
string is the *dedicated* `/dashboard/empleos/{listingId}` page's own document title, out
of this gate's scope per Task 2C-17's explicit "Target remains: destination page,"
Gate 2D territory). "Ver detalles" (En Venta card) was renamed to "Ver público"/"View
public" per Task 2C-8. Dedicated Servicios/Restaurantes **page** internal vocabulary was
explicitly NOT touched — Gate 2D owns that.

## 7. Bespoke-card adapter decisions (Task 2C-14)

| Card | What was added/changed | What was deliberately preserved untouched |
|---|---|---|
| `EnVentaListingManageCard.tsx` | Added a real primary "Administrar anuncio" button (`workspaceHref`, always populated by the caller) — none existed before; "Ver detalles"→"Ver público" demoted to secondary styling; fixed `sold`/`pauseAd`(EN)/`archive` label text to canonical; **added a confirmation modal for Archive** (Task 2C-11 — previously fired directly on click, no confirm) | `confirmMarkSold`/`confirmRepublicar` and their existing modals; `onPause`/`onResume`/`onArchive`/`onMarkSold` callback signatures; all category-specific business logic (visibility renewal, price-drop, Pro upsell) |
| `LeonixRealEstateListingManageCard.tsx` (Rentas + Bienes Raíces, both lanes) | Added a real primary "Administrar anuncio" button to `/dashboard/mis-anuncios/{id}` — none existed before (Edit/Preview/View public all rendered with equal plain styling); `previewLabel()` now used via the shared function instead of an inline ternary | The entire BR-Negocio global lifecycle descriptor system (`bienesNegocioCanonicalActions`, `brLifecycleContract`, `brPauseAction`/`brResumeAction`/`brArchiveAction`/`brDiscontinueAction`) — a heavily-documented, already-tested Gate G.2.3.5 system — left completely unmodified, including its existing amber/emerald/gold/stone lifecycle button colors (a deliberate exception to Task 2C-13's red-for-archive guidance, to avoid disturbing a working, carefully-scoped system for a cosmetic-only gain) |
| `AutosClassifiedListingManageCard.tsx` (Autos Privado) | Edit link (`editHref`, always populated) relabeled from plain "Editar" to primary "Administrar anuncio", moved first, given dominant styling; "Ver anuncio"→"Ver público" | `onArchive` callback and its (pre-existing, unchanged) stone-colored styling |
| `AutosDealerInventoryDashboardSection.tsx` (Autos Dealer parent) | Parent edit link relabeled from plain "Editar anuncio"/"Edit listing" to primary "Administrar anuncio"/"Manage listing", dominant styling | Everything else in this large component — dealer/child inventory logic, entitlement/subscription state, `editVehicleId` contracts — untouched; this file was not in Gate 2C's declared file list, touched only for this one isolated label/style change per Task 2C-19 |

## 8. Focused verifier

`scripts/verify-owner-command-center-package2-gate2c.ts` — **44/44 checks pass**,
covering: canonical label text, absence of drift labels, Servicios single-primary
enforcement, lifecycle tone classification, shared-type reuse (no drifted duplicate
`ActionItem` definitions), bespoke-card primary doorways and preserved custom logic,
preview/analytics truth preservation (`"unproven"` statuses unchanged), no universal
Messages CTA, and no protected-system or resolver-internals file touched.

## 9. Build result

`npm run build` — **PASSED** ("Compiled successfully in 2.4min", exit code 0).

## 10. QA status

**Focused verifier + build: fully verified.** **Live owner QA with real listing data: not
performed this session** — same documented environment limitation as Gates 2A/2B (no
real owner session available in this automated sandbox; confirmed environment-wide via a
control page in the Gate 2A audit). The manual QA route list and ES/EN checklist from
this gate's instructions are ready for the owner's own session.

## TRUE/FALSE Scope Table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct worktree/branch used | TRUE | Boundary check matched; HEAD unchanged |
| Canonical primary CTA locked | TRUE | "Administrar anuncio"/"Manage listing" exact text, verifier-confirmed |
| All primary actions canonical | TRUE | Restaurantes/Servicios/Empleos/Viajes/En Venta/Rentas/BR/Autos(both lanes) all confirmed |
| Servicios duplicate primary | FIXED | §3 |
| Lifecycle actionKind | COMPLETED AT PRESENTATION LAYER (not resolver emission — see §5 for why) | — |
| Preview truth preserved | TRUE | `item.previewHref` gate unchanged; verifier-confirmed |
| Analytics truth preserved | TRUE | All `"unproven"` statuses unchanged; verifier-confirmed |
| Universal Messages CTA added | FALSE | Verifier-confirmed absent |
| New routes created | NONE | Every destination used already existed |
| Per-card new network I/O | FALSE | No fetch/Supabase call added to any touched card |
| Action route logic centralized | TRUE for Mis Anuncios' own presentation layer; resolver/registry internals intentionally untouched | §2 |
| Focused verifier passes | TRUE | 44/44 |
| Production build passes | TRUE | Exit code 0 |
| Feature logic changed | FALSE except action classification/routing presentation, plus one added confirmation step (En Venta archive) using existing truth | — |
| Migrations | NONE REQUIRED | Verifier-confirmed, `supabase/migrations` untouched |
| No files staged, committed, or pushed | TRUE | Working-tree modifications only |

No unexplained FALSE rows.

## 11. GATE 2C ARCHITECTURE CLOSURE

Narrow closure pass. No route, mutation, label, or protected-system code was changed.
This section resolves two ambiguities left open by §2/§5/the TRUE/FALSE table above:
whether "action route logic centralized" is accurate, and whether "lifecycle actionKind"
was genuinely completed. Two documentation inaccuracies in §4 (row for
Clases/Comunidad/Busco/Mascotas) and §10/TRUE-FALSE (the "centralized" row) are corrected
below — both are wording/attribution corrections, not behavior changes; no code differs
from what Gate 2C shipped.

### 11.1 Primary-action trace, all 15 in-scope categories (Task 1)

| Category | Rendering component | Primary label | Where href is created | `resolveDashboardActions()` used | `categoryRouteRegistry` used | Adapter used | Final destination | Classification |
|---|---|---|---|---|---|---|---|---|
| En Venta | `EnVentaListingManageCard.tsx` | `openPanelLabel`-equivalent (`L.manage`) | `workspaceHref` prop, direct template `/dashboard/mis-anuncios/${x.id}?${q}` built in `mis-anuncios/page.tsx` | No | No | Yes (implicit — generic workspace) | Generic listing workspace | CANONICAL ADAPTER |
| Restaurantes | `dashboardMisAnunciosCategoryTools.ts` → `DashboardCategoryListingCard` | `openPanelLabel(lang)` | Direct template `/dashboard/restaurantes?${q}` in `buildInventoryListingActions()` | No (deliberately — registry's `edit` route for restaurantes is `/publicar/restaurantes?mode=listing-edit`, a genuinely different destination than the dedicated hub page; using it would be wrong, not just inconsistent) | No (by design) | Yes | `/dashboard/restaurantes` dedicated hub | CANONICAL ADAPTER (intentional resolver bypass) |
| Servicios | `dashboardMisAnunciosCategoryTools.ts` → `DashboardCategoryListingCard` | `openPanelLabel(lang)` | `canonical.get("edit")?.href ?? opts?.serviciosEditHref ?? item.editHref`, where `canonical` = `canonicalInventoryHrefActions()` → `buildListingIdentity()` + `resolveDashboardActions()` | Yes (primary source; 2 legacy fallbacks only fire if resolver doesn't resolve) | Yes (via resolver) | No | Servicios edit flow | CANONICAL RESOLVER (with fallback) |
| Empleos | `dashboardMisAnunciosCategoryTools.ts` → `DashboardCategoryListingCard` | `openPanelLabel(lang)` | `item.editHref` = direct template `/dashboard/empleos/${id}?${q}` built in `dashboardInventory.ts` | No | No | Yes | `/dashboard/empleos/{listingId}` dedicated page (real applicant data) | CANONICAL ADAPTER |
| Viajes | `dashboardMisAnunciosCategoryTools.ts` → `DashboardCategoryListingCard` | `openPanelLabel(lang)` | `item.editHref` = direct template `/dashboard/viajes?${q}&stagedId=${id}` built in `dashboardInventory.ts` | No — registry's `editRoute()`/`previewRoute()` return `null` for Viajes (confirmed at Package 2 design-lock survey) | No | Yes | `/dashboard/viajes` | CANONICAL ADAPTER — see 11.3 |
| Rentas (both lanes) | `LeonixRealEstateListingManageCard.tsx` | `openPanelLabel(lang)` | Direct template `/dashboard/mis-anuncios/${encodeURIComponent(row.id)}?lang=${lang}` built inline in the card | No | No | Yes (implicit — generic workspace) | Generic listing workspace | CANONICAL ADAPTER |
| Bienes Raíces Privado | `LeonixRealEstateListingManageCard.tsx` | `openPanelLabel(lang)` | Same pattern as Rentas | No | No | Yes | Generic listing workspace | CANONICAL ADAPTER |
| Bienes Raíces Negocio (parent+child) | `LeonixRealEstateListingManageCard.tsx` | `openPanelLabel(lang)` | Same pattern as Rentas | No | No | Yes | Generic listing workspace (parent); BR-Negocio lifecycle descriptor system untouched, handles pause/resume/discontinue separately | CANONICAL ADAPTER |
| Autos Privado | `AutosClassifiedListingManageCard.tsx` | `L.manage` | `editHref` prop = direct template `/publicar/autos/privado?edit=1&source=dashboard&listingId={id}` | No | No | Yes | Real edit route | CANONICAL ADAPTER — see 11.3 |
| Autos Dealer (parent) | `AutosDealerInventoryDashboardSection.tsx` | Inline literal "Administrar anuncio"/"Manage listing" | `parentCanonical.get("edit")?.href ?? autosDealerListingEditHref(...)`, where `parentCanonical` = `canonicalAutosNegocioActions()` → `buildListingIdentity()` + `resolveDashboardActions()` (confirmed by direct read, lines 108-139) | Yes (primary source; legacy fallback only if resolver doesn't resolve) | Yes (via resolver) | No | Real edit route | CANONICAL RESOLVER (with fallback) — same pattern as Servicios |
| Comida Local | `ComidaLocalDashboardListings.tsx` (own dedicated fetch/render path, `fetchOwnerComidaLocalListings`, never reaches the generic `listings`-table block) | **None** — dominant-styled button is "Ver ficha"/"View listing" (a public-view action); "Editar"/"Edit" is a plain secondary button, not canonically labeled | `/publicar/comida-local?edit=1&listingId=${id}&source=dashboard` (real, exists) | No | No | No — no adapter applied | Real edit route exists but is not the visually-primary action and carries no canonical label | **NO PRIMARY DOORWAY** — see 11.3 |
| Clases | Generic inline `listings`-row JSX block in `mis-anuncios/page.tsx` (NOT `EnVentaListingManageCard` — corrects §4's prior claim; same destination pattern as En Venta, different component) | `t.manageListing` = "Administrar anuncio"/"Manage listing" (`dashboardI18n.ts`) | Direct template `/dashboard/mis-anuncios/${x.id}?${q}` inline in the block | No | No | Yes (implicit) | Generic listing workspace | CANONICAL ADAPTER |
| Comunidad | Same generic block as Clases | Same | Same | No | No | Yes | Generic listing workspace | CANONICAL ADAPTER |
| Busco | Same generic block as Clases | Same | Same | No | No | Yes | Generic listing workspace | CANONICAL ADAPTER |
| Mascotas/Perdidos | Same generic block as Clases | Same | Same | No | No | Yes | Generic listing workspace | CANONICAL ADAPTER |

**Zero DUPLICATE or UNSAFE/UNKNOWN classifications found.** Comida Local is the one
category with no canonical primary doorway at all — this is a truthful absence (a real
edit route exists and could serve as "Administrar anuncio" per the original gate's own
allowance), not a fabricated or broken one. See 11.3 for its disposition.

**Correction to §4:** the row "Clases / Comunidad / Busco / Mascotas ... these categories
already route through `EnVentaListingManageCard`/generic workspace" is corrected — they
route through a separate generic inline block in `mis-anuncios/page.tsx`, not through the
`EnVentaListingManageCard` component (which is gated strictly to `x.category ===
"en-venta"`, confirmed by direct read). The **destination** claim (generic workspace) was
already accurate; only the component attribution was wrong. No code changed — this is a
documentation correction only.

### 11.2 Servicios — proof of exactly one primary doorway (Task 2)

- **Old competing path:** `if (category === "servicios" && item.actionContract?.manageUrl) { actions.push({ href: item.actionContract.manageUrl, label: openPanelLabel(lang) }) }` — pointed at `/dashboard/servicios?listingSlug=...`, built by `buildServiciosDashboardActionContract()`. Grep-confirmed: this branch no longer exists in `dashboardMisAnunciosCategoryTools.ts`; the only remaining references to `actionContract.manageUrl`/`buildServiciosDashboardActionContract` are (a) the function definition itself in `categoryDashboardActionContract.ts`, (b) its call site in `dashboardInventory.ts:300` (still populates `item.actionContract` for other, still-used fields — `publicUrl`/`editUrl`/`resultsUrl`/`listingId` — not for rendering a second action), and (c) two explanatory code comments. **Zero code paths push a second action from this field.**
- **Surviving path:** `actions.push({ href: canonical.get("edit")?.href ?? opts?.serviciosEditHref ?? item.editHref, label: opts?.editLabelOverride ?? openPanelLabel(lang), tone: "primary" })` — one `tone: "primary"` push in the entire `category === "servicios"` branch (verifier-enforced, §Servicios duplicate primary retired, check "Only one 'servicios' branch pushes a tone:\"primary\" action").
- **Mobile sheet:** `DashboardMobileActionSheet.tsx` is presentation-only — it renders whatever `ActionItem[]` it's given and constructs no hrefs of its own (verifier-enforced: no `href={\`/...\`}` template literals, no `router.push`/`router.replace` in the file). It cannot introduce a second primary independently of what `buildInventoryListingActions()` already produced.
- **Dedicated `/dashboard/servicios` page:** grep-confirmed a single `serviciosEditHref(r)` link per row (two renders — desktop table row and mobile `<li>` — same href, same destination, not a second competing concept), plus `Ver ficha`/`Ver resultados` (non-manage) and `manageListing()` (a local pause/resume async function, unrelated naming collision with the i18n label — not a UI button labeled "Administrar anuncio"). No `manageUrl` reference on this page at all.
- **Conclusion: Servicios has exactly one primary doorway across every surface that renders it** — the Mis Anuncios card (desktop row, mobile sheet) and the dedicated page both resolve to the same real edit destination, with zero hidden or competing second "Administrar anuncio"/"Manage listing" buttons anywhere in the codebase.

### 11.3 Adapter acceptability decisions (Task 3)

| Category | Decision | Reasoning |
|---|---|---|
| Viajes | **ACCEPTED** | Label is truthful ("Administrar anuncio" → real `/dashboard/viajes` destination), the destination is real and stable. Registry integration was never promised for Gate 2C — the original Package 2 design lock explicitly scopes "Viajes registry integration" to Gate 2D (Part 14). Not routing through the resolver here is a scope boundary, not a defect. |
| Autos Privado | **ACCEPTED** | Same reasoning — truthful label, real destination (`/publicar/autos/privado?edit=1...`), resolver/registry integration explicitly deferred to Gate 2D per the design lock's Part 6 ("PACKAGE-2 ADAPTER REQUIRED" — routes only, integration later). |
| Autos Dealer (parent) | **ACCEPTED — already exceeds the adapter bar** | Traced in 11.1: this one already flows through `resolveDashboardActions()` via `canonicalAutosNegocioActions()`, identical in structure to Servicios' pattern. It is not merely an accepted adapter; it is a working CANONICAL RESOLVER integration. Nothing to defer. |
| Comida Local | **DEFERRED TO GATE 2D** | Unlike the three above, Comida Local carries **no canonical label at all** — its dominant-styled button is a public-view action, not a manage doorway, and its real edit route (`/publicar/comida-local?edit=1&listingId=...`) is present but styled/labeled as a plain secondary "Editar"/"Edit". A truthful fix exists (relabel to `openPanelLabel(lang)`, promote to primary styling, no new route) but doing so now would mean editing card-level presentation logic in a file (`ComidaLocalDashboardListings.tsx`) outside this closure pass's investigation scope and outside the two ambiguities this pass was chartered to resolve (Task 1 of the original Gate 2C prompt). Correctly flagged as adapter work for Gate 2D, matching the Package 2 design lock's own Gate 2D scope ("Autos/Comida-Local adapter groundwork"). |

### 11.4 Lifecycle architecture — final decision (Task 4)

**OPTION B — lifecycle stays a deliberately separate canonical layer. Not merged into the resolver.**

We need architectural truth, not checkbox compliance, so this is stated plainly: Option A
(extend `dashboardActionResolver.ts` to emit `"lifecycle"`-kind actions via a
discriminated union) was **not implemented**, and Option B was not "what's left after
running out of time" — it is the correct architecture given the evidence:

1. `app/lib/listingIdentity/dashboardActionTypes.ts` already documents, in its own code
   comment, that extending to lifecycle requires changing `DashboardAction.href` from
   required to optional — a **mutation-architecture change**, not a routing/classification
   one. Gate 2C's mandate was explicitly "classification/routing/presentation
   consolidation," with mutation endpoints explicitly out of scope.
2. Lifecycle actions (pause/resume/archive/mark-sold) are, today, live `onClick` handlers
   calling real mutation functions (`opts.onServiciosManage`, `opts.onEmpleosLifecycle`,
   `applyOwnerListingPatch`, `callBrLifecycleMutation`, etc.) — they do not have hrefs at
   all. Forcing them through a resolver whose entire contract (`DashboardAction.href:
   string`, required) is built around navigable URLs would require either fabricating
   placeholder hrefs (dishonest) or weakening the type for every consumer (a breaking
   change to `resolveDashboardActions()`'s 20+ existing call sites across Servicios,
   Restaurantes, Autos Dealer, BR-Negocio — verified via the `resolveDashboardActions`
   forbidden-file protection already in the verifier, which exists precisely because this
   file must not be touched casually).
3. Presentation-layer classification (the `tone` vocabulary: `positive`/`warning`/
   `danger`/`premium`) already gives the owner the correct visual signal for every
   lifecycle action, which is the actual product requirement — "the owner can tell at a
   glance which buttons are safe vs. destructive vs. paid." Nothing about the resolver's
   internal representation changes what the owner sees.

**Verdict: the resolver's `DashboardActionKind` union correctly remains
`"navigate" | "checkout" | "lifecycle"` with only `"navigate"` emitted, and this closure
pass does NOT change that file** (protected by the verifier's existing "resolver
internals unchanged" check). "Lifecycle actionKind... completed" in the original Gate 2C
report is corrected to: **lifecycle action classification is complete at the
presentation layer (tone), and is deliberately NOT extended into the resolver's emission
logic — this is Option B, a final architectural decision, not a partial/incomplete
Option A.**

### 11.5 Five-layer canonical action architecture (Task 5)

1. **Route truth (deep, per-pipeline)** — `categoryRouteRegistry.ts`. Defines the real
   `editRoute()`/`previewRoute()`/etc. for each pipeline that has one. Returns `null`
   honestly where no such route exists (Restaurantes edit, Viajes, Empleos preview).
   Untouched by Gate 2C or this closure pass.
2. **Navigational action resolution** — `dashboardActionResolver.ts` /
   `resolveDashboardActions()`. Consumes layer 1 via `buildListingIdentity()`, emits
   `DashboardAction[]` (kind `"navigate"` only, today). Consumed directly by Servicios
   and Autos Dealer (parent); consumed indirectly by Restaurantes (deliberately bypassed
   for `edit`, still used elsewhere in that category's identity resolution). Untouched by
   Gate 2C or this closure pass.
3. **Category adapters (small, per-category href construction)** — direct template hrefs
   built inline in `mis-anuncios/page.tsx`, `dashboardInventory.ts`, or a bespoke card
   component (En Venta, Rentas, BR both lanes, Empleos, Clases/Comunidad/Busco/Mascotas,
   Viajes, Autos Privado). Each points at a real, stable, single destination. This layer
   exists because not every category has (or needs) a layer-1/2 registry entry — a direct
   template to a genuinely single-purpose route is not technical debt by itself, only
   when it duplicates or drifts from a real registry entry, which none of these do.
4. **Presentation/label/tone consolidation** — `dashboardMisAnunciosCategoryTools.ts`
   (`CATEGORY_LISTING_TOOL_TRUTH`, `buildInventoryListingActions()`, the canonical label
   functions) plus the shared `ActionItem`/`ListingPanelAction` tone vocabulary. This is
   the layer Gate 2C actually consolidated: every category's primary/secondary/lifecycle/
   premium actions now carry the same vocabulary and tone classification regardless of
   which of layers 2 or 3 produced their href.
5. **Rendering** — `DashboardCategoryListingCard.tsx` / `DashboardListingActionBar.tsx` /
   `DashboardMobileActionSheet.tsx` (shared) and the four bespoke cards (`EnVenta`,
   `LeonixRealEstateListingManageCard`, `AutosClassifiedListingManageCard`,
   `AutosDealerInventoryDashboardSection`). Purely presentational — takes a resolved
   `ActionItem`/href and renders it; constructs no route truth of its own (verifier-
   enforced for the shared mobile sheet).

**"Action route logic centralized" is corrected to:** layers 1-2 (registry + resolver)
are centralized and were correctly left untouched this gate; layers 4-5 (label
vocabulary, tone, rendering) are fully centralized and are what Gate 2C actually
consolidated; layer 3 (category adapters) is intentionally decentralized — a deliberate,
documented architecture, not an oversight — because forcing every category through
layers 1-2 would require inventing registry entries or resolver identities for
categories whose real routes don't need that depth (a scope Gate 2C never claimed and
this closure pass does not authorize).

### 11.6 Task 6 — no green work reopened

No changes were made to: canonical labels, Gate 2B card layout, the mobile sheet, category
nav, Gate 2A performance work, lifecycle mutation behavior, public routes, edit forms,
analytics readiness gating, or the dedicated Servicios/Restaurantes pages. This closure
pass's only outputs are: this audit section, and additive checks in
`scripts/verify-owner-command-center-package2-gate2c.ts`. Comida Local's adapter gap
(11.3) is documented and deferred, not fixed — fixing it was judged out of this closure
pass's chartered scope (the two named ambiguities), not a "genuine 2C gap" that this
narrow pass authorizes touching.

### 11.7 Source changed this closure pass

**NONE.** This pass is documentation (this section) plus verifier-check additions only.
No `.tsx`/`.ts` source file outside the verifier script was edited. `npm run build` was
not re-run; the Gate 2C build result in §9 (PASS, exit code 0) remains valid because no
source code changed since that build.

### 11.8 Closure scope table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Primary-action trace complete for all 15 in-scope categories | TRUE | §11.1 |
| Unexplained legacy primary paths | 0 | §11.1 — every non-resolver path is a documented, real, single-destination adapter |
| Servicios has exactly one primary doorway | TRUE | §11.2 |
| Lifecycle architecture decision made | TRUE — Option B | §11.4 |
| Presentation components own route truth | FALSE | Shared components verified to render only what they're given; adapters live in page/card modules, not in `DashboardCategoryListingCard`/`DashboardListingActionBar`/`DashboardMobileActionSheet` |
| Viajes adapter | ACCEPTED | §11.3 |
| Autos Privado adapter | ACCEPTED | §11.3 |
| Autos Dealer adapter | ACCEPTED (exceeds bar — resolver-integrated) | §11.3 |
| Comida Local adapter | DEFERRED TO GATE 2D | §11.3 |
| Focused verifier | PASS — 53/53 (44 original + 9 closure-added) | `scripts/verify-owner-command-center-package2-gate2c.ts` |
| Source changed this closure | FALSE | §11.7 |
| Production build | Previous PASS remains valid (no source change) | §11.7 |
| Gate 2C fully closed | TRUE | All ambiguities resolved with evidence, no gaps requiring a code fix found |

No unexplained FALSE rows (the one FALSE — "presentation components own route truth" — is
the intended/required answer, not a defect).
