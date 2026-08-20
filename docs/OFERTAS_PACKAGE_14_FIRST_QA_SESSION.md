# Package 14 First QA Session

This plan starts only after the authorization manifest is complete for exact SHA `0cfbda4a6a5888457acd93b9d3c78c710dc0f732` in a confirmed non-Production environment.

## Session A — Foundation

Ordered actions: confirm exact branch and SHA; confirm non-Production environment; authorize migrations; apply migrations in order; verify schema after each; create or authorize test accounts; prepare flyer and coupon test records.

Prerequisites: authorization manifest complete, migration owner present, rollback owner named, evidence owner named.

Stop conditions: Production target, missing authorization, migration failure, schema mismatch, unauthorized account, secret exposure.

Evidence: environment proof, migration output, schema verification, test account IDs, parent UUID and Leonix ID for seeded cases.

Pass criteria: environment is non-Production, schema is verified, test users exist, flyer and coupon draft cases exist.

Rollback boundary: schema rollback or environment reset only under named rollback owner.

## Session B — Flyer End To End

Ordered actions: checkpoint; application; source upload; real Gemini scan; page progress; partial-failure handling; product correction; crop/bbox; Preview; Stripe test checkout; webhook; entitlement; submission; Admin rejection; owner correction; resubmission; Admin approval; activation; public product search; drawer; exact flyer proof; Business Hub; shopping list; analytics.

Prerequisites: Session A pass, Gemini/storage/Stripe/webhook authorization, flyer source file approved for QA.

Stop conditions: parent UUID changes unexpectedly, Leonix ID changes unexpectedly, payment/entitlement mismatch, public activation before approval, fake cart/quantity behavior, Preview impression analytics.

Evidence: screenshots, logs, parent UUID, Leonix ID, source version, scan job, item IDs, checkout/webhook/entitlement proof, public route proof, analytics event proof.

Pass criteria: same parent UUID and Leonix ID survive the full lifecycle; searchable products have decimal prices and exact source page/crop/bbox; flyer shopping list has no shopper cart.

Rollback boundary: test case cleanup and entitlement/test payment cleanup only.

## Session C — Coupon End To End

Ordered actions: same relevant lifecycle as flyer; terms and validity; coupon card and drawer; no shopping list; no cart; no quantity; no fake redemption.

Prerequisites: Session A pass, coupon source approved for QA, Stripe/webhook authorization.

Stop conditions: shopping list appears for coupon, cart appears, quantity purchasing appears, fake redemption/wallet appears, coupon public before approval.

Evidence: screenshots, parent UUID, Leonix ID, source version, coupon item ID, checkout/webhook/entitlement proof, public coupon proof.

Pass criteria: coupon lifecycle passes at $199 with AI included; no shopping list, no cart, no fake redemption, no wallet.

Rollback boundary: test case cleanup and test payment cleanup only.

## Session D — Partner, Expiration, Renewal, Failure

Ordered actions: partner verification; courtesy; default/relevance placement; standard advertiser visibility; source replacement; partial scan failure; expired parent; renewal; recovery; cleanup; notification outbox.

Prerequisites: Sessions A-C complete enough to trust base lifecycle, partner authorization, controlled failure data.

Stop conditions: partner placement implies false endorsement, expired parent remains public, recovery action is dead, renewal creates unintended identity reset.

Evidence: screenshots/logs for partner label, source replacement, partial failure, expiration, renewal, recovery, owner/Admin state.

Pass criteria: partner placement is truthful; source replacement creates new source version; partial failure is actionable; expiration disables public eligibility; renewal/recovery preserve identity lineage.

Rollback boundary: test case cleanup only unless infrastructure owner approves more.
