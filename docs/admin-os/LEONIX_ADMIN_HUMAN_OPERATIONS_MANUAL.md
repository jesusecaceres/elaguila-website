# Leonix Admin — Human Operations Manual

**Status:** Draft, updated after the Pre-QA Forensic Completion Audit,
`integration/admin-os-live-qa-repair-2026-09`, 2026-09-14. Every claim below still reflects
source-code verification, not browser click-through, unless explicitly marked otherwise —
see §13 for what still needs a live session.
**Audience:** Chuy (owner), any authorized Leonix staff, and any future operator who needs to run
the company without prior tribal knowledge of this codebase.
**Companion docs:** `ADMIN_OS_LIVE_QA_WIRING_BOOK.md` (forensic map + what was found/fixed),
`ADMIN_OS_CABLE_MAP.md` (system-by-system wiring), `ADMIN_OS_PROGRESS.md` (full gate-by-gate
history), `ADMIN_OS_TESTS.json` (machine-readable record of every fix),
`ADMIN_OS_PRE_QA_FORENSIC_COMPLETION_AUDIT.md` (the source-level re-audit that found and closed 3
gaps the earlier gate program had marked complete too early). This manual is the day-to-day "how
do I actually run the company from here" reference; the other five are the evidence trail behind
it.

---

## 1. What Leonix Admin is

Leonix Admin (`/admin/*`) is the operating headquarters and book of record for the company. It is
built to answer, at any time, without opening the database or asking Chuy from memory:

- **WHO** — which customer, business, or staff member is involved
- **WHAT** — what state a record is in right now
- **WHERE** — which page controls it
- **WHEN** — when something happened or is due
- **WHY** — why a listing was flagged, a payment failed, or an action is blocked
- **WHAT NEXT** — the recommended next action

LEO (`/admin/leo`) is an optional conversational layer on top of the same canonical data. It is
never the only path to a fact or a control — everything LEO can tell you is also reachable directly
from the pages below. If LEO is ever down, wrong, or unavailable, this manual still works.

## 2. The six domains

| Domain | What it covers | Start here |
|---|---|---|
| **COMMAND** | Cross-domain overview, Company Search, LEO | `/admin` (Command Center) |
| **REVENUE** | Leads, payments, package entitlements, promo codes, sales tracker | `/admin/leads/inbox`, `/admin/workspace/payment-tracker` |
| **MARKETPLACE OPS** | Classifieds listings, moderation, reports, category ops | `/admin/workspace/clasificados` |
| **PEOPLE** | Users, businesses (Business 360), team, support | `/admin/usuarios`, `/admin/businesses`, `/admin/team` |
| **WEBSITE (CONTROL)** | Public site content sections, settings, language audit | `/admin/workspace` |
| **SYSTEM** | Health monitoring, audit log, the Admin Guide itself | `/admin/system-health`, `/admin/activity-log`, `/admin/guide` |

## 3. Starting your day

1. Open `/admin`. **Today's Attention** shows what needs you first — leads needing reply, listings
   needing review, reports, payments at risk, and (if degraded) system issues. This section is
   ordered by real urgency, not database order (Gate 13 fixed a prior issue where the LEO
   discovery card and Promo Code Generator CTA outranked these actual metrics).
2. Every count on the Command Center is either live from Supabase or explicitly labeled when a
   source is temporarily unavailable — never a fake number.
3. Click a card's own action button to go straight to the real control for that item. On the
   "Needs review" card specifically, a breakdown now shows exactly which of the 5 source tables
   (classifieds, empleos, viajes, servicios, ofertas locales) make up the total, each with its own
   link — the total and the breakdown always reconcile exactly (Gate 2).

## 4. Finding a specific record

Two different search tools exist for two different jobs — using the wrong one for the job used to
be a real point of confusion (Gate 14):

- **The sticky search box in the top bar** (visible on every page) only searches **Clasificados
  listings** (title, city, ID). It now carries its own "Listings only — Company Search →" hint
  linking to the tool below, so you're never stuck typing a person's name into it with no result
  and no path forward.
- **Company Search** (`/admin/ops`) is the real cross-entity search — businesses, users, listings,
  orders, leads, reports, staff, and more, all in one box, grouped by type. Use this whenever you
  know *what* you're looking for but not *which page* it lives on. One flaky data source degrading
  never takes down the others (Gate 1 fixed a defect where a single slow source could 503 the
  entire page).

## 5. Reading the truth-status system

Pages, cards, and individual action buttons carry consistent status language. Learn these once:

