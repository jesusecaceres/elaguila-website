# LEONIX QUICK BUSINESS — PRE-QA TECHNICAL CERTIFICATION (2026-09-20)

Purpose: the durable technical evidence package the PM uses to decide whether owner/human QA may start for the Quick Business Core program (Servicios, Restaurantes, Autos Dealer, Bienes negocio/agent) stacked on the certified Quick Classifieds branch. Nothing here was accepted from prose; every verdict points into `LEONIX_QUICK_BUSINESS_FINAL_PROOF_MATRIX.md` (checked by `scripts/verify-quick-business-proof-matrix-02.ts`), `LEONIX_QUICK_BUSINESS_VERIFIER_DRIFT_LEDGER.md`, or a command re-run in this mission.

## Git

| Item | Value |
| --- | --- |
| BRANCH | `claude/quick-business-core-build-2026-09` |
| START HEAD (mission start) | `f55ea363ac69e4901bbef47638ad7f7e9ae8ed59` |
| FINAL HEAD | the commit that adds this file (`git log -1 -- docs/quick-business/LEONIX_QUICK_BUSINESS_PRE_QA_TECHNICAL_CERTIFICATION.md`); this mission adds ONLY `docs/quick-business/*` + `scripts/verify-quick-business-proof-matrix-02.ts` — no `app/` file |
| ORIGIN MAIN | `fd9094994aa2a63fdcea49f24b2435300a7b49a4` (`git fetch origin` re-checked; main did NOT advance) |
| AHEAD / BEHIND | 13 / 0 at mission start; +1 docs/verifier commit after this mission |
| MAIN RECONCILIATION | NOT NEEDED (behind = 0; no merge manufactured) |
| MAIN MERGED | NO |
| PRODUCTION TOUCHED | NO (no production deploy, no alias change, no env change, no Supabase mutation; the only Vercel writes were the temporary Ignored Build Step and its restoration) |
| FULL DIFF AUDIT (Gate 2) | 66 files vs `origin/main`, all classified (Proof Matrix OS-03): CERTIFIED_CLASSIFIEDS_STACK · QUICK_BUSINESS_NEW · QUICK_BUSINESS_INTEGRATION (`PublicarGatewayClient.tsx` two additive links, `QuickApplicationsLaunchpad.tsx`) · DEALER_CLOSEOUT / BIENES_CLOSEOUT · DOCUMENTATION · VERIFIER · PACKAGE_SCRIPT (4 npm scripts). UNEXPECTED = 0. The two modified pre-existing files outside the Quick trees (`EmpleoQuickPreviewClient.tsx`, `StaffCommandCenter.tsx`) are byte-identical to the certified classifieds SHA `7555fb64` (CP-03). |

## Full validation

| Item | Value |
| --- | --- |
| FULL TYPESCRIPT COMMAND | `npm run typecheck` (`tsc --noEmit --incremental false`) |
| FULL TYPESCRIPT | PASS — 0 errors, 160 s, at `f55ea363` (no competing heavy process; run once) |
| FULL BUILD COMMAND | `npm run build` (`scripts/next-build.js` → `next build`), retry with placeholder PUBLIC Supabase env only (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; no secret) |
| FULL BUILD | PASS — exit 0, 366 s, `✓ Compiled successfully in 2.4min`, 389/389 static pages, 733 route lines. First attempt compiled (2.6 min, 389 pages) and stopped at `Export encountered an error on /(site)/dashboard/page` = `Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY` — an ENVIRONMENT_LIMITATION on an untouched page (same handling as the certified classifieds integration gate); the single allowed retry passed. |
| BUILD ROUTES | `/publicar/negocio-rapido`, `/publicar/negocio-rapido/[category]`, `/publicar/rapido`, `/publicar/rapido/[category]`, `/publicar/rapido/mi-anuncio`, `/admin/businesses`, `/admin/businesses/[businessId]` present |
| BUILD WARNINGS | 234, all the pre-existing global `Unsupported metadata themeColor` notice (one per route); 0 other warnings; one `TypeError: fetch failed` technical note from a prerender against the placeholder Supabase host (not an error) |
| FOCUSED REGRESSION | 68 scripts re-run on `f55ea363`: QB1, QB2, V1, V2, V3, 8 GUARDS, SERV-V ×4, REST-V ×3, DEALER-V ×11, BIENES-V ×9, REV-V ×6 all OK; 12 failing / limited scripts each reproduced identically on a throwaway worktree at `origin/main` (`LEONIX_QUICK_BUSINESS_VERIFIER_DRIFT_LEDGER.md`) |
| FEATURE-CAUSED REGRESSIONS | 0 |
| DIFF CHECK | PASS (`git diff --check` clean) |
| CONFLICT MARKERS | 0 |

