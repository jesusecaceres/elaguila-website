# A5.9 — Autos Negocio Full Inventory Completion + One-QA-Only Readiness Gate

**Date:** 2026-05-19  
**Scope:** Autos Negocio dealer inventory end-to-end (add flow, dashboard, public detail/gallery, full inventory route, admin, upgrade copy).  
**Product lock:** $399/mo base · 10 active vehicles · +10 @ $129/mo boost · $528/mo for 20 active · no tiers · no Stripe entitlement in this gate.

## 1. Files inspected

- `app/lib/clasificados/autos/AUTOS_A4_DEALER_INVENTORY_GALLERY_AUDIT.md`
- `app/lib/clasificados/autos/AUTOS_A4_1_DEALER_INVENTORY_ADD_FLOW_AUDIT.md`
- `app/lib/clasificados/autos/autosDealerInventoryPolicy.ts`
- `app/lib/clasificados/autos/autosDealerInventoryCopy.ts`
- `app/lib/clasificados/autos/autosDealerInventoryValueCopy.ts`
- `app/lib/clasificados/autos/autosDealerInventoryDrawerCopy.ts`
- `app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts`
- `app/lib/clasificados/autos/autosDealerInventoryDisplay.ts` (A5.9)
- `app/lib/clasificados/autos/autosClassifiedsListingService.ts`
- `app/(site)/publicar/autos/negocios/**` (Negocios application + inventory add mode)
- `app/(site)/clasificados/autos/lib/autosPublishFlowCopy.ts`
- `app/(site)/clasificados/autos/lib/mapAutosPublicListingToAutoDealer.ts`
- `app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosDealerInventoryVehicleCard.tsx`
- `app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx`
- `app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleOwnerInventoryBar.tsx` (A5.9)
- `app/(site)/clasificados/autos/dealer/[dealerInventoryGroupId]/**`
- `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx`
- `app/(site)/dashboard/mis-anuncios/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx`
- `app/api/clasificados/autos/**`
- `e2e/autos/autos-go-live-smoke.spec.ts`
- `scripts/autos-a5-9-negocio-full-inventory-completion-audit.ts`

## 2. Inventory add flow result

- Route: `/publicar/autos/negocios?inventoryMode=add&parentListingId=…&returnToListingId=…` via `buildAutosInventoryAddPublishHref`.
- Uses full Negocios publish application (not a mini form).
- `createAutosClassifiedsListingWithInventoryParent` writes `dealer_inventory_group_id`, `dealer_inventory_parent_listing_id`, `inventory_role` (`main` / `inventory_vehicle`); each child is a normal `autos_classifieds_listings` row with its own `id` and `leonix_ad_id`.
- Dealer/contact prefill from parent session; vehicle identity/specs/media empty in add mode (A4.1).
- Confirm CTA: “Agregar al inventario” / “Add to inventory” in `autosPublishFlowCopy.ts`.

## 3. Parent/grouping result

- Parent promoted to `inventory_role=main` when missing; shared `dealer_inventory_group_id` on parent + children.
- Related pool groups by `dealer_inventory_group_id` with `owner:{userId}` fallback in `getActiveLiveAutosBundle`.

## 4. Main ad inventory display result

- `RelatedDealerCars`: ES/EN section title + helper; up to 4 related via `buildRelatedPublicListings` (excludes current); sorted year desc → price → recency (`sortDealerInventoryPublicListings`).
- Cards: image (div placeholder when missing), year/make/model/trim, price, mileage, location, “Ver vehículo” / “View vehicle”.
- Grid: `sm:grid-cols-2`, `items-stretch`, mobile stack.

## 5. Full inventory result

- Route: `/clasificados/autos/dealer/[dealerInventoryGroupId]` + API `public/dealer/[groupId]`.
- Lists active vehicles for group; cards link to `/clasificados/autos/vehiculo/[id]`.
- “Ver inventario completo” on related section when `fullInventoryHref` set.

## 6. Dashboard inventory result

- `AutosDealerInventoryDashboardSection` on `mis-anuncios` for Negocio owners.
- Copy: `autosDealerInventoryActiveCountLine` (“6 de 10 vehículos activos”) and `autosDealerInventoryRemainingSlotsLine` (“Te quedan 4 espacios disponibles”).
- CTAs: add vehicle (drawer), manage inventory, upgrade/value module at limit.

## 7. Admin inventory result

- `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx`: lane, dealer signals, `inventory_role`, group/parent fields, active inventory count where available.

