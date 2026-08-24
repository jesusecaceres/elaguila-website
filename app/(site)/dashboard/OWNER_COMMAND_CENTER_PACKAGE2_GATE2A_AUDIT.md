# Owner Command Center — Package 2, Gate 2A Audit

Performance + canonical data-loading foundation.

## 1. Boundary

```
WORKTREE: C:\projects\elaguila-website-owner-command-center
BRANCH:   integration/owner-command-center-globalization-2026-08
HEAD:     7cf69d6c8abc970305e6b384322821134e14700d (unchanged before/after)
```
Verified before editing — matched expected values exactly; working tree contained only
Package 1's already-known changes (see `OWNER_COMMAND_CENTER_PACKAGE1_AUDIT.md`), no
unexpected source changes outside the Owner Command Center workstream.

## 2. Owner Network evidence

The owner performed repeated authenticated Chrome Network captures on
`http://localhost:3000/dashboard/mis-anuncios?lang=es&cat=en-venta` and reported:
multiple Supabase `/rest/v1/listings?...` 400 Bad Request responses followed by a
successful request, the same failed-then-success pattern repeating across page loads,
and ~196–204 total requests observed.

## 3. Branch C/D decision

Per the Package 2 Design Lock's decision tree (Part 2): multiple failed requests before
success (**Branch C**) plus the same sequence repeating across reloads (**Branch D**)
together authorize adding a session-scoped successful-query-shape cache around the
existing `fetchOwnerListingsForDashboard()` tiered fallback — without rewriting the
tier definitions, the missing-column regex mechanism, or inventing schema assumptions.
This is exactly what Task 2A-5 implements (see §4 below).

## 4. Exact critical-path changes

**`app/lib/ownerEngagementListingKeys.ts`** — `countOwnerActiveListingsAcrossSources`'s
six independent per-table count queries (listings, servicios, empleos, autos,
restaurantes, viajes) now run via `Promise.all` instead of six sequential `await`s,
mirroring the pattern already used by its sibling `countOwnerInventoryListings` two
functions above it in the same file. Tables, filters (including Servicios' fallback to
an unfiltered count on error), and error-handling (catch-and-ignore, contributing 0)
are byte-for-byte unchanged — only execution order changed.

**`app/(site)/dashboard/lib/ownerListingsQuery.ts`** — added a session-scoped cache
(`cachedWorkingListingsSelect`, backed by a module variable + `sessionStorage` under key
`lx_owner_listings_select_v1`) around `fetchOwnerListingsForDashboard`. On each call: if
a previously-successful column-select shape exists for this session, it's tried first;
a hit skips the full tiered-discovery loop entirely; a miss/failure clears the cache and
falls through to the existing, completely unmodified tiered fallback (3 tiers × up to 32
column-stripping attempts each, same `missingListingsColumnName()`/`stripSelectColumn()`
mechanism). A successful discovery (cached or freshly discovered) writes/refreshes the
cache. Not persisted to `localStorage` (session-only, so schema drift after a deploy is
re-discovered on the next new session rather than remembered forever). Degrades safely
in any non-browser context (no `window`/`sessionStorage` → cache is simply a no-op,
falling straight through to full discovery every time).

**`app/(site)/dashboard/mis-anuncios/page.tsx`**:
- `authLoading` now clears immediately after `getUser()` resolves, before the profile
  read starts. The owner-profile query (`profiles` table, display name/email/plan — used
  only for sidebar display) now runs as an un-awaited background task instead of
  serially in front of the listings query; it updates its own state independently
  whenever it resolves and never blocks or delays listing content, including on failure
  (still wrapped in the same try/catch-and-ignore as before).
- `getSession()` (still required — it's the only source of the bearer access token used
  by the Servicios and Ofertas Locales authenticated fetches; `getUser()` does not return
  one) now runs concurrently with the listings query via `Promise.all` instead of
  strictly after it, since it has no dependency on the listings result.
- The Ofertas Locales owner-summary fetch no longer gates `setListingsLoading(false)` —
  it now fires in the background immediately after the main `Promise.all` (counts,
  Servicios rows, etc.) settles, and updates its own summary link whenever it resolves,
  with the same error handling (safe null fallback) as before.
