# Print Package Entitlement Model (Admin Source of Truth)

**Gate G1.6 — strategy / spec / docs only**

This document is the **official Admin Package Entitlement model** for Leonix / El Águila **Print-to-Digital visibility**. It locks what must exist before public ranking (Gate G2) reads paid visibility from a single, auditable source.

**Related (do not duplicate as competing truth):**

- [`print-to-digital-visibility-policy.md`](./print-to-digital-visibility-policy.md) — Gate G0 product ladder and ranking buckets
- [`category-listing-monetization-read-model.md`](./category-listing-monetization-read-model.md) — Gate E defensive read model (legacy fields today)
- [`package-entitlement-model.md`](./package-entitlement-model.md) — Gate G1.6A/B resolver + Admin generator implementation notes
- `app/lib/listingPlans/printDigitalVisibilityRank.ts` — Gate G1 read-only rank helper (must not guess entitlements forever)
- `app/lib/listingPlans/categoryListingMonetization.ts` — Gate E tools/metadata reads

**Gate G1.6 does not include:** Supabase migration, public sorting, Admin UI build, Dashboard UI build, Stripe, promo codes, pricing checkout, public page redesign, or paid placement activation.

---

## 1. Executive summary

Leonix monetization for classifieds is **Print-to-Digital visibility**: print contracts grant **listing-level package entitlements** that map to **visibility rank buckets** after search and filters.

Today, partial signals (`cupones`, `promoted`, `admin_promoted`, `package_tier`, Stripe payment metadata, republish timestamps) are **inconsistent** and must **not** be treated as the long-term source of truth for ranking.

**Gate G1.5** confirmed there is no reliable Admin promo/package entitlement generator that public ranking can trust end-to-end. **Gate G2 (public ranking) is paused** until entitlements are defined (this document), proposed in schema (Gate G1.7), and operable from Admin (Gate G1.8).

The **`ListingPackageEntitlement`** record (future table / API) becomes the **future source of truth** for print-to-digital ranking. Promo codes and payments may **reference** entitlements but do not **replace** them.

---

## 2. Why Gate G1.5 paused Gate G2

| Finding (G1.5 class) | Why it blocks G2 |
|----------------------|------------------|
| `/admin/workspace/cupones` is marketing CMS | Coupons are content, not listing visibility contracts |
| `promoted` / `admin_promoted` are ops flags | No contract tier, dates, or category-scoped audit trail |
| `package_tier` (e.g. Restaurantes) is category-local | Must not drive cross-category print package truth |
| Stripe / payment status on orders | Payment ≠ visibility; refunds and partial states are ambiguous |
| `membership_tier`, `business_lite`, `business_premium` | Account metadata, not per-listing entitlement |
| Republish-only bumps | Digital tool band; must not impersonate print priority without entitlement |
| Gate G1 rank helper infers from legacy fields | Acceptable for **read-only** audit; unsafe as **write-less** production sort |

**Gate G2-SERVICIOS** (and other category ranking gates) must **not** ship until ranking reads **active entitlements** created by Admin (or migration), not inferred legacy alone.

---

## 3. Concept separation

| Concept | Role | Entitlement truth? | Ranking truth? |
|---------|------|--------------------|----------------|
| **Promo code** | Discount or checkout benefit at sale | No | No |
| **Coupon** (`cupones` CMS) | Marketing copy / offer presentation | No | No |
| **Discount** | Price reduction on invoice or checkout | No | No |
| **Stripe / payment** | Funds collected; subscription state | No | No |
| **Package entitlement** | Visibility + access on a **listing** for a **category** for a **contract period** | **Yes (future)** | **Yes (future)** |
| **Visibility rank bucket** | Derived sort/module band from active entitlement + policy | Derived | Output of ranking |

**Doctrine:**

- Promo code = **discount / payment** benefit.
- Package entitlement = **visibility / access** benefit attached to listing, category, package, contract period, and **Admin approval**.

---

