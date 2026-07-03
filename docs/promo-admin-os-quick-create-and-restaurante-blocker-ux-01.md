# Promo Admin OS Quick-Create & Restaurante Blocker UX 01

Gate: `PROMO-ADMIN-OS-QUICK-CREATE-AND-RESTAURANTE-BLOCKER-UX-01`

## 1. Executive Summary

Two connected launch-QA workflows were improved without touching Stripe math, the
webhook redemption path, or the Restaurante coupon add-on pricing support:

1. **Restaurante checkout blocker UX** — the block stays correct (Revenue OS cannot
   charge the $99 restaurant coupon add-on yet), but the copy and the "Back to edit
   and remove add-on" action are clearer and the edit link now carries a
   `focus=coupon-upgrade` hint.
2. **Promo Code Generator Admin OS** — quick-create presets, a category-aware
   package-scope dropdown, and an explicit auto-generate/custom code mode remove the
   need for Chuy to hand-type package scopes like `restaurantes_base_monthly`.

The promo discount behavior is unchanged: a code like `RESTO-QA-25-01` still applies
25% to the $399/mo base plan ($399.00 − $99.75 = $299.25/mo). Redemption still only
happens after a successful Stripe webhook payment.

## 2. Screenshot Problem

The live Restaurante checkout screenshot showed a correct-but-unhelpful blocker: the
secure-checkout button was disabled because the restaurant coupon module was selected,
but the message did not make it obvious that (a) the promo discount was still applied to
the base plan and (b) the fix is to go back and turn off the coupon module. The Admin
Promo Codes page worked but required manual typing of code and package scope.

## 3. Restaurante Blocker Decision

- **Kept the block.** `isRestaurantCouponCheckoutBlocked()` and the resolver in
  `app/lib/listingPlans/publishCheckoutCheckpoint.ts` still disable secure checkout when
  `restaurantOffersAddonSelected` is true and
  `REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED` is `false`.
- **No fake add-on bypass.** The blocked coupon-module line is excluded from the
  checkout total; the add-on is never silently charged or silently dropped.
- **Clearer copy** (ES / EN), preserving the exact remove-add-on instruction the
  existing verifier asserts:
  - ES: "Para continuar al pago seguro hoy, vuelve a editar y desactiva el módulo de
    cupones del restaurante. Tu descuento promocional sí queda aplicado al plan base de
    $399/mes."
  - EN: "To continue to secure payment today, go back and turn off the restaurant
    coupon module. Your promo discount is applied to the $399/mo base plan."
