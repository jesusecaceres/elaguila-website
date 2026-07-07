# OWNER-DASHBOARD-GLOBAL-EDIT-HYDRATION-STANDARD-01

## QA problem (Chuy)

From `https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=servicios`, clicking **Editar anuncio** opened a Servicios form that looked like a new/blank draft instead of the saved listing. **Vista previa** showed *"La vista previa necesita unos datos más"* because preview read an empty or stale browser draft.

URL correctness from **OWNER-DASHBOARD-GLOBAL-CTA-STANDARD-01** was necessary but not sufficient. Dashboard CTAs must **hydrate** the real saved listing.

## Why URL correctness was not enough

Correct query params (`edit=1`, `source=dashboard`, `mode=listing-edit`, listing identity) only route to the right screen. The application and preview clients must:

1. Owner-authenticate and fetch `/api/clasificados/servicios/my-listing`
2. Map `profile_json` → application draft via `serviciosPublishedToApplicationDraft`
3. Replace stale session draft in dashboard edit mode
4. Preview with `preview=listing` must fetch the same listing — not rely on empty local storage

## Files inspected

- `app/(site)/dashboard/mis-anuncios/page.tsx`
- `app/(site)/dashboard/servicios/page.tsx`
- `app/(site)/dashboard/lib/dashboardInventory.ts`
- `app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts`
- `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx`
- `app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts`
- `app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx`
- `app/api/clasificados/servicios/my-listing/route.ts` (read-only)

## Files changed

- `ClasificadosServiciosApplication.tsx` — dashboard edit clears stale draft, fetches my-listing (id → slug → leonixAdId), blocks UI on load failure
- `serviciosPublishedToApplicationDraft.ts` — full profile → draft mapping including coupons/offers/media/listing product
- `ClasificadosServiciosPreviewClient.tsx` — `preview=listing` + listing identity fetches DB listing
- `serviciosDashboardOffersAddonCheckout.ts` — `serviciosListingPreviewHref`
- `dashboardInventory.ts` — inventory edit/preview hrefs carry listing identity
- `dashboard/servicios/page.tsx` — Preview links with `preview=listing`
- `scripts/verify-owner-dashboard-global-edit-hydration-standard-01.mjs`
- `package.json` — verifier script
- `docs/owner-dashboard-global-edit-hydration-standard-01.md`

## OWNER_EDIT_HYDRATION_CONTRACT

For every category dashboard edit/preview CTA:

| Field | Requirement |
|-------|-------------|
| `category` | Category slug (`servicios`, `restaurantes`, …) |
| `listingSource` / `sourceTable` | Owner API source table |
| `listingId` | UUID when available |
| `listingSlug` | Public slug |
| `leonixAdId` | Leonix ad id when available |
| `ownerUserId` | Validated server-side on my-listing API |
| `mode` | `listing-edit` \| `offers-edit` \| `offers-addon` |
| `focus` | e.g. `coupon-upgrade` for offers flows |
| `returnPanel` | Dashboard return target |
| `hydrateStrategy` | Owner fetch → published-to-application mapper → storage handoff |
| `applicationMapper` | Category-specific (Servicios: `serviciosPublishedToApplicationDraft`) |
| `mediaStrategy` | Public URLs pass through; IDB only for unpublished blobs |
| `previewStrategy` | `preview=listing` + identity → same owner fetch + mapper |
| `noDuplicateListingGuarantee` | Preserve identity; never route existing listing to new-app product URL |

### Route semantics

- `mode=listing-edit` — load existing listing, normal edit flow
- `mode=offers-edit` — load listing, focus coupons when active
- `mode=offers-addon` — load listing, coupon step with inactive add-on CTA (no fake `couponsAddOn`)
- `preview=listing` — preview hydrates from DB, not empty local draft
- `source=dashboard` + listing identity — never blank new application

## Servicios implementation

### Application edit hydration

When `edit=1` + listing identity (+ `source=dashboard`):

1. Clear stale Servicios session/IDB draft
2. `GET /api/clasificados/servicios/my-listing?id|slug|leonixAdId` (strongest identity first)
3. `serviciosPublishedToApplicationDraft(listing)` → `saveClasificadosServiciosApplicationResolved`
4. Block form until ready; on failure show error + return to dashboard (no blank form)

### Published-to-application mapping

`serviciosPublishedToApplicationDraft` maps identity, business, contact, about, services, media, hours, coupons (`couponsAddOn`, `couponFlyer`, `couponMoreOffers`), and sets `listingProduct` / `baseMonthlyPrice` for existing listing edit (no base recharge).

