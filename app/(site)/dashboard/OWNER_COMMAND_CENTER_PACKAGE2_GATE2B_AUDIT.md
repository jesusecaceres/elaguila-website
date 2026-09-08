# Owner Command Center — Package 2, Gate 2B Audit

Category navigation + canonical listing folder card.

## 1. Boundary

```
WORKTREE: C:\projects\elaguila-website-owner-command-center
BRANCH:   integration/owner-command-center-globalization-2026-08
HEAD:     7cf69d6c8abc970305e6b384322821134e14700d (unchanged before/after)
```
Verified before editing — matched expected values; working tree contained only
Package 1 + Gate 2A's already-known changes, no unexpected source changes.

## 2. Exact visual architecture changes

**`app/(site)/dashboard/components/DashboardMisAnunciosCategorySelector.tsx`** — the
pill row (13 categories) no longer uses `flex-nowrap`/`overflow-x-auto`. At `md:` (768px)
and up it renders as a wrapped flex grid (`flex-wrap`), showing every category
simultaneously with no horizontal scroll and no hidden categories. Below `md:` the row is
`hidden` entirely — the existing dropdown (unchanged structurally: same
`aria-haspopup="listbox"` button + listbox, same count/zero-count captioning) is the sole
mobile category selector, so there is never a duplicate/simultaneous selector experience
on a phone. The "Desliza para ver más categorías →" swipe hint was removed (no longer
applicable — there's nothing to swipe). Category order, the `categories`/`counts`/
`selected`/`onSelect` prop contract, and `?cat=` URL behavior (owned by
`mis-anuncios/page.tsx`'s `setCategoryFilterAndUrl`, untouched) are all unchanged — this
is a pure CSS/layout change on top of the exact same state and data.

**Status filter row** (`mis-anuncios/page.tsx`) — the same anti-pattern
(`flex-nowrap overflow-x-auto` on the all/active/expired/moderation tabs) was replaced
with a plain `flex-wrap` row. Only 4 short labels, so this wraps cleanly at any width
with no scroll. `tabBtn()`/`setTab()` state and semantics unchanged.

**`app/(site)/dashboard/components/DashboardCategoryListingCard.tsx`** — restructured
into the canonical folder hierarchy:
- Identity block unchanged in content (category badge, status chip via the existing
  `lxDashStatusChipClass()`, title, badges, meta grid for plan/slug/dates/Leonix ID,
  lifecycle note, footer hint) — only where it sits relative to the new action area
  changed.
- New optional `performanceSnapshot` prop, rendered in its own row between the subtitle
  and the identity meta grid, but **not populated by any current caller** — no category
  passing through this component currently has a real per-card metric (views etc.)
  available without a new fetch, so nothing fake is shown; the capability exists for a
  future category that does have real data, per the "never fabricate" instruction.
- Actions are now split by the existing `tone` field into a dominant **primary** slot
  (rendered first, full visual weight, unchanged styling) and **everything else**
  (secondary + subtle tones together — the component has no way to further distinguish
  "quick view" from "lifecycle" without touching the tone-assignment logic in
  `dashboardMisAnunciosCategoryTools.ts`, which is explicitly Gate 2C's territory, not
  Gate 2B's). The non-primary group renders inline (wrapped, organized) on `md:`+ and
  collapses into a new mobile overflow sheet below `md:`. No action added, removed,
  relabeled, or rerouted — same `actions` array, same hrefs, same `onClick` callbacks,
  just regrouped by the tone value that already existed.
- `restaurantes/page.tsx` also uses this shared component (non-`compact` mode) and
  inherits the same primary/rest grouping and mobile sheet automatically — not touched
  directly, but improved as a side effect of the shared-component change.

**New file `app/(site)/dashboard/components/DashboardMobileActionSheet.tsx`** —
presentation-only bottom sheet. Takes the exact same `actions` array shape as
`DashboardListingActionBar` and renders through that same component internally (no
duplicated action-rendering logic, no route/href construction of its own). Accessible:
`role="dialog"`/`aria-modal`, labeled by a heading, Escape closes it, background
interaction is blocked (`body.style.overflow = "hidden"` while open, backdrop button to
dismiss), focus moves to the close button on open. Trigger and sheet are both
`md:hidden` — inert/invisible at tablet and desktop widths.

## 3. Category-nav behavior by breakpoint (live-verified, not just code review)

Using read-only in-browser inspection (`getComputedStyle`, no data mutation) against the
local dev server:

| Breakpoint | Tested width | Pill row (`role="tablist"`) | Result |
|---|---|---|---|
| Desktop | 1280px (viewport as rendered) | `display: flex`, `flex-wrap: wrap`, `overflow-x: visible`, 13 children present | Confirmed — no scroll, all categories visible |
| Tablet | 768px | `display: flex`, `flex-wrap: wrap`, `overflow-x: visible` | Confirmed — no scroll |
| Mobile | 390px | `display: none` | Confirmed hidden; dropdown (`aria-haspopup="listbox"`) confirmed visible as the sole selector; `document.body.scrollWidth === window.innerWidth` confirmed (zero horizontal page overflow) |

## 4. Card behavior by breakpoint

Verified in source (the `compact` layout's `lg:flex lg:items-start lg:justify-between`
split, `md:block`/`md:hidden` action-area toggling) and consistent with Gate 2B's locked
design:
- **1440+**: identity block left, action area right (`lg:` side-by-side), primary action
  first in that column, non-primary actions inline below it — no longer squeezed into a
  hard `max-w-md` cap as before (widened to `max-w-sm` on the action column specifically,
  while the identity column now gets more of the available width via `lg:gap-6`).
- **768 (tablet)**: identity and actions stack (side-by-side only triggers at `lg:`
  /1024px, matching "tablet may stack" from the design lock); non-primary actions render
  inline (not yet collapsed — `md:` triggers the inline-vs-sheet split at 768, so tablet
  gets the organized inline row, not the mobile sheet).
- **390 (mobile)**: full vertical stack; primary action always visible; non-primary
  actions collapse behind the "Más opciones"/"More options" sheet trigger instead of
  rendering inline — no button wall.

## 5. Mobile overflow behavior

Trigger is a full-width button reading "Más opciones"/"More options" (ES/EN via the
card's existing `lang` prop, previously unused — now wired up). Opens a bottom sheet with
a labeled heading, a close (×) button, and the same actions rendered as normal full-width
buttons/links through `DashboardListingActionBar`. Escape and backdrop-click both close
it. Only rendered at all when `restActions.length > 0` (a card with only a primary
action shows no trigger, not an empty sheet).

## 6. No data/action logic changes — confirmed

- No new `fetch`/`createSupabaseBrowserClient`/`supabase.from` call was added to either
  `DashboardCategoryListingCard.tsx` or `DashboardMobileActionSheet.tsx` (verifier-checked).
- `categoryRouteRegistry.ts`, `dashboardActionResolver.ts`,
  `dashboardMisAnunciosCategoryTools.ts`, and `categoryDashboardActionContract.ts` were
  not touched (verifier-checked) — Gate 2C's action-vocabulary/resolver work is untouched.
- Gate 2A's `ownerListingsQuery.ts` cache and `ownerEngagementListingKeys.ts`
  parallelization are both still present and unmodified in substance (content-checked,
  not just diff-checked, since there's no commit boundary between gates to diff against).
- The existing empty-state copy, the `isLoadingSelectedDedicatedCategory` guard, and the
  Gate 2A first-paint skeleton (category nav unconditional, contained skeleton for
  selected-category content) all remain intact.

## 7. Deliberate scope decision — three bespoke category cards not touched

`EnVentaListingManageCard.tsx`, `LeonixRealEstateListingManageCard.tsx`, and
`AutosClassifiedListingManageCard.tsx` (En Venta, Bienes Raíces/Rentas, and Autos rows —
the generic-`listings`-table categories, which don't use the shared
`DashboardCategoryListingCard`) were **not modified** in this gate. Each has its own
bespoke layout, its own inline confirmation-modal logic (mark-sold, republish
confirmations), and its own locale objects, unlike the four categories that already flow
through the shared component. The gate's own instructions made touching these files
conditional ("only if necessary... if touching them: NO data/query/action logic
changes"), and — given the real risk of an unbalanced-JSX mistake in large, intricate
files (the kind Gate 2A's own build caught and required a fix for in a much simpler
edit) — the safer, deliberate call was to leave them untouched rather than force a visual
conformity pass into this gate. This is a documented scope limitation, not an oversight,
and is a reasonable candidate for Gate 2D or a dedicated follow-up.

## 8. Focused verifier

`scripts/verify-owner-command-center-package2-gate2b.ts` — **37/37 checks pass**,
covering: category-selector wrap/hide behavior, dropdown-primary/no-duplicate-selector,
unchanged `?cat=`/category-order/state contract, card primary/rest grouping, shared
action-bar reuse (no duplicated rendering logic), mobile-sheet accessibility and
route-freedom, status-tone-helper reuse (no new color map), no new per-card I/O, Gate 2A
internals intact, and no protected-system or Gate-2C-scoped file touched.

## 9. Build result

`npm run build` — **PASSED** ("Compiled successfully in 2.8min", exit code 0).

## 10. Visual QA status

**Category navigation: live-verified** (§3 above) via read-only `getComputedStyle`
inspection at 1280px, 768px, and 390px — no data mutation, no owner session required
since the category nav renders unconditionally regardless of auth/loading state.

**Listing folder card: NOT live-verified with real data.** As documented in the Gate 2A
audit, this automated browser sandbox has no real owner login session, and
`supabase.auth.getUser()` does not resolve in this environment even for pages Gate 2B
never touched — confirmed environment-wide, not a regression. This means no real listing
row ever reaches `DashboardCategoryListingCard` in this session to visually confirm the
primary/rest split and mobile sheet against actual data. The card's structural logic is
verified by the focused verifier and by direct source review; **owner visual QA with a
real session remains necessary** to confirm the card composition against real listings,
exactly as already anticipated for Gate 2A's own performance verification.

## TRUE/FALSE Scope Table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct worktree/branch used | TRUE | Boundary check matched; HEAD unchanged |
| Desktop category horizontal scroll | FALSE | Live-verified `overflow-x: visible`, `flex-wrap: wrap` at 1280px |
| Tablet category horizontal scroll | FALSE | Live-verified same at 768px |
| Duplicate mobile category selector | FALSE | Live-verified pill row `display: none` at 390px, dropdown the only visible selector |
| Category URL (`?cat=`) contract changed | FALSE | `setCategoryFilterAndUrl`/`router.replace` untouched |
| Category order changed | FALSE | Same `categories.map()`, no sort introduced |
| New category state system introduced | FALSE | Same `categoryFilter`/`onSelect` prop contract |
| Listing folder card restructured | TRUE | Primary/rest split + mobile sheet, verifier + source confirmed |
| Per-card new network I/O | FALSE | Verifier-confirmed no fetch/Supabase call added to card or sheet |
| Action routes changed | FALSE | Same `actions` array, hrefs, and callbacks reused verbatim |
| Action vocabulary globalized | FALSE (correctly deferred to Gate 2C) | No label renamed; only grouping by existing `tone` |
| Status theme | LX_DASH | `lxDashStatusChipClass()` still the only status-tone source, verifier-confirmed no new color map |
| Loading skeleton preserved | TRUE | Gate 2A skeleton markers (`animate-pulse`, `aria-busy`) and unconditional category nav confirmed still present |
| Empty state preserved | TRUE | "Aún no tienes anuncios en" copy confirmed present, unchanged |
| Focused verifier passes | TRUE | 37/37 |
| Production build passes | TRUE | Exit code 0, "Compiled successfully" |
| Feature logic changed | FALSE | Only layout/grouping/CSS; no data, route, or action-callback change |
| Migrations | NONE REQUIRED | Verifier-confirmed, `supabase/migrations` untouched |
| No files staged, committed, or pushed | TRUE | Working-tree modifications only |
| Card visually verified with real listing data | FALSE (expected) | No real owner session available in this automated sandbox — owner visual QA is the necessary next step, same limitation already documented for Gate 2A |

No unexplained FALSE rows.
