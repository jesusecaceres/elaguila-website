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
| Saved Search | LIVE | Source complete; the ledger CHECK migration `20260910120000_saved_search_match_events_servicios.sql` is **APPLIED/verified** (§F row 5, §L row 3). Runtime delivery proof = GR-25 |
| JSON-LD / sitemap | LIVE | Emitted for published listings only |

### C.2 Publish funnel

| Step | State | Truth |
| --- | --- | --- |
| Landing → checkpoint | LIVE | `/clasificados/publicar/servicios` (`/servicios/publicar` redirects here) |
| Application form | LIVE | Guided; identity, hero, services, media, contact, hours, payments, credentials |
| Category escape hatch | LIVE | Instructional copy ("¿No encuentras tu categoría? Elige “Otro servicio”…") points to the "Otro servicio" option, which reveals "Describe tu servicio"; that text is the public category line and round-trips through edit (§Q). The helper that selects/focuses the field lives in the zero-consumer `ServiciosApplicationForm` |
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

Proven by `scripts/verify-servicios-golden-reference-promo-path.ts` (24/24), including negative
controls: a discounted amount with no redemption attached is still rejected; a `one_time` record
never receives the allowance; a zero/absent recorded discount grants no allowance; and
`33914` / `33916` are still rejected.

### H.2 P1 — CLOSED THIS GATE

> **Correction (see §P.6):** Save was not "built-not-wired" — it had been deliberately removed from
> the hero and hub on 2026-07-15 (`a69e7600`). Reinstatement follows the newer owner direction.

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

> **Historical gate snapshot (2026-09-09/10). Superseded by §R for current status.** Its
> "Remaining blockers: Database + configuration only" line was true then; the database pass was
> executed in §L (all three migrations APPLIED/verified). The configuration dependency that is
> still open today is tracked in §M.3 / §R.7 (Stripe webhook delivery vs Vercel SSO).

| Item | Status |
| --- | --- |
| P0 blockers | **1 found, 1 closed** |
| P1 blockers | **1 found, 1 closed** |
| Typecheck | **PASS** (`tsc --noEmit`, full project) |
| Verifiers | `verify-servicios-golden-reference-promo-path` 24/24 · `verify-servicios-gate3-source-readiness` 97/97 |
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

> **Status today (verified 2026-09-11, MD proof audit):**
> **M.2 BLOCKER 1 — RESOLVED.** The deployed Preview no longer predates the P0 fix; the Golden
> candidate is `5b5aae46` on `dpl_GtxJzwUWsEJaViSBAnk4nYXfzhp7` (§R), and `origin` is not behind.
> **M.3 BLOCKER 2 — STILL OPEN.** Project deployment protection re-read today:
> `passwordProtection disabled · ssoProtection ENABLED (all_except_custom_domains) · trustedIps
> disabled`. The Preview is a `*.vercel.app` host, so Stripe still cannot reach
> `POST /api/revenue-os/webhook`. This is an owner configuration decision and is a hard
> prerequisite for Runtime Gate B (GR-01/GR-03) — see §R.7 and Golden Delta Ledger §20.3.
> The gate result below is the historical 2026-09-10 snapshot and is not rewritten.

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

---

## P. P7 BLOCKER REPAIR — SOURCE CLOSED, RUNTIME PENDING

**Gates:** `SERVICIOS-P7-BLOCKER-REPAIR-01` (implementation) · `SERVICIOS-P7-REPAIR-INTEGRATION-1A`
(integration validation) · **Date:** 2026-09-10

### P.1 How these were found

The absolute pre-QA audit (`SERVICIOS-FOUNDATIONAL-QA-GREEN-LIGHT-ABSOLUTE-01`) returned
**FOUNDATIONAL QA GREEN LIGHT: NO** with five launch-critical defects, each proven against source at
`a587263d` and the live Leonix Media database. The existing verifier suite was green on all five.

### P.2 Defects and closure

