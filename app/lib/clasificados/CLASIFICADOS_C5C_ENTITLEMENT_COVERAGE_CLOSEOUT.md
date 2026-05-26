# Gate C5C — Entitlement Placement Coverage Closeout

**Audit date:** 2026-05-26  
**References:** C5A publish pipeline, C5B entitlement placement truth lock  
**Scope:** Wire remaining Print-to-Digital V1 categories to active `listing_package_entitlements` for public placement and dashboard claims. **No Stripe, no fake payment, no fake Premium inventory.**

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Entitlement hydration wired; behavior driven by active DB grants |
| FALSE | Benefit claimed without active entitlement backing |
| DEFERRED_INTENTIONAL | Cannot safely wire yet; UI hidden or honest-editorial; documented path forward |
| NOT_APPLICABLE | Category uses separate model or is not package-eligible |

---

## Coverage matrix

| Category/Surface | Entitlement hydrated | Premium behavior | Full Page behavior | Standard behavior | Dashboard claim | Admin source | Inventory add-on | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Servicios results + landing | Yes (server, C5B) | Active premium → Destacado band | Active full_page → priority sort | Print pool / organic | Badge from `/api/dashboard/listing-package-entitlements` | Admin grants + attach | N/A | TRUE | `isFeatured` alone no longer grants Destacado |
| Restaurantes results | Yes (server, C5B) | Active premium → `promoted: true` → Destacado band | Full_page → `promoted` via exposure policy | Standard | Badge from API | Admin grants | N/A | TRUE | Landing also hydrated (C5B) |
| Autos public results + landing | Yes (server API, C5C) | Active premium/full_page → `featured: true` in response | Same → featured dealer band (cap 4) | Standard grid | Badge from API (C5C) | Admin `promote_on` + entitlement | +10 vehicles: FALSE | TRUE | `featured` now set from either admin flag OR active entitlement |
| Rentas landing + results | Yes (server, C5C) | Active premium → `admin_promoted: true` → `"destacada"` badge | Not distinct from standard yet | Standard | Badge from API (C5B BR/Rentas lookup) | Admin `admin_promoted` + entitlement | N/A | TRUE | Both page.tsx and results/page.tsx use same hydrated loader |
| Bienes Raíces results + landing | No (client-side browser fetch) | Editorial `destacada` badge (quality/freshness) | Not applicable yet | Standard | Badge from API (C5B) | Admin grants `listings` source | BR +5 properties: FALSE | DEFERRED_INTENTIONAL | Browser Supabase cannot reach service-role entitlements table; needs public overlay API or server-side conversion |
| En Venta | N/A | Free/Pro republish model | Not print-package | Pro window / featured | Republish UI truthful | Admin | N/A | NOT_APPLICABLE | Separate ideology |
| Empleos | N/A | Separate model (premium lane) | Not print-package | Standard | Plan labels only | N/A | N/A | NOT_APPLICABLE | `SEPARATE_MODEL` in resolver |
| Viajes | N/A | Separate model (affiliate/partner) | Not print-package | Standard | Plan labels only | N/A | N/A | NOT_APPLICABLE | `SEPARATE_MODEL` in resolver |
| Clases / Comunidad | N/A | Deferred | Deferred | Organic only | Free plan labels | N/A | N/A | NOT_APPLICABLE | `NOT_CLIENT_READY` in resolver |
| Homepage (/) | No listings | N/A | N/A | N/A | N/A | N/A | N/A | NOT_APPLICABLE | Splash page only — redirects to /home |
| Clasificados hub (/clasificados) | No featured section | N/A | N/A | N/A | N/A | N/A | N/A | NOT_APPLICABLE | Category directory only — no premium band |
| Dashboard mis-anuncios | Yes (API, C5B+C5C) | Destacado badge if premium | Prioridad badge if full_page | No false claim | Entitlement-backed only | Admin truth | Slot counts real | TRUE | Now includes Autos in entitlement lookup |
| Dashboard BR inventory | No upgrade in prod | N/A | N/A | Base 3 enforced | No false upgrade claim | Metadata grant (future) | FALSE | TRUE | `isBrInventoryUpgradeActive()` false in prod |
| Dashboard Autos inventory | Slot counts from DB | N/A | N/A | 10-cap enforced | Mailto upgrade CTA only | Admin/checkout | FALSE | TRUE | No false "boost active" claim |
| Admin package-entitlements | Full CRUD | Status truth | Status truth | Status truth | N/A | Source of truth | Metadata key reserved | TRUE | payment_status: null |

---

## Package placement summary

