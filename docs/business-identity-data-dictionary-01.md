# Business Identity — Data Dictionary (Gate BCO-3R-B, updated Gate BCO-3R-B.1)

Every field the 9-step global Identity flow collects, displays, or derives. No field exists here
merely because it "might be useful later" — each row states why Leonix actually asks for it.

**Sensitivity classifications**

- `PUBLIC` — safe to show to any visitor once the business chooses to publish/list.
- `BUSINESS_INTERNAL` — visible to the business's own authorized members and Leonix systems, not shown to the general public by default.
- `OWNER_PRIVATE` — visible only to the authorized owner/representative and Leonix staff with a legitimate need; never public, never bulk-exported to third parties.
- `SENSITIVE_OPTIONAL` — the owner controls public exposure explicitly (an on/off visibility choice); defaults closed.
- `SYSTEM_SECURITY` — internal-only derived value (e.g. normalized text for duplicate matching); never rendered in any UI, never exported.

**AI-use categories** (Gate BCO-3R-B.1) — replaces the earlier bare Yes/No AI-use column. AI may
later receive only the minimum information a specific task actually needs; it never receives every
stored field merely because it exists.

- `NEVER_AI` — never exposed to any AI system, regardless of task (system/security-derived values, and administrative metadata with no legitimate AI use case).
- `TASK_SCOPED_AI` — a bounded AI task may read this field when it's relevant to that specific task (e.g. recommending a tool that fits the business's operating model); never bulk-loaded "just in case."
- `OWNER_APPROVED_AI` — private/sensitive information; an AI system may use it only for a specific task the owner has explicitly authorized, never by default.
- `PUBLIC_CONTEXT_AI` — already-public information; safe as general context for public-facing AI-assisted output (e.g. drafting ad copy).

**Deterministic default mapping** (no private field defaults to broad AI use): `PUBLIC` →
`PUBLIC_CONTEXT_AI`; `BUSINESS_INTERNAL` → `TASK_SCOPED_AI`; `OWNER_PRIVATE` / `SENSITIVE_OPTIONAL`
→ `OWNER_APPROVED_AI`; `SYSTEM_SECURITY` → `NEVER_AI`. Rows below override this default only to
tighten it further (e.g. pure audit/control fields are `NEVER_AI` even though their sensitivity
tier would otherwise default to `TASK_SCOPED_AI`) — never to loosen it.

**Common behavior unless a row says otherwise:** owner-editable after creation is "coming soon" (editing UI is out of scope for this package — see `editingComingSoon` copy); retention is "current value only, no version history yet"; freshness expectation is "as of the owner's last confirmation, no automatic re-verification"; export/deletion follows the business record as a whole (deleting the business deletes its child rows via FK cascade — no per-field deletion exists); advertiser access is **never** granted for any `OWNER_PRIVATE` or `SENSITIVE_OPTIONAL` field, full stop — see [Living Business Book] doctrine — AI never converts a guess into a fact, and consequential actions always require human/owner approval.

## `businesses` table (core identity)

