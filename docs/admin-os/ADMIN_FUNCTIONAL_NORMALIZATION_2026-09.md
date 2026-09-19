# Admin functional normalization — filter/limit truth (Gate 3) + functional contract (Gate 4) — 2026-09

Branch: `integration/category-circuit-closeout-2026-09`. Scope: the Admin category **pages** and their **read/query libs** only. No payment, no
publication authority, no route (`app/api/admin/**`), no server action, no DB write and no Stripe/Vercel setting was touched. Doctrine kept
throughout: **Admin reports and moderates; it never fabricates payment or publication truth, and Live equals the public reader predicate.**

Executable proof: `scripts/verify-final-admin-filters.ts` (41 checks: real data layers run against a stubbed `fetch`, so the PostgREST query
string of every request is asserted; pure helpers; summary layer through an injected client; source guards for the React pages).
Companion sections: `CATEGORY_CIRCUIT_CLOSEOUT_2026-09.md` §3 (normalization matrix), §5 (closeout 2), §6 (forensic closeout).

---

## 1. Gate 3 — filter / search / limit truth

### 1.1 Rules now enforced

| # | Rule | Where it lives |
|---|---|---|
| 1 | Every filter that SQL can express (status, full owner UUID, Leonix Ad ID, lane, scope, category, `detail_pairs` machine facets) runs in SQL **before** `limit`. | each data function below |
| 2 | A bounded application-level scan is **explicit and disclosed**: `scanCapped` + `scanned` are returned by the data layer and rendered by `AdminListTruncationNotice` ("Search window exhausted: 3,000 rows were scanned without finding 50 matches…"). An empty / short list from a capped scan is never presented as proof of absence (the Live "empty" panel is suppressed when capped). | `adminFilterTruth.ts`, `AdminListTruncationNotice.tsx`, `ClasificadosLiveScopePanel.tsx` |
| 3 | `q` + an exact filter is an **INTERSECTION**. Exact filters are AND-ed into the shared query builder, `q` is a free-text search on top of them. | Servicios / Restaurantes / generic / Ofertas / Comida / Viajes / Empleos / Autos |
| 4 | A list exactly as long as the requested limit says "limit reached — more rows may match". | `describeAdminListTruncation` (every page) |
| 5 | Every normalized summary is **whole-category (or lane-scoped) and says so**; a scan-capped metric prints `≥ n` with a lower-bound tooltip; an unreadable one prints `—`, never `0` / `≥ 0`. | `AdminCategorySummaryPanel` (`data-testid="admin-category-summary-scope"`), `buildAdminCategorySummaryCells`, `AdminCategorySummary.lowerBound` |
| 6 | A failed read renders as an **error**, never as an empty list. | see §1.3 |
| 7 | Free text inside a PostgREST `or(...)` cannot break the filter grammar (a comma / parenthesis in the term used to turn the whole search into an error). Values are LIKE-escaped and double-quoted (`pgrstQuote`). | generic, Ofertas, Comida |

### 1.2 Defects fixed (file : function)

