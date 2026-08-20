# Package 13 Real-QA Runbook

## Phase 0 — Authorization

- Approved branch: `integration/ofertas-locales-2026-07`.
- Approved SHA: exact Package 13 review SHA after Coach approval.
- Environment: explicit non-Production only.
- Required approvals: migrations, services, test accounts, rollback owner, defect triage owner.
- Stop on: wrong branch/SHA, Production domain, missing migration authorization, missing service authorization, secret display request, or unexpected database state.

## Phase 1 — Migration Application

Apply the Ofertas migration chain in Package order: 4A, 4B, 5, 6, 7, 8. Verify each object before and after every migration. Stop on missing dependency, duplicate object, destructive SQL, or mismatched runtime contract.

## Phase 2 — Environment Readiness

Validate names only for Supabase, Gemini, storage, Stripe, worker auth, origin, analytics, and notification placeholders. Do not report values.

## Phase 3 — Flyer Test

Create/resume flyer, upload real source, run Gemini scan, observe page progress and failed-page handling, review products, verify crop/bbox, Preview, checkout, webhook, entitlement, submit, Admin reject, correct/resubmit, approve, public search, exact source, Business Hub, flyer shopping list, analytics, expiration, and renewal inspection.

## Phase 4 — Coupon Test

Repeat the path for coupons with terms/validity and verify no shopping list, no cart, no quantity, no fake redemption, and no wallet.

## Phase 5 — Partner Test

Verify partner assignment, courtesy authorization, placement truth, standard advertiser visibility, and explicit sort authority.

## Phase 6 — Owner/Admin Test

Verify owner statuses, blockers, actions, correction reason, Admin queue filters, Admin detail, approval blockers, recovery, and renewal.

## Phase 7 — Failure Tests

Exercise scan failure, webhook mismatch, source replacement, stale operation, activation failure, expired listing, and recovery-required states.

## Phase 8 — Evidence

Capture route, account, parent UUID, Leonix ID, source version, scan job, child item/coupon, payment, entitlement, publication, term, screenshot path, result, and defect ID.

## Phase 9 — Release Decision

Classify PASS, CONDITIONAL, or BLOCKED. No Production action until owner approval. Rollback owner must sign off for any CONDITIONAL or BLOCKED release path.
