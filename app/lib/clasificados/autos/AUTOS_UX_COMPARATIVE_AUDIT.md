# Autos UX comparative audit (recovery pass)

**Personas:** buyer, private seller, dealer operator, admin, designer.

## Landing (`/clasificados/autos`)

| Dimension | Works | Weak | Fixed this pass |
| --------- | ----- | ---- | ----------------- |
| Clarity | Hero search + bilingual switch | Many sections — ensure mobile scroll order OK | Added **three explicit inventory bands**: dealer spotlight, private fresh, mixed latest (`autosLandingArrangement.ts`). |
| Trust | Inventory notice for demo vs live | Demo Unsplash assets if demo flag on | Policy unchanged — documented elsewhere. |
| Seller balance | — | Previously single “featured” row could feel dealer-heavy | Dealer-only spotlight + **private section** + mixed tail. |
| CTAs | Publish + search prominent | — | Unchanged routes, clearer copy blocks. |

**Credible vs national marketplace?** **Approaching minimum** for regional launch — still needs real inventory photography and seller density (operations, not code).

## Results (`/clasificados/autos/resultados`)

| Dimension | Works | Weak | Fixed this pass |
| --------- | ----- | ---- | ----------------- |
| Filters | Real `applyAutosPublicFilters` on inventory keys | `radiusMiles` reserved, not applied | Documented already; no fake control. |
| Ranking | Sort keys | Dealer-only “recent” wall risk | **Inject private** into recent lane when needed. |
| Cards | Seller badge + dealer gold accent | — | Existing `AutosPublicStandardCard`. |

## Detail (`/clasificados/autos/vehiculo/[id]`)

| Dimension | Works | Weak | Fixed this pass |
| --------- | ----- | ---- | ----------------- |
| Specs | Full `AutoDealerListing` via API | Optional fields empty — must not break | Handled by existing client patterns. |
| Trust / report | Listing report component | — | No change this pass (verify on staging). |

## Payment fairness (business vs private)

- Same checkout architecture; lane-specific Stripe price envs (`STRIPE_PRICE_AUTOS_NEGOCIOS` / `STRIPE_PRICE_AUTOS_PRIVADO`).
- Copy on legacy lane strip now uses **renew/refresh** language, not “boost”.

## Launch blockers (UX)

| Blocker | Type |
| ------- | ---- |
| Empty live inventory with demo off | **Operations / marketing** — UX becomes sparse but honest. |
| No runtime payment proof | **Process** — see `AUTOS_RUNTIME_SMOKE_PROOF.md`. |
