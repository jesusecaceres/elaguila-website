# Global Owner Experience Adoption Matrix (2026-09)

Master owner-visible truth ledger for the Globalization Master Integration Continuation. Filled
in wave-by-wave, not all at once — see `docs/globalization/FINAL_GLOBALIZATION_TRUE_FALSE_CLOSEOUT_2026-09-08.md`
for narrative detail behind each row. Cells not yet filled by a completed wave are left blank
(not guessed) rather than defaulted to any status.

Columns: SYSTEM · CATEGORY · LANDING · CHECKPOINT · APPLICATION · PREVIEW · CHECKOUT · PUBLIC ·
RESULTS · BUSINESS HUB · DASHBOARD · ACTIVE EDIT · ADMIN · ANALYTICS · MOBILE · SOURCE · RUNTIME ·
FINAL

Allowed values: TRUE · FALSE · N/A · OWNER_QA_REQUIRED · BLOCKED_EXTERNAL ·
BLOCKED_OWNER_POLICY · ACTIVE_PARALLEL_BUILD · PROTECTED_HANDOFF

## Wave 1 — G23 Street Address Verifier (2026-09-09)

Prior gate proved the shared engine (`app/components/forms/BusinessAddressVerifiedInput.tsx` +
`app/lib/businessAddress/businessAddressContract.ts` + `/api/business-address/suggest`) was fully
built but mounted nowhere. This wave mounted it in 5 additional categories, reusing Servicios as
the reference adapter.

| SYSTEM | CATEGORY | APPLICATION | DRAFT | PREVIEW | PUBLISH | DATABASE | PUBLIC | DASHBOARD EDIT | ADMIN | SOURCE | RUNTIME | FINAL |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| G23 | Servicios | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | N/A | TRUE | OWNER_QA_REQUIRED (provider key presence in Preview unconfirmed) | TRUE |
| G23 | Restaurantes | TRUE | TRUE | not re-verified this wave | TRUE (payload allowlist fixed) | TRUE (whole draft dumped to `listing_json`) | not re-verified this wave | TRUE (spread-safe reverse mapper) | not applicable (no dedicated address admin view found) | TRUE | OWNER_QA_REQUIRED | TRUE (source) |
| G23 | Comida Local | TRUE | TRUE (autosave trap fixed) | not re-verified this wave | TRUE (publish-normalize trap fixed) | TRUE (`listing_json`) | not re-verified this wave | TRUE (same fixed function) | not applicable | TRUE | OWNER_QA_REQUIRED | TRUE (source) |
| G23 | Autos Dealer | TRUE | TRUE (spread-safe) | not re-verified this wave | TRUE | TRUE (`listing_payload`) | not re-verified this wave | TRUE (whole-object round-trip) | not applicable | TRUE | OWNER_QA_REQUIRED | TRUE (source) |
| G23 | Bienes Negocio | TRUE | TRUE (state->draft mapper fixed) | not re-verified this wave | TRUE (`business_meta` serializer extended) | TRUE (shared `public.listings.business_meta`) | not re-verified this wave | **FALSE — pre-existing, NOT fixed this wave**: `bienesPublishedRowToAgenteApplicationDraft.ts` does not restore `direccionLinea1`/`direccionLinea2`/`direccionEstado`/`direccionCodigoPostal`/`direccionPais`/`mostrarDireccionExacta` at all today — a pre-existing G47-class defect found as a side effect of this investigation, out of G23's own scope | not applicable | TRUE (forward path only) | OWNER_QA_REQUIRED | **FALSE for dashboard-edit round-trip; TRUE for everything else** |
| G23 | Rentas Negocio | TRUE | TRUE (3 chained allowlist functions fixed) | not re-verified this wave | TRUE (reuses the Bienes `business_meta` serializer) | TRUE (shared `public.listings.business_meta`) | not re-verified this wave | not re-verified this wave (Rentas has its own separate reverse mapper, `rentasDashboardEditHydration.ts`, which per the mapping investigation already does not restore several address fields either — same class of pre-existing gap suspected, not confirmed this wave) | not applicable | TRUE (forward path only) | OWNER_QA_REQUIRED | TRUE (forward path; edit round-trip unconfirmed) |
| G23 | Rentas Privado | TRUE (shares the mounted component with Negocio) | TRUE | not re-verified this wave | not re-verified this wave | not re-verified this wave | not re-verified this wave | not re-verified this wave | N/A | TRUE (forward path) | OWNER_QA_REQUIRED | TRUE (forward path only) |

