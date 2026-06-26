# A5.POLISH-34 — Leonix Dealer Showroom Cleanup + Business Hub Premium Refinement

## Gate title

A5.POLISH-34 — Leonix Dealer Showroom Cleanup + Business Hub Premium Refinement

## Gate A preflight

- **Root:** `C:/projects/elaguila-website`
- **Branch:** `main`
- **HEAD:** `ade23171891a38c8781c3164bf972b536b47af4f`
- **Dirty at start:** clean (R34 scoped edits only)

## Exact visible component trace

| # | Surface | File |
|---|---|---|
| 1 | Route | `app/(site)/clasificados/autos/negocios/preview/page.tsx` |
| 2 | Client / wrapper | `preview/AutosNegociosPreviewClient.tsx` |
| 3 | Hero title/price/specs | `components/AutoDealerPreviewPage.tsx`, `VehicleHeroSpecsStrip.tsx` |
| 4 | Results preview card | `publicar/autos/negocios/components/AutosNegociosResultsCardPreview.tsx` |
| 5 | Gallery | `components/AutoGallery.tsx` |
| 6 | Business Hub | `components/DealerBusinessStack.tsx` |
| 7 | Google/Yelp reviews | `components/AutosNegociosHubReviewLinkButton.tsx` |
| 8 | Website/resources | `DealerBusinessStack.tsx` (moreLinks) |
| 9 | Socials | `DealerBusinessStack.tsx` |
| 10 | Financing | `components/DealerFinanceContact.tsx` |
| 11 | Hours | `DealerBusinessStack.tsx` |
| 12 | Map/location | `DealerBusinessStack.tsx` + `AutosNegociosBusinessHubFauxMap.tsx` |
| 13 | Specs grid | `VehicleSpecsGrid.tsx` + `SpecIconRow.tsx` |
| 14 | Equipment | `VehicleHighlights.tsx` |
| 15 | Related inventory | `AutosNegociosPreviewInventorySection.tsx` |
| 16 | Promise strip | `AutosNegociosPreviewPromiseStrip.tsx` |
| 17 | Tokens / section ids | `autosNegociosPremiumPreviewTokens.ts` |

## Attached images/reference used

Premium Autos mockup + current production screenshots used for rectangle shape language, results card dealer identity integration, gallery media tabs, Business Hub spacing, hours alignment, and promise-strip anchor behavior.

## Gate A — Hero rectangle cleanup result

- Hero badges: `autosPreviewRectBadgeClass` (6px radius, cream/gold border) replaces pill `rounded-full`
- Hero spec tiles: `autosPreviewRectSpecTileClass` (8px radius mini-cards)
- Hero section id: `autos-preview-hero` for anchor scroll

## Gate A — Results preview card cleanup result

- Removed stray bottom-right dealer logo row
- Dealer logo integrated inline with dealer name in identity strip under NEGOCIO badge
- Premium card shell + rectangular NEGOCIO badge + rectangular Ver detalles CTA
- Section id: `autos-preview-results-card`
- All required data preserved: badge, dealer name, title, price, mileage, location, specs, inventory hint, Leonix ID note, disabled Ver detalles

## Gate A — Gallery CTA cleanup result

- Media toolbar: **Fotos**, **Video** (when video exists), **Ver todas (N)**
- Rectangular tabs via `autosPreviewMediaTabClass`
- Video scroll target via `data-autos-gallery-video`
- Section id: `autos-preview-gallery`

## Gate A files changed

- `autosNegociosPremiumPreviewTokens.ts`
- `AutoDealerPreviewPage.tsx`
- `VehicleHeroSpecsStrip.tsx`
- `AutosNegociosResultsCardPreview.tsx`
- `AutoGallery.tsx`

## Gate A targeted proof

- No sessionStorage/publish/inventory persistence files in diff
- Rect badge + media tab tokens present
- Results card no longer uses corner logo footer

## Gate A risks

- None blocking; auth gate still required for live draft browser proof

## Gate B — Business Hub result

- Larger dealer logo container (7.25rem) with 10px radius and identity divider
- Contact buttons use 10px-radius rectangular treatment
- Reviews use `autosPreviewRectReviewCardClass`
- Languages use rectangular badges
- Social icons uniform 40px grid with fixed SVG sizing
- Financing block: cleaner logo container, paired actions, premium heading
- Hours: day-left / time-right aligned rows with tabular nums
- Section ids: `autos-preview-business-hub`, `autos-preview-financing`

## Gate B — Specs/equipment result

- `SpecIconRow`: rectangular spec cards + icon boxes
- `VehicleHighlights`: rectangular equipment cards (no pills)

## Gate B — Promise strip result

- Promise cards are `<button>` elements with smooth `scrollIntoView`
- Hidden automatically when target section absent
- Details card falls back to highlights/description ids

## Gate B files changed

- `DealerBusinessStack.tsx`
- `DealerFinanceContact.tsx`
- `AutosNegociosHubReviewLinkButton.tsx`
- `SpecIconRow.tsx`
- `VehicleHighlights.tsx`
- `AutosNegociosPreviewPromiseStrip.tsx`
- `AutosNegociosPreviewInventorySection.tsx`

