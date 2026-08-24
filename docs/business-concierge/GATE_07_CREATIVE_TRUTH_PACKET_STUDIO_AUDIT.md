# Gate 07 — Creative Truth Packet + Creative Studio

**Date:** 2026-08-24
**Worktree:** `C:\projects\elaguila-website-concierge`
**Branch:** `integration/business-concierge-foundation-2026-07`
**Baseline HEAD:** `77c443dbac27c41a54239e4c70c945fce5b0671c` (local = origin)
**Commit / push / deploy:** none (Coach review first)

---

## Canonical Creative Studio architecture

Existing Program 6 Creative Studio remains the only creative domain: jobs, append-only `business_creative_input_snapshots`, briefs, versions, reviews, exports, provider runs.

Staff surface: `#creative` via `CreativeJourney`, still using `CreativeStudioActions` for brief save and human-triggered generate. No second engine, snapshot store, or client creative database.

Journey on one dashboard section: Input → Brief → Create → Review → Export / Handoff.

## Truth Packet source

Canonical store: `business_creative_input_snapshots` via `getLatestSnapshotForJob`.

Staff name: **Creative Truth Packet**. Copy states it is a snapshot of verified/approved inputs used for the job, not live-mutating canonical business truth.

Snapshots are created append-only at generate time (`assembleResearchPacket` + `createInputSnapshot` in the existing generate route). Gate 07 does **not** call `assembleResearchPacket` on the dashboard (no silent live recomposition). Jobs created by Request Creative may have no snapshot until generate — empty state is truthful.

## Exact displayed snapshot fields

From stored `categories` only:

| Category key | Staff group | Fields shown |
| --- | --- | --- |
| `identity` | Business | `displayName`, `normalizedName`, `primaryLanguage`, `broadBusinessType`, `operatingModel`, `businessStage` (empty values labeled Missing) |
| `approved_contacts_location` | Verified facts / contact | `facts[].fieldKey`, `displayValue`, `sourceClass` |
| `source_recommendation` | Recommendation context | `recommendations[].dimensionKey`, `needEn` / `needEs` |
| `ai_research_context` | Inferred research context | `briefingCount` (labeled inferred / not printable fact) |

Evidence refs (when stored): `sourceClass`, `approvalState`, `factId`. Missing `approvalState` is shown as “not stored”, never as approved.

Assembler `missingTruth` / `staleItems` / `contradictedItems` arrays are **not** persisted on the snapshot row (only `categories` are stored). Gate 07 does not invent a second store for them. Category `truthStatus` is labeled: KNOWN=Verified, UNAPPROVED_INFERENCE=Inferred / draft, UNKNOWN=Missing, STALE/CONTRADICTED=Caution.

No client colors / logo / personality fields exist in the current snapshot assembler, so none are invented.

## Immutable snapshot rule

Read latest stored snapshot version for the job. Do not replace it with a live Living Book / Health Map reassemble. If current business truth changed after snapshot creation, Gate 07 does not build diff machinery.

## Truth Packet vs Brief vs Output vs Review vs Export

| Object | Meaning |
| --- | --- |
| Truth Packet | Stored input snapshot |
| Creative Brief | Derived working direction (`business_creative_briefs`) |
| Generated copy | Job version output |
| Review | Human assessment notes |
| Export / handoff | Stored export rows; not publication |

## Opportunity bridge

Gate 06 human **Request Creative** still creates the job via the existing bridge. Creative Studio shows `sourceOpportunityId` / title from already-loaded opportunities. Approved opportunity ≠ client acceptance ≠ confirmed sponsorship. Generate remains a separate staff action. No auto creative request. No auto generation on opportunity approval.

## Recommendation context

If `sourceRecommendationId` is on the job, it is named and linked to `#recommend`. If absent, `#recommend` is still offered as a cross-link. Snapshot `source_recommendation` category is shown when stored. No new recommendation linkage table.

## OpenAI state

Existing provider registry. Staff see configured / not configured for Gemini and OpenAI. Unconfigured: “Creative generation provider is not available.” Failed runs persist `provider_unavailable` / failed and do not invent output. Last provider run key/status is displayed when stored.

## Image generation flag state

`OPENAI_IMAGE_GENERATION_ENABLED` + key via `isImageGenerationLive()`. **No image-generation UI button.** Flag not enabled in Production by this gate. Even if a server flag were live, Gate 07 still does not surface a button.

## Rights handling

Stored evidence-ref `approvalState` / `sourceClass` only. Missing rights are not labeled approved. No new rights engine. Existing doctrine `truth_lock_never_invent` is unchanged.

## Client brand boundary

Staff shell uses Leonix cream/burgundy/gold. Copy states client creative must use stored client truth, not Leonix palette. Snapshot currently has identity + facts, not a client hex palette — none is fabricated. Leonix colors are not written into generation output.

## Canva boundary

`CANVA_DEFAULT_STATUS = manual_handoff`. UI: “Ready for Canva finishing” + “No Canva API is claimed.”

## Publication boundary

None built. Generated ≠ approved ≠ published. Export ≠ published. No web/magazine/social/email/SMS publish.

## List-route repair decision

**NOT REQUIRED.**

The Business Dashboard lists jobs with server-side `listJobsForBusiness` on the detail page. It does not call `GET /api/admin/businesses/[businessId]/creative-studio`. The encoded folder `app/api/admin/businesses/%5BbusinessId%5D/creative-studio/route.ts` therefore does not block this staff workflow. Gate 09 still owns Program 7 encoded advisor/assistant/outcomes routes. Those were not touched.

Job/version/review/export rows are mapped from snake_case through existing repository mappers so staff UI shows canonical TypeScript fields. No schema change.

## Capability preservation

Unchanged:

- `sales_rep`: `view_creative_studio`, `upload_creative_assets` (no generate / brief / approve / export)
- manager / super_admin: existing generate, brief, review, final approve, export capabilities

Gate 07 UI only exposes brief save and generate when those capabilities already exist. No review/approve/export mutation UI was added because those admin routes are not present on this dashboard.

## Owner bootstrap

Unchanged. No owner dashboard changes. No fabricated roster. Staff-only Creative Studio internals remain on `/admin`.

## Mobile / desktop

390px: stacked packet cards, wrapping URLs/asset text, 44px+ actions and brief inputs, raw JSON behind optional disclosure. Desktop: compact Input / Brief / Create / Review / Export groups on the same dashboard. Live browser pass was not available (no local admin server in this session); layout is structural.

## Tests

- `npx tsx scripts/program6-creative-studio-tests.ts` — PASS 124/124
- `npx tsx scripts/program6-creative-studio-verifier.ts` — PASS 267/267 (includes 4 Gate 07 staff-surface checks)
- `npx tsx scripts/business-opportunity-tests.ts` — PASS 11/11
- `npx tsx scripts/business-opportunity-verifier.ts` — PASS 62/62
- `npx tsx scripts/verify-sales-business-workspace-01.ts` — PASS 98/98
- targeted TypeScript — no Gate 07 file errors (project-wide `tsc` still exits 2 on unrelated e2e/autos errors)
- ESLint on Gate 07 files — PASS
- `git diff --check` — PASS
- `npm run build` — PASS

## Gate 08 dependency

Proposal accepted/declined handoff, postponed follow-up, and Chuy queue remain Gate 08. Creative Studio does not accept proposals or publish.
