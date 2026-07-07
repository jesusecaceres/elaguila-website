# Newsletter / SMS Promo Code Readiness (Admin Gate)

**Gate:** Promo Admin OS polish + newsletter-code readiness  
**Route:** `/admin/workspace/promo-codes`  
**Code:** `app/admin/(dashboard)/workspace/promo-codes/*`, `app/admin/_lib/promoCodeConstants.ts`, `app/admin/_lib/packageEntitlementConstants.ts`

**Related:** [`promo-code-lifecycle-model.md`](./promo-code-lifecycle-model.md), [`pricing-promo-code-sales-model.md`](./pricing-promo-code-sales-model.md)

---

## 1. Core doctrine

| Concept | Role |
|---------|------|
| **Promo code** | Discount, tracking, campaign attribution, or subscriber identity handle. |
| **Package entitlement** | Actual paid visibility, sorting, placement, and monetization truth. |

A promo code must **never** automatically grant:

- Premium / Destacado placement
- Full-page priority
- Nuestros Negocios placement
- Inventory add-ons
- Paid ranking or sorting boost
- Verified status

Only active package entitlements / payment records control placement.

---

## 2. What this gate does

- **Admin UI copy polish** — clearer headers, helpers, and Revenue OS framing on the promo-code create form.
- **Promo purpose labels** — business-friendly dropdown labels (values unchanged: `entitlement`, `discount`, `newsletter`, `sms`, etc.).
- **Newsletter preset** — `newsletter_launch_25` quick preset (draft by default; email send is later).
- **Newsletter/SMS identity readiness** — server requires email for `newsletter`, phone for `sms` on create.
- **Metadata readiness** — JSON metadata on create includes delivery channel, `not_sent` status, normalized identity, and `source_page`.
- **Friendly admin errors** — plain-English messages for validation failures.
- **Recent-code readability** — purpose badges, delivery status (honest), discount/scope/customer lines.

---

## 3. What this gate does NOT do

| Out of scope | Notes |
|--------------|-------|
| Public newsletter signup form | Not built |
| Email sending | `email_send_status: not_sent` — no provider integration |
| SMS sending | `sms_send_status: not_sent` — no provider integration |
| Newsletter subscriber table | Not created |
| Email event log | Not created |
| Stripe activation | Unchanged |
| Public ranking / placement changes | Unchanged |
| Entitlement creation automation | Only optional link field; no auto-create |
| Public Cupones / Ofertas Locales CMS | Separate system |

---

## 4. Newsletter / SMS metadata (on create)

When `code_type` is `newsletter` or `sms`, `createPromoCodeAction` adds metadata:

```json
{
  "source": "admin_promo_code_manager",
  "created_via": "promo_admin_os_polish_newsletter_readiness",
  "source_page": "admin_workspace_promo_codes",
  "subscriber_identity_required": true,
  "intended_delivery_channel": "email | sms",
  "email_send_status": "not_sent",
  "sms_send_status": "not_sent",
  "customer_email_normalized": "...",
  "customer_phone_normalized": "..."
}
```

Delivery status is **never** faked as `sent` unless a future email/SMS pipeline updates it.

---

## 5. Validation rules (create)

| Promo purpose | Required field | Error key |
|---------------|----------------|-----------|
| `newsletter` | `customer_email` | `newsletter_email_required` |
| `sms` | `customer_phone` | `sms_phone_required` |
| `discount` | percent or amount | `discount_value_required` |

Discount fields (percent/amount) may also be saved for `newsletter` / `sms` when provided — they do not grant placement.

---

## 6. Manual QA checklist

- [ ] Create discount-only Restaurante code (preset or manual)
- [ ] Create auto-generated code (leave code blank)
- [ ] Try duplicate custom code → friendly duplicate error
- [ ] Try newsletter code **without** email → friendly `newsletter_email_required` error
- [ ] Try newsletter code **with** email → metadata shows `not_sent`, recent row shows delivery badge
- [ ] Try SMS code **without** phone → friendly `sms_phone_required` error
- [ ] Confirm recent-code row shows purpose, scope, customer, discount, status
- [ ] Confirm package entitlement ID remains optional
- [ ] Confirm no public Cupones page changed
- [ ] Confirm no Stripe checkout changed
- [ ] Confirm `npm run build` passes

---

## 7. Future gates

- Public newsletter signup → generate unique `newsletter` code per subscriber
- Email provider integration → update `email_send_status` to `sent` / `failed`
- SMS provider integration → update `sms_send_status`
- Checkout validation for newsletter/SMS codes at apply time (category/package scoped)
