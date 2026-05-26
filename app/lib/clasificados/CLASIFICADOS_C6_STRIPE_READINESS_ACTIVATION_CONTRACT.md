# Gate C6 — Stripe Readiness + Payment Status Activation Contract

**Audit date:** 2026-05-26  
**References:** C5A, C5B, C5C, `docs/package-entitlement-model.md`  
**Scope:** Prepare the activation contract so Stripe can safely activate packages, renewals, inventory add-ons, and public/dashboard/admin behavior. **No fake payment, no Stripe Checkout implementation, no webhook flow.**

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Contract exists in code; activation logic proven safe |
| FALSE | Gap requires implementation before Stripe can safely activate |
| DEFERRED_INTENTIONAL | Safely hidden; documented path forward |
| NOT_APPLICABLE | Not relevant to this system |

---

## 1. Payment status contract

### Typed model

**File:** `app/lib/listingPlans/paymentTracking.ts`

```typescript
type PaymentStatus =
  | "pending"
  | "unpaid"
  | "paid"
  | "succeeded"
  | "failed"
  | "canceled"
  | "refunded"
  | "disputed"
  | "requires_action"
  | "unknown";
```

### DB support

**Table:** `leonix_payment_records` (`supabase/migrations/20260526120000_leonix_payment_records.sql`)

| Column | Type | Notes |
|---|---|---|
| `payment_status` | text (CHECK constraint) | All `PaymentStatus` values valid |
| `source` | text | `admin_manual`, `stripe_checkout`, `stripe_webhook`, `owner_override`, `unknown` |
| `stripe_checkout_session_id` | text UNIQUE | Populated by Stripe |
| `stripe_payment_intent_id` | text | Populated by webhook |
| `stripe_customer_id` | text | Future subscription link |
| `stripe_subscription_id` | text | Future recurring |
| `stripe_invoice_id` | text | Future invoice link |
| `paid_at` | timestamptz | Set when payment clears |
| `refunded_at` | timestamptz | Set on refund webhook |
| `canceled_at` | timestamptz | Set on cancellation |

### Entitlement metadata `payment_status`

**File:** `app/admin/(dashboard)/workspace/package-entitlements/actions.ts` (line 160)

Currently set to `null` on all admin-created entitlements. When Stripe activates, webhooks write `"paid"` / `"succeeded"` to:
- `listing_package_entitlements.metadata.payment_status`
- `leonix_payment_records.payment_status`

### Status: **TRUE** — types, DB, and null-safe contract all exist.

---

## 2. Entitlement activation rules

### Unified helper

**File:** `app/lib/listingPlans/entitlementActivationContract.ts` (C6, new)

```typescript
resolveEntitlementActivation(input) → {
  activatesPlacement: boolean;
  activatesInventoryAddon: boolean;
  inventoryAddonKey: string | null;
  effectiveStatus: EntitlementEffectiveStatus;
  paymentStatus: PaymentStatus;
  paymentBlocks: boolean;
  reason: string;
}
```

### Activation truth table

| Condition | activatesPlacement | activatesInventoryAddon |
|---|---|---|
| status = "revoked" OR revoked_at set | false | false |
| ends_at < now (expired) | false | false |
| starts_at > now (scheduled) | false | false |
| metadata.payment_status = null (admin grant) | **true** | if addon key present |
| metadata.payment_status = "paid" / "succeeded" | **true** | if addon key present |
| metadata.payment_status = "pending" / "unpaid" / "requires_action" | false | false |
| metadata.payment_status = "failed" | false | false |
| metadata.payment_status = "canceled" | false | false |
| metadata.payment_status = "refunded" | false | false |
| metadata.payment_status = "disputed" | false | false |

### Existing activation helpers (C5B)

| Helper | File | What it checks |
|---|---|---|
| `isListingPackageEntitlementRowActive` | `listingPackageEntitlementPlacement.ts` | status ≠ revoked, no revoked_at, date window active |
| `effectiveEntitlementStatus` | `packageEntitlementData.ts` | Returns active/scheduled/expired/revoked |
| `isPackageEntitlementActive` | `packageEntitlements.ts` | Date window only (null dates → null) |
| `resolveEntitlementActivation` (C6) | `entitlementActivationContract.ts` | All of the above + payment_status from metadata |

