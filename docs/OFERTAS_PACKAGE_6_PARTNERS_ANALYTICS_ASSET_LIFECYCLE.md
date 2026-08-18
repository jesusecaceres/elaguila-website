# Ofertas Package 6: Partners, Analytics, Asset Lifecycle

Package 6 builds repository-side foundations for verified magazine partners, real canonical analytics, and safe flyer/coupon source replacement. Migrations are not applied in this package.

## Partner Domain Model

- `ofertas_local_partner_organizations` stores real partner organizations, verification status, operational status, partner type, pickup eligibility, notes, and verification timestamps.
- `ofertas_local_partner_assignments` links one canonical `ofertas_locales` parent to a partner, courtesy period, product key, priority, badge eligibility, pickup visibility, and revocation reason.
- `ofertas_local_partner_pickup_locations` stores real public pickup locations for partner organizations. Public UI shows only active persisted locations.
- `ofertas_locales.partner_assignment_id` and `commercial_eligibility_source` preserve why submission was allowed.

Customers cannot self-verify. Admin/server-only mutation helpers in `ofertasLocalesPartnerAdminMutations.ts` perform organization upsert, verification, suspension/reactivation, assignment, and revocation.

## Courtesy Entitlement Rules

Submission and approval eligibility is one of:

- `paid`: active matching Revenue OS payment and package entitlement.
- `partner_courtesy`: active assignment to a verified active partner, active courtesy dates, matching product key, owner-owned canonical parent, stable Leonix ID, and completed AI review.

Courtesy does not write fake Stripe IDs, payment records, or `payment_status = paid`. Payment/courtesy never starts the public term and never auto-approves. Approval still starts the Package 4B 30-day public term.

The safer approval policy is used: admin approval revalidates paid or active courtesy eligibility at approval time.

## Ranking Rules

Default/relevance order is deterministic:

- public eligibility first;
- query filtering before sorting;
- partner boost for verified active partner assignments;
- highlighted placement and numeric priority as additional boosts;
- freshness;
- stable ID tie-breaker.

Standard advertisers remain visible and searchable. Partner status is not an exclusive filter. Explicit sorts (`price_low`, `newest`, `expiring_soon`) remain authoritative and use only stable secondary tie-breakers.

## Public Badge And Pickup Contract

Partner badge displays only when:

- partner organization is verified;
- partner organization is operationally active;
- assignment is active;
- courtesy dates are current;
- badge is enabled;
- listing is otherwise publicly eligible.

Pickup locations display only from active persisted records and only when assignment pickup visibility and organization pickup eligibility are both true. No magazine inventory or availability is fabricated.

## Analytics Event Catalog

Ofertas reuses `POST /api/analytics/events` and shared `listing_analytics`. It does not create duplicate analytics storage.

Canonical events:

- `listing_impression`
- `listing_open`
- `flyer_page_view`
- `product_impression`
- `product_open`
- `product_search`
- `product_search_result_click`
- `shopping_list_add`
- `shopping_list_remove`
- `listing_share`
- `website_click`
- `phone_click`
- `message_click`
- `whatsapp_click`
- `email_click`
- `directions_click`
- `coupon_open`

Metadata is public-safe: parent UUID, Leonix ID via canonical resolver, product ID, product type, result position, partner status, surface, filters, and language where available. Stripe IDs, payment secrets, prompts, raw AI output, owner email, owner phone, and private admin notes are excluded.

Owner analytics use shared dashboard readers scoped by owner and listing keys. Admin/operational metrics can roll up the same shared event rows by category, status, and partner/courtesy provenance. Zero states remain zero; unavailable environments are marked unavailable.

## Asset Version Model

`ofertas_local_source_assets` stores versioned source uploads:

- canonical parent UUID and owner;
- version number;
- source asset ID, storage path, URL, filename, MIME, size, page count;
- optional scan job;
- review state;
- lifecycle status (`pending_review`, `active`, `superseded`, `removed`, `scan_failed`);
- replacement/removal reasons;
- cleanup status.

`oferta_local_scan_jobs.source_asset_version_id` links scans to exact source versions. `oferta_local_items.source_asset_version_id` and `source_lifecycle_status` prevent public exposure of stale products. Public item search fails closed when a listing has a declared public source version and an item does not match it.

## Replacement Workflow

Owner replacement registration:

1. Owner uploads a real asset using existing upload infrastructure.
2. Owner registers uploaded metadata through the source-version endpoint.
3. The canonical parent, Leonix ID, payment/courtesy, and public-term timestamps are preserved.
4. Listing is marked `replacement_pending` and `asset_replacement_required_review = true`.
5. Replacement scan/review can run against the new `source_asset_version_id`.
6. Current public version remains live until a new source version is explicitly activated.
7. Activation supersedes old active source versions and deactivates old items.

Admin remove/replace operations are represented by source-version mutation helpers. Removal marks source versions removed and cleanup queued; it does not claim physical storage deletion.

## Migration

Apply order after Package 5:

1. `20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql`
2. deploy runtime that reads the Package 6 columns/tables.
3. seed verified partner organizations and pickup locations.
4. assign courtesy only through admin-authorized workflows.

Backfill: none. Legacy rows remain nullable/legacy and do not gain invented partner status or source history.

RLS: enabled on new public tables with limited public read policies for verified partner organizations and active pickup locations; owner read policies for assignments and source assets. Admin writes are service-role/server-only.

## Environment And Deferred Work

- Browser QA deferred by instruction.
- Migration unapplied by instruction.
- Database not accessed.
- Supabase CLI not used.
- Deployment not performed.
- Storage cleanup automation is represented by `cleanup_status`; physical deletion requires a later worker/cron.
- Partner data onboarding remains environment work.
- Renewal/republish policy remains outside Package 6.
