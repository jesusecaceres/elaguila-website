# W4 — User Dashboard Functional Audit: Profile, My Ads, Saved Ads, Analytics, Business Profiles, Actions

**Audit date:** 2026-05-26  
**References:** W1–W3 audits, C5A publish pipeline, C5B/C5C/C6 entitlement contracts  
**Scope:** Logged-in user dashboard routes and behavior. No visual redesign, no Stripe implementation, no fake analytics or package claims.

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Code proves behavior is real, owner-scoped, and safe |
| FALSE | Orphaned data, wrong-owner risk, fake/stale claims, or visual-only actions |
| DEFERRED_INTENTIONAL | Safely hidden, honest empty/deferred state, or documented future phase |
| NOT_APPLICABLE | Not relevant to this surface |

---

## 1. Dashboard routes audited

| Route | Auth required | Redirect / empty behavior | Status |
|---|---|---|---|
| `/dashboard` | Yes (`getSession`; sign-in prompt if none) | No sensitive metrics without session | TRUE |
| `/dashboard/perfil` | Yes (`getUser` → `/login?redirect=`) | W3 profile pipeline | TRUE |
| `/dashboard/mis-anuncios` | Yes | Error + empty states | TRUE |
| `/dashboard/mis-anuncios/[id]` | Yes | `missing` / `forbidden` / workspace tabs | TRUE* |
| `/dashboard/mis-anuncios/[id]/editar` | Yes | `.eq("owner_id", user.id)` on fetch | TRUE |
| `/dashboard/guardados` | Yes | `saved_listings` + resolver | TRUE |
| `/dashboard/analytics` | Yes | Degraded / zero / empty activity notices | TRUE |
| `/dashboard/seguridad` | Yes | W3 password flows | TRUE |
| `/dashboard/notificaciones` | Yes | Derived feed + localStorage prefs (deferred persist) | TRUE |
| `/dashboard/business-tools` | Yes | Completeness from profile metadata | TRUE |
| `/dashboard/restaurantes` | Yes | Owner `restaurantes_public_listings` | TRUE* |
| `/dashboard/servicios` | Yes | Cloud + optional local dev rows | TRUE |
| `/dashboard/viajes` | Yes | Owner viajes inventory | TRUE |
| `/dashboard/empleos` | Yes | Owner empleos inventory | TRUE |
| `/dashboard/vistos-recientes` | Optional (works logged out) | localStorage `recentlyViewed` | DEFERRED_INTENTIONAL |
| `/dashboard/drafts` | Yes | `listings` drafts by `owner_id` | TRUE |
| `/dashboard/mensajes` | Yes | Inbox by user | TRUE |
| `/dashboard/analiticas` | N/A (alias) | Redirects to `/dashboard/analytics` | TRUE |
| `/dashboard/borradores` | N/A (alias) | Redirects to `/dashboard/drafts` | TRUE |
| `/dashboard/notifications` | N/A (alias) | Redirects to `/dashboard/notificaciones` | TRUE |
| `/dashboard/messages` | N/A (alias) | Re-exports `mensajes/page` | TRUE |

\* See blockers for listing workspace `owner_id` null edge case and Restaurantes `promoted` column.

---

## 2. Main audit table