## 4. Source-of-truth doctrine

### Must become source of truth (future)

- **`listing_package_entitlements`** rows (name provisional; see Gate G1.7) materialized as `ListingPackageEntitlement`
- Admin-created or migration-sourced entitlements with `starts_at`, `ends_at`, `status`, `packageTier`, `category`, `listing_id`

### Must NOT be ranking truth

| Signal | Reason |
|--------|--------|
| Global **Pro**, `membership_tier`, `business_lite`, `business_premium` | Account-level; not listing contract |
| **Stripe** payment status, checkout session alone | Payment lifecycle ≠ visibility contract |
| Restaurantes **`package_tier`** alone | Category-local legacy; not print roster |
| **`admin_promoted` / `promoted`** alone | Spotlight flag without contract object |
| **`cupones` / coupon CMS** | Marketing, not entitlement store |
| Republish timestamp **alone** | Digital tool; needs `digital_republish` entitlement or stays in `republished` band |

### Interim (until G1.7+)

- Gate E read model and Gate G1 `resolveListingVisibilityRank` may **read** legacy fields **defensively** for Admin visibility and audits.
- Public **sort order must not change** in Gate G1.6.
- When entitlement exists, **entitlement wins** over legacy inference (future rule).

---

## 5. Future entitlement object shape

Canonical TypeScript shape for Gate G1.7 schema alignment and Admin/Dashboard APIs:

```ts
type ListingPackageEntitlement = {
  id: string;
  listingId: string;
  listingSource: string; // e.g. listings | servicios_public_listings | restaurantes_public_listings
  category: string; // servicios | restaurantes | autos | bienes-raices | rentas
  packageTier:
    | "premium_print"
    | "full_page_print"
    | "half_page_print"
    | "quarter_page_print"
    | "classified_print"
    | "digital_republish"
    | "digital_boost_future"
    | "digital_auto_refresh_future";
  visibilityBucket:
    | "premium_destacado_module"
    | "full_page_print_priority"
    | "print_advertiser_pool"
    | "digital_featured"
    | "republished"
    | "organic";
  placementScope: "homepage" | "category" | "results" | "zip" | "city" | "custom";
  startsAt: string; // ISO
  endsAt: string; // ISO
  status: "draft" | "active" | "expired" | "cancelled";
  createdByAdminId: string;
  source: "print_contract" | "admin_manual" | "digital_tool" | "migration";
  notes?: string;
};
```

Optional parallel fields on listing row (Gate G0) remain **derived caches** only after entitlement pipeline exists—not primary truth.

---

## 6. Required fields

| Field | Required | Purpose |
|-------|----------|---------|
| `id` | yes | Stable entitlement id |
| `listingId` | yes | Target listing |
| `listingSource` | yes | Table/API namespace for id |
| `category` | yes | Scope; prevents cross-category injection |
| `packageTier` | yes | Contract SKU |
| `visibilityBucket` | yes | Denormalized bucket for rank helper (validated vs tier) |
| `placementScope` | yes | Where benefit may surface |
| `startsAt` | yes | Contract start |
| `endsAt` | yes | Contract end |
| `status` | yes | Lifecycle |
| `createdByAdminId` | yes | Audit |
| `source` | yes | print_contract vs admin_manual vs migration |

---

## 7. Optional fields

| Field | Purpose |
|-------|---------|
| `sponsored_until` | Patrocinado module end (may mirror `endsAt` or be stricter) |
| `featured_until` | Destacado spotlight end (non-trust) |
| `contract_code` | Print sales / CRM reference |
| `entitlement_code` | Staff-facing code (`LX-ENT-…`) |
| `print_campaign_id` | Print issue linkage |
| `print_ad_cycle_id` | Cycle/issue linkage |
| `promo_code` | **Reference only** — discount code that created sale; not visibility truth |
| `stripe_checkout_session_id` | Future payment linkage in metadata |
| `revoked_at` / `revoked_by` | Safe revoke without delete |
| `benefits` | Snapshot of included tools at grant time |
| `city_scope` / `zip_scope` | Future geo scope (V2) |

