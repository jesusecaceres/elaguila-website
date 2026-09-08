# Package C Build 1 (C2+C3) — Revenue OS Convergence, Webhook Idempotency, Subscription Lifecycle, Seven-Day Grace, Contract-Aligned Commercial Fulfillment — CLOSURE

**Worktree:** `C:/projects/elaguila-website` · **Branch:** `integration/lifecycle-foundation-2026-07`
**Starting HEAD:** `9fbd301b0f52d43f9c3c7c15677c24751073949c` (Package B closure) · **origin/main:** `3fae3e8d` (unchanged)
**Authorities:** Execution Bible v2 (read in full), Advertising Agreement v1.2 EN+ES (read in full, 31 identical clauses), C1 audit (read in full), owner-approved Build 1 plan with the six mandatory corrections.

## 1. Executive summary

The canonical Revenue OS is now financially safe for subscriptions: a durable Stripe event ledger gives effectively-once fulfillment under sequential AND concurrent replay; a server-enforced purchase-attempt identity prevents duplicate payable sessions for one unresolved purchase (double-click, browser retry, two tabs — the open session is REUSED); five launch-required subscription events plus refund/dispute foundations have real handlers; entitlements end at the REAL Stripe period end + a 7-day grace backstop instead of the fragile +30 days; the locked 7-calendar-day grace is implemented with webhook-driven + write-time + read-time + sweep enforcement (never dashboard-dependent); recurring-billing consent (Agreement §17) is affirmative, versioned, hashed, recorded BEFORE session creation, and hard-required server-side for every subscription checkout; the live legacy Autos payment path is converged to canonical Revenue OS via the bypassOnly handshake (QA/internal bypasses preserved); the BR success-page mutation trigger is removed; Autos 10/20 and Bienes 1/4 capacity + grace state are enforced server-side on every convergence-touched mutation path; manual cleared payments and print-included digital entitlements have auditable foundations with explicit grant provenance; success pages are read-only; dashboards/admin gain minimal truthful subscription-state readers. Locked price corrections landed: offers add-ons $99→$79; BR pack capacity +4→+3 (max 4).

## 2. Starting baseline

Packages A/B complete, pushed, protected. C1 complete (audit + delta map). Preflight verified: correct worktree/branch/HEAD, no active Git operation, origin/main unchanged, no secrets read.

## 3. Files inspected

The C1 audit corpus (~120 files) + targeted reads during implementation: canonical checkout/webhook routes, revenue* module family, legacy Autos/BR Stripe routes + clients, the five recurring checkout preview clients + four dashboard add-on helpers, checkpoint component/resolver, autos/BR mutation routes, admin gate/entitlement-generator/payment-tracker, migrations 20260521/22/26 + 20260630 + 20260804.

## 4. Files changed (64 tracked; full authorized list = Package C Build 1 section of `scripts/globalizationCurrentPackageDiff.ts`)

Core canonical: `app/api/revenue-os/{checkout,webhook}/route.ts`, new `app/api/revenue-os/admin/subscription-sweep/route.ts`, `revenueStripe.ts`, `revenueWebhook.ts`, `revenueEntitlementFulfillment.ts`, `revenuePaymentRecords.ts`, `revenuePricingMatrix.ts`, `publishCheckoutCheckpoint.ts`, `revenueRestaurantFulfillment.ts`, `revenueCategoryCheckoutPayload.ts`. New shared modules (server + pure-policy twins): `stripeEventLedger(+Policy)`, `subscriptionLifecycle(+Policy)`, `revenueSubscriptionEvents`, `recurringConsent(+Copy,+Interactive)`, `commercialWriteGuard(+Policy)`, `manualClearedPayments`, `refundDisputeFoundations(+Policy)`, `checkoutAttemptIdentity`, `commercialStateBadges`. Legacy convergence: autos checkout/webhook + BR webhook guards, `AutosPublishConfirmCore.tsx`, `BrPagoExitoClient.tsx`, `inventory-pack/checkout/route.ts`, boost client, `autosPublishApiContract.ts`. Capacity paths: autos listings POST + restore, BR listing-edit, `leonixBrPropertyInventoryPolicy.ts`. Consent surfaces: checkpoint component + 5 preview clients + 4 dashboard helpers. Readers/admin: entitlement-badges route, `paymentTrackerData.ts`, package-entitlements actions, new manual-payments admin route. 6 migrations. 4 new focused gates + verifier + this document + allowlist + 6 historical-gate stale-assertion fixes (i9a, i11a, i11b, i12a via the shared allowlist; 3 mjs verifiers via an inline allowlist reader).

