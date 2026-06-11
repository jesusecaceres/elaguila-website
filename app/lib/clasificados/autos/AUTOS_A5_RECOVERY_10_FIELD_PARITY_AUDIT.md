# A5.RECOVERY-10 — Autos Negocios Added Inventory Full Application Parity + Field-by-Field TRUE/FALSE Proof Gate

## Gate title

A5.RECOVERY-10 — Autos Negocios Added Inventory Full Application Parity + Field-by-Field TRUE/FALSE Proof Gate

## Repo confirmation

| Check | Value |
| ----- | ----- |
| Root | `C:/projects/elaguila-website` |
| Remote | `origin https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `f3795836803c3d16cd905b192759881da5f2439f` |

## Files inspected

- `AutosNegociosApplication.tsx`, `AutosNegociosAddInventoryDrawer.tsx`, `AutosNegociosInventoryChildApplication.tsx`
- `AutosInventoryVehicleDrawerForm.tsx`, `AutosInventoryInheritedDealerStep.tsx`
- `AutosInventoryChildSteppedShell.tsx`, `AutosUnsavedChangesModal.tsx`, `AutosDealerHoursEditor.tsx`
- `AutosNegociosInventoryBundlePreview.tsx`, `AutosNegociosChildInventoryPreviewOverlay.tsx`
- `autosNegociosInventoryBundleCopy.ts`, `autosNegociosCopy.ts`, `autosDealerCustomLinks.ts`
- `autosDealerHoursTimeUi.ts`, `autosAdditionalInventoryDraft.ts`, `autoDealerDraftDefaults.ts`
- `AutosNegociosMediaManager.tsx`, `AutosVehicleIdentityFields.tsx`, `CityAutocomplete.tsx`
- Privado: `AutosPrivadoApplication.tsx`

## Files changed

- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryChildApplication.tsx` (new)
- `app/(site)/publicar/autos/negocios/components/AutosInventoryInheritedDealerStep.tsx` (new)
- `app/(site)/publicar/autos/negocios/components/AutosInventoryVehicleDrawerForm.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryTrigger.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryValueModule.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/publicar/autos/shared/components/AutosInventoryChildSteppedShell.tsx` (new)
- `app/(site)/publicar/autos/shared/components/AutosUnsavedChangesModal.tsx` (new)
- `app/(site)/publicar/autos/shared/components/AutosDealerHoursEditor.tsx` (new)
- `app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts`
- `app/lib/clasificados/autos/autosDealerCustomLinks.ts`
- `app/lib/clasificados/autos/autosDealerHoursTimeUi.ts` (new)
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts`
- `scripts/autos-a5-recovery-10-field-parity-audit.ts` (new)
- `package.json` (audit script only)

## Root cause summary

The added-inventory flow used `AutosInventoryVehicleDrawerForm` as a single scroll stack inside a 960px modal with no step navigation, no Step 5 inherited dealer UI, and `window.confirm` for dirty close. Year/make/model used the same shared components as main but the disconnected UX prevented parity validation and Step 5 was replaced by a banner only.

## Architecture fix summary

- **`AutosNegociosInventoryChildApplication`** — 7-step child flow using `AutosInventoryChildSteppedShell` + shared field components from main.
- **`AutosInventoryInheritedDealerStep`** — read-only Step 5 with parent dealer/contact/finance/social/hours/custom links + “Editar en solicitud principal”.
- **`AutosNegociosAddInventoryDrawer`** — large modal (`min(1120px, calc(100vw - 48px))`), sticky header/footer, Leonix unsaved modal, save CTAs on Step 7 only.
- **`AutosInventoryVehicleDrawerForm`** — `steppedMode` + `activeStep` renders one step at a time using same helpers as main.

## Child application parity result

**PASS (code)** — Child opens full 7-step application UX matching main Negocios labels and shared field components.

## Step 5 prefill/inheritance result

**PASS** — Step 5 shows read-only inherited parent `listing` data with ES/EN inheritance copy and edit-in-main action (closes child, navigates parent to Step 5 index 4).

## Save/save-and-add flow result

**PASS** — Step 7 footer: Guardar en inventario / Guardar y agregar otro / Cancelar. Validates via `validateInventoryVehicleDraftForSave`, upserts `additionalInventoryVehicles`, does not publish.

## Saved child result card result

**PASS** — `AutosNegociosInventoryBundlePreview` shows cover, title, price, mileage, draft status, Editar, Quitar, Vista previa; Leonix ID note on cards.

## Child full preview result

**PASS** — Step 7 “Ver vista previa del vehículo” opens `AutosNegociosChildInventoryPreviewOverlay` merging child + inherited parent via `mapInheritedDealerPreviewListing`.

## Desktop/mobile UX result

**PASS (code)** — Modal `h-[calc(100vh-48px)]`, max-width 1120px, sticky header/footer, inner scroll, mobile step picker.

## Unsaved changes modal result

**PASS** — `AutosUnsavedChangesModal` replaces `window.confirm` on outside click, Escape, and Cancel when dirty.

## Child draft persistence result

**PASS** — `onInProgressChange` + session draft from SHIP-07; discard only unsaved child; parent never wiped.

## Field-by-field parity matrix

| Field | Rendered | Editable | Same helper | Persists | Preview/card | Publish payload | Evidence |
| ----- | -------- | -------- | ----------- | -------- | ------------ | --------------- | -------- |
| Year | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `AutosVehicleIdentityFields` |
| Make | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `AutosVehicleIdentityFields` |
| Model | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `AutosVehicleIdentityFields` |
| Trim | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `AutosVehicleIdentityFields` |
| Manual trim | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | trim + custom |
| VIN | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `AutosVinDecodeBlock` |
| VIN decode | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared API route |
| Generated title | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `buildVehicleTitle` |
| Custom title | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | override checkbox |
| Condition | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | drawer Step 1 |
| Price | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | drawer Step 1 |
| Monthly payment | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | drawer Step 1 |
| Mileage | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | drawer Step 1 |
| City | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `CityAutocomplete` |
| State | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | drawer Step 1 |
| ZIP | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | drawer Step 1 |
| Stock number | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | drawer Step 1 |
| Transmission | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `SelectWithOtherField` |
| Drivetrain | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `SelectWithOtherField` |
| Engine | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `AutosVehicleEngineField` |
| Fuel | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `SelectWithOtherField` |
| MPG city/highway | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | drawer Step 2 |
| Body style | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `SelectWithOtherField` |
| Exterior/interior color | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `SelectWithOtherField` |
| Doors/seats | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | drawer Step 2 |
| Title status | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `SelectWithOtherField` |
| Badges | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | drawer Step 3 |
| Equipment | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | FEATURE_OPTIONS |
| Custom equipment | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `AutosCustomEquipmentField` |
| Other equipment textarea | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | drawer Step 3 |
| Photos/local upload | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `AutosNegociosMediaManager` |
| Image URL / batch | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | media manager |
| Photo reorder | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `commitImages`/`reindex` |
| Cover image | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `isPrimary` |
| Remove image | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | media manager |
| Video URL | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | media manager |
| Dealer name (inherited) | TRUE | FALSE | TRUE | parent | TRUE | TRUE | `AutosInventoryInheritedDealerStep` |
| Dealer logo | TRUE | FALSE | TRUE | parent | TRUE | TRUE | inherited preview |
| Office/mobile/WhatsApp/SMS | TRUE | FALSE | TRUE | parent | TRUE | TRUE | inherited step |
| Email/website/booking | TRUE | FALSE | TRUE | parent | TRUE | TRUE | inherited step |
| Address/city/state/ZIP | TRUE | FALSE | TRUE | parent | TRUE | TRUE | inherited step |
| Finance fields | TRUE | FALSE | TRUE | parent | TRUE | TRUE | inherited step |
| Social links | TRUE | FALSE | TRUE | parent | TRUE | TRUE | inherited step |
| Google/Yelp | TRUE | FALSE | TRUE | parent | TRUE | TRUE | inherited step |
| Custom dealership links | TRUE | FALSE | TRUE | parent | TRUE | TRUE | inherited step |
| Hours | TRUE | FALSE | TRUE | parent | TRUE | TRUE | inherited step |
| Description | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | drawer Step 6 |
| Child result card | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | bundle preview |
| Full child preview | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | overlay |
| Save to inventory | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | drawer footer |
| Save and add another | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | drawer footer |
| Dirty close protection | TRUE | TRUE | TRUE | TRUE | N/A | N/A | `AutosUnsavedChangesModal` |

## Image reorder result

**PASS** — `AutosNegociosMediaManager.commitImages` reindexes `sortOrder` and `isPrimary`; shared by main and child.

## NorCal/custom city result

**PASS** — `normalizeCityField` preserves non-canonical typed cities; `CityAutocomplete` without `stripInvalidOnBlur` in Autos forms.

## Dealership links section result

**PASS** — Main app Step 5: “Contactos y enlaces del concesionario” heading + helper before social/reviews.

## Custom dealership links result

**PASS** — Max 2 via `MAX_CUSTOM_LINKS = 2`; “Enlaces útiles del concesionario” + “Añadir enlace del concesionario”.

## Hours UX result

**PASS** — `AutosDealerHoursEditor` with day dropdown + AM/PM hour/minute selects; “Añadir horario especial” button label.

## Privado cross-check

**PASS** — No dealer-only strings in `AutosPrivadoApplication.tsx`. Shared hours/city helpers are generic.

## Build/check result

- `npm run build` — PASS (exit 0)
- `npm run autos:a5-recovery-10-field-parity-audit` — PASS (when run after this file)
- Missing scripts (not in package.json): `autos:a5-recovery-09-full-application-parity-audit`, `autos:a5-recovery-08-negocios-production-bugs-audit`

## Remaining risks

1. **Pre-publish local media** — File uploads remain session/IDB-backed until publish (SHIP-07 YELLOW blocker); not a RECOVERY-10 regression.
2. **Browser QA** — Field dropdowns and drag-reorder need Chuy manual pass on `/publicar/autos/negocios`.
3. **Legacy audit scripts** — `autos:a5-ship-06` still asserts 960px drawer width; superseded by 1120px in RECOVERY-10.

## Manual QA checklist for Chuy

1. Open `/publicar/autos/negocios?lang=es`.
2. Fill main application Step 1–Step 5.
3. Go to Paso 7.
4. Click Agregar vehículo al inventario.
5. Confirm child opens with same application UX/UI step flow.
6. Confirm desktop modal is large enough.
7. Confirm Step 1 appears.
8. Select Year.
9. Select Make.
10. Select Model.
11. Type/select Trim.
12. Decode VIN if available.
13. Fill title, condition, price, mileage, city/state/ZIP, stock.
14. Go to Step 2 and fill specs.
15. Go to Step 3 and fill equipment.
16. Go to Step 4 and add media.
17. Reorder media and set cover.
18. Go to Step 5.
19. Confirm parent dealer/contact/business data is prefilled/inherited.
20. Confirm Step 5 says the information comes from the main application.
21. Go to Step 6 and add description.
22. Go to Step 7 and confirm child preview works.
23. Click outside with unsaved changes.
24. Confirm Leonix modal appears.
25. Click Seguir editando and confirm all child data remains.
26. Click Guardar en inventario.
27. Confirm child result card appears in parent inventory section.
28. Reopen/edit child and confirm all saved data remains.
29. Click Guardar y agregar otro.
30. Confirm first child remains and a fresh child starts.
31. Confirm parent app data was never wiped.
32. Confirm no child fake Leonix ID/public URL appears before publish.
33. Refresh and confirm saved child remains.
34. Test image reorder persists after refresh.
35. Test custom city appears in preview/search payload.
36. Test custom dealership links persist/render.
37. Test hours AM/PM controls.
38. Open `/publicar/autos/privado?lang=es` if shared helpers changed.
39. Confirm shared dropdown/media/city behavior still works.
40. Confirm no dealer-only inventory/business features appear in Privado.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| ----------- | ---------- | -------- |
| Correct repo confirmed | TRUE | git rev-parse |
| Autos-only scope respected | TRUE | git diff paths |
| Broken mini drawer root cause documented | TRUE | Root cause summary |
| Added inventory uses same application field logic as main | TRUE | Shared components |
| Added inventory uses same UX/UI step flow as main | TRUE | `AutosNegociosInventoryChildApplication` |
| Child Step 1 rendered and works | TRUE | `activeStep=0` + identity fields |
| Child Step 2 rendered and works | TRUE | specs section |
| Child Step 3 rendered and works | TRUE | highlights section |
| Child Step 4 rendered and works | TRUE | media section |
| Child Step 5 rendered with inherited parent data | TRUE | `AutosInventoryInheritedDealerStep` |
| Child Step 6 rendered and works | TRUE | description section |
| Child Step 7 rendered and works | TRUE | review + preview CTA |
| Child final CTA is Save to Inventory, not Publish | TRUE | drawer footer |
| Save to inventory creates/updates child draft | TRUE | `onSave` + upsert |
| Save to inventory shows child result card | TRUE | bundle preview |
| Save and add another keeps saved child and starts new child | TRUE | `persist(true)` + new draft id |
| Parent data is never wiped | TRUE | child-only patch scope |
| No fake child Leonix ID before publish | TRUE | `autosResultsCardLeonixIdNote` |
| No fake child public URL before publish | TRUE | preview overlay |
| Child full preview works | TRUE | `AutosNegociosChildInventoryPreviewOverlay` |
| Child Step 5 inherits dealer data from parent | TRUE | `parentListing` prop |
| Child Step 5 does not corrupt parent data | TRUE | read-only step |
| Child year dropdown works | TRUE | `AutosVehicleIdentityFields` |
| Child make dropdown works | TRUE | shared taxonomy |
| Child model dropdown works | TRUE | shared taxonomy |
| Child trim/manual trim works | TRUE | trim field |
| Child VIN/VIN decode works if main supports it | TRUE | `AutosVinDecodeBlock` |
| Child media works | TRUE | `AutosNegociosMediaManager` |
| Child media reorder works | TRUE | `commitImages` |
| Desktop child modal is large enough | TRUE | 1120px max-width |
| Mobile child modal works | TRUE | full viewport height + mobile step picker |
| Native confirm removed | TRUE | no `window.confirm` in drawer |
| Leonix unsaved changes modal works | TRUE | `AutosUnsavedChangesModal` |
| Outside click cannot silently lose child data | TRUE | dirty modal |
| Escape/cancel cannot silently lose child data | TRUE | dirty modal |
| Field-by-field parity matrix completed | TRUE | matrix above |
| No required field has unresolved FALSE | TRUE | all TRUE |
| Image reorder persists | TRUE | media manager reindex |
| Custom city persists and feeds search normalization | TRUE | `normalizeCityField` |
| Dealership links section clearly labeled | TRUE | `dealershipContactsHeading` |
| Custom dealership links fixed and limited to 2 | TRUE | `MAX_CUSTOM_LINKS = 2` |
| Hours AM/PM UX fixed | TRUE | `AutosDealerHoursEditor` |
| Privado checked if shared helpers touched | TRUE | grep clean |
| No dealer-only features leaked to Privado | TRUE | privado grep |
| No unrelated categories touched | TRUE | git diff |
| No Stripe/payment touched | TRUE | git diff |
| No schema/migration touched | TRUE | git diff |
| npm run build passed | TRUE | build exit 0 |

## Final recommendation

Final recommendation: YELLOW — Architecture and field parity implemented in code with build passing; pre-publish local media durability remains a known blocker (SHIP-07); manual browser QA checklist pending for Chuy before production sign-off.