## Preview identity

| Item | Value |
| --- | --- |
| VERCEL PROJECT | `leonix-media` (`prj_AOEx7UeAvVCKwuKFIa65wcot4rw9`, team `team_wSqEzL32gCp3YGEB9T41fpxo`) |
| ORIGINAL IGNORED BUILD STEP (backed up before any change) | `if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi` — confirmed by the branch push's deployment `dpl_9ibnmpfBFu3J6ihYsbzz9acRndSW` being CANCELED with `errorLink …#ignored-build-step` |
| TEMPORARY RULE (branch-scoped, applied 1789884720995 ms) | `if [ "$VERCEL_ENV" == "production" ] \|\| [ "$VERCEL_GIT_COMMIT_REF" == "claude/quick-business-core-build-2026-09" ]; then exit 1; else exit 0; fi` — printed verbatim in the Preview build log (`Running "if [ "$VERCEL_ENV" == "production" ] \|\| [ "$VERCEL_GIT_COMMIT_REF" == "claude/quick-business-core-build-2026-09" ]; …"`, build `bld_rgc3g9zmz`, `Cloning … Commit: f55ea36`) |
| PREVIEW DEPLOYMENT ID | `dpl_ErnDRiPfuEmZJQ9T7Md4oDbMvgjh` — environment Preview (`target: null`), state READY (ready 1789885040816 ms), URL `https://leonix-media-ffkm9a5cl-jesus-caceres-projects.vercel.app`, branch alias `leonix-media-git-claude-quick-bus-4bd3f6-jesus-caceres-projects.vercel.app` |
| PREVIEW CODE SHA | `f55ea363ac69e4901bbef47638ad7f7e9ae8ed59` (`githubCommitSha`), ref `claude/quick-business-core-build-2026-09` |
| APPLICATION CODE SHA | `f55ea363ac69e4901bbef47638ad7f7e9ae8ed59` (`git diff --name-only f55ea363 -- app` = 0 files in this mission; only `docs/` + `scripts/` are added) |
| PREVIEW_CODE_EQUIVALENCE | PROVEN (SHA match; Proof Matrix PV-01 / PV-02) |
| PREVIEW STALE | NO |
| ORIGINAL RULE RESTORED | YES — `update_project` at 1789886035511 ms back to the exact original string; post-restore `get_project`: `updatedAt 1789886035511`, domains unchanged (`leonixmedia.com`, `www.leonixmedia.com` 308 → apex, `elaguila-website.vercel.app`, `leonix-media-jesus-caceres-projects.vercel.app`, `leonix-media-git-main-jesus-caceres-projects.vercel.app`), SSO `all_except_custom_domains` unchanged, password off, trusted IPs off, production branch `main` (latest production `dpl_5hM64z6rjQsLDLRNu2VC6tnkc71p` @ `fd909499`, unchanged) |
| DEPLOYMENTS CREATED WHILE THE TEMPORARY RULE WAS LIVE | exactly ONE (`list_deployments since 1789884700000` = `dpl_ErnDRiPfuEmZJQ9T7Md4oDbMvgjh`, target preview); PRODUCTION DEPLOYMENT CREATED: NO |
| GLOBAL PREVIEW ENABLEMENT LEFT ON | NO |
| ENV | 63 variables (43 production / 45 preview / 11 development targets; one branch-scoped key), id fingerprint `26a85851fafdaf2b`; no value read or changed |

## Route health (non-mutating; not human QA)

Vercel-authenticated fetches of the READY Preview. The project's SSO protection (`all_except_custom_domains`) answers every unauthenticated fetch with `302 → https://vercel.com/sso-api?url=…` (the expected auth wall); no route answered 404 or 500. When the fetch tool carried the SSO session, `/publicar/negocio-rapido/autos-dealer` answered `200` with `x-matched-path: /publicar/negocio-rapido/[category]`, `<title>Autos (concesionario) — Negocio rápido — LEONIX</title>`, the existing `PublishAuthGate` boundary ("Comprobando sesión…") and the `QuickBusinessIntakeClient` chunk — the dynamic category route, the existing publish auth gate and the Quick Business page bundle are all served from the exact-SHA Preview.

