# GLOBAL-MONETIZED-CATEGORY-STACK-STANDARD-01

Gate: reusable monetized-category stack derived from Servicios/Restaurantes golden-loop gates and Standard 02.

## Reusable stack (10 layers)

1. **CTA URL contract** — `source=dashboard`, `mode`, `listingId`, `listingSlug`, `leonixAdId`, `returnPanel`, `focus` when applicable. Direct application routes for existing listings; never checkpoint/new-product routes.
2. **Edit hydration contract** — owner-authenticated fetch of saved listing; map stored JSON/rows to application draft; block blank form on failure.
3. **Preview back/edit golden loop** — listing-bound preview (`preview=listing`); `Volver a editar` uses dashboard context builder; no product/checkpoint drop.
4. **Add-on-only checkout** — dashboard upgrade charges add-on package only; base monthly package excluded; blocked honestly when `REVENUE_OS_*_SUPPORTED=false`.
5. **Success return CTA** — post-payment routes to same editor module (`mode=*-edit`, `focus=*`).
6. **Media persistence** — durable http(s) URLs before public JSON; IDB/session rehydrate in editor; no data URLs in public output.
7. **Save/update no duplicate** — existing listing identity on publish/update; block preview publish when update path unsafe.
8. **Public output** — parent detail renders add-on/child modules from stored rows/JSON only.
9. **Pipeline audit** — protect unsupported lanes (e.g. private BR from inventory add-on). See pipeline audit checklist per category.
10. **Smoke + TRUE/FALSE audit** — source-level href/payload checks + gate audit block.

## Global vs category-specific

| Layer | Global pattern | Category-specific |
|-------|----------------|-----------------|
| CTA contract | Param names, direct app base | Application mount path, `returnPanel` slug |
| Hydration | Owner fetch + block on failure | Mapper from category storage shape (edit hydration) |
| Golden loop | Preview listing-bound + back href builder | Step index for module focus |
| Add-on checkout | Revenue OS add-on-only payload | Package key + module copy |
| Public output | Durable media rule | Child card component / related fetch |

## Category plug-in paths

| Category | Parent/child model | Add-on package | Proof status |
|----------|-------------------|----------------|--------------|
| **Restaurantes** | Single listing + coupon module | `restaurantes_offers_addon` | Proven (P0F/P0G) |
| **Servicios** | Single listing + offers module | `servicios_offers_addon` | Proven (golden-loop gates) |
| **Bienes Raíces** | Agent parent + up to 4 child properties | `br_inventory_pack_monthly` | **This gate — proof** |
| **Dealers de Autos** | Dealer parent + vehicle inventory | TBD | Future |
| **Ofertas Locales** | Base + AI Searchable Specials | TBD | Future |
| **Clases** | Free/paid gate (not add-on) | `clases_paid_30d` | Future |
| **No-upgrade** | En Venta, Rentas, Empleos, Autos privado, Comunidad, Busco, Mascotas | None | Edit only (no-upgrade categories) |

## Bienes proof (GLOBAL-MONETIZED-CATEGORY-STACK-01-BIENES-PROOF)

Helper: `app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts`  
Hydration: `bienesPublishedToAgenteApplicationDraft.ts`  
Application: `AgenteIndividualResidencialApplication.tsx`  
Preview: `AgenteIndividualResidencialPreviewClient.tsx`  
Dashboard: `LeonixRealEstateListingManageCard.tsx`, `BrNegocioListingInventoryActions.tsx`

Inventory checkout remains **honestly blocked** until `REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED=true` and webhook fulfillment ships.

## TRUE/FALSE audit

- Standard 02 inspected: TRUE
- Servicios golden loop inspected: TRUE
- Restaurante helper patterns inspected: TRUE
- global stack documented: TRUE
- category plug-in rules documented: TRUE
- Bienes proof wired: TRUE
