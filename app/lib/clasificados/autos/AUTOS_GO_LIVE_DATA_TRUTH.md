# Autos go-live: data source of truth

## 1. Two storage models (verified in repo)

| Model | Storage | Consumed by |
|-------|---------|-------------|
| **Paid Leonix Autos** | Supabase table `autos_classifieds_listings` — JSON `listing_payload` typed as `AutoDealerListing`, columns `lane`, `status`, Stripe ids, `published_at` | Public: `GET /api/clasificados/autos/public/listings`, `GET .../public/listings/[id]`; publish: `/api/clasificados/autos/listings`, `/checkout`, webhook, `checkout/verify`; dashboard: `AutosLeonixPaidListingsSection`, `DashboardAutosPaidDraftsBand`; admin: `/admin/workspace/clasificados/autos` |
| **Generic classifieds** | Supabase table `listings` — `category`, `status`, `is_published`, etc. | `/clasificados/anuncio/[id]`, dashboard `mis-anuncios` for rows where `category === "autos"` (legacy/generic), **not** the paid Autos shell |

## 2. Launch truth for `/clasificados/autos` (public category)

**Source of truth:** `autos_classifieds_listings` with **`status === "active"`** only, mapped by `mapAutosClassifiedsToPublic.ts` → `AutosPublicListing`.

Generic `listings` rows with `category: autos` are **not** merged into the public Autos browse API in code reviewed for this closure.

## 3. Operator / seller clarity

- **Publish path:** `/publicar/autos` → creates/updates rows only in `autos_classifieds_listings`.
- **Dashboard “Autos (paid)”** section: fetches `/api/clasificados/autos/listings` (owner bearer) — same table.
- **Admin Autos panel:** lists `autos_classifieds_listings` with status, Stripe hint, featured flag, public URL when `active`.
- **Misleading overlap risk:** A user could theoretically have both a generic `listings` autos row and a paid row; UIs do not dedupe them. Mitigation: admin/workspace copy distinguishes “Cola genérica listings” vs “Autos (pagos Leonix)”; this doc states the split.

## 4. Resolution statement

| Question | Answer |
|----------|--------|
| Which is truth for public Autos browse? | **`autos_classifieds_listings` active rows** |
| Are both exposed in the same grid? | **No** — public Autos API does not read `listings`. |
| Must operators know both? | Only if legacy generic autos ads exist; paid launch uses **paid table only** for `/clasificados/autos`. |

## 5. Alignment rules (dashboard / admin / public)

| Surface | Query / source | “Live on Autos” meaning |
|---------|----------------|-------------------------|
| Public landing/results/detail | `GET /api/clasificados/autos/public/listings` (+ `[id]`) | Row exists **and** `status === "active"` in `autos_classifieds_listings`. |
| Seller dashboard (paid Autos) | `GET /api/clasificados/autos/listings` (owner JWT) | Same table; labels from `autosClassifiedsVisibility.ts` must match DB `status`. |
| Admin workspace Autos | Server list of `autos_classifieds_listings` | Same table; columns for Stripe ids / featured / URL must reflect same row the seller sees. |
| Generic `mis-anuncios` / `listings` | `listings` table | **Different product** — can show legacy `category=autos` without implying paid Autos publish state. |

**Deprecated / non-launch for Leonix Autos category:** using only generic `listings` for `/clasificados/autos` browse — **not implemented**; launch truth is the **paid** table as above.

## 6. Browse ordering vs row lifecycle (this pass)

- Public cards receive `publicSortTimestamp` from `max(published_at, updated_at)` in `mapAutosClassifiedsToPublic.ts`.
- “Newest” sort (`sortAutosPublicListings` → `compareNewestAutosPublic` in `app/lib/clasificados/autos/autosPublicRanking.ts`) prefers that timestamp, then year/price, then the fairness tie-break in `autosPublicListingScore.ts`.
- **Republish / renew semantics:** there is no separate `renewed_at` column; any legitimate refresh that bumps `updated_at` (seller edit, admin correction, future explicit “Refresh listing” action) surfaces as more recent in browse **without** implying a consumer “Boost” SKU. Product copy uses “Renew / Refresh / Republish listing” language only.

## 7. Landing vs results arrangement (read paths)

| Surface | Builder | Inputs |
| ------- | ------- | ------ |
| Landing dealer band | `getLandingDealerSpotlightListings` | `app/(site)/clasificados/autos/data/autosLandingArrangement.ts` — API or demo inventory |
| Landing private band | `getLandingPrivateFreshListings` | same |
| Landing mixed tail | `getLandingMixedLatestListings` | excludes IDs already shown in the two bands above |
| Results featured/recent/main | `partitionAutosResultsVisibility` | `app/(site)/clasificados/autos/lib/autosPublicResultsVisibility.ts` — recent lane injects a private row if the first slice would otherwise be dealer-only |
