# SERVICIOS-P0C — Dashboard add-on-only Stripe + edit route parity

**Gate title:** SERVICIOS-P0C-DASHBOARD-ADDON-ONLY-STRIPE-AND-EDIT-ROUTE-PARITY

## Why this gate follows P0A/P0B

- **P0A** fixed the Servicios coupon checkpoint "Ver más" + rules modal parity.
- **P0B** fixed coupon/offers persistence (IDB + Vercel Blob), image/flyer media, preview, publish payload, and public output.
- **P0C** wires the Servicios **dashboard** to the proven Restaurante add-on-only pattern:
  existing published Servicios listing → **Editar servicio** → coupon section → activate offers add-on only (**$99/mo**) → Stripe → return to the coupon editor for the same listing → save coupons → public listing renders.

## Files inspected

- `app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts` (reference only)
- `app/(site)/dashboard/restaurantes/page.tsx` (reference only)
- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx` (reference only)
- `app/(site)/dashboard/servicios/page.tsx`
- `app/api/clasificados/servicios/my-listings/route.ts`
- `app/api/clasificados/servicios/my-listing/route.ts`
- `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx`
- `app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts`
- `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts`
- `app/lib/listingPlans/revenuePricingMatrix.ts` (confirms `servicios_offers_addon` @ $99/mo)
- `app/lib/listingPlans/publishCheckoutCheckpoint.ts`
- `app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx`
- `app/lib/listingPlans/revenueCategoryCheckoutClient.ts`, `revenueOsReturnPath.ts`

## Files changed

- **NEW** `app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts` — Servicios dashboard add-on helper.
- `app/lib/listingPlans/publishCheckoutCheckpoint.ts` — added `SERVICIOS_OFFERS_ADDON_PACKAGE_KEY`.
- `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts` — added `SERVICIOS_OFFERS_ADDON_DASHBOARD_CHECKOUT` (Restaurante constant untouched).
- `app/api/clasificados/servicios/my-listings/route.ts` — returns `offers_addon_active` (honest display flag).
- `app/(site)/dashboard/servicios/page.tsx` — listing-edit identity hrefs, active "Editar ofertas" shortcut, inactive hint (no outside paid CTA).
- `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx` — dashboard modes, coupon-step focus, inside add-on-only checkout button, base pricing blocked in edit mode.
- `app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx` — servicios add-on success CTA (Restaurante CTA preserved).
- `scripts/verify-servicios-p0c-dashboard-addon-only-stripe-edit-route-parity.mjs` + `package.json` script.

## Current dashboard/edit chain found

- `/dashboard/servicios` lists owner listings from `/api/clasificados/servicios/my-listings` (owner-authenticated via `listServiciosPublicListingsForOwner`).
- Edit link previously used an ad-hoc `?edit=1&source=dashboard&listingSlug=...` URL with no `mode`.
- The application reads `edit`, `listingSlug`, `listingId`, `leonixAdId`; hydrates via `/api/clasificados/servicios/my-listing` → `serviciosPublishedToApplicationDraft`.
- Coupon step (index 6) toggled `couponsAddOn` **client-side** for the new-application flow.
- Revenue matrix already contains `servicios_offers_addon` ($99/mo). Revenue OS success view resolved only the Restaurante add-on CTA.

## New helper behavior

`serviciosDashboardOffersAddonCheckout.ts` mirrors the Restaurante helper, Servicios-specific:

- `SERVICIOS_OFFERS_ADDON_PACKAGE_KEY` re-export; labels/hints (`serviciosOffersInactiveDashboardHint`, `serviciosOffersEditSuccessLabel`, `serviciosOffersAddonUpgradeLabel`, `serviciosOffersAddonUpgradeBusyLabel`, `serviciosOffersEditLabel`, `serviciosOffersEditFooterHint`, `serviciosOffersModuleHeading`).
- Hrefs to `/clasificados/publicar/servicios` (never `/publicar/servicios`) carrying `lang`, `edit=1`, `source=dashboard`, `mode`, `listingId`/`listingSlug`/`leonixAdId`, `returnPanel=servicios`:
  - `serviciosListingEditHref` → `mode=listing-edit`
  - `serviciosOffersEditHref` → `mode=offers-edit&focus=coupon-upgrade`
  - `serviciosOffersAddonHref` → `mode=offers-addon&focus=coupon-upgrade`
- `startServiciosDashboardOffersAddonCheckout` / `redirectServiciosDashboardOffersAddonCheckout` → add-on-only checkout (`category: servicios`, `packageKey: servicios_offers_addon`), never the base package.
- `serviciosListingJsonOffersEnabled`, `serviciosOffersAddonUpgradeEligible`, `serviciosOffersEditEligible`, `resolveServiciosOffersAddonSuccessPrimaryCta`.

## Dashboard action behavior

- **Editar servicio** → `serviciosListingEditHref` (`edit=1&source=dashboard&mode=listing-edit&listingId&listingSlug&leonixAdId&returnPanel=servicios`).
- **Active** published listing (offers content present) → extra **Editar ofertas** shortcut → `serviciosOffersEditHref`.
- **Inactive** listing → no outside paid CTA; small hint: "Para agregar ofertas destacadas, entra a Editar servicio y abre la sección Cupones y ofertas."
- Mobile and desktop rows are at parity.

## Application mode behavior

- Reads `mode` + `focus` + `returnPanel`; supports `listing-edit`, `offers-edit`, `offers-addon`.
- `focus=coupon-upgrade` jumps to the coupon step (`SERVICIOS_COUPON_STEP_INDEX = 6`) once after hydration and scrolls to it.
- Existing edit hydration (P0B media persistence) is preserved; no duplicate listing, no draft clearing.
- `mode=offers-addon` does **not** set `couponsAddOn = true` — activation requires verified payment.

## Add-on-only Stripe behavior

- Inside the coupon section, when in an existing dashboard listing mode **and** `couponsAddOn` is false, the card shows **"Destacar ofertas +$99/mes"** which calls `redirectServiciosDashboardOffersAddonCheckout` (add-on-only, listingId-bound, `servicios_offers_addon`). No `servicios_base_monthly`.
- The $399 base pricing summary in the final review step is hidden in dashboard edit modes — an existing listing is never re-sent to base checkout.
- The new-application flow is unchanged (client-side `couponsAddOn` toggle + final pricing summary).

## Success CTA / return behavior

- `RevenueOsPagoResultView` resolves the Servicios add-on CTA when `packageKey === servicios_offers_addon` and a `listingId` is present:
  - Primary CTA "Editar ofertas ahora" / "Edit offers now" → `serviciosOffersEditHref` (`mode=offers-edit&focus=coupon-upgrade`).
  - Missing listingId → falls back to the dashboard/category return path.
- Restaurante and other-category success CTAs are unchanged.

## Entitlement / webhook honesty

- **Webhook was not modified** (no raw-body/signature change).
- There is no verified Servicios paid-entitlement flag in `profile_json` yet. Dashboard "active offers" state (`offers_addon_active`) is derived from **published coupon/flyer/more-offers content only** — an honest display state set after a save, not a claim of Stripe payment.
- The activation button always routes through the real Revenue OS add-on-only checkout; nothing marks the add-on paid client-side.
- **Gap (next step):** wire a listing-bound `servicios_offers_addon` entitlement flag through the existing verified Stripe webhook fulfillment path so the dashboard can distinguish "paid add-on active" from "has coupon content".

## What was protected

- P0A "Ver más" / rules modal untouched.
- P0B coupon/flyer IDB + Blob persistence untouched.
- No data URLs / IDB refs reintroduced into public `profile_json`.
- No Stripe webhook, Stripe prices, or Supabase migrations changed.
- Restaurante runtime + other categories untouched.

## Manual QA checklist

- Open `/dashboard/servicios?lang=es`.
- Inactive listing shows **Editar servicio** + inactive hint, no outside paid CTA.
- Click **Editar servicio** → URL has `edit=1&source=dashboard&mode=listing-edit&listingId&listingSlug&leonixAdId&returnPanel=servicios`.
- Go to the coupon/offers section → inactive explanation + **Destacar ofertas +$99/mes**.
- Click button → Stripe checkout is `servicios_offers_addon` only, $99/mo, no $399 base line.
- Complete test payment → success page primary CTA "Editar ofertas ahora".
- Click CTA → same listing opens at the coupon/offers section (`mode=offers-edit&focus=coupon-upgrade`).
- Add coupon data/images → save/publish/update → public listing renders coupons/images/flyer.
- Dashboard active listing shows **Editar ofertas** shortcut → opens coupon section directly.

## TRUE/FALSE audit

- dashboard helper created: TRUE
- Servicios package key used: TRUE
- add-on-only checkout uses servicios_offers_addon: TRUE
- base package excluded: TRUE
- edit href preserves listing identity: TRUE
- success CTA resolver created: TRUE
- dashboard can identify active offers: TRUE
- API remains owner-authenticated: TRUE
- listing-edit / offers-edit / offers-addon modes supported: TRUE
- focus coupon step supported: TRUE
- P0B persistence preserved: TRUE
- no fake activation: TRUE
- inside inactive activation button added: TRUE
- $399 base blocked in dashboard edit: TRUE
- Servicios success CTA added, Restaurante preserved: TRUE
- webhook inspected, not changed, gap documented: TRUE
- no Supabase migration changed: TRUE
- no Restaurante runtime changed: TRUE

## READY TO COMMIT

READY TO COMMIT: YES
