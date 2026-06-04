# Category Listing Monetization Read Model

Gate E adds a read-only category/listing monetization model for Leonix / El Águila. It is a foundation for later Admin and Dashboard displays; it is not a checkout, pricing, promo, notification, or schema gate.

**Gate G0:** Official Print-to-Digital visibility policy lives in [`docs/print-to-digital-visibility-policy.md`](./print-to-digital-visibility-policy.md). That policy defines package tiers, digital benefit ladders, V1 category scope, public labels, and future `visibility_rank_bucket` concepts. Gate E/F describe **what tools and metadata are readable today**; Gate G0 describes **how print and digital visibility should rank later** without implementing sort yet.

**Gate G1:** Shared read-only ranking helper at `app/lib/listingPlans/printDigitalVisibilityRank.ts` exports `resolveListingVisibilityRank` and `compareVisibilityRank`. It encodes Gate G0 buckets and weights but **does not apply sorting** on public pages yet. Callers must run search/filter first, then compare rank weights; ties preserve existing order. Optional `monetization` input may pass a Gate E `CategoryListingMonetizationSummary` for republish metadata. Categories opt in per vertical in later gates (e.g. G2-SERVICIOS).

**Gate G1.6:** Official Print Package Entitlement spec in [`docs/print-package-entitlement-model.md`](./print-package-entitlement-model.md). Gate G1.5 paused Gate G2 because cupones, `promoted`, `package_tier`, Stripe metadata, and republish alone are partial/inconsistent. **Package entitlement** (future `ListingPackageEntitlement` rows) is the **future source of truth** for print-to-digital ranking; promo codes and payments are not. This gate is docs/spec only—no schema migration, no public sorting.

**Gate G1.6A / G1.6B (implementation notes):** Resolver at `app/lib/listingPlans/packageEntitlements.ts` and [`docs/package-entitlement-model.md`](./package-entitlement-model.md). `resolvePackageEntitlement` maps tier → benefits → visibility bucket with defensive date reads. Admin generator may live at `/admin/workspace/package-entitlements`. Future ranking must read entitlements after search/filter on matching results only.

## Account Metadata Is Not Listing Monetization

User account fields such as `profiles.membership_tier` and `profiles.account_type` describe who the person is. They must not decide what a specific listing can do.

The category listing tier is the listing-level read model: what that ad/category can show, what tools are readable, what is locked or unsupported, and what metadata is missing. `business_lite` and `business_premium` remain account/profile vocabulary only; they are not category monetization truth.

En Venta `gratis` / `pro` stays En Venta-specific unless another category explicitly adds its own resolver rule. Other categories must use category/listing fields and the shared resolver rather than inheriting global account status.

## Source Of Truth

Code source: `app/lib/listingPlans/categoryListingMonetization.ts`

The resolver exports `resolveCategoryListingMonetization(input)` and returns a `CategoryListingMonetizationSummary` (Admin-compatible) that extends `CategoryListingMonetizationResult` with flat `warnings`, `planLabel`, `planSource`, and `source`.

Structured outputs:

- `category`, `sourceTable`, `sourceId`, `internalId`, `leonixAdId`, `slug`
- `displayPlanLabel`, `planKind`, `listingTier`
- `accountTierIgnored: true` (always)
- `tools`: `Record<CategoryListingToolKey, CategoryListingToolState>` with `key`, `status`, `label`, `reason`, `source`
- `metadata`: republish, expiration, promoted/featured/verified flags, package tier, optional entitlement id
- `catalogWarnings` and `gaps`: structured `CategoryListingMonetizationWarning` entries (`code`, `message`, `severity`, `source`)
- `isClientReady` and `pipelineClassification` per category
- flat `warnings[]` for legacy Admin chips

The helper accepts explicit identity fields, date fields, optional package entitlement snapshot, analytics capability hints, and a loose listing row. It reads optional fields defensively and does not mutate rows or call Supabase.

## Tool States

Each tool has a read-only state:

- `available`: a safe listing-level field exists and is readable.
- `locked`: a safe field exists and indicates the tool is off.
- `unsupported`: the category is not ready for that tool or uses a separate model.
- `unknown`: the model cannot safely determine state from the row.
- `future`: the tool is planned or conceptual but has no safe listing-level field yet.

The tool keys are `republish`, `moveToTop`, `featured`, `verified`, `boost`, `autoRefresh`, `analytics`, `leads`, `concierge`, and `expirationRenewal`.

## Product Boundaries

Republish / Refrescado is separate from Featured / Destacado. Refrescado and Move to top read republish fields such as `republished_at`, `republish_count`, or `republish_sort_at` when present.

Featured / Destacado is separate from Verify Leonix. Featured reads listing-level staff spotlight fields such as `promoted`, `admin_promoted`, `featured`, or `destacado` when present. Verify Leonix reads trust/admin verification fields such as `leonix_verified` or `verified`; it is not paid visibility.

Boost / Impulsado and Auto Refresh are future/unsupported unless explicit safe listing-level fields exist. Legacy `boost_expires` is treated as a warning only and must not activate new monetization.

