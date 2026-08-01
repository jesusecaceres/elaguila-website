# Ofertas Package 9 Integration Readiness

Package 9 builds repository-side activation foundations only. Migrations remain unapplied; database not accessed; external services not called; browser QA deferred; deployment not performed. No Package 9 migration required.

## Historical Checklist Reconciliation

The separate historical `Master Checklist.txt` was not present in this workspace. Current reconciliation uses `docs/OFERTAS_PACKAGE_3_MASTER_CHECKLIST.md`, Package 4A-8 repository evidence, and the requested historical row IDs. Rows not present in the current repository checklist are marked as historical source unavailable, then classified by current repository evidence.

| ID | Historical status | Current status | Current evidence | Package that resolved it | Remaining environment work | Package 9 action |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | historical source unavailable | OBSOLETE | no active Package 4A-8 blocker references this preflight row | none | none | documented boundary |
| A2 | historical source unavailable | OBSOLETE | no active Package 4A-8 blocker references this preflight row | none | none | documented boundary |
| A3 | historical source unavailable | OBSOLETE | no active Package 4A-8 blocker references this preflight row | none | none | documented boundary |
| A4 | historical source unavailable | OBSOLETE | no active Package 4A-8 blocker references this preflight row | none | none | documented boundary |
| B1 | historical source unavailable | OBSOLETE | no active Package 4A-8 blocker references this planning row | none | none | documented boundary |
| B2 | historical source unavailable | OBSOLETE | no active Package 4A-8 blocker references this planning row | none | none | documented boundary |
| B3 | historical source unavailable | OBSOLETE | no active Package 4A-8 blocker references this planning row | none | none | documented boundary |
| C1 | DONE | RESOLVED IN REPOSITORY | owner/admin/public surfaces mapped in Ofertas code | Package 3 | none | verified |
| C2 | DONE | RESOLVED IN REPOSITORY | pending/rejected/expired filters in public helpers | Package 3/4B | staging QA | verified |
| C3 | DONE | RESOLVED BUT ENVIRONMENT UNVERIFIED | persisted `leonix_ad_id` migration and runtime helpers | Package 5 | migration application | migration manifest |
| D1 | DONE | RESOLVED IN REPOSITORY | parent/child status enforced in public/admin activation | Package 3/7 | staging QA | runtime map |
| D2 | BLOCKED | RESOLVED BUT ENVIRONMENT UNVERIFIED | Gemini-compatible provider migration exists | Package 4A | migration application | migration inventory |
| D3 | DONE | RESOLVED IN REPOSITORY | child privacy preserved until approved/active | Package 3/7 | staging QA | verified |
| D4 | historical source unavailable | RESOLVED IN REPOSITORY | parent identity and item source boundaries are canonical | Package 5/7 | staging QA | documented |
| D5 | DONE | RESOLVED IN REPOSITORY | crop/bbox/page/source versioning exists | Package 6/7 | staging QA | storage diagnostics |
| E1 | DONE | RESOLVED IN REPOSITORY | owner status/rejection UI exists | Package 3/8 | focused browser QA | documented |
| E2 | DONE | RESOLVED IN REPOSITORY | correction/replacement preserves same parent | Package 6/7/8 | staging QA | runtime map |
| F1 | DONE | RESOLVED IN REPOSITORY | admin approve/reject/archive routes exist | Package 3/7 | staging QA | worker auth review |
| F2 | DONE | RESOLVED IN REPOSITORY | rejection reason and child privacy remain required | Package 3/7 | staging QA | verified |
| F3 | PARTIAL | CROSS-WORKSTREAM DEPENDENCY | shared admin review provenance remains outside Ofertas-local scope | none | global admin/schema decision | documented no edit |
| G1 | DONE | RESOLVED IN REPOSITORY | public parent approved/non-expired filters | Package 4B | migration/staging | runtime map |
| G2 | DONE | RESOLVED IN REPOSITORY | public items require approved active same parent | Package 7 | staging QA | verified |
| G3 | DONE | RESOLVED BUT ENVIRONMENT UNVERIFIED | server-generated `LNX-XXXXXXXX` persistence and uniqueness | Package 5 | migration application | migration manifest |
| H1 | DONE | RESOLVED BUT ENVIRONMENT UNVERIFIED | canonical `expires_at` term plus item/coupon validity gates | Package 4B/7 | migration/staging | runtime map |
| H2 | DONE | RESOLVED BUT ENVIRONMENT UNVERIFIED | 30-day public term starts on activation | Package 4B | migration/staging | migration inventory |
| H3 | PARTIAL | RESOLVED BUT ENVIRONMENT UNVERIFIED | renewal CTA/action center and same-parent renewal exist | Package 8 | Stripe/migration/staging | updated status |
| H4 | DONE | RESOLVED IN REPOSITORY | owner/admin term state and no fake renewal action | Package 4B/8 | staging QA | verified |
| I1 | BLOCKED | RESOLVED BUT ENVIRONMENT UNVERIFIED | Gemini provider migration and runtime allowlist exist | Package 4A/7 | migration application | Gemini readiness |
| I2 | DONE | RESOLVED IN REPOSITORY | provider/schema compatibility documented | Package 4A/7 | staging QA | migration graph |
| I3 | BLOCKED | STILL OPEN | real Gemini QA requires migrated staging DB and key | none | Gemini staging scan | harness/runbook |
| J1 | PARTIAL | RESOLVED BUT ENVIRONMENT UNVERIFIED | flyer product locked at $399 in Revenue OS path | Package 5 | Stripe staging config | Stripe readiness |
| J2 | PARTIAL | RESOLVED BUT ENVIRONMENT UNVERIFIED | coupon product locked at $199 in Revenue OS path | Package 5 | Stripe staging config | Stripe readiness |
| J3 | DONE | RESOLVED IN REPOSITORY | payment entitlement separate from public term activation | Package 5/8 | webhook staging | verified |
| K1 | PARTIAL | RESOLVED BUT ENVIRONMENT UNVERIFIED | checkout metadata includes parent/Leonix/renewal context | Package 5/8 | live Stripe config | environment contract |
| K2 | DONE | RESOLVED IN REPOSITORY | fulfillment avoids duplicate parent and preserves identity | Package 5/8 | webhook staging | verified |
| L1 | DONE | RESOLVED IN REPOSITORY | partner organization/assignment source of truth | Package 6 | migration/staging | migration inventory |
| L2 | DONE | RESOLVED IN REPOSITORY | deterministic partner badge/ranking | Package 6 | staging QA | subsystem readiness |
| L3 | DONE | RESOLVED IN REPOSITORY | courtesy term eligibility source | Package 6 | staging QA | subsystem readiness |
| M1 | DONE | RESOLVED IN REPOSITORY | canonical analytics event support wired | Package 6 | staging analytics check | subsystem readiness |
| M2 | DONE | RESOLVED IN REPOSITORY | `/api/analytics/events` canonical route used | Package 6 | staging analytics check | documented |
| N1 | BLOCKED | RESOLVED BUT ENVIRONMENT UNVERIFIED | Package 9 readiness endpoint/contract now exists | Package 9 | real env configuration | built |
| N2 | BLOCKED | STILL OPEN | flyer QA requires migrations, Stripe/Gemini/storage staging | none | controlled staging | staging runbook |
| N3 | BLOCKED | STILL OPEN | coupon QA requires migrations and Stripe staging | none | controlled staging | staging runbook |
| N4 | PARTIAL | STILL OPEN | browser QA intentionally not run | none | focused browser QA | harness/runbook |
| O1 | DONE | RESOLVED BUT ENVIRONMENT UNVERIFIED | source-version scan jobs and progress hooks exist | Package 7 | migration/staging | runtime map |
| O2 | DONE | RESOLVED BUT ENVIRONMENT UNVERIFIED | decimal price normalization/cents storage exists | Package 7 | migration/staging | runtime map |
| O3 | DONE | RESOLVED BUT ENVIRONMENT UNVERIFIED | normalized bbox contract and rejection paths exist | Package 7 | migration/staging | storage/Gemini readiness |
| O4 | DONE | RESOLVED BUT ENVIRONMENT UNVERIFIED | submission/admin gates for source/scan/review exist | Package 7 | migration/staging | runtime map |
| O5 | DONE | RESOLVED BUT ENVIRONMENT UNVERIFIED | cleanup queue contract exists | Package 7/8 | storage adapter validation | storage readiness |
| O6 | BLOCKED | STILL OPEN | real Gemini/cleanup/browser validation remains environment work | none | staging execution | harness/runbook |
| P1 | DONE | RESOLVED BUT ENVIRONMENT UNVERIFIED | same-parent renewal attempts and stable Leonix ID | Package 8 | migration/staging | runtime map |
| P2 | DONE | RESOLVED BUT ENVIRONMENT UNVERIFIED | renewal checkout/webhook authorization metadata | Package 8 | Stripe webhook staging | Stripe readiness |
| P3 | DONE | RESOLVED BUT ENVIRONMENT UNVERIFIED | immutable term history and activation RPC | Package 8 | migration/staging | migration graph |
| P4 | DONE | RESOLVED IN REPOSITORY | owner renewal action center and routes | Package 8 | browser QA | staging fixtures |
| P5 | DONE | RESOLVED BUT ENVIRONMENT UNVERIFIED | admin renewal, cleanup lease, notification outbox contracts | Package 8 | worker config/storage/notification adapter | worker hardening |
| P6 | BLOCKED | PARTIALLY RESOLVED | Package 9 adds readiness/worker/harness/runbooks; real env work remains | Package 9 | migrations/external validation/browser QA | built foundation |

