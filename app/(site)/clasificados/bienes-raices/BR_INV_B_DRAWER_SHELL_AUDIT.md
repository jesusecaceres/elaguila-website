# BR-INV-B — Property Inventory Drawer Shell (BR Negocio / Agente Only)

**Gate:** BR-INV-B  
**Date:** 2026-05-19  
**Mode:** Surgical shell only — no property fields, no Supabase, no publish mapping.

---

## 1. Gate name

**BR-INV-B** — Add Property Inventory Drawer Shell for BR Negocio / Agente only.

---

## 2. Files inspected

| Path | Purpose |
| --- | --- |
| `app/(site)/clasificados/bienes-raices/BR_INV_A_SUPABASE_BACKING_AUDIT.md` | Lane policy, Supabase readiness, gate stack |
| `app/(site)/clasificados/publicar/bienes-raices/negocio/application/BienesRaicesNegocioApplication.tsx` | 15-step Negocio wizard; step 14 publish summary |
| `app/(site)/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState.ts` | Form state (no inventory persistence added) |
| `app/(site)/clasificados/publicar/bienes-raices/negocio/application/utils/bienesRaicesPreviewDraft.ts` | Preview draft handoff |
| `app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm.ts` | Preview VM mapping |
| `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx` | Live Negocio publish route (step 9 preview) |
| `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps01-03.tsx` | Agente early steps |
| `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps04-09.tsx` | Agente late steps |
| `app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/ResumenPublicarNegocioSection.tsx` | Step 14 publish checklist |
| `app/lib/clasificados/autos/AUTOS_A5_QA_08A1_OPEN_INVENTORY_CTA_DRAWER_AUDIT.md` | Autos drawer CTA reference (read-only) |
| `app/lib/clasificados/autos/AUTOS_A5_QA_08A2_VEHICLE_ONLY_INVENTORY_DRAWER_AUDIT.md` | Autos vehicle-only drawer reference (read-only) |
| `scripts/autos-a5-qa-08a1-open-inventory-cta-drawer-audit.ts` | Autos audit script pattern |
| `scripts/autos-a5-qa-08a2-vehicle-only-inventory-drawer-audit.ts` | Autos audit script pattern |

---

## 3. Files changed

| Path | Change |
| --- | --- |
| `app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioPrePublishInventoryShellCopy.ts` | **NEW** — ES/EN copy for CTA, drawer, count, owner-only note |
| `app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryShell.tsx` | **NEW** — CTA + count shell + local drawer open state |
| `app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryDrawerShell.tsx` | **NEW** — Slide-over drawer shell (close only; disabled save) |
| `app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/ResumenPublicarNegocioSection.tsx` | Wired inventory shell on step 14 publish summary |
| `app/(site)/clasificados/publicar/bienes-raices/negocio/application/BienesRaicesNegocioApplication.tsx` | Pass `lang` + hide shell when `inventoryModeAdd` |
| `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx` | Wired inventory shell on step 9 preview/publish readiness |
| `app/(site)/clasificados/bienes-raices/BR_INV_B_DRAWER_SHELL_AUDIT.md` | **NEW** — this document |
| `scripts/br-inv-b-drawer-shell-audit.ts` | **NEW** — static audit verifier |
| `package.json` | Added `br:inv-b-audit` script |

---

## 4. BR-INV-A truths used

- **BR Negocio / Agente** is the only approved pre-publish inventory lane.
- **BR Privado** is excluded from inventory UI.
- **Rentas** is deferred.
- Supabase columns (`br_inventory_group_id`, `br_inventory_parent_listing_id`, `inventory_role`) exist for later gates; **publish mapping is BR-INV-E**, not this gate.
- BR-INV-B adds only: CTA, drawer shell, inventory count shell (hardcoded 0).
- No schema/migration/policy changes in BR-INV-B.

---

## 5. CTA location

| Flow | Step | Placement |
| --- | --- | --- |
| **Agente Individual Residencial** (live `/publicar/bienes-raices/negocio` route) | Step 9 — Vista previa / publish readiness | After preview intro copy, before `ListingRulesConfirmationSection` |
| **BienesRaicesNegocioApplication** (15-step wizard) | Step 14 — Resumen y publicar | After publish checklist `<ul>`, before rules confirmation block |

CTA label (ES): **Agregar propiedad al inventario**  
CTA label (EN): **Add property to inventory**

---

## 6. Drawer shell behavior

- Opens from CTA click; closes via backdrop, header **Cerrar/Close**, or footer **Cerrar/Close**.
- Title, explanation, and dashed “coming next” placeholder per gate copy.
- **Guardar propiedad / Save property** button is present but **disabled** with hint text.
- No save handler, no publish button, no Supabase calls.
- Body scroll locked while open; mobile-safe full-width panel with `max-w-[480px]` on large screens.
- `role="dialog"` + `aria-modal="true"`.

---

## 7. Inventory count shell behavior

- Displays **Propiedades adicionales: 0** / **Additional properties: 0** (hardcoded until BR-INV-C).
- Owner-only note clarifies this is application workflow only, not public listing content.
- Hidden when `inventoryAdd.inventoryModeAdd` is true (post-publish add mode from BR13B).

---

## 8. Intentionally NOT built

- No property form fields
- No save-and-add-another
- No edit/remove inventory items
- No publish mapping (`br_inventory_group_id` etc.)
- No Supabase writes
- No schema/migration changes
- No Stripe/payment
- No analytics
- No `additionalInventoryProperties[]` persistence or draft migration

---

## 9. Lane protection

| Lane | Touched? | Result |
| --- | --- | --- |
| BR Negocio / Agente | **TRUE** | CTA + drawer + count shell added |
| BR Privado | **FALSE** | Untouched |
| Rentas Privado | **FALSE** | Untouched |
| Rentas Negocio | **FALSE** | Untouched |
| Autos / Servicios / other categories | **FALSE** | Untouched |
| Supabase / migrations / admin | **FALSE** | Untouched |

---

## 10. Future next gate

**BR-INV-C** — Property-only drawer fields (enable property capture inside drawer; still pre-publish).

---

## 11. Manual QA checklist

- [ ] Open BR Negocio / Agente publish flow (`/clasificados/publicar/bienes-raices/negocio`).
- [ ] Confirm CTA appears on step 9 (Agente) near preview/publish readiness.
- [ ] Click CTA → drawer opens with title, explanation, coming-next placeholder.
- [ ] Click Cerrar / backdrop → drawer closes.
- [ ] Confirm count shows **Propiedades adicionales: 0**.
- [ ] Confirm disabled **Guardar propiedad** with hint.
- [ ] Confirm publish and preview buttons still work.
- [ ] Confirm no fake child property cards or public URLs.
- [ ] Confirm BR Privado publish flow has **no** inventory CTA.
- [ ] Confirm Rentas publish flows have **no** inventory CTA.
- [ ] Confirm mobile drawer does not overflow viewport.

---

## 12. Confirmation

- **No files staged**
- **No commit created**
- **No push attempted**
