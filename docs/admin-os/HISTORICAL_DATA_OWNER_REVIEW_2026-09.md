# Historical Data Owner-Review Ledger - 2026-09

Status: READ-ONLY forensic ledger. NOTHING in this document has been executed. No row was inserted, updated, deleted,
repaired or cleaned up. Every SQL block below is a TEMPLATE for a future, owner-approved, one-row-at-a-time action.

Evidence basis
- Production Supabase project "Leonix Media" (`xuieateniufcrsfdomwl`), SELECT statements only, snapshot taken at DB clock
  2026-09-19 03:52 UTC (= 2026-09-18 evening US Central). Counts can drift after this instant.
- Repo evidence: `docs/admin-os/PUBLICATION_CIRCUIT_REPAIR_2026-09-18.md`, `CATEGORY_CIRCUIT_CLOSEOUT_2026-09.md`,
  `PROPOSED_DB_HARDENING_2026-09.md`, and source under `app/`.
- VERIFIED IN PROD = queried in the production database. UNVERIFIED = not checkable from the database (Stripe-side object
  state, live HTTP rendering of the public site, who ran which script).
- Ids are shown as ids only. Owner ids are 8-character prefixes. Emails/phones are not reproduced.
- Mode fact that applies to every payment below: all 39 `leonix_payment_records` sessions are `cs_test_` (36) or have no
  session (3); all 9 webhook ledger events are `livemode=false`. There is NO live-mode payment in production data.
  All "paid" money here is Stripe TEST money (11 paid rows, 244,380 cents total).

---

## 0. Summary table

| # | Anomaly | Rows | Severity | User-visible impact | Owner decision needed |
|---|---|---|---|---|---|
| 1 | Servicios "Plomería León del Valle QA" duplicate cluster SERV-2026-000111..115 | 5 listings, 8 payment records (3 pending w/ session, 2 pending w/o session, 3 canceled) | Low | None public (all `pending_payment`, never published). Clutters owner dashboard + Admin queue; 2 stale open Stripe sessions | How to retire 112-115 (the documented "Admin archive" path is now BLOCKED by policy - see 1C) |
| 2 | Paid but never published Autos: AUTO-2026-000219, AUTO-2026-000220 | 2 listings, 2 paid records, 2 entitlements (both past `ends_at`) | Medium (would be High if live money) | Owner paid (test) and got no public listing; 30-day paid terms have fully lapsed unused | Honor with a fresh term, or close as test data. 220 also has no dealer parent |
| 3 | Public paid-lane rows with no payment record and no entitlement, created on/after 2026-07-01 | 20 rows (Servicios 4, Restaurantes 4, BR 10, Rentas 2); 18 are QA fixtures | Medium-High (10 fixtures published < 4 h ago) | Test/QA listings are publicly eligible on production | Confirm fixtures are intentional; retire or comp them explicitly |
| 4 | Duplicate Restaurante subscription (REST-2026-000005) | 1 listing, 2 paid records, 2 DIFFERENT Stripe subs, 2 expired entitlements, 0 subscription records | Low-Medium | Listing is still `published` although both paid terms ended in Aug; subs are invisible to the lifecycle engine | Which sub to keep; cancel the other in Stripe (test) |
| 5 | Legacy En Venta `sold` row SALE-2026-000067 | 1 (the only `sold` row in `listings`) | Low (data) / Medium (latent) | None today (`is_published=false`, hidden). Latent: owner "Reactivate" from `sold` could relist a staff-removed row | Leave hidden. Do NOT apply the `is_published=true` SQL in PROPOSED_DB_HARDENING section 5 |
| 6 | Staff removals/flags with no `suspended_reason` | 16 rows: Autos 1, generic `listings` 15 (14 staff-audited + SALE-67); plus 7 owner-side rows that are correctly null | Low; Autos one is Medium | AUTO-2026-000003 is owner-self-restorable (staff removal not marked) | Optional data-only backfill of `moderation` for audit-proven rows |
| 7 | Synthetic e2e/smoke payment rows | 5 rows (1 paid, 4 canceled) with non-uuid `listing_id`; 1 stale active entitlement | Low | None public; inflates "paid" totals by 2,499 cents and Rentas/Empleos payment counts | Approve archive/exclusion of the 5 rows from revenue reporting |

Cross-cutting facts (verified): 10 of 11 `active` entitlements are past `ends_at` (no expiry sweep has flipped them); the
subscription lifecycle table `leonix_subscription_records` holds exactly 1 row (Autos dealer AUTO-2026-000221).

---

## 1. Servicios "Plomería" SERV-2026-000111 .. 000115

### CURRENT TRUTH (verified in prod)
All five: `servicios_public_listings.listing_status = 'pending_payment'`, `published_at = NULL`, `suspended_reason = NULL`, same
owner `d29bc786` (internal Leonix account; a masked leonix email appears on the 000114 payment record), same business name,
slugs `plomeria-leon-del-valle-qa` and `-2` .. `-5`. Not public. No entitlement rows, no subscription rows for any of them.

