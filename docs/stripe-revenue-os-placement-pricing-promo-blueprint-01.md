# Stripe Revenue OS Placement Pricing Promo Blueprint 01

Gate: `STRIPE-REVENUE-OS-PLACEMENT-PRICING-PROMO-BLUEPRINT-01`  
Date: 2026-06-30  
Scope: blueprint only. No Stripe Checkout implementation, no webhook implementation, no live payments, no Supabase migrations, no `.env` edits, and no public category redesign.

## 1. Executive Summary

Leonix Revenue OS should be built as a category/listing/placement entitlement system, not as a global account-plan system. The repo already has important foundations: category ad-plan rules, package entitlement models, admin package entitlement generator, promo-code lifecycle tooling, a payment tracker read model, Stripe dependency, Autos/Bienes Raices category Stripe foundations, and entitlement-backed placement/ranking helpers for Servicios and Restaurantes.

DO NOT implement Stripe Checkout in this blueprint gate. DO NOT add webhook routes. DO NOT add migrations. DO NOT add secrets or `.env` values. DO NOT change public pricing, category pages, owner dashboard flows, or Admin payment behavior.

This gate does not wire money. It locks the implementation blueprint before Checkout/webhooks are expanded. The key product rule is: Stripe proves payment, promo codes prove discount/attribution, and package/placement entitlements decide category scope, surfaces, dates, ranking, print benefits, manual comps, and audit truth. No listing should display paid/featured/premium status unless an active matching entitlement or explicit category source proves it.

## 2. Core Monetization Doctrine

- User account plan is separate from listing/ad plan.
- Listing/ad plan is category-specific and must be resolved from listing/category data, not `profiles.membership_tier`.
- Placement is contract/entitlement-specific and scoped by category and surface.
- Stripe payment status is financial proof, not placement truth by itself.
- Admin or webhook fulfillment creates/updates entitlements after payment, comp, print contract, or owner override proof.
- Promo codes can discount, attribute, or connect to an entitlement, but a promo code alone must not grant placement.
- Print/magazine partners receive digital placement through entitlements with dates, category scope, surface scope, and scarcity controls.
- Public sorting must never inject unrelated categories or fake boost/paid state.

## 3. Existing Stripe/Payment Audit

| Item | Status | Evidence | Blueprint decision |
|---|---:|---|---|
| Stripe dependency | EXISTS | `stripe` package in `package.json` | Reuse Stripe SDK, but centralize future Revenue OS checkout contracts. |
| Autos Stripe checkout | PARTIAL | `app/api/clasificados/autos/checkout/route.ts` creates Stripe sessions and stores session id on `autos_classifieds_listings`. | Keep as category foundation; later migrate/bridge into global payment/entitlement tracking. |
| Autos Stripe webhook | PARTIAL | `app/api/clasificados/autos/stripe/webhook/route.ts` handles `checkout.session.completed`. | Add global idempotency/payment-record writes later. |
| Autos checkout verify | PARTIAL | `app/api/clasificados/autos/checkout/verify/route.ts` retrieves Checkout Session and activates listing. | Keep as fallback; webhook should become source of truth. |
| Autos additional inventory | PARTIAL | Checkout blocks bundle publish unless QA bypass; dealer inventory has 10-vehicle policy. | Add explicit inventory add-on entitlement before charging for +10 vehicles. |
| Bienes Raices checkout | PARTIAL | `app/api/clasificados/leonix/stripe/checkout/route.ts`; metadata includes listing/category/lane/owner. | Existing lane-specific route can be adapted into Revenue OS. |
| Bienes Raices webhook | PARTIAL | `app/api/clasificados/leonix/stripe/webhook/route.ts` activates paid listing on completed session. | Add payment record, entitlement, promo, and audit writes later. |
| Stripe env config helpers | EXISTS | `stripeAutosConfig.ts`, `stripeBrConfig.ts`. | Do not print/set secrets; future gate validates env names only. |
| Global payment tracker | PARTIAL | `leonix_payment_records` migration and `/admin/workspace/payment-tracker` read model. | Future webhook writes to this table. Live proof currently showed table missing live. |
| Payment tracker Admin UI | PARTIAL | `app/admin/_lib/paymentTrackerData.ts`, payment tracker route. | Read-only now; no collection/refund actions until later. |
| Live-mode risks | NEEDS LIVE PROOF | Category routes can activate listing on session verification/webhook but global idempotency is incomplete. | Do not expand live payments until sandbox idempotency and webhook replay tests pass. |