| # | Defect | Commit | Source status |
| --- | --- | --- | --- |
| B1 | Publish route treated a NULL `owner_user_id` as permission → any signed-in user could overwrite an unowned published listing and take ownership (57 of 103 live rows were exposed) | `dea5d0b3` | **CLOSED** |
| B2 | pause → subscription cancelled/failed → Resume or edit-save republished for free, indefinitely | `dea5d0b3` | **CLOSED** |
| B3 | Owner saves could move `suspended` / `rejected` rows to `pending_payment`, defeating the webhook's own refusal | `dea5d0b3` | **CLOSED** |
| B4 | Coupons/offers INCLUDED in $399 were gated on the retired `servicios_offers_addon` key at the publish strip, the public detail page and the my-listings API; the dashboard "enable" action returned a false success | `961fa93c` | **CLOSED** |
| B5 | "Hide my exact address" honoured only at render; the street stayed in public `profile_json` behind a `USING (true)` read policy | `404a5ea2` | **CLOSED in source; DB half prepared, NOT applied** |

### P.3 Locked doctrine (golden reference — carry to later categories)

- **Ownership (B1).** One rule, `isServiciosListingOwner()`: the row has an owner AND it is the
  authenticated actor. A NULL owner is never permission; unowned historical rows are reachable only
  through admin/ownership assignment. Saves never write `owner_user_id`.
- **Paid reactivation (B2).** Visibility returns only through Resume, which requires the canonical base
  right: `resolveCategoryListingPlan` (live base entitlement + grace/suspended overlay) plus the newest
  subscription record not `canceled`/`suspended`. Grace is honoured. Editing a paused listing keeps it
  paused. The shared lifecycle is unchanged.
- **Leonix authority (B3) — FAIL CLOSED, OWNER-APPROVED.** A customer can never self-reactivate a
  `suspended` or `rejected` row, on any save or Resume path. The listing-level `suspended_reason` cannot
  safely separate a chargeback from an ordinary payment lapse (the chargeback path stamps the same
  `'payment'` value), so there is **no customer self-service exception**. Recovery authority is the
  Revenue OS lifecycle where explicitly authorized (`liftPaymentSuspension` on `invoice.paid` / dispute
  won) and admin/operator restoration where required. A self-service re-subscribe path waits for a
  future dedicated suspension-reason architecture.
- **Included offers (B4).** The single authority everywhere is
  `resolveBusinessToolsAccess({ capability: "coupons_offers" })` — publish strip, public render,
  owner dashboard API, dashboard UI and the enable route. Historical add-on holders still qualify via
  the plan policy's legacy branch. A first (pending-payment) save keeps its offers because that row
  can only go public through a paid `servicios_base_monthly`, which includes the capability. The
  retired add-on is never sold.
- **Address privacy (B5).** A public/private split at the single save boundary: when the owner hides
  the address, street, suite and Google place id leave `profile_json` for the service-role-only
  `private_contact` column; city / region / country / postal code stay public. The owner API
  (`my-listing`) restores them for edit hydration and listing-bound Preview. The public detail renders
  identically.

### P.4 Migration — prepared, NOT applied

`supabase/migrations/20260910210000_servicios_public_listings_read_privacy.sql`

- adds `private_contact` (never granted to anon/authenticated);
- replaces the `USING (true)` all-roles policy with published rows for anon + authenticated, plus own
  rows for an authenticated owner (`owner_user_id = auth.uid()`);
- revokes table-level SELECT and grants column-level SELECT: anon gets the public contract only (no
  `owner_user_id`); authenticated additionally gets `owner_user_id`; neither gets moderation,
  suspension, republish-audit or private columns;
- idempotent backfill copying any hidden-address data into `private_contact` in the same statement
  that removes it from `profile_json` (zero rows qualify today).

**Deploy order.** The code is safe before the migration (a shown-address save never touches the new
column; a hidden-address save fails closed). Apply the migration → deploy → re-run the idempotent
backfill once to catch any hidden-address row the previous build saved in between.

**Remote application requires explicit owner authorization.**

### P.5 Validation (integration gate)

| Check | Result |
| --- | --- |
| Canonical full typecheck `NODE_OPTIONS=--max-old-space-size=7168 npm run typecheck` | **PASS** — exit 0, 0 errors |
| `verify-servicios-publish-authority` (B1/B2/B3) | 37/37 |
| `verify-servicios-included-offers` (B4) | 29/29 |
| `verify-servicios-address-privacy` (B5) | 30/30 |
| `verify-servicios-golden-reference-promo-path` (15% verified intro) | 24/24 |
| `verify-servicios-gate1-lifecycle` / `gate2-discovery` / `gate3-source-readiness` | 20/20 · 19/19 · 97/97 |
| `verify-servicios-p0b-coupons-offers-persistence-preview-public-output` | PASS (now covers the server gate) |
| Protected systems (pricing matrix, checkout/webhook routes, fulfillment, Stripe, verified-intro, subscription lifecycle, Saved Search, analytics, media, render library) | **byte-identical** to `a587263d` |

