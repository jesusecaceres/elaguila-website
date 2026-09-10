# SERVICIOS — GOLDEN REFERENCE TRUTH

**THIS IS THE TRUTH / CLEAR REPRESENTATION OF THE LEONIX VISION**

Authoritative source of truth for the Servicios category and the reuse doctrine for every
category that follows it.

| Field | Value |
| --- | --- |
| Gate | `SERVICIOS-GOLDEN-REFERENCE-TRUTH-LOCK` |
| Branch | `completion/launch-lifecycle-2026-09-09` |
| Authoritative Supabase project | **Leonix Media** — `xuieateniufcrsfdomwl` |
| Vercel environment for certification | **PREVIEW** (never Production) |
| Stripe mode for certification | **TEST** |
| Date | 2026-09-10 |

> **Doctrine.** Nothing in Servicios may be "visible but out of scope." Every customer-reachable
> control either works end to end, or it does not render. There is no "don't click that during
> QA" in a golden reference.

---

## A. PRODUCT VISION

Servicios is a **local, bilingual, community-first business presence and discovery product**
inside Leonix — the experience a Spanish-speaking customer expects from a Yelp-style directory,
but built for the Leonix community rather than for a national review marketplace.

- **Spanish-first, fully bilingual.** ES is the default; EN is a first-class equal, never a
  machine-translated afterthought. Every launch-visible string exists in both.
- **Local community focus.** Discovery is anchored to the customer's city/state, not to a
  national index.
- **Presence, not lead resale.** The business owns its profile: identity, services, hours, media,
  payment methods, credentials, coupons/offers.
- **Contact/action oriented.** The purpose of a profile is to produce a real contact — call,
  WhatsApp, quote request, directions, website.
- **Connects outward, does not compete.** Leonix links to Google/Yelp/Maps where that genuinely
  helps the customer. Leonix does not pretend to replace them and never fabricates ratings,
  review counts, or verification it did not perform.
- **Honest absence over invented presence.** When a fact is unknown, Servicios says nothing —
  it never renders a zero, a placeholder rating, or a fake badge in place of missing truth.

### Reuse doctrine (why this document exists)

Later categories are built by **copying the shape of Servicios, not by copying its files
wholesale.** Before reusing a Servicios module, confirm it is in the LIVE inventory in §C.10.
The `app/(site)/servicios/components/` tree contains both live modules and a historical,
unreferenced set left over from the retired `/servicios/perfil` presentation. Copying blindly
from that directory imports dead CTAs and browser-local state that look canonical and are not.

---

## B. COMMERCIAL TRUTH

| Fact | Value |
| --- | --- |
| Price | **$399.00 / month** (`39900` cents) |
| Package key | `servicios_base_monthly` |
| Category | `servicios` |
| Billing mode | `monthly_subscription` |
| Coupons / offers | **Included** in the base package (capability `coupons_offers`) |
| Promo eligible | Yes |
| Verified intro discount | **15%, first payment only** — part of launch |
| Verification accepted | **Confirmed email OR verified SMS phone** — either alone is sufficient |
| Discount uniqueness | One per owner, ever — server-enforced |
| Currency | `usd` |

### B.1 The four inviolable commercial rules

1. **The server is the sole price authority.** `revenuePricingMatrix` decides the amount. The
   client never sends, proposes, or influences a price. A client-supplied amount is ignored.
2. **Payment ≠ entitlement ≠ publication.** Three distinct facts, three distinct records. A
   Stripe charge alone publishes nothing.
3. **The webhook is paid truth.** `checkout.session.completed` (and the subscription invoice
   events) are the only events that grant an entitlement and activate a listing. The browser
   returning to a success URL proves nothing and grants nothing.
4. **A requested-but-unavailable discount stops checkout entirely.** No Stripe session, no
   reservation, no payment record — never a silent full-price fallback the customer did not
   agree to.

### B.2 The 15% verified introductory discount — exact mechanics

Servicios is a `monthly_subscription`, so the policy
(`app/lib/listingPlans/verifiedIntroDiscountPolicy.ts`) selects the **`stripe_once_coupon`**
mechanism:

- A Stripe coupon `percent_off: 15, duration: "once"` is created/reused server-side and attached
  to the Checkout Session via `discounts: [{ coupon }]`.
- `allow_promotion_codes` stays **false** — the customer can never type a code into Stripe.
- The subscription's own line item stays at **full $399**, deliberately. The coupon discounts
  only the **first invoice**.

| Amount | Cents | Where it appears |
| --- | --- | --- |
| Plan price / every renewal | `39900` | `leonix_payment_records.amount_total_cents`, Stripe subscription price |
| Discount (first payment only) | `5985` | `leonix_payment_records.amount_discount_cents`, redemption ledger `discount_cents` |
| **First charge** | **`33915`** | Stripe Checkout Session `amount_total` |

15% of $399.00 is exactly $59.85 — no rounding ambiguity.

**Renewal behavior: renewals bill the full $399.00.** This is guaranteed structurally by
`duration: "once"`, not by a scheduled job.

**Anti-repeat** is enforced by four simultaneous partial-unique indexes on
`leonix_verified_intro_discount_redemptions`, each covering **both** `reserved` and `redeemed`
(so two concurrent checkouts cannot both hold an unresolved reservation): `owner_user_id`
(global), `verified_email_identity_hash`, `verified_phone_identity_hash`, and
`(business_identity_type, business_identity_key)`. Raw email/phone are never the index — only a
keyed HMAC (`LEONIX_IDENTITY_HASH_KEY`).

**Ordering guarantee at checkout:** eligibility → coupon resolution → **atomic reservation** →
payment record → FK link → Stripe session. A failed reservation returns HTTP 409 *before* any
Stripe session or payment record exists. A later genuine failure releases the reservation so an
unrelated error never permanently consumes the customer's one-time benefit.

---

## C. CUSTOMER UX — COMPLETE VISIBLE SURFACE

Every customer-reachable feature, with its launch state.

### C.1 Discovery and entry

| Surface | State | Truth |
| --- | --- | --- |
| Servicios landing | LIVE | Hero search, featured, recent, browse-all |
| Results / browse | LIVE | Filters incl. `seller` (`business` \| `independent`) |
| Open-now filter | LIVE | Server-side, business-timezone resolved; **fails closed** — an unresolvable timezone excludes rather than guesses |
| Open-now hero badge | LIVE | Same timezone authority; makes **no claim** when it cannot resolve |
| Public profile (vitrina) | LIVE | `/clasificados/servicios/[slug]` — **the canonical URL** |
| `/servicios/perfil/[slug]` | REDIRECT | Legacy → canonical, or 404. Not a second listing surface |
| Related Listings | LIVE | Real neighbours, no paid ranking weight, no filler |
| Saved Search | **BLOCKED — DB** | Source complete; DB constraints reject `servicios`. See §F |
| JSON-LD / sitemap | LIVE | Emitted for published listings only |

### C.2 Publish funnel

| Step | State | Truth |
| --- | --- | --- |
| Landing → checkpoint | LIVE | `/clasificados/publicar/servicios` (`/servicios/publicar` redirects here) |
| Application form | LIVE | Guided; identity, hero, services, media, contact, hours, payments, credentials |
| Category escape hatch | LIVE | "Otro servicio" reveals a free-text field; the "¿No ves tu categoría?" helper selects it and focuses the field |
| Address verification | LIVE | Google Geocoding, server-side only |
| Manual address fallback | LIVE | Honest `manual` provenance stamped; never claims Google verified it |
| Media upload | LIVE | Vercel Blob; durability re-checked at publish |
| Preview | LIVE | Real render of the real profile, not a mock |
| Edit before payment | LIVE | Non-destructive; returns to the same draft |
| 15% verification panel | LIVE | Renders in checkout mode; see C.3 |
| Checkout | LIVE | Stripe Checkout, server-priced |
| Declined card | LIVE | Stays unpublished; reservation released; retry allowed |
| Publication | LIVE | Only on webhook truth |