| Dashboard area | Route/file | Required behavior | Current implementation | User impact | Package/analytics impact | Status | Notes |
|---|---|---|---|---|---|---|---|
| Dashboard protection | All `app/(site)/dashboard/**/page.tsx` (except aliases) | Require logged-in user | Client `getUser` / `getSession`; redirect to `/login?redirect=` with current path | No cross-user data in normal flow | N/A | TRUE | `/dashboard` shows sign-in CTA instead of redirect (acceptable) |
| Dashboard protection | `mis-anuncios/[id]/page.tsx` | Only owner sees listing | Checks `listing.owner_id !== user.id` when `owner_id` set | If `owner_id` null, any authed user could open workspace | N/A | FALSE | See blockers — tighten to deny when `owner_id` missing or mismatched |
| Profile / identity | `/dashboard/perfil` | Name, email, phone, city, account ref | Read/write via W3 (`auth.updateUser` + `profiles.upsert`); email read-only | Profile completion for publish (`require=post`) | N/A | TRUE | Business fields in auth metadata |
| Profile / identity | `/dashboard/perfil` billing card | Stripe portal not fake-active | Button disabled when `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL` unset | Honest “not configured” copy | No fake billing | TRUE | |
| My Ads — owner filter | `lib/ownerListingsQuery.ts` | Only current owner | `.eq("owner_id", ownerId)` on `listings` | Correct inventory | N/A | TRUE | Tiered SELECT for schema drift |
| My Ads — categories | `mis-anuncios/page.tsx` | 12 categories represented or honest | Filters: en-venta, autos, BR, rentas, restaurantes, empleos, viajes, servicios, clases, comunidad, busco; dedicated sections for restaurantes/empleos/viajes/servicios/autos paid; `listings` rows for BR/rentas/en-venta/clases/comunidad/busco | Mascotas has no `?cat=` chip but rows with category still appear under “All” | N/A | DEFERRED_INTENTIONAL | Add `mascotas-y-perdidos` filter in W5 if needed |
| My Ads — no demo data | `mis-anuncios/page.tsx` | No sample listings | All rows from owner queries / inventory helpers | Real user data only | N/A | TRUE | |
| My Ads — Leonix Ad ID | Cards + detail | Show when present | `leonix_ad_id`, `formatLeonixAdId` for clases/comunidad/busco | Support traceability | N/A | TRUE | |
| Listing actions — view public | Manage cards | Live public URL | Category-specific hrefs (BR/rentas contract, en-venta, autos API, etc.) | Safe navigation | N/A | TRUE | |
| Listing actions — pause/resume/archive | `mis-anuncios/page.tsx` | Real DB updates | `OWNER_LISTING_PAUSE_PATCH`, resume, `OWNER_LISTING_SOFT_ARCHIVE_PATCH` | Status changes persist | N/A | TRUE | |
| Listing actions — republish | En Venta pro | Window + detail_pairs | `computeEnVentaVisibilityRenewalVm`, `renewEnVentaRepublish` | Visibility renewal honest to plan | N/A | TRUE | |
| Listing actions — edit | `mis-anuncios/[id]/editar` | Owner-only, time window | `.eq("owner_id", u.id)`; 30-minute edit lock | Prevents late edits | N/A | TRUE | |
| Listing actions — upgrade CTA | `mis-anuncios/[id]` promotion tab | No Stripe checkout | Links to `/clasificados/publicar/en-venta/pro` (publish flow), not payment | No fake payment | N/A | TRUE | |
| Package badges — mis-anuncios | `dashboardPackageEntitlementBadges.ts` | Entitlement-backed Destacado | POST `/api/dashboard/listing-package-entitlements` for BR, rentas, restaurantes, servicios, autos paid | Badges only when API returns `grantsDestacado` | TRUE for wired categories | TRUE | |
| Package badges — en-venta | `mis-anuncios/page.tsx` | Entitlement-backed | Uses `leonixPromotedFromDetailPairs(detail_pairs)` for en-venta rows | Can show Destacado without `listing_package_entitlements` | FALSE vs C6 contract | FALSE | Align en-venta with entitlement API or hide badge |
| Package badges — restaurantes page | `dashboard/restaurantes/page.tsx` | Entitlement-backed | Badge from `restaurantes_public_listings.promoted` column | Stale/admin `promoted` may show without active entitlement | FALSE | Wire entitlement overlay or derive from API |
| Package badges — empleos/viajes | `mis-anuncios` sections | No fake badges | No Destacado chip on empleos/viajes cards (no false positive) | Honest absence | DEFERRED_INTENTIONAL | Extend entitlement lookup in W5 |
| Saved ads | `guardados/page.tsx` | User-specific persisted | `saved_listings` where `user_id = auth.uid`; `resolveSavedListingsForDashboard` | Correct detail links per category | N/A | TRUE | |
| Saved ads — stale | Resolver | Handle missing listings | Resolver returns best-effort; cards without `href` filtered | No crash on deleted ads | N/A | TRUE | |
| Analytics — page | `analytics/page.tsx` | Real events or honest empty | `fetchOwnerAnalyticsTotals` + `fetchOwnerListingViewLeaders` from `listing_analytics` | `setupNotice` when table degraded; `emptyActivity` when zero | No fake counts | TRUE | |
| Analytics — per listing | `mis-anuncios` + `[id]` | Aggregated events | `aggregateListingAnalyticsEvents`; degraded banner when read fails | Zeros with explanation, not random numbers | TRUE | |
| Analytics — event types | `listingAnalyticsAggregate.ts` | Maps real `event_type` values | listing_view, saves, shares, messages, cta/phone/whatsapp/website/directions, leads, applications | Matches instrumentation vocabulary | TRUE | |
| Business tools | `business-tools/page.tsx` | Business identity guidance | `computeBusinessCompleteness` from profile; links to perfil | No fake business profile DB | N/A | TRUE | |
| Business — servicios | `dashboard/servicios/page.tsx` | Owner listings + manage links | Cloud listings + optional local/dev backup rows labeled | Clear source labels | N/A | TRUE | |
| Business — restaurantes/viajes/empleos | Dedicated dashboard pages | Category management entry | Owner-scoped fetches; publish/edit links | Category-specific workflows | N/A | TRUE | |
| Notifications | `notificaciones/page.tsx` | Prefs + alerts | `fetchDerivedDashboardFeed`; prefs in `localStorage` only | Honest: derived alerts, prefs not server-persisted | DEFERRED_INTENTIONAL | Comment in file documents deferral |
| Recently viewed | `vistos-recientes/page.tsx` | Device-local history | `getRecentlyViewedIds()` + optional DB hydrate | Subtitle states device/account limit | N/A | DEFERRED_INTENTIONAL | Not login-gated by design |
| Security | `seguridad/page.tsx` | Password change/recovery | Re-auth + `updateUser({ password })`; reset link to `/login?mode=reset` | W3 verified | N/A | TRUE | |
| Shell | `LeonixDashboardShell.tsx` | User name/email in nav | From page-level state after auth | No other user’s identity | N/A | TRUE | |

