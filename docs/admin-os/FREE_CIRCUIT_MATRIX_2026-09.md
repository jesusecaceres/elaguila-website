# Free publish circuit matrix (Gate 8) — 2026-09

Base: branch `integration/category-circuit-closeout-2026-09` @ `9cb5a52f` (source read while other sessions were editing the worktree: line numbers drift, function names are the stable evidence). SOURCE READING ONLY — no DB, no Stripe, no build.
Guard script: `scripts/verify-final-circuit-matrix.ts` (`node node_modules/tsx/dist/cli.mjs scripts/verify-final-circuit-matrix.ts`).
Companion: `docs/admin-os/PAID_CIRCUIT_MATRIX_2026-09.md` (Gate 7). Defect IDs here are `F#`; paid-lane defects are `D#` there.

Circuit checked per lane: application → preview → canonical save (table, UUID, Leonix Ad ID source) → publication authority → results predicate → detail predicate → dashboard predicate → Admin Queue → Admin Live predicate → same-row edit → moderation path → sold/expired semantics → proof the lane never enters Revenue OS checkout.

## 0. Free lanes that exist

| Lane | Table | Free package (`revenuePricingMatrix.ts`) | Publishes publicly without payment? |
|---|---|---|---|
| Empleos Feria | `empleos_public_listings` (`lane='feria'`) | `empleos_job_fair_free` (`stripeEligible:false`) | YES — server publishes on `mode:"publish"` |
| Clases free | `listings` (`category='clases'`) | `clases_free` | YES — client-direct |
| Comunidad | `listings` | `comunidad_free` | YES — client-direct |
| Busco | `listings` | `busco_free` | YES — client-direct |
| Mascotas y perdidos | `listings` | `mascotas_free` | YES — client-direct |
| En Venta (free AND "Pro") | `listings` | `en_venta_free_v1` (Pro is NOT a package) | YES — client-direct |
| Restaurantes "free application" | `restaurantes_public_listings` | none (no free package) | NO product — **but the API can insert a published row (D1)** |
| Ofertas Locales coupons | `ofertas_locales` | catalog price $0 (matrix says $199, D5) | NO — needs staff approval |
| Viajes staged (affiliate) | `viajes_staged_listings` | `viajes_affiliate` (`stripeEligible:false`) | NO — needs admin approve |
| Iglesias churches / prayers | `iglesias_*` | n/a | YES — auto-publish rules (AI-authoritative, owner review flagged in the closeout) |
| Recursos comunitarios | intake tables | n/a | NO — `needs_review`, staff publishes |
| Comida Local | `comida_local_public_listings` | none | **NO** — verified: a brand-new row without `pending_payment` is refused 402 `payment_required` (`comida-local/publish/route.ts` ~line 289) and `pending_payment` requires a bearer (~135) |

## 1. Shared spine — generic `listings` lanes (Clases free, Comunidad, Busco, Mascotas, En Venta)

