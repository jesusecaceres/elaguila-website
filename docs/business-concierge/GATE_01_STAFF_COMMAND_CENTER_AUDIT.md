# Gate 01 — Staff Command Center Shell + Leonix Brand + Navigation

**Date:** 2026-08-21
**Worktree:** `C:\projects\elaguila-website-concierge`
**Branch:** `integration/business-concierge-foundation-2026-07`
**Baseline HEAD:** `6e6ef3b404828e4fce4aa10ad0793e619c93befc`
**Remote HEAD (before edits):** `6e6ef3b404828e4fce4aa10ad0793e619c93befc` (parity)
**Commit / push / deploy:** none (Coach review first)

---

## Files inspected

- `app/admin/(dashboard)/businesses/page.tsx`
- `app/admin/_components/AdminCommandCenterDashboard.tsx`
- `app/admin/_lib/adminGlobalNav.ts`
- `app/admin/_lib/staffAdminAccess.ts`
- `app/admin/_lib/businessWorkspaceData.ts`
- `app/admin/_components/adminTheme.ts`
- `app/admin/(dashboard)/businesses/BusinessConciergeInstallBanner.tsx`
- `app/admin/field/FieldAgentComponents.tsx`
- `app/admin/field/page.tsx`
- `app/lib/pwa/useInstallPrompt.ts`
- `app/manifest.ts`
- `app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx`
- `app/admin/_lib/salesWorkspaceLogic.ts` (follow-up status enums)
- `scripts/verify-sales-business-workspace-01.ts`
- `scripts/program7-verifier.ts`
- `scripts/program7-business-concierge-tests.ts`

## Files changed

- `app/admin/(dashboard)/businesses/page.tsx`
- `app/admin/_components/AdminCommandCenterDashboard.tsx`
- `app/admin/_lib/staffAdminAccess.ts`
- `app/manifest.ts`
- `scripts/verify-sales-business-workspace-01.ts`
- `scripts/program7-verifier.ts`
- `scripts/program7-business-concierge-tests.ts`

## Files created

- `app/admin/_lib/staffConciergeHome.ts`
- `app/admin/_lib/staffSalesAllowedAdminPath.ts`
- `app/admin/(dashboard)/businesses/StaffCommandCenter.tsx`
- `docs/business-concierge/GATE_01_STAFF_COMMAND_CENTER_AUDIT.md`

## Locked residue (untouched)

`.claude/`, `.devin/`, `public/title_banner_leonix.png`, `stop`, `supabase/.temp/`

---

## Command Center

Canonical route remains `/admin/businesses`. No `/admin/business-concierge` route was added.

The page is now **Leonix Business Concierge / Staff Command Center** with the existing business inventory (search, filters, cards, table) beneath it.

## Data sources

Read-only composer `composeStaffConciergeHome()` over `listBusinessesForWorkspace()` rows already returned by the workspace list:

- `nextFollowUpStatus` / `nextFollowUpDate` (`business_follow_ups` via existing list join)
- `salesStatus` (`business_sales_profiles`)
- `business.id` / `business.displayName`

**Not used:** Advisor, Outcomes, Assistant, Creative Studio, Proposals, Commitments, Meeting Studio, Health Map, Opportunities.

No new table, migration, RPC, or cache.

## Today

- Follow-ups due today: `nextFollowUpStatus === "due_today"`
- Overdue follow-ups: `nextFollowUpStatus === "overdue"`
- Empty: “Nothing due right now.”
- Counts are derived from loaded rows only — never hardcoded sample metrics.
- If the summary composer throws: bounded “summary unavailable” state; inventory still renders. Quick actions remain.

## Needs attention

- Overdue, due today, waiting on owner, or `salesStatus === "follow_up_due"`
- Capped at 6 rows so inventory stays near the fold
- Empty: “No businesses need immediate follow-up.”

## Quick actions (real routes only)

| Label | Route |
| --- | --- |
| Find business | `#businesses-inventory` (existing search/filters) |
| Add prospect | `/admin/businesses/canvass` |
| Field Agent | `/admin/field` (copy: “Quick capture in the field.”) |

## Business inventory

**PRESERVED.** Same `listBusinessesForWorkspace` filters, GET form, mobile cards, desktop table, status badges, empty “No businesses match these filters.” `BusinessConciergeInstallBanner` remains on the Command Center header.

## Admin home card

Replaced the PlannedCard (“Future paid service queue / No live concierge table yet”) with a live OperatorCard:

- Body: understand businesses, follow up, meet prepared, review opportunities, create from verified truth
- CTA: Open Business Concierge → `/admin/businesses`

Unrelated PlannedCards (Viajes, Bug Finder, etc.) unchanged.

## Access change

`isStaffSalesAllowedAdminPath` now allows:

- `/admin/field`
- `/admin/field/**`

Preserved: `/admin`, `/admin/team/**`, `/admin/support/**`, `/admin/businesses/**`.

Extracted to `staffSalesAllowedAdminPath.ts` so the path function can be unit-tested without pulling `server-only` `adminAccessControl`. `staffAdminAccess.ts` re-exports it. Dashboard layout still imports from `staffAdminAccess`.