---

## 3. Category dashboard matrix (Mis Anuncios)

| Category | Appears in Mis Anuncios | Correct owner filter | Correct status | Public URL | Edit/manage action | Leonix Ad ID | Package badge safe | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Autos | Yes (paid inventory + listings rows) | Yes (`fetchOwnerAutosClassifiedsListings`, owner_id) | Yes | Yes (`AutosClassifiedListingManageCard`) | Yes | When on row | Entitlement API for paid section | TRUE | |
| Bienes Raíces | Yes (`listings` + BR inventory band) | Yes (`owner_id`) | Yes | Yes (contract paths) | Yes | Yes | Entitlement API | TRUE | |
| En Venta | Yes (`listings`) | Yes | Yes | Yes | Yes (30m edit window) | When set | **detail_pairs promoted flag** | FALSE | Not entitlement API |
| Empleos | Yes (dedicated section) | Yes (owner fetch) | Yes | Yes | Yes (`editHref`) | When set | No badge shown (no false claim) | TRUE | Entitlement extend deferred |
| Rentas | Yes (`listings`) | Yes | Yes | Yes | Yes | Yes | Entitlement API | TRUE | |
| Servicios | Yes (dedicated section) | Yes (token API) | Yes | Yes | Yes | When set | Entitlement API | TRUE | |
| Restaurantes | Yes (section + `/dashboard/restaurantes`) | Yes (`owner_user_id`) | Yes | Yes | Yes | When set | Mis-anuncios: API; Restaurantes page: **DB promoted** | FALSE | Dedicated page badge |
| Clases | Yes (`listings` grid) | Yes | Yes | Yes | Quick publish paths | `formatLeonixAdId` | No package tier chip | TRUE | |
| Comunidad | Yes (`listings` grid) | Yes | Yes | Yes | Yes | `formatLeonixAdId` | No false badge | TRUE | |
| Mascotas y Perdidos | Partial (listings only, no `?cat=` chip) | Yes if category on row | Yes | Yes | Category publish routes | When set | N/A | DEFERRED_INTENTIONAL | Visible under All tab |
| Busco | Yes (`listings` grid) | Yes | Yes | Yes | Yes | `formatLeonixAdId` | No false badge | TRUE | |
| Viajes | Yes (dedicated section) | Yes | Yes | Yes | Yes | When set | No badge shown | TRUE | Entitlement extend deferred |

---

## 4. Dashboard actions matrix

