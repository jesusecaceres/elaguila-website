# SERVICIOS — LAUNCH CERTIFICATION AUDIT

**Purpose.** Determine exactly what remains before Servicios can become the first Leonix
**100% runtime-certified reference category**.

This is not another source MRI. `SERVICIOS_LIVE_WIRING_MAP.md` and the SERVICIOS-1 / SERVICIOS-2
commits were treated as **evidence, not proof**; every claim below was re-traced against current
runtime source at this HEAD, and two of the map's own statements were found stale (§D-6, §D-7).

| | |
|---|---|
| Worktree | `C:\projects\elaguila-website-launch-lifecycle` |
| Branch | `completion/launch-lifecycle-2026-09-09` |
| HEAD | `569059e11f9db218ae93e54cca0d607cceb7abe7` |
| origin/main | `a0a4783971b42ea1d71ab2602d4720d0d590baf8` |
| Code changed by this audit | **NONE** — audit only |

**Standing verdict: SOURCE IS READY. QA READINESS IS BLOCKED ON ENVIRONMENT, NOT ON CODE.**

> **UPDATED AFTER GATE SERVICIOS-3.** Every source defect this audit raised has been closed,
> corrected, or classified as operations work — see §D for the new state of each and §I for the
> Golden Reference contract. The audit's own D-3 finding was **overstated and has been
> corrected**. HEAD is no longer `569059e1`; see the commit recorded in §D.

---

## A. EXACT CURRENT LIFECYCLE MAP

Re-verified against current source. Only the deltas from `SERVICIOS_LIVE_WIRING_MAP.md` §2 are
called out; everything else in that section re-confirmed.

```
LANDING        /clasificados/servicios                    ServiciosLandingPage           LIVE
CHECKPOINT     /clasificados/publicar/servicios → /checkpoint                            LIVE
APPLICATION    /publicar/servicios  ClasificadosServiciosApplication (~3,962 L)          LIVE
                 address  BusinessAddressVerifiedInput  ← SERVICIOS IS THE ONLY CONSUMER
DRAFT          sessionStorage + IndexedDB (lx-clasificados-servicios-draft)              LIVE
HYDRATION      GET /api/clasificados/servicios/my-listing
                 → serviciosPublishedToApplicationDraft → state + editIdentity           LIVE
PREVIEW        /clasificados/publicar/servicios/preview                                  LIVE
PREVIEW→EDIT   markPublishFlowReturningToEdit + serviciosBackToEditHrefFromPreview       LIVE
PAGAR          newsletter (awaited) → saveServiciosPendingBeforeCheckout
                 → POST /api/clasificados/servicios/publish {pending_payment}
                 → startRevenueCategoryCheckout(SERVICIOS_BASE_CHECKOUT)                 LIVE
REVENUE OS     servicios_base_monthly · 39900c · monthly_subscription
                 · capabilities ["coupons_offers"] · promoEligible                       LIVE-SHARED
STRIPE         /api/revenue-os/checkout; revenueActiveEntitlementGuard blocks a
                 second base charge server-side                                          LIVE-SHARED
WEBHOOK        /api/revenue-os/webhook → stripeEventLedger claim → fulfillment           LIVE-SHARED
ENTITLEMENT    activatePackageEntitlement → listing_package_entitlements                 LIVE-SHARED
ACTIVATION     activatePaidServiciosListingFromRevenueOs  .eq("id", listingId)           LIVE
RESULTS        /clasificados/servicios/results (canonical; /resultados 308s)             LIVE
PUBLIC DETAIL  /clasificados/servicios/[slug]  (+ /servicios/perfil/[slug] → 308)        LIVE
DASHBOARD      /dashboard/servicios  (single canonical doorway — §B-9)                   LIVE
ADMIN          /admin/workspace/clasificados/servicios                                   LIVE
PUBLISHED EDIT serviciosListingEditHref → /publicar/servicios?edit=1&mode=listing-edit   LIVE
REPUBLISH      POST …/publish → **canonicalListingId → .eq("id", …)**  ← CORRECTED       LIVE
LIFECYCLE      subscriptionLifecyclePolicy registers the servicios lane                  LIVE-SHARED
                 crank /api/revenue-os/admin/subscription-sweep — NO caller          BUILT-NOT-WIRED
ANALYTICS      servicios_analytics_events → mirror → listing_analytics                   LIVE
```

---

## B. LAUNCH-CRITICAL SOURCE PROOF

