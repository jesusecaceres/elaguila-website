# Gate REST-FORM-CLEANUP2 — Languages, Service Modes, and Contact Section Organization

**Gate type:** STRICT FORM CLARITY + OUTPUT VERIFICATION — BUILD REQUIRED AT END

## Preflight status

- Active route: `/publicar/restaurantes?lang=es` → `app/(site)/publicar/restaurantes/page.tsx` → `RestauranteApplicationClient.tsx`
- Comida Local pipeline read-only confirmed (pop-up/home/stand/mobile-vendor not mixed into Restaurante)

## Files inspected

- `app/(site)/publicar/restaurantes/page.tsx`
- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `app/(site)/publicar/restaurantes/restauranteApplicationSectionModel.ts`
- `app/lib/clasificados/restaurantes/restauranteFormCleanupConfig.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts`
- `app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft.ts`
- `app/(site)/clasificados/restaurantes/application/useRestauranteDraft.ts`
- `app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts`
- `app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts`
- `app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteTaxonomy.ts`
- `app/(site)/clasificados/restaurantes/lib/restauranteFeaturesNormalization.ts`
- `app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingMapper.ts`
- `app/(site)/clasificados/restaurantes/shell/restaurantContactHubSocialBrand.tsx` (read-only)
- Comida Local paths (read-only)

## Files changed

- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `app/lib/clasificados/restaurantes/restauranteFormCleanupConfig.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts`
- `app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft.ts`
- `app/(site)/clasificados/restaurantes/application/useRestauranteDraft.ts`
- `app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts`
- `app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts`
- `app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteTaxonomy.ts`
- `app/(site)/clasificados/restaurantes/lib/restauranteFeaturesNormalization.ts`
- `app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingMapper.ts`
- `scripts/restaurantes-form-cleanup2-audit.ts`
- `package.json` (audit script only)
- `app/lib/clasificados/restaurantes/RESTAURANTES_FORM_CLEANUP2_AUDIT.md`

## Gate A result — multiple custom languages

Added `customLanguages: string[]` (max 3) with `resolveRestauranteCustomLanguages`, multi-chip UI, Añadir + individual remove. Legacy `languageOtherCustom` maps to first chip on merge. Preview/shell/features output all custom values without raw “Otro”.

## Gate B result — service modes consolidation

Removed duplicate “Opciones de servicio (detalles complementarios)” block and pop-up from form. Single **Modos y servicios disponibles** checklist via `RESTAURANTE_FORM_SERVICE_OPTIONS`. Legacy boolean flags migrate into canonical `serviceModes` on merge. Section K catering stack preserved.

## Gate C result — contact section organization and social platform set

Section D reorganized into: Contacto principal, Redes sociales (+ Snapchat, X/Twitter), Opiniones / reputación, Acciones de restaurante. Contact hub emits snapchat + X social links with existing branded icons.

## Draft/session persistence result

`setDraftPatch` + `mergeRestauranteDraft` normalize `customLanguages`, service modes, and new social fields. Refresh reloads all chips and grouped contact values.

## Preview/output result

`mapRestauranteDraftToShell` and `restauranteFeaturesNormalization` emit all custom languages and consolidated services (including Recogida/Reservas flags). Contact hub includes new social platforms when URLs filled.

## Public detail output result

Same mappers/shell path as preview; empty social/review/menu actions hide. No raw URLs in quick-info language line.

## Comida Local read-only pipeline result

No Comida Local files edited. Pop-up remains Comida Local concept only.

## Business Hub standard alignment result

Data-driven contact actions; social icons only when URL present; platform-branded icons via existing `restaurantContactHubSocialBrand.tsx`; reviews and menu actions grouped with contact presence.

## What was intentionally not touched

- Comida Local application and output
- `app/api/**` (publish route reads merged draft; no API edits)
- Supabase/database migrations
- Dashboard/admin, Stripe, analytics
- Public detail visual redesign
- Photo/video media behavior (except prior video-url gate)

## Risks/deferred work

- Old published listings with `pop_up` in stored `serviceModes` may still render until republished (merge strips on next edit).
- `preorderRequired` boolean no longer exposed in Section B UI (legacy value preserved in draft/payload if previously set).

## Manual QA checklist

- [ ] `/publicar/restaurantes?lang=es` — check Otro, add 2–3 custom languages, refresh, confirm chips persist
- [ ] Preview quick-info languages line shows `Español · Inglés · Salvatrucha · Portugués` (no “Otro”)
- [ ] Section B — single service checklist; no Pop-up; Recogida/Reservas toggle; catering stack K still unlocks
- [ ] Section D — four groups visible; Snapchat + X fields save and appear as social icons in preview when filled
- [ ] Empty social URLs show no icons; filled URLs open platform directly
- [ ] Comida Local publish path unchanged

