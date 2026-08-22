# Gate 06 — Recommendations + Opportunity Workflow

**Date:** 2026-08-21
**Worktree:** `C:\projects\elaguila-website-concierge`
**Branch:** `integration/business-concierge-foundation-2026-07`
**Baseline HEAD:** `72b6e944d340f4706db7d5faed057be73b00c730`
**Commit / push / deploy:** none (Coach review first)

---

## Canonical recommendation engine

Stewardship (`app/lib/business/stewardship/*`, `business_recommendations`) remains the only Next Right Move engine.

Staff surface: `#recommend` via `RecommendJourney`, which still uses `StewardshipActions` (create / submit / approve / share / override). No second recommendation store, engine, or status set.

Staff-facing distinction:

- **Next Right Move / Recommendations** = what Leonix recommends the business should do next
- **Opportunity** = a contextual editorial / sponsorship / advertising candidate

They are related, not the same object. Cross-links are hash navigation only (`#opportunity` / `#recommend` / `#creative`). No automatic transition between them.

## Six-test preservation

Canonical tests remain Need, Readiness, Capacity, Life alignment, Value, Lion Code.

The UI prints stored `business_recommendation_tests` rows only (`result`, `explanationEn`, stored `confidence` label). Presentation does not infer PASS/FAIL.

## Recommendation ladder

Existing `PrimaryIntervention` ladder, surfaced as:

free owner action → education / guided self-service → small corrective service → Leonix product / advertising → managed support → external referral → no action

Leonix sale is not forced. External referral and no action remain valid outcomes. Existing `costBand` is shown as a stored band, not a pricing engine.

## Recommendation statuses

Unchanged: `draft | review_required | approved | shared_with_owner | accepted | declined | postponed | superseded | archived`.

`accepted` here is the existing owner decision on a stewardship recommendation, not an opportunity client-acceptance state.

Manager / super_admin may create, approve, share, and override as today. `sales_rep` may view recommendations and the stewardship ledger only.

## Opportunity lifecycle

Package B `business_creative_opportunities` remains canonical. Lifecycle is exactly:

`suggested` → `reviewed` → `approved` → `dismissed`

Approved may proceed to `creative_requested`.

No `accepted`, `declined` by client, `contracted`, `paid`, or `published` opportunity states were added.

## Approval semantics

**Approved** means staff judges the opportunity worth pursuing.

Approved does **not** mean: client accepted, sponsorship sold, contract signed, payment received, editorial endorsement, or creative published.

Staff copy on the opportunity panel states this explicitly. Payment cannot buy false claims or editorial endorsement. Human review remains required.

## Creative request boundary

Existing human-triggered POST `.../opportunities/[id]/creative-request` remains the only bridge.

- Approval does not create a Creative Studio job
- Request Creative is shown only on `approved`
- Failure does not reload, so the UI does not claim `creative_requested`
- Gate 07 still owns Truth Packet display

## Command Center opportunity decision

**DEFERRED.**

`staffConciergeHome.ts` is a pure composition over already-loaded sales-list rows (follow-ups only). The opportunity repository exposes `listOpportunitiesForBusiness(businessId)` only — no cheap workspace-wide aggregate.

A Command Center count of “opportunities to review” or “approved awaiting creative” would require N+1 across businesses, a new table, or a new list API. Gate 06 does not add that infrastructure.

## Capability preservation

Unchanged matrix:

- `sales_rep`: `view_recommendations`, `view_stewardship_ledger`, `view_opportunities`
- manager / super_admin: create/approve/override recommendations; `review_opportunity`; `create_opportunity_creative_request`

Owner bootstrap continues through existing `salesActorToOpportunityActor` / workspace access helpers. No fabricated roster. No owner-dashboard changes.

## AI governance

Opportunity matching remains deterministic (`matchEngine.ts`, no provider). Stewardship selection remains the existing registry + six tests.

AI / system may read, explain, summarize, draft, suggest, classify. It may not approve a recommendation, approve an opportunity, confirm sponsorship, send outreach, accept for the client, create a binding proposal, charge, publish, or rewrite canonical facts.

## No scoring

No 71/100, 85% match, A+, or star rating. Existing domain `confidence` remains the stored `low | medium | high` label, always shown with match reasons or six-test explanations.

## Mobile / desktop

390px: stacked cream/ivory cards, gold labels, burgundy primary actions, deep-green approved/verified actions, 44px+ targets, six tests as stacked cards (not a dense table). Creative request is not shown before approval.

Desktop: recommendation, reason, tests, opportunity, status, and next human action stay on the same dashboard with the Health → Next Right Move → Opportunities → Creative Studio flow nav.

## Tests

- `npx tsx scripts/verify-business-stewardship-engine-01.ts` — PASS 116/116
- `npx tsx scripts/business-opportunity-tests.ts` — PASS 11/11
- `npx tsx scripts/business-opportunity-verifier.ts` — PASS 62/62
- `npx tsx scripts/verify-sales-business-workspace-01.ts` — PASS 96/96 (Gate 06 checks added; Gate 02 import updated to `RecommendJourney`)
- targeted TypeScript — no new errors in Gate 06 files (pre-existing project `tsc` exit 2 remains outside this gate)
- ESLint on changed files — PASS
- `git diff --check` — PASS
- `npm run build` — PASS

## Gate 07 dependency

Creative Truth Packet inspect UI and deeper Creative Studio organization remain Gate 07. This gate only preserves the approved-opportunity → human creative-request bridge.
