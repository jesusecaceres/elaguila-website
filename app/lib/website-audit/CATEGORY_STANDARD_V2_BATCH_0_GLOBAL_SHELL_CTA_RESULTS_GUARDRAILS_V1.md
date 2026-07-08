# CATEGORY STANDARD V2 BATCH 0 GLOBAL SHELL CTA RESULTS GUARDRAILS V1

## Files Inspected

- `app/lib/website-audit/CLASIFICADOS_ALL_CATEGORIES_LANDING_RESULTS_ROUTE_OWNERSHIP_V2_SHELL_MIGRATION_AUDIT_V1.md`
- `app/(site)/clasificados/components/categoryStandardV2/types.ts`
- `app/(site)/clasificados/components/categoryStandardV2/constants.ts`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategorySearchCanvas.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryCta.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryPartnerSection.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryDiscoveryGrid.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryShortcutSection.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryVisibilityStrip.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryResultsShell.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/README.md`
- `app/(site)/clasificados/rentas/components/RentasCompactSearchCanvas.tsx`
- `app/(site)/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas.tsx`

## Files Changed

- `app/(site)/clasificados/components/categoryStandardV2/types.ts`
- `app/(site)/clasificados/components/categoryStandardV2/constants.ts`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategorySearchCanvas.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryPartnerSection.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryResultsShell.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/README.md`
- `app/lib/website-audit/CATEGORY_STANDARD_V2_BATCH_0_GLOBAL_SHELL_CTA_RESULTS_GUARDRAILS_V1.md`

## Audit Findings That Triggered This Gate

- The all-category route ownership audit found 0 categories truly V2-compliant end-to-end.
- Many landings import V2 components but are not visually compliant through the full live route.
- Most category results pages still use old/custom shells.
- `LeonixCategorySearchCanvas` previously defaulted `showPublish=false`, so `publishHref` and `publishLabel` could be present while the primary CTA slot stayed hidden.
- Several results surfaces still risk partner/sponsor/discovery/shortcut/CTA leakage during future migrations.
- Batch 0 therefore fixes the shared V2 shell behavior before any category migration.

## CTA Slot Behavior Before / After

Before:
- Landing pages had to pass `showPublish={true}` in addition to `publishHref` and `publishLabel`.
- If CTA data was missing, the second-row grid could collapse from the intended Rentas/Bienes shape.
- Results did not show publish by default, but this rule was not documented as part of the slot contract.

After:
- On `surface="landing"`, `publishHref` plus `publishLabel` automatically render the primary CTA unless `showPublish={false}` is passed.
- The landing second row keeps the approved shape: `country | Filtros | Ver todos | primary action slot`.
- If publish data is absent, `fallbackPrimaryHref` / `fallbackPrimaryLabel` can render a fallback action.
- If no fallback exists, a disabled desktop placeholder preserves the primary action slot.
- Results still do not render publish CTAs by default.

## Results Shell Guardrail Behavior Before / After

Before:
- `LeonixCategoryResultsShell` documented the final order and did not expose named landing-only props.
- `lowerVisibility` rendered whenever passed.

After:
- The shell still exposes only `hero`, `activeFilters`, `toolbar`, `children`, `emptyState`, `pagination`, and `lowerVisibility`.
- It explicitly documents that `partnerSection`, `discoveryGrid`, `shortcutSections`, `randomCtaRows`, and `sponsorSection` are not accepted API props.
- `lowerVisibility` renders only when `allowResultsVisibilityStrip === true`.

## Mobile / PWA Chip And Card Guardrails

- Shortcut rows use `overflow-x-auto`, `flex-nowrap`, `snap-x`, and hidden scrollbars on small screens.
- Partner section chips now use the same mobile-safe horizontal scroll behavior before wrapping on larger screens.
- Discovery grid/card constants now include `min-w-0` and use a one-column mobile grid to avoid 390px overflow.
- Tap targets remain in the 36px to 44px range depending on the component.

## Locked Files Respected

- No category landing files were edited.
- No category results files were edited.
- Rentas files were inspected only.
- Bienes files were inspected only.
- Ofertas, Restaurantes, Autos, Dealers, Servicios, En Venta, Empleos, Viajes, Clases, Comunidad, Busco, Mascotas, Negocios Locales, publicar/application, admin, dashboard, auth, middleware, Supabase, Stripe, package, Next config, and TS config files were not edited.
- No category migration was performed.
- No commit or push was performed.

## Next Recommended Prompt

`CATEGORY-STANDARD-V2-PILOT-OFERTAS-RESTAURANTES-LIVE-ROUTE-MIGRATION-V1`

## Final TRUE/FALSE Audit

- source audit read: TRUE.
- V2 search canvas inspected: TRUE.
- CTA slot collapse fixed: TRUE.
- landing publish CTA auto-renders when href/label exist: TRUE.
- landing slot preserved when CTA missing: TRUE.
- results publish CTA blocked by default: TRUE.
- CTA classes preserved exactly: TRUE.
- results shell order documented/enforced: TRUE.
- partner section blocks results: TRUE.
- discovery grid blocks results: TRUE.
- shortcut section blocks results: TRUE.
- visibility strip guarded on results: TRUE.
- mobile/PWA chip overflow guarded: TRUE.
- README updated: TRUE.
- audit doc created: TRUE.
- no category landing/results pages changed: TRUE.
- no admin/dashboard/auth/Supabase/Stripe changed: TRUE.
- no commit/push: TRUE.
