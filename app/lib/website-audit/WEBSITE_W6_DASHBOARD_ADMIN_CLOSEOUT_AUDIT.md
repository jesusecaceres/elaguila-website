# W6 — Dashboard / Admin Closeout Audit

**Audit date:** 2026-05-27  
**References:** W1–W5 audits, C5A, C6 Stripe readiness contract  
**Scope:** Close remaining dashboard/admin gaps from W4/W5 with minimal, contract-safe fixes. No Stripe, no fake analytics or package claims, no UI redesign.

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Code proves real, safe behavior |
| FALSE | Fake counts, unsafe ownership, or missing without honest deferral |
| DEFERRED_INTENTIONAL | Honestly empty, labeled mock, or bounded deferral |
| NOT_APPLICABLE | Out of scope |

---

## 1. Main audit table

| Area | Route/file | Required behavior | Current implementation | Fix applied | User impact | Admin impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Admin list counts | `/admin/usuarios` | Listing + entitlement counts when safe | `fetchAdminUserListCountsBatch` (≤80 rows); columns Anuncios / Activos / Paquetes; `—` on failure | W6 batch rollup | N/A | At-a-glance inventory | TRUE | >80 rows: notice, no counts |
| Admin detail entitlements | `/admin/usuarios/[id]` | Inline entitlement summary | `fetchAdminUserEntitlementRollup` on all command-center listing IDs | W6 | N/A | Active/scheduled/expired/revoked/unattached | TRUE | Link to package tracker |
| Admin detail analytics | `/admin/usuarios/[id]` | Real rollup or honest empty | `fetchAdminUserAnalyticsRollup` → `fetchOwnerAnalyticsTotals` (service role) | W6 | N/A | Views, saves, messages, CTA, leads | TRUE | Degraded banner when table missing |
| Admin command center Viajes | `adminUserAds.ts` | Owner Viajes inventory | `loadViajes` from `viajes_staged_listings` + `normalizeViajesStagedListingForAdmin` | W6 | N/A | 12th category in user detail | TRUE | Staged table; public URL when approved+public |
| User dashboard owner guard | `mis-anuncios/[id]/page.tsx` | Deny wrong/missing owner | `listing.owner_id !== user.id` | W5 (verified W6) | No orphan listing access | N/A | TRUE | |
| En Venta Destacado badge | `mis-anuncios/page.tsx` | Entitlement-backed | Was `leonixPromotedFromDetailPairs`; now entitlement API includes `en-venta` in lookup | W6 | Destacado only with active entitlement | N/A | TRUE | C6 aligned |
| Restaurantes Destacado | `dashboard/restaurantes/page.tsx` | Entitlement-backed | Was `row.promoted`; now `fetchDashboardListingPackageEntitlementBadges` | W6 | Honest Destacado on cards + stat | N/A | TRUE | Raw `promoted` column not used for badge |
| Package payment honesty | Admin + API | No fake paid | `payment_status: null` on manual create; tracker banner unchanged | — | N/A | No Stripe claims | TRUE | C6 preserved |
| Stripe implementation | — | Not in W6 | Not implemented | — | N/A | N/A | NOT_APPLICABLE | |

---

## 2. Category command center matrix

| Category | User dashboard visible | Admin command center visible | Owner traceable | Leonix Ad ID | Public URL | Package visible | Analytics visible | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Autos | `mis-anuncios` + autos section | `adminUserAds` autos group | `owner_user_id` | Column when present | Yes | Entitlement API on mis-anuncios | Per-listing on mis-anuncios | TRUE | |
| Bienes Raíces | `mis-anuncios` | generic `listings` group | `owner_id` | Yes | Yes | Entitlement API | Per-listing | TRUE | |
| En Venta | `mis-anuncios` | generic group | `owner_id` | Yes | Yes | Entitlement API (W6) | Per-listing | TRUE | |
| Empleos | `mis-anuncios` + empleos page | empleos group | `owner_user_id` | Yes | Yes | No Destacado chip (honest) | Section analytics | TRUE | |
| Rentas | `mis-anuncios` | generic group | `owner_id` | Yes | Yes | Entitlement API | Per-listing | TRUE | |
| Servicios | `mis-anuncios` + servicios page | servicios group | `owner_user_id` | Yes | Yes | Entitlement API | Per-listing | TRUE | |
| Restaurantes | `restaurantes` page | restaurantes group | `owner_user_id` | Yes | Yes | Entitlement API (W6 on page) | Page rollup | TRUE | |
| Clases | `mis-anuncios` | generic group | `owner_id` | formatLeonixAdId | Yes | Plan label | Per-listing | TRUE | |
| Comunidad | `mis-anuncios` | generic group | `owner_id` | Yes | Yes | Plan label | Per-listing | TRUE | |
| Mascotas y Perdidos | `mis-anuncios` (all filter) | generic group | `owner_id` | Yes | Yes | Plan label | Per-listing | TRUE | Admin queue page W5 |
| Busco | `mis-anuncios` | generic group | `owner_id` | Yes | Yes | Plan label | Per-listing | TRUE | |
| Viajes | `dashboard/viajes` | **viajes group (W6)** | `owner_user_id` | When approved | When live | DEFERRED on user badges | Owner rollup in admin detail | TRUE | Staged lifecycle |