## Migration Inventory And Graph

| Order | Package | Migration | Objects | Dependencies | Risk | Static validation | Applied |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 4A | `20260616130000_ofertas_locales_ai_production_bootstrap.sql` | provider/scan bootstrap | base Ofertas tables | medium | manifest and auditor | UNKNOWN/UNAPPLIED BY THIS SESSION |
| 2 | 4B | `20260731222500_ofertas_locales_30_day_public_term.sql` | `published_at`, `expires_at` | 4A | low | manifest and auditor | UNKNOWN/UNAPPLIED BY THIS SESSION |
| 3 | 5 | `20260731235500_ofertas_locales_commercial_activation_identity.sql` | Leonix ID/payment/entitlement | 4B | medium | manifest and auditor | UNKNOWN/UNAPPLIED BY THIS SESSION |
| 4 | 6 | `20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql` | partners/source assets/cleanup | 5 | medium | manifest and auditor | UNKNOWN/UNAPPLIED BY THIS SESSION |
| 5 | 7 | `20260801013000_ofertas_locales_ai_scan_review_publication.sql` | scan pages, price cents, bbox/crop, replacement RPC | 6 | medium | manifest and auditor | UNKNOWN/UNAPPLIED BY THIS SESSION |
| 6 | 8 | `20260801023000_ofertas_locales_renewal_operations_lifecycle.sql` | renewals, term history, notifications, activation RPC | 7 | medium | manifest and auditor | UNKNOWN/UNAPPLIED BY THIS SESSION |

