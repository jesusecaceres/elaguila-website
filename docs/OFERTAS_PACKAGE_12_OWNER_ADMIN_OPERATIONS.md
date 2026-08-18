# Package 12 Owner + Admin Operations

## Scope

- Worktree: `C:\projects\elaguila-website-ofertas`.
- Branch: `integration/ofertas-locales-2026-07`.
- Starting HEAD: `f51443d366ffbb2fefc247d98ca2f4142393e41f`.
- Scope: Ofertas-specific owner/admin operations only.
- Global dashboard, Admin shell, analytics architecture, Revenue OS, Stripe, language, middleware, Vercel, Production, and `main` remain out of scope.

## Operational State Machine

Package 12 adds the read-only Ofertas status model in `app/lib/ofertas-locales/ofertasLocalesOperationalStatus.ts`.
It derives owner and Admin display states, blocking reasons, action eligibility, and public-link eligibility from authoritative parent fields: status, Leonix Ad ID, product key, source version, scan status, commercial payment/entitlement/courtesy, public term, and renewal state.

The model does not write state. Server actions and APIs remain the authority for mutation.

## Owner Status Matrix

Owner states include Draft, Source required, Scan waiting, Scan in progress, Scan needs attention, Review required, Ready for Preview, Payment required, Payment processing, Ready to submit, Submitted for review, Changes requested, Resubmitted, Approved activation pending, Published, Expiring soon, Expired, Renewal available, Renewal awaiting approval, Renewal scheduled, Archived, and Recovery required.

Owner actions are derived, not guessed: continue/edit, source replacement eligibility, scan retry eligibility, payment, submit, correction, public link, renewal, and recovery guidance only appear as truthful status/action text.

## Admin Status Matrix

Admin states include Incomplete draft, Commercially ineligible, Source missing, Scan unresolved, Review unresolved, Ready for review, Submitted, Resubmitted, Changes requested, Approval blocked, Approval ready, Activation incomplete, Active, Expiring, Expired, Renewal review, Renewal scheduled, Operational recovery, and Archived.

The Admin queue now supports real filters for operational group, lane, commercial readiness, scan/review readiness, term state, renewal, business/search text, Leonix Ad ID, owner ID, and canonical parent UUID.

## Approval Blockers

Approval readiness requires canonical parent, Leonix Ad ID, matching product key and price, source readiness, no replacement pending, scan not active or failed, reviewed content where applicable, commercial entitlement or partner courtesy, and a submitted/pending-review state.

The approve button is disabled when the derived model says approval is blocked, and the server mutation still validates readiness independently.

## Rejection, Correction, Resubmission

Admin rejection already requires a note through `mutateOfertaLocalAdminReview`; Package 12 keeps that customer-safe reason available to the owner through existing admin-review note parsing.

Owner correction uses `PATCH /api/ofertas-locales/owner/[id]`, updates only allowed fields, preserves the same parent UUID and Leonix ID, validates entitlement without forcing a second payment, and does not start the public term.

## Source, Scan, Review, Recovery

The owner/Admin model distinguishes missing source, replacement pending, scan waiting, scan active, scan failed, review required, and recovery required from parent fields and scan status fields exposed through the Ofertas select.

No worker was called. No cleanup or recovery success is claimed unless persisted fields prove the state.

## Commercial And Partner States

The model uses the canonical Ofertas commercial product contract:

- `ofertas_locales_flyer_30d`: $399 USD, 30 public days, AI included.
- `ofertas_locales_coupons_30d`: $199 USD, 30 public days, AI included.

Payment, entitlement, product mismatch, courtesy, partner assignment, and standard advertiser states are displayed without exposing sensitive Stripe metadata as an owner action.

## Publication, Term, Renewal

Public links are allowed only when the public term is active. Expired listings are not labeled active. Payment, rejection, and resubmission do not start the public term. Renewal presentation keeps the same listing and Leonix ID and preserves no-day-loss truth.

## Analytics Visibility

Owner analytics continue to use canonical listing analytics. Unavailable analytics are labeled unavailable; zero values remain zero. No duplicate analytics storage, Preview impression, fake conversion rate, or fake lead metric was added.

## ES/EN, Mobile, Accessibility

Modified owner surfaces preserve ES/EN copy for operational status, next action, blockers, source/scan action eligibility, submission, public link, renewal, and empty states. Admin workspace remains Spanish-first as the existing Ofertas admin surface.

Tables remain horizontally safe, identity values use wrapping/monospace display, buttons are semantic, moderation actions require a named confirmation checkbox, and status is text plus tone, not color-only.

## Shared Dependencies

No new shared/global dependency was implemented. The existing Package 11 Globalization handoff remains authoritative for shared dashboard, analytics, and Revenue OS blockers.

## Validation Boundaries

- Migrations unapplied.
- Database not accessed.
- External services not called.
- Vercel CLI not used.
- No Preview.
- No Production.
- No deployment.
- Staging authenticated QA remains required after authorization.
