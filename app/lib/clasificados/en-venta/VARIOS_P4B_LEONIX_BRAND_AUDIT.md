# Gate P4-B — Leonix Brand System for Varios Preview + Detail

## 1. Files inspected

- `app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx` (read-only reference)
- `app/(site)/clasificados/en-venta/shared/styles/enVentaBrand.ts` (new)
- `app/(site)/clasificados/en-venta/shared/styles/enVentaTypography.ts`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaListingHero.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaDetailContentStack.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaBuyerPanel.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewShell.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewGallery.tsx`
- `app/(site)/clasificados/en-venta/preview/page.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaMediaGallery.tsx`

## 2. Files changed

See git diff — all under `en-venta/**` plus `package.json` audit script only.

## 3. Brand reference summary

Coming Soon v2 uses warm cream surfaces, burgundy primary CTAs, gold/bronze accents, charcoal body text, and deep green for trust/community accents. Varios now maps these locally via `LEONIX_VARIOS` + `EN_VENTA_SURFACE` without editing Coming Soon or global theme.

## 4. Color mapping

| Coming Soon | Varios usage |
|---|---|
| Burgundy `#7A1E2C` | Primary CTA (Hacer oferta / Contactar), Llamar, saved heart, publish nav |
| Gold `#C9A84A` / bronze `#8A6B1F` | Chips, borders, section labels, share/outline buttons |
| Cream `#FFFDF7` / page `#F8F4EA` | Page background, cards, listing canvas |
| Charcoal `#3D3428` / `#1F241C` | Title, body, metadata |
| Green `#2A4536` / `#556B3E` | Buyer safety line accent only |

## 5. Typography mapping

- Listing title: serif semibold charcoal (`EN_VENTA_TYPO.listingTitle`)
- Price: serif semibold burgundy (`EN_VENTA_TYPO.listingPrice`)
- Section labels: gold-bronze uppercase (`sectionTitle`, `factLabel`)
- Body: normal weight charcoal (`body`)
- Trust line: green-muted (`trustLine`)

## 6. Contact card changes

- Premium card surface with gold ring border (`EN_VENTA_SURFACE.contactCard`)
- Seller avatar uses burgundy/gold gradient ring
- Llamar = burgundy primary; Mensaje/Correo = gold outline cream; WhatsApp = brand green when present
- Delivery methods remain compact gold chips in contact card; long notes stay in content-stack delivery card

## 7. CTA/action changes

- Primary offer/contact CTA: burgundy with shadow (Coming Soon primary pattern)
- Engagement row: gold-outline secondary; save active = burgundy tint; report = muted outline
- Preview shell publish pill: burgundy (was gold gradient)

## 8. Card/layout changes

- Listing canvas: `rounded-xl` cream card with gold ring (replaces bubbly `rounded-[2rem]`)
- Content cards: consistent sand border + cream fill
- Gallery frames: matching gold-ring treatment
- Detail page en-venta: warm page background gradient + hero card polish

## 9. Mobile responsive result

- Grid/stack unchanged; min tap targets preserved
- Engagement row wraps; contact buttons full-width stack
- No horizontal overflow patterns introduced

## 10. Risks / deferred work

- `EnVentaMediaGallery` inner thumbs still use legacy border tokens (wrapper branded; inner polish deferred)
- BR / non-en-venta branches in `EnVentaAnuncioLayout` intentionally unchanged
- Global Leonix theme token migration remains a future gate

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Coming Soon brand palette was used as reference | TRUE | `enVentaBrand.ts` + audit §4 |
| Varios styling now uses Leonix cream/ivory surfaces | TRUE | `EN_VENTA_SURFACE` |
| Varios primary CTA uses burgundy intentionally | TRUE | `primaryCta` + hero |
| Gold/bronze accents are used intentionally | TRUE | chips, borders, labels |
| Charcoal text hierarchy is consistent | TRUE | `EN_VENTA_TYPO` |
| Green is only used as restrained trust/contact accent | TRUE | `trustLine` border-l green |
| Listing title feels premium and consistent | TRUE | serif title token |
| Price typography is clean and prominent | TRUE | burgundy serif price |
| Chips feel consistent and premium | TRUE | `chipGold` |
| Contact card received brand polish | TRUE | `contactCard` + avatar |
| Contact buttons have clear consistent styling | TRUE | `EnVentaContactButtons` |
| WhatsApp only appears when data exists | TRUE | unchanged action builder |
| Description card spacing is clean | TRUE | `contentCard` |
| Facts/specs card spacing is clean | TRUE | `contentCardInner` grid |
| Condition/accessories cards are clean | TRUE | content stack |
| Delivery information is not squeezed into contact card | TRUE | chips only in panel; notes in stack |
| Long notes wrap cleanly | TRUE | `[overflow-wrap:anywhere]` |
| No random Picasso color mix was introduced | TRUE | centralized tokens |
| Desktop layout remains clean | TRUE | grid unchanged |
| Mobile layout remains clean | TRUE | stack/wrap preserved |
| No unrelated categories were edited | TRUE | git diff scope |
| Preview draft persistence was not touched/broken | TRUE | no draft logic edits |
| Video behavior was not touched/broken | TRUE | gallery/player untouched |
| Image drag/reorder was not touched/broken | TRUE | publish form untouched |
| Engagement actions were not removed | TRUE | `EnVentaEngagementRow` |
| npm run build passed | TRUE | gate validation |