### B-1. Route ownership — CLEAN, one live path per step

Every lifecycle step resolves to exactly one live file. Live redirect shims (`/resultados` → 308
`/results`, `/servicios/perfil/[slug]` → 308 canonical, `/admin/clasificados/servicios` → redirect)
are intentional and keep one canonical URL each.

### B-2. Republish identity — **id-keyed (map §2 diagram is stale)**

`publish/route.ts` current source: `existingListingId` → `getServiciosPublicListingByIdFromDb` →
owner check (**403 `listing_owner_mismatch`** on a foreign row) → adopts that row's own slug →
`.update().eq("id", canonicalListingId)`; `.eq("slug", …)` survives only as the fallback for a
session that never obtained a canonical id. `.insert()` is reached only when neither resolves.
**§5.1's "CLOSED" is true; §2's diagram line saying "SLUG-KEYED" is stale (§D-6).**

### B-3. Commercial truth — PROVEN

| Claim | Evidence |
|---|---|
| $399/month | matrix `servicios_base_monthly` → `priceCents: 39900`, `billingMode: "monthly_subscription"` |
| coupons INCLUDED in base | `capabilities: ["coupons_offers"]` on the base package |
| server-owned price | client sends only category+packageKey; `getRevenuePackageDefinition` resolves the amount |
| 15% verified promo only | `leonix_verified_intro_15_once` Stripe coupon; server-proven verification |
| no 25% promo | the only 25% hits are a founding-partner **approval cap** (`packagePricingRules`) and the **contractual refund retention** (Agreement v1.2 §12) — both explicitly documented as unrelated to the retired campaign |
| no second base charge | `revenueActiveEntitlementGuard` includes `servicios_base_monthly` (verified at runtime: `has(...) === true`) |
| webhook is paid truth | activation only in `activatePaidServiciosListingFromRevenueOs`, called from webhook fulfillment |
| idempotency | `stripeEventLedger` claim before fulfillment |
| failed/cancelled ≠ publish | the pre-checkout save writes `listing_status = "pending_payment"`, `published_at = null` |

### B-4. Address / location — the reference implementation, fully traced

| Question | Answer |
|---|---|
| Input component | `app/components/forms/BusinessAddressVerifiedInput.tsx` — **Servicios is its only consumer** |
| Provider | **Google Geocoding API** — `https://maps.googleapis.com/maps/api/geocode/json` (NOT Places Autocomplete) |
| Client/server boundary | `POST /api/business-address/suggest` (`runtime: "nodejs"`, `force-dynamic`). The key **never** enters the browser bundle |
| Env dependency | `GOOGLE_MAPS_API_KEY` (server-side only) |
| Canonical persistence | city / region / postalCode / country on the listing; `physicalStreet` + `physicalSuite` separate |
| Verification honesty | selecting a suggestion → `verificationStatus: "user_confirmed"`; manual typing → `"manual"`. **Nothing is ever marked "verified".** UI copy states verification is never required |
| Provider failure | `{ok:false, reason}` at HTTP 200 → manual entry; **saving is never blocked** |
| Exact-address privacy | `resolveBusinessAddressPublicView` — a **structural** gate: `exactAddressLine` can only be assigned inside the `showExactAddress === true && hasPrivateAddress` branch |
| Privacy is wired, not shelved | consumed by `resolveServiciosProfile:82`, which gates both `physicalAddressDisplay` and `mapsSearchHref`; every public surface reads that profile |
| Directions | only when `directionsAllowed` — and it self-downgrades if the revealed line would be empty |

> **Correction to a working hypothesis formed during this audit:** an early grep for
> `addressPublicView` in `.tsx` returned nothing, which looked like BUILT-NOT-WIRED. It is not — the
> gate is applied inside `resolveServiciosProfile` itself, upstream of every component.

**Legacy-default note for QA:** `showExactAddress ?? true` — a listing published before the field
existed defaults to SHOWING, deliberately, so no existing address is silently hidden. A
**brand-new** QA listing sets the value explicitly, so QA must test both toggle states.

### B-5. Media — PROVEN in source

`buildProposedFinalMediaSet` / `validateProposedFinalMediaSet` at the publish boundary;
`warnDroppedUnpersistableMedia("servicios-publish", …)` at `publish/route.ts:290`; the dropped count
is **returned to the client** and surfaced on the success screen via `?mediaDropped=N`
(`ClasificadosServiciosPreviewClient:436`). Cover/order preserved through the durable-URL contract.
**No blob/base64 reaches Stripe:** the checkout payload carries `listingId` / `leonixAdId` only —
`revenueCategoryCheckoutPayload` contains no media field at all.

