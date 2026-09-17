# Gate 02 — Business Dashboard Organization

**Date:** 2026-08-21
**Worktree:** `C:\projects\elaguila-website-concierge`
**Branch:** `integration/business-concierge-foundation-2026-07`
**Baseline HEAD:** `b0ead8ca072cb0352697dc99b54c1980a8537e9a`
**Commit / push / deploy:** none (Coach review first)

---

## Prior section structure (before Gate 02)

Single “Sales workspace” scroll on `/admin/businesses/[businessId]`:

1. AdminPageHeader (Sales workspace / business name)
2. Contact actions
3. Possible next helpful action
4. Profile completeness
5. Business summary
6. Location and service coverage
7. Digital presence
8. All contacts on file
9. Connected Leonix advertisements
10. Before contacting this business
11. Follow-up
12. Sales notes
13. Living Business Book
14. Business Health Map
15. Next Right Move / Stewardship
16. Field Discovery (+ AI Research)
17. Lion’s Cockpit
18. Meeting Studio
19. Proposals (only if current proposals exist)
20. Promise Keeper
21. Creative Studio (nested under Meeting Studio load)
22. Opportunities (nested under Meeting Studio load)
23. Outcomes / Advisor / Assistant (nested under Meeting Studio load)

## New tab / section mapping

| Tab | Anchor | Existing components |
| --- | --- | --- |
| Overview | `#overview` | identity, contacts, completeness, next action, location, digital, ads, prep |
| Business Book | `#business-book` | LivingBusinessBookActions |
| Health | `#health` | HealthMapActions |
| Outreach | `#outreach` | FollowUpPanel, NotesPanel, status in header |
| Discover | `#discover` | FieldDiscoveryActions + AI Research |
| Meetings | `#meetings` | Lion’s Cockpit + MeetingStudioActions |
| Next Right Move | `#recommend` | StewardshipActions |
| Opportunities | `#opportunity` | OpportunityActions |
| Creative Studio | `#creative` | CreativeStudioActions |
| Proposals | `#decide` | ProposalActions |
| Commitments | `#promises` | PromiseKeeperActions |
| Outcomes | `#outcomes` | OutcomesPanel, AdvisorPanel, AssistantPanel (flag-aware) |

Local nav implementation: **hash anchors** plus a small client `BusinessDashboardNav`. The detail page stays a server component. Authorization and data loading stay on the server.

Tabs whose content is capability/flag-absent are omitted (no dead buttons).

## Files inspected

- `app/admin/(dashboard)/businesses/[businessId]/page.tsx`
- `app/admin/(dashboard)/businesses/[businessId]/BusinessWorkspaceActions.tsx`
- related imported panels listed in page.tsx
- `scripts/verify-sales-business-workspace-01.ts`

## Files changed

- `app/admin/(dashboard)/businesses/[businessId]/page.tsx`
- `scripts/verify-sales-business-workspace-01.ts`

## Files created

- `app/admin/(dashboard)/businesses/[businessId]/BusinessDashboardNav.tsx`
- `docs/business-concierge/GATE_02_BUSINESS_DASHBOARD_ORGANIZATION_AUDIT.md`

## Domains reused (not rewritten)

Living Book, Health Map, Outreach notes/follow-ups, Field Discovery, AI Research, Meeting Studio, Stewardship, Opportunities, Creative Studio, Proposals, Promise Keeper, Outcomes, Advisor, Assistant.

## Data model

No migration, table, RPC, API domain, or new status enum.

## Presentation notes

- Creative / Opportunity / Program 7 panels are no longer nested inside the Meeting Studio data wrapper; each uses its own existing feature flag. That is IA only: flags and fetchers were already independent.
- Proposals now show a truthful empty state when Meeting Studio data is loaded and there is no current proposal.
- Follow-ups remain separate from Promise Keeper / Commitments.
- No Truth Packet UI (Gate 07). Encoded Program 7 API folders deferred to Gate 09.

## Desktop / mobile

- Desktop: wrapped local nav, burgundy active tab, compact header, business name dominant.
- 390px: horizontal-scroll chips, 44px targets, small crest, Field Agent visible.

## Risks

- Sequential scroll order still places Next Right Move before Discover; hash nav follows the approved tab list.
- Program 5 proposals/commitments still require Meeting Studio enabled data load (existing fetch coupling).

## Tests

- `npx tsx scripts/verify-sales-business-workspace-01.ts` — PASS (79)
- ESLint on changed files — PASS
- `git diff --check` — PASS
- `npm run build` — PASS

## Deferred

Gate 03 Field Agent UX. Gate 07 Truth Packet. Gate 09 encoded API routes.

## Gate 03 dependency

Business Dashboard now links to `/admin/field/[businessId]` as quick-capture mode.
