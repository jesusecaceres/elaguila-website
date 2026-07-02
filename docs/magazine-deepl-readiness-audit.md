# MAGAZINE-DEEPL-READINESS-AUDIT1

Audit date: 2026-07-02  
Gate: `MAGAZINE-DEEPL-READINESS-AUDIT1` (zero-cost; no provider calls)

## Summary Decision

**STOP_HOLD_FOR_PROVIDER_DEPENDENCY**

Portuguese (`pt`) is the locked first DeepL document smoke target. Source PDF and platform architecture are ready, but a real paid smoke is **not** executable yet because **both** blockers are present:

1. `DEEPL_AUTH_KEY` is missing from `process.env` **and** from `.env.local` (value not inspected or printed).
2. `@deepl/deepl-node` is not listed in `package.json`.

Re-run locally:

```bash
node scripts/magazine-deepl-readiness-audit.mjs
```

## Environment

| Check | Result |
|-------|--------|
| DEEPL_AUTH_KEY present (process.env) | FALSE |
| DEEPL_AUTH_KEY present (.env.local, value not printed) | FALSE |
| Secret value printed | FALSE |
| `.env.local` exists | TRUE |
| `.env` exists | FALSE |
| `@deepl/deepl-node` installed/listed | FALSE |

**Note:** Cursor shell does not auto-load `.env.local`. Even if the key is stored in `.env.local`, provider scripts must load it explicitly or the key must be exported into the shell before `MAGAZINE-DEEPL-PT-REAL-SMOKE3`.

## Source Assets

| Check | Result |
|-------|--------|
| Source PDF exists | TRUE |
| Source PDF path | `public/magazine/2026/june/leonix_media_june.pdf` |
| Source PDF size | 78,395,566 bytes (~74.8 MB) |
| June folder assets | `leonix_media_june.pdf`, `cover.png` |
| Proof output folder exists | FALSE (expected before first smoke) |
| Proof output folder gitignored | TRUE (`.gitignore` → `.magazine-proof-output/`) |
| PT proof already exists | FALSE (`.magazine-proof-output/june-2026/pt/leonix_media_june.pt.pdf`) |

Expected local proof layout (after smoke):

- `.magazine-proof-output/june-2026/pt/deepl/` — DeepL provider output (per `scripts/magazine/proof-translate-deepl.mjs`)
- `.magazine-proof-output/june-2026/pt/source-hash.json` — local hash record

## Architecture

| Check | Result |
|-------|--------|
| `magazine_visual_assets` migration exists | TRUE — `supabase/migrations/20260630140000_magazine_visual_assets.sql` |
| Translated visual helper/registry exists | TRUE — `app/lib/magazine/magazineVisualAssetsPlatform.ts`, `magazineVisualTranslationManifest.ts` |
| Server approved lookup exists | TRUE — `app/lib/magazine/getApprovedMagazineVisualAsset.ts` |
| Reader fail-closed behavior exists | TRUE — `languageAssets.ts` serves Spanish original until registry row is QA-approved + publicly available |
| QA approval fields present | TRUE — `qa_status`, `qa_approved`, `publicly_available` in migration + platform types |
| Public serving gate documented | TRUE — `docs/magazine-translation-platform-runbook.md` |
| No fake translated PDF claim | TRUE — PT track status `planned`; FlipHTML5 remains Spanish original |

### Fail-closed behavior (confirmed)

- `getMagazineVisualAsset()` always serves Spanish PDF/flipbook URLs until `describeMagazineVisualAssetState()` reports `canServe`.
- `getApprovedMagazineVisualAsset()` queries only rows with `qa_approved = true`, `qa_status = 'approved'`, and `publicly_available = true`.
- RLS policy on `magazine_visual_assets` mirrors the same public-read constraints.

### Existing provider scripts (dry-run only)

| Script | Purpose |
|--------|---------|
| `scripts/magazine/hash-source.mjs` | SHA-256 source PDF |
| `scripts/magazine/proof-translate-deepl.mjs` | DeepL PT preflight / future execute |
| `scripts/magazine/proof-translate-google.mjs` | Google doc preflight (held) |
| `scripts/magazine/proof-render.mjs` | Render preflight (held) |
| `scripts/magazine/proof-manifest-from-output.mjs` | Local manifest writer |
| `scripts/magazine/README.md` | Operator notes |

Source hash (documented): `8fa5ec5a9faa1c0cb689451b79477f60b2fc2e644048a9176bcc68d8be112986`

## Cost-Control Result

| Action | Result |
|--------|--------|
| DeepL called | FALSE |
| PDF translated | FALSE |
| Output generated | FALSE |
| Package installed | FALSE |
| Public serving changed | FALSE |

## Next Gate

**MAGAZINE-DEEPL-ENV-SETUP1** (add `DEEPL_AUTH_KEY` to `.env.local` without committing it)

Then **MAGAZINE-DEEPL-PT-REAL-SMOKE3** when both are true:

1. `DEEPL_AUTH_KEY` is available to the execution shell (not printed in logs).
2. `@deepl/deepl-node` is installed (`npm install @deepl/deepl-node` — only in the smoke gate, not this audit).

Preflight after env setup:

```bash
node scripts/magazine/proof-translate-deepl.mjs --dry-run --target=pt
```

## Notes for Chuy

**Ready today**

- June 2026 Spanish source PDF is on disk (~75 MB) with cover PNG.
- Platform registry migration, TypeScript helpers, server lookup, and runbooks are in place.
- Reader honestly falls back to Spanish — no fake translated edition is served.
- Local proof output paths are gitignored.

**Blocking paid DeepL smoke**

- No DeepL auth key visible in the Cursor shell environment.
- DeepL Node SDK (`@deepl/deepl-node`) is not in `package.json` yet.
- No local PT proof PDF exists (expected — smoke has not run).

**Do not spend DeepL credits until** env + dependency are confirmed via `node scripts/magazine-deepl-readiness-audit.mjs` returning `READY_FOR_REAL_PT_SMOKE`.

## Related docs

- `docs/magazine-translation-platform-runbook.md`
- `docs/magazine-visual-translation-proof.md`
- `docs/magazine-storage-and-asset-cache.md`
- `docs/translation-finish-backlog.md`