### B-6. Discovery — all five surfaces present

Results (`serviciosResultsFilter` + placement weighting + `serviciosEntitlementOverlay`), Saved
Search (full 6-file adapter set + orchestrator + delivery resolver), Related Listings
(`ServiciosRelatedListingsSection` + `serviciosRelatedListings`), JSON-LD
(`app/(site)/servicios/seo/serviciosJsonLd.ts`), sitemap (`serviciosSitemapEntries` emitting the
canonical `/clasificados/servicios/[slug]`). Non-published rows are excluded by
`.ilike("listing_status","published")` **plus** an in-code re-check; `[slug]/layout.tsx` sets
`noindex` for `pending_review` / `rejected` / `suspended`.

### B-7. CTAs — PROVEN in source

Call / SMS / WhatsApp / Correo / website / directions / share / report all resolve from
`resolveServiciosProfile`; missing channels are absent rather than dead. WhatsApp goes through the
shared international helper (`resolveServiciosProfileDirectWhatsAppHref`), and Servicios is the
category the shared `internationalWhatsApp` contract was **extracted from**. Self-engagement is
blocked by the shared `selfEngagementGuard`.

### B-8. Analytics — the certified reference contract

```
client  recordServiciosGlobalAnalytics + serviciosCtaIntents
   ↓    POST /api/clasificados/servicios/analytics
table   servicios_analytics_events            (category-owned, 15 allowed event types)
mirror  serviciosListingAnalyticsMirror  →    listing_analytics   (global truth)
key     serviciosCanonicalListingAnalyticsId = serviciosEngagementListingKey
        = leonix_ad_id  →  id  →  slug        (first non-empty wins)
alias   serviciosAnalyticsAliasKeys — older rows keyed by id or slug still resolve
guard   meta.clientListingAnalytics === true  → server mirror skips (no double count)
```

**This is the contract to certify as the platform reference.** Continuity across
publish → public → dashboard → edit → republish depends on `leonix_ad_id` being stable, which
B-2's id-keyed republish preserves.

### B-9. Owner dashboard — ONE canonical doorway

`/dashboard/servicios` is the single manage destination; every entry point
(`dashboardMisAnunciosCategories.manageHref`, the public detail owner link, Business Tools) targets
it. Capabilities from `getOwnerEntityCapabilities("servicios")`. Lifecycle via
`POST /api/clasificados/servicios/manage` (pause | resume), owner-scoped with 401/403.

### B-10. Security / privacy — PROVEN in source

- publish: `auth_required` 401; `listing_owner_mismatch` 403 on a foreign row
- **no unauthorized self-publish:** first publication without checkout → **402 `payment_required`**
- manage: 401 / 403, and pause requires the row to actually be `published`
- no client-owned status or entitlement mutation on any Servicios route
- address privacy: structural (B-4)
- self-engagement: shared guard

**⚠ All of the above is gated on `strict` — see §E-1. This is the single most important finding in
this audit.**

---

## C. RUNTIME-UNKNOWN ITEMS (source cannot settle these)

| # | Item | Why source cannot prove it |
|---|---|---|
| C-1 | Google Geocoding actually returns suggestions | needs a real key with the **Geocoding API** enabled and no referrer restriction |
| C-2 | Stripe Checkout → webhook → entitlement → activation completes | needs Stripe test mode + a reachable webhook endpoint + `STRIPE_WEBHOOK_SECRET` |
| C-3 | Saved Search match actually inserts | ledger `CHECK` migration is **unapplied** (§E-2) |
| C-4 | "Open now" agrees between results filter and public badge | timezone behavior differs by host (§D-1) |
| C-5 | Media survives Vercel Blob round trip | needs `BLOB_READ_WRITE_TOKEN` |
| C-6 | Newsletter capture reaches the inbox | provider config; `SKIPPED/not_configured` is a legitimate outcome |
| C-7 | Analytics rows land and dedupe correctly | needs real traffic + DB inspection |
| C-8 | Hard refresh restores IndexedDB media | browser-only behavior |
| C-9 | No second $399 on active edit | must be observed in Stripe, not inferred |
| C-10 | Subscription suspension/renewal | no scheduler exists (§D-2); only Stripe-delivered events fire |

---

## D. DEFECTS / BLOCKERS — STATE AFTER GATE SERVICIOS-3

