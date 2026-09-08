# Ofertas Package 7 AI Scan, Review, Publication

Package 7 completes the repository-side Ofertas/Cupones customer product path while preserving Packages 4A-6. Migrations were not applied, no database was accessed, no external provider was called, and no deployment was performed.

## Upload Contract

Uploads remain owner-authenticated. Server upload and client-direct Blob upload validate MIME/type/size and derive storage paths server-side from owner, asset kind, asset ID, and a sanitized file segment. Supported source types remain PDF, JPEG, PNG, and WebP for flyers/coupons, with logo upload restricted to images.

Scan requests now resolve or create an `ofertas_local_source_assets` version before creating a scan job. The scan job stores `source_asset_version_id`, preserving the canonical parent UUID, owner, Leonix ID, entitlement, and public term.

## Scan Job Lifecycle

The existing Ofertas scan job remains canonical. Package 7 adds page-level progress through `oferta_local_scan_pages` plus job counters:

- `total_pages`
- `completed_pages`
- `failed_pages`
- `current_page`
- `current_stage`
- `last_activity_at`
- `failure_summary`

Stable stages are `uploading`, `preparing`, `rasterizing`, `scanning`, `extracting`, `creating_crops`, `awaiting_review`, `failed`, and `complete`. The customer UI displays persisted `completed/total` progress when available.

Gemini-compatible provider selection remains server-controlled through Ofertas provider config. Client payloads cannot select arbitrary providers. This build did not call Gemini or Google Document AI.

Partial page failure is stored as failed page/job progress and blocks submission/approval until resolved. Successful page results remain attached to the same scan/source version.

## Prices, Boxes, And Crops

Price normalization is Ofertas-local. It preserves original text, display text, decimal amount, integer cents, and parse status. Representative supported inputs include `8.99`, `$8.99`, `2 for $5`, `3/$10`, `.99`, `10.00`, and `1,299.99`.

Bounding boxes use one normalized 0-1 contract. Invalid, inverted, and zero-area boxes are rejected before review/public mapping. Crop generation and highlight display use the same normalized source.

Crops remain tied to canonical parent, scan job, source asset, page number, item, and storage path. Missing crops produce truthful placeholders/fallbacks; no fake image is fabricated.

## Review And Submission

The customer review workspace remains owner-scoped and item-scoped. Package 7 adds cents-aware price patches and view model fields for source version, scan page, page dimensions, original price text, and price parse status.

Submission requires:

- owner auth;
- existing canonical parent;
- valid commercial/courtesy entitlement;
- lane match between parent and draft;
- scan job ownership when provided;
- no failed scan job/page state;
- no unresolved AI review items;
- at least one approved item from an active source version.

Submission does not publish, activate public items, create a new parent, rescan, charge again, or start/reset the public term.

## Admin Approval

Admin approval now refuses unresolved items, missing source version, blocking scan pages, missing approved source items, invalid Leonix ID, or missing commercial/courtesy eligibility. Approval marks the reviewed source version approved and activates it through the narrow source-version activation contract, then activates only approved items from that public source version.

The Package 4B term remains approval-driven and is not extended by replacement or rescan.

## Public Contract

Public offer/item paths require approved, non-expired parents and approved active items from the current public source version. Public search already rejects mixed source versions. Offer cards/details now also require a public source asset and current asset lifecycle.

Flyer behavior supports pages, searchable products, item drawer/page references, and shopping list planning. Coupon behavior remains coupon-safe: no cart, no shopping list, no quantity purchasing, and no fake redemption.

## Replacement And Cleanup

Owner replacement still creates a new source version while preserving parent, Leonix ID, payment, entitlement, and term timestamps. Admin approval can activate the reviewed replacement source. Old source versions and old items are superseded/inactive.

Package 7 adds a cleanup queue table and admin-only queue API contract. Cleanup queue entries record source, storage path, type, status, attempts, reason, failure, and completion timestamps. Physical storage deletion is deferred and was not performed.

## Migration

Apply Package 6 migrations first, then Package 7:

1. `20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql`
2. `20260801013000_ofertas_locales_ai_scan_review_publication.sql`

No backfill is included. Legacy rows remain nullable and are not invented into reviewed/source-version-complete records.

## Environment

Required later environment setup, without secret values:

- `BLOB_READ_WRITE_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` or existing Document AI credentials
- optional Ofertas Gemini model/concurrency/max-page env vars

## Verification Still Deferred

Staging must still apply migrations, configure providers, run real Gemini scans, execute a cleanup worker/cron against the queue, and perform real flyer/coupon/mobile browser QA. Browser QA, provider QA, Supabase access, Stripe access, migration application, and deployment were intentionally not performed in this package.

## Cross-Workstream Dependencies

No Globalization, Concierge, global analytics redesign, global Stripe redesign, global CSS, global translation, global SEO, or unrelated category change was required.
