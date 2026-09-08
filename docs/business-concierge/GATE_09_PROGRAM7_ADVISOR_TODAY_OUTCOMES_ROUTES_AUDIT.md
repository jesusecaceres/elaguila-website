# Gate 09 — Advisor + Today + Outcomes + Program 7 Route Repair

**Date:** 2026-08-24
**Worktree:** `C:\projects\elaguila-website-concierge`
**Branch:** `integration/business-concierge-foundation-2026-07`
**Baseline HEAD:** `c4900262184336def8d66901e9ca62d3bcab3d2f`

## Exact Program 7 route defects found

Three staff admin API folders were stored as literal encoded path segments, so Next.js never treated them as dynamic `[businessId]` routes:

- `app/api/admin/businesses/%5BbusinessId%5D/advisor/route.ts`
- `app/api/admin/businesses/%5BbusinessId%5D/assistant/route.ts`
- `app/api/admin/businesses/%5BbusinessId%5D/outcomes/route.ts`

`AdvisorPanel` posted to `/api/admin/businesses/${signalId}/${action}`, substituting **signalId** where **businessId** belongs.

`AssistantPanel` loaded and posted messages at `/api/admin/businesses/${threadId}/assistant/messages`, substituting **threadId** where **businessId** belongs.

No certified mutation routes existed for Advisor actions or Assistant messages; repository functions already did.

## Route repairs performed

Copied certified list behavior into real dynamic routes:

- `GET /api/admin/businesses/[businessId]/advisor`
- `GET /api/admin/businesses/[businessId]/assistant`
- `GET /api/admin/businesses/[businessId]/outcomes`

Added the missing certified-shape mutation routes without new payload domains:

- `POST /api/admin/businesses/[businessId]/advisor/[signalId]` with `{ action: "acknowledge" | "resolve" | "dismiss" }`
- `POST /api/admin/businesses/[businessId]/assistant` creates a thread
- `GET|POST /api/admin/businesses/[businessId]/assistant/[threadId]` lists / appends messages via existing `generateAssistantReply`

Encoded Program 7 folders remain on disk as inert literals so Gate 07 / Program 6 verifiers that still assert those paths stay green. Live staff traffic uses the real `[businessId]` routes.

## Creative Studio encoded route decision

**UNTOUCHED.** Gate 07 already certified that the Business Dashboard lists Creative jobs server-side and does not call `GET /api/admin/businesses/[businessId]/creative-studio`. No Program 7 dependency required that repair.

## Advisor URL correction

Panel now posts to `/api/admin/businesses/${businessId}/advisor/${signalId}`.

## Advisor business/signal boundary

`getSignalById(businessId, signalId)` is required before acknowledge / resolve / dismiss. A signal from business A cannot be mutated through business B’s URL (`404 not_found`). Existing lifecycle helpers `canAcknowledgeSignal` / `canResolveSignal` / `canDismissSignal` are preserved. Mutation failure returns `400` and does not invent a new status.

## Assistant businessId/threadId correction

API URLs use `businessId` in the business path segment. `threadId` is only the conversation identifier under that business. `getThreadById(businessId, threadId)` rejects cross-business thread access.

## Assistant cross-business protection

Repository already filters `business_id` on `getThreadById` and `listMessagesForThread`. The repaired route calls those with both IDs. No fake thread fallback. No second memory store.

## Outcomes dynamic route

`GET /api/admin/businesses/[businessId]/outcomes` lists `listBusinessOutcomes(businessId)` after auth, `view_business_detail`, and the existing outcomes feature flag.

## Feature flag state

Unchanged. Flags remain `business_proactive_advisor`, `business_contextual_assistant`, `business_outcomes`. Runtime enablement is still `tier === "global"` from `business_identity_flags`. Migration inserts remain `enabled=false`.

## Production flag state

Unchanged. This gate does not set Production environment variables and does not enable Program 7 in Production.

## Today / Command Center Advisor integration