Machine-readable graph: `app/lib/ofertas-locales/ofertasLocalesMigrationManifest.ts`. Historical migrations were not edited. Package 9 migration required: FALSE.

## Runtime/Schema Compatibility

| Schema object | Migration | Writer | Reader | Missing failure | Fail-closed | Diagnostic |
| --- | --- | --- | --- | --- | --- | --- |
| provider constraint | 4A | scan handler | scan orchestrator | provider write fails | scan unavailable | Package 7/9 audits |
| `published_at`/`expires_at` | 4B | admin review | public search | term cannot be enforced | no public result/error | runtime map |
| Leonix/payment fields | 5 | commercial server | checkout/webhook/submission | payment identity missing | checkout/submission fail | readiness |
| partner assignments | 6 | partner ops | ranking/courtesy | badge/courtesy unavailable | no courtesy/badge | audits |
| source versions | 6 | asset lifecycle | review/public/replacement | source mismatch risk | activation blocks | audits |
| scan pages/prices/bbox/crops | 7 | scan/review | preview/public | page/item projection missing | submission blocks | audits |
| cleanup queue lease fields | 8 | cleanup worker | cleanup diagnostics | lease unavailable | no deletion/completion | worker audits |
| renewal attempts | 8 | owner/webhook | owner/admin | renewal unavailable | route fails | readiness |
| term history/RPC | 8 | activation RPC | admin/public term | activation unavailable | no activation | readiness |
| notification outbox | 8 | event helper | future worker | no delivery persistence | no sent claim | notification audit |

