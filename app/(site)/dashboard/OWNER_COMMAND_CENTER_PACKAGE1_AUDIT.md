# Owner Command Center — Package 1 Audit

Shared shell, information architecture, brand system, mobile navigation.

## 1. Baseline

```
WORKTREE: C:\projects\elaguila-website-owner-command-center
BRANCH:   integration/owner-command-center-globalization-2026-08
HEAD (before): 7cf69d6c8abc970305e6b384322821134e14700d
```
Verified twice (pre-survey and pre-edit) — worktree/branch/HEAD matched expected values
both times; working tree was clean before edits began.

## 2. Files inspected

`LeonixDashboardShell.tsx`, `dashboardLeonixTheme.ts` (`LX_DASH`), `dashboardI18n.ts`,
`DashboardListingActionBar.tsx`, `DashboardCategoryListingCard.tsx`,
`ListingLifecycleStatusCard.tsx`, `dashboardOwnerStatusDisplay.ts`,
`dashboardProductTruth.ts`, plus the header/import region of: `dashboard/page.tsx`,
`analytics/page.tsx`, `mensajes/page.tsx`, `drafts/page.tsx`, `guardados/page.tsx`,
`busquedas-guardadas/page.tsx`, `perfil/page.tsx`, `seguridad/page.tsx`,
`notificaciones/page.tsx`, `business-tools/page.tsx`, `vistos-recientes/page.tsx`,
`messages/page.tsx`, `notifications/page.tsx` (as a redirect-pattern reference), and
`mis-anuncios/[id]/editar/page.tsx` (assessed for shell migration, see §15).

## 3. Files changed

```
app/(site)/dashboard/analytics/page.tsx
app/(site)/dashboard/business-tools/page.tsx
app/(site)/dashboard/busquedas-guardadas/page.tsx
app/(site)/dashboard/components/DashboardCategoryListingCard.tsx
app/(site)/dashboard/components/LeonixDashboardShell.tsx
app/(site)/dashboard/components/ListingLifecycleStatusCard.tsx
app/(site)/dashboard/lib/dashboardI18n.ts
app/(site)/dashboard/lib/dashboardLeonixTheme.ts
app/(site)/dashboard/messages/page.tsx
app/(site)/dashboard/notificaciones/page.tsx
app/(site)/dashboard/page.tsx
app/(site)/dashboard/perfil/page.tsx
app/(site)/dashboard/seguridad/page.tsx
app/(site)/dashboard/vistos-recientes/page.tsx
package.json
```

## 4. New files

```
scripts/verify-owner-command-center-package1.ts
app/(site)/dashboard/OWNER_COMMAND_CENTER_PACKAGE1_AUDIT.md
```

## 5. Shared shell changes

`LeonixDashboardShell.tsx`: extracted the account identity block, the nav item list,
and the publish/sign-out actions into reusable pieces (`accountPanel`,
`buildNavGroups()`/`renderNavGroups()`, `renderSidebarBottom()`) so the same content
renders in both the desktop `<aside>` and the new mobile drawer. No route, href, badge,
or gate flag (`DASHBOARD_INTERNAL_INBOX_READY`, `DASHBOARD_SAVED_LISTINGS_READY`,
`DASHBOARD_SAVED_SEARCHES_READY`) was changed — only how the same nav items are grouped
and rendered.

## 6. Desktop width changes

No change to the `contentLayout` mechanism itself (`"default" | "workbench"` was already
present, proven by Mis Anuncios). Formalized its use by opting 5 additional dense
operational pages into `contentLayout="workbench"` (max content width `90rem` instead of
`7xl`): Resumen, Analytics, Notificaciones, Business Tools, Búsquedas guardadas. Simple
account pages (Perfil, Seguridad) and Guardados/Vistos-recientes were deliberately left
on the default width, per the plan.

## 7. Mobile navigation changes

