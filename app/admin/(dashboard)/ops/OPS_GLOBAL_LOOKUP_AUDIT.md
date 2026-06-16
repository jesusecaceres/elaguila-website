# OPS Global Lookup — ADMIN-OPS-GLOBAL-LOOKUP-01

## 1. Files inspected

- `app/admin/(dashboard)/ops/page.tsx`
- `app/admin/(dashboard)/ops/_components/OpsGlobalLookupEmptyState.tsx` (new)
- `app/admin/_lib/adminOpsUnifiedSearch.ts`
- `app/admin/_lib/adminProfilesQuery.ts` (via unified search)
- `app/admin/_lib/adminListingsOpsSearch.ts` (via unified search)
- `app/admin/_lib/adminOpsReportsSearch.ts` (via unified search)
- `app/admin/_lib/adminOpsSupportContext.ts` (via unified search)
- `app/admin/_lib/tiendaOrdersData.ts` (via unified search)
- `app/admin/_lib/adminStrings.ts`
- `app/admin/_lib/adminGlobalNav.ts`
- `app/admin/(dashboard)/usuarios/page.tsx` (overlap check)
- `app/admin/(dashboard)/leads/inbox/page.tsx` (overlap check)
- `app/admin/(dashboard)/page.tsx` (dashboard link overlap)
- `scripts/verify-admin-ops-global-lookup.mjs`

## 2. What this page is for

`/admin/ops` is the Leonix **Global Search / Customer Lookup** command center. Staff enter one identifier (email, phone, name, UUID, listing id, order ref, report id) and jump to matching admin records across profiles, support context, clasificados listings, Tienda orders, and listing reports.

## 3. What this page is not for

- Not the executive dashboard (`/admin`)
- Not Launch Leads CRM (`/admin/leads/inbox`)
- Not the full user roster/editor (`/admin/usuarios`)
- Not a place to edit records (read-only search + links)
- Does not search Launch Leads inbox (no `leonix_leads` in unified search)

## 4. Duplication risks

| Area | Risk | Mitigation |
|------|------|------------|
| `/admin` | Dashboard links to ops for lookup | Role copy in empty state; dashboard CTA renamed "Global Search →" |
| `/admin/usuarios` | Profile search overlap | "Users only →" CTA; ops shows cross-entity bundle |
| `/admin/leads/inbox` | Both involve customers | Empty state CTA + role copy; leads not in unified search |
| Workspace hub pages | Some hardcoded "Customer ops" shortcut labels remain | Primary sidebar uses `nav.customerOps` = "Global Search"; hub labels out of scope for this gate |

## 5. Files changed

- `app/admin/(dashboard)/ops/page.tsx` — header strings, form polish, empty state, test ids
- `app/admin/(dashboard)/ops/_components/OpsGlobalLookupEmptyState.tsx` — new intro panel
- `app/admin/_lib/adminStrings.ts` — nav label, ops page copy, dashboard/categories CTAs
- `scripts/verify-admin-ops-global-lookup.mjs` — gate verifier
- `package.json` — `verify:admin-ops-global-lookup` script
- `app/admin/(dashboard)/ops/OPS_GLOBAL_LOOKUP_AUDIT.md` — this file

## 6. New page architecture

```
AdminPageHeader (Operations eyebrow, i18n title/subtitle/helper)
  → Search form (GET ?q=, primary input, Search / Clear / Users only)
  → If !q: OpsGlobalLookupEmptyState (scope, examples, CTAs, role matrix)
  → If q: jump nav + error banner + sections:
        profiles → context → listings → orders → reports → shortcuts
```

## 7. Empty state improvements

- Lists searchable field types (name, email, phone, UUID, Leonix Ad ID, listing id, order ref, report id)
- Placeholder examples (no real PII)
- Common admin destination buttons (Users, Launch Leads, Classifieds queue, Reports, Tienda)
- Scope note: search only, no edits
- Role clarification for `/admin`, leads inbox, usuarios, ops

## 8. Search scope

| Target | Supported | Source |
|--------|-----------|--------|
| Profiles / accounts | Yes | `fetchProfilesForAdminList` |
| Listings / ads | Yes | `searchListingsForAdminOps` |
| Tienda orders | Yes | `listTiendaOrdersForAdmin` |
| Listing reports | Yes | `searchListingReportsForOps` |
| Support context | Yes (single profile match) | `fetchAdminSupportContextForProfile` |
| Launch leads | No | Not in `runAdminUnifiedSearch` |
| Print orders (legacy) | Via Tienda orders table | Same as Tienda inbox |

## 9. Result sections preserved

- `#ops-profiles` — profile rows + link to `/admin/usuarios/[id]`
- `#ops-context` — read-only support summary
- `#ops-listings` — table with public view + admin queue links
- `#ops-orders` — Tienda order rows + order detail links
- `#ops-reports` — report rows + queue links
- `#ops-shortcuts` — quick links to related admin areas

## 10. CTA / link matrix

| CTA | Destination |
|-----|-------------|
| Search | Same page `?q=` |
| Clear | `/admin/ops` |
| Users only | `/admin/usuarios` |
| Profile → | `/admin/usuarios/[id]` |
| Admin queue | `/admin/workspace/clasificados?q=` |
| Tienda inbox | `/admin/tienda/orders?q=` |
| Reports queue | `/admin/reportes?q=` |
| Launch Leads (empty state) | `/admin/leads/inbox` |
| Classifieds queue (empty state) | `/admin/workspace/clasificados?status=flagged#queue` |

## 11. Mobile result

- Page root: `min-w-0`, `overflow-x-hidden`, `max-w-5xl`
- Form buttons: `grid-cols-1 sm:grid-cols-3`, full-width CTAs
- Listings table: `overflow-x-auto` wrapper
- Empty state CTAs: single column on narrow viewports

## 12. TRUE/FALSE audit table

| Flag | Value |
|------|-------|
| ADMIN_OPS_REPO_INSPECTED_FIRST | TRUE |
| ADMIN_OPS_ROUTE_EXISTS | TRUE |
| ADMIN_OPS_PURPOSE_CLEAR | TRUE |
| ADMIN_OPS_NAV_LABEL_CLEAR | TRUE |
| ADMIN_OPS_SEARCH_FORM_PRESERVED | TRUE |
| ADMIN_OPS_CLEAR_ACTION_PRESERVED | TRUE |
| ADMIN_OPS_USERS_ONLY_ACTION_PRESERVED | TRUE |
| ADMIN_OPS_EMPTY_STATE_USEFUL | TRUE |
| ADMIN_OPS_ADMIN_CTA_LINKS | TRUE |
| ADMIN_OPS_RESULTS_SECTIONS_PRESERVED | TRUE |
| ADMIN_OPS_USER_LINKS_PRESERVED | TRUE |
| ADMIN_OPS_LISTING_ORDER_LINKS_PRESERVED | TRUE |
| ADMIN_OPS_NO_FAKE_COUNTS | TRUE |
| ADMIN_OPS_NO_PUBLIC_PAGE_CHANGES | TRUE |
| ADMIN_OPS_NO_SCHEMA_CHANGES | TRUE |
| ADMIN_OPS_NO_STRIPE_PAYMENT_CHANGES | TRUE |
| ADMIN_OPS_NO_BUSINESS_LOGIC_CHANGES | TRUE |
| ADMIN_OPS_MOBILE_SAFE | TRUE |
| ADMIN_OPS_VERIFY_PASS | TRUE (after npm run) |
| ADMIN_OPS_BUILD_GREEN | TRUE (after npm run) |
