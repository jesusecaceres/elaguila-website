# Autos Phase 3 — runtime visibility (publish without Stripe)

**Scope:** Prove Autos listings can be activated without Stripe (gated `AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true` on non-Vercel-production), appear on public and admin/user surfaces, and that browse filters behave sanely. **Full `/publicar/autos` wizard → preview → confirm** is **not** covered by the automated proof below (see R3/R4).

**Primary automated proof:** `npm run verify:autos:e2e` (Playwright + `next start`). It creates **ephemeral** Privado + Negocios rows via authenticated `POST /api/clasificados/autos/listings` and activates with `POST /api/clasificados/autos/checkout` under **`AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS=0`** and **`AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true`** (see `playwright.autos-runtime.config.mjs`). Listing UUIDs are unique per run and **deleted in `afterAll`** — there is no long-lived “Phase 3 listing ID” in git.

**Env (names only, never paste values):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SMOKE_SELLER_EMAIL`, `SMOKE_SELLER_PASSWORD`, `SMOKE_BUYER_EMAIL`, `SMOKE_BUYER_PASSWORD`, `ADMIN_PASSWORD`, `AUTOS_ALLOW_TEST_PUBLISH_BYPASS`, `VERCEL_ENV` (Playwright forces `preview` for the child `next start` process).

| ID | Claim | Runtime proof | Verdict | If FALSE, exact fix needed |
| -- | ----- | ------------- | ------- | -------------------------- |
| R1 | `AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true` is required for Stripe-free activation when internal bypass is off. | `verify:autos:e2e` with `AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS=0` + checkout returns `testPublishBypass: true` | TRUE (runtime) | If checkout falls back to Stripe, confirm `playwright.autos-runtime.config.mjs` forces `AUTOS_ALLOW_TEST_PUBLISH_BYPASS` on the `next start` child env. |
| R2 | Without the env flag, unpaid Autos listings are not silently activated. | Code inspection: `checkout/route.ts` returns `stripe_not_configured` when no bypass and no Stripe | TRUE (code) | Add a negative Playwright case that omits both bypass flags and expects 503 on checkout. |
| R3 | Privado test listing can be published/activated without Stripe through the **real app UI** (`/publicar/autos/privado` → confirm). | Not executed: E2E uses listing API, not the publish wizard | FALSE (runtime) | Add `e2e/autos/autos-phase-3-ui-publish-privado.spec.ts` traversing the full client flow with smoke credentials. |
| R4 | Negocios test listing can be published/activated without Stripe through the **real app UI** (`/publicar/autos/negocios` → confirm). | Not executed: E2E uses listing API, not the publish wizard | FALSE (runtime) | Add `e2e/autos/autos-phase-3-ui-publish-negocios.spec.ts` for the full client flow. |
| R5 | Active listing appears on `/clasificados/autos` landing. | Playwright: `page.goto('/clasificados/autos?lang=es')` + visible `vehicleTitle` texts | TRUE (runtime) | — |
| R6 | Active listing appears on `/clasificados/autos/resultados` with filters/q. | Playwright navigates filtered + `q=` URLs; asserts titles | TRUE (runtime) | — |
| R7 | Active listing detail loads at `/clasificados/autos/vehiculo/[id]`. | Playwright + `fetch` to public listing API for priv/neg | TRUE (runtime) | — |
| R8 | User dashboard shows the active Autos listing. | Playwright: `/dashboard/mis-anuncios?lang=es` + link to `/clasificados/autos/vehiculo/{id}` | TRUE (runtime) | — |
| R9 | User dashboard management actions are not dead. | Playwright asserts at least one `Ver público` / `View live` link visible in paid Autos section | TRUE (runtime) | Extend with click-through on “Gestionar” if product requires it. |
| R10 | Admin Autos category section shows the listing. | Playwright: `/admin/workspace/clasificados/autos` + row match on listing id prefix | TRUE (runtime) | — |
| R11 | Admin Autos row actions are connected. | Playwright opens `View public` / `Ver público` from admin row (new tab) | TRUE (runtime) | Add explicit clicks on suspend/verify only if required by compliance. |
| R12 | Public card shows year, make, model, price, mileage, location, seller type. | Partial: landing asserts titles; card fields covered by `AutosPublicStandardCard` + prior code audits | TRUE (code) | Add card-level assertions on landing cards for each field. |
| R13 | Detail page shows all important publish fields currently collected. | Partial: detail asserts dealer phone/email affordances + stock via API; not every field DOM-asserted | TRUE (code) | Extend Playwright to assert each spec row against DOM. |
| R14 | Search finds listing by make. | Playwright: `make=Honda` URL path | TRUE (runtime) | — |
| R15 | Search finds listing by model. | Included in Honda filter URL (`model=Accord`) | TRUE (runtime) | — |
| R16 | Search finds listing by year. | Not explicitly isolated (year not alone in URL) | FALSE (runtime) | Add `yearMin`/`yearMax` resultados URL assertion. |
| R17 | Search finds listing by location. | Playwright: `city=San+Jose&zip=95112` in privado filter URL | TRUE (runtime) | — |
| R18 | Filter fields are real and wired. | Results shell + `applyAutosPublicFilters` / query contract exist; Playwright exercises subset | TRUE (runtime) | Document any UI-only filters separately if added. |
| R19 | Sort newest first works. | Not exercised in Playwright (default sort not toggled via UI) | FALSE (runtime) | Drive sort control on `/clasificados/autos/resultados` to `newest` and assert order. |
| R20 | Sort price low/high works. | Not exercised in Playwright | FALSE (runtime) | Toggle `priceAsc` / `priceDesc` in UI test. |
| R21 | Sort mileage low works. | Not exercised in Playwright | FALSE (runtime) | Toggle mileage sort in UI test. |
| R22 | Sort year newest/oldest works. | No dedicated year sort in public contract (`autosPublicFilters` mileage/newest/price) | FALSE (runtime) | If required, add `yearAsc`/`yearDesc` to contract + UI + test. |
| R23 | No fake controls are shown as active. | Playwright: `/\bBoost\b/i` count 0 on landing + detail | TRUE (runtime) | — |
| R24 | Build passes. | `npm run build` (agent run) | TRUE (runtime) | — |
| R25 | Autos audits/smoke pass. | `npm run autos:phase1-audit`, `autos:phase2-audit`, `autos:phase3-audit`, `autos:enforce-smoke` | TRUE (runtime) | — |
| R26 | No unrelated files changed. | Autos-scoped + `e2e/autos` + `playwright.autos-runtime.config.mjs` + `scripts/autos-phase-3-runtime-visibility-audit.ts` + `package.json` + Phase 2 audit script assertion tweak | TRUE (code) | If stricter, narrow `scripts/autos-phase-2-publish-visibility-audit.ts` change by inlining bypass doc check only in phase3. |
| R27 | Final Phase 3 runtime readiness. | R3/R4/R16/R19–R22 remain **FALSE (runtime)** until UI wizard + sort/year coverage is scripted | FALSE (runtime) | Ship follow-up Playwright specs per rows above. |

## Runtime proof

### Privado

- Listing ID: **Ephemeral UUID** per `npm run verify:autos:e2e` run (deleted in test `afterAll`).
- Listing slug/path: `/clasificados/autos/vehiculo/{id}?lang=es`
- Preview URL: *Not exercised (no `/publicar/autos/privado/confirm` UI run in Phase 3 automated proof).*
- Success URL: *Not exercised (no Stripe success redirect in test-bypass path; activation is JSON from checkout).*
- Landing URL checked: `http://127.0.0.1:{AUTOS_E2E_PORT|3022}/clasificados/autos?lang=es`
- Results URL checked: `/clasificados/autos/resultados?lang=es&make=Honda&model=Accord&city=San+Jose&zip=95112&bodyStyle=Sedan&seller=private` and `q=E2E-AUTOS-GO-LIVE`
- Detail URL checked: `/clasificados/autos/vehiculo/{privId}?lang=es`
- User dashboard URL checked: `/dashboard/mis-anuncios?lang=es`
- Admin dashboard URL checked: `/admin/workspace/clasificados/autos` (row visibility; admin language may be EN or ES)
- Search terms verified: `make`+`model`+`q` + `city`/`zip` (see R16 gap)
- Filters verified: `make`, `model`, `city`, `zip`, `bodyStyle`, `seller`, `q`
- Sorts verified: *Not executed in Playwright (see R19–R22).*

