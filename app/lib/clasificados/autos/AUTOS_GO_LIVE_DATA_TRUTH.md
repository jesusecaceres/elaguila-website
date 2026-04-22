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