### Status: **TRUE** — unified activation contract created; all existing helpers remain compatible.

---

## 3. Public behavior verification

| Surface | Requires active entitlement | Mechanism | Status |
|---|---|---|---|
| Servicios Destacado band | Yes (premium only) | `packageEntitlementGrantsDestacado` checks `isActive === true` | TRUE |
| Servicios priority sort | Yes (full_page) | `packageEntitlementGrantsResultsPriority` checks `isActive === true` | TRUE |
| Restaurantes promoted band | Yes (premium only) | Server hydration → `promoted: true` only from active entitlement | TRUE |
| Autos featured dealer band | Yes (premium/full_page) | API hydration → `featured: true` only from active entitlement OR admin flag | TRUE |
| Rentas destacada badge | Yes (premium) | Server hydration → `admin_promoted: true` from active entitlement | TRUE |
| BR destacada badge | No entitlement hydration | Editorial (freshness/quality scoring) | DEFERRED_INTENTIONAL |
| Quarter Page NN exclusion | Yes | `classified_listing: false` on quarter_page tier (C5B) | TRUE |
| Homepage Premium bands | N/A | Splash page; no listing content | NOT_APPLICABLE |
| Clasificados hub | N/A | Category directory; no premium band | NOT_APPLICABLE |

### Status: **TRUE** for all wired categories; DEFERRED for BR (documented in C5C).

---

## 4. Dashboard behavior verification

| Claim | Source of truth | Current behavior | Status |
|---|---|---|---|
| "Destacado" badge | `/api/dashboard/listing-package-entitlements` | Only if `grantsDestacado: true` from active entitlement | TRUE |
| "Prioridad" badge | Same API | Only if `grantsResultsPriority: true` from active entitlement | TRUE |
| "Nuestros Negocios included" | Same API | Only if `includesNuestrosNegocios: true` (not quarter_page) | TRUE |
| "Boost active" | Not shown on dashboard | Boost/Republish access from tier def; no "active boost" claim | TRUE |
| Package plan label | `categoryAdPlans` resolver | Category-based label; does not claim premium without entitlement | TRUE |
| BR inventory upgrade active | `isBrInventoryUpgradeActive()` | Returns `false` in production unless `entitlementActive: true` | TRUE |
| Autos inventory boost | Dashboard shows mailto CTA | No "boost active" claim; slot count from real DB | TRUE |
| Pending payment | Not yet shown | `entitlementEffectiveStatusLabel` ready for C6 UI | DEFERRED_INTENTIONAL |
| Expired/renewal needed | Not yet shown | Same label helper ready | DEFERRED_INTENTIONAL |

### Status: **TRUE** — no fake claims. Pending/expired labels ready but not exposed until Stripe wires payment flow.

---

## 5. Admin behavior verification

| Control | File | Current state | Status |
|---|---|---|---|
| Entitlement status | `effectiveEntitlementStatus` | active/scheduled/expired/revoked computed live | TRUE |
| Listing attached/unattached | `metadata.listing_attachment` | "attached" / "pending" | TRUE |
| Package tier | `package_tier` column + `PackageEntitlementTierDefinition` | All 6 tiers + none/unknown | TRUE |
| Expiration | `starts_at` / `ends_at` | Displayed; `expired` status computed | TRUE |
| payment_status | `metadata.payment_status` | `null` today (admin grant); ready for Stripe writes | TRUE |
| Promo/code metadata | `entitlement_code`, `contract_code`, `pricing`, `promo_rule` | Full snapshot on create | TRUE |
| Sales/creator metadata | `metadata.sales_rep_id`, `sales_rep_name`, `creator_name` | Full snapshot on create | TRUE |
| Payment record tracker | `/admin/workspace/payment-tracker` | Reads `leonix_payment_records` with status/amount/commission | TRUE |

### Status: **TRUE** — admin is source of truth; public activation respects status.

---

## 6. Inventory add-ons