## Gate A TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- |
| Idiomas section was inspected | TRUE | RestauranteApplicationClient Section A |
| Multiple custom language chips are supported | TRUE | `customLanguages[]` + multi-chip UI |
| Max custom language limit exists | TRUE | `RESTAURANTE_MAX_CUSTOM_LANGUAGES = 3` |
| Añadir button remains | TRUE | Section A Otro input |
| Blank custom language blocked | TRUE | `addCustomLanguage` trim guard |
| Duplicate custom language blocked | TRUE | `isDuplicateCustomLanguage` |
| Custom language chips can be removed individually | TRUE | `removeCustomLanguageAt(index)` |
| Custom languages persist after refresh | TRUE | `mergeRestauranteDraft` + storage |
| Existing languageOtherCustom backward compatibility preserved | TRUE | merge maps legacy → `customLanguages[0]` |
| Preview outputs all custom language values | TRUE | `formatLanguagesForQuickInfo` |
| Public detail outputs all custom language values | TRUE | same shell mappers |
| Public output does not show raw Otro placeholder | TRUE | skips `other_lang` key in output |
| Mobile output/chips do not overflow | TRUE | `flex flex-wrap gap-2` on chips |

## Gate B TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- |
| Section B service fields were inspected | TRUE | RestauranteApplicationClient Section B |
| Duplicate service question structure was removed or consolidated | TRUE | complementarios block removed |
| One clear service modes checklist remains | TRUE | Modos y servicios disponibles |
| Pop-up removed from Restaurante service modes | TRUE | excluded from `RESTAURANTE_FORM_SERVICE_OPTIONS` |
| Catering preserved | TRUE | checklist + stack K |
| Eventos preserved | TRUE | checklist + stack K |
| Food truck preserved | TRUE | `food_truck` mode |
| Chef personal preserved | TRUE | `personal_chef` mode |
| Meal prep preserved | TRUE | `meal_prep` mode |
| Reservas preserved | TRUE | `reservationsAvailable` flag option |
| Old draft values are handled safely | TRUE | `migrateRestauranteServiceModesAndFlags` |
| Preview service output still works | TRUE | `formatServiceModesForQuickInfo` |
| Public detail service output still works | TRUE | `restauranteFeaturesNormalization` |
| Empty service fields hide from public output | TRUE | empty arrays omit quick-info rows |
| Comida Local files were not edited | TRUE | git scope check |

## Gate C TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- |
| Section D Contacto y CTAs was inspected | TRUE | RestauranteApplicationClient Section D |
| Contacto principal group exists | TRUE | grouped card |
| Redes sociales group exists | TRUE | grouped card |
| Instagram URL field exists | TRUE | form + model |
| Facebook URL field exists | TRUE | form + model |
| TikTok URL field exists | TRUE | form + model |
| YouTube URL field exists | TRUE | form + model |
| Snapchat URL field exists | TRUE | `snapchatUrl` |
| X/Twitter URL field exists | TRUE | `xTwitterUrl` |
| LinkedIn was not added | TRUE | no field |
| Pinterest was not added | TRUE | no field |
| Social output uses real/recognizable platform icons where rendered | TRUE | `restaurantContactHubSocialBrand.tsx` |
| Social icons hide when URLs are empty | TRUE | `addSocial` guard in contact hub |
| Social icons open direct platform URLs | TRUE | hub `social[].url` |
| Opiniones / reputación group exists | TRUE | grouped card |
| Google/Yelp are grouped near social/presence fields | TRUE | section order |
| Acciones de restaurante group exists | TRUE | grouped card |
| Menu URL and menu file are grouped together | TRUE | same Acciones card |
| Existing contact/social/review/menu field keys are preserved or safely mapped | TRUE | keys unchanged + new social keys |
| Draft/session persistence still works | TRUE | useRestauranteDraft + merge |
| Preview still receives contact/social/review/menu values | TRUE | buildRestaurantContactHub |
| Public detail still receives contact/social/review/menu values | TRUE | same mappers |
| Empty contact/social/review/menu actions hide from public output | TRUE | nonEmpty guards |
| No fake social/review/menu links added | TRUE | data-driven only |
| No public detail visual polish started | TRUE | form/output only |
| No Comida Local files edited | TRUE | scope check |
| npm run build passed | TRUE | see build log in gate completion report |
