# Iglesias BUILD 03 — Prayer Network audit

Private prayer requests, after BUILD 02 safety moderation, may be routed to at most three participating church prayer teams. This is not messaging, ranking, monetization, or pastoral advice.

## Schema

Migration (Certification only in this build):

`supabase/migrations/20260819203513_iglesias_prayer_network.sql`

Does not rewrite BUILD 01 churches or BUILD 02 prayer-wall migrations.

| Object | Purpose |
|---|---|
| `church_submissions.prayer_team_intent` | Applicant intent `YES` / `NO` / `INTERESTED`. Does not enroll. |
| `prayer_requests.target_church_id` | Optional PRIVATE target. Not granted to anon. |
| `church_prayer_teams` | One config row per church (`UNIQUE church_id`) |
| `church_prayer_team_members` | Coordinator/member roster. Never public. |
| `prayer_team_deliveries` | Durable EMAIL / DASHBOARD records. Unique `(prayer_request_id, prayer_team_id, delivery_channel)`. |

Team status is `ACTIVE` / `PAUSED` / `DISABLED`. Distinct from church `approval_status`, `is_active`, and `verification_status`.

## RLS

RLS is enabled on all three new tables.

- `church_prayer_teams`: anon/authenticated may SELECT only `church_id, enabled, status, accepts_private_requests` when the team is enabled + ACTIVE + accepts private **and** the parent church is public (approved + active + published). Contact columns are not granted.
- `church_prayer_team_members`: revoke all from anon/authenticated. No public policies.
- `prayer_team_deliveries`: revoke all from anon/authenticated. No public policies.

Public participation is a boolean computed in `getPublicChurchBySlug` via the granted team columns + `isPublicPrayerNetworkParticipant`. Roster, emails, phones, and delivery errors never leave the admin/service-role path.

## Team enrollment

- Registration asks whether the church has a prayer team. Intent only.
- `churches.prayer_network_enrolled` stays `false` on apply.
- Admin must save Prayer Network config (enabled + ACTIVE + accept private) before the church is a participant.
- Application still requires admin church review.

## Routing

Canonical helper: `app/lib/iglesias/prayerNetworkRouting.ts`

Eligible only when **all** are true:

- request `visibility = PRIVATE_PRAYER_TEAM`
- `moderation_status = CLEARLY_SAFE` (human approve into this state also routes)
- church approved and active
- team enabled, `ACTIVE`, `accepts_private_requests`
- language compatible if the team restricted languages
- category compatible if the team restricted categories
- geographic compatibility only when real stored geography/scope exists

`MAX_PRAYER_TEAM_RECIPIENTS = 3`. Zero, one, or two is honest. No fake recipients.

Fair rotation: language, category, geography scores, then fewer prior deliveries, then older last delivery, then stable `teamId`. No ML ranker. Paid/placement arguments are ignored (`void paidPlacementIgnored`).

## Moderation dependency / crisis firewall

Never route `PENDING`, `HUMAN_REVIEW`, `CRISIS_REVIEW`, `DISALLOWED`, or `REMOVED`.

`CRISIS_REVIEW` stays in the admin safety queue. Ordinary church teams do not receive potential emergency/self-harm/imminent-violence cases.

Orchestration runs after insert when already `CLEARLY_SAFE`, and after admin Approve / Redact-and-approve for private requests.

## Delivery lifecycle

`orchestratePrivatePrayerRouting`:

1. Load private request
2. Verify moderation via the canonical helper
3. Compute eligible teams
4. Apply target-church rule if present
5. Cap at 3
6. Upsert durable delivery rows (unique channel contract)
7. Process enabled channels
8. Record real result

Dashboard channel is the **admin queue**, not a church-owner login. Church user dashboards are **deferred** (no invented church auth).

Email reuses `sendLeonixResendEmail`. If email is enabled but there is no recipient, status is `FAILED` with `last_error = no_recipient`. Success is never faked.

Max attempts: 3 (`canRetryPrayerDelivery`).

## Contact consent

Email payload may include body, category, language.

Only if `contact_consent = true`: display/first name, city, selected contact method.

If consent is false: zero email / phone / WhatsApp. Never user UUID, session/IP hash, AI result, moderation reasoning, admin notes, or other-team recipients.

Subject (no prayer text):

- ES: `Nueva petición privada de oración — Leonix`
- EN: `New private prayer request — Leonix`

## Targeted church

`target_church_id` only for `PRIVATE_PRAYER_TEAM`. If the church is eligible, route **only** to that team. If ineligible, route **zero** and tell the requester the truth. No silent substitution.

Eligible church profiles show a badge and CTA that lock visibility to private and set the target. Moderation is not bypassed.

## Requester confirmation

Real delivered team count:

- ES: `Tu petición fue compartida con N equipos de oración participantes.`
- Zero: `Tu petición privada fue recibida. Aún no hay un equipo disponible para recibirla.`
- Ineligible target: dedicated copy, not a substitute church.

## Admin

- Church detail: Prayer Network enable/status/languages/categories/coordinator/roster/email+dashboard toggles. Syncs `prayer_network_enrolled` from real team state. Does not set verification.
- Prayer queue: eligible/selected teams, channel, status, attempts, delivered time, retry email if attempts &lt; 3.

## Public

Landing Prayer Network card is live (no coming-soon). CTA `Unir mi iglesia` / `Join my church` → `/iglesias/registrar?lang=#oracion-equipo`.

Badge only on real eligible profiles:

- ES: `Participa en la Red de Oración Leonix`
- EN: `Participates in the Leonix Prayer Network`

No “Verified/Certified/Recommended Prayer Team”. Zero ranking effect.

## Mobile / a11y

390: targeted form full width; church CTA min-height 48px; registrar intent radios stack. 768: existing two-column grids. 1440: approved Iglesias composition unchanged (hero/search/need tiles untouched).

Labeled radios/checkboxes, focus-visible on CTAs, delivery outcome `role="status"`, badge is text not color-only, buttons vs links preserved.

## Tests

`scripts/iglesias-prayer-network-build-03-selftest.ts` covers public=0, max 3, 1, 0, moderation blocks, paused/disabled/inactive/unapproved, language/category mismatch, idempotent selection, contact-consent privacy, targeted eligible/ineligible, paid values ignored, retry max 3, migration RLS contract, monetization import firewall.

Live Certification proof uses isolated fixtures on `mvasgrdzmupsnuicwyjl` only.

## Deferred

- Church prayer-team user dashboard / church-owner authentication
- In-app messaging, replies, inbox, threads
- Iglesias analytics events (`private_prayer_routed` / delivery success/fail) — no existing Iglesias analytics pipeline to extend
- Automatic pastoral advice, donations, ranking

## Locked surfaces

Hero, collage, church search, Find by Need, public wall design (except this network card/CTA), Navbar, Footer, Recursos, Viajes, Noticias, Clasificados, Stripe, promo codes, placement entitlements, listing analytics/likes/moderation, global auth, AI Gateway, Vercel config.
