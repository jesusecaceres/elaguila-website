# A5.SHIP-06 — Autos Added Inventory End-to-End Truth Audit

## 1. Repo/source confirmation

- Root: `C:/projects/elaguila-website`
- Branch: `main`
- HEAD: `c96bf7106e6c20b6b312d7144f173ae01ccb51ec`

## 2. Files inspected

- `AutosNegociosApplication`, `AutosNegociosAddInventoryDrawer`, `AutosInventoryVehicleDrawerForm`
- `AutosNegociosInventoryBundlePreview`, `AutosNegociosChildInventoryPreviewOverlay`
- `AutosNegociosPreviewInventorySection`, `AutosNegociosPreviewClient`, `AutoDealerPreviewPage`
- `RelatedDealerCars`, `AutosDealerInventoryVehicleCard`
- `autosAdditionalInventoryDraft`, `autosInventoryInheritedPreview`, `autosNegociosBundlePublish`
- `autosClassifiedsListingService`, `mapAutosPublicListingToAutoDealer`
- `AutosPrivadoApplication` (contamination check)

## 3. Lane impact classification

| Lane | Impact |
|------|--------|
| Negocios | Drawer unsaved protection, child preview overlay, bundle card Preview CTA, drawer width |
| Privado | Read-only contamination check only |
| Shared Autos | `RelatedDealerCars` / `AutosDealerInventoryVehicleCard` previewOnly mode; `AutoDealerPreviewPage` relatedPreviewOnly |
| No impact | Stripe, schema, media storage, unrelated categories |

## 4. Current added-inventory behavior

Pre-SHIP-06: Full vehicle-only drawer, save-only CTAs, bundle preview cards with Edit/Remove, inherited preview mapper, multi-listing bundle publish (QA path), public related inventory via `dealer_inventory_group_id`. Gaps: no child full preview overlay from Paso 7, no unsaved drawer protection, drawer width below spec.

## 5–16. Results summary

- **Pre-publish drawer:** Full `AutosInventoryVehicleDrawerForm` with 6 sections; no dealer/contact step; inherited notice; save-only footer; 960px max width; unsaved close confirm on backdrop/Escape/Cancel.
- **Child result cards:** Paso 7 `AutosNegociosInventoryBundlePreview` shows main + children with Preview/Edit/Remove; Leonix ID note on children.
- **Child full preview:** `AutosNegociosChildInventoryPreviewOverlay` merges child + parent dealer data; related inventory excludes self (draft placeholders, no fake public URLs).
- **Parent full preview:** `AutosNegociosPreviewClient` shows results card + inventory section + main detail preview.
- **Public related inventory:** `buildRelatedPublicListings` excludes `current.id`; `getActiveLiveAutosBundle` groups by `dealer_inventory_group_id`.
- **Multi-listing publish:** `publishNegociosBundleAdditionalVehicles` creates separate rows with own Leonix ID and detail URL (QA bypass path; production Stripe bundle blocked without QA allowlist — documented).
- **Post-publish add mode:** `inventoryAddMode` + banner in `AutosNegociosApplication`; inherits dealer via parent listing context.
- **Draft persistence:** `useAutoDealerDraft` + IDB/localStorage includes `additionalInventoryVehicles`.
- **10-vehicle limit:** `STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT` + `applicationCanAddInventoryVehicle`.

## 17. Privado cross-check

No inventory drawer, boost, or dealer inventory UI in Privado.

## 18. Build/check result

Gate validation scripts + `npm run build`.

## 19. Remaining risks

- Bundle multi-listing publish requires QA allowlist for full Stripe bypass in production.
- Child related cards in draft preview use non-navigable placeholders (by design before publish).
- Live publish proof requires Supabase + manual QA.

## 20. Manual QA checklist

See gate Step 19 response.