| Package | Monthly | Categories wired (C5C) | Public behavior | Dashboard claim | Status |
|---|---:|---|---|---|---|
| Premium / Destacado | $1,999 | Servicios, Restaurantes, Autos, Rentas | Destacado / featured band when active entitlement | "Destacado" badge | TRUE |
| Full Page | $1,199 | Servicios, Autos | Priority sort / featured band (no Destacado badge) | "Prioridad" badge | TRUE |
| Half Page | $799 | All V1 (via print pool sort) | Standard placement | Plan label only | TRUE |
| Nuestros Negocios Only ($399) | $399 | All V1 (`classified_print`) | Standard placement; NN profile eligible | Plan label | TRUE |
| Quarter Page | $499 | All V1 | Print pool; NO NN by default (C5B fix) | No NN claim | TRUE |
| BR base | $399 | bienes-raices | 3 active properties enforced | Counts | TRUE |
| BR +5 add-on | $99.99/mo | bienes-raices | Not active without entitlement | No false upgrade | FALSE |
| Autos base | (dealer plan) | autos | 10-cap enforced | Counts | TRUE |
| Autos +10 add-on | $129.99/mo | autos | Cap still 10 without entitlement | Mailto only | FALSE |

---

## C5C blockers before Stripe

| Category/Surface | File path | Issue | Public/Dashboard/Admin impact | Stripe impact | Recommended fix | C5C vs C6 |
|---|---|---|---|---|---|---|
| BR browse | `app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts` | Client-side browser fetch cannot call service-role `listing_package_entitlements` | BR Destacado placement stays editorial (freshness/quality), not entitlement-driven | Needs server hydration or public overlay API | Convert to server fetch OR add `/api/clasificados/bienes-raices/public/entitlement-overlay` endpoint | **C6** |
| BR inventory +5 | `app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts` | `isBrInventoryUpgradeActive()` uses dev flags only; no entitlement DB check | Cannot sell +5 add-on in-app | Stripe recurring product + entitlement metadata | Admin grant `inventory_addon_br_properties` in metadata → server check | **C6** |
| Autos inventory +10 | `app/lib/clasificados/autos/autosDealerInventoryPolicy.ts` | Limit hardcoded to 10; boost is mailto CTA only | Cannot sell +10 in-app | Stripe price + entitlement metadata | Admin grant `inventory_addon_autos_vehicles` → raise limit from 10 to 20 | **C6** |
| Rentas Full Page distinction | `app/(site)/clasificados/rentas/lib/fetchRentasPublicListingsForBrowse.ts` | Only premium entitlement triggers `promoted`; full_page doesn't get distinct treatment | Full-page advertisers not differentiated from standard in Rentas results | Needs sort-weight partition in results client | Add visibility rank partition to `RentasResultsClient` sort logic | **C6** |
| Global homepage Premium | N/A (splash page only) | Homepage is language-gate splash; no listing content | No premium feed possible on current page | Would need `/home` to query active entitlements | Wire `/home` if/when it shows classified listings | **C6** |
| payment_status | `app/admin/(dashboard)/workspace/package-entitlements/actions.ts` | Always null in metadata | Cannot show "pending payment" on admin | Stripe webhooks → write payment_status | Stripe integration | **C6** |

---

## Inventory add-on enforcement detail

### Bienes Raíces

| Parameter | Value |
|---|---|
| Base active properties | 3 |
| Add-on grant | +5 (total 8) |
| Add-on price | $99.99/mo |
| Production activation | Only via `entitlementActive: true` param or admin metadata (C6) |
| Dev/QA activation | `NEXT_PUBLIC_LEONIX_BR_INVENTORY_UPGRADE=1` or localStorage (non-production only) |
| Entitlement metadata key | `inventory_addon_br_properties` |
| Server enforcement file | `leonixBrPropertyInventoryPolicy.ts` |

### Autos

| Parameter | Value |
|---|---|
| Base active vehicles | 10 |
| Add-on grant | +10 (total 20) |
| Add-on price | $129.99/mo |
| Current enforcement | Hardcoded `STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT = 10` |
| Production activation | N/A — cap remains 10 until entitlement wired |
| Entitlement metadata key | `inventory_addon_autos_vehicles` |
| Server enforcement file | `autosDealerInventoryPolicy.ts` |

---

## Files changed (C5C)

- `app/api/clasificados/autos/public/listings/route.ts` — hydrate entitlements → set `featured` from active premium/full_page
- `app/(site)/clasificados/rentas/lib/fetchRentasPublicListingsForBrowse.ts` — hydrate entitlements → override `promoted` from active premium
- `app/(site)/dashboard/mis-anuncios/page.tsx` — add Autos paid items to entitlement badge lookup
- `app/lib/clasificados/CLASIFICADOS_C5C_ENTITLEMENT_COVERAGE_CLOSEOUT.md` (this file)

---

## Summary of coverage state after C5C

| Category | Public placement entitlement-driven | Dashboard claims entitlement-backed | Admin source of truth |
|---|---|---|---|
| Servicios | YES (C5B) | YES (C5B) | YES |
| Restaurantes | YES (C5B) | YES (C5B) | YES |
| Autos | YES (C5C) | YES (C5C) | YES |
| Rentas | YES (C5C) | YES (C5B) | YES |
| Bienes Raíces | DEFERRED (client-side limitation) | YES (C5B) | YES |
| En Venta | N/A (separate model) | N/A | YES |
| Empleos | N/A (separate model) | N/A | N/A |
| Viajes | N/A (separate model) | N/A | N/A |
| Clases/Comunidad | N/A (not client-ready) | N/A | N/A |
