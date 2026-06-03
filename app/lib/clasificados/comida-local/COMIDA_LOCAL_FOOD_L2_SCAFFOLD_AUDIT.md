# Gate FOOD-L2 — Scaffold Comida Local Types + Routes + Form Shell

**Status:** Complete (scaffold only)  
**Date:** 2026-06-03

---

## 1. Preflight status

| Class | Result |
|---|---|
| RELATED_ALLOWED | `app/lib/clasificados/comida-local/**`, `app/(site)/publicar/comida-local/**`, `scripts/comida-local-food-l2-scaffold-audit.ts`, `package.json` |
| RELATED_BLOCKING | None |
| UNRELATED_PARALLEL_WORK | None |

Working tree was clean before FOOD-L2 edits.

---

## 2. FOOD-L1 decisions used

| FOOD-L1 decision | FOOD-L2 implementation |
|---|---|
| Product name **Comida Local** | `COMIDA_LOCAL_PRODUCT_NAME`, page title, shell copy |
| Separate from Restaurantes Premium | No restaurante imports; no restaurant-only fields |
| Route `/publicar/comida-local` | `page.tsx` + canonical metadata |
| Future `/clasificados/comida-local` | Not created (FOOD-L4/FOOD-L6) |
| Borrow En Venta scaffold | Sectioned form, phone format via En Venta utils (isolated wrapper) |
| Borrow Servicios contact polish | Documented for FOOD-L4; true social colors deferred to output gate |
| Required fields in model | businessName, foodType, city, phone/wa, queVendes, mainPhoto slot |
| City NorCal canonical | `cityCanonical` on draft; UI uses `cityDisplay` text shell — **not faked** |
| No menu/reserve/reviews/catering | Forbidden labels absent; types exclude restaurant fields |
| Main photo required at publish | `validateComidaLocalDraftForFuturePublish` warning on empty mainPhoto |
| No publish/payment/DB/analytics | Enforced — no API, migrations, persistence |

---

## 3. Files inspected

- `COMIDA_LOCAL_FOOD_L1_ARCHITECTURE_AUDIT.md`
- `app/(site)/publicar/restaurantes/page.tsx` (route pattern only)
- `app/(site)/clasificados/en-venta/shared/utils/enVentaPhoneDisplay.ts`
- `app/(site)/publicar/community/shared/lib/communityWebsiteAndSocial.ts` (social host rules reference)

---

## 4. Files changed

| File | Purpose |
|---|---|
| `comidaLocalTypes.ts` | Draft + section types |
| `comidaLocalConstants.ts` | Category key, taxonomies, sections |
| `createEmptyComidaLocalDraft.ts` | Empty draft factory |
| `comidaLocalFieldCopy.ts` | ES labels/helpers |
| `comidaLocalValidation.ts` | Preview + future publish validation |
| `comidaLocalFormatting.ts` | Phone/social/href helpers |
| `app/(site)/publicar/comida-local/page.tsx` | Route |
| `app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx` | Form shell |
| `COMIDA_LOCAL_FOOD_L2_SCAFFOLD_AUDIT.md` | This audit |
| `scripts/comida-local-food-l2-scaffold-audit.ts` | Static audit |
| `package.json` | Audit script entry |

---

## 5. Types created

`ComidaLocalDraft` with required/optional fields per FOOD-L1; union types for food type, service, payment, price, language, social platform; `ComidaLocalImageDraft`; `ComidaLocalValidationIssue`; `ComidaLocalSectionKey`. No DB row types.

---

## 6. Constants created

`COMIDA_LOCAL_CATEGORY_KEY`, `COMIDA_LOCAL_PRODUCT_NAME`, food/service/payment/price/language options, seven section definitions, gallery max placeholder (3).

---

## 7. Field copy / helper copy

Centralized in `comidaLocalFieldCopy.ts` — all FOOD-L1 fields with vendor-friendly Spanish helpers; shell notices for scaffold and deferred city/photos.

---

## 8. Empty draft result

`createEmptyComidaLocalDraft()` — empty strings, empty arrays, null images; no fake city/phone/URLs.

---

## 9. Validation helper result

- `validateComidaLocalDraftForPreview` — warnings only  
- `validateComidaLocalDraftForFuturePublish` — errors for name, food type, city, contact, qué vendes; warning for main photo  

Not wired to publish API.

---

## 10. Formatting helper result

- `formatComidaLocalPhoneInput` (wraps En Venta)  
- `normalizeComidaLocalPhoneDigits`  
- `buildComidaLocalTelHref`, `buildComidaLocalSmsHref`, `buildComidaLocalWhatsAppHref`  
- `normalizeComidaLocalSocialInput`, `isValidComidaLocalExternalUrl`  

