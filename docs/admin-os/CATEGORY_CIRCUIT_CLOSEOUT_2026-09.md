# Category circuit closeout — non-interactive audit and repairs (2026-09-19)

Base: `origin/main` @ `dc25e0a5` (Production). Branch: `integration/category-circuit-closeout-2026-09`.
Evidence: source reads (16 lanes), read-only production Supabase queries, existing verifiers. **No payment was made, no production row was
created/changed/deleted, no Stripe/Vercel config was touched.** The signed-webhook 2xx and the full paid-listing runtime proof remain unproven
(blocked on an interactive login + card entry).

## 1. Master category matrix (source-proven; runtime unproven)

| Category | Canonical table | Save | Payment | Activator | Public reader | Dashboard | Admin Queue | Admin Live | Edit same-row | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| Servicios | `servicios_public_listings` | publish API, declared id fail-closed; draft-bound identity | `servicios_base_monthly` sub (entitlement guard) | `activatePaidServiciosListingFromRevenueOs` | `published` (ORDER BY fixed on main) | `/dashboard/servicios`, truthful pending + resume-pay | bespoke card list (best commercial truth) | `published` (agrees) | same UUID; guard 409 | YELLOW→GREEN |
| Restaurantes | `restaurantes_public_listings` | publish API keyed `draft_listing_id` (now duplicate-tolerant, update by PK) | `restaurantes_base_monthly` (guard) | `activatePaidRestauranteListingFromRevenueOs` | `published` | direct query; `pending_payment` now mapped; no resume-pay | bespoke table | `published` (agrees) | same row via draft id; **no unique index** | YELLOW |
| Autos Dealer | `autos_classifieds_listings` (`negocios`) | POST always inserts; session-cached id, PATCH same row | `autos_dealer_monthly` sub (guard + pre-flight) | `activatePaidAutosDealerListingFromRevenueOs` (atomic RPC; now also `draft`/`payment_failed`) | `active` + child-parent gate | dealer inventory section | bespoke table | `active` only (no parent gate) | PATCH same row; preview PATCH-only when id known | YELLOW |
| Autos Privado | same (`privado`) | same | `autos_privado_30d` one-time (pre-flight) | `activatePaidAutosPrivadoListingFromRevenueOs` | `active` + `expires_at` | dashboard card | bespoke table | `active`, ignores `expires_at` | **now same-row Save (was: nothing persisted)** | YELLOW |
| Empleos (quick/premium/feria) | `empleos_public_listings` | envelope API, fail-closed id, lifecycle policy | `empleos_job_post_paid` (draft-only pre-flight); feria free | draft → published on verified payment | `published` | direct query | API list | `published` (agrees) | same row; edit hands id to checkout | YELLOW |
| Rentas | `listings` (rentas) | client-direct `pending` insert; `listing-edit` route | `rentas_30d` (owned `pending` pre-flight) | `pending` → active (+30d) | `browseActive` incl. expiry; generic detail now term-enforced | `mis-anuncios` | generic shell | ignores null-expiry / rentado (disagrees) | same id; client republish no longer flips status | YELLOW (RLS open) |
| Bienes Negocio | `listings` (bienes-raices, roles) | client `pending` insert; `listing-edit` | `br_agent_monthly` sub (guard) + pack add-on | `brListingPaymentService` RPC; `activate_pending` now entitlement-checked | published + child-parent gate | `mis-anuncios` server lifecycle | generic shell + parent ops panel | no parent gate (disagrees) | same id via parent route | YELLOW |
| Bienes Privado/FSBO | `listings` | client pending; session id only | `br_fsbo_45d` (owned `pending` pre-flight) | `pending` → active (+45d) | term + `is_published` | `mis-anuncios`; republish no longer client-flips | generic (lane not shown) | disagrees | generic editor | YELLOW/RED |
| Clases free/paid | `listings` | publisher with attempt key (**column missing in prod**) | `clases_paid_30d` (owned `pending` pre-flight) | `pending` → active (+30d) | now term-enforced | `mis-anuncios` | generic | hides `sold` (disagrees) | generic editar | YELLOW |
| Comunidad | `listings` | same publisher | free | — | published/sold | `mis-anuncios` | generic | hides `sold` | generic | YELLOW |
| Mascotas | `listings` | **now idempotent** (reuse / fail-closed / attempt key) | free | — | published/sold | no Edit button | generic | hides `sold` | — | YELLOW |
| Busco | `listings` | idempotent | free | — | published/sold | `mis-anuncios` | generic | hides `sold` | generic | YELLOW |
| En Venta | `listings` | idempotent | free (matrix `stripeEligible:false`) | client sets active | `active` | `mis-anuncios`; **sold now stays viewable** | generic | null `is_published` disagrees | generic | YELLOW |
| Comida Local | `comida_local_public_listings` | publish API keyed `draft_listing_id`, **unique index exists** | `comida_local_base_monthly` (guard) | `activatePaidComidaLocalListingFromRevenueOs` | `published` | direct query; pending cannot be paid from dashboard | bespoke + raw status dropdown | `published` (agrees) | same row | YELLOW |
| Ofertas Locales | `ofertas_locales` | scan-prep API, declared id | flyer 30d (entitlement gate) | auto-approve after payment | approved + published_at + expires_at | own dashboard | bespoke review list | approved, ignores expiry | — | YELLOW |
| Viajes | `viajes_staged_listings` | submit API, declared id | **none** ($399 in matrix/copy; server now refuses checkout) | admin approve | approved + is_public | two inconsistent lists | bespoke | approved + is_public (agrees) | staged-owner API | RED→YELLOW |