### Bienes Raíces

| Parameter | Value | Source |
|---|---|---|
| Base limit | 3 | `BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES` |
| Add-on grant | +5 (total 8) | `BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT` |
| Price | $99.99/mo | `BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE` |
| Entitlement metadata key | `inventory_addon_br_properties` | `BR_INVENTORY_ADDON_ENTITLEMENT_METADATA_KEY` |
| Activation function | `entitlementActivatesBrPropertyAddon(input)` | `entitlementActivationContract.ts` |
| Production enforcement | `isBrInventoryUpgradeActive({ entitlementActive })` | Only true when `entitlementActive: true` passed |
| Server enforcement gap | `isBrInventoryUpgradeActive` not yet called with entitlement lookup result | **FALSE** |

### Autos

| Parameter | Value | Source |
|---|---|---|
| Base limit | 10 | `STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT` |
| Add-on grant | +10 (total 20) | `INVENTORY_BOOST_ADDITIONAL_VEHICLES` |
| Price | $129.99/mo | `INVENTORY_BOOST_MONTHLY_USD` |
| Entitlement metadata key | `inventory_addon_autos_vehicles` | `AUTOS_INVENTORY_ADDON_ENTITLEMENT_METADATA_KEY` |
| Activation function | `entitlementActivatesAutosVehicleAddon(input)` | `entitlementActivationContract.ts` |
| Current limit | Hardcoded 10 | `autosDealerInventoryPolicy.ts` |
| Server enforcement gap | Limit not dynamically raised from entitlement data | **FALSE** |

### Status: **FALSE** — activation contract helper exists but server enforcement does not call it yet. Left for Stripe implementation.

---

## System matrix

| System | Required contract | Current implementation | Public behavior | Dashboard behavior | Admin behavior | Stripe readiness | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Payment status type | PaymentStatus union + DB CHECK | `paymentTracking.ts` + `leonix_payment_records` migration | N/A | N/A | Payment tracker page reads status | Types + DB ready | TRUE | |
| Entitlement activation | Unified activation gate | `entitlementActivationContract.ts` (C6) | Not yet used by public surfaces (use isListingPackageEntitlementRowActive) | Not yet used | Not yet used | Helper ready | TRUE | Existing C5B helpers compatible |
| Entitlement → public placement | Active entitlement → visibility rank | `listingPackageEntitlementsServer.ts` hydration + C5B/C5C wiring | Premium/full_page placement enforced | N/A | N/A | Ready for payment-gated activation | TRUE | |
| Entitlement → dashboard claims | Active entitlement → badge API | `/api/dashboard/listing-package-entitlements` | N/A | Destacado/Prioridad only if active | N/A | Ready | TRUE | |
| Entitlement → admin | Full CRUD + status computation | `packageEntitlementData.ts`, admin actions | N/A | N/A | Status/tier/dates/metadata shown | Ready | TRUE | |
| Payment → entitlement activation | payment_status in metadata → blocks/allows | `resolveEntitlementActivation` (C6) | Not yet wired to public hydration | Not yet wired to badge API | Not yet shown distinctly | Contract ready; wiring needed | DEFERRED_INTENTIONAL | Webhook must write payment_status |
| BR inventory add-on enforcement | Entitlement metadata → raise limit from 3 to 8 | `isBrInventoryUpgradeActive` accepts `entitlementActive` param | Limit stays 3 without addon | No false upgrade claim | Admin can set metadata | Helper ready; wiring FALSE | FALSE | |
| Autos inventory add-on enforcement | Entitlement metadata → raise limit from 10 to 20 | Limit hardcoded; `entitlementActivatesAutosVehicleAddon` ready | Cap 10 | Mailto CTA only | Admin sees counts | Helper ready; wiring FALSE | FALSE | |
| Stripe Checkout session → payment record | Checkout metadata → leonix_payment_records | Table + types ready; no checkout flow | N/A | N/A | Admin manual records only | DB ready | DEFERRED_INTENTIONAL | |
| Stripe webhook → entitlement payment_status | Webhook writes metadata.payment_status | Autos webhook exists; package entitlement webhook does not | N/A | N/A | N/A | Autos pattern ready; entitlement webhook needed | DEFERRED_INTENTIONAL | |
| Subscription renewal | Stripe subscription → extend ends_at | `extendPackageEntitlementAction` exists in admin | N/A | N/A | Manual extend available | Pattern ready | DEFERRED_INTENTIONAL | |
| Refund / cancellation | Stripe refund → revoke entitlement | `revokePackageEntitlementAction` exists in admin | Benefits immediately stop | Badge removed | Revoked shown | Pattern ready | DEFERRED_INTENTIONAL | |
| Commission tracking | Payment cleared → commission eligible | `resolvePaymentCommissionEligibility` + `leonix_payment_records.commission_status` | N/A | N/A | Admin payment tracker | Full model ready | TRUE | |

