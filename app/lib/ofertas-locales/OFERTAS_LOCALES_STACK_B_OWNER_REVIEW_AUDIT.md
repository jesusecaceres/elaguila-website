# Stack B — Owner Review UI Audit

**Script:** `npm run ofertas-locales:stack-b-owner-review-audit`

## Summary

Owner-facing review workflow for AI-extracted `oferta_local_items`. List + PATCH APIs with bearer auth and owner checks. UI panel on wizard steps 5 and 7.

## Safety

- `is_active` forced **false** on every PATCH
- No public search/results/detail pages
- Approved items show not-public-yet copy
- No Supabase migrations in this stack

## QA URLs

- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=en

## Recommended next stack

**Stack C — Public item search gate** (only after DB apply + owner review smoke on production).
