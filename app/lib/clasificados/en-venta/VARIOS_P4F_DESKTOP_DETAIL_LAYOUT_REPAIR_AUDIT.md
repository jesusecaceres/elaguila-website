# Emergency Gate P4-F — Varios Desktop Detail Layout Repair

## 1. Files inspected

- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewGallery.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaDetailContentStack.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaListingHero.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaBuyerPanel.tsx`
- `app/(site)/clasificados/en-venta/shared/styles/enVentaBrand.ts`
- `app/(site)/clasificados/anuncio/[id]/page.tsx` (read-only — routes to `EnVentaAnuncioLayout`)

## 2. Files changed

- `shared/components/EnVentaDetailPageLayout.tsx` — **new** shared desktop grid
- `shared/styles/enVentaBrand.ts` — `detailPageMax` token (~1200px)
- `listing/EnVentaAnuncioLayout.tsx` — Varios public detail uses unified layout
- `preview/EnVentaPreviewPage.tsx` — preview uses same layout + wider canvas
- `VARIOS_P4F_DESKTOP_DETAIL_LAYOUT_REPAIR_AUDIT.md` — this file
- `scripts/varios-p4f-desktop-detail-layout-repair-audit.ts` — gate audit script
- `package.json` — audit npm script

## 3. Exact desktop layout root cause

1. **Public detail (`EnVentaAnuncioLayout`)** used **two disconnected 12-column grids**: top grid `7+5` (gallery | hero+contact stacked), lower grid `8+4` (content | related rail). Column spans did not align between rows (`7≠8`, `5≠4`), so the contact card floated in the top-right stack while content and related rail occupied a separate lower grid — producing a narrow, mobile-like composition on desktop.

2. **Preview (`EnVentaPreviewPage`)** constrained the detail grid inside **`max-w-5xl` (1024px)** plus an extra **`listingCanvas`** padding wrapper, and allocated gallery to only **`lg:col-span-5`** (~42% width), leaving large dead margins and making media/contact/content feel disconnected on desktop.

## 4. Desktop layout fix applied

- Added **`EnVentaDetailPageLayout`**: single responsive grid shared by public detail + preview.
  - **xl+:** gallery `col-span-7`, hero `col-span-5`, sticky contact sidebar `col-span-4` (`col-start-9`, `row-span-2`), content `col-span-8` row 2.
  - **lg:** gallery + hero side-by-side; sidebar and content full-width below.
  - **mobile:** gallery → hero → sidebar → content (unchanged stack order).
- Public detail: hero and contact sidebar **split** (no longer stacked in one `col-span-5` column); related rail moved **below** content (full main width).
- Preview: **`detailPageMax`** (`max-w-[min(100%,75rem)]`) replaces `max-w-5xl`; removed nested `listingCanvas` around the detail grid.
- Delivery notes remain in **`EnVentaDetailContentStack`** (not squeezed into contact card); sidebar keeps short fulfillment chips only.

## 5. Public detail result

Varios published detail at desktop uses full ~1200px canvas with premium gallery width, aligned hero, sticky contact sidebar, and content cards in the main column below.

## 6. Preview full-detail result

Preview full-detail section uses the same grid as public detail; results-card sample remains above.

## 7. Mobile preservation result

Single-column order preserved via explicit `order-*` classes; no new fixed widths; gallery remains `aspect-[4/3]` full width on small screens.

## 8. Brand preservation result

No color/token/font system changes — spacing, grid, and max-width only.

## 9. Behavior preservation result

Publish, draft, terms, video, images, save/share/report, results-card preview, and visibility fetch paths untouched.

## 10. Build/check result

See gate validation (`npm run build`, audit script).

## 11. Remaining risks

- Browser viewport QA at 1440/1280/768/390 recommended after deploy.
- Legacy non-Varios surfaces in `EnVentaAnuncioLayout` (Bienes Raíces luxury) still use the old two-grid structure intentionally.

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Exact desktop root cause was identified | TRUE | §3 |
| Outer wrapper width was inspected | TRUE | `detailPageMax`, preview `max-w-5xl` removed |
| Main max-width container was inspected | TRUE | §4 |
| Desktop grid/flex breakpoints were inspected | TRUE | `EnVentaDetailPageLayout` lg/xl classes |
| Media/gallery desktop sizing was inspected | TRUE | gallery `col-span-7` |
| Title/price/action desktop sizing was inspected | TRUE | hero `col-span-5` |
| Contact card desktop placement was inspected | TRUE | sidebar `col-span-4` sticky |
| Description/facts card placement was inspected | TRUE | content `col-span-8` |
| Condition/accessories placement was inspected | TRUE | `EnVentaDetailContentStack` in content slot |
| Delivery placement was inspected | TRUE | delivery in content stack, chips in sidebar |
| Desktop layout now uses available width properly | TRUE | `75rem` canvas |
| Desktop media/video is no longer tiny/disconnected | TRUE | gallery 7/12 cols |
| Desktop title/price/action area is aligned cleanly | TRUE | hero adjacent to gallery |
| Contact card no longer floats awkwardly | TRUE | sticky sidebar column |
| Lower content cards align cleanly | TRUE | single content column under main area |
| Delivery notes are not squeezed into sidebar | TRUE | full cards in content stack |
| Public detail desktop layout is repaired | TRUE | `EnVentaAnuncioLayout` unified path |
| Preview full-detail desktop layout is repaired | TRUE | `EnVentaPreviewPage` |
| 1440px desktop behavior was checked or code-evidenced | TRUE | xl grid classes |
| 1280px laptop behavior was checked or code-evidenced | TRUE | xl/lg breakpoints |
| 768px tablet behavior was checked or code-evidenced | TRUE | lg 2-col + stack |
| 390px mobile behavior was checked or code-evidenced | TRUE | order-1..4 stack |
| Mobile layout remains usable | TRUE | §7 |
| Publish logic was not changed | TRUE | no publish file edits |
| Draft persistence was not changed | TRUE | no draft file edits |
| Terms/checkbox logic was not changed | TRUE | untouched |
| Leonix Ad ID generation was not changed | TRUE | untouched |
| Video behavior was not changed except layout sizing if needed | TRUE | gallery components unchanged |
| Image upload/reorder behavior was not changed | TRUE | untouched |
| Save/share/report behavior was not removed | TRUE | engagement row + report drawer |
| Results-card preview was not removed | TRUE | `EnVentaPreviewResultsCardSample` |
| Published listing visibility fix was not removed | TRUE | no visibility file edits |
| Leonix brand styling was preserved | TRUE | §8 |
| No unrelated categories were edited | TRUE | git diff scope |
| No global layout/theme files were edited | TRUE | en-venta scope only |
| No Stripe/payment files were edited | TRUE | audit scan |
| npm run build passed | TRUE | gate validation |
