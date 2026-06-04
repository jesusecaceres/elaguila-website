# Gate FOOD-L3 — Comida Local Field UX + Draft Persistence + Validation

**Status:** Complete  
**Date:** 2026-06-03

---

## 1. Preflight status

| Class | Result |
|---|---|
| RELATED_ALLOWED | `app/lib/clasificados/comida-local/**`, `app/(site)/publicar/comida-local/**`, `scripts/comida-local-food-l3-field-draft-audit.ts`, `package.json` |
| RELATED_BLOCKING | None |
| UNRELATED_PARALLEL_WORK | None |

---

## 2. FOOD-L1/FOOD-L2 decisions used

- Comida Local isolated product; `/publicar/comida-local` route unchanged.
- NorCal city via shared `CityAutocomplete` + `getCanonicalCityName` (`comidaLocalCity.ts`).
- Phone/WhatsApp/social helpers from FOOD-L2 extended in UI.
- No publish, payment, DB, admin, dashboard, analytics, chooser.
- Photos remain placeholders; no base64 in localStorage.

---

## 3. Files inspected

FOOD-L1/FOOD-L2 audits; `ComidaLocalApplicationClient.tsx` (pre-FOOD-L3); `CityAutocomplete.tsx`; `californiaLocationHelpers.ts`; `enVentaPhoneDisplay.ts` (via formatting wrapper).

---

## 4. Files changed

| File | Change |
|---|---|
| `comidaLocalDraftPersistence.ts` | **New** — load/save/merge, key `leonix:comida-local:draft:v1` |
| `useComidaLocalDraft.ts` | **New** — hook, autosave, reset |
| `comidaLocalCity.ts` | **New** — canonical sync |
| `comidaLocalValidation.ts` | Canonical city + preview warning |
| `comidaLocalFieldCopy.ts` | Autosave/preview copy updates |
| `ComidaLocalApplicationClient.tsx` | Full UX wiring |
| `ComidaLocalValidationPanel.tsx` | **New** — dual validation panels |
| `COMIDA_LOCAL_FOOD_L3_FIELD_DRAFT_AUDIT.md` | This file |
| `scripts/comida-local-food-l3-field-draft-audit.ts` | **New** |
| `package.json` | FOOD-L3 audit script |

---

## 5. City/NorCal wiring result

**Wired:** `CityAutocomplete` (`variant="light"`, `stripInvalidOnBlur`) bound to `cityDisplay` / `cityCanonical` through `syncComidaLocalCityFromInput`. Publish/preview validation uses `resolveComidaLocalCityCanonical`. Inline warning when text does not resolve to NorCal list.

---

## 6. Draft persistence result

- Key: `leonix:comida-local:draft:v1` (not restaurante/en-venta).
- Debounced autosave 400ms after hydration.
- `mergeComidaLocalDraftFromStorage` tolerates malformed JSON.
- Strips `data:` / base64 image URLs before save.
- `resetDraft` clears storage.
- `hasLoadedDraft` prevents hydration flash; SSR-safe (no window until mount).

---

## 7. Field state wiring result

All FOOD-L2 fields update `ComidaLocalDraft` via `useComidaLocalDraft().updateDraft`.

---

## 8. Phone/WhatsApp formatting result

Live `formatComidaLocalPhoneInput` on tel/WhatsApp fields. Future publish validation: phone ≥10 digits OR WhatsApp ≥8 digits.

---

## 9. Social normalization result

`normalizeComidaLocalSocialInput` on blur for Instagram/Facebook/TikTok; inline warnings when touched + invalid; subtle platform border accents. No link rendering in form.

---

## 10. Validation UX result

`ComidaLocalValidationPanel`: preview guidance + future publish checklist. Disabled CTA: **Próximo paso: vista previa**. No fake publish success.

---

## 11. Photo placeholder result

Placeholders only; copy states FOOD-L4 upload; persistence strips image blobs; no base64 in localStorage.

---

## 12. UX/UI result

Leonix cream/burgundy/gold/charcoal preserved; mobile-first; dual validation cards above form; saved timestamp in header.

---

## 13. Intentionally not implemented

Publish API, payment, DB, dashboard/admin, analytics, chooser, results/detail routes, real image upload, preview page output.

---

## 14–16. Desktop / mobile / QA

Responsive layout unchanged; section nav wraps on small screens. Manual QA: fill form → refresh → data persists; city from list; phone formats; invalid social shows warning; reset clears storage.

---

## 17. Risks / deferred

FOOD-L4: preview + image upload + shell output. FOOD-L5: publish. IDB for images later if needed.

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| FOOD-L1 audit was read and followed | TRUE | §2 |
| FOOD-L2 audit was read and followed | TRUE | §2 |
| Comida Local remains separate from Restaurantes Premium | TRUE | No restaurante edits |
| No Restaurante application files were edited | TRUE | git scope |
| No Restaurante fields were added | TRUE | — |
| No Restaurante behavior was modified | TRUE | — |
| No Stripe/payment files were edited | TRUE | — |
| No Admin files were edited | TRUE | — |
| No Dashboard files were edited | TRUE | — |
| No database migrations were created | TRUE | — |
| No publish API route was created | TRUE | — |
| No category chooser/global nav integration was added | TRUE | — |
| Draft persistence is Comida Local-scoped only | TRUE | `leonix:comida-local:draft:v1` |
| Draft persistence does not use Restaurante keys | TRUE | audit script |
| Draft persistence tolerates malformed storage | TRUE | `mergeComidaLocalDraftFromStorage` |
| Field state wiring covers required fields | TRUE | §7 |
| Field state wiring covers optional fields | TRUE | §7 |
| Phone auto-formatting works in UI | TRUE | §8 |
| WhatsApp formatting works in UI | TRUE | §8 |
| Future publish validation accepts phone OR WhatsApp | TRUE | `hasContact` |
| Social URL normalization/validation is wired | TRUE | §9 |
| Invalid social URLs are not rendered as real links | TRUE | warnings only |
| City canonical integration is wired or safely deferred | TRUE | §5 wired |
| Validation UX is visible and non-publishing | TRUE | §10 |
| Photo upload remains safely deferred | TRUE | §11 |
| No base64 images are stored in localStorage | TRUE | `sanitizeImageDraft` |
| No fake listings/data/counters/reviews were added | TRUE | — |
| Form shell still renders without publish/payment | TRUE | disabled CTA |
| Form shell uses Leonix cream/burgundy/gold/charcoal | TRUE | §12 |
| Mobile layout remains clean | TRUE | §14–16 |
| Audit script was created | TRUE | `comida-local-food-l3-field-draft-audit.ts` |
| npm run build passed | TRUE | validation run |

---

## Next gate

**FOOD-L4 — Preview/detail shell and clean output mapping**
