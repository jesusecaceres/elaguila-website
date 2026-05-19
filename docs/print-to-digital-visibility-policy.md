# Leonix Print-to-Digital Visibility Policy

**Gate G0 — strategy / model / docs only**

This document is the official Leonix / El Águila monetization foundation for **how print packages translate into digital visibility**. It defines product rules, public labels, ranking buckets, and future schema concepts. It does **not** implement sorting, public UI, Admin actions, Dashboard UI, Stripe, promo codes, pricing, checkout, paid placement activation, or Supabase migrations.

**Related:** `docs/category-listing-monetization-read-model.md` (Gate E read model), Gate F Admin read-only visibility.

---

## 1. Executive summary

Leonix monetization is **Print-to-Digital visibility**, not global account tiers or generic “Pro” membership.

- **Premium print package** (~$2,000/month class, limited inventory ~8–10 or fewer) buys **Destacados / sponsored module placement** on homepage, Clasificados hub, category landings, and optionally a results-page Destacados band. Premium advertisers should **not** fight inside normal organic result lists for attention—they own highlighted modules.
- **Full-page print advertisers** get **priority sorting inside matching category results** after search and filters apply. They rank above half/quarter/classified print and all digital-only tools.
- **Half-page, quarter-page, and classified print advertisers** receive included digital listings and may compete in a **print advertiser pool** below full-page priority.
- **Digital-only tools** (Refrescado / Republish today; Boost / Impulsado and Auto Refresh later) compete **below** print-priority advertisers unless a future policy revision explicitly allows otherwise.
- **Organic / basic listings** are the fallback pool after all paid/print visibility logic.

Trust and relevance beat paid chaos: **search and filters run first**; visibility ranking only orders **matching** results and must not inject unrelated categories or ZIP/city mismatches.

---

## 2. Package ladder (print)

| Tier | Typical print shape | Inventory | Digital posture (summary) |
|------|---------------------|-----------|---------------------------|
| **Premium** | Cover, back cover, outside premium real estate | Very limited (~8–10 total or fewer) | Destacados modules / Patrocinado bands—not normal results fighting |
| **Full-page** | Full-page advertiser | Broader than Premium | Priority in **category results** after filters |
| **Half-page** | Half-page advertiser | — | Included digital listing + print pool benefits |
| **Quarter-page** | Quarter-page advertiser | — | Included digital listing + print pool benefits |
| **Classified print** | Smaller print classified units | — | Included digital listing; competes below full-page |
| **Digital-only** | No print package | — | Republish/Boost/Auto Refresh tools only; below print |
| **Organic / basic** | Marketplace listing without print package | — | Default sort after paid/print logic |

Premium is the **highest** print package. Full-page is high priority in results but does **not** replace Premium’s Destacados module strategy.

---

## 3. Digital benefit ladder

Ordered from strongest to weakest digital benefit (conceptual; implementation is later gates):

1. **premium_destacado_module** — Premium print → Destacados / Patrocinado modules (homepage, Clasificados Destacados, category landing Destacados, optional results Destacados module).
2. **full_page_print_priority** — Full-page print → first dibs in **matching** category results after search/filters.
3. **print_advertiser_pool** — Half-page, quarter-page, classified print → included listing + pool placement below full-page.
4. **digital_featured** — Staff/category Destacado spotlight when not driven by Premium module inventory (distinct from Verify Leonix).
5. **republished** — Refrescado / Republish timestamp or count bumps within digital-only band; **never** outranks full-page print priority unless policy is explicitly revised.
6. **organic** — Normal marketplace listings; fallback sort.

**Gate G1** implements the shared read-only helper (no live sorting yet):

- Code: `app/lib/listingPlans/printDigitalVisibilityRank.ts`
- `resolveListingVisibilityRank(input)` → `VisibilityRankSummary`
- `compareVisibilityRank(a, b)` → higher `rankWeight` first; ties return `0`

