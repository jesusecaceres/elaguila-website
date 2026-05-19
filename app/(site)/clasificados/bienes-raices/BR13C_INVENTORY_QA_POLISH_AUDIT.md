# BR13C — Inventory QA Polish + Publish Routing + Leonix Ad ID

## Product (unchanged)

- Base: **$399/mo**, up to **3** active properties
- Upgrade: **$89.99/mo**, up to **5** additional ( **8** total )
- One upgrade package only; no per-property pricing; no tiers

## Fixes in this gate

| Area | Change |
|---|---|
| Inventory mode header | ES/EN title + subcopy + parent Leonix Ad ID when available |
| Dashboard | Per-listing inventory card with **Agregar propiedad** + pricing copy |
| Step 12 | Renamed **Botones y enlaces del anuncio**; removed duplicate Gate12c contact fields |
| Media preview | In-memory draft fallback when `sessionStorage` quota exceeded; `data:video` playback in preview map |
| Map CTA | **Ver ubicación** label; compiled address query (existing `buildLocationVm`) |
| Preview publish | Single final CTA in `LeonixPreviewPageShell` (publish / add to inventory) |
| Leonix Ad ID | Placeholder in owner preview; dashboard + admin select columns |
| Admin | `seller_type`, `inventory_role`, `br_inventory_*` in admin listings select |

## Leonix Ad ID pipeline

- Reuses `allocateLeonixAdIdForListingsCategory` / DB trigger for `listings` (`BR-YYYY-NNNNNN`)
- Each inventory child insert gets its own `leonix_ad_id` on publish (no reuse of parent ID)
- Parent ID shown only as context (“Conectada a BR-…”)

## Deferred

- Stripe entitlement (upgrade still mailto placeholder)
- Rentas shared media fix (not required — BR Negocio uses separate draft path)

## Build/check

- `npm run br:13c-inventory-qa-polish-audit` — OK
- `npm run build` — TypeScript OK; static export failed on unrelated routes (`/magazine/2026/april`, `/auth/callback`, `/clasificados/autos/pago/error`) with Next.js `clientReferenceManifest` invariant (likely dirty-tree / Windows flake, not BR13C compile errors)

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| inventory title/copy | TRUE | `leonixBrPropertyInventoryCopy.ts` |
| dashboard inventory CTA | TRUE | `BrNegocioListingInventoryActions.tsx` |
| $399 / 3 / $89.99 / +5 / 8 | TRUE | `leonixBrPropertyInventoryPolicy.ts` |
| Step 12 helper | TRUE | `ContactoCtasNegocioSection.tsx` |
| media preview persistence | TRUE | `bienesRaicesPreviewDraft.ts` + `data:video` in map |
| inventory final CTA | TRUE | `BienesRaicesNegocioPreviewClient.tsx` |
| Leonix Ad ID documented | TRUE | This doc + existing publish core |
| npm run build completed | FALSE | TS compile OK; prerender failed unrelated pages |
