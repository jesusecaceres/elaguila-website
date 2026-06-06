# BR-INV-D — Inventory Preview + Owner-Only Cards (BR Negocio / Agente Only)

**Gate:** BR-INV-D  
**Date:** 2026-05-19  
**Builds on:** BR-INV-C drawer fields + draft persistence.

---

## 1. Gate name

**BR-INV-D** — Owner-only inventory preview with main + additional property cards.

---

## 2. Files inspected

| Path | Purpose |
| --- | --- |
| `BR_INV_A_SUPABASE_BACKING_AUDIT.md` | Lane policy |
| `BR_INV_B_DRAWER_SHELL_AUDIT.md` | Shell baseline |
| `BR_INV_C_PROPERTY_DRAWER_FIELDS_AUDIT.md` | Draft model + CRUD |
| `BrNegocioPrePublishInventoryShell.tsx` | Shell integration point |
| `brNegocioAdditionalInventoryDraft.ts` | Draft type + formatters |
| `bienesRaicesNegocioFormState.ts` / `agenteIndividualResidencialFormState.ts` | Main property source |
| `mapBienesRaicesNegocioStateToPreviewVm.ts` | Confirmed no inventory leak to public VM |
| `agenteResidencialPreviewFormat.ts` | Type/price format reference |

---

## 3. Files changed

| Path | Change |
| --- | --- |
| `negocio/application/brNegocioInventoryCardModel.ts` | **NEW** — card model + main/additional mappers |
| `negocio/application/sections/shared/BrNegocioPrePublishInventoryCard.tsx` | **NEW** — owner-only card UI |
| `negocio/application/sections/shared/BrNegocioPrePublishInventoryPreview.tsx` | **NEW** — preview section |
| `negocio/application/sections/shared/BrNegocioPrePublishInventoryShell.tsx` | Preview cards replace compact list |
| `negocio/application/brNegocioPrePublishInventoryShellCopy.ts` | Preview title/helper/empty copy |
| `negocio/application/sections/shared/ResumenPublicarNegocioSection.tsx` | Pass main property card model |
| `negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx` | Pass main property card model |
| `bienes-raices/BR_INV_D_INVENTORY_PREVIEW_CARDS_AUDIT.md` | **NEW** |
| `scripts/br-inv-d-inventory-preview-cards-audit.ts` | **NEW** |
| `package.json` | `br:inv-d-audit` |

---

## 4. BR-INV-C confirmed as base

Drawer save/edit/remove/count/persistence unchanged. Cards reuse `openForEdit`, `handleRemove`, and drawer shell handlers.

---

## 5. Owner-only preview section behavior

- Title: **Vista previa del inventario** / **Inventory preview**
- Helper explains cards are owner-only and additional properties are not published until BR-INV-E
- Renders only inside `BrNegocioPrePublishInventoryShell` in publish application
- Not on public detail, results, BR Privado, or Rentas

---

## 6. Main property card behavior

- Label: **Propiedad principal** / **Main property**
- Mapped from live form state (Negocio 15-step or Agente individual)
- Title fallback, comma-formatted price (`formatUsdWhole`), type/subtype line, city/state only
- Optional cover photo from existing form media (http/https/data:image only)
- Status: **Borrador principal** / **Main draft**
- No edit/remove on main card (primary listing edited via normal steps)

---

## 7. Additional property card behavior

- Label: **Propiedad adicional** / **Additional property**
- From `additionalInventoryProperties[]`
- Price, type, city/state, beds/baths/sqft when present
- Status: **Borrador — aún no publicado** / **Draft — not published yet**
- Edit/remove buttons wired to BR-INV-C drawer
- No public URL, listing ID, or Leonix Ad ID

---

## 8. Empty state behavior

When `additionalInventoryProperties.length === 0`:

- ES: Agrega otra propiedad para ver cómo se verá tu inventario antes de publicar.
- EN: Add another property to see how your inventory will look before publishing.

Main property card always shown.

---

## 9. Edit/remove integration

- **Editar** on additional card → opens drawer with draft populated
- **Eliminar** → existing confirm dialog → removes draft → card disappears
- Save edit updates card via existing `onItemsChange`

---

## 10. Numeric formatting evidence

Uses existing DETAILS-COMMAS-02 helpers:

- `formatUsdWhole` — e.g. `1200000` → `$1,200,000`
- `formatSqftDisplay` — e.g. `12000` → `12,000 ft²`
- `formatDetailCountDisplay` — beds/baths with comma rules; years not comma-formatted

---

## 11. Intentionally NOT built

- No public inventory cards
- No public URLs for child properties
- No fake listing IDs
- No fake Leonix Ad IDs
- No Supabase writes
- No publish mapping (BR-INV-E)
- No schema/migration
- No Stripe/payment
- No analytics
- No map CTA on draft cards

---

## 12. Lane protection

| Lane | Touched? | Result |
| --- | --- | --- |
| BR Negocio / Agente | **TRUE** | Preview cards added |
| BR Privado | **FALSE** | Untouched |
| Rentas | **FALSE** | Untouched |
| Other categories | **FALSE** | Untouched |

---

## 13. Future next gate

**BR-INV-E** — Supabase publish mapping for inventory group.

---

## 14. Manual QA checklist

- [ ] BR Negocio publish flow shows inventory preview section only in application
- [ ] Main property card reflects current form title/price/type/city
- [ ] Empty additional state when count 0
- [ ] Add property → additional card appears with draft status
- [ ] Edit/remove from card works
- [ ] No fake URL / Leonix Ad ID
- [ ] Preview/publish primary listing still works
- [ ] BR Privado / Rentas have no preview section
- [ ] Mobile cards stack without overflow

---

## 15. Confirmation

- **No files staged**
- **No commit created**
- **No push attempted**