| Field key | Purpose | Required | Source | Sensitivity | AI-Use Category | Visibility | Authorized readers | Public-use | Downstream consumers |
|---|---|---|---|---|---|---|---|---|---|
| `displayName` | The name used throughout Leonix internally | Required | Owner, step 2 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes | Onboarding review, completed view, future public listing/Discovery |
| `legalName` | Officially registered legal name, for Leonix's own records and future compliance needs | Optional | Owner, step 2 | OWNER_PRIVATE | OWNER_APPROVED_AI | Owner + staff only | Owner, authorized members, staff | No | Completed view (owner-only note), future compliance tooling |
| `publicName` | How customers actually know the business, if different from `displayName` | Optional | Owner, step 2 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes | Completed view header, future public listing |
| `businessPrimaryLanguage`, `businessAdditionalLanguages` | The business's real-world operating language(s) — distinct from the setup-UI language | Optional | Owner, step 2 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes | Completed view, future customer-facing language matching |
| `yearStarted` | Business age/tenure signal | Optional | Owner, step 2 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes | Completed view, future "established since" display |
| `broadBusinessType`, `specificBusinessType`, `customSpecificType` | Category taxonomy for search, recommendations, and consistent classification | `broadBusinessType` required; others optional | Owner, step 3 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes | Completed view, future category search/filtering |
| `businessStage` | Lets Leonix tailor guidance to where the business actually is (planning vs. mature) | Required | Owner, step 3 | BUSINESS_INTERNAL | TASK_SCOPED_AI | Internal | Owner, authorized members, staff, Leonix guidance systems | No | Future Next Right Move / Health Map recommendation logic |
| `primaryLanguage` | The ES/EN language Leonix's own interface used for this record (setup-language choice, step 1) | Required | Owner, step 1 | BUSINESS_INTERNAL | TASK_SCOPED_AI | Internal | Owner, staff | No | Completed-view copy selection, future correspondence language default |
| `operatingModels` | How the business actually operates (fixed/mobile/online/etc., includes the derived `hybrid` tag) — prevents Leonix recommending tools that don't fit | Required (≥1 primary mode) | Owner, step 4 (primary modes); server-derived (`hybrid`) | BUSINESS_INTERNAL | TASK_SCOPED_AI | Internal | Owner, authorized members, staff, Leonix guidance systems | No | Future tool/education recommendations |
| `salesRelationships`, `salesChannels` | Who the business sells to and how, for the same recommendation-fit purpose | Optional | Owner, step 4 | BUSINESS_INTERNAL | TASK_SCOPED_AI | Internal | Owner, authorized members, staff, Leonix guidance systems | No | Future tool/education recommendations |
| `preferredResponseMethod` (whatsapp/phone_call/sms/email) | Gate BCO-3R-B.2 — the single business-wide way Leonix and customers should reach out first; server-validated at finalize time against the actually-entered, capable contacts (never trusted from the client alone) | Optional | Owner, step 6 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes | Completed view, future customer-facing contact CTA |
| `normalizedName` | Case/accent-insensitive comparison value for duplicate detection only | System-derived | Server, from `displayName` | SYSTEM_SECURITY | NEVER_AI | Never displayed | Server processes only | No | `resolveDuplicateWarning` |
| `slug` | Stable URL identifier | System-derived | Server, from `displayName` | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes | Future public listing URL |
| `status`, `onboardingStatus`, `creationSource` | Internal lifecycle bookkeeping | System-derived | Server | BUSINESS_INTERNAL | NEVER_AI (administrative bookkeeping, no legitimate AI use case) | Internal | Owner, staff | No | Internal state machines only |

## `business_memberships` — authorization metadata

| Field key | Purpose | Required | Source | Sensitivity | AI-Use Category | Visibility | Authorized readers | Public-use |
|---|---|---|---|---|---|---|---|---|
| `authorizationRole` (`owner` \| `authorized_representative`) | Records the setup person's actual relationship to the business, for accountability | Required | Owner/representative, step 7 | BUSINESS_INTERNAL | NEVER_AI (accountability metadata, no legitimate AI use case) | Internal | Owner, staff | No |
| `representativeRelationship` | Free-text description of the representative's relationship (e.g. "manager") | Required if role = representative | Representative, step 7 | BUSINESS_INTERNAL | NEVER_AI | Internal | Owner, staff | No |
| `representativeContactEmail` | Optional way to reach the actual owner for manual-review follow-up | Optional | Representative, step 7 | OWNER_PRIVATE | NEVER_AI (manual-review contact only) | Owner + staff only | Staff (manual review only) | No |
| `representativeNote` | Free-text context for manual reviewers | Optional | Representative, step 7 | OWNER_PRIVATE | NEVER_AI | Owner + staff only | Staff (manual review only) | No |
| `manualReviewFlag` | Marks representative-created accounts for additional human review | System-derived (`role === authorized_representative`) | Server | SYSTEM_SECURITY | NEVER_AI | Internal | Staff | No |

