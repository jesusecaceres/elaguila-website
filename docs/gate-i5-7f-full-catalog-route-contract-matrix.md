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
and
[`scripts/gate-i6b-quick-clasificados-integrity-selftest.ts`](../scripts/gate-i6b-quick-clasificados-integrity-selftest.ts).
It does not claim the two route systems are unified, and it does not repair every stale value it
documents — see [Unresolved Route Debt](#unresolved-route-debt).

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
  before a publisher UPDATEs it instead of inserting a new row. Any verification failure (missing,
  invalid, not-found, owner-mismatch, category-mismatch, query-error) falls back to the original
  insert-only behavior — never an unscoped update. See
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
| **Rentas default-lane decision** | Unchanged, not part of Work Package I.5.8. Both lanes share one `hubRoute` (`/clasificados/publicar/rentas`) distinct from either lane's own `applicationRoute`. The dashboard's default Rentas publish CTA goes straight to Privado, skipping the hub chooser — a product decision, not a bug, but undocumented in the registry itself. |
| **Missing quick-category test coverage** | Before Gate I.5.7F, Ofertas Locales, Cupones, Comida Local, and each quick-listing category (Busco/Clases/Comunidad/Mascotas/Viajes) had no dedicated route-contract test, only generic pass-through coverage via `gate-i5-1`. The matrix now covers all 17 pipelines uniformly. |
| ~~En Venta / Busco / Clases / Comunidad missing Edit~~ | **Resolved in Work Package I.6A.** All four now resolve to the real, generic, owner-verified `/dashboard/mis-anuncios/{id}/editar` page — same bug class and fix pattern as the Restaurantes correction (I.5.7E). |
| ~~En Venta / Busco / Clases / Comunidad duplicate-row risk on republish~~ | **Mitigated in Work Package I.6B, not eliminated.** Each publisher now verifies and reuses a session-persisted, owner+category-checked canonical UUID instead of always inserting. This closes the in-flight retry/refresh window. It does NOT protect a later, unrelated visit to the same form (by design — that's the generic editor's job) or two truly concurrent submit clicks racing before either round-trips a row id (documented, not solved — see [Duplicate-Row Prevention Scope](#duplicate-row-prevention-scope)). |
| ~~Mascotas public-route root cause~~ | **Repaired in Work Package I.6B.** The shared `anuncio/[id]` shell's `CATEGORY_KEYS` allowlist now includes `mascotas-y-perdidos`, and a dedicated `MascotasPerdidosPublishedDetailPage` component renders it correctly. `publicRoute()` is now real. Editing remains unsupported (no safe category-specific editor exists yet). |
| **Future shared facade / legacy-builder retirement** | Still explicitly deferred — Gate I.5.7D-R's Table G places this as the last wave (Wave 8/9), after the smaller corrections land and prove the pattern repeatedly. Not attempted here. |

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
| `rentas_negocio` | Negocios | supported | missing | supported | supported | stale (`/results`) | supported | not_applicable | no |
| `rentas_privado` | Clasificados | supported | missing | supported | supported | stale (`/results`) | supported | not_applicable | no |
| `empleos` | Clasificados | supported (legacy CTA disagrees) | supported | intentionally_unsupported (lane-ambiguous) | category_specific | **supported `/resultados`** (I.5.8) | supported | not_applicable | no |
| `en_venta` | Clasificados | category_specific (temp exception) | **supported** (I.6A, generic editor) | supported | supported | supported | supported | not_applicable | no |
| `comida_local` | Negocios | supported | missing | supported | category_specific | stale (dupes entry) | supported | not_applicable | no |
| `ofertas_locales` | Negocios | supported | supported | supported | category_specific | supported | supported (dedicated) | not_applicable | no |
| `busco` | Clasificados | supported | **supported** (I.6A, generic editor) | supported | supported | supported | supported | not_applicable | no |
| `clases` | Clasificados | supported | **supported** (I.6A, generic editor) | supported | supported | supported | intentionally_unsupported (no dedicated tab) | not_applicable | no |
| `comunidad` | Clasificados | supported | **supported** (I.6A, generic editor) | supported | supported | supported | intentionally_unsupported (no dedicated tab) | not_applicable | no |
| `mascotas_y_perdidos` | Clasificados | supported | missing (no safe editor) | supported | **supported** (I.6B, shell allowlist fixed) | supported | intentionally_unsupported (no dedicated tab; generic workspace not extended here) | not_applicable | no |
| `viajes` | Negocios | supported | missing | **missing** (ambiguous lanes) | **missing** (ambiguous trees) | supported | supported | not_applicable | no |

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
| rentas_negocio/privado | `sourceId` | full | No confirmed edit href-builder | Confirm/build edit route |
| empleos | `sourceId` | full | Lane-ambiguous preview; results duplication resolved (I.5.8); legacy landing-CTA slug disagreement (`/clasificados/publicar/empleos` vs `/publicar/empleos`) still unresolved | Empleos publish-CTA reconciliation |
| en_venta | `sourceId` | full | No modern publish hub; Storefront lane unrepresented; Edit resolved (I.6A) but generic-only; republish duplicate-row risk mitigated, not eliminated (I.6B) | Build modern hub; build prefill-from-existing edit |
| comida_local | `sourceId` | full | Results route unconfirmed distinct from landing | Confirm/build results route |
| ofertas_locales | `sourceId` | full | No confirmed payment/checkout route | Confirm monetization contract |
| busco | `sourceId` | full | Edit resolved (I.6A, generic editor); legacy hub CTA disagreement; republish duplicate-row risk mitigated, not eliminated (I.6B) | Fix legacy CTA; build prefill-from-existing edit |
| clases/comunidad | `sourceId` | full | Generic dashboard discovery now exposed (I.6B) — registry `dashboardRoute` still correctly null (no dedicated tab); Edit resolved (I.6A, generic editor); republish duplicate-row risk mitigated, not eliminated (I.6B); shared implementation confirmed intentional (not an unconfirmed fork) | Build prefill-from-existing edit if ever prioritized |
| mascotas_y_perdidos | `sourceId` | full | **Public detail repaired (I.6B)** — shared shell allowlist fixed, dedicated renderer added. Edit remains unsupported (no safe category-specific editor exists). | Build a safe category-specific edit surface if ever prioritized |
| viajes | `sourceId` | full | Two ambiguous detail/preview trees (unresolved); legacy publish-map value corrected (I.5.8) | Needs product clarification on detail/preview trees, not a routing guess |

---

*Generated for Gate I.5.7F. Do not treat this document as evidence that the two route systems have
been unified — they have not. See [Unresolved Route Debt](#unresolved-route-debt) for what remains.*
