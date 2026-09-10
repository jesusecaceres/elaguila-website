# COMIDA LOCAL — LIVE WIRING MAP (AUTHORITATIVE)

Gate Zero + live-wiring MRI. Traced from runtime-consumed source only. File existence was never
accepted as proof of live. **No fixes implemented. Nothing deleted.**

Classification vocabulary (master §14): `LIVE` · `LIVE-SHARED` · `BUILT-NOT-WIRED` ·
`DUPLICATE-REFERENCED` · `DEAD-ZERO-CONSUMER` · `HISTORICAL` · `UNKNOWN`.

Servicios and Restaurantes are referenced only where an engine is genuinely shared. Comida Local's
own architecture is in several places **the cleanest of the three** — recorded as such, not "fixed
toward" another category's shape.

---

## 0. GATE STATUS

| Gate | Scope | Status |
|---|---|---|
| **COMIDA-LOCAL-0** | Gate Zero + live wiring MRI | **COMPLETE (this document)** |
| **COMIDA-LOCAL-1** | Launch-critical lifecycle repairs | **COMPLETE — see §10** |

Servicios (Gates 1–2) and Restaurantes (Gates 1–2) are **LOCKED** and were not reopened.

---

## 1. WORKTREE TRUTH

| Field | Value |
|---|---|
| Worktree | `C:\projects\elaguila-website-launch-lifecycle` |
| Branch | `completion/launch-lifecycle-2026-09-09` |
| HEAD | `451cda64` (Gate RESTAURANTES-2) |
| Accepted below it | `9d9753a0` · `2d28624c` · `849b45ea` · `a0a47839` (`origin/main`) |
| Working tree at trace time | clean |
| `origin/main` | `a0a47839` — untouched |

Comida Local spans five trees, **80 files total** — roughly a third of Restaurantes' footprint:

| Tree | Files | Role |
|---|---|---|
| `app/(site)/clasificados/comida-local/` | 13 | landing/results, public detail, preview, contact actions — **LIVE** |
| `app/(site)/publicar/comida-local/` | 6 | checkpoint + application + upload fields — **LIVE** |
| `app/lib/clasificados/comida-local/` | 58 | the category's real engine room (37 `.ts/.tsx` + **21 historical audit `.md`**) — **LIVE / HISTORICAL** |
| `app/api/clasificados/comida-local/` | 3 | `publish`, `lifecycle`, `draft-media-upload` — **LIVE** |
| `app/admin/(dashboard)/workspace/clasificados/comida-local/` | 1 | admin queue — **LIVE** |

**Structural note:** unlike Servicios (5 trees, 2 of them partly dead) and Restaurantes (a live
renderer hidden inside a demo-only `shell/` folder), Comida Local has **one implementation of
everything, in one place**. The dashboard and admin list components live in `app/lib/…` rather than
a route folder, which is unusual but consistent and fully wired.

---

## 2. EXACT LIVE END-TO-END PATH