## `business_contacts`

| Field key | Purpose | Required | Source | Sensitivity | AI-Use Category | Visibility | Authorized readers | Public-use |
|---|---|---|---|---|---|---|---|---|
| `contactType` (phone/email/website) | What kind of contact this is | Required | Owner, step 6 | BUSINESS_INTERNAL | TASK_SCOPED_AI | Internal metadata | Owner, staff | No (metadata only) |
| `value` | The actual phone/email/URL | Required | Owner, step 6 | SENSITIVE_OPTIONAL — follows this row's own `visibility` field | OWNER_APPROVED_AI while `visibility = private`; PUBLIC_CONTEXT_AI once `visibility = public` | Owner-controlled | Owner, staff; public only if `visibility = public` | Only if `visibility = public` |
| `normalizedValue` | Comparison value for duplicate detection | System-derived | Server | SYSTEM_SECURITY | NEVER_AI | Never displayed | Server processes only | No |
| `label` (main/sales/customer_service/booking/quotes/billing/other — Gate BCO-3R-B.2 renamed `support`→`customer_service` and added `quotes`; existing `support` rows were remapped by the migration, never discarded) | What the contact is for, so customers reach the right line | Optional (defaults `main`) | Owner, step 6 | PUBLIC | PUBLIC_CONTEXT_AI once contact is public | Public if the contact itself is public | Owner, staff, public (if contact public) | Yes (if contact public) |
| `visibility` (public/private) | Owner's explicit control over whether this specific contact is ever shown publicly | Required (defaults `public`) | Owner, step 6 | BUSINESS_INTERNAL (control field itself) | NEVER_AI (control field, not content) | Internal | Owner, staff | No |
| `preferredChannel`, `channelKind` | This specific contact's own preferred channel — the DB enforces at most one preferred contact per business. Distinct from the new business-level `preferredResponseMethod` above. | Optional | Owner, step 6 | PUBLIC | PUBLIC_CONTEXT_AI if contact is public | Public if contact is public | Owner, staff, public (if contact public) | Yes (if contact public) |
| `isPrimary` | Marks the main contact among several — the DB enforces at most one primary contact per business | Optional | Owner, step 6 | BUSINESS_INTERNAL | NEVER_AI (control field, not content) | Internal | Owner, staff | No |
| `capabilities` (calls/sms/whatsapp — Gate BCO-3R-B.2) | Only meaningful for phone contacts: which response channels this number actually supports; the business-level `preferredResponseMethod` is validated against this at finalize time | Optional | Owner, step 6 | PUBLIC | PUBLIC_CONTEXT_AI if contact is public | Public if contact is public | Owner, staff, public (if contact public) | Yes (if contact public) |

## `business_digital_profiles`

| Field key | Purpose | Required | Source | Sensitivity | AI-Use Category | Visibility | Authorized readers | Public-use |
|---|---|---|---|---|---|---|---|---|
| `platform` (google_business/facebook/instagram/tiktok/youtube/linkedin/x/yelp/whatsapp_business/snapchat/pinterest/other — Gate BCO-3R-B.2 added snapchat, pinterest) | Which platform | Required | Owner, step 6 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `handleOrUrl` | The link/handle itself — avoids re-asking for existing presence, prevents duplicate data entry | Required | Owner, step 6 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |

Note: selecting a platform never grants Leonix access to the linked private account — it is a
declared reference link only, per the step-6 "why we ask" copy. The homepage-only-link warning and
handle/URL normalization apply to all 12 platforms.

## `business_custom_links` (Gate BCO-3R-B.2 — repeatable, owner-labeled business links)

