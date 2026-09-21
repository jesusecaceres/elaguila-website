# 10 — ANALYTICS EVENT COVERAGE (G27)
Ref: `origin/main`. Sept seal `e3956df8`. Stream status: **COMPLETE**.

---

## 1. CANONICAL ENGINE

Single intended write path: browser → `recordAnalyticsEvent` → `POST /api/analytics/events` →
server-side identity resolution (service role) → **`public.listing_analytics`**.

| PATH | SYMBOLS |
|---|---|
| `app/lib/listingAnalyticsEventTypes.ts` | `LISTING_ANALYTICS_EVENT_TYPES` (33), `isListingAnalyticsEventType` |
| `app/lib/analytics/listingAnalyticsIdentity.ts` | `LISTING_ANALYTICS_SOURCE_TABLES` (8), `buildCanonicalAdId`, `buildAnalyticsKeySet`, `normalizeListingAnalyticsIdentity`; `:25` `LISTING_ANALYTICS_CATEGORIES` = all 14 + `travel` alias |
| `app/lib/analytics/client/recordAnalyticsEvent.ts:40-72` | `recordAnalyticsEvent` — 13 importers |
| `app/lib/analytics/client/listingEngagementRecorder.ts:97-187` | `recordListingEngagementEvent` + 6 trackers — 7 UI importers |
| `app/lib/analytics/client/connectionHubCtaDispatch.ts:58-77` | `dispatchConnectionHubCta` — 3 importers |
| `app/api/analytics/events/route.ts:31-132` | `POST` (`runtime:"nodejs"`, `force-dynamic`) |
| `app/lib/analytics/server/validateAnalyticsEvent.ts` | `parseAnalyticsEventBody:107-145`, `assertAnalyticsEventAuth:147-155`, `sanitizeAnalyticsMetadata:79-105` |
| `app/lib/analytics/server/resolveListingAnalyticsIdentity.ts:92-313` | server-role row read; header `:2` "never trust client owner_user_id" |
| `app/lib/analytics/server/analyticsEventDedupe.ts:7-51` | `findRecentDuplicateAnalyticsEvent`, `dedupeWindowMsForEvent` |
| `app/lib/analytics/selfEngagementGuard.ts:14-22` | `isSelfEngagement` — 5 importers |
| `app/lib/analytics/server/dashboardAnalyticsMetrics.ts:101-292` | `aggregateDashboardAnalyticsTotals`, `eventBelongsToOwner`, `dedupeDashboardAnalyticsRows`, `bucketToDashboardListingMetrics` |
| `app/lib/analytics/server/fetchOwnerDashboardAnalyticsServer.ts:23,54-68,155,251` | `fetchOwnerDashboardAnalyticsServer`, `fetchListingDashboardAnalyticsServer` |

**Guarantees that hold:** owner identity is server-forced per source table (`owner_id` for
`listings`/`ofertas_locales`; `owner_user_id` for autos/empleos/servicios/restaurantes/comida-local/viajes);
client `category` is demoted to `metadata.client_category` (`route.ts:90-93`); metadata sanitized to
≤32 keys / key ≤80ch / values ≤500ch, primitives only; auth required for
`{listing_save, listing_unsave, message_sent}` (`validateAnalyticsEvent.ts:40-44`); server dedupe
windows — `listing_view` 30 min, `listing_impression` 10 min, `result_card_click` 5 min,
`listing_open` 5 min, keyed on `canonical_ad_id + event_type + (user_id || anonymous_session_id)`.

**DB↔TS drift: NONE.** The DB CHECK (33 event types, current migration
`20260819210000_leonix_endorsement_votes.sql:202-236`) matches `LISTING_ANALYTICS_EVENT_TYPES` exactly.

**Migrations:** `20250311000000_listing_analytics.sql` (base) · `…000002_profile_view` ·
`…000003_listing_open` · `20250429000000_extend_listing_analytics_events` ·
`20260507180000_listing_analytics_schema_complete` (CHECK→19) · `20260507200000_…category_index` ·
**`20260602120000_g2a_global_analytics_identity.sql`** (adds `source_table`/`source_id`/`canonical_ad_id`
to `listing_analytics`, `saved_listings`, `user_liked_listings`; CHECK→23) ·
`20260801003000_ofertas_locales_partner_analytics_asset_lifecycle` (CHECK→31) ·
`20260819210000_leonix_endorsement_votes` (CHECK→33) ·
`20260812090000_listing_analytics_owner_scoped_select_rls.sql`.