Added a sticky mobile header (`lg:hidden`) showing the account name and current section
title plus a menu toggle, and a right-side drawer (`role="dialog"`, `aria-modal`,
`aria-label`) containing the same grouped nav, the Publicar anuncio CTA, and sign-out.
The desktop `<aside>` is now `hidden lg:block` — previously it rendered on all
breakpoints and simply stacked above page content on mobile; that stacking behavior is
gone, replaced by the drawer. Escape key closes the drawer; tapping the backdrop closes
it; navigating via any drawer link closes it (`onNavigate` callback threaded through
`navItem`). No new npm dependency was added.

## 8. Navigation IA changes

Sidebar nav items are now grouped and labeled: Inicio (Resumen) · Mis anuncios (Mis
anuncios, Borradores) · Clientes y rendimiento (Mensajes, Analíticas, Notificaciones) ·
Mi actividad (Guardados, Alertas y búsquedas, Vistos recientemente) · Cuenta (Perfil y
cuenta, Seguridad) · Negocio (Herramientas de negocio), exactly as specified. No route
was added, removed, or renamed; all existing gate flags and badges are unchanged.
"Búsquedas guardadas" was relabeled to "Alertas y búsquedas" (English: "Alerts & saved
searches") — label only, route (`/dashboard/busquedas-guardadas`) unchanged. Mensajes
was deliberately NOT renamed (deferred to Package 3, which resolves it against the real
lead/message integration truth). Borradores was deliberately NOT removed/merged
(deferred to Package 4).

## 9. Leonix brand mapping

`LX_DASH` gained explicit role tokens matching the approved brand roles: `btnPrimary`
(burgundy, already existed), `btnPremium` (gold, new — for future inventory/coupon/offer
actions), `btnPositive` (green, new — resume/reactivate), `btnWarning` (amber, new —
pause/caution), `btnDanger` (red, new — archive/delete only), plus `eyebrow`, `input`,
`emptyState`, `subtleBadge`. These are additive — no existing token was removed or
renamed, so no caller broke.

## 10. Theme consolidation

`dashboardLeonixTheme.ts` remains the single dashboard theme file (verifier confirms no
second theme-like file exists under `app/(site)/dashboard/lib`). Added a canonical
status-tone helper (`LX_DASH_STATUS_TONE`, `lxDashStatusChipClass()`) and migrated the
two independent status-tone color maps found in `DashboardCategoryListingCard.tsx` and
`ListingLifecycleStatusCard.tsx` onto it — same neutral/positive/warn/danger meaning per
listing, one shared shade set instead of two. `DashboardListingActionBar.tsx`'s
CSS-variable-based tone system (`--lx-cta-primary-bg` etc.) was intentionally left
untouched — migrating it would only be a presentation swap, but it wasn't required for
Package 1's target pages and touching it risked broader visual drift on every listing
card across every category; deferred to Package 2 alongside the action-contract
consolidation it's more naturally tied to. `globals.css` `--lx-*` tokens were not
touched (other non-dashboard surfaces consume them).

## 11. Typography consolidation

Normalized the page-level `<h1>` on all 11 Phase-11 target pages to `LX_DASH.pageTitle`
(the canonical serif token). Before: 6 pages already used it; 4 pages
(`analytics`, `notificaciones`, `business-tools`, `perfil`, `seguridad`,
`vistos-recientes` — 6 total) used a drifted sans-serif `"text-2xl font-bold ...
#1E1810"` pattern. All 11 target pages now use the same token. Did **not** build a
full `DashboardPageHeader` eyebrow/description/action wrapper component and roll it out
across all 11 pages — each page's surrounding header markup (subtitle placement, action
buttons, degraded-state notices) differs enough that a blind wrapper swap risked
altering layout/behavior beyond "obvious visual drift", which the plan explicitly
guards against. The `<h1>` className normalization is the safe subset of that work;
the full shared header component is deferred to Package 2 (see §15 deferred items).
Restaurantes/Servicios/Viajes/Empleos/Ofertas-Locales headings (a third and fourth
drifted pattern found in the original survey) were out of the Phase-11 page list and
were not touched.

## 12. Button/status semantics