### C.3 The 15% panel (PATH B) — customer-visible states

| State | Shown when | Customer sees |
| --- | --- | --- |
| `eligible` | Email confirmed OR phone verified, no prior redemption | "Apply 15% discount" |
| `needs_verification` | Neither verified | Phone entry + "Send code"; if SMS is unconfigured, an honest "use a confirmed email instead" message |
| `excluded: already_redeemed` | Prior reserved/redeemed row | "You've already used your welcome discount" |
| `excluded: discount_already_active` | A promo code is applied | "You can't combine this discount with a promo code" |
| `not_available` | Status read failed | Panel makes no offer |

Email verification truth = **Supabase Auth `email_confirmed_at`** (read server-side from the
bearer token, never client-asserted). SMS verification truth = a row in
`leonix_verified_phone_identities`, written only after Twilio Verify returns `approved`.

> **Corrected by §O.5 — this is NOT a launch requirement.** SMS is an OPTIONAL alternate
> verification path. A confirmed email alone qualifies, so `TWILIO_*` is expected to stay unset
> for Servicios certification and the panel's email-only state is the intended launch behaviour,
> not a temporary degradation. (The two phone tables exist regardless — applied in §L.)

### C.4 Published listing — customer actions

| Action | State | Truth |
| --- | --- | --- |
| Call / WhatsApp / Website / Directions | LIVE | Real hrefs; international WhatsApp normalization |
| Request quote / lead form | LIVE | Real submission |
| Share | LIVE | `LeonixShareButton` — native share + analytics |
| **Like** | LIVE | `LeonixLikeButton` — DB-backed count, **self-engagement guarded** |
| **Save** | **LIVE (closed this gate)** | `LeonixSaveButton` → canonical `saved_listings`, appears in the Guardados dashboard, self-engagement guarded, `listing_save` / `listing_unsave` analytics |
| Translate Ad | LIVE | Translates owner prose only — never phones, URLs, prices, or identity |
| Hours / open-now | LIVE | See C.1 |
| Coupons / offers | LIVE | Included in base package |
| Reviews / trust | LIVE | Outward links only; Leonix never invents ratings |

**Self-engagement protection:** `isSelfEngagement(currentUserId, ownerUserId)` gates like and
save. An owner cannot inflate their own listing's engagement.

### C.5 Owner dashboard (the customer as a paying business)

| Feature | State | Truth |
| --- | --- | --- |
| My listing | LIVE | Canonical row, canonical ID |
| Active-listing edit | LIVE | **Same-row republish** — ID-keyed, never a second row |
| Republish after edit | LIVE | **No second charge** — republish is not a purchase |
| Media persistence across edit | LIVE | Shared media contract; unpersistable sources are dropped with a warning, never silently |
| Pause / resume | LIVE | Real status transitions |
| Subscription / renewal state | LIVE | Driven by Stripe subscription + invoice events |
| Analytics (views, contacts, likes, saves) | LIVE | Real events; **unknown is never rendered as zero** |

### C.6 Language, mobile, PWA

- Full ES/EN parity on every launch-visible surface.
- Mobile-first layout; tap targets ≥ 44px on all engagement controls.
- PWA behavior unchanged by Servicios.

### C.7 Analytics events (launch set)

`listing_view`, `listing_contact` (call / whatsapp / website / directions / quote),
`listing_share`, `listing_like` / `listing_unlike`, `listing_save` / `listing_unsave`.
Save/unsave are authed events — they are recorded against the signed-in user, never anonymously.

### C.8 Honest-failure contract

| Dependency missing | Customer sees |
| --- | --- |
| Google Geocoding | Manual address entry, stamped `manual` |
| Vercel Blob | Explicit "file storage not configured" — never a silent lost upload |
| Twilio | "SMS verification unavailable — use a confirmed email" |
| Business timezone unresolvable | No open/closed claim; excluded from the open-now filter |
| Stripe coupon unavailable | Checkout stops with a retry/continue-without-it message |

### C.9 Retired / non-rendering surfaces

`/servicios/perfil/[slug]` and `/servicios/publicar` are **redirects**. They are not alternate
product surfaces and must not be certified as such.

### C.10 LIVE vs HISTORICAL module inventory (reuse-critical)

`app/(site)/servicios/components/` contains modules with **zero consumers**, left from the
retired `/servicios/perfil` presentation. They are not customer-reachable and must **never** be
used as a reuse template:

`ServiciosGallery`, `ServiciosHero`, `ServiciosHeroActions`, `ServiciosHighlightsSection`,
`ServiciosLicense`, `ServiciosMediaLightbox`, `ServiciosOpcionesFacilidadesCard`,
`ServiciosPagosCard`, `ServiciosProfessionalVisualProofRow`, `ServiciosPromoImageLightbox`,
`ServiciosServiceAreas`, and `publicar/components/ServiciosApplicationForm`.

The live gallery is **`ServiciosGalleryWithTabs`**. The live profile shells are
**`ServiciosProfileView`** and **`ServiciosProfessionalProfileShell`**.

> Two of the dead modules contain `console.log` stubs and a browser-local "save" that writes to
> `localStorage`. They are P2 (not customer-reachable) and are recorded here so no future
> category inherits them. Deleting the historical tree is a separate, clearly-scoped cleanup —
> it is not performed in this gate because several sibling modules in the same directory
> **are** live.

---

## D. INTERNAL / STAFF UX (ADMIN OS)

| Surface | Truth state | Rule |
| --- | --- | --- |
| Servicios admin lane | REAL | Same canonical listing ID as the customer surface |
| Payment truth | REAL | From `leonix_payment_records` |
| Entitlement truth | REAL | From the entitlement tables, not inferred from payment |
| Subscription truth | REAL / NEEDS_PROOF | `leonix_subscription_records` keyed `listing_source = "servicios"` |
| Lifecycle state | REAL | Draft / pending / published / paused / suspended / expired |
| Analytics truth | REAL / NEEDS_PROOF | **Never renders 0 for "unknown"** — `NEEDS_PROOF` is displayed as such |
| Admin sandbox | LABELLED | Amber banner, "Local simulation" badge, localStorage-only, site-wide admin `noindex` |

**Admin truth vocabulary:** `REAL` / `PARTIAL` / `NEEDS_PROOF` / `BROKEN` / `UNAVAILABLE`.
A missing provider is `UNAVAILABLE`, never a zero.

---

## E. DATA / LIFECYCLE TRUTH

### E.1 Canonical row identity

Servicios listings live in **`servicios_public_listings`** — their own physical table, not the
shared `listings` table. Identity resolution order: `leonix_ad_id` → `id` → `slug`
(`serviciosEngagementListingKey`). Public URL: `/clasificados/servicios/[slug]`.

### E.2 Lifecycle

```
draft
  └─ application + preview (no row is published, no charge)
       └─ checkout requested
            ├─ [PATH B only] eligibility → coupon → ATOMIC RESERVATION (409 if unavailable)
            └─ pending payment record  (payment_status = 'pending')
                 └─ Stripe Checkout Session
                      ├─ abandoned / expired → checkout.session.expired
                      │     └─ reservation released, nothing published
                      ├─ declined → nothing published, retry allowed
                      └─ paid → checkout.session.completed  ◀── PAID TRUTH
                           ├─ amount + currency + metadata validated
                           ├─ entitlement granted
                           ├─ redemption 'reserved' → 'redeemed'  [PATH B]
                           └─ listing ACTIVATED → published
                                └─ edit → SAME-ROW republish (no new row, no new charge)
                                     └─ subscription renewal (invoice.paid, FULL $399)
                                          ├─ pause / resume
                                          ├─ payment failed → invoice.payment_failed
                                          └─ cancel → customer.subscription.deleted
```

