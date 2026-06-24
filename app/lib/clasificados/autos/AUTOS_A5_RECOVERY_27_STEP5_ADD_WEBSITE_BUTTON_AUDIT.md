# A5.RECOVERY-27 — Autos Step 5 Add Website Button

## 1. Gate title

**A5.RECOVERY-27 — Autos Step 5 Add Website Button Gate**

## 2. Repo confirmation

| Field | Value |
| ----- | ----- |
| Repo root | `C:/projects/elaguila-website` |
| Remote | `origin https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `6a202ac5a697198544229d0d4af38348aebe29a6` |

## 3. Dirty file preflight

**Gate-scoped (touched):**

- `app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `e2e/autos/autos-a5-recovery-27-step5-add-website-button.spec.ts`
- `playwright.autos-recovery-27.config.mjs`
- `scripts/autos-a5-recovery-27-step5-add-website-button-audit.ts`
- `app/lib/clasificados/autos/AUTOS_A5_RECOVERY_27_STEP5_ADD_WEBSITE_BUTTON_AUDIT.md`
- `package.json`

**Unrelated dirty (not touched):** none at gate start; working tree clean except gate files above.

## 4. Production failure summary

On `/publicar/autos/negocios?lang=es`, Step 5 **Negocio / contacto**, section **Websites y recursos del concesionario**, clicking **Añadir website** did nothing — no row, no fields, no visible feedback. Button was not disabled; click handler ran but state immediately reverted.

## 5. Failure reproduction

**Reproduced locally (pre-fix):** Playwright and manual inspection confirmed:

- Button `type="button"` with working `onClick` calling `setListingPatch({ dealerCustomLinks: [...rows, next] })`.
- Row count attribute stayed at `0` after click.
- No console error; silent state drop in `normalizeLoadedListing`.
- Max-count logic was not the cause (0 rows present).

## 6. Root cause

`setListingPatch` merges patches through `normalizeLoadedListing(next, { liveDraft: true })`, which called `normalizeDealerCustomLinks(raw.dealerCustomLinks, { liveDraft })` **without** `keepEmptyRows: true`. Newly added rows have empty `label` and `url`, so normalization dropped them before React re-rendered — the UI never showed an editable row.

**Fix:** pass `keepEmptyRows: liveDraft` in `normalizeLoadedListing` so in-progress empty rows survive while editing; output/publish paths still filter empty rows via `dealerCustomLinksForOutput`.

## 7. Files inspected

- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts`
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `app/lib/clasificados/autos/autosDealerCustomLinks.ts`
- `app/(site)/clasificados/autos/negocios/lib/mapAutosDealerToBusinessHubContact.ts`
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx`
- `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts`
- `e2e/autos/autos-a5-recovery-26-child-edit-hydrates-saved-inventory.spec.ts` (session seed pattern)

## 8. Files changed

- `app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts` — `keepEmptyRows: liveDraft` for `dealerCustomLinks`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx` — single `customLinkRows` source, proof attributes, visible max-2 message
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts` — `customLinksMaxReached` ES/EN
- `e2e/autos/autos-a5-recovery-27-step5-add-website-button.spec.ts` — browser proof
- `playwright.autos-recovery-27.config.mjs`
- `scripts/autos-a5-recovery-27-step5-add-website-button-audit.ts`
- `package.json` — audit + browser proof scripts
- `app/lib/clasificados/autos/AUTOS_A5_RECOVERY_27_STEP5_ADD_WEBSITE_BUTTON_AUDIT.md`

## 9. Add website button result

**PASS** — Click adds an editable row immediately. `data-autos-dealer-custom-links-count` increments 0 → 1 → 2.

## 10. Website/resource row result

**PASS** — Each row includes label (`Nombre del website`) and URL (`URL del website`) inputs plus **Eliminar** remove action.

## 11. Max 2 behavior result

**PASS** — Third add blocked: button disabled, `data-autos-dealer-custom-links-max="1"` message **Puedes agregar hasta 2 websites importantes.**

## 12. Draft/session persistence result

**PASS** — Valid row (label + URL) survives page refresh via `useAutosDraftPersistEffects` + `dealerCustomLinks` in active draft payload.

