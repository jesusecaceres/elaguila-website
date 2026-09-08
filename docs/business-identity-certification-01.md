# Business Identity — Certification Record (Gate BCO-4A)

Status snapshot at the point this package was committed. This is a **code and staging-schema
certification**, not a production release notice — see [Deployment status](#deployment-status)
below.

## What this covers

The complete 9-step global Business Identity onboarding system: language-first setup, global
country + service-coverage system (7 coverage levels, region shortcuts, US/MX/CA state data),
contact foundation v3 (capabilities, preferred response method, digital profiles, custom links),
authorization, owned-listing discovery, review, the completed-Identity page, the trust/privacy
commitment, the mobile account drawer, and hard mobile-width containment.

## Automated evidence (actual counts, run at commit time)

| Suite | Checks |
|---|---|
| `verify:business-identity-core` | 45 passed |
| `verify:business-identity-global-expansion` | 20 passed |
| `verify:business-concierge-entrepreneur-experience` | 8 passed |
| `verify:business-identity-onboarding-ui` | 41 passed |
| `verify:business-identity-contact-foundation` | 29 passed |
| `verify:business-identity-service-coverage` | 28 passed |
| `verify:business-identity-mobile-shell-location-phone` | 17 passed |
| `verify:business-identity-mobile-shell-drawer` | 19 passed |
| `verify:business-identity-mobile-width-containment` | 17 passed |
| **Total** | **224 passed, 0 failed** |

Also green at commit time:

- `npm run typecheck` — 0 errors in any Business Identity file (7 pre-existing errors remain in
  unrelated `e2e/autos/*` and `e2e/community/*` spec files never touched by this package).
- Changed-file lint (`npx eslint` on every file in the diff) — 0 errors (2 real `no-regex-spaces`
  errors found in this package's own verify scripts and fixed before commit).
- `npm run build` — succeeds; `/dashboard/business-tools`, `/dashboard/business-tools/onboarding`,
  and `/dashboard/business-tools/business/[businessId]` all compile, alongside every other
  dashboard route sharing `LeonixDashboardShell`.
- Secret scan across the full diff (Stripe live/test key patterns, Supabase service-role key
  patterns, AWS keys, private-key blocks, inline passwords, the production project ref) — clean.
- Diff audit — every changed/new file belongs to this package; no Lifecycle-workspace file
  touched; no temporary diagnostic route remains (the Gate B.7 auth-free reproduction route was
  deleted before commit).

## Staging evidence

- Migration `supabase/migrations/20260718120000_business_identity_contact_foundation_v3.sql`
  exists in the package and was written additively (new columns/tables/RPC version, no
  destructive changes to existing ones), consistent with the three prior Business Identity
  migrations already in the repo.
- The migration file does not touch `business_identity_flags` in any way — the feature flag's
  enabled/disabled state and pilot list are entirely unaffected by this package.
- `app/lib/business/featureFlag.ts` (the flag-resolution module) was not modified by this
  package — default-safe resolution behavior is unchanged.
- **Live staging read-verification** (actually querying the staging database to confirm the
  migration applied cleanly, the flag row is disabled, and the pilot list is empty) was not
  performed in this session — this sandbox has no outbound network path to the staging Supabase
  instance (confirmed repeatedly across this engagement: every `supabase.auth.getUser()` /
  Supabase REST call from this environment hangs indefinitely rather than succeeding or failing
  fast). This is a **deferred check**, not a claimed pass — see below.

## Deferred owner checks

1. **Live staging DB read-verification** — confirm via the Supabase dashboard or CLI (from a
   machine with real network access) that:
   - migration `20260718120000_business_identity_contact_foundation_v3.sql` applied cleanly on
     `cgeehvnfyrdoperdotdh` (Leonix Media Staging);
   - the `business_identity_foundation` row in `business_identity_flags` still has
     `enabled = false` and `pilot_user_ids = []`.
2. **Final 360×800 / 390×844 / 430×932 visual QA** — deferred because the owner is working
   remotely and this sandbox's Browser pane is not compositing frames this session (confirmed:
   `getBoundingClientRect()` returns `[0,0,0,0]` for every element despite `getComputedStyle`
   resolving correctly, and `computer.screenshot` fails with "the Browser pane is not displayed").
   All structural width-containment tests are green (`verify:business-identity-mobile-width-containment`,
   17/17) and the root CSS cause (missing `min-w-0` on a grid item, letting nowrap text force the
   page wider than the viewport) is fixed and documented in
   [`LeonixDashboardShell.tsx`](../app/(site)/dashboard/components/LeonixDashboardShell.tsx)
   inline. Previous owner screenshot rounds already certified Step 8's listing card, Step 9's
   review-card wrapping, the account drawer's structural behavior, and general page rhythm — only
   the final width-containment pass on Step 2 remains unconfirmed visually.

Neither deferred item blocks this checkpoint: there is no known security, ownership, data-loss,
payment, or production defect, and the feature flag keeps the entire system inert for every real
user regardless of these two checks' outcome.

### Retest URL pattern

`http://localhost:<port>/dashboard/business-tools/onboarding?lang=es` (or `?lang=en`), signed in
with the existing staging QA account. Port is assigned by the dev server at each restart — the
session handoff always states the exact current port.

## What must be rechecked before global enablement

Before flipping `business_identity_foundation.enabled = true` beyond the pilot list:

1. Complete the two deferred checks above with real browser/DB access.
2. Confirm the pilot list additions (once the owner is ready to test with real accounts) don't
   collide with any existing production business record via the duplicate-detection system.
3. Re-run this full suite list one more time against whatever the HEAD commit is at that time.
4. Confirm no unrelated package merged in between now and enablement has changed
   `featureFlag.ts`, the flags table shape, or `resolveBusinessIdentityFlagTier`'s default.

## Feature flag status

`business_identity_foundation` remains **disabled by default** for every account outside an
explicit pilot list, unchanged by this package. This certification does not enable, expand, or
otherwise touch that gate.
