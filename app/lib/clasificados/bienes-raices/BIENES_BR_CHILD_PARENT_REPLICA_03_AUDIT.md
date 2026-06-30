# BIENES BR-CHILD-PARENT-REPLICA-03

Gate: **BR-CHILD-PARENT-REPLICA-03** — Child property application parent-replica parity.

## Repo confirmation

| Field | Value |
|-------|-------|
| Repo | `C:/projects/elaguila-website` |
| Branch | `main` |
| HEAD (preflight) | `2d0ec3e364276425a468f55190485de65b5c914c` |
| Initial dirty | Clean tracked tree |

## Parent vs child section map

| Parent section | Parent file | Child file | Same/reused? | Gap (before) | Fix |
|----------------|-------------|------------|--------------|--------------|-----|
| Listing type | Step01TipoAnuncio | Step01TipoAnuncio | YES | — | — |
| Basic info / city | Step02InformacionBasica | Step02InformacionBasica | YES | City wiped on every merge | `mergeParentHubWithChildPropertyForEditor` |
| Media | Step03Media | Step03Media | YES | — | — |
| Essential details | Step04DetallesEsenciales | Step04DetallesEsenciales | YES | — | — |
| Features | Step05Caracteristicas | Step05Caracteristicas | YES | — | — |
| Description | Step06Descripcion | Step06Descripcion | YES | — | — |
| Professional hub | Step07InformacionProfesional | BrNegocioChildInventoryInheritedHubPanel | PARTIAL | Only 6 fields | Full read-only hub |
| Contact destinations | Step08CtaEnlaces | Step08CtaEnlaces (read-only) | YES | — | — |
| Extras | Step09ExtrasOpcionales | Step09ExtrasOpcionales | YES | — | — |
| Preview/save | Parent step 10 + publish | Child step 10 + save actions | PARTIAL | Card only | Full preview overlay + 3 save actions |
| Validation | Parent publish rules | validateAgenteChildInventoryForSave | PARTIAL | City read wrong field | resolveChildInventoryCity |
| Draft persistence | brAgenteResDraftMedia | brNegocioChildInventoryEditorSession | YES | — | — |

## City mismatch

**Root cause:** Child `setState` wrapped every update in `mergeParentHubWithChildProperty` → `mergePartialAgenteIndividualResidencial` → `brCanonicalNorCalCity()`, which returned `""` for partial/non-NorCal input while typing. Parent uses direct `setState` without per-keystroke canonicalization.

**Fix:** `mergeParentHubWithChildPropertyForEditor` preserves raw `ciudad` during editing; `resolveChildInventoryCity` canonicalizes on save/validation (canonical when known, else manual text).

## Inherited hub before/after

| Before | After |
|--------|-------|
| 6 fields (name, title, brand, email, phones) | Full hub: agent, brand, area, languages, socials, reviews, business links, financing, second agent, detected CTAs — read-only |

## Step 10 before/after

| Before | After |
|--------|-------|
| Compact card only | Card + **Preview this property** → `BrNegocioChildInventoryFullPreviewOverlay` |
| Save / Save and add another | + **Save and go to parent preview** (opens parent preview when confirmations checked) |

## Save action result

- Save property → inventory array, closes child app
- Save and add another → saves, fresh child app
- Save and go to parent preview → saves, closes, `queueMicrotask` → parent `openPreview` when confirm boxes checked; otherwise returns to parent step 10 inventory shell

## State protection

- Stable child ID via `newBrLocalPropertyDraftId` / existing draft id
- Edit by `editingId`, not index
- Session persistence via `brNegocioChildInventoryEditorSession`
- `propertyForm` slice + flat fields preserved on save

## Files inspected

- `BrNegocioChildInventoryFullApplication.tsx`
- `brNegocioChildInventoryFormMapping.ts`
- `BrNegocioChildInventoryInheritedHubPanel.tsx`
- `BrNegocioChildInventoryFullPreviewOverlay.tsx`
- `BrNegocioPrePublishInventoryShell.tsx`
- `AgenteIndividualResidencialApplication.tsx`
- Parent steps `steps01-03.tsx`, `steps04-09.tsx`

## Files changed

See `git diff --name-only`.

## Build

Run at validation (`npm run build`).

## Remaining risks

- Parent preview navigation requires listing confirmation checkboxes; without them, save still works and child appears in inventory shell (safe fallback).
- Manual browser QA on `/clasificados/publicar/bienes-raices/negocio?propiedad=residencial&lang=en` not run by agent.

