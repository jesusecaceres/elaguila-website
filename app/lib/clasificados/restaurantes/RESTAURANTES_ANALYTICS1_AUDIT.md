# Gate REST-ANALYTICS1 — Restaurante Public CTA Tracking + Real Seller Analytics Truth

## Gate type

STRICT ANALYTICS TRUTH FOUNDATION — NO VISUAL REDESIGN — BUILD REQUIRED

## Preflight status

| Class | Files |
| ----- | ----- |
| RELATED_ALLOWED (this gate) | `app/(site)/clasificados/restaurantes/**`, `app/lib/clasificados/restaurantes/**` |
| RELATED_BLOCKING (dirty, not touched) | `app/(site)/dashboard/**` (parallel dashboard work), `app/lib/ofertas-locales/**` |
| UNRELATED_PARALLEL_WORK | Autos dashboard card, Ofertas Locales AI, `dashboardProductTruth.ts` |

## En Venta / Varios reference findings

1. **Client helper:** `recordAnalyticsEvent` via `enVentaGlobalAnalytics.ts` → `POST /api/analytics/events`
2. **Event types:** `app/lib/listingAnalyticsEventTypes.ts` allowlist (DB CHECK)
3. **Identity:** `source_table=listings`, `category=en-venta`, `source_id` = internal UUID, `canonical_ad_id` = Leonix ID
4. **Like/unlike:** authed `listing_like` / `listing_unlike`
5. **Share:** `listing_share` + `shareMethod` metadata
6. **Phone/WhatsApp/email/SMS:** dedicated `phone_click`, `whatsapp_click`, `email_click`, `message_click`
7. **Report:** real API + `cta_click` metadata `{ cta: "report_submit" }` when drawer submits
8. **Seller rollup:** `fetchOwnerDashboardAnalyticsServer` + `listingAnalyticsAggregate.ts`
9. **Dashboard hiding:** degraded banner when `listing_analytics` unavailable; pills only when value > 0 (except views)
10. **Owner lookup:** `resolveListingAnalyticsIdentity` + `buildAnalyticsKeySet`

## Restaurante identity / source findings

| Field | Value |
| ----- | ----- |
| Internal UUID | `restaurantes_public_listings.id` → analytics `source_id` |
| Leonix display ID | `leonix_ad_id` (e.g. `REST-…`) → `canonical_ad_id` / engagement key |
| Source table | `restaurantes_public_listings` |
| Category | `restaurantes` |
| Public route | `/clasificados/restaurantes/[slug]` |
| Owner lookup | `owner_user_id` on `restaurantes_public_listings`; included in `collectOwnerListingKeysForAnalytics` |
| Preview / draft | No `listingSourceId` → contact CTAs no-op analytics; like/save/share inert (`allowEngagement`) |

## Files inspected

- En Venta (read-only): `enVentaGlobalAnalytics.ts`, `EnVentaListingReportDrawer.tsx`, `listingAnalyticsEventTypes.ts`
- Restaurante public: `RestauranteAdStoryPreview.tsx`, `RestauranteProfileHeader.tsx`, `RestaurantContactHub.tsx`, `RestauranteShellInteractiveCtas.tsx`, `RestauranteProfileViewAnalytics.tsx`, `[slug]/page.tsx`
- Restaurante analytics libs: `restaurantesCtaTracking.ts`, `recordRestaurantesGlobalAnalytics.ts`, `restaurantesAnalyticsIdentity.ts`, `restaurantesAnalytics.ts`
- Shared: `listingAnalyticsIdentity.ts`, `recordAnalyticsEvent.ts`, `listingAnalyticsAggregate.ts`, `fetchOwnerDashboardAnalyticsServer.ts`, `ownerEngagementListingKeys.ts`
- Dashboard (read-only): `mis-anuncios/page.tsx`, `mis-anuncios/[id]/page.tsx`, `dashboard/restaurantes/page.tsx`, `dashboardInventory.ts`

## Files changed (this gate)

- `app/(site)/clasificados/restaurantes/lib/recordRestaurantesGlobalAnalytics.ts`
- `app/(site)/clasificados/restaurantes/lib/restaurantesCtaTracking.ts`
- `app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestauranteProfileHeader.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestauranteShellInteractiveCtas.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx`
- `app/lib/clasificados/restaurantes/restaurantesSellerAnalytics.ts` (new)
- `app/lib/clasificados/restaurantes/RESTAURANTES_ANALYTICS1_AUDIT.md` (this file)
- `scripts/restaurantes-analytics1-audit.ts` (new)
- `package.json` (audit script only)

