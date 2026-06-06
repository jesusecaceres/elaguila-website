# BR-INV-C — Property-Only Drawer Fields + Draft Inventory Persistence (BR Negocio / Agente Only)

**Gate:** BR-INV-C  
**Date:** 2026-05-19  
**Builds on:** BR-INV-B drawer shell (`BrNegocioPrePublishInventoryShell`, `BrNegocioPrePublishInventoryDrawerShell`).

---

## 1. Gate name

**BR-INV-C** — Property-only drawer fields + local draft persistence for pre-publish inventory.

---

## 2. Files inspected

| Path | Purpose |
| --- | --- |
| `BR_INV_A_SUPABASE_BACKING_AUDIT.md` | Lane policy, Supabase deferred |
| `BR_INV_B_DRAWER_SHELL_AUDIT.md` | BR-INV-B shell baseline |
| `brNegocioPrePublishInventoryShellCopy.ts` | Shell copy |
| `BrNegocioPrePublishInventoryShell.tsx` | CTA + summary |
| `BrNegocioPrePublishInventoryDrawerShell.tsx` | Drawer shell |
| `bienesRaicesNegocioFormState.ts` | 15-step Negocio state |
| `agenteIndividualResidencialFormState.ts` | Agente state |
| `bienesRaicesPreviewDraft.ts` / `previewDraft.ts` | Preview handoff persistence |
| `mapBienesRaicesNegocioStateToPreviewVm.ts` | Preview safety (no inventory leak) |
| `AUTOS_A5_QA_08A2_VEHICLE_ONLY_INVENTORY_DRAWER_AUDIT.md` | Autos reference (read-only) |
| `AUTOS_A5_QA_07_APPLICATION_PERSISTENCE_INVENTORY_TRUTH_AUDIT.md` | Autos persistence reference (read-only) |

---

## 3. Files changed

| Path | Change |
| --- | --- |
| `negocio/application/brNegocioAdditionalInventoryDraft.ts` | **NEW** — draft type, validation, display helpers |
| `negocio/application/brNegocioPrePublishInventoryShellCopy.ts` | Field labels, save/cancel/edit/remove copy |
| `negocio/application/sections/shared/BrNegocioPrePublishInventoryDrawerForm.tsx` | **NEW** — property-only fields |
| `negocio/application/sections/shared/BrNegocioPrePublishInventoryDrawerShell.tsx` | Enabled save / save-and-add-another / cancel |
| `negocio/application/sections/shared/BrNegocioPrePublishInventoryShell.tsx` | Real count, list, edit/remove |
| `negocio/application/schema/bienesRaicesNegocioFormState.ts` | `additionalInventoryProperties[]` |
| `negocio/agente-individual/schema/agenteIndividualResidencialFormState.ts` | `additionalInventoryProperties[]` |
| `negocio/application/sections/shared/ResumenPublicarNegocioSection.tsx` | Wired state |
| `negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx` | Wired state |
| `bienes-raices/BR_INV_C_PROPERTY_DRAWER_FIELDS_AUDIT.md` | **NEW** — this document |
| `scripts/br-inv-c-property-drawer-fields-audit.ts` | **NEW** |
| `scripts/br-inv-b-drawer-shell-audit.ts` | Relaxed checks for BR-INV-C evolution |
| `package.json` | Added `br:inv-c-audit` |

---

## 4. BR-INV-B shell confirmed as base

Same CTA placement, drawer slide-over UX, owner-only note. BR-INV-C replaced placeholder with form fields and enabled actions.

---

## 5. Draft data model

`BrNegocioAdditionalInventoryPropertyDraft`:

- Local id prefix `br-local-property-*` (no Leonix Ad ID, no public listing id)
- Property-only fields: title, type, subtype, price, beds/baths, sizes, address, description, optional main photo URL
- `createdAt` / `updatedAt` ISO strings

Stored on:

- `BienesRaicesNegocioFormState.additionalInventoryProperties`
- `AgenteIndividualResidencialFormState.additionalInventoryProperties`

---

## 6. Persistence behavior

- Array travels with existing preview handoff (`save*PreviewDraft` / `save*PreviewReturnDraft` / `mergePartial*`).
- Old drafts without the field default to `[]` via `mergeAdditionalInventoryProperties`.
- No Supabase writes; no separate migration.
- Photo: URL text only (no storage upload in BR-INV-C).

---

## 7. Drawer fields added

Title, property type, subtype, price, bedrooms, bathrooms, interior/lot sqft, street lines, city, state, ZIP, show-exact-address toggle, description, optional main photo URL.

**Excluded:** agent, company, contact, financing, Stripe, publish, Supabase upload.

---

## 8. Save / save-and-add-another / cancel

| Action | Behavior |
| --- | --- |
| **Guardar propiedad** | Validates required fields; upserts draft; closes drawer |
| **Guardar y agregar otra** | Saves; clears form; drawer stays open |
| **Cancelar** | Closes without persisting unsaved edits |

Required: title, property type, price, city, state.

---

## 9. Edit/remove behavior

- **Editar** opens drawer with selected draft populated.
- **Eliminar** confirms then removes from array; count updates.

---

## 10. Inventory summary behavior

- Count from `items.length`.
- Empty state: “Aún no has agregado propiedades adicionales.”
- List shows title, price, type/subtype, city/state, edit/remove.
- No fake public URL, Leonix Ad ID, or published status.

---

## 11. Intentionally NOT built

- No public inventory cards (BR-INV-D)
- No public URLs for child properties
- No fake listing IDs
- No fake Leonix Ad IDs
- No Supabase writes
- No publish mapping (BR-INV-E)
- No schema/migration
- No Stripe/payment
- No analytics
- No photo storage upload

---

## 12. Lane protection

| Lane | Touched? | Result |
| --- | --- | --- |
| BR Negocio / Agente | **TRUE** | Drawer fields + draft persistence |
| BR Privado | **FALSE** | Untouched |
| Rentas | **FALSE** | Untouched |
| Other categories | **FALSE** | Untouched |

---

## 13. Future next gate

**BR-INV-D** — Preview + inventory cards (owner-only preview bundle).

---

## 14. Manual QA checklist

- [ ] Open BR Negocio / Agente publish flow
- [ ] CTA only in BR Negocio
- [ ] Fill title, type, price, city, state → save
- [ ] Count 0 → 1; summary shows title, price, type, location
- [ ] Edit repopulates fields; save updates summary
- [ ] Remove updates count
- [ ] Save and add another keeps drawer open with cleared form
- [ ] Cancel discards unsaved edits
- [ ] Preview/publish still works for primary listing
- [ ] No fake public URL or Leonix Ad ID
- [ ] BR Privado / Rentas have no inventory CTA
- [ ] Mobile drawer scrolls without overflow

---

## 15. Confirmation

- **No files staged**
- **No commit created**
- **No push attempted**
