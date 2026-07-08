# GLOBAL-PAID-CATEGORY-PIPELINE-NEXT-BUILD-ORDER-01

Companion to `docs/global-paid-category-pipeline-coverage-audit-and-gap-matrix-01.md`.
Ranked implementation order using CEO/CFO/launch logic, evidence-driven from the coverage matrix.

---

## Ranking logic

- **Revenue impact** — does it unlock or protect paid/add-on revenue?
- **Proven-pattern reuse** — can we clone an already-REAL loop (Restaurantes/Servicios/Bienes) cheaply and safely?
- **User-facing risk** — does a gap cause confusing/fake UX today?
- **Blast radius** — Stripe/webhook/migration exposure.

---

## Recommended next 5 gates

### Gate 1 — Regression watch: BR inventory pack + global preview safety
- **Why next:** Most recently landed runtime (`REVENUE-OS-BR-INVENTORY-PACK-FULFILLMENT-AND-GLOBAL-PREVIEW-SAFETY-01`). Confirm no regression before building new lanes on top.
- **Target category/pipelines:** Bienes negocio + child inventory; Restaurantes/Servicios/Bienes dashboard preview CTAs.
- **Target files:** `app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts`, `app/(site)/dashboard/lib/dashboardInventory.ts`, `AgenteIndividualResidencialApplication.tsx`, `RevenueOsPagoResultView.tsx`.
- **Risk level:** Low.
- **QA required:** Light manual QA of the 3 dashboard URLs + Stripe sandbox for inventory pack success return.
- **Smoke enough:** Existing verifiers/smoke largely cover; add targeted preview-identity assertions only if a regression appears.
- **Stripe/webhook touched:** No (verify existing path only).
- **Expected outcome:** Green confirmation the newest gate holds; unblock building new add-on lanes.

### Gate 2 — Autos dealer inventory add-on parity
- **Why next:** Biggest concrete add-on revenue gap — dealer child vehicle inventory is UI-only ("checkout soon"), no package key, no entitlement. Clone the proven Bienes inventory-pack fulfillment pattern.
- **Target category/pipelines:** Autos dealer parent lane (1.9) + child vehicle inventory lane (1.10).
- **Target files:** `app/lib/listingPlans/revenuePricingMatrix.ts` (add `autos_dealer_inventory_pack` key + price lock), `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts`, `app/lib/clasificados/autos/autosInventoryBoostPipeline.ts`, `AutosNegociosInventoryBoostPanel.tsx`, dashboard autos surfaces; align to `/api/revenue-os/checkout`.
- **Risk level:** Medium (Autos currently on separate native Stripe system — must reconcile without breaking native car checkout).
- **QA required:** Yes — full add-on-only checkout + entitlement + child render + no base recharge.
- **Smoke enough:** No — needs QA + smoke.
- **Stripe/webhook touched:** Stripe checkout payload + entitlement fulfillment (reuse generic path; do not alter webhook raw body/signature).
- **Expected outcome:** Dealer +10 vehicle add-on becomes REAL with entitlement truth (no fake activation).

### Gate 3 — Ofertas Locales monetization + AI Searchable Specials add-on
- **Why next:** Highest-value UI-only surface — full AI/flyer/coupon product logic already built, zero monetization. Wire base + specials add-on into Revenue OS.
- **Target category/pipelines:** Ofertas flyer/supermarket (1.11), coupon/promo (1.12), AI searchable specials (1.13).
- **Target files:** `revenuePricingMatrix.ts` (add ofertas base + specials keys), `revenueCategoryCheckoutPayload.ts`, `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`, owner/dashboard surfaces; keep `status=approved` public gating.
- **Risk level:** Medium-High (new category monetization + AI review gating interplay).
- **QA required:** Yes — checkout + entitlement + scan/review + approved-only public render.
- **Smoke enough:** No.
- **Stripe/webhook touched:** Stripe payload + entitlement (generic path).
- **Expected outcome:** Ofertas specials becomes a paid add-on with honest review/public gating.

### Gate 4 — Clases free/paid conditional checkpoint
- **Why next:** Mixed free/paid category with matrix keys but no checkout payload or free-vs-paid entry branch. Small, contained, launch-relevant.
- **Target category/pipelines:** Clases free (1.14), Clases paid (1.15).
- **Target files:** `revenueCategoryCheckoutPayload.ts` (add `CLASES_PAID_CHECKOUT`), Clases publish/checkpoint components, `revenuePricingMatrix.ts` price lock.
- **Risk level:** Low-Medium.
- **QA required:** Yes — free class publishes free; paid class routes to Stripe with correct amount.
- **Smoke enough:** Partial — smoke for payload branch + light QA.
- **Stripe/webhook touched:** Stripe payload only (generic path).
- **Expected outcome:** Conditional Stripe on paid class; free class stays free with no Stripe.

### Gate 5 — Category checkpoint parity sweep (Ver más / rules / entry checkpoint)
- **Why next:** After the revenue lanes, standardize entry checkpoints + Ver más + Leonix rules popup across remaining paid/mixed lanes (Autos, Empleos, Rentas, Bienes FSBO) to the shared checkpoint standard.
- **Target category/pipelines:** Autos privado/dealer, Empleos paid, Rentas, Bienes FSBO.
- **Target files:** `publishCheckoutCheckpoint.ts`, `PublishCheckoutCheckpoint.tsx`, per-category application entry components.
- **Risk level:** Medium (touches multiple category entry flows).
- **QA required:** Yes — checkpoint UX per category; preview never blocked; final confirm gates payment.
- **Smoke enough:** Partial.
- **Stripe/webhook touched:** No (checkpoint UX + existing payload).
- **Expected outcome:** Uniform entry/final checkpoint parity across paid lanes; newsletter/promo capture becomes a clean follow-on gate.

---

## Deferred (after top 5)

- **Newsletter + 10% welcome promo capture** (`PUBLISH-CHECKOUT-NEWSLETTER-PROMO-CAPTURE-01`) — needs server-safe promo generation/redemption; do after checkpoint parity so the opt-in has a consistent home.
- **Viajes paid business + affiliate separation** — blueprint only until owner pricing locks.
- **Free-category checkpoint parity** (Comunidad, Busco, Mascotas, En Venta) — low risk, low revenue; batch last.

---

## TRUE/FALSE Audit

| Check | Result |
|-------|--------|
| next 5 gates listed | TRUE |
| each gate has why/target/risk/QA | TRUE |
| order is evidence-driven | TRUE |
| no implementation started | TRUE |
| Stripe/webhook exposure flagged per gate | TRUE |

READY TO COMMIT: YES