---

## 8. Package ladder (entitlement SKUs)

| `packageTier` | Business meaning | Digital posture (summary) |
|---------------|------------------|---------------------------|
| **premium_print** | Cover / back / outside premium (~$2k/mo class) | Destacados / Patrocinado **modules**; limited inventory |
| **full_page_print** | Full-page print advertiser | **Priority** in matching category **results** after search/filter |
| **half_page_print** | Half-page print advertiser | Print pool + included listing + digital tools per contract |
| **quarter_page_print** | Quarter-page print advertiser | Print pool below full-page |
| **classified_print** | Smaller print classified unit | Print pool; basic included digital listing |
| **digital_republish** | Refrescado / Republish tool entitlement | `republished` band; below print priority |
| **digital_boost_future** | Impulsado / Boost (future SKU) | `digital_featured` band; below print unless policy changes |
| **digital_auto_refresh_future** | Auto Refresh (future SKU) | Digital band; below print |

**Not entitlements in this ladder:** global Pro, account membership, restaurant-only `package_tier` without entitlement row.

---

## 9. Mapping to Gate G1 ranking buckets

| `packageTier` | `visibilityBucket` | Gate G1 behavior |
|---------------|-------------------|------------------|
| `premium_print` | `premium_destacado_module` | Eligible for Destacados modules; not default organic sort supremacy |
| `full_page_print` | `full_page_print_priority` | `eligibleForResultsPriority` after filters |
| `half_page_print` | `print_advertiser_pool` | Below full-page in matching results |
| `quarter_page_print` | `print_advertiser_pool` | Same pool as half/classified |
| `classified_print` | `print_advertiser_pool` | Same pool |
| `digital_boost_future` | `digital_featured` | Below print pools |
| `digital_auto_refresh_future` | `digital_featured` (or tool-specific sub-band later) | Below print |
| `digital_republish` | `republished` | Below full-page; never outranks `full_page_print_priority` in V1 |
| *(none / expired)* | `organic` | Fallback |

**Hard rule (V1):** `digital_republish` and future boost tiers **must not** outrank `full_page_print` in category results.

---

## 10. Contract timing

| Field | Rule |
|-------|------|
| `starts_at` / `startsAt` | Entitlement inactive before start |
| `ends_at` / `endsAt` | Entitlement inactive after end |
| `sponsored_until` | If present, Patrocinado surfaces respect this window |
| `featured_until` | If present, Destacado spotlight respects this window (not Verify Leonix) |
| `status` | `draft` → not public; `active` → eligible if dates OK; `expired` / `cancelled` → organic fallback |

**Active check (future):** `status === 'active' && now >= startsAt && now < endsAt` (timezone policy TBD in G1.7).

---

## 11. Listing / category attachment

| Dimension | Rule |
|-----------|------|
| `listing_id` | One entitlement row targets one listing |
| `listing_source` | Disambiguates id across vertical tables |
| `category` | Must match listing category for public benefit |
| `placement_scope` | `homepage` \| `category` \| `results` \| `zip` \| `city` \| `custom` |
| **City / ZIP scope** | Future: entitlement may limit geo; filters remain authoritative |

**V1 categories:** servicios, restaurantes, autos, bienes-raices, rentas.

**Excluded:** en-venta (separate model), clases/comunidad (not client-ready), empleos/viajes (deferred).

---

## 12. Admin requirements (later — Gate G1.8)

Admin must be able to:

1. **Create** entitlement (tier, category, listing, dates, scope)
2. **Attach** to listing (`listing_source` + `listing_id`)
3. **Set duration** (`starts_at`, `ends_at`, optional `sponsored_until` / `featured_until`)
4. **Expire safely** (status → expired; revoke without hard delete)
5. **View audit trail** (who created, source, notes, contract codes)

**Not** `/admin/workspace/cupones` for this workflow.