* **B CANONICAL SAVE** — client-direct through the browser Supabase client: `insertListingsRowResilient` (`app/(site)/clasificados/lib/listingsSelectShrink.ts`) → `.insert(...).select("id")`. UUID = DB default of `listings.id`. **Leonix Ad ID = DB trigger `listings_leonix_ad_id_bi` → `leonix_listings_prefix(category)`** (`supabase/migrations/20260506150000_leonix_ad_id_all_classifieds.sql`): `SALE` (en-venta), `CLASS`, `COM`, `PET`, `BUSCO` (later prefix migrations `20260507140000`, `20260519180000`, `20260520120000`). The client never generates it (`communityLeonixAdId.ts` only reads it back).
* **C PUBLICATION AUTHORITY** — the BROWSER writes the publish status: the publisher inserts `status:"draft", is_published:false`, uploads media, then does `update({ status:"active", is_published:true })` (`publishCommunityQuickToListings`, `publishBuscoQuickToListings`, `publishMascotasPerdidosQuickToListings`, `finalizeEnVentaListingForPublicBrowse`). Failure path `markPublishFailedNonPublic` writes `removed`. RLS `listings_authenticated_update_own` has NO column limit (repo migration `20260421130001_listings_enable_rls_full_policies.sql`; production policy "Owner update own listings" identical per `PROPOSED_DB_HARDENING §1`). No pre-publish moderation exists for these lanes; AI review is advisory only (`app/admin/_lib/listingAiModerationService.ts` reads, never flags/hides).
* **F DASHBOARD PREDICATE** — `app/(site)/dashboard/lib/ownerListingsQuery.ts:fetchOwnerListingsForDashboard` (owner_id, all statuses) sorted into tabs by `mis-anuncios/page.tsx#passesTab` / `listingRowCategoryKey`; not-live truth via `dashboardPendingPayment.ts:isSharedListingsRowNotLive`.
* **G ADMIN** — Queue: `ListingsCategoryOpsQueuePage` → `app/admin/_lib/listingsAdminSelect.ts:fetchListingsForAdminWorkspaceFiltered`. Live: `adminLivePredicates.ts:genericLiveSqlPlan` + `isGenericListingPubliclyLive` (per-category, below).
* **H SAME-ROW EDIT** — `app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx` → `ownerListingsLifecycleClient.ts:applyOwnerListingPatch` (`UPDATE listings … WHERE id AND owner_id`), never inserts. A duplicate can only come from a fresh application that has no in-flight id (session `COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS`, `verifyQuickListingReusable`) combined with the missing `publish_attempt_key` index (F4).
* **I MODERATION** — `app/api/admin/clasificados/listings/[id]/route.ts` PATCH: suspend ⇒ `status='flagged', is_published=false`; archive ⇒ `removed`; unsuspend/republish ⇒ `active` gated by `adminReactivationPolicy.ts:decideAdminReactivation` and `adminStaffCoreFieldGuard.ts`. No marker column on `listings`; owner-side blocking is UI-only (`dashboardOwnerMayActivateFromStatus`: paused / sold / active only; `EnVentaListingManageCard.canOwnerResume` excludes flagged). No RLS/DB enforcement (F3).
* **J LIFECYCLE** — no free lane stamps `expires_at`; free lanes never expire. Only En Venta stamps `published_at`. `isListingRowWithinEnforcedTerm` (`enforcedTermReadPredicate.ts`) applies to `rentas`/`clases` only and treats a null `expires_at` as in-term.
* **K CHECKOUT PROOF (all free lanes)** — the ONLY client that calls `/api/revenue-os/checkout` is `app/lib/listingPlans/revenueCategoryCheckoutClient.ts:startRevenueCategoryCheckout` (constant `REVENUE_CATEGORY_CHECKOUT_ROUTE`). Server: `revenueCheckout.ts:validateRevenueCheckoutRequest` refuses any package whose `isStripeEligiblePackageKey` is false (`package_not_stripe_eligible`) and any `billingMode==='free'`/price ≤ 0 (`package_is_free`); `checkout/route.ts` maps both to HTTP 422. In the matrix, `clases_free`, `comunidad_free`, `mascotas_free`, `busco_free`, `en_venta_free_v1`, `empleos_job_fair_free` are all `priceCents:0, stripeEligible:false`; `empleos_job_fair_free` is additionally hard-rejected first (`validateRevenueCheckoutRequest`, `EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY`). `scripts/verify-final-circuit-matrix.ts` asserts all of this and that no free-lane publisher/client file mentions the checkout client.

---

## 2. Empleos Feria — `empleos_job_fair_free`