### Print-to-Digital visibility (Gate G0 policy)

When sorting is implemented, visibility must follow [`docs/print-to-digital-visibility-policy.md`](./print-to-digital-visibility-policy.md):

- **Premium print** → Destacados / Patrocinado **modules**, not fighting normal organic results.
- **Full-page print** → priority inside **matching** category results after search/filters.
- **Half/quarter/classified print** → print advertiser pool below full-page.
- **Digital-only Republish/Boost** → below print priority; must not outrank full-page unless policy is revised.
- **Organic** → fallback pool.

Search/filter runs before visibility ranking; ranking applies only to matching results. En Venta, Clases, Comunidad, Empleos, and Viajes remain outside or deferred per that policy.

Expiration / renewal is available only when a safe `expires_at` field exists on the row. Otherwise consumers should display future/unknown and the warning instead of assuming renewal eligibility.

Concierge is separate from paid placement. It may become an upsell/help service later, especially for Servicios, but this gate does not implement pricing or checkout.

## Category Behavior

En Venta keeps Free / Pro semantics from explicit En Venta listing/category fields and detail pairs. It must not infer Pro from account metadata.

Autos preserves the current privado/negocio/dealer lane language. Existing payment foundation can remain in Autos code, but this read model does not create Stripe checkout or pricing.

Rentas and Bienes Raíces use seller type, detail pairs, or existing category plan resolution when available. They must not show account-wide Pro from profile membership.

Servicios reads safe fields such as `promoted`, `republished_at`, and `leonix_verified` when present. If no explicit listing-level plan exists, the model returns an unspecified plan and a warning instead of inventing a paid plan.

Restaurantes may use `package_tier` when present and can read promoted, verified, and republish metadata when selected. Coupons/cupones remain marketing CMS content, not a checkout promo-code engine.

Empleos and Viajes use separate models and are not V1 monetization. The resolver still returns safe summaries so Admin/Dashboard can show unsupported/future states without breaking.

Clases, Comunidad, Busco, and Mascotas/Perdidos are later/not client-ready (`isClientReady: false`). The resolver returns defensive unsupported/future states and does not enable them as monetized client-ready categories.

Empleos and Viajes use separate models (`pipelineClassification`: `JOBS_PIPELINE`, `TRAVEL_STAGED`) and are not V1 monetization. Republish eligibility defers to `republishCapabilityReason` from the existing admin helper.

## Warnings And Gaps

Structured warnings use severity `info`, `warning`, or `gap`. Common codes:

- `account_tier_ignored` — membership/account tiers deliberately not used
- `missing_leonix_ad_id`, `missing_source_id`, `missing_owner_id`
- `featured_until_missing`, `expires_at_missing`, `legacy_boost_expires`
- `en_venta_pro_leak` — En Venta Pro must not appear on other categories
- `category_not_client_ready`, `package_entitlement_not_supplied`
- `legacy_mock_admin`, `dual_analytics_pipeline`

Consumers should display gaps honestly instead of assuming missing Supabase columns exist.

## Admin Visibility

Gate F wires this model into Admin as read-only visibility. Admin rows can now display the listing/category plan label, plan source, account-tier-ignored copy, safe metadata, tool states, and warnings/gaps.

This visibility is not pricing, Stripe, promo codes, checkout, public paid placement, notification delivery, or monetization activation. The Admin display does not create actions and does not change publish flows.

Missing metadata remains a gap. If `expires_at`, republish fields, promoted flags, verification fields, or category plan fields are absent from a row/table, Admin should show the warning from the read model rather than assuming a Supabase column exists.

Gate F browser QA must confirm visibility in Admin on the Clasificados workspace and priority category queues. Dashboard client display remains a later gate.

## Admin Consumption Later

Admin can use the summary to display listing tier, available tools, locked tools, trust verification, spotlight/featured state, republish state, and metadata gaps in row inspectors or command centers.

Admin should treat warnings as operational gaps. A missing Supabase column/table must be reported first and not silently assumed. This gate does not add or alter Supabase schema.

## Dashboard Consumption Later

Dashboard category cards can use the same summary to show the listing/category tier and read-only tool state near each listing. Dashboard home should stay a summary and not become the monetization source of truth.

Dashboard should not show account-wide Pro as listing capability. Category dashboards and listing cards should use the category/listing read model once UI wiring is intentionally added in a later gate.

## Out Of Scope

Stripe, public pricing, promo codes, paid placement checkout, and notifications are intentionally out of scope. Notifications are future because this gate only prepares read-only state for later surfaces.

This model prepares future Refrescado, Destacado, Impulsado, Auto Refresh, expiration/renewal, analytics, leads, and concierge displays by establishing a defensive read contract before any write pipeline or payment flow is added.

## Supabase Guardrail

Do not assume missing Supabase fields or tables exist. Optional/null-safe reads are required. If a category needs a missing column/table, report it as a read-model warning or implementation gap first; do not create migrations in this gate.