## 2. Blocker ledger

| Pri | Category | Defect | Location | Status |
|---|---|---|---|---|
| P0 | generic listings (Rentas/BR/Clases) | Owner `UPDATE` policy has no column limit → self-activation via the anon API (PROVEN in prod policies) | prod `pg_policies` on `public.listings` | **PROPOSAL** (`PROPOSED_DB_HARDENING_2026-09.md` §1); client-side bypass **FIXED** |
| P0 | Rentas/FSBO/Clases/Empleos/Viajes | Base checkout had no ownership/status pre-flight → double charge / wrong-owner charge | `api/revenue-os/checkout/route.ts` | **FIXED** |
| P0 | Bienes Negocio | `activate_pending` activates a main row with no paid entitlement | `brListingLifecycleService.ts#applyBrActivatePending` | **FIXED** |
| P0 | Autos Privado | Dashboard edit never persisted; only path POSTed a NEW row + new charge | `autosClassifiedsListingService.ts#updateAutosClassifiedsListingDraft`, `AutosApplicationFinalActions.tsx`, `AutosPrivadoApplication.tsx` | **FIXED** (needs interactive QA) |
| P0 | Empleos | Editing a live paid post inserted a new draft + new $24.99 checkout | `EmpleoPremium/QuickApplicationClient.tsx#goPreview` | **FIXED** |
| P0 | Bienes FSBO / En Venta | Client-direct Republish/Reactivate flipped unpaid/flagged rows to active | `mis-anuncios/page.tsx#renewListingsTableRepublish`, `#markStatus` | **FIXED** |
| P0 | generic Admin | Restore/Republish published a never-paid paid-lane row | `api/admin/clasificados/listings/[id]/route.ts` | **FIXED** (`adminReactivationPolicy`) |
| P1 | listings (all quick lanes) | `publish_attempt_key` column + unique index missing in prod (migration drift) | migration `20260804120000_…` | **OPEN — owner applies** |
| P1 | Mascotas | No idempotency: every retry inserts | `publishMascotasPerdidosQuickToListings.ts` | **FIXED** |
| P1 | Clases/Rentas | Paid term not enforced on read | generic detail page, `communityListingsBrowseClient.ts` | **FIXED** (Rentas dedicated readers already enforced) |
| P1 | En Venta | `sold` set `is_published=false` → invisible everywhere | `mis-anuncios/page.tsx#markStatus` | **FIXED** going forward; 1 legacy sold row stays hidden (owner decision) |
| P1 | Busco/Clases/Comunidad/Mascotas | Derived `LNX-…` shown instead of stored `BUSCO-/CLASS-/COM-/PET-…` | `communityLeonixAdId.ts` + 9 call sites | **FIXED** |
| P1 | Empleos | Staff suspend wrote no marker (owner could self-resume); legacy moderate route accepted any status | Admin empleos routes | **FIXED** |
| P1 | Autos | Staff republish left `suspended_reason='moderation'` | Admin autos route | **FIXED** |
| P1 | Restaurantes | Two concurrent first-saves → duplicate rows → every later edit 500 | publish route lookup | **MITIGATED in code**; unique index **OPEN — owner** (0 duplicates today) |
| P1 | Viajes | $399 card advertised, no checkout/fulfilment | `categoryPublishCheckpoints.ts#getViajesCheckpointCards` | server refuses checkout (**FIXED**); copy/price = **OWNER DECISION** |
| P1 | Bienes FSBO | Admin Restore routes null-role FSBO through the Negocio RPC (no term/payment) | admin listings route :190-224 | OPEN |
| P1 | Dashboards | No "complete payment" for pending Restaurantes / Empleos / Rentas / FSBO / Comida Local / Autos Privado | `dashboardMisAnunciosCategoryTools.ts:425` etc. | OPEN |
| P1 | Autos | Confirm flow POSTs a new row whenever the session-cached id is missing | `AutosPublishConfirmCore.tsx:365-378` | OPEN |
| P2 | Admin | Live predicate disagrees with public (Rentas null-expiry/rentado, BR parent gate, Busco/Mascotas/Clases/Comunidad `sold`, Autos privado expiry/parent gate, Ofertas expiry) | `listingsAdminSelect.ts`, autos/ofertas queries | OPEN |
| P2 | Admin | No commercial truth / lane / summary on generic queues; Comida & Ofertas lack the canonical row-action system and audit log; Ofertas rejected/archived/expired unreachable; post-limit filtering on Empleos/Travel/Ofertas/generic Live | see §3 | OPEN |
| P2 | Admin | Destructive "Soft delete"/permanent delete bypass BR child protection and destroy Mux assets | `app/admin/actions.ts` | OPEN |
| P2 | Comida Local | Pending payment cannot be paid from dashboard; edit hides checkout | `ComidaLocalPreviewClient.tsx:327` | OPEN |
| P2 | Bienes/Rentas | Pending-row reuse keyed by title; FSBO reuse is sessionStorage-only | `leonixPublishRealEstateListingCore.ts:498-523` | OPEN |
| P2 | Ofertas | Coupons price $0 (catalog) vs $199 (matrix) | constants vs `revenuePricingMatrix.ts` | OPEN (owner) |
| P2 | Viajes | List/count mismatch (`is_public` filter) | `dashboardInventory.ts:203` | OPEN |
| P3 | Public shells | Autos Privado preview≠detail shell; Servicios Trades+coupons shell split; inline `/anuncio/[id]` Rentas renderer; dead landing components | — | OPEN (legacy) |
| P2 | Iglesias | Prayer/church-intake AI + rules **auto-publish/auto-reject** (authoritative). Separate system, preserved — flagged for owner. | `lib/iglesias/*` | OWNER REVIEW |
| — | AI moderation | Listings AI review and Ofertas AI scan are **advisory** (verified; no auto-flag/hide writer exists) | `listingAiModerationService.ts`, `ofertasLocalesScanApiHandler.ts` | CONFIRMED advisory |