## 8. Upgrade/value copy result

- Base $399/mo, 10 included, +10 @ $129/mo, $528/mo total in `autosDealerInventoryCopy.ts` / drawer / value modules.
- Limit message at 10 active (ES/EN) without fake payment activation.

## 9. Public buyer visibility result

- `AutoDealerPreviewPage` has no owner “Agregar vehículo al inventario”.
- `AutosLiveVehicleOwnerInventoryBar` renders only after owner session + listing ownership via `/api/clasificados/autos/listings`.

## 10. Build/check result

- Recorded after validation run in gate output (see section 11 / final response).

## 11. Remaining risks

- Manual QA on staging/production with real parent listing IDs (add child, search, dashboard, admin, related gallery).
- `autos:a3-field-audit` may FAIL when unrelated categories are dirty in the working tree (scope guard, not Autos logic).
- Owner inventory bar depends on browser session + listings API; verify on logged-in dealer account only.

---

## TRUE/FALSE requirements

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Main dealer listing remains a real listing | TRUE | Standard Negocio publish → `autos_classifieds_listings` row |
| Added inventory vehicle becomes a real listing | TRUE | `createAutosClassifiedsListingWithInventoryParent` insert |
| Added inventory vehicle gets its own id | TRUE | New row `id` per child |
| Added inventory vehicle gets its own leonix_ad_id | TRUE | Allocated per listing on create |
| Added inventory vehicle gets its own detail URL | TRUE | `/clasificados/autos/vehiculo/[id]` |
| Parent grouping metadata is written | TRUE | `dealer_inventory_group_id`, parent id, `main` role |
| Child grouping metadata is written | TRUE | `inventory_vehicle` + group/parent ids |
| Parent listing can be marked main safely | TRUE | Promote when role missing in service |
| Inventory add mode reuses real Negocios app | TRUE | `inventoryMode=add` on negocios publish route |
| Dealer/contact fields prefill from parent or blocker documented | TRUE | A4.1 add-flow session prefill |
| Vehicle fields start empty in add mode | TRUE | A4.1 draft reset for vehicle fields |
| Final CTA says Agregar al inventario/Add to inventory | TRUE | `autosPublishFlowCopy.ts` |
| Add inventory CTA exists in owner/dashboard context | TRUE | Dashboard section + owner live bar + drawer |
| Add inventory CTA is hidden from public buyers | TRUE | No CTA on `AutoDealerPreviewPage`; bar gated by auth |
| Main ad shows organized inventory cards | TRUE | `RelatedDealerCars` grid |
| Inventory cards are real listing cards | TRUE | Mapped from live `AutosPublicListing` rows |
| Inventory cards link to real detail pages | TRUE | `autosLiveVehiclePath` |
| Current vehicle is excluded from related inventory | TRUE | `buildRelatedPublicListings` filter |
| Full inventory CTA exists or blocker documented | TRUE | `dealer/[dealerInventoryGroupId]` + related CTA |
| Full inventory page/results show real dealer vehicles | TRUE | `listActiveDealerInventoryByGroupId` API |
| Dashboard shows active count out of 10 | TRUE | `autosDealerInventoryActiveCountLine` |
| Dashboard shows remaining slots | TRUE | `autosDealerInventoryRemainingSlotsLine` |
| Dashboard shows Add another vehicle CTA | TRUE | `AutosDealerInventoryDashboardSection` |
| Dashboard shows Manage inventory CTA | TRUE | Manage href to dealer page / mis-anuncios |
| Admin shows inventory role/group signal or blocker documented | TRUE | Admin autos page `inventory_role` |
| Base package copy says 10 included | TRUE | `AUTOS_NEGOCIO_BASE_ACTIVE_LIMIT` copy |
| Upgrade copy says +10 for $129/month | TRUE | `INVENTORY_BOOST` / $129 strings |
| Total with boost $528/month is shown where useful | TRUE | `AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD` |
| No +1 option added | TRUE | Policy/copy grep |
| No +5 option added | TRUE | Policy/copy grep |
| No dealer tiers added | TRUE | No Starter/Pro/Premium dealer tiers |
| No Stripe/payment entitlement added | TRUE | Contact/mailto upgrade only |
| Privado unaffected | TRUE | Negocios-only inventory paths |
| No fake inventory added | TRUE | Each vehicle = DB listing row |
| No unrelated categories touched | TRUE | Autos-scoped diff for A5.9 |
| npm run build passed | TRUE | See validation log in final gate response |
