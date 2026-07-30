# Gate I.5.7F — Full-Catalog Route Contract Matrix

Status as of Work Package I.5.8, branch `integration/lifecycle-foundation-2026-07`. This is the
single ledger for full-catalog route truth — Work Package I.5.8 updated it in place rather than
creating a competing document.

This document is **evidence-backed documentation, not an implementation plan**. It records the
current truth of every registered category/pipeline's route surfaces, enforced by
[`scripts/gate-i5-7f-full-catalog-route-contract-selftest.ts`](../scripts/gate-i5-7f-full-catalog-route-contract-selftest.ts)
and, for the specific fixes below, by
[`scripts/gate-i5-8-empleos-autos-viajes-route-drift-selftest.ts`](../scripts/gate-i5-8-empleos-autos-viajes-route-drift-selftest.ts)
and
[`scripts/gate-i5-8-bienes-autos-parent-child-action-protection-selftest.ts`](../scripts/gate-i5-8-bienes-autos-parent-child-action-protection-selftest.ts).
It does not claim the two route systems are unified, and it does not repair every stale value it
documents — see [Unresolved Route Debt](#unresolved-route-debt).

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
  hub exists); editing is inline-only in Mis Anuncios, never a distinct URL.
- **Ofertas Locales** — has its own dedicated `/dashboard/ofertas-locales` surface, deliberately
  excluded from Mis Anuncios. Cupones is confirmed **not** a separate pipeline — `/cupones` renders
  the identical component with `surface="cupones"`.
- **Clases / Comunidad** — `dashboardRoute()` intentionally returns `null` (confirmed
  `ready:false` in the live Mis Anuncios config, no management surface exists).
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
| `en_venta` | Clasificados | category_specific (temp exception) | intentionally_unsupported (inline-only) | supported | supported | supported | supported | not_applicable | no |
| `comida_local` | Negocios | supported | missing | supported | category_specific | stale (dupes entry) | supported | not_applicable | no |
| `ofertas_locales` | Negocios | supported | supported | supported | category_specific | supported | supported (dedicated) | not_applicable | no |
| `busco` | Clasificados | supported | missing | supported | supported | supported | supported | not_applicable | no |
| `clases` | Clasificados | supported | missing | supported | supported | supported | intentionally_unsupported | not_applicable | no |
| `comunidad` | Clasificados | supported | missing | supported | supported | supported | intentionally_unsupported | not_applicable | no |
| `mascotas_y_perdidos` | Clasificados | supported | missing | supported | **missing** (confirmed gap) | supported | intentionally_unsupported | not_applicable | no |
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
| en_venta | `sourceId` | full | No modern publish hub; Storefront lane unrepresented | Build modern hub (proven zero-behavior-change) |
| comida_local | `sourceId` | full | Results route unconfirmed distinct from landing | Confirm/build results route |
| ofertas_locales | `sourceId` | full | No confirmed payment/checkout route | Confirm monetization contract |
| busco | `sourceId` | full | Edit param shape unconfirmed; legacy hub CTA disagreement | Confirm edit params |
| clases/comunidad | `sourceId` | full | No dashboard surface (confirmed) | None — working as designed |
| mascotas_y_perdidos | `sourceId` | full | **No public detail route anywhere** | Investigate before further work |
| viajes | `sourceId` | full | Two ambiguous detail/preview trees (unresolved); legacy publish-map value corrected (I.5.8) | Needs product clarification on detail/preview trees, not a routing guess |

---

*Generated for Gate I.5.7F. Do not treat this document as evidence that the two route systems have
been unified — they have not. See [Unresolved Route Debt](#unresolved-route-debt) for what remains.*