| Route | Result |
| --- | --- |
| `/publicar/negocio-rapido` | 302 SSO wall (expected); route present in the build table |
| `/publicar/negocio-rapido/servicios` | 302 SSO wall (expected) |
| `/publicar/negocio-rapido/restaurantes` | 302 SSO wall (expected) |
| `/publicar/negocio-rapido/autos-dealer` | 200 through SSO, `x-matched-path: /publicar/negocio-rapido/[category]`, PublishAuthGate rendered |
| `/publicar/negocio-rapido/bienes-negocio` | 302 SSO wall (expected; same dynamic route as the 200 above) |
| `/publicar/rapido` · `/publicar/rapido/en-venta` · `/publicar/rapido/rentas` · `/publicar/rapido/empleos` · `/publicar/rapido/autos` | 302 SSO wall (expected); routes present in the build table; code byte-identical to the certified classifieds SHA whose Preview route health was recorded in `LEONIX_QUICK_CLASSIFIEDS_PRE_QA_TECHNICAL_CERTIFICATION.md` |
| `/admin/businesses` | 302 SSO wall (expected; admin auth follows behind it) |
| Limitation | The SSO wall precedes Next.js routing for unauthenticated fetches, so 302 alone cannot distinguish a 404; existence is proven by the build route table (BUILD) and by the 200 + `x-matched-path` on the dynamic category route. No customer publication, checkout, DB write or owner QA was performed. |

## Proof matrix totals (`LEONIX_QUICK_BUSINESS_FINAL_PROOF_MATRIX.md`, checked by `scripts/verify-quick-business-proof-matrix-02.ts`)

| Metric | Value |
| --- | --- |
| TOTAL REQUIREMENTS | 138 |
| PROVEN | 132 |
| PROVEN_NA | 2 (RS-12 Restaurantes has no pre-preview confirmation; AD-16 Dealer has no pre-preview confirmation) |
| BLOCKED | 4 (PY-07 lower-priced Quick tier = FUTURE_OWNER_DECISION; OW-06 / OW-07 / OW-08 staff publish-for-client for Restaurantes / Dealer / Bienes = NOT_SUPPORTED_BY_CURRENT_CATEGORY_CUSTODY, UI does not promise it) |
| REPAIR_REQUIRED | 0 |
| REQUIRED BLOCKERS | 0 (computed by the checker: every BLOCKED row is classified outside the current customer promise) |
| UNWIRED VISIBLE FIELDS | 0 (QB1 §2 self-tested detector over all four adapters: 6 + 7 + 16 + 21 declared keys all read; 0 phantom reads) |
| UNDECLARED CUSTOMER-ASSERTION VALUES | 0 (Dealer: state/country = the Full step's visible defaults, everything else typed or undefined — AD-04, AD-09…AD-14; Bienes: condition and property type ASKED, `petsAllowed` / listing status are the canonical mapping's own behaviour, license / brokerage / beds / baths / sqft / address empty unless typed — BN-06, BN-11, BN-16, BN-20) |
| PROOF CHECKER | `verify-quick-business-proof-matrix-02: OK (138 rows: PROVEN 132, PROVEN_NA 2, BLOCKED 4, required blockers 0)`; detector self-test (wrong width, bad status, prose-only proof, unclassified BLOCKED) passes; every cited repository path exists |
| UNSUPPORTED MATERIAL CLAIMS | 0 (word audit of the five Quick Business docs: every PROVEN / PASS / OK line either carries a code anchor or sits in a table whose evidence columns do; the older matrix / ledger / handoff carry a "Proof pointer" preface to the rows that back them) |
| CIRCULAR PROOF | 0 (no row cites a handoff or ledger sentence as evidence; ledger / handoff cite the matrix and the verifiers, never the reverse) |
| MISSING REQUIREMENT LINKS | 0 |
| PROOF COMPLETENESS | PASS |

## Category verdicts

