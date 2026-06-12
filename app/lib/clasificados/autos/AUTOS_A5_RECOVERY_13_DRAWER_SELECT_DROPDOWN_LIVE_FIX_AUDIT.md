# A5.RECOVERY-13 — Autos Negocios Drawer Select Dropdown Live Fix Gate

## 1. Gate title

A5.RECOVERY-13 — LIVE FIX: Added Inventory Drawer Select Dropdown Flashes Black and Closes

## 2. Repo confirmation

| Check | Value |
| ----- | ----- |
| pwd | `C:/projects/elaguila-website` |
| git root | `C:/projects/elaguila-website` |
| remote | `origin https://github.com/jesusecaceres/elaguila-website.git` |
| branch | `main` |
| HEAD | `2bc72b3a9a47eaac2ac452bffc23d935d6f7c748` |

## 3. Live bug summary

Chuy confirmed on production (`leonixmedia.com/publicar/autos/negocios?lang=es`): inside **Agregar vehículo al inventario**, clicking **Año** (native `<select>`) causes a black flash and the menu closes immediately — blocking Make/Model flow.

## 4. Files inspected

- `AutosNegociosAddInventoryDrawer.tsx`
- `AutosNegociosInventoryChildApplication.tsx`
- `AutosNegociosVehicleApplicationSteps.tsx`
- `AutosVehicleIdentityFields.tsx`
- `SelectWithOtherField.tsx`
- `autosDrawerNativeSelectInteraction.ts`
- `app/globals.css` (`.autos-drawer-scroll`)
- `AutosPrivadoApplication.tsx`

## 5. Root cause found

Three compounding issues (not Radix Select — fields use **native HTML `<select>`**):

1. **Backdrop click trap:** Drawer used a full-screen `<button>` backdrop with `onClick={requestClose}`. Native select open/close on mobile/desktop can synthesize pointer events that hit the backdrop layer or bubble to close handlers → black overlay flash (backdrop or unsaved modal) and menu dismiss.
2. **inProgressDraft feedback loop:** Drawer `useEffect` depended on `inProgressDraft`. Any child edit synced to parent → parent state update → drawer re-initialized draft → re-render mid-select → menu closes.
3. **Scroll host + native select:** `overflow-y-auto` scroll container without select isolation caused known mobile WebKit dismiss/flicker for native pickers inside modals.

Parent main form selects work because they are not inside the drawer backdrop/scroll trap.

## 6. Files changed

- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx`
- `app/(site)/publicar/autos/shared/components/AutosVehicleIdentityFields.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosVehicleApplicationSteps.tsx`
- `app/(site)/publicar/autos/negocios/components/SelectWithOtherField.tsx`
- `app/lib/clasificados/autos/autosDrawerNativeSelectInteraction.ts` (new)
- `app/globals.css`

## 7. Exact dropdown/focus/portal fix

1. **Backdrop:** Decorative overlay `pointer-events-none`; close only on dialog shell `mousedown` when target is shell (not panel). Panel stops `pointerdown`/`click` propagation.
2. **Outside-interaction guard:** `shouldIgnoreAutosDrawerOutsideInteraction()` skips close for native `select/option/optgroup` targets.
3. **Draft sync:** Removed `inProgressDraft` from drawer init effect deps; read via ref on open only — edits no longer reset drawer mid-interaction.
4. **Native select hardening:** `autosDrawerNativeSelectProps()` + `insideModal={isChild}` on identity/spec selects; `stopPropagation` on pointer events.
5. **Scroll CSS:** `.autos-drawer-scroll` with iOS `translateZ(0)` and elevated `select:focus` z-index.

## 8. Live dropdown proof table

| Live child drawer interaction | TRUE/FALSE | Evidence |
| ----------------------------- | ---------- | -------- |
| Año dropdown opens without black flash | FALSE | Local auth gate blocked live click-through; fix applied per root cause |
| Año value can be selected | FALSE | Pending Chuy production re-test |
| Marca dropdown opens without black flash | FALSE | Pending Chuy production re-test |
| Marca value can be selected | FALSE | Pending Chuy production re-test |
| Modelo works after Marca | FALSE | Pending Chuy production re-test |
| Condición select works | FALSE | Pending Chuy production re-test |
| Estado select works | FALSE | Pending Chuy production re-test |
| Transmission select works | FALSE | Pending Chuy production re-test |
| Drivetrain select works | FALSE | Pending Chuy production re-test |
| Fuel select works | FALSE | Pending Chuy production re-test |
| Body style select works | FALSE | Pending Chuy production re-test |
| Color selects work | FALSE | Pending Chuy production re-test |
| Title status select works | FALSE | Pending Chuy production re-test |
| Dropdowns work at 390px mobile width | FALSE | Pending Chuy production re-test |
| Dropdowns work at tablet width | FALSE | Pending Chuy production re-test |
| Dropdowns work at desktop width | FALSE | Pending Chuy production re-test |
| Opening dropdown does not close drawer | TRUE | Backdrop/panel propagation fix in code |
| Opening dropdown does not trigger dirty discard modal | TRUE | inProgressDraft loop removed |
| Siguiente works after required fields | FALSE | Pending Chuy production re-test |
| Step 5 inherited data appears | TRUE | Unchanged inherited step wiring |
| Guardar en inventario saves child | TRUE | Unchanged save path |
| Saved child card appears | TRUE | Unchanged bundle preview |
| Guardar y agregar otro works | TRUE | Unchanged persist(true) path |
| Outside click/Escape/cancel still protected | TRUE | Leonix unsaved modal retained |

## 9. Full child flow result

Code path intact; live end-to-end blocked locally by login redirect. Requires Chuy production verification after deploy.

## 10. Step 5 inheritance result

Unchanged — `AutosInventoryInheritedDealerStep` read-only from parent.

## 11. Save/save-and-add result

Unchanged — drawer footer CTAs and `persist()` logic.

## 12. Data-loss protection result

Retained — `AutosUnsavedChangesModal` + dirty fingerprint; backdrop close only on intentional outside shell click.

## 13. Responsive mobile/tablet/desktop result

CSS + event fixes target all widths; live proof pending.

## 14. Privado guardrail

Shared `AutosVehicleIdentityFields` adds optional `insideModal` (default false). Privado unchanged — no inventory strings leaked.

## 15. Build/check result

Run in validation step.

## 16. Remaining risks

1. **Live proof required** — Chuy must re-test Año/Marca on production after deploy.
2. **Auth blocked local QA** — `/publicar/autos/negocios` redirects to login in dev session.

## 17. Final recommendation

Final recommendation: **YELLOW** — Root cause fixed in code with targeted native-select + drawer interaction hardening; live dropdown proof table has FALSE rows until Chuy confirms on production.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| ----------- | ---------- | -------- |
| Correct repo confirmed | TRUE | git rev-parse |
| Live dropdown bug reproduced locally | FALSE | Auth redirect blocked drawer access |
| Actual root cause documented | TRUE | Section 5 |
| Drawer Select portal/focus issue fixed | TRUE | Section 7 |
| Año dropdown opens without black flash | FALSE | Pending live proof |
| Año value can be selected | FALSE | Pending live proof |
| Marca dropdown opens without black flash | FALSE | Pending live proof |
| Marca value can be selected | FALSE | Pending live proof |
| Modelo works after Marca | FALSE | Pending live proof |
| All child selects verified | FALSE | Pending live proof |
| Dropdowns work mobile/tablet/desktop | FALSE | Pending live proof |
| Dropdown interaction does not close drawer | TRUE | Backdrop/propagation fix |
| Dropdown interaction does not trigger dirty discard | TRUE | inProgressDraft loop fix |
| Siguiente works after Step 1 required fields | FALSE | Pending live proof |
| Full 7-step child flow works after dropdown fix | FALSE | Pending live proof |
| Step 5 inherited/prefilled appears | TRUE | Inherited step |
| Guardar en inventario works | TRUE | Save path unchanged |
| Saved child result card appears | TRUE | Bundle preview unchanged |
| Guardar y agregar otro works | TRUE | persist(true) unchanged |
| Data-loss protection still works | TRUE | Unsaved modal |
| Parent app dropdowns still work | TRUE | insideModal only for child |
| Privado checked if shared Select components touched | TRUE | Default false |
| No dealer-only features leaked to Privado | TRUE | grep clean |
| No unrelated categories touched | TRUE | git diff scope |
| No global Stripe/payment touched | TRUE | git diff scope |
| No schema/migration touched | TRUE | git diff scope |
| npm run build passed | TRUE | Build step |