Unrelated admin paths remain denied for `sales_rep`. Owner-bootstrap model unchanged.

Global nav was **not** dumped with Health / Meetings / Creative / Advisor. Field Agent is a Command Center quick action, not a new global-nav module.

## Brand mapping

| Role | Tokens used |
| --- | --- |
| Cream / ivory canvas | `#FFFDF7`, `#FFFCF7`, `#E8DFD0` |
| Burgundy primary CTA | `adminBtnPrimary` / `#7A1E2C` |
| Gold / bronze | `#C9A84A`, `#8A6B1F`, `#D6C7AD` |
| Charcoal text | `#1E1810` |
| Deep green | not required on this shell (reserved for later healthy-state) |
| Serif | Command Center title + Today counts (`font-serif`) |
| Sans | body, labels, inventory, buttons |

Crest: `/logo-clean.png` at 32px mobile / 48px desktop. Not redrawn. Locked `title_banner_leonix.png` unused.

## PWA change

- `name`: Leonix Business Concierge
- `short_name`: Leonix Concierge
- `start_url`: `/admin/businesses` (unchanged)
- Service worker / caching: unchanged
- No private API/data caching added

## Mobile (390px) — layout review

Coded, not browser-photographed in this gate:

- Crest 32px + wrapping title
- Today chips `flex-wrap`
- Quick actions stack, `min-h-[44px]`
- Field Agent and Add prospect visible
- Install banner in header stack
- Inventory search/cards unchanged

## Desktop — layout review

- Compact operational header (not a marketing hero)
- Attention list capped at 6
- Inventory immediately below Command Center

---

## Test results

| Check | Result |
| --- | --- |
| `npx tsx scripts/verify-sales-business-workspace-01.ts` | PASS (74 checks) |
| `npx tsx scripts/program7-verifier.ts` | PASS (77 checks, 0 failed) |
| `npx tsx scripts/program7-business-concierge-tests.ts` | PASS (71/71) |
| ESLint on Gate 01 files (excluding pre-existing unused vars in AdminCommandCenterDashboard) | PASS, 0 warnings |
| `git diff --check` | PASS |
| Targeted TypeScript | no errors in Gate 01 files (see Build) |
| `npm run build` | PASS (exit 0) |

AdminCommandCenterDashboard still has pre-existing unused `CommandCard` / unused `locale` on CompactReviewRow — not introduced by Gate 01; left untouched per “do not redesign unrelated cards.”

---

## Risks

- Command Center Today/Attention is derived from the workspace list (limit 100), not a dedicated follow-up query. Businesses beyond that window will not appear in Today. Honest for Gate 01; later gates may add a cheap dedicated read.
- `/admin/field` sits outside `(dashboard)/layout.tsx`, so the new allowlist is the contract for sales_rep when Field is later wrapped by that layout. Field itself still uses `requireSalesWorkspaceAccess()`.
- Desktop/390px visual QA is layout-coded, not live-browser captured in this gate.

## Deferred work

Gate 02+ (dashboard tabs, Field Agent screen redesign, outreach, meetings, stewardship/opportunity queues, Creative packet, Program 7 encoded routes, Advisor/Assistant URLs).

---

## TRUE / FALSE

| Item | Result |
| --- | --- |
| Correct worktree | TRUE |
| Correct branch | TRUE |
| Correct HEAD | TRUE |
| Remote parity before edits | TRUE |
| Locked residue untouched | TRUE |
| Production untouched | TRUE |
| No new table | TRUE |
| No migration | TRUE |
| No duplicate Business Concierge route | TRUE |
| `/admin/businesses` is Staff Command Center | TRUE |
| Existing inventory preserved | TRUE |
| Today uses real data only | TRUE |
| No fake counts | TRUE |
| Needs Attention uses real truth only | TRUE |
| Quick actions use real routes only | TRUE |
| Field Agent linked | TRUE |
| sales_rep Field access fixed | TRUE |
| Unrelated admin access still denied | TRUE |
| Stale admin future-Concierge copy removed | TRUE |
| Manifest name updated | TRUE |
| Manifest start_url preserved | TRUE |
| Service worker architecture unchanged | TRUE |
| No private API caching added | TRUE |
| Official crest used | TRUE |
| Crest not redrawn | TRUE |
| Locked title banner untouched | TRUE |
| Leonix palette applied intentionally | TRUE |
| Serif/sans hierarchy coherent | TRUE |
| 390px usable (layout) | TRUE |
| Desktop usable (layout) | TRUE |
| Install experience preserved | TRUE |
| No unrelated redesign | TRUE |
| Targeted tests pass | TRUE |
| No new TypeScript errors | TRUE |
| No new ESLint errors | TRUE |
| git diff --check passes | TRUE |
| Build passes OR validly deferred | TRUE |
| Gate scope did not expand | TRUE |
| Ready for Coach review | TRUE |

**TRUE/FALSE AUDIT:** 39/39 TRUE.