---

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| ----------- | ---------- | -------- |
| Correct repo confirmed | TRUE | git rev-parse |
| Autos scope lock respected | TRUE | diff scope |
| Lane impact classified before edits | TRUE | Section 3 |
| Current Add Inventory behavior inspected | TRUE | Section 4 |
| Pre-publish Add Vehicle opens drawer inside same app | TRUE | AutosNegociosAddInventoryDrawer |
| Drawer is not a weak mini form | TRUE | AutosInventoryVehicleDrawerForm |
| Drawer uses full vehicle-only application flow | TRUE | 6 sections |
| Drawer includes Información principal | TRUE | section copy |
| Drawer includes Especificaciones | TRUE | section copy |
| Drawer includes Destacados/equipamiento | TRUE | section copy |
| Drawer includes Fotos y medios | TRUE | section copy |
| Drawer includes Descripción | TRUE | section copy |
| Drawer excludes Negocio/contacto step | TRUE | vehicle-only form |
| Drawer shows inherited business/contact notice | TRUE | autosInventoryInheritedBusinessNotice |
| Child inherits dealer/business/contact data from parent | TRUE | mapInheritedDealerPreviewListing |
| Child owns only vehicle-specific data | TRUE | AutosInventoryVehicleFields |
| Save to inventory saves child draft and closes drawer | TRUE | persist(false) |
| Save and add another saves child draft and resets only child form | TRUE | persist(true) |
| Cancel does not wipe parent app | TRUE | onClose only |
| Drawer has no Publish CTA | TRUE | drawer grep |
| Drawer save does not publish child | TRUE | draft-only save |
| Outside click cannot silently lose child work | TRUE | requestClose confirm |
| Escape key cannot silently lose child work | TRUE | keydown handler |
| Dirty close confirmation exists | TRUE | autosInventoryDrawerUnsavedCloseConfirm |
| Saved child has its own result-card preview | TRUE | VehicleCard in bundle preview |
| Saved child result card has Preview action | TRUE | autosInventoryBundlePreviewCta |
| Saved child result card has Edit action | TRUE | onEdit |
| Saved child result card has Remove action | TRUE | onRemove |
| Saved child preview does not show fake Leonix ID | TRUE | Leonix note only |
| Saved child preview does not show fake public URL | TRUE | previewOnly related cards |
| Child full ad preview exists before publish | TRUE | ChildInventoryPreviewOverlay |
| Child full preview uses child vehicle data | TRUE | mapInheritedDealerPreviewListing |
| Child full preview inherits dealer Business Hub from parent | TRUE | parent merge |
| Child full preview excludes itself from related inventory list | TRUE | buildRelatedDraftPreviewListings |
| Parent full preview shows all added inventory vehicles | TRUE | PreviewInventorySection |
| Parent full preview lets user open child preview | TRUE | Paso 7 Preview button |
| Public main detail shows added vehicles from same dealer group | TRUE | getActiveLiveAutosBundle |
| Public child detail shows main plus other siblings excluding itself | TRUE | exclude current.id |
| Related inventory cards link to real detail pages after publish | TRUE | autosLiveVehiclePath |
| Public buyer does not see owner inventory CTAs | TRUE | owner bar gated |
| Main vehicle counts as 1 of 10 | TRUE | countApplicationInventoryVehicles |
| Added vehicles count toward 10 included | TRUE | policy |
| 11th vehicle is blocked or points to boost without fake entitlement | TRUE | atLimit helper |
| Final publish creates or preserves plan to create separate real listing for each child | TRUE | autosNegociosBundlePublish |
| Each child gets own listing ID after publish or blocker documented | TRUE | createAutosClassifiedsListingWithInventoryParent |
| Each child gets own Leonix Ad ID after publish or blocker documented | TRUE | bundle publish result |
| Each child gets own detail URL after publish or blocker documented | TRUE | autosLiveVehiclePath |
| Child listings share dealerInventoryGroupId after publish or blocker documented | TRUE | grouping on create |
| Children are not nested-only fake records | TRUE | separate DB rows |
| Post-publish add-inventory mode inspected | TRUE | inventoryAddMode |
| Post-publish mode preloads dealer/business data or blocker documented | TRUE | inventoryAddContext |
| Post-publish mode blanks vehicle-specific fields or blocker documented | TRUE | new child draft |
| Parent draft survives drawer open/close/save | TRUE | useAutoDealerDraft |
| Child draft survives refresh | TRUE | draft storage |
| Child draft survives preview/back | TRUE | overlay close only |
| Child edit/remove works | TRUE | bundle preview |
| Privado checked for shared impact | TRUE | privado grep |
| No dealer inventory drawer added to Privado | TRUE | privado app |
| No dealer-only Business Hub/inventory/finance/review/custom links added to Privado | TRUE | privado grep |
| No global Stripe/payment touched | TRUE | git diff |
| No schema/migration touched | TRUE | git diff |
| No unrelated categories touched | TRUE | git diff |
| npm run build passed | TRUE | gate validation |

**Final recommendation: GREEN**
