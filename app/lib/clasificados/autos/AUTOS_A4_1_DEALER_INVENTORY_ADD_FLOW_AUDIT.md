# A4.1 — Autos Dealer Inventory Add Flow + Parent Grouping UI

## 1. Files inspected

- `app/lib/clasificados/autos/AUTOS_A4_0_DEALER_INVENTORY_SQL_CONTRACT_AUDIT.md`
- `app/lib/clasificados/autos/AUTOS_A4_DEALER_INVENTORY_GALLERY_AUDIT.md`
- `app/lib/clasificados/autos/autosDealerInventoryPolicy.ts`
- `app/lib/clasificados/autos/autosDealerInventoryCopy.ts`
- `app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts`
- `app/lib/clasificados/autos/autosClassifiedsTypes.ts`
- `app/lib/clasificados/autos/autosClassifiedsListingService.ts`
- `app/lib/clasificados/autos/mapAutosClassifiedsToPublic.ts`
- `app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx`
- `app/api/clasificados/autos/listings/route.ts`
- `app/api/clasificados/autos/checkout/route.ts`
- `app/api/clasificados/autos/public/dealer/[dealerInventoryGroupId]/route.ts`
- `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx`
- `app/(site)/dashboard/mis-anuncios/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx`
- `package.json`

## 2. A4.0 SQL finding

A4.0 added nullable columns on `public.autos_classifieds_listings`: `dealer_inventory_group_id`, `dealer_inventory_parent_listing_id`, `inventory_role` (`main` | `inventory_vehicle`). Each vehicle remains its own row with its own `id` and `leonix_ad_id`.

## 3. Inventory grouping implementation

- `createAutosClassifiedsListing` writes SQL inventory fields on insert for Negocio rows.
- `createAutosClassifiedsListingWithInventoryParent` sets child `inventory_role = inventory_vehicle`, links parent, shares `dealer_inventory_group_id`, and promotes parent to `main` when safe.
- `resolveDealerInventoryGroupingKey` prefers group id; falls back to `owner:{owner_user_id}` for gallery/count behavior.
- `listActiveDealerInventoryByGroupId` powers full inventory page/API.

## 4. Inventory add mode behavior

- Route: `/publicar/autos/negocios?inventoryMode=add&parentListingId=…&returnToListingId=…&dealerInventoryGroupId=…`
- Reuses real Negocios application and confirm/checkout flow.
- `prefillDealerListingForInventoryAdd` copies dealer/contact fields; vehicle fields stay empty.
- Confirm copy: “Agregar al inventario” / “Add to inventory”; loading: “Agregando al inventario…” / “Adding to inventory…”
- Success returns via `return_to` query to parent listing, or dashboard `cat=autos`.

## 5. Inventory CTA behavior

- Dashboard `AutosDealerInventoryDashboardSection` on `mis-anuncios` when Autos paid inventory is shown.
- CTA: “Agregar vehículo al inventario” / “Add vehicle to inventory” (owner session only).
- Same-tab route navigation with parent/group context query params.

## 6. Limit/upgrade copy behavior

- Base limit remains 10 (`STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT`).
- Upgrade pitch: +10 vehicles for $129/month (`autosDealerInventoryCopy.ts`).
- Limit message at checkout and dashboard when at cap.
- Upgrade CTA: `mailto:` placeholder only — no Stripe in this gate.

## 7. Public gallery behavior

- Up to 4 related active vehicles; excludes current; hides when empty.
- Cards link to `/clasificados/autos/vehiculo/[id]`.
- Section placed after dealer contact aside and before specs on detail page.
- Full inventory CTA links to `/clasificados/autos/dealer/[dealerInventoryGroupId]` when group id exists.

## 8. Full inventory behavior

- Public route: `/clasificados/autos/dealer/[dealerInventoryGroupId]`
- API: `GET /api/clasificados/autos/public/dealer/[dealerInventoryGroupId]`
- Active vehicles only; dealer name/city from main listing payload; grid links to real detail pages.
- Does not expose raw `owner_user_id` in URL.

