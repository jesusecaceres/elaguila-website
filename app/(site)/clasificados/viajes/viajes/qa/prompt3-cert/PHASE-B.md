# Viajes Prompt 3 — Phase B certification log

## Lock

- Acquired after owner `MACHINE FREE` authorization
- Stopped Viajes `next dev -p 3003` before heavy work
- Released after `:3103` stop

## Commands

| Command | Result |
| --- | --- |
| `npm run typecheck` | FAIL (7 pre-existing Autos/Community e2e TS errors); **Viajes paths clean** after Prompt 1 selftest fix |
| `npm run build` | PASS (initial + remediation rebuilds for browse fix) |
| `npx next start -p 3103` | PASS |
| Smoke routes on `:3103` | PASS (landing/results/detail/dashboard 200; admin 307) |
| `npx playwright test -c playwright.viajes-runtime.config.mjs --workers=1` | **3 passed** |
| `npx tsx scripts/viajes-prompt3-lifecycle-selftest.ts` | PASS (21) |

## Remediation during Phase B

1. Prompt 1 selftest types (`business_profile_slug`, pill `label`)
2. Playwright selectors (dashboard heading/table; admin shared-password `<details>`)
3. `playwright.viajes-runtime.config.mjs` — no second build/webServer
4. `unstable_expireTag` on Viajes public revalidate
5. **Critical:** `fetchApprovedViajesStagedRows` / admin queue fell back when `republish_sort_at` column missing (was returning `[]` → empty production results)

## Evidence files

- `phase-b-typecheck.log`
- `phase-b-build.log`
- `phase-b-build-remediation.log` / `phase-b-build-remediation2.log`
- `phase-b-playwright.log`
- `phase-b-smoke.log`