## Event mapping used

| User action | Event type | Metadata |
| ----------- | ---------- | -------- |
| Page load (published) | `listing_view` | `event_source=detail` |
| Result card click | `result_card_click` | `event_source=results_card` |
| Like / unlike | `listing_like` / `listing_unlike` | authed |
| Save / unsave | `listing_save` / `listing_unsave` | authed |
| Share | `listing_share` | `shareMethod` |
| Llamar | `phone_click` | `restaurantesCtaType=phone` |
| WhatsApp | `whatsapp_click` | |
| Correo | `email_click` | |
| SMS | `message_click` | |
| Sitio web | `website_click` | |
| Menú | `cta_click` | `cta=menu_click` |
| Pedir ahora | `cta_click` | `cta=order_click` |
| Reservar | `cta_click` | `cta=reserve_click` |
| Cómo llegar | `directions_click` | |
| Google / Yelp reviews | `cta_click` | `cta=review_click`, `provider=google\|yelp` |
| Social icons | `cta_click` | `cta=social_click`, `platform=…` |
| Catering / stack quote link | `cta_click` | `cta=catering_quote_click` |
| Find-us / general hub | `cta_click` | `cta=general_click` |

Dedicated DB types `order_click`, `social_click`, `review_click` do **not** exist in allowlist — use `cta_click` + metadata (En Venta report pattern).

## Gate A — analytics + CTA inventory

| Item | Status | Evidence |
| ---- | ------ | -------- |
| En Venta/Varios pattern inspected read-only | PASS | `enVentaGlobalAnalytics.ts` |
| Restaurante public CTA inventory completed | PASS | matrix below |
| Restaurante source identity documented | PASS | table above |
| Analytics helpers/constants documented | PASS | REST1 pipeline |
| Seller analytics route/status inspected | PASS | API + dashboard inventory |
| Fake/broken CTA risks documented | PASS | social was missing; preview engagement |
| No files edited during Gate A except audit notes | PASS | inventory-only phase |

## Gate B — public CTA tracking truth

| CTA | Status | Event / action evidence |
| --- | ------ | ----------------------- |
| Me gusta | PASS | `LeonixLikeButton` + `restaurantesGlobalLikeRecorder` |
| Guardar | PASS | `LeonixSaveButton` + `restaurantesGlobalSaveRecorder` (real product) |
| Compartir | PASS | `LeonixShareButton` + `restaurantesGlobalShareRecorder` |
| Reportar | LOCKED | Not visible on public Restaurante detail (no fake drawer) |
| Llamar | PASS | `tel:` + `phone_click` |
| WhatsApp | PASS | wa.me + `whatsapp_click` |
| Correo | PASS | mailto/sheet + `email_click` |
| Sitio web | PASS | `website_click` |
| Menú | FIXED | `cta_click` + `menu_click` metadata |
| Pedir ahora | FIXED | `cta_click` + `order_click` metadata |
| Reservar | FIXED | `cta_click` + `reserve_click` metadata |
| Cómo llegar | PASS | maps + `directions_click` |
| Google/Yelp | FIXED | `cta_click` + `review_click` + `provider` |
| Social icons | FIXED | `cta_click` + `social_click` + `platform` |
| Catering/Event quote | FIXED | stack `<a>` + `catering_quote_click` |
| Message/SMS | PASS | `message_click` when SMS button visible |

Preview without published UUID: contact CTAs skip writes; hero engagement inert — PASS.

## Gate C — seller analytics truth

| Item | Status | Evidence |
| ---- | ------ | -------- |
| Owner-safe lookup inspected | PASS | `ownerEngagementListingKeys.ts` + `resolveListingAnalyticsIdentity` |
| Dashboard card inspected | PASS | `mis-anuncios` restaurant section — no inline fake stats |
| Seller detail/analytics inspected | BLOCKED | `mis-anuncios/[id]` only queries `listings` table |
| Real metrics source identified | PASS | `listing_analytics` via `/api/dashboard/analytics/summary` |
| Fake metrics removed/hidden | PASS | no fake counters added; pills hide zero engagement |
| Views/unique views | PASS | `listing_view` rollup when table exists |
| Likes | PASS | `listing_like` / `listing_unlike` |
| Shares | PASS | `listing_share` |
| Contact clicks | PASS | phone/whatsapp/email/message + cta/website/directions in `contact_clicks` |
| Website/menu/order/reservation/directions | PASS | roll into `ctaClicks` / typed buckets |
| No fake dashboard promises | PASS | degraded state documented in workspace |