| Badge | Meaning |
|---|---|
| **REAL** | Backed by a live query against real data right now. |
| **PARTIAL** | Some of the page works end-to-end; some parts are still code-only or incomplete. |
| **NEEDS LIVE PROOF** | The data source or write path could not be confirmed live from this environment — don't treat it as certain until it's investigated. |
| **NEEDS SCHEMA GATE** | Depends on a database migration that has not been applied in this environment. |
| **PLANNED** | Not built yet — shown honestly as a placeholder, never as fake data. |
| **BROKEN** | An editor or control exists and appears to work (saves succeed), but does not reach the live system it claims to control. New this program (Gate 11) — added specifically because forcing a broken editor into "PARTIAL" or "MISSING" would have been less honest than naming what's actually wrong. |
| **HONESTLY_DISABLED** | Intentionally turned off; documented as such, not a bug. |

On individual action buttons (e.g. Suspend, Archive, Verify Leonix), you'll also see a **risk
badge** ("HIGH RISK", "MEDIUM RISK", etc.) right next to the truth-status chip. These answer two
*different* questions — hover either one for the distinction (Gate 6 added this after finding the
two badges read as one ambiguous signal):
- The status chip = "is this feature proven to work?"
- The risk badge = "how consequential is using it?"

## 6. Moderation and AI Review

- "Run AI review" on a classifieds listing requires `OPENAI_API_KEY` to be configured. If it's
  missing, the button says so plainly rather than failing silently.
- If the AI call succeeds but the result can't be saved (a database/schema issue), you will now see
  an honest "ran but could not be saved — re-run once fixed" message instead of a false "completed"
  label (Gate 3 fixed this).
- Every flagged/pending listing shows its **provenance**: AI, Report, Manual, or Status-only, plus
  a "Needs triage" badge when no reason was ever stored for the flag. Never treat an unexplained
  flag as automatically high-risk — it just means a human needs to look.
- System Health now tracks whether the AI moderation provider (OpenAI) and the AI Gateway (used by
  Prayer Wall safety classification and other AI-assisted features) are configured at all — check
  `/admin/system-health` before assuming a feature is broken rather than simply unconfigured
  (Gate 18a).

## 7. Reports and the Reports↔User relationship

- `/admin/reportes` now shows the reported listing's title, how many other pending reports exist on
  it, and any stored AI moderation decision — inline, no second tab required (Gate 4).
- Clicking a report's Reporter link now carries you to that user's page with a visible "Viewing
  this account because of report #XXXXXXXX" banner and a "← Back to report" breadcrumb, and
  highlights the matching report in that user's own report history — this context used to be lost
  the moment you clicked through (Gate 4).

## 8. Business 360 and Commercial Benefits

`/admin/businesses/[id]` is the closest thing to a full company book entry for one business:
contacts, connected advertisements, notes, follow-ups, and a **Commercial Benefits** section
showing, for that business's **verified** connected listings only:
- **Package entitlements** — category, tier, **grant source** (Stripe checkout, admin-manual,
  print-included, comp, partner, or manual-cleared-payment — never guessed, only what the record
  itself says), status, and start/end dates.
- **Promo code redemptions** — package key, status, and exact discount amount.
- **Payment records** — status, amount paid, package tier, and whether that payment is tied to a
  promo code (so a comp/partner grant is never confused with a promo-driven discount).

Below that, two direct links — "Manage entitlements for this business →" and "Manage promo codes
for this business →" — take you straight into the real workspace, pre-filtered by this business's
name, so you don't need to already know those workspaces exist to act on what you just saw here.

This rollup only ever counts verified links — a pending, unconfirmed connection is never presented
as confirmed commercial activity. Every list is capped at 20 rows per source (a "+" after the count
means there are more; open the linked workspace for the full list).

The Users page (`/admin/usuarios/[id]`) also gained (Gate 7):
- **Linked Businesses** — real business-membership relationships, not a guess from matching names.
- **Support Cases** — the account's own support tickets.
- **Next Action** — a plain-language recommendation (pending reports on their listings → open
  support tickets → disabled-account flag → "no urgent action"), derived only from data already on
  the page.

## 8B. Staff Contact Page and Virtual Front Desk (added 2026-09-14)

These are two already-existing, already-working systems that had a discoverability gap, not a
missing-feature gap — nothing described here was built new during this pass except the
navigation/help layer that makes them findable.

**Staff Contact Page** — a staff member's *public* contact page (photo, title, theme, QR code,
vCard, contact actions) is a completely separate system from their *login* access:
- **Team Roster** (`/admin/team/roster`) — who can sign into Admin, their role, permissions.
- **Executive Hub** (`/admin/team/executive-hub`) — the public contact profile, published at
  `/contact/{slug}`. Create, edit, publish/suspend/archive here. Creating a login does **not**
  create a contact page, and vice versa — Team Roster now has a "Staff Contact Page" card
  explaining this and linking straight to Executive Hub.
