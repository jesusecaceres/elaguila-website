# Stack 8 — Ofertas Locales Business Hub Lite + Featured Placement Audit

## Summary

Stack 8 adds Business Hub Lite social links and featured placement intent to Ofertas Locales without full Business Hub, reviews, or public featured activation.

## Implemented

- Social fields: `facebookUrl`, `instagramUrl`, `tiktokUrl`, `youtubeUrl`, `googleBusinessUrl`
- Featured intent: `wantsFeaturedPlacement`, `featuredPlacementScope`
- Compact optional application sections before validation
- Preview: “Síguenos / Follow us” when links exist; internal featured-interest note only
- Publish mapper: `is_featured_requested` + social/scope metadata in `internal_notes`

## DB follow-up (deferred)

Dedicated columns for social URLs and `featured_placement_scope` — pending Chuy approval. Metadata stored in `internal_notes` via `[ofertas_locales_metadata]` JSON prefix.

## Validation

```bash
npm run ofertas-locales:stack-8-business-hub-lite-featured-audit
npm run build
```
