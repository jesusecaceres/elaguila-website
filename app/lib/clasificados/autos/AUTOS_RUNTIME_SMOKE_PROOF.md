# Autos runtime smoke proof (strongest available in this environment)

**Constraint:** No Stripe secrets, no Supabase service session, no browser automation in this pass.

## Automated (executed)

| Scenario | Command | Result | Evidence |
| -------- | ------- | ------ | -------- |
| Filter + sort + search invariants | `npm run autos:enforce-smoke` | **PASS** | Exit code 0, stdout `autos-enforcement-smoke: OK`. Asserts: lane mapping, `q` hits `searchableBlurb`, make filter case-insensitive, bodyStyle filter, newest year order, **`publicSortTimestamp` wins tie**, **partition injects private into recent lane** when top slice dealer-only, demo policy in production. |
| Type + compile | `npx tsc --noEmit` + `npm run build` | **PASS** | Exit 0 (see `AUTOS_BUILD_PROOF.md`). |

## Not executed (requires operator environment)

| ID | Scenario | Blocker | Exact next step |
| -- | -------- | ------- | ----------------- |
| S1 | Private publish → pay → active | No authenticated browser + Stripe test keys in agent | Staging: complete Privado publish, pay with Stripe test card, confirm row `status=active` in Supabase. |
| S2 | Dealer publish path | Same | Staging: Negocios lane checkout. |
| S3 | Payment failure / retry | Same | Use Stripe decline / cancel; hit retry CTA on confirm surface; verify row stays non-public (`listActive*` queries). |
| S4 | Landing visibility after publish | Needs S1+deployed API | Hit `/clasificados/autos?lang=es` with demo off; confirm UUID appears in dealer/private/mixed bands. |
| S5 | Results filters | Partial — logic only without live rows | After S1, apply seller + make filters; count must change deterministically. |
| S6 | Detail page | Needs live `id` | `GET /api/clasificados/autos/public/listings/{id}` and `/clasificados/autos/vehiculo/{id}`. |
| S7 | Dashboard | Owner JWT | Log in as seller; open paid Autos dashboard section. |
| S8 | Admin | Staff session | `/admin/workspace/clasificados/autos`. |
| S9 | CTA runtime (every control) | Browser | Click each CTA listed in `AUTOS_CTA_AUDIT.md`. |
| S10 | Ranking balance | Browser + populated DB | Verify landing three bands + results featured/recent/main with real mix. |

## Summary truth table

| Scenario | Status |
| -------- | ------ |
| S1–S3 | **HARD BLOCKER** (runtime not run) |
| S4–S10 | **HARD BLOCKER** (depends on S1–S3 + browser) |
| Script subset | **TRUE** |
