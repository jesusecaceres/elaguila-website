# Owner Command Center — Package 2, Gate 2D Audit

Category adapters + Servicios specialized workspace + Restaurantes cleanup.

## 1. Boundary

```
WORKTREE: C:\projects\elaguila-website-owner-command-center
BRANCH:   integration/owner-command-center-globalization-2026-08
HEAD:     7cf69d6c8abc970305e6b384322821134e14700d (unchanged before/after)
```
Verified before editing — matched expected values; working tree contained only Package 1
+ Gates 2A/2B/2C's already-known changes plus the audit/verifier docs, no unexpected
application source.

## 2. Servicios — before/after architecture

**Before:** `/dashboard/servicios/page.tsx` already used `LeonixDashboardShell`, but its
`t` object (the `lang === "es"` branch) was almost entirely untranslated English —
"My Servicios showcases", "Loading…", "Slug"/"City"/"Status"/"Source", "View showcase",
"Edit listing", "Recent inquiries", "Pause listing", etc. — with only `preview: "Vista
previa"` actually in Spanish. Off-brand solid blue (`#3B66AD`) appeared in four places
(results button, engagement link, desktop "View showcase" link, leads mailto link).
Listing status was shown as the raw DB string (`published`, `paused_unpublished`)
instead of a friendly chip. Row actions used ad-hoc Tailwind classes instead of shared
`LX_DASH` tokens.

**After:**
- Header rewritten to the locked copy: ES "Servicios" / "Administra tus anuncios de
  servicios, estado y herramientas."; EN "Services" / "Manage your Servicios listings,
  status, and tools."
- Every owner-facing string in the `t` object corrected to real Spanish under
  `lang === "es"` (Cargando…, Ciudad, Origen, Navegador, Archivo de desarrollo,
  Publicar otro anuncio, Solicitudes recientes, Enlaces, Gestionar, Analíticas, etc.).
- Row actions now call the shared canonical label functions from
  `dashboardMisAnunciosCategoryTools.ts` (`editListingLabel`, `publicViewLabel`,
  `previewLabel`, `pauseListingLabel`, `resumeListingLabel`, `publicResultsLabel`,
  `publicResultsListingLabel`) instead of local hand-written strings.
- All four `#3B66AD` occurrences replaced with `LX_DASH` tokens / the Leonix burgundy
  (`#7A1E2C`) ink used elsewhere in Owner Command Center.
- Listing status now rendered via the shared `resolveListingUiStatus()` /
  `listingUiStatusLabel()` / `listingUiStatusChipClass()` helpers (same friendly-status
  system already used on Mis Anuncios), replacing the raw DB string.
- **Editar anuncio / Edit listing is the one primary-styled action** (`LX_DASH.btnPrimary`)
  inside the workspace — Ver público, Ver en resultados públicos, and Vista previa are
  secondary (`LX_DASH.btnSecondary`); the offers/coupons shortcut is premium/gold
  (`LX_DASH.btnPremium`); Pausar/Reactivar use `LX_DASH.btnWarning`/`btnPositive`.
- No second "Administrar anuncio"-style destination was reintroduced — this workspace's
  only manage-grade action is the single Editar anuncio href, unchanged
  (`serviciosListingEditHref(...)`), per Task 2D-A6.

**Deliberately unchanged:** the triple-fetch-merge data loading (Leonix/cloud rows +
dev-server rows + local browser backups), the real leads/inquiries panel
(`/api/clasificados/servicios/my-leads`), and the pause/resume mutation
(`/api/clasificados/servicios/manage`) — none of this gate's tasks asked for a data-layer
rebuild, and Part G (Performance Safety) explicitly forbids launching a performance
refactor unrelated to 2D. This remains a real, documented gap for a future gate (matching
the Package 2 design lock's own note that Servicios' triple-fetch dedupe is separate,
lower-priority cleanup work), not something this gate silently deferred without saying so.

## 3. Restaurantes cleanup decisions