```
LANDING/RESULTS    /clasificados/comida-local        (force-dynamic)
                   page.tsx -> comidaLocalPublicQueries -> mapComidaLocalRowToCardVm
                   components/ComidaLocalListingCard + ComidaLocalResultsFilters      LIVE
  |
CHECKPOINT         /publicar/comida-local/checkpoint
                   page.tsx -> QuickLaneCheckpointClient(category="comida-local")     LIVE-SHARED
                   card  getComidaLocalCheckpointCard (clasificados/publicar/_lib/
                         categoryPublishCheckpoints)
                   price monthlyPrice("comida_local_base_monthly") -> DERIVED from the
                         Revenue OS matrix, never a literal                            PROVEN
  |
APPLICATION        /publicar/comida-local
                   page.tsx -> ComidaLocalApplicationClient.tsx (1,641 L)             LIVE
                   exit guard  useBusinessApplicationLeaveGuard (line 303)             LIVE-SHARED
                   validation panel  ComidaLocalValidationPanel
                   uploads  components/ComidaLocalGalleryUpload + ImageUploadField
  |
DRAFT IDENTITY     lib/comidaLocalDraftPersistence.ts
                   `draftListingId` minted with the draft; heavy media via
                   comidaLocalDraftMediaUpload + /api/.../draft-media-upload           LIVE
                   ** draftListingId is the DURABLE PERSISTENCE KEY — see §2.1 **
  |
HYDRATION          useComidaLocalDraft + mergeComidaLocalDraftFromStorage
                   (explicit field-by-field allowlist rebuild — see §6.6)              LIVE
  |
PREVIEW            /clasificados/comida-local/preview
                   preview/page.tsx -> ComidaLocalPreviewClient.tsx (323 L)            LIVE
                   VM  mapComidaLocalDraftToPreviewVm  <-- ALSO the public detail VM
  |
PREVIEW -> EDIT    same draft storage; edit context via comidaLocalListingEditContext  LIVE
  |
PAGAR              ComidaLocalPreviewClient
                   1. captureCheckoutNewsletterSubscriber
                      (CHECKOUT_NEWSLETTER_SOURCES.comidaLocal, line 150)              LIVE-SHARED
                   2. saveComidaLocalPendingBeforeCheckout
                      -> POST /api/clasificados/comida-local/publish
                         { activationMode: "pending_payment" }
                      -> row status = "pending_payment", payment_status = "pending"    LIVE
                   3. PublishCheckoutCheckpoint (shared)                               LIVE-SHARED
                   4. startRevenueCategoryCheckout({...COMIDA_LOCAL_BASE_CHECKOUT})    LIVE-SHARED
  |
REVENUE OS         revenueCategoryCheckoutPayload.COMIDA_LOCAL_BASE_CHECKOUT
                   category "comida-local" / packageKey "comida_local_base_monthly"
                   price  revenuePricingMatrix:287-293  12900 cents monthly_subscription
                          -> $129/mo, server-resolved                                  LIVE-SHARED
  |
STRIPE             POST /api/revenue-os/checkout
                   NO-RECHARGE GUARD: revenueActiveEntitlementGuard:69 lists
                   "comida_local_base_monthly" -> 409 active_entitlement_no_recharge   LIVE-SHARED
  |
WEBHOOK            POST /api/revenue-os/webhook -> stripeEventLedger claim
                   -> fulfillCheckoutSessionCompleted                                  LIVE-SHARED
  |
ENTITLEMENT        revenueEntitlementFulfillment -> listing_package_entitlements       LIVE-SHARED
  |
PUBLISH/ACTIVATION revenueFulfillment (Gate D19 branch)
                   -> activatePaidComidaLocalListingFromRevenueOs                      LIVE
                   pending_payment -> published, ID-KEYED
  |
PUBLISHED ROW      comida_local_public_listings
                   (status, payment_status, package_tier, published_at, expires_at,
                    leonix_ad_id, draft_listing_id, listing_json, city_canonical …)     LIVE
  |
PUBLIC DETAIL      /clasificados/comida-local/[slug]
                   getPublishedComidaLocalListingBySlug
                   -> publicRowToComidaLocalDraft -> mapComidaLocalDraftToPreviewVm
                   -> ComidaLocalPublicDetailClient -> ComidaLocalDetailShell           LIVE
                   ** preview and public share ONE VM mapper — see §2.2 **
  |
USER DASHBOARD     lib/ComidaLocalDashboardListings.tsx + comidaLocalDashboardQueries
                   edit href /publicar/comida-local?edit=1&listingId=…&source=dashboard LIVE
                   lifecycle  POST /api/clasificados/comida-local/lifecycle
                              pause: published -> paused · resume: paused -> published  LIVE
  |
ADMIN              /admin/workspace/clasificados/comida-local
                   ComidaLocalAdminListings + comidaLocalAdminQueries
                   updateComidaLocalPublicListingStatusAction                           LIVE
  |
EDIT PUBLISHED     comidaLocalListingEditContext.resolve…  forces draftListingId to the
                   ROW's own `draft_listing_id`; refuses a legacy row that has none      LIVE
  |
SAME-ROW REPUBLISH POST /api/clasificados/comida-local/publish
                   .update(...).eq("draft_listing_id", draftListingId)                   LIVE
                   status/payment_status preserved from the existing row (Gate D19)
                   ** no compare-and-set; null-status edge — see §5.1 **
  |
RENEWAL/EXPIRATION `expires_at` column exists and is read by dashboard + admin
                   subscriptionLifecyclePolicy LANE_SUSPENSION: **comida-local ABSENT**  BUILT-NOT-WIRED
  |
ANALYTICS          lib/comidaLocalAnalytics.ts — 6 consumer files                        LIVE
```

### 2.1 Same-row identity — the cleanest of the three categories

Comida Local keys the published row on **`draft_listing_id`**, like Restaurantes — but it goes one
step further than either sibling:

`comidaLocalListingEditContext.ts` resolves the edit context server-side, **forces**
`draftListingId` to the row's own `draft_listing_id` column value (lines 106–125), and **refuses to
open an edit at all** when the row is ambiguous — missing, or a legacy row with no
`draft_listing_id`. Its own header states the reason: "a regenerated id would insert a duplicate
instead of updating". That is an explicit guard against exactly the failure mode Gate SERVICIOS-1
had to repair defensively, and it is stronger than the Restaurantes equivalent (which falls back to
the draft's own id when the column is empty).

### 2.2 Preview and public detail share one view-model mapper

`mapComidaLocalRowToDetailVm` (public) is literally `mapComidaLocalDraftToPreviewVm` applied to
`publicRowToComidaLocalDraft(row)`. There is **one** VM implementation, so preview and the live
vitrina cannot drift — and, critically, **one** address-privacy gate (§6.1). Servicios and
Restaurantes each maintain two rendering paths; Comida Local maintains one.

---

## 3. SHARED-TOOL CONNECTIONS

| Tool | Shared implementation | Comida Local consumer | Status | Action |
|---|---|---|---|---|
| **Find Me Today / Encuéntrame Hoy** | — (category differentiator) | `ComidaLocalApplicationClient:1123` section + `ComidaLocalDetailShell:195` section | **PARTIAL — label only, see §5.2** | **the headline gap** |
| **Translate Ad** | `TranslateAdControl` + `/api/translate-ad` | `lib/useComidaLocalPublicTranslation.tsx:5,:55` + `comidaLocalTranslateAd.ts` | **LIVE-SHARED** | none |
| **Address / privacy** | `app/lib/businessAddress/*` | **ZERO refs.** Comida Local runs its own `businessAddressLine` + `showAddressPublicly`, gated once in `mapComidaLocalDraftToPreviewVm:291` | **DUPLICATE-REFERENCED — and it is the ORIGINAL** the shared contract was modelled on (`businessAddressPrivacy.ts` names it as the reference pattern) | do NOT refactor for purity |
| **Home-based address protection** | same gate | default `showAddressPublicly: false` (`createEmptyComidaLocalDraft:64`) | **LIVE — private by default** | none (§6.1) |
| **Current/temporary location vs permanent service area** | — | `locationNote` / `locationUrl` (today) vs `businessAddressLine` (fixed, private) — **structurally separate fields** | **LIVE (separation)** / **PARTIAL (no time semantics)** | §5.2 |
| **ES / EN** | `resolveClasificadosPublishLangFromSearchParams`, `normalizeLang`, `replaceLangInHref` | checkpoint, application, preview, results, `[slug]` | **LIVE-SHARED** | one shared-module defect (§6.3) |
| **Unsaved-exit** | `useBusinessApplicationLeaveGuard` | `ComidaLocalApplicationClient:303` | **LIVE-SHARED** | none |
| **Media durability** | `listingMediaContract` + `comidaLocalDraftMediaUpload` + `/api/.../draft-media-upload` + `comidaLocalImageNormalize` / `comidaLocalImageValidation` | `comidaLocalPublishValidation.ts:28,:219` — **build + validate only**; `droppedUnpersistable` never read | **LIVE-SHARED (partial)** | REPAIR (§6.2) |
| **Newsletter** | `checkoutNewsletterCapture` | `ComidaLocalPreviewClient:150` `CHECKOUT_NEWSLETTER_SOURCES.comidaLocal` | **LIVE-SHARED** | none |
| **Call/SMS/WhatsApp/Correo** | category-local `components/ComidaLocalContactActions.tsx` | preview + public detail | **LIVE** | does not use the shared `internationalWhatsApp` module (0 refs) — §6.4 |
| **Google / Yelp** | — | **fields do not exist on the draft type at all** | **absent** | §5.5 |
| **Business Hub** | `connectionHub/*` | **ZERO refs** | **absent** | by design for this lane — a stand/pop-up is not a Business Hub product |
| **Saved Search** | `app/lib/saved-search/*` — 5-category engine (autos, BR, rentas, servicios, restaurantes) | **ZERO refs** | **BUILT-NOT-WIRED** | ADOPT (§5.3) |
| **Related Listings** | per-category readers (`serviciosRelatedListings`, `restaurantesRelatedListings`) | **ZERO refs** | **absent** | NEW CODE (thin reader) |
| **SEO** | `restauranteJsonLd` / `serviciosJsonLd` / `breadcrumbJsonLd` / sitemap sections | `[slug]/page.tsx` has `generateMetadata` **but ZERO JSON-LD**, and no sitemap section | **partial** | §5.4 |
| **Hours / open-now** | — | **ZERO refs** — Comida Local models availability as free text (`availabilityNote`), not structured weekly hours | **absent by design** | see §6.5 |
| **Revenue OS / Stripe / entitlement / no-recharge** | `revenueCategoryCheckout*`, `revenuePricingMatrix`, `revenueActiveEntitlementGuard`, `stripeEventLedger` | preview → webhook → activation | **LIVE-SHARED** | none |
| **Analytics** | `comidaLocalAnalytics.ts` | 6 consumers | **LIVE** | `selfEngagementGuard` not referenced |

---

## 4. DUPLICATE / DEAD / LEGACY PATHS

**This is the cleanest category traced so far.** A full zero-import sweep over all 37 `.ts/.tsx`
files in the three Comida Local trees returned **zero dead modules**. There is no duplicate folder,
no legacy application, no orphaned preview, no second results implementation.

| Path | Classification | Proof | Disposition |
|---|---|---|---|
| 21 `COMIDA_LOCAL_*_AUDIT.md` inside `app/lib/clasificados/comida-local/` | **HISTORICAL** | documentation in the source tree | harmless; belongs in `docs/` (same as the 12 Restaurantes audit files) |
| `comidaLocalPackages.ts` Basic `$99` / Plus `$149` tier definitions | **HISTORICAL, contained** | `getComidaLocalPackagePriceLabel`: **0** consumers · `getComidaLocalPackageByTier`: **0** · `COMIDA_LOCAL_PACKAGES`: **0** · `getComidaLocalPackageLabel`: **4**, all admin/dashboard *tier-name* reads (`mapComidaLocalAdminListing`, `mapComidaLocalDashboardListing`) | KEEP — the file's own header documents the retirement; **no price label from it ever reaches a customer** |
| `mobile_food_vendor` product param in the Restaurantes application | **DUPLICATE-REFERENCED, already neutralised** | `RestauranteApplicationClient:275-284` documents that this once routed a mobile food vendor into the **$399 Restaurantes** checkout while displaying "$199" — the cross-link now points at the real Comida Local product | KEEP; recorded so it is not re-introduced |

**No `$199` literal survives anywhere in the Comida Local trees.**

---

## 5. POST-PREVIEW LAUNCH GAPS

### 5.1 Publish update has no compare-and-set, and a null status can escalate — **P2**
`publish/route.ts:193` updates with `.eq("draft_listing_id", draftListingId)` only. Restaurantes
additionally pins `.eq("status", targetStatus)` so a concurrent staff action or webhook landing
mid-edit makes the update match zero rows instead of silently clobbering the other writer. Comida
Local has no such guard.

Separately, `status: useNewPending ? "pending_payment" : ((existing.status as "published") ?? "published")`
(line 175) falls back to `"published"` when `existing.status` is null. A legacy/statusless row would
therefore be promoted to published by an ordinary owner edit with no payment. Restaurantes closed
exactly this class with `resolveRestauranteOwnerEditTargetStatus`, which **fails closed** on an
unknown or missing status. The normal paths are safe — `pending_payment`, `paused` and `archived`
are all preserved — so this is a narrow edge, not the broad bypass Restaurantes had.

### 5.2 "Find Me Today" is a section label, not a feature — **P1, and it is the category's differentiator**
Master §12 names **Find Me Today / Encuéntrame Hoy** as Comida Local's major differentiator. What
exists today:

- **Application** (`ComidaLocalApplicationClient:1123`): a section titled "Encuéntrame Hoy"
  containing `locationNote` (free-text textarea), `locationUrl`, and conditionally
  `mobileOrderLinkUrl` / `eventScheduleNote`.
- **Public** (`ComidaLocalDetailShell:195`): a `DetailSection` titled "Encuéntrame hoy" rendering
  `vm.locationNote` and `vm.availabilityNote` as static paragraphs.
- **Persistence**: `locationNote` is a plain string on the draft, stored in `listing_json` like any
  other field.

What does **not** exist anywhere (verified by direct search):
- no `locationUpdatedAt` / freshness timestamp,
- no expiry or "valid for today only" semantics,
- no separate live-location state, no per-day reset, no scheduled clear,
- no public indication of *when* the location was last set.

`expires_at` exists on the row, but it is the **subscription/listing** expiry read by the dashboard
and admin — it has nothing to do with today's location.

**Consequence:** a mobile vendor who set `locationNote` three weeks ago has that stale text rendered
today under a heading that says "Find me today". The application copy even tells them the feature is
per-move ("complétalo cada vez que cambies de lugar"), which is honest about the manual model but
does not make the public label true. The separation from the private fixed address is genuinely
correct (§6.1); the **time dimension of the differentiator is unbuilt**.

This is a product decision, not a mechanical repair: the options (a freshness stamp shown publicly,
an auto-expiry that hides the note after N hours, or an explicit "updated on {date}" line) differ in
owner burden and should be chosen, not assumed.

### 5.3 Saved Search not offered — **P2**
Zero references. The engine is now a proven five-category adapter model (autos, bienes-raices,
rentas, servicios, restaurantes). Comida Local's `ComidaLocalResultsFilters` provides a real filter
contract to adapt. Would also need the ledger CHECK widened for `comida-local`, exactly as the last
two gates did.

### 5.4 No JSON-LD and no sitemap section — **P2**
`[slug]/page.tsx` has a real `generateMetadata` (title/description/canonical), but emits **no**
structured data at all — no `LocalBusiness`, no breadcrumb — while Servicios and Restaurantes both
do. `app/sitemap.ts` has Recursos, Servicios and Restaurantes DB-backed sections; Comida Local has
only its hub. Both the mechanism and a safety-gated published reader
(`getPublishedComidaLocalListingBySlug` / `comidaLocalPublicQueries`) already exist — this is an
ADOPT, not new architecture.

### 5.5 Google / Yelp links absent from the model — **P2**
`googleReviewsUrl` / `yelpReviewsUrl` do not exist on the Comida Local draft type on HEAD.
Restaurantes and Servicios both surface these. **Important for the sealed-branch mining (§7): the
Globalization G21 "Comida Local Google/Yelp silently wiped" fix presupposes fields that HEAD does
not have** — so it is *not* directly portable, and on HEAD this is a feature gap, not data loss.

### 5.6 No subscription-lifecycle lane for `comida-local` — **P1**
`subscriptionLifecyclePolicy.LANE_SUSPENSION` registers `restaurantes`, `servicios`, `autos` and
`bienes-raices` — **not `comida-local`**. So even once the platform-wide sweeper gets a crank
(§5.7), it has no configured table/status/suspended-value for this lane and cannot hide a lapsed
$129/mo listing. This is a Comida-Local-specific gap on top of the shared one.

### 5.7 No scheduler cranks renewal / expiration — **P1 (platform-wide, unchanged)**
`/api/revenue-os/admin/subscription-sweep` still has no caller: no `vercel.json`, no cron route, no
`pg_cron`. Identical to the Servicios and Restaurantes findings; one platform decision covers all.

---

## 6. PRE-PREVIEW LAUNCH-CRITICAL GAPS

### 6.1 Address privacy — **NO GAP. This is the reference implementation.**
- `showAddressPublicly` defaults to **`false`** (`createEmptyComidaLocalDraft:64`) — private by
  default, the opposite of the Restaurantes defect Gate RESTAURANTES-1 had to repair.
- The reveal decision exists **once**: `mapComidaLocalDraftToPreviewVm:291` —
  `const businessAddressLine = draft.showAddressPublicly ? draft.businessAddressLine.trim() : "";`
  and `showBusinessAddress: Boolean(businessAddressLine)`.
- Because the public detail VM **is** the preview VM (§2.2), that single gate covers both surfaces.
  There is no second path that could leak it.
- The fixed address and today's location are **structurally different fields**
  (`businessAddressLine` vs `locationNote`), so a public "where I am today" note cannot accidentally
  carry the private home address unless the owner types it there themselves — and the application
  says so explicitly: *"Tu dirección fija va aparte y es privada por defecto."*
- `app/lib/businessAddress/businessAddressPrivacy.ts` names this Comida Local implementation as the
  pattern the shared contract generalizes. **Do not refactor it for shared-code purity.**

### 6.2 Media: unpersistable drops computed and thrown away — **P1**
`comidaLocalPublishValidation.ts:219` calls `buildProposedFinalMediaSet` and validates the result,
but never reads `droppedUnpersistable` and does not import `warnDroppedUnpersistableMedia`. Identical
to the defect repaired for Servicios (Gate 1) and Restaurantes (Gate 1); the shared helper is already
in `listingMediaContract.ts`. Direct ADOPT — and sealed commit `bd2ee01e` contains the exact one-line
Comida Local adoption (§7).

### 6.3 English checkpoint copy says "/mes" — **P2, and it is in the SHARED module**
`categoryPublishCheckpoints.ts:37-41`:
```ts
function monthlyPrice(packageKey: string, category: string): string {
  …
  return `${formatRevenuePriceLabel(priceCents)}/mes`;   // ← always Spanish cadence
}
```
`monthlyPrice` is language-agnostic and hardcodes `/mes`, so the **English** checkpoint for Comida
Local (and Restaurantes, Servicios, Autos, BR, Rentas, Empleos) renders e.g. `$129/mes`. The price
itself is correctly matrix-derived; only the unit is untranslated.

> **CORRECTION TO GATE RESTAURANTES-1.** That gate reported fixing a customer-facing "$199" and an
> EN "/mes" in `app/(site)/clasificados/publicar/restaurantes/page.tsx`. Re-tracing for this MRI
> shows `RestaurantesSelectorClient` accepts only `t: { title, body }` and renders every price and
> bullet from `getRestaurantesCheckpointCards(...)` — the **matrix-derived** shared module. The
> page's `card1Price` / `card2Price` / `*MoreBullets` fields have **zero consumers**
> (verified by direct search). So the literals I corrected were **stale dead copy, not
> customer-facing**: the shopper was already being shown the correct derived $129. The edit was
> harmless and the literals were genuinely stale, but the Gate-1 severity claim ("the customer was
> shown $199 at the decision point") was **wrong**, and the *real* EN-cadence defect is the shared
> `monthlyPrice` helper above — still live, and affecting Comida Local's own checkpoint.

### 6.4 WhatsApp does not use the shared international module — **P2**
`app/lib/whatsapp/internationalWhatsApp.ts` (ported in Gate SERVICIOS-1, 10-digit US rule + 8-digit
floor + 15-digit E.164 ceiling) has **zero** Comida Local references; `ComidaLocalContactActions.tsx`
builds its own hrefs. Not yet traced to a conclusion on whether it truncates international numbers —
recorded as **UNKNOWN pending Gate 1**, exactly as Restaurantes' was before its Gate 1 resolved it
(and that one turned out to be unsafe).

### 6.5 Availability is free text, not structured hours — **by design, verified, not a gap**
Zero `openNow` references. Comida Local models availability as `availabilityNote` free text rather
than a weekly-hours grid. For a pop-up/stand/mobile lane that is the honest model — there is no
frozen or wrong open-now badge to fix here, because there is no badge. Recorded so it is not
mistaken for a missing adoption. (It does mean an `open_now` results filter is impossible without a
product change.)

### 6.6 The draft merge is a complete-but-fragile allowlist — **P3, structural hazard**
`mergeComidaLocalDraftFromStorage` rebuilds the draft **field by field** from
`createEmptyComidaLocalDraft()`, and it runs on every ~400 ms autosave, on publish normalization,
and on both edit and public-page hydration. A field present on `ComidaLocalDraft` but absent from
that rebuild is silently wiped on every save.

**Verified today: complete.** A field-by-field diff of all 45 `ComidaLocalDraft` members against the
merge body found **zero** unhandled fields. But this is precisely the shape that produced the sealed
branch's G21 Comida Local data-loss defect, so any future field addition must touch both files. A
cheap type-level guard (or a verifier assertion) would make the hazard structural rather than
procedural.

### 6.7 ES/EN — **NO GAP** beyond §6.3. Threaded through checkpoint, application, preview, results
and `[slug]` metadata.

### 6.8 Draft hydration & unsaved-exit — **NO GAP.** Shared leave guard mounted; draft + IDB media
survive; edit context is server-resolved.

### 6.9 Newsletter — **NO GAP.** Captured at checkout through the shared engine with the
`comidaLocal` source tag.

### 6.10 Published→edit hydration — **NO GAP, and structurally safe.** `listing_json` holds the whole
draft; `publicRowToComidaLocalDraft` → `mergeComidaLocalDraftFromStorage` is a symmetric round-trip,
not a lossy wire-profile reverse mapper. The destructive-hydration class that Gate SERVICIOS-1 had
to repair does not exist here (subject to §6.6's caveat).

---

## 7. GLOBALIZATION FIXES AVAILABLE

Read-only from `fix/globalization-final-closeout-2026-09` @ `e3956df8`. Ten commits touch Comida
Local; two carry semantics relevant to this gate:

| Commit | Semantics | Portable? |
|---|---|---|
| `bd2ee01e` | `warnDroppedUnpersistableMedia("comida-local-publish", comidaLocalFinalMedia)` — a one-line adoption in `comidaLocalPublishValidation.ts` | **YES — directly.** Same shape already applied to Servicios and Restaurantes; the shared helper is on HEAD |
| `652e2556` (G21) | adds `googleReviewsUrl` / `yelpReviewsUrl` to the merge allowlist, described as "unconditional data loss" | **NO — not as-is.** It presupposes those two fields on the draft type; **HEAD has neither** (§5.5). Porting it means adding the *feature* (type + form + publish + render), of which the merge line is the last step. The commit is still valuable as proof of the §6.6 hazard |
| `3c23e875` | G23 address verifier adoption | **NO** — Comida Local's own privacy implementation is the reference pattern (§6.1); do not refactor for purity |
| `50d1cd40` / `14c1e9b5` | Save/Like/Share, Recently Viewed + Report adoption on Comida Local | **DEFER** — engagement/differentiator work, out of a Gate-1 lifecycle scope |
| `c6519f30`, `5c79308e`, `433c12ad`, `8b867eaf`, `85cc86f7` | shared primitive/revenue reconciliation | **DEFER** — no Comida-Local-specific lifecycle delta |

---

## 8. PROTECTED / NO-TOUCH

- `app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx` (1,641 L),
  `ComidaLocalValidationPanel.tsx`, `components/ComidaLocalGalleryUpload.tsx`,
  `components/ComidaLocalImageUploadField.tsx`
- `app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx`
- the draft/media/edit surface: `comidaLocalDraftPersistence.ts`, `useComidaLocalDraft.ts`,
  `createEmptyComidaLocalDraft.ts`, `comidaLocalDraftMediaUpload.ts`,
  `comidaLocalImageNormalize.ts`, `comidaLocalImageValidation.ts`,
  **`comidaLocalListingEditContext.ts`** (the same-row identity guard)
- **`mapComidaLocalDraftToPreviewVm.ts`** — one VM for preview *and* public detail, and the single
  address-privacy gate. Any change here changes both surfaces at once.
- shared, multi-category: `app/lib/listingPlans/*`, `app/lib/media/listingMediaContract.ts`,
  `app/lib/saved-search/*`, `app/components/translation/*`, `useBusinessApplicationLeaveGuard`

---

## 9. GATE ZERO — RESOLVED

| Question | Answer |
|---|---|
| entry route | `/publicar/comida-local/checkpoint` (shared QuickLane checkpoint) |
| checkpoint | `getComidaLocalCheckpointCard` — price derived from the Revenue OS matrix |
| application | `/publicar/comida-local` → `ComidaLocalApplicationClient` |
| draft identity | `draftListingId` in `comidaLocalDraftPersistence` + IDB media |
| preview | `/clasificados/comida-local/preview` |
| checkout | Preview → `saveComidaLocalPendingBeforeCheckout` → `startRevenueCategoryCheckout` |
| publish action | `POST /api/clasificados/comida-local/publish` |
| results | `/clasificados/comida-local` (landing **and** results are the same route) |
| public detail | `/clasificados/comida-local/[slug]` |
| dashboard | `ComidaLocalDashboardListings` + `POST /api/clasificados/comida-local/lifecycle` |
| admin | `/admin/workspace/clasificados/comida-local` |
| edit route | `/publicar/comida-local?edit=1&listingId=…&source=dashboard` |
| republish action | same publish route, `draft_listing_id`-keyed |
| lifecycle reader | `comidaLocalPaymentStatus` + `expires_at`; **no `LANE_SUSPENSION` entry** |
| analytics recorder | `comidaLocalAnalytics.ts` (6 consumers) |

**Gate Zero is clear — implementation may proceed in a later gate.**

---

**QUE RUJA EL LEÓN. HARD WORK. GOD FIRST.**

---

## 10. GATE COMIDA-LOCAL-1 — WHAT CHANGED AND WHAT PROVES IT

Seven items, one coherent lifecycle gate. Verifier
`scripts/verify-comida-local-gate1-lifecycle.ts` — **49/49 PASS**. Every assertion executes the
real shipped modules; the few that can only be made about source read it with comments
**stripped** first, so a sentence in a doc comment can never satisfy a claim about code.

### 10.1 Find Me Today is now a real temporary-location feature (§5.2 closed)

Owner/PM decision implemented verbatim: fresh for **24 hours** from the last real owner update,
**fails closed** and disappears at **read/render time** — no scheduler, nothing to schedule,
nothing that can silently stop running.

| Piece | Where |
|---|---|
| pure policy (window, fingerprint, stamp authority, freshness, labels) | `app/lib/clasificados/comida-local/comidaLocalTemporaryLocation.ts` (new; zero I/O, zero framework imports) |
| canonical state | `ComidaLocalDraft.locationUpdatedAt` — persisted in the existing `listing_json`, **no schema column added** (the publish mapper already writes `listing_json: { ...draft }`) |
| stamp decision | `publish/route.ts`, server-side, against the **stored row's** `listing_json` |
| read-time expiry | `mapComidaLocalDraftToPreviewVm` — the one VM both preview and the public vitrina share |
| public render | `ComidaLocalDetailShell` freshness line |

**Behavior proved:**
- 2h old renders, labelled `Actualizado hace 2 h` / `Updated 2h ago` — exactly the PM wording.
- exactly 24h is still fresh; 24h + 1ms is expired.
- 25h old drops the note, **and** drops the "Where I am today" map link with it, **and** stops
  rendering the section entirely when nothing else is in it. A stale map pin is exactly as
  misleading as stale text under a heading that says "today".
- content with **no** stamp (a pre-gate row), a **garbage** stamp, or a **future** stamp are all
  treated as unproven and hidden. Fail closed, three ways.
- `viewer` defaults to **`"public"`**, so a future call site that forgets to pass a mode leaks
  nothing.
- **Owner preview** shows the owner their own draft truth (the PM decision allows this) plus an
  explicit "this is not public" warning — but *not* on a brand-new unpublished draft, where
  unstamped simply means "not saved yet". Warning a first-time seller there would be a lie.

**Timestamp honesty — the hard half:**
- an unrelated edit (business name, description, hours, photos) **preserves** the stamp;
- whitespace-only reformatting of the note preserves it;
- changing the note **or** the link refreshes it;
- clearing the temporary location clears the stamp — freshness disabled, nothing to expire;
- the stamp is decided **server-side from the stored row**, never from the request body, so a
  client cannot forge freshness by posting its own `locationUpdatedAt`.

**Deliberate migration behavior for pre-gate rows.** An already-published row has location text
but no stamp. `updated_at` was *rejected* as a proxy — it would falsely refresh on every
unrelated edit, precisely what the PM decision forbids — and we refuse to invent a time we do
not know. So such a note stays owner-visible, is not advertised publicly as "today", and becomes
public again the moment the owner actually updates it. That is the fail-closed reading of the
decision, and it is what the verifier asserts.

**Home address stays structurally separate** (§6.1 unchanged and re-proved): a private
`businessAddressLine` never reaches the temporary location, expiry never touches an opted-in
permanent address, and `availabilityNote` (standing availability, not "where I am now") neither
refreshes nor expires with it.

### 10.2 Media — shared warn helper adopted (§6.2 closed)

`warnDroppedUnpersistableMedia("comida-local-publish", ...)` now fires at the real parse boundary
where the media set is built, and the dropped list is carried out through the normalized publish
value, returned on **both** publish responses, and rendered to the owner on **both** owner
surfaces — the checkout path (preview client, on the same non-blocking note channel the
newsletter failure uses, never gating payment) and the same-row republish path (application
client success panel). No new media engine: the shared contract had always reported this and
Comida Local had always discarded it.

### 10.3 Subscription lifecycle lane registered (§5.6 closed)

`LANE_SUSPENSION["comida-local"]` to `comida_local_public_listings` / `status` / visible
`["published"]` / suspended `"suspended"`. Nothing invented: the verifier reads migration
`20260604120000` and asserts every value registered already exists in that table's own status
CHECK. `paused` is deliberately **not** a visible status — the payment engine must never
overwrite an owner's own pause. Migration
`20260909120000_comida_local_listing_suspended_reason.sql` ships the `suspended_reason` column
the suspend/restore compare-and-set needs, mirroring `20260805090500` for the other four lanes.
**The sweeper itself is still not built or scheduled** — out of scope for this gate.

### 10.4 Same-row status safety (§5.1 closed)

New `comidaLocalOwnerEditStatusAuthority.ts` (pure, one parameter, structurally cannot be told to
publish). An ordinary owner edit may only ever target the row's **own** current status; a NULL,
empty, legacy or unrecognized status is **rejected with 409**, never defaulted to `published` —
the `?? "published"` escalation is gone. The update is now a compare-and-set on **both** the
canonical `draft_listing_id` (same-row identity preserved) **and** the decided status, and a
zero-row result is reported as 409 instead of being claimed as success. `activationMode` is
deliberately not consulted by the authority. No-recharge is unchanged and re-proved.

One behavior change worth naming: a pre-checkout save against a **paused** row used to push it
into `pending_payment`, hiding a listing the owner had already paid for. It now keeps `paused`.

### 10.5 WhatsApp — UNSAFE, so the shared contract was adopted (§6.4 resolved)

The MRI left this UNKNOWN. Tracing settled it: `buildComidaLocalWhatsAppHref` was a bare digit
strip with **no country-code handling and no length bounds**, so a US number typed the way the
form itself formats it — `(408) 555-1234` — became `https://wa.me/4085551234`, missing the `1`:
a public WhatsApp CTA that does not reach the seller. Three stray digits became `wa.me/123`. It
now delegates to `app/lib/whatsapp/internationalWhatsApp.ts` (ported in Gate SERVICIOS-1): 10
digits assumed US and prefixed, anything else trusted with its own country code, 8-15 digit
bounds, unusable input yielding no action at all.

A second, quieter defect went with it: eligibility was counted through
`normalizeComidaLocalPhoneDigits`, which **truncates to 10 digits** — so validation was measuring
a different number than the href was built from. Both validators and the renderer now share one
predicate, and the verifier asserts they agree across a matrix of inputs. The primary phone field
is untouched and still US-formatted (contract requirement).

### 10.6 Shared monthly cadence (§6.3 closed — the real, live instance)

`categoryPublishCheckpoints.monthlyPrice` had no `lang` parameter at all and hardcoded `/mes`, so
the **English** checkpoint of every monthly category rendered e.g. `$129.00/mes` at the decision
point. It now takes `lang` and renders `/mes` / `/month`; all seven call sites pass it. The
amount stays matrix-derived — the verifier asserts the label against `getRevenuePackagePriceCents`
plus `formatRevenuePriceLabel`, never against a hardcoded literal, so this test can never become
the thing that pins a stale price. **No dead category copy was edited to simulate the fix**: this
is the shared formatter the selector clients actually render.

> Still open, same class, deliberately **not** widened into this gate: `oneTimePrice` one line
> below hardcodes `dias` for Autos privado / Rentas / BR FSBO / Empleos. Instruction 6 scoped this
> repair to the monthly cadence; recorded here rather than silently expanded.

### 10.7 Hydration allowlist (§6.6 hardened)

`locationUpdatedAt` added to `createEmptyComidaLocalDraft` and to the
`mergeComidaLocalDraftFromStorage` allowlist — mandatory, because that merge *is*
`sanitizeComidaLocalDraftForStorage` and runs on every ~400 ms autosave, so a field missing from
it is wiped on every save. Not a broad refactor: two lines plus a normalizer.

The hazard is now **structural rather than procedural**. The verifier round-trips a distinctive,
type-correct value for **all 46 draft fields** through the real merge and fails naming any field
that does not survive, and separately pins the field count so a field added later without
extending the probe trips the test. It also proves the autosave sanitizer preserves the stamp.

### 10.8 Validation

| Check | Result |
|---|---|
| `verify-comida-local-gate1-lifecycle.ts` (new) | **49/49 PASS** |
| `verify-restaurantes-gate1-lifecycle.ts` | PASS |
| `verify-restaurantes-gate2-discovery.ts` | PASS |
| `verify-servicios-gate1-lifecycle.ts` | PASS |
| `verify-servicios-gate2-discovery.ts` | PASS |
| ESLint over the changed scope | **0 new errors.** The two errors reported are pre-existing unused imports (`comidaLocalPublicTypes.ts:2`, `mapComidaLocalPublicListing.ts:8`), present at HEAD and untouched here |
| `tsc` on the two new pure modules | clean |

**DEFERRED TO INTEGRATION GATE:** `npm run typecheck`, `npm run build`, owner-browser QA (four
active worktrees under a hard resource lock; this repo's tsc has exhausted the V8 heap before,
even scoped).

**DEFERRED / REQUIRED BEFORE THE LANE CAN SUSPEND:** migration
`20260909120000_comida_local_listing_suspended_reason.sql` has not been applied anywhere. Until
it runs, `applyPaymentSuspension` returns `{ok:false}` for this lane and the caller simply does
not suspend — byte-for-byte today's behavior, no new failure mode. The Servicios and Restaurantes
Saved Search migrations are in the same state.

### 10.9 Remaining Comida Local source gaps after this gate

| Gap | Severity | Note |
|---|---|---|
| no scheduler cranks `/api/revenue-os/admin/subscription-sweep` | P1 | platform-wide, unchanged across all three categories; one decision covers all |
| Saved Search not offered | P2 | shared 5-category engine, zero refs |
| no JSON-LD, no sitemap section | P2 | both the mechanism and a safety-gated published reader already exist |
| Google / Yelp absent from the draft model | P2 | a feature gap on HEAD, not data loss; Globalization `652e2556` stays unportable until the fields exist |
| Related Listings | P3 | thin category-local reader, no engine |
| `oneTimePrice` hardcodes `dias` in EN | P3 | see §10.6 — sibling of the cadence bug, outside this gate's stated scope |
| 21 historical audit `.md` files inside `app/lib/clasificados/comida-local/` | P4 | harmless; belong in `docs/` |