---

## 2. 🔴 P0 — LEGACY BROWSER-DIRECT WRITER BYPASSES ALL OF IT

| PATH:LINE | Status |
|---|---|
| `app/lib/clasificadosAnalytics.ts:175` | **LEGACY, LIVE, 15 importers.** `supabase.from("listing_analytics").insert(payload)` **direct from the browser with the anon client.** `owner_user_id: event.owner_user_id \|\| null` (`:170`) is **client-supplied**. Writes **no** `source_table`/`source_id`/`canonical_ad_id`, so its rows are invisible to every G2A-identity read path. Bypasses server dedupe. |
| `app/lib/listingAnalytics.ts:26` | **LEGACY, LIVE, 3 importers.** Same anon direct insert; writes `event_source:"unknown"`, `metadata:{}`, **no** owner/category/source_table. Its own header says "Prefer `clasificadosAnalytics`". |

**The 15 importers include the shared engagement primitives** —
`app/components/clasificados/analytics/LeonixSaveButton.tsx:6`, `LeonixLikeButton.tsx`,
`LeonixShareButton.tsx`, `LeonixEngagementBar.tsx`, `LeonixListingMetricsSummary.tsx`,
`app/(site)/clasificados/components/ContactActions.tsx`,
`app/components/clasificados/EmailContactOptionsSheet.tsx`.
**This sits on nearly every category's hot path.** Any client can attribute engagement to an
arbitrary owner.

**PROVEN REFERENCE EXISTS: YES.**
REFERENCE CATEGORY: **Servicios** · REFERENCE PATH:
`app/(site)/clasificados/servicios/lib/serviciosListingAnalyticsMirror.ts:59-76` — server-mirrors an
ops event into `listing_analytics` with full G2A identity and `row.owner_user_id`, guarded against
double-count by `meta.clientListingAnalytics === true` (`:37`).
TARGET PATH: `app/lib/clasificadosAnalytics.ts` + the 15 button importers.
DIFFERENCE: repoint the shared buttons at `listingEngagementRecorder` (which already posts to the
canonical route) instead of the direct anon insert.
**ACTION: ADOPT EXISTING.**

---

## 3. 🟠 P1 — SELF-ENGAGEMENT PREVENTION IS UI-ONLY

`/api/analytics/events` **never** compares `authenticatedUserId` to `identity.ownerUserId`.
`isSelfEngagement` is enforced only in button components (`LeonixSaveButton.tsx:86-89`,
`LeonixLikeButton.tsx`). A direct POST records owner self-engagement freely.

Sept `3eacdec9` closed 4 specific gaps (7 files, +117/−8). **All 4 confirmed STILL LIVE on origin/main:**
1. `app/(site)/clasificados/rentas/listing/[id]/RentasListingDetailClient.tsx:155` — privado branch
   has no `ownerId`; `:170-183` `LeonixSaveButton` has no `ownerUserId`.
2. `app/(site)/clasificados/rentas/preview/shared/RentasVisualMatchPreviewView.tsx:742-760` —
   `LeonixLikeButton` has no `ownerUserId` (prop `ownerId` exists `:49`/`:347`, unused there).
3. `app/admin/actions.ts:13-23` — `submitListingReportAction` inserts with **zero** ownership check.
4. `app/(site)/clasificados/en-venta/report/submitEnVentaListingReport.ts` — grep for
   `isSelfEngagement|owner_id|self_report` returns **empty**.

Net on main: a Rentas owner can Save/Like their own listing; any owner can Report their own listing
via either implementation.
**ACTION: ADOPT EXISTING (merge Sept) for the 4; FIX REGRESSION (server-side check) for the structural hole.**

---

## 4. EVENT COVERAGE MATRIX

`T` = emitter traced · `F` = no emitter found · `N` = N/A
SRV=servicios RST=restaurantes CML=comida-local BR=bienes-raices REN=rentas AUT=autos EMP=empleos
OFL=ofertas-locales COM=comunidad CLA=clases BUS=busco MAS=mascotas ENV=en-venta VIA=viajes NGL=negocios-locales