| Field key | Purpose | Required | Source | Sensitivity | AI-Use Category | Visibility | Authorized readers | Public-use |
|---|---|---|---|---|---|---|---|---|
| `linkType` (booking/menu_catalog/order_online/portfolio/request_quote/reviews/other) | What kind of link this is (e.g. booking page, menu, online store) | Required | Owner, step 6 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `customLabel` | Free-text description, required only when `linkType = "other"` | Required if `linkType = "other"`, else null | Owner, step 6 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `displayUrl`, `normalizedUrl` | The link itself (display-safe `https://…` form and comparison-only domain form) | Required | Owner, step 6 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `visibility` (public/private) | Owner's explicit control over whether this specific link is ever shown publicly | Optional (defaults `public`) | Owner, step 6 | BUSINESS_INTERNAL (control field itself) | NEVER_AI (control field, not content) | Internal | Owner, staff | No |
| `sortOrder` | Display order among the business's other custom links | System-derived (entry order) | Server | BUSINESS_INTERNAL | NEVER_AI | Internal | Owner, staff | No |

**Staging note:** this table and the `capabilities`/`preferred_response_method` columns above
require migration `20260718120000_business_identity_contact_foundation_v3.sql` to be applied
before they exist on a given environment. Every read path in this package (`businessesRepo.ts`,
`contactsRepo.ts`, `customLinksRepo.ts`) degrades gracefully — via column-shrink retry or an
empty-list fallback — if that migration hasn't run yet, so existing Identity records remain
readable either way.

## `business_service_areas` (`country` + `structuredDetails` JSONB, versioned `schemaVersion: 1`)

| Field key | Purpose | Required | Source | Sensitivity | AI-Use Category | Visibility | Authorized readers | Public-use |
|---|---|---|---|---|---|---|---|---|
| `country` | The global country/territory the business operates from — first field in every location path | Required | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `structuredDetails.customCountryName` | Free-text territory name when `country = "OTHER"` (no stable ISO code) | Optional | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `structuredDetails.streetNumber`, `streetName`, `unit` | Exact physical address components | Optional | Owner, step 5 | OWNER_PRIVATE unless `addressVisibility = public_exact` | OWNER_APPROVED_AI unless `addressVisibility = public_exact` (then PUBLIC_CONTEXT_AI) | Owner-controlled via `addressVisibility` | Owner, staff; public only if exact-address visibility chosen | Only if `addressVisibility = public_exact` |
| `structuredDetails.neighborhood`, `city`, `stateProvince` | City/region-level location | Optional | Owner, step 5 | SENSITIVE_OPTIONAL — city-level is shown whenever `addressVisibility` is `public_exact` or `city_only` | OWNER_APPROVED_AI when `addressVisibility = private`; PUBLIC_CONTEXT_AI otherwise | Owner-controlled | Owner, staff, public (unless `addressVisibility = private`) | Unless `addressVisibility = private` |
| `structuredDetails.postalCode` | Exact postal code | Optional | Owner, step 5 | OWNER_PRIVATE unless `addressVisibility = public_exact` | OWNER_APPROVED_AI unless `addressVisibility = public_exact` (then PUBLIC_CONTEXT_AI) | Owner-controlled | Owner, staff; public only if exact-address visibility chosen | Only if `addressVisibility = public_exact` |
| `structuredDetails.addressVisibility` (`public_exact`/`city_only`/`private`) | The owner's explicit control over how much of the physical address is ever shown publicly | Required for physical locations | Owner, step 5 | BUSINESS_INTERNAL (control field itself) | NEVER_AI (control field, not content) | Internal | Owner, staff | No |
| `structuredDetails.interactionMode`, `coverageType`, `serviceRadius`, `radiusUnit`, `citiesServed`, `regionsServed`, `customCoverageDescription` | Describes mobile/regional service coverage so customers know if the business reaches them | Optional, shown per selected operating model | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `structuredDetails.postalCodesServed` | Postal codes covered by mobile/regional service | Optional | Owner, step 5 | SENSITIVE_OPTIONAL | PUBLIC_CONTEXT_AI (shown alongside the coverage description it belongs to) | Public unless owner narrows visibility in a future release | Owner, staff, public | Yes |
| `structuredDetails.countriesServed`, `languagesServed`, `timezone` | Describes online/remote service reach | Optional, shown for online/remote model | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `structuredDetails.nationwide`, `international` | Coverage-scope flags | Optional | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `structuredDetails.hasMultipleLocations`, `approximateLocationCount` | Signals a multi-location business ahead of full multi-location management (future phase) | Optional | Owner, step 4 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `structuredDetails.baseCity`, `baseStateProvince` | Base city/region for a mobile business with no public storefront | Optional | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `structuredDetails.basePostalCode` | Base postal code for a mobile business | Optional | Owner, step 5 | SENSITIVE_OPTIONAL | OWNER_APPROVED_AI | Owner-controlled | Owner, staff, public | Yes |
| `rawText` | Human-readable composed summary of the structured fields, used for search/duplicate matching | System-derived from structured fields | Server, at submit | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `normalizedText` | Comparison value for duplicate detection | System-derived | Server | SYSTEM_SECURITY | NEVER_AI | Never displayed | Server processes only | No |