Restaurantes was **not rebuilt** — it already used `LeonixDashboardShell`,
`DashboardCategoryListingCard`, and `DashboardStatsCard` (confirmed real specialized
workspace, matching the Package 2 design lock's Part 7 disposition). Changes made:

- Imported and used the shared `ActionItem` type instead of a locally re-declared,
  narrower `{tone: "primary"|"secondary"|"subtle"}` union — this is what let the coupon
  action be correctly reclassified to `"premium"` (§4).
- `cardLeonixAdId` fixed: ES now shows **"ID Leonix"** (was the English string "Leonix
  Ad ID" even under `lang === "es"`) — the exact Restaurantes-specific bug the Package 2
  design lock's Part 3 locked table calls out by name.
- Canonical labels swapped in: `editListingLabel`, `publicViewLabel`,
  `publicResultsListingLabel`, `analyticsLabel` replace the page's own hand-written
  `linkPublic`/`linkResults`/`hydrate`/`openAnalytics` strings (`publicResultsListingLabel`
  and `analyticsLabel`'s text was already byte-identical in both languages — this is a
  centralization, not a visible text change for those two).
- **Two competing `tone: "primary"` actions existed on every card** ("Ficha pública" and
  "Editar restaurante" both primary-styled). Fixed: Editar anuncio is now the sole
  primary; Ver público demoted to secondary.

## 4. "Formulario" decision (Task 2D-B2)

Traced: `t.linkForm` ("Formulario"/"Form") pointed at `publishHref =
/publicar/restaurantes?lang=...` — the exact same URL as the page-level "Publicar un
restaurante" button, i.e. the **create-a-new-restaurant** flow, rendered as a per-row
card action with no relationship to that specific listing. This matches Task 2D-B2's
described scenario exactly.

**Decision: relabeled truthfully, destination unchanged.** New label: ES "Crear otro
anuncio" / EN "Create another listing" (the example given in the prompt). Tone set to
`"subtle"` so it no longer visually competes with Editar anuncio. Destination
(`publishHref`) was not touched — it isn't wrong, only the old label misrepresented it as
an edit/manage action.

## 5. "Mensajes" decision (Task 2D-B3)

Traced: gated behind `DASHBOARD_INTERNAL_INBOX_READY` (confirmed `true`), href
`/dashboard/mensajes?${q}` — the **global** owner inbox, not scoped to any listing.
Every restaurant's card linked to the exact same destination regardless of which row it
appeared on.

**Decision: Option B — removed from the per-listing action cluster.** Presenting a
global inbox as one of several per-listing actions read as listing-scoped messaging that
doesn't exist. The global inbox remains reachable from the shared dashboard nav
(Package 1's nav groups already include a Messages entry) — nothing was removed from the
app, only the misleading per-card placement. No listing-scoped restaurant messaging
infrastructure was built (explicitly out of this gate's scope per the prompt).

## 6. Comida Local — final adapter (Part C)

**Trace (Task 2D-C1):**

| Aspect | Truth |
|---|---|
| Listing source | Own dedicated fetch (`fetchOwnerComidaLocalListings`), mapped via `mapComidaLocalRowToDashboardVm` |
| Rendering component | `ComidaLocalDashboardListings.tsx` |
| Edit href | `/publicar/comida-local?edit=1&listingId={id}&source=dashboard&{q}` — real, same-row dedicated editor |
| Preview truth | None — no preview link exists in this component; matches `CATEGORY_LISTING_TOOL_TRUTH["comida-local"]` |
| Public href | `item.publicPath` — real |
| Analytics truth | `"unproven"` (unchanged, Gate 2E's job) |
| Lifecycle truth | Real — `/api/clasificados/comida-local/lifecycle` POST, owner-verified server API |
| Specialized tools | None |

**Canonical primary (Task 2D-C2):** the real edit route above safely acts as owner
management (it is the dedicated same-row editor, not a generic/unrelated form) — no
BLOCKED condition applies. Relabeled from plain "Editar"/"Edit" to `openPanelLabel(lang)`
= "Administrar anuncio"/"Manage listing", promoted to `LX_DASH.btnPrimary`. No new route
created.

**Reclassification (Task 2D-C3):** "Ver ficha"/"View listing" — previously the
dominant-styled button despite being a public-view action, not a manage action — demoted
to secondary styling and relabeled `publicViewLabel(lang)` = "Ver público"/"View public".
Pause/Resume relabeled to the canonical `pauseListingLabel`/`resumeListingLabel` and
restyled with `LX_DASH.btnWarning`/`btnPositive`. No specialized-tools row exists for this
category (none was fabricated). No new network I/O added.

## 7. Accepted adapter certification (Part D)

Narrow re-check only — none of these three files were touched this gate.

| Category | Canonical primary | Confirmed |
|---|---|---|
| Viajes | `openPanelLabel(lang)`, tone `"primary"`, inside the `category === "viajes"` branch of `buildInventoryListingActions()` | PASS — unchanged from Gate 2C |
| Autos Privado | `L.manage` = "Administrar anuncio"/"Manage listing" rendered via `{L.manage}` | PASS — unchanged from Gate 2C |
| Autos Dealer (parent) | `parentCanonical.get("edit")?.href ?? autosDealerListingEditHref(...)`, resolver-backed via `canonicalAutosNegocioActions()` | PASS — unchanged from Gate 2C |

## 8. Specialized vs. generic workspace map (Part E)

```
SPECIALIZED WORKSPACES:
  Restaurantes        — /dashboard/restaurantes (dedicated hub, cleaned this gate)
  Servicios           — /dashboard/servicios (dedicated hub, rebuilt this gate)
  Empleos             — /dashboard/empleos/{listingId} (existing dedicated per-listing route)
  Autos Dealer         — AutosDealerInventoryDashboardSection (parent+child inventory surface)

GENERIC WORKSPACE CATEGORIES (route to /dashboard/mis-anuncios/{id}):
  En Venta, Rentas (both lanes), Bienes Raíces Privado, Bienes Raíces Negocio,
  Clases, Comunidad, Busco, Mascotas/Perdidos

DIRECT TRUTHFUL ADAPTER CATEGORIES:
  Viajes              — /dashboard/viajes (accepted, Gate 2C)
  Autos Privado       — /publicar/autos/privado?edit=1... (accepted, Gate 2C)
  Comida Local        — /publicar/comida-local?edit=1... (resolved this gate — canonical
                          primary now present, targeting the existing real edit route)

OUT OF SCOPE (unchanged):
  Ofertas Locales — deliberately separate hub, not part of Mis Anuncios' category set
```

No route was multiplied or duplicated — every category above resolves to a destination
that already existed before this gate.

## 9. Responsive behavior

Servicios and Restaurantes both continue to use the same responsive patterns already
certified in Package 1/Gate 2B: `LeonixDashboardShell` (mobile drawer nav), a `md:hidden`
card list + `hidden md:block` table split (Servicios, pre-existing pattern, preserved),
and `DashboardCategoryListingCard`'s own primary/view/lifecycle/premium action-bucket
rendering with mobile overflow sheet (Restaurantes, inherited automatically from the
shared component — no bespoke responsive code needed since Restaurantes was never
rebuilt). Comida Local's card list is a simple `flex flex-wrap gap-2` action row inside a
`sm:flex-row` card, unaffected by this gate's label/tone-only changes. No new horizontal
scroll, no new button walls — the action count per card did not increase in any category
touched this gate (only labels/tones/styling changed; Restaurantes lost one action
[Mensajes], relabeled one [Formulario→Crear otro anuncio]).

**Not independently re-tested at 390/768/1440 in a live browser this session** — same
documented environment limitation as every prior gate (no real authenticated Supabase
session in this automated sandbox; confirmed environment-wide in the Gate 2A audit).
Reasoned from the underlying components' already-certified responsive behavior (Package 1,
Gate 2B) rather than fabricated as directly observed.

## 10. Focused verifier

`scripts/verify-owner-command-center-package2-gate2d.ts` — **42/42 checks pass**, covering
Servicios (shell/theme reuse, no restored `manageUrl` branch, one canonical edit operation,
i18n drift fixed, off-brand blue removed, friendly status chip, preview truth, lifecycle
endpoint/labels, leads preserved, no new per-listing fetch), Restaurantes (remains
specialized, no fabricated preview, Formulario/Mensajes decisions, canonical labels, ID
Leonix localization, exactly one primary action, coupon reclassified to premium), Comida
Local (canonical primary exists and targets the real route, no fake workspace, action
classification, lifecycle endpoint unchanged, tool-truth `openPanel: "hidden"` still
honest at the Mis Anuncios layer), the three accepted-adapter re-certifications, and global
protected-system/no-new-route negative checks.

## 11. Build result

`npm run build` — **PASSED** ("Compiled successfully in 2.8min", exit code 0).

## 12. Scope audit

Files changed this gate:
- `app/(site)/dashboard/servicios/page.tsx` (rebuilt — i18n, shell tokens, status chip, canonical labels, off-brand color removal)
- `app/(site)/dashboard/restaurantes/page.tsx` (targeted cleanup — vocabulary, Formulario/Mensajes decisions, ID Leonix, one-primary-action fix)
- `app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx` (canonical primary added, actions reclassified)
- `package.json` (added `verify:owner-command-center:package2:2d`)
- New: `scripts/verify-owner-command-center-package2-gate2d.ts`, this audit doc

No route files created. No mutation endpoints, RLS policies, migrations, entitlement
logic, analytics writers, Gate 2A performance files, Gate 2B nav-layout file, or Gate 2C
resolver/registry files touched this gate (verifier-confirmed).

## 13. Deferred issues — Gate 2E (or later) only

- Servicios' triple-fetch-merge data loading (cloud + dev-server + browser-backup) is not
  deduped to the shared `fetchOwnerServiciosListings()`/`buildServiciosInventoryItems()`
  helpers mentioned in the Package 2 design lock — a real, documented, lower-priority
  cleanup item, not attempted this gate per the performance-safety boundary (Part G).
- Restaurantes' own inline `restaurantes_public_listings` SELECT remains a byte-identical
  duplicate of `fetchOwnerRestaurantListings()` in `dashboardInventory.ts` — untouched,
  same reasoning.
- Restaurantes' analytics remains global-only (`"unproven"` for per-listing) — Gate 2E's
  stated job, not this gate's.
- Comida Local's analytics remains `"unproven"` — unchanged, no real emitter confirmed
  this gate, left honest rather than flipped speculatively.

## TRUE/FALSE Scope Table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct worktree/branch used | TRUE | §1 |
| Servicios uses shared shell/theme | TRUE | §2, verifier-confirmed |
| Servicios competing primary routes | 0 | §2 |
| Servicios i18n cleaned | TRUE | §2, verifier-confirmed |
| Servicios off-brand blue removed | TRUE | §2, verifier-confirmed |
| Servicios lifecycle preserved | TRUE | §2 |
| Restaurantes remains specialized workspace | TRUE | §3 |
| Restaurantes Formulario truthful | TRUE | §4 |
| Restaurantes Messages decision documented | TRUE (Option B — removed from per-listing cluster) | §5 |
| Restaurantes preview fabricated | FALSE | §3, verifier-confirmed |
| Comida Local canonical primary exists | TRUE | §6 |
| Comida Local fake workspace created | FALSE | §6 |
| Viajes/Autos Privado/Autos Dealer adapters | PASS (all 3) | §7 |
| New routes created | NONE | §8 |
| Per-card new network I/O | FALSE | verifier-confirmed |
| Gate 2A performance regression | FALSE | no data-loading logic touched |
| Focused verifier passes | TRUE | 42/42 |
| Production build passes | TRUE | exit code 0 |
| Migrations | NONE | verifier-confirmed |
| No files staged, committed, or pushed | TRUE | working-tree modifications only |

No unexplained FALSE rows.
