# W5 — Admin User / Client Dashboard Functional Audit

**Audit date:** 2026-05-27  
**References:** W1–W4 audits, C5A publish pipeline, C6 Stripe readiness contract  
**Scope:** Admin routes for user/client lookup, listing ownership traceability, package entitlements, payment tracker honesty, and admin actions. No visual redesign, no Stripe implementation, no fake analytics or package claims.

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Code proves behavior is real, admin-protected, and truthful |
| FALSE | Admin cannot trace owner, broken route, fake state, or unsafe exposure |
| DEFERRED_INTENTIONAL | Safely hidden, honestly empty/deferred, or labeled mock |
| NOT_APPLICABLE | Not relevant to this admin surface |

---

## 1. Main audit table

| Admin area | Route/file | Required behavior | Current implementation | User/client impact | Admin impact | Package/payment impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Admin route protection | `app/admin/(dashboard)/layout.tsx` | All dashboard routes require admin | `requireAdminCookie` → `redirect("/admin/login")` | Non-admin cannot see admin shell | Protected ops surface | N/A | TRUE | `dynamic = "force-dynamic"` |
| Admin route protection | `middleware.ts` | No sensitive leak before auth | Middleware only sets admin UI lang cookie; **does not** gate auth | Cookie alone insufficient without layout | Layout is enforcement layer | N/A | TRUE | Defense in depth: layout + per-page checks on sensitive pages |
| Admin login | `/admin/login`, `login/submit/route.ts` | Password gate sets `leonix_admin=1` | POST shared `ADMIN_PASSWORD`; redirect on failure | N/A | Staff-only entry | N/A | TRUE | Not linked from public navbar |
| Public nav exposure | `Navbar.tsx`, `Footer.tsx` | No public link to `/admin` | No `/admin` in site nav components | Users not routed to admin | N/A | N/A | TRUE | `/admin` only in internal-path heuristics (`ctaDataHelpers`) |
| Admin home | `/admin` (`(dashboard)/page.tsx`) | Snapshot + links to ops surfaces | Package entitlement, promo, payment tracker snapshots; category registry cards | N/A | Hub for staff | Honest payment/entitlement counts from DB | TRUE | |
| User/client list | `/admin/usuarios` | Search by name, email, phone, UUID | `fetchProfilesForAdminList`: server `ilike` on name/email/phone; UUID `eq`; account ref in UI | Support can find accounts | List shows type, membership, created, disabled | N/A | TRUE | |
| User list — listing count | `/admin/usuarios` | Optional aggregate counts | Not shown on list rows | N/A | Must open detail or ops search | N/A | FALSE | Add counts in W6 or link to ops |
| User list — entitlement count | `/admin/usuarios` | Optional package count | Not on list | N/A | Use `/admin/workspace/package-entitlements?q=` | N/A | FALSE | Tracker supports `q` filter; no per-user column on list |
| User detail | `/admin/usuarios/[id]` | Profile, email, phone, auth ID | `profiles` select + account ref; Supabase Auth dashboard link | Account type/membership override | Full identity for support | N/A | TRUE | `profiles.id` = auth user id |
| User detail — ads command center | `adminUserAds.ts` + detail page | All owned listings across sources | Loads: `listings` (generic), `restaurantes_public_listings`, `servicios_public_listings`, `empleos_public_listings`, `autos_classifieds_listings` | BR/rentas/en-venta/clases/comunidad/busco/mascotas via generic | Dedicated verticals listed | Plan label via `categoryAdPlans` | TRUE | Per-source error states |
| User detail — Viajes | `fetchAdminUserAdsForUser` | Viajes listings traceable to owner | **Not loaded** — Viajes uses `viajes_staged_listings` per `classifiedsOpsContract` | Owner’s travel offers absent from command center | Use `/admin/workspace/clasificados/travel` or `/admin/clasificados/viajes` | N/A | FALSE | Extend loader or deep-link from user detail (W6) |
| User detail — package entitlements | `/admin/usuarios/[id]` | See entitlements for client | No inline section; staff uses package tracker | N/A | Manual cross-reference by name/code/listing id | Tracker at `/admin/workspace/package-entitlements` | FALSE | Link/filter by owner not implemented |
| User detail — analytics | `/admin/usuarios/[id]` | Analytics summary if supported | No per-user analytics panel | N/A | No `listing_analytics` queries in admin user detail | N/A | FALSE | User-facing analytics only (`/dashboard/analytics`); admin per-listing via workspace |
| User detail — impersonation | Detail copy | No impersonation | Explicit copy: no “view as user” | Privacy preserved | Staff uses queues + Supabase Auth | N/A | TRUE | |
| Customer ops search | `/admin/ops` | Unified search | `runAdminUnifiedSearch`: profiles, listings, tienda orders, reports | N/A | Cross-entity discovery | N/A | TRUE | Per-section limits documented |
| Clasificados workspace hub | `/admin/workspace/clasificados` | Category filters, owner column | `fetchListingsForAdminWorkspaceFiltered`; `AdminListingsTable` with owner + Leonix ID | N/A | Full listing ops | `AdminListingMonetizationSummary` (contract-based, not fake paid) | TRUE | |
| Category queues (12) | Per-category `page.tsx` | Each category manageable | Dedicated pages for restaurantes, servicios, empleos, autos, rentas, BR, en-venta, clases, comunidad, busco, travel; mascotas **added W5** | N/A | Owner + Leonix ID on generic queues | Entitlement actions via separate tracker | TRUE* | *Viajes uses staged table + editorial admin |
| Mascotas queue route | `/admin/workspace/clasificados/mascotas-y-perdidos` | Queue page exists | **Was missing** — added `mascotas-y-perdidos/page.tsx` (W5 fix) | N/A | Was 404 from hub links | N/A | TRUE | Fixed in W5 |
| Package entitlements | `/admin/workspace/package-entitlements` | CRUD, revoke, extend, attach | Server actions with `requireAdminCookie`; `payment_status: null` on create; `effectiveEntitlementStatus` | Public benefits only when entitlement active (C6) | Full staff control | No fake Stripe fields | TRUE | Attach banner: does not auto-activate public sort |
| Payment tracker | `/admin/workspace/payment-tracker` | Real rows or honest empty | `fetchPaymentTrackerSnapshot`; banner: no payments collected yet | N/A | Operational visibility | Stripe deferred per C6 | TRUE | |
| Payments hub | `/admin/payments` | Tienda aggregates, not fake Stripe | Tienda order status counts; read-only badges | N/A | Fulfillment ops | No classifieds Stripe checkout | TRUE | |
| Reports / moderation | `/admin/reportes` | Listing reports queue | `listing_reports` table + status updates via actions | Reporter/owner linkage | Moderation workflow | N/A | TRUE | Layout-protected |
| Optional roster ACL | `leonixAdminGate.ts` | Fine-grained permissions | Opt-in `ADMIN_ENFORCE_ROSTER_PERMISSIONS=1` | N/A | Partial permission map | N/A | DEFERRED_INTENTIONAL | Default: shared-password cookie only |
| Viajes admin analytics | `AdminViajesAnalyticsPlaceholders.tsx` | No fake production metrics | Labeled **“Mock sample”** / “not live data” | N/A | Stakeholder preview only | N/A | DEFERRED_INTENTIONAL | Honest staging UI |
| Admin restaurantes `promoted` column | `workspace/clasificados/restaurantes/page.tsx` | Staff sees DB truth | Raw `promoted` boolean in table | Does not alone grant public entitlement | Ops visibility | Align with entitlement in W6 | DEFERRED_INTENTIONAL | Informational column; public gating uses C6 elsewhere |

