# Gate REST-FOOD-SELECTOR1 — Strict Routing Selector Only

## 1. Gate title

Gate REST-FOOD-SELECTOR1 — Strict Routing Selector Only

## 2. Preflight status

Clean worktree at gate start.

## 3. Files inspected

- `app/(site)/clasificados/publicar/bienes-raices/page.tsx` (read-only reference)
- `app/(site)/negocios-locales/page.tsx`
- Read-only: `/publicar/restaurantes`, `/publicar/comida-local`, Comida Local lib routes

## 4. Files changed

- `app/(site)/clasificados/publicar/restaurantes/page.tsx` (new selector)
- `app/(site)/negocios-locales/page.tsx` — Restaurantes publish href only
- `app/lib/clasificados/comida-local/COMIDA_LOCAL_REST_FOOD_SELECTOR1_AUDIT.md` (this file)
- `scripts/comida-local-rest-food-selector1-audit.ts` (new)
- `package.json` — audit script only

## 5. Bienes Raíces selector pattern findings

| Item | Pattern |
|------|---------|
| Route | `app/(site)/clasificados/publicar/bienes-raices/page.tsx` |
| Layout | `min-h-screen bg-[#F6F0E2]`, `max-w-lg`, `pt-28 pb-20` |
| Heading | `text-3xl font-extrabold` title + `text-sm` body |
| Cards | `space-y-4`, full-width `Link` blocks, `rounded-2xl p-5` |
| Card anatomy | Uppercase kicker → title → body |
| Card styles | Card 1 plain border; Card 2 gold gradient border |
| Language | `searchParams.lang` → `withLang(path)` appends `?lang=` |
| Mobile | Single column stack, no grid |

Restaurantes selector mirrors this structure one-to-one.

## 6. Restaurantes selector route result

**CREATED** — `/clasificados/publicar/restaurantes?lang=es` (and `en`).

Heading: **Publicar en Restaurantes**  
Subcopy: **Elige el tipo de negocio de comida que quieres publicar en Leonix.**

## 7. Restaurante establecido option result

| Field | Value |
|-------|-------|
| Kicker | ESTABLECIMIENTO |
| Title | Restaurante establecido |
| Description | Para restaurantes, cafés, panaderías, food trucks establecidos y negocios con perfil completo. |
| CTA | Publicar restaurante |
| Href | `/publicar/restaurantes` (+ `lang`) |

## 8. Comida Local option result

| Field | Value |
|-------|-------|
| Kicker | COMIDA LOCAL |
| Title | Puesto, pop-up o vendedor móvil |
| Description | Para puestos, pop-ups, comida casera, vendedores móviles y fines de semana. |
| CTA | Publicar Comida Local |
| Href | `/publicar/comida-local` (+ `lang`) |

## 9. Negocios Locales Restaurantes publish CTA result

`LANE_ADVERTISE_PATH.restaurantes` updated from `/publicar/restaurantes` → `/clasificados/publicar/restaurantes`. Explore href unchanged.

## 10. Existing Comida Local hub card result

**PRESERVED** — `comida-local` lane still points to `/publicar/comida-local` directly (unchanged).

## 11. Mobile result

Same `max-w-lg` + `space-y-4` stack as Bienes Raíces; full-card tap targets; no horizontal overflow.

## 12. What was intentionally not touched

Restaurante application (`/publicar/restaurantes`), Comida Local application, results/detail/preview, API, Supabase, dashboard, admin, Stripe, global nav/search, hub layout/styling beyond single href.

## 13. Risks/deferred work

- Other entry points linking directly to `/publicar/restaurantes` were not changed (out of scope).
- English copy added following existing bilingual selector pattern.

## 14. Manual QA checklist

- [ ] `/clasificados/publicar/restaurantes?lang=es` — two cards visible
- [ ] Card 1 → `/publicar/restaurantes?lang=es`
- [ ] Card 2 → `/publicar/comida-local?lang=es`
- [ ] `/negocios-locales?lang=es` → Restaurantes “Anunciar” → selector
- [ ] Comida Local hub card still → `/publicar/comida-local`
- [ ] Mobile: cards stack cleanly

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| ------------------------------------------------------------------ | ---------- | -------- |
| Bienes Raíces selector pattern was inspected read-only | TRUE | `bienes-raices/page.tsx` |
| Restaurantes publish selector route exists | TRUE | `clasificados/publicar/restaurantes/page.tsx` |
| Selector follows existing selector pattern instead of new polish | TRUE | Same layout/classes as BR |
| Selector includes Restaurante establecido option | TRUE | Card 1 copy |
| Restaurante option links to `/publicar/restaurantes` | TRUE | `REST_PUBLICAR_ESTABLECIDO` |
| Selector includes Comida Local option | TRUE | Card 2 kicker + CTA |
| Comida Local option links to `/publicar/comida-local` | TRUE | `COMIDA_LOCAL_PUBLICAR` |
| Negocios Locales Restaurantes publish CTA points to selector | TRUE | `LANE_ADVERTISE_PATH` |
| Existing Comida Local hub card was preserved | TRUE | Unchanged `comida-local` path |
| Existing Restaurante application was not edited | TRUE | git diff |
| Existing Comida Local application was not edited | TRUE | git diff |
| Existing Comida Local results/detail/preview files were not edited | TRUE | git diff |
| app/api files were not edited | TRUE | git diff |
| Supabase/database migration files were not edited | TRUE | git diff |
| Dashboard/Admin files were not edited | TRUE | git diff |
| Stripe/payment files were not edited | TRUE | git diff |
| No fake listings or seed data were added | TRUE | Static links only |
| No visual polish pass was started | TRUE | BR pattern clone only |
| Mobile selector layout is clean | TRUE | `space-y-4` stack |
| npm run build passed | TRUE | gate validation |

