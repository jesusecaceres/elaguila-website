# Gate 08 — Client Decisions + Owner Handoff

**Date:** 2026-08-24
**Worktree:** `C:\projects\elaguila-website-concierge`
**Branch:** `integration/business-concierge-foundation-2026-07`
**Baseline HEAD:** `577a137d93e4da3498b66ac65e0a893d6eb2ce96`
**Commit / push / deploy:** none (Coach review first)

---

## Canonical proposal domain

Program 5 `business_proposals` remains the only commercial-decision domain. Status transitions stay in `PROPOSAL_STATUS_TRANSITIONS`. No second CRM, deal table, contract table, payment table, or handoff table.

## Exact proposal statuses

`draft` · `staff_review` · `owner_review` · `accepted` · `declined` · `expired` · `superseded` · `cancelled`

No `postponed`, `waiting`, `signed`, `paid`, `contracted`, or `published`.

Client decision is only valid from `owner_review` → `accepted` or `declined`.

## Accepted semantics

A human staff member with `record_proposal_decision` and a real roster id records that the **client** accepted this canonical proposal/version.

It does not mean opportunity approval, Creative approval, signed contract, payment, publication, or entitlement.

## Declined semantics

A human staff member records that the client declined this proposal. History is preserved. The business is not archived. Notes, meetings, creative, opportunities, and commitments are not deleted.

## Follow Up Later / Postponed semantics

Not a proposal status. Uses existing `business_follow_ups` (one current follow-up per business). Date + human purpose. No reminder engine, no NLP dates, no SMS/email.

## Follow-up canonical store

`business_follow_ups` via existing `POST /api/admin/businesses/[businessId]/follow-up` → `upsertCurrentFollowUp`.

## Owner-bootstrap roster limitation

Preserved. Bootstrap cannot write follow-ups (`owner_bootstrap_cannot_write_follow_ups`). Accept/decline require a real staff roster (`staff_roster_required`). No fabricated roster. Bootstrap is not recorded as proposal actor type `owner` (that means business owner).

## Owner Handoff derivation

Read model only: current rows with `status = accepted` and `is_current = true` from `business_proposals`, plus `businesses.display_name`. Limit 20. Two queries max. Not N+1. Not a new table. No handoff-acknowledged state.

## Command Center integration

`/admin/businesses` Staff Command Center shows Owner Handoff near Needs Attention. Rows link to `/admin/businesses/[businessId]#proposals`. Handoff read failure does not crash the Command Center or hide inventory.

## Opportunity boundary

Unchanged: `suggested` · `reviewed` · `approved` · `dismissed` · `creative_requested`. No accepted/declined/postponed opportunity states.

## Creative boundary

Gate 07 Creative Truth Packet architecture untouched. Creative approval is not client acceptance.

## Promise Keeper boundary

Commitments remain separate. Acceptance does not auto-create commitments. UI may link to `#promises`.

## DocuSign boundary

No API, no embedded signing, no signed state. Owner Handoff copy says downstream contract handling remains.

## Stripe / payment boundary

None. Pricing snapshot is not payment. `proposalAcceptanceDoesNotCharge` / `proposalAcceptanceDoesNotGrantEntitlement` preserved.

## Capability preservation

`sales_rep` still cannot `record_proposal_decision` or `review_proposal`. Manager / super_admin retain existing proposal capabilities. Cross-business isolation: updates still filter `id` + `business_id`.

## Mobile / desktop

390px: stacked proposal cards, 44px+ actions, wrapping text, stacked handoff rows. Desktop: current proposal, status, client decision, follow-up, Command Center queue.

Live authenticated browser was not available in this session; layout is structural.

## Tests

- `npx tsx scripts/program5-tests.ts` — PASS 155/155
- `npx tsx scripts/program5-verifier.ts` — PASS 81/81
- `npx tsx scripts/verify-sales-business-workspace-01.ts` — PASS 100/100
- Opportunity tests/verifier — not rerun (OpportunityActions untouched)
- Program 6 verifier — not rerun (Creative files untouched)
- targeted TypeScript — no Gate 08 file errors (project-wide `tsc` still exits 2 on unrelated e2e/autos errors)
- ESLint on Gate 08 files — PASS
- `git diff --check` — PASS
- `npm run build` — PASS

## Gate 09 dependency

Program 7 advisor / assistant / outcomes encoded route repair remains Gate 09. Gate 08 does not touch those folders.