- First-paint loading UX: the page header and the full category selector (dropdown +
  pill row, unchanged component, no Gate 2B redesign) now render unconditionally,
  regardless of `authLoading`/`listingsLoading`. Only the selected-category content panel
  (category title/actions/tab-bar/search/cards) is gated behind a loading check, and
  while gated it now shows a small, contained skeleton (three pulsing placeholder blocks
  sized to approximate the real card area, using only existing `LX_DASH`/Tailwind
  utilities — no new design system) instead of replacing the entire page content with a
  generic full-page "Cargando" box. The existing `isLoadingSelectedDedicatedCategory`
  empty-state race guard and the existing `dashboardSafeMutationErrorCopy()` error
  presentation are both untouched and still sit inside the real-content branch.

## 5. Deferred items (investigated, not changed — per explicit gate instructions)

**Task 2A-6 — Servicios blocking load: DEFERRED.** The existing code comment already
documents why (`dashboardMisAnunciosCategoryLoadPlan.ts`, referenced in
`mis-anuncios/page.tsx`'s own inline comment): no lightweight, owner-scoped count-only
query is currently possible against `servicios_public_listings` (no RLS policy exists
for a count-only read). Building one safely would require a Supabase migration/RLS
policy change, which is explicitly out of Gate 2A's no-migration scope. Left exactly
as-is; Servicios' full row content remains part of the initial `Promise.all` alongside
the (now-parallelized) cross-category counts.

**Task 2A-7 — Autos duplicate dealer-inventory fetch: DEFERRED to Gate 2D.**
`AutosDealerInventoryDashboardSection.tsx` fetches its own richer data shape
(`{listings, dealerInventory}` combined, plus entitlement/subscription state) from
`/api/clasificados/autos/listings` independently of the page's own dedicated-category
Autos fetch, and does not accept the page's already-fetched data as a prop. Reusing the
page's data would require changing this component's public API (accepting props instead
of self-fetching) — a real component-interface change, not a data-loading-order change,
and the gate's own instructions say not to force this kind of prop refactor into 2A. This
duplicate does not block "Cargando" (it renders after the spinner clears, in its own
`loading` state) — it's a real but non-blocking cost, appropriately deferred.

## 6. Focused verifier

`scripts/verify-owner-command-center-package2-gate2a.ts` — **32/32 checks pass**,
including positive checks (parallelized count function, cache present and falls back
correctly, all four tier constants and the 32-attempt loop unchanged, loading-order
changes present, category nav unconditional, skeleton present, existing guards intact)
and negative checks (no migration, no payment/pricing/entitlement, no analytics-writing,
no Community Trust, no saved-search delivery, no lifecycle-endpoint, no Ad Branding, no
admin, no Gate 2B/2C-scoped files touched, no source file changed outside Package 1's
known baseline + this gate's four files).

## 7. Build result

`npm run build` — **PASSED** ("Compiled successfully in 116s", exit code 0) after fixing
one real bug caught by the first build attempt: an incorrect destructuring of
`supabase.auth.getSession()`'s result inside the new `Promise.all` (accessed `.session`
on the outer `{data, error}` object instead of drilling into `.data.session`) — fixed,
re-verified (32/32 still pass), re-built clean.

## 8. Performance verification status

**CODE-LEVEL: fully verified** — build and focused verifier both pass; the specific
mechanical changes (parallelization, cache, loading-order, first-paint skeleton) are
confirmed present and correctly scoped by the verifier's checks.

**LIVE BROWSER: partially verified, with an important limitation to report.** Using
read-only browser inspection (no data mutation) against the local dev server:
confirmed the page compiles and renders with **zero console errors on a fresh tab**
(an earlier error shown on a long-lived tab was traced to a stale cached console-log
entry from mid-edit, before the destructuring bugfix — reproducibly absent on a clean
tab load). Confirmed via `get_page_text` that the header and the **full category
selector (all 13 categories, dropdown, pill row) now render immediately**, satisfying
Task 2A-8's "shell + category nav visible immediately" requirement directly — this was
not previously true (the prior behavior replaced the entire page content, nav included,
with a generic loading box).

**Could not be completed in this automated environment:** a full authenticated
Network-tab capture (request counts, duplicate/failed-request comparison, confirming the
tiered-query cache prevents a second discovery pass) requires a real owner login session.
This automated browser sandbox has no such session (`localStorage` is empty — confirmed
directly), and `supabase.auth.getUser()` does not resolve in this environment even for
an entirely **unmodified, Gate-2A-untouched page** (`/dashboard/empleos` — tested
directly as a control, reproduces the identical stuck-loading behavior). This
conclusively shows the limitation is environment-wide and pre-existing (this sandbox's
handling of the Supabase auth SDK, not anything Gate 2A changed), not a regression this
gate introduced. **The owner's own Chrome DevTools capture (per the Package 2 Design
Lock's Part 1 guide) remains the necessary and authoritative step** for the
request-count/duplicate/failed-request/tiered-cache verification — this was already
planned as the owner's step and is not a new gap created by this limitation.

No performance improvement is claimed from code inspection alone beyond what the
verifier can mechanically confirm (parallelization present, cache present, loading order
changed, skeleton present). The owner's before/after Network capture is what will
confirm the real-world magnitude.

## TRUE/FALSE Scope Table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct worktree/branch used | TRUE | Boundary check matched before and after; HEAD unchanged |
| Proven serial count bug fixed | TRUE | `Promise.all` over the six count queries, verifier-confirmed |
| Profile + listings parallelized | TRUE | Profile fetch is now a background task, not awaited before the listings query |
| getSession kept, moved off strict-serial position | TRUE | Still required for the bearer token; now runs concurrently with the listings query via `Promise.all` |
| Ofertas Locales no longer blocks initial content | TRUE | Moved to background, fires after `setListingsLoading(false)` |
| Tiered query cache implemented | TRUE | Session-scoped, falls back to full discovery on miss/failure, never rewrites tier definitions |
| First load fallback still supported | TRUE | Cache miss/failure path falls straight through to the unmodified original loop |
| Cached shape failure recovers to full fallback | TRUE | `clearCachedListingsSelect()` called on any cached-shape query error before falling through |
| Servicios full data blocks all categories | TRUE (deferred, not fixed) | No safe lightweight count query exists without an RLS/migration change — correctly out of Gate 2A's no-migration scope |
| Autos duplicate fetch fixed | FALSE (deferred to Gate 2D) | Component requires a real prop-interface change to reuse data; correctly deferred per gate instructions |
| Analytics blocks first paint | FALSE | Unchanged — still fires strictly after `setListingsLoading(false)` |
| Inventory blocks first paint | FALSE | Unchanged — BR/Autos dealer sections still render in their own background effects |
| Category nav visible immediately | TRUE | Header + full category selector confirmed rendering unconditionally, live browser check |
| Loading UX uses a contained skeleton, not a full-page swap | TRUE | Confirmed in source and live render; existing empty-state/error-state guards preserved |
| Focused verifier passes | TRUE | 32/32 |
| Production build passes | TRUE | Exit code 0, "Compiled successfully" |
| No migration | TRUE | Verifier-confirmed, `supabase/migrations` untouched |
| No payment/Stripe/pricing/entitlement | TRUE | Verifier-confirmed |
| No analytics event-writing pipeline change | TRUE | Verifier-confirmed |
| No Community Trust / saved-search delivery / Ad Branding / Admin change | TRUE | Verifier-confirmed |
| No Gate 2B (category-nav component) or Gate 2C (action-resolver/vocabulary) files touched | TRUE | Verifier-confirmed |
| No files staged, committed, or pushed | TRUE | Working-tree modifications only |
| Full authenticated Network-tab capture completed by this session | FALSE (expected) | No real owner session available in this automated sandbox; confirmed environment-wide via an untouched control page — this is the owner's planned step, not a Gate 2A defect |

No unexplained FALSE rows.