| # | Original severity | State now | Evidence |
|---|---|---|---|
| **D-1** | P1 | **CLOSED** | Open-now is evaluated in the BUSINESS's timezone. New pure `serviciosBusinessTimeZone.ts` (state → IANA, `Intl.DateTimeFormat` clock); resolved ONCE in `resolveServiciosProfile` as `contact.businessTimeZone`; consumed by the badge and the filter through the same function. Unresolvable zone ⇒ filter fails CLOSED and the badge makes no status claim — never a host-clock fallback. Proven at a discriminating instant (16:00 PDT: Pacific OPEN, UTC CLOSED). |
| **D-2** | P1 | **NO SOURCE DEFECT — deferred to integration/ops** | Sweep fully traced: grace-expired rows only, bounded 1–500, constant-time machine key **or** `can_view_payments` admin, 401 otherwise, `dryRun` supported, idempotent. Stripe webhook remains primary and the write-time guard also reconciles. Only invocation is missing (§E-6). Nothing changed. |
| **D-3** | P2 | **CORRECTED — the finding was overstated; no change made** | The sandbox already carries an amber "Local sandbox (localStorage) … not saved to `servicios_public_listings`" banner, a "Local simulation" badge, localStorage-only persistence, a labelled link from the canonical queue, and site-wide admin `noindex`. **SAFELY_SCOPED already.** Manufacturing a change to justify the finding would have been worse than the finding. |
| **D-4** | P2 | **CLOSED** | New read-only `serviciosCommercialOps.ts` surfaces entitlement (`listing_package_entitlements` via the shared reader) and subscription/payment (`leonix_subscription_records`, keyed `listing_source="servicios"`) inside the EXISTING card. REAL/PARTIAL/NEEDS_PROOF/UNAVAILABLE semantics; payment never inferred from listing status; no `\|\| 0`; absent record reads "cannot be proven", never "unpaid". |
| **D-5** | P3 | UNCHANGED — by design | Servicios is a subscription; pause/resume is the honest owner lifecycle surface. |
| **D-6** | Doc | **CLOSED** | `SERVICIOS_LIVE_WIRING_MAP.md` §2 corrected in place: republish is ID-KEYED with a 403 owner check, slug is public routing identity only. |
| **D-7** | Doc | **CLOSED** | §2 now carries the SERVICIOS-2 discovery additions (Saved Search, Related Listings, JSON-LD, sitemap) and the SERVICIOS-3 open-now note. |
| **D-8** | **P3 — NEW, found by SERVICIOS-3** | OPEN | The hours engine has **no overnight-range support**: `nowMin >= startMin && nowMin <= endMin` can never be true for a 10pm–2am business. Outside this gate's stated scope ("preserve overnight behavior if supported" — it is not supported). Recorded for a later gate. |
| **D-9** | Cosmetic — pre-existing, repaired | CLOSED | `formatHoursLineDisplay12h("9:00 AM - 5:00 PM")` returned `"9:00 AM AM - 5:00 AM PM"`. Repaired because SERVICIOS-3 made the branch that feeds it far more reachable. |

**Known limitation, recorded not hidden:** the timezone map is one zone per US state. Counties in
split states (AZ Navajo Nation; parts of ID/KS/ND/NE/OR/SD/TX) get the state's predominant zone —
wrong by one hour rather than by seven. ZIP-level precision needs a real ZIP→timezone dataset this
repo does not have. Non-US resolves to UNKNOWN and makes no claim.

**No source blocker remains.**
## E. MIGRATION / ENV / PROVIDER PREREQUISITES

### E-1. ⚠ THE QA-TRUTHFULNESS BLOCKER — `SERVICIOS_STRICT_PUBLISH`

```ts
export function isServiciosStrictPublishEnvironment(): boolean {
  if (process.env.SERVICIOS_STRICT_PUBLISH === "1") return true;
  return process.env.VERCEL_ENV === "production";
}
```

On a **Vercel Preview** deployment `VERCEL_ENV === "preview"`, so **`strict` is FALSE**, which
disables:

- the publish auth requirement (`route.ts:255`),
- the **402 `payment_required` first-publication guard** (`route.ts:438`),
- the persistence assertion (`route.ts:630`).

**Owner QA on a Preview deploy without `SERVICIOS_STRICT_PUBLISH=1` is NOT a truthful test of the
paid lifecycle** — a listing could go live without checkout and QA would wrongly read GREEN.

