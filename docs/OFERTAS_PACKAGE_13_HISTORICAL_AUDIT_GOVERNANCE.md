# Package 13 Historical Audit Governance

This governance prevents indiscriminate historical audit chasing while keeping current product, security, identity, commercial, lifecycle, and public eligibility contracts gated.

## Classes

| Class | Name | Rule |
|---|---|---|
| A | RELEASE-GATING | Must pass. Protects current canonical product, identity, security, lifecycle, commercial, source, public, owner, and Admin behavior. |
| B | PACKAGE COMPATIBILITY | Must pass when the protected contract remains current, but may be modernized for current route, copy, or symbol names. |
| C | ARCHIVED NON-GATING | Must not block Package 13, Preview, merge, or release when the script validates superseded implementation details. Scripts remain in history until a separate cleanup package retires them. |

An audit cannot be archived merely because it fails. Class C requires an explicit stale detail and current replacement. Security, identity, payment, entitlement, term, source-version, privacy, and public-eligibility audits cannot be silently archived.

## Current Classification

| Audit | Class | Protected Contract | Stale Detail | Current Replacement | Gating |
|---|---|---|---|---|---|
| `scripts/ofertas-package-13-*.mjs` | A | Deterministic pre-QA certification | None | Package 13 scenario/docs/contracts | Yes |
| `scripts/ofertas-package-12-*.mjs` | A | Owner/Admin operations | None | Package 12 operational status model | Yes |
| `scripts/ofertas-package-11-local-certification-audit.mjs` | B | Local certification and shared dependency boundary | Dirty manifest stopped at Package 12 | Package 13 exact manifest allowlist | Yes |
| `scripts/ofertas-locales-gate-1-foundation-audit.ts` | A | Foundation product and analytics catalog | Retired `OFERTAS_LOCALES_ANALYTICS_VERSION_1_EVENTS` | `OFERTAS_LOCALES_CANONICAL_ANALYTICS_EVENTS` plus public analytics consent/identity helper | Yes |
| `scripts/ofertas-locales-ai-power-1-audit.ts` | B | Gemini extraction rules | Prompt used `A large` not `big` | Accept large/big visual price wording | Yes |
| `scripts/ofertas-locales-ai-quality-1-audit.ts` | B | AI normalization telemetry | Scan log renamed from normalization to extraction summary | Accept current extraction summary | Yes |
| `scripts/ofertas-locales-final-1-pipeline-audit.ts` | B | Public pipeline truth | Hub link moved into featured module | `ClasificadosFeaturedOfertasModule` | Yes |
| `scripts/ofertas-locales-final-1b-en-venta-pipeline-audit.ts` | B | En Venta parity/pipeline | Dirty manifest stopped at earlier package | Package 13 compatibility paths | Yes |
| `scripts/ofertas-locales-final-1c-full-pipeline-smoke-audit.ts` | B | Full pipeline smoke | Dirty manifest stopped at earlier package | Package 13 compatibility paths | Yes |
| `scripts/ofertas-locales-final-1d-public-tab-activation-audit.ts` | B | Public tab activation | Hub/card copy moved to modules/copy guards | Featured modules and copy guards | Yes |
| `scripts/ofertas-locales-final-4-public-detail-audit.ts` | B | Public detail route and privacy | Drawer/Business Hub/AI copy changed | Detail route helper, inline Business Hub, source proof | Yes |
| `scripts/ofertas-locales-mobile-public-search-ux-audit.ts` | B | Mobile public search UX | Inline filter panel/list copy changed | Filters drawer and floating shopping list cart | Yes |
| `scripts/ofertas-locales-ol3-step1-cta-cleanup-audit.ts` | B | Step 1 CTA cleanup | Dirty manifest stopped at earlier package | Package 13 compatibility paths | Yes |
| `scripts/ofertas-locales-ol7-ai-scan-action-candidate-review-audit.ts` | A | OL7 scan/review action safety | Dirty manifest stopped at Package 12 | Package 13 exact manifest allowlist | Yes |
| `scripts/ofertas-locales-ol7e-production-scan-prep-runtime-diagnostic-audit.ts` | A | OL7E scan-prep runtime diagnostic safety | Dirty manifest stopped at Package 12 | Package 13 exact manifest allowlist | Yes |
| Superseded broad exploratory audits not listed here | C | Historical implementation exploration | Old component names, old copy, old dirty manifests, obsolete architecture | Current Class A/B stack above | No |

Stack 12, OL7, and OL7E remain gating. No security, identity, payment, entitlement, term, source-version, privacy, or public-eligibility audit is archived by this document.
