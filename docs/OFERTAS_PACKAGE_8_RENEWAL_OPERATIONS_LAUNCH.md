# Ofertas Package 8 Renewal Operations Launch

Package 8 completes the repository-side renewal, republish, expiration recovery, cleanup execution, and launch operations contract for Ofertas/Cupones. migrations remain unapplied; external services not called; browser QA deferred; deployment not performed.

## Renewal Business Contract

- Renewal keeps the same canonical `ofertas_locales.id` and `leonix_ad_id`.
- Payment or courtesy authorization never starts, extends, approves, or publishes a public term.
- The renewal public term starts only through admin approval/activation.
- Active-term renewal uses the no-day-loss rule: `next_activation_at = greatest(server approval time, current expires_at)`.
- Expired-term renewal activates immediately on successful admin activation and runs for 30 public days.
- Renewal checkout uses the same server-controlled package keys: `ofertas_locales_flyer_30d` at $399 and `ofertas_locales_coupons_30d` at $199.
- Partner courtesy renewal is recorded as `partner_courtesy`; it is not marked Stripe-paid and does not fabricate a payment.

## Renewal Attempt States

`draft`, `awaiting_payment`, `payment_pending`, `authorized`, `preparing_content`, `scan_pending`, `review_required`, `ready_to_submit`, `pending_review`, `correction_required`, `approved_scheduled`, `active`, `expired`, `cancelled`, and `failed`.

Open renewal attempts are unique per parent/product while active. Repeated activation is blocked by one term-history record per renewal attempt.

## Payment, Webhook, And Entitlement

- Checkout metadata carries `operation: renew_listing`, `renewal_attempt_id`, `listing_id`, `leonix_ad_id`, package key, current expiration, and return context.
- The existing Revenue OS checkout path remains authoritative for Stripe session creation and locked prices.
- Webhook fulfillment still verifies through Revenue OS. Ofertas-local fulfillment detects renewal metadata and authorizes the renewal attempt instead of mutating public term fields.
- A paid renewal entitlement must have matching listing, owner, product, payment record, and package entitlement provenance.

## Term History

`ofertas_local_public_terms` stores immutable activation history for initial, paid renewal, partner courtesy renewal, or authorized admin recovery terms. Parent `published_at` and `expires_at` remain cache fields for public query performance; term history is the audit trail. Legacy rows are not invented or backfilled by Package 8.

## Scheduled Activation

`activate_due_oferta_local_renewal` validates a pending/scheduled renewal and computes the no-day-loss window using database time. If activation is due, it updates the parent cache, switches the source version, activates approved items for the exact source, and deactivates stale items. If approval happens before current expiration, the renewal remains scheduled until the due activation route/worker runs.

Future worker contract: call `POST /api/ofertas-locales/admin/renewals/activate-due` with admin/internal authorization and a conservative `limit`. This package does not configure a cron or external scheduler.

## Source Reuse And Replacement

- Reuse: the owner can choose the current approved source version; no rescan is required when the source remains approved and reviewed.
- Replacement: a new source version remains private, must scan/review successfully, and activates only with renewal approval. Current active source remains public while its current term is valid.
- Submission blocks on failed/processing scan pages and unresolved review items.

## Owner Operations

The owner action center shows renewal eligibility, open attempt state, payment/courtesy truth, source selection/submission state, cancellation for unpaid/unsubmitted attempts, scheduled activation, and expiration. It does not offer fake mark-paid, instant publish, arbitrary extension, refund, email-sent, or storage-deleted actions.

## Admin Operations

Admins can inspect renewal attempts and term history, approve, reject with reason, request correction, cancel invalid attempts, and retry scheduled activation. Admin cannot mark Stripe paid, fabricate courtesy, invent entitlement, arbitrarily add days, overwrite history, bypass source consistency, or claim notification delivery.

## Failure Recovery And Stuck Work

Handled failure states include checkout creation failure, abandoned checkout, webhook pending/mismatch, duplicate webhook, entitlement conflict, scan failure, partial page failure, review abandonment, submission rejection, scheduled activation failure, and source-switch failure. Stale-state helpers detect delayed scan jobs, webhook-pending attempts, authorized renewal not prepared, overdue scheduled activation, and cleanup processing leases without automatically mutating customer data.

Unpaid attempts become operationally stale after 7 days; operators must verify payment/webhook state before creating a replacement checkout to avoid double charge confusion.

## Cleanup Execution

Cleanup execution can claim a limited batch, assign a lease, increment attempt count, validate Ofertas-owned storage paths, set retry/backoff metadata, and release expired leases. Physical deletion performed: FALSE. External storage called: FALSE. A real storage adapter must confirm deletion before any task is marked completed.

## Notification Event Contract

Outbox events include payment authorized, renewal content required, scan complete, scan failed, review required, submission received, correction requested, renewal approved, renewal scheduled, renewal activated, expiring soon, expired, cleanup failed for admin, and scheduled activation failed for admin. Events have stable idempotency keys and remain `pending` until a real delivery adapter confirms delivery. External delivery performed: FALSE.

## Migration Order

1. Package 4A provider compatibility.
2. Package 4B 30-day term.
3. Package 5 commercial/identity migration(s).
4. Package 6 partners/analytics/assets.
5. Package 7 scan/review/publication.
6. Package 8 renewal/operations.

This sequence is documented only; Package 8 did not apply migrations.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `BLOB_READ_WRITE_TOKEN`
- Gemini/provider variables required by Package 7 by name only

No secret values belong in code, docs, migrations, audits, or notification metadata.

## Staging Sequence

1. Apply migrations in chronological package order against staging.
2. Verify RLS/policies and function availability.
3. Configure Stripe staging products/prices and webhook endpoint.
4. Configure Gemini/scan provider environment without exposing secrets.
5. Configure storage worker credentials for cleanup execution.
6. Configure scheduled activation worker/cron to call the due activation route.
7. Integrate notification delivery adapter and keep pending events pending until confirmed sent.
8. Run the full Package 8 audit stack and focused browser QA for flyer and coupon renewal.

## Production Sequence

Repeat staging sequence after backup/rollback checkpoint. Do not deploy runtime that expects Package 8 tables before migrations exist. Do not enable workers before validating credentials and dry-run counts.

## Rollback Precautions

Runtime can stop invoking renewal routes/workers without deleting history. Do not delete renewal attempts, term history, payment records, partner assignments, or cleanup queue rows during rollback. Scheduled activations should be paused before reverting runtime.

## Manual Checks

- Active listing renewal before expiration schedules at current expiration.
- Expired listing renewal activates on approval.
- Paid renewal webhook authorizes only one renewal attempt.
- Courtesy renewal does not create payment records.
- Replacement source stays private until activation.
- Public search excludes expired/stale items.
- Cleanup claim does not delete or complete without adapter confirmation.
- Notification rows remain pending without delivery adapter.

## Cross-Workstream Dependencies

The only shared dependency is the existing Revenue OS checkout metadata path, extended narrowly to carry `operation: renew_listing` and `renewalAttemptId`. No global dashboard, global admin, global analytics, global CSS, global SEO, global translation, or global Stripe redesign was performed.
