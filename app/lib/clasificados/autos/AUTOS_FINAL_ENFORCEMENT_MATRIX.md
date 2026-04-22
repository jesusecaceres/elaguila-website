# Autos — final enforcement matrix (no partial truths)

This matrix replaces “code trace = done” with **executable proof** where required, and marks gaps **FALSE** or **HARD BLOCKER**.

| ID | Statement (from prior closure) | Why prior proof was insufficient | Required stronger proof | Action taken now | Validation performed now | Final | Proof |
|----|--------------------------------|-----------------------------------|-------------------------|------------------|---------------------------|-------|-------|
| P1 | Autos category ready for real public go-live | Verdict mixed “ready + follow-ups” without executed E2E | Full publish → pay → browse → dashboard/admin on staging or prod | Code/docs hardened; no full E2E here | `tsc` OK; `npm run autos:enforce-smoke` OK; `npm run build` **failed** on this host; no Stripe session created | **FALSE** | Build + E2E not proven on this runner. |
| P2 | Stripe/live payment configuration is fully supported | “Supported” implied live charge proven | Test-mode Checkout completion **or** live charge with webhook receipt | Read `checkout/route.ts`, `autosStripePriceIds.ts`, webhook handlers; no API calls with keys in this session | No Stripe `checkout.sessions.create` executed here | **FALSE** (live) | Live charge **HARD BLOCKER** until operator runs; code paths exist. |
| P3 | Successful payment transitions listing to correct public state | Code-only | DB row `active` + public GET returns listing after webhook/verify | Same code review + unit smoke does not cover Stripe → DB | Not executed with real session | **FALSE** | **HARD BLOCKER:** run staging Checkout + confirm row + `GET /api/clasificados/autos/public/listings/[id]`. |
| P4 | Failed payment does not expose listing publicly | Must observe non-active row absent from public API | Create session, abandon/fail, query public API | Code: `listActiveAutosClassifiedsRows` filters `.eq("status","active")` | No failing session created | **FALSE** | **HARD BLOCKER:** repeat with Stripe test decline + assert 404/empty on public routes. |
| P5 | Private seller lane go-live ready | Needed lane-specific Checkout proof | Private lane checkout completes in test mode | Code review `lane` → `privado` price id | No Checkout executed | **FALSE** | Same as P3 scoped to `privado`. |
| P6 | Dealer/business lane go-live ready | Same | Dealer lane checkout completes in test mode | Code review `lane` → `negocios` price id | No Checkout executed | **FALSE** | Same as P3 scoped to `negocios`. |
| P7 | Every visible filter is truly functional | Needed UI+query parity proof beyond inspection | Automated or manual click-through each control | Removed fake radius; `npm run autos:enforce-smoke` asserts filter + `q` | Executable script passed | **TRUE** | `scripts/autos-enforcement-smoke.ts` output `OK`. |
| P8 | No shopper-relevant field silently dropped from browse | Needed matrix + runtime | Field matrix + smoke on mapper/filters | Updated matrix + smoke for `searchableBlurb`, make CI, bodyStyle | Script + `tsc` | **TRUE** | Smoke + matrix; negotiable/municipio/etc. **not collected** on `AutoDealerListing` (documented N/A). |
| P9 | Dashboard reflects listing lifecycle accurately | Needs UI with real rows | Logged-in owner sees correct status labels vs DB | Labels use `autosClassifiedsVisibility.ts` | No browser session with real user | **FALSE** | **HARD BLOCKER:** manual UI pass vs Supabase row. |
| P10 | Admin exposes operational truth for Autos | Needs admin UI with real rows | Staff view matches DB columns | Admin page reviewed earlier | No admin login smoke | **FALSE** | **HARD BLOCKER:** staff smoke on staging. |
| P11 | No misleading demo/sample data leaks into live browse | Env-flag risk | Production bundle never merges demo | `autosPublicInventoryPolicy.ts`: `NODE_ENV==="production"` → demo off | `NODE_ENV=production npx tsx scripts/autos-enforcement-smoke.ts` | **TRUE** | Policy + smoke assert. |
| P12 | Repo/build/lint state acceptable for launch | Lint/build admitted broken | `tsc`, `next build`, `eslint` green **or** scoped policy documented | `tsc` **PASS**; `npm run build` **FAIL** (ENOENT); `npm run lint` **FAIL** (169 errors repo-wide); Autos launch glob eslint **PASS** | Commands captured in `AUTOS_BUILD_AND_CI_STATUS.md` | **FALSE** | Full repo health not met; Autos slice lint clean. |
| P13 | Real smoke test completed for launch-critical pipeline | “PASS (code trace)” | Executed S1–S8 or documented impossible | Added `npm run autos:enforce-smoke`; no publish/Stripe/HTTP E2E | Script only | **FALSE** | **HARD BLOCKER:** staging E2E checklist in `AUTOS_SMOKE_TEST_REPORT.md`. |

## Counts

| Final | Count |
|-------|------:|
| Total rows | 13 |
| TRUE | 3 |
| FALSE | 9 |
| HARD BLOCKER | (embedded in FALSE rows where external execution required) |

**Executive rule:** With P1/P12/P13 **FALSE**, the category cannot be declared **GO-LIVE READY** under the strict rule set.