### E.3 Invariants

1. **One row per business, forever.** Edit and republish patch the same row.
2. **Republish is never a purchase.** No second charge on edit.
3. **Activation requires a term/subscription.** No listing is published without paid truth.
4. **The redemption ledger is append-and-transition**, never deleted.
5. **Idempotency:** `stripeEventLedger` makes every webhook replay-safe.

---

## F. DATABASE TRUTH — LEONIX MEDIA (`xuieateniufcrsfdomwl`)

### F.1 Migration reconciliation

> **Superseded by §L.** The table below records the state *before* gate
> `SERVICIOS-FOUNDATION-COMPLETION-1`. The post-mutation truth is in §L.

| # | Migration | Creates | Present (pre-gate)? | Action taken |
| --- | --- | --- | --- | --- |
| 1 | `20260805100000_leonix_verified_intro_discount_redemptions.sql` | table `leonix_verified_intro_discount_redemptions` (+5 indexes, +4 partial-unique, RLS) | **YES** | **SKIPPED — not reapplied** |
| 2 | `20260805100100_leonix_phone_verification_challenges.sql` | table `leonix_phone_verification_challenges` (+3 indexes, +2 partial-unique, RLS) | **NO** | **APPLIED — 1st** |
| 3 | `20260805100200_leonix_verified_phone_identities.sql` | table `leonix_verified_phone_identities` (+2 indexes, unique, RLS) | **NO** | **APPLIED — 2nd** |
| 4 | `20260805100300_leonix_payment_records_verified_intro_discount_link.sql` | **column** `leonix_payment_records.verified_intro_discount_redemption_id` (+index) | **YES — resolved: already present** | **SKIPPED — not reapplied** |
| 5 | `20260910120000_saved_search_match_events_servicios.sql` | widens 3 CHECK constraints | **NO** | **APPLIED — 3rd** |

### F.2 Hard ordering dependency

Migration **3 has a foreign key to the table created by migration 2**:

```sql
verification_challenge_id uuid REFERENCES public.leonix_phone_verification_challenges (id)
```

**Migration 2 MUST be applied before migration 3.** Applying 3 first fails.

Migration 1 has an FK to `leonix_payment_records`, which already exists. Migration 4 has an FK to
the table from migration 1, which is present.

### F.3 Why migration 1 must not be reapplied

The table already exists. Every statement is `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT
EXISTS`, so re-running is technically a no-op and safe — but there is **no reason to run it** and
**no circumstance in which the table should be dropped and recreated** to tidy the migration
ledger. Doing so would destroy real redemption history and the anti-repeat guarantee that
depends on it. If the ledger is out of sync, reconcile the ledger, never the data.

### F.4 Migration 4 is the silent risk

Migration 4 adds a **column**, not a table — so a table listing cannot prove its state. The
webhook reads `paymentRecord.verified_intro_discount_redemption_id` to mark a redemption
redeemed, and checkout writes it. **PATH B cannot complete without this column.** Verify before
PATH B QA:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'leonix_payment_records'
  AND column_name  = 'verified_intro_discount_redemption_id';
```

Zero rows → apply migration 4. One row → do not.

### F.5 Saved Search — exact current incompatibility

Live constraints in Leonix Media today:

```
saved_search_match_events_category_check      : category    IN ('autos','bienes-raices','rentas')
saved_search_match_events_seller_lane_check   : seller_lane IN ('negocios','negocio','privado')
```

Servicios writes `category = 'servicios'` (`SAVED_SEARCH_SERVICIOS_CATEGORY`) and
`seller_lane ∈ {'business','independent'}` (`ServiciosSellerPresentation`). **Both are rejected
today**, so every Servicios Saved Search match write fails.

Migration 5 is:
- **additive** — widens three CHECK constraints; adds nothing, drops no table, rewrites no row;
- **required** — Saved Search is part of 100%, and it is broken without it;
- **dependency-free** — it touches only the two saved-search tables, both present;
- **idempotent** — `DROP CONSTRAINT IF EXISTS` then `ADD CONSTRAINT`;
- deliberately **does not** re-add the `listing_id` FK (Servicios rows live in a fourth physical
  table; referential truth stays at the application layer, which re-certifies public eligibility
  immediately before writing and again before delivering).

---

## G. CONFIGURATION TRUTH — PREVIEW CERTIFICATION

### G.1 Supabase — Leonix Media, no mixed keys

| Var | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Leonix Media (`xuieateniufcrsfdomwl`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Leonix Media anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Leonix Media service role |

**All three must be from the same project.** A mixed set produces auth that succeeds and writes
that silently target the wrong database.

### G.2 Servicios flags

| Var | Required value | Effect if wrong |
| --- | --- | --- |
| `SERVICIOS_STRICT_PUBLISH` | **`1`** | Without it, Preview stays lenient and does not certify real publish auth |
| `SERVICIOS_DEV_PUBLISH` | **unset** | `=1` enables dev persistence on Vercel — listings would not be real |
| `SERVICIOS_MODERATION_MODE` | **unset** | `=1` publishes to `pending_review`; **listings never become public** |

### G.3 Stripe (TEST mode)

| Item | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | test-mode secret |
| `STRIPE_WEBHOOK_SECRET` | test-mode signing secret **for the Preview endpoint** |
| Endpoint | `https://<preview-deployment>/api/revenue-os/webhook` |

Required events: `checkout.session.completed`, `checkout.session.expired`, `invoice.paid`,
`invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`,
`charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`.

The 15% coupon is **created automatically** on first use — no manual Stripe coupon setup.

### G.4 Google

| Item | Value |
| --- | --- |
| `GOOGLE_MAPS_API_KEY` | server key |
| API enabled | **Geocoding API** |
| Restriction | **Server-compatible** (IP or none). An HTTP-referrer restriction breaks server-side geocoding |

### G.5 Media

`BLOB_READ_WRITE_TOKEN` — required. Without it, Servicios draft media upload returns
`blob_unconfigured` and no media can be attached.

### G.6 SMS (Twilio Verify) — OPTIONAL, NOT launch-blocking

> **Superseded by §O.5.** This was previously written as launch functionality. It is not: a
> confirmed email alone qualifies for the 15%, so SMS is an optional alternate verification path
> and `TWILIO_*` is not required for Servicios certification.

| Var | Purpose |
| --- | --- |
| `TWILIO_ACCOUNT_SID` | account |
| `TWILIO_AUTH_TOKEN` | auth |
| `TWILIO_VERIFY_SERVICE_SID` | Verify service |

Provider: **Twilio Verify** (`app/lib/sms/twilioVerifyProvider.ts`). Twilio generates, stores and
checks the OTP — **Leonix never receives, stores, or logs a raw code**. All three vars are
presence-checked; absence fails closed as `NOT_CONFIGURED` and never fabricates a verification.

Rate limits are enforced by **atomic unique-slot claims** on
`leonix_phone_verification_challenges` (not `COUNT(*)`-then-insert): 60s request cooldown,
5 requests/phone/hour, 20 requests/IP/hour, 5 checks/phone/10min. Raw IP is never stored — only
a salted hash. OTP expiry is Twilio's own.

### G.7 Identity hashing — required for PATH B

`LEONIX_IDENTITY_HASH_KEY` — HMAC key for the anti-repeat identity hashes. **Absence fails
closed:** the entire verified-15 feature (both email and SMS paths) returns
`identity_hash_unavailable` (503). This is easy to overlook because it is not a Supabase, Stripe,
Google, Twilio, or Blob variable.