| Event | SRV | RST | CML | BR | REN | AUT | EMP | OFL | COM | CLA | BUS | MAS | ENV | VIA | NGL |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| listing_view | T | T | T | T | T | T | T | F | T | T | T | **F** | T | **F** | **F** |
| listing_open | F | F | F | T | F | F | F | T | T | T | T | F | F | F | F |
| save | T | T | F | T | T | T | T | F | T | T | T | F | T | F | F |
| like | T | T | F | T | T | T | T | F | T | T | T | F | T | F | F |
| share | T | T | F | T | F | T | T | T | T | T | T | F | T | F | F |
| report | F | F | F | T | F | F | F | F | T | T | T | F | T | F | F |
| call / phone | T | T | T | T | T | T | T | T | T | T | T | F | T | F | F |
| sms | T | T | T | T | T | T | T | T¹ | T | T | T | F | T | F | F |
| whatsapp | T | T | T | T | T | T | T | T | T | T | T | F | T | F | F |
| email | T | T | T | T | T | T | T | F | T | T | T | F | T | F | F |
| rich correo | F | F | F | F | F | F | F | F | F | F | F | F | F | F | F |
| website click | T | T | T | T | T | T | T | T | T | T | T | F | F | F | F |
| social click | F | T² | T³ | T² | F | T² | F | F | F | F | F | F | F | F | F |
| directions | T | T | T | T | T | T | T | T | F | F | F | F | T | F | F |
| lead_created | T | T | F | F | F | F | F | F | F | F | F | F | F | F | F |
| application submit | N | N | N | N | N | N | T | N | N | N | N | N | N | N | N |
| **checkout_start** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** |
| **checkout_success** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** |
| **payment_success** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** |
| **translate** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** | **F** |
| gallery open | F | F | F | F | F | F | F | F | F | F | F | F | F | F | F |
| video play | F | F | F | T⁴ | F | F | F | F | F | F | F | F | F | F | F |
| flyer / coupon open | N | N | N | N | N | N | N | T⁵ | N | N | N | N | N | N | N |

1. **BUG** — `OfertasLocalesPublicDetailView.tsx:374-375`: the SMS button calls `onCta("sms")` but
   `track("phone","sms")`, recording a **`phone_click`** with `metadata.provider="sms"`.
2. Social/review is `cta_click` + `metadata.cta`/`provider`, by design
   (`connectionHubCtaDispatch.ts:11-14`). RST `recordRestaurantesGlobalAnalytics.ts:42-43`;
   BR `brGlobalAnalytics.ts:183-193`; AUT `autosCtaTracking.ts:121-136`.
3. CML maps `instagram/facebook/tiktok → outbound_click` (`comidaLocalAnalytics.ts:103-106`).
4. `brGlobalAnalytics.ts:167-169` `trackBrTourVideoClickGlobal` → `cta_click{cta:"video"}`. Wired only
   at `BrAgenteResContactSidebar.tsx:667` (preview surface). **EVIDENCE GAP** on the live BR shell.
5. `ofertasLocalesPublicAnalytics.ts:103`, `OfertasLocalesPublicSearchClient.tsx:473`,
   `OfertasLocalesPublicDetailView.tsx:699`.

### 4.1 🟠 P1 — SIX EVENT KINDS ARE UNREPRESENTABLE
`checkout_start`, `checkout_success`, `payment_success`, `translate`, `gallery_open`, `video_play`
are **absent from `LISTING_ANALYTICS_EVENT_TYPES` AND from the DB CHECK**;
`git grep -n "checkout_start\|checkout_success\|payment_success"` over `app/` returns **empty**.
**No category can emit them.** This is a global gap, not a per-category one.
**PROVEN REFERENCE EXISTS: NO** — **ACTION: NET NEW** (add types + DB CHECK migration + emitters).

### 4.2 🟡 P2 — `listing_impression` IS A DEAD METRIC
In the allowlist and read by 4 aggregators (`dashboardAnalyticsMetrics.ts:140`), **emitted by nobody**.

### 4.3 🟡 P2 — THREE CATEGORIES EMIT NOTHING
- **mascotas-y-perdidos** — `MascotasPerdidosPublishedDetailPage.tsx:49-52` calls only `addListingView`
  (local `recentlyViewed`). Full analytics grep over the dir returns only that.
