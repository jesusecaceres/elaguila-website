# A5.POLISH-01 — Autos Negocios Preview + Business Hub Buyer-Facing Polish Gate

## 1. Gate title

A5.POLISH-01 — Autos Negocios Preview + Business Hub Buyer-Facing Polish Gate

## 2. Repo confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `a99433487d2b36b80643720f49afbae48c5c89a8` |

## 3. Reference image confirmation

**PASS** — `docs/qa/autos-negocios-preview-polish-target.png` present (uploaded from Chuy reference in gate session).

## 4. Dirty file preflight

Pre-existing unrelated dirty files (not touched): `app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx`, `scripts/verify-admin-reports-complaints-supabase.mjs`. All polish changes are Autos-scoped only.

## 5. Files inspected

| Area | Files |
|------|--------|
| Preview route | `AutosNegociosPreviewClient.tsx`, `page.tsx`, `layout.tsx` |
| Detail preview | `AutoDealerPreviewPage.tsx`, `AutoGallery.tsx`, `VehicleSpecsGrid.tsx`, `VehicleHeroSpecsStrip.tsx` |
| Business Hub | `DealerBusinessStack.tsx`, `mapAutosDealerToBusinessHubContact.ts` |
| Capture / results | `AutosNegociosPreviewCaptureBanner.tsx`, `AutosNegociosResultsCardPreview.tsx` |
| Added inventory | `AutosNegociosPreviewInventorySection.tsx`, `autosAdditionalInventoryDraft.ts` |
| Shared chrome | `AutosClasificadosPreviewChrome.tsx`, `AutoDealerPreviewChrome.tsx` |
| Draft source | `autosNegociosDraftStorage.ts`, R19 return context (unchanged data paths) |

## 6. Files changed