## 4. Existing Promo/Coupon Audit

| System | Classification | Evidence | Blueprint decision |
|---|---:|---|---|
| `leonix_promo_codes` | ADMIN-ONLY PLACEHOLDER / SCHEMA MISSING LIVE | Migration exists and admin data helper exists; live Supabase proof showed table missing live. | Use as canonical promo lifecycle table after migration is applied live. |
| Admin promo manager | PARTIAL | `/admin/workspace/promo-codes`, `promoCodeLifecycle.ts`, `promoCodeData.ts`. | Keep admin-only until public redemption and Stripe validation are built. |
| Promo code redemption | SCHEMA MISSING | Backing matrix calls `promo_code_redemptions` missing. | Add `leonix_promo_code_redemptions` later for checkout idempotency and one-time use. |
| Cupones / local coupons | MARKETING COUPON ONLY | Public `/cupones` and Ofertas Locales coupon/flyer systems are content/marketing flows. | Keep separate from checkout discount codes. |
| Promo category/package limits | NEEDS DESIGN | Promo rows include category/package fields, but no checkout validation API exists. | Future promo validation API must enforce category, package, owner, dates, status, and non-stackable rules. |
| Print-client comps | NEEDS DESIGN | Entitlement generator can create manual entitlements; promo link is best effort. | Use manual comp entitlement path, not fake payment. |

## 5. Existing Entitlement/Package Audit

| Item | Status | Evidence | Reuse / gap |
|---|---:|---|---|
| `listing_package_entitlements` | EXISTS IN REPO / LIVE READ PROVEN | Migration, Admin generator, dashboard API, live proof row count 1. | Reuse as current contract entitlement base. |
| Optional pre-ad entitlement | EXISTS | Optional `listing_id` migration and Admin attach action. | Supports sales-before-listing workflow. |
| Package tier model | EXISTS | `packageEntitlements.ts`, `packageEntitlementConstants.ts`. | Reuse tier taxonomy, but add new `partner_premium` / placement source semantics in future schema or metadata. |
| Placement scopes | PARTIAL | Current scopes: `homepage`, `clasificados`, `category`, `results`. | Expand/normalize to `home`, `clasificados`, `negocios`, `category_landing`, `category_results`, `dashboard`, `admin`. |
| Pricing helpers | PARTIAL | `packagePricingRules.ts` covers print-to-digital monthly tiers, not category-specific checkout prices from this gate. | Add category SKU pricing config later. |
| Featured/promoted fields | PARTIAL / DRIFT | Several live Feature/Verify columns missing per live proof. | Entitlement should be source of truth; legacy flags become display/cache fields only after schema repair. |
| Republish fields | PARTIAL | Republish columns exist in many tables and admin APIs. | Republish remains a tool, not a paid placement substitute. |
| Owner dashboard badges | PARTIAL | `dashboardPackageEntitlementBadges.ts`, dashboard entitlement API. | Extend to paid status, receipt, renewal, add-on status. |

## 6. V1 Pricing Matrix