| Category | Verdict | Backing rows |
| --- | --- | --- |
| SERVICIOS | PROVEN end-to-end: 12-question intake → existing `ClasificadosServiciosApplicationState` → `evaluateServiciosPublishReadiness` → `persistServiciosDraftForPreviewNavigation` → existing preview → `saveServiciosPendingBeforeCheckout` → `servicios_base_monthly` → `servicios_public_listings` → `/clasificados/servicios/[slug]` → `/dashboard/servicios` + Business Hub; all visible fields wired; real image; canonical ownership | SV-01…SV-15, MD-01, PY-01, OW-02, OW-05 |
| RESTAURANTES | PROVEN end-to-end: 13-question intake → existing `RestauranteListingDraft` → `auditRestaurantePublishReadiness` → `saveRestauranteDraftToStorageResolved` → existing preview → `saveRestaurantePendingBeforeCheckout` → `restaurantes_base_monthly` → `restaurantes_public_listings` → `/clasificados/restaurantes/[slug]` → `/dashboard/restaurantes`; menu / coupons preserved | RS-01…RS-12, MD-02, PY-02, MC-01, MC-02 |
| AUTOS DEALER | PROVEN end-to-end with a REAL first vehicle: 16-question intake (dealer identity + first vehicle) → existing `AutosNegociosDraftV1` (`createEmptyListing`, `syncDealerAddressFromStructured`, `getAutosPreviewCompletenessIssues("negocios")`, namespace hint) → existing dealer preview → `ensurePendingDealerListing` → `autos_dealer_monthly` → `autos_dealer_activate_listing` → first vehicle = canonical main row → `/clasificados/autos/vehiculo/[id]` → `/dashboard/mis-anuncios?cat=autos`; included inventory + +10 pack unchanged; no fabricated VIN / mileage / condition / price | AD-01…AD-24, MD-03, PY-03, OW-03, SI-01…SI-03 |
| BIENES NEGOCIO / AGENT | PROVEN end-to-end with a REAL first property: 19-question intake (professional identity + first property + the Full app's four confirmations) → existing `AgenteIndividualResidencialFormState` (`mergePartialAgenteIndividualResidencial`, `gateBienesRaicesNegocioPreview` on the canonical mapping, fresh `applicationInstanceId`, `persistAgenteResApplicationDraftResolved`) → existing agente preview → `publishLeonixListingFromAgenteResidencialDraft` (pending) → `br_agent_monthly` → BR lifecycle → `/clasificados/anuncio/[id]` → `/dashboard/mis-anuncios?cat=bienes-raices`; allowance + +3 pack + FSBO unchanged; no fabricated license / beds / baths / sqft / address / condition | BN-01…BN-21, MD-04, PY-04, OW-04, SI-04, SI-05 |

## Shared verdicts

| Area | Verdict | Backing rows |
| --- | --- | --- |
| FIELD WIRING | PROVEN — every visible control → renderer → Quick state → adapter read → canonical destination; detector self-tested | SQ-05…SQ-07, SQ-10, SV/RS/AD/BN field rows |
| MEDIA | PROVEN — real media role correct per category (business / restaurant / FIRST VEHICLE / FIRST PROPERTY), labels truthful, existing resolvers and storage, Media Lock ≥ 1 | MD-01…MD-05, SQ-11 |
| PAYMENT | PROVEN — canonical server pricing only (`servicios_base_monthly`, `restaurantes_base_monthly`, `autos_dealer_monthly`, `br_agent_monthly`); no Quick SKU, no client amount, add-ons untouched, first item never an add-on | PY-01…PY-06 |
| OWNERSHIP | PROVEN — no client owner authority, no staff-as-customer, no listing-id-only mutation; owner derived server-side by the existing publishers | OW-01…OW-05, OW-09 |
| STAFF PWA | PROVEN — one PWA; Quick Classifieds + Quick Business sections; Create / Send link / Full application / Manage per category; truthful custody copy; no messaging infrastructure | SP-01…SP-05 |
| CUSTOMER MANAGEMENT | PROVEN — existing destinations only (`/dashboard/servicios`, `/dashboard/restaurantes`, `/dashboard/mis-anuncios?cat=autos`, `?cat=bienes-raices`); no new dashboard | CM-01…CM-05 |
| STRUCTURED INVENTORY | PROVEN preserved — dealer inventory / roles / counts / add-on and property inventory / allowance / add-on / FSBO unchanged | SI-01…SI-05 |
| BUSINESS HUB | PROVEN preserved | BH-01 |
| ADMIN | PROVEN preserved (launchpad additive only) | AM-01 |
| ANALYTICS | PROVEN preserved | AN-01 |
| CLASSIFIEDS PRESERVATION | PROVEN — certified tree byte-identical to `7555fb64`; V1 / V2 / V3 / GUARDS OK; En Venta, Rentas, Empleos, Autos Privado, community direct links preserved | CP-01…CP-03 |
| OUT-OF-SCOPE PROTECTION | PROVEN — Viajes / Recursos / Iglesias / Ofertas / Comida, pricing, Stripe, Revenue OS, Business Hub, analytics, admin queues, auth, schema, migrations, global lifecycle: 0 files changed; blast radius = launchpad + gateway | OS-01…OS-03 |

## OWNER QA RELEASE DECISION

**AUTHORIZED** — full TypeScript PASS · production build PASS · feature-caused regressions 0 · required blockers 0 · REPAIR_REQUIRED 0 · proof-matrix self-audit PASS (`verify-quick-business-proof-matrix-02` OK) · exact-code Preview READY (`dpl_ErnDRiPfuEmZJQ9T7Md4oDbMvgjh` @ `f55ea363`) with code equivalence PROVEN · all four Core categories technically represented · certified Quick Classifieds preserved.

This decision rests on source-grounded proof, not on the build / typecheck pass alone. Owner QA is the next PM dependency; it is NOT performed in this mission. Merge to main and Production remain NOT AUTHORIZED.

OWNER QA PERFORMED: NO · READY TO MERGE MAIN: NO · READY FOR PRODUCTION: NO