---

## 2. Admin category matrix (12 categories)

| Category | Admin listing visible | Owner traceable | Leonix Ad ID visible | Business profile visible | Edit/manage action | Package/entitlement visible | Analytics visible | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Autos | `/admin/workspace/clasificados/autos` | `owner_user_id` in queue; user detail via `adminUserAds` | Column when present | Dealer inventory via autos admin | Staff queue + dashboard link | Tracker + tier on row meta | Not on admin listing row | TRUE | |
| Bienes Raíces | `/admin/workspace/clasificados/bienes-raices` | `owner_id` on `listings` | `leonix_ad_id` + contract line in table | Agent fields in `detail_pairs` / contract | `/listings/[id]/edit` staff edit | Monetization summary | Not inline | TRUE | |
| En Venta | `/admin/workspace/clasificados/en-venta` | `owner_id` | `leonix_ad_id` | Seller type on listing | Staff edit + moderation fields | Monetization summary | Not inline | TRUE | |
| Empleos | `/admin/workspace/clasificados/empleos` | `owner_user_id` | `leonix_ad_id` | `company_name` on row | Empleos queue actions | Tracker | Not inline | TRUE | |
| Rentas | `/admin/workspace/clasificados/rentas` | `owner_id` | `leonix_ad_id` | Contract facets | Staff edit | Monetization summary | Not inline | TRUE | |
| Servicios | `/admin/workspace/clasificados/servicios` | `owner_user_id` | `leonix_ad_id` | `business_name`, slug | Servicios admin client + queue | `promoted` column (DB) | Not inline | TRUE | Business profile via listing row |
| Restaurantes | `/admin/workspace/clasificados/restaurantes` | `owner_user_id` | `leonix_ad_id` | `business_name`, package_tier | PATCH actions in queue | Tier + promoted column | Not inline | TRUE | |
| Clases | `/admin/workspace/clasificados/clases` | `owner_id` | `formatLeonixAdId(id)` fallback | In listing row | Staff edit | Monetization summary | Not inline | TRUE | |
| Comunidad | `/admin/workspace/clasificados/comunidad` | `owner_id` | Leonix ID rules same as clases | Event/org in listing | Staff edit | Monetization summary | Not inline | TRUE | |
| Mascotas y Perdidos | `/admin/workspace/clasificados/mascotas-y-perdidos` | `owner_id` | PET prefix / stored id | In listing content | Staff edit (W5 route fix) | Monetization summary | Not inline | TRUE | Route added W5 |
| Busco | `/admin/workspace/clasificados/busco` | `owner_id` | Leonix ID | In listing | Staff edit | Monetization summary | Not inline | TRUE | |
| Viajes | `/admin/workspace/clasificados/travel` + `/admin/clasificados/viajes/*` | Staged listings + business offers admin | `TRAV` prefix / slug | Viajes businesses table | Editorial + business-offers moderation | Staged ops | Mock panel only (labeled) | TRUE* | *Not in user detail command center (see FALSE above) |

