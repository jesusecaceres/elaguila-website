# A5.MONETIZATION-02 — Autos Negocios Inventory Boost Draft Activation Finalization

## Gate title

A5.MONETIZATION-02 — Autos Negocios Inventory Boost Draft Activation Finalization

## Correct repo confirmation

`C:/projects/elaguila-website` (Leonix / El Águila)

## Files inspected

- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBoostPanel.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryValueModule.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryTrigger.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosResultsCardPreview.tsx`
- `app/lib/clasificados/autos/autosInventoryBoostPipeline.ts`
- `app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts`
- `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts`
- `app/lib/clasificados/autos/autosDealerInventoryPolicy.ts`
- `app/api/clasificados/autos/checkout/route.ts`
- `app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts` (read-only reference)
- `app/lib/listingPlans/revenueCheckout.ts` (read-only — active-only guard unchanged)

## Files changed

- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBoostPanel.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryValueModule.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryTrigger.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosResultsCardPreview.tsx`
- `app/(site)/publicar/autos/negocios/lib/ensureAutosNegociosDraftListingForBoost.ts` (new)
- `app/lib/clasificados/autos/autosInventoryBoostPipeline.ts`
- `app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts`
- `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts`
- `app/lib/clasificados/autos/autosDealerInventoryBoostOwnership.ts` (new)
- `app/lib/clasificados/autos/autosDealerInventoryPackEntitlement.ts` (new)
- `app/lib/clasificados/autos/autosDealerInventoryApplicationPublishGuard.ts` (new)
- `app/lib/clasificados/autos/autosDealerInventoryBoostCheckoutClient.ts` (new)
- `app/api/clasificados/autos/inventory-pack/checkout/route.ts` (new)
- `app/api/clasificados/autos/checkout/route.ts`
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `scripts/autos-a5-monetization-02-negocios-inventory-boost-draft-activation-audit.ts` (new)
- `package.json` (verifier script only)

## Old behavior

- Inventory Boost modal blocked checkout with “Publish your main dealer listing first to activate inventory.” when no `listingId`.
- Pre-publish flow could not activate boost; `inventoryPackActive` was always false before final publish.
- Add-inventory limits were hardcoded to 10 regardless of boost entitlement.
- Final publish checkout only enforced a flat 10-vehicle account limit; no boost-required guard for 11–20 application vehicles.

## New behavior

- Modal copy explains boost can activate **before** publish and return to the same application.
- Pre-publish boost: flush draft → persist draft listing row → Stripe via `/api/clasificados/autos/inventory-pack/checkout` (draft/pending/active eligible).
- After paid entitlement, application limit becomes 20; UI counts use `resolveDealerActiveVehicleLimit`.
- Final publish (`/api/clasificados/autos/checkout`) enforces: ≤10 without boost; 11–20 requires active pack on listing; >20 blocked.

## Boost copy result

- Removed publish-first messaging.
- Primary EN: “Activate Inventory Boost now to unlock 10 more vehicle slots before publishing.”
- Primary ES: “Activa Inventory Boost ahora para desbloquear 10 espacios más antes de publicar.”
- Supporting EN/ES return-to-same-application copy present.
- Pricing bullets unchanged ($399 base / +$129 boost / $528 total / 10→20 vehicles).

## Draft activation result

- `ensureAutosNegociosDraftListingForBoost` syncs application to `autos_classifieds_listings` (draft) using session key `lx-autos-publish-listing-negocios`.
- Boost return context written via `writeAutosInventoryBoostReturnContext`.
- Failed/cancelled checkout does not set `inventoryPackActive` locally — unlock requires server entitlement proof only.

## Publish validation result

- `validateNegociosApplicationPublishInventory` in checkout route.
- Error EN: “You have more than 10 vehicles in this application. Activate Inventory Boost to publish up to 20 vehicles.”
- Error ES: “Tienes más de 10 vehículos en esta solicitud. Activa Inventory Boost para publicar hasta 20 vehículos.”

## Test mode result

**Stripe test path (GREEN when Stripe test keys configured):**

1. Open Autos Negocios publish flow (logged in).
2. Add main + optional inventory; open Inventory Boost modal.
3. Click **Activate inventory +$129/mo** → draft listing persisted → `POST /api/clasificados/autos/inventory-pack/checkout` → Revenue OS Stripe session.
4. Pay with Stripe test card on checkout.
5. Webhook activates `listing_package_entitlements` for `autos_dealer_inventory_pack_monthly`.
6. Return URL: `/revenue-os/pago/exito?...&return_to=<editor path with focus=inventory-pack>`.
7. Application re-fetches entitlement; limit becomes 20.

**No fake production activation** — no local flag bypass; `inventoryPackActive` only when server entitlement proof is active.

**Dashboard active listings** still use existing `/api/revenue-os/checkout` path (unchanged `validateAutosDealerInventoryAddonOwnership` requires `active`).

## Risks

- Entitlement polling after payment may show brief `pending` until webhook completes.
- Pre-publish draft listing row is created before boost checkout (same pattern as publish confirm).
- Stripe bundle publish of 11+ vehicles in one main checkout remains QA-bypass only (unchanged product rule).

## Manual QA checklist

1. Open Autos Negocios publish flow.
2. Add main vehicle.
3. Add inventory approaching 10 total.
4. Open Inventory Boost modal — confirm no publish-first copy.
5. Click Activate Inventory +$129/mo.
6. Complete Stripe test checkout.
7. Return to same application URL.
8. Confirm main vehicle preserved.
9. Confirm added vehicles preserved.
10. Confirm limit is 20.
11. Add vehicle 11.
12. Preview/review shows correct inventory count (e.g. 11/20).
13. Publish with ≤10 without boost — allowed.
14. Publish with 11–20 without boost — blocked with boost-required message.
15. Publish with 11–20 with boost active — allowed (main Stripe publish path).
16. Confirm Autos Privado unchanged.

## TRUE/FALSE audit table

| Check | Result |
|-------|--------|
| Correct repo confirmed | TRUE |
| Autos Negocios scope only | TRUE |
| Autos Privado untouched | TRUE |
| Unrelated categories untouched | TRUE |
| Old “publish first” copy removed | TRUE |
| Boost can be activated before final publish | TRUE |
| Draft data preserved through activation | TRUE |
| Main vehicle preserved | TRUE |
| Additional vehicles preserved | TRUE |
| Base limit remains 10 | TRUE |
| Boost limit becomes 20 | TRUE |
| Main vehicle counts as 1 | TRUE |
| Additional vehicles count correctly | TRUE |
| <=10 publish allowed without boost | TRUE |
| 11–20 publish blocked without boost | TRUE |
| 11–20 publish allowed with active boost | TRUE |
| >20 publish blocked | TRUE |
| Failed/cancelled boost does not unlock 20 | TRUE |
| No fake production activation | TRUE |
| Stripe/test activation path documented | TRUE |
| No Supabase migration touched | TRUE |
| No global Stripe change | TRUE |
| No dashboard/admin redesign | TRUE |
| Build passed | TRUE |
| No files staged | TRUE |
| No commit created | TRUE |
| No push attempted | TRUE |
| Ready for Chuy QA | TRUE |

Final recommendation: GREEN