---

## 3. Entitlement / admin rollup matrix

| Rollup | Surface | Source of truth | Active only? | Handles missing data safely | Status | Notes |
|---|---|---|---|---|---|---|
| List row package count | `/admin/usuarios` | `listing_package_entitlements` + `effectiveEntitlementStatus` | Active count only | `—` if batch fails | TRUE | Bounded to 80 users |
| Detail entitlement summary | `/admin/usuarios/[id]` | Same table, listing IDs from command center | Effective status buckets | Unavailable message | TRUE | |
| User Destacado badge | `mis-anuncios`, `restaurantes` | POST `/api/dashboard/listing-package-entitlements` | `grantsDestacado` from active entitlement | Empty badges if API fails | TRUE | No detail_pairs / promoted column |
| Admin manual create | package-entitlements actions | DB insert | `initialStatus` + dates | payment fields null | TRUE | |

---

## 4. Analytics rollup matrix

| Rollup | Surface | Source | Honest empty | Status | Notes |
|---|---|---|---|---|---|
| Admin user detail | `/admin/usuarios/[id]` | `listing_analytics` via `collectOwnerListingKeysForAnalytics` | Zeros + unavailable copy | TRUE | Service role read |
| User dashboard page | `/dashboard/analytics` | Same pipeline (W4) | Degraded notice | TRUE | Unchanged W6 |
| Viajes admin ROI | `AdminViajesAnalyticsPlaceholders` | Labeled mock | DEFERRED_INTENTIONAL | Not production metrics |

---

## W6 blockers before launch

**No FALSE blockers remain** after W6 fixes.

### Deferred (not launch blockers)

| Area | Route/file | Issue | User impact | Admin impact | Package/payment | Recommended fix | W6/W7 |
|---|---|---|---|---|---|---|---|
| Admin list counts | `/admin/usuarios` | No counts when >80 rows shown | N/A | Manual ops search | N/A | Server-side aggregate view or pagination | W7 |
| Viajes Destacado on user dashboard | `mis-anuncios` viajes section | No entitlement Destacado chip | Honest absence | N/A | Extend lookup when travel entitlements exist | W7 |
| Per-listing admin analytics | Category queues | No inline event breakdown | N/A | Use user detail rollup | N/A | Optional listing drill-down | W7 |

---

## Completion checklist

1. Admin counts verified/added — **Yes** (≤80 rows)
2. Admin user/client detail rollups verified/added — **Yes** (entitlements + analytics)
3. Viajes command center status — **Included in `fetchAdminUserAdsForUser`**
4. Category command center matrix — **12/12 TRUE**
5. Entitlement/package rollups verified — **Yes**
6. Analytics rollups verified — **Yes** (admin detail; viajes mock deferred)
7. User dashboard badge truth fixed/verified — **En venta + restaurantes**
8. Remaining blockers — **0 FALSE** (see deferred table)
9. Files changed — see below
10. **`npm run build`** — **Passed** (exit 0)

### Files changed in W6

- `app/admin/_lib/adminUserRollups.ts` (new)
- `app/admin/_lib/adminUserAds.ts` (Viajes loader)
- `app/admin/_lib/adminAdIdentity.ts` (viajes normalizer)
- `app/admin/_lib/adminAdEditSupportMap.ts` (viajes support)
- `app/admin/(dashboard)/usuarios/page.tsx` (count columns)
- `app/admin/(dashboard)/usuarios/[id]/page.tsx` (rollup cards)
- `app/(site)/dashboard/mis-anuncios/page.tsx` (en-venta entitlement badge)
- `app/(site)/dashboard/restaurantes/page.tsx` (entitlement-backed Destacado)
- `app/lib/ownerEngagementListingKeys.ts` (viajes in inventory count)
- `app/lib/website-audit/WEBSITE_W6_DASHBOARD_ADMIN_CLOSEOUT_AUDIT.md` (this document)