Still-red broader verifiers — none is a Servicios regression:

| Verifier | Classification |
| --- | --- |
| `verify-servicios-preview-published-parity` ("hub row: Save removed") | stale test doctrine — Save reinstated before this repair set |
| `verify-servicios-p0c-dashboard-addon-only-stripe-edit-route-parity` (remaining checks) | stale test doctrine — retired dashboard Stripe add-on flow |
| `verify-owner-dashboard-global-cta-standard-01` | stale test doctrine — Restaurante add-on CTA retired by `14a2c2ca` |
| `verify-servicios-edit-route-restaurantes-parity-hard-fix-01`, `verify-owner-dashboard-global-edit-hydration-standard-01` | stale via chain into the verifier above; own Servicios checks pass |
| `smoke-active-categories-revenue-os-checkpoint-activation-matrix-01` | unrelated — Bienes assertion |
| `gate-i13a-launch-readiness-selftest` | unrelated — Comida Local assertion; its Servicios checks pass |
| `verify-package-e-e2-user-dashboard-command-center` (Gate 7) | unrelated — `dashboard/page.tsx` |
| `verify-dashboard-category-edit-hydration-01` | unrelated — dashboard label copy; its my-listing check passes |

### P.6 Corrections to earlier records

- **Save (§H.2):** it had been deliberately removed from the hero and hub on 2026-07-15 (`a69e7600`),
  not "built-not-wired". Its reinstatement follows the newer owner direction.
- **B4 scope:** the audit named only the publish strip; the public detail page and my-listings API were
  gated on the same retired key. The execution verifier found them.
- **Counts:** the promo-path verifier defines 24 checks (earlier records said 25/25).

### P.7 Status

- **Source:** B1–B5 closed.
- **Database:** B5 migration pending owner authorization.
- **Runtime:** full Servicios runtime certification (§J, plus regressions R1–R5 for B1–B5) still pending.
- **Temporary probe (§N):** remains deployed until runtime certification completes, then is removed.

---

## Q. ABSOLUTE-02 CORRECTIVE — EDIT ROUND-TRIP + OFFERS DISCOVERY

**Gate:** `SERVICIOS-EDIT-ROUNDTRIP-OFFERS-DISCOVERY-1` · **Date:** 2026-09-10 · **Found by:** the
`SERVICIOS-FOUNDATIONAL-QA-GREEN-LIGHT-ABSOLUTE-02` execution probe (publish → owner hydration →
republish on a fully populated listing). ABSOLUTE-02 confirmed B1–B5 closed and the P.4 migration
applied to Leonix Media (ledger `20260911024723`, integration gate 1B); these two defects were new.

### Q.1 F1 — "Otro servicio" description lost on edit

For "Otro servicio" the owner's "Describe tu servicio" text is persisted **only** as the public
`hero.categoryLine`. Edit hydration (`serviciosPublishedToApplicationDraft`, used by the dashboard edit
and the listing-bound Preview) never read it back: the form reopened empty, the Preview lost the category
line, and republish was refused by readiness ("Describe tu tipo de servicio") until the owner retyped it.
(ABSOLUTE-02 called this a silent loss; readiness actually blocks the republish — the data loss is in the
editor, not in the saved row.)

**Closure.** Hydration restores `customServiceDescription` from `hero.categoryLine` — the existing and
only persisted authority, no new storage — for exactly the business types that publish a custom label.
That rule is now one function, `serviciosBusinessTypeUsesCustomCategoryLabel()`, used by both the label
resolver and hydration. Predefined categories are unchanged.

### Q.2 F2 — "Tiene ofertas" missed included offers

The "Tiene ofertas / Has offers" filter counted only old-style promotions, so a listing whose included
coupons, flyer or "more offers" link render on its detail page never matched (and Saved Search, which
runs the same filter, never matched it either).

**Doctrine — read-time capability truth.** Discovery and the detail page share one rule
(`serviciosPublicOffersVisibility.ts`): included offers count only while `coupons_offers` is **current**,
decided at request time by the same plan policy. Old-style promotions are not part of that capability
and still count, as before. There is no publish-time flag: when commercial authority lapses, the listing
stops matching exactly when its detail page stops showing the offers. Historical add-on holders stay
compatible through the plan policy's legacy branch, never as a second authority.

