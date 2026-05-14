# Dashboard + Admin + Public Clasificados — QA smoke & product audit

This document complements:

- `docs/dashboard-analytics-smoke-test.md` — analytics vocabulary, `saved_listings` canonical contract, Gate 2 owner lifecycle on `public.listings`, degraded analytics honesty.
- `docs/admin-workspace-smoke-test.md` — admin editing truth matrix (content tooling).

## Gates already shipped (context)

| Gate | Summary |
|------|---------|
| **Gate 1** | Runtime saves use `saved_listings`; `user_saved_listings` not used by `app/` runtime. |
| **Gate 2** | `public.listings`: owner soft archive, pause/resume; draft delete soft; Admin **Restaurar** ≠ **Republicar**. |
| **Gate 3** | Dedicated vertical tables audited (read-only); Servicios / Empleos safest to extend next; Restaurantes / Autos need schema caution; Viajes owner unpublish vs admin suspend semantics need care. |

## Automated smoke (Playwright)

**Framework:** `@playwright/test` (already in `devDependencies`).

**Config:** `playwright.leonix-smoke.config.mjs`  
**Spec:** `e2e/leonix-dashboard-admin-smoke.spec.ts`

### Prerequisites

1. `npm run build` (smoke uses `next start` in production mode).
2. `.env.local` with at least `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for auth-backed checks.
3. Optional smoke users (real `auth.users` rows — **tests do not create users**):
   - `SMOKE_SELLER_EMAIL` / `SMOKE_SELLER_PASSWORD`
   - `SMOKE_BUYER_EMAIL` / `SMOKE_BUYER_PASSWORD`
4. Admin cookie login: **`ADMIN_PASSWORD`** must be set (the submit route reads **only** `ADMIN_PASSWORD`, not `SMOKE_ADMIN_PASSWORD` alone).

### Ports & reuse

- Default URL: `http://127.0.0.1:3036` (`LEONIX_SMOKE_PORT` overrides).
- `LEONIX_SMOKE_REUSE=1` (default locally): reuse an already-running server on that port if present.
- In CI (`CI=true`): always spawn a fresh `next start`.

### npm scripts

| Script | Scope |
|--------|--------|
| `npm run smoke:auth` | Supabase seller/buyer sign-in + admin password |
| `npm run smoke:guardados` | Buyer + public results + Guardados read-only |
| `npm run smoke:owner` | Seller + Mis anuncios (no hard-delete pattern) |
| `npm run smoke:dashboard` | Vertical dashboard route health + overview “Próximamente” (`@smoke-health` only) |
| `npm run smoke:admin` | Admin queues + Restaurar vs Republicar sanity |
| `npm run smoke:clasificados` | Public category shells |
| `npm run smoke:all` | Full spec |

### Read-only vs mutations

- **Default:** read-only. No save/unsave, pause, archive, or admin PATCH.
- **`SMOKE_ALLOW_MUTATIONS=true`:** reserved for future disposable-listing flows; still **no hard delete**, no `leonix_ad_id` mutation, no production bulk writes. Until a dedicated disposable fixture exists, mutation steps remain **SKIP** with a log line.

### Output

The spec prints a **PASS / FAIL / SKIP** checklist to stdout. Playwright exits non-zero if any **FAIL** line was recorded.

### What still needs manual visual QA

- Mobile breakpoints and thumb-zone CTAs on listing cards.
- Per-category filter correctness (radius on Autos is documented as not applied — do not treat as broken without product change).
- Stripe / checkout flows for Autos.
- Admin row counts when tables are empty (smoke **SKIP**s action labels).
- Visual distinction of **Restaurar** vs **Republicar** on dense admin rows.

---

## Part 1 — Product audit matrix (repo-based, May 2026)

Legend: **TRUE** = implemented end-to-end in app routes; **PARTIAL** = scaffold, gated, or honest degradation; **FALSE** = not present or explicitly “coming soon”.

### A. Public site (visitor)

| Category | Browse/list | Detail | Save | Share/contact | Report | Leonix Ad ID | Readiness |
|----------|-------------|--------|------|---------------|--------|--------------|-----------|
| En Venta | TRUE | TRUE | TRUE (`saved_listings`) | PARTIAL | varies | TRUE when column set | LIVE |
| Rentas | TRUE | TRUE | TRUE | PARTIAL | varies | TRUE | LIVE |
| Bienes Raíces | TRUE | TRUE | TRUE | PARTIAL | varies | TRUE | LIVE |
| Servicios | TRUE | TRUE | TRUE | TRUE (leads) | varies | TRUE when set | STAGED |
| Autos | TRUE | TRUE (by id) | PARTIAL | PARTIAL | varies | TRUE when set | STAGED |
| Empleos | TRUE | TRUE | N/A | TRUE (apply) | varies | TRUE when set | LIVE |
| Restaurantes | TRUE | TRUE | N/A | PARTIAL | varies | TRUE when set | LIVE |
| Viajes | TRUE | TRUE (staged slug) | N/A | TRUE (inquiries) | varies | TRUE when set | STAGED |
| Clases | PARTIAL | PARTIAL | FALSE | FALSE | FALSE | PARTIAL | COMING SOON |
| Comunidad | PARTIAL | PARTIAL | FALSE | PARTIAL | FALSE | PARTIAL | COMING SOON |