## Environment Contract

The full registry lives in `app/lib/ofertas-locales/ofertasLocalesEnvironmentContract.ts`. It stores variable names only, not values.

| Variable name | Subsystem | Staging required | Production required | Secret | Client safe | Validation | Missing behavior |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | database | TRUE | TRUE | FALSE | TRUE | URL shape | clients fail closed |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | database | TRUE | TRUE | FALSE | TRUE | presence | owner auth/read unavailable |
| `SUPABASE_SERVICE_ROLE_KEY` | database | TRUE | TRUE | TRUE | FALSE | presence | server mutations unavailable |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | TRUE | TRUE | FALSE | TRUE | `pk_` prefix | payment client unavailable |
| `STRIPE_SECRET_KEY` | Stripe | TRUE | TRUE | TRUE | FALSE | `sk_` prefix | checkout unavailable |
| `STRIPE_WEBHOOK_SECRET` | Stripe | TRUE | TRUE | TRUE | FALSE | presence | webhook fails closed |
| `GEMINI_API_KEY` | Gemini | TRUE | TRUE | TRUE | FALSE | presence | scan unavailable |
| `BLOB_READ_WRITE_TOKEN` | storage | TRUE | TRUE | TRUE | FALSE | presence | upload/delete unavailable |
| `OFERTAS_INTERNAL_WORKER_SECRET` | workers | TRUE | TRUE | TRUE | FALSE | presence | worker auth unavailable |
| `OFERTAS_ACTIVATION_BATCH_SIZE` | workers | FALSE | FALSE | FALSE | FALSE | positive integer | conservative default |
| `OFERTAS_CLEANUP_BATCH_SIZE` | workers | FALSE | FALSE | FALSE | FALSE | positive integer | conservative default |
| `OFERTAS_NOTIFICATION_DELIVERY_ENABLED` | notifications | FALSE | FALSE | FALSE | FALSE | enum/presence | outbox remains pending |
| `NEXT_PUBLIC_SITE_URL` | public site | TRUE | TRUE | FALSE | TRUE | URL shape | origins require manual verification |
| `VERCEL_ENV` | public site | TRUE | TRUE | FALSE | FALSE | enum/presence | environment unknown |

## Readiness Endpoint

`GET /api/ofertas-locales/admin/readiness` is server-only and authorized by Ofertas admin auth or `Authorization: Bearer <OFERTAS_INTERNAL_WORKER_SECRET>`. It returns subsystem categories, migration expected count, schema object count, release state, and explicit `not_run` external validation fields. It forbids secret values, raw database credentials, API keys, SQL, storage paths, private user data, DB connections, and external calls.

## Worker Security And Dry Run

| Worker | Auth | Batch limit | Lease | Idempotency | Dry run | External call |
| --- | --- | --- | --- | --- | --- | --- |
| scheduled activation | admin or internal bearer worker secret | 20 | not applicable | activation RPC and term uniqueness | TRUE, no mutation | FALSE |
| cleanup execution | admin or internal bearer worker secret | 25 | Package 8 lease fields | lease ID/status/path validation | TRUE, no mutation | FALSE |
| future notification delivery | internal worker contract | 25 planned | processing timestamps | idempotency key | planned | FALSE in Package 9 |
| stuck scan recovery | admin/server review only | conservative planned | state age | no automatic mutation | planned | FALSE |

## Subsystem Readiness

| Subsystem | Repository | Configuration | Database | External validation | Status |
| --- | --- | --- | --- | --- | --- |
| Stripe | CONFIGURATION READY contract | present/missing by env validator | migration unknown | EXTERNAL VALIDATION NOT RUN | truthful static readiness |
| Gemini | REPOSITORY READY | present/missing by env validator | DATABASE COMPATIBILITY UNKNOWN UNTIL MIGRATION | EXTERNAL SCAN NOT RUN | truthful static readiness |
| Storage | REPOSITORY READY | present/missing by env validator | cleanup queue unknown | EXTERNAL UPLOAD/DELETE NOT RUN | truthful static readiness |
| Scheduled activation | REPOSITORY READY | worker secret/scheduler pending | activation RPC unknown | not run | repository ready |
| Cleanup | REPOSITORY READY | worker/storage pending | lease fields unknown | storage not run | repository ready |
| Notifications | OUTBOX READY | adapter configured/missing | outbox unknown | EXTERNAL DELIVERY NOT RUN | pending adapter |
| Analytics | REPOSITORY READY | existing analytics config | unknown | not run | repository ready |
| Partner | REPOSITORY READY | no secret required | unknown | not run | repository ready |
| Public term | REPOSITORY READY | no secret required | unknown | not run | repository ready |
| Renewal | REPOSITORY READY | Stripe/worker pending | unknown | not run | repository ready |

