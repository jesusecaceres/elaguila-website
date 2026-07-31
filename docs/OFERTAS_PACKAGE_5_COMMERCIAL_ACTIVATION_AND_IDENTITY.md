# Ofertas Package 5 — Commercial Activation And Identity

Status: repository foundation built only. Migration not applied. Stripe not called. Database not connected. Deployment not performed.

## Product Contract

| Product | Key | Price | Currency | Public term | AI included |
| --- | --- | ---: | --- | ---: | --- |
| Ofertas / Volante interactivo Leonix | `ofertas_locales_flyer_30d` | 39900 cents | USD | 30 days after approval | Yes |
| Cupones Leonix | `ofertas_locales_coupons_30d` | 19900 cents | USD | 30 days after approval | Yes |

The customer path has no manual/basic/non-AI package, no separate AI add-on, no `$598` combined package, no fake checkout, and no fake success.

## Environment Variables

Revenue OS uses the existing Stripe and Supabase service-role configuration:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` or `VERCEL_URL` for checkout return URLs

No real secret values are stored in this repository. Missing Stripe/Supabase configuration returns truthful errors and does not fake a successful session.

## Stripe Price Mapping

Package 5 uses existing Revenue OS dynamic `price_data` line items from the server-owned pricing matrix. Stripe Dashboard products/prices may be created for operations parity, but runtime amount truth is derived server-side from `REVENUE_V1_PACKAGE_MATRIX`.

## Checkout Metadata Schema

`buildStripeCheckoutMetadataPayload()` writes:

- `leonix_metadata_schema=revenue_os_checkout_v2`
- `leonix_workflow=ofertas_locales_package_5_checkout`
- `leonix_category=ofertas-locales`
- `leonix_package_key`
- `leonix_listing_id`
- `leonix_ad_id`
- `leonix_owner_user_id`
- `leonix_payment_record_id`
- `leonix_amount_cents`
- `leonix_currency`
- `leonix_duration_days`
- `leonix_ai_included`
- existing promo/package entitlement fields when applicable

Metadata is built only after server-side owner, package, parent, and Leonix ID validation.

## Webhook Contract

The canonical handler remains `app/api/revenue-os/webhook/route.ts`. It verifies the Stripe signature, accepts `checkout.session.completed`, verifies paid status, validates package/category/amount/currency/metadata, marks the payment record paid, creates the shared listing package entitlement, then updates the existing `ofertas_locales` parent summary.

Fulfillment does not create a second parent, approve the listing, publish the listing, or write `published_at` / `expires_at`.

## Entitlement Source Of Truth

The source of truth is the existing Revenue OS tables:

- `leonix_payment_records`
- `listing_package_entitlements`

The `ofertas_locales` row stores a compact operational summary for owner/admin truth:

- `payment_status`
- `paid_at`
- `payment_record_id`
- `stripe_checkout_session_id`
- `stripe_payment_intent_id`
- `package_entitlement_id`
- `entitlement_status`
- `entitlement_granted_at`
- `entitlement_ends_at`

## Submission Eligibility

Submitting to review requires:

- authenticated owner;
- existing canonical parent;
- stable `LNX-XXXXXXXX` Leonix Ad ID;
- matching commercial product key;
- active shared package entitlement;
- matching paid Revenue OS payment record for owner, listing, package, amount, and currency;
- existing AI review gates still passing.

Rejected corrections reuse the same paid parent and do not require a second payment while the entitlement remains active.

## Approval And Term Separation

Payment and public activation are separate:

- payment does not write `published_at`;
- payment does not write `expires_at`;
- admin approval still sets `published_at`;
- admin approval still computes `expires_at` from Package 4B’s 30-day rule;
- rejections do not consume the public term.

Admin approval now also requires Leonix ID plus paid entitlement summary.

## Leonix Ad ID

Format: `LNX-XXXXXXXX`.

Generation: server-side `randomBytes(4)` in `ensureOfertaLocalLeonixAdId()`.

Storage: `ofertas_locales.leonix_ad_id`.

Uniqueness: partial unique index on non-null `leonix_ad_id`.

Assignment event: scan-prep parent creation/update, and checkout as a fallback for legacy rows.

Stability: updates only when the current value is null. It is not derived from title, phone, email, ZIP, customer name, or other mutable content. UUID remains canonical.

Legacy rows without an ID are assigned only through authorized server mutations.

## Migration Order

1. Apply Package 4A migration if not already applied.
2. Apply Package 4B migration if not already applied.
3. Apply `20260731235500_ofertas_locales_commercial_activation_identity.sql`.
4. Configure Stripe/Revenue OS environment variables.
5. Configure Stripe webhook endpoint to `POST /api/revenue-os/webhook`.
6. Run staging checkout and webhook tests.

## Staging Verification

Flyer test:

- create/reuse canonical parent via `/publicar/ofertas-locales`;
- confirm Leonix ID in owner dashboard;
- create checkout for `ofertas_locales_flyer_30d`;
- pay `$399.00` USD in Stripe test mode;
- verify webhook creates payment record and entitlement;
- submit same parent to review;
- approve in admin;
- confirm public term starts only at approval.

Coupon test:

- repeat the same flow for `ofertas_locales_coupons_30d`;
- confirm `$199.00` USD;
- confirm no cart, shopping list, or quantity purchasing path is advertised for coupons.

Exact QA URLs:

- `/publicar/ofertas-locales?lang=es`
- `/dashboard/ofertas-locales?lang=es`
- `/dashboard/ofertas-locales/{id}?lang=es`
- `/admin/workspace/clasificados/ofertas-locales`
- `/revenue-os/pago/exito`
- `/revenue-os/pago/cancelado`
- `/clasificados/ofertas-locales`
- `/clasificados/ofertas-locales/oferta/{id}`

## Production Verification

Use real Stripe Dashboard products/prices only after staging passes. Confirm webhook delivery, payment record, entitlement record, parent summary, owner truth, admin truth, approval separation, and public expiration.

## Rollback Considerations

The migration is additive. Runtime can be rolled back before migration rollback. Do not delete paid records or entitlements. If webhook fulfillment fails, Stripe retries remain safe through payment record and entitlement idempotency.

## Refund / Dispute Limitations

Existing Revenue OS recognizes `refunded` and `disputed` payment states, but Package 5 does not implement a punitive automatic unpublish policy. Pending review should not be approved when entitlement is invalid. Already-active listing handling requires a business policy decision before destructive automation.

## Not Performed

- Migration not applied.
- Stripe not called.
- Database not connected.
- Deployment not performed.
- Browser QA not performed.
- Renewal/republish not exposed.