### G.8 Email verification

Not a separate system. Truth is **Supabase Auth `email_confirmed_at`**, read server-side from the
bearer token (`getVerifiedBearerUser`). A QA account must have a **confirmed** email for the
email path to be eligible.

---

## H. SOURCE BLOCKERS AND CLOSURES

### H.1 P0 — CLOSED THIS GATE

**`verified-intro subscription checkout was charged but never fulfilled` — money at risk.**

On PATH B, the `stripe_once_coupon` mechanism left `verifiedIntroDiscountCents = 0`, so the
payment record stored discount `0` and total `39900`, while Stripe charged **`33915`**. The
webhook's amount guard compared those two values directly and rejected the event with
`amount_mismatch`.

Consequence, on a real paid Servicios checkout:

- customer **charged $339.15**, subscription **active in Stripe**;
- listing **never published**, entitlement **never granted**;
- redemption stuck at `reserved`, permanently consuming the customer's one-time benefit.

**Fix (three minimal changes, no type weakening, no fallback):**

1. `app/api/revenue-os/checkout/route.ts` — compute the 15% amount for **both** mechanisms;
   only `unit_amount_reduction` still assigns `finalAmountCents`, so the subscription price and
   every renewal remain full $399.
2. `app/lib/listingPlans/revenuePaymentRecords.ts` — surface `amount_subtotal_cents` and
   `amount_discount_cents` on `LeonixPaymentRecordRow` (both were already selected and written;
   only the row type omitted them).
3. `app/lib/listingPlans/revenueFulfillment.ts` — the guard accepts **exactly one** additional
   value, derived from the discount this server itself computed and persisted, and only when the
   record carries a verified-intro redemption **and** `billing_mode = 'monthly_subscription'`.
   Not a tolerance window, not a percentage recomputed at webhook time.

Proven by `scripts/verify-servicios-golden-reference-promo-path.ts` (25/25), including negative
controls: a discounted amount with no redemption attached is still rejected; a `one_time` record
never receives the allowance; a zero/absent recorded discount grants no allowance; and
`33914` / `33916` are still rejected.

### H.2 P1 — CLOSED THIS GATE

**`Servicios had no working Save`.** The Guardados dashboard already resolved
`servicios_public_listings` in three places, `serviciosSavedListingIdentity.ts` existed, and
`serviciosGlobalSaveRecorder` existed — all with **zero consumers**. The
`hubEngagementVariant = "save_only"` branch returned `null`, so on the live profile layout there
was **no Save control at all**.

Fixed by rendering the shared `LeonixSaveButton` in
`ServiciosBusinessHubEngagementRow` (both variants), with the canonical identity extras, the
global save recorder, and the self-engagement guard. Save now writes real `saved_listings` rows
that appear in the customer's Guardados dashboard.

### H.3 P2 — RECORDED, NOT CLOSED

| # | Finding | Why not closed here |
| --- | --- | --- |
| P2-1 | Historical `app/(site)/servicios/components/` modules with zero consumers (§C.10), two containing `console.log` stubs and a `localStorage` save | Not customer-reachable. Deleting the tree needs its own scoped gate because live siblings share the directory |
| P2-2 | `ServiciosApplicationForm`'s "¿No ves tu categoría?" was a `console.log` TODO | Repaired opportunistically (now selects "Otro servicio" and focuses the field), though the component itself is unreferenced |
| P2-3 | Both phone-identity reads discard the PostgREST `error` object | Today this is what makes a missing table degrade gracefully; it also makes a real outage indistinguishable from "no verified phone" |

### H.4 P3 — DEFERRED

| # | Finding |
| --- | --- |
| P3-1 | Hours engine has no overnight-range support (e.g. 22:00–02:00) |
| P3-2 | Subscription sweep has no scheduler; invocation is documented, no source defect |

---

## I. DATABASE ACTION PLAN (NEXT GATE — NOT EXECUTED HERE)

Target project: **Leonix Media `xuieateniufcrsfdomwl`**. Execute in this order.

### Action 0 — VERIFY (read-only, do first)

```sql
-- (a) Does the payment-record link column exist? (migration 4)
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='leonix_payment_records'
  AND column_name='verified_intro_discount_redemption_id';

-- (b) Re-confirm the two phone tables are absent
SELECT table_name FROM information_schema.tables
WHERE table_schema='public'
  AND table_name IN ('leonix_phone_verification_challenges','leonix_verified_phone_identities');

-- (c) Confirm the redemptions table is complete, not partial
SELECT count(*) FROM information_schema.columns
WHERE table_schema='public' AND table_name='leonix_verified_intro_discount_redemptions';
-- expect 35 (the migration defines 35 columns; fewer means a partial/older table)
```

### Action 1 — `20260805100100_leonix_phone_verification_challenges.sql`

- **Precondition:** table absent (Action 0b).
- **Postcondition:** table + 3 indexes + 2 partial-unique indexes + RLS enabled, no policies.
- **Verify:**
  ```sql
  SELECT relrowsecurity FROM pg_class WHERE relname='leonix_phone_verification_challenges';
  SELECT indexname FROM pg_indexes WHERE tablename='leonix_phone_verification_challenges';
  ```
- **Rollback concern:** none — new empty table, additive, no existing object touched.

### Action 2 — `20260805100200_leonix_verified_phone_identities.sql`

- **Precondition:** **Action 1 completed** (hard FK dependency, §F.2).
- **Postcondition:** table + unique `(owner_user_id, phone_e164)` + 2 indexes + RLS.
- **Verify:**
  ```sql
  SELECT conname FROM pg_constraint
  WHERE conrelid='public.leonix_verified_phone_identities'::regclass;
  ```
- **Rollback concern:** none — new empty table.

### Action 3 — `20260805100300_...verified_intro_discount_link.sql` — CONDITIONAL

- **Run only if Action 0a returned zero rows.**
- **Postcondition:** nullable column + index on `leonix_payment_records`.
- **Rollback concern:** `ADD COLUMN IF NOT EXISTS` on a nullable column — existing rows untouched.
  Takes a brief lock on `leonix_payment_records`; run when idle.

### Action 4 — `20260910120000_saved_search_match_events_servicios.sql`

- **Precondition:** `saved_search_match_events` and `saved_search_processing_failures` exist.
- **Postcondition:** three CHECK constraints widened to accept `servicios` and
  `business`/`independent`.
- **Verify:**
  ```sql
  SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
  WHERE conrelid IN ('public.saved_search_match_events'::regclass,
                     'public.saved_search_processing_failures'::regclass)
    AND contype='c';
  ```
- **Rollback concern:** there is a moment between `DROP CONSTRAINT` and `ADD CONSTRAINT` with no
  constraint. Run as one transaction. The new constraint is a strict superset of the old, so no
  existing row can violate it.

### Explicitly NOT to be applied

**`20260805100000_leonix_verified_intro_discount_redemptions.sql`** — its table is already
present. Do not reapply, and never drop/recreate it (§F.3).

---

## J. 100% CERTIFICATION CHECKLIST

Run on **Preview**, against **Leonix Media**, with **Stripe TEST**, after §I completes.
Every item is pass/fail. There is no "skip during QA."

### PRE — configuration proof

