# Owner Command Center — Package 3, Gate 3B Audit

Generic Owner Catalog Migration — En Venta/Varios, Rentas Privado, Bienes Raíces
Privado/FSBO, Clases, Comunidad, Busco/Se Busca, Mascotas y Perdidos.

## Controlling document

`LEONIX_OWNER_COMMAND_CENTER_SINGLE_SOURCE_CONSTRUCTION_BIBLE.md` — read in full in this
worktree session prior to Gate 3A and reconfirmed for this gate. No conflict requiring a
report was found: every requirement below (single shared manage surface, capability-gated
lifecycle actions, no new category landing routes, "small category adapter" doctrine) was
directly implementable from repo truth.

## 1. Boundary

```
WORKTREE: C:\projects\elaguila-website-owner-command-center
BRANCH:   integration/owner-command-center-globalization-2026-08
HEAD:     7cf69d6c8abc970305e6b384322821134e14700d (unchanged before/after)
```
Verified before editing — matched expected values; Package 1 + Gates 2A–3A's known changes
present, nothing unexpected.

## 2. Repo-truth research (Part 1)

Before any edit, four independent read-only research passes mapped current route/capability
truth for all seven target categories plus the shared `mis-anuncios` architecture. The
central finding, confirmed identically across all four passes: **none of the seven target
categories has a dedicated dashboard page.** Every one of them is managed through exactly
the same three generic surfaces:

- **List/library**: `app/(site)/dashboard/mis-anuncios/page.tsx`, filtered by `?cat=`.
- **Per-listing manage/detail workspace**: `app/(site)/dashboard/mis-anuncios/[id]/page.tsx`
  — the single real "manage this listing" surface for all seven categories at once,
  previously a bespoke tabbed (overview/analytics/messages/edit/promotion/status) page built
  on a parallel `EV_SELLER_DETAIL`/`evDetailClass` theme system (the "En Venta seller detail
  theme," flagged in the prior Master Product System Discovery survey as exactly the kind of
  parallel-theme debt worth retiring).
- **Field edit**: `app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx` — confirmed
  bespoke dark theme (`bg-black text-white`), shared across all seven categories via
  per-category field adapters in `categoryLifecycleAdapters.ts`.

This meant Gate 3B's real engineering surface was one file, not seven — exactly the
"small category adapter" pattern the Bible calls for, since the category-branching logic
(`isEnVentaListing`, `isBrNegocioListing(row)`, Busco's Leonix-ad-id formatting, Rentas'
public-path builder) already lived inline in that one file.

## 3. Migration target and scope decision

**Migrated**: `app/(site)/dashboard/mis-anuncios/[id]/page.tsx` — presentation only.

**Explicitly NOT migrated this gate** (identified, documented, deferred — not silently
skipped):
- `app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx` — the bespoke dark-theme field
  editor. This is a full field-level form (title/price/photos/description plus per-category
  structured fields), a materially larger and riskier undertaking than the read-mostly
  workspace page, and matches the Master Blueprint's own revised implementation wave
  program, which lists "generic editor rebuild" as its own separate future wave (Wave F),
  distinct from the generic-category workspace migration this gate performs. Two real,
  pre-existing defects were found in this page during research and are flagged here for
  that future gate rather than fixed now: (1) `markStatus("sold")`/`markStatus("active")`
  buttons render unconditionally for every category reaching this page, the same
  fake-capability pattern Gate 3B fixes in `[id]/page.tsx`; (2) it is the single largest
  visual-debt item in the dashboard tree per the prior survey.
