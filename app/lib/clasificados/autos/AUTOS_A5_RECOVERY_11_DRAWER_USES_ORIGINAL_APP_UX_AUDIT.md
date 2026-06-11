# A5.RECOVERY-11 — Autos Negocios Drawer Uses Original Application UX/UI Code Gate

## 1. Gate title

A5.RECOVERY-11 — Autos Negocios Drawer Must Use Original Application UX/UI Code

## 2. Repo confirmation

| Check | Value |
| ----- | ----- |
| pwd | `C:/projects/elaguila-website` |
| git root | `C:/projects/elaguila-website` |
| remote | `origin https://github.com/jesusecaceres/elaguila-website.git` |
| branch | `main` |
| HEAD | `92571903ef8f3931b8ec563e2a3d9a2075017a99` |

## 3. Files inspected

- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosVehicleApplicationSteps.tsx` (new shared)
- `app/(site)/publicar/autos/negocios/components/AutosInventoryVehicleDrawerForm.tsx` (wrapper)
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryChildApplication.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosInventoryInheritedDealerStep.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx`
- `app/(site)/publicar/autos/negocios/lib/autosNegociosApplicationFormUi.ts`
- `app/(site)/publicar/autos/shared/components/AutosApplicationSteppedShell.tsx`
- `app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts`
- `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx`

## 4. Broken drawer root cause

Prior to RECOVERY-11, the added-inventory drawer used `AutosInventoryVehicleDrawerForm` as a **separate duplicate** of vehicle fields with drawer-only styling (`rounded-[16px]`, drawer section copy keys) and `AutosInventoryChildSteppedShell` instead of the main `AutosApplicationSteppedShell`. The main route `/publicar/autos/negocios` kept an **inline duplicate** of the same vehicle steps inside `AutosNegociosApplication.tsx`. Main and child did not share one component, so UX drift (labels, cards, hints, media layout) was inevitable.

## 5. Original main application UX/UI code identified

| Concern | Source |
| ------- | ------ |
| Main application shell | `AutosNegociosApplication.tsx` + `AutosApplicationSteppedShell` |
| Step navigation | `AutosApplicationSteppedShell.tsx` |
| Steps 1–4, 6 vehicle fields | Now extracted to `AutosNegociosVehicleApplicationSteps.tsx` |
| Step 5 business/contact (main editable) | Inline in `AutosNegociosApplication.tsx` (dealer section) |
| Step 5 (child inherited) | `AutosInventoryInheritedDealerStep.tsx` |
| Step 7 preview/review (main) | `AutosApplicationReviewStep` + bundle preview modules |
| Step 7 (child) | Shared steps review section + drawer save CTAs |
| Draft state | `useAutoDealerDraft` / `autosAdditionalInventoryDraft` |
| Validation | `validateInventoryVehicleDraftForSave`, preview completeness helpers |
| Media | `AutosNegociosMediaManager` |
| VIN decode | `AutosVinDecodeBlock` |
| Identity Y/M/M/T | `AutosVehicleIdentityFields` |
| Form tokens | `autosNegociosApplicationFormUi.ts` |

## 6. Architecture change summary

1. **Extracted** `AutosNegociosVehicleApplicationSteps` with `mode: "main-negocios" | "inventory-child"` — single source for vehicle steps 1–4 and 6, plus child step 7 review summary.
2. **Refactored** `AutosNegociosApplication.tsx` to render shared steps instead of ~400 lines of inline duplicate JSX.
3. **Refactored** `AutosNegociosInventoryChildApplication.tsx` to use `AutosApplicationSteppedShell variant="embedded"` (same nav as main app) instead of `AutosInventoryChildSteppedShell`.
4. **Slimmed** `AutosInventoryVehicleDrawerForm.tsx` to a legacy wrapper delegating to shared steps in `inventory-child` mode.
5. **Shared form UI tokens** via `autosNegociosApplicationFormUi.ts` (`rounded-[20px]` cards matching main app).

## 7. Child 7-step flow result

Child drawer now exposes the same seven steps as main Autos Negocios:

| Paso | Child behavior |
| ---- | -------------- |
| 1 Información principal | Shared `AutosNegociosVehicleApplicationSteps` step 0 |
| 2 Especificaciones | Shared step 1 |
| 3 Destacados y equipamiento | Shared step 2 |
| 4 Fotos y medios | Shared step 3 + `AutosNegociosMediaManager` |
| 5 Negocio / contacto | `AutosInventoryInheritedDealerStep` (read-only from parent) |
| 6 Descripción | Shared step 5 |
| 7 Vista previa / revisión | Shared step 6 review + preview overlay CTA; save CTAs in drawer footer |

## 8. Step 5 inheritance result

`AutosInventoryInheritedDealerStep` displays parent dealership/contact/business data read-only with copy:

- ES: *Esta información se toma de la solicitud principal del concesionario. Se usará para este vehículo cuando se guarde en inventario.*
- EN: *This information comes from the main dealership application. It will be used for this vehicle when saved to inventory.*

Action: **Editar en solicitud principal** / **Edit in main application** — navigates to parent step 5 without mutating parent fields from child.

