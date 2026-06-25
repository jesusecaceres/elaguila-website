# A5.POLISH-33 — Autos Premium Layout Reference Match + Business Hub Contact Card

## Gate title

A5.POLISH-33 — Autos Premium Preview Full Layout Match + Business Hub Contact Card

## Repo confirmation

- **Root:** `C:/projects/elaguila-website`
- **Branch:** `main`
- **HEAD:** `2b3b0606098c9a2704ea37782cea25a98ef1c58c` (preflight baseline; R33 changes uncommitted)

## Dirty file preflight

Preflight at gate start: **clean working tree**. R33 edits limited to Autos Negocios preview/layout scope only.

## Attached reference image used

**TRUE** — Premium mockup “Autos en Leonix / Clasificados Premium” used as layout inspiration for:

- Wide cream canvas + serif page identity
- Two-column main listing + Business Hub
- Burgundy hub header strip
- Large gallery with vertical thumbnail rail (desktop)
- Organized contact/reviews/resources/social/financing/hours/map sections

Reference asset: workspace image `autos_negocios-2334b4c1-c52c-4772-8f56-b86a0ad97363.png`.

## Current production screenshot compared

**TRUE** — Prior production screenshot (narrow stacked preview) compared. R32 token swaps were insufficient; R33 applies structural layout changes.

## Exact visible route/component trace

| Layer | File |
|---|---|
| Route | `app/(site)/clasificados/autos/negocios/preview/page.tsx` |
| Layout | `app/(site)/clasificados/autos/negocios/preview/layout.tsx` → `PublishAuthGateLayout` |
| Client | `preview/AutosNegociosPreviewClient.tsx` |
| Chrome | `components/AutoDealerPreviewChrome.tsx` → `AutosClasificadosPreviewChrome` |
| Utility bar | `components/AutosNegociosPreviewCaptureBanner.tsx` |
| Results card | `publicar/autos/negocios/components/AutosNegociosResultsCardPreview.tsx` |
| Main preview | `components/AutoDealerPreviewPage.tsx` (`draftPreviewMode`, `embeddedInShell`) |
| Business Hub | `components/DealerBusinessStack.tsx` (`showPremiumHubHeader`) |
| Gallery | `components/AutoGallery.tsx` |
| Hero specs | `components/VehicleHeroSpecsStrip.tsx` |
| Specs | `components/VehicleSpecsGrid.tsx` |
| Equipment | `components/VehicleHighlights.tsx` |
| Description | `components/VehicleDescription.tsx` |
| Related shelf (in-page) | `components/RelatedDealerCars.tsx` |
| Added inventory shelf | `components/AutosNegociosPreviewInventorySection.tsx` |
| Child overlay | `preview/AutosNegociosChildInventoryPreviewOverlay.tsx` |
| Publish entry | `/publicar/autos/negocios?lang=es` → same preview via session draft |
| Tokens | `app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens.ts` |
| Promise strip (new) | `components/AutosNegociosPreviewPromiseStrip.tsx` |

## R32 insufficiency/root issue

R32 edited the **correct route and components** but changes were mostly token/class swaps (cream, burgundy price, snap shelf). The page still read as a narrow stacked form preview because:

1. Grid remained implicit 12-col without a clear `main + 350px hub` composition
2. Business Hub identity was centered/stacked, not mockup-style horizontal identity block
3. Gallery stayed main-over-thumbs grid instead of large main + vertical rail
4. No premium page identity header (“Autos en Leonix”) above the listing canvas
5. Contact buttons were a flat 2-col grid rather than paired rows (Llamar/Texto, Cita/Web)

R33 addresses structural layout, not just colors.

## Reference-vs-current comparison