| Step | Evidence |
|---|---|
| Application | `/publicar/empleos/feria` → `app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx` (session draft `EMPLEOS_SESSION_KEYS.feria`) |
| Preview | `/clasificados/empleos/feria-preview` → `app/(site)/clasificados/empleos/feria-preview/EmpleoFeriaPreviewClient.tsx` — reads the session draft only; **no publish call, no DB write** |
| Canonical save | publish confirm modal in the application client → `POST /api/clasificados/empleos/listings` (`route.ts:POST`, `{envelope, mode:"publish"}`) → `empleosPublicListingsDbServer.ts:upsertEmpleosListingFromEnvelope`. TABLE `empleos_public_listings`. UUID = `crypto.randomUUID()` (or a declared id that fails closed `QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE`). **Leonix Ad ID = DB trigger `empleos_public_listings_leonix_ad_id_bi` → `JOB-YYYY-NNNNNN`** (re-read and returned by the route) |
| Publication authority | SERVER ONLY. RLS on the table has select policies only (`20260410210000_empleos_public_listings.sql`), so an owner cannot client-write. `empleosPublishLifecyclePolicy.ts:resolveEmpleosUpsertLifecycle` with `FREE_LANES = {feria}` ⇒ `published` (or `pending_review` when `EMPLEOS_REQUIRE_LISTING_REVIEW="1"`; prod value unverified — F11). Draft mode never demotes an existing row. Owner PATCH `[listingId]/route.ts` → `updateEmpleosListingLifecycleOwner` → `resolveEmpleosOwnerTransition` |
| Results predicate | `fetchEmpleosPublishedJobRecords` — `lifecycle_status = 'published'` (no expiry) |
| Detail predicate | `fetchEmpleosPublishedListingRowBySlug` — same |
| Dashboard predicate | `dashboardInventory.ts:fetchOwnerEmpleosListings` (+ server `fetchEmpleosListingsForOwner`) |
| Admin Queue | `fetchAllEmpleosListingsForAdmin` via `GET /api/admin/empleos/listings` |
| Admin Live predicate | `adminLivePredicates.ts:isEmpleosRowPubliclyLive` and `classifiedsRepublishCapability.ts:empleosRowIsPublicLive` (`lifecycle_status === 'published'`) — agree with the results predicate |
| Same-row edit | `?edit=<uuid>`: `GET …/listings/[listingId]` then POST with `envelope.listingId` ⇒ update of the same id (an id that does not exist fails closed). First-time application keeps `serverListingId` in React state only (F7) |
| Moderation | `PATCH /api/admin/empleos/listings/[id]` → `adminEmpleosStaffActions.ts:decideEmpleosStaffAction`: suspend ⇒ `paused` + marker `staff_suspended`; reject ⇒ `rejected` + marker; send_to_review ⇒ `pending_review` + marker; **archive ⇒ `archived` with NO marker (F5)**; unsuspend/republish ⇒ `published` (feria has no payment gate: `empleosRowAwaitsPayment` false for a free lane). Owner resume blocked by `hasStaffReason` for paused / pending_review / rejected only |
| Sold / expired | none. A feria listing never expires; `validThrough` is JSON-LD only; the feria date does not hide the listing |
| Never enters checkout | feria client only uses the `/api/clasificados/empleos/listings` endpoints; `empleosRevenueCheckout.ts` is imported by Quick/Premium only. Server: `empleos_job_fair_free` is rejected in `validateRevenueCheckoutRequest`; `checkout/route.ts` Empleos pre-flight only accepts `empleos_job_post_paid` on an owned `draft` |
| Paid post as feria? | **Nothing stops it — F1 (HIGH).** The reverse (a feria draft paid as `empleos_job_post_paid`) is not lane-checked at the Empleos pre-flight but is harmless (F12) |

## 3. Clases free