- List-level manage cards (`EnVentaListingManageCard.tsx`,
  `LeonixRealEstateListingManageCard.tsx`, and the inline Clases/Comunidad/Busco/Mascotas
  catch-all block in `mis-anuncios/page.tsx`) — left as-is. Per the Bible's own hierarchy
  ("Mis Anuncios = library, Owner Entity Workspace = manage specific item"), these are
  library-tier preview cards, not the "manage specific item" destination Layer C targets.
  Research confirmed all of them already use the canonical `openPanelLabel()`
  ("Administrar anuncio"/"Manage listing") doorway, already correctly pointing at
  `/dashboard/mis-anuncios/{id}` — Part 3's requirement was already satisfied from a prior
  gate (Gate 2C), verified rather than assumed.
- **Bienes Raíces Negocio** — not a Gate 3B target. Its lifecycle goes through a real
  server-authorized RPC route (`callBrLifecycleMutation`), not the generic direct-write path
  this gate's capability gating assumes. Rows reaching this shared page that resolve
  `isBrNegocioListing(row) === true` fall back to this page's original, unchanged,
  unconditional lifecycle-button behavior — this migration changes nothing for that lane.

## 4. Layer B decision — no `OwnerProductPageFrame` on this page

`mis-anuncios/[id]/page.tsx` is a single-item detail page, not a category collection page.
Layer B's job (category-level create/results action header, collection rhythm across many
listings, shared loading/empty/error layout for a list) does not apply to a page that always
shows exactly one listing. Per the Bible's "use the smallest architecture that satisfies the
global contract," this page composes as `LeonixDashboardShell → OwnerEntityWorkspace`
directly — the same composition depth as Gate 3A's original design before the Layer B gap
was found, but correct here rather than a regression, because there is no category-level
collection header this page needs to own.

## 5. Capability registry reconciliation (Part 2)

`app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts` already carried provisional
entries for all seven target categories from Gate 3A's provisioning pass. Repo-truth
research found one real, cross-confirmed correction needed:

**`identity.analytics` corrected from `"unproven"`/`"unsupported"` to `"supported"`** for
all seven categories (`en-venta`, `rentas-privado`, `bienes-raices-privado`, `clases`,
`comunidad`, `busco`, `mascotas-y-perdidos`). Evidence: `mis-anuncios/[id]/page.tsx` queries
real `listing_analytics` rows and renders a live, category-agnostic analytics section for
every one of these categories — confirmed independently by all four research passes, and
for Rentas Privado additionally cross-confirmed by a dedicated repo audit doc
(`app/(site)/clasificados/rentas/RENTAS_ANALYTICS_TRUTH_AUDIT.md`). This was not a guess
promoting "unproven" to "supported" without evidence — it is exactly the registry's own
documented correction path: "Update only where repo truth proves correction is necessary."

**`specialized.activity` corrected from `"unsupported"` to `"supported"`** for all seven.
Real per-listing `messages` rows are fetched by this same shared workspace (filtered by
`listing_id`) for every category — previously fetched into state and never rendered (a
`"messages"` tab existed in the `Tab` union with a `useEffect` that immediately redirected
away from it if ever selected — confirmed dead, not a fabricated data source). Gate 3B
surfaces this real, previously-orphaned data through `OwnerEntityActivity`.

**Lifecycle fields (`pause`/`reactivate`/`archive`/`markSold`) were NOT changed in the
registry** — they were already correct. The real correction needed was in the *page*, not
the registry: `mis-anuncios/[id]/page.tsx` previously rendered Pause/Resume/Reactivate/Mark
sold buttons unconditionally for every category regardless of the registry's already-correct
truth (e.g. a Busco or Mascotas listing showed a "Marcar vendido" button despite having no
sold concept at all — confirmed a real, live, pre-existing over-exposure, not a hypothetical
one). Gate 3B fixes this by gating every lifecycle action through
`getOwnerEntityCapabilities()`, aligning the workspace with the same truth the (already
correctly gated) list-level cards use.

## 6. "Reactivar"/"Restaurar" duplicate control — merged, not duplicated