| Category | Package key | Customer type | Price | Billing mode | Duration | Included inventory | Add-on inventory | Promo eligible | Print comp eligible | Placement eligible | Unresolved questions | Implementation status |
|---|---|---|---:|---|---|---|---|---:|---:|---:|---|---|
| Autos | `autos_privado_30d` | Private seller | `$24.99` | one_time | 30 days | 1 vehicle | none | yes | no | no | none | Existing Stripe foundation, needs Revenue OS bridge. |
| Autos | `autos_dealer_monthly` | Dealer/business | `$399/mo` | monthly_subscription | monthly | 10 active vehicles | `+$149/mo` for 10 additional vehicles likely | yes | yes | yes | Add-on final lock and entitlement model | Existing partial Stripe, add-on blocked without QA bypass. |
| Bienes Raices | `br_agent_monthly` | Agent/business | `$399/mo` | monthly_subscription | monthly | 1 business/agent package | `+$149/mo` for 4 properties likely | yes | yes | yes | Add-on final lock | Existing BR Stripe foundation. |
| Bienes Raices | `br_fsbo_45d` | Private FSBO | `$49.99` | one_time | 45 days | 1 listing | none | yes | no | paid_private | NEEDS OWNER FINAL LOCK if repo source differs | Existing BR private price env exists, price not globally locked. |
| Rentas | `rentas_30d` | Private/business V1 simplified | `$24.99` | one_time | 30 days | 1 listing | none | yes | no | paid_private | Confirm no negocio split for V1 | Needs new checkout path. |
| Restaurantes | `restaurantes_base_monthly` | Restaurant/business | `$399/mo` | monthly_subscription | monthly | 1 profile/listing | future multi-location | yes | yes | yes | none | Entitlement/ranking foundations exist; no checkout. |
| Restaurantes | `restaurantes_offers_addon` | Restaurant/business | `$99/mo` | monthly_subscription | monthly | coupons/offers module | n/a | yes | yes | yes | NEEDS OWNER FINAL LOCK | No checkout/add-on table yet. |
| Servicios | `servicios_base_monthly` | Service business | `$399/mo` | monthly_subscription | monthly | 1 profile/listing | future multi-location | yes | yes | yes | none | Strong entitlement/ranking foundation; no checkout. |
| Servicios | `servicios_offers_addon` | Service business | `$99/mo` | monthly_subscription | monthly | coupons/offers module | n/a | yes | yes | yes | NEEDS OWNER FINAL LOCK | Add-on needs schema/product path. |
| Empleos | `empleos_job_30d` | Employer | `$24.99` | one_time | 30 days | 1 job post | none | yes | no | paid_private | none | Needs new checkout path. |
| Empleos | `empleos_job_fair` | Job fair | free | free | event/campaign | event participation | n/a | no | no | no | Define event proof | Keep separate from paid job post. |
| En Venta | `en_venta_free_v1` | Seller | free | free | V1 free | 1 listing | none | no | no | free | Legacy Pro fields documented but inactive | Do not activate Pro in V1. |
| Clases | `clases_free` | Free class | free | free | listing window TBD | 1 class | none | no | no | free | Duration final lock | Needs no checkout. |
| Clases | `clases_paid_30d` | Paid class | `$24.99` | one_time | 30 days | 1 class | none | yes | no | paid_private | none | Needs new checkout path. |
| Comunidad | `comunidad_free` | Community | free | free | TBD | 1 post | none | no | no | free | none | No monetization. |
| Viajes | `viajes_business_monthly` | Travel business | `$399/mo` | monthly_subscription | monthly | 1 business/offer | future offers | yes | yes | yes | NEEDS OWNER FINAL LOCK | Needs travel business checkout and affiliate separation. |
| Viajes | `viajes_affiliate` | Affiliate | free / commission | affiliate | per partner | affiliate listing/offer | n/a | no | no | affiliate | Commission tracking model | Track separately from paid placement. |
| Mascotas / Perdidos | `mascotas_free` | Community/seller | free | free | TBD | 1 listing | none | no | no | free | none | No monetization. |
| Busco / Se Busca | `busco_free` | Community/seller | free | free | TBD | 1 request | none | no | no | free | none | No monetization. |

## 7. Placement Entitlement Model

Future placement entitlement records should be explicit, even if implemented as a new table or a normalized extension of `listing_package_entitlements`.

Required fields:

- `placement_tier`: `partner_premium`, `print_full_page`, `print_half_page`, `print_quarter_page`, `website_business`, `paid_private`, `free`, `affiliate`
- `placement_source`: `stripe_checkout`, `stripe_webhook`, `admin_manual`, `print_contract`, `promo_comp`, `owner_override`, `affiliate_contract`
- `placement_category_scope`: one or more category slugs; must match listing category before ranking
- `placement_surfaces`: `home`, `clasificados`, `negocios`, `category_landing`, `category_results`, `dashboard`, `admin`
- `starts_at`, `ends_at`
- `status`: `active`, `scheduled`, `expired`, `cancelled`, `comped`, `revoked`
- `manual_priority`, `rotation_weight`
- `payment_source`, `contract_source`
- `promo_code_id`, `stripe_payment_id`, `stripe_checkout_session_id`, `stripe_subscription_id`
- `listing_id`, `listing_source`, `owner_user_id`, `leonix_ad_id`
- audit fields: `created_by`, `updated_by`, `revoked_by`, `created_at`, `updated_at`, `admin_note`