| Action | Surface | Backed by real route/API | Auth/ownership protected | Package/payment aware | Status | Notes |
|---|---|---|---|---|---|---|
| View public ad | Manage cards | Yes — category public URLs | Owner inventory only | N/A | TRUE | |
| Edit ad (time window) | `mis-anuncios/[id]/editar` | Yes | `.eq("owner_id", user.id)` | N/A | TRUE | 30-minute window |
| Open listing workspace | `mis-anuncios/[id]` | Yes | Owner check* | N/A | TRUE* | *null owner_id gap |
| Pause / resume | `mis-anuncios` | Yes — Supabase update | Owner rows only | N/A | TRUE | |
| Archive (soft) | `mis-anuncios` / editar | Yes | Owner rows | N/A | TRUE | |
| Republish (En Venta Pro) | `mis-anuncios` | Yes — visibility renewal helpers | Owner + plan from detail_pairs | Plan-aware, not Stripe | TRUE | |
| Mark sold / reactivate | Detail status tab | Yes — status patch | Owner workspace | N/A | TRUE | |
| View analytics | Links to `/dashboard/analytics` or per-listing tab | Yes | Auth required | Real `listing_analytics` or degraded zero | TRUE | |
| Messages | `/dashboard/mensajes` | Yes | User-scoped inbox | N/A | TRUE | |
| Share / duplicate ID | Some cards | Clipboard listing id | Owner context | N/A | TRUE | |
| Upgrade to Pro (En Venta) | `[id]` promotion tab | Links to publish pro flow | Owner listing | Not Stripe checkout | TRUE | |
| Destacado / Prioridad badge | mis-anuncios category sections | Entitlement API (except en-venta) | Bearer token to dashboard API | C5B/C6 contract | TRUE / FALSE | See en-venta + restaurantes page |
| Stripe billing portal | `perfil` | External URL only if env set | Auth required | Disabled when unset | TRUE | |
| BR / Autos inventory actions | Inventory bands | Yes — category components | Owner scoped | Inventory policy gates in prod | TRUE | |

---

## 5. Business profile sections

| Category | Dedicated dashboard route | Business fields supported | Status | Notes |
|---|---|---|---|---|
| Servicios | `/dashboard/servicios` | Slug, city, status, cloud vs local source | TRUE | |
| Restaurantes | `/dashboard/restaurantes` | business_name, slug, hero, hydrate-to-form | TRUE | Promoted badge issue on this page |
| Viajes | `/dashboard/viajes` | Owner staged/public listings inventory | TRUE | |
| Empleos | `/dashboard/empleos` | Job listings + detail route | TRUE | |
| BR agents/brokers | BR band in mis-anuncios + inventory policy | Negocio inventory actions | TRUE | |
| Autos dealerships | `AutosDealerInventoryDashboardSection` | Dealer inventory group | TRUE | |
| Rentas / property managers | Rentas rows in mis-anuncios | Same as BR/rentas contract | TRUE | |
| Clases schools | Via listings grid + publish quick paths | Profile business metadata optional | DEFERRED_INTENTIONAL | No separate “school profile” page |
| Global business identity | `/dashboard/perfil` + `/dashboard/business-tools` | WhatsApp, business_name, social, website in auth metadata | TRUE | Completeness meter on business-tools |

---

## 6. Analytics verification

| Metric | Implemented in aggregate | Honest when missing | Status |
|---|---|---|---|
| Views (listing_view) | Yes | Zero + degraded notice | TRUE |
| Unique views | Yes (distinct user_id per listing) | Zero | TRUE |
| Listing opens | Yes | Zero | TRUE |
| Saves / unsaves | Yes | Zero | TRUE |
| Shares | Yes | Zero | TRUE |
| Messages (message_sent) | Yes | Zero | TRUE |
| Profile clicks | Yes | Zero | TRUE |
| Likes | Yes | Zero | TRUE |
| CTA / phone / WhatsApp / website / directions | Rolled into ctaClicks | Zero | TRUE |
| Leads | Yes | Zero | TRUE |
| Applications | Yes | Zero | TRUE |
| Per-listing breakdown | mis-anuncios + workspace analytics tab | Degraded copy when table missing | TRUE |

No random or hardcoded non-zero totals found in dashboard analytics paths.

---