> **Set `SERVICIOS_STRICT_PUBLISH=1` on the Preview environment before QA begins. This is
> mandatory.**

### E-2. Migrations that must be applied before QA

| Migration | Effect if unapplied |
|---|---|
| **`20260910120000_saved_search_match_events_servicios.sql`** | the ledger `CHECK` rejects `'servicios'` → **Saved Search delivery cannot be tested** |
| `20260910180000` (Restaurantes SS) | not required for Servicios QA |
| `20260911120000` (Comida Local SS) | not required for Servicios QA |
| `20260909120000` (Comida Local suspended_reason) | not required for Servicios QA |
| `20260810120000` (BR Negocio capacity RPC) | not required for Servicios QA |

Only the **first** is a Servicios QA prerequisite. **Not applied by this audit.**

### E-3. Environment variables on the Servicios critical path

| Variable | Needed for | If missing |
|---|---|---|
| `SERVICIOS_STRICT_PUBLISH=1` | **truthful paid-lifecycle QA** | guards silently off (E-1) |
| `GOOGLE_MAPS_API_KEY` | address suggestions | honest degrade to manual entry |
| `STRIPE_SECRET_KEY` | checkout | checkout unavailable |
| `STRIPE_WEBHOOK_SECRET` | webhook signature | activation never fires |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | bearer auth + browser reads | auth fails |
| `BLOB_READ_WRITE_TOKEN` | durable media | photo upload fails loudly |
| `NEXT_PUBLIC_SITE_URL` | canonical URLs, sitemap | wrong absolute URLs |
| `SERVICIOS_MODERATION_MODE` | `1` → new listings land `pending_review` | leave **unset** for QA so publish goes live |
| `SERVICIOS_DEV_PUBLISH` | dev-workspace persistence | leave unset |
| `LEONIX_SUBSCRIPTION_SWEEP_KEY` | manual sweep invocation | sweep cannot be triggered |

### E-4. Provider key restriction — specific and easy to get wrong

The address call is **server-side Geocoding**, not browser Places Autocomplete. Therefore:

- the key must have the **Geocoding API** enabled (Places alone will not work);
- an **HTTP-referrer restriction will BREAK it** (there is no referrer on a server call) — use an
  unrestricted key or an IP/server restriction;
- billing must be enabled on the Google Cloud project.

### E-5. Test-account prerequisites

- a Supabase auth account that is **not** an existing Servicios owner (so first-publication is genuinely first);
- Stripe **test mode** with a card that succeeds (`4242…`) and one that fails, to prove failed checkout does not publish;
- an admin-capable account for §F step 15;
- a **second** signed-in account to prove self-engagement blocking (§F step 12).

---

### E-6. EXACT PREREQUISITE PLAN — for the later owner-authorized runtime gate

**Nothing below was applied, changed, or deployed by this gate.** These are the exact, minimal
steps, to be executed only with owner authorization.

**1 — Apply ONLY the Servicios Saved Search ledger migration**

```
supabase/migrations/20260910120000_saved_search_match_events_servicios.sql
```

It widens two `CHECK` constraints to accept `'servicios'`. Apply *only this file*: the other
tracked migrations (`20260910180000` Restaurantes SS, `20260911120000` Comida Local SS,
`20260909120000` Comida Local `suspended_reason`, `20260810120000` BR capacity RPC) are **not**
Servicios prerequisites and must stay unapplied in this step.
Verify after: inserting a `saved_search_match_events` row with `category = 'servicios'` succeeds.

**2 — Set `SERVICIOS_STRICT_PUBLISH=1` on the Preview environment**

Vercel → Project → Settings → Environment Variables → scope **Preview** →
`SERVICIOS_STRICT_PUBLISH` = `1`. **Redeploy the Preview** so the value is picked up.
Verify: a publish attempt with no checkout returns **402 `payment_required`**. Without this the
QA run is not a truthful test of the paid lifecycle (§E-1).

**3 — Verify the Google key supports SERVER-SIDE Geocoding**

The call is `https://maps.googleapis.com/maps/api/geocode/json` from a Node route — not browser
Places Autocomplete. Confirm, without changing anything yet:
- **Geocoding API** enabled on the project (Places alone will not work);
- billing enabled;
- the key has **no HTTP-referrer restriction** (a server call sends no referrer) — unrestricted or
  IP/server-restricted only;