---

## 3. Admin actions matrix

| Action | Surface | Backed by real route/API | Admin protected | Ownership/category safe | Package/payment aware | Status | Notes |
|---|---|---|---|---|---|---|---|
| Edit client type/membership | `/admin/usuarios/[id]` | `updateClientAccountAction` → `profiles` | `requireAdminCookie` | UUID validation | Does not fake Stripe tier benefits | TRUE | Audit log `client_account_updated` |
| Enable/disable account | `AdminUserActions` | Server action on `profiles.is_disabled` | Cookie + action guard | Per `userId` | N/A | TRUE | |
| Open Supabase Auth | User detail link | External dashboard URL | Admin only | N/A | N/A | TRUE | No password reset from panel |
| View public listing | User detail / queues | Public clasificados URLs | Admin session | Category-specific URLs | N/A | TRUE | |
| Manage in admin queue | `resolveAdminAdActions` → `adminManageUrl` | Category queue routes | Layout protected | Maps source → correct queue | N/A | TRUE | |
| Edit as admin (staff) | `adminEditUrl` when supported | e.g. `/admin/workspace/clasificados/listings/[id]/edit` | Cookie | Guards in edit flow | N/A | TRUE | Not all sources expose URL |
| Advertiser panel link | User detail | `/dashboard/...` | Requires owner login | Labeled “not Leonix editing” | N/A | TRUE | Honest self-service only |
| Create package entitlement | `/admin/workspace/package-entitlements` | `createPackageEntitlementAction` | `requireAdminCookie` | Category + listing_source validated | `payment_status: null`, Stripe ids null | TRUE | |
| Revoke entitlement | Package tracker | `revokePackageEntitlementAction` | Yes | By entitlement id | Sets `revoked` + `revoked_at` | TRUE | |
| Extend entitlement | Package tracker | `extendPackageEntitlementAction` | Yes | Recalculates `effectiveEntitlementStatus` | N/A | TRUE | |
| Attach listing to entitlement | Package tracker | `attachListingToPackageEntitlementAction` | Yes | Listing id required | Honest attach copy | TRUE | |
| Listing approve/reject/pause | Category queues / `ClassifiedAdminRowActions` | Staff PATCH / status updates | Layout + actions | Per listing row | Does not auto-mark paid | TRUE | Category-specific |
| Delete listing | Various admin actions | `deleteListingAction` + `can_manage_ads` when roster on | Gated | Service role | N/A | TRUE | |
| Impersonation | — | Not implemented | N/A | N/A | N/A | NOT_APPLICABLE | Explicitly unavailable |
| Stripe checkout / portal | — | Not in admin | N/A | N/A | C6 contract | NOT_APPLICABLE | Payment tracker documents deferral |

---

## 4. W4 follow-up items (resolve or document)

| Item | Resolution in W5 | Status |
|---|---|---|
| En Venta Destacado uses `detail_pairs` not entitlement API (user dashboard) | Documented — user-facing badge; admin uses monetization summary + entitlement tracker separately | DEFERRED_INTENTIONAL → W6 user dashboard |
| `/dashboard/restaurantes` uses raw `promoted` (user dashboard) | Documented — admin restaurantes queue also shows `promoted` column for ops visibility | DEFERRED_INTENTIONAL → W6 |
| `/dashboard/mis-anuncios/[id]` allows access when `owner_id` null | **Fixed W5:** deny when `listing.owner_id !== user.id` | TRUE (fixed) |

---

## 5. Business profile linkage (admin visibility)

