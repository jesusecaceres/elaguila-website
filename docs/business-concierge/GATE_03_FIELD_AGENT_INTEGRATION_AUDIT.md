# Gate 03 — Field Agent Integration

**Date:** 2026-08-21
**Worktree:** `C:\projects\elaguila-website-concierge`
**Branch:** `integration/business-concierge-foundation-2026-07`
**Baseline HEAD:** `d0bcc75352914f6a35017c2feb16e514fc32f13b`
**Commit / push / deploy:** none (Coach review first)

---

## Prior Field Agent UX

`/admin/field` was a compact list titled “Field Agent” with an `AdminPageHeader`. It loaded the existing workspace business list and had no Staff Command Center link.

`/admin/field/[businessId]` showed the business name, three quick links (`View business`, `#field-discovery`, `#advisor`), photo/file capture, and voice dictation. Success copy was only “Nota guardada / Note saved.” There was no Business Dashboard / Command Center identity, no save-destination explanation, and no recent notes.

Capture mechanics themselves (Field Discovery upload, Living Book `staff_note` evidence, explicit Save Note) were already working from Program 7 / Human QA Defect Patch 01.

## Navigation changes

| From | To | Result |
| --- | --- | --- |
| `/admin/field` | Staff Command Center `/admin/businesses` | Added |
| `/admin/field/[businessId]` | Staff Command Center `/admin/businesses` | Added |
| `/admin/field/[businessId]` | Business Dashboard `/admin/businesses/[businessId]` | Added (replaces generic “View business”) |
| `/admin/field/[businessId]` | `#business-book` after a successful note | Added |
| Business Dashboard | `/admin/field/[businessId]` | Unchanged from Gate 02 |

Field Agent is labeled **Leonix Business Concierge / Field Agent / Quick capture in the field.** It is not presented as the full Concierge.

## Save destination clarity

After a successful Save Note:

- “Note saved.”
- Saved to: Living Business Book evidence
- Type: Staff note
- Clarification: staff evidence, not automatically a verified business fact
- Link: View Business Dashboard / Ver Business Book → `/admin/businesses/[businessId]#business-book`

Save remains explicit. Transcript clears only after success. Failure retains text, shows an error, and does not navigate away.

Owner bootstrap continues to write Living Book evidence via `salesActorToLivingBookActor` (`type: "owner"`). It does not write `business_sales_notes`.

## Recent notes decision

**IMPLEMENTED.** `listEvidenceForBusiness(businessId)` already exists in `app/lib/business/livingBook/repository.ts` and is scoped to one business, excluding deleted rows. Field Agent now filters that list to `evidenceType === "staff_note"` and shows up to 5 recent items when the actor has `view_business_book`.

No new table. No new evidence API. Read failure is caught and shown as “unavailable”; capture remains usable. Empty copy: “No recent field notes.”

## Quick actions

All backed by existing Gate 02 dashboard routes/anchors:

| Label | Route |
| --- | --- |
| Open Business Dashboard | `/admin/businesses/[businessId]` |
| Staff Command Center | `/admin/businesses` |
| Create Follow-up | `/admin/businesses/[businessId]#outreach` |
| Meeting | `/admin/businesses/[businessId]#meetings` |
| Discover | `/admin/businesses/[businessId]#discover` |
| Opportunities | `/admin/businesses/[businessId]#opportunity` |
| Outreach | `/admin/businesses/[businessId]#outreach` |

Removed dead hashes `#field-discovery` and `#advisor`.

## Data ownership

- Voice note → `business_evidence` (`staff_note`) via existing `POST /api/admin/businesses/[businessId]/book/evidence`
- Photo/file → existing Field Discovery `/api/admin/field-discovery/assets/upload` (`fileKind: "photo"`)
- Follow-up → existing `business_follow_ups` only by opening Business Dashboard Outreach
- Business list → existing `listBusinessesForWorkspace` (limit 25)

No migration. No new notes table. No reminder table. No duplicate business inventory.

## Auth preservation

`requireSalesWorkspaceAccess()` unchanged. `isStaffSalesAllowedAdminPath` still allows `/admin/field` and `/admin/field/**` for `sales_rep`. Unrelated admin remains denied. Owner bootstrap is still a non-roster actor; no fabricated roster row.

## PWA preservation

Unchanged:

- `name`: Leonix Business Concierge
- `short_name`: Leonix Concierge
- `start_url`: `/admin/businesses`

Field Agent remains a mode inside the installed Business Concierge PWA.

## Service worker / offline

`public/sw.js` architecture preserved. Still never caches `/api/`, `/auth/`, or Supabase. No mutation queue, background sync, private API cache, Business Book cache, or raw note cache. Offline save still fails truthfully and does not claim the note was saved.

## Mobile (390 × 844)

Field Agent stays `max-w-md` with `overflow-x-hidden`. Crest is 32px. Action targets are 44px+ (Dictate, Save Note, Take Photo, Upload File, Command Center, Business Dashboard). Recent notes are compact. Field Agent is intentionally simpler/faster than Business Dashboard.

## Desktop

The same compact column renders on desktop. It is not a second Command Center. Business Dashboard remains the full workspace.

## Tests

- `npx tsx scripts/program7-business-concierge-tests.ts` — PASS (81/81)
- `npx tsx scripts/program7-verifier.ts` — PASS (79/79)
- `npx tsx scripts/verify-sales-business-workspace-01.ts` — PASS (83)
- ESLint on changed files — PASS
- `git diff --check` — PASS
- `npx tsc --noEmit` — no new errors in Gate 03 files (pre-existing e2e errors only)
- `npm run build` — PASS

## Deferred

- **Natural-language follow-up parsing** (“Call Maria Friday at 3”) — Gate 04+ Outreach composer. Gate 03 only links Create Follow-up → `#outreach`.
- **Live recording / raw audio persistence** — unchanged Program 5/7 doctrine. Dictation remains Web Speech → text only.
- **Auto-save, live transcription provider, reminder DB, Promise Keeper merge** — out of scope.

## Risks

- Recent notes show `staff_note` evidence already readable by `view_business_book`; they are not confirmed facts.
- Quick actions that hash-jump to capability-gated dashboard sections still land on the dashboard; the dashboard already omits unauthorized panels.
- Sequential dashboard scroll order from Gate 02 is unchanged.

## Gate 04 dependency

Outreach / follow-up composer can attach to the existing `#outreach` surface. Field Agent already points Create Follow-up there. Do not parse dates in Field Agent.
