# Restaurantes — field coverage (application → discovery → surfaces)

**Sources of truth**

- Application / draft: `application/restauranteListingApplicationModel.ts`, `application/restauranteDraftTypes.ts`, `application/createEmptyRestauranteDraft.ts`
- Persisted row: `supabase/migrations/20260408120000_restaurantes_public_listings.sql` + `draftToRestaurantePublicListingInsert` in `lib/restaurantesPublicListingMapper.ts` (`listing_json` = full merged draft)
- Public discovery row: `mapRestaurantesPublicListingDbRowToShellInventoryRow` (same file) + `lib/filterRestaurantesBlueprintRows.ts`
- Open-now derivation: `lib/restauranteOpenNowFromHours.ts` over `listing_json` weekly hours (timezone default `America/Los_Angeles`)

**Legend:** “Searchable” = included in free-text `q` blob on the discovery row unless noted.

| Field | Source file/model | Persisted? | Public detail? | Result card? | Searchable (`q`)? | Filterable? | Sort / exposure? | Notes |
| ----- | ----------------- | ------------ | ---------------- | -------------- | ----------------- | ----------- | ------------------ | ----- |
| `draftListingId` | draft | `draft_listing_id` col | — | — | no | no | no | Owner republish key; admin diagnostic |
| `businessName` | identity | col + json | yes | title | yes | via deep-link `q` (not separate param) | sort name | |
| `businessType` | identity | col + json | yes | — | no | `biz` URL | exposure mix | |
| `primaryCuisine` | identity | col + json | yes | primary key line | yes | `cuisine` | exposure | |
| `secondaryCuisine` | identity | col + json | yes | — | yes | `cuisine` | — | |
| `additionalCuisines[]` | identity | json only | yes | — | yes | `cuisine` if key matches | — | Mapped to `additionalCuisineKeys` on shell row for search/cuisine filter |
| `shortSummary` | identity | col + json | yes | cuisine line | yes | — | — | `cuisineLine` prefers draft summary |
| `longDescription` | identity | json | yes | — | **intentionally no** | no | — | Long text stays detail-only (avoid bloating index) |
| `cityCanonical` | identity | col + json | yes | city | yes | `city` | — | |
| `zipCode` | identity | col + json | yes | zip | yes | `zip` | — | |
| `neighborhood` | identity | col + json | yes | optional | yes | — | — | In `q` blob |
| `priceLevel` | identity | col + json | yes | — | no | `price` | — | |
| `languagesSpoken` | identity | json | yes | — | **intentionally no** | no | — | Detail / trust; not a current discovery axis |
| `serviceModes[]` | operating | col + json | yes | implied chips | no | `svc` (whitelisted) | — | Shell row carries full taxonomy modes |
| `dineIn` / `takeout` / `delivery` booleans | operating | json | yes | CTA copy | no | covered by `serviceModes` / `svc` | — | Publish path relies on `serviceModes` for discovery |
| `reservationsAvailable` | operating | json | yes | — | no | **not URL-filtered** | — | Could add future `svc`/`hl`; not in MVP URL contract |
| `cateringAvailable` / `eventFoodService` | operating | json | yes | — | no | partial via `catering`/`events` **service mode** if user selects those modes at publish | — | |
| `preorderRequired` / `pickupAvailable` | operating | json | yes | — | no | no | — | Detail + CTA semantics |
| `movingVendor` | operating | col + json | yes | — | no | `mv` | — | |
| `homeBasedBusiness` | operating | col + json | yes | — | no | `hb` | — | |
| `foodTruck` | operating | col + json | yes | — | no | `ft` | — | |
| `popUp` | operating | col + json | yes | — | no | `pu` | — | |
| `personalChef` | operating | json | yes | — | no | no | — | Overlaps conceptually with `personal_chef` **service mode** when set in modes |
| `monday`…`sunday` | hours | json | yes | hours UI | no | `open` (derived) | — | `openNowDemo` from `restauranteOpenNowFromHours`; `temporaryHoursActive` forces closed for filter |
| `specialHoursNote` / `temporaryHours*` | hours | json | yes | — | no | affects `open` when temp active | — | Conservative: temp active ⇒ not “open now” for discovery |
| Contact URLs / phone / email | contact | json | yes | — | partial (email/phone not duplicated in `q` blob) | no | — | `q` matches name/city/cuisine/summary; not full contact string (privacy + noise) |
| `addressLine*` / `state` / `serviceAreaText` | location | json | yes | map/address | partial (`serviceAreaText` not in `q` by default) | no | — | Detail-first |
| `deliveryRadiusMiles` / `locationPrivacyMode` | location | json | yes | — | no | no | — | Operational / compliance; not discovery filters |
| `heroImage` / gallery / video | media | json (+ `hero_image_url` col) | yes | card image | no | no | — | Hero denormalized for listing performance |
| `featuredDishes[]` | media/extra | json | yes | — | **intentionally no** in `q` | no | — | Avoid partial dish match noise; can promote to `q` later with indexing story |
| `highlights[]` | extras | col + json | yes | — | no | `hl`, `family`, `diet` | — | |
| `movingVendorStack` etc. | stacks | json | yes | detail modules | no | no | — | Stacks are detail-first |
| `googleReviewUrl` / `yelpReviewUrl` | trust | json | yes | — | no | no | — | |
| `externalRatingValue` / `externalReviewCount` | trust | col + json | yes | rating line | no | `top` shortcut | sort rating | |
| `testimonialSnippet` | trust | json | yes | — | no | no | — | |
| `slug` | publish/runtime | col | URL | slug link | no | no | — | Stable after first insert |
| `status` | DB | col | public only if `published` | — | no | no | — | Admin suspend removes from public read policy |
| `promoted` | DB / admin | col | badge/band | promoted band | no | no | **promoted band + sort tie** | Owner cannot self-set unless API extended (body `promoted` optional; default preserve) |
| `leonix_verified` | DB / admin | col | badge | verified chip | no | no | exposure could be extended | Currently badge + registry trust signal |
| `package_tier` | DB | col | — | — | no | no | no | Owner/admin visibility |
| `owner_user_id` | publish | col | — | — | no | no | no | RLS + dashboard |
| `published_at` / `updated_at` | DB | col | — | — | no | no | sort newest | `listedAt` |

---

## Gaps addressed in this launch pass

- **Live inventory only** in production path; blueprint is **opt-in** env only.
- **Full `serviceModes`** on discovery rows (not truncated to three).
- **`additionalCuisines`** participate in cuisine filter + `q` search via shell row.
- **Open-now** filter uses real weekly hours from `listing_json` (with documented temp-hours behavior).
- **Publish API** never returns success without persistence.
- **Republish** preserves admin flags and suspension state unless explicitly changed.
- **Admin mutations** are real (with audit + revalidate).
- **Owner “load into form”** enables true update loop without duplicate rows.

## Intentional non-goals (for now)

- Full-text search inside `longDescription`, dish titles, or phone numbers (privacy/indexing tradeoff).
- Separate URL filters for every boolean (`reservationsAvailable`, etc.) — covered indirectly via `serviceModes` / highlights where applicable.
- Geospatial radius discovery (`near` with coords) — contract still intent-only without coords, unchanged.