**Cost.** `resolveBusinessToolsAccessForListings` batches the existing resolver: one entitlement query
(plus one subscription query when a live Stripe row exists) per 100 ids, and only for rows that carry
offer content, only when the filter is on. The single-listing `resolveCategoryListingPlan` now delegates
to the batched path, so there is one fetch implementation and one pure decision
(`decideCategoryListingPlansForListings` → `decideCategoryListingPlan`). The Saved Search orchestrator
makes one lookup per activation.

### Q.3 Verification

| Check | Result |
| --- | --- |
| `verify-servicios-edit-roundtrip` (new) | 31/31 — against the pre-fix tree: 8 OK / 23 FAIL, including the real readiness refusal and the excluded coupon/flyer/more-offers listings |
| included offers · publish authority · address privacy | 29/29 · 37/37 · 30/30 |
| gate1 lifecycle · gate2 discovery · gate3 readiness · verified-intro promo path | 20/20 · 19/19 · 97/97 · 24/24 |
| `gate-pkgC-c5-c6`, Restaurantes gate1/gate2, package-d-d3, i13b, bilingual hydration, p0b | PASS |
| Scoped typecheck (touched files + direct consumers) | 0 errors |

Two source-string assertions were updated to the new shape without changing their intent:
`verify-servicios-included-offers` (the strip moved into the shared rule) and
`verify-restaurantes-gate1-lifecycle` (the resolver keys on category + listing_id via `.in`).

### Q.4 Scope and status