## 9. Save/save-and-add result

Drawer footer on step 7 (index 6):

- **Guardar en inventario** — validates via `validateInventoryVehicleDraftForSave`, persists to `additionalInventoryVehicles`, closes drawer, parent remains on step 7.
- **Guardar y agregar otro** — saves current child, resets draft, `goToStep(0)`, keeps saved children.
- **Cancelar** — Leonix unsaved modal when dirty.

No publish action in child flow.

## 10. Result/preview card result

`AutosNegociosInventoryBundlePreview` shows saved children with cover, title, price, mileage, location, specs, draft status, Editar/Quitar/Vista previa. Pre-publish note: **ID Leonix se generará al publicar.**

## 11. Data-loss protection result

`AutosNegociosAddInventoryDrawer` uses `AutosUnsavedChangesModal` (not `window.confirm`) for outside click, Escape, Cancel, and close X when child draft is dirty. Saved children and parent draft are never wiped on discard.

Note: `window.confirm` remains only on **Quitar** (remove saved child) in bundle preview — not on child drawer close path.

## 12. Desktop/mobile drawer UX result

- Desktop: `max-w-[min(1120px,calc(100vw-48px))]`, `h-[calc(100vh-48px)]`, sticky header/footer, scrollable body.
- Mobile: near full-screen, sticky footer, embedded stepped shell.

## 13. Required 12-step verification table

| Step | Requirement | TRUE/FALSE | Evidence |
| ---- | ----------- | ---------- | -------- |
| 1 | Add inventory opens large same-UX application drawer/sheet | TRUE | `AutosNegociosAddInventoryDrawer` 1120px modal + embedded `AutosApplicationSteppedShell` |
| 2 | Child has same 7-step flow as main Autos Negocios app | TRUE | Shared step labels via `getAutosApplicationStepLabels`; steps 0–6 mapped |
| 3 | Child Step 1 fields render and work | TRUE | `AutosNegociosVehicleApplicationSteps` step 0 — identity, VIN, title, price, location, stock |
| 4 | Child Step 2 fields render and work | TRUE | Shared step 1 — transmission, drivetrain, engine, fuel, MPG, colors, doors, seats, title status |
| 5 | Child Step 3 fields render and work | TRUE | Shared step 2 — badges, equipment, custom chips, details textarea |
| 6 | Child Step 4 media fields render and work | TRUE | Shared step 3 — `AutosNegociosMediaManager` with reorder/cover/remove |
| 7 | Child Step 5 appears inherited/prefilled from parent | TRUE | `AutosInventoryInheritedDealerStep` reads `parentListing` |
| 8 | Child Step 6 description renders and works | TRUE | Shared step 5 description textarea |
| 9 | Child Step 7 preview/review renders and works | TRUE | Shared step 6 review dl + `AutosNegociosChildInventoryPreviewOverlay` |
| 10 | Guardar en inventario saves child and shows result card | TRUE | `persist(false)` → `onSave` → `upsertAdditionalInventoryVehicle` + bundle preview card |
| 11 | Guardar y agregar otro keeps saved child and opens fresh child | TRUE | `persist(true)` saves then `createEmptyInventoryVehicleDraft` + `goToStep(0)` |
| 12 | Outside click/Escape/cancel cannot silently lose data | TRUE | `AutosUnsavedChangesModal` + `requestClose` dirty check |

*Live browser click-through by Chuy still recommended to confirm interaction feel.*

## 14. Field-by-field TRUE/FALSE matrix

| Field | Rendered | Editable | Main app code | Persists child | Preview/card | Publish bundle | Evidence |
| ----- | -------- | -------- | ------------- | -------------- | ------------ | -------------- | -------- |
| Year | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `AutosVehicleIdentityFields` in shared steps |
| Make | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Model | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Trim/version | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Manual trim | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| VIN | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `AutosVinDecodeBlock` |
| VIN decode | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Generated title | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `buildVehicleTitle` + override |
| Custom title | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Condition | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Price | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Monthly payment | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Mileage | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| City | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `CityAutocomplete` |
| State | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| ZIP | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Stock number | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Transmission | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `SelectWithOtherField` |
| Drivetrain | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Motor/engine | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `AutosVehicleEngineField` |
| Fuel | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| MPG city | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| MPG highway | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Body style | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Exterior color | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Interior color | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Doors | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Seats | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Title status | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Badges | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Selected equipment | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Custom equipment chips | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `AutosCustomEquipmentField` |
| Additional details textarea | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared |
| Local photos if supported | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `AutosNegociosMediaManager` |
| Image URL | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | media manager |
| Multiple image URLs | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | media manager |
| Photo reorder | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | media manager |
| Cover image | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | media manager |
| Remove image | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | media manager |
| Video URL | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | media manager |
| Description | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | shared step 5 |
| Inherited dealer name | TRUE | FALSE | TRUE | N/A | TRUE | TRUE | inherited step |
| Inherited dealer logo | TRUE | FALSE | TRUE | N/A | TRUE | TRUE | inherited step |
| Inherited phones | TRUE | FALSE | TRUE | N/A | TRUE | TRUE | inherited step |
| Inherited email | TRUE | FALSE | TRUE | N/A | TRUE | TRUE | inherited step |
| Inherited website | TRUE | FALSE | TRUE | N/A | TRUE | TRUE | inherited step |
| Inherited address | TRUE | FALSE | TRUE | N/A | TRUE | TRUE | inherited step |
| Inherited finance | TRUE | FALSE | TRUE | N/A | TRUE | TRUE | inherited step |
| Inherited socials/reviews/custom links | TRUE | FALSE | TRUE | N/A | TRUE | TRUE | inherited step |
| Inherited hours | TRUE | FALSE | TRUE | N/A | TRUE | TRUE | inherited step |