The helper **does not apply sorting** to public pages, Destacados modules, or Admin tables. Categories opt in one-by-one in later gates. **Search/filter must run first** on the caller; the helper only ranks rows already in the matching result set. Existing category fallback sorting (date, distance, etc.) remains after bucket compare when weights tie.

---

## 4. Category scope V1

Apply this policy in **implementation gates after G0** to:

| Category | V1 notes |
|----------|----------|
| **Servicios** | Primary Print-to-Digital vertical; Destacados + results priority per package tier |
| **Restaurantes** | Same ladder; respect existing `package_tier` / promoted metadata when mapped |
| **Autos (negocios / dealers)** | Business/dealer lanes only for print priority; privado lane stays separate Autos monetization |
| **Bienes Raíces** | Listing/seller-type aware; no account-wide Pro inheritance |
| **Rentas** | Apply **carefully** for property managers and business landlords; avoid consumer-tenant confusion |

Adapters may normalize category-specific fields into shared buckets; the **policy** is one shared visibility model.

---

## 5. Categories excluded or deferred

| Category | Status | Reason |
|----------|--------|--------|
| **En Venta** | **Separate** | Own Free / Pro ideology; do not inherit Print-to-Digital ladder |
| **Clases** | **Not client-ready** | No paid listing tools in V1 |
| **Comunidad** | **Not client-ready** | No paid listing tools in V1 |
| **Empleos** | **Deferred / separate model** | Jobs monetization is a different product line |
| **Viajes** | **Deferred / staged model** | Staged listings; separate policy pass |

---

## 6. Public labels and meanings

Use honest, user-facing labels:

| Label | Meaning |
|-------|---------|
| **Destacado** | Highlighted placement in a Destacados module or band (not generic “top of all results”) |
| **Patrocinado** | Paid / sponsored visibility tied to print or approved digital sponsorship |
| **Anunciante Leonix** | Print advertiser badge (package tier communicated without implying account “Pro”) |
| **Verificado por Leonix** | Trust / admin verification—**not** paid visibility |
| **Refrescado** | Republished / refreshed listing (digital tool; below print priority) |

**Do not use** as listing monetization truth:

- global **Pro**
- **business_lite** / **business_premium**
- **membership_tier** or generic account plan as listing capability

Account metadata may appear in profile/settings only.

---

## 7. Sorting principles (future implementation)

When sorting is implemented (Gate G1+):

1. **Search and filters run first** (category, query, ZIP/city, price, type, etc.).
2. **Visibility ranking runs only on the matching result set.**
3. **No cross-category injection** — paid/print priority must not surface unrelated listings.
4. **Category filters remain authoritative** — a Servicios Premium ad never ranks in Restaurantes results.
5. **ZIP/city filters remain authoritative** — local relevance beats sponsorship.
6. **User trust > paid chaos** — verification and quality signals complement but do not replace relevance guards.

---

## 8. Destacados module principles

Premium print package digital benefit is **module placement**, not winning organic sort wars.

- Surfaces: homepage Destacados, Clasificados hub Destacados, category landing Destacados, optional results-page Destacados module.
- Limited inventory (~8–10 Premium slots or fewer) must be enforced in ops, not infinite promoted rows.
- Premium listings should be **excluded from competing** in normal organic result ordering for the same attention slot when policy assigns them to Destacados-only visibility.
- Patrocinado copy must disclose sponsored placement where required.

---

## 9. Full-page priority result principles

Full-page print advertisers:

- Rank **first among matching results** after search/filters within their category (and scope).
- Must **not** appear above unrelated categories or outside filter constraints.
- Rank **above** half/quarter/classified print pool and **above** digital-only Republish/Boost/Auto Refresh.
- Do **not** automatically receive Premium Destacados module slots unless they also hold Premium print inventory.

---

## 10. Republish / Boost relationship

