# Autos smoke test report (strict — executed vs not)

**Environment:** Windows dev workstation, repo `c:\projects\elaguila-website`, no authenticated browser automation, no Stripe CLI/webhook tunnel, no Supabase writes in this session.

## Executable checks that **did** run

| Check | Command / artifact | Result |
|-------|-------------------|--------|
| Public filter + search + sort invariants | `npm run autos:enforce-smoke` → `autos-enforcement-smoke: OK` | **PASS** |
| Production demo merge disabled | `NODE_ENV=production` + same script | **PASS** |
| TypeScript | `npx tsc --noEmit` | **PASS** |
| Autos launch-surface ESLint | glob in `AUTOS_BUILD_AND_CI_STATUS.md` | **PASS** |

## Scenarios S1–S8 (launch-critical)

| ID | Scenario | Executed? | Observed result | Proof | Final |
|----|----------|-------------|-----------------|-------|-------|
| S1 | Private publish success path | **No** | N/A | Would need signed-in user + `POST /api/clasificados/autos/listings` + Checkout | **FALSE** |
| S2 | Dealer publish success path | **No** | N/A | Same | **FALSE** |
| S3 | Failed payment / retry | **No** | N/A | Requires Stripe test decline + verify route + DB | **FALSE** |
| S4 | Post-publish landing visibility | **No** | N/A | Requires S1/S2 + HTTP fetch of `/clasificados/autos` with real inventory | **FALSE** |
| S5 | Post-publish results visibility | **No** | N/A | Same | **FALSE** |
| S6 | Post-publish detail visibility | **No** | N/A | Same | **FALSE** |
| S7 | Post-publish dashboard truth | **No** | N/A | Requires auth session + dashboard fetch | **FALSE** |
| S8 | Post-publish admin truth | **No** | N/A | Requires admin session + workspace page | **FALSE** |

### What remains (exact operator/staging steps)

1. Staging: configure `STRIPE_*`, `AUTOS_STRIPE_PRICE_ID_*`, Supabase keys, `NEXT_PUBLIC_SITE_URL`.  
2. Private: complete publish → Checkout (test mode) → pay → webhook or `checkout/verify` → assert `autos_classifieds_listings.status=active` and public API returns row.  
3. Dealer: repeat.  
4. Failure: use Stripe test decline or cancel → assert row stays non-`active` and public API 404/omits.  
5. Retry: second Checkout on `pending_payment` asserts session reuse (`reusedSession`) when Stripe session still `open` (inspect JSON from `POST /api/clasificados/autos/checkout`).  
6. Capture **HAR or server logs** as evidence for the enforcement matrix next revision.

**Live mode:** repeating the above with **live** Stripe keys is an additional **mandatory** proof before claiming live-money readiness; it was **not** executed here.
