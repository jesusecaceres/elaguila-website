# Stack C — Clickable Item Preview Audit

## Gate A

- Audited item review API, mapper, types, draft assets, preview helpers
- Plan created; no full build

## Gate B

- `OfertasLocalesClickableItemPreviewPanel` — owner API fetch, clickable cards, refresh
- `OfertasLocalesItemDetailDrawer` — detail overlay with source context
- `ofertasLocalesClickableItemPreviewHelpers` — price/confidence/source formatting
- Wired in `OfertasLocalesApplicationClient` (steps 5 & 7)

## Gate C

- Mobile tappable cards; desktop grid + drawer
- Status labels: Pending, Needs review, Approved, Rejected, Not public
- Approved ≠ public safety copy
- Source link only for HTTPS URLs; honest unavailable state otherwise
- No fake bounding box overlay
- Full flyer/coupon context only

## Safety

- Owner items API only (`fetchOfertaLocalReviewItems`)
- No public search/results/detail routes
- No migrations or DB commands
- No admin/dashboard/header/nav changes

## QA URLs

- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=en