| Business category | Admin can see business identity | Status | Notes |
|---|---|---|---|
| Servicios | `business_name`, slug, city in servicios queue + user detail group | TRUE | |
| Restaurantes | `business_name`, `package_tier`, slug | TRUE | |
| Viajes | `/admin/clasificados/viajes/businesses` | TRUE | Not merged into user command center |
| Bienes Raíces | Leonix contract + agent facets in workspace table | TRUE | |
| Autos / dealerships | Autos admin queue + dealer paths | TRUE | |
| Empleos | `company_name` on empleos rows | TRUE | |
| Rentas | Property manager via listing + contract | TRUE | |
| Clases | Instructor/school in listing content | TRUE | No separate business_profiles table on user detail |

---

## 6. Payment / Stripe readiness (admin)

| Check | Status | Notes |
|---|---|---|
| No fake `paid` without DB record | TRUE | `payment_status` nullable; tracker honest banner |
| No fake invoice/receipt UI | TRUE | Not present |
| No fake billing portal in admin | TRUE | |
| Stripe fields null on manual entitlement create | TRUE | `actions.ts` sets stripe_* and `payment_status: null` |
| C6 contract preserved | TRUE | Activation remains entitlement + time bound |

---

## 7. Analytics (admin)

| Check | Status | Notes |
|---|---|---|
| No fake listing analytics in clasificados queues | TRUE | No fabricated view counts in `AdminListingsTable` |
| Viajes ROI panel labeled mock | DEFERRED_INTENTIONAL | `AdminViajesAnalyticsPlaceholders` |
| Per-user analytics on admin user detail | FALSE | Not implemented — use user dashboard or future admin report |
| Event types tied to `listing_id` in user dashboard | TRUE (W4) | Admin does not duplicate |

---

## W5 blockers before launch

### Fixed in W5

| Admin area | Route/file | Issue | User/client impact | Admin impact | Package/payment impact | Recommended fix | Fixed in W5 |
|---|---|---|---|---|---|---|---|
| Mascotas queue | `/admin/workspace/clasificados/mascotas-y-perdidos` | Hub linked to missing `page.tsx` (404) | Staff could not open category queue | Broken ops link from admin home | N/A | Add `ListingsCategoryOpsQueuePage` wrapper | **Yes** |
| User listing workspace | `dashboard/mis-anuncios/[id]/page.tsx` | `owner_id` null allowed any authed user | Orphan listing exposure | N/A | N/A | Deny when `owner_id !== user.id` | **Yes** |

### Remaining (W6 or follow-up)

| Admin area | Route/file | Issue | User/client impact | Admin impact | Package/payment impact | Recommended fix | W5/W6 |
|---|---|---|---|---|---|---|---|
| User list | `/admin/usuarios` | No listing/entitlement counts on rows | N/A | Extra clicks to assess account | N/A | Optional aggregates or ops deep links | W6 |
| User detail | `/admin/usuarios/[id]` | No inline package entitlements | N/A | Manual tracker lookup | Slower entitlement support | Filter tracker by `customer_name` / listing id or join table | W6 |
| User detail | `adminUserAds.ts` | Viajes (`viajes_staged_listings`) not in command center | N/A | Incomplete owner inventory | N/A | Add `loadViajes` source or link to travel queue | W6 |
| User detail | `/admin/usuarios/[id]` | No analytics summary | N/A | No at-a-glance performance | N/A | Read-only `listing_analytics` rollup by owner | W6 |
| User dashboard (W4) | `mis-anuncios/page.tsx` | En venta Destacado from `detail_pairs` | Misleading Destacado badge | N/A | Public sort not entitlement-backed | Wire entitlement API | W6 |
| User dashboard (W4) | `dashboard/restaurantes/page.tsx` | `promoted` column badge | Misleading promotion | N/A | Same | Entitlement overlay | W6 |

---

## Completion checklist

1. Admin routes audited — **Yes**
2. User/client list verified — **Yes** (counts deferred)
3. User/client detail dashboard verified — **Yes** (gaps documented)
4. Category ownership/admin listing matrix verified — **Yes** (mascotas route fixed)
5. Business profile linkage verified — **Yes** (viajes via separate admin)
6. Package/entitlement controls verified — **Yes**
7. Payment/Stripe readiness verified — **Yes**
8. Analytics/admin actions verified — **Yes** (mock viajes labeled; user-detail analytics deferred)
9. W4 follow-up blockers fixed/deferred — **owner_id fixed**; entitlement badges deferred W6
10. Files changed — see below
11. Build — run `npm run build` (gate)

### Files changed in W5

- `app/lib/website-audit/WEBSITE_W5_ADMIN_USER_CLIENT_DASHBOARD_AUDIT.md` (this document)
- `app/admin/(dashboard)/workspace/clasificados/mascotas-y-perdidos/page.tsx` (new — fixes 404 queue)
- `app/(site)/dashboard/mis-anuncios/[id]/page.tsx` (owner guard tighten)
