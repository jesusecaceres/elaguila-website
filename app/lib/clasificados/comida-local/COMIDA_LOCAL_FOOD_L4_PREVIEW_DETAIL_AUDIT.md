# Gate FOOD-L4 — Comida Local Preview + Detail Shell + Output Mapping

**Status:** Complete  
**Date:** 2026-06-03

---

## 1. Preflight status

| Class | Result |
|---|---|
| RELATED_ALLOWED | `comida-local/**`, `scripts/comida-local-food-l4-*`, `package.json` |
| RELATED_BLOCKING | None |
| UNRELATED_PARALLEL_WORK | Servicios preview files dirty — **not modified** in FOOD-L4 |

---

## 2. FOOD-L1/FOOD-L2/FOOD-L3 decisions used

- Separate Comida Local product; no restaurant modules.
- Draft key `leonix:comida-local:draft:v1`; NorCal city; phone/social formatters.
- Preview route per FOOD-L1: `/clasificados/comida-local/preview`.
- No publish/DB/analytics/chooser.

---

## 3. Files changed

| File | Role |
|---|---|
| `comidaLocalPreviewTypes.ts` | Preview VM types |
| `comidaLocalPreviewImage.ts` | Safe image src (no data:/fake) |
| `mapComidaLocalDraftToPreviewVm.ts` | Draft → VM mapper |
| `ComidaLocalContactActions.tsx` | Data-driven CTAs |
| `comidaLocalContactStyles.ts` | Leonix + platform colors |
| `ComidaLocalDetailShell.tsx` | Reusable shell |
| `preview/page.tsx` + `ComidaLocalPreviewClient.tsx` | Preview route |
| `ComidaLocalApplicationClient.tsx` | Ver vista previa link |
| `comidaLocalFieldCopy.ts` | viewPreview copy |
| `COMIDA_LOCAL_FOOD_L4_PREVIEW_DETAIL_AUDIT.md` | This audit |
| `scripts/comida-local-food-l4-preview-detail-audit.ts` | Static audit |
| `package.json` | Audit script |

---

## 4–12. Results summary

| Area | Result |
|---|---|
| Preview VM | `ComidaLocalPreviewVm` + section flags |
| Mapper | Real CTAs only; valid social/location URLs; chips from constants |
| Contact | Llamar, Mensaje, WhatsApp, IG, FB, TikTok, Dónde está hoy |
| Detail shell | Compact header, optional sections hidden |
| Preview route | Reads `loadComidaLocalDraftFromStorage` only |
| App CTA | Link when `validateComidaLocalDraftForPreview` passes |
| Photos | Metadata/http(s)/blob session only; upload deferred; no base64 in storage |
| Empty hide | `sections.*` flags drive rendering |

---

## 13. Intentionally not implemented

Publish API, payment, DB, slug detail, dashboard/admin, analytics, chooser, search, Supabase upload, Leonix ID on preview.

---

## Photo preview result

**Upload deferred.** `resolveComidaLocalPreviewImageSrc` allows `https?://` and same-tab `blob:` only. Persistence still strips `data:`. Placeholder header when no safe image.

---

## Manual QA checklist

- [ ] Fill form → Ver vista previa → preview loads
- [ ] Badge + “no está publicada todavía”
- [ ] No Leonix ID on preview
- [ ] Phone → Llamar/Mensaje; WA → WhatsApp green
- [ ] Invalid social not in mapper output
- [ ] Empty optional sections hidden
- [ ] Refresh preview after edit (localStorage)
- [ ] `npm run comida-local:food-l4-preview-detail-audit`
- [ ] `npm run build`

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| FOOD-L1 audit was read and followed | TRUE | §2 |
| FOOD-L2 audit was read and followed | TRUE | §2 |
| FOOD-L3 audit was read and followed | TRUE | §2 |
| Comida Local remains separate from Restaurantes Premium | TRUE | No restaurante edits |
| No Restaurante files were edited | TRUE | Forbidden prefix check |
| No Rentas files were edited | TRUE | Forbidden prefix check |
| No Bienes Raíces files were edited | TRUE | Forbidden prefix check |
| No Servicios files were edited | TRUE | Forbidden prefix check |
| No En Venta/Varios files were edited | TRUE | Forbidden prefix check |
| No Stripe/payment files were edited | TRUE | — |
| No Admin/Dashboard files were edited | TRUE | — |
| No database migrations were created | TRUE | — |
| No publish API route was created | TRUE | — |
| No category chooser/global nav integration was added | TRUE | — |
| Preview VM types were created | TRUE | `comidaLocalPreviewTypes.ts` |
| Draft-to-preview mapper was created | TRUE | `mapComidaLocalDraftToPreviewVm.ts` |
| Preview route exists | TRUE | `preview/page.tsx` |
| Detail shell component exists | TRUE | `ComidaLocalDetailShell.tsx` |
| Application CTA navigates to preview only | TRUE | Link, no publish |
| Preview route reads local draft only | TRUE | `loadComidaLocalDraftFromStorage` |
| Preview route does not publish | TRUE | Disabled publish button |
| Preview route does not call APIs | TRUE | No fetch |
| Preview route does not write DB | TRUE | — |
| Preview shows owner preview badge | TRUE | Header copy |
| Preview shows pre-publish note | TRUE | §4–12 |
| Preview does not show fake Leonix ID | TRUE | Not in client |
| Contact actions only show real data | TRUE | Mapper guards |
| Invalid social URLs do not render as links | TRUE | normalize + null |
| Optional sections hide when empty | TRUE | `sections` flags |
| Restaurant-only fields excluded | TRUE | Forbidden label audit |
| No menu/reservation/order/review blocks | TRUE | Forbidden labels |
| No fake listings/data/counters/reviews | TRUE | — |
| Photo handling avoids base64 localStorage | TRUE | FOOD-L3 persistence |
| Photo handling avoids fake image URLs | TRUE | `comidaLocalPreviewImage.ts` |
| Detail shell uses Leonix direction | TRUE | Shell styles |
| Mobile layout remains clean | TRUE | max-w-2xl, flex-wrap CTAs |
| Audit script was created | TRUE | FOOD-L4 script |
| npm run build passed | TRUE | Validation run |

---

## Next gate

**FOOD-L5 — Publish flow + package/pricing hook** (DB table, API, Leonix ID — not in FOOD-L4).