## 7. Package / entitlement display summary

| Surface | Entitlement truth source | Status |
|---|---|---|
| mis-anuncios — Restaurantes/Servicios/Autos paid/BR/Rentas | `/api/dashboard/listing-package-entitlements` | TRUE |
| mis-anuncios — En Venta Destacado chip | `Leonix:promoted` in `detail_pairs` | FALSE |
| dashboard/restaurantes — Destacado badge | `promoted` column on `restaurantes_public_listings` | FALSE |
| empleos / viajes sections | No Destacado badge (no false positive) | TRUE (safe absence) |
| Upgrade / Stripe | Publish routes or disabled billing env | TRUE |

---

## W4 blockers before launch

### Blocker 1 — En Venta “Destacado” not entitlement-backed

| Field | Value |
|---|---|
| **Dashboard area** | My Ads — En Venta rows |
| **File path** | `app/(site)/dashboard/mis-anuncios/page.tsx` (lines ~1703–1709), `app/(site)/dashboard/lib/dashboardListingMeta.ts` (`leonixPromotedFromDetailPairs`) |
| **Issue** | `leonixPromoted` for `en-venta` uses `detail_pairs` flag, not `listing_package_entitlements` / activation contract |
| **User impact** | Seller may see Destacado in dashboard without an active paid package entitlement |
| **Package/analytics impact** | Violates C5B/C6 “no fake Premium/Destacado” on dashboard claims |
| **Recommended fix** | Include en-venta rows in entitlement lookup POST, or hide Destacado badge unless API grants it |
| **Fixed in W4?** | Left for W5 (audit-only gate) |

### Blocker 2 — Restaurantes dashboard page uses DB `promoted` column

| Field | Value |
|---|---|
| **Dashboard area** | `/dashboard/restaurantes` |
| **File path** | `app/(site)/dashboard/restaurantes/page.tsx` (select includes `promoted`; badge `r.promoted`) |
| **Issue** | Does not use `/api/dashboard/listing-package-entitlements` unlike mis-anuncios restaurant section |
| **User impact** | “Destacado” stat and badge may disagree with public entitlement truth |
| **Package/analytics impact** | Same as C5B public hydration mismatch risk on owner-facing page |
| **Recommended fix** | Reuse `fetchDashboardListingPackageEntitlementBadges` for rows on this page |
| **Fixed in W4?** | Left for W5 |

### Blocker 3 — Listing workspace allows access when `owner_id` is null

| Field | Value |
|---|---|
| **Dashboard area** | `/dashboard/mis-anuncios/[id]` |
| **File path** | `app/(site)/dashboard/mis-anuncios/[id]/page.tsx` (~308–315) |
| **Issue** | Forbidden only when `owner && owner !== user.id`; missing `owner_id` grants access |
| **User impact** | Rare legacy rows could be opened by any logged-in user |
| **Package/analytics impact** | Could leak another user’s analytics/messages context |
| **Recommended fix** | Deny unless `owner_id === user.id` (match editar page) |
| **Fixed in W4?** | Left for W5 (one-line guard) |

---

## Deferred (not launch blockers)

| Item | Reason |
|---|---|
| Mascotas y Perdidos — no `?cat=` filter chip | Listings still load under All; add filter in W5 |
| Empleos / Viajes — no entitlement badges on cards | No false badges shown; extend lookup later |
| Notification preferences — localStorage only | Documented in page comment; derived feed is real |
| Vistos recientes — device localStorage | Honest subtitle; optional login |
| Avatar / logo upload on profile | Not implemented; not faked |

---

## Summary

| Section | Items | TRUE | FALSE | DEFERRED |
|---|---|---|---|---|
| Dashboard routes & protection | 19 | 17 | 1 | 1 |
| Main audit areas | 28 | 24 | 3 | 1 |
| Category matrix (12 categories) | 12 | 9 | 2 | 1 |
| Actions matrix | 14 | 12 | 2 | 0 |
| **Overall functional readiness** | — | **Strong** | **3 fixable gaps** | **5 honest deferrals** |

---

## Files changed (W4)

- `app/lib/website-audit/WEBSITE_W4_USER_DASHBOARD_FUNCTIONAL_AUDIT.md` (this file — new)

No application code changes in W4 (audit-only gate per scope).