- No database, schema, migration, payment, Stripe, webhook or Vercel-env change.
- `promo=1` / `offer=1` remain URL-only legacy parameters with no rendered control (unchanged).
- **Owner runtime QA is still pending** (§J, plus R1–R5 for B1–B5, R6: edit and republish an
  "Otro servicio" listing, R7: "Tiene ofertas" returns the QA listing's coupon).


---

## R. CURRENT GOLDEN RUNTIME CANDIDATE — `5b5aae46` (2026-09-11)

Supersedes §Q as the runtime under certification. §Q (`f00fcedd`, ABSOLUTE-02 corrective F1/F2) and
its Preview `dpl_7Bt23F5934mumn2MpixqmQUNUJf9` remain historical ancestry — **not** the Golden
candidate. History is not rewritten; this section records what is current.

### R.1 Runtime identity

| Item | Value |
|---|---|
| Branch | `completion/launch-lifecycle-2026-09-09` |
| Documentation-only HEAD | `f00d1923` |
| **Golden candidate runtime SHA** | **`5b5aae4686e05ccf7c6e9efc09dacee06d0e6655`** |
| Runtime tree identity | `app/` = `f4ed31d9`, `supabase/` = `6d5014bc` — identical at `8ea8e304`, `25401306`, `5b5aae46` and `f00d1923`, so HEAD's runtime code **is** the Preview's runtime code |
| Last commit touching `app/` | `8ea8e304`; `82074d33` + `25401306` are scripts-only; `5b5aae46` + `f00d1923` are docs-only |
| Preview deployment | `dpl_GtxJzwUWsEJaViSBAnk4nYXfzhp7` · state **READY** · target preview |
| Preview URL | `https://leonix-media-4zuojd8fl-jesus-caceres-projects.vercel.app` |
| origin/main reconciled | `9fcadb4d` (Owner Command Center through Gate 20 + Admin OS release); 0 main-only commits remain |

### R.2 What landed between `f00fcedd` and this candidate

33 runtime-affecting commits, 179 runtime files (22 Servicios-owned):

- `ba7fa786` — Servicios owner-QA correction build (⚠️/SVC-QA repairs: Translate in Preview, address
  verifier truth, credential upload-or-URL, Add/Accept truth, special hours, Share, action grammar,
  Community Trust preview, coupon viewer, gallery tabs, in-Leonix video, rails, collapses, step rail,
  verified-intro and promo-recurrence copy).
- `6b8a511c` / `55a73c04` — reconciliation merges of current `origin/main`.
- `8ea8e304` — FSBO renewal audit action (one line; outside the Servicios gate, verified green).

### R.3 Delta-final certification on this runtime (lightweight, current-state)

| Item | Result | Evidence |
|---|---|---|
| F1 Otro servicio round-trip | **CLOSED** | `verify-servicios-edit-roundtrip` PASS |
| F2 Tiene ofertas | **CLOSED** | `verify-servicios-included-offers` PASS; read-time batched `coupons_offers` authority intact |
| B1 ownership takeover | **PRESERVED** | `verify-servicios-publish-authority` PASS |
| B2 paid reactivation | **PRESERVED** | same |
| B3 Leonix suspension lock | **PRESERVED** | same |
| B4 included coupons/offers | **PRESERVED** | `verify-servicios-included-offers` PASS |
| B5 address privacy / RLS | **PRESERVED** | `verify-servicios-address-privacy` PASS |
| Open launch-critical blockers | **0** | §H P0 1/1 and P1 1/1 closed; §P B1–B5 closed and re-verified above; no other P-class blocker set is open in this record |
| Source/foundational gaps | **0** | Ledger "SOURCE PROOF LOCK — PRE-OWNER-QA": ⚠️ 68/68, SVC-QA 34/34, GR 44/44 dispositioned |

### R.4 Integration evidence already valid on this tree (not re-run)

- Canonical full typecheck `NODE_OPTIONS=--max-old-space-size=8192 npm run typecheck` → **exit 0, 0 errors**.
- Production build `npm run build` → **exit 0**, 384/384 static pages, full route manifest.
- Release regression: `test:gates` 71/86 and the 96-verifier set 75/96 — **0 branch-introduced failures**
  (every remaining failure reproduces identically on clean `origin/main`).
- Vercel Preview built this exact SHA: compiled successfully, no build errors, no runtime errors reported.

### R.5 Commercial pre-payment truth on this runtime

`$399.00/month` base · verified intro 15% = `$59.85` · eligible first charge `$339.15` · renewal
`$399.00/month` · eligibility = server-proven verified email OR verified phone identity ·
newsletter is **not** eligibility authority · generic promo is a separate authority and cannot stack
(409 `discount_conflict`) · promo recurrence copy states the Stripe truth (a promo code on a monthly
plan sets the recurring `unit_amount`, so the reduced price renews every cycle) · no retired 25%
path in the Servicios runtime · coupons/offers included in the base capability · active paid normal
edits do not repurchase the base package.
Verifiers green on this tree: `golden-reference-promo-path`, `owner-qa-delta` 34/34,
`publish-checkout-checkpoint-standard-01`, `publish-checkout-promo-validation-ui-01`,
`servicios-global-checkout-standard-parity-01`.

### R.6 Status

**FOUNDATIONAL QA GREEN LIGHT: YES** — against runtime `5b5aae46`.
**SERVICIOS OWNER CORRECTION BUILD READY FOR GOLDEN RUNTIME QA: YES.**

**FULL GOLDEN REFERENCE RUNTIME CERTIFIED: NO.** GR-01…GR-44 remain owner-runtime pending; the
paid Golden listing does not exist yet. Execution plan and control matrix: Golden Delta Ledger §20.

### R.7 Open runtime-configuration dependency (owner decision — blocks Runtime Gate B only)

Re-verified on 2026-09-11 during the MD proof audit, directly against the Vercel project:

```
passwordProtection : disabled
ssoProtection      : ENABLED, deploymentType = "all_except_custom_domains"
trustedIps         : disabled
```

The Golden candidate Preview is a `*.vercel.app` host, so it is SSO-protected. A signed-in owner
browses it normally, but **Stripe cannot deliver `checkout.session.completed` to
`POST /api/revenue-os/webhook`** — it receives Vercel's authentication challenge instead. Without
delivery there is no fulfillment, no entitlement and no publish, on both PATH A and PATH B, and the
failure looks like an application defect rather than a transport block.

This is **not** a source defect and not a foundational blocker: §R.3/§R.5 stand, and the source path
(`revenueFulfillment` → entitlement → exact-row publish) is proven. It is a configuration decision
the owner must make before any Stripe TEST charge:

1. **Protection Bypass for Automation** (recommended) — enable on the project and append the secret
   to the webhook URL as a query parameter. Humans keep SSO; Stripe gets through.
2. Point the Stripe TEST webhook at a **custom domain** route excluded from protection.
3. Temporarily disable SSO protection for Preview deployments during QA (weakest — exposes Preview).

Stripe webhook endpoints cannot send custom headers, so a header-based bypass cannot work.

> **TRANSPORT RESOLVED — see §R.9.** Option 1 was already configured on this project before this
> gate (Protection Bypass for Automation, exposed as the `VERCEL_AUTOMATION_BYPASS_SECRET` system
> environment variable). It was reused, never recreated or rotated, and its value is not recorded
> here. What remains is the Stripe TEST endpoint itself (§R.9.2).

### R.8 MD proof audit result (2026-09-11)

Full TRUE/FALSE audit of both canonical documents at doc HEAD `1946a7fa`:

- ⚠️1–68 **68/68**, SVC-QA-01–34 **34/34**, GR-01–44 **44/44** audited; per-ID evidence remains in
  Golden Delta Ledger §19 (SOURCE PROOF LOCK) and is unchanged by this audit.
- Document errors found and repaired in this pass:
  1. §C.1 listed Saved Search as `BLOCKED — DB` while §F/§L record the ledger CHECK migration as
     APPLIED/verified — **contradiction, repaired** (now LIVE with the runtime proof pointer).
  2. §K's "Remaining blockers: Database + configuration only" read as current status —
     **stale, repaired** with a superseded banner.
  3. §M carried a 2026-09-10 `BLOCKED` verdict with no current marker — **repaired**: BLOCKER 1
     recorded RESOLVED, BLOCKER 2 recorded STILL OPEN with today's re-verification.
  4. Ledger §20 (runtime plan) omitted the webhook-delivery prerequisite — **repaired** in §20.3.
- False document claims remaining: **0** · unproven source claims: **0** · contradictions: **0** ·
  stale current-proof references: **0** · source/foundational gaps: **0**.
- Owner-runtime items still pending: **43** (GR-22 NOT SUPPORTED — CURRENT PRODUCT; GR-44 issued last).

### R.9 Preview webhook delivery — transport proven (2026-09-11)

#### R.9.1 Result

Protection Bypass for Automation **already existed** on project `leonix-media` and is designated a
system environment variable (`VERCEL_AUTOMATION_BYPASS_SECRET`). It was **reused** — not created,
not rotated — and its value is not written to any document, commit, log or report.

External reachability probe against the Golden candidate Preview
(`dpl_GtxJzwUWsEJaViSBAnk4nYXfzhp7`, runtime `5b5aae46`), with **no payment and no Stripe
involvement**:

| Check | Result |
|---|---|
| `POST /api/revenue-os/webhook` **with** the automation bypass header | HTTP **400**, `content-type: application/json`, body `{"ok":false,"code":"signature_invalid"}` |
| Vercel auth HTML in that response | **none** — the application handler answered, not the edge |
| Same POST **without** the bypass (control) | HTTP **401**, Vercel protection JSON, `vercel_auth_enabled: true` |
| DB / payment / entitlement / listing mutation | **NONE** — `verifyStripeWebhookEvent` runs before `claimStripeEvent` and before any write, so an invalid signature returns at the top of the route |

Interpretation: the edge bypass works for automation, the application webhook is externally
reachable, Stripe signature verification is still enforced, and **human Preview SSO remains on**
(proven by the 401 control, not assumed). Production and `main` were not touched; no protection
setting was changed by this gate.

#### R.9.2 Remaining infrastructure item — Stripe TEST endpoint (owner)

This session has **no Stripe access**: no `STRIPE_SECRET_KEY`, no `STRIPE_WEBHOOK_SECRET`, no Stripe
CLI, no Stripe connector. The current TEST webhook destination and its subscribed events therefore
cannot be read or corrected from here.

The live Revenue OS handler (`app/api/revenue-os/webhook/route.ts` +
`app/lib/listingPlans/revenueWebhook.ts`) consumes exactly nine events:

```
checkout.session.completed      checkout.session.expired
invoice.paid                    invoice.payment_failed
customer.subscription.updated   customer.subscription.deleted
charge.refunded                 charge.dispute.created
charge.dispute.closed
```

Required for Golden QA: the Stripe **TEST-mode** endpoint must point at the current Golden Preview's
`/api/revenue-os/webhook` carrying the automation-bypass query parameter, and subscribe to those
nine events. Live-mode Stripe must not be altered. GR-01 and GR-03 stay PENDING OWNER RUNTIME until
that endpoint is confirmed.

### R.10 Stripe TEST webhook infrastructure — CERTIFIED (2026-09-12)

Gate 1C of the Absolute Completion Runbook. No payment, no checkout, no Live mode, no Sandbox,
no listing/entitlement mutation. Proven with the owner-authorized Stripe **TEST** connector
(account `acct_1ToEl8Rzu3T31dla`, Leonix Global LLC, `livemode=false`) plus independent Vercel and
Supabase evidence.

#### R.10.1 TEST destination (read directly from Stripe)

| Fact | Value |
|---|---|
| Destination id | `we_1UEIgzRzu3T31dlavCYsHHRg` |
| Mode | TEST (`livemode=false`) · status `enabled` |
| Host | `leonix-media-git-completion-launc-b1b333-…vercel.app` — the Golden **branch alias** |
| Path | `/api/revenue-os/webhook` |
| Bypass | automation-bypass query parameter present (value never recorded) |
| Description | "Stripe TEST webhook for Leonix Revenue OS on protected Servicios Preview." |
| Duplicates | none — exactly one TEST destination exists |

**Event coverage: exact 9/9 match**, no missing, no extras:
`checkout.session.completed`, `checkout.session.expired`, `invoice.paid`,
`invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`,
`charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`.

#### R.10.2 Real Stripe-signed delivery (two events)

The connector could not create a Checkout Session (that scope was not granted), so the smallest
safe subscribed event was produced instead from disposable TEST objects:

1. probe customer `cus_VFC3dMuMnCPjOw` → probe product `prod_VFC3LDtcXTeODR` → subscription
   `sub_1UEhgIRzu3T31dlaYsC9ybCH` (`collection_method: send_invoice`, **no card, no charge**)
2. metadata update → **`customer.subscription.updated`** → Vercel **03:35:04 POST
   /api/revenue-os/webhook → 200**
3. cancel → **`customer.subscription.deleted`** → Vercel **03:35:59 POST → 200**

Both landed on `dpl_44tLyt5DGNYrcn2ZK6jQRhMrV6K9` (branch-alias target), distinct from the
01:45:38 synthetic bypass probe that returned 400. **A 200 rather than 400 proves the Stripe
signature validated end to end** — the deployed `STRIPE_WEBHOOK_SECRET` matches this destination.
Vercel protection did not intercept; the application handler answered.

Safety was verified in source *before* triggering: `handleSubscriptionUpdated` /
`handleSubscriptionDeleted` both return `{ok:true, outcome:"ignored", code:"not_leonix_subscription"}`
when `loadSubscriptionRecord` finds no record, returning before any write.

#### R.10.3 Zero business mutation (read-only Supabase, after both deliveries)

| Check | Result |
|---|---|
| `leonix_subscription_records` rows for the probe subscription | **0** |
| `leonix_payment_records` created in the window | **0** |
| `listing_package_entitlements` created in the window | **0** |
| `servicios_public_listings` rows touched in the window | **0** |
| Servicios rows / published (pre-payment baseline) | **104 / 103** |

Cleanup: probe subscription canceled, probe product archived. The probe customer
(`cus_VFC3dMuMnCPjOw`, labelled "LEONIX INFRA PROBE - DELETE ME") remains in Stripe TEST — the
connector exposes no customer-delete operation. It holds no card and no paid invoice.

#### R.10.4 Deployment-identity truth (recorded deliberately)

The Stripe destination targets the **persistent branch alias**, which now resolves to
`dpl_44tLyt5DGNYrcn2ZK6jQRhMrV6K9` (docs commit `bb4e5c56`) rather than the originally pinned
`dpl_GtxJzwUWsEJaViSBAnk4nYXfzhp7` (`5b5aae46`). This is **not a runtime source change**: the
runtime-consumed application tree is byte-identical (`app/` = `f4ed31d9`, `supabase/` = `6d5014bc`)
at both commits, and every intervening commit is documentation-only.

**Golden runtime proof therefore follows the runtime code/app tree and the branch alias, not a
permanently pinned deployment id.** Owner QA and webhook delivery must both use the branch alias
`https://leonix-media-git-completion-launc-b1b333-jesus-caceres-projects.vercel.app` so that
browser actions and Stripe deliveries reach the same running build.

#### R.10.5 Result

Infrastructure blockers: **0**. `SERVICIOS PRE-OWNER-QA PROOF CERTIFICATION: YES`.
Owner runtime (GR-01…GR-44) remains pending; nothing here is a GR PASS.