The legacy page exposed two separate buttons that both ultimately reactivate a listing:
`markStatus("active")` (always visible, direct write, no BR-Negocio safety check) and
`resumeListing()` (visible only when paused/unpublished, includes the real BR-Negocio
RPC-authorized branch). Per the Bible's "no duplicate primary action" doctrine (the same
principle Gate 3A applied removing Restaurantes' duplicate "Crear otro anuncio"), these are
merged into one capability-gated "Restaurar" action calling `resumeListing()` — the safer of
the two real implementations. This also closes a latent safety gap for Bienes Raíces
Negocio rows reaching this page: the unconditional `markStatus("active")` button previously
let an owner bypass the RPC-authorized capacity check that BR-Negocio's resume otherwise
requires. No backend logic was rewritten — `resumeListing()`'s own implementation, including
its BR-Negocio branch, is untouched; only which button is exposed changed.

## 7. Detail identity fields

Now built via `OwnerEntityDetailGrid`, omitting a field entirely rather than showing a "—"
placeholder when no real value exists (price, city, created, updated, published, listing
expiration + chip, visibility window end + chip, plan, visibility state, and — for En Venta
Pro listings only — last refresh date + count, previously shown only inside the dropped
"promotion" tab and preserved here as a real detail row rather than dropped).

## 8. Performance

`OwnerEntityPerformance`, fed by the exact same `analyticsMetricCards` computation as
before (En Venta gets its richer contact-click breakdown; every other category gets the
generic views/unique/shares/CTA/opens set) — capability-gated on the corrected `analytics:
"supported"` registry value. The real "analytics degraded" signal (shown when the
`listing_analytics` query itself errors) is preserved via the workspace's `footerHint` slot
rather than silently dropped.

## 9. Activity

Real per-listing `messages`, previously fetched and never rendered, now surfaced through
`OwnerEntityActivity` — capability-gated on the corrected `specialized.activity: "supported"`
registry value.

## 10. Specialized tools

En Venta's real Pro-only refresh/visibility-renewal capability
(`computeEnVentaVisibilityRenewalVm`, `refreshEnVentaListing()`, unchanged) renders through
`OwnerEntitySpecializedTools`, gold role, only when `isEnVentaListing && listingPlan ===
"pro" && canEnVentaRefresh` — matching its actual, narrow, real eligibility exactly as
before. When Pro but not currently eligible, the real reason (`enVentaRefreshBlockedReason`)
surfaces via `footerHint` rather than being dropped.

## 11. Action semantics

Burgundy primary (Edit), cream/neutral quick view (View public), green positive
(Restaurar), amber caution (Pausar), red consequential (Marcar vendido, Archivar), gold
specialized (Actualizar anuncio) — all via the same `DashboardListingActionBar`/`ActionItem`
tone system Gate 3A established; no category-specific color map introduced. The raw
Tailwind `emerald-*` classes the legacy tab bar hardcoded for its own "Restaurar" button
(the exact drift the prior architecture survey's G-15 finding flagged) are gone — every
positive-lifecycle action now resolves through the shared `#2A4536` green.

## 12. Responsive / mobile

Reuses the same `DashboardMobileActionSheet` every Gate 3A/3B surface shares — no new
drawer implementation. Primary action full width; quick view + lifecycle + specialized
collapse into the shared "More options" sheet below `md:`.

## 13. Focused verifier

`scripts/verify-owner-command-center-package3-gate3b.ts` — covers: canonical manage-doorway
label unchanged, shared `OwnerEntityWorkspace` architecture with no bespoke outer shell, no
new category landing routes, shared header/detail/performance/status/mobile primitives,
capability-gated lifecycle actions (no fake capability), explicit per-category proof for all
seven declared targets (no collapsed "etc." check), byte-preserved public/edit/results
routes, byte-preserved lifecycle mutation functions, no new per-card I/O, the capability
registry's analytics correction for all seven categories, and the full protected-systems
negative-check block (payments, Community Trust writers, analytics writers, route registry,
admin, Business Concierge engines, auth/RLS, the untouched editar page).

## 14. Build result

`npm run build` — see final structured output for this pass's result.

## 15. Protected-system audit

`git diff --name-only` / `git status --short` confirmed clean against every protected
pattern in this gate's boundary — no payments/Stripe, Community Trust write logic,
analytics writers, route registry, admin, Business Concierge engine, auth/RLS file touched.
No migration. `mis-anuncios/[id]/editar/**` untouched (explicitly out of scope, see §3). No
new routes (confirmed via untracked-file check).

## 16. Deferred items

- `mis-anuncios/[id]/editar/page.tsx` field-editor dark-theme rebuild — future "generic
  editor rebuild" wave, per §3.
- The editar page's own unconditional Mark sold/Mark active buttons (same fake-capability
  pattern this gate fixed in `[id]/page.tsx`) — flagged for that same future wave.
