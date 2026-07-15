# AUTOS DEALER PACKAGE UX READINESS

## Bug found

In the Autos Negocios dealer application (inventory/package step), clicking **“Add 10 slots for $129/month”** opened the Inventory Boost panel and could redirect to Stripe checkout **before** the seller finished the application. That felt like immediate payment instead of selecting an add-on option.

## What changed

| Area | Change |
|------|--------|
| **Boost button (pre-publish)** | Local toggle — selects/unselects Inventory Boost in draft state; no Stripe redirect |
| **Pricing summary** | Inline summary shows $399 base, optional +$129 boost, $528 total when selected |
| **Vehicle limit** | Draft selection updates local cap from 10 → 20 active vehicles |
| **Final review** | Package summary block reflects selected total before preview |
| **Draft persistence** | `inventoryBoostSelected` stored in `AutosNegociosDraftV1` |
| **Copy** | ES/EN labels for add, selected state, remove, and payment-after-preview note |

## Post-publish / dashboard (unchanged)

Published dealers adding inventory pack from dashboard still use the existing checkout path (`AutosNegociosInventoryBoostPanel` + `redirectAutosDealerInventoryPackCheckout`). That is separate from the pre-publish application UX fix.

## Intentionally out of scope

- Stripe checkout routes
- Stripe webhooks
- Revenue OS payment server logic
- Checkout math on the server
- Preview page payment/checkout UI (handled in payment/Stripe workstream)
- Supabase migrations

## Manual QA steps

1. Open Autos dealer application (ES or EN).
2. Go to inventory/package step (Paso 7).
3. Confirm total starts at **$399/month** and **10** active vehicles.
4. Click **“Add 10 slots for $129/month”** — must **not** open Stripe.
5. Confirm total updates to **$528/month** and selected badge appears.
6. Click **“Remove inventory boost”** — total returns to **$399/month**.
7. Add a vehicle to inventory — drawer still works.
8. Continue to final review — package summary matches selection.
9. Continue to preview — no payment behavior changed by this gate.

## Manual QA URLs

- https://www.leonixmedia.com/publicar/autos/negocios?lang=en
- https://www.leonixmedia.com/publicar/autos/negocios?lang=es

Verifier: `npm run autos:dealer-package-ux-readiness`