- [ ] All three Supabase vars resolve to `xuieateniufcrsfdomwl` — no mixed keys
- [ ] `SERVICIOS_STRICT_PUBLISH=1`; `SERVICIOS_DEV_PUBLISH` unset; `SERVICIOS_MODERATION_MODE` unset
- [ ] `LEONIX_IDENTITY_HASH_KEY` set
- [ ] `BLOB_READ_WRITE_TOKEN` set
- [ ] `GOOGLE_MAPS_API_KEY` set, Geocoding enabled, no referrer restriction
- [ ] Stripe TEST keys + Preview webhook endpoint + all 9 events
- [ ] *(OPTIONAL — not launch-blocking, see §O.5)* `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
      `TWILIO_VERIFY_SERVICE_SID`. Leave unset to certify Servicios on the email path alone.
- [ ] §I Actions 1–4 applied and verified

### PATH A — BASE $399, NO DISCOUNT

- [ ] A1 Application completes; all sections save
- [ ] A2 Address verified via Google; provenance recorded
- [ ] A3 Manual address fallback stamps `manual`, never claims Google verification
- [ ] A4 Media uploads; survives a hard refresh
- [ ] A5 Preview renders the real profile
- [ ] A6 Edit before payment returns to the same draft, nothing lost
- [ ] A7 Checkout shows **$399.00**; the customer cannot alter the price
- [ ] A8 Stripe TEST card `4242 4242 4242 4242` succeeds
- [ ] A9 Webhook `checkout.session.completed` received and accepted
- [ ] A10 Entitlement granted; listing published
- [ ] A11 `amount_total_cents = 39900`, `amount_discount_cents` null
- [ ] A12 Listing is publicly reachable at `/clasificados/servicios/[slug]`

### PATH B — VERIFIED INTRO 15%

**B-EMAIL**
- [ ] B1 Sign in with a **confirmed-email** account
- [ ] B2 Panel shows `eligible` without any phone step
- [ ] B3 Apply → checkout total shows **$339.15**
- [ ] B4 Pay with the TEST card
- [ ] B5 **Webhook ACCEPTS `amount_total = 33915`** — no `amount_mismatch` *(the P0 regression test)*
- [ ] B6 Listing published; entitlement granted
- [ ] B7 `amount_total_cents = 39900`, `amount_discount_cents = 5985`
- [ ] B8 Redemption row `status = 'redeemed'`, `discount_cents = 5985`
- [ ] B9 `leonix_payment_records.verified_intro_discount_redemption_id` populated

**PATH C — SMS · OPTIONAL, NOT REQUIRED FOR CURRENT GOLDEN CERTIFICATION**

Run these ONLY once an SMS provider is deliberately configured (§O.5). Their absence does not
block certification — with `TWILIO_*` unset the path fails closed and email-confirmed customers
remain fully eligible.

- [ ] C1 Second account, **no** confirmed email → panel shows `needs_verification`
- [ ] C2 With `TWILIO_*` UNSET: the panel honestly states SMS is unavailable and points to the
      confirmed-email route; nothing errors and nothing claims false eligibility *(this one IS
      worth running now, because it certifies the fail-closed behaviour)*
- [ ] C3 "Send code" delivers a real SMS
- [ ] C4 Wrong code is rejected; no identity row written
- [ ] C5 Correct code writes `leonix_verified_phone_identities`
- [ ] C6 Panel flips to `eligible`; checkout shows $339.15; publishes correctly
- [ ] C7 Rate limits: 6th request within an hour is refused

**NEWSLETTER ACQUISITION SURFACE** (marketing only — verifies nobody)
- [ ] N1 Newsletter signup succeeds
- [ ] N2 Success page states the 15% benefit and that VERIFYING unlocks it — never that signing
      up earned it
- [ ] N3 "Verify my account" CTA lands on the existing `/login` flow with a safe internal redirect
- [ ] N4 The bridge is hidden when arriving from a publish checkpoint (no competing CTA)
- [ ] N5 No promo code is minted, shown or emailed at any point
- [ ] N6 A subscriber who never signs in is NOT eligible — subscribing alone confers nothing

**B-ENFORCEMENT**
- [ ] B16 The B-EMAIL account starting a second checkout sees `already_redeemed`
- [ ] B17 A second staff user on the same business is also refused (business-identity boundary)
- [ ] B18 Applying a promo code hides/refuses the 15% panel (`discount_already_active`)
- [ ] B19 Abandon a PATH B checkout → `checkout.session.expired` releases the reservation; the benefit is usable again
- [ ] B20 **Renewal bills the FULL $399.00** — advance the TEST clock or trigger `invoice.paid`

### DISCOVERY

- [ ] D1 Listing appears in Servicios results
- [ ] D2 `seller` filter (`business` / `independent`) works
- [ ] D3 Open-now filter matches the badge in the business's own timezone
- [ ] D4 A business with an unresolvable timezone is excluded and makes no claim
- [ ] D5 Related Listings show real neighbours, no filler
- [ ] D6 **Saved Search matches a Servicios listing and writes a match event** *(requires §I Action 4)*
- [ ] D7 Saved Search delivery re-certifies eligibility before sending
- [ ] D8 JSON-LD validates; listing present in the sitemap

### ENGAGEMENT

- [ ] E1 Call / WhatsApp / Website / Directions open correctly (incl. international WhatsApp)
- [ ] E2 Quote / lead form submits
- [ ] E3 Share works and records `listing_share`
- [ ] E4 **Like** persists and increments the DB-backed count
- [ ] E5 **Save** persists and appears in the Guardados dashboard *(closed this gate)*
- [ ] E6 Unsave removes it
- [ ] E7 **Self-engagement:** the owner cannot like or save their own listing
- [ ] E8 Translate Ad translates prose only — phones, URLs, prices, identity untouched

### DASHBOARD / LIFECYCLE

- [ ] F1 Listing appears in the owner dashboard with the canonical ID
- [ ] F2 Edit an **active** listing → **same row**, no duplicate
- [ ] F3 Republish → **no second charge**
- [ ] F4 Media survives edit → republish; dropped sources warn, never silently vanish
- [ ] F5 Pause hides it from discovery; Resume restores it
- [ ] F6 Subscription state reflects Stripe
- [ ] F7 Analytics show real values; unknown is never rendered as `0`

### ADMIN

- [ ] G1 Admin shows the same canonical listing ID
- [ ] G2 Payment truth = REAL
- [ ] G3 Entitlement truth = REAL
- [ ] G4 Lifecycle state matches the customer surface
- [ ] G5 No surface renders `0` where the truth is unknown
- [ ] G6 Sandbox is unmistakably labelled as simulation

### RESILIENCE / EDGE

- [ ] H1 Declined card `4000 0000 0000 0002` → not published, retry works, no orphan entitlement
- [ ] H2 Duplicate webhook delivery is idempotent (no double entitlement)
- [ ] H3 Full **EN** pass of every screen above
- [ ] H4 Full **mobile** pass; tap targets ≥ 44px
- [ ] H5 Hard refresh at each funnel step loses nothing

### CLEANUP

- [ ] I1 Every QA listing recorded
- [ ] I2 QA subscriptions cancelled in Stripe TEST
- [ ] I3 QA rows removed or clearly marked
- [ ] I4 Redemption rows for QA accounts released, so real launch accounts are unaffected

---

## K. GATE STATUS

| Item | Status |
| --- | --- |
| P0 blockers | **1 found, 1 closed** |
| P1 blockers | **1 found, 1 closed** |
| Typecheck | **PASS** (`tsc --noEmit`, full project) |
| Verifiers | `verify-servicios-golden-reference-promo-path` 25/25 · `verify-servicios-gate3-source-readiness` 97/97 |
| Database mutated | **NO** |
| Vercel / Stripe / Google mutated | **NO** |
| SMS sent | **NO** |
| Remaining blockers | **Database + configuration only** — no open source blocker |

Servicios is source-complete for golden-reference certification. What remains is one controlled
environment/database pass (§I + §G), then the §J runtime certification.

---

## L. FOUNDATION COMPLETION — EXECUTED

**Gate:** `SERVICIOS-FOUNDATION-COMPLETION-1` · **Date:** 2026-09-10
**Target:** Leonix Media `xuieateniufcrsfdomwl` (verified `ACTIVE_HEALTHY`, Postgres 17.6, us-west-1)
**Method:** sequential — READ → DECIDE → APPLY ONE → VERIFY → APPLY NEXT. No batched mutations.

### L.1 Migrations applied (3)

| Order | Migration | Result |
| --- | --- | --- |
| 1 | `20260805100100_leonix_phone_verification_challenges.sql` | APPLIED, verified |
| 2 | `20260805100200_leonix_verified_phone_identities.sql` | APPLIED, verified (FK resolved — ordering correct) |
| 3 | `20260910120000_saved_search_match_events_servicios.sql` | APPLIED, verified |

### L.2 Migrations deliberately NOT applied (2)

| Migration | Reason |
| --- | --- |
| `20260805100000_..._redemptions.sql` | Table already present **and structurally complete** — 35/35 columns, all 4 anti-repeat partial-unique indexes with the exact `status IN ('reserved','redeemed')` predicate, all 5 supporting indexes, RLS on, 0 policies. Nothing to add; never to be dropped/recreated. |
| `20260805100300_..._verified_intro_discount_link.sql` | **The pre-gate UNKNOWN is now resolved: the column already exists.** `leonix_payment_records.verified_intro_discount_redemption_id` is `uuid`, with FK `REFERENCES leonix_verified_intro_discount_redemptions(id) ON DELETE SET NULL` and index `leonix_payment_records_verified_intro_discount_redemption_idx` — matching the migration source exactly. |

### L.3 Post-mutation schema truth (verified, not inferred)

| Object | State |
| --- | --- |
| `leonix_verified_intro_discount_redemptions` | PRESENT · 35 cols · RLS on · 0 policies |
| `leonix_phone_verification_challenges` | **PRESENT (new)** · 17 cols · 5 CHECKs · 6 indexes incl. `open_reservation_uidx` + `rate_slot_uidx` · RLS on · 0 policies |
| `leonix_verified_phone_identities` | **PRESENT (new)** · 8 cols · UNIQUE `(owner_user_id, phone_e164)` · FK → challenges `ON DELETE SET NULL` · RLS on · 0 policies |
| `leonix_payment_records.verified_intro_discount_redemption_id` | PRESENT (pre-existing) · uuid · FK + index verified |
| `saved_search_match_events_category_check` | `('autos','bienes-raices','rentas','servicios')` · `convalidated = true` |
| `saved_search_match_events_seller_lane_check` | `NULL OR ('negocios','negocio','privado','business','independent')` · `convalidated = true` |
| `saved_search_processing_failures_category_check` | `('autos','bienes-raices','rentas','servicios')` · `convalidated = true` |

`convalidated = true` means Postgres re-validated **every existing row** against each new
constraint. Old categories remain valid and no existing row was invalidated — proven by the
constraint's own validation, not by assumption. No durable QA rows were inserted.

### L.4 Promo circuit proof (schema inspection only — no Stripe call, no OTP sent)

A column-existence assertion across all 34 columns the live code reads or writes on the promo
path returned **zero missing**:

- eligibility read → `leonix_verified_phone_identities.phone_e164`, Supabase Auth email
- atomic reservation → all 18 reservation-write columns, incl. `reservation_expires_at`
  (NOT NULL), `checkout_attempt_key`, `verification_method`, `base_amount_cents`,
  `discount_cents`, `business_identity_*`
- payment record link → `verified_intro_discount_redemption_id`
- **P0 amount-guard dependencies** → `amount_subtotal_cents`, `amount_discount_cents`,
  `amount_total_cents`, `billing_mode` all present (without these the shipped fix would be inert)
- webhook fulfillment → `leonix_stripe_webhook_events` (idempotency ledger),
  `leonix_subscription_records` (37 cols), `admin_audit_log`
- Save (P1) → `saved_listings` has `category`, `source_table`, `source_id`, `canonical_ad_id`;
  `listing_id` is `uuid` and `servicios_public_listings.id` is `uuid`, so the canonical key type
  matches. In preview `persistEngagement` defaults to false, so the non-uuid fallback is never
  written.

**Anti-repeat boundaries — all four confirmed present with the exact required predicate:**

| Boundary | Index | Predicate |
| --- | --- | --- |
| owner (global) | `..._owner_uniq` | `status IN ('reserved','redeemed')` |
| email hash | `..._email_hash_uniq` | `status IN (...)` AND hash NOT NULL |
| phone hash | `..._phone_hash_uniq` | `status IN (...)` AND hash NOT NULL |
| business identity | `..._business_uniq` | `status IN ('reserved','redeemed')` |

All four cover **both** `reserved` and `redeemed`, so two concurrent checkouts cannot both hold
an unresolved reservation. **PROMO UNIQUENESS: PASS.**

### L.5 Environment readiness

No `.env*` file exists in the worktree, and Vercel Preview environment variables cannot be read
from this session. Every value below is therefore honestly **NEEDS OWNER MANUAL VERIFICATION**
— not assumed configured, and not assumed missing.

| Group | Variables | Status |
| --- | --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | NEEDS OWNER MANUAL VERIFICATION — all three must resolve to `xuieateniufcrsfdomwl` |
| Servicios flags | `SERVICIOS_STRICT_PUBLISH=1`; `SERVICIOS_DEV_PUBLISH` unset; `SERVICIOS_MODERATION_MODE` unset | NEEDS OWNER MANUAL VERIFICATION |
| Promo identity | `LEONIX_IDENTITY_HASH_KEY` | NEEDS OWNER MANUAL VERIFICATION — absence disables the **entire** 15% feature (503) |
| SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` | NEEDS OWNER MANUAL VERIFICATION |
| Stripe TEST | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Preview webhook endpoint + 9 events | NEEDS OWNER MANUAL VERIFICATION |
| Google | `GOOGLE_MAPS_API_KEY`, Geocoding enabled, server-compatible restriction | NEEDS OWNER MANUAL VERIFICATION |
| Media | `BLOB_READ_WRITE_TOKEN` | NEEDS OWNER MANUAL VERIFICATION |