- List-level manage card visual convergence (`EnVentaListingManageCard.tsx`,
  `LeonixRealEstateListingManageCard.tsx`, the Clases/Comunidad/Busco/Mascotas inline
  catch-all block) — left as library-tier preview cards per the Bible's hierarchy; not this
  gate's declared scope.
- Bienes Raíces Negocio and Rentas Negocio inventory workspaces — explicitly future gates
  per the program's own sequencing.

## TRUE/FALSE Scope Table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct worktree/branch used | TRUE | §1 |
| Controlling Bible followed, no unreported conflict | TRUE | Controlling document note |
| Real repo truth researched before any edit (all 7 targets) | TRUE | §2 |
| One shared manage surface migrated onto OwnerEntityWorkspace | TRUE | §3, verifier-confirmed |
| New category landing routes created | FALSE | §4, verifier-confirmed |
| Capability registry analytics correction applied (7 categories) | TRUE | §5, verifier-confirmed |
| Fake capability (unconditional Mark sold / Pause / Reactivate) present | FALSE (corrected) | §5, verifier-confirmed |
| Duplicate reactivate control present | FALSE (merged) | §6 |
| Real activity data (messages) surfaced | TRUE | §9 |
| Real data silently dropped | FALSE | §7, §8, §10 — degraded-analytics signal and refresh-blocked reason preserved via footerHint |
| Off-brand emerald lifecycle color remaining | FALSE | §11, verifier-confirmed |
| Public/edit/results routes changed | FALSE | §13, verifier-confirmed byte-preserved |
| Lifecycle mutation backend logic changed | FALSE | §6, §13 — presentation only, functions untouched |
| New per-card I/O | FALSE | §13, verifier-confirmed (createSupabaseBrowserClient call count unchanged) |
| Gate 2A performance regression | FALSE | No Gate 2A file touched this gate |
| app/admin changed | FALSE | §15 |
| Business Concierge engine changed | FALSE | §15 |
| Migrations | NONE | §15 |
| editar page touched | FALSE | §3, §16 — explicitly deferred |
| Files staged, committed, or pushed | TRUE (none) | Working-tree modifications only |

No unexplained FALSE rows.

## 17. Post-recovery continuity (Part 21 — Structural/Responsive QA)

The desktop/remote-control host disconnected mid-gate after the items in §1–§16 above were
already complete (verifier 57/57, typecheck clean, production build clean, dev server
serving 200s). On reconnect, worktree/branch/HEAD were reverified unchanged
(`7cf69d6c8abc970305e6b384322821134e14700d`, `integration/owner-command-center-globalization-
2026-08`), and every file this section depends on was reconfirmed present on disk before any
further work resumed — no research or migration work was redone.

**Re-verified fresh, not carried forward on faith:**
- `npm run verify:owner-command-center:package3:3b` — re-ran clean: **57/57 checks passed**.
- `npx tsc --noEmit --incremental false` — re-ran clean: **0 errors**.
- `git diff --check` — clean (no conflict markers; one pre-existing LF/CRLF warning on
  `messages/page.tsx`, unrelated to this gate).
