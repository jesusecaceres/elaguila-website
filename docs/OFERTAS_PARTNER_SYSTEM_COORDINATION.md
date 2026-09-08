# Ofertas Partner System Coordination

## Doctrine

All approved advertisers receive:

- Full flyer publication.
- Searchable reviewed products.
- Public flyer hub.
- Product drawer.
- Shopping list for Ofertas.

Verified magazine partners may additionally receive:

- Courtesy package for a controlled active term.
- Partner badge.
- Highlighted/top flyer section.
- Priority in default/relevance when product matches.
- Magazine pickup/location visibility when applicable.

Standard advertisers must remain visible. Partner priority must not falsify explicit price sorting.

## Verification Rules

- Verification is required.
- Courtesy start date is required.
- Courtesy end date is required.
- Expiration is enforced.
- Admin controls are required.
- No permanent free entitlement without active verified status.
- No customer self-assignment of partner status.
- Do not build partner status from unverified metadata.

## Required Schema Fields

Recommended shared fields:

- `partner_status`
- `partner_verified_at`
- `partner_verified_by`
- `partner_courtesy_starts_at`
- `partner_courtesy_ends_at`
- `partner_badge_label`
- `partner_priority_scope`
- `partner_pickup_location_ids`
- `partner_audit_reason`
- `partner_revoked_at`
- `partner_revoked_by`

Recommended enum:

- `none`
- `pending_verification`
- `verified_active`
- `verified_expired`
- `revoked`

## Admin Mutation Contract

Admin mutations must:

- Require admin authorization.
- Set verification and courtesy dates together.
- Reject active partner status without start/end dates.
- Enforce end date after start date.
- Write audit history.
- Recompute public eligibility without changing standard advertiser visibility.
- Never accept partner status from owner/public clients.

## Public Badge Contract

Public surfaces may show a partner badge only when:

- Parent listing is approved and not expired.
- Partner status is `verified_active`.
- Current time is inside courtesy start/end.
- Badge label is stored or derived from shared verified state.

## Sorting Contract

Default/relevance sorting may boost verified active partners when a product or flyer matches the query. Explicit `price_low` and future `price_high` sorts must remain truthful by price and must not be reordered by partner priority.

## Courtesy Entitlement Interaction

Courtesy package should create a real entitlement-like record with owner, admin, start, end, and reason. It must not be represented as fake payment or fake Stripe success.

## Expiration Behavior

When courtesy end date passes:

- Partner badge disappears.
- Partner priority stops.
- Standard approved advertiser visibility remains if the paid/public listing is still active.
- Admin and owner surfaces show expired courtesy status only if backed by stored data.

## Audit History

Audit history should record:

- Admin actor.
- Previous status.
- New status.
- Start/end dates.
- Reason.
- Timestamp.
- Affected parent listing ID.

## Shared Files Likely Involved

- `supabase/migrations/**`
- `app/admin/(dashboard)/workspace/**`
- `app/lib/listingPlans/**`
- `app/lib/listingLifecycle/**`
- `app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts` after schema exists
- `app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts` after schema exists
- Public search sorting components after verified state exists

## Tests

- Customer cannot self-assign partner status.
- Admin cannot activate partner without start/end dates.
- Expired courtesy removes badge and priority.
- Revoked status removes badge and priority immediately.
- Standard advertisers remain public.
- Explicit low-to-high and high-to-low price sorting are not falsified.
- Partner audit history records each mutation.