| Step | Evidence |
|---|---|
| Application | `/publicar/clases/quick` (`ClasesQuickApplicationClient`) |
| Preview | `/publicar/clases/quick/preview` → `CommunityQuickPreviewClient` (`kind="clases"`); reads the session draft (`COMMUNITY_SESSION_KEYS.clases`), writes nothing |
| Canonical save | `app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts:publishCommunityQuickToListings` (Spine B; prefix `CLASS`; reuse `verifyQuickListingReusable`; attempt key `getOrCreateSessionPublishAttemptKey` — column missing in prod, F4). Free vs paid = `CommunityQuickPreviewPublishBar.tsx` `isPaidClases` (`classCostType === "pagada"`) |
| Publication authority | Spine C: client-direct `update({status:"active", is_published:true})` after media upload; `shouldBlockClasesPaidPublish` is client-only |
| Results predicate | `app/(site)/clasificados/community/shared/communityListingsBrowseClient.ts:fetchPublishedCommunityCategoryListings` — `is_published=true`, status `active|sold`, `isListingRowWithinEnforcedTerm` |
| Detail predicate | generic `app/(site)/clasificados/anuncio/[id]/page.tsx` (`is_published !== false`, active|sold, term check) |
| Dashboard | Spine F |
| Admin Queue / Live | Spine G; Live = `isGenericListingPubliclyLive('clases')` (`is_published===true`, active|sold, paid term not elapsed) |
| Same-row edit | Spine H |
| Moderation | Spine I **plus F6**: a free Clases row never gets `published_at`/`expires_at`, and `decideAdminReactivation` treats every `clases` row as a paid lane ⇒ staff Restore/Republish returns 409 `payment_required` |
| Sold / expired | free Clases never expires; `sold` stays in the reader query (anon RLS may hide it, F8) |
| Never enters checkout | `startRevenueCategoryCheckout` is called in `CommunityQuickPreviewPublishBar.tsx` ONLY inside `if (isPaidClases)`; a free class takes the non-checkout branch. The other Clases entry is the dashboard "Complete payment", offered only when `resolveSharedListingPaymentLane` sees `pending` + unpublished + `Leonix:classCostType==="pagada"`. Server pre-flight in `checkout/route.ts` (`LISTINGS_PAID_BASE_CATEGORY`) accepts `clases_paid_30d` only for an owned `pending` unpublished `clases` row |

## 4. Comunidad

| Step | Evidence |
|---|---|
| Application / preview | `/publicar/comunidad/quick` (`ComunidadQuickApplicationClient`) → `/publicar/comunidad/quick/preview` (same shared preview client + publish bar, `kind="comunidad"`) |
| Canonical save | same `publishCommunityQuickToListings` (Spine B; prefix `COM`) |
| Publication authority | Spine C; no payment branch (`isPaidClases` false for `kind !== "clases"`) |
| Results | `fetchPublishedCommunityCategoryListings` + event-date filter `communityEventDiscoveryExpiration.ts:prepareComunidadDiscoveryRows` (hides events whose end/start date is past, in results and landing; the detail stays reachable) |
| Detail | generic anuncio page (same as Clases) |
| Dashboard / Queue | Spine F / G |
| Admin Live | `isGenericListingPubliclyLive('comunidad')` = `is_published===true` and active|sold — no event-date logic (F9) |
| Same-row edit / moderation | Spine H / I |
| Sold / expired | no `expires_at`; event-date expiry is discovery-only; sold visible per the reader |
| Never enters checkout | `isPaidClases` requires `kind==="clases"`; `resolveSharedListingPaymentLane` returns null for comunidad; `comunidad_free` is `stripeEligible:false` |

## 5. Busco

| Step | Evidence |
|---|---|
| Application / preview | `/publicar/busco/quick` (`BuscoQuickFormClient`) → `/publicar/busco/quick/preview` (`BuscoQuickPreviewClient` + `app/(site)/publicar/busco/quick/BuscoQuickPreviewPublishBar.tsx`); draft in session storage (`BUSCO_QUICK_DRAFT_KEY`); nothing saved before Publish |
| Canonical save | `app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts:publishBuscoQuickToListings` (category `busco`, `price:0`, `is_free:true`, status `draft`; reuse + attempt key; prefix `BUSCO`) |
| Publication authority | Spine C (`markPublishFailedNonPublic` on failure); no moderation gate |
| Results | `app/(site)/clasificados/busco/shared/loadBuscoListings.ts:fetchPublishedBuscoListings` (`is_published=true`, active|sold) |
| Detail | generic detail with the Busco shell (`BuscoPublishedDetailPage`) |
| Dashboard / Queue / Live | Spine F / G; Live = comunidad rule |
| Same-row edit / moderation | Spine H / I (dashboard has a row-level Edit button for Busco) |
| Sold / expired | no `expires_at`; sold per reader (F8) |
| Never enters checkout | the publish bar imports only `publishBuscoQuickToListings`; no checkout reference in the Busco folders; `busco_free` `stripeEligible:false` |

## 6. Mascotas y perdidos