## CROSS-PIPELINE VERIFICATION

Read-only inspection after REST-FOOD-SELECTOR1 (commit `f87830be` scope). Selector gate did **not** edit Restaurante application, Comida Local application, public output, API, or DB layers.

### Restaurante selector route result

**PASS** — `app/(site)/clasificados/publicar/restaurantes/page.tsx`

- Card 1 **Restaurante establecido** → `withLang("/publicar/restaurantes")`
- Card 2 **Comida Local** → `withLang("/publicar/comida-local")`
- Both cards present; route intact; Negocios Locales Restaurantes publish → `/clasificados/publicar/restaurantes`

### Restaurante form result

**INSPECTED READ-ONLY** — `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`, `restauranteTaxonomy.ts`, `restauranteApplicationSectionModel.ts`

| Check | Selector gate impact | Repo state (read-only) |
|-------|---------------------|------------------------|
| Selector did not edit form | **No files changed** | N/A |
| Tipo de negocio options | Unchanged by selector | `RESTAURANTE_BUSINESS_TYPES` still lists `pop_up`, `home_based_food`, `street_vendor` **plus** preserved keys (`food_truck`, `ghost_kitchen`, `catering_only`, `personal_chef`) |
| Modelo de operación | Unchanged by selector | Section B still offers **Ubicación móvil** (`movingVendor`) and **Desde casa** (`homeBasedBusiness`) toggles **and** **Catering y eventos** |
| Sections I / J / K nav | Unchanged by selector | `restauranteApplicationSectionModel.ts` still adds I/J/K when flags set |

**Finding:** Post-cleanup product boundary (remove pop-up/home/stand from Restaurante **Tipo de negocio**; Modelo de operación **only** Catering y eventos) is **not yet implemented** in repo. This is **out of REST-FOOD-SELECTOR1 scope** and **not caused** by the selector gate. Recommend separate **REST-FOOD-CLEANUP** gate on allowed Restaurante paths.

### Restaurante preview/public/mobile output result

**PASS (unchanged by selector)** — read-only mappers still present:

- `mapRestauranteDraftToShell.ts` — `languageOtherCustom` / `businessTypeCustom` via Otro → chips + quick info
- `restauranteFeaturesNormalization.ts` — custom language + business type in public feature blocks
- `buildRestaurantContactHub.ts` — catering/event CTAs when `cateringAvailable` / `eventFoodService`; contact rows gated by `nonEmpty()`
- `mapRestauranteDraftToShell.ts` — catering stack section when flags set
- Empty optional fields hide via `nonEmpty` / conditional stack rows (no fake buttons/reviews/ratings/analytics)

Selector gate did not modify these files.

### Comida Local read-only route result

**PASS** — Comida Local lane intact:

- `/publicar/comida-local` — page + `ComidaLocalApplicationClient` exist; metadata references pop-ups / puestos móviles
- `/clasificados/comida-local` + `[slug]` — results/detail unchanged by selector commit
- Comida Local still owns vendor / pop-up / puesto / mobile / home-food concepts in its own form lane

### Comida Local untouched-files result

**PASS** — Selector commit (`f87830be`) changed only:

- `app/(site)/clasificados/publicar/restaurantes/page.tsx` (selector)
- `app/(site)/negocios-locales/page.tsx` (Restaurantes publish href)
- Audit + script + `package.json`

No edits to `app/(site)/publicar/comida-local/**`, `app/(site)/clasificados/comida-local/**`, or Comida Local lib application files.

### Risk if any

| Risk | Severity | Notes |
|------|----------|-------|
| Restaurante form still offers pop-up/home/stand/mobile stacks | Medium | Product boundary relies on selector routing + future cleanup gate; selector alone does not enforce |
| Dual path: hub Comida Local card + selector card 2 | Low | Intentional; both → `/publicar/comida-local` |
| Legacy Restaurante drafts with removed types (future) | Low | Deferred until cleanup gate |

## Cross-pipeline TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Restaurante selector route was inspected | TRUE | `clasificados/publicar/restaurantes/page.tsx` |
| Selector Restaurante option links to /publicar/restaurantes | TRUE | `REST_PUBLICAR_ESTABLECIDO` + `withLang` |
| Selector Comida Local option links to /publicar/comida-local | TRUE | `COMIDA_LOCAL_PUBLICAR` + `withLang` |
| Restaurante form route was inspected | TRUE | `RestauranteApplicationClient.tsx` read-only |
| Comida Local form route was inspected read-only | TRUE | `publicar/comida-local/page.tsx` |
| Comida Local results/detail/preview routes were inspected read-only | TRUE | `clasificados/comida-local/**` |
| Comida Local files were not edited | TRUE | `f87830be` file list |
| Comida Local still owns pop-up/home/stand/mobile-vendor concepts | TRUE | Comida Local publish metadata + form lane |
| Restaurante output was checked after form cleanup | TRUE | Mappers unchanged; `mapRestauranteDraftToShell` |
| Restaurante mobile output was checked after form cleanup | TRUE | `movingVendor` stack + shell mapping unchanged |
| Restaurante custom language output was verified | TRUE | `languageOtherCustom` in shell + features |
| Restaurante catering output was verified | TRUE | `cateringEventsStack` + contact hub |
| Empty fields still hide from public output | TRUE | `nonEmpty` gating in contact hub / shell |
| No fake output was added | TRUE | No selector changes to public renderers |