## 3. Admin normalization matrix

Target grammar: header · Queue/Live/Public/Publish · summary · filter bar · canonical row/action system · listing truth · commercial truth · performance · moderation/trust · lifecycle actions · category module.

| Category | Current shell | Normalized? | Missing |
|---|---|---|---|
| Rentas, BR, En Venta, Clases, Comunidad, Mascotas, Busco | shared `ListingsCategoryOpsQueuePage` → `AdminListingsTable` | Partial | commercial truth (dead `!staffQueueMode` branch), summary counts, status/limit filters, performance, BR lane view, report/AI-review context |
| Servicios | bespoke header + rich card | Richest, not shared header | shared header; limit filter |
| Restaurantes | bespoke table + shared header/nav | Partial | summary, status/limit filter, commercial truth, performance |
| Autos (Dealer/Privado) | bespoke table + lane chips | Partial | scope-aware header, summary, real capacity count, commercial truth, Live parent/expiry gate |
| Empleos | client page, TWO lifecycle systems (legacy Pub/Review buttons + staff actions) | No | single lifecycle action system; audit on legacy path; status precondition |
| Comida Local | shared header + raw status dropdown | No | canonical row actions, audit, payment-aware status changes, summary |
| Ofertas Locales | shared header + review list | No | canonical row actions, audit, reachable rejected/archived/expired, filters applied before limit |
| Viajes | bespoke + state machine | Partial | filters before limit, commercial truth |
| Hub (`/admin/categories`) | registry + supplemental entries | **Ofertas Locales added earlier**; Iglesias/Recursos separate | — |