- `GOOGLE_MAPS_API_KEY` present in the **Preview** scope.
Verify: `POST /api/business-address/suggest` with `{"query":"1 Market St San Francisco"}` returns
`{ ok: true, suggestions: [...] }`. `{ ok:false, reason:"no_provider_configured" }` means step 3
is incomplete — it is an honest degrade, not a crash.

**4 — Confirm Stripe Preview / test-mode webhook**

- `STRIPE_SECRET_KEY` is a **test-mode** key in the Preview scope;
- a Stripe webhook endpoint points at the Preview URL `/api/revenue-os/webhook`;
- its signing secret is set as `STRIPE_WEBHOOK_SECRET` in the Preview scope;
- `checkout.session.completed` and the `customer.subscription.*` events are subscribed.
Verify: Stripe's "Send test webhook" shows a 2xx, and the event appears in `stripe_event_ledger`.

**5 — Subscription sweep (optional for QA, required for operations)**

No scheduler exists and none was created. When operations is ready:

```
POST /api/revenue-os/admin/subscription-sweep
  header: x-leonix-sweep-key: <LEONIX_SUBSCRIPTION_SWEEP_KEY>
  body:   {}                       ({"dryRun":true} to rehearse first)
  cadence: hourly is sufficient — grace windows are day-scale
```

---
## F. OWNER BROWSER QA SEQUENCE

Executable end to end from a **brand-new** Servicios listing. Do not reuse an existing listing.

**Pre-flight (must all be true before starting):** `SERVICIOS_STRICT_PUBLISH=1` ·
`20260910120000_saved_search_match_events_servicios.sql` applied · `GOOGLE_MAPS_API_KEY` valid and
unrestricted-or-IP-restricted with Geocoding enabled · Stripe test mode · `SERVICIOS_MODERATION_MODE`
unset · signed in as a fresh non-owner account.

**START URL:** `/clasificados/servicios?lang=es`

| # | Step | Prove |
|---|---|---|
| 1 | Landing → "Publicar" → checkpoint | card shows **$399/mes** in ES |
| 2 | Checkpoint → application (`/publicar/servicios?lang=es`) | ES throughout |
| 3 | Fill business name, category, "**Otro servicio**", description | free-text service persists |
| 4 | **Address:** type a real street; pick a suggestion | suggestion list appears (proves C-1) |
| 5 | Repeat with a nonsense string | no suggestions, **saving still allowed**, no "verified" claim |
| 6 | Set **exact-address = OFF** | note the choice for step 19 |
| 7 | Hours, languages, service zones, payment-method chips, phone/WhatsApp/email/website | all accept input |
| 8 | Upload ≥3 photos; set the **3rd** as cover | cover marked |
| 9 | **Hard refresh (Ctrl-F5)** | every field **and every photo** restored (IndexedDB) |
| 10 | Try to navigate away | unsaved-exit guard fires |
| 11 | Continue → **Preview** | cover is photo 3; hours, languages, zones, chips, address line all correct |
| 12 | **Preview → Edit**, change one word, return to Preview | change present, nothing else lost |
| 13 | Checkout → Stripe **test card** | $399.00/month, ES locale |
| 14 | Stripe success → return | success screen; note `?mediaDropped=` if present |
| 15 | **Results** `/clasificados/servicios/results` | listing appears; filter by city and by category |
| 16 | Toggle **"Abierto ahora"** | ⚠ **D-1 test** — compare against the badge on the detail page |
| 17 | Open **public detail** | canonical URL `/clasificados/servicios/<slug>` |
| 18 | Test **every CTA**: Call · SMS · WhatsApp · Correo · website · directions · share · report | each opens the right target; **absent channels are not rendered** |
| 19 | Confirm **no street address** and **no directions CTA** (exact-address OFF from step 6) | privacy gate holds |
| 20 | **Translate Ad** → EN | content translates; layout intact |
| 21 | **Saved Search:** save a search matching the listing | requires E-2 applied |
| 22 | **Related Listings** on the detail page | renders real listings or nothing — never filler |
| 23 | Sign in as a **second account**; like/save the listing | counts move |
| 24 | Back as owner: try to like your **own** listing | self-engagement blocked |
| 25 | **Dashboard** `/dashboard/servicios` | same listing; **note the Leonix ad id** |
| 26 | Dashboard analytics | views/CTA counts reflect steps 17–23 |
| 27 | **Admin** `/admin/workspace/clasificados/servicios` | listing visible with canonical id + real `listing_status` |
| 28 | **⚠ Visit `/admin/.../servicios/sandbox`** | confirm D-3 — a second surface with a different status vocabulary |
| 29 | **Active edit:** dashboard → edit; change **text + one photo + hours + address** | editor hydrates with everything from steps 3–8 |
| 30 | Save / republish | **no Stripe checkout appears** |
| 31 | Reload public detail | changes live; **same slug**, **same Leonix ad id** as step 25 |
| 32 | **Stripe dashboard** | exactly **ONE** $399 charge — no second base charge |
| 33 | Dashboard analytics again | pre-edit counts **survived** the republish |
| 34 | Dashboard → **Pause**, then **Resume** | disappears from results, then returns |
| 35 | Switch to **EN** on results + detail + dashboard | no Spanish leakage |
| 36 | Repeat 17, 18, 25 on a **real phone** | tap targets usable; CTAs open native apps |
| 37 | **Failed-payment path:** new listing, Stripe **decline** card | listing does **NOT** appear publicly |

