# LEONIX QUICK — FINAL VERIFIER DRIFT LEDGER

Every verifier that did not pass on the final SHA, classified against a real
`origin/main` baseline rather than assumed. No failure is listed as "pre-existing"
unless it was observed failing identically on `origin/main`.

- Final application code SHA: `80808e2fd3dd57e71fd921b0f50e85886f4ee6f2`
- Baseline: `origin/main` `fd9094994aa2a63fdcea49f24b2435300a7b49a4`

## METHOD

The baseline was not inferred. A detached `git worktree` was created at `origin/main`,
the identical 179-script Ofertas verifier set was executed in both trees, and the two
result sets were joined to compute the differential. Scripts touching staging, live
Supabase, network smoke or screenshots were excluded so that nothing could mutate data.

A late correction matters for interpretation: several Ofertas audits enforce a
changed-file allowlist by reading `git diff --name-only`, which reports **uncommitted**
working-tree dirt. An early sweep run with unstaged edits showed six false regressions.
Re-running against a committed, clean tree removed all six. The numbers below are from
the clean-tree run.

## HEADLINE RESULT

| Metric | Branch | origin/main |
|---|---|---|
| Ofertas verifier set (179 scripts) | 127 pass / 52 fail | 124 pass / 55 fail |
| Eight Quick program verifiers | 8 pass / 0 fail | not applicable, most do not exist on main |
| Final proof checker | pass, 7 of 7 self-test defect classes rejected | not applicable |

- **FEATURE_REGRESSION: 0**
- **IMPROVEMENTS: 3**

## CLASSIFICATIONS

### FEATURE_REGRESSION — 0

No script passes on `origin/main` and fails on this branch.

### IMPROVEMENT — 3 (failed on main, pass on this branch)

| Verifier | Why it now passes |
|---|---|
| `scripts/ofertas-commercial-products-audit.mjs` | Already expected the coupon lane at the real server price; the stale client `$0` was what broke it |
| `scripts/ofertas-checkpoint-product-value-audit.mjs` | Same root cause, resolved by the pricing reconciliation |
| `scripts/verify-ofertas-pricing-consistency-01.ts` | New verifier added by this work, so it cannot exist on main |

The first two are the strongest independent evidence that the Ofertas coupon change was a
genuine bug fix against existing server authority, not a pricing decision: two audits
written before this work already disagreed with the client constant and now agree.

### STALE_VERIFIER — 4 checks repaired

These encoded the pre-repair state. None was deleted or weakened; each was re-pointed at
the repaired contract, and two were strengthened with additional assertions.

| Verifier and check | Encoded the bug as | Now asserts |
|---|---|---|
| `scripts/ofertas-locales-checkout-presentation-audit.ts` check 09 | The hardcoded `{offer.commercialAmount} / {offer.commercialDurationDays ?? 30}` render | Lane-derived `{chargeLabel} / {durationDays}` plus live lookup, and now also pins coupon 19900 and flyer 39900 |
| `scripts/ofertas-locales-owner-dashboard-checkout-audit.ts` check 20 | Required the presence of the hardcoded cross-lane string `"Entiendo y autorizo el cobro de $399"` | Consent derived via `ofertaLocalChargeConsentCopy`, plus a `doesNotMatch` guard forbidding the hardcoded string from returning |
| `scripts/ofertas-locales-gate-k-two-lane-final-verifier.ts` checks 44 and 45 | Printed "Coupon final review shows FREE" and "Coupon has no payment CTA" as passing claims | Titles corrected to the real behavior, and check 44 now pins both lane amounts |
| `scripts/ofertas-locales-gate-l-two-lane-backend-closeout-audit.ts` check 07 | `assert.equal(coupons.amountCents, 0)` | `19900` and `durationDays` 30 |

Checks 44 and 45 were the most dangerous kind of drift: their assertions still passed, so
the suite stayed green while printing two false claims into the certification record.

### PREEXISTING_MAIN_DEFECT — 51

Fifty-one scripts fail identically on `origin/main` and on this branch. They are unrelated
to Quick and were not repaired here, because fixing unrelated main defects is outside this
contract and would have widened the blast radius. Representative examples with the same
assertion text and the same actual value in both trees:

| Verifier | Identical failure in both trees |
|---|---|
| `scripts/ofertas-locales-two-lane-product-model-audit.ts` | Expects Spanish copy `revisión antes de mostrarlos públicamente` that no longer exists in either tree |
| `scripts/ofertas-checkout-contract-audit.mjs` | Expects `startRevenueCategoryCheckout` in a client that no longer calls it in either tree |
| `scripts/ofertas-locales-stack-9b-product-architecture-audit.ts` | "app uses step1 products" false in both trees |
| `scripts/ofertas-locales-stack-6-5a-product-logic-cleanup-audit.ts` | "Leonix Partner callout" false in both trees |
| `scripts/ofertas-30-day-public-term-audit.mjs` | Pinned content hash `f5aafa65…` versus actual `4ef14ea6…`, byte-identical mismatch in both trees |

### ENVIRONMENT_LIMITATION — 1

| Verifier | Limitation |
|---|---|
| `scripts/ofertas-locales-gate-l-two-lane-backend-closeout-audit.ts` | Imports `app/lib/ofertas-locales/ofertasLocalesCommercialServer.ts`, which imports `server-only`; that module throws under a plain `tsx` process. It aborts at import time in **both** trees, so its check 07 never executes. The stale `amountCents === 0` assertion inside it was still corrected, because a latent assertion that encodes a fixed bug will fire the moment the harness can run it |

Two further environment limitations affected the heavy gates rather than a named verifier:

- `npm run typecheck` aborted at Node's default 4 GB heap. Re-run with
  `--max-old-space-size=6144` it completed with **0 errors**.
- An intermediate typecheck reported 12 `TS2307 Cannot find module '*.png'` errors. Root
  cause was a missing `next-env.d.ts`, which is gitignored and generated by `next build`;
  `tsconfig.json` explicitly includes it. After the production build generated the file,
  the same command returned 0 errors. Not a code defect.

## KNOWN NON-BLOCKING DEFECT RECORDED RATHER THAN FIXED

`app/lib/listingPlans/revenueFulfillment.ts` carries a comment stating that "the free
coupon lane never reaches Stripe at all". After the reconciliation the coupon lane is a
paid `$199` product, so that sentence is now false.

It was deliberately **not** corrected. Six Ofertas audits enforce an allowlist that forbids
this Revenue OS file from being modified by Ofertas work, and a comment-only edit tripped
all six. Honoring the repository's own protection invariant was judged more important than
correcting a comment, so the branch touches zero Revenue OS files and the stale comment is
recorded here for separate cleanup on `main`.

The equivalent stale comments inside `app/lib/ofertas-locales/ofertasLocalesCommercialServer.ts`
**were** corrected, because that file is squarely inside the Ofertas pricing blast radius and
is not covered by the Revenue OS allowlist. Both edits there are comment-only, proven by a
diff in which every added and removed line begins with `//`.

## TOTALS

| Classification | Count |
|---|---|
| FEATURE_REGRESSION | 0 |
| IMPROVEMENT | 3 |
| STALE_VERIFIER repaired | 4 checks across 4 files |
| PREEXISTING_MAIN_DEFECT | 51 |
| ENVIRONMENT_LIMITATION | 1 verifier plus 2 heavy-gate limitations |
| Verifiers weakened or deleted to obtain green | 0 |
