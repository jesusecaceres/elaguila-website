# Gate 10A — Proposal Create + Revision Bridge

**Date:** 2026-08-24
**Worktree:** `C:\projects\elaguila-website-concierge`
**Branch:** `integration/business-concierge-foundation-2026-07`
**Baseline HEAD:** `e6cd7fffdc4276a49ee5b0748deecb535787dc32`
**Commit / push / deploy:** none (Coach review first)

---

## Gap source

Master Bible reconciliation GAP-BC-PROPOSAL-CREATE-REVISE:

- Program 5 proposal domain, POST API, Accept/Decline, and `owner_review → staff_review` already existed.
- Staff could not create a proposal from the Business Dashboard.
- Staff could not return an `owner_review` proposal for revision through the UI.
- `createProposal` always inserted `version = 1` / `is_current = true` without retiring the previous current row.

Coach repair: creating a later proposal must not rewrite terminal historical status (`accepted` / `declined` / `expired` / `cancelled`) to `superseded`.

## Create flow

Human-triggered only. Recommendation approval does not create a proposal.

1. `#proposals` empty state: **Create Proposal**
2. Recommend Journey: **Create Proposal** hash link to `#proposals` (same form; prefill when a current recommendation exists)
3. Current in-flight proposal (`draft` / `staff_review` / `owner_review`): **Create Next Version**
4. Current terminal proposal (`accepted` / `declined` / `expired` / `cancelled`): **Create New Proposal**

POST `/api/admin/businesses/[businessId]/proposals` → `createProposal()`.

## Exact fields

Existing `CreateProposalInput` / `business_proposals` columns only:

- required: recommended intervention, verified need EN (ES falls back to EN), scope EN, deliverables EN, responsibilities EN, timeline EN, success metric EN
- optional: owner goals, free option, exclusions, review date, source recommendation id
- package key / entitlement / invented pricing are not surfaced (no fake commercial terms)

## Capabilities

Unchanged matrix:

- `create_proposal` — manager / super_admin (sales_rep still cannot create)
- `review_proposal` — Needs Changes / send to owner review
- `record_proposal_decision` — Accepted / Declined only
- POST create requires a real staff roster (`staff_roster_required`); owner bootstrap is not a fake roster

## Status vs current

`status` records what happened.
`is_current` records which proposal is active.

They are independent. A row can be `accepted` and `is_current=false`. That is truthful history, not a missing decision.

## Working replacement

In-flight current rows:

- `draft`
- `staff_review`
- `owner_review`

When staff intentionally creates a later proposal:

- previous status → `superseded`
- previous `is_current` → `false`
- new row → `draft` + `is_current=true` + `max(version)+1`

These were replaced before a terminal commercial outcome.

## Terminal history

Terminal current rows:

- `accepted`
- `declined`
- `expired`
- `cancelled`

When staff intentionally creates a later proposal:

- previous **status is retained**
- previous `is_current` → `false`
- new row → `draft` + `is_current=true` + `max(version)+1`

Do **not** rewrite:

- `accepted` → `superseded`
- `declined` → `superseded`
- `expired` → `superseded`
- `cancelled` → `superseded`

Example: v1 accepted, later commercial proposal created:

- v1: `accepted` + `is_current=false` (client did accept v1)
- v2: `draft` + `is_current=true`

Acceptance / decline attribution columns stay on the historical row.

## Version / current rule

- No current history → version `1`, `is_current = true`
- Existing history → `nextProposalVersion = max(version) + 1`
- Successful create leaves exactly one current row (the new draft)
- Needs Changes does **not** create a second row and does **not** increment version

## Needs Changes mapping

UI label **Needs Changes**. Canonical status remains `staff_review`.

`owner_review → staff_review` with `changeReason: "needs_changes"`.

Not a proposal status. Not Declined. Not Follow Up Later. Not Accepted. Same row. Does not increment version.

## Accepted / Declined

Gate 08 unchanged. Only from `owner_review`. Roster + `record_proposal_decision` required. Not signed, paid, published, or entitlement.

Creating a later proposal does not rewrite historical acceptance or decline.

## Follow Up Later

Still `POST /api/admin/businesses/[businessId]/follow-up` → `business_follow_ups`. Not a proposal status.

## Owner Handoff

Unchanged read model: current rows with `status = accepted` and `is_current = true`.

If staff creates a later proposal after an accepted current row:

- old accepted leaves the active handoff queue because it is no longer current
- historical acceptance remains on that row
- no handoff history table

## Transaction / failure safety

No proposal RPC exists. No migration. Create uses the existing service-role repository pattern with compensation:

1. Insert the new row as `draft` + `is_current=false` (failed insert leaves the previous current untouched)
2. Set previous current rows to `is_current=false` without changing terminal status
3. Set the new row `is_current=true`
4. If step 2 or 3 fails: restore previous `is_current=true` and delete the inserted row
5. After the new row is current, stamp in-flight previous rows `superseded` (best-effort; terminal rows are never stamped)

No new RPC / no new table. Residual crash window: a process kill between steps 2 and 3 could briefly leave zero current until staff retries. Request-level failures compensate.

## Schema

No migration. No new table. No new enum. Statuses remain:

`draft` · `staff_review` · `owner_review` · `accepted` · `declined` · `expired` · `superseded` · `cancelled`

## Tests

- Program 5 tests: **176/176 PASS**
- Program 5 verifier: **84/84 PASS**
- sales workspace verifier: **103/103 PASS**
- Targeted TypeScript: no Gate 10A repair-file errors (project `tsc` still fails on pre-existing e2e files)
- ESLint on repair files: **PASS**
- `git diff --check`: **PASS** (CRLF warnings only)
- `npm run build`: **PASS**

## Validation lock

- No migration, no new table, no new enum
- Terminal proposal history preserved
- Production untouched; no commit / push / deploy
- Ready for Coach review before sealing Gate 10A