Added `btnPremium`/`btnPositive`/`btnWarning`/`btnDanger` tokens and the shared
`lxDashStatusChipClass()` helper (see §9–10). Migrated the two status-tone maps
described above. Did not change which actions render on any card, did not add or remove
any action, and did not change any route target — confirmed by the verifier's route
presence checks and by the fact that only presentation-layer files
(`DashboardCategoryListingCard.tsx`, `ListingLifecycleStatusCard.tsx`,
`dashboardLeonixTheme.ts`) were touched for this item.

## 13. i18n consolidation

Added 9 new keys to `dashboardShellCopy()` in `dashboardI18n.ts` (ES + EN): the 6 sidebar
group labels, `openMenu`/`closeMenu`/`menuLabel` for the mobile drawer's accessible
labels, and renamed the `savedSearches` value. Did not touch `misAnunciosListCopy()` or
`misAnunciosDetailCopy()`, and did not attempt to replace the 298 inline
`lang === "es" ? … : …` ternaries found elsewhere in the dashboard tree in the original
survey — those are category/page-specific product copy, out of "shared/global" scope per
the plan. `?lang=es|en` query-param mechanism is unchanged; no `next-intl` or `[lang]`
segment was introduced.

## 14. Alias cleanup

`app/(site)/dashboard/messages/page.tsx` converted from a client-side re-export
(`export { default } from "../mensajes/page"`, URL stayed at `/messages`) to a server
`redirect('/dashboard/mensajes?...')`, matching the `analiticas`/`borradores`/
`notifications` pattern exactly (query params preserved). Mensajes' own behavior is
unchanged — only how `/dashboard/messages` reaches it.

## 15. Pages normalized / deferred feature logic

**Normalized (shell + theme + layout mode, no feature-logic change):** Resumen,
Analytics, Mensajes, Drafts, Guardados, Búsquedas guardadas, Perfil, Seguridad,
Notificaciones, Business Tools, Vistos Recientes.

**Deferred — `mis-anuncios/[id]/editar` foreign shell:** Assessed per Phase 12. This page
uses a raw `<Navbar>` + dark/yellow theme with no sidebar, and does not currently fetch
any profile data (`userName`/`email`/`accountRef` are not available in its scope).
`LeonixDashboardShell` accepts `null` for those fields, so a markup-only wrapper swap is
technically possible — but it would render an empty/broken-looking identity panel next
to a real editing form, which contradicts the "premium, this is mine" doctrine as much
as the current dark theme does, and doing it properly requires adding a profile fetch
(new data-fetching logic, not pure markup). Per Phase 12's explicit instruction, this
was left unmigrated and is deferred to Package 2, where it can be paired with real
identity data instead of nulls.

**Deferred — full shared `DashboardPageHeader` component rollout:** see §11.

**Deferred — `DashboardListingActionBar.tsx` tone-system migration:** see §10.

**Not in scope, not touched:** Restaurantes/Servicios/Viajes category hub pages, Mis
Anuncios' category-action internals, any analytics API, Community Trust, saved/
saved-search runtime, notification derivation logic, billing, business capability
logic, profile persistence, listing lifecycle/inventory/payments code, Business
Concierge, Ad Branding, LEO, Recursos, Admin Command Center.

## 16. Risks

- The mobile drawer is new code with no automated interaction test; manual QA (checklist
  below) is required before this is considered done, not just typechecked/built.
- `mis-anuncios/[id]/editar` remains visually foreign to the rest of the dashboard —
  known and intentionally deferred, not accidentally missed.
- `DashboardListingActionBar.tsx` still uses a separate (CSS-variable-based) tone system
  from the new `LX_DASH_STATUS_TONE` map — two systems still coexist for actions vs.
  status chips specifically; full consolidation is Package 2 work tied to the action
  contract.
- This worktree had no `node_modules` installed prior to this session; `npm install`
  was run (user-approved) to enable typecheck/build validation. `next-env.d.ts` did not
  exist before the build ran (auto-generated by Next.js, normally gitignored) — its
  absence caused unrelated `Cannot find module '*.png'` typecheck errors across ~12
  files project-wide (including this shell) before the build regenerated it; not a
  Package 1 regression.
