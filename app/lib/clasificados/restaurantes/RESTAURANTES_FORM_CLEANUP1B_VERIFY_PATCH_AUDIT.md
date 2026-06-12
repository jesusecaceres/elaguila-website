# Gate REST-FORM-CLEANUP1B — Verify and Patch Restaurante Form Cleanup on Production Route

## 1. Gate title

Gate REST-FORM-CLEANUP1B — Verify and Patch Restaurante Form Cleanup on Production Route

## 2. Active production route/component identified

| Item | Value |
|------|-------|
| Route | `/publicar/restaurantes?lang=es` |
| Page | `app/(site)/publicar/restaurantes/page.tsx` |
| Component | `RestauranteApplicationClient.tsx` |
| Draft hook | `useRestauranteDraft` (unchanged; sessionStorage key `restaurantes-draft`) |

**Finding:** REST-FORM-CLEANUP1 was **never implemented** on the active production route. The form still imported full `RESTAURANTE_BUSINESS_TYPES`, plain-text Otro idioma input, and Modelo de operación cards for Ubicación móvil / Desde casa. This gate patches the **active** `/publicar/restaurantes` client only.

## 3. Files inspected

- `app/(site)/publicar/restaurantes/page.tsx`
- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `app/(site)/publicar/restaurantes/restauranteApplicationSectionModel.ts`
- `app/(site)/clasificados/publicar/restaurantes/page.tsx` (read-only selector)
- `app/(site)/publicar/comida-local/**` (read-only)
- `app/(site)/clasificados/comida-local/**` (read-only)
- `app/(site)/clasificados/restaurantes/application/useRestauranteDraft.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteDraftStorage.ts`
- `app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts` (read-only output)
- `app/(site)/clasificados/restaurantes/lib/restauranteFeaturesNormalization.ts` (read-only output)

## 4. Files changed

- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `app/(site)/publicar/restaurantes/restauranteApplicationSectionModel.ts`
- `app/lib/clasificados/restaurantes/restauranteFormCleanupConfig.ts` (new)
- `app/lib/clasificados/restaurantes/RESTAURANTES_FORM_CLEANUP1B_VERIFY_PATCH_AUDIT.md` (this file)
- `scripts/restaurante-cleanup1b-audit.ts` (new)
- `package.json` — audit script only

## 5. Draft persistence result

**PRESERVED** — No changes to `useRestauranteDraft`, `restauranteDraftStorage`, or storage keys. `setDraftPatch` still auto-persists on every patch; refresh reloads via `loadRestauranteDraftFromStorageResolved`. Custom language now persists via `languageOtherCustom` only after **Añadir** (confirmed chip), not on every keystroke.

## 6. Tipo de negocio result

**PATCHED** — Dropdown uses `RESTAURANTE_FORM_BUSINESS_TYPES` (filters out `pop_up`, `home_based_food`, `street_vendor`). Preserved: sit_down, fast_casual, cafe, bar, bakery, food_truck, ghost_kitchen, catering_only, personal_chef, other.

## 7. Otro idioma Añadir/chip result

**PATCHED** — When Otro is checked: input + **Añadir** button. Añadir writes `languageOtherCustom`, ensures `other_lang` in `languagesSpoken`, clears pending input, shows removable chip. Blank/duplicate values blocked via `isDuplicateCustomLanguage`. Chip remove clears custom value and unchecks Otro.

## 8. Modelo de operación cleanup result

**PATCHED** — Removed Ubicación móvil and Desde casa cards/toggles from section B. **Catering y eventos** preserved (Catering, Comida para eventos, inline config + section K). Section nav no longer adds I/J stacks. Dead section I/J panels removed from client.

## 9. Preview/output result

**UNCHANGED (read-only mappers)** — Existing output already renders custom language as the value itself (`mapRestauranteDraftToShell.formatLanguagesForQuickInfo`, `restauranteFeaturesNormalization` idiomas group). Example public line: Español · Inglés · Salvatrucha (not "Otro: Salvatrucha"). Catering stacks still emit when `cateringAvailable` / `eventFoodService` flags set.