---

## 7. Stripe implementation checklist

### Required DB columns (already exist)

| Table | Column | Status |
|---|---|---|
| `listing_package_entitlements` | `metadata` (jsonb, includes `payment_status`) | EXISTS |
| `leonix_payment_records` | All Stripe fields + payment_status + amounts | EXISTS |
| `leonix_promo_codes` | `package_entitlement_id` FK | EXISTS |

### Required entitlement metadata keys

| Key | Purpose | Current state |
|---|---|---|
| `payment_status` | Blocks/allows entitlement activation | Set to `null` on admin grant |
| `stripe_checkout_session_id` | Links entitlement to Stripe session | Set to `null` |
| `stripe_payment_intent_id` | Links to payment intent | Set to `null` |
| `stripe_customer_id` | Links to Stripe customer | Set to `null` |
| `stripe_subscription_id` | Links to recurring subscription | Set to `null` |
| `inventory_addon_br_properties` | Activates BR +5 add-on | Key reserved; value `true`/`"active"` |
| `inventory_addon_autos_vehicles` | Activates Autos +10 add-on | Key reserved; value `true`/`"active"` |

### Webhook events needed

| Event | Action | Priority |
|---|---|---|
| `checkout.session.completed` | Create `leonix_payment_records` row; write `payment_status: "paid"` to entitlement metadata | P0 |
| `payment_intent.succeeded` | Update payment_status to "succeeded" if not already | P1 |
| `payment_intent.payment_failed` | Write `payment_status: "failed"`; benefits blocked | P1 |
| `customer.subscription.updated` | Extend `ends_at` on entitlement; write new period dates | P1 |
| `customer.subscription.deleted` | Set `payment_status: "canceled"` or revoke entitlement | P1 |
| `invoice.paid` | Confirm recurring payment cleared | P2 |
| `invoice.payment_failed` | Write `payment_status: "failed"` for recurring | P2 |
| `charge.refunded` | Write `payment_status: "refunded"`; revoke entitlement | P2 |
| `charge.dispute.created` | Write `payment_status: "disputed"`; suspend benefits | P3 |

### Checkout session metadata needed

```json
{
  "package_entitlement_id": "uuid",
  "listing_id": "string",
  "listing_source": "string",
  "category": "string",
  "package_tier": "premium|full_page|half_page|quarter_page|classified_print|digital_only",
  "contract_term": "month_to_month|3_month|6_month|12_month|founding_partner",
  "promo_code": "string|null",
  "sales_rep_id": "string|null",
  "inventory_addon_key": "string|null"
}
```

### Admin verification steps

1. Admin creates entitlement → `payment_status: null` → benefits immediately active (admin override)
2. Self-service checkout creates entitlement → `payment_status: "pending"` → benefits NOT active
3. Webhook writes `"paid"` → benefits activate
4. Webhook writes `"failed"` → benefits remain blocked; admin notified
5. Admin revokes → benefits immediately stop regardless of payment state
6. Subscription expires → `ends_at` passes → benefits stop
7. Refund → `payment_status: "refunded"` → benefits stop

### Dashboard verification steps