## 8. Partner Premium / Print Client Rules

Partner Premium means the highest relationship tier: cover plus inside-page class partner or owner-approved premium contract. It grants homepage featured business eligibility, Clasificados/Negocios featured eligibility, matching category landing highlight, and matching category results priority/module eligibility.

Print rules:

- `partner_premium`: highest placement, limited to about 5-7 active premium spots per major public surface.
- `print_full_page`: priority in matching category results after search/filter.
- `print_half_page`: print advertiser pool plus digital listing, Republish/Boost eligibility when allowed.
- `print_quarter_page`: print advertiser pool, limited digital benefits.
- `website_business`: website-only paid business profile below print clients.
- `paid_private`: paid private listing below business/print placements.
- `free`: organic/free category fallback.
- `affiliate`: visible only on relevant affiliate/travel surfaces unless manually featured.

## 9. Category Scope Rules

An entitlement affects only matching categories. A Restaurant partner ranks in Restaurants, not Autos. A Servicios partner ranks in Servicios, not Rentas. An Autos dealer partner ranks in Autos, not Empleos.

Category matching must happen before ranking. If a listing category, entitlement category, or surface scope is missing, the entitlement should display as an Admin warning and should not affect public placement.

## 10. Public Sorting Rules

Deterministic public sorting order:

1. Category and surface eligibility.
2. Active placement entitlement with date/status proof.
3. Placement tier rank.
4. Manual priority.
5. Rotation/fairness where scarcity requires it.
6. Leonix verified trust signal.
7. Republished/refreshed date.
8. Search/filter relevance.
9. Listing completeness.
10. Freshness.

Must not happen:

- No Restaurant partner in Autos results.
- No global account Pro sorting.
- No fake boost sorting.
- No unpaid listing shown as premium.
- No Stripe `paid` status used directly as public ranking without entitlement.
- No expired/revoked entitlement affecting results.

## 11. Homepage Featured Partner Rules

Homepage featured partners should read active entitlements with `home` scope. Selection order: `partner_premium`, print placement priority, manual priority, rotation weight, contract dates, category diversity, verified status, then freshness. Scarcity target is 5-7 premium active spots; overflow should rotate or fall to category pages, not crowd the homepage.

## 12. Clasificados / Negocios Featured Partner Rules

Clasificados featured partners should read active entitlements with `clasificados` scope and category relevance to marketplace categories. Negocios/Local Businesses should read `negocios` scope and business-profile eligible entitlements. Public Cupones marketing content remains separate from checkout promo codes and must not grant placement.

## 13. Category Landing / Results Placement Rules

Category landing pages should show premium/print partners only for that category. Category results should run normal filters first, then apply entitlement ranking to the matching set. Premium can appear in a module; full-page ranks high in inline results; half/quarter/classified print forms the print pool; paid private and free/organic follow.

Servicios and Restaurantes already have entitlement/ranking groundwork. Autos, Bienes Raices, Rentas, Empleos, Clases, and Viajes require separate category gates before public ranking changes.

## 14. Admin OS Requirements

Admin OS needs:

- Pricing matrix/config page or readout.
- Placement/contract section per listing/client.
- Promo code generator/manager.
- Payment record viewer.
- Stripe event/log viewer.
- Entitlement viewer with category/surface scope.
- Manual comp / print-client included path.
- Contract dates, priority, rotation controls.
- Category and surface selectors.
- Audit log coverage for create/update/revoke, payment fulfillment, promo validation, manual comp, and public placement changes.
- Helper text for every CTA.
- English Admin UX with `REAL`, `PARTIAL`, `PLANNED`, `NEEDS LIVE PROOF`, or `NEEDS SCHEMA GATE` labels where appropriate.

## 15. Owner Dashboard Requirements

Owner/client dashboards need listing-level, not account-level, monetization state:

- Current listing package.
- Paid status.
- Placement badge.
- Included with print badge.
- Promo applied badge.
- Stripe receipt/payment status.
- Renewal date and expiration date.
- Coupon/offers add-on status.
- Analytics impact with honest proof labels.
- Allowed actions: renew, view receipt, manage listing, request upgrade, contact sales.
- Locked/unavailable actions labeled truthfully.
- No account-plan leakage from `profiles.membership_tier`.

## 16. Stripe Checkout Architecture

Future global Checkout should prefer a shared Revenue OS API over more category-specific one-off routes. Category-specific routes can call the shared service after compatibility is proven.

Checkout Session metadata must include:

- `owner_user_id`
- `listing_id`
- `category`
- `package_key`
- `placement_tier`
- `billing_mode`
- `promo_code_id`
- `promo_redemption_id`
- `entitlement_id` when pre-created
- `leonix_ad_id`
- `payment_source`
- `contract_source`
- `listing_source`
- `sales_rep_id`
- `contract_term`

Checkout create flow:

1. Validate auth and listing ownership.
2. Resolve category package and price from central config.
3. Validate promo code without redeeming it.
4. Pre-create or reserve payment record with unique Checkout Session id when available.
5. Optionally pre-create pending entitlement for admin/manual flows.
6. Send Stripe Checkout Session with complete metadata.
7. Do not activate listing or placement until webhook confirms payment.

## 17. Stripe Webhook Fulfillment Architecture

Required events:

- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.payment_failed`
- `invoice.paid` for subscriptions
- `customer.subscription.deleted` for subscriptions

Webhook responsibilities:

- Verify signature.
- Deduplicate by Stripe event id and Checkout Session id.
- Upsert `leonix_payment_records`.
- Mark payment status and paid amount.
- Create or activate placement entitlement.
- Increment promo redemption exactly once.
- Activate listing only if package rules allow it.
- Write `admin_audit_log` once per meaningful transition.
- Revalidate affected admin/dashboard/category surfaces.

Idempotency requirements:

- No duplicate entitlement.
- No duplicate listing activation.
- No duplicate promo redemption.
- No duplicate audit log spam.
- Safe retry handling for Stripe webhook replays.
- Unique constraints on `stripe_checkout_session_id`, redemption key, and entitlement fulfillment key.

## 18. Promo Code Architecture

Promo codes are not public coupon CMS content. They are checkout/admin discount and attribution records. V1 promo validation should enforce:

- Status active and within dates.
- Non-stackable single winner.
- Category/package/customer restrictions.
- Max redemption and one-time use.
- Owner approval for founder/override codes.
- Sales rep attribution.
- Link to entitlement when the code is an entitlement handle.

Future `leonix_promo_code_redemptions` should store `promo_code_id`, `code`, `owner_user_id`, `listing_id`, `category`, `package_key`, `stripe_checkout_session_id`, `stripe_payment_intent_id`, `status`, `redeemed_at`, and an idempotency key.

## 19. Print Client / Manual Comp Architecture

Print-client comps should create active or scheduled entitlements with `placement_source = print_contract` or `promo_comp`, `payment_source = admin_manual`, and `included_with_print = true`. They should not create fake Stripe payment records. If a comp has a contract value, store it as contract metadata, not as paid Stripe status.

Manual comp actions require owner/admin permission, reason text, contract dates, category scope, surface scope, and audit logging.

## 20. Supabase Schema Gap Analysis

| Object | Current status | Needed later | Recommendation |
|---|---:|---|---|
| `listing_package_entitlements` | EXISTS / LIVE PROVEN | More placement fields or metadata normalization | Reuse and extend after migration plan. |
| `leonix_promo_codes` | REPO EXISTS / LIVE MISSING | Live table for promo lifecycle | Apply migration before checkout promo work. |
| `leonix_payment_records` | REPO EXISTS / LIVE MISSING | Webhook-backed global payment ledger | Apply migration before global Revenue OS. |
| `leonix_promo_code_redemptions` | MISSING | Redemption idempotency and one-time use | Add migration later. |
| `leonix_placement_entitlements` | MISSING | Normalized placement-specific contract if not extending package table | Recommended later if package table becomes overloaded. |
| `leonix_partner_contracts` | MISSING | Print/magazine partner contract metadata | Recommended for Premium/print sales operations. |
| `admin_audit_log` | LIVE PROVEN | More actor/reason fields | Extend later for sensitive revenue actions. |
| Stripe ids | PARTIAL | Session, intent, subscription, invoice, customer ids | Payment table already models many fields; webhook must populate. |
| Category/surface fields | PARTIAL | Exact surface list and category scope | Normalize placement scopes. |
| `manual_priority` / `rotation_weight` | MISSING | Scarcity and partner rotation | Add to placement entitlement model. |
| Print flags | PARTIAL IN METADATA | `print_client`, `included_with_print`, issue/page placement | Normalize or store under contract metadata. |
| Coupon/offers add-on | MISSING | Add-on entitlement state | Add package/add-on fields or child entitlement rows. |

## 21. Analytics / Audit Log Requirements

Revenue OS analytics must not be faked. Minimum events:

- checkout started
- checkout completed
- checkout expired
- payment failed
- webhook fulfilled
- entitlement created/activated/revoked/expired
- promo validated/redeemed/rejected
- placement shown/clicked where analytics exists
- dashboard receipt viewed
- admin manual comp created/revoked

Audit log coverage must include actor, target type/id, category, package key, placement tier, promo code id, payment record id, Stripe session id, entitlement id, before/after status, and reason for manual overrides.

## 22. Future Implementation Gates

1. `REVENUE-OS-SCHEMA-CONTRACT-01`: migrations for live promo/payment/redemption/placement gaps.
2. `REVENUE-OS-PRICING-CONFIG-01`: central category SKU/package config and owner final locks.
3. `REVENUE-OS-CHECKOUT-SANDBOX-01`: shared Checkout API in Stripe test mode.
4. `REVENUE-OS-PROMO-VALIDATION-01`: promo validation and redemption idempotency.
5. `REVENUE-OS-WEBHOOK-FULFILLMENT-01`: payment records, entitlements, audit logs.
6. `REVENUE-OS-OWNER-DASHBOARD-PAID-STATUS-01`: dashboard paid/placement/receipt display.
7. `REVENUE-OS-ADMIN-PLACEMENT-CONTROLS-01`: admin pricing, contract, surface, priority controls.
8. `REVENUE-OS-PUBLIC-PLACEMENT-SERVICIOS-RESTAURANTES-01`: first category public placement proof.
9. `REVENUE-OS-AUTOS-BR-ADDON-INVENTORY-01`: dealer/property add-on entitlement proof.
10. `REVENUE-OS-LIVE-LAUNCH-CHECKLIST-01`: live Stripe, webhook replay, refunds, disputes, and rollback.

## 23. Open Owner Decisions

- Confirm Bienes Raices FSBO price: proposed `$49.99 / 45 days`.
- Confirm Autos additional inventory add-on: proposed `+$149/mo` for 10 additional vehicles.
- Confirm Bienes Raices additional inventory add-on: proposed `+$149/mo` for 4 properties.
- Confirm Servicios/Restaurantes coupons/offers add-on price: proposed `$99/mo`.
- Confirm Premium active spot cap per major surface: prompt says 5-7; existing constant is 10 soft cap.
- Confirm whether `partner_premium` should be a first-class tier or metadata over `premium`.
- Confirm Viajes paid business price and affiliate commission model.
- Confirm En Venta Pro stays inactive for V1.

## 24. Manual QA Checklist

1. Verify no new Stripe route, webhook, migration, or `.env` change was added by this gate.
2. Review pricing matrix with Chuy and lock unresolved prices.
3. Review placement tier ordering and category matching rule.
4. Confirm public Cupones remains marketing CMS only.
5. Confirm promo code redemption is not public until schema and checkout gates.
6. Confirm Admin payment tracker remains read-only.
7. Confirm owner dashboard must show listing package, not account membership.
8. Confirm Stripe sandbox gates happen before any live payment expansion.

## 25. Final Recommendation

Proceed with Revenue OS in staged gates. First apply/verify schema contracts for live `leonix_promo_codes`, `leonix_payment_records`, promo redemptions, and normalized placement fields. Then build shared Stripe Checkout and webhook fulfillment in sandbox, with entitlements as the public placement source of truth. Do not expand live payment flows or public premium sorting until idempotency, audit logs, owner dashboard truth, and category-scope ranking are proven.