### `structuredDetails.coverage` (Gate BCO-3R-B.3 — strict versioned `schemaVersion: 1` shape, replaces the scattered `coverageType`/`nationwide`/`international` fields above for any record created after this gate; those legacy fields remain readable, untouched, for older records)

| Field key | Purpose | Required | Source | Sensitivity | AI-Use Category | Visibility | Authorized readers | Public-use |
|---|---|---|---|---|---|---|---|---|
| `coverage.level` (local/multi_city/one_state/multi_state/nationwide/multi_country/worldwide) | The single primary "how far does your business serve?" answer that drives every other coverage field below | Required once any coverage field is edited | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `coverage.radiusValue`, `coverage.radiusUnit` | Local-coverage radius and unit (5/10/25/50/100 miles or km, or a custom value) | Optional (level = `local`) | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `coverage.nearbyNeighborhoods`, `coverage.localNote` | Optional nearby-neighborhood chips and a short free-text note for local coverage | Optional (level = `local`) | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `coverage.citiesServed`, `coverage.citiesStateProvince` | The specific cities served (multi-word/accented names supported) and an optional state/province used only to narrow the city search | Required (level = `multi_city`, ≥2 cities) | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `coverage.stateProvince` | The single state/province/region served | Required (level = `one_state`) | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `coverage.statesProvincesServed`, `coverage.multiStateSelectAllConfirmed` | The states/provinces served, and whether the owner explicitly chose "select all" for the already-selected country | Required (level = `multi_state`, ≥2 regions) | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `coverage.excludedStatesProvinces`, `coverage.excludedCitiesOrAreas` | Optional carve-outs from a state/nationwide/multi-state selection (e.g. "all of the US except Alaska and Hawaii") | Optional | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `coverage.nationwideConfirmed` | Explicit confirmation that the business serves the whole selected country — never inferred silently | Required (level = `nationwide`) | Owner, step 5 | BUSINESS_INTERNAL (control field itself) | NEVER_AI (control field, not content) | Internal | Owner, staff | No |
| `coverage.countriesServedCodes`, `coverage.excludedCountries` | ISO 3166-1 country codes served/excluded for multi-country or worldwide coverage | Required for `multi_country` (≥2 countries); optional exclusions elsewhere | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `coverage.regionSelections` (`regionCode`, `wholeRegion`, `countryCodes`) | Audit record of a region-shortcut "select all countries in this region" action — the region code is never itself the stored coverage, only a record of how the resolved `countryCodes` were chosen | System-derived from the owner's explicit "select all" confirmation, step 5 | BUSINESS_INTERNAL | TASK_SCOPED_AI (informs the review/completed-profile summary's "N countries in [region]" phrasing) | Internal | Owner, staff | No |
| `coverage.worldwideConfirmed` | Explicit confirmation of worldwide availability — never inferred from selecting the "worldwide" level alone | Required (level = `worldwide`) | Owner, step 5 | BUSINESS_INTERNAL (control field itself) | NEVER_AI (control field, not content) | Internal | Owner, staff | No |
| `coverage.primaryTimeZone`, `coverage.additionalTimeZones` | Time zone(s) the worldwide/remote business operates in, so customers know when to expect a response | Optional | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |
| `coverage.deliveryModels`, `coverage.deliveryModelOtherNote` (fully_remote/digital_delivery/shipping/consultation/other) | How a worldwide/remote business actually delivers its service — prevents "worldwide" from silently implying physical shipping | Optional (level = `worldwide`) | Owner, step 5 | PUBLIC | PUBLIC_CONTEXT_AI | Public | Owner, staff, public | Yes |