## 13. Preview Business Hub result

**PASS** — Playwright opens preview; **Financiamiento** link visible in Business Hub `moreLinks`; removed **Promociones** row not shown.

## 14. Publish payload result if applicable

**PASS (existing mapper)** — `dealerCustomLinksForOutput` + `mapAutosDealerToBusinessHubContact` already map valid rows; empty rows excluded from public output. No publish mapper change required.

## 15. Regression guardrail result

**PASS** — Languages, hours, dealer contact, and inventory modules untouched. Autos-only scope. No Stripe/schema changes.

## 16. Local browser proof

```
npm run autos:a5-recovery-27-browser-proof
→ 1 passed (10.4s)
```

Spec: `e2e/autos/autos-a5-recovery-27-step5-add-website-button.spec.ts` — add rows, max 2, remove, refresh persist, preview Business Hub link.

## 17. Manual QA checklist

1. Open `/publicar/autos/negocios?lang=es`.
2. Go to Step 5 Negocio / contacto.
3. Scroll to Websites y recursos del concesionario.
4. Click Añadir website.
5. Confirm a website/resource row appears.
6. Add label: Financiamiento.
7. Add URL.
8. Click Añadir website again.
9. Confirm second row appears.
10. Add label and URL.
11. Click Añadir website a third time.
12. Confirm max 2 message appears or button disables with clear feedback.
13. Remove one row.
14. Confirm only that row is removed.
15. Refresh.
16. Confirm valid row data remains.
17. Open preview.
18. Confirm website/resource appears in Business Hub.
19. Confirm empty rows do not appear in preview.
20. Confirm languages/hours/contact still work.

## 18. TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| --------------------------------------------------------- | ---------- | -------- |
| Correct repo confirmed | TRUE | `C:/projects/elaguila-website`, origin elaguila-website |
| Dirty files reviewed before editing | TRUE | Clean tree at preflight; only gate files modified |
| Autos-only scope respected | TRUE | Changes under `autos/negocios`, shared autos lib only |
| Add website failure reproduced locally | TRUE | Pre-fix count stayed 0 after click |
| Exact root cause documented | TRUE | `normalizeLoadedListing` dropped empty rows without `keepEmptyRows: liveDraft` |
| Button has working click action | TRUE | Playwright PASS; count increments |
| First click creates/opens website row | TRUE | `data-autos-dealer-custom-links-count="1"` |
| Second click creates/opens second website row | TRUE | count `"2"` |
| Max 2 limit is enforced visibly | TRUE | disabled button + `customLinksMaxReached` message |
| No silent failure at max limit | TRUE | visible message at limit |
| Website/resource row has label/name field | TRUE | `customLinkTitle` input |
| Website/resource row has URL field | TRUE | `customLinkUrl` input |
| Remove action works | TRUE | Eliminar removes single row |
| Valid website/resource persists through step navigation | TRUE | draft merge via `setListingPatch` |
| Valid website/resource persists through refresh | TRUE | Playwright refresh assertion |
| Valid website/resource appears in preview Business Hub | TRUE | Playwright link **Financiamiento** |
| Empty/invalid website row hides from public preview | TRUE | `dealerCustomLinksForOutput` skips empty URLs |
| Website/resource maps to listing_payload if mapper exists | TRUE | existing `dealerCustomLinks` on listing type |
| Languages Step 5 behavior not regressed | TRUE | no changes to languages component |
| Hours Step 5 behavior not regressed | TRUE | hours buttons unchanged |
| Dealer contact behavior not regressed | TRUE | contact fields unchanged |
| Added inventory behavior not touched/regressed | TRUE | no inventory files modified |
| No unrelated categories touched | TRUE | git diff scope |
| No global Stripe/payment touched | TRUE | no payment files in diff |
| No schema/migration touched | TRUE | no migration files in diff |
| npm run build passed | TRUE | build exit 0 (~185s) |

## 19. Final recommendation

Final recommendation: **GREEN** — Añadir website works; rows add/edit/remove; max 2 visible; valid rows persist and appear in Business Hub preview; scope and build checks pass.
