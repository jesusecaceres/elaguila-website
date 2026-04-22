/**
 * En Venta canonical publish / persistence contract (free MVP + boost hooks).
 *
 * ## Runtime DB contract (staging / internal QA)
 * - **Authoritative table:** `public.listings` (Supabase).
 * - **Browse category:** `category = 'en-venta'`.
 * - **Public visibility:** `status = 'active'` AND `is_published IS NOT false` (drafts use `is_published = false` or `status = 'draft'` — see dashboard drafts).
 * - **Ownership:** `owner_id` = `auth.users.id` from the browser session at publish time (same field `fetchOwnerListingsForDashboard` filters on).
 * - **Results/detail/admin:** all read this row; filters map from `detail_pairs`, `city`, `zip`, `seller_type`, `price`, `images`, etc.
 * - **Not stored here:** global site banners (`site_section_content`) — those are unrelated to classified publish.
 *
 * ## Image policy (En Venta publish — `publishEnVentaFromDraft`)
 * - **0 photos in wizard:** row is created as non-public draft, then finalized `active` + published; `gallery=none`.
 * - **≥1 photo:** row stays `draft` + unpublished until **every** ordered image uploads to `listing-images`; then finalize.
 * - **Any upload shortfall:** publish errors; row is set `removed` + `is_published=false` (never public; no `delete()` dependency).
 *
 * ## Field coverage (Free/Pro application → `listings` / `detail_pairs` → surfaces)
 * | Field | Stored | Detail | Results filter | Sort | Notes |
 * |-------|--------|--------|----------------|------|-------|
 * | title, description (+ wear/accessories/extra lines) | `title`, `description` | ✓ | `q` (text) | — | Long text in description |
 * | price, priceIsFree | `price`, `is_free` | ✓ | `priceMin`/`priceMax`, `free` | price asc/desc | `priceNumFromRow` uses 0 when `is_free` |
 * | rama, evSub, itemType, condition | `detail_pairs` + `Leonix:*` | ✓ specs | `evDept`, `evSub`, `cond` | — | Machine keys in `enVentaPublishFromDraft` |
 * | city, zip | `city`, `zip` (optional col) | ✓ | `city`, `zip`, geo hint | — | Canonical via `validateEnVentaLocation` |
 * | pickup, shipping, localDelivery | `Leonix:pickup/ship/delivery` + human row | ✓ | `pickup`/`ship`/`delivery` | — | Parsed in `enVentaDetailPairSignals.ts` |
 * | meetup | `Leonix:meetup` + Encuentro pair | ✓ | `meetup` | — | Distinct from pickup |
 * | negotiable | `Leonix:negotiable` + label pair | ✓ chip | `nego` | — | |
 * | brand, model | `Leonix:brand`, `Leonix:model` | ✓ (pretty label) | `q` | — | Not separate facet filters (use search) |
 * | quantity | Cantidad/Quantity pair | ✓ | `q` | — | |
 * | seller_kind, displayName | `seller_type`, `business_name` | ✓ | `seller` | — | |
 * | contact | `contact_phone`, `contact_email` | ✓ (resolver) | — | — | Not publicly filterable |
 * | images | `images` + description marker | ✓ | — | — | Gallery |
 * | mux / video | mux_* cols + description | ✓ | — | — | Pro |
 * | confirmations | not stored | — | — | — | Gate only |
 *
 * ## Internal QA (dev / staging, signed-in seller)
 * 1. Publish En Venta from `/clasificados/publicar/en-venta/...` — expect real Supabase insert (not only local draft).
 * 2. Success panel: `data-testid="ev-publish-success"` — open detail link, then results scoped links.
 * 3. Results: `/clasificados/en-venta/results` — listing visible only if `isEnVentaListingPubliclyVisible` (see `en-venta/lib/enVentaListingVisibility.ts`).
 * 4. Dashboard: `/dashboard/mis-anuncios` — row for same `owner_id`.
 * 5. Admin: `/admin/workspace/clasificados` — same `listings` row.
 * 6. Global site-settings (`/admin/site-settings`) does not publish classifieds; banners only.
 * 7. Launch checklist page: `/clasificados/en-venta/launch-checklist` (dev or `NEXT_PUBLIC_EV_INTERNAL_QA=1` only).
 */

import type { EnVentaConditionValue } from "../shared/fields/enVentaTaxonomy";

export type EnVentaSellerKind = "individual" | "business";

export type EnVentaPlanTier = "free" | "pro" | "business";

/** Wizard + draft payload (subset persisted in listing_drafts.draft_data.details). */
export type EnVentaDraftDetails = {
  rama: string;
  evSub?: string;
  itemType: string;
  condition: EnVentaConditionValue | string;
  brand?: string;
  model?: string;
  negotiable?: "" | "yes";
  /** Canonical California city when resolved (matches `CA_CITIES`). */
  city?: string;
  zip?: string;
  pickup?: "" | "1";
  shipping?: "" | "1";
  delivery?: "" | "1";
  seller_kind?: EnVentaSellerKind | "";
  /** Future: plan_tier, featured_rank, boost_until stored server-side or in metadata. */
  plan_tier?: EnVentaPlanTier;
};

export type EnVentaInsertExtras = {
  seller_type: "personal" | "business";
  detail_pairs: Array<{ label: string; value: string }> | null;
};

export const EN_VENTA_MODERATION_REASONS = [
  "prohibited_item",
  "counterfeit",
  "misleading_price",
  "spam",
  "duplicate",
] as const;

export type EnVentaModerationReason = (typeof EN_VENTA_MODERATION_REASONS)[number];