- **Clearer action.** The CTA ("Volver a editar y quitar complemento" / "Back to edit
  and remove add-on") now links to `/publicar/restaurantes?focus=coupon-upgrade`
  (language preserved via `&lang=en`).
- **Follow-up (not in this gate):** the application page
  (`RestauranteApplicationClient.tsx`) is not in this gate's change scope, so it does not
  yet scroll/highlight section G from the `focus=coupon-upgrade` param. The link lands on
  the edit page today; auto-focus/highlight is a documented next step.

## 4. Promo Admin OS Problem

The Create Promo Code form was fully manual: Chuy had to type the code, type the package
scope key, and set category/discount/percent every time. This is slow and error-prone for
routine Restaurante launch/QA codes.

## 5. Presets Added

A **Quick create (preset)** control (`PromoCodeQuickCreateControls.tsx`) sits at the top
of the create form and fills existing fields:

| Preset | State |
| --- | --- |
| Custom discount code | enabled (no auto-fill) |
| Restaurante launch 25% | enabled → category Restaurantes, percent 25, scope `restaurantes_base_monthly`, active, auto-generate |
| Restaurante QA 25% | enabled → same as launch, QA note |
| Servicios launch 25% | disabled ("coming later") |
| Bienes Raíces negocio launch 25% | disabled ("coming later") |
| General launch discount (25%, any package) | enabled → percent 25, blank scope, active |

Unsupported categories are shown but **disabled** so the UI never fakes readiness for a
category not yet wired end to end. Type already defaults to **Discount**.

## 6. Package Scope Dropdown

`package_scope` is now a `<select>` built from `PROMO_CODE_PACKAGE_SCOPE_OPTIONS`, which
is derived from the canonical `REVENUE_V1_PACKAGE_MATRIX` (only paid, promo- and
Stripe-eligible keys; `*_offers_addon` keys excluded because checkout cannot charge them
yet). `restaurantes_base_monthly` and `br_agent_monthly` are selectable. A blank "Any
package (category-only code)" option preserves category-only codes, and an "Advanced:
custom package key" `<details>` field (`package_scope_custom`) remains as a secondary
override. The value is saved exactly as before: a single lowercased key in the
`package_scope` array.

## 7. Code Generation Behavior

- "Code empty = generate" is preserved. Leaving the code blank submits an empty code and
  the **server action** generates a Leonix code — the server remains the single source of
  truth and still normalizes + enforces the duplicate/unique check.
- A **Code mode** dropdown offers Auto-generate (default; clears + read-only) and Custom
  code (typed). Helper copy: "Leave blank to auto-generate a Leonix code on save."
- Category-aware server generation: `promoCodePrefixForCategory()` gives Restaurante
  discount codes a `RESTO-PROMO-…` prefix; everything else stays `LX-PROMO-…`. No code is
  generated client-side and no client-provided code is trusted.

## 8. Files Inspected

- `app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx`
- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx`
- `app/lib/listingPlans/publishCheckoutCheckpoint.ts`
- `app/lib/listingPlans/publishCheckoutCopy.ts`
- `app/admin/(dashboard)/workspace/promo-codes/page.tsx`
- `app/admin/(dashboard)/workspace/promo-codes/actions.ts`
- `app/admin/(dashboard)/workspace/promo-codes/PromoCodeLifecyclePreview.tsx`
- `app/admin/_lib/promoCodeData.ts`
- `app/admin/_lib/promoCodeConstants.ts`
- `app/admin/_lib/packageEntitlementConstants.ts`
- `app/lib/listingPlans/revenuePricingMatrix.ts`
- `app/lib/listingPlans/promoCodeLifecycle.ts`

## 9. Files Changed

- `app/lib/listingPlans/publishCheckoutCheckpoint.ts` — blocker copy aligned (keeps
  remove-add-on instruction).
- `app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx` — edit link
  now `?focus=coupon-upgrade` (+ lang).
- `app/admin/_lib/promoCodeConstants.ts` — `PROMO_CODE_PACKAGE_SCOPE_OPTIONS` +
  `PROMO_CODE_QUICK_PRESETS`.
- `app/admin/(dashboard)/workspace/promo-codes/PromoCodeQuickCreateControls.tsx` — new
  client enhancer (preset + code-mode).
- `app/admin/(dashboard)/workspace/promo-codes/page.tsx` — quick-create controls,
  package-scope dropdown, auto-generate helper copy.
- `app/admin/(dashboard)/workspace/promo-codes/actions.ts` — package-scope custom
  override + category-aware server generation.
- `app/lib/listingPlans/promoCodeLifecycle.ts` — `promoCodePrefixForCategory()` helper.
- `docs/promo-admin-os-quick-create-and-restaurante-blocker-ux-01.md` — this doc.
- `scripts/verify-promo-admin-os-quick-create-and-restaurante-blocker-ux-01.mjs` — new
  verifier.
- `package.json` — verifier script.

## 10. What This Gate Does Not Do

- Does not touch Stripe checkout foundation, webhook, or Revenue OS discount math.
- Does not add restaurant coupon add-on pricing support or remove the add-on blocker.
- Does not add a fake add-on charge, fake paid status, or fake usage ledger.
- Does not redeem on Apply or on checkout session creation.
- Does not touch Servicios, Bienes Raíces, Autos, Rentas, Empleos, En Venta, the public
  Cupones/Ofertas CMS, Supabase migrations, or `.env` files.
- Does not auto-clear the coupon add-on for the user.
- Does not broadly redesign the admin dashboard.

## 11. Manual QA Checklist

- Open Restaurante preview with the coupon module selected.
- Confirm the promo discount still appears when a valid code is applied.
- Confirm checkout remains blocked.
- Confirm the clearer blocker copy (ES/EN).
- Click "Back to edit / remove add-on" and confirm the edit page opens
  (`/publicar/restaurantes?focus=coupon-upgrade`).
- Open `/admin/workspace/promo-codes`.
- Confirm Type defaults to Discount.
- Confirm the quick preset dropdown exists.
- Select "Restaurante QA 25%" and confirm category, discount type, percent, and package
  scope populate (`restaurantes_base_monthly`).
- Leave the code blank, submit, and confirm a code is generated (server-side).
- Optionally set Code mode = Custom and enter a code.
- Confirm the recent code row shows discount value and package scope.
- Confirm the old `RESTO-LAUNCH-25` code still shows the missing-discount warning.

## 12. Next Recommended Gates

- Wire `RestauranteApplicationClient.tsx` to read `focus=coupon-upgrade` and
  scroll/highlight section G.
- Revenue OS support for the $99 restaurant coupon add-on line item (unblocks the
  Restaurante coupon module at checkout).
- Promo usage ledger surfacing per preset for launch-attribution reporting.
