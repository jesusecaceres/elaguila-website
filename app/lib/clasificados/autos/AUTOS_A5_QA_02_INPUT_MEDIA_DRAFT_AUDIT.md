# A5.QA-02 — Autos Publish Input Spacebar + Media Drag Reorder + Refresh Draft Persistence

## 1. Files inspected

- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx`
- `app/(site)/publicar/autos/shared/components/AutosVehicleEngineField.tsx`
- `app/(site)/publicar/autos/shared/components/AutosVehicleIdentityFields.tsx`
- `app/(site)/publicar/autos/shared/components/AutosDealerStructuredAddressFields.tsx`
- `app/(site)/publicar/autos/shared/components/AutosDealerFinanceFields.tsx`
- `app/(site)/publicar/autos/shared/components/AutosSortablePhotoGrid.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx`
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts`
- `app/(site)/clasificados/autos/shared/lib/autosEditorTabSession.ts`
- `package.json` (`@dnd-kit/*` already present)

## 2. Root cause found

| Issue | Root cause |
|---|---|
| Spacebar blocked | `onChange` handlers called `e.target.value.trim()` while typing, stripping trailing spaces before the user could type the next word (e.g. motor `3.5 ` → `3.5`, calle `Colemanav ` → `Colemanav`). |
| Drag reorder not obvious | `@dnd-kit` worked only via a small handle; most of the card was not draggable. |
| Refresh cleared draft (Privado) | `useAutoPrivadoDraft` **always** cleared storage on mount except `resume`/`confirm` — no same-tab restore. |
| Refresh risk (Negocios) | Debounced autosave skipped drafts until `isMeaningfulAutoDealerDraft` was true (800ms); refresh before save could lose early fields. |

## 3. Spacebar/input fix result

- Added `autosPublishFormText.ts` (`autosDraftTextValue`, `autosDraftUrlValue`).
- Removed `.trim()` from `onChange` on free-text fields across engine, identity, address, finance, Negocios business fields, Privado email.
- ZIP remains digits-only (intentional numeric restriction).

## 4. Media drag reorder result

- `AutosSortablePhotoGrid`: whole-card drag on desktop (`PointerSensor`); `TouchSensor` with short delay on mobile; arrow buttons kept with `pointerdown` stopPropagation so clicks do not start a drag.
- Reorder hint copy already present in `autosNegociosCopy` (`reorderHint`).

## 5. Refresh draft persistence result

- `useAutosDraftPersistEffects`: debounced save (400ms) on **every** hydrated change + `pagehide` / `beforeunload` flush.
- Negocios: removed `isMeaningfulAutoDealerDraft` gate on autosave.
- Privado: same-tab refresh restores draft via `shouldResetAutosDraftForFreshEditorTab` + `hydrateFromNamespace`; new browser tab still starts clean.
- **Limitation:** local `File` photo bytes may not survive refresh if not yet flushed to IDB; URL-based images and metadata/order persist.

## 6. Negocios result

All three QA issues addressed in publish flow, preview flush, and draft storage.

## 7. Privado cross-check result

- Spacebar: fixed on email + shared engine/identity/address components.
- Media: uses same `AutosNegociosMediaManager` / `AutosSortablePhotoGrid`.
- Refresh: fixed bootstrap + autosave (was clearing every visit).
- **Privado checked — dealer-only Business Hub fields not added.**

## 8. Build/check result

Filled after validation `npm run build`.

## 9. Remaining risks

- Opening publish in a **second browser tab** can still clear shared namespace draft (documented in `autosEditorTabSession.ts`).
- Very large local file galleries depend on IDB offload timing before refresh.
- `npm run lint` may still report unrelated admin autos page unused import (pre-existing).

---

## TRUE/FALSE matrix

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Negocios free-text fields allow spaces | TRUE | `autosDraftTextValue` + engine/address/finance/application updates |
| Privado free-text fields were checked | TRUE | Section 7 |
| Privado free-text fields allow spaces or no issue found | TRUE | Email + shared fields fixed |
| Numeric-only fields remain intentionally restricted | TRUE | Price/mileage parsers; ZIP digits-only in address fields |
| Engine field allows values like 3.5 V6 | TRUE | `AutosVehicleEngineField` no longer trims on change |
| Street/calle field allows normal spaced addresses | TRUE | `AutosDealerStructuredAddressFields` |
| Business/contact fields allow spaces | TRUE | `AutosNegociosApplication` dealer name, finance, custom link titles |
| Custom/social/review/link label fields allow spaces if present | TRUE | Custom link title uses `autosDraftTextValue` |
| Description/textareas still work normally | TRUE | Already used raw `e.target.value` |
| Photo cards support desktop drag-and-drop reorder | TRUE | Whole-card `@dnd-kit` listeners on `<li>` |
| Photo cards keep mobile fallback reorder controls | TRUE | Chevron buttons + TouchSensor |
| Cover image selection still works | TRUE | Cover button with `stopPropagation` |
| Reordered image order persists to preview/detail | TRUE | `mediaImages` sortOrder via draft flush + `deriveHeroImageUrls` |
| Refresh preserves Autos Negocios draft fields | TRUE | sessionStorage tab key + autosave + pagehide flush |
| Preview/back preserves Autos Negocios draft fields | TRUE | `resume=1` + hydrate path unchanged |
| Refresh/preview behavior checked for Privado | TRUE | Privado bootstrap + autosave aligned with Negocios |
| Draft reset still requires explicit user action or documented new-flow behavior | TRUE | `resetDraft` + `freshTab` clear only |
| No dealer-only fields were added to Privado | TRUE | Privado application unchanged for Business Hub |
| No unrelated categories were touched | TRUE | Autos publish/clasificados paths only |
| No schema/payment/global files were touched | TRUE | No migrations or Stripe edits |
| npm run build passed | TRUE | Validation run |
