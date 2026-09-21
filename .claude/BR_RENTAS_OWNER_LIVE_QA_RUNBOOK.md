# BR + RENTAS — OWNER LIVE QA RUNBOOK

Status: prepared 2026-08-28. NO CODE CHANGES this pass. Do NOT commit this file.
Branch: `fix/br-negocio-inventory-hub-media-hydration-2026-08-27`.

Consolidates the 61 remaining 🟠 runtime items (2 of 63 already proven: ⚠️150, ⚠️153) and all 33 🟡
visual items into **16 flows (A–P)** and **35 screenshot moments**, bundled by real user journey so
one application pass proves many ⚠️ items at once — not 94 disconnected tests.

---

## OWNER START HERE

1. **First route to open:** `/clasificados/publicar/bienes-raices/negocio/agente-individual?lang=es` (log in first with your normal seller account)
2. **Values to enter:** use the exact QA values listed under **FLOW A** below — they're chosen to prove typing/spacebar/accents/custom-add all at once.
3. **First screenshot:** **S1** — after typing the QA title/description and adding one custom highlight chip, before moving to the next section.
4. **What to send Coach:** each numbered screenshot (S1, S2, S3…) as you reach it, in order, with the flow letter in the filename or caption (e.g. "A-S1.png"). Don't wait until the end — send as you go. If anything on a screen doesn't match its "EXPECTED RESULT," send that screenshot too and say which flow/step it was — that's a FAIL, not a mistake on your part.

Work top to bottom, flow A through flow P. Each flow tells you exactly what to type, what to click, and what to screenshot. You don't need to understand the ⚠️ numbers — they're just Coach's internal tracking; skip straight to INPUTS/INTERACTIONS/SCREENSHOTS.

---

## QA TEST VALUES (reuse these everywhere a flow calls for "distinct contact values")

| Field | Value |
|---|---|
| CALL NUMBER | (408) 555-0101 |
| SMS NUMBER | (408) 555-0102 |
| WHATSAPP NUMBER | (408) 555-0103 |
| EMAIL | qa.leonix.test@yourdomain.com |
| WEBSITE | https://qa-leonix-test.example.com |

Using 3 *different* numbers for Call/SMS/WhatsApp is deliberate — it's the only way to prove each
button dials the number you actually meant, instead of all three silently collapsing to one.

Text-input QA string (use anywhere a flow says "QA text string"): `Depto. único — 2 recámaras, baño
completo, ¡a 5 min. del centro! (español)` — this one string exercises spacebar, punctuation,
accents (ú, á, ñ, ¡), and parentheses in a single paste/type.

---

## FLOW A — BR NEGOCIO RESIDENTIAL

ROUTE: `/clasificados/publicar/bienes-raices/negocio/agente-individual?lang=es`

STARTING STATE: Logged in as seller. Start a fresh Residencial listing (or continue a draft).

INPUTS TO ENTER:
- Título: `Casa QA Residencial — {QA text string above}`
- Precio: `485000`
- Tipo: Casa / Subtipo: any option shown
- Highlights: check 2 preset boxes, then use "Otro / Agregar" to type a custom highlight: `Patio techado con parrilla` → save it as a chip
- Service Area (Área de servicio): custom-add `San José y alrededores`
- Languages (Idiomas): custom-add `Español, Inglés`
- Contact block: Call = CALL NUMBER, SMS = SMS NUMBER, WhatsApp = WHATSAPP NUMBER, Email = EMAIL, Website = WEBSITE (from the QA TEST VALUES table)
- Upload 3+ photos

INTERACTIONS:
1. Type the title with normal typing, then click into the middle of it and press Backspace 3 times, retype — confirms cursor editing works, not just append-only typing.
2. Paste the QA text string into the description field (copy it from this doc, paste with Ctrl/Cmd+V).
3. Custom-add the highlight, Service Area, and Languages values one at a time — each must open one field, accept the value, turn it into a removable chip, and let you add the next one.
4. Upload photos → drag to reorder → click a non-first photo as portada (cover) → remove one photo → confirm the remaining count is correct.
5. Save → go to Preview → click "Back to Edit" → confirm every value above (title, price, highlights, custom chips, portada choice) is exactly as entered.
6. Reload the browser tab entirely (hard refresh) mid-way through editing (after step 1 but before saving) once, to prove autosave doesn't wipe anything.

