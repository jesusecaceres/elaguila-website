# Gate FOOD-L8A — Comida Local Real Analytics Event Tracking

## Gate type

BUILD-REQUIRED

## 1. Gate title

Gate FOOD-L8A — Comida Local Real Analytics Event Tracking

## 2. Preflight status

Unrelated parallel dirty files present (BR/autos audits) — not modified. Gate-scoped edits only.

## 3. Files inspected (read-only)

- `app/api/analytics/events/route.ts`
- `app/lib/analytics/client/recordAnalyticsEvent.ts`
- `app/lib/analytics/server/validateAnalyticsEvent.ts`
- `app/lib/analytics/server/resolveListingAnalyticsIdentity.ts`
- `app/lib/analytics/listingAnalyticsIdentity.ts`
- `app/lib/listingAnalyticsEventTypes.ts`
- `app/(site)/clasificados/restaurantes/lib/recordRestaurantesGlobalAnalytics.ts`
- Comida Local public card, detail, preview, contact components
- Prior FOOD-L5B/L6/L7/L5D audits

## 4. Files changed

- `comidaLocalAnalytics.ts` (new)
- `comidaLocalPublicTypes.ts` — card/detail ids for tracking
- `mapComidaLocalPublicListing.ts` — `leonixAdId` on card; `id` on detail VM
- `ComidaLocalListingCard.tsx` — client + card/contact click tracking
- `ComidaLocalContactActions.tsx` — optional `analyticsContext`
- `ComidaLocalDetailShell.tsx` — passes analytics context to contact actions
- `ComidaLocalPublicDetailClient.tsx` (new) — `profile_view` once per session
- `[slug]/page.tsx` — uses public detail client
- `app/lib/analytics/listingAnalyticsIdentity.ts` — `comida_local_public_listings` + category
- `app/lib/analytics/server/resolveListingAnalyticsIdentity.ts` — resolver + published guard
- `COMIDA_LOCAL_FOOD_L8A_ANALYTICS_EVENTS_AUDIT.md`
- `scripts/comida-local-food-l8a-analytics-events-audit.ts`
- `package.json` — audit script

## 5. Existing analytics pattern findings

| Finding | Detail |
|---------|--------|
| Backend | **Real** — `POST /api/analytics/events` → `listing_analytics` table |
| Client helper | `recordAnalyticsEvent` (fire-and-forget) |
| Identity | Server resolves `owner_user_id` via `resolveListingAnalyticsIdentity` |
| Dedupe | `findRecentDuplicateAnalyticsEvent` on API |
| Category pattern | Restaurantes REST1: category-specific wrapper → global API |
| Comida gap | `comida_local_public_listings` not in source allowlist before this gate |

**Shared analytics change (documented):** Added `comida_local_public_listings` to `LISTING_ANALYTICS_SOURCE_TABLES`, slug-primary set, and resolver case with `status = published` guard. Category-agnostic extension; no other category behavior changed.

## 6. Event type result

Allowlisted semantic types in `COMIDA_LOCAL_ANALYTICS_EVENT_TYPES`, mapped to global `listing_analytics.event_type` (e.g. `call_click` → `phone_click`, social → `outbound_click`).

## 7. Tracking wrapper result

`trackComidaLocalListingEvent` — requires `listingId`, sets `category: comida-local`, `source_table: comida_local_public_listings`, optional `canonical_ad_id` (Leonix), `event_source`, safe metadata (`comida_event_type`, `page_path`, `slug`). No `owner_user_id` from client.

## 8. Results card tracking result

`ComidaLocalListingCard` tracks `result_card_click`, `call_click`, `whatsapp_click` on real card rows with `card.id`.

## 9. Public detail tracking result

`ComidaLocalPublicDetailClient` fires `profile_view` once per listing per session via `trackComidaLocalProfileViewOnce`.

## 10. Contact action tracking result

`ComidaLocalContactActions` tracks contact/social/location clicks when `analyticsContext` is provided; preview omits context → no events.

## 11. Backend/API result

Events POST to `/api/analytics/events`; resolver loads published row from `comida_local_public_listings`; owner derived server-side.

## 12. Preview exclusion result

Preview route uses `ComidaLocalDetailShell` without `analyticsContext`; no `trackComidaLocal*` imports in preview client.

## 13. Privacy/no-sensitive-metadata result

Metadata blocklist strips phone/email/owner fields; contact values not sent; only action ids and slug.

## 14. What is intentionally not implemented

- Dashboard/admin analytics display (FOOD-L8B)
- Public view counters or badges
- localStorage-as-truth metrics
- Likes/saves/shares
- Preview/draft tracking
- Stripe/payment analytics

## 15. Risks/deferred work

- FOOD-L8B: owner dashboard analytics rollup for Comida Local
- Extend `ownerEngagementListingKeys` for Comida keys (optional)
- Server-side profile_view dedupe already on API; client also guards per session

## 16. Manual QA checklist

- [ ] Open `/clasificados/comida-local` — click Ver ficha → network POST `/api/analytics/events` with `result_card_click`
- [ ] Click Llamar/WhatsApp on card → `phone_click` / `whatsapp_click`
- [ ] Open public detail `/clasificados/comida-local/{slug}` → one `profile_view`
- [ ] Click contact CTAs on detail → mapped global events
- [ ] Open `/clasificados/comida-local/preview` — no analytics POSTs
- [ ] No visible counters on UI
- [ ] Failed analytics does not block navigation

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| ------------------------------------------------------------------- | ---------- | -------- |
| Repo state was inspected before edits | TRUE | Preflight + component inventory |
| Existing analytics patterns were inspected read-only | TRUE | Global API + Restaurantes pattern |
| Real analytics backend/API exists or blocker was documented | TRUE | `/api/analytics/events` |
| Comida Local event types are allowlisted | TRUE | `COMIDA_LOCAL_ANALYTICS_EVENT_TYPES` |
| Tracking wrapper exists or safe existing wrapper is reused | TRUE | `trackComidaLocalListingEvent` |
| Results card tracks real card/detail clicks | TRUE | `result_card_click` on Ver ficha |
| Results card tracks real contact clicks where present | TRUE | call + WhatsApp handlers |
| Public detail tracks profile_view only for public published listing | TRUE | `ComidaLocalPublicDetailClient` |
| Public detail tracks contact/social/location clicks where present | TRUE | `ComidaLocalContactActions` |
| Preview route is not tracked as real listing analytics | TRUE | No analyticsContext in preview |
| LocalStorage draft preview is not tracked | TRUE | Preview client grep |
| Events include real listing id | TRUE | `source_id: listingId` |
| Events include leonix_ad_id when available | TRUE | `canonical_ad_id` |
| Events use category/listing type comida-local | TRUE | `COMIDA_LOCAL_ANALYTICS_CATEGORY` |
| No owner_user_id is trusted from client | TRUE | Server resolver only |
| No phone/email/private contact value is sent as analytics metadata | TRUE | Metadata blocklist |
| Tracking failures do not block navigation/contact actions | TRUE | fire-and-forget `.catch` |
| No fake counters were added | TRUE | No metric UI |
| No fake analytics numbers were added | TRUE | No display |
| No dashboard/admin analytics display was added | TRUE | Firewall |
| No Stripe/payment files were edited | TRUE | Firewall |
| No database migrations were created | TRUE | No migrations |
| No unrelated category files were edited | TRUE | Firewall |
| Audit script passed | TRUE | npm script |
| npm run build passed | TRUE | npm run build |