- Dev server had not survived the host interruption (no process on :3000). Restarted via
  `next dev` only — no production build was re-run, per this gate's own build policy, since
  no source edits were made this session.
- `GET /dashboard/mis-anuncios?lang=es` → **200** (confirmed via server log, not assumed).
- `GET /dashboard/mis-anuncios/qa-placeholder-id?lang=es` → **200** at the server, followed by
  an honest client-side redirect to `/login` — the browser session used for this QA pass
  carried no auth cookie (`document.cookie` empty), so this is the correct, truthful
  unauthenticated behavior, not a bug and not a fabricated "empty state."

**390 / 768 / 1440 structural QA:** Performed against the parts of the tree that render
without an authenticated session (global header, `LeonixDashboardShell` sidebar, the
`mis-anuncios` category selector chrome). Confirmed via `document.body.scrollWidth` vs
`document.documentElement.clientWidth` at each width: **no horizontal overflow at 390, 768,
or 1440** on `/dashboard/mis-anuncios`. Confirmed via computed-style inspection that the
category selector's dropdown trigger and `tablist` are the same `hidden ... md:flex`-gated
pair from prior gates (mobile = dropdown button, `md:`+ = wrapped non-scrolling `flex-wrap`
tablist) — unchanged by this gate, not re-implemented.

**Authenticated workspace pixels (`OwnerEntityWorkspace` body on `[id]`):** could not be
rendered in this recovery session — the reconnected browser tab carries no Supabase session
(`document.cookie` was empty; the client-side content area stayed in its loading state and
never mounted, then the placeholder-ID route redirected to `/login`, both expected outcomes
for zero cookies, not an app defect). Per this gate's own allowance for exactly this
situation:

**AUTHENTICATED PIXEL QA = DEFERRED TO FINAL QA**

In place of fabricated pixel proof, the structural claims for the workspace card itself
(section order, primary-action-always-visible, quick/lifecycle/specialized collapsing to
`hidden md:block` and joining the single shared `DashboardMobileActionSheet`, no second
drawer implementation, no duplicated edit control) were re-confirmed by reading
`OwnerEntityWorkspace.tsx` directly this session and cross-checked line-for-line against the
same claims the 57/57 verifier already asserts at the source level — not re-asserted from
memory of the pre-crash session.

**Per-category capability truth (re-read from `ownerEntityCapabilityRegistry.ts` this
session, not carried forward):**

| Category | Analytics | Preview | Lifecycle (pause/reactivate/archive/markSold) | Activity (messages) | Specialized tools |
|---|---|---|---|---|---|
| En Venta / Varios | supported | supported | supported (all four) | supported | specialized (Pro-only refresh, bespoke check, not a registry field) |
| Rentas Privado | supported | supported | partial (pause/reactivate/archive supported; markSold unsupported — no sold concept) | supported | unsupported |
| Bienes Raíces Privado/FSBO | supported | supported | supported (all four) | supported | unsupported |
| Clases | supported | supported | partial (archive supported only; pause/reactivate/markSold unsupported) | supported | unsupported |
| Comunidad | supported | supported | partial (archive supported only) | supported | unsupported |
| Busco / Se Busca | supported | supported | partial (archive supported only) | supported | unsupported |
| Mascotas y Perdidos | supported | supported | partial (archive supported only) | supported | unsupported |

"Partial" above is not a gap — it reflects `getOwnerEntityCapabilities()` correctly gating
each action off individually per category (e.g. a Clases listing has no "mark sold" concept,
so `canMarkSold` is false and the button doesn't render); this is the exact fake-capability
fix this gate made, re-confirmed rather than re-derived.

No mismatch was found between this re-read registry truth and the audit's own §5 and the
verifier's per-category assertions, so **no corrective source edit was made this session**
and, per this gate's build policy, **`npm run build` was intentionally not re-run** — the
prior fresh production-build PASS stands uncontradicted (no source file changed after it).
