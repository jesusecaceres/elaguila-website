# BR13D — Property Inventory Value Drawer + $99.99 Upgrade Pricing

**Gate:** BR13D  
**Status:** Implementation audit (static)

## Locked product

| Item | Value |
|------|-------|
| Bienes Raíces Negocio base | **$399/month** · up to **3** active properties |
| Property Inventory upgrade | **$99.99/month** · **+5** additional active properties |
| Total with upgrade | **$498.99/month** · up to **8** active properties |
| More than 8 | Contact Leonix |
| Per-property pricing | No |
| Tiers (Starter/Pro/Premium) | No |
| Larger package at launch | No |
| Stripe wiring in this gate | Deferred (mailto/contact only) |

## Value positioning

- Professional catalog / portfolio expansion tied to agent/business profile
- Each inventory property: own public page, photos, details, Leonix Ad ID, link to main profile
- Not positioned as cheap standalone ads

## Files

- `app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts`
- `app/(site)/clasificados/lib/leonixBrPropertyInventoryCopy.ts`
- `app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryValueDrawer.tsx`
- `app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryValueDrawerTrigger.tsx`
- `app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryDashboardSection.tsx`
- `app/(site)/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx`
- `app/(site)/clasificados/lib/leonixBrPropertyInventoryAddFlow.ts`

## TRUE/FALSE

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| $99.99 upgrade constant present | TRUE | `BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE = 99.99` |
| $498.99 total value present | TRUE | `BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_MONTHLY_PRICE = 498.99` |
| $89.99 removed from active BR inventory | TRUE | Policy/copy/dashboard/drawer only |
| $399 / 3 active preserved | TRUE | Base constants + drawer bullets |
| +5 additional preserved | TRUE | `BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT = 5` |
| 8 total preserved | TRUE | `BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT = 8` |
| value/catalog positioning | TRUE | `brPropertyInventoryValueDrawerCopy` |
| no per-property pricing | TRUE | Single upgrade package only |
| no tiers | TRUE | Audit script negative check |
| drawer opens from dashboard CTA | TRUE | `BrPropertyInventoryValueDrawerTrigger` |
| desktop right slide-over | TRUE | `lg:ml-auto` panel |
| mobile full-screen drawer | TRUE | `w-full` + sticky bottom CTA |
| drawer includes $399 / 3 | TRUE | `baseBullet` |
| drawer includes $99.99 / +5 | TRUE | `upgradeBullet` |
| drawer includes $498.99 / 8 | TRUE | `valueParagraph` |
| catalog / pro profile value | TRUE | `catalogBullet` |
| own page / Leonix ID | TRUE | `leonixBullet` |
| no new tab/window before value | TRUE | Button opens drawer; `router.push` on continue |
| payment not invented | TRUE | `mailto:` + payment note only |
| continue uses real listing id | TRUE | `buildBrInventoryAddPublishHref(addCtx)` |
| parentListingId preserved | TRUE | Add flow query params |
| inventoryGroupId preserved | TRUE | Add flow query params |
| returnToListingId preserved | TRUE | Add flow query params |
| inventoryMode=add preserved | TRUE | Add flow |
| Add to inventory CTA preserved | TRUE | `brPropertyInventoryAddToInventoryCtaLabel` |
| child real listing path | TRUE | BR13B publish metadata unchanged |
| dashboard Leonix Ad ID | TRUE | `BrNegocioListingInventoryActions` |
| child relationship context | TRUE | Connected to parent Leonix ID |
| public normal property cards | TRUE | `RelatedBrAgentProperties` unchanged |
| BR13D audit script | TRUE | `scripts/br13d-property-inventory-value-drawer-audit.ts` |
