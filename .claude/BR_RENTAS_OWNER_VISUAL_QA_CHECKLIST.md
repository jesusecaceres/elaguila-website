# BR + RENTAS — OWNER VISUAL QA CHECKLIST (33 🟡 items)

Status: prepared 2026-08-28, NOT executed by Claude — visual/layout/compactness/hierarchy items are
inherently subjective and require the owner's own eye on rendered pixels, per the governing
directive ("DO NOT decide these yourself unless current rendered screenshot evidence is
sufficient"). This is the checklist to follow while clicking through the product.

Widths to check for anything layout/responsiveness-related: **375 (mobile) / 768 (tablet) / 1024
(small desktop) / 1440 (desktop)**. Focus areas called out by the directive: gallery, facts grid,
highlights, owner/professional card, contact rail, HOA, Open House, results card, checkout
separation, shell width, excessive whitespace, hierarchy.

Do NOT commit this file. Branch: `fix/br-negocio-inventory-hub-media-hydration-2026-08-27`.

---

## SHARED (cross-lane) — 11 items

**⚠️2**
SCREEN: `/clasificados/publicar/bienes-raices/negocio/agente-individual` (application-time preview) side-by-side with `/clasificados/publicar/bienes-raices/privado` → `/clasificados/bienes-raices/preview/privado`.
WHAT OWNER MUST LOOK AT: Open both preview pages back to back; compare hero/price/typography weight.
EXPECTED: Same premium property-quality shell (ivory/cream cards, serif headings); Privado's owner layer is simpler than Negocio's professional layer, property presentation is not downgraded.
SCREENSHOT REQUIRED: YES (both, side by side)

**⚠️15**
SCREEN: BR live public detail (`/clasificados/anuncio/[id]?origen=br`) and BR Privado/Negocio preview.
WHAT OWNER MUST LOOK AT: The facts-grid card (status/operation/type/beds/baths/parking/zip/pool/pets/furnished).
EXPECTED: One consistent grid look across live detail and preview — same card chrome, label/value styling, spacing — not two different bespoke layouts.
SCREENSHOT REQUIRED: YES

**⚠️16**
SCREEN: BR Privado preview (servicios/highlights chips) and Rentas preview (features/included services chips).
WHAT OWNER MUST LOOK AT: The chip rows under each section heading.
EXPECTED: Compact, evenly wrapped chip row, same visual treatment across BR Privado and Rentas — not stretched, not oversized icons.
SCREENSHOT REQUIRED: YES

**⚠️37**
SCREEN: Any BR or Rentas live listing / preview with city+state+country all set.
WHAT OWNER MUST LOOK AT: The address/location line under the title.
EXPECTED: No duplicate fragments — never "San José, CA, CA" or "California, California."
SCREENSHOT REQUIRED: NO (text-only check, but flag if a duplicate is spotted)

**⚠️47**
SCREEN: BR Negocio + BR Privado public detail/preview pages.
WHAT OWNER MUST LOOK AT: Overall first impression — hero image, price prominence, heading weight.
EXPECTED: Feels premium and property-first, not like a generic form dump.
SCREENSHOT REQUIRED: YES

**⚠️58**
SCREEN: BR + Rentas landing, results, preview, and public detail pages.
WHAT OWNER MUST LOOK AT: Resize the browser (or device toolbar) to 375 / 768 / 1024 / 1440.
EXPECTED: No horizontal scroll, no overlapping elements, no cut-off text at any of the 4 widths.
SCREENSHOT REQUIRED: YES (one per width)

**⚠️59**
SCREEN: Same pages as ⚠️58, focused sweep.
WHAT OWNER MUST LOOK AT: Specifically the gallery, results card, contact rail, HOA card, Open House card, feature grids, checkout section, and form fields at each width.
EXPECTED: Every one of these components individually holds its layout cleanly at all 4 widths — no component-specific breakage even if the page overall looks fine.
SCREENSHOT REQUIRED: YES (one per component per width where feasible; prioritize 375 and 1440)

**⚠️60**
SCREEN: Any BR/Rentas page with `?lang=en` vs default `?lang=es`.
WHAT OWNER MUST LOOK AT: Every visible string on the page in both languages.
EXPECTED: No mixed-language strings (a Spanish label next to an English value, or vice versa); both languages read naturally, not machine-translated.
SCREENSHOT REQUIRED: YES (es + en pair for each major screen)

**⚠️132**
SCREEN: BR Privado preview + BR Negocio preview, HOA section (only visible when HOA fields are filled).
WHAT OWNER MUST LOOK AT: The HOA card's visual polish — spacing, iconography, card chrome.
EXPECTED: Looks like a designed card, not a raw database-row dump.
SCREENSHOT REQUIRED: YES

**⚠️137**
SCREEN: BR Privado + BR Negocio preview, Open House section.
WHAT OWNER MUST LOOK AT: The Open House event card(s) — pixel-level treatment (calendar icon, appointment badge, spacing between multiple events).
EXPECTED: Compact per-event cards with a coherent calendar/appointment visual language, consistent between Privado (now up to 4 events) and Negocio.
SCREENSHOT REQUIRED: YES (single event AND multiple events, both lanes)

**⚠️154**
SCREEN: Full BR Negocio funnel: publish form → preview → results card → public detail.
WHAT OWNER MUST LOOK AT: Design tokens and copy voice across the whole funnel (pricing, taxonomy labels, identity block, media, HOA, Open House, map, Community Trust, filters).
EXPECTED: Feels like one coherent professional product end to end, not stitched-together pieces.
SCREENSHOT REQUIRED: YES (one screenshot per funnel step)

---

## BR NEGOCIO — 3 items

**⚠️141**
SCREEN: `/clasificados/publicar/bienes-raices/negocio/agente-individual` preview / public detail — `BrAgenteResContactSidebar`.
WHAT OWNER MUST LOOK AT: The contact sidebar containing office/brand, agent(s), broker/financing role, social/CTA blocks.
EXPECTED: Reads as a sidebar that supports the listing, not a full-width takeover that buries the property.
SCREENSHOT REQUIRED: YES

**⚠️142**
SCREEN: BR results page (`/clasificados/bienes-raices/resultados`) — BR Negocio cards.
WHAT OWNER MUST LOOK AT: Card size/compactness and whether the cover image is the real listing photo.
EXPECTED: Compact card, real listing image (not a placeholder), consistent with the rest of the results grid.
SCREENSHOT REQUIRED: YES

**⚠️81**
SCREEN: `/clasificados/publicar/bienes-raices/negocio/agente-individual` — residential Tipo/Subtipo dropdowns.
WHAT OWNER MUST LOOK AT: Open the Tipo and Subtipo dropdowns for Residencial.
EXPECTED: Options cover real-market residential types without needing the custom "otro" fallback for common cases.
SCREENSHOT REQUIRED: NO (list the visible options in the report instead)

---

## BR PRIVADO — 7 items

**⚠️160**
SCREEN: `/clasificados/publicar/bienes-raices/privado` — Comercial and Terreno category tabs.
WHAT OWNER MUST LOOK AT: Field set quality for Comercial/Terreno vs. Residencial.
EXPECTED: Same taxonomy/detail depth and visual polish as Residencial — not a stripped-down afterthought.
SCREENSHOT REQUIRED: YES (Comercial + Terreno + Residencial, side by side)

**⚠️187**
SCREEN: `/clasificados/bienes-raices/preview/privado` — open the photo lightbox (`LeonixPreviewGalleryLightbox`).
WHAT OWNER MUST LOOK AT: How a photo scales inside the lightbox viewport.
EXPECTED: Image scales intelligently to fill the viewport without huge empty voids around it.
SCREENSHOT REQUIRED: YES (at 375 and 1440)

**⚠️190**
SCREEN: `/clasificados/bienes-raices/preview/privado` — seller/owner contact aside.
WHAT OWNER MUST LOOK AT: The owner contact card's visual integration with the rest of the page.
EXPECTED: Cream/ivory premium card, NOT a disconnected dark-brown/black block.
SCREENSHOT REQUIRED: YES

**⚠️191**
SCREEN: `/clasificados/bienes-raices/preview/privado` — owner card.
WHAT OWNER MUST LOOK AT: Which fields actually render — photo, name, phone, SMS (if supplied), WhatsApp, email.
EXPECTED: Every field the seller filled in on the form is visible on the card; nothing silently missing.
SCREENSHOT REQUIRED: YES

**⚠️199**
SCREEN: `/clasificados/bienes-raices/preview/privado` vs `/clasificados/publicar/bienes-raices/negocio/agente-individual` preview.
WHAT OWNER MUST LOOK AT: Overall visual language — colors, typography tokens.
EXPECTED: Privado uses the same premium Leonix property visual language as Negocio.
SCREENSHOT REQUIRED: YES (side by side)

**⚠️200**
SCREEN: Same as ⚠️199.
WHAT OWNER MUST LOOK AT: Card backgrounds, hierarchy, facts compactness, gallery, overall polish.
EXPECTED: Cream/ivory cards, strong hierarchy, compact facts grid, clean gallery — matches the Negocio bar.
SCREENSHOT REQUIRED: YES

**⚠️217**
SCREEN: `/clasificados/publicar/bienes-raices/privado` Comercial/Terreno end to end (media upload, contact, preview).
WHAT OWNER MUST LOOK AT: Full parity walk — media, contact, preview, persistence for Comercial and Terreno vs. the finished Residencial flow.
EXPECTED: Same quality bar across all 3 categories, no visibly unfinished areas.
SCREENSHOT REQUIRED: YES

**⚠️210**
SCREEN: `/clasificados/bienes-raices/preview/privado` — new "Vista en resultados" section (added this session).
WHAT OWNER MUST LOOK AT: The embedded `BienesRaicesNegocioCard` results-card preview.
EXPECTED: Realistic size (not a giant empty theater), uses the real card component/styling seen on the actual results page.
SCREENSHOT REQUIRED: YES

---

## RENTAS SHARED (Privado + Negocio) — 8 items

**⚠️41**
SCREEN: `/clasificados/rentas/preview/privado` and `/clasificados/rentas/preview/negocio` — "Vista en resultados" section.
WHAT OWNER MUST LOOK AT: Confirm the card shown is the real `RentasResultCard`, not an approximation.
EXPECTED: Matches the real results-grid card exactly.
SCREENSHOT REQUIRED: YES

**⚠️42**
SCREEN: Same as ⚠️41.
WHAT OWNER MUST LOOK AT: Card size relative to the surrounding page.
EXPECTED: Compact (max ~368px wide), not floating in an oversized empty container.
SCREENSHOT REQUIRED: YES

**⚠️45**
SCREEN: Rentas results page (`/clasificados/rentas`) — result cards.
WHAT OWNER MUST LOOK AT: The chip row on each card.
EXPECTED: Only high-signal chips (rental type, pets, furnished, category) capped at 3 — not every form selection dumped onto the card.
SCREENSHOT REQUIRED: NO

**⚠️221**
SCREEN: `/clasificados/publicar/rentas/privado` and `/clasificados/publicar/rentas/negocio`.
WHAT OWNER MUST LOOK AT: Vertical space between the page header and the first form field.
EXPECTED: Tight — the form should begin without an oversized gap above it.
SCREENSHOT REQUIRED: NO

**⚠️256**
SCREEN: Rentas preview pages, results-card-preview section.
WHAT OWNER MUST LOOK AT: Same as ⚠️42 — card compactness.
EXPECTED: Does not dominate the preview page.
SCREENSHOT REQUIRED: YES

**⚠️259**
SCREEN: Rentas public listing detail (`/clasificados/rentas/listing/[id]`) at desktop width (1440).
WHAT OWNER MUST LOOK AT: Overall page composition — main content column vs. side/action rail.
EXPECTED: Premium main-content + side-rail composition on desktop, collapsing naturally to a single column on mobile (375).
SCREENSHOT REQUIRED: YES (1440 and 375)

**⚠️280**
SCREEN: `/clasificados/rentas/listing/[id]` (live) and Rentas preview pages — "Visitas y recorridos" / showings card (newly wired to render this session).
WHAT OWNER MUST LOOK AT: The showing/tour card now rendering via the shared `LeonixOpenHouseSlotCards` component.
EXPECTED: Same structured-card visual language as BR's Open House cards, with Rentas' own labels (showing availability, instructions, virtual tour link) — not a flat text blob.
SCREENSHOT REQUIRED: YES

**⚠️288**
SCREEN: All 5 Rentas rental-type pathways (full_housing, room_shared, storage_parking, commercial_space, land_parcel) across application, preview, and results.
WHAT OWNER MUST LOOK AT: Resize to 375/768/1024/1440 for each pathway's distinguishing fields.
EXPECTED: No breakage specific to any one pathway's extension fields at any width.
SCREENSHOT REQUIRED: YES (prioritize 375 per pathway)

---

## RENTAS NEGOCIO — 1 item

**⚠️293**
SCREEN: `/clasificados/publicar/rentas/negocio` preview / `RentasNegocioDesktopBusinessRail`.
WHAT OWNER MUST LOOK AT: Business identity/contact block richness vs. the rental listing content.
EXPECTED: Richer than Rentas Privado's owner card, but not overwhelming the actual rental listing.
SCREENSHOT REQUIRED: YES

---

## RENTAS PRIVADO — 2 items

**⚠️309**
SCREEN: `/clasificados/rentas/preview/privado` — owner identity/contact card.
WHAT OWNER MUST LOOK AT: Card size and integration with the rest of the listing.
EXPECTED: Clear, compact, visually integrated — not a bolted-on block.
SCREENSHOT REQUIRED: YES

**⚠️319**
SCREEN: A Rentas Privado listing with minimal optional data filled in (sparse case) — preview and live detail.
WHAT OWNER MUST LOOK AT: Overall page size/whitespace when most optional sections are empty.
EXPECTED: Page stays smaller/cleaner, no large empty gaps where an omitted section would have been.
SCREENSHOT REQUIRED: YES

---

## Summary

TOTAL: 33 items — SHARED 11, BR NEGOCIO 3, BR PRIVADO 7, RENTAS SHARED 8, RENTAS NEGOCIO 1, RENTAS PRIVADO 2.
OWNER VISUAL GATE: PENDING until the owner completes this checklist with real screenshots.