SCREENSHOTS TO SEND:
- **S1** — the highlights section showing 2 checked presets + the custom "Patio techado con parrilla" chip, right after adding it.
- **S2** — the photo strip after reorder + portada selection + one removal, showing thumbnails and the portada badge.
- **S3** — the contact/identity block showing all 5 distinct QA values filled in.
- **S4** — the full Preview page after save (top of page, hero + price + facts grid + highlights chips visible).
- **S5** — the same Preview page after clicking Back to Edit and returning to Preview again, to visually confirm nothing reset.

RUNTIME REQUIREMENTS PROVEN: ⚠️4, ⚠️5, ⚠️7, ⚠️8, ⚠️54, ⚠️55, ⚠️107, ⚠️109, ⚠️117, ⚠️18, ⚠️19, ⚠️20, ⚠️21, ⚠️22, ⚠️43, ⚠️44

VISUAL REQUIREMENTS PROVEN: ⚠️2 (compare against Flow E's Privado shell later), ⚠️15, ⚠️16, ⚠️37 (check the address line has no duplicate "CA, CA"), ⚠️81, ⚠️141, ⚠️154

EXPECTED RESULT: every typed/pasted/custom-added value appears correctly and survives Preview → Back to Edit → Preview; photo order/portada/count match what you set; all 5 contact buttons are visible and distinct.

FAIL CONDITION: any typed text is truncated/garbled/missing accents; a custom-add chip doesn't stick or blocks adding the next one; portada reverts to photo #1; any value differs between the two Preview visits; a contact button is missing or shows the wrong number/email.

**Native contact handoff note (⚠️18/19/20/21/22):** clicking Call/SMS/WhatsApp/Email on a desktop browser can only prove the button opens the right dialog with the right number/address — it cannot prove the phone actually starts dialing. **Final mobile-device action needed:** tap each contact button on your own phone once and confirm your phone's native dialer/Messages/WhatsApp/Mail app opens pre-filled with the matching QA value.

---

## FLOW B — BR NEGOCIO COMMERCIAL

ROUTE: same application, switch category to Comercial (or start a new Comercial listing).

STARTING STATE: continue from Flow A's session or start fresh.

INPUTS TO ENTER:
- Tipo: Oficina / Subtipo: any
- Uso comercial: select from the dropdown (not free text)
- Custom-add one Uso comercial value not in the preset list: `Estudio de yoga`
- Custom-add one Comercial highlight: `Acceso 24/7`

INTERACTIONS: open the Uso comercial dropdown → select a preset → then use its custom-add control → save → Preview.

SCREENSHOTS TO SEND:
- **S6** — the Uso comercial dropdown open (showing it's structured choices, not a free-text box) plus the custom-add result as a chip.

RUNTIME REQUIREMENTS PROVEN: ⚠️85, ⚠️86, ⚠️87

VISUAL REQUIREMENTS PROVEN: (none new — folds into Flow A's shell comparison)

EXPECTED RESULT: Uso comercial is a real dropdown with real options; the custom value saves as a chip alongside the preset selection.

FAIL CONDITION: Uso comercial is still a plain text box; the custom-add control is missing or doesn't persist.

---

## FLOW C — BR NEGOCIO LAND

ROUTE: same application, switch category to Terreno/Lote.

STARTING STATE: continue or start fresh.

INPUTS TO ENTER: Tipo: any / custom-add one Land highlight: `Cercado perimetral completo`

INTERACTIONS: custom-add the highlight → save → Preview.

SCREENSHOTS TO SEND:
- **S7** — the Land highlights section showing the custom chip.

RUNTIME REQUIREMENTS PROVEN: ⚠️91, ⚠️92

VISUAL REQUIREMENTS PROVEN: (none new)

EXPECTED RESULT: custom land highlight saves and displays like the preset ones.

FAIL CONDITION: custom-add missing or the chip doesn't persist to Preview.

---

## FLOW D — BR NEGOCIO INVENTORY CHILD

ROUTE: from your BR Negocio hub, add 2 additional (child) properties to the same business.

STARTING STATE: a parent listing already exists (from Flow A).

INPUTS TO ENTER: Child A — Título: `Propiedad Hijo A QA`. Child B — Título: `Propiedad Hijo B QA`.

INTERACTIONS:
1. Create Child A, fill title + a couple of fields, save.
2. Create Child B, fill different title + fields, save.
3. Reopen Child A → confirm it still shows Child A's own values, not Child B's.
4. Confirm the parent hub's own identity/contact info still shows correctly on both children (inherited, not editable per-child).

SCREENSHOTS TO SEND:
- **S8** — Child A reopened after Child B was created and saved, showing Child A's title/fields intact.

RUNTIME REQUIREMENTS PROVEN: ⚠️57, ⚠️124, ⚠️126, ⚠️127

VISUAL REQUIREMENTS PROVEN: (none new)

EXPECTED RESULT: each child keeps its own property data; saving Child B never touches Child A; both children show the same inherited parent identity/contact block.

FAIL CONDITION: Child A's data changed after Child B was saved (sibling overwrite); either child is missing the parent's identity block; the two children got merged or duplicated IDs.

---

## FLOW E — BR PRIVADO RESIDENTIAL

ROUTE: `/clasificados/publicar/bienes-raices/privado?lang=es`

STARTING STATE: fresh Privado Residencial listing.

INPUTS TO ENTER:
- Título / Precio: type the price digit by digit and watch it format live (e.g. type `4`,`8`,`5`,`0`,`0`,`0` and confirm it shows `$485,000`-style formatting as you go, not only after you click away)
- Open House: add Event 1 (fecha/inicio/fin/notes), click "+ Añadir horario / visita", add Event 2 with different date/time and check "Solo con cita previa" on it, add a booking link if the field is present
- Upload 3+ photos

INTERACTIONS:
1. Watch the price field format while typing (don't just check the final value).
2. Add 2 Open House events as above → Save → Preview → confirm both appear as separate structured cards (not one merged blob).
3. Back to Edit → remove Event 1 → Save → Preview → confirm only Event 2 remains and it's still correct.
4. Open the photo gallery lightbox → zoom in (pinch or Ctrl+scroll) → swipe/arrow to next photo → previous → click a thumbnail → press Escape to close.
5. Scroll to the owner contact card and to the new "Vista en resultados" section near the bottom of Preview.

SCREENSHOTS TO SEND:
- **S9** — the price field mid-typing (a screen recording or a screenshot right after typing, before clicking away) showing live `$` formatting.
- **S10** — Preview showing both Open House events as separate cards.
- **S11** — Preview after removing Event 1, showing only Event 2 remains with its "Solo con cita previa" flag visible.
- **S12** — the gallery lightbox open, zoomed into one photo.
- **S13** — the owner contact card (cream/ivory styling check) — full card visible.
- **S14** — the "Vista en resultados" section showing the results-card preview.

RUNTIME REQUIREMENTS PROVEN: ⚠️161, ⚠️188, ⚠️206, ⚠️215, ⚠️216

VISUAL REQUIREMENTS PROVEN: ⚠️132, ⚠️137, ⚠️187, ⚠️190, ⚠️191, ⚠️199, ⚠️200, ⚠️210

EXPECTED RESULT: price formats live while typing; both Open House events render as separate structured cards with correct fields; removing one leaves the other intact after a full save/reload cycle; gallery zoom/swipe/thumbnail/Escape all work; owner card is a light cream card (not dark); results-card preview matches the real results-page card.

FAIL CONDITION: price only formats after blur; Open House events merge into one block or lose data on remove; gallery zoom/swipe doesn't respond; owner card renders as a dark/black block; results-card preview looks fake or oversized.

---

## FLOW F — BR PRIVADO COMMERCIAL

ROUTE: same application, Comercial category.

STARTING STATE: fresh or continue.

INTERACTIONS: fill the same depth of fields as Flow E's Residencial pass (media, contact, a couple of category fields) → Preview → Back to Edit → confirm persistence.

SCREENSHOTS TO SEND:
- **S15** — Comercial Preview page, full view, next to (or immediately followed by) Flow E's S10 for a side-by-side quality comparison.

RUNTIME REQUIREMENTS PROVEN: (contributes to ⚠️217, continued in Flow G)

VISUAL REQUIREMENTS PROVEN: (contributes to ⚠️217, ⚠️160)

EXPECTED RESULT: same quality/completeness bar as Residencial — no missing fields, no broken media/preview.

FAIL CONDITION: any field, media step, or preview element that worked in Residencial fails or looks unfinished here.

---

## FLOW G — BR PRIVADO LAND

ROUTE: same application, Terreno/Lote category.

STARTING STATE: fresh or continue.

INTERACTIONS: (a) fill a normal Terreno listing the same way as F → Preview. (b) **Sparse-output check**: separately, fill ONLY the required minimum fields (title, price, one location field, 1 photo, seller name, one contact method, pets — everything else left blank) → Preview → confirm NO empty rows/cards render anywhere (no "HOA: —", no blank Open House card, no empty highlights section).

SCREENSHOTS TO SEND:
- **S16** — the sparse-fill Preview page, full scroll, showing a clean, short page with no phantom empty sections.

RUNTIME REQUIREMENTS PROVEN: ⚠️217 (closes out, combined with Flow F), ⚠️66

VISUAL REQUIREMENTS PROVEN: ⚠️160, ⚠️217

EXPECTED RESULT: Terreno matches Comercial/Residencial quality; the minimal-fill listing is short and clean with zero empty-placeholder rows.

FAIL CONDITION: any Terreno field/step missing vs. the other two categories; the sparse listing shows any "not indicated" / empty-value row that should have been suppressed.

---

## FLOW H — RENTAS PRIVADO FULL_HOUSING

ROUTE: `/clasificados/publicar/rentas/privado?lang=es` — Tipo de renta: Casa or Apartamento (full_housing group)

STARTING STATE: fresh listing.

INPUTS TO ENTER:
- Título/Descripción: paste the QA text string
- Custom-add one highlight: `Vista al jardín trasero`
- City: a real city — confirm the map preview centers on it, not a generic default
- Contact: Call = CALL NUMBER, SMS = SMS NUMBER, WhatsApp = WHATSAPP NUMBER, Email = EMAIL (same QA values table)
- Showing/tour section: fill "Disponibilidad para visitas" and a virtual tour URL
- Upload 3+ photos

INTERACTIONS:
1. Paste + edit the description (spacebar/backspace/punctuation check).
2. Custom-add the highlight chip.
3. Upload photos → reorder → set cover → remove one.
4. Fill contact block with the 4 distinct QA values.
5. Fill the showing/tour fields.
6. Save → Preview → Back to Edit → confirm every value above is exactly as entered → **hard refresh the browser** → Preview again → confirm values still match.
7. On the live/public view of this listing, scroll to the "Visitas y recorridos" card and the virtual tour link.

SCREENSHOTS TO SEND:
- **S17** — Preview page after first save (title/description/highlight chip/photos visible).
- **S18** — Preview page after the full roundtrip (Back to Edit → refresh → Preview again), to visually confirm nothing changed.
- **S19** — the contact block on Preview showing all 4 distinct QA values, plus one clicked action (e.g. WhatsApp) to confirm it opens the canonical action sheet (a modal), not a direct link.
- **S20** — the "Visitas y recorridos" card + virtual tour link, live or Preview.

RUNTIME REQUIREMENTS PROVEN: ⚠️245, ⚠️251, ⚠️252, ⚠️264, ⚠️289 (full_housing rep.), ⚠️290 (full_housing rep.), ⚠️310, ⚠️312, ⚠️317

VISUAL REQUIREMENTS PROVEN: ⚠️280

EXPECTED RESULT: text/highlight/media/contact/showing values all persist through the full roundtrip; map centers on the entered city; WhatsApp/Call/SMS/Email open a modal action sheet with the correct distinct value each; the showings card renders as a structured card (not a flat text blob), matching BR's Open House card styling.

FAIL CONDITION: any value lost or altered after Back to Edit/refresh; map shows a generic/wrong location; a contact button opens the wrong channel or navigates directly instead of opening the action sheet; the showings card is missing or looks like a plain paragraph.

**Native contact handoff note:** same as Flow A — desktop proves the correct modal/number; tap each on your phone for final confirmation.

---

## FLOW I — RENTAS PRIVADO ROOM_SHARED

ROUTE: same application, Tipo de renta: Cuarto/Recámara or Espacio compartido.

STARTING STATE: fresh listing.

INTERACTIONS: fill the room_shared-specific fields (bathroom type, kitchen type, private entrance, laundry, max occupants) → Preview → confirm **no whole-home fields leak in** (no bedroom count for the whole unit, no full-house lot size) and confirm the "Estacionamiento" row is correctly hidden for this pathway (this is a specific bug that was fixed — verify it stayed fixed).

SCREENSHOTS TO SEND:
- **S21** — Preview page for this listing, full scroll, confirming only room_shared-relevant fields appear and no Estacionamiento row is present.

RUNTIME REQUIREMENTS PROVEN: ⚠️289 (room_shared rep.), ⚠️290 (room_shared rep.)

VISUAL REQUIREMENTS PROVEN: (none new)

EXPECTED RESULT: only the 6 room_shared fields appear; no whole-home fields; no Estacionamiento row.

FAIL CONDITION: a whole-home field (full bedroom count, house lot size) appears; the Estacionamiento row is visible.

---

## FLOW J — RENTAS PRIVADO STORAGE_PARKING

ROUTE: same application, Tipo de renta: Garaje/Estacionamiento/Bodega.

STARTING STATE: fresh listing.

INPUTS TO ENTER: fill the storage_parking fields (approximate size, 24/7 access, electricity, security, permitted use, dimensions) **and the new "restricciones de vehículo" field**.

INTERACTIONS: fill → Preview → confirm the vehicle-restrictions field renders; confirm amueblado/mascotas fields are correctly absent for this pathway.

SCREENSHOTS TO SEND:
- **S22** — Preview page showing the vehicle-restrictions value alongside the other storage/parking fields.

RUNTIME REQUIREMENTS PROVEN: ⚠️237, ⚠️289 (storage_parking rep.), ⚠️290 (storage_parking rep.)

VISUAL REQUIREMENTS PROVEN: (none new)

EXPECTED RESULT: vehicle-restrictions field is present and saves/renders; amueblado/mascotas are absent.

FAIL CONDITION: vehicle-restrictions field missing or doesn't persist; amueblado/mascotas incorrectly appear.

---

## FLOW K — RENTAS PRIVADO COMMERCIAL_SPACE

ROUTE: same application, Tipo de renta: Oficina/Local comercial.

STARTING STATE: fresh listing.

INTERACTIONS: fill the commercial_space fields (permitted use, sqft, restroom availability, hours/access, minimum contract) → Preview.

SCREENSHOTS TO SEND:
- **S23** — Preview page for this listing.

RUNTIME REQUIREMENTS PROVEN: ⚠️289 (commercial_space rep.), ⚠️290 (commercial_space rep.)

VISUAL REQUIREMENTS PROVEN: (none new)

EXPECTED RESULT: all 5 commercial_space fields present and correct; no residential fields leak in.

FAIL CONDITION: a residential-only field appears; a commercial_space field is missing.

---

## FLOW L — RENTAS PRIVADO LAND_PARCEL

ROUTE: same application, Tipo de renta: Terreno/Lote.

STARTING STATE: fresh listing.

INTERACTIONS: fill the land_parcel fields (permitted use, available utilities, access, zoning) → Preview → Back to Edit → refresh → Preview again (this is the 5th and last of the flow-group roundtrips, so do the full cycle here even though it was abbreviated in I/J/K).

SCREENSHOTS TO SEND:
- **S24** — Preview page after the full roundtrip for this last pathway.

RUNTIME REQUIREMENTS PROVEN: ⚠️289 (land_parcel rep. — closes out all 5), ⚠️290 (land_parcel rep. — closes out all 5)

VISUAL REQUIREMENTS PROVEN: (none new)

EXPECTED RESULT: all 4 land_parcel fields present and correct; values survive the full roundtrip.

FAIL CONDITION: a field missing or values changed after the roundtrip.

---

## FLOW M — RENTAS NEGOCIO

ROUTE: `/clasificados/publicar/rentas/negocio?lang=es`

STARTING STATE: fresh Rentas Negocio listing (any one representative rental type is enough — this flow is about the professional/business layer, not re-proving all 5 pathways again).

INPUTS TO ENTER:
- Negocio identity fields (business name, brand, logo, license, phone/email/WhatsApp/website/socials/bio)
- Contact: Call/SMS/WhatsApp/Email using the same 4 distinct QA values
- Upload 3+ photos

INTERACTIONS:
1. Fill identity + contact fields → Save.
2. **Refresh the browser mid-flow** → confirm identity fields are still there → continue to Preview.
3. Click Call/SMS/WhatsApp/Email → confirm each opens the canonical action sheet with the correct distinct value (this is the migration made this session — verify it's a modal, not a raw link).
4. Upload photos → set a non-first photo as portada → confirm it is NOT still hardcoded to photo #1 → remove one photo → confirm count updates.
5. Back to Edit → confirm identity + everything survives.

SCREENSHOTS TO SEND:
- **S25** — Preview page after the refresh-mid-flow step, showing identity fields intact.
- **S26** — one contact action opened (e.g. Email), showing the action-sheet modal with the correct QA email.
- **S27** — the photo strip after setting a non-first portada, showing the portada badge is NOT on photo #1.
- **S28** — the full Rentas Negocio business-identity/contact block on Preview, for a richness-vs-Privado visual comparison (compare against Flow H's S19).

RUNTIME REQUIREMENTS PROVEN: ⚠️229, ⚠️300, ⚠️306

VISUAL REQUIREMENTS PROVEN: ⚠️293

EXPECTED RESULT: identity survives a mid-flow refresh and the full edit lifecycle; contact actions open the canonical modal with correct values; portada is genuinely settable to any photo, not stuck on #1; business layer looks richer than Rentas Privado's owner card without overwhelming the listing.

FAIL CONDITION: identity fields blank after refresh; a contact button navigates directly instead of opening the modal, or shows the wrong value; portada stays on photo #1 regardless of selection; business block looks sparse (same as Privado) or overwhelms the page.

---

## FLOW N — PUBLIC RESULTS / FILTERS

ROUTE: `/clasificados/bienes-raices/resultados?lang=es` and `/clasificados/rentas?lang=es`

STARTING STATE: none needed — public pages, no login required.

**BR filters (⚠️150) are already proven — do not redo them.** Only re-test BR filters later if a
future code change touches `BienesRaicesResultsFilters.tsx`, `brResultsFilters.ts`, or
`brResultsUrlState.ts`.

INTERACTIONS (Rentas filters only):
1. Open Rentas results → apply the "kind"/property-type filter → confirm the URL updates.
2. Apply rentalTypeCode, city, price, beds/baths filters where visible → confirm URL updates for each.
3. Reload the page with filters in the URL → confirm they're still applied.
4. Clear/reset → confirm the URL returns to unfiltered and results return to the full set.
5. Confirm no visible filter control does nothing when changed (if one appears interactive but has no effect, that's a fail).
6. If fewer than 2 genuinely different listings exist to show a result-set change, note that specific check as DATA-INSUFFICIENT rather than failing it — the URL/reload/clear behavior can still be proven regardless of inventory depth.

SCREENSHOTS TO SEND:
- **S29** — Rentas results page with 2+ filters applied, URL bar visible showing the query params, result count visible.
- **S30** — BR results grid + Rentas results grid, each showing 2-3 cards, for the visual card-compactness/real-image comparison (⚠️41/42/45/142/256/259).

RUNTIME REQUIREMENTS PROVEN: ⚠️286, ⚠️287

VISUAL REQUIREMENTS PROVEN: ⚠️41, ⚠️42, ⚠️45, ⚠️142, ⚠️256, ⚠️259, ⚠️288 (resize this page to 375 as part of Flow P's sweep)

EXPECTED RESULT: every Rentas filter updates the URL, persists on reload, and clears correctly; result cards are compact, real-image, no oversized placeholders.

FAIL CONDITION: a filter control changes visually but the URL/result set doesn't update; reload loses the filter; Clear doesn't fully reset; a result card looks stretched, uses a placeholder image when a real photo exists, or dumps every form field as a chip instead of the curated 3.

---

## FLOW O — PUBLIC DETAIL / CONTACT / MEDIA

ROUTE: open any published BR listing and any published Rentas listing from the results grids in Flow N (click through to their public detail pages).

STARTING STATE: at least one published listing per category from the earlier flows.

INTERACTIONS:
1. Open the photo gallery lightbox on the public BR page and the public Rentas page → zoom, swipe/arrow, thumbnail, Escape, close — same checks as Flow E, now on the live/public surface for both categories.
2. Add/paste an external video URL, a virtual tour URL, and a brochure URL (wherever the lane supports them) one at a time → confirm each shows a validity-gated "Video añadido" / "added" confirmation only once the URL is actually valid, not just present → add a second video → remove one → open the video/tour/brochure link from Preview or public detail to confirm the viewer works.
3. On a live Rentas listing where the "mostrar dirección exacta" toggle is OFF and only a cross-street/neighborhood is on file, confirm the map centers using a city-qualified location, not a bare unqualified cross-street.
4. Scroll the public BR detail page and note overall hierarchy/premium feel (compare Negocio vs Privado).

SCREENSHOTS TO SEND:
- **S31** — public BR gallery lightbox open, zoomed.
- **S32** — public Rentas gallery lightbox open, zoomed.
- **S33** — the video/tour/brochure section showing 2 added items and the "added" confirmation state, on whichever lane you tested.
- **S34** — a live Rentas listing's map preview in the exact-address-off, cross-street-only state described above.

RUNTIME REQUIREMENTS PROVEN: ⚠️24, ⚠️25, ⚠️28, ⚠️29, ⚠️70, ⚠️114, ⚠️115, ⚠️184, ⚠️318

VISUAL REQUIREMENTS PROVEN: ⚠️47, ⚠️132 (if not already fully covered in Flow E — confirm on public BR Negocio too), ⚠️137 (same, BR Negocio's own Open House card — visual parity check only, since Negocio's Open House itself is already 🟢)

EXPECTED RESULT: lightbox zoom/swipe/keyboard/Escape all work on both public pages; video/tour/brochure additions are validity-gated with a clear confirmation state, support adding a second and removing one; map centers correctly on the qualifying live listing; public BR pages feel premium and property-first.

FAIL CONDITION: lightbox controls don't respond on the public page even though they worked in the owner's own preview; a clearly invalid URL still shows an "added" confirmation, or a clearly valid one doesn't; map centers on a generic/wrong location; the page feels like a raw form dump rather than a finished listing.

---

## FLOW P — RESPONSIVE FINAL VISUAL PASS

ROUTE: revisit 3-4 of the richest screens already used above: BR Negocio Preview (Flow A), BR Privado Preview (Flow E), a Rentas public detail page (Flow O), and the BR/Rentas results grids (Flow N).

STARTING STATE: none needed beyond what already exists from the earlier flows.

INTERACTIONS: resize your browser window (or use your device toolbar) to each of 375 / 768 / 1024 / 1440 pixels wide on those 3-4 screens only — not every screen from every flow.

SCREENSHOTS TO SEND:
- **S35** — a 2×2 or side-by-side composite (or 4 separate screenshots) of ONE representative screen (recommend the BR Privado Preview from Flow E, since it has the most components: gallery, facts grid, highlights, Open House, contact rail) at all 4 widths.
- *(Optional, only if you have time)* one more pass at 375 and 1440 on the Rentas public detail page from Flow O, since it has a different two-column desktop layout to verify.

RUNTIME REQUIREMENTS PROVEN: (none — this flow is purely visual)

VISUAL REQUIREMENTS PROVEN: ⚠️58, ⚠️59, ⚠️60 (check ES/EN both while here — switch language and confirm no mixed-language strings), ⚠️221, ⚠️288 (closes out), ⚠️319

EXPECTED RESULT: no horizontal scroll, no overlapping text, no cut-off content at any of the 4 widths on any of the checked screens; ES and EN both read naturally with no mixed-language leftovers; sparse/minimal listings (from Flow G's second pass) stay visibly smaller/cleaner than fully-filled ones at every width.

FAIL CONDITION: any component breaks/overlaps/overflows at any of the 4 widths; a Spanish label appears next to an English value or vice versa; a sparse listing still shows large empty gaps at any width.

---

## STATUS TRACKING — ALL 94 ITEMS

Legend: ⬜ NOT TESTED · ✅ PASS · ❌ FAIL · 🟣 ENVIRONMENT BLOCKED · 🟤 DATA INSUFFICIENT

### 🟠 RUNTIME (63 total — 2 already proven, preserved below; 61 remaining)

| ⚠️ | Flow | Status |
|---|---|---|
| 4 | A | ⬜ NOT TESTED |
| 5 | A | ⬜ NOT TESTED |
| 7 | A | ⬜ NOT TESTED |
| 8 | A | ⬜ NOT TESTED |
| 17 | M | ⬜ NOT TESTED |
| 18 | A | ⬜ NOT TESTED |
| 19 | A | ⬜ NOT TESTED |
| 20 | A | ⬜ NOT TESTED |
| 21 | A | ⬜ NOT TESTED |
| 22 | A | ⬜ NOT TESTED |
| 24 | O | ⬜ NOT TESTED |
| 25 | O | ⬜ NOT TESTED |
| 28 | O | ⬜ NOT TESTED |
| 29 | O | ⬜ NOT TESTED |
| 39 | (all flows, cumulative) | ⬜ NOT TESTED |
| 40 | (all flows, cumulative) | ⬜ NOT TESTED |
| 43 | A | ⬜ NOT TESTED |
| 44 | A | ⬜ NOT TESTED |
| 50 | (checkout — see note below) | ⬜ NOT TESTED |
| 53 | (see note below) | ⬜ NOT TESTED |
| 54 | A | ⬜ NOT TESTED |
| 55 | A | ⬜ NOT TESTED |
| 57 | D | ⬜ NOT TESTED |
| 66 | G | ⬜ NOT TESTED |
| 70 | O | ⬜ NOT TESTED |
| 85 | B | ⬜ NOT TESTED |
| 86 | B | ⬜ NOT TESTED |
| 87 | B | ⬜ NOT TESTED |
| 91 | C | ⬜ NOT TESTED |
| 92 | C | ⬜ NOT TESTED |
| 107 | A | ⬜ NOT TESTED |
| 109 | A | ⬜ NOT TESTED |
| 114 | O | ⬜ NOT TESTED |
| 115 | O | ⬜ NOT TESTED |
| 117 | A | ⬜ NOT TESTED |
| 124 | D | ⬜ NOT TESTED |
| 126 | D | ⬜ NOT TESTED |
| 127 | D | ⬜ NOT TESTED |
| 150 | N | ✅ PASS (already proven — see `.claude/BR_RENTAS_OWNER_RUNTIME_QA.md`) |
| 153 | N | ✅ PASS (already proven — production build fix confirmed) |
| 161 | E | ⬜ NOT TESTED |
| 184 | O | ⬜ NOT TESTED |
| 188 | E | ⬜ NOT TESTED |
| 206 | E | ⬜ NOT TESTED |
| 215 | E | ⬜ NOT TESTED |
| 216 | E | ⬜ NOT TESTED |
| 229 | M | ⬜ NOT TESTED |
| 237 | J | ⬜ NOT TESTED |
| 245 | H | ⬜ NOT TESTED |
| 251 | H | ⬜ NOT TESTED |
| 252 | H | ⬜ NOT TESTED |
| 264 | H | ⬜ NOT TESTED |
| 286 | N | ⬜ NOT TESTED |
| 287 | N | ⬜ NOT TESTED |
| 289 | H/I/J/K/L | ⬜ NOT TESTED |
| 290 | H/I/J/K/L | ⬜ NOT TESTED |
| 295 | M | ⬜ NOT TESTED |
| 300 | M | ⬜ NOT TESTED |
| 306 | M | ⬜ NOT TESTED |
| 310 | H | ⬜ NOT TESTED |
| 312 | H | ⬜ NOT TESTED |
| 317 | H | ⬜ NOT TESTED |
| 318 | O | ⬜ NOT TESTED |

**Notes on 2 items not cleanly owned by one flow:**
- **⚠️50** (checkout summary completeness) — not assigned its own flow since checkout is already
  structurally separate from the ad-canvas in every lane (proven at the source level). Quick check:
  on any flow's Preview page, scroll to checkout and confirm product/price/duration/total/payment
  CTA are all present — no dedicated screenshot required, fold into whichever flow's Preview you
  scroll past first.
- **⚠️53** (leave-warning suppressed on expected preview navigation) — check once, in Flow A: click
  "Continuar a vista previa" from the application and confirm NO "leave this page?" browser warning
  fires; then try navigating away unexpectedly (e.g. typing a new URL) and confirm the warning DOES
  fire there. No dedicated screenshot required — this is a "did a popup appear or not" check.

### 🟡 VISUAL (33 total)

| ⚠️ | Flow | Status |
|---|---|---|
| 2 | A/E | ⬜ NOT TESTED |
| 15 | A | ⬜ NOT TESTED |
| 16 | A | ⬜ NOT TESTED |
| 37 | A | ⬜ NOT TESTED |
| 41 | N | ⬜ NOT TESTED |
| 42 | N | ⬜ NOT TESTED |
| 45 | N | ⬜ NOT TESTED |
| 47 | O | ⬜ NOT TESTED |
| 58 | P | ⬜ NOT TESTED |
| 59 | P | ⬜ NOT TESTED |
| 60 | P | ⬜ NOT TESTED |
| 81 | A | ⬜ NOT TESTED |
| 132 | E/O | ⬜ NOT TESTED |
| 137 | E/O | ⬜ NOT TESTED |
| 141 | A | ⬜ NOT TESTED |
| 142 | N | ⬜ NOT TESTED |
| 154 | A | ⬜ NOT TESTED |
| 160 | G | ⬜ NOT TESTED |
| 187 | E | ⬜ NOT TESTED |
| 190 | E | ⬜ NOT TESTED |
| 191 | E | ⬜ NOT TESTED |
| 199 | E | ⬜ NOT TESTED |
| 200 | E | ⬜ NOT TESTED |
| 210 | E | ⬜ NOT TESTED |
| 217 | F/G | ⬜ NOT TESTED |
| 221 | P | ⬜ NOT TESTED |
| 256 | N | ⬜ NOT TESTED |
| 259 | N | ⬜ NOT TESTED |
| 280 | H | ⬜ NOT TESTED |
| 288 | N/P | ⬜ NOT TESTED |
| 293 | M | ⬜ NOT TESTED |
| 309 | H (compare against M's S28) | ⬜ NOT TESTED |
| 319 | P | ⬜ NOT TESTED |

---

## SUMMARY

TOTAL FLOWS: 16 (A–P)
TOTAL SCREENSHOT MOMENTS: 35 (S1–S35, plus 1 optional in Flow P)
RUNTIME ITEMS COVERED: all 61 remaining (+ 2 already proven, preserved, not re-tested)
VISUAL ITEMS COVERED: all 33