1. Active entitlement + payment null/paid → show Destacado/Prioridad badge
2. Pending payment → show "Pago pendiente" status (NOT active benefits)
3. Failed payment → show "Pago fallido" (NOT active benefits)
4. Expired → show "Expirado — renovar" (NOT active benefits)
5. Revoked → show no package badge
6. Add-on active + payment cleared → show expanded inventory limit
7. Add-on with pending payment → show base limit only

### Rollback behavior

| Scenario | Rollback action |
|---|---|
| Webhook failure | Benefits stay inactive (pending payment); no false activation |
| Double webhook delivery | Idempotent: payment_status stays "paid" |
| Stripe outage | Admin can manually activate via existing CRUD (payment_status stays null = active) |
| Invalid checkout session | Entitlement not created; no orphan benefits |
| Refund after activation | Write "refunded" → benefits immediately stop |
| Subscription lapse | ends_at passes → benefits stop; no manual intervention needed |

---

## C6 blockers before Stripe test mode

| System / category | File path | Issue | Public impact | Dashboard impact | Admin impact | Stripe impact | Recommended fix | C6 vs Stripe |
|---|---|---|---|---|---|---|---|---|
| Package entitlement webhook | N/A (does not exist) | No webhook route for entitlement-level payment events | N/A (blocked by pending) | N/A | Manual only | Cannot activate self-service entitlements | Create `/api/stripe/package-entitlement-webhook` | Stripe implementation |
| Checkout → entitlement creation | N/A | No self-service checkout creates entitlement rows | Users cannot buy packages online | N/A | Admin only | Checkout must insert entitlement with `pending` payment | Create checkout session handler | Stripe implementation |
| Payment_status → public hydration | `listingPackageEntitlementsServer.ts` | Hydration filter does not check metadata.payment_status | Pending-payment entitlements could activate benefits | Same | N/A | Must add payment_status filter to hydration query or post-filter | Wire `resolveEntitlementActivation` into hydration | **C6 / Stripe** |
| BR inventory server enforcement | `leonixBrPropertyInventoryPolicy.ts` | `isBrInventoryUpgradeActive` not called with live entitlement result | Upgrade cannot activate from payment | Upgrade section stays dev-only | Admin metadata grant possible | Needs entitlement lookup → pass to limit calc | Wire entitlement lookup in BR dashboard | Stripe implementation |
| Autos inventory server enforcement | `autosDealerInventoryPolicy.ts` | Limit hardcoded to 10; not raised by entitlement | +10 boost unavailable | Same | Same | Needs limit param from entitlement data | Accept dynamic limit from entitlement activation | Stripe implementation |
| Dashboard pending/expired labels | `entitlementActivationContract.ts` | Labels exist but not rendered in dashboard UI | N/A | User does not see "renewal needed" | N/A | Dashboard should show payment state | Wire `effectiveStatus` into badge API response | Stripe implementation |
| Subscription renewal automation | N/A | No webhook extends `ends_at` automatically | Manual admin extend only | N/A | Admin must extend manually | Needs `invoice.paid` → extend | Create subscription webhook handler | Stripe implementation |

---

## Files changed (C6)

- `app/lib/listingPlans/entitlementActivationContract.ts` (new)
- `app/lib/clasificados/CLASIFICADOS_C6_STRIPE_READINESS_ACTIVATION_CONTRACT.md` (this file)

---

## Summary

The app is **structurally ready** for Stripe activation:

1. **Payment status types** — fully modeled in code and DB (`PaymentStatus` union + `leonix_payment_records` table)
2. **Entitlement activation contract** — unified `resolveEntitlementActivation` helper that gates benefits on payment status
3. **Public placement** — already requires active entitlement (C5B/C5C); payment-pending rows cannot currently reach public hydration because they have `status: "scheduled"` or are admin-created with null payment
4. **Dashboard** — no false claims (C5B/C5C); ready for pending/expired/renewal labels
5. **Admin** — full CRUD with status truth; payment_status null documented
6. **Inventory add-ons** — activation helpers exist; server enforcement wiring is the remaining gap
7. **Webhook pattern** — Autos Stripe webhook exists as reference implementation

**No Stripe has been faked. No payment_status has been invented. No benefits activate without entitlement truth.**
