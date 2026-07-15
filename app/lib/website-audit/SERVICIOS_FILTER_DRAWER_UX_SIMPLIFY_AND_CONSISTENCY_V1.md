# SERVICIOS-FILTER-DRAWER-UX-SIMPLIFY-AND-CONSISTENCY-V1

**Classification:** MICRO PATCH — Servicios drawer UX only  
**Date:** 2026-07-15  
**Scope:** Filter drawer labels, grouping, and control types. No filter logic, URL keys, search, or card/landing redesign.

## Executive summary

Servicios landing and results share one drawer component (`ServiciosResultsAdvancedFilterFields`). Browser QA showed ~30 boolean filters rendered as tiny “Any / Cualquiera” dropdowns plus an internal “Publish-application signals” section. This patch regroups filters into seven public sections, converts booleans to compact checkbox toggles, hides internal/duplicate controls, and aligns active chip labels with public wording. URL keys and `serviciosResultsFilter.ts` semantics are unchanged.

## Files inspected

- `app/(site)/clasificados/servicios/landing/ServiciosLandingSearchPanel.tsx`
- `app/(site)/clasificados/servicios/ServiciosResultsFilters.tsx`
- `app/(site)/clasificados/servicios/resultados/ServiciosResultsAdvancedFilterFields.tsx`
- `app/(site)/clasificados/servicios/ServiciosResultsActiveSummary.tsx`
- `app/(site)/clasificados/servicios/lib/serviciosBrowseParams.ts`
- `app/(site)/clasificados/servicios/lib/serviciosResultsFilter.ts` (read-only; no edits)
- `app/lib/website-audit/SERVICIOS_LANDING_RESULTS_APPLICATION_FIELD_SEARCH_DRAWER_PARITY_V1.md`

## Files changed

- `app/(site)/clasificados/servicios/resultados/ServiciosResultsAdvancedFilterFields.tsx` — drawer UX refactor
- `app/(site)/clasificados/servicios/ServiciosResultsActiveSummary.tsx` — chip label alignment
- `app/lib/website-audit/SERVICIOS_FILTER_DRAWER_UX_SIMPLIFY_AND_CONSISTENCY_V1.md` — this audit

## Unrelated dirty files ignored

- `app/(site)/clasificados/autos/**` (multiple modified/untracked)
- `package.json`
- `.next/**` build artifacts

## Current drawer problems found

1. Boolean filters used `<select>` with “Any / Cualquiera” — felt like a database dump.
2. Duplicate controls: `emergency` (Availability + Trust), `mobileSvc` (Location + Trust), `wknd` (Availability + Publish).
3. Internal section “Datos del formulario de publicación / Publish-application signals” exposed publication metadata.
4. Overlapping offer filters: `has_offers`, `promo`, `offer`.
5. Category split into its own section separate from service type.
6. Trust section mixed contact, media, and language fields.

## Field map (keep / convert / hide)