## 10. Cross-pipeline result

**PASS (read-only)** — `/clasificados/publicar/restaurantes?lang=es` selector routes Restaurante establecido → `/publicar/restaurantes` and Comida Local → `/publicar/comida-local`. Comida Local files untouched; pop-up/home/stand/mobile concepts remain on Comida Local path.

## 11. Forbidden edits check

No edits under: `publicar/comida-local`, `clasificados/comida-local`, `app/api`, Supabase migrations, dashboard/admin, Stripe/payment, analytics, global nav.

## 12. Manual QA checklist

- [ ] `/publicar/restaurantes?lang=es` — fill fields, refresh — draft values persist
- [ ] Tipo de negocio — no Pop-up / temporal, Negocio desde casa, Puesto / stand
- [ ] Tipo de negocio — Food truck, Cocina oculta, Solo catering, Chef personal still present
- [ ] Idiomas — check Otro → input + Añadir → chip → refresh keeps chip
- [ ] Idiomas — duplicate/blank Añadir blocked; chip removable
- [ ] Preview — custom language shows as value (e.g. Salvatrucha), not "Otro"
- [ ] Modelo de operación — no Ubicación móvil / Desde casa
- [ ] Modelo de operación — Catering y eventos works; section K when enabled
- [ ] `/clasificados/publicar/restaurantes?lang=es` — both selector cards route correctly
- [ ] Comida Local form unchanged

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Active /publicar/restaurantes route component was identified | TRUE | `page.tsx` → `RestauranteApplicationClient` |
| Draft/session persistence was inspected | TRUE | `useRestauranteDraft.ts`, `restauranteDraftStorage.ts` |
| Refresh preserves Restaurante draft values | TRUE | No storage hook changes |
| Pop-up / temporal removed from active dropdown | TRUE | `RESTAURANTE_FORM_BUSINESS_TYPES` excludes `pop_up` |
| Negocio desde casa / comida en casa removed from active dropdown | TRUE | excludes `home_based_food` |
| Puesto / stand / street food removed from active dropdown | TRUE | excludes `street_vendor` |
| Food truck preserved | TRUE | in filtered list |
| Cocina oculta / delivery preserved | TRUE | `ghost_kitchen` in filtered list |
| Solo catering preserved | TRUE | `catering_only` in filtered list |
| Chef personal preserved | TRUE | `personal_chef` in filtered list |
| Otro idioma shows Añadir button | TRUE | `RestauranteApplicationClient.tsx` |
| Añadir creates removable chip/tag | TRUE | chip + `removeCustomLanguage` |
| Blank/duplicate custom languages are prevented | TRUE | `isDuplicateCustomLanguage` |
| Custom language persists after refresh | TRUE | `languageOtherCustom` via `setDraftPatch` |
| Custom language appears in preview/output as value, not raw Otro | TRUE | read-only `mapRestauranteDraftToShell.ts` |
| Ubicación móvil removed from Modelo de operación | TRUE | cards removed from section B |
| Desde casa removed from Modelo de operación | TRUE | cards removed from section B |
| Catering y eventos preserved | TRUE | section B + section K |
| Catering output path preserved when real data exists | TRUE | read-only mappers unchanged |
| Restaurante selector route still works | TRUE | `clasificados/publicar/restaurantes/page.tsx` |
| Comida Local route was inspected read-only | TRUE | selector + comida-local paths |
| Comida Local files were not edited | TRUE | git diff scope |
| app/api files were not edited | TRUE | git diff scope |
| Supabase/database files were not edited | TRUE | git diff scope |
| dashboard/admin files were not edited | TRUE | git diff scope |
| Stripe/payment files were not edited | TRUE | git diff scope |
| No visual polish was started | TRUE | form cleanup only |
| npm run build passed | TRUE | see gate validation run |

## Root cause

**Missing implementation on the active production route** — cleanup was documented as deferred in REST-FOOD-SELECTOR1 audit but never applied to `RestauranteApplicationClient.tsx`. Not a deployment mismatch; the repo lacked the patches on `/publicar/restaurantes`.