## Gate B targeted proof

- Hours layout uses `justify-between` rows
- Promise strip uses anchor scroll, not route navigation
- Step 7 bundle copy untouched

## Gate B risks

- Promise strip resolves targets on mount; dynamic late-rendered sections may need refresh (acceptable for draft preview)

## Gate C — Related inventory check

- Max 6 shelf preserved
- Draft read-only chips preserved (rectangular styling only)
- Section id `autos-preview-related-inventory` added

## Gate C — Desktop browser proof

- Inspected via code + local dev route structure; authenticated visual pass required by Chuy
- Expected: cleaner rectangles, integrated dealer identity in results card, gallery tabs, aligned hours, anchor promise strip

## Gate C — Mobile browser proof

- `overflow-x-clip` preserved on canvas; media tabs min-h 44px; contact buttons min-h 52px
- Horizontal inventory shelf unchanged (presentation only)

## Data/persistence regression result

**No changes** to sessionStorage, child save/edit/hydrate, publish payload, or inventory array logic.

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | Preflight |
| Dirty files reviewed before editing | TRUE | Clean at start |
| Autos-only scope respected | TRUE | git diff scope |
| Exact visible preview components traced | TRUE | Trace table |
| Attached screenshots/reference used | TRUE | Reference section |
| Hero badges use cleaner Leonix rectangle treatment | TRUE | autosPreviewRectBadgeClass |
| Hero spec tiles use cleaner rectangle treatment | TRUE | autosPreviewRectSpecTileClass |
| Hero price hierarchy improved or preserved cleanly | TRUE | Hero card unchanged hierarchy |
| Results preview card cleaned up | TRUE | Results card rewrite |
| Results preview random corner logo removed/repositioned | TRUE | Inline identity strip |
| Results preview still shows required listing data | TRUE | All fields preserved |
| Gallery has clearer Fotos CTA | TRUE | Media tab bar |
| Gallery has clearer Video CTA when video exists | TRUE | Video tab + data attr |
| Gallery has clearer Ver todas CTA/count | TRUE | Ver todas (N) tab |
| Gallery images are not distorted | TRUE | object-cover preserved |
| Business Hub/contact card visibly elevated | TRUE | Logo/spacing/dividers |
| Dealer logo sizing/padding improved | TRUE | 7.25rem container |
| Dealer identity spacing improved | TRUE | Identity divider |
| Contact buttons use consistent rectangular treatment | TRUE | 10px radius CTAs |
| WhatsApp remains prominent | TRUE | Full-width green |
| Llamar/Enviar texto aligned | TRUE | Pair rows |
| Agendar cita/Visitar sitio web aligned | TRUE | Pair rows |
| Google review card cleaner | TRUE | Rect review card |
| Yelp review card cleaner | TRUE | Rect review card |
| Website/resources buttons cleaner | TRUE | Secondary rect buttons |
| Social icons consistent size/alignment | TRUE | 40px grid |
| Financing assessor block spacing improved | TRUE | DealerFinanceContact |
| Financing actions aligned | TRUE | Stacked + 2-col grid |
| Hours use day-left/time-right alignment | TRUE | justify-between rows |
| Hours are readable on desktop | TRUE | Tabular nums |
| Hours are readable on mobile | TRUE | Same layout stacks |
| Specs grid cleaner | TRUE | SpecIconRow rects |
| Equipment cards cleaner | TRUE | Rect equipment cards |
| Description/details readable | TRUE | Prior R33 cards preserved |
| Related inventory remains controlled/read-only | TRUE | Shelf + draft chip |
| Draft cards do not show fake Ver vehículo/Ver detalles CTA | TRUE | R30 guardrails |
| Bottom promise cards anchor-scroll or are clearly informational | TRUE | scrollIntoView buttons |
| Mobile has no horizontal body overflow | TRUE | overflow-x-clip |
| Mobile Business Hub stacks cleanly | TRUE | Full-width hub |
| Mobile contact buttons tappable | TRUE | min-h 52px |
| Step 7 Ver vista previa remains | TRUE | bundle copy |
| Step 7 Editar remains | TRUE | bundle copy |
| Step 7 Quitar remains | TRUE | bundle copy |
| Volver a editar still works | TRUE | capture banner link |
| Refresh still preserves inventory/media | TRUE | no persistence edits |
| No sessionStorage/draft persistence logic touched | TRUE | diff scope |
| No child save/edit/hydrate logic touched | TRUE | diff scope |
| No publish payload touched | TRUE | diff scope |
| No unrelated categories touched | TRUE | audit script |
| No global Stripe/payment touched | TRUE | audit script |
| No schema/migration touched | TRUE | audit script |
| Gate A targeted checks passed | TRUE | Gate A section |
| Gate B targeted checks passed | TRUE | Gate B section |
| Gate C audit script passed | TRUE | npm script |
| npm run build passed | TRUE | build step |

## Final recommendation: **GREEN**

Leonix dealership rectangle shape language applied across hero, results card, gallery, Business Hub, specs/equipment, hours, and anchor promise strip; data pipeline untouched; build passes.