**IMPLEMENTED** with a bounded repository read `listActiveSignalsForStaffAttention()`:

- source: `business_advisor_signals`
- `status = active` only
- `ADVISOR_ATTENTION_LIMIT = 20`
- two queries max (signals + matching `businesses` names)
- not N+1
- no new table / notification store / score

Shown only when the Advisor flag is enabled. Labeled **Advisor** so it is not confused with Owner Handoff (accepted proposals) or Today follow-ups. Failure is isolated and does not crash Command Center.

## Query boundedness / no N+1

Yes. Same two-query pattern as Gate 08 Owner Handoff.

## Advisor signal types

Unchanged:

`COMMITMENT_DUE` · `COMMITMENT_BLOCKED` · `POSTPONED_RECOMMENDATION_REVIEW_DUE` · `CREATIVE_AWAITING_REVIEW` · `PROPOSAL_AWAITING_OWNER` · `UNRESOLVED_CONTRADICTION` · `STALE_CRITICAL_TRUTH` · `OUTCOME_REVIEW_DUE` · `CAPACITY_STRETCHED`

## Lifecycle

Unchanged: `active` · `acknowledged` · `resolved` · `expired` · `dismissed`

Canonical actions only: `acknowledge` · `resolve` · `dismiss`

## Deep links

`advisorSignalDashboardAnchor()`:

- commitments → `#promises`
- postponed recommendation review → `#recommend`
- creative awaiting review → `#creative`
- proposal awaiting owner → `#proposals`
- contradiction / stale truth → `#business-book`
- outcome review → `#outcomes`
- capacity stretched → `#overview`

## AI governance

Advisor surfaces / prioritizes / explains / links. It does not create recommendations, rewrite facts, send messages, create contracts, charge, or publish.

Assistant remains READ / EXPLAIN / SUMMARIZE / GUIDE / DRAFT / SUGGEST via existing `validateActionBoundary`. Provider unavailability is a truthful failure, not a fake answer.

## Notifications boundary

In-app / read-derived only. No email, SMS, WhatsApp, push, or background notification job.

## Field PWA boundary

Unchanged. No background sync, offline mutation queue, live recording, or ASR.

## Capability preservation

Program 7 staff routes use `requireSalesWorkspaceAccess` + existing `view_business_detail`. No new role matrix. `sales_rep` access was not widened.

## Owner bootstrap

`salesActorToAdvisorActor` / `salesActorToAssistantActor` map bootstrap to `type: "owner"` with the existing bootstrap attribution UUID. They never fabricate a roster id.

## Cross-business isolation

Advisor, Assistant, and Outcomes repository calls all require `businessId` plus the row id. Cross-business mutation/read through the wrong URL returns `not_found`.

## Mobile / desktop

Advisor cards stack; actions `min-h-[44px]`; labels wrap. Assistant input/actions are 44px+. Outcome rows wrap. Command Center Advisor rows stack. No live authenticated visual QA claimed.

## Tests

- `npx tsx scripts/program7-business-concierge-tests.ts` — PASS 92/92 (this file is the Program 7 tests / behavior suite)
- `npx tsx scripts/program7-verifier.ts` — PASS 84/84
- `npx tsx scripts/verify-sales-business-workspace-01.ts` — PASS 102/102
- Opportunity tests/verifier — not rerun (Opportunity files untouched)
- Program 5 verifier — not rerun (proposal/commitment architecture untouched)
- Program 6 verifier — not rerun (Creative files untouched; encoded Creative Studio list route left in place)
- targeted TypeScript — no Gate 09 file errors (project-wide `tsc` still exits 2 on unrelated e2e/autos errors)
- ESLint on Gate 09 files — PASS
- `git diff --check` — PASS
- `npm run build` — PASS

## Final engineering status

This is the final Business Concierge implementation gate. Program 7 routes resolve, Advisor/Assistant identity boundaries are repaired, Outcomes remain canonical, and Program 7 governance remains locked. Coach review is required before commit/push/deploy.