### L.6 Standing statements

- **No customer-visible Servicios feature is intentionally out of scope.** Every launch-visible
  control either works end to end or does not render. The `save_only` branch that previously
  rendered nothing now renders a working Save.
- **Runtime certification must exercise BOTH commercial paths**: PATH A (base $399/month) and
  PATH B (verified 15% intro — email path *and* SMS path, one-time enforcement, correct Stripe
  amount `33915`, and full-price `39900` renewal).
- **No source blocker remains.** Everything outstanding is configuration/runtime.

### L.7 Remaining prerequisites before browser QA

1. Verify Vercel Preview resolves to Leonix Media with a **matching** URL/anon/service-role trio.
2. Set/confirm `SERVICIOS_STRICT_PUBLISH=1`, `LEONIX_IDENTITY_HASH_KEY`, `BLOB_READ_WRITE_TOKEN`,
   Stripe TEST keys + Preview webhook (9 events), Google Geocoding.
   (`TWILIO_*` is OPTIONAL and expected unset — see §O.5.)
3. Redeploy Preview **only if** an env value changes (env edits do not take effect until a new
   deployment). No redeploy is required by this gate's database work alone.

---

## M. RUNTIME CONFIG CERTIFICATION

**Gate:** `SERVICIOS-RUNTIME-CONFIG-CERTIFICATION-1` · **Date:** 2026-09-10 · **Result: BLOCKED**
**Method:** read-only only. No Vercel/Stripe/Google/SMS/Supabase mutation, no deploy, no push.

### M.1 Deployment truth (proven)