### Preview hydration

`serviciosListingPreviewHref` produces:

```
/clasificados/publicar/servicios/preview?lang=…&edit=1&source=dashboard&preview=listing&listingId=…&listingSlug=…&leonixAdId=…&returnPanel=servicios
```

Preview client detects `preview=listing` or `source=dashboard` + identity, fetches my-listing, maps to draft, renders preview (skips draft-only readiness gate for listing-bound preview).

### `/dashboard/servicios`

- **Edit listing** → `serviciosListingEditHref` (`mode=listing-edit`)
- **Preview** → `serviciosListingPreviewHref` (`preview=listing`)
- View showcase / results / pause-resume unchanged

## Mis anuncios protection

**OWNER-DASHBOARD-GLOBAL-CTA-STANDARD-01** preserved: Mis anuncios still passes `serviciosListingEditHref` / `serviciosOffersEditHref` overrides. Inventory `previewHref` now includes listing identity for Servicios.

Restaurante Mis anuncios callbacks (`onCouponUpgrade` / `onCouponEdit`) untouched.

## Future category checklist

For each category gate:

1. CTA URL contract (edit / preview / public / results)
2. Edit hydration contract (`mode`, identity, owner fetch)
3. Preview hydration contract (`preview=listing` or equivalent)
4. Published-to-application mapper
5. Media hydration (public URLs + draft IDB rules)
6. Add-on / inventory hydration if applicable
7. Category dashboard surface (`/dashboard/{category}`)
8. Global Mis anuncios surface
9. Category pipeline verifiers (P0A…)
10. TRUE/FALSE audit in doc + verifier

**Reference implementations:**

- Restaurantes — dashboard coupon hydration (read-only reference)
- Servicios — proof implementation (this gate)
- Bienes — parent + child property inventory mapper
- Autos dealer — dealer parent + vehicle inventory mapper
- Ofertas — flyer/coupon/AI specials mapper
- Clases — free/paid mapper
- No-upgrade categories — simpler edit/preview mapper only

## Pipeline standard

```
Dashboard CTA
  → category + listing identity params
  → owner-authenticated fetch (correct table/API)
  → published-to-application mapper
  → media / coupons hydrate
  → preview uses DB-backed draft
  → no blank new app / no duplicate listing / no base package recharge
```

## What was protected

- Stripe prices / webhook raw body
- Supabase migrations / schema
- Restaurante runtime
- Servicios P0A / P0B / P0C verifiers
- OWNER-DASHBOARD-GLOBAL-CTA-STANDARD-01
- Publish media guards

## Manual QA checklist

### 1. Servicios Mis anuncios

https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=servicios

- [ ] Editar anuncio → `/clasificados/publicar/servicios` with `edit=1`, `source=dashboard`, `mode=listing-edit`, listing identity
- [ ] Form shows saved business name, services, images, coupons (not blank)
- [ ] Vista previa → preview with `preview=listing` + identity; no *"necesita unos datos más"* for valid listing

### 2. Servicios category dashboard

https://leonixmedia.com/dashboard/servicios?lang=es

- [ ] Edit listing hydrates saved application
- [ ] Preview hydrates saved listing
- [ ] View showcase / results / pause-resume unchanged

### 3. Restaurante regression

https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=restaurantes

- [ ] Existing CTA behavior still works

## TRUE/FALSE audit

| Check | Result |
|-------|--------|
| global edit hydration contract documented | TRUE |
| future category checklist documented | TRUE |
| Servicios edit fetches owner DB listing | TRUE |
| Servicios edit maps DB listing to application draft | TRUE |
| Servicios edit replaces stale local draft in dashboard mode | TRUE |
| Servicios business/contact/about/services hydrate | TRUE |
| Servicios images/media hydrate | TRUE |
| Servicios coupons/flyer/moreOffers hydrate | TRUE |
| Servicios preview from dashboard hydrates DB listing | TRUE |
| Servicios preview no missing-data screen for valid listing | TRUE |
| /dashboard/servicios edit route fixed | TRUE |
| /dashboard/servicios preview route fixed | TRUE |
| Mis anuncios CTA standard preserved | TRUE |
| Restaurante behavior preserved | TRUE |
| no duplicate listing risk introduced | TRUE |
| no Stripe webhook changed | TRUE |
| no Supabase migration changed | TRUE |
| no Restaurante runtime changed | TRUE |

## READY TO COMMIT status

Run `npm run verify:owner-dashboard-global-edit-hydration-standard-01` and `npm run build` before commit.