- **Resolved in the certification pass (§18):** the production build was initially
  blocked by a missing `.env.local` in this worktree (`NEXT_PUBLIC_SUPABASE_URL`/
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`). The canonical repo's `.env.local` was copied in
  after confirming it is git-ignored in this worktree; no values were read, printed, or
  committed. Build now passes.

## 17. Manual QA routes

`/dashboard?lang=es`, `/dashboard?lang=en`, `/dashboard/mis-anuncios?lang=es`,
`/dashboard/analytics?lang=es`, `/dashboard/mensajes?lang=es`, `/dashboard/drafts?lang=es`,
`/dashboard/guardados?lang=es`, `/dashboard/busquedas-guardadas?lang=es`,
`/dashboard/perfil?lang=es`, `/dashboard/seguridad?lang=es`,
`/dashboard/notificaciones?lang=es`, `/dashboard/business-tools?lang=es`,
`/dashboard/vistos-recientes?lang=es` — each also at `?lang=en`.
Mobile widths: 320, 375, 390, 430. Desktop widths: 1280, 1440, 1600+.
Local dev server is running at `http://localhost:3000` as of the certification pass
(§18). Owner visual QA against the routes above is **PENDING** — a local server being
up is not the same as the owner having looked at it; no browser inspection of the
rendered pages was performed by this session.

## 18. Certification (environment unblock + final build)

Performed in a follow-up session after the initial Package 1 implementation, whose
build had failed only on missing Supabase env vars. This pass:
- Confirmed `.env.local` is git-ignored in this worktree (`.gitignore:56`) before
  copying it from the canonical repo (`C:\projects\elaguila-website\.env.local`) —
  contents were never read or printed; `git status --short` confirmed the file does not
  appear after the copy.
- Confirmed `node_modules` already present and `package-lock.json` unchanged (no
  reinstall performed).
- Re-ran `git diff --check` — PASS (only a pre-existing LF/CRLF line-ending notice on
  `messages/page.tsx`, not a whitespace error).
- Re-ran the focused verifier — 61/61 PASS, unchanged from the implementation pass.
- Ran `npm run build` — **PASSED** ("Compiled successfully in 2.9min", exit code 0).
  Remaining output consists only of pre-existing, project-wide `Unsupported metadata
  themeColor` warnings unrelated to any dashboard route or Package 1 file.
- Re-confirmed final scope: `git diff --name-only` / `git status --short` show exactly
  the same 15 modified + 2 untracked files as the implementation pass, plus a new
  `.claude/launch.json` (harness dev-server config, not application source) and the
  now-git-ignored `.env.local`. No migration, no Stripe/payment, no analytics API, no
  Community Trust, no saved-search runtime, no lifecycle, no Ad Branding/Concierge/Admin
  file was touched. Nothing staged, committed, or pushed.
- Started the local dev server (`npm run dev` via `.claude/launch.json`) at
  `http://localhost:3000`, confirmed it picked up `.env.local` and is serving. Did not
  perform browser-based visual QA myself — that remains the owner's step.

## TRUE/FALSE Audit Table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct worktree/branch used | TRUE | Boundary check matched before and after edits; HEAD unchanged (no commits made) |
| No feature behavior intentionally changed | TRUE | Only shell/theme/i18n/presentation files touched; verifier's negative checks (payments, analytics API, Community Trust, saved-search runtime, admin, migrations) all pass |
| Owner Dashboard uses one shared shell | TRUE | All 11 target pages render `LeonixDashboardShell`; `mis-anuncios/[id]/editar` is the one known, documented exception (§15) |
| Dense desktop pages use useful width | TRUE | Resumen/Analytics/Notificaciones/Business Tools/Búsquedas guardadas now use `contentLayout="workbench"` (90rem) |
| Simple forms remain readable | TRUE | Perfil/Seguridad left on default (7xl) width, unchanged |
| Mobile sidebar no longer stacks as a giant block | TRUE | Desktop `<aside>` is `hidden` below `lg:`; mobile uses the new sticky header + drawer instead |
| Mobile navigation is accessible | TRUE | `aria-expanded`, `aria-controls`, `role="dialog"`, `aria-modal`, `aria-label`, Escape-to-close, focus-visible default outlines preserved (no custom focus trap added — noted as a risk, not a blocker) |
| Navigation is grouped by owner task | TRUE | 6 labeled groups per §8 |
| Alertas y búsquedas naming reflects real capability | TRUE | Survey confirmed real event-driven email delivery for this feature (Autos/BR/Rentas) — label change is evidence-backed, not aspirational |
| LX_DASH remains canonical theme source | TRUE | Verifier confirms no second theme file |
| No competing new theme file was created | TRUE | Verifier check passed |
| Burgundy has one primary semantic role | TRUE | `btnPrimary` unchanged, still the only burgundy action token |
| Gold has premium/category-tool semantic role | TRUE | New `btnPremium` token added for that role (not yet consumed by a page — that's Package 2's inventory/coupon/offer work) |
| Green is positive/trust only | TRUE | New `btnPositive`/positive status tone are the only green additions |
| Amber is caution/pause | TRUE | New `btnWarning`/warn status tone are the only amber additions |
| Red is destructive only | TRUE | New `btnDanger` token is scoped to that role only |
| Serif/sans hierarchy is consistent | PARTIAL — see note | All 11 target pages' `<h1>` now serif via `LX_DASH.pageTitle`; body/eyebrow/controls were not audited page-by-page for stray serif misuse beyond the heading fix. Not a regression, but not a full sweep either. |
| Shared dashboard i18n was expanded | TRUE | 9 new keys added to `dashboardShellCopy()` |
| ES/EN shell navigation is consistent | TRUE | Group labels and renamed item present in both languages |
| messages alias uses canonical redirect pattern | TRUE | Converted, verifier confirms |
| Billing behavior was not changed | TRUE | `perfil/page.tsx`'s billing block was not touched (only its `<h1>` at the top of the page changed) |
| Analytics behavior was not changed | TRUE | Verifier's negative check passed; only `<h1>`/import/layout-prop lines changed in `analytics/page.tsx` |
| Saved behavior was not changed | TRUE | `guardados/page.tsx` untouched beyond its already-existing `LX_DASH.pageTitle` usage |
| Saved Search delivery was not changed | TRUE | Verifier's negative check passed |
| Community Trust was not changed | TRUE | Verifier's negative check passed |
| Listing lifecycle was not changed | TRUE | No lifecycle/mutation files touched |
| Payment/Stripe was not changed | TRUE | Verifier's negative check passed |
| Business Concierge was not changed | TRUE | Not referenced by any changed file |
| Ad Branding PR #20 was not touched | TRUE | Not referenced by any changed file |
| No migration was created | TRUE | Verifier's negative check passed; `supabase/migrations` untouched |
| No files staged | TRUE | All changes are working-tree modifications only |
| No commit created | TRUE | HEAD unchanged |
| No push attempted | TRUE | No git push run |
| Production build passes | TRUE | Certification pass (§18): `npm run build` — "Compiled successfully in 2.9min", exit code 0, after environment unblock (`.env.local` copied, git-ignored, no values read/printed) |
| Focused verifier passes | TRUE | 61/61 checks, both the implementation pass and the certification re-run (§18) |
| Owner visual QA performed | FALSE | Local dev server is running (`http://localhost:3000`) and QA routes are prepared (§17), but no browser-based visual inspection was performed by this session — this is the owner's pending step, not a defect |

No unexplained FALSE rows: the one FALSE row above ("Owner visual QA performed") is
expected and intentional — Package 1 code/build is certified, but visual QA is a
separate, owner-performed step that has not happened yet. One PARTIAL row (serif/sans
hierarchy) — noted above with the specific gap (page-by-page body/control audit beyond
the heading fix was not performed); this does not block calling Package 1's stated code
scope complete, but should be picked up if a future pass wants full typographic parity.
