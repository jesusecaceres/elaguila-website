# Gate 04 — Outreach + Canonical Follow-up

**Date:** 2026-08-21
**Worktree:** `C:\projects\elaguila-website-concierge`
**Branch:** `integration/business-concierge-foundation-2026-07`
**Baseline HEAD:** `f57d91cece8566fb75a825804ff21a5be5fb47f2`
**Commit / push / deploy:** none (Coach review first)

---

## Canonical outreach domain

| Concern | Source | Result |
| --- | --- | --- |
| Relationship / sales status | `business_sales_profiles.status` (`BusinessSalesStatus`) | Existing enum only: new, needs_review, ready_to_contact, contacted, follow_up_due, waiting_on_owner, not_a_fit_right_now, active_client, archived |
| Current follow-up | `business_follow_ups` (one current via partial unique index) | Stored `status` is typically `scheduled`; `due_today` / `overdue` are derived at read time from `scheduled_date` |
| Follow-up fields | `scheduled_date`, `scheduled_time`, `purpose`, `contact_method`, `status`, `created_by_email`, `created_by_role` | Replacement, not a timeline |
| Internal notes | `business_sales_notes` | `author_roster_id` NOT NULL FK — real roster required |
| Audit | `business_sales_audit_log` (write-only from this gate) | No list API existed; history deferred. Notes list is the visible outreach history |
| Contact channels | existing `business_contacts` | tel / sms / wa.me / mailto / website only when a real value exists |

No second relationship-stage model. No reminder table.

## Outreach section

`#outreach` now answers: status, contact actions, follow-up (when/why/next action), internal notes. Header Status control remains the editor. Follow-ups remain distinct from Promise Keeper.

## Field Agent bridge

Unchanged: Create Follow-up → `/admin/businesses/[businessId]#outreach`. Needs Attention Command Center rows now land on the same `#outreach` hash. Field Agent stays capture-first.

## Today / Needs Attention

Gate 01 composer already used `nextFollowUpStatus` and deduped attention by `businessId`. The list mapper previously passed **stored** follow-up status (`scheduled`), so due-today/overdue chips could stay at zero.

**Tiny correction:** `listBusinessesForWorkspace` now applies `deriveFollowUpDisplayStatus(stored, scheduled_date, todayIso)` once per list render. Headline due/overdue counts are therefore real date-derived follow-ups. Same business cannot appear in both due-today and overdue arrays.

## Owner bootstrap

`createSalesNote` and `upsertCurrentFollowUp` reject `owner_bootstrap` / empty `rosterId`. UI hides those forms and points Field Agent Living Book evidence for notes. No fabricated roster row.

## Promise Keeper / Meeting / Program 7

Untouched. Call-back-Tuesday style work stays in `business_follow_ups`. `#meetings` remains sufficient if outreach leads to a meeting. Advisor/Assistant encoded routes remain Gate 09.

## Contact CTAs

Native `tel:`, `sms:`, `https://wa.me/`, `mailto:`, website. No Twilio, no campaign email, no auto-send.

## Suggested follow-up interval

No existing deterministic helper. **Not built.** Human date + purpose remain required.

## Deferred

- Natural-language date parsing
- Auto-create follow-up from notes/dictation/status
- Audit-log activity feed (no existing scoped list read)
- AI scheduling / “try again in 3 days” engine
- Follow-up history timeline (schema is one current follow-up)

## Mobile / desktop

Outreach is stacked compact cards, 44px primary targets, `overflow` contained by existing dashboard column. Desktop is the same flow, scannable, not a dense table.

## Tests

- `npx tsx scripts/verify-sales-business-workspace-01.ts` — PASS (88)
- ESLint on changed files — PASS
- `git diff --check` — PASS
- `npx tsc --noEmit` — no new errors in Gate 04 files (pre-existing e2e errors only)
- `npm run build` — PASS

## Gate 05 dependency

Meeting Studio journey is unchanged. Outreach can send staff to `#meetings` via existing dashboard nav only.
