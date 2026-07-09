# MAGAZINE-DEEPL-KEY-LOCAL-READINESS1

Gate date: 2026-07-06  
Classification: scoped QA / provider env readiness (zero cost; no DeepL calls)

## Purpose

Prepare Leonix for a **later** controlled DeepL document smoke on the June 2026 magazine PDF. This gate verifies repo readiness and documents how Chuy adds the API key locally. It does **not** call DeepL, generate translated PDFs, or change public assets.

## Chuy — DeepL account and local key (outside chat)

1. Create or sign in to a [DeepL API account](https://www.deepl.com/pro-api).
2. Copy the **API authentication key** from the DeepL developer console.
3. **Do not paste the key into Cursor chat.**
4. Add it locally only in `.env.local` at the project root:

   ```env
   DEEPL_AUTH_KEY=
   ```

   (Replace the empty value with your key on the same line.)

5. **Do not commit `.env.local`.** (Protected by `.gitignore` → `.env*`.)
6. **Do not add the key to Vercel** until a later gate explicitly approves production env setup.
7. Re-run the zero-cost audit:

   ```bash
   node scripts/magazine-deepl-readiness-audit.mjs
   ```

   When output shows `decision=READY_FOR_REAL_PT_SMOKE`, the next gate is **`MAGAZINE-DEEPL-PT-REAL-SMOKE3`** (first paid provider call — requires separate explicit approval).

## Zero-cost checks (safe anytime)

```bash
# Readiness audit — never prints secrets, never calls DeepL
node scripts/magazine-deepl-readiness-audit.mjs

# Proof script dry-run only — no paid API, no output PDF
node scripts/magazine/proof-translate-deepl.mjs --dry-run --target=pt
```

**Do not run** `--execute` until the DeepL document API call is implemented in `scripts/magazine/proof-translate-deepl.mjs` and a paid smoke gate is approved.

## Current readiness snapshot (2026-07-06)

| Item | Status |
|------|--------|
| Source PDF | Present — `public/magazine/2026/june/leonix_media_june.pdf` (~74.76 MB) |
| `deepl-node` in package.json | Present (`^1.27.0`) |
| `.env.local` | Exists; `DEEPL_AUTH_KEY` not set yet |
| Readiness audit decision | `STOP_HOLD_FOR_DEEPL_ENV` |
| Public translated PDF | None |
| DeepL API called | No |

## Known PDF risk (unchanged)

Preflight documented **IMAGE_FLATTENED_LIKELY** (~0 extractable text characters). Direct DeepL PDF translation may be high-risk even after the key is added. Companion/HTML layer and source artwork correction remain the safer path until compatibility is re-checked. See `docs/magazine-pdf-deepl-compatibility-preflight.md`.

## Related docs

- `scripts/magazine/README.md` — proof scripts and dry-run commands
- `docs/magazine-deepl-readiness-audit.md` — prior audit history
- `docs/magazine-translation-platform-runbook.md` — platform registry and QA flow