## Release Gate

Current state is repository_ready unless all staging/production environment variables are present, in which case Package 9 can only report ready_for_migration_application. Ready for migration application TRUE after configuration is present; ready for staging validation FALSE; staging certified FALSE; production ready FALSE.

## Staging Fixtures And Harness

Fixture specifications live in `app/lib/ofertas-locales/ofertasLocalesStagingFixtures.ts` and cover standard flyer, standard coupon, verified partner flyer, verified partner coupon, active nearing renewal, expired listing, replacement pending, failed scan page, cleanup queue failure, scheduled renewal due, notification pending, and coupon validity ending before parent term.

Harness scripts: `scripts/ofertas-staging-preflight.mjs`, `scripts/ofertas-staging-schema-verification.mjs`, `scripts/ofertas-staging-flyer-smoke.mjs`, `scripts/ofertas-staging-coupon-smoke.mjs`, `scripts/ofertas-staging-renewal-smoke.mjs`, and `scripts/ofertas-staging-worker-smoke.mjs`. Default behavior is `BLOCKED — STAGING EXECUTION NOT AUTHORIZED`; production hostnames are rejected; no network, DB, Stripe, Gemini, storage, or browser actions run by default.

## Remaining Cross-Workstream Dependencies

Global admin review provenance remains a shared schema/admin decision. Notification delivery adapter selection remains outside Package 9. Real staging requires controlled migration application, environment configuration, external validation, and focused browser QA.

## Historical Audit Modernization

Package 9-R modernizes eight historical product audits so they validate stable current repository behavior instead of requiring the original gate's dirty file set.

| Audit | Original stale assumption | Current stable assertion | Product contract retained | Result |
| --- | --- | --- | --- | --- |
| `verify-ofertas-review-cta-cleanup` | CTA files had to be dirty | current review panel/copy prove approve-next, review-later, reject confirmation, blocked submission, and no fake success | truthful review actions and ES/EN copy | PASS |
| `verify-ofertas-step5-global-address-review-workspace` | only Step 5 gate files could be dirty | current Ofertas copy/helpers/panel preserve open geography and source/page review context | no global location rewrite required | PASS |
| `verify-ofertas-product-blueprint-v1` | old preview future-card files and dirty gate | current preview/public files prove flyer/coupon lanes, result card, drawer, Business Hub, real crops, no fake commerce | flyer shopping list is live; coupon list absent; coupon wallet and smart route future | PASS |
| `verify-ofertas-preview-offer-hub-polish` | old logo size/layout symbols | current premium header, viewer, crop proof, drawer wiring, and preview/public parity symbols | preview not published, real data only | PASS |
| `verify-ofertas-preview-header-acceptance` | header gate files had to be dirty | current canonical header/copy/application files prove identity, lane, logo, valid badge, no fake commerce | mobile-readable preview header | PASS |
| `verify-ofertas-global-location-pipeline` | location gate files had to be dirty | current Ofertas location helpers, filters, search params, and public helpers are checked directly | no fake map/distance/private address exposure | PASS |
| `verify-ofertas-mobile-pwa-interaction` | old future modules desktop grid | current mobile nav, sticky actions, rail filters, drawer/modal behavior, and neutralized future tools | mobile/PWA usability, flyer shopping list live, coupon list absent | PASS |
| `verify-ofertas-clip-review-viewer` | old dirty manifest and literal CTA text | current viewer/review-panel symbols prove source/page/bbox authority and page-scoped overlays | no mixed source/page/item crop identity | PASS |

Intentional product evolution: flyer shopping list is now live and real for approved public flyer items. Coupon shopping list remains prohibited. Coupon wallet and smart multi-store route remain future-only. No audit requirement was weakened to pass; stale dirty-tree and historical file-set dependencies were replaced with current product assertions.