- **viajes** — `app/(site)/clasificados/viajes/lib/viajesPublicIntegration.ts:26-29` is a literal
  `// TODO: connect to shared trackEvent` stub. Note `viajes_staged_listings` **is** an allowed
  `source_table` (`listingAnalyticsIdentity.ts:19`) and the resolver handles it (`:297-302`) —
  **the server side is ready; the client side is unwritten.**
- **negocios-locales** — analytics grep returns empty; not in `LISTING_ANALYTICS_CATEGORIES`.

**PROVEN REFERENCE EXISTS: YES** · REFERENCE CATEGORY: **En Venta / Varios** ·
REFERENCE PATH: `app/lib/clasificados/en-venta/analytics/enVentaGlobalAnalytics.ts` (canonical
`listings`-backed emitter set) · TARGET PATHS: `viajesPublicIntegration.ts`,
`MascotasPerdidosPublishedDetailPage.tsx` · DIFFERENCE: no emitter module wired to the canonical
recorder · **ACTION: ADOPT EXISTING.**

---

## 5. PER-CATEGORY IDENTITY / STORAGE / READERS

| Category | EMITTER PATH | LISTING ID | OWNER FIELD | STORAGE | DASHBOARD READER | ADMIN READER |
|---|---|---|---|---|---|---|
| servicios | `servicios/lib/recordServiciosGlobalAnalytics.ts` (+`serviciosCtaIntents.ts`, `serviciosProfileEngagementAnalytics.ts:24`) | `servicios_public_listings.id`; canonical `leonix_ad_id`→slug | `owner_user_id` (`:276`) | `listing_analytics` + silo `servicios_analytics_events` | `fetchOwnerDashboardAnalyticsServer` | **`serviciosAdminCanonicalAnalytics.ts:40`** — the only one |
| restaurantes | `restaurantes/lib/recordRestaurantesGlobalAnalytics.ts` | `restaurantes_public_listings.id` | `owner_user_id` (`:282`) | `listing_analytics` | same | none |
| comida-local | `app/lib/clasificados/comida-local/comidaLocalAnalytics.ts:166,198` | `comida_local_public_listings.id` | `owner_user_id` (`:289`); requires `status="published"` (`:288`) | `listing_analytics` | same | none |
| bienes-raices | `app/lib/clasificados/bienes-raices/brGlobalAnalytics.ts` | `listings.id` | `listings.owner_id` (`:97`) | `listing_analytics` | same | none |
| rentas | `rentas/analytics/rentasAnalytics.ts` | `listings.id` | `owner_id` | `listing_analytics` | same | none |
| autos | `autos/lib/recordAutosGlobalAnalytics.ts` + `autosCtaTracking.ts` | `autos_classifieds_listings.id` | `owner_user_id` (`:130`); rejects `status="removed"` (`:128`) | `listing_analytics` + silo `autos_classifieds_analytics_events` | same | none |
| empleos | `empleos/lib/recordEmpleosGlobalAnalytics.ts` + `empleosCtaTracking.ts` | `empleos_public_listings.id` | `owner_user_id` (`:270`) | `listing_analytics` | same | none |
| ofertas-locales | `app/lib/ofertas-locales/ofertasLocalesPublicAnalytics.ts` | `ofertas_locales.id` | `owner_id` (`:158`); requires `status="approved"` (`:309`) | `listing_analytics` | `app/api/ofertas-locales/owner/[id]/route.ts:45` | none |
| comunidad / clases / busco | `app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics.ts` (`SOURCE_TABLE="listings"` `:10`) | `listings.id` | `owner_id` | `listing_analytics` | same | none |
| **en-venta (REFERENCE)** | `app/lib/clasificados/en-venta/analytics/enVentaGlobalAnalytics.ts` | `listings.id` | `owner_id` | `listing_analytics` | same | none |
| mascotas-y-perdidos | **NONE** | — | — | none | n/a | none |
| viajes | **NONE** (stub) | `viajes_staged_listings.id` (resolver-ready) | `owner_user_id` (resolver-ready) | none written | n/a | placeholders only |
| negocios-locales | **NONE** | — | — | none | n/a | none |

**Readers:** `app/api/dashboard/analytics/summary/route.ts`, `…/analytics/listing/route.ts`,
`…/owner-engagement/route.ts` → UI `app/(site)/dashboard/analytics/page.tsx:11,164`,
`…/analytics/listing/page.tsx`, `…/mis-anuncios/[id]/page.tsx`.
Leo/exec: `fetchLeoBuyerEngagementAnalyticsSlice.ts` → `leoExecutiveReportingAnalyticsAdapter.ts`.
🟡 **P2 — no cross-category admin analytics reader exists.** Only Servicios has one, plus a per-user
rollup at `app/admin/(dashboard)/usuarios/[id]/page.tsx:255`.