## 4. Verification

New: `scripts/verify-category-circuit-closeout.ts` (executable predicates + source guards). Full typecheck, production build and scoped lint
(identical 14 pre-existing errors on the same files at `origin/main`) run on the branch tip.

## 5. Closeout 2 (same branch) — what changed after the audit was accepted

Admin Live now matches the public readers (`app/admin/_lib/adminLivePredicates.ts`; Queue keeps operational rows): Rentas (future `expires_at`
required, not rentado/bajo_contrato, category=rentas only), Bienes Raíces (FSBO term + active/published parent for inventory children), Busco /
Mascotas / Comunidad / Clases (`sold` is live; Clases paid term), En Venta (`sold` is not live), Autos (Privado expiry + child-parent gate),
Ofertas (the public-offer eligibility predicate). Filters (search/status/owner/Leonix Ad ID/lane/limit) run before the row limit on generic,
Autos, Empleos, Travel, Servicios, Restaurantes, Ofertas and Comida Local; `fetchAdminCategorySummary` provides shared total/live/needs-attention/
payment-issue/expired/source-health counts.

Owner dashboards: pending paid listings show a truthful "payment pending" state, Edit, and Complete payment through Revenue OS only
(Empleos quick/premium drafts, Rentas, Bienes FSBO, Clases paid, Autos Privado, Comida Local; Restaurantes resumes into its existing consent
checkpoint) with no public CTA until live; Viajes list and count agree.

Edit/republish: Autos confirm/preview saves bind the canonical id to the draft and fail closed instead of POSTing a duplicate; Bienes/Rentas
pending-row reuse is draft-key first (then explicit id, title last) and FSBO is included; FSBO Admin Restore no longer uses the Negocio
activation RPC (never grants a new term); Comida Local pending listings resume payment on the same row; Restaurantes first-save reconciles a
race by archiving the losing row; Admin soft delete never destroys video assets and permanent delete refuses BR parents with public children,
public-live rows and paid/entitled rows.

Admin shell: one grammar (scope-aware header, summary, filter bar, listing/commercial/performance/moderation/actions sections) on the generic
shell, Autos (truthful capacity), Empleos (ONE lifecycle action system + payment precondition), Comida Local (guarded canonical actions replace the
raw status dropdown), Ofertas (canonical actions + reachable History view), Travel, Servicios (intelligence preserved) and Restaurantes.

Still open after Closeout 2 (source): see the return summary in the thread. Legacy verifiers that diff the working tree for "forbidden file
changed" fail on any multi-lane branch (they fail identically on any change to those files); every content-pin verifier was either passing
or updated to the new structure.

## 6. Release-candidate forensic closeout (same branch)

A control-flow review of the full delta (six read-only audit passes: dedicated-table lanes, Autos + generic lanes, admin authority + delete,
queue/live/public predicates + limits, shared-helper consumers + shell capability diff, dashboard state machine) found the following genuine
source defects. All are fixed here; each has an executable check in `scripts/verify-forensic-closeout.ts`.

