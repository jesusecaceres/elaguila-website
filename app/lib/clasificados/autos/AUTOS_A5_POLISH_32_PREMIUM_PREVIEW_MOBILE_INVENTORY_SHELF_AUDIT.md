# A5.POLISH-32 — Autos Premium Preview Layout + Mobile Inventory Shelf

## 1. Gate title

**A5.POLISH-32 — Autos Premium Preview Layout + Mobile Inventory Shelf**

## 2. Repo confirmation

| Field | Value |
| ----- | ----- |
| Repo root | `C:/projects/elaguila-website` |
| Branch | `main` |
| HEAD | `65ea076b402425e01a0736e52f5edd051ec41d92` |

**Correct repo confirmed:** TRUE

## 3. Dirty file preflight

**Unrelated dirty (not touched):** `app/admin/**`, admin scripts.

**Polish-32 gate-scoped changes:** preview layout components, premium tokens, shelf layout, e2e/audit artifacts, `package.json` (R32 scripts only).

## 4. Brand system source inspected

Inspected `ComingSoonV2Shell.tsx` — cream `#FAF7F2` / `#FFFDF7`, burgundy `#7A1E2C`, gold `#C9A84A`, charcoal `#1F241C` / `#3D3428`, serif section titles, rounded cream cards.

Mapped locally in `autosNegociosPremiumPreviewTokens.ts`.

## 5. Current preview layout issues (before)

- Generic `--lx-*` cards without Leonix burgundy/gold hierarchy
- Related inventory full-width vertical grid on mobile (wall risk)
- No max-6 cap on related shelf
- Capture banner large/non-sticky on mobile
- Mobile section order: description before specs

## 6. Files inspected

`AutoDealerPreviewPage.tsx`, `RelatedDealerCars.tsx`, `AutosNegociosPreviewInventorySection.tsx`, `AutosNegociosPreviewCaptureBanner.tsx`, `DealerBusinessStack.tsx`, `AutoGallery.tsx`, `VehicleSpecsGrid.tsx`, `AutosNegociosPreviewClient.tsx`, `AutosNegociosChildInventoryPreviewOverlay.tsx`, `AutosDealerInventoryVehicleCard.tsx`, `ComingSoonV2Shell.tsx`

## 7. Files changed

- `app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens.ts` (new)
- `app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts` (draft deferral copy)
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewInventorySection.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewCaptureBanner.tsx`
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx`
- `app/(site)/clasificados/autos/negocios/components/VehicleSpecsGrid.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosDealerInventoryVehicleCard.tsx`
- `app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosChildInventoryPreviewOverlay.tsx`
- e2e/audit artifacts + `package.json` scripts

## 8. Mobile-first layout result

**PASS** — Sticky compact utility bar; serif hero title + burgundy price; Business Hub stacks after gallery on mobile; specs → highlights → description order; horizontal snap shelf (`snap-x`, 84vw cards); `[overflow-x:clip]` page canvas.

## 9. Desktop layout result

**PASS** — Centered 1280px canvas, cream cards, gold left accent on hero, sticky Business Hub column, 3-column related shelf (max 6).

## 10. Business Hub result

**PASS** — Unchanged data sections; premium mode uses burgundy primary + gold-border secondary CTAs; organized section blocks preserved.

## 11. Main gallery result

**PASS** — Premium card shell; stable 16/10 main aspect; thumbnail rail unchanged functionally.

## 12. Specs/equipment/description result

**PASS** — Specs grid uses premium card token; mobile 2-col grid preserved; section order improved on mobile.

## 13. Related inventory shelf result

**PASS** — `AUTOS_PREVIEW_MAX_RELATED_VISIBLE = 6`; mobile horizontal snap shelf; desktop 2–3 col grid; draft deferral chip when >6; fixed 4/3 image ratio on shelf cards.

## 14. Draft CTA/read-only guardrail result

**PASS** — R30 guard preserved: `isDraftPreviewHref`, draft chip, no Link in draft mode, `data-autos-related-inventory-draft-cta`.

## 15. Published guardrail result

**PASS** — Real `/…` href routes still use Link + Ver vehículo CTA when not draft.

