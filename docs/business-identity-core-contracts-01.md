# Business Identity Core — implemented contracts (Package BCO-2)

Records what Package BCO-2 actually built at `app/lib/business/**`, on top of the certified
schema from Package 1 (`supabase/migrations/20260715120000_business_identity_foundation_bco1.sql`).
Package 3 (entrepreneur UI/wizard) consumes this module; it does not build UI itself.

## Module layout

```
app/lib/business/
  types.ts              domain types, discriminated unions (EligibilityResult, AccessResolution, ...)
  constants.ts           controlled value sets, bounded default field-error copy (es/en)
  normalization.ts        pure normalizers (name, phone, email, domain, slug, service area, ...)
  validation.ts           hand-rolled validators -> structured FieldError[] (no Zod in this repo)
  featureFlag.ts          server-only reader for business_identity_flags (+ pure computeFlagTier)
  eligibility.ts           read-only Negocio eligibility adapter (+ pure statusFromEvidence)
  access.ts                Business Tools access resolution (+ pure computeAccessResolution)
  duplicates.ts             bounded, privacy-safe duplicate-warning engine
  listingLinking.ts          listing-ownership verification, reusing the canonical contract
  supabaseUserClient.ts       isolated RLS-scoped ("as the user") client helper — see below
  repositories/               typed, server-only row-mapping functions per table
  services/
    finalizeBusiness.ts        Phase 12 atomic-creation orchestration
    draftService.ts             draft CRUD wrapper used by the API routes
  index.ts                    public surface Package 3 should import from

app/api/dashboard/business/
  access/route.ts             GET  -> resolveBusinessToolsAccess
  drafts/route.ts             GET list / POST upsert-step
  drafts/[id]/route.ts        GET / DELETE own draft
  duplicates/route.ts         POST -> resolveDuplicateWarning
  finalize/route.ts           POST -> finalizeBusinessIdentity

supabase/migrations/20260716120000_business_identity_finalize_rpc.sql
  one additive SECURITY DEFINER RPC, finalize_business_identity(...)
```

## Why a new RPC migration was necessary

`businesses`, `business_memberships`, `business_contacts`, `business_service_areas`, and
`business_listing_links` deliberately have **no client INSERT/UPDATE/DELETE policy** (Gate
BCO-1C.1) — creation is server-only by design. Standard sequential Supabase client calls from
Next.js are not atomic across tables. `finalize_business_identity` is a single `SECURITY
DEFINER` Postgres function (fixed `search_path`, no dynamic SQL, `EXECUTE` revoked from `PUBLIC`
and granted only to `authenticated`) that creates the business, its founding active
primary-owner membership, contacts, service areas, and an optional listing link in one
transaction, then deletes the source draft — preserving the exactly-one-owner deferred
constraint trigger exactly as certified in Package 1 (a single function call is one implicit
transaction, so that trigger fires correctly at the end of it).

The RPC re-verifies listing ownership **itself**, with static per-table branches mirroring
`LISTING_SOURCE_OWNERSHIP_CONTRACT` (`app/lib/listingPlans/listingEntitlementOwnership.ts`)
exactly. It never trusts a client-supplied "already verified" flag — this matters because the
RPC is reachable directly via PostgREST by any authenticated user, not only through the Next.js
route above it.

**Keep in sync**: if `LISTING_SOURCE_OWNERSHIP_CONTRACT` ever gains/changes a source, the
`IF/ELSIF` branches in `finalize_business_identity` must be updated in the same change. This is
the one deliberate, narrow duplication in the whole module — everywhere else (the eligibility
adapter, the pre-check in `listingLinking.ts`), the TypeScript contract is read directly, never
re-implemented.

## Why a new user-scoped Supabase client helper

No RLS-scoped ("as the logged-in user") server client existed anywhere in this repo before this
package (confirmed: no `@supabase/ssr` dependency). The existing convention
(`app/api/_lib/bearerUser.ts`) only ever used a bearer token to resolve `auth.getUser()`, then
switched to the **admin/service-role** client for all actual data access, with authorization
checked in application code (e.g. `resolveOwnedListingIdentityKeys`).

`app/lib/business/supabaseUserClient.ts` instead keeps the user's bearer token attached to the
client for the whole request, so RLS — the access boundary specifically designed and certified
in Package 1 — does the enforcement for every membership-scoped read and for
`business_onboarding_drafts`' own-user policies, rather than duplicating that logic in
application code a second time. Deliberately not added to the shared
`app/lib/supabase/server.ts` (locked file) — it lives inside the isolated module instead.

## Eligibility signal correction carried from Package 1

`listing_package_entitlements` is **excluded** from the adapter — its `package_tier` values
(`premium`, `full_page`, `half_page`, `quarter_page`, `classified_print`, `digital_only`) are
print/digital ad-package sizes, not a business/personal distinction; treating an active row
there as eligibility evidence would invent a qualifying value the schema doesn't support.
`leonix_placement_entitlements.placement_tier = 'website_business'` (direct `owner_user_id`
column, no contract lookup needed) is the strongest verified signal. Restaurantes `package_tier`
and Servicios remain permanently `ambiguous` — no confirmed value set / no signal column exists
for either, and the adapter says so honestly rather than guessing.

## Deferred, not built in this package

- Post-finalization editing of contacts/service areas/business fields (repositories intentionally
  expose read-only functions only past creation time).
- Business archival (explicitly deferred per Phase 7's own instruction).
- Staff-facing Concierge access, invitations beyond the founding owner, multi-location — all
  out of scope, matching every prior gate's product boundary.
- The entrepreneur-facing onboarding wizard UI itself — Package 3.

## Feature flag / rollout state after this package

`business_identity_flags.business_identity_foundation` remains `enabled = false`,
`emergency_disabled = false`, `pilot_user_ids = []` on staging. Nothing in this package changes
that row. No customer has access to anything built here.