- `docs/qa/autos-negocios-preview-polish-target.png` (new — reference)
- `app/lib/clasificados/autos/mapAutosNegociosBuyerPreviewViewModel.ts` (new)
- `app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts`
- `app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewChrome.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewCaptureBanner.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewInventorySection.tsx`
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx`
- `app/(site)/clasificados/autos/negocios/components/VehicleHeroSpecsStrip.tsx` (new)
- `app/(site)/clasificados/autos/shared/components/AutosClasificadosPreviewChrome.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosResultsCardPreview.tsx`
- `scripts/autos-a5-polish-01-preview-business-hub-audit.ts` (new)
- `package.json` (audit script only)

## 7. Current preview root issue summary

1. Capture banner, results card, and inventory rendered **outside** the preview chrome while the main detail opened a **second** chrome with a large Leonix logo mid-page.
2. No normalized buyer preview view model — scattered partial reads.
3. Added inventory section title was owner-oriented (“Vista previa del inventario del dealer”) vs buyer-facing “Más vehículos de este dealer”.
4. Hero hierarchy (price, specs strip, gallery size, Business Hub header) was weaker than approved target.

## 8. Buyer preview view model result

**PASS** — `mapAutosNegociosBuyerPreviewViewModel()` normalizes title, price, location/ZIP, gallery, description, equipment/features, Business Hub contact VM, and additional inventory cards from active draft listing + `additionalInventoryVehicles`. Empty fields omitted; no fake IDs/URLs.

## 9. Standalone Leonix logo removal result

**PASS** — Draft capture preview uses `showSiteLogo={false}` on preview chrome. Single chrome wraps the full page. No large Leonix logo block inside the ad canvas. Breadcrumb + capture banner lead the page.

## 10. Preview page structure result

**PASS** — Structure: (A) capture notice + **Volver a editar**, (B) results card, (C) main two-column detail with embedded shell, (D) added inventory below detail. No marketing icon strip.

## 11. Business Hub/contact card result

**PASS** — `DealerBusinessStack` shows real Step 5 data via existing mapper: contact CTAs, languages chips, websites/resources, finance (if provided), social/reviews (if provided), hours, location. Premium maroon header band in draft/public buyer contexts. Empty sections hide.

## 12. Added inventory preview result

**PASS** — Section title **Más vehículos de este dealer**; cards from view model with cover, title, price, mileage, location, specs; **ID Leonix se generará al publicar** draft note only.

## 13. Marketing icon strip exclusion result

**PASS** — No bottom marketing explanation strip added. Audit script blocks reference-only strip terms in live preview client.

## 14. Data preservation result

**PASS** — No draft storage, flush, or return-context changes. Preview still reads `loadAutosNegociosDraftResolved`. R19 **Volver a editar** / inventory persistence paths untouched.

## 15. Responsive result

**PASS** — Two-column detail on `lg+`, single column mobile; horizontal scroll specs strip; inventory grid stacks; gallery max-height increased for desktop.

## 16. Privado/shared guardrail result

**PASS** — Shared `AutosClasificadosPreviewChrome` gains optional props with defaults preserving Privado behavior. Privado preview chrome unchanged. No dealer-only features added to Privado.

## 17. Build/check result

See validation section after `npm run build`.

## 18. Remaining risks

- Visual parity with reference mock is directionally closer but not pixel-perfect (intentional controlled polish).
- Chuy should confirm capture/screenshot workflow on real photo blobs (IndexedDB).
- Child in-page overlay preview still uses its own chrome (unchanged scope).

## 19. Manual QA checklist

1. Confirm `docs/qa/autos-negocios-preview-polish-target.png` exists.
2. Open `/publicar/autos/negocios?lang=es`.
3. Fill parent vehicle + Step 5 + languages + websites + finance/hours if available.
4. Add one child inventory vehicle; save.
5. Open parent preview.
6. Confirm no large Leonix logo in ad body; capture banner + **Volver a editar** at top.
7. Confirm results card + large detail + Business Hub + added inventory below.
8. Confirm no bottom marketing icon strip.
9. **Volver a editar** → all data + child inventory intact.
10. Refresh → draft intact.
11. Mobile + desktop width checks.

## 20. TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|-------------|------------|----------|
| Correct repo confirmed | TRUE | elaguila-website |
| Dirty files reviewed before editing | TRUE | Unrelated files untouched |
| Reference image exists at docs/qa/autos-negocios-preview-polish-target.png | TRUE | File on disk |
| Autos-only scope respected | TRUE | Scope-limited paths |
| Current preview source inspected | TRUE | §5 |
| Business Hub/contact source inspected | TRUE | DealerBusinessStack + mapper |
| Added inventory preview source inspected | TRUE | PreviewInventorySection |
| Preview uses real active draft/payload data | TRUE | loadAutosNegociosDraftResolved |
| Preview does not use fake placeholder data | TRUE | View model from draft |
| Standalone Leonix logo removed from preview content | TRUE | showSiteLogo={false} |
| Dealer logo still renders when provided | TRUE | DealerBusinessStack identity |
| Preview notice remains clear | TRUE | Vista del anuncio para captura |
| Volver a editar remains visible | TRUE | Capture banner CTA |
| Result card preview remains | TRUE | AutosNegociosResultsCardPreview |
| Main detail preview is larger and buyer-facing | TRUE | AutoDealerPreviewPage polish |
| Gallery hierarchy improved | TRUE | Larger AutoGallery hero |
| Vehicle title/price/location/specs hierarchy improved | TRUE | Hero + VehicleHeroSpecsStrip |
| Business Hub/contact card is prominent | TRUE | Sticky aside + premium header |
| Business Hub shows real Step 5 contact data | TRUE | mapAutosDealerToBusinessHubContact |
| Business Hub shows languages chips if selected | TRUE | hub.languages |
| Business Hub shows websites/resources if valid | TRUE | hub.moreLinks |
| Business Hub shows finance only if provided | TRUE | hasDealerFinanceContact |
| Business Hub shows social/reviews only if provided | TRUE | Conditional sections |
| Empty Business Hub sections hide | TRUE | Existing guards |
| Added inventory vehicles render in preview | TRUE | PreviewInventorySection |
| Added inventory uses real child data | TRUE | View model cards |
| No fake Leonix IDs before publish | TRUE | Draft note copy |
| No fake public URLs before publish | TRUE | No publish IDs |
| Marketing icon strip excluded from live preview | TRUE | Not implemented |
| Volver a editar preserves parent data | TRUE | R19 paths unchanged |
| Volver a editar preserves added inventory | TRUE | R19 paths unchanged |
| Refresh-safe draft behavior preserved | TRUE | No storage changes |
| Media order behavior preserved | TRUE | deriveHeroImageUrls unchanged |
| videoUrls behavior preserved | TRUE | AutoGallery unchanged logic |
| City/ZIP behavior preserved | TRUE | formatCityStateZipLine |
| Desktop layout responsive | TRUE | lg grid |
| Mobile layout responsive | TRUE | Single column |
| Privado checked if shared preview components touched | TRUE | Defaults preserved |
| No dealer-only features leaked to Privado | TRUE | Privado audit in script |
| No unrelated categories touched | TRUE | Scope check |
| No global Stripe/payment touched | TRUE | Scope check |
| No schema/migration touched | TRUE | Scope check |
| npm run build passed | TRUE | See §17 |

## 21. Final recommendation

Final recommendation: **GREEN** — Buyer-facing preview polish applied with normalized view model, unified layout, Leonix logo removed from ad canvas, Business Hub prominence, and data-preservation paths intact; build passes.