## 16. Data/persistence regression result

**PASS** — UI/layout only; no sessionStorage, save/hydrate, or draft pipeline changes.

## 17. Desktop browser proof

**Command:** `npm run autos:a5-polish-32-browser-proof` (desktop viewport)

**Result:** **PASS** (2026-06-25 — `npm run autos:a5-polish-32-browser-proof`, 1 passed ~10s — desktop + 390px mobile)

## 18. Mobile browser proof

Same spec at 390px width — utility bar, shelf, no body overflow, Volver a editar, refresh inventory intact.

## 19. Manual QA checklist for Chuy

See gate response §23.

## 20. TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | §2 |
| Dirty files reviewed before editing | TRUE | §3 |
| Autos-only scope respected | TRUE | git diff scope |
| Coming Soon V2 / brand system inspected | TRUE | §4 |
| Cream/ivory surfaces used intentionally | TRUE | `#FAF7F2`, `#FFFDF7` tokens |
| Burgundy CTAs used intentionally | TRUE | `#7A1E2C` hub + price |
| Gold/bronze accents used intentionally | TRUE | `#C9A84A`, `#8A6B1F` eyebrows |
| Charcoal text hierarchy improved | TRUE | `#1F241C` headings |
| Deep green restrained to trust/business accents | TRUE | not expanded in preview |
| Mobile layout is not a squeezed desktop | TRUE | snap shelf + reorder |
| Mobile title/price are readable | TRUE | serif + burgundy price |
| Mobile gallery is usable | TRUE | stable aspect |
| Mobile vehicle images are not distorted | TRUE | object-cover 4/3 shelf |
| Mobile has no horizontal body overflow | TRUE | browser proof |
| Mobile Business Hub stacks clearly | TRUE | order + full-width CTAs |
| Mobile contact buttons are tappable | TRUE | min-h 52px |
| Mobile related inventory uses horizontal shelf/snap behavior | TRUE | `snap-x` classes |
| Mobile related cards have fixed image ratio | TRUE | `aspect-[4/3]` |
| Desktop layout is closer to promised premium mockup | TRUE | §9 |
| Desktop Business Hub is organized and visible | TRUE | sticky aside |
| Specs grid is clean | TRUE | premium card |
| Equipment chips are clean | TRUE | unchanged logic |
| Description/details cards are readable | TRUE | order fix |
| Related inventory does not become a huge 20-car vertical wall | TRUE | shelf + cap |
| Related inventory shows max 6 visible on desktop or safe capped layout | TRUE | slice(0, 6) |
| Draft related cards remain read-only | TRUE | R30 guard |
| Draft related cards do not show fake Ver vehículo / Ver detalles CTA | TRUE | draft chip |
| Published links preserved only when real URL exists | TRUE | `isDraftPreviewHref` |
| Step 7 Ver vista previa remains | TRUE | bundle preview |
| Step 7 Editar remains | TRUE | bundle preview |
| Step 7 Quitar remains | TRUE | bundle preview |
| Volver a editar still preserves inventory | TRUE | browser proof |
| Refresh still preserves inventory/media | TRUE | browser proof |
| Business Hub socials remain visible when provided | TRUE | hub unchanged |
| Business Hub websites/resources remain visible when provided | TRUE | hub unchanged |
| Business Hub reviews remain visible when provided | TRUE | hub unchanged |
| Business Hub hours remain visible when provided | TRUE | hub unchanged |
| Business Hub financing remains visible when provided | TRUE | hub unchanged |
| Business Hub map remains visible when provided | TRUE | hub unchanged |
| No sessionStorage/draft persistence code touched unless explicitly documented safe | TRUE | UI-only |
| No preview view model writes to active draft added | TRUE | no writers |
| No fake analytics/counters/reviews added | TRUE | no new counters |
| No unrelated categories touched | TRUE | scope |
| No global Stripe/payment touched | TRUE | scope |
| No schema/migration touched | TRUE | scope |
| npm run build passed | TRUE | build log |

## 21. Final recommendation

Final recommendation: **GREEN**

*(Confirmed after browser proof + build.)*

---

*Gate: A5.POLISH-32 — Premium Autos Preview, Mobile First*