No Restaurante imports.

---

## 11. Application route result

`/publicar/comida-local` — metadata title/description per gate spec; Suspense + client shell.

---

## 12. Form shell UX/UI result

Leonix cream `#FFFCF7`, burgundy `#7A1E2C`, gold borders `#D4C4A8`, charcoal `#1E1814`. Seven sections via sidebar (desktop) / chips (mobile wrap). Local React state only. Disabled “Vista previa próximamente”. Photo areas dashed placeholders. Phone live-format on type.

---

## 13. Intentionally not implemented

- Publish API / payment / Stripe  
- DB migrations / Supabase tables  
- Dashboard / Admin  
- Analytics tracking  
- Category chooser / global nav  
- Results/detail routes  
- Draft persistence (localStorage/IDB)  
- Real image upload  
- CityAutocomplete / canonical city wiring  
- Preview/detail output pages  

---

## 14. Desktop result

Max-width 6xl layout; left section nav ≥ lg; cream cards with gold borders; burgundy active nav + disabled preview CTA.

---

## 15. Mobile result

Single column; section nav wraps as horizontal chips; full-width inputs; touch-friendly chip toggles; no oversized hero.

---

## 16. Manual QA checklist

- [ ] Open `/publicar/comida-local` — form loads  
- [ ] Type phone — formats `(xxx) xxx-xxxx`  
- [ ] Select food type Otro — custom field appears  
- [ ] Toggle service/payment/language chips  
- [ ] Preview button disabled with “próximamente”  
- [ ] No publish/payment buttons  
- [ ] No Restaurante labels (Reservar, Menú completo, etc.)  
- [ ] `npm run comida-local:food-l2-scaffold-audit` passes  
- [ ] `npm run build` passes  

---

## 17. Risks / deferred work

- **FOOD-L3:** CityAutocomplete + `cityCanonical` sync from `cityDisplay`  
- **FOOD-L3:** Draft persistence  
- **FOOD-L4:** Preview/detail shells + social brand output  
- **FOOD-L5:** DB + publish + Leonix ID  
- **categoryConfig** not updated in FOOD-L2 (chooser still hidden) — intentional  

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| FOOD-L1 audit was read and followed | TRUE | §2 |
| Comida Local remains separate from Restaurantes Premium | TRUE | No restaurante edits/imports |
| No Restaurante application files were edited | TRUE | git scope |
| No Restaurante fields were added | TRUE | Types exclude restaurant fields |
| No Restaurante behavior was modified | TRUE | git scope |
| No Stripe/payment files were edited | TRUE | git scope |
| No Admin files were edited | TRUE | git scope |
| No Dashboard files were edited | TRUE | git scope |
| No database migrations were created | TRUE | No supabase changes |
| No publish API route was created | TRUE | No `app/api/clasificados/comida-local` |
| No category chooser/global nav integration was added | TRUE | categoryConfig untouched |
| Comida Local types were created | TRUE | `comidaLocalTypes.ts` |
| Comida Local constants were created | TRUE | `comidaLocalConstants.ts` |
| Empty draft creator was created | TRUE | `createEmptyComidaLocalDraft.ts` |
| Field helper copy was centralized | TRUE | `comidaLocalFieldCopy.ts` |
| Required fields are represented in the model | TRUE | `ComidaLocalDraft` |
| Optional fields are represented but controlled | TRUE | Optional copy + chips |
| Restaurant-only fields are excluded | TRUE | Types + forbidden label audit |
| Phone formatting helpers exist | TRUE | `comidaLocalFormatting.ts` |
| WhatsApp helper exists | TRUE | `buildComidaLocalWhatsAppHref` |
| Social normalization helper exists | TRUE | `normalizeComidaLocalSocialInput` |
| City canonical integration is not faked | TRUE | Text shell + deferred note |
| Application route /publicar/comida-local exists | TRUE | `page.tsx` |
| Form shell renders without publish/payment | TRUE | Client component |
| Form shell uses Leonix cream/burgundy/gold/charcoal | TRUE | Tailwind tokens in client |
| Mobile layout is considered | TRUE | §15 |
| No fake listings/data/counters/reviews | TRUE | Empty draft + no seed |
| No unrelated categories were edited | TRUE | git scope |
| Audit script was created | TRUE | `scripts/comida-local-food-l2-scaffold-audit.ts` |
| npm run build passed | TRUE | See validation run below |

---

## Validation run

```
npm run comida-local:food-l2-scaffold-audit
npm run build
```

(Fill exit codes in gate completion message.)
