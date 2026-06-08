# Stack FINAL-1B+ — Ofertas Locales Pipeline Gap Audit

Compared against En Venta gold standard (see `OFERTAS_LOCALES_FINAL_1B_EN_VENTA_PATTERN_AUDIT.md`).

## Issue classification

| Issue | Classification | Gate C action |
|-------|----------------|---------------|
| Draft in `localStorage` (cross-tab stale) | **MUST_FIX_BEFORE_SMOKE** | Switch to `sessionStorage` |
| Production DB tables missing | **MUST_FIX_BEFORE_SMOKE** | Manual SQL apply (Chuy) |
| `googleReviewUrl` / `yelpUrl` missing | **MUST_FIX_BEFORE_SMOKE** | Add fields + metadata mapping |
| Social links in `internal_notes` only | **SAFE_TO_DEFER_TO_ADMIN_STACK** | Promote on approve in FINAL-2 |
| Public card missing social buttons | **SAFE_TO_DEFER_TO_ADMIN_STACK** | After admin promotes metadata |
| Admin review queue | **SAFE_TO_DEFER_TO_ADMIN_STACK** | FINAL-2 |
| Seller dashboard / Mis Anuncios | **SAFE_TO_DEFER_TO_DASHBOARD_STACK** | FINAL-3 |
| Edit/republish from row | **SAFE_TO_DEFER_TO_DASHBOARD_STACK** | FINAL-3 |
| AI scan production smoke | **FUTURE_AI_OR_ANALYTICS** | After tables + admin |
| Route optimizer / shopping route | **DO_NOT_BUILD_YET** | — |
| Stripe/payment for AI | **DO_NOT_BUILD_YET** | — |
| Long-term saved drafts / resume URL | **DO_NOT_BUILD_YET** | — |

## Pipeline verification (code)

| Check | Status |
|-------|--------|
| Publish API auth | ✅ |
| Publish API `pending_review` only | ✅ |
| Asset metadata in submit payload | ✅ |
| Address/city/state/ZIP/directions in payload | ✅ |
| Social links in metadata prefix | ✅ (+ googleReview/yelp after Gate C) |
| Public route excludes non-approved | ✅ |
| Public API excludes `internal_notes` | ✅ |
| New tab clean draft | ❌ → fixed Gate C |
| Live submit to production DB | ❌ blocked — tables missing |

## Admin review readiness (En Venta model)

- En Venta: post-publish ops queue on `listings.status`
- Ofertas Locales: needs queue on `ofertas_locales.status` (`pending_review` → `approved`/`rejected`)
- Reuse: `AdminListingsTable` patterns, audit log, category ops href

## Seller dashboard readiness (En Venta model)

- En Venta: `dashboard/mis-anuncios` + `EnVentaListingManageCard`
- Ofertas Locales: needs owner query on `ofertas_locales` by `owner_id`, status chips, link to republish wizard
- No in-place edit until republish seed helper exists

## Business Hub Lite

- **Base package:** contact, website, directions/map CTA, asset view — ready in publish/preview; public drawer partial
- **Not AI-exclusive:** ✅ base fields work without AI intent
- **Review links:** collected in metadata after Gate C; public render deferred to admin stack
