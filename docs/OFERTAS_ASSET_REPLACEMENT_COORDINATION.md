# Ofertas Asset Replacement Coordination

## Current Truth

The owner dashboard displays source flyer/coupon files as read-only. `app/api/ofertas-locales/owner/[id]/route.ts` and `app/lib/ofertas-locales/ofertasLocalesOwnerUpdateMapper.ts` do not accept `flyer_assets`, `coupon_assets`, storage paths, scan jobs, or item reset fields from owner updates.

Package 3 intentionally keeps replacement unavailable in UI because the current category route cannot safely:

- deactivate the old active source
- preserve historical source metadata
- create a new active source
- create a new scan job
- detach or deactivate old reviewed items
- keep the same parent identity
- avoid old/new product mixing

## Required Replacement Workflow

Before approval:

- Owner uploads a new flyer/PDF/image source.
- Parent ID remains the same.
- Old source is marked inactive or historical.
- Old reviewed items are deactivated or marked superseded.
- New source creates a new scan job.
- Preview uses only the active source and current reviewed items.
- Public visibility remains blocked.

After approval:

- Replacement must enter an update/review workflow.
- Current public version remains live or becomes private only by shared policy.
- New source and new products cannot become public until approval.
- No destructive deletion unless schema and audit history explicitly support it.

## Shared Needs

- Active source marker.
- Source asset history/audit.
- Item supersession or source generation relationship.
- Owner upload route for replacement.
- Scan job restart tied to same parent.
- Admin evidence of replacement/corrections.
- Public mapper that reads only active approved source/item generation.

Likely category/shared files:

- `app/api/ofertas-locales/assets/upload*/**`
- `app/api/ofertas-locales/scan-prep/route.ts`
- `app/api/ofertas-locales/scan/route.ts`
- `app/api/ofertas-locales/items/**`
- `app/api/ofertas-locales/owner/[id]/route.ts`
- `app/lib/ofertas-locales/ofertasLocalesAiDbMapper.ts`
- `app/lib/ofertas-locales/ofertasLocalesOwnerUpdateMapper.ts`
- schema/migrations for active source and item generation fields

## Acceptance Tests

- Replacement keeps same parent ID.
- Old items do not remain active for new source.
- New scan job is created for new active source.
- Public views never mix old source with new reviewed products.
- Approved listing replacement requires review.
- Historical source metadata remains available for admin audit.