| Fact | Value |
| --- | --- |
| Vercel team | `Jesus Caceres' projects` · `team_wSqEzL32gCp3YGEB9T41fpxo` (Pro) |
| Project | `leonix-media` · `prj_AOEx7UeAvVCKwuKFIa65wcot4rw9` |
| Preview alias | `leonix-media-git-completion-launc-b1b333-jesus-caceres-projects.vercel.app` |
| Alias resolves to | `dpl_Ewts6oLMD1VA3shgeUd1w76vuFnY` · state **READY** |
| Deployed commit | **`e98c5d908ad6e717f9f71ec8dfeef0e5b7d391e1`** |
| Local HEAD | `9dfe3c8d5dedf4552a0d956ca045d9877042a83b` |
| `origin` branch ref | `e98c5d90…` — **2 commits unpushed** |

### M.2 BLOCKER 1 — the deployed Preview predates the P0 fix (proven)

`e98c5d90` is an ancestor of HEAD. The two commits not yet deployed touch **six runtime files**:

```
app/api/revenue-os/checkout/route.ts
app/lib/listingPlans/revenueFulfillment.ts
app/lib/listingPlans/revenuePaymentRecords.ts
app/(site)/servicios/components/ServiciosBusinessHubEngagementRow.tsx
app/(site)/servicios/publicar/components/ServiciosApplicationForm.tsx
app/(site)/servicios/publicar/serviciosCategories.ts
```

The live Preview therefore still contains the **PATH B money-taken-nothing-published P0** and
has **no working Save**. Running the §J checklist against it today would charge a real TEST card,
fail fulfillment with `amount_mismatch`, and look like an application defect rather than a stale
build. **REDEPLOY REQUIRED** — and because `origin` is still at `e98c5d90`, the branch must be
pushed first.

### M.3 BLOCKER 2 — Vercel SSO protection will block Stripe webhooks (proven)

Project deployment protection:

```
passwordProtection : disabled
ssoProtection      : ENABLED, deploymentType = "all_except_custom_domains"
trustedIps         : disabled
```

The Preview alias is a `*.vercel.app` host, **not** a custom domain, so it is SSO-protected.
Consequences:

- A browser QA session works normally (the signed-in owner passes SSO), so this failure is
  invisible from the browser.
- **Stripe cannot reach `POST /api/revenue-os/webhook`** — it receives Vercel's authentication
  challenge (401), not the app. `checkout.session.completed` is never delivered, so no
  entitlement is granted and no listing is published, on **both** PATH A and PATH B.

Stripe webhook endpoints cannot send custom headers, so a header-based bypass will not work.
Owner options, in preference order:

1. **Protection Bypass for Automation** — enable it on the project and append the secret to the
   webhook URL as a query parameter (`…/api/revenue-os/webhook?x-vercel-protection-bypass=<secret>`).
   Keeps SSO on for humans while letting Stripe through. Recommended.
2. Point the Stripe TEST webhook at a **custom domain** route excluded from protection.
3. Disable SSO protection for Preview deployments for the duration of QA (weakest — exposes the
   Preview publicly).

### M.4 Environment variable presence — NOT PROVABLE IN THIS SESSION

Every required variable is **NEEDS OWNER MANUAL VERIFICATION**. This is a capability limit, not
a finding of absence — nothing here should be read as "missing".

Read-only avenues attempted and their outcome:

| Avenue | Outcome |
| --- | --- |
| Vercel MCP tools | No environment-variable tool exists in this session's toolset |
| `get_project` / `get_deployment` metadata | Returns no env names |
| Vercel CLI (`vercel env pull`) | No CLI installed, no `.vercel` link, no `VERCEL_TOKEN`, no CLI auth file; installing it is barred by resource control and login is non-interactive |
| Local `.env*` | None exist in the worktree |
| Stripe CLI/API | No `STRIPE_SECRET_KEY` in env, no Stripe CLI config |
| Google Cloud | No `gcloud` credentials, no `GOOGLE_MAPS_API_KEY` in env |

