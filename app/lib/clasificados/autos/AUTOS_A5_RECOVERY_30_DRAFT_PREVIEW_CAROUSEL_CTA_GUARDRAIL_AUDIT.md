# A5.RECOVERY-30 — Autos Draft Preview Carousel CTA Guardrail

## 1. Gate title

**A5.RECOVERY-30 — Autos Draft Preview Carousel CTA Guardrail**

## 2. Repo confirmation

| Field | Value |
| ----- | ----- |
| Repo root | `C:/projects/elaguila-website` |
| Branch | `main` |
| HEAD | `a0e2f9f5c989cc7e75e2387b27c4ec7803fca462` |

**Correct repo confirmed:** TRUE

## 3. Dirty file preflight

Clean working tree at gate start (no unrelated dirty files).

## 4. Production context summary

Draft/unpublished preview showed related inventory carousel correctly but cards could look like public listings with **Ver vehículo** / **Ver detalles** styling. Product decision: keep carousel visible, make cards read-only/informational; Step 7 remains control center for preview/edit/remove.

## 5. Files inspected

- `AutosDealerInventoryVehicleCard.tsx` — related card CTA + link
- `RelatedDealerCars.tsx` — “Más vehículos de este dealer” section
- `AutoDealerPreviewPage.tsx` — `relatedPreviewOnly` / `draftPreviewMode` wiring
- `AutosNegociosPreviewInventorySection.tsx` — parent draft preview carousel
- `AutosNegociosChildInventoryPreviewOverlay.tsx` — child full preview
- `autosNegociosInventoryBundleCopy.ts` — copy helpers
- `AutosNegociosInventoryBundlePreview.tsx` — Step 7 controls (unchanged behavior)

## 6. Files changed

- `app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts`
- `app/(site)/clasificados/autos/negocios/components/AutosDealerInventoryVehicleCard.tsx`
- `app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewInventorySection.tsx`
- `e2e/autos/autos-a5-recovery-30-draft-preview-carousel-cta-guardrail.spec.ts` (new)
- `playwright.autos-recovery-30.config.mjs` (new)
- `scripts/autos-a5-recovery-30-draft-preview-carousel-cta-guardrail-audit.ts` (new)
- `package.json` (R30 scripts only)
- This audit file

## 7. Current related-card behavior before fix

| Surface | Component | Before |
| ------- | --------- | ------ |
| Child preview carousel | `RelatedDealerCars` + `AutosDealerInventoryVehicleCard` | `previewOnly` removed Link but still rendered **Ver vehículo** button styling |
| Parent draft preview section | `AutosNegociosPreviewInventorySection` | Read-only cards with draft label; no after-publish chip |
| Parent `AutoDealerPreviewPage` | `RelatedDealerCars` | `draftPreviewMode` did not force `previewOnly` |

## 8. Product rule implemented

**Draft/unpublished preview:**

- Related cards remain visible with image/title/price/location
- Label: **Vista previa / borrador** / **Preview / draft**
- Disabled chip: **Disponible después de publicar** / **Available after publishing**
- Helper: section + card copy explains vehicles publish with the request
- No active **Ver vehículo** / **Ver detalles** CTA
- No navigation links (`#draft-preview-*` hrefs treated as draft)

**Published:**

- Real `href` routes keep clickable **Ver vehículo** CTA + Link (unchanged)

## 9. Draft preview CTA result

**PASS** — `AutosDealerInventoryVehicleCard` uses `readOnlyDraft = previewOnly || isDraftPreviewHref(href)`; renders muted chip instead of CTA; no `<Link>` wrapper.

## 10. Published mode guardrail result

**PASS** — Published cards with real `/…` routes still use Link + `ctaLabel` (Ver vehículo). Draft `#draft-preview-*` hrefs auto-guarded even if flag omitted.

## 11. Step 7 control-center result

**PASS** — `AutosNegociosInventoryBundlePreview` unchanged: **Ver vista previa**, **Editar**, **Quitar** remain on Step 7 cards.

## 12. Persistence regression result

**PASS** — No changes to save/hydrate/sessionStorage pipeline. Browser proof confirms inventory survives Volver a editar + refresh.

## 13. Local browser proof

**Command:** `npm run autos:a5-recovery-30-browser-proof`

**Result:** **PASS** (2026-06-25 — `npm run autos:a5-recovery-30-browser-proof`, 1 passed in ~9s)

## 14. Manual QA checklist for Chuy

See gate response §19.

## 15. TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| ------------------------------------------------------------------------ | ---------- | -------- |
| Correct repo confirmed | TRUE | §2 |
| Dirty files reviewed before editing | TRUE | §3 |
| Autos-only scope respected | TRUE | git diff |
| Related inventory/card component inspected | TRUE | §5 |
| Draft vs published state detection inspected | TRUE | `isDraftPreviewHref` + `previewOnly` |
| Draft preview related cards remain visible | TRUE | browser proof |
| Draft preview related cards show image/title/price/location | TRUE | components unchanged layout |
| Draft preview related cards show “Vista previa / borrador” or equivalent | TRUE | copy + UI |
| Draft preview related cards do not show active Ver vehículo CTA | TRUE | readOnlyDraft branch |
| Draft preview related cards do not show active Ver detalles CTA | TRUE | no link in draft section |
| Draft preview related cards do not navigate to fake routes | TRUE | no Link when readOnlyDraft |
| Draft preview helper text explains vehicles publish with request | TRUE | `autosPreviewInventorySectionHelper` |
| Step 7 remains the control center | TRUE | bundle preview unchanged |
| Step 7 Ver vista previa remains | TRUE | `autosInventoryBundlePreviewCta` |
| Step 7 Editar remains | TRUE | `autosInventoryBundleEdit` |
| Step 7 Quitar remains for added vehicles | TRUE | `autosInventoryBundleRemove` |
| Parent preview related inventory behaves read-only in draft mode | TRUE | `AutosNegociosPreviewInventorySection` |
| Child preview related inventory behaves read-only in draft mode | TRUE | `RelatedDealerCars previewOnly` |
| Volver a editar still preserves inventory | TRUE | browser proof |
| Refresh still preserves inventory/media | TRUE | browser proof |
| Published mode CTA preserved when real route exists | TRUE | Link branch when !readOnlyDraft |
| No draft data mutation added | TRUE | UI-only diff |
| No preview view model writes to active draft | TRUE | no sessionStorage writers |
| No child persistence logic regressed | TRUE | scope lock respected |
| No unrelated categories touched | TRUE | diff scope |
| No global Stripe/payment touched | TRUE | diff scope |
| No schema/migration touched | TRUE | diff scope |
| npm run build passed | TRUE | build log |

## 16. Final recommendation

Final recommendation: **GREEN**

*(Confirmed after browser proof + build.)*

---

*Gate: A5.RECOVERY-30 — Keep Preview Visual, Keep Editing in Step 7*