### B. Client dashboard

| Category | Owned inventory | Leonix Ad ID | Pause/archive | Republish | Analytics | Notes |
|----------|-----------------|--------------|---------------|-----------|-------------|-------|
| `public.listings` cats | TRUE (`mis-anuncios`) | TRUE | TRUE (Gate 2) | TRUE when eligible | Degraded until `listing_analytics` | Contract in `dashboardDataContract.ts` |
| Restaurantes | TRUE | TRUE | FALSE (no owner API yet) | FALSE | PARTIAL | Edit/hydrate links |
| Servicios | TRUE | TRUE | PARTIAL (pause/resume API) | FALSE | PARTIAL | No owner republish |
| Empleos | TRUE | TRUE | PARTIAL (PATCH lifecycle) | FALSE | PARTIAL | Tighten transitions (Gate 3) |
| Autos | PARTIAL (main dashboard band) | TRUE | PARTIAL (unpublish→`removed`) | FALSE | PARTIAL | No owner restore from `removed` |
| Viajes | TRUE | TRUE | PARTIAL (unpublish/resubmit) | FALSE | PARTIAL | Semantics vs admin suspend |
| Clases / Comunidad | FALSE inventory | — | FALSE | FALSE | N/A | “Próximamente” on overview |

### C. Admin

| Area | Queue | Staff lifecycle | Republish | Promote | Verify | Audit / notes |
|------|-------|-----------------|-----------|---------|--------|---------------|
| `public.listings` verticals | TRUE | TRUE | TRUE | TRUE | TRUE | PARTIAL audit log |
| Restaurantes | TRUE | TRUE | TRUE | TRUE | TRUE | PARTIAL |
| Servicios | TRUE | TRUE | TRUE | TRUE | TRUE | PARTIAL |
| Empleos | TRUE | TRUE | TRUE | TRUE | TRUE | PARTIAL |
| Autos | TRUE | TRUE | TRUE | TRUE | TRUE | PARTIAL |
| Viajes / travel | TRUE | TRUE | TRUE | TRUE | TRUE | PARTIAL |
| Clases / Comunidad | TRUE (scaffold) | PARTIAL | FALSE | PARTIAL | PARTIAL | Not client-ready |

**Labels:** `ClassifiedAdminRowActions` uses **Restaurar** for `unsuspend` (not **Republicar**). Republish is a separate button from `republishActionLabel`.

### D. Concierge / business readiness

| Item | Status |
|------|--------|
| `/dashboard/business-tools` | TRUE (page exists; tier from `profiles.membership_tier`) |
| `profiles.account_type` / `membership_tier` | TRUE (selected in `dashboardProfile`) |
| Listing plan / republish / promote fields | TRUE for `listings` + vertical tables (see migrations) |
| Dedicated Concierge capture | FALSE (no product implementation pass) |
| Support ticket system | PARTIAL (contact/support surfaces vary by category) |
| Magazine / revista admin | PARTIAL (`/admin/workspace/revista` per admin docs) |

---

## Required `rg` summaries (repo)

Run from repo root if `rg` is installed; otherwise use IDE search.

1. **`saved_listings` / `user_saved_listings`:** `app/` uses **`saved_listings` only** for runtime saves and Guardados. `user_saved_listings` appears in **migrations**, **docs**, and **`scripts/servicios-engagement-smoke.ts`** (static assertion that Guardados does not merge legacy).

2. **Lifecycle Spanish/English strings + columns:** Broad hits across dashboard, admin, API — owner pause/archive/republish aligned with Gate 2 on `public.listings`; verticals vary (see Gate 3).

3. **`boost_expires` / legacy boost:** Essentially absent from runtime; **En Venta** types may mention `boost_until` as future contract only.

4. **`leonix_ad_id`:** Widespread read-only display + allocation triggers in migrations; dashboard cards show **ID Leonix** when present.

5. **Promote / verify / coupons:** Admin `promote_on`, `leonix_verified`, `admin_promoted` on verticals; coupon/promo tables exist in some migrations — not a full promo product pass.

6. **Account / tier / plan:** `membership_tier`, `account_type`, `listing_plan` helpers, En Venta Pro/republish window — used for gating and UI.

7. **Analytics:** `listing_analytics` + category event tables (`servicios_analytics_events`, `autos_classifieds_analytics_events`, empleos counts) — dashboard stays **honest** when table missing.

8. **Concierge / growth / business tools:** `business-tools` page and marketing copy hits; no full Concierge workflow.

9. **Magazine / homepage / banners:** Revista routes, `global_site`, homepage modules — PARTIAL editorial pipeline.

---

## Recommended next gate

1. Harden **Empleos** owner lifecycle transitions + copy (**Restaurar** vs **Publish**).
2. **Servicios** owner soft-archive (avoid overloading admin **`rejected`** name) + docs.
3. **Playwright in CI** for `smoke:all` on preview deploys once secrets (`ADMIN_PASSWORD`, smoke users) are in CI vault.