| Group | Variables | Status |
| --- | --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | NEEDS OWNER MANUAL VERIFICATION — project-ref alignment unproven |
| Servicios | `SERVICIOS_STRICT_PUBLISH`, `SERVICIOS_DEV_PUBLISH`, `SERVICIOS_MODERATION_MODE` | NEEDS OWNER MANUAL VERIFICATION |
| Identity | `LEONIX_IDENTITY_HASH_KEY` | NEEDS OWNER MANUAL VERIFICATION |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` | **OPTIONAL — NOT REQUIRED** for certification (§O.5). Expected unset. |
| Stripe | `STRIPE_SECRET_KEY` (TEST vs LIVE), `STRIPE_WEBHOOK_SECRET` | NEEDS OWNER MANUAL VERIFICATION — **mode unknown** |
| Google | `GOOGLE_MAPS_API_KEY` + Geocoding enabled + server-compatible restriction | NEEDS OWNER MANUAL VERIFICATION |
| Media | `BLOB_READ_WRITE_TOKEN` | NEEDS OWNER MANUAL VERIFICATION |

No secret value was printed, requested, or written anywhere.

### M.5 SMS circuit — source facts proven (no OTP sent)

| Requirement | Proven |
| --- | --- |
| Provider is Twilio Verify | YES — `app/lib/sms/twilioVerifyProvider.ts` |
| Raw OTP never persisted | YES — no insert/upsert writes a code; every `code:` occurrence in the two routes is an HTTP error code |
| Fails closed when unconfigured | YES — both routes return 503 `sms_not_configured` on `NOT_CONFIGURED` |
| Challenge persistence table exists | YES — created and verified in §L |

### M.6 Unrelated concurrent deployment (noted, not ours)

At the time of this gate, `dpl_Af7uurxzkNR8eKugHzs34wiTybJD` was BUILDING on branch
`feature/business-concierge-systemic-repair-2026-09` (commit `e39b9df5`). It belongs to a
different workstream, has its own alias, and does **not** affect the Servicios Preview alias.

### M.7 Owner actions required before the next Preview deploy

1. Decide and apply the SSO-protection approach for the Stripe webhook (§M.3).
2. Confirm/set the seven env groups in §M.4 on the **Preview** scope.
3. Confirm `STRIPE_SECRET_KEY` is `sk_test_…`, never `sk_live_…`.
4. Register the Stripe TEST webhook against the Preview URL with all nine events (§G.3).
5. Then authorize **one** intentional push + Preview deploy at the then-current HEAD.

---

## N. TEMPORARY RUNTIME-READINESS PROBE — SCHEDULED FOR REMOVAL

**Gate:** `SERVICIOS-RUNTIME-CONFIG-PROBE-DEPLOY-1` · **Date:** 2026-09-10

### N.1 What it is

| Field | Value |
| --- | --- |
| Path | `GET /api/internal/servicios-runtime-readiness` |
| Files | `app/api/internal/servicios-runtime-readiness/route.ts`, `…/readinessReport.ts` |
| Verifier | `scripts/verify-servicios-runtime-readiness-probe.ts` (22/22 PASS) |
| Purpose | Report **sanitized** runtime-config readiness on the protected Preview so the exact missing environment items can be identified without the owner hand-copying secrets |
| Lifetime | **TEMPORARY** — delete immediately after Servicios runtime certification |

It exists because §M established that Vercel environment state is not readable through any
tooling available to this session, and hand-auditing a dozen variables across seven vendors is
both slow and error-prone. It rides along with the deployment that was **already required** for
the P0/P1 source fixes — it did not cause an extra build.

### N.2 Safety contract (each item machine-verified)

- **Sanitized output only** — booleans, the Stripe mode classification (`test`/`live`/`unknown`),
  the PUBLIC Supabase project ref parsed from the URL hostname, the Vercel env name and the
  Vercel git SHA. Nothing else.
- **No secret, and no fragment of one.** The verifier feeds fabricated secrets through the real
  classifier and asserts that no full value *and no 8-character fragment* appears in the output.
- **No length disclosure** — the report contains no numeric field at all.
- **No token decoding** — the project ref comes from the URL hostname; base64/JWT decoding is
  absent and asserted absent.
- **Production hard-disabled** — `VERCEL_ENV === "production"` returns 404, and the guard runs
  *before* any report is constructed.
- **Zero external calls** — the route imports only `next/server` and the local pure classifier;
  the classifier has **zero imports**. No fetch, DB, Stripe, Google or Twilio call exists.
- **GET only**, `force-dynamic`, `revalidate = 0`, `no-store`, `x-robots-tag: noindex`.

### N.3 Doctrine

This is **diagnostic scaffolding, not product architecture.** It must not be treated as a
pattern, must not be copied into other categories, and must not survive certification. Removing
it means deleting the route directory and its verifier — it has no other consumers by design.

### N.4 Removal checklist (run after §J certification)

- [ ] Delete `app/api/internal/servicios-runtime-readiness/`
- [ ] Delete `scripts/verify-servicios-runtime-readiness-probe.ts`
- [ ] Delete this section N
- [ ] Confirm no remaining reference: `grep -r "servicios-runtime-readiness"`

---

## O. DISCOUNT ARCHITECTURE — LOCKED DOCTRINE

**Gate:** `SERVICIOS-VERIFIED-INTRO-NEWSLETTER-FOUNDATION-LOCK` · **Date:** 2026-09-10
**Status:** OWNER-LOCKED. This section overrides any earlier implication elsewhere in this document.

### O.1 GLOBAL DOCTRINE — carry this to every category

> **A monthly-subscription introductory discount MUST NOT use the billing-mode-blind generic
> promo-code path, unless that path is first explicitly upgraded to first-payment-only semantics.**

**Why this is load-bearing, not stylistic.** `revenuePromoValidation.ts` computes
`totalCents = subtotalCents − discountCents`, and checkout assigns that to `finalAmountCents`
with **no billing-mode branch**. There is no Stripe coupon and no "duration" concept anywhere in
`promoCodeRules` / `promoCodeLifecycle` / `revenuePromoValidation`. On a `monthly_subscription`
package that reduced total becomes the **recurring** price. A "15% intro" promo code on Servicios
would therefore discount **every month forever** — roughly **$718/year of permanent margin per
customer** — while appearing to be an introductory offer.

`verified_intro_15` exists precisely to express *first payment only*: for a subscription it
attaches a `duration:"once"` Stripe coupon and leaves the line item at full price.

**Applies to every current and future `monthly_subscription` package**, explicitly including:
**Servicios**, **Restaurantes**, **Bienes Negocio**, **Autos Dealer**.

### O.2 Servicios commercial truth (restated, canonical)

| Fact | Value |
| --- | --- |
| Regular price | **$399.00 / month** |
| Verified introductory benefit | **15% off the FIRST eligible payment only** |
| First verified payment | **$339.15** |
| Every renewal | **$399.00 / month** |
| Promo code required | **NO** — the benefit is identity-bound |

### O.3 The two discount systems are COMPLEMENTARY, not duplicates

| | Generic promo codes | `verified_intro_15` |
| --- | --- | --- |
| Purpose | Admin/sales-led campaigns, negotiated offers | Identity-bound introductory benefit |
| Entry | A typed code | Verified identity — no code exists |
| Amount | Arbitrary % or $ | Exactly 15% |
| Subscription semantics | **None** — discounts the recurring price | First payment only (`duration:"once"`) |
| Anti-repeat | `max_redemptions` + `per_customer_limit` | 4 partial-unique identity boundaries |
| Admin | `/admin/workspace/promo-codes` | Redemption ledger + audit log |

They **cannot stack** — checkout rejects a request carrying both (`discount_conflict`).

**The generic promo-code system is NOT deprecated.** It remains a valid Revenue OS capability for
custom campaigns, negotiated discounts, sales-led codes, and category/package-scoped offers, with
its own admin, generator, normalization/uniqueness, redemption ledger and webhook finalization.

**Launch-25 remains RETIRED** (retired by commit `313338ce`, the same commit that introduced
`verified_intro_15`; existing rows flipped to `revoked`, history preserved, zero deletions).
Newsletter-issued promo codes must **not** be resurrected for subscription intro pricing.

### O.4 Newsletter = MARKETING SURFACE, never an eligibility authority

**Supabase Auth (`email_confirmed_at`) is the single identity authority.** Subscribing to the
newsletter verifies nobody and confers nothing.

Canonical customer flow:

```
Newsletter signup
  → success page states the benefit exists and that VERIFICATION unlocks it
  → CTA "Verify my account" → existing /login?redirect=… magic-link flow
  → Supabase Auth confirms the email
  → verified identity becomes eligible automatically
  → Servicios checkout recognizes it — NO promo code
  → first payment $339.15
  → every renewal $399.00
```

Implemented as marketing copy plus a link into the **existing** auth entry. No promo code is
minted or emailed, no newsletter eligibility logic exists, no second identity table was created,
and a subscriber is never marked verified merely for subscribing. The bridge is hidden when the
subscriber arrived from a publish checkpoint, since they are already inside the funnel and are
being told to return to it.

### O.5 SMS / Twilio — OPTIONAL, explicitly NOT launch-blocking

| Path | Status |
| --- | --- |
| **Email** | **REQUIRED / canonical.** Supabase Auth `email_confirmed_at`. Complete and live. |
| **SMS** | **OPTIONAL alternate** verification, for customers with no confirmed email. |
| **Twilio** | **Optional implementation adapter** behind `SmsVerificationProvider`, referenced at 2 call sites. Not required for Servicios certification. |

`TWILIO_*` is **removed from the launch-blocking configuration list.** With it absent:

- the phone-verification path fails closed (503 `sms_not_configured`) and the panel honestly says
  to use a confirmed email instead;
- **email-confirmed customers remain fully eligible**;
- **Servicios launch certification can still PASS.**

The phone-verification architecture and its DB tables stay intact and its fail-closed behaviour is
unchanged — nothing was removed or weakened. Supabase phone auth is not implemented anywhere and
would not avoid a vendor anyway, since it also requires an SMS provider configured inside Supabase.

### O.6 Customer-facing copy corrections made in this gate

| Surface | Was | Now |
| --- | --- | --- |
| Verified-intro panel, unverified state | "Verify your **phone** to unlock 15%…" — implied phone was required, contradicting email-alone eligibility | Names both routes: sign in with a confirmed email, **or** verify a phone |
| Verified-intro panel, eligible state | The renewal note appeared only **after** applying, so "Apply 15% discount" could read as recurring | The first-payment-only note is disclosed **before** the customer applies |
| Newsletter success | "You're subscribed." — no mention of the benefit | Adds the acquisition bridge + verify CTA, worded so verification (not signup) unlocks eligibility |

### O.7 Newsletter double opt-in — BUILT-NOT-WIRED (recorded, not a blocker)

`newsletterVerificationState.ts` is a pure state machine and the DB columns exist
(`pending_verification`, `verification_token`, `verification_token_expires_at`, `verified_at` —
migration `20260826130000`), but there is **no `/api/newsletter/verify` route and no confirmation
email**; subscribe writes `status: "subscribed"` directly. This does not block anything, because
newsletter verification is deliberately **not** an eligibility authority (§O.4).

`buildNewsletterPromoCodeEmail()` is a **zero-consumer** Launch-25 artifact, classified **MIXED**
(parameterized amounts, hardcoded "Launch 25" wording) and therefore **retained and labelled** in
-file as the layout for a future admin-issued campaign email. It must never be used for the
verified-intro benefit, which mints no code.