| Step | Evidence |
|---|---|
| Application / preview | `/publicar/mascotas-y-perdidos/quick` (`MascotasPerdidosQuickFormClient`) → `…/quick/preview` (`MascotasPerdidosQuickPreviewClient` + `MascotasPerdidosQuickPreviewPublishBar`) |
| Canonical save | `app/(site)/publicar/mascotas-y-perdidos/shared/publishMascotasPerdidosQuickToListings.ts:publishMascotasPerdidosQuickToListings` (idempotent: reuse fail-closed + attempt key; prefix `PET`) |
| Publication authority | Spine C; no moderation gate |
| Results | `app/(site)/clasificados/mascotas-y-perdidos/shared/loadMascotasPerdidosListings.ts:fetchPublishedMascotasPerdidosListings` (same filters as Busco) |
| Detail | generic detail with `MascotasPerdidosPublishedDetailPage` |
| Dashboard / Queue / Live | Spine F / G; no row-level Edit shortcut (Manage → generic editor) |
| Same-row edit / moderation | Spine H (mascotas adapter) / I |
| Sold / expired | no `expires_at` |
| Never enters checkout | no checkout reference in the Mascotas folders; `mascotas_free` `stripeEligible:false` |

## 7. En Venta (free, and the "Pro" question)

| Step | Evidence |
|---|---|
| Application | `/publicar/en-venta` → `QuickLaneCheckpointClient` (`getEnVentaCheckpointCard`, card copy "Publicar gratis / En Venta — Gratis"); its single card routes to `/clasificados/publicar/en-venta/pro` (`QuickLaneCheckpointClient.tsx`, `LeonixEnVentaProApplication`) — the route is named `pro` but the card is sold as free; `/free` and `/storefront` also exist |
| Preview | `/clasificados/en-venta/preview` (`EnVentaPreviewPage`, IndexedDB draft); publish in `EnVentaPublishSubmitBar` |
| Canonical save | `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts:publishEnVentaFromDraft(state, lang, plan)` (reuse via in-flight id + attempt key; prefix `SALE`; ID returned from `finalizeEnVentaListingForPublicBrowse`) |
| Publication authority | `finalizeEnVentaListingForPublicBrowse` — client-direct `status='active'`, `is_published=true`, `published_at`. Only "moderation" is the client-side `evaluateEnVentaFamilySafetyFromState` (bypassable) |
| Results | `app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse.ts` → `queryEnVentaBrowseListings` (`status='active'`) + `enVentaListingVisibility.ts:isEnVentaListingPubliclyVisible` (active AND `is_published !== false`); ignores expiry (never set) |
| Detail | generic detail via `shouldUseEnVentaPublishedDetailShell`; sold viewable by direct URL (RLS allows en-venta `sold` when `is_published` is not false) |
| Dashboard | Spine F with `EnVentaListingManageCard` and Pro chips (`dashboardListingMeta.ts:listingPlanFromDetailPairs`) |
| Admin Queue / Live | Spine G; Live = default branch of `isGenericListingPubliclyLive`: active, `is_published !== false`, not expired; **`sold` is NOT live** |
| Same-row edit | Spine H (also recomputes `is_free`) |
| Moderation | Spine I |
| Sold / expired | `mis-anuncios/page.tsx#markStatus("sold")` keeps `is_published`, so a sold ad is direct-URL viewable and excluded from results; never expires; owner relist from sold/paused is client-direct (`dashboardOwnerMayActivateFromStatus`) |
| Never enters checkout | no checkout reference in the en-venta folders; `en_venta_free_v1` `stripeEligible:false` |
| **Pro status** | **ACTIVE, free, commercially inert.** `plan: "free"|"pro"` is a parameter of `publishEnVentaFromDraft`; it writes `Leonix:plan` into `detail_pairs`, enables an external video URL, more photos (`EN_VENTA_PREVIEW_MAX_PHOTOS.pro`), Mux video columns and the dashboard "Refresh listing" (`renewEnVentaRepublish`). Because the canonical checkpoint (`QuickLaneCheckpointClient.tsx`) routes only to `/pro`, every En Venta ad published through it is created as Pro with no payment. `Leonix:plan` is client-written and never server-verified; `resolvePlanTier` also infers Pro from Mux video / `rentas_tier`. The matrix note "Legacy Pro fields documented but inactive in V1" contradicts the live `/pro` route (F10, owner decision) |