## 5. Migrations added (6 files, additive, RLS-enabled service-role-only, NOT applied to Production)

M1 `20260805090000_leonix_stripe_webhook_events` — event ledger (event id UNIQUE, 6-state machine, attempt counts). M2 `…090100_leonix_subscription_records` — canonical subscription lifecycle (stripe_subscription_id UNIQUE; period, cancel flags, grace fields, suspension precedence memory; grace-sweep partial index; reverse entitlement pointer). M3 `…090200_leonix_billing_consents` — affirmative recurring consent evidence (versioned + sha256 text hash; append-only). M4 `…090300` — `grant_source` CHECK + **live-uniqueness partial index (listing_source, listing_id, package_key) WHERE active/scheduled**; fails loudly on duplicates (report: `scripts/package-c/report-duplicate-entitlements.mjs`; never deletes). M5 `…090400` — manual clearance columns + table CHECK, `stripe_invoice_id` partial UNIQUE (per-invoice renewal idempotency), `checkout_attempt_key` + partial UNIQUE over unresolved statuses (P0 attempt identity). M6 `…090500` — per-lane `suspended_reason` (restore CAS marker).

## 6. Canonical webhook changes

Event ledger claim wraps dispatch (INSERT-claim → conditional UPDATE-claim; completed/ignored/terminal→200; failed_retryable→500 so Stripe redelivery is the retry scheduler; 10-min stale-processing self-heal). Handlers added with REAL state transitions: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed` (plus existing completed/expired). Unhandled events are recorded `ignored` — the silent drop is gone. Every subscription-scoped delivery reconciles grace lazily. `checkout.session.completed` additionally upserts the subscription record (real period from post-Basil item-level `current_period_end` with object-level fallback), attaches Stripe ids to the consent snapshot, and aligns the entitlement to period_end+7d.

## 7. Event ledger

`leonix_stripe_webhook_events` + `stripeEventLedger(.Policy)`. Effectively-once fulfillment (never claimed as exactly-once): unique event id + claim state machine as layer 1; the existing row-state guards remain layer 2; sequential replay returns idempotent 200; concurrent replay resolves to a single processor; sweep reaps stale claims.

## 8. Fulfillment idempotency

Payment records: session-id UNIQUE (existing) + per-invoice `stripe_invoice_id` partial UNIQUE (new) + attempt-key partial UNIQUE over unresolved statuses (new; 23505 → reuse winner's open session). Entitlements: payment-record dedupe (existing) + M4 live-uniqueness index + 23505 → re-select-and-return-idempotent (closes the concurrent-webhook race). Listing activation: existing status-guarded conditional UPDATEs preserved. Subscription linkage: `stripe_subscription_id` UNIQUE upsert. Manual clearance: CAS `pending_verification→cleared` fulfills exactly once. Audit rows carry event ids.

## 9. Subscription lifecycle

`leonix_subscription_records` + pure transition table (`subscriptionLifecyclePolicy`): states pending/active/grace/suspended/canceled; cancel_at_period_end is a flag; dispute = suspended+chargeback; raw Stripe status mirrored, never authoritative. invoice.paid advances the period, extends the SAME entitlement row (revives expired; NEVER auto-revives revoked — admin surface), writes the per-invoice payment record, clears grace, restores payment-suspended visibility via CAS. subscription.updated syncs period/cancel flags; price changes are never auto-applied (admin-review audit flag). subscription.deleted honors paid-through on cancel-at-period-end; suspends visibility on final failure — content, media, drafts, analytics, child identity all preserved. Renewal cannot overlap billing: the +30d hard-expiry is gone (real period end + backstop) and the Rentas manual renewal path is unchanged/one-time.

## 10. Seven-day grace (locked)

Day 0: failure recorded, grace starts (`grace_ends_at = +7 calendar days`), visibility stays, dashboards show the payment issue, new capacity/upgrades/add-ons blocked at write time. Day 5: contractual-late marker recorded as review metadata only (no auto late fees — Agreement §15 is admin-managed). Day 7 unresolved: payment suspension via per-lane adapters using EXISTING status vocabularies (restaurantes/servicios/BR `suspended`, autos `payment_failed` — children follow the proven parent-gate), `suspended_reason='payment'` + prior status stored. Recovery: CAS restore that can never override moderation/owner/admin states (zero-row CAS ⇒ audited skip). Enforcement mechanisms (never dashboard-dependent): webhook reconciliation on every delivery, write-time guard reconciliation, entitlement ends_at backstop (read-time lapse via existing `addonLifecycle`), secured sweep endpoint (admin session OR constant-time machine key; 401 otherwise). Honest latency note: base-listing suspension between Stripe retries can exceed day 7 by the retry gap (terminal at subscription.deleted); entitlement-driven surfaces and ALL write paths are exact.

## 11. Recurring consent (Agreement v1.2 §17)

Versioned bilingual disclosure (exact amount, monthly interval, auto-renewal, cancellation + where to manage, 7-day grace policy, clause citation) rendered at every recurring checkout: checkpoint component (unchecked checkbox gating the final action, aria-described) for Restaurantes/Servicios/BR Negocio ×2/Autos Dealer previews; the Autos confirm surface (checkbox); dashboard add-on quick-buttons via an interactive native dialog (explicit OK; C8 may upgrade to inline UI — same contract/version either way). Server: `/api/revenue-os/checkout` + the boost side-door hard-refuse subscription-mode without a parsed affirmative acknowledgment (`accepted === true` exactly; stale version rejected safely); consent row written BEFORE session creation with sha256 text hash + agreement version; Stripe ids attached post-session/webhook; snapshots never mutated. One-time/free products never require consent (pinned). Existing legacy-paid customers: no retroactive consent fabricated — documented for owner; their subscriptions gain records on their next canonical checkout event.

## 12. Autos convergence

`bypassOnly` handshake: the confirm surface asks the legacy route ONLY for QA/internal bypass evaluation; when no bypass applies the route returns `no_bypass_available` WITHOUT creating any Stripe session and the client proceeds to canonical Revenue OS ($399 dealer + $129 boost add-on via matrix; $24.99 privado), with dealer consent + attempt identity + canonical ledgers + canonical webhook fulfillment. Bypass flows (internal/test/QA allowlist + bundle publish) preserved intact. The legacy env-price Stripe branch remains in code for rollback but is unreachable from the converged UI. Legacy webhook now explicitly IGNORES canonical sessions (leonix_* namespace guard) — the accidental separation is pinned, tested truth. Boost side-door route gains the `inventory_role==='main'` guard (child can never buy the boost against itself), consent, and attempt identity. Retirement sequence (Package F, after sandbox parallel proof + owner OD-6): remove legacy route reachability → 410 → unregister endpoint → delete.

## 13. Bienes convergence

`BrPagoExitoClient` `internal=1` mutation POST removed — the success page is read-only (the sole live caller of the legacy BR checkout route is gone). BR legacy webhook keeps its category guard + new leonix_* guard. Capacity constants corrected to the lock: pack adds 3 (max 4); the BR paid-activation sibling fan-out clamps to `BR_INVENTORY_PACK_MAX_CHILDREN` (now 3) server-side — unpaid children can never activate beyond 1+3. Policy-file doc/price drift fixed (+5→8 text; $99.99→$99.00). BR Privado pinned one-time (no consent, no subscription record). listing-edit route guarded (delta-0 semantics: existing children stay editable through grace/suspension; new-child creation remains refused there; capacity-increasing activation is checkout/fulfillment-gated).

## 14. Manual cleared payments (Agreement §7-§9)

`manualClearedPayments.ts` + admin route `app/api/admin/revenue-os/manual-payments` (admin-permission-gated): record (pending_verification; method cash/check/zelle/ach/money_order/other; evidence reference identifier only) → verify-cleared (CAS; sets cleared_at/verified_by; fulfills ONCE via the standard entitlement writer with `grant_source='manual_cleared_payment'`) → rejected/reversed (terminal; reversal payment-suspends via the standard adapter + flags review). pending_verification/deposited checks can never fulfill. No fake Stripe identities anywhere. Full Admin OS workflow is C8/E scope.

## 15. Print-included digital entitlements (Agreement §2)

Admin entitlement generator now stamps `grant_source='print_included'` for print tiers ('admin_manual' otherwise) and creates the matching `leonix_placement_entitlements` row with source `included_with_print` + print contract reference — the first real non-Stripe placement writer (public reader remains Package D). Integrated-package rule (digital not separately divisible/refundable) surfaced in refund metadata. Print/comp/partner grants are never payment-suspended (grant-source aware). No DocuSign/CRM/PDF changes.

## 16. Refund / cancellation / dispute foundations

`refundDisputeFoundations(+Policy)`: fulfillment-stage vocabulary (§11-§13), `DESIGN_SETUP_RETENTION_PERCENT = 25` (CONTRACT policy, explicitly documented as distinct from the retired promo campaign; verifier-guarded), refund records preserve original payment history + replay-idempotent, partial refunds auditable, disputes mark `disputed` + payment-suspend + admin review (obligations preserved per §16), dispute-won restores chargeback suspension via CAS, dispute-lost stays admin-managed, cancel-at-period-end preserves paid-through. Nothing auto-charges or auto-retains; legal ambiguity flags for owner/legal review.

## 17. Success-page proof

Canonical exito/cancelado: pinned zero write verbs. BR exito: mutation branch removed (read-only inventory summary). Autos exito verify path: real payments no longer traverse the legacy `checkout/verify` GET (canonical success page is used by converged checkout); route retained for rollback, reachable only by legacy sessions. Pins: refresh/reuse/cross-owner/`internal=1` covered by gate assertions.

## 18. Dashboard/admin reader changes (minimal, truthful)

`commercialStateBadges.ts` (pure resolver: Active / Payment issue–grace until date / Suspended for nonpayment / Disputed / Cancels at period end / Cancelled / Refunded / Payment recovered / Manual cleared / Manual pending verification / Included with print — ES/EN). Dashboard entitlement-badges API now returns `subscriptionStates` per listing (fail-closed). Admin payment tracker rows gain `subscription_status` (active/grace/suspended/canceled/cancel_at_period_end). All states independent — no conflation with account plan, listing plan, placement, verification, or grant source (existing separation pins re-asserted).

## 19. Tests

4 new focused gates (behavioral pure-policy tests + wiring pins): `gate-pkgC-canonical-contract-selftest` (prices/locked values, attempt identity + consent wiring, read-only success, 6 cross-endpoint webhook pins, state separation), `gate-pkgC-event-ledger-idempotency-selftest` (claim decisions incl. concurrent/stale, full transition table, 7-day math, ends-at real/fallback/one-time, attempt-key determinism + adversarial variants, event handler dispatch pins, CAS precedence), `gate-pkgC-consent-convergence-selftest` (disclosure content, affirmative-only parsing incl. "string true" rejection, before-session ordering, unchecked-by-default UI, 5 clients + 5 dashboard helpers, bypassOnly handshake, BR/Autos one-time truth, side-door role/consent/attempt), `gate-pkgC-capacity-grace-writeguard-selftest` (10/20 + 1/4 constants, full adversarial policy matrix incl. grace-blocks-capacity/edits-allowed/addon-state-gating, guard wiring pins on every route, BR fan-out clamp, manual transitions, contractual-25% preservation, badges, sweep security). **Aggregate: 75/75 gate self-tests pass.** Affected mjs verifiers re-run green after stale-assertion fixes (webhook-fulfillment, checkpoint-standard, restaurantes-pending, autos-privado-checkout, pricing-promo 31/31, servicios parity, restaurantes p0 parity, newsletter promo validation). Pre-existing failures NOT caused by this build (proven by stash round-trip at clean HEAD): `verify-paid-publish-entry-checkpoints` ("Rentas privado" string pin) and `verify-bienes-autos-dealer-paid-readiness` (stale onPromoApply pin) — recorded for C8/F triage.

## 20. Remaining external blockers

Stripe dashboard webhook-endpoint registration set (owner OD-6 — required before legacy endpoint retirement); Vercel Preview Deployment Protection (standing I.13D); SMS provider credentials (C4, OD-3); no cron until Package F (sweep endpoint + machine key covers operations meanwhile; env NAME `LEONIX_SUBSCRIPTION_SWEEP_KEY`).

## 21. Remaining Package C work

C4 (15% verified discount + 25% promo retirement incl. the P0 newsletter bypass), C5+C6 (comp/partner full fulfillment, plans/package catalog/Business Tools resolvers, Ofertas/Cupones SKUs), C7 (capacity deepening: admin-action re-checks, BR results browser-gate server migration, moderation `suspended_reason='moderation'` follow-up), C8 (dashboard/admin commercial truth surfaces incl. manual-payment UI + consent inline UI for dashboard buttons), C9 (Stripe sandbox certification incl. live replay/subscription/grace runs).

## 22. Lane exit matrix (Build 1 scope)

| Lane | Convergence | Consent | Attempt identity | Subscription record | Grace/suspension | Capacity guard | State |
|---|---|---|---|---|---|---|---|
| Restaurantes base | canonical (was) | ✔ checkpoint | ✔ | ✔ on checkout | ✔ adapters | n/a | IMPLEMENTED AND AUTOMATED-PROVEN |
| Restaurantes coupon add-on ($79) | canonical | ✔ interactive | ✔ | ✔ | ✔ | n/a | IMPLEMENTED AND AUTOMATED-PROVEN |
| Servicios base + offers add-on ($79) | canonical | ✔ both | ✔ | ✔ | ✔ | n/a | IMPLEMENTED AND AUTOMATED-PROVEN |
| Autos Privado | canonical (confirm-surface converged) | n/a one-time | ✔ | n/a | n/a | n/a | IMPLEMENTED AND AUTOMATED-PROVEN |
| Autos Dealer base + Boost | **converged** (bypassOnly handshake) | ✔ confirm + preview + interactive | ✔ (incl. side-door) | ✔ | ✔ (children via parent-gate) | ✔ 10/20 create/restore/addon | IMPLEMENTED AND AUTOMATED-PROVEN |
| Autos child | n/a (via parent) | n/a | n/a | via parent | ✔ parent-gate | ✔ base/boost blocked; create/restore guarded | IMPLEMENTED AND AUTOMATED-PROVEN |
| BR Negocio base + pack | canonical (was) + legacy success-POST removed | ✔ both previews + interactive | ✔ | ✔ | ✔ | ✔ 1/4 (fan-out clamp + edit guard + checkout gates) | IMPLEMENTED AND AUTOMATED-PROVEN |
| BR child | n/a (via parent) | n/a | n/a | via parent | ✔ parent-gate | ✔ activation clamped to 4 | IMPLEMENTED AND AUTOMATED-PROVEN |
| BR Privado (FSBO $49.99/45d) | canonical (was) | n/a one-time (pinned) | ✔ | n/a (pinned) | n/a | n/a | IMPLEMENTED AND AUTOMATED-PROVEN |
| Rentas ×2 (incl. renewal) | canonical (was) | n/a one-time | ✔ | n/a | n/a | n/a | IMPLEMENTED AND AUTOMATED-PROVEN |
| Empleos paid | canonical (was) | n/a one-time | ✔ | n/a | n/a | n/a | IMPLEMENTED AND AUTOMATED-PROVEN |
| Free lanes (feria/clases/comunidad/busco/mascotas/en-venta/comida) | no checkout (pinned free) | never required (pinned) | n/a | n/a | n/a | n/a | INTENTIONAL FREE/N/A |
| Viajes / Ofertas / Cupones / Concierge | boundary untouched | — | — | — | — | — | EXTERNAL WORKSTREAM / later C gates |
| Manual cleared payments | foundation + admin ops | n/a | n/a | n/a | reversal suspends | n/a | IMPLEMENTED AND AUTOMATED-PROVEN (Admin OS UI = C8) |
| Print-included digital | foundation (grant_source + placement writer) | n/a | n/a | n/a | never payment-suspended | n/a | IMPLEMENTED AND AUTOMATED-PROVEN (reader = Package D) |

## 23. TRUE/FALSE audit

See the final build report (returned with this closure) — every mandated row answered; the only FALSE rows are the two explicitly-permitted deferrals (documented above) and none is launch-blocking.

## 24. READY TO COMMIT: YES
## 25. READY TO PUSH: NO (owner authorization required)