## 9. Dashboard behavior

- Grouped Negocio inventory with active count, remaining slots, add/manage CTAs.
- Per-row edit, publish, view live, unpublish preserved.

## 10. Admin behavior

- Negocio rows show `active n/10`, `inventory_role`, parent id prefix, group id prefix when present.
- Existing admin row actions preserved.

## 11. Build/check result

Recorded after validation run in Phase 12 (see final report).

## 12. Remaining risks

- Legacy Negocio rows without `dealer_inventory_group_id` still group via owner fallback until a vehicle is added through inventory add flow.
- Inventory add draft uses standard Negocios draft namespace after first save; concurrent normal Negocio publish in same tab can overwrite draft.
- Upgrade CTA is contact-only until A4.2 entitlement/Stripe.
- Owner add CTA on public live detail page is dashboard-only in this gate (no public owner detection on detail).

## Requirement table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| A4.0 SQL fields are used | TRUE | `autosClassifiedsListingService.ts` insert + `createAutosClassifiedsListingWithInventoryParent` |
| No dealer tiers were added | TRUE | No Starter/Pro/Premium in autos dealer files |
| No per-car fee logic was added | TRUE | Flat 10 + optional +10 copy only |
| No +1 or +5 upgrade options were added | TRUE | `autosDealerInventoryCopy.ts` only +10 |
| Base active vehicle limit remains 10 | TRUE | `STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT = 10` |
| Upgrade copy says +10 vehicles for $129/month | TRUE | `autosDealerInventoryCopy.ts` |
| No Stripe/payment logic was added | TRUE | Mailto upgrade CTA; checkout unchanged except limit copy |
| Each inventory vehicle remains its own real listing | TRUE | POST creates new `autos_classifieds_listings` row |
| Each inventory vehicle keeps its own leonix_ad_id | TRUE | No sharing logic on `leonix_ad_id` |
| Inventory grouping uses SQL group/parent/role metadata | TRUE | Parent/child create path + columns on row |
| Owner_user_id fallback remains supported | TRUE | `resolveDealerInventoryGroupingKey` |
| Inventory add mode uses real Negocios application | TRUE | `AutosNegociosApplication.tsx` + confirm core |
| Inventory add CTA says Add/Agregar, not fake Publish, where appropriate | TRUE | `autosPublishFlowCopy.ts`, `AutosApplicationFinalActions.tsx` |
| Dealer contact fields prefill from parent/main listing or blocker documented | TRUE | `prefillDealerListingForInventoryAdd` |
| Added inventory vehicle returns to parent/main listing or dashboard | TRUE | `return_to` on checkout success + `resolveInventoryAddReturnHref` |
| Public gallery shows up to 4 other active dealer vehicles | TRUE | `getActiveLiveAutosBundle` limit 4 |
| Current vehicle is excluded from gallery | TRUE | `candidate.id !== row.id` |
| Gallery hides when no other vehicles exist | TRUE | `RelatedDealerCars` returns null when empty |
| Gallery cards link to real vehicle detail pages | TRUE | `mapAutosPublicListingToAutoDealer.ts` |
| View full inventory exists or blocker documented | TRUE | `/clasificados/autos/dealer/[dealerInventoryGroupId]` |
| Dashboard shows grouped inventory count/remaining slots or blocker documented | TRUE | `AutosDealerInventoryDashboardSection.tsx` |
| Dashboard supports add/manage inventory CTA or blocker documented | TRUE | Same component |
| Admin shows dealer inventory grouping signals or blocker documented | TRUE | `admin/.../autos/page.tsx` role/parent/group hints |
| Active limit guard blocks 11th active Negocio inventory vehicle or blocker documented | TRUE | checkout + `tryActivateAutosListingAfterPayment` |
| Privado is not affected | TRUE | Inventory fields only on `lane === "negocios"` |
| No fake nested inventory was added | TRUE | Real rows only |
| No unrelated categories were touched | TRUE | Scoped paths only |
| npm run build passed | TRUE | `npm run build` succeeded on second run after A4.1 TypeScript fixes (dirty tree) |