Gate G1.6B may have started generator work; **G1.6 spec** locks the **data model** regardless of UI maturity.

---

## 13. Dashboard requirements (later)

Business dashboard should show:

- Active **package** on listing (tier label, not fake global Pro)
- **Expiration** (`ends_at`, days remaining)
- Included tools (Republish, Boost when entitled)
- Warnings when entitlement missing but legacy `promoted` is set

Dashboard must **not** show `membership_tier` as listing visibility capability.

---

## 14. Public result requirements (later — Gate G2+)

1. **Search and filters run first** (category, query, city/ZIP, price, type).
2. **Ranking runs only on matching results.**
3. **No unrelated paid injection** (Premium Servicios never sorts into Restaurantes).
4. Destacados modules draw from `premium_print` entitlements with **inventory caps**.
5. Results inline sort uses entitlement-derived `visibilityBucket`, not payment status.

---

## 15. Inventory limits

| Tier | Limit principle |
|------|-----------------|
| **premium_print** | ~8–10 total Destacados slots (or fewer); ops-enforced |
| **full_page_print** | May need per-category caps to avoid results flooding |
| **half_page_print / quarter_page_print / classified_print** | Pool band; fairness caps TBD per category |
| **digital_*** | Tool entitlements; rate limits separate from print inventory |

Exceeding caps → waitlist or Admin denial; never silent infinite `promoted` rows.

---

## 16. Migration strategy (document only)

**No migration in Gate G1.6.**

Later migration phases (Gate G1.7+):

1. Add `listing_package_entitlements` table matching §5–7.
2. Backfill from print roster CSV / CRM `contract_code` with `source: migration`.
3. Map legacy `print_package_tier` / Restaurantes `package_tier` → entitlement rows **only** when contract dates known.
4. Leave ambiguous legacy as `organic` + Admin warning until staffed.
5. Dual-read period: rank helper prefers entitlement; legacy inference logs warning.
6. Cutover: public G2-SERVICIOS reads entitlements only.

---

## 17. Safe fallback behavior

| Condition | Public ranking (future) | Admin/Dashboard |
|-----------|-------------------------|-----------------|
| Missing entitlement | `organic` | Warning: no contract |
| Expired entitlement | `organic` | Show expired + renewal CTA |
| Invalid / unknown category | `unknown` / deferred | Do not grant cross-category |
| Legacy `promoted` only | `organic` until entitled | “Legacy flag — create entitlement” |
| Multiple active entitlements | Highest **policy** weight wins; audit conflict | Admin review queue |

---

## 18. Risks if ranking is applied before entitlement source exists

1. **Paid chaos** — Republish beats print advertisers without contract.
2. **Cross-category leaks** — `promoted` true on wrong category surface.
3. **Trust erosion** — Users see Patrocinado without print contract.
4. **Ops debt** — Cannot answer “why is this listing destacado?” in audit.
5. **Stripe disputes** — Refund leaves listing destacado via stale flags.
6. **Restaurantes skew** — `package_tier` treated as global print truth.
7. **Legal/compliance** — Sponsored labeling without contract dates.

**Therefore Gate G2 remains blocked until G1.7 + G1.8.**

---

## 19. Recommended next gates

| Gate | Deliverable |
|------|-------------|
| **G1.7** | Entitlement **schema proposal** + migration plan + RLS sketch |
| **G1.8** | Admin entitlement **generator UI plan** (attach, duration, revoke, audit) |
| **G2-SERVICIOS** | Apply ranking **only after** entitlement source is readable in production |

Verification: `npm run verify:print-package-entitlement-model`

---

## Gate G1.6 scope checklist

| In scope | Out of scope |
|----------|--------------|
| This spec document | Schema migration |
| Policy cross-links | Public sorting implementation |
| Verification script | Dashboard UI |
| | Stripe / promo checkout |
| | Paid placement activation |

**Gate G1.6 PASS criteria:** doc + script + policy updates; no code behavior change to public pages.