---

## G. EVIDENCE TO CAPTURE

1. Screenshot: checkpoint card showing **$399/mes** (ES) and **$399/month** (EN).
2. Screenshot: address suggestion dropdown with a real result (C-1).
3. Screenshot: nonsense address → manual entry still saves, no "verified" wording.
4. Screenshot: Preview showing photo 3 as cover.
5. Screenshot: post-hard-refresh application with all media intact.
6. Stripe: checkout session (amount + interval) **and** the resulting subscription id.
7. Stripe: the **full charge list for the account** after step 32 — proof of exactly one $399.
8. Supabase: the `servicios_public_listings` row before and after step 29 — same `id`, same `slug`, same `leonix_ad_id`.
9. Supabase: `listing_analytics` rows before and after republish, same `listing_id` key.
10. Supabase: `listing_package_entitlements` row for the listing.
11. Screenshot: public detail with exact-address OFF (no street, no directions).
12. Screenshot: the same listing with exact-address ON (street + directions present).
13. **D-1 evidence:** the open-now filter result and the detail-page badge, captured at the same wall-clock minute, with the tester's timezone noted.
14. Screenshot: `/admin/.../servicios` vs `/admin/.../servicios/sandbox` side by side (D-3).
15. Screenshot: declined-card listing absent from `/results`.
16. Console/network log from the publish call showing `droppedUnpersistableMedia` (or its absence).

---

## H. LAUNCH CERTIFICATION SCORECARD

`SOURCE` = proven by current-source tracing. `RUNTIME` = requires §F.

| Circuit | Source | Runtime | Note |
|---|---|---|---|
| Route ownership / no duplicates | ✅ PROVEN | ⬜ | D-3 sandbox surface |
| Application → Preview | ✅ PROVEN | ⬜ | |
| Draft / hard refresh | ✅ PROVEN | ⬜ | IndexedDB is browser-only |
| Unsaved-exit guard | ✅ PROVEN | ⬜ | |
| ES/EN + Translate Ad | ✅ PROVEN | ⬜ | |
| **Address provider** | ✅ PROVEN | ⬜ **UNKNOWN** | needs E-3/E-4 |
| **Address privacy** | ✅ PROVEN | ⬜ | structural gate |
| Media durability + warning | ✅ PROVEN | ⬜ | |
| No media in Stripe metadata | ✅ PROVEN | n/a | payload has no media field |
| **$399 / Revenue OS** | ✅ PROVEN | ⬜ | |
| Stripe / webhook / idempotency | ✅ PROVEN | ⬜ | |
| Payment ≠ entitlement | ✅ PROVEN | ⬜ | |
| **No-recharge on edit** | ✅ PROVEN | ⬜ | guard verified at runtime in-process |
| Subscription lifecycle | ✅ PROVEN (source) | ⬜ | D-2: no source defect; scheduling is ops work (§E-6 step 5) |
| CTAs | ✅ PROVEN | ⬜ | |
| **Open-now / hours** | ✅ **PROVEN** | ⬜ | D-1 CLOSED by SERVICIOS-3; D-8 (overnight ranges) open, P3 |
| Results / filters | ✅ PROVEN | ⬜ | |
| Saved Search | ✅ PROVEN | ⬜ | **blocked by E-2** |
| Related Listings | ✅ PROVEN | ⬜ | |
| SEO / JSON-LD / sitemap | ✅ PROVEN | ⬜ | |
| Owner dashboard | ✅ PROVEN | ⬜ | one doorway |
| Admin | ✅ PROVEN | ⬜ | D-4 CLOSED by SERVICIOS-3; D-3 corrected — the sandbox was already safely scoped |
| Analytics continuity | ✅ PROVEN | ⬜ | reference contract §B-8 |
| Newsletter capture | ✅ PROVEN | ⬜ | awaited, non-blocking |
| Business Hub | n/a | n/a | not a Servicios launch requirement |
| Google / Yelp links | ✅ PROVEN | ⬜ | direct links only |
| Security / privacy | ✅ PROVEN | ⬜ | **conditional on E-1** |
| Mobile / PWA | ⚠ PARTIAL | ⬜ | structure fine; not runtime-verified |

