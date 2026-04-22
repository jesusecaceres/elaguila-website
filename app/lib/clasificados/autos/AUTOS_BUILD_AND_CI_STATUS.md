# Autos build & CI status (enforcement pass)

## Commands run (this pass)

| Command | Exit | Notes |
|---------|------|-------|
| `npx tsc --noEmit` | **0** | Full project TypeScript; `scripts/` included. |
| `npx eslint` Autos launch glob (see below) | **0** | `--max-warnings 0` on publish + public + lib + admin autos + dashboard autos. |
| `npm run autos:enforce-smoke` | **0** | `npx tsx scripts/autos-enforcement-smoke.ts` — runtime asserts filters + demo policy. |
| `NODE_ENV=production` + same smoke (PowerShell `$env:NODE_ENV='production'`) | **0** | Confirms demo inventory disabled in production `NODE_ENV`. |
| `npm run build` | **1** | Next.js 15.5.7; fails during “Collecting page data / Finalizing” with **ENOENT** on `.next/build-manifest.json` or `.next/server/pages-manifest.json` (Windows host; reproduced multiple times). |
| `npm run lint` | **1** | **237** problems (**169** errors, **68** warnings); examples: `app/(site)/clasificados/anuncio/[id]/page.tsx` `no-explicit-any`, `pages/api/entries.ts`, `scripts/dup-guard.js` `no-require-imports`, etc. |

### Autos launch ESLint glob (passing)

```text
app/(site)/clasificados/autos/**/*.{ts,tsx}
app/api/clasificados/autos/**/*.{ts,tsx}
app/lib/clasificados/autos/**/*.ts
app/(site)/dashboard/**/*Autos*.{ts,tsx}
app/admin/(dashboard)/workspace/clasificados/autos/**/*.{ts,tsx}
app/(site)/publicar/autos/**/*.{ts,tsx}
```

Fixes applied in this pass (launch surface): unused `parseOptFloat` removed from publish apps; unused draft type imports; `AutosPublishConfirmCore` hook deps eslint directive; `MediaImage` data-URL img eslint directive; `rentasBrowseContract` missing `halfBathsRaw`; `next.config.ts` webpack `cache: false` for prod (attempt to reduce Windows manifest ENOENT — **did not resolve** ENOENT).

## Does this block Autos launch?

| Gate | Blocks launch? | Why |
|------|------------------|-----|
| `tsc` | **No** when green | Type safety for compiled sources. |
| Autos launch ESLint glob | **No** when green | Proves Autos/publish/public paths are lint-clean under current rules. |
| Full `npm run lint` | **Policy-dependent** | Fails repo-wide; **Next production build ignores ESLint** (`next.config.ts` `eslint.ignoreDuringBuilds: true`). So deploy can still proceed if CI does not enforce global lint. |
| `npm run build` (this Windows agent) | **Proof gap** | **Cannot certify** production bundle from this host. Linux CI (e.g. Vercel) may succeed; that must be verified separately. **Treat as launch risk until a green `next build` is captured on the real build OS.** |

## Conclusion

- **Autos-specific TypeScript + scoped ESLint:** acceptable for code quality on the touched launch surface.  
- **Full repository lint:** **not** acceptable if your org requires `npm run lint` in CI.  
- **Production `next build`:** **not proven** on this machine; **cannot** mark “repo builds for launch” TRUE without a green build log from CI or another OS.
