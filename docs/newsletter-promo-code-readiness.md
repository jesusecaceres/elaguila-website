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

## 1b. Public newsletter signup → promo code email (ACTIVE)

**Route:** `POST /api/newsletter/subscribe`  
**Email template:** `app/lib/email/newsletterPromoCodeEmail.ts`  
**Client:** `app/(site)/newsletter/NewsletterPageClient.tsx`

Now active:

- Public `/newsletter` signup saves the subscriber (`leonix_newsletter_subscribers`) as before.
- After a successful save, the route **creates or reuses one active `newsletter` promo code** per subscriber email in `leonix_promo_codes` (25% off, one-time, non-stackable, 60-day window).
- The unique code is emailed to the subscriber via the existing Resend helper (bilingual ES/EN).
- Promo email delivery status is stored honestly in the promo-code `metadata` (`email_send_status`: `pending` → `sent` / `failed` / `not_configured`).
- The internal Leonix team notification email is preserved.
- The public success message reflects whether the promo email was sent.

Reuse rule: if the email already has an active `newsletter` code, it is reused (no duplicate rows). Insert collisions regenerate the code up to 3 attempts.

Doctrine preserved: the newsletter promo code discounts a future **website checkout** only (`promo_family: website_launch_25`). It never grants paid placement, ranking, verified status, or premium visibility. `metadata.placement_doctrine = "promo_code_does_not_grant_paid_placement"`.

**Not eligible:** printed magazine packages, magazine print+digital combos, manual contracts/invoices, free posts (En Venta, Comunidad), future renewals unless explicitly approved.

---

## 1c. Website Launch 25 marketing CTA (ACTIVE)

**Component:** `app/components/leonix/LeonixLaunchCouponCard.tsx`  
**Logo:** `/logo-clean.png`

Now active in this gate:

- **`/newsletter`** — positioned as Leonix Launch 25 coupon landing page (card + form; no category selector).
- **`/login?mode=signup`** — compact promo card + copy; links to newsletter with `source=signup_launch_25`.
- **`/dashboard`** — launch benefit card; links to newsletter with `source=dashboard_launch_25`.
- **`/dashboard/perfil?onboarding=1`** — compact benefit card during profile onboarding (`source=profile_onboarding_launch_25`; profile save remains independent).
- **Coming Soon V2** — ES/EN newsletter section copy aligned to 25% launch code.

Account-surface visibility + CTA source tracking is documented in **`docs/launch-25-opportunity-audit-01.md`**.

Admin promo-code lookup clarity (delivery status, follow-up guidance, newsletter filter) is documented in **`docs/admin-promo-code-clarity-01.md`**.

Promo Admin OS V2 (generator guidance, preset directory, client-side recent-code filters, operational cards) is documented in **`docs/admin-promo-code-os-v2.md`**.

Public promise: **“Get 25% off your first eligible Leonix website ad or package.”**

Internal promo family: `website_launch_25` (stored in promo-code metadata; `code_type` remains `newsletter` for admin filters).

Capture channels (`metadata.capture_channel`): `newsletter_signup`, `account_signup`, `dashboard`, `profile_onboarding`, `coming_soon_signup`.

Eligibility enforced later at **website Stripe checkout only** — not at signup.

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
| Public newsletter signup form | **Active** at `/newsletter` |
| Email sending | **Active** via Resend for Launch 25 codes |
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

## 6b. Website Launch 25 checkout redemption (ACTIVE — WEBSITE-LAUNCH-25-CHECKOUT-REDEMPTION-WIRING-01)

`website_launch_25` codes now redeem at eligible website checkout surfaces (website checkout only):

- Eligible package keys only: `rentas_30d`, `empleos_job_post_paid`, `autos_privado_30d`, `restaurantes_base_monthly`. All other products (print/combo/manual/free/renewal/unknown) are rejected.
- The code is applied client-side (shared `RevenuePromoField`, or the Restaurantes `PublishCheckoutCheckpoint`), then **revalidated server-side** in `POST /api/revenue-os/checkout`, which uses the server `finalAmountCents` for the Stripe session amount.
- Discount is server-owned (`percent_off`/`amount_off_cents`); it is never inferred from the code text.
- Redemption is **webhook-only**: the code is marked redeemed only after a successful Stripe payment webhook. Abandoned or cancelled checkouts never consume the code.
- Still **no** placement/ranking/verification/entitlement is granted by the code, and one-time/non-stackable limits are enforced via `redemption_count` / `max_redemptions`.

## 7. Still NOT active (future gates)

See also **`docs/newsletter-operations-readiness.md`** for the full admin operations runbook (manual export/copy/mailto workflow vs future bulk campaign sender).

**Sales handoff:** step-by-step Google Sheets + Gmail BCC workflow is in **`docs/newsletter-sales-contact-ops.md`**. Current launch workflow is manual export/copy/mailto; true bulk campaign sending is future scope.

- Double opt-in confirmation
- Unsubscribe management from the promo email
- Dedicated email-event table (delivery/open/click log) — status currently lives on the promo-code metadata only
- SMS sending
- User dashboard **“My active code”** status panel (benefit card links to newsletter only)
- Automatic package entitlement creation from a newsletter code
- Stripe **Coupon object** creation/sync (discount is applied via server-computed final amount, not a Stripe Coupon)
- Promo support for categories not yet on central Revenue OS checkout (Servicios, Bienes privado, Ofertas Locales, Autos negocio/dealer, Nuestros Negocios)
- Public ranking / placement boost
- Print/combo/admin contract promo system

## 8. Manual QA checklist (public newsletter signup)

1. Submit `/newsletter` with a new email.
2. Confirm a subscriber row exists in `leonix_newsletter_subscribers`.
3. Confirm a `leonix_promo_codes` row exists with `code_type = newsletter`.
4. Confirm `metadata.email_send_status` is `sent` / `failed` / `not_configured` honestly.
5. Submit the same email again → confirm the active newsletter code is reused, not duplicated.
6. Confirm the public success message reflects the promo email status.
7. Confirm the internal Leonix team notification still sends (or logs the same warning as before).
8. Confirm no package entitlement was created.
9. Confirm no public ranking/placement changed.
10. Confirm `npm run build` passes.

---

## 9. Public Launch 25 placements (Home + Digital Magazine)

**Gate:** LAUNCH-25-PUBLIC-PLACEMENTS-01

| Surface | Route | Newsletter source |
|---------|-------|-------------------|
| Home / Inicio | `/home?lang=es` | `source=home` |
| Digital magazine | `/magazine?lang=es` | `source=digital_magazine` |

Both use `LeonixLaunchCouponCard` (`variant="compact"`) with `sourceCta=launch_25`. No newsletter API or checkout changes in this gate.

**Verifier:** `npm run verify:launch-25-public-placements`