**Certification standard:** Servicios is certified only when every ⬜ above is filled from real
browser/runtime evidence (§G), and §E-6 steps 1–4 were in force for the ENTIRE QA run. D-1 is no
longer a condition — it was closed in source by SERVICIOS-3; runtime QA now VERIFIES it (§F step 16)
rather than waiting on it. D-8 (overnight ranges) must be accepted in writing or scheduled.

**Nothing in this document claims runtime GREEN. No runtime evidence exists yet.**
---

## I. GOLDEN REFERENCE CANDIDATE

These are the exact implementations that become **reusable platform references — but ONLY after
runtime QA proves them.** Every row below is a CANDIDATE. **None is runtime-certified.** No row
may be propagated to another category on source proof alone.

| Circuit | Candidate reference implementation | Source state | Runtime |
|---|---|---|---|
| Canonical identity | `servicios_public_listings.id` as persistence authority; `existingListingId` → owner check → `.update().eq("id", …)`; slug is public routing identity only | proven | ⬜ |
| Published → edit hydration | `serviciosPublishedToApplicationDraft` + `GET /api/clasificados/servicios/my-listing` | proven | ⬜ |
| Revenue OS / Stripe | `SERVICIOS_BASE_CHECKOUT` + `revenuePricingMatrix` (server price authority) + `revenueActiveEntitlementGuard` (no second base charge) + `stripeEventLedger` (idempotency) | proven | ⬜ |
| Media | `buildProposedFinalMediaSet` / `validateProposedFinalMediaSet` + `warnDroppedUnpersistableMedia` + the dropped count returned to the client | proven | ⬜ |
| Address / location | `BusinessAddressVerifiedInput` → `POST /api/business-address/suggest` → Google Geocoding, server-side only; `resolveBusinessAddressPublicView` as a STRUCTURAL privacy gate; never claims "verified" | proven | ⬜ |
| WhatsApp / CTAs | `internationalWhatsApp` (extracted FROM Servicios) + `resolveServiciosProfile` CTA resolution + `selfEngagementGuard`; missing channels are absent, not dead | proven | ⬜ |
| **Hours / open-now** | `serviciosBusinessTimeZone` + `serviciosHeroHoursStatus`; ONE rule for badge and filter, business-local clock, honest failure | proven **(new this gate)** | ⬜ |
| Analytics | `servicios_analytics_events` → `serviciosListingAnalyticsMirror` → `listing_analytics`; key = `leonix_ad_id → id → slug` with alias keys; `clientListingAnalytics` de-dupe guard | proven | ⬜ |
| Saved Search | the 6-file `app/lib/saved-search/servicios/*` adapter set + CTA on results + trigger from the real fulfillment | proven | ⬜ **blocked by §E-6 step 1** |
| Related Listings | `ServiciosRelatedListingsSection` + `serviciosRelatedListings` | proven | ⬜ |
| SEO | `serviciosJsonLd` + `[slug]/layout.tsx` canonical & status-aware `noindex` + `serviciosSitemapEntries` | proven | ⬜ |
| Dashboard | one canonical doorway `/dashboard/servicios`; `getOwnerEntityCapabilities("servicios")`; `POST …/manage` pause/resume with 401/403 | proven | ⬜ |
| **Admin** | `serviciosCommercialOps` read-only projection with Admin OS §6 truth states, inside the existing queue card | proven **(new this gate)** | ⬜ |

**Promotion rule.** A row is promoted from CANDIDATE to REFERENCE only when: its runtime box is
filled from the §G evidence, the §F run had §E-6 steps 1–4 in force for its entire duration, and
the owner has accepted the result in writing. Until then, reusing any of these elsewhere is reuse
of *source-proven* code — which is how every prior gate already worked — and must not be described
as reusing a certified reference.

---

**QUE RUJA EL LEÓN. HARD WORK. GOD FIRST.**
