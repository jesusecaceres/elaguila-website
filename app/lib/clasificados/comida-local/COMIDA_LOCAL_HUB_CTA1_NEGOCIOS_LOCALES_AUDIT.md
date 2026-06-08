# Gate HUB-CTA1 — Add Comida Local CTA to Negocios Locales

## 1. Gate title

Gate HUB-CTA1 — Add Comida Local CTA to Negocios Locales

## 2. Preflight status

Clean worktree at gate start — no unrelated dirty files.

## 3. Files inspected

- `app/(site)/negocios-locales/page.tsx` (sole hub renderer for `/negocios-locales`)
- Read-only: `/publicar/comida-local`, `/clasificados/comida-local` routes (paths confirmed)

## 4. Files changed

- `app/(site)/negocios-locales/page.tsx` — added `comida-local` lane card
- `app/lib/clasificados/comida-local/COMIDA_LOCAL_HUB_CTA1_NEGOCIOS_LOCALES_AUDIT.md` (this file)
- `scripts/comida-local-hub-cta1-negocios-locales-audit.ts` (new)
- `package.json` — audit script only

## 5. Existing hub card pattern

Hub uses `BusinessLaneKey` + `LANE_ORDER` + `LANE_COPY` + `LANE_EXPLORE_PATH` / `LANE_ADVERTISE_PATH`. Each sector renders `BusinessLaneCard` in a `grid-cols-1 sm:grid-cols-2` list with explore (gold outline) + advertise (burgundy) buttons. Language via `?lang=es|en` on hrefs.

## 6. Comida Local entry result

**ADDED** — Fifth sector card after Restaurantes, before Concesionarios. Separate lane key `comida-local` (not nested in Restaurantes).

| Lang | Title | Description |
|------|-------|-------------|
| ES | Comida Local | Puestos, pop-ups, comida casera y vendedores móviles para la comunidad. |
| EN | Local Food | Pop-ups, homemade food, mobile vendors, and local food sellers. |

## 7. Explore link result

`LANE_EXPLORE_PATH["comida-local"]` → `/clasificados/comida-local` (+ `?lang=` via `appendLangToPath`). Button label uses shared `t.explore` (“EXPLORAR” / “EXPLORE”) consistent with other cards.

## 8. Publish link result

`LANE_ADVERTISE_PATH["comida-local"]` → `/publicar/comida-local` (+ `?lang=`). Button label: “Publicar tu puesto” / “Publish your stand”.

## 9. Mobile result

Card uses same `BusinessLaneCard` flex column + full-width `min-h-[2.5rem]` buttons. Grid remains `grid-cols-1` on mobile — fifth card stacks cleanly; no layout changes to grid or overflow handling.

## 10. What was intentionally not touched

Comida Local app/results/preview/detail, Restaurante, API, Supabase, dashboard, admin, Stripe, global search, pricing, hero copy, other sector cards/routes.

## 11. Risks/deferred work

- Hero description still lists four sectors (not Comida Local) — intentional minimal scope.
- English explore label remains uppercase “EXPLORE” like other lanes.

## 12. Manual QA checklist

- [ ] Open `/negocios-locales?lang=es`
- [ ] Comida Local card visible with correct title/description
- [ ] EXPLORAR → `/clasificados/comida-local?lang=es`
- [ ] Publicar tu puesto → `/publicar/comida-local?lang=es`
- [ ] `/negocios-locales?lang=en` — Local Food card + English buttons
- [ ] Servicios, Restaurantes, Autos, Bienes Raíces cards unchanged
- [ ] Mobile: card stacks, buttons tappable, no horizontal scroll

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Negocios Locales hub was inspected | TRUE | `negocios-locales/page.tsx` |
| Comida Local entry point was added to Negocios Locales | TRUE | `comida-local` in `LANE_ORDER` |
| Explore link points to `/clasificados/comida-local` | TRUE | `LANE_EXPLORE_PATH` |
| Publish link points to `/publicar/comida-local` | TRUE | `LANE_ADVERTISE_PATH` |
| Existing Servicios card behavior was preserved | TRUE | Unchanged lane config |
| Existing Restaurantes card behavior was preserved | TRUE | Unchanged lane config |
| Existing Autos/Concesionarios card behavior was preserved | TRUE | Unchanged lane config |
| Existing Bienes Raíces card behavior was preserved | TRUE | Unchanged lane config |
| Comida Local was not added inside Restaurante form | TRUE | Separate lane key |
| Comida Local application files were not edited | TRUE | git diff |
| Comida Local results/detail/preview files were not edited | TRUE | git diff |
| Restaurante files were not edited | TRUE | git diff |
| app/api files were not edited | TRUE | git diff |
| Supabase/database migration files were not edited | TRUE | git diff |
| Dashboard/Admin files were not edited | TRUE | git diff |
| Stripe/payment files were not edited | TRUE | git diff |
| No fake listings or seed data were added | TRUE | Hub link only |
| Mobile layout remains clean | TRUE | Same card/grid pattern |
| npm run build passed | TRUE | gate validation |