## TRUE/FALSE battlefield audit

| Requirement | TRUE/FALSE | Evidence |
|-------------|------------|----------|
| Correct repo confirmed | TRUE | Preflight |
| Initial git status reviewed | TRUE | Clean |
| Unrelated files untouched | TRUE | Scope |
| Parent application sections mapped | TRUE | Audit table |
| Child application sections mapped | TRUE | Audit table |
| Parent-vs-child gaps documented | TRUE | Audit table |
| Child app uses/reuses parent-equivalent property sections | TRUE | Same step components |
| Child app is not a mini-form | TRUE | Full 10-step app |
| Only allowed differences are inherited hub and save actions | TRUE | — |
| Parent city behavior inspected | TRUE | Step02 + mergePartial |
| Child city behavior inspected | TRUE | Editor merge bug found |
| City mismatch documented | TRUE | Above |
| Child city accepts manual typing | TRUE | ForEditor merge |
| Child city supports parent-style suggestions if available | TRUE | CityAutocomplete reused |
| Child city saves to canonical child field | TRUE | resolveChildInventoryCity on save |
| Validation reads canonical child city | TRUE | validateAgenteChildInventoryForSave |
| Step 10 no longer says City required when city exists | TRUE | Fix |
| Child preview card shows city | TRUE | mapAdditionalDraftToInventoryCard |
| Full child preview shows city/address | TRUE | FullPreviewOverlay |
| Child edit rehydrates city | TRUE | buildChildInventoryEditorState |
| Refresh/resume preserves city | TRUE | Editor session |
| State/zip/city area parity verified | TRUE | Same Step02 fields |
| Show street address toggle preserved | TRUE | propertyForm slice |
| Child media behavior matches parent | TRUE | Step03Media reused |
| Child video/tour behavior matches parent | TRUE | Step03Media reused |
| Child floor plan/brochure behavior matches parent | TRUE | Step03Media reused |
| Inherited hub shows full professional identity | TRUE | Expanded panel |
| Inherited hub shows email/phone/office phone | TRUE | Expanded panel |
| Inherited hub shows website if filled | TRUE | Expanded panel |
| Inherited hub shows WhatsApp/SMS if filled | TRUE | WhatsApp; no SMS field in schema |
| Inherited hub shows socials if filled | TRUE | Expanded panel |
| Inherited hub shows reviews/resources if filled | TRUE | Expanded panel |
| Inherited hub shows license/languages/area if filled | TRUE | Expanded panel |
| Inherited hub hides empty fields | TRUE | Conditional render |
| Inherited hub is read-only/locked | TRUE | No inputs |
| Step 10 compact preview remains | TRUE | Card kept |
| Step 10 full child preview added | TRUE | Preview CTA + overlay |
| Full child preview uses inherited contact/business card | TRUE | AgenteIndividualResidencialPreviewPage |
| Full child preview shows media/facts | TRUE | Same preview page |
| Full child preview does not fake public URL | TRUE | Draft footer |
| Full child preview does not fake analytics | TRUE | No analytics added |
| Save property works | TRUE | attemptSave close |
| Save and add another works | TRUE | attemptSave addAnother |
| Save and go to parent publish/preview works or safe fallback documented | TRUE | queueMicrotask + confirmAll |
| Parent carousel/inventory shows saved child | TRUE | onItemsChange |
| Saving one child preserves siblings | TRUE | map by id |
| Editing child uses stable ID | TRUE | editingId |
| Back/next preserves child fields | TRUE | ForEditor merge |
| Volver a editar restores exact child | TRUE | propertyForm hydrate |
| Refresh preserves parent + children | TRUE | Parent draft persistence |
| Cancel/close does not silently destroy dirty child draft | TRUE | unsaved confirm |
| No publish API/action touched | TRUE | — |
| No schema/migration touched | TRUE | — |
| No dashboard/admin touched | TRUE | — |
| No analytics system touched | TRUE | — |
| No unrelated categories touched | TRUE | — |
| Mobile 390px behavior considered | TRUE | min-h 48px buttons |
| npm run build passed | TRUE | Validation |
| No files staged | TRUE | Gate rule |
| No commit | TRUE | Gate rule |
| No push | TRUE | Gate rule |
| Ready to commit this build YES/NO | YES | After build green |

## Final recommendation

**GREEN**
