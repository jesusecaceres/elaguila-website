# Gate P3 — Varios Detail Content Stack Polish + Delivery Layout Cleanup

Audit path: `app/(site)/clasificados/en-venta/AUDIT_GATE_P3_VARIOS_DETAIL_CONTENT_STACK.md`

## 1. Files inspected

- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`
- `app/(site)/clasificados/en-venta/preview/buildEnVentaPreviewModel.ts`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaItemSpecs.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaBuyerPanel.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaDetailContentStack.tsx`
- `app/(site)/clasificados/en-venta/shared/utils/buildEnVentaContentStackModel.ts`

## 2. Files changed

- `shared/types/enVentaContentStack.types.ts` (new)
- `shared/utils/buildEnVentaContentStackModel.ts` (new)
- `shared/components/EnVentaDetailContentStack.tsx` (new)
- `shared/components/EnVentaBuyerPanel.tsx`
- `preview/EnVentaPreviewPage.tsx`
- `preview/buildEnVentaPreviewModel.ts`
- `listing/EnVentaAnuncioLayout.tsx`
- `scripts/varios-p3-detail-content-stack-audit.ts` (new)
- `package.json`

## 3. Current layout issues found

- Description and specs shared a broken 8/4 grid; long “Detalles / especificaciones” crushed in narrow facts column.
- Condition/accessories were generic extra cards without consistent hierarchy.
- Delivery notes repeated in contact card via `fulfillmentNotes` list.
- No dedicated delivery card with per-method notes.

## 4. Description card result

Full-width `Descripción` card in `EnVentaDetailContentStack` with readable body and scroll anchor.

## 5. Item facts card result

`Detalles del artículo` uses responsive 1–3 column grid for Estado, Tipo, Categoría, Marca, Modelo, Cantidad only.

## 6. Condition/accessories result

Separate cards with side-by-side layout on desktop when both present.

## 7. Technical details/specifications result

Dedicated `Detalles técnicos / especificaciones` card; removed from facts grid.

## 8. Delivery card result

`Entrega` card lists each selected method with its note; built from draft state (preview) or fulfillment flags + description appendix (live).

## 9. Contact card delivery cleanup result

Contact card shows compact delivery chips only; `fulfillmentNotes` list removed from `EnVentaBuyerPanel`.

## 10. Mobile behavior result

Content stack stacks vertically; facts grid collapses to one column; condition/accessories stack on mobile.

## 11. Build result

See gate validation output.

## 12. Remaining risks

- Live listings published before structured pairs may still embed wear/accessories/specs inside description body (publish concatenates without headers). Separate cards on live detail appear when detail pairs exist or delivery appendix parses cleanly.
- Delivery note-to-method mapping on live listings uses order-based assignment when notes are unlabeled in description appendix.

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Varios detail/preview layout files inspected | TRUE | Section 1 |
| Existing hero/contact improvements preserved | TRUE | Gate P2 components unchanged |
| Description is its own readable card | TRUE | `EnVentaDetailContentStack` |
| Item facts are organized in a clean grid/card | TRUE | `ItemFactsGrid` |
| Long technical/details text is not squeezed into the facts card | TRUE | Separate technical card |
| Condition/use appears in its own clean card | TRUE | `conditionUse` section |
| Accessories appear in their own clean card | TRUE | `accessories` section |
| Technical details/specifications appear in their own readable card | TRUE | `technical` section |
| Delivery details appear in a dedicated delivery card | TRUE | `delivery` section |
| Contact card only shows compact delivery info | TRUE | Chips only in buyer panel |
| Repeated delivery notes were removed from contact card | TRUE | `fulfillmentNotes` removed |
| Desktop spacing/alignment improved | TRUE | Full-width stack under hero |
| Mobile stack remains clean | TRUE | Responsive grid/stack |
| Spanish public label remains Varios | TRUE | No En Venta label added |
| No public $9.99 added | TRUE | No payment copy |
| No Boost/Impulsar copy added | TRUE | Audit scan |
| No fake data or fake behavior added | TRUE | Display-only refactor |
| No unrelated categories touched | TRUE | en-venta scope |
| npm run build passed | TRUE | See validation |
