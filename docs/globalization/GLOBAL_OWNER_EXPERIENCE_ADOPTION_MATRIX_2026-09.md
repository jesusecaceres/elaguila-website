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

## Remaining waves (not yet started)

Wave 2 — G13/G14/G15/G16/G17/G18/G20/G21/G24 across Restaurantes/Comida Local/Bienes Negocio/
Rentas Negocio/Autos Dealer.
Wave 3 — G09-G12, G25-G30 (public experience globals).
Wave 4 — Dashboard/edit round-trip, all categories.
Wave 5 — Admin OS.
Wave 6 — Revenue/commercial (coordinate with the active parallel term-engine work).
Wave 7 — Special category systems (G40-G46).
Wave 8 — Platform finish (G49-G53).