## 8. Restaurantes "free application"

| Step | Evidence |
|---|---|
| What it is | **API-only.** `POST /api/clasificados/restaurantes/publish` (`route.ts:POST`) inserts a NEW row with `status: pendingPayment ? RESTAURANTE_PENDING_CHECKOUT_STATUS : "published"` when `activation_mode` is absent. No UI calls it that way: the only callers are the dashboard edit save (`RestauranteApplicationClient.tsx:saveExistingDashboardListing`, existing rows) and `saveRestaurantePendingBeforeCheckout.ts` (`pending_payment`) |
| Gating | only the minimum-content check, a bearer check when strict (`isRestaurantesStrictPublishEnvironment`: `RESTAURANTES_STRICT_PUBLISH=1` or `VERCEL_ENV=production`) and media validation. **No payment, entitlement or moderation gate.** `resolveRestauranteOwnerEditTargetStatus` guards updates of existing rows only. In non-production environments (Vercel Preview/dev) even the bearer is optional |
| Canonical save | TABLE `restaurantes_public_listings`; UUID = DB default; Leonix Ad ID = `allocateNextRestauranteLeonixAdId` (`REST-YYYY-NNNNNN`); edits reuse the OLDEST row by `draft_listing_id` |
| Results / detail | `tryListRestaurantesPublicListingsFromDb` / `getRestaurantePublicListingBySlugFromDb` (`status='published'`) |
| Dashboard | `fetchOwnerRestaurantListings` |
| Admin Queue / Live | `listRestaurantesPublicListingsAdminFromDb` / `isRestauranteRowPubliclyLive` (agree) |
| Moderation | `PATCH /api/admin/restaurantes/listings/[id]`: suspend ⇒ `suspended`, archive ⇒ `archived`, unsuspend/republish ⇒ `published` behind `decideAdminPrePublishAction` |
| Verdict | Restaurantes is "always paid" (`docs/category-ad-plan-rules.md`). The route's unpaid-publish branch is a server-side revenue bypass — **D1 in the paid matrix** |

## 9. Other lanes that publish without payment

