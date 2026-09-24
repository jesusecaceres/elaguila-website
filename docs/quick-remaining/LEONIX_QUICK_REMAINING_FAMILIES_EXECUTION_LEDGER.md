# LEONIX QUICK — Remaining Family Coverage: Execution Ledger

Branch: `claude/quick-remaining-families-build-2026-09`, created from the certified Core SHA
`b66322ba01482dcf433220de0a1855d6824f54c4` (`docs(quick-business): integration gate — final proof
matrix, verifier drift ledger, pre-QA certification`). The certified Core branch
`claude/quick-business-core-build-2026-09` was never checked out or modified.

## What was built

| # | Item | Type | Path |
|---|---|---|---|
| 1 | Comida Local Quick intake client | New | `app/(site)/publicar/comida-local/rapido/ComidaLocalQuickIntakeClient.tsx` |
| 2 | Comida Local Quick draft store | New | `app/(site)/publicar/comida-local/rapido/comidaLocalRapidoDraftStore.ts` |
| 3 | Comida Local Quick route page | New | `app/(site)/publicar/comida-local/rapido/page.tsx` |
| 4 | Remaining-families registry | New | `app/lib/quickRemaining/quickRemainingRegistry.ts` |
| 5 | Staff launchpad "Más Opciones" section | Additive edit | `app/admin/(dashboard)/businesses/QuickApplicationsLaunchpad.tsx` |
| 6 | Gate 16 self-tested verifier | New | `scripts/verify-quick-remaining-families-01.ts` |
| 7 | Protected-path allowlist exception (×2) | Additive edit | `scripts/verify-quick-business-core-01.ts`, `scripts/verify-quick-classifieds-onramp-01.ts` |
| 8 | Architecture matrix, decisions, proof, ledger, coverage matrix, PM handoff docs | New | `docs/quick-remaining/*.md` |

No file inside the certified Quick Classifieds (`app/lib/quickClassifieds/**`,
`app/(site)/publicar/rapido/**`) or Quick Business Core (`app/lib/quickBusiness/**`,
`app/(site)/publicar/negocio-rapido/**`) trees was modified in content — item 7 only widened a
verifier's protected-PATH allowlist regex (the check tooling, not the certified trees themselves) to
recognize this mission's own new, additive sibling directory, mirroring the exact precedent already in
place for `negocio-rapido/` and the Empleos media exception.

## Cursor closeout (this session)

| # | Item | Type | Path |
|---|---|---|---|
| 9 | Comida Local gallery upload fail-closed | Repair | `ComidaLocalQuickIntakeClient.tsx` |
| 10 | Ofertas coupon client constants aligned to server $199 | Bug fix | `ofertasLocalesConstants.ts`, `ofertasLocalesTwoLaneProductModel.ts`, `ofertasLocalesCommercial.ts` |
| 11 | Ofertas checkout consent uses live package amount | Bug fix | `app/(site)/dashboard/ofertas-locales/[id]/checkout/page.tsx` |
| 12 | Ofertas pricing consistency verifier | New | `scripts/verify-ofertas-pricing-consistency-01.ts` |
| 13 | Pricing reconciliation artifact | New | `docs/quick-remaining/LEONIX_OFERTAS_LOCALES_PRICING_RECONCILIATION.md` |
| 14 | One-file dashboard allowlist for the consent repair | Additive edit | `verify-quick-business-core-01.ts`, `verify-quick-classifieds-onramp-01.ts` |

## What was explicitly NOT built (and why)

| Family | Not built | Why |
|---|---|---|
| Ofertas Locales | Quick wrapper (either lane) | Flyer requires mandatory AI review that a Quick form cannot shorten. Coupon pricing is now aligned; DIRECT_CANONICAL_LINK remains correct |
| Negocios Locales | Generic business-listing table / Quick form | Pure discovery directory; each sector already links to its own covered application |
| Viajes | Quick wrapper | Pricing is explicitly owner-unresolved; submissions go to a moderation queue, not instant paid publish |
| Iglesias | Quick wrapper | No draft/preview/payment abstraction to attach to; a direct API POST would violate the certified "Quick never calls `/api/` directly" invariant |
| Recursos | Any form | Not a submission product — pure editorial content |

## Verification run

### Claude remaining-families commit (`fe248f22`)

| Check | Result |
|---|---|
| Scoped tsc — Comida Local `/rapido` tree + `quickRemaining` registry + launchpad | 0 errors |
| Scoped eslint — same file set, `--max-warnings 0` | 0 warnings |
| `scripts/verify-quick-remaining-families-01.ts` | OK |
| `scripts/verify-comida-local-gate1-lifecycle.ts` | 49 passed, 0 failed |
| `scripts/verify-comida-local-gate2-discovery.ts` | 45 passed, 0 failed |
| `scripts/verify-comida-local-gate-d-targeted.ts` | all checks passed |
| `scripts/verify-quick-business-proof-matrix-02.ts` | OK (138 rows: 132 PROVEN, 2 PROVEN_NA, 4 BLOCKED — pre-existing blockers, unrelated) |
| `scripts/verify-quick-classifieds-interaction-02.ts` | OK |
| `scripts/verify-quick-classifieds-proof-matrix-03.ts` | OK (136 rows: 129 PROVEN, 4 PROVEN_NA, 3 BLOCKED — pre-existing blockers, unrelated) |
| `scripts/verify-quick-classifieds-onramp-01.ts` | OK after comida-local allowlist |

### Cursor closeout

| Check | Result |
|---|---|
| `scripts/verify-quick-business-core-01.ts` | **OK** — the previously blocked re-run after the allowlist edit. Blocker closed. |
| `scripts/verify-quick-classifieds-onramp-01.ts` | OK |
| `scripts/verify-quick-classifieds-interaction-02.ts` | OK |
| `scripts/verify-quick-classifieds-proof-matrix-03.ts` | OK |
| `scripts/verify-quick-business-proof-matrix-02.ts` | OK |
| `scripts/verify-quick-remaining-families-01.ts` | OK (re-run after Ofertas repair) |
| `scripts/verify-ofertas-pricing-consistency-01.ts` | OK (self-tested against synthetic $0 coupon / $399 consent) |

## Known pre-existing defect — CLOSED

Ofertas Locales coupon pricing disagreed across three locations: `revenuePricingMatrix.ts` ($199),
`ofertasLocalesConstants.ts` ($0), and hardcoded checkout consent copy ("$399"). Cursor closeout
aligned the client constant and consent copy to the existing server package `$199 / 30 days`. Flyer
remains `$399 / 30 days`. Status: **CLOSED**. Artifact:
`docs/quick-remaining/LEONIX_OFERTAS_LOCALES_PRICING_RECONCILIATION.md`.
