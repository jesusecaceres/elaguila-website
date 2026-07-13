# A5.MONETIZATION-03 — Autos Inventory Boost Locked-Site Draft Return Fix

## Gate title

A5.MONETIZATION-03 — Autos Inventory Boost Locked-Site Draft Return Fix

## Correct repo confirmation

`C:/projects/elaguila-website` (Leonix / El Águila)

## Files inspected

- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBoostPanel.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/lib/clasificados/autos/autosDealerInventoryBoostCheckoutClient.ts`
- `app/lib/clasificados/autos/autosInventoryBoostPipeline.ts`
- `app/api/clasificados/autos/inventory-pack/checkout/route.ts`
- `app/(site)/revenue-os/pago/exito/page.tsx`
- `app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx`
- `app/lib/listingPlans/revenueCheckout.ts` (read-only)
- `app/lib/listingPlans/revenueOsReturnPath.ts` (read-only)
- `app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts` (read-only)

## Files changed

- `app/lib/clasificados/autos/autosDealerInventoryBoostReturnContract.ts` (new)
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBoostPanel.tsx`
- `app/api/clasificados/autos/inventory-pack/checkout/route.ts`
- `app/(site)/revenue-os/pago/exito/page.tsx`
- `app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx`
- `scripts/autos-a5-monetization-03-inventory-boost-locked-site-draft-return-audit.ts` (new)
- `package.json` (verifier script only)

## Existing failure

Draft Autos Negocios Inventory Boost checkout returned to `/revenue-os/pago/exito` with `return_to` set to the editor path, but `resolveAutosDealerInventoryPackSuccessPrimaryCta` always routed the primary CTA to dashboard-style **Manage inventory** (`autosDealerInventoryEditHref` with `source=dashboard`). On a locked/gated site, draft users could not recover their unpublished application through normal navigation.

## New return source contract

| Source | Detection | Primary return |
|--------|-----------|----------------|
| `draft` | `boost_source=draft` on success URL, or `/publicar/autos/negocios` without `source=dashboard` | Same Autos Negocios draft application with `focus=inventory-pack` |
| `dashboard` / `manage_inventory` | `source=dashboard` on return path; inventory modes map to `manage_inventory` | `autosDealerInventoryEditHref` or validated `return_to` |
| `unknown` | Missing/invalid context | Safe `return_to` when valid internal Autos path; otherwise Manage inventory |

Metadata/query: `category=autos`, `package_key=autos_dealer_inventory_pack_monthly`, `return_to=<safe relative URL>`, `boost_source=draft` for pre-publish checkout, `lang`. No draft payload in Stripe metadata or URL.

## Draft return behavior

- Success primary CTA: **Return to application** / **Regresar a la solicitud**
- Return URL: validated `/publicar/autos/negocios?...&focus=inventory-pack&lang=...`
- Draft data remains in session/local storage; only listing id used for entitlement lookup
- Secondary CTA: dashboard (not primary)

## Dashboard/manage return behavior

- Unchanged primary CTA: **Manage inventory** / **Administrar inventario**
- Uses `autosDealerInventoryEditHref` or dashboard `return_to` when `source=dashboard`
- Does not force published users into unpublished draft route

## Locked-site safety

- Draft source never defaults primary CTA to dashboard
- `sanitizeRevenueOsReturnPath` blocks external `return_to`
- Pre-publish checkout appends `boost_source=draft` explicitly
- No public locked navigation required to recover draft

## Boost active/read behavior

- Webhook remains source of truth for `listing_package_entitlements`
- Application reads entitlement via `fetchAutosDealerInventoryPackEntitlementActive`
- `focus=inventory-pack` triggers honest pending state until webhook completes
- Limit becomes 20 only when entitlement is active; failed/cancelled checkout does not unlock 20
- Only $129 inventory pack charged on this flow (add-on-only checkout)

## Test mode behavior

Stripe test checkout via `/api/clasificados/autos/inventory-pack/checkout` → success URL includes `return_to` + `boost_source=draft` → success page primary CTA returns to draft application.

## Risks

- Brief entitlement pending after payment until webhook lands
- Dashboard checkout via `/api/revenue-os/checkout` relies on `return_to` shape (no `boost_source` param) — inferred from `source=dashboard`

## Manual QA checklist

1. Open Autos Negocios draft application.
2. Confirm dealer data and vehicles present.
3. Click Inventory Boost → Stripe $129 checkout.
4. Complete test payment.
5. Success page primary action: Return to application.
6. Click CTA → same draft, not dashboard.
7. Confirm `focus=inventory-pack`, data preserved, boost active, limit 20.
8. Add vehicle #11; block >20.
9. Separately test dashboard/manage source → Manage inventory CTA.
10. Confirm Autos Privado unchanged.

## TRUE/FALSE audit table

| Check | Result |
|-------|--------|
| Correct repo confirmed | TRUE |
| Autos Negocios scope only | TRUE |
| Autos Privado untouched | TRUE |
| Unrelated categories untouched | TRUE |
| Checkout route identified | TRUE |
| Success page identified | TRUE |
| Draft source supported | TRUE |
| Dashboard/manage source supported | TRUE |
| Safe return_to validation exists | TRUE |
| External return_to blocked | TRUE |
| Draft source primary CTA returns to application | TRUE |
| Draft source does not prioritize dashboard | TRUE |
| Dashboard source returns to dashboard/manage | TRUE |
| Unknown source safe fallback exists | TRUE |
| Language preserved | TRUE |
| focus=inventory-pack or equivalent preserved | TRUE |
| Draft data not stored in URL | TRUE |
| Draft data not stored in Stripe metadata | TRUE |
| Payment success keeps draft recoverable | TRUE |
| Paid boost unlocks 20 on return | TRUE |
| Failed/cancelled boost does not unlock 20 | TRUE |
| Base package not charged again | TRUE |
| Only $129 boost charged | TRUE |
| No fake production activation | TRUE |
| Webhook activation remains source of truth | TRUE |
| Locked-site draft flow safe | TRUE |
| No Supabase migration touched | TRUE |
| No global Stripe rewrite | TRUE |
| No dashboard redesign | TRUE |
| No admin redesign | TRUE |
| Build passed | TRUE |
| No files staged | TRUE |
| No commit created | TRUE |
| No push attempted | TRUE |
| Ready for Chuy QA | TRUE |

Final recommendation: GREEN