| Tool | Policy |
|------|--------|
| **Refrescado / Republish** | Digital-only refresh; may improve position within **republished** / digital bands; **below** full-page print priority |
| **Boost / Impulsado** | Future; same band as digital-only; **below** print priority unless later policy says otherwise |
| **Auto Refresh** | Future; same constraints as Boost |

**Hard rule (V1):** Boost/Republish must **never** outrank full-page print priority. Premium remains in Destacados modules, not normal sort supremacy.

Gate E read model already treats Boost/Auto Refresh as future/unsupported unless safe listing fields exist.

---

## 11. Admin requirements (later)

- Display `visibility_rank_bucket` and `visibility_rank_reason` when schema exists (read-only first, like Gate F).
- Show print package tier, digital visibility tier, campaign/cycle ids, and sponsored/featured until dates.
- Ops must reconcile print roster → digital entitlements; gaps are warnings, not silent assumptions.
- No new monetization **actions** in policy gates—activation stays later.

---

## 12. Dashboard requirements (later)

- Listing cards show bucket + honest labels (Destacado, Patrocinado, Anunciante Leonix, Refrescado).
- Never map `membership_tier` to listing visibility.
- Explain what print package includes vs what digital tools are available/locked.
- Dashboard home remains summary; category surfaces are source of truth for listing visibility.

---

## 13. Future schema concepts (document only — no migration in Gate G0)

Optional listing-level fields for later migrations and adapters:

| Field | Purpose |
|-------|---------|
| `print_package_tier` | premium \| full_page \| half_page \| quarter_page \| classified_print \| none |
| `digital_visibility_tier` | Derived digital band for UI/sort |
| `placement_scope` | homepage \| clasificados \| category_landing \| results_module \| results_inline |
| `sponsored_until` | Patrocinado / sponsorship end |
| `featured_until` | Destacado spotlight end (non-trust) |
| `print_campaign_id` | Print sales campaign linkage |
| `print_ad_cycle_id` | Issue/cycle linkage |
| `republish_count` | Refrescado count (existing-safe reads today) |
| `republished_at` | Last republish timestamp |
| `visibility_rank_bucket` | premium_destacado_module \| full_page_print_priority \| print_advertiser_pool \| digital_featured \| republished \| organic |
| `visibility_rank_reason` | Human/debug explanation for Admin |

Until columns exist, Gate E/F read models continue defensive reads and warnings.

---

## 14. QA rules before any future implementation

Before merging sorting, public Destacados, or payment flows:

1. Confirm category is in **V1 scope** or explicitly excluded.
2. Run `npm run verify:print-to-digital-visibility-policy`.
3. Run `npm run verify:category-listing-monetization` and `npm run verify:category-plan-boundaries`.
4. Manual QA: filtered search → only matching listings reorder; Premium appears in Destacados modules, not random categories; full-page ranks above Republish in same category; En Venta unaffected.
5. No `membership_tier` / `business_lite` / `business_premium` used as listing sort truth.

---

## 15. Gate G0 / Gate G1 scope warnings

**Gate G0 does not include:** policy-only; no code.

**Gate G1 adds** the shared `resolveListingVisibilityRank` helper and `compareVisibilityRank` only. It **does not**:

- Apply sorting on public result pages, homepage Destacados, category landing Destacados, or results-page Destacados modules
- Change Dashboard or Admin UI
- Add Stripe, promo codes, pricing, checkout, or paid placement activation
- Add Supabase migrations or publish pipeline changes

**Gate G1 encodes:** Premium → Destacados modules (`eligibleForDestacadosModule`, not default results priority); full-page → results priority (`eligibleForResultsPriority`); half/quarter/classified → `print_advertiser_pool`; digital featured below print; Republish/Boost below full-page print; organic fallback. **Full-page priority outranks Republish/Boost** unless a future policy revision says otherwise.

Later gates (e.g. **Gate G2-SERVICIOS**) may call the helper behind existing filters; until then, public sort behavior is unchanged.
