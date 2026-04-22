# Bienes Raíces — approved launch validation gate

## Policy

**Approved gate for Bienes Raíces (and Leonix Clasificados BR touchpoints) is:**

```bash
npm run typecheck
npm run lint:br
npm run build
npm run verify:br
```

Shortcut (no full production build):

```bash
npm run verify:br:launch-gate
```

which runs `typecheck` + `lint:br` + `verify:br` (repo-level structural proof without `next build`).

## Why not `npm run lint` (full repo)?

`npm run lint` executes ESLint across the **entire** repository. The current tree reports many **errors and warnings outside BR** (for example `app/(site)/clasificados/anuncio/[id]/page.tsx` — `@typescript-eslint/no-explicit-any`, hook dependency warnings, `@next/next/no-img-element`, etc.).

Those issues are **unrelated** to Bienes Raíces delivery. Fixing all global lint debt is **not** a prerequisite declared in `package.json` for BR; instead the repo already defines a **scoped** policy:

- `lint:br` — ESLint over BR app surfaces + shared Leonix publish helpers used by BR (see `package.json` script for exact globs).

`next build` is configured with **“Skipping linting”** in this project; type validity is enforced via the TypeScript step during build.

## Evidence (commands)

| Command | Role |
|---------|------|
| `npm run typecheck` | Full `tsc --noEmit` |
| `npm run lint:br` | BR + Leonix publish scope, `--max-warnings 0` |
| `npm run build` | `next build` (includes TS check step) |
| `npm run verify:br` | `scripts/br-launch-selftest.ts` — URL round-trip, filter semantics, machine facet labels from form state |

## FALSE claim prevention

- **Lint gate under approved policy** = `lint:br` green, not full-repo `lint`, unless org explicitly adopts global ESLint zero-errors as a release criterion (not evidenced in this repo’s BR scripts today).