* **Comida Local** — NOT free: `comida-local/publish/route.ts` refuses a new row unless `activationMode==="pending_payment"` (402) and requires a bearer for it. (The agent-suspected anonymous published insert is unreachable: the `payment_required` return precedes the `status: isPendingPayment ? "pending_payment" : "published"` line.) Only residual: ownerless legacy rows are editable/claimable by any caller, including an unauthenticated one (`D11`).
* **Ofertas Locales coupons** — free product by catalog (`OFERTAS_LOCALES_COUPONS_PRICE_CENTS = 0`, `validateOfertaLocalSubmissionEntitlement ⇒ source:"free"`; `coupons/sync/route.ts`); public only after staff approval + active term (`isOfertaLocalPublicOfferRowEligible`). Price disagreement with the matrix = D5.
* **Viajes staged** — `POST /api/clasificados/viajes/submit` ⇒ `submitted`; public only after admin approve (`approved` + `is_public`); `viajes_affiliate` `stripeEligible:false`; `viajes_business_monthly` refused by checkout.
* **Iglesias** — `app/lib/iglesias/churchApplication.ts` auto-publishes (`AUTO_PUBLISH`), `prayerService.ts` auto-publishes prayers when clearly safe (`published_at: route.publish ? now : null`); both are free and rule/AI-authoritative — already flagged OWNER REVIEW in `CATEGORY_CIRCUIT_CLOSEOUT_2026-09.md`.
* **Recursos comunitarios** — intake writes `needs_review` (`app/lib/recursos/intake/*`); staff publishes.
* **Eventos / Trabajos** — served by Comunidad / Empleos (Feria is Empleos' only free lane).
* **Dev-only** — `POST /api/clasificados/en-venta/dev-seed-listing` (unauthenticated; inserts an active published En Venta row or DELETES a listing by id) returns 404 unless `EN_VENTA_DEV_PUBLISH=1`: that variable must be unset in production (F11).

---

## 10. Defects found

| ID | Sev | Where (file:function) | Scenario | Minimal fix |
|---|---|---|---|---|
| **F1** | **HIGH** | `app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts:upsertEmpleosListingFromEnvelope` (`resolveEmpleosUpsertLifecycle({ lane: input.envelope.lane … })`); `staged/empleosEnvelopeToJobRecord.ts` (`lane: e.lane` at the canonical; job record built from `e.payload.lane`); `app/api/clasificados/empleos/listings/route.ts:POST` | The payment policy reads the TOP-LEVEL `envelope.lane`; the content is built from `envelope.payload.lane`. A logged-in user POSTs `{ envelope: { lane:"feria", payload:{ lane:"quick"|"premium", … } }, mode:"publish" }` for a NEW row and gets a normal job post published immediately with no $24.99 payment (lane check `lane_mismatch` only exists for an EXISTING row). There is no server-side feria payload validation. | Derive the lane from `payload.lane`, reject `envelope.lane !== envelope.payload.lane` (400), and for `feria` validate the feria payload (title, date, venue) server-side before allowing the free path. |
| **F2** | HIGH | see **D1** (paid matrix): `restaurantes/publish/route.ts:POST` | Free Restaurantes publish via the API | see D1 |
| **F3** | MED-HIGH (DB) | `public.listings` RLS (`listings_authenticated_update_own`, no column limit; production "Owner update own listings") | Beyond the paid-lane self-activation already recorded (D7): an owner can flip their own **staff-moderated** free-lane row (`flagged`/`removed`) back to `active`/`is_published=true` through the anon API; owner-side blocking is UI-only (`dashboardOwnerMayActivateFromStatus`). Moderation of Busco/Comunidad/Mascotas/Clases/En Venta cannot hold. | Extend the proposed `listings_guard_paid_lane_owner_activation` trigger (`PROPOSED_DB_HARDENING §1`) to every category: for `authenticated`/`anon`, refuse transitions out of `flagged` and `removed`, and `is_published false→true` unless the old status is `paused`. Not source-fixable. |
| **F4** | MED (known) | `listings.publish_attempt_key` column + unique index missing in production (migration `20260804120000`); `insertListingsRowResilient` drops the unknown column silently | Concurrent double-submit creates duplicate rows in En Venta, Busco, Clases, Comunidad, Mascotas. | Owner applies the migration (`PROPOSED_DB_HARDENING §2`). |
| **F5** | MED | `adminEmpleosStaffActions.ts:decideEmpleosStaffAction` (`case "archive"` writes no `moderation_reason`); `empleosPublishLifecyclePolicy.ts:resolveEmpleosOwnerTransition` (`archived` + `everPublished` ⇒ `published`; the `hasStaffReason` block covers paused / pending_review / rejected only) | Staff archives an Empleos post for moderation; the owner PATCHes it back to `published`, undoing the decision. (Also true for a suspended-then-archived row: the reason persists but `archived` is not in the guarded set.) | Write a marker on staff archive and, in `resolveEmpleosOwnerTransition`, refuse `archived → published` when a staff reason exists. |
| **F6** | MED | `app/admin/_lib/adminReactivationPolicy.ts:decideAdminReactivation` (`PAID_LANE_CATEGORIES` includes `clases` regardless of paid/free; `provenNeverLive = !published_at && !expires_at`); free publisher `publishCommunityQuickToListings` final update writes neither `published_at` nor `expires_at` | A staff-suspended FREE Clases listing can never be restored or republished by Admin (409 `payment_required`). (Prod default for `listings.published_at` is unverified; the repo migration adds the column with no default.) | Stamp `published_at` in the free publisher's final update, or make the policy exempt Clases rows whose `detail_pairs` say `Leonix:classCostType !== "pagada"`. |
| **F7** | LOW-MED | `EmpleoFeriaApplicationClient.tsx` (`serverListingId` in React state only; session draft not reset after publish) + `upsertEmpleosListingFromEnvelope` (`crypto.randomUUID()` when no id) | Publish → Back → Publish inserts a SECOND feria row (Quick/Premium use `empleosPendingCheckoutIdentity`; feria does not). | Persist the id per lane+title (as `empleosPendingCheckoutIdentity`) or clear the draft on success. |
| **F8** | LOW-MED (verify prod) | anon RLS `listings_anon_select_public_catalog` (repo `20260421130001`: outside rentas / en-venta / bienes-raices anon sees only `status='active'`) vs readers `fetchPublishedCommunityCategoryListings`, `fetchPublishedBuscoListings`, `fetchPublishedMascotasPerdidosListings` (query active + sold) and `isGenericListingPubliclyLive` (counts sold as live) | Sold Busco/Comunidad/Mascotas/Clases rows are probably invisible to anonymous visitors while Admin Live reports them live. Production RLS was not re-read. | Confirm production RLS; either add `sold` to the anon policy for those categories or drop `sold` from the readers and the Admin Live predicate. |
| **F9** | LOW | `communityEventDiscoveryExpiration.ts:prepareComunidadDiscoveryRows` vs `isGenericListingPubliclyLive` (comunidad branch) | Past-event Comunidad rows are hidden from public discovery but counted live by Admin. | Apply the same date rule in the Admin Live predicate or document it as an intentional superset. |
| **F10** | LOW (owner decision) | `enVentaPublishFromDraft.ts:publishEnVentaFromDraft` (`Leonix:plan`), `QuickLaneCheckpointClient.tsx` (routes only to `/pro`, card says "gratis"), `revenuePricingMatrix.ts` (`en_venta_free_v1`: "Legacy Pro fields … inactive") | Pro is live, free, and client-controlled; the matrix says inactive. | Decide: keep Pro free-active and fix the matrix note, or gate/verify `Leonix:plan` server-side. |
| **F11** | INFO / verify env | `app/api/clasificados/en-venta/dev-seed-listing/route.ts:POST` (gate = `EN_VENTA_DEV_PUBLISH === "1"` only, no auth); `EMPLEOS_REQUIRE_LISTING_REVIEW` | If the dev flag is set anywhere public, anyone can create or delete listings. If `EMPLEOS_REQUIRE_LISTING_REVIEW` is unset, Feria auto-publishes with no review. | Confirm both env values in Vercel production. |
| **F12** | LOW (benign) | `checkout/route.ts` Empleos pre-flight (`empleos_job_post_paid` on an owned `draft`, no lane check) | A feria draft can be paid through the paid package (harmless self-charge). | Add `lane !== 'feria'` to the pre-flight. |
| **F13** | LOW | `quickListingIdempotency.ts:verifyQuickListingReusable` (checks owner + category only, never status) + community/Busco/Mascotas/En Venta reuse blocks + `markPublishFailedNonPublic` (`removed`) | A stale in-flight id can revive a row an owner or staff removed/flagged (`draft → active`); for paid Clases the in-flight id is not cleared before the Stripe redirect, so a later free republish updates a paid, active row. | Allow reuse only from `draft`/`pending`; write `draft` instead of `removed` on failed publish. |

### Proven correct (no defect)

* All six free packages are `priceCents:0` and `stripeEligible:false`; the server rejects them before any Stripe call (`package_not_stripe_eligible`, `package_is_free`, `EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY` hard reject).
* No free-lane publisher or preview bar (`publishCommunityQuickToListings` free branch, `publishBuscoQuickToListings`, `publishMascotasPerdidosQuickToListings`, `enVentaPublishFromDraft`, Feria client) references the checkout client.
* Free lanes read a Leonix Ad ID that the DB trigger created; nothing in the client generates one.
* Free-lane edits are same-row UPDATEs by id + owner (`applyOwnerListingPatch`, envelope `listingId`); dashboard relist is limited to `paused/sold/active` sources.
* Admin Live agrees with the public reader for Empleos, Restaurantes, En Venta (`is_published` null/false handling verified in `listingPublicBrowseEligibility.ts`) — the remaining En Venta gap is only that results ignore `expires_at`, which is never set.