**Cells intentionally left blank ("not re-verified this wave"):** PREVIEW/DATABASE-read/DASHBOARD
columns for Restaurantes, Comida Local, and Autos Dealer were not individually re-traced with
runtime evidence this wave (only source-level proof + the existing regression suite) — the
`SOURCE: TRUE` rating reflects a real, evidence-based code trace of the write path and reverse
mapper for each (see commit `3c23e875`), but a full end-to-end owner click-through has not
happened for any of these 5 categories yet, matching Servicios' own `RUNTIME: OWNER_QA_REQUIRED`
status.

**Real defect found this wave, not fixed (separate scope):** Bienes Negocio's dashboard-edit
reverse mapper was already missing several address fields before this wave touched anything —
flagged for a dedicated G47 follow-up, not silently left unlabeled.

## Wave 2 — Owner-critical business globals (2026-09-09)

5 parallel research agents (one per category) traced G13/G14/G15/G16/G17/G18/G20/G21/G24 across
Restaurantes, Comida Local, Bienes Negocio, Rentas Negocio, Autos Dealer. Most systems confirmed
FULLY WIRED with no defect. 6 real, safely-fixable defects found and fixed (commit `652e2556`).

| SYSTEM | CATEGORY | SOURCE | FINAL |
|---|---|---|---|
| G13 Languages | Restaurantes | TRUE (fully wired, no defect) | TRUE |
| G13 Languages | Comida Local | TRUE (fully wired, no defect) | TRUE |
| G13 Languages | Bienes Negocio | PARTIALLY WIRED — publish→render solid; dashboard-edit reverse mapper drops it (part of the Wave 4 carry-forward) | FALSE (deferred to Wave 4) |
| G13 Languages | Rentas Negocio | **FIXED this wave** — was write-only (persisted, never read back or rendered) | TRUE |
| G13 Languages | Autos Dealer | TRUE (fully wired, no defect) | TRUE |
| G14 Hours/Open Now | Restaurantes | **FIXED this wave** — live detail page used server-local (non-timezone-aware) clock instead of the timezone-pinned computation already proven correct for the same category's discovery-card badge | TRUE |
| G14 Hours/Open Now | Comida Local | TRUE (confirmed real reference implementation, unchanged) | TRUE |
| G14 Hours/Open Now | Bienes Negocio | N/A — no hours/office-hours concept exists for agente-individual by design | N/A |
| G14 Hours/Open Now | Rentas Negocio | N/A — no hours/office-hours concept exists by design | N/A |
| G14 Hours/Open Now | Autos Dealer | PARTIALLY WIRED — hours render correctly; no real time-computed Open/Closed status exists (static "today's hours" line only) | FALSE (not fixed this wave — larger build than the Restaurantes fix, no existing timezone-safe pattern in this category to reuse) |
| G15 Websites/Social | Restaurantes | TRUE (fully wired, no defect) | TRUE |
| G15 Websites/Social | Comida Local | TRUE (fully wired; premise correction — real dedicated social fields exist, contrary to an earlier assumption) | TRUE |
| G15 Websites/Social | Bienes Negocio | PARTIALLY WIRED — publish→render solid; dashboard-edit reverse mapper drops most social/website fields (Wave 4 carry-forward) | FALSE (deferred to Wave 4) |
| G15 Websites/Social | Rentas Negocio | PARTIALLY WIRED — publish→render solid via detail_pairs; dashboard-edit reverse mapper drops website/social (Wave 4 carry-forward) | FALSE (deferred to Wave 4) |
| G15 Websites/Social | Autos Dealer | TRUE (fully wired, no defect) | TRUE |
| G16 Connection Hub | all 5 categories | TRUE — all fully wired, null-safe, WhatsApp confirmed international-safe in every category (bespoke per-category CTA architecture is functionally correct even where not using the shared CtaActionSheet) | TRUE |
| G17 Rich Correo | Restaurantes | PARTIALLY WIRED — real composer; no lead-capture/inquiry persistence exists for this category (product gap, not a broken wire) | FALSE (not fixed — requires new lead-capture infrastructure, out of "smallest adapter" scope) |
| G17 Rich Correo | Comida Local | PARTIALLY WIRED — real composer; no owner-visible lead surface (analytics-only) | FALSE (not fixed — same reason) |
| G17 Rich Correo | Bienes Negocio | NOT MOUNTED — plain mailto only, no composer, no lead capture, no owner-visible leads | FALSE (not fixed — larger build) |
| G17 Rich Correo | Rentas Negocio | TRUE (fully wired, no defect — real composer, real authenticated API, real `messages` table, real owner dashboard inbox) | TRUE |
| G17 Rich Correo | Autos Dealer | **PARTIALLY FIXED this wave** — dealerEmail form input added (was structurally missing, making the correct render/mapper code unreachable); no lead-capture system exists (separate, larger gap, not fixed) | FALSE (composer/lead-capture still absent; the specific "unreachable field" defect is now fixed) |
| G18 Translate Ad | all 5 categories | TRUE — all fully wired, no defect | TRUE |
| G20 Community Trust | Restaurantes | PARTIALLY WIRED — widget + owner dashboard view both real and live; unreachable for any non-`published` listing status (same pattern as Servicios, likely intentional); no admin moderation UI (platform-wide gap, not category-specific) | TRUE (core adoption); OWNER_QA_REQUIRED (status-gate runtime) |
| G20 Community Trust | Comida Local | PARTIALLY WIRED — widget live; same status-gate issue; no owner-dashboard view for this category (present for Servicios/Restaurantes, absent here); no admin moderation UI | TRUE (core adoption); real adoption gap (owner dashboard) noted, not fixed |
| G20 Community Trust | Bienes Negocio | PARTIALLY WIRED — widget live via real `leonix_professional_identities` eligibility mechanism, auto-created on first view (not gated by payment status, unlike Servicios); no owner-dashboard view; no admin moderation UI | TRUE (core adoption) |
| G20 Community Trust | Rentas Negocio | PARTIALLY WIRED — widget live, confirmed undisturbed by Wave 1's G23 changes to the same file; same professional-identity mechanism; no owner-dashboard view; no admin moderation UI | TRUE (core adoption) |
| G20 Community Trust | Autos Dealer | **CONFIRMED NOT MOUNTED** — genuine, real gap (previously flagged, re-confirmed on current HEAD); not fixed this wave (requires an eligibility-mechanism design decision — does Autos Dealer use the listing id directly like Servicios, or a professional-identity anchor like BR/Rentas?) | FALSE (real, not fixed — recommend as a dedicated follow-up with an explicit eligibility-mechanism decision) |
| G21 Google/Yelp | Restaurantes | TRUE (fully wired, no defect) | TRUE |
| G21 Google/Yelp | Comida Local | **CRITICAL DEFECT FIXED this wave** — was unconditionally wiped on every publish by the same allowlist trap function already known-dangerous from Wave 1's G23 work; every Comida Local listing's Google/Yelp URLs were silently discarded before reaching the database | TRUE |
| G21 Google/Yelp | Bienes Negocio | **FIXED Wave 4 P0** — dashboard-edit reverse mapper now calls the shared `parseBienesAgenteResidencialPublishedState()` parser (same one the public page uses), restoring both URLs on every edit | TRUE |
| G21 Google/Yelp | Rentas Negocio | **FIXED Wave 4 P0** — dashboard-edit hydration now reads `negocioGoogleReviewsUrl`/`negocioYelpReviewsUrl` back from business_meta using the same key schema the shared BR Negocio serializer writes | TRUE |
| G21 Google/Yelp | Autos Dealer | TRUE (re-verified fully wired, no defect) | TRUE |
| G24 Location/Privacy/Directions | Restaurantes | **FIXED this wave** — `showExactAddress` had zero UI control anywhere (permanently defaulted to showing exact address, no owner opt-out); downstream privacy plumbing was already real and correct, just unreachable | TRUE |
| G24 Location/Privacy/Directions | Comida Local | TRUE (fully wired, no regression from Wave 1's G23 address-picker mount) | TRUE |
| G24 Location/Privacy/Directions | Bienes Negocio | **FIXED Wave 4 P0** — dashboard-edit reverse mapper now restores the address block (verification status, exact-address toggle) via the shared public-page parser | TRUE |
| G24 Location/Privacy/Directions | Rentas Negocio | **FIXED Wave 4 P0** — dashboard-edit hydration now restores direccionLinea1/mostrarDireccionExacta/zonaVecindario via the same detail_pairs primitives already proven correct on the public page | TRUE |
| G24 Location/Privacy/Directions | Autos Dealer | N/A (correct, not a gap) — dealership addresses are inherently public business info; no privacy toggle needed or missing | N/A |

**Real defects found, fixed this wave:** Comida Local G21 (critical), Bienes Negocio G16
(agenteWhatsapp), Restaurantes G24 (privacy toggle UI), Rentas Negocio G13 (idiomas write-only),
Restaurantes G14 (timezone-unsafe hours), Autos Dealer G17 (dealerEmail unreachable field).

**Real defects found, explicitly NOT fixed this wave (reason given per item, not silently
dropped):**
- Autos Dealer G20 — Community Trust never adopted; needs an eligibility-mechanism decision first.
- Autos Dealer G14 — no real Open/Closed computation; no existing timezone-safe pattern in this
  category to reuse (larger build than the Restaurantes fix).
- Restaurantes/Comida Local/Bienes Negocio G17 — no lead-capture infrastructure exists; would
  require a new DB table + API route + dashboard UI (larger build, not a "smallest adapter" fix).

**Wave 4 P0 (2026-09-09) — Bienes Negocio & Rentas Negocio dashboard-edit reverse mappers: FIXED.**
Both G13/G15/G21/G24 dashboard-edit-reverse-mapper cells above are now TRUE. Bienes Negocio's
reverse mapper now calls the same shared parser the public page uses
(`parseBienesAgenteResidencialPublishedState`); Rentas Negocio's hydration now reads every
business-identity/address/structured-property/flow-extension field back using the same
detail_pairs/business_meta primitives already proven correct on its own public page. Full detail
in ledger section 25. NOT YET DONE: owner browser QA (published row → edit → preview → republish →
same row → zero field loss, end-to-end in a real browser) for either fix — source-level proof
only so far.

## Remaining waves

Wave 2 — G13/G14/G15/G16/G17/G18/G20/G21/G24 across Restaurantes/Comida Local/Bienes Negocio/
Rentas Negocio/Autos Dealer. DONE (see above).
Wave 3 — G09-G12, G25-G30 (public experience globals). NOT STARTED.
Wave 4 — Dashboard/edit round-trip. P0 items (Bienes Negocio + Rentas Negocio reverse mappers)
DONE (2026-09-09, see above); remaining categories' dashboard/edit round-trip not yet audited.
Wave 5 — Admin OS + G22 moderation UI. NOT STARTED.
Wave 6 — Revenue/commercial (coordinate with the active parallel term-engine work). NOT STARTED.
Wave 7 — Special category systems (G40-G46). NOT STARTED.
Wave 8 — Platform finish (G49 Newsletter, G50 SEO, G51 Accessibility, G52 PWA, G53 Security/RLS).
NOT STARTED.
Final Reconciliation + mandatory Owner QA Playbook. NOT STARTED.
