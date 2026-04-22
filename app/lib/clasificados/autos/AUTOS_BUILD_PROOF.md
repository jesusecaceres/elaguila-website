# Autos build / type / lint proof (recovery pass)

**Host:** Windows 10, repo `c:\projects\elaguila-website`  
**Date:** 2026-04-22

## Commands run

| # | Command | Exit | Notes |
| - | ------- | ---- | ----- |
| 1 | `npx tsc --noEmit` | **0** | No console output on success. |
| 2 | `npx eslint "app/(site)/clasificados/autos/**/*.{ts,tsx}" "app/lib/clasificados/autos/**/*.ts" "app/api/clasificados/autos/**/*.ts" --max-warnings 0` | **0** | Autos launch-surface scoped. |
| 3 | `npm run lint` | **0** | Full-repo ESLint after fixing unused imports in `app/(site)/clasificados/viajes/lib/buildViajesResultsUrl.ts` (was 2× `no-unused-vars`; **not** Autos code but blocked global lint). |
| 4 | `npm run build` | **0** | Next.js 15.5.7 — log includes **“Skipping linting”** (project `next-build.js` behavior). Types checked during build. |
| 5 | `npm run autos:enforce-smoke` | **0** | Prints `autos-enforcement-smoke: OK`. |

## Failures found and fixed (this pass)

| Failure | File | Fix |
| ------- | ---- | --- |
| Repo-wide lint | `buildViajesResultsUrl.ts` | Removed unused `buildViajesBrowseUrl`, `defaultViajesBrowseState` imports. |

## Autos-specific edits (launch relevance)

- Ranking + landing arrangement + partition fairness + user-facing copy (no “Boost”) — see git diff for Autos paths.

## Launch-surface acceptability

| Gate | Verdict |
| ---- | ------- |
| Typecheck | **Acceptable** |
| Autos eslint slice | **Acceptable** |
| Full repo lint | **Acceptable** (after Viajes unused import fix) |
| Production build | **Acceptable** on this runner — deploy target must still run the same commands in CI/Vercel. |

## Remaining risk

- Build **skips** ESLint inside `next build`; we independently proved `npm run lint` green after the Viajes fix.