---

## 6. SILOS AND ORPHANS

| Silo | Path | Own table | Converge? |
|---|---|---|---|
| `clasificadosAnalytics` browser writer | `app/lib/clasificadosAnalytics.ts:175` | same table, wrong path | **YES — P0, §2** |
| `listingAnalytics.trackEvent` | `app/lib/listingAnalytics.ts:26` | same table, no identity | **YES** |
| Autos ops events | `app/api/clasificados/autos/public/analytics/event/route.ts` → `autosClassifiedsAnalyticsService.ts` | `autos_classifieds_analytics_events` | **PARTIAL** — deliberate BI lane; `mapAutosOpsEventToGlobal` (`recordAutosGlobalAnalytics.ts:31-44`) defines the bridge but the route has **no server-side mirror**. Should converge on write |
| Servicios ops events | `app/api/clasificados/servicios/analytics/route.ts:67` | `servicios_analytics_events` | **ALREADY CONVERGED — the reference pattern** (`serviciosListingAnalyticsMirror.ts:59-76`) |
| Digital Contact | `app/api/digital-contact/events/route.ts:53`; client `digitalContactAnalyticsClient.ts` (14 importers) | `digital_contact_*` | **NO / separate product** — but its own `lead_created` (`app/api/digital-contact/leads/route.ts:95`) **never reaches `listing_analytics`**, so owner dashboards under-count leads |
| Listing views counter | `app/api/clasificados/listings/[id]/views/route.ts:26,37` | reads/writes `listing_analytics` outside the canonical route | **YES** — small |

**ORPHANS — zero importers, proven by grep (excluding `.md` and self):**
`autos/analytics/autosAnalyticsExtended.ts` · `autos/analytics/autosAnalyticsEvents.ts` (still calls
legacy `trackEvent`) · `empleos/analytics/empleosAnalyticsExtended.ts` ·
`en-venta/analytics/enVentaAnalyticsExtended.ts` · `clasificados/lib/leonixClasificadosAnalytics.ts`
(still calls legacy `trackEvent`) · `app/lib/clasificados/restaurantes/restaurantesSellerAnalytics.ts` ·
`app/lib/ofertas-locales/ofertasLocalesAnalyticsEvents.ts` (duplicate event allowlist).
**DUPLICATE BARRELS (harmless):** `bienesRaicesGlobalAnalytics.ts` (re-export over `brGlobalAnalytics.ts`) ·
`autos/analytics/autosGlobalAnalytics.ts` (wrapper).
**LEGACY DUPLICATE:** `en-venta/analytics/enVentaAnalytics.ts` duplicates `enVentaGlobalAnalytics.ts`
via legacy `trackEvent` (2 importers).

**DO NOT DELETE NOW** — archive candidates only.

---

## 7. RANKED FINDINGS
| # | Finding | Sev |
|---|---|---|
| 1 | Client-trusted owner attribution (`clasificadosAnalytics.ts:170`) | **P0** |
| 2 | Self-engagement server check absent; 4 Sept G26 gaps live | **P1** |
| 3 | 6 event kinds unrepresentable | **P1** |
| 4 | 3 categories emit nothing | P2 |
| 5 | `listing_impression` dead metric | P2 |
| 6 | Ofertas SMS mis-attributed as `phone_click` | P2 |
| 7 | No cross-category admin analytics reader | P2 |
| 8 | 7 orphan analytics modules | P3 |
| 9 | `lead_created` traced for servicios + restaurantes only; digital-contact leads never land | P2 |

## 8. EVIDENCE GAPS
(a) `serviciosAnalytics.ts` reachability — symbols resolve via `serviciosAnalyticsIdentity.ts`, no
direct module import found. (b) BR live detail shell video/tour tracking — traced only on the
`publicar/.../preview` surface. (c) **No runtime/DB verification** — the Supabase MCP server requires
authorization and was unavailable in this session; all findings are source-level. The user can
authorize it via `/mcp` in an interactive session if runtime confirmation of `listing_analytics`
contents is wanted.