**Note:** `structuredDetails.languagesServed` (documented above under the legacy coverage row) is reused as-is for the worldwide flow's "languages you serve in" field — not duplicated into `coverage`.

## `business_listing_links` (connected Leonix advertisements)

| Field key | Purpose | Required | Source | Sensitivity | AI-Use Category | Visibility | Authorized readers | Public-use |
|---|---|---|---|---|---|---|---|---|
| `listingSource`, `listingId` (Leonix Ad ID) | Identifies which existing Leonix listing this Identity is linked to | Optional | Auto-discovery (`discoverOwnedListingCandidates`) or manual fallback, step 8 | BUSINESS_INTERNAL | TASK_SCOPED_AI (e.g. cross-referencing the owner's existing ads) | Internal (shown to the owner as their own confirmation, not to other users) | Owner, staff | No |
| `relationshipRole`, `status`, `linkedBy`, `linkedAt`, `verifiedAt` | Audit trail of how/when the link was established and verified | System-derived | Server | SYSTEM_SECURITY | NEVER_AI | Internal audit only | Staff | No |
| Discovery display fields: `displayName`, `city`, `imageUrl` (per candidate, before linking) | Lets the owner recognize their own listing in the candidate card | Read-only, sourced per-category from each source's own already-audited safe select — see `listingLinking.ts` | Existing category tables, scoped to the caller's own rows | Same as the source listing's own classification (already public/owner-facing data, just narrowed to "yours") | TASK_SCOPED_AI (listing-confirmation task only) | Owner-only during discovery | Owner | No (candidate cards are pre-link, not published) |

## Draft-only fields (never persisted past finalization)

| Field key | Purpose | Required | Source | Sensitivity | AI-Use Category | Notes |
|---|---|---|---|---|---|---|
| `setupLanguage` | The wizard's own ES/EN interface language — the single source of truth for the active UI language throughout the flow; becomes `businesses.primaryLanguage` at finalize time | Required | Owner, step 1; re-asserted from the URL on every hydrate so it can never silently drift from what's on screen | BUSINESS_INTERNAL | NEVER_AI | Lives only in `business_onboarding_drafts.draft_payload` (JSONB) until finalize; not a separate column afterward |
| `listingsSkipped` | Records that the owner explicitly said "none of these are mine" in step 8, distinct from simply not having acted yet | Optional | Owner, step 8 | BUSINESS_INTERNAL | NEVER_AI | UI-only; not part of the finalize-v2 backend contract |

## Explicitly out of scope for AI use

Per the completed-Identity "How Leonix uses this information" doctrine: Leonix's AI systems may
read `TASK_SCOPED_AI`/`PUBLIC_CONTEXT_AI` fields to personalize guidance for the specific task at
hand, and `OWNER_APPROVED_AI` fields only for a task the owner has explicitly authorized — never
`NEVER_AI` fields, under any circumstance. No AI system ever treats an absent/unconfirmed field as
a fact, never infers a value the owner didn't provide, and consequential actions (anything with a
real-world effect) always require human or owner approval — an AI suggestion is never
auto-executed as if it were owner-confirmed.