## Reportar status

**LOCKED** — No public Reportar control on Restaurante detail. No Restaurante report API wired (would need product gate + schema review like En Venta `/api/clasificados/en-venta/report`).

## Like/save status

**PASS** — Real engagement via Leonix buttons + global analytics pipeline. Preview/draft without `listingSourceId` disables persistence (no polluted events).

## Dashboard status

- **`/dashboard/mis-anuncios`:** Restaurant cards link to analytics; no fabricated view counts on cards — PASS
- **`/dashboard/restaurantes`:** Uses account-wide summary totals with restaurant-specific title — **BLOCKED** (page outside allowed edit paths; use `restaurantesSellerAnalytics.ts` + `by_category.restaurantes` in next gate)
- **`/dashboard/mis-anuncios/[id]`:** Does not resolve `restaurantes_public_listings` — **BLOCKED** for per-listing workspace

## Data / source identity result

**PASS** — Writes use `source_table=restaurantes_public_listings`, `source_id=<UUID>`, `category=restaurantes`, Leonix ID as `canonical_ad_id` only.

## Intentionally not touched

- Restaurante form / publish / draft / media upload / video URL behavior
- Comida Local, En Venta, other categories
- Supabase migrations, `app/api/**` (existing pipeline only)
- Unrelated dirty dashboard / Ofertas Locales files
- Visual layout / Business Hub polish from REST-POLISH1/2

## BLOCKED items

1. **Public Reportar** — needs Restaurante report API + UI product decision (separate gate)
2. **`/dashboard/restaurantes` summary scope** — title implies restaurant-only but fetch uses account totals; fix in `REST-ANALYTICS2` using `by_category.restaurantes`
3. **`/dashboard/mis-anuncios/[id]` for Restaurante** — extend owner workspace query (forbidden dirty file this gate)

## Risks / deferred work

- Per-CTA seller breakdown (menu vs order vs social) requires dashboard UI reading `metadata.cta` — deferred
- `RestauranteDetailShell.tsx` legacy shell still has interactive CTAs without `listingSourceId` if ever re-enabled for public
- Messages metric on dashboard links to `/dashboard/mensajes` though Restaurante has no listing inbox — seller sees zero (truthful)

## Manual QA checklist

- [ ] Open published `/clasificados/restaurantes/[slug]` — network shows `listing_view` once
- [ ] Tap Llamar / WhatsApp / email — `phone_click` / `whatsapp_click` / `email_click`
- [ ] Tap Menú / Order / Reserve — `cta_click` with correct `metadata.cta`
- [ ] Tap Google/Yelp review buttons — `cta_click` + `provider`
- [ ] Tap social chips — `cta_click` + `platform`
- [ ] Like / save / share on published listing — authed events
- [ ] Preview form session — hero buttons show preview inert state, no analytics POST
- [ ] Seller `/dashboard/mis-anuncios` — restaurant card has no fake stats
- [ ] `npm run restaurantes:analytics1-audit` PASS
- [ ] `npm run build` PASS

## PASS / FIXED / LOCKED / BLOCKED summary tables

### Gate A

| Item | Status |
| ---- | ------ |
| En Venta reference | PASS |
| CTA inventory | PASS |
| Source identity | PASS |
| Helpers documented | PASS |
| Seller routes inspected | PASS |
| Fake risks documented | PASS |
| No gate-A edits | PASS |

### Gate B

| CTA | Status |
| --- | ------ |
| Like/Save/Share | PASS |
| Reportar | LOCKED |
| Contact CTAs | PASS |
| Menu/Order/Reserve | FIXED |
| Reviews/Social | FIXED |
| Catering quote | FIXED |
| Preview guard | FIXED |

### Gate C

| Item | Status |
| ---- | ------ |
| Owner keys in global pipeline | PASS |
| Mis-anuncios cards truthful | PASS |
| Per-listing workspace | BLOCKED |
| Dashboard/restaurantes scope label | BLOCKED |
| No fake metrics introduced | PASS |

## Next recommended gate

**REST-ANALYTICS2** — Wire `by_category.restaurantes` into `/dashboard/restaurantes`, extend `mis-anuncios/[id]` owner lookup for `restaurantes_public_listings`, optional Reportar flow parity with En Venta.