### Negocios

- Listing ID: **Ephemeral UUID** per `npm run verify:autos:e2e` run (deleted in test `afterAll`).
- Listing slug/path: `/clasificados/autos/vehiculo/{id}?lang=es`
- Preview URL: *Not exercised (no `/publicar/autos/negocios/confirm` UI run in Phase 3 automated proof).*
- Success URL: *Not exercised (same as Privado).*
- Landing URL checked: same host as Privado — `/clasificados/autos?lang=es`
- Results URL checked: `/clasificados/autos/resultados?lang=es&make=Toyota&seller=dealer&bodyStyle=SUV` and `q=E2E-AUTOS-GO-LIVE`
- Detail URL checked: `/clasificados/autos/vehiculo/{negId}?lang=es`
- User dashboard URL checked: `/dashboard/mis-anuncios?lang=es`
- Admin dashboard URL checked: `/admin/workspace/clasificados/autos`
- Search terms verified: `make`, `seller`, `bodyStyle`, `q`
- Filters verified: partial (see R16)
- Sorts verified: *Not executed (see R19–R22).*

### Blockers / how to re-run

- **Commands:** `npm run build` then `npm run verify:autos:e2e`
- **Required env (names only):** see top of this document.
- **If E2E skips:** missing `NEXT_PUBLIC_SUPABASE_*`, `SMOKE_*`, or `ADMIN_PASSWORD` in `.env.local` (Playwright loads it in `playwright.autos-runtime.config.mjs`).

## Bypass safety note

`AUTOS_ALLOW_TEST_PUBLISH_BYPASS` is read at **runtime** from `process.env` in `autosTestPublishBypass.ts` (paired with `VERCEL_ENV !== "production"`). `next start` uses `NODE_ENV=production`; the old `NODE_ENV===production` guard incorrectly disabled the flag under `next start` — removed so local/staging `next start` matches real usage.