| Ad ID | Listing id | Listing updated | Payment records (all `servicios_base_monthly`, `monthly_subscription`) |
|---|---|---|---|
| SERV-2026-000111 | 8bc1a618-4bd2-49c5-bf43-bfca272d8048 | 2026-09-15 20:07:46 | `24825cb6-23ce-4e12-a6a2-21c941a41169` canceled 2026-09-15 20:07:48 (created 09-14 05:26, `cs_test_`, 19,950c); `0f2dec92-8d45-48ac-bbbd-4dd0f6ccc8ba` PENDING, attempt_generation 2, **no Stripe session**, 39,900c |
| SERV-2026-000112 | 3c9f9798-ebce-4d07-9125-c1964e83e141 | 2026-09-15 21:54:44 | `05e305e8-957f-4146-9269-f1bcb6e1cdce` canceled (no session); `88b6812b-e2a0-48da-8a41-68eb567eadaa` PENDING gen 2, **no session** |
| SERV-2026-000113 | 5891dac2-7fbd-41bd-9c40-8f864fdc3a37 | 2026-09-16 03:49:56 | `5732f4e2-d845-4b52-a819-d6ba5aad05d7` PENDING, `cs_test_` session created 09-16 03:49 (older than 24 h; expiry event never recorded) |
| SERV-2026-000114 | 8d016fb3-8380-4562-8eba-735476a10394 | 2026-09-17 23:12:55 | `f3337a02-8f77-4bde-a181-e20a149c74ff` canceled 2026-09-18 23:12:59 (session expired; webhook `checkout.session.expired` ledger row at 23:12:57) |
| SERV-2026-000115 | 04542fa5-46ea-4b4c-a60e-71b9cb653142 | 2026-09-18 03:40:52 | `998c5af9-3743-4730-ad91-9f301f374223` PENDING, `cs_test_` session created 09-18 03:40 (24 h expiry falls at ~09-19 03:40 UTC, i.e. at/after this snapshot) |

Delta vs `PUBLICATION_CIRCUIT_REPAIR_2026-09-18.md` section 4: 000114 has since flipped from pending to canceled (the signed
webhook is now delivering expiry events: 2 new `checkout.session.expired` ledger rows at 2026-09-18 23:12:57 / 23:13:41).
Open pending records now: 111 (no session), 112 (no session), 113 (stale session), 115 (session about to expire).
Whether the Stripe sessions for 113/115 are still open: UNVERIFIED (Stripe-side).

### WHY IT EXISTS
Defect (fixed in code, per repair doc section 2): the Application form's non-edit mount wiped the primed canonical listing id
every time it mounted (Back to edit, or return from a cancelled Stripe checkout). The next pending-payment save then carried no
`existingListingId`, so the publish route (correctly) INSERTed a new row, minting `name`, `name-2` ... `name-5`. Each day's
QA retry (09-14, 09-15 x2, 09-16, 09-17, 09-18) produced one more row. The fix binds identity to the draft
(`serviciosDraftListingIdentity.ts`). The two "gen 2, no session" pending records (111, 112) are consistent with the attempt-key
regeneration path cancelling the prior attempt and reserving a new record whose Stripe session was never attached; that
specific mechanism is inferred, not proven. First attempt on 111 charged 19,950c vs 39,900c later (discount on the first
attempt only) - cosmetic.

### SAFE OWNER ACTION LATER
1. Do nothing to the payment records by hand. The fixed webhook resolves open sessions itself: when Stripe expires 113 / 115
   (24 h), `checkout.session.expired` flips the record to `canceled`. Re-check with the read query below after 24 h.
2. Keep SERV-2026-000111 as the canonical row (oldest, slug without suffix). Owner checks in the TEST-mode Stripe account that
   no session for 113/115 was ever paid. If one WAS paid, fulfil it by re-delivering the Stripe event to the fixed webhook -
   never by marking the record paid.
3. Retirement of 112-115: the repair doc section 4 step 3 says "use the existing Admin Servicios status action to move to
   `archived`". THAT IS NO LONGER POSSIBLE: `adminPrePublishActionPolicy.ts` (closeout defect 15) refuses `archive`/`suspend`
   on `pending_payment` rows (`not_published`). So either (a) leave them - they are invisible and harmless - or (b) approve a
   one-off, guarded, reversible status write (TEMPLATE, not executed):
   ```sql
   -- before-image first: select id, leonix_ad_id, listing_status, updated_at from servicios_public_listings where leonix_ad_id in (...);
   update servicios_public_listings
      set listing_status = 'archived', updated_at = now()
    where leonix_ad_id = 'SERV-2026-000112'               -- one row per statement
      and listing_status = 'pending_payment'
      and not exists (select 1 from leonix_payment_records p where p.listing_id::text = servicios_public_listings.id::text and p.payment_status = 'paid')
      and not exists (select 1 from listing_package_entitlements e where e.listing_id::text = servicios_public_listings.id::text);
   -- rollback: set listing_status = 'pending_payment' for the same id.
   ```
   (`archived` must be confirmed as an accepted value for this column before use.)