| # | Defect | Fix |
|---|---|---|
| 1 | Generic Admin route: `suspend` / `archive` on a never-paid `pending` Rentas / Bienes / Clases row wrote `flagged` / `removed`, after which `unsuspend` / `republish` passed the payment gate and switched it live. | `decideAdminReactivation` now also blocks a paid-lane row with no `published_at` / `expires_at` (the first paid activation stamps both; a pending-payment insert stamps neither). |
| 2 | Staff "Edit listing" wrote free-text `status`, `is_published` and `category` verbatim — a second publication authority (activate unpaid, skip FSBO term / Negocio capacity, move a row between lanes). | `adminStaffCoreFieldGuard.ts`: category never changes; status / published cannot activate a non-live row (Restore / Republish own the gates). Ignored fields are recorded in the audit meta. |
| 3 | Autos Admin: `archive` refused only `draft` / `pending_payment`, so `payment_failed` → `cancelled` → Restore went live with no payment (and Restore stamped `published_at`). | `adminAutosReactivationPolicy.ts` — archive refuses every pre-publish status; Restore + Republish require a row that was ever published. |
| 4 | Empleos: staff `send_to_review` / `suspend` on an unpaid paid-lane draft stranded it (checkout accepts only `draft`, Restore stays payment-gated). | Refused with `unpaid_draft`; the button is hidden for drafts. `reject` / `archive` remain. |
| 5 | Comida Local checkout never forwarded the recurring-billing consent the checkpoint collects (subscription package → server 422). | `recurringConsent: ctx.recurringConsent` forwarded. |
| 6 | Checkout could open a SECOND Stripe session while the first was `complete` (webhook not landed yet) or unverifiable. | `payment_in_progress` (409) / `checkout_state_unverifiable` (503) before the stale-attempt release. |
| 7 | Checkout pre-flights: Autos package not bound to the row's lane / inventory child; FSBO package accepted any Bienes row. | `autos_listing_package_mismatch`; FSBO requires `isBrFsboRow`. |
| 8 | Owner workspace "Refrescar" (En Venta) and the editor's "Activar" wrote `status='active'` from ANY status (pending, flagged by staff, removed). | Shared `dashboardOwnerMayActivateFromStatus` (paused / sold / active only) on the list, workspace and editor. |
| 9 | Autos success return cleared BOTH lanes' draft identity for any Autos payment (boost, renewal, pack). | Cleared only when the stored identity IS the paid listing (or a base package with an unknown listing id). |
| 10 | Admin Autos queue filtered search / status / owner / Ad ID after a 500-row window. | Filters run inside the paged scan (`rowFilter`), so the limit counts matching rows. |
| 11 | Listing-truth chip said PUBLIC for a Rentas row with no paid term and PAUSED for a public sold Busco / Comunidad / Clases row. | Chip agrees with `isGenericListingPubliclyLive` (Bienes keeps the base semantic — it needs the parent map). |
| 12 | Ofertas scope switch kept a `term` that does not exist in the target scope (empty list). | `term` kept only when the target scope offers it. |
| 13 | Empleos "payment cleared" accepted only `paid`. | Same cleared set as the ledger (`paid` / `succeeded` / `cleared` / `payment_cleared`). |
| 14 | Permanent delete: a Negocio parent with paused / pending / removed children (FK is `ON DELETE SET NULL`) orphaned them; an active subscription was ignored once the row was soft-removed. | `has_linked_children`; an active subscription always blocks a permanent delete. |

| 15 | Servicios / Restaurantes Admin: `pending_payment` → `suspend`/`archive` → `unsuspend` (or a reactivating `republish`) published an unpaid listing with no payment record. | `adminPrePublishActionPolicy.ts`: a pre-publish row (draft / pending / pending_payment / payment_failed) cannot be suspended or archived (`not_published`) nor restored / republished (`payment_required`); wired into both routes. |

### Verified NOT defects (source-proven)
* Restaurantes `POST /publish` without `activation_mode` publishes the FREE application; the paid path always sends `pending_payment`.
* Servicios / Restaurantes / Viajes Admin routes are unchanged from `main`; Viajes has no payment product (checkout refused server-side).
* `br_agent_monthly` is covered by the base-entitlement guard; Negocio pending-child Restore stays blocked on purpose (capacity RPC does not check the subscription).
* Delete removes only the `listings` row: `leonix_payment_records.listing_id` is text (no FK) so payment truth survives; `listing_audit_events` is
  `ON DELETE CASCADE` (intentionally removed with the row — the admin audit log keeps `listing_permanently_deleted_by_admin`).

### Residual (documented, not source-fixable here)
* DB: `public.listings` owner UPDATE policy still allows an owner to write `status` directly (proposed guard trigger, `PROPOSED_DB_HARDENING_2026-09.md` §1);
  `br_negocio_activate_listing` / `autos_dealer_activate_listing` do not verify a live subscription; `restaurantes_public_listings.draft_listing_id` has no unique index.
* Product: Comida Local / Empleos payment-aware owner marker on archive → resume; inventory-add identity scope is never cleared (fails closed, not a duplicate).