| Category | Defect | Fix |
|---|---|---|
| **Servicios** | `serviciosPublicListingsServer.ts : listServiciosPublicListingsAdminQueueFromDb` — the exact-field path (`slug`/`id`/`owner`/`leonix_ad_id`) **returned early and silently dropped `q`**. Each `q` source was capped at a fixed 80 rows (matches hidden when a source had more; merged order was source order, not newest-first). Source failures were ignored (a failed search looked like "no results"). | Exact filters folded into the shared `qb()` so they intersect with `q` on every path; each source reads up to `limit`; merge sorted newest-first then cut; all-sources-failed ⇒ `unavailable` + `readError`; some-failed ⇒ `readWarning`; invalid uuid reported without a query; reduced schema + status/Live filter reported (was an empty list). |
| **Restaurantes** | `restaurantesPublicListingsServer.ts : listRestaurantesPublicListingsAdminFromDb` — same early-return drop of `q`; `q` path hard-capped at 100 regardless of Rows; owner-profile hits used only when nothing else matched; every failure → `[]`. | New `tryListRestaurantesPublicListingsAdminFromDb` (outcome form `{ok,rows,warning}` / `{ok:false,error}`) with the same intersection design; profile hits merge with text hits; old array function kept as a thin wrapper for the global search / audit callers. The page renders `restaurantes-admin-read-error`. |
| **Generic `listings` (Rentas, BR, En Venta, Clases, Comunidad, Mascotas, Busco)** | `ListingsCategoryOpsQueuePage.tsx` sent the Leonix Ad ID through `q` (so `q`+Ad ID could not intersect) and filtered a **partial owner fragment after the limit**; `scanCapped` was computed but never shown. | `listingsAdminSelect.ts : fetchListingsForAdminWorkspaceFiltered` gained a first-class `leonixAdId` SQL predicate (case-insensitive exact for a full id, contains for a fragment); the page passes `ownerFrag` as-is (SQL for a UUID, windowed scan for a fragment) and renders `scanCapped` / `scanned` / `partialSources`. The primary text search failing is now an error (was: only when BOTH sources failed). Secondary sources (exact Ad ID, owner-profile) that fail are reported as `partialSources`. |
| **Global Clasificados page** | `page.tsx` applied the owner fragment and the Leonix branch/operation/propiedad filters **after fetch/limit** (the fetcher already supported `leonix` but was not given it). | Both go to the data layer; no post-fetch filtering; scan truncation + the DB error message are shown. |
| **Rentas** | The Rentas queue merged Bienes-Raíces rent-operation rows by walking up to **3,000 raw BR rows per ordinary page load** (`detail_pairs` was filtered in memory). | The merge is a selective SQL query: jsonb containment `detail_pairs @> [{"label":"Leonix:operation","value":"rent"}]` (the publisher writes canonical lowercase `sale`/`rent`). If the containment operator is refused the code falls back to a **1,000-row** bounded scan (disclosed via `scanCapped`). The Bienes/Rentas machine filters (`leonix_branch/operation/propiedad`) use the same containment as a SQL prefilter; the exact in-memory check still runs after it. The "no BR merge in Live" pin is preserved. |
| **Autos** | `autosClassifiedsListingService.ts : listAllAutosClassifiedsRowsForAdmin` — status / owner / Leonix Ad ID were matched **in memory inside a ≤3,000-row scan**; a read failure returned `[]` (page showed "no rows"); the scan cap was undisclosed. | `status`, full-UUID `ownerUserId`, `leonixAdId` are SQL predicates (AND-ed with lane/scope, before the cap); only free-text `q` (vehicle text lives in `listing_payload`) and a partial owner fragment still use `rowFilter`. New `onMeta({error, scanCapped, scanned})` callback (the array return type and every caller/pin are unchanged). Page renders `autos-admin-read-error` and the truncation notice. |
| **Ofertas** | Raw `status` and Leonix Ad ID narrowed **in memory after a 200-row cap** (widened read then `slice`); the Rows selector offered up to 500 but the data layer clamped to 200. | `listOfertasLocalesAdminRowsDetailed` takes `status` and `leonix_ad_id` as SQL predicates (AND-ed with the scope's status set, `q`, `id`, `owner`); ceiling raised to 500 (`OFERTAS_ADMIN_LIST_MAX`); `q` LIKE-escaped + quoted. The existing `ofertas-capped` disclosure and the new limit notice both render. `ofertasServerSearchTerm` now returns `q` only (the Ad ID is its own predicate). |
| **Comida Local** | `comidaLocalAdminQueries.ts` silently clamped the Rows selector (500) to **200**; `q` with a comma broke the `or()`. | `COMIDA_LOCAL_ADMIN_LIST_MAX = 500`; `q` LIKE-escaped + quoted; the page adds the limit notice and hides the "no results" empty message while a read error is shown. |
| **Viajes** | `viajesStagedListingsDbServer.ts : fetchViajesStagedAdminQueue` — status / owner / Leonix Ad ID narrowed in memory after the window; **every read error became `[]`** (console.error only). | New `fetchViajesStagedAdminQueueDetailed` (`status`, full-UUID `owner_user_id`, `leonix_ad_id` in SQL; `q` in the bounded scan; returns `error`/`scanCapped`/`scanned`); the array form is a wrapper. Page renders `travel-admin-read-error` + the notice. |
| **Empleos** | Data layer returned `[]` on any read error; filters could not be pushed to SQL. | New `fetchAllEmpleosListingsForAdminDetailed` (SQL `status`/`lane`/`owner_user_id`/`leonix_ad_id`, meta, error); array form kept. The client list discloses "limit reached" and reads a forward-compatible `scan_capped` field. **The API route is owned elsewhere — see §5 (R1).** |
| **Summaries (all)** | A summary could be read as the size of the filtered list; a scan-capped `live` count was presented as exact. | Whole-category/lane caption on every page; `lowerBound` flag → `≥ n`; `queryError` shown; unreadable ⇒ `—`. |

### 1.3 Read errors rendered as errors

Generic shell (`Error: …` + Live panel), global page (`role="alert"` + message), Servicios (`Servicios data unavailable` + reason; **the filter bar now stays visible** so a bad filter value is fixable), Restaurantes, Autos, Travel, Comida (`comida-query-error`), Ofertas (`ofertas-query-error`). Empleos: the operating summary shows `queryError` (table unreadable ⇒ `—` + red banner); the list itself is bound by R1.

### 1.4 What each category does in SQL vs a bounded scan (after this gate)

| Category | SQL before the limit | Bounded application scan (disclosed) |
|---|---|---|
| Generic (7) | category, status, `needs_review`, full owner UUID, Leonix Ad ID, BR lane, Live superset, `detail_pairs` containment (Leonix facets, Rentas rent merge), text `q` (title/city/description/Ad ID) | partial owner fragment, exact Live predicate (Rentas machine status, BR FSBO term + parent gate), `detail_pairs` exactness; cap 3,000 raw rows per source |
| Servicios / Restaurantes | scope, status, slug, id, owner UUID, Leonix Ad ID (exact/contains), every `q` source | partial owner fragment (window widened to 800, disclosed) |
| Autos | scope, lane, status, owner UUID, Leonix Ad ID, Privado expiry | `q` (vehicle text), partial owner, dealer-child parent gate (Live); cap 3,000 |
| Empleos | (data layer ready — route pending, R1) | `q`, partial owner, lane/status until R1; cap 3,000 |
| Ofertas | scope set, status, Leonix Ad ID, `q`, id, owner | derived filters (`status_group`, lane, commercial, scan_review, term) and the exact public-eligibility predicate; cap 3,000 |
| Comida | everything (scope, status, slug, id, owner, Ad ID, `q`) | none |
| Viajes | scope, status, owner UUID, Leonix Ad ID | `q` (id substring), partial owner (window widened to 500) |

Summary counts: SQL `count(head)` everywhere the rule is expressible; the scan-based ones (Rentas machine availability, BR FSBO + parent gate, Autos parent gate, Ofertas eligibility) are bounded at 10,000 rows and flagged `≥` when hit.

---

## 2. Gate 4 — functional contract per category (kept / lost / restored)

Legend — **K** kept · **R** restored in this gate · **N** new in this gate · **—** not applicable / not stored. "Perf" = real counters where the category stores them; otherwise the plan/analytics-capability readout (never invented numbers).

| Category | Header + Queue/Live + Public + Publish + Back | Lane selector | Summary | Filter bar | Listing truth | Commercial truth | Perf | Moderation / trust | Lifecycle actions | Category module |
|---|---|---|---|---|---|---|---|---|---|---|
| **Rentas** (generic shell) | K | — (BR rent merge is data, not a lane) | K + N whole-category caption, `≥` | K + Ad ID SQL, owner fragment, `scanCapped` | K (matches public reader; `expires_at` REQUIRED) | K | plan readout | K flags/reports/AI review, verify/feature | K `ClassifiedAdminQueueRowActionsPanel` (payment-gated Restore/Republish) | machine-status Live rule (rentado/bajo_contrato) K |
| **Bienes Raíces** | K | **N Negocio / Privado(FSBO) selector** (`bienes-lane-selector`), lane-scoped list + summary | K + N lane caption | K | K (FSBO term, child-parent gate) | K | plan readout | K | K (FSBO never through the Negocio RPC — closeout 2) | K `BienesNegocioOpsPanel`: parent, children, capacity, entitlement, payment truth (unreadable ⇒ truth state, never 0) |
| **En Venta / Clases / Comunidad / Mascotas / Busco** | K | — | K + N | K | K (`sold` semantics per public reader) | K | plan readout | K | K | — |
| **Servicios** | K | — | K + N | K + slug/id | K | K (payment, entitlement, subscription, package, source health) | K likes / saves / views / CTA clicks / leads | K moderation notes, verified, featured | K suspend / archive / republish / manage | K pending reviews queue, recent inquiries, tier sandbox, advanced table, Supabase truth. **R "Advanced registry" link** (under Advanced / details — see §3) |
| **Restaurantes** | K | — | K + N | K + slug/id | K (adminLaneListingTruth, suspended reason) | K | plan readout | K featured / verified | K | K results link, plan/tier, cuisine/city block |
| **Autos** | K | K All / Dealers / Privados | K lane-scoped + N caption | K | K | K | Stripe hint + plan readout | K | K | **N Dealer group header**: parent + children grouped, active count, capacity with **entitlement proof**, parent-public gate per child; **N Privado term end**; K View-public firewall (`status === "active"`) |
| **Empleos** | K | K lane filter (quick / premium / feria) | K + **N `paymentIssue` derived from evidence** | K | K | K | K applications (new/viewed/shortlisted/rejected/hired), views | K moderation reason | K **ONE** lifecycle system (`ClassifiedAdminRowActions variant="empleos"`) + send-to-review / reject | K Quick / Premium / Feria, advertiser panel link, plan readout |
| **Ofertas Locales** | K (Queue / Live / **History**) | K flyer / coupon lane filter | K + N | K (status, Ad ID now SQL) | K (`ofertaListingTruth`) | K commercial eligibility, asset-term truth, payment / entitlement / term end | — | K AI item review, scan / review state | K approve / reject / archive / restore (canonical, payment-gated) | K flyers, coupons, review, active / expiring / expired / rejected / archived. **Coupon pricing ($0 vs $199) untouched — owner decision** |
| **Comida Local** | K | — | K + N | K + slug/id | K (payment-aware, suspension reason) | K | — | K | K payment-aware only (no raw status dropdown, no `publish`; unpaid draft ⇒ disabled with reason) | K payment anomaly badge |
| **Viajes** | K | — | K + N | K | K (approved AND `is_public`) | K "No payment product" (never "unpaid") | plan readout | K featured / verified | K staged lifecycle (approve / reject / unpublish / …) | — |

Capability lost by this gate: **none**. Capability restored: Servicios Advanced registry link. New: BR lane selector, Autos dealer grouping / entitlement proof / Privado term line, Empleos `paymentIssue`, whole-category/lower-bound summary labelling, truncation notices.

---

## 3. Decisions

### 3.1 Servicios — "Advanced registry" quick link → **restored**
The link (`/admin/categories#advanced-category-registry`, the dense registry table + Supabase save forms) lived in `ServiciosAdminOpsChrome.tsx : ServiciosAdminQuickActions`, a component the normalized page no longer renders, so it vanished from the Servicios page while Clasificados hub / category panels still offer it. It is a registry-level (owner/technical) surface rather than a daily per-listing action, but restoring it costs nothing and the operator lost a way in — so it is back **under "Supabase truth (advanced)"** (`data-testid="servicios-admin-advanced-registry-link"`), not in the daily header. The hub-level entry points are unchanged.

### 3.2 Autos — entitled capacity: traced, shown only when proven
Trace: the dealer inventory pack is **not a listing column**. Enforcement (`api/clasificados/autos/listings`, `checkout`, `listingHasActiveDealerInventoryPack`) reads `listing_package_entitlements` for the group's **main** listing with `package_key = autos_dealer_inventory_pack_monthly`, status literally `active`, and `isListingPackageEntitlementRowActive` (window live, not revoked). Limit = 10 standard, 20 with the pack (`AUTOS_DEALER_BASE_INCLUDED_VEHICLES + AUTOS_DEALER_INVENTORY_PACK_ADDITIONAL_VEHICLES`).
Admin now mirrors that exact rule (`adminAutosDealerCapacity.ts : foldInventoryPackProof / fetchAutosDealerInventoryPackProof`, read-only, ≤100 ids/query) and resolves each group with `resolveDealerGroupCapacity`:

| State | Shown |
|---|---|
| main has a proving active entitlement | `n active · entitled limit 20 (inventory pack proven by an active entitlement on the main listing)` |
| entitlement source readable, none on main | `n active · standard limit 10 (no active inventory-pack entitlement on the main listing)` (+ "above the standard 10 and no inventory pack is proven — verify" when over) |
| entitlement source **unreadable** | standard 10, "could not be read — not assumed" (never 20) |
| group main not identified | standard 10, "pack not attributable" |
| active count unreadable | "Capacity not available" |

`20` is never a literal in the page; the entitled limit only exists inside the proof-gated resolver.

### 3.3 Viajes — `expires_at` deliberately **not** selected
`classifyPublication("viajes_staged_listings")` would label an approved+public row past `expires_at` as EXPIRED. But **no public reader enforces `expires_at`** (`fetchApprovedViajesStagedRows` / `fetchViajesStagedRowBySlugPublic` filter only `lifecycle_status='approved'` + `is_public=true`), so such a row IS live. Selecting `expires_at` in the Admin query would make the chip say EXPIRED for a row the site still serves — violating "Live = public predicate". The verifier pins both facts; if a public reader ever starts enforcing expiry, select the column and show EXPIRED then. No payment path was invented for Viajes.

### 3.4 Empleos — `paymentIssue` derived from evidence
`adminCategorySummary.ts : countEmpleosPaymentIssues / deriveEmpleosPaymentIssue`. Counted: **Quick / Premium** rows that are `draft`, **never published** (`published_at` null) and have **no cleared payment record** (`paid`/`succeeded`/`cleared`/`payment_cleared` in `leonix_payment_records`) — i.e. failed, abandoned or absent payment. Never inferred: Feria (free), rows with a null/unknown lane (legacy — no evidence), rows that were ever live, any status other than draft, drafts that DO have a cleared payment (money is in: an activation follow-up, not a payment issue). Payment records unreadable ⇒ `paymentIssue = null` (`—`) with the error, never a guess. Scan of drafts bounded at 10,000 (`≥` when hit).

---

## 4. Proven NOT defects

* Comida `comidaRowLifecycleActions`: unpaid draft/pending rows show only a disabled action with the payment reason — no raw publish path (already payment-aware).
* Empleos row card has exactly one `ClassifiedAdminRowActions` (the legacy Pub/Review buttons are gone) — asserted in the verifier.
* Ofertas `History` reaches rejected / archived / expired; scope switch keeps only the filters valid in the target scope.
* Autos "View public" stays gated strictly on `status === "active"` (pin preserved).
* Viajes list/summary "expired" = `lifecycle_status = expired` (a status, not a date inference).
* The BR summary's "expired" being FSBO-only (`seller_type = personal`) is correct: Negocio is a subscription with no fixed term.

---

## 5. What remains, and why

| # | Item | Why it remains |
|---|---|---|
| R1 | **Empleos list API** (`app/api/admin/empleos/listings/route.ts`, owned by another lane): swap `fetchAllEmpleosListingsForAdmin({limit,scope,rowFilter})` for `fetchAllEmpleosListingsForAdminDetailed({limit,scope,status,lane,owner_user_id,leonix_ad_id,rowFilter})`, return `{ok:false,error}` on `error` and `scan_capped` on the payload. Until then a read failure there still reads as an empty list (the summary banner does flag an unreadable table) and the status/lane/Ad ID filters run in the bounded scan. The client already reads `scan_capped`. | Route files are outside this gate's edit scope. |
| R2 | Bounded scans that cannot be pushed to SQL stay bounded + disclosed: Autos free-text `q` (vehicle JSON), partial owner fragments (uuid columns), Ofertas derived filters, Rentas/BR Live exactness, Viajes `q`. | No index/operator exists for them; disclosure is the truthful option. |
| R3 | `detail_pairs @>` (`cs`) and the quoted `or()` grammar are proven at the **request-URL** level only (stubbed `fetch`) — not against the live database. | No DB access in this gate. Owner QA: search `casa, 2 recámaras` on Rentas; Rentas queue with a Bienes rent-operation row; BR Privado lane. |
| R4 | `verify-closeout2-empleos-admin` and `verify-closeout2-comida-ofertas-admin` still fail 2 route-source pins each (`requireAdminCookie(jar)`); the routes now use `isVerifiedAdminSession` (route/auth lane). | Their pins belong to that lane; not affected by this gate. |
| R5 | `verify-servicios-final-ui-truth-closeout`, `verify-servicios-golden-trust-closeout` fail public-Servicios UI / touched-file-set pins unrelated to Admin. | Legacy multi-lane tree-diff verifiers. |

---

## 6. Legacy pins updated (intentional) and why

| Verifier | Pin | Why |
|---|---|---|
| `verify-closeout2-shell-adoption.ts` | Travel `fetchViajesStagedAdminQueue({… q: sqlSearch` | Page calls the Detailed form; `q` alone rides the scan, status/owner/Ad ID are SQL predicates. Regex now accepts `…Detailed(` and `q: filters.q`. The "every filter before `.slice(0, queueLimit)`" ordering pin is preserved (defensive re-check kept). |
| `verify-closeout2-shell-adoption.ts` | Servicios reduced schema `if (statusFilter) return { rows: [], fullSchema:false, unavailable:false }` | Reduced schema + status/Live filter is now **reported** (`unavailable: true` + `readError`) instead of returning an empty list. |
| `verify-closeout2-shell-adoption.ts` | `rowQuery.eq("slug", slug)` (Servicios + Restaurantes) | The exact-field early-return path was the defect; the filters live in the shared `qb()` (`if (slug) q = q.eq("slug", slug)`). |
| `verify-closeout2-comida-ofertas-admin.ts` | `leonix_ad_id.ilike.%COMIDA-2026-000001%` | The or() value is now LIKE-escaped and double-quoted (`"%…%"`). |
| `verify-closeout2-admin-shell.ts` | `fetchAdminCategorySummary(categorySlug)` | The generic page may pass `{ lane }` for Bienes Raíces (lane-scoped summary). |

Preserved unchanged (checked): `cat.toLowerCase() === "rentas" && !qLower && detailPairsAvailable && !isLive`, `applyGenericLiveSqlPlan(q, livePlan, nowIso)`, Ofertas `ADMIN_SEARCH_UUID_RE.test(search) ? [`id.eq`, Ofertas `applyOfertasLiveSqlSuperset(query, nowIso)`, Autos `listAllAutosClassifiedsRowsForAdmin(queueLimit, {` / `fetchAutosDealerCapacityForRows(rows)` / View-public gate, Empleos `rowFilter` + route filter-before-fetch order, Travel `q.eq("lifecycle_status","approved").eq("is_public", true)`.

---

## 7. Files

New: `app/admin/_lib/adminFilterTruth.ts`, `app/admin/_lib/adminAutosDealerGroups.ts`, `…/clasificados/_components/normalized/AdminListTruncationNotice.tsx`, `scripts/verify-final-admin-filters.ts`, this doc.
Edited: `listingsAdminSelect.ts`, `adminCategorySummary.ts`, `adminAutosDealerCapacity.ts`, `adminNormalizedShell.ts`, `AdminCategorySummaryPanel.tsx`, `ClasificadosLiveScopePanel.tsx`, `ListingsCategoryOpsQueuePage.tsx`, `clasificados/page.tsx`, pages for servicios / restaurantes / autos / travel / ofertas-locales (+`ofertasAdminView.ts`) / comida-local / empleos (+client), and the data layers `serviciosPublicListingsServer.ts`, `restaurantesPublicListingsServer.ts`, `viajesStagedListingsDbServer.ts`, `empleosPublicListingsDbServer.ts`, `ofertasLocalesAdminHelpers.ts`, `comidaLocalAdminQueries.ts`, `autosClassifiedsListingService.ts`; verifier pins listed in §6.