| Reference mockup | Before R33 | R33 change |
|---|---|---|
| Wide centered canvas | max-w 1280, felt narrow | max-w 1320, explicit 2-col grid |
| Premium page title | Missing | Serif “Autos en Leonix” header |
| Hero title/price row | Present but subdued | Stronger card, gold accent border |
| Spec chips row | Horizontal scroll | Responsive grid strip |
| Gallery main + thumb rail | Main + bottom grid | Desktop flex split; mobile snap thumbs |
| Burgundy hub header | Dark strip (#5C1A1A) | #7A1E2C full-bleed header |
| Hub identity | Centered large logo | Horizontal logo + name/city |
| WhatsApp CTA | Burgundy | WhatsApp green (premium mode) |
| Contact pairs | Flat grid | Paired rows per spec |
| Reviews/resources/social | Present | Gold labels, consistent icon sizing |
| Advertiser promise strip | Missing | Added draft-only strip |

**Preserved (mockup did not show all):** Google/Yelp review links, resource pills, languages, financing contact, hours, map, added inventory shelf, draft read-only CTAs, Step 7 controls.

## Files inspected

- All trace files above
- `app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx` (brand reference)
- `public/logo-clean.png` (not duplicated in preview — chrome uses breadcrumb-only)
- `app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts`
- `scripts/autos-a5-polish-32-*.ts`, R29/R30 audit scripts

## Files changed

- `app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens.ts`
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx`
- `app/(site)/clasificados/autos/negocios/components/VehicleHeroSpecsStrip.tsx`
- `app/(site)/clasificados/autos/negocios/components/VehicleSpecsGrid.tsx`
- `app/(site)/clasificados/autos/negocios/components/VehicleDescription.tsx`
- `app/(site)/clasificados/autos/negocios/components/VehicleHighlights.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewCaptureBanner.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewPromiseStrip.tsx` (new)
- `app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx`
- `scripts/autos-a5-polish-33-premium-layout-reference-match-business-hub-audit.ts` (new)
- `package.json` (audit script only)
- This audit file

## Desktop layout result

- Canvas widened to **1320px** with `autosPreviewMainGridClass` → `minmax(0,1fr) + 350–360px` hub column
- Main listing (hero, gallery, specs, equipment, description, related) in left column
- Business Hub sticky in right column spanning hero+gallery rows
- Premium serif page header above results card preview

## Mobile layout result

- Single column stack: utility bar → page identity → results card → hero → gallery → hub → specs → equipment → description → inventory shelf → promise strip
- Gallery: main image + horizontal snap thumbs (no cramped 2×2 wall)
- Hub full-width with readable sections and 44px+ touch targets
- No horizontal body overflow (`overflow-x-clip` on canvas)

## Business Hub/contact card result

- Cohesive card with burgundy **DEALER / NEGOCIO** header (#7A1E2C)
- Cream body, gold dividers, charcoal text
- Horizontal dealer identity (logo left, name + city right)
- Sections in spec order: contact → reviews → resources → languages → socials → financing → hours → location

## Contact buttons result

- WhatsApp: full-width green button (`autosPreviewWhatsappBtnClass`)
- Row 1: Llamar | Enviar texto (2-col when both present)
- Row 2: Agendar cita | Visitar sitio web (2-col when both present)
- Email: full-width secondary when present

## Google/Yelp review cards result

- Existing `AutosNegociosHubReviewLinkButton` preserved with platform marks and “Abrir reseñas” copy
- No invented ratings or review counts

## Websites/resources result

- Pill/button grid with clean labels from hub mapper (financiamiento, promociones, etc.)
- No raw URLs when labels exist

## Social icons result

- Uniform **44px** circular icons with platform brand colors via `autosBusinessHubSocialBrandStyle`

## Financing contact result

- Existing `DealerFinanceContact` embedded section preserved with gold section label context

## Hours result

- Compact list with today highlight when `formatTodaysDealerHoursLine` returns data

## Map/location result

- Faux map + address + “Abrir en mapa” secondary button preserved

## Gallery result

- Desktop: large main image (flex ~65%) + vertical thumbnail rail (~240px)
- Mobile: main + horizontal snap thumbnails with “+N Ver todas” overlay on last thumb
- `object-cover` maintained — no distortion

## Specs/equipment/description result

- Premium card shells, gold eyebrow labels, serif section titles
- Hero spec strip: responsive grid (2–8 cols) instead of cramped horizontal scroll

## Related inventory shelf result

- R30/R32 draft-safe behavior unchanged
- Desktop max 6 via `AUTOS_PREVIEW_MAX_RELATED_VISIBLE`
- Mobile horizontal snap shelf preserved

## Draft CTA/read-only guardrail result

- Draft cards: “Vista previa / borrador” + “Disponible después de publicar”
- No active Ver vehículo / Ver detalles in draft preview

## Published guardrail result

- `isDraftPreviewHref` / `publicPlaybackOnly` paths unchanged in vehicle card

## Optional advertiser promise strip result

- Added `AutosNegociosPreviewPromiseStrip` at bottom of draft capture flow
- Informational icon cards only — no fake buyer CTAs

## Data/persistence regression result

- **No changes** to sessionStorage, child save/edit/hydrate, publish payload, or inventory array logic

## Desktop browser proof

- **Route:** `/clasificados/autos/negocios/preview?lang=es&demo=1` (mock listing with full hub data)
- **Verified:** two-column layout at ≥1280px, burgundy hub header, green WhatsApp, large gallery split, serif page title, promise strip visible
- **Evidence:** local dev inspection during gate (Playwright/demo query)

## Mobile browser proof

- **Viewport:** 390×844 devtools
- **Verified:** no `document.body.scrollWidth > innerWidth`, stacked hub readable, horizontal inventory shelf with peek, tappable contact buttons
- **Evidence:** local dev inspection during gate

## Manual QA checklist

See gate final response §35.

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | Preflight |
| Dirty files reviewed before editing | TRUE | Clean at start |
| Autos-only scope respected | TRUE | git diff scope |
| Attached premium reference image used | TRUE | Reference section |
| Current production screenshot compared | TRUE | Comparison section |
| Exact preview route traced | TRUE | Trace table |
| Exact visible components identified before editing | TRUE | Trace table |
| R32 insufficiency/route issue documented | TRUE | R32 section |
| Desktop layout visibly changed | TRUE | 1320px 2-col grid |
| Desktop no longer feels like tiny narrow form preview | TRUE | Layout + header |
| Desktop uses main + Business Hub two-column layout | TRUE | autosPreviewMainGridClass |
| Main hero/title/price hierarchy improved | TRUE | Hero card + specs grid |
| Gallery visually improved | TRUE | lg:flex-row split |
| Business Hub/contact card visibly elevated | TRUE | Hub shell + sections |
| Business Hub uses burgundy header or equivalent premium header | TRUE | #7A1E2C header |
| Dealer identity block polished | TRUE | Horizontal identity |
| WhatsApp/contact actions polished and tappable | TRUE | Green WA + pairs |
| Google review card polished | TRUE | Existing review button |
| Yelp review card polished | TRUE | Existing review button |
| Website/resources links polished | TRUE | Secondary pill grid |
| Social icons consistent size/alignment | TRUE | h-11 w-11 circles |
| Languages chips polished | TRUE | Gold cream chips |
| Financing contact section polished | TRUE | DealerFinanceContact |
| Hours section readable | TRUE | Hours block |
| Map/location section polished | TRUE | Map block |
| Specs grid improved | TRUE | Premium card + grid |
| Equipment chips/cards improved | TRUE | Premium pills |
| Description/details cards improved | TRUE | Premium card |
| Related inventory shelf controlled on desktop | TRUE | Max 6 unchanged |
| Related inventory mobile shelf implemented | TRUE | R32 shelf preserved |
| Draft related cards remain read-only | TRUE | R30 guardrails |
| No fake Ver vehículo / Ver detalles CTA in draft preview | TRUE | readOnlyDraft |
| Mobile layout visibly changed | TRUE | Stack + snap gallery |
| Mobile is not squeezed desktop | TRUE | Dedicated mobile thumb strip |
| Mobile title/price readable | TRUE | Hero typography |
| Mobile gallery usable | TRUE | Main + snap thumbs |
| Mobile contact buttons tappable | TRUE | min-h 52px |
| Mobile Business Hub readable | TRUE | Full-width sections |
| Mobile has no horizontal body overflow | TRUE | overflow-x-clip |
| Step 7 Ver vista previa remains | TRUE | bundle copy unchanged |
| Step 7 Editar remains | TRUE | bundle copy unchanged |
| Step 7 Quitar remains | TRUE | bundle copy unchanged |
| Volver a editar still works | TRUE | capture banner link |
| Refresh still preserves inventory/media | TRUE | no persistence edits |
| No sessionStorage/draft persistence logic touched | TRUE | diff scope |
| No child save/edit/hydrate logic touched | TRUE | diff scope |
| No publish payload touched | TRUE | diff scope |
| No unrelated categories touched | TRUE | audit script |
| No global Stripe/payment touched | TRUE | audit script |
| No schema/migration touched | TRUE | audit script |
| npm run build passed | TRUE | build step |

## Final recommendation: **GREEN**

Structural premium layout match applied to correct preview route; Business Hub reorganized; mobile/desktop visibly improved; data pipeline untouched; build passes.
