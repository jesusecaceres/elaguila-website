# Gate 05 — Meeting Prep → Meeting → Meeting Review

**Date:** 2026-08-21
**Worktree:** `C:\projects\elaguila-website-concierge`
**Branch:** `integration/business-concierge-foundation-2026-07`
**Baseline HEAD:** `b67600b66a8e858380aac2716b36a407eff66c98`
**Commit / push / deploy:** none (Coach review first)

---

## Canonical meeting architecture

| Concern | Source | Result |
| --- | --- | --- |
| Meeting Prep | Lion’s Cockpit `assembleCockpitBriefing` | Deterministic read of existing Living Book / Health Map / Stewardship / Promise Keeper / proposal summaries already assembled for Program 5 |
| Meeting conduct | Meeting Studio (`business_meetings` + attendees, consents, notes, transcript imports) | Existing APIs and `MeetingStudioActions` remain canonical |
| Transcript | `business_meeting_transcript_imports` `import_method = manual_import` | Import-only representation of manual/external text |
| Live recording | none | Not implemented, not certified |
| Native ASR | none | Not added |
| Meeting notes | `business_meeting_notes` | Stay meeting notes until human promotion |
| Living Book promotion | `business_meeting_note_promotions` + `promote_note` | Explicit staff action; `review_meeting_notes` on the server |
| Commitments | Promise Keeper `business_commitments` | Navigation to `#promises`; no auto-create from notes |
| Sales follow-up | Gate 04 `business_follow_ups` | Navigation to `#outreach`; no meeting-follow-up table |
| Proposals | existing proposal studio | Navigation to `#decide` only when the domain is already loaded |
| Status enum | existing `planned / prepared / in_progress / completed / cancelled` | Unchanged; no migration |

No new meeting database. No new commitment system. No new transcript provider.

## Meeting Prep mapping

`#meetings` step 1 labels Lion’s Cockpit as **Meeting Prep**. Categories are shown only from already-loaded briefing/page truth:

- What we know → confirmed Living Book facts
- Owner-stated / staff observation / AI inference / system-derived → existing truth classes, omitted when empty except core known/unknown
- What we don’t know → unknowns
- Contradictions / cautions → contradictions + existing `whatNotToSell`
- Business health context → briefing health-map summary when present
- Current relationship / follow-up → already-loaded sales profile + Gate 04 follow-up
- Open recommendations → current stewardship candidate when present
- Open opportunities → count/nav only if Opportunity is already loaded
- Open promises → briefing commitment counts
- Questions to ask → presentation-only staff prompts + existing Cockpit suggested topics

No new cross-domain fan-out. No fake briefing rows.

## Meeting conduct

Step 2 is Meeting Studio: create/start via existing status transitions, attendees, existing consent types, notes, transcript import. Compact meeting history uses `listMeetingsForBusiness` (already fetched).

## Transcript import truth

UI label is **Import Transcript**. Copy: use a transcript created manually or by an external tool. Not live recording. Not auto-promoted to canonical business truth. Existing `import_transcript` action; `consentRecordId` passed when a provided transcription consent already exists, otherwise null (existing repository rule).

## Meeting Review

Step 3 lists completed meetings and restates Fact / Evidence / Unknown / Contradiction / Meeting note. Promotion remains the existing `Promote to Living Book` form. Empty: “No meeting is awaiting review.”

## Living Book promotion boundary

DRAFT / NOTE → human review → explicit promotion → Living Business Book. Never: meeting note → automatic fact; AI summary → automatic fact; transcript sentence → automatic fact. Failure keeps the note unpromoted and shows the API error.

## Commitment bridge

Follow-through links to `#promises` (existing `CreateCommitmentForm`). Promise Keeper remains canonical commitments. Not used for cold-sales retry follow-ups.

## Sales follow-up boundary

Follow-through and prep link to `#outreach`. No duplicate meeting-follow-up table. No auto-create from notes.

## Proposal boundary

“Open proposal” / “Review proposals” → `#decide` when proposal domain is already visible. No auto-create. No acceptance from meeting notes. Gate 08 still owns commercial decision organization.

## Opportunity / creative / recommendation

Navigation only (`#opportunity`, `#creative`, `#recommend`) when those dashboard sections already exist. No auto job, sponsorship, or recommendation.

## AI governance

Cockpit remains a deterministic assembler. Existing Field Discovery briefing review is unchanged and still not a confirmed fact. Meeting journey does not add an extraction engine. AI may not confirm facts, approve recommendations, bind commitments, accept proposals, send client communication, publish creative, or charge.

## No-recording boundary

Visible copy: live meeting recording is not currently available. No MediaRecorder, raw audio storage, Whisper, Deepgram, AssemblyAI, or Google speech. Existing `audio_recording` consent **type** is preserved as Meeting Studio schema, labeled as type-only, and does not enable a recorder. Field Agent browser dictation remains a separate capture tool.

## Mobile / desktop

Stacked cream/ivory cards, gold section labels, burgundy primary actions, 44px+ targets, no giant tables. Desktop keeps compact briefing + history + current meeting/review on the same dashboard page.

## Tests

- `npx tsx scripts/program5-tests.ts` — PASS 151/151
- `npx tsx scripts/program5-verifier.ts` — PASS 81/81
- `npx tsx scripts/verify-sales-business-workspace-01.ts` — PASS 92/92
- targeted TypeScript — no new errors in Gate 05 files (pre-existing e2e errors only)
- ESLint on changed files — PASS
- `git diff --check` — PASS
- `npm run build` — PASS

## Deferred future live recording

Certified later only with a real recorder, consent, storage, and provider design. Out of Gate 05.

## Gate 06 dependency

Stewardship vs Opportunity remain distinct domains. Gate 05 only navigates to existing `#recommend` / `#opportunity` surfaces. Review-queue organization is Gate 06.
