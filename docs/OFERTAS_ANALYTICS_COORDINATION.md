# Ofertas Analytics Coordination

## Current State

`app/lib/ofertas-locales/ofertasLocalesAnalyticsEvents.ts` defines planned event names only. It explicitly has no tracking implementation, API calls, or storage. Package 3 does not add dashboard counts or global analytics storage.

Existing planned names include:

- `offer_view`
- `result_card_click`
- `flyer_open`
- `pdf_click`
- `coupon_click`
- `phone_click`
- `whatsapp_click`
- `email_click`
- `website_click`
- `directions_click`
- `share_click`
- `item_search`
- `item_result_click`
- `item_to_flyer_open`
- `filter_apply`

## Canonical Event Contract

Each event must carry:

- actor state: anonymous, authenticated_owner, authenticated_non_owner, admin
- listing ID: parent database ID
- Leonix Ad ID when available
- product/item ID when applicable
- category/lane: `ofertas_locales`, `interactive_flyer` or `coupons`
- source surface: publish_preview, public_results, public_detail, coupon_results, owner_dashboard, admin_review
- locale
- owner excluded/included rule
- deduplication rule
- privacy rule
- server/client boundary
- required shared storage
- dashboard aggregation consideration

## Required Events

| Requirement | Canonical event name |
| --- | --- |
| flyer impression | `ofertas_flyer_impression` |
| flyer open | `ofertas_flyer_open` |
| product impression | `ofertas_product_impression` |
| product open | `ofertas_product_open` |
| product search | `ofertas_product_search` |
| filter use | `ofertas_filter_apply` |
| product drawer open | `ofertas_product_drawer_open` |
| add to shopping list | `ofertas_shopping_list_add` |
| remove from shopping list | `ofertas_shopping_list_remove` |
| Ver volante | `ofertas_view_flyer_click` |
| call | `ofertas_call_click` |
| SMS | `ofertas_sms_click` |
| WhatsApp | `ofertas_whatsapp_click` |
| email | `ofertas_email_click` |
| website | `ofertas_website_click` |
| directions | `ofertas_directions_click` |
| share | `ofertas_share_click` |
| coupon open | `ofertas_coupon_open` |
| partner section impression | `ofertas_partner_section_impression` |
| partner flyer open | `ofertas_partner_flyer_open` |

## Per-Event Rules

For all events:

- Owner/admin self-views should be excluded from public performance counts by default, but retained in raw audit only if shared analytics supports actor-state filtering.
- Deduplicate impressions by listing/item/surface/session/time window.
- Do not store phone numbers, emails, raw addresses, provider errors, storage paths, or internal notes in event payloads.
- Client may emit interaction intent; server storage must validate listing/item public eligibility and normalize identity.

Specific rules:

- `ofertas_flyer_impression`: parent ID required; item ID absent; only public eligible parents.
- `ofertas_flyer_open`: parent ID required; source surface required; includes Leonix Ad ID when available.
- `ofertas_product_impression`: parent and item IDs required; only approved active children under approved non-expired parent.
- `ofertas_product_open`: parent and item IDs required; drawer/detail source required.
- `ofertas_product_search`: query should be normalized or bucketed; avoid raw sensitive query storage if shared privacy policy requires.
- `ofertas_filter_apply`: store filter keys and values only after allow-listing.
- `ofertas_product_drawer_open`: item ID required; source page/bbox presence may be booleans, not raw internal storage metadata.
- `ofertas_shopping_list_add` and `ofertas_shopping_list_remove`: Ofertas only; never Cupones.
- CTA clicks (`call`, `sms`, `whatsapp`, `email`, `website`, `directions`, `share`): store CTA type and listing ID; do not store destination PII.
- `ofertas_coupon_open`: Cupones only; no claim/redemption unless real redemption system exists.
- Partner events require verified active partner state from the shared partner system.

## Shared Storage Needed

Likely shared files:

- `app/lib/listingAnalytics.ts`
- `app/lib/listingAnalyticsEventTypes.ts`
- `app/lib/analytics/client/recordAnalyticsEvent.ts`
- `app/lib/analytics/server/validateAnalyticsEvent.ts`
- `app/lib/analytics/server/analyticsEventDedupe.ts`
- `app/lib/analytics/server/resolveListingAnalyticsIdentity.ts`
- `app/lib/analytics/listingAnalyticsIdentity.ts`
- `supabase/migrations/*listing_analytics*`

## Dashboard Aggregation

Owner dashboard may show analytics only after stored, validated events exist. Aggregations should separate:

- public views
- owner/admin self-views
- item interactions
- contact actions
- coupon opens
- shopping list actions for Ofertas only
- partner events only for verified partners

## Tests

- Public-only eligibility validation blocks draft/pending/rejected/expired events.
- Owner/admin self-views are excluded from owner-facing public performance counts.
- Cupones cannot emit shopping list events.
- Product events require approved active item and approved non-expired parent.
- CTA events do not persist raw PII destinations.
- Partner events require verified active partner state.
- Dashboard shows no analytics until stored aggregation exists.