| Label (ES/EN) | URL key | Before | After | Notes |
|---------------|---------|--------|-------|-------|
| Ciudad / City | `city` | text | text | keep |
| Estado / State | `state` | select/text | select/text | keep |
| ZIP | `zip` | text | text | keep |
| País / Country | `country` | text | text | keep |
| Servicio a domicilio | `mobileSvc` | select | checkbox | Location |
| Atiende varias zonas | `svcMulti` | select (publish) | checkbox | renamed, moved to Location |
| Tipo de proveedor | `seller` | select | select | Service type |
| Categoría | `group` | select | select | merged into Service type |
| Mismo día | `same_day` | select | checkbox | Availability |
| Con cita | `appointment` | select | checkbox | Availability |
| Emergencia | `emergency` | select ×2 | checkbox ×1 | duplicate removed |
| Fin de semana | `wknd` | select ×2 | checkbox ×1 | duplicate removed |
| Abierto ahora | `open_now` | select | checkbox | Availability |
| Verificado Leonix | `verified` | select | checkbox | Trust |
| Licenciado | `licensed` | select | checkbox | Trust |
| Asegurado | `insured` | select | checkbox | Trust |
| Cotización gratis | `free_estimate` | select | checkbox | Trust |
| Consulta gratis | `free_consultation` | select | checkbox | Trust |
| Teléfono | `call` | select | checkbox | Contact |
| WhatsApp | `whatsapp` | select | checkbox | Contact |
| Correo | `email` | select | checkbox | Contact (moved from Trust) |
| Sitio web | `web` | select | checkbox | Contact (moved from Trust) |
| Mensajes en app | `msg` | select | checkbox | Contact (moved from publish) |
| Dirección física | `phys` | select | checkbox | Contact (moved from publish) |
| Español / English / Otro | `langEs`/`langEn`/`langOt` | select | checkbox | Languages |
| Bilingüe | `bilingual` | select | checkbox | Languages (moved from Trust) |
| Tiene fotos/videos/ofertas | `has_photos`/`has_videos`/`has_offers` | select | checkbox | Media |
| Oferta / promo | `promo` | select | hidden | duplicate of has_offers |
| Titular de oferta | `offer` | select | hidden | confusing duplicate |
| Confirmaciones legales | `legal` | select | hidden | internal |
| Interés verificación | `vint` | select | hidden | internal |

## Drawer groups (after)

1. **Ubicación / Location** — city, state, zip, country + toggles mobileSvc, svcMulti  
2. **Tipo de servicio / Service type** — seller, group  
3. **Disponibilidad / Availability** — same_day, appointment, emergency, wknd, open_now  
4. **Confianza / Trust** — verified, licensed, insured, free_estimate, free_consultation  
5. **Contacto / Contact** — call, whatsapp, email, web, msg, phys  
6. **Idiomas / Languages** — langEs, langEn, langOt, bilingual  
7. **Medios y visibilidad / Media & visibility** — has_photos, has_videos, has_offers  

## URL / filter behavior preservation

- Checkbox checked → `name=1` in FormData (same as prior `select` value `1`).
- Checkbox unchecked → param omitted; `parseServiciosFilterFormData` / `flagFromForm` unchanged.
- Hidden drawer fields (`promo`, `offer`, `legal`, `vint`) still filter if present in URL; chips still render for legacy links.
- `serviciosResultsFilter.ts` not modified.

## Landing / results parity

Both `ServiciosLandingSearchPanel` and `ServiciosResultsFilters` import the same `ServiciosResultsAdvancedFilterFields` — one change covers both drawers.

## Mobile notes (code review @ ~390px)

- Toggle rows: `min-h-[2.5rem]`, full-width labels, 2-column grid from `sm` breakpoint.
- Location selects/inputs retain `min-h-[2.75rem]` touch targets.
- Section shells use vertical `space-y-4`; no horizontal overflow from grid.
- Apply/Clear remain in parent drawer shells (unchanged).

## TRUE/FALSE final audit

| Check | Result |
|-------|--------|
| Servicios only touched | TRUE |
| Drawer simplified | TRUE |
| Boolean filters converted from Any dropdowns | TRUE |
| Internal/publication labels hidden | TRUE |
| Duplicate offer/emergency filters resolved | TRUE |
| Location controls preserved | TRUE |
| Category/provider controls preserved | TRUE |
| Apply works | TRUE (unchanged parent shells) |
| Clear works | TRUE (unchanged parent shells) |
| Active chips preserved | TRUE |
| URL keys preserved | TRUE |
| Search behavior unchanged | TRUE |
| Results filtering unchanged | TRUE |
| No fake filters added | TRUE |
| No landing redesign | TRUE |
| No result card redesign | TRUE |
| Other categories untouched | TRUE |
| Ofertas untouched | TRUE |
| Viajes untouched | TRUE |
| Admin/dashboard/auth/Supabase/Stripe untouched | TRUE |
| Build passed | TRUE |