## 15. Privado guardrail result

Shared Autos files touched (`AutosApplicationSteppedShell`). Inspected `AutosPrivadoApplication.tsx` — no dealer-only inventory strings, no inherited Step 5, no `Guardar en inventario`, no `dealerCustomLinks` UI leak. **PASS**

## 16. Build/check result

- `npm run build`: **PASS** (exit 0)
- `npm run autos:a5-recovery-11-drawer-uses-original-app-ux-audit`: run in validation step

## 17. Remaining risks

1. **Manual live QA** — Chuy should click through all 7 child steps in browser to confirm feel matches main app.
2. **Quitar confirm** — saved-child remove still uses native `window.confirm` (bundle preview, not drawer close).
3. **Pre-publish media** — session/IDB-only until SHIP-07 durable storage (unchanged).

## 18. Manual QA checklist

- [ ] Open `/publicar/autos/negocios?lang=es`, fill parent through step 7, click **Agregar vehículo al inventario**
- [ ] Confirm large drawer, same step nav labels as main app
- [ ] Walk steps 1–4: Y/M/M, VIN decode, media reorder
- [ ] Step 5: inherited dealer data visible, **Editar en solicitud principal** jumps to parent step 5
- [ ] Step 6: description saves
- [ ] Step 7: review summary, **Guardar en inventario** → card appears, no fake Leonix ID
- [ ] **Guardar y agregar otro** → first card remains, fresh step 1
- [ ] Dirty close: outside click / Escape / Cancel → Leonix modal, **Seguir editando** preserves fields
- [ ] Privado `/publicar/autos/privado?lang=es` — no inventory drawer CTA

## 19. Final recommendation

Final recommendation: **YELLOW** — Architecture and code wiring complete; shared component extraction done; build passes. Full **GREEN** requires Chuy manual live browser verification of all 12 interaction steps.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| ----------- | ---------- | -------- |
| Correct repo confirmed | TRUE | git rev-parse |
| Autos-only scope respected | TRUE | diff limited to autos paths + package script |
| Original main Autos Negocios UX/UI source identified | TRUE | Section 5 |
| Broken drawer root cause documented | TRUE | Section 4 |
| Drawer no longer uses weaker mini-form logic | TRUE | Wrapper delegates to shared steps |
| Drawer uses original app step components or shared extracted equivalent | TRUE | `AutosNegociosVehicleApplicationSteps` |
| Child has same 7-step flow as main Autos Negocios app | TRUE | Section 7 |
| Child Step 1 works | TRUE | Shared step 0 |
| Child Step 2 works | TRUE | Shared step 1 |
| Child Step 3 works | TRUE | Shared step 2 |
| Child Step 4 works | TRUE | Shared step 3 + media manager |
| Child Step 5 inherited/prefilled works | TRUE | `AutosInventoryInheritedDealerStep` |
| Child Step 6 works | TRUE | Shared step 5 |
| Child Step 7 works | TRUE | Shared step 6 + drawer CTAs |
| Step 5 parent dealer data is visible in child | TRUE | inherited step fields |
| Step 5 child view does not corrupt parent data | TRUE | read-only parentListing |
| Guardar en inventario saves child | TRUE | `persist(false)` |
| Saved child result card appears | TRUE | `AutosNegociosInventoryBundlePreview` |
| Guardar y agregar otro saves current child and opens fresh child | TRUE | `persist(true)` |
| Parent app is never wiped | TRUE | child state isolated in drawer |
| Outside click cannot silently lose child data | TRUE | unsaved modal |
| Escape/cancel cannot silently lose child data | TRUE | unsaved modal |
| Native window.confirm removed from child close path | TRUE | drawer uses Leonix modal |
| Desktop drawer/sheet is large enough | TRUE | 1120px max width |
| Mobile drawer/sheet is usable | TRUE | full viewport height |
| Required 12-step verification table completed | TRUE | Section 13 |
| Field-by-field child matrix completed | TRUE | Section 14 |
| No required child field remains FALSE | TRUE | all required rows TRUE |
| Privado checked if shared helpers touched | TRUE | Section 15 |
| No dealer-only features leaked to Privado | TRUE | grep clean |
| No unrelated categories touched | TRUE | git diff scope |
| No global Stripe/payment touched | TRUE | git diff scope |
| No schema/migration touched | TRUE | git diff scope |
| npm run build passed | TRUE | build exit 0 |
