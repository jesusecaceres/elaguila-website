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
