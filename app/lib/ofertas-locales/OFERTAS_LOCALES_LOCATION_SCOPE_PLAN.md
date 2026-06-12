# Ofertas Locales — Location Scope Plan

## Current issue

Step 4 location/contact felt tied to NorCal assumptions: state placeholder `CA`, phone example `(408)…`, and sparse helper copy. The pipeline already stored city/state/ZIP/address/directions in DB and public APIs, but UX copy did not clearly state that any valid US city/state/ZIP is accepted.

## Fields inspected

| Field | Draft | Publish mapper | DB column | Public offers API | Public search API |
|-------|-------|----------------|-----------|-------------------|-------------------|
| address | `address` | `address` | `address` | yes | yes (parent) |
| city | `city` | `city` | `city` | yes | yes (parent) |
| state | `state` | `state` | `state` | yes | yes (parent) |
| ZIP | `zipCode` | `zip_code` | `zip_code` | yes | yes (parent) |
| service ZIPs | `serviceZipCodes` | `service_zip_codes` | `service_zip_codes` | — | — |
| phone | `phone` | `phone` | `phone` | yes | yes (parent) |
| WhatsApp | `whatsapp` | `whatsapp` | `whatsapp` | yes | yes (parent) |
| website | `websiteUrl` | `website_url` | `website_url` | yes | yes (parent) |
| directions | `directionsUrl` | `directions_url` | `directions_url` | yes | yes (parent) |

## Location pipeline status (Gate A)

1. City accepts any text — **yes**, no region filter in validation.
2. State accepts any 2-letter code — **yes**, optional, normalized uppercase.
3. ZIP requires valid 5 digits — **yes**.
4. Address optional — **yes**.
5. Directions URL optional, normalized — **yes** (`sanitizeOptionalUrl`).
6. Copy implied restricted region — **partially** (CA placeholder, 408 phone); fixed in Gate B.
7. Validation blocks non-NorCal — **no**.
8. Publish mapper submits all location fields — **yes**.
9. DB stores all fields — **yes** (text columns, no migration needed).
10. Public offers API selects location fields — **yes**.
11. Public search filters city/ZIP — **yes** (case-insensitive city, ZIP prefix).
12. Public cards/details show location — **yes**.
13. Directions CTA — `directionsUrl` first, Google Maps search fallback from address/city/state/ZIP.
14. Admin/owner — `ofertasLocalesAdminHelpers` maps same columns; dashboard reads `city`, `zipCode`, `address`, `directionsHref`.
15. ES/EN copy — aligned in Gate B.

## Copy changes (Gate B)

Added helpers: `zipHelper`, `addressHelper`, `serviceZipHelper`, `directionsHelper`. Removed NorCal-specific placeholders. Wizard hints: city, ZIP, phone or WhatsApp.

## Validation changes (Gate B)

- City required, any text.
- ZIP required, 5 digits.
- State optional; if entered must be 2 letters after normalization.
- Address optional.
- Website/directions URLs validated when present.
- Service ZIPs optional; each 5 digits via `parseServiceZips`.

## Public search/filter (Gate C)

No overbuild — existing `matchesCity` / `matchesZip` in `ofertasLocalesPublicSearchHelpers` and offer helpers verified. Public search client has city + ZIP filter inputs.

## Admin/dashboard readiness

Read-only check: admin inspect and owner update mappers already include `address`, `city`, `state`, `zip_code`, `directions_url`, `service_zip_codes`. No dashboard file changes in this stack.

## Map/directions readiness (Gate D)

- `directionsUrl` used first for Cómo llegar / Directions.
- Fallback: Google Maps search URL built from address + city + state + ZIP when no directions URL.
- No route optimization, no multi-stop routes.

## What will not be touched

- Coupon flow polish, Step 5 upload, pricing, public safety filters, admin/dashboard code, Stripe, route optimization, unrelated categories, Supabase migrations.

## QA checklist

**Publish wizard (ES/EN)**

1. Enter city `Miami`, state `FL`, ZIP `33101` — accepted.
2. Enter city `Chicago`, no state, ZIP `60601` — accepted.
3. Optional address + directions Google Maps URL — directions CTA uses URL.
4. Address without directions URL — public fallback map link documented.
5. Wizard hints show city, ZIP, phone/WhatsApp when missing.

**Public search**

1. Filter by city partial match (case insensitive).
2. Filter by ZIP prefix.
3. Approved offers only; pending excluded.
