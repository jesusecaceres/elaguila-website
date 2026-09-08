# Package 14 Defect Triage

Use this file to classify real non-Production QA defects. Do not create fake passes and do not route owner decisions to engineering unless Chuy must decide.

## Severity

- P0 — launch blocker: blocks launch or risks data/security/payment/public truth.
- P1 — major journey blocker: blocks a required advertiser/Admin/shopper path.
- P2 — functional, responsive, translation, or accessibility defect: material issue with workaround.
- P3 — minor launch polish: low-risk polish after required journeys pass.
- Dependency blocker: owned by shared dashboard, analytics, Revenue OS, Globalization, Autos, Community, or infrastructure.
- Test-data issue: seeded data or account issue, not product behavior.
- Environment issue: non-Production configuration, auth, worker, webhook, storage, or service availability.

## Required Defect Fields

| Field | Required |
|---|---|
| Defect ID | Yes |
| Discovery phase | Yes |
| Route | Yes |
| Test account | Yes |
| Parent UUID | Yes when case-specific |
| Leonix Ad ID | Yes when case-specific |
| Source version | Yes for upload/scan/source defects |
| Item or coupon ID | Yes for item/coupon defects |
| Screenshot or evidence | Yes when UI-visible |
| Expected result | Yes |
| Actual result | Yes |
| Console/network evidence | Yes when browser/API-visible |
| Owner | Yes |
| Workstream | Yes |
| Severity | Yes |
| Reproducibility | Yes |
| Workaround | Yes or `None` |
| Repair commit | Required before closure |
| Retest evidence | Required before closure |
| Closed by | Required before closure |

## Routing

| Defect Type | Route |
|---|---|
| Ofertas-owned defect | Repair on `integration/ofertas-locales-2026-07` or approved Ofertas branch |
| Shared platform defect | Globalization handoff |
| Infrastructure/environment | Infrastructure owner |
| Other-category defect | Its own workstream |
| Genuine business decision | Chuy |

## Closure Rules

- P0/P1 defects require repair commit and retest evidence before launch.
- Dependency blockers remain BLOCKED until owning workstream resolves or accepts.
- Environment issues are not product PASS.
- Owner PASS cannot be recorded before owner testing.
- No Production, Preview, migration, database, Gemini, storage, Stripe, webhook, worker, or notification action is authorized by this triage file.