- A staff member with a profile an owner has linked to their login can self-edit their own safe
  fields from **My Profile** (`/admin/team/my-profile`).

**Virtual Front Desk / Digital Doorbell** — the live visitor system at the public `/visitanos`
page. A visitor there can request a video call; two Admin pages make that actually reach a human:
- **Virtual Front Desk** (`/admin/digital-contact/doorbell`, now in the sidebar's People group) —
  enroll THIS device to receive push notifications when a visitor calls (Samsung/Android-first).
  Any staff member can do this for their own device — it's a personal action like My Profile, not
  owner-only.
- **Presence** (`/admin/digital-contact/presence`, linked from the doorbell page) — set a
  short-lived AVAILABLE/BUSY/AWAY status. Every status expires; there is no permanent schedule.
- The video request is only *active* for a visitor during 9am–5pm Pacific office hours; outside
  that window it's shown as informational only. WhatsApp, phone, text, and email remain available
  to the visitor at all times regardless of video status — those fallback destinations come
  directly from the relevant staff member's Executive Hub profile, not a separate config.
- A static Google Meet / Microsoft Teams / FaceTime link (optionally added on an Executive Hub
  profile) is a **secondary, emergency-only fallback** — it is never the primary doorbell/ringing
  path and its mere presence does not prove anyone is actually available.
- **System Health**: `/admin/system-health` has a "Virtual Front Desk (visitor doorbell)" row —
  config-presence only (is Daily's API key set? are the web-push VAPID keys set?), never a live
  provider call. If it says NOT_CONFIGURED, that names exactly which piece is missing and is an
  environment/provider setup issue, not something fixable from the doorbell page itself. There is
  still no admin-editable configuration beyond device enrollment and presence — contact
  destinations are Executive Hub fields, not a separate control surface here.

## 9. Known, accepted limitations (not bugs — read this before assuming something is broken)

- **Stripe outage detection**: System Health now makes one safe, read-only Stripe API call
  (`balance.retrieve()` — no money movement, nothing created or modified) whenever recent webhook
  history alone can't tell "no traffic yet" apart from "the key is dead." This closes the previous
  silent-outage blind spot. It still cannot be exercised in an environment with no Stripe key
  configured (it correctly reports `NOT_CONFIGURED` instead), and a slow/unreachable Stripe times
  out after 2.5s and degrades to an honest `DEGRADED` state rather than hanging the page.
- **Language Audit** (`/admin/workspace/language-audit`) has one genuinely live check — a
  "Dictionary key coverage" section that recomputes, on every load, whether the EN and ES entries
  in the shared Admin string dictionary have the same keys. Everything below that section (the
  per-domain checklist rows) remains a fixed checklist value, not a live check — it verifies that
  Admin's own chrome resolves through the shared dictionary, nothing about individual field
  content. Separately: Admin's operator-facing chrome is English-only by deliberate product
  decision today (`getAdminLang()` always returns `"en"`) — the ES dictionary exists but is
  dormant, not a broken language switch.
- **Activity Log** actor attribution shows `"server"` for actions where the specific staff member
  could not be resolved (e.g. under emergency bootstrap access) — this is honest, not a defect.
- **Cupones editor** (`/admin/workspace/cupones/content`) does not reach the live `/cupones` page —
  it self-discloses this in its own copy. Manage live coupon content via the Ofertas Locales queue
  instead.
- **Orphaned public pages**: `/negocios-locales` and `/productos-promocion` have no admin editor at
  all. Whether they should ever get one is an open decision, not yet made.
- **Print/premium/partner placement policy** (REV-005) is a real, open business-rule question this
  program did not decide — see §12.

## 10. If Chuy is unavailable

Per-domain continuity is documented in full in `ADMIN_OS_LIVE_QA_WIRING_BOOK.md` §17.7 (refreshed
by Gate 16 to reflect this program's fixes). In short: every domain is at least PARTIAL — a
covering staffer can see real data and take the safe, everyday actions in every domain — but
several structural gaps remain real:
- Command Center cards have no persisted "who owns this" field.
- Package Entitlements/Promo Codes don't surface change history on the record itself.
- A non-owner staff session was never actually tested against this program's fixes (STAFF-001) —
  everything above was verified from an owner-level session; a restricted staff member's exact view
  still needs a live login to confirm.

## 11. If LEO is unavailable or wrong

Nothing in this manual, and nothing in Admin, depends on LEO. Every fact and control LEO can
reference is independently reachable through the pages listed above. LEO's own pending, unmerged
branch (`integration/leo-executive-operating-intelligence-2026-08`) was read-only reconciled this
program (Gate 19) — it is not deployed, not merged, and this program did not modify it. Its
`AdminCommandCenterDashboard.tsx` copy still has the pre-fix review-count double-counting bug and
the pre-fix card ordering; whoever eventually merges that branch must specifically re-verify those
two things survive the merge, not assume either side is automatically correct.

## 12. Open owner decisions (not implemented — need you, not more engineering)

- **REV-005** — print/premium/partner placement policy reconciliation. This is a business-rule
  question (what should be promised to advertisers/partners), not a code defect, and this program
  is not authorized to invent pricing or placement policy.
- **Orphaned public pages** — should `/negocios-locales` and `/productos-promocion` get admin
  editors at all, or are they intentionally static?

## 13. Owner browser QA checklist

Everything below was fixed at the source-code level and passed targeted lint/verifier checks, but
was not clicked through in a live browser this pass (see resource-control note in
`ADMIN_OS_PROGRESS.md`). Before fully trusting these in daily use, click through once:

- [ ] Command Center: confirm the "Needs review" breakdown's segments sum to the headline number.
- [ ] Command Center: confirm operational metrics now appear above the LEO/Promo Code cards.
- [ ] `/admin/ops`: confirm Company Search still works and one broken source doesn't take down the page (SYS-004 reproduction check).
- [ ] `/admin/tienda/catalog`: confirm a live item with no slug shows "No public URL (missing slug)" instead of a dead link.
- [ ] Classifieds queue: run "Run AI review" once with and once without `OPENAI_API_KEY` set, and confirm the messaging matches what's described in §6.
- [ ] `/admin/reportes`: confirm listing title/report-count/AI-decision context renders, and clicking a Reporter link shows the new banner/breadcrumb/highlight on the user page.
- [ ] Leads Inbox (Leonix, Newsletter, Media Kit): trigger a copy/archive action on a row far down a long list and confirm the confirmation toast is visible without scrolling.
- [ ] `/admin/businesses/[id]`: confirm the Commercial Benefits section renders real entitlement/promo/payment rows with grant source and dates (or an honest "None on verified connected listings" empty state — that's correct, not broken), and that the two "Manage entitlements/promo codes for this business →" links land on the right workspace with the business's name pre-filled in the search box.
- [ ] `/admin/usuarios/[id]`: confirm Linked Businesses, Support Cases, and Next Action render.
- [ ] `/admin/system-health`: confirm the two AI-provider rows appear (NOT_CONFIGURED is expected if the keys aren't set in this environment), and — only if a real Stripe test-mode key is ever configured here — confirm the Stripe row reflects a genuine live check rather than a stale "no recent webhooks" fallback.
- [ ] `/admin/workspace/language-audit`: confirm the new "Dictionary key coverage (live check)" section renders real numbers (not zeros unless the dictionaries are actually empty), and that the static checklist below it is now clearly labeled as such.
- [ ] Topbar search: confirm the new "Company Search →" hint appears under the search box on a few different pages.
- [ ] `/admin/workspace` (Website Control hub): confirm `/negocios-locales` and `/productos-promocion` now appear in the truth matrix as `MISSING`/orphaned.
- [ ] NAV-001, NAV-002, UX-001, UX-002 (mobile nav/viewport/table ergonomics) — no verbatim finding text survived to act against; do a general narrow-viewport pass across the pages you use most and flag anything that feels cramped or broken.
- [ ] STAFF-001 — log in as (or simulate) a non-owner staff role and confirm the continuity claims in §10 hold from that seat.
- [ ] Sidebar (People group): confirm a new "Virtual Front Desk" item appears and opens `/admin/digital-contact/doorbell`.
- [ ] `/admin/digital-contact/doorbell`: confirm the new purpose card renders, and the "View live visitor page", "Set my temporary presence status", and "Manage contact info (Executive Hub)" links all work.
- [ ] `/admin/team/roster`: confirm the new "Staff Contact Page" card renders between "Create staff login" and the invites table, and its "Open Executive Hub" link works.
- [ ] `/admin/system-health`: confirm the new "Virtual Front Desk (visitor doorbell)" row appears and shows a truthful state (NOT_CONFIGURED is expected if Daily/web-push env vars aren't set in this environment).

---

*This manual reflects the state of `integration/admin-os-live-qa-repair-2026-09` at the close of
Gate 20, base head `4abbaa9330e012e887637126fd94d68ef211cb8a`. No production deploy, no merge to
main, and no LEO worktree modification occurred in producing it.*