4. NOT to do: hard-delete before a before-image export and owner sign-off; touch `leonix_payment_records`; bulk-update by
   business name; archive 111 (canonical); re-publish any of them (a never-paid row goes live only via verified payment).

---

## 2. Paid-draft Autos AUTO-2026-000219 and AUTO-2026-000220

### CURRENT TRUTH (verified in prod)
| Field | AUTO-2026-000219 | AUTO-2026-000220 |
|---|---|---|
| Listing id | 4d4b9b38-5e78-48e2-9bf5-e739fdd8ba3a | id prefix fd14cdd8 (look up by Ad ID) |
| Lane / status | `privado` / `draft` | `negocios` / `draft` |
| published_at / expires_at | NULL / NULL | NULL / NULL |
| Created / last updated | 2026-07-06 18:49:25 / 2026-07-06 18:54:12 | 2026-07-12 22:31:32 / 2026-07-14 22:29:37 |
| Owner | `d29bc786` (internal Leonix account) | `086b3ea8` (the owner's business account; also owns AUTO-2026-000221, REST-2026-000005) |
| Paid record | `89fde0f4-977a-44f2-91d9-41366dd1f175` PAID `autos_privado_30d` 2,499c, created 18:49:38, paid 2026-07-06 18:52:06, `cs_test_` | `30822d51-d7d1-4ee8-a78a-8d9dad0ca0c5` PAID `autos_dealer_inventory_pack_monthly` 12,900c, created 2026-07-12 22:31:33, paid 22:33:23, `cs_test_` |
| Other records | none | 2 CANCELED same package (`c8e10fe1-9b6e-4ce2-ad7a-8590d8b4cd5c` 07-14 22:29:11, `31368603-b9ed-47b6-ac8d-be4dec319cb0` 07-14 22:29:38) |
| Entitlement | `d6d4d54c-ef24-44bb-b760-442cc5f77102` status `active`, 2026-07-06 18:52:08 -> 2026-08-05 18:52:08, grant `stripe_webhook` - PAST `ends_at` (lapsed ~45 days) | `7ff4bf86-ef69-4c7f-8c3b-6d02e83f4fb8` status `active`, 2026-07-12 22:33:23 -> 2026-08-11 22:33:23, `stripe_webhook` - PAST `ends_at` |
| Dealer linkage | n/a | `inventory_role` NULL, no `dealer_inventory_parent_listing_id`, no group: it is NOT attached to any dealer parent |
| Subscription rows | 0 | 0 |
| `suspended_reason` | NULL | NULL |

Correction to the repair doc: 000220 is not an add-on "on a draft parent"; it is a standalone `negocios` draft carrying the $129
inventory-pack payment with no parent. The owner's actual dealer parent is AUTO-2026-000221 (active, `autos_dealer_monthly`,
paid 2026-08-24, subscription record active, period to 2026-09-24), created six weeks AFTER the pack was paid.
No webhook-ledger rows exist for either July payment (ledger's first event is 2026-08-24), so their fulfilment attempt left no
`result_code`/`last_error` to inspect: the "activation refused draft with `unsafe_status`" cause is proven from code, not from a
stored error.

### WHY IT EXISTS
Code defect (proven in `revenueAutosPrivadoFulfillment.ts` / the dealer fulfilment, `unsafe_status`): the client "checkout
cancelled" route reset `pending_payment -> draft` while the Stripe session stayed payable. The buyer then paid the still-open
session; the webhook activation refused `draft` (`unsafe_status`), so the payment was recorded (`paid`) and the entitlement
granted, but the listing never went active. 000220's two canceled retries on 07-14 22:29 are the same cancel/reset loop
(the listing `updated_at` 22:29:37 is the second reset). Fixed going forward: a verified payment now activates
`draft` / `payment_failed` rows (see the comment at `revenueAutosPrivadoFulfillment.ts:114`). The two historical rows were
not touched.

### SAFE OWNER ACTION LATER
Everything here is TEST money, so there is nothing to refund; the decision is whether these two drafts are worth publishing.
1. Default recommendation: LEAVE AS-IS and record "closed as test data". They are hidden drafts with zero public impact.
2. If the owner wants them live (e.g. to prove the fixed path on real rows): one row at a time, with a before-image, and grant a
   FRESH term because the paid terms lapsed unused (TEMPLATE, not executed):
   ```sql
   update autos_classifieds_listings
      set status = 'active', published_at = now(), expires_at = now() + interval '30 days', updated_at = now()
    where leonix_ad_id = 'AUTO-2026-000219' and status = 'draft' and published_at is null;
   -- rollback: set status='draft', published_at=null, expires_at=null.
   ```
   The stale entitlement (`ends_at` 2026-08-05) should be re-dated by the sanctioned entitlement path, not edited ad hoc.
3. 000220 must NOT be activated standalone: an inventory pack has no meaning without a dealer parent. Either leave it a
   draft, or (owner decision) convert it into an inventory vehicle of AUTO-2026-000221 (`inventory_role='inventory_vehicle'`,
   `dealer_inventory_parent_listing_id` = 000221's id, group id) and run the capacity guard first.
4. NOT to do: use Admin Restore/Republish (refused by policy: the rows were never published); re-deliver the old
   `checkout.session.completed` events without first confirming the handler's idempotency on an already-`paid` record (it may
   silently no-op or double-grant); edit `paid_at`, `ends_at` or payment status to "make it look consistent"; bulk-activate
   drafts.

---

## 3. Public paid-lane rows with NO payment record and NO entitlement (post-Revenue-OS)

Definition used: public/active/published row (listings `status='active' and is_published`; Servicios/Restaurantes/Empleos
`published`; Autos `active`), lane is a paid lane (`stripeEligible` in `revenuePricingMatrix.ts`), no `leonix_payment_records`
row with `payment_status='paid'` for the listing, and no `listing_package_entitlements` row at all. Free lanes (En Venta,
Comunidad, Busco, Mascotas) are excluded. "Post-Revenue-OS" cut-off = 2026-07-01, the day the first payment record exists
(`leonix_payment_records` table itself is from migration 20260526120000; nothing in it predates 2026-07-01).

### CURRENT TRUTH (verified in prod)
| Lane | Public rows | Paid+entitled | NO evidence, ALL-TIME | NO evidence, on/after 2026-07-01 |
|---|---|---|---|---|
| Servicios | 103 | 1 (SERV-102) | 102 | **4** |
| Restaurantes | 7 | 2 (REST-2, REST-5) | 5 | **4** |
| Bienes Raices | 11 | 1 (BR-18) | 10 | **10** |
| Rentas | 61 | 1 (RENT-167) | 60 | **2** |
| Autos | 5 | 1 (AUTO-221) | 4 | 0 (the 4 were created 2026-06-29) |
| Empleos | 5 | 1 (JOB-5) | 4 | 0 (JOB-4 created 2026-06-03) |
| Clases (`listings`) | 10 | 0 | 10 | 0 (all created 2026-05-14..18; free/paid tier ambiguous) |
| Comida Local | 0 | 0 | 0 | 0 |
| **Total post-2026-07-01** | | | | **20** |

The 20 post-cut-off rows, by cluster:
- **A. "ADQA" Admin-QA seed batch, 2026-08-20 23:29:35-39, owner NULL (8 rows)**: SERV-2026-000107, 000108, 000109, 000110
  ("ADQA Servicios - Standard / Lion-Heritage / Sunset-Community / Black-Lion"); REST-2026-000010, 000011, 000012, 000013
  ("ADQA Restaurante - ..."). All `published`, Restaurantes `package_tier='free'`, no payment attempts of any kind.
- **B. QA catalog seed, 2026-09-19 00:13:29-30 UTC (about 3.6 hours before the snapshot), owner `8eb33ba9` (10 rows)**:
  BR-2026-000025 .. BR-2026-000033 (titles `br-manual-qa-catalog-v1 Privado/Negocio ...`), and RENT-2026-000169
  (`[READINESS][WITH_PHOTOS][DB] Rentas Privado ...`, owner `64780d7f`). Each has exactly one lifecycle row
  `null -> active` written within the same second: they were INSERTed straight to `active` with `is_published=true`,
  `is_free=false`, no `publish_attempt_key`, `expires_at` NULL. Sample ids: BR-2026-000025 `5f5f33e6...`,
  BR-2026-000033 `3207aa10...`, RENT-2026-000169 `7d1f08f7...`.
- **C. BR-2026-000019** (`6eb2f138...`, 2026-07-15): `inventory_property` child of BR-2026-000018, which IS paid
  (`br_agent_monthly`, entitlement active until 2026-08-14 - itself past `ends_at`). Covered by the parent's package; not an
  orphan. The repair doc flagged it; it is explained.
- **D. RENT-2026-000164 "Rento Cuarto"** (`c1864549...`, owner `5d386e1c`, `personal`, created/published 2026-07-01 02:46 UTC,
  `expires_at` 2026-09-26): one day before the first payment record; effectively a pre-Revenue-OS publication. Real-looking,
  not a fixture.

Pre-cut-off no-evidence public rows (98 Servicios, 58 Rentas, 4 Autos privado/negocios AUTO-155..158 created 2026-06-29,
JOB-4, REST-1, 10 Clases): legacy, published before any payment product existed. Not listed individually.

Note: whether the public site actually renders each of cluster B (Rentas with null expiry follows the closeout's Rentas term
rule; BR personal has no parent gate) was not tested over HTTP: UNVERIFIED. Status/`is_published` are public-eligible.

### WHY IT EXISTS
- A and B are seeds written by scripts/service-role code that bypass the publish route, so no payment record or entitlement
  is ever created. A is an Admin-QA fixture batch (owner NULL, one-second cadence). B is a manual-QA catalog seed whose
  `active` insert is the "readiness/with-photos DB" fixture pattern. These insert straight to a public state - the gap is that
  production has no guard (no trigger/constraint) refusing `active` without evidence for paid lanes; the app-level guards
  only protect the routes.
- C is by design (children ride the parent package).
- D predates the product.
- Who ran B and whether a live QA session is still using them: UNVERIFIED (the timing suggests an in-progress session).

### SAFE OWNER ACTION LATER
1. First confirm with whoever is running live QA whether cluster B is intentional and still in use. It is < 4 h old.
2. Decide per cluster: (a) keep as labelled demo/QA inventory (then add a durable marker so Admin shows "QA fixture" instead of
   "public, no payment"), or (b) unpublish. Reversible unpublish, one row at a time (TEMPLATE, not executed):
   ```sql
   -- listings-table rows (BR/Rentas): reversible
   update listings set status = 'paused', is_published = false, updated_at = now()
    where leonix_ad_id = 'BR-2026-000025' and status = 'active';   -- rollback: status='active', is_published=true
   ```
   For Servicios/Restaurantes fixtures use the Admin suspend action (they are `published`, so it is allowed) rather than SQL.
3. If any of these should be deliberately comped, use the sanctioned Admin comp / entitlement path so a payment/entitlement
   evidence row exists; do not invent a payment record.
4. NOT to do: back-fill fake `leonix_payment_records`; bulk-delete by title pattern (`br-manual-qa-catalog-v1%`, `ADQA%`) without
   reading the row list; touch the 98 legacy Servicios / 58 legacy Rentas rows (they pre-date payments and are real
   inventory); unpublish BR-2026-000019 (its parent is paid).

---

## 4. Duplicate Restaurante subscription (REST-2026-000005)

### CURRENT TRUTH (verified in prod)
Listing REST-2026-000005 "Leonix QA Restaurantes V2", listing id `12582849-99cb-488a-a5d0-8640f4f21c11`, owner `086b3ea8`,
`status='published'`, `package_tier='free'`, `suspended_reason` NULL.

| Payment record | Created | Paid | Package | Amount | Stripe subscription | Entitlement |
|---|---|---|---|---|---|---|
| `b7adb423-b6f3-4af3-b310-1c8a7af2e04f` | 2026-07-03 03:44 | 2026-07-03 03:49:38 | `restaurantes_base_monthly` | 49,800c | `sub_1Toy...c8S9Kb` (`cs_test_`) | `f5568549-3b9f-4e53-8a88-f2c5da82c129` status `expired`, ends 2026-08-02 |
| `36777c2a-680c-4124-a415-a65d866ba984` | 2026-07-07 00:16 | 2026-07-07 00:18:48 | `restaurantes_base_monthly` | 44,820c | `sub_1TqM...8L6eN2` (`cs_test_`) | `ff59d20b-b711-4a73-ab30-74dfbcedf2e8` status `expired`, ends 2026-08-06 |

- Two different Stripe subscriptions, one listing, one owner, same package: the ONLY "same listing + package paid twice" case in
  the database. It is also the only "same owner + package, monthly_subscription, 2 paid" case.
- `leonix_subscription_records` has NO row for either subscription (the table holds 1 row total: Autos dealer AUTO-221). The
  lifecycle engine (renew / grace / suspend / cancel) therefore cannot see these subs.
- The listing remains `published` although both entitlements are `expired`: the paid term ended 2026-08-02/06 and nothing
  projected that back onto the listing.
- Related on the same owner, listing REST-2026-000002 (`cd914354-e676-4f7e-8fec-29614f12cd16`): `restaurantes_offers_addon` PAID
  `d2893d45-72c0-47f6-8fca-c4d79f10c12e` (sub `sub_1TqQ...rJV7jD`, 9,900c) after 5 canceled attempts on 2026-07-07; its
  entitlement `bd231297-...` still says `active` although `ends_at` is 2026-08-06.
- `draft_listing_id` duplicates: restaurantes_public_listings has 7 rows, 7 non-null `draft_listing_id`, 7 DISTINCT: **0
  duplicates**. The proposed unique index (`restaurantes_public_listings_draft_listing_id_uidx`,
  PROPOSED_DB_HARDENING section 3) is NOT present in prod (only pkey / `leonix_ad_id` / `slug` unique indexes exist).
- Two `customer.subscription.updated/deleted` events on 2026-09-12 were `ignored: not_leonix_subscription` for a subscription
  (`...C9ybCH`) with zero matching payment rows - a third, unrelated unknown subscription; not part of this case.
- Stripe-side status of the two REST-5 subs (still active/billing in test mode or cancelled): UNVERIFIED.

### WHY IT EXISTS
The publish/checkout path at that time (2026-07-03 and 2026-07-07) had no active-entitlement guard, so a second Restaurantes
base subscription could be created for a listing that already had one (both dates pre-date the guard the repair doc mentions and
pre-date the subscription-records table, migration 20260805090100, which is why neither sub was ever recorded). It was a QA
re-run by the owner in test mode, not customer behavior. The stale-published state exists because entitlement expiry is not
swept and there was no subscription record to drive suspension.

### SAFE OWNER ACTION LATER
1. In the TEST-mode Stripe account, decide which of the two subscriptions to keep and cancel the other there (Stripe-side; test
   money). Confirm both are not still billing.
2. Do not edit `leonix_payment_records`; the two paid rows are correct history of what happened.
3. Decide REST-2026-000005's public state: it is published with no live entitlement. Either grant a fresh term via the
   sanctioned entitlement path or unpublish through Admin Restaurantes suspend (reversible). Owner call because it is the
   owner's own QA listing.
4. Approve applying the additive unique-index proposal for `draft_listing_id` (no rows violate it today) - separate approval,
   not part of this ledger.
5. NOT to do: back-create `leonix_subscription_records` rows by hand for these subs (they would need real Stripe period data and
   a consent record); delete either payment row; cancel via SQL.

---

## 5. Legacy En Venta `sold` row - SALE-2026-000067

### CURRENT TRUTH (verified in prod)
The only `status='sold'` row in `listings`. `id = 5f1b6eb5-da3e-43bc-9205-f4464b984e31`, `category='en-venta'`, `is_published=false`,
`is_free=false`, `published_at` NULL, `expires_at` NULL, owner `8eb33ba9`, title `EV_AUTH_1778783265983 iPhone 1` (an e2e auth
fixture), `suspended_reason` NULL, no payment/entitlement/report rows. Its full status history (`listing_lifecycle_audit`):

`(none) -> draft` 2026-05-14 18:27:47 -> `active` 05-14 -> **`flagged`** 2026-06-02 20:14:17 (Admin: `listings_admin_suspend`,
patch `is_published=false`) -> **`removed`** 2026-06-16 20:09:38 (Admin: `listing_removed_by_admin`) -> **`sold`**
2026-09-09 19:14:42 (`is_published` stayed false; NO `admin_audit_log` row, so it was not an Admin action).

### WHY IT EXISTS
This differs from the story in `PROPOSED_DB_HARDENING_2026-09.md` section 5 and `CATEGORY_CIRCUIT_CLOSEOUT` P1 ("old
`markStatus('sold')` hid a sold listing"). The row was ALREADY unpublished by staff on 2026-06-02 and REMOVED on 2026-06-16.
On 2026-09-09 an owner-side (non-Admin) write flipped `removed -> sold` - the pre-closeout dashboard let the owner mark any row
`sold`, and old `markStatus` also wrote `is_published=false` for sold. So the "sold" is an owner action laid on top of a
staff removal (probably an e2e run against production). The current code fixes forward (`soldEnVenta` keeps `is_published`
untouched and the owner may only relist paused/sold/active) but note `dashboardOwnerMayActivateFromStatus` treats `sold` as
owner-relistable and the relist patch writes `status='active', is_published=true`: a `sold` row that was really a staff removal
can be self-relisted by its owner, laundering the removal. Whether RLS blocks that write: UNVERIFIED.

### SAFE OWNER ACTION LATER
1. Leave it hidden. Do NOT apply the `update ... set is_published = true` proposed in PROPOSED_DB_HARDENING section 5: it would
   publish an e2e fixture that staff explicitly removed, on the theory that it was a legitimate sold listing.
2. Optional, reversible restoration of the true state (TEMPLATE, not executed):
   ```sql
   update listings set status = 'removed', updated_at = now()
    where id = '5f1b6eb5-da3e-43bc-9205-f4464b984e31' and category = 'en-venta' and status = 'sold';
   -- rollback: set status = 'sold'
   ```
3. Owner-decision follow-up (code, separate): make owner "sold" refuse rows whose prior status is flagged/removed, or add a
   server/DB guard, so `removed -> sold -> active` cannot resurrect staff removals.
4. NOT to do: set `is_published=true`; hard-delete (it carries the only audit trail of the removed->sold anomaly); assume every
   `sold` row is legitimate (this is the sole one, so no others exist to check).

---

## 6. Staff removals/flags with no `suspended_reason`

### CURRENT TRUTH (verified in prod)
`suspended_reason` is NULL on EVERY row in every lane: `listings` 0 set, Servicios 0, Restaurantes 0, Autos 0.
Column existence: present on `listings`, `servicios_public_listings`, `restaurantes_public_listings`,
`autos_classifieds_listings` and `comida_local_public_listings`. Comida Local has 0 rows, so there is nothing legacy to mark
there (and the column now exists in prod: PROPOSED_DB_HARDENING section 7 "column missing" is STALE).

**Autos** (`autos_classifieds_listings`, 17 rows): one removed/suspended-type row, no `suspended` rows.
- AUTO-2026-000003, id prefix `f1ce81ee`, `privado`, `removed`, `published_at` 2026-04-23, updated 2026-06-03 00:12:50, owner `8eb33ba9`,
  `suspended_reason` NULL. Admin audit: `autos_admin_suspend` 2026-06-03 with patch `{status:'removed'}` only (no reason marker).

**Generic `listings`** - 15 rows staff-actioned (each has an `admin_audit_log` `listings_admin_suspend` and/or
`listing_removed_by_admin` action), all `suspended_reason` NULL, all `is_published=false`:
- Comunidad `removed` x3: COM-2026-000003, 000004, 000005 (flagged 06-03, removed 06-16).
- En Venta `removed` x3: SALE-2026-000057, 000058, 000081; `flagged` x4: SALE-2026-000074, 000075, 000076, 000080;
  plus SALE-2026-000067 (now `sold`, section 5) = 8 En Venta.
- Rentas `removed` x4: RENT-2026-000011, 000038, 000083, 000155 (smoke fixtures, flagged 06-03, removed 06-16).
  (3 + 8 + 4 = 15.) By title, SALE-57/58/67, the 3 Comunidad rows and the 4 Rentas rows are e2e/QA/smoke fixtures
  (owner `8eb33ba9`); SALE-74..81 are real-looking rows of owner `086b3ea8`.
- Extra: SALE-2026-000076 and 000080 (still `flagged`) each carry `listing_ai_review` "approved / low risk" events (latest
  2026-09-14) but their status did not change - an AI approval that has no effect on a staff flag.

Owner-side null rows that are CORRECTLY null (no staff action in `admin_audit_log`), 7 rows: En Venta `removed`
SALE-2026-000077, 000078, 000079, 000082, 000083 (draft -> removed by the owner on the creation day),
Bienes Raices `paused` BR-2026-000020 (owner pause 2026-07-28), Servicios `paused_unpublished` SERV-2026-000070 (owner
"PauseGate" test, 2026-04-23).

**Comida Local**: 0 rows.

Behavior with NULL: the payment-suspension engine's restore is a compare-and-swap on `suspended_reason='payment'`
(`subscriptionLifecycle.ts:111`), so null rows are NEVER auto-restored by payment recovery - safe. Admin surfaces show an honest
"no reason stored" fallback (`publicationSemantics.ts`). The Autos OWNER restore route refuses only rows with a truthy
`suspended_reason` (`restore/route.ts:37`, `markAutosClassifiedsListingRestoredIfOwner`), so AUTO-2026-000003 - staff-removed
but null - IS owner-self-restorable (`removed -> active`).

### WHY IT EXISTS
Column added 2026-08-05 (migration 20260805090500) as additive-nullable with the explicit note that "moderation suspend paths
should set `suspended_reason='moderation'`" was a documented follow-up. Every staff action in this table pre-dates that (all
2026-06-02..06-16) and the generic Admin listings suspend/remove routes still write only `status` / `is_published`. The Autos
Admin route now stamps `moderation` (closeout P1, fixed forward); the 2026-06-03 removal pre-dates it.

### SAFE OWNER ACTION LATER
1. Only AUTO-2026-000003 has a real exposure (owner self-restore of a staff removal, owner account `8eb33ba9` is the QA account).
   Optional data-only, reversible marker (TEMPLATE, not executed):
   ```sql
   update autos_classifieds_listings set suspended_reason = 'moderation'
    where leonix_ad_id = 'AUTO-2026-000003' and status = 'removed' and suspended_reason is null;
   -- rollback: set suspended_reason = null
   ```
2. Generic `listings`: no action required for safety. If a marker backfill is wanted, restrict it to the 15 rows with an
   `admin_audit_log` staff action (list above) and `suspended_reason='moderation'`; rollback = NULL.
3. NOT to do: stamp `moderation` on the 7 owner-side rows (would block legitimate owner restore/relist); stamp `payment`
   on anything (that would make payment recovery auto-restore a staff removal); bulk-update by status alone.

---

## 7. Synthetic e2e / smoke payment rows and mode markers

### CURRENT TRUTH (verified in prod)
5 `leonix_payment_records` rows have a non-uuid `listing_id` and a synthetic Ad ID; no owner id, no customer email/name:
| Row id | Created | Status | Package | Listing id / Ad ID | Notes |
|---|---|---|---|---|---|
| `e9b9bb07-aa32-4383-bc87-f651c2db83a9` | 2026-07-01 23:36:34 | canceled | `rentas_30d` | `stripe_e2e_test_rentas_001` / STRIPE-E2E-RENTAS-001 | source `stripe_checkout`, `cs_test_` |
| `7f7f1559-d3d2-4ccb-b01c-0e8d76ada9e7` | 07-01 23:36:36 | canceled | `empleos_job_post_paid` | `stripe_e2e_test_empleos_001` | `cs_test_` |
| `c5969e37-62f5-4400-8dfa-561166bd1960` | 07-01 23:36:48 | **PAID** (paid_at 23:37:39, 2,499c) | `rentas_30d` | `stripe_e2e_test_rentas_002` / STRIPE-E2E-RENTAS-002 | source `stripe_webhook`; entitlement `afcc90f7-ab0e-40da-84e0-7b0034a87eea` `active` but `ends_at` 2026-07-31 (stale) |
| `0174cfb0-5c89-4655-918b-df06463fec31` | 07-01 23:38:23 | canceled | `rentas_30d` | `stripe_smoke_rentas_17829491...` | `cs_test_` |
| `cdc34079-ea77-4a13-9e34-04cff82c5349` | 07-01 23:38:24 | canceled | `empleos_job_post_paid` | `stripe_smoke_empleos_1782949...` | `cs_test_` |

All carry metadata gate `STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01` (the harness that created them). Mode markers, all
verified: 36 of 39 records have `cs_test_` sessions, 3 have no session (Servicios 111 x1, 112 x2 - section 1), 0 are `cs_live_`;
webhook ledger 9 events, all `livemode=false` (7 completed, 2 ignored). Money: the 11 paid rows sum to 244,380 cents; the
synthetic paid row is 2,499 of that. Promo codes: 12 active, 1 draft, 1 revoked (not payment rows; not assessed for QA
ownership). The QA-owner ids in payment data are `d29bc786` (internal Leonix account: Servicios 111-115, AUTO-219, AUTO-223,
RENT-166/167) and `8eb33ba9` (e2e owner: Ofertas flyer attempts). `086b3ea8` is the owner's business/QA account and carries
the Restaurantes/Autos/BR/Empleos test payments - so most "real-looking" payments are also test-mode by owner accounts.
Not present: any payment row with a customer email containing e2e/smoke/qa markers.
Another QA cluster outside the asked scope: AUTO-2026-000223 (`negocios`, `pending_payment`, owner `d29bc786`) has 3 canceled +
1 pending `autos_dealer_monthly` attempts created 2026-09-15..18.

### WHY IT EXISTS
The Revenue OS webhook-fulfilment verifier / e2e harness (`verify-stripe-revenue-os-webhook-fulfillment-01.mjs`) seeds
payment records with non-uuid synthetic listing ids to prove checkout -> webhook -> entitlement end to end without a real
listing, then leaves them. No lane cleans them up. The paid one produced a real entitlement (`afcc90f7`), which is why the
"paid without entitlement" and "entitlements without payment" integrity checks read clean.

### SAFE OWNER ACTION LATER
1. Do not delete. Approve a REPORTING exclusion first: filter revenue/Admin payment views on
   `listing_id !~ uuid-pattern` or `leonix_ad_id like 'STRIPE-E2E-%' or like 'STRIPE-SMOKE-%'` so 2,499c of synthetic "paid"
   and 4 synthetic canceled rows do not count as business revenue.
2. If a physical marker is wanted, add it via `metadata` (e.g. `{"synthetic": true}`) on those 5 ids only, one statement per
   id, after exporting a before-image (rollback: remove the key).
3. Expire the stale synthetic entitlement `afcc90f7` through the sanctioned entitlement path, not by hand.
4. NOT to do: delete the 4 canceled rows to "tidy up" (they prove the expiry-event path worked); mark any real payment as
   synthetic by pattern; flip the paid row to canceled/refunded (it was genuinely paid in Stripe test mode).

---

## 8. Additional findings not in the request (verified)
1. 10 QA fixtures were INSERTed `active`+published at 2026-09-19 00:13 UTC (section 3 cluster B). If a session is not
   currently running that seed, treat as unexplained public writes.
2. 10 of 11 `active` entitlements are past `ends_at` (autos pack 08-11, autos privado 08-05, BR agent 08-14, Empleos 09-03,
   Rentas x2 07-31 / 08-13, Restaurantes offers 08-06, Servicios base 08-12 and offers 08-12, one package-less row 08-21).
   Public listings keep serving after the paid term (e.g. REST-5, SERV-102). No expiry sweep flips status.
3. The repair doc's Plomería archive step is now impossible through Admin (section 1).
4. Comida Local `suspended_reason` now exists in prod; PROPOSED_DB_HARDENING section 7 is stale.
5. Restaurantes `package_tier` is `free` on all 7 rows including the paid REST-5: fulfilment does not update the tier.
6. No duplicate Leonix Ad IDs across Servicios/Restaurantes/`listings`/Autos.
7. Servicios has one further duplicate group: `leonix global llc` SERV-2026-000006/000007 (owner `086b3ea8`, both published) - not analysed here.

## 9. Verified vs unverified
VERIFIED IN PROD: every row id, status, `is_published`/`listing_status`, timestamp, payment/entitlement/subscription join,
count, index existence, column existence and webhook-ledger row quoted above; all lifecycle/admin-audit histories.
VERIFIED IN REPO: the code defects and fixes cited (fulfilment `unsafe_status`, `adminPrePublishActionPolicy`,
`dashboardOwnerRelistPolicy`, `restore` route, `subscriptionLifecycle` CAS).
UNVERIFIED: Stripe-side state of any session or subscription (open/paid/cancelled); whether cluster B/A rows render on the
public site over HTTP; the identity of the process that seeded cluster B and the 2026-09-09 SALE-67 write; RLS behavior for a
`sold -> active` owner relist; whether the Stripe event re-delivery handler is idempotent on an already-`paid` record.
