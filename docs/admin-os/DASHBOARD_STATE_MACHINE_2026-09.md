# Owner Dashboard State Machine - 2026-09 (Gate 2)

Branch `integration/category-circuit-closeout-2026-09`. Scope: the USER dashboard (`/dashboard/**`), every category x status.
Companion to `CATEGORY_CIRCUIT_CLOSEOUT_2026-09.md` sections 5-6 (Admin Live predicates, owner-relist rule).

## 1. Doctrine

payment truth != entitlement != listing lifecycle != public visibility != moderation.

The dashboard never calls a listing "Public / Active / Published" from a raw `status` string. One pure module answers it:
`app/(site)/dashboard/lib/dashboardListingStateMachine.ts` (no I/O, client-safe, NOT a publication authority - it never writes
`status` / `is_published`, never starts a payment, never activates anything).

| Term | Meaning | Source of truth |
|---|---|---|
| `live` | on the public RESULTS surface | the Admin Live predicates (`app/admin/_lib/adminLivePredicates.ts`): `isGenericListingPubliclyLive`, `isAutosRowPubliclyLive`, `isEmpleosRowPubliclyLive`, `isServiciosRowPubliclyLive`, `isRestauranteRowPubliclyLive`, `isComidaLocalRowPubliclyLive`, `isViajesRowPubliclyLive` |
| `linkResolves` (= "View public") | a public DETAIL link would resolve | `live`, plus the documented direct-URL state (`sold` En Venta / Bienes Raices) via `isListingRowPublicDetailEligible` |
| `termElapsed` | a paid / fixed term ended while `status` still says `active` | Rentas / FSBO / Clases / En Venta / Autos Privado term predicates (Comunidad / Busco / Mascotas: never - their readers ignore `expires_at`) |
| owner "active" count / Active tab | `live` rows only | `dashboardCountLiveListingRows`, `dashboardListingsRowBucket` |
| owner relist | only what the owner took offline (`paused` / `sold`) | `dashboardOwnerMayActivateFromStatus` |

## 2. What the owner sees, per category x status

Generated from the real module (`dashboardOwnerActionPlan`) with fixtures; `scripts/verify-final-dashboard-state-machine.ts` asserts the
same matrix. "Owner sees" lists the actions the dashboard offers; **bold** = the two that must be exactly right (a public link that
never 404s, a payment doorway that always reuses the SAME listing row). "Resume" is the "Reactivate" button. "Archive" is the owner
soft-archive (`status = removed`, row + Leonix Ad ID + analytics preserved).

NON-PUBLIC listings offer: Edit, Preview / Draft preview, Complete / Resume payment when valid, and a status reason - never a dead
"View public", a fake published state, a public URL that 404s, or a Republish that bypasses payment / moderation.
PUBLIC listings offer: View public, Edit, analytics where supported, category tools, Save & Republish of the SAME row.

Statuses that do not exist for a table simply have no row in its table (for example `listings` has no `pending_payment`; its unpaid state is
`pending` + `is_published != true`). The 14 requested statuses map as: draft = `draft` / `is_published=false`; pending / pending_payment /
payment_failed = the unpaid rows; published / active = live; paused / suspended / rejected / expired / sold / archived / removed / cancelled
as listed per table (`archived` and `removed` are the owner / staff soft-archive states; `cancelled` and `payment_failed` exist for Autos).


#### Rentas (shared `listings`, paid 30-day term, future `expires_at` REQUIRED)

| Status (fixture) | Owner sees | Reason chip |
|---|---|---|
| draft | Edit, Archive | draft |
| pending (unpaid) | Edit, **Complete payment**, Archive | payment_pending |
| active, term running | Edit, Preview, **View public**, Pause, Archive | live |
| active, term ELAPSED | Edit, Renew, Archive | expired (term elapsed) |
| active, rented / under contract | Edit, Archive | rented |
| paused | Edit, Resume, Archive | paused |
| paused, term elapsed | Edit, Archive | paused (term elapsed) |
| flagged (staff) | Edit, Archive | suspended_moderation |
| expired | Edit, Archive | expired |
| removed (archived) | (none) | removed |

#### Bienes Raices - FSBO / Privado (45-day term)

| Status (fixture) | Owner sees | Reason chip |
|---|---|---|
| pending (unpaid) | Edit, **Complete payment**, Archive | payment_pending |
| active, term running | Edit, Preview, **View public**, Pause, Mark sold, Archive | live |
| active, term ELAPSED | Edit, Renew, Archive | expired (term elapsed) |
| paused | Edit, Resume, Archive | paused |
| sold | Edit, **View public**, Archive | sold |
| flagged (staff) | Edit, Archive | suspended_moderation |
| removed (archived) | (none) | removed |

#### Bienes Raices - Negocio (subscription; main + inventory children)

| Status (fixture) | Owner sees | Reason chip |
|---|---|---|
| MAIN active | Edit, Preview, **View public**, Pause, Mark sold, Archive | live |
| MAIN pending (subscription unpaid) | Edit, Archive | payment_pending |
| MAIN paused | Edit, Resume, Archive | paused |
| CHILD active, parent active | Edit, Preview, **View public**, Pause, Mark sold, Archive | live |
| CHILD active, parent paused | Edit, Archive | not_public |
| CHILD paused | Edit, Resume, Archive | paused |

#### Clases (paid 30-day term; free classes are moderated)

| Status (fixture) | Owner sees | Reason chip |
|---|---|---|
| pending, paid class (unpaid) | Edit, **Complete payment**, Archive | payment_pending |
| pending, free class (in review) | Edit, Archive | in_review |
| active, term running | Edit, Preview, **View public**, Pause, Archive | live |
| active, term ELAPSED | Edit, Archive | expired (term elapsed) |
| sold (live for Clases) | Edit, Preview, **View public**, Archive | live |
| paused | Edit, Resume, Archive | paused |
| removed (archived) | (none) | removed |

#### En Venta

| Status (fixture) | Owner sees | Reason chip |
|---|---|---|
| draft (`is_published=false`) | Edit, Archive | draft |
| pending | Edit, Archive | in_review |
| active | Edit, Preview, **View public**, Pause, Mark sold, Archive | live |
| sold (direct-URL only) | Edit, **View public**, Archive | sold |
| paused | Edit, Resume, Archive | paused |
| flagged (staff) | Edit, Archive | suspended_moderation |
| expired | Edit, Archive | expired |
| removed (archived) | (none) | removed |

#### Comunidad

| Status (fixture) | Owner sees | Reason chip |
|---|---|---|
| pending | Edit, Archive | in_review |
| active | Edit, Preview, **View public**, Pause, Archive | live |
| sold / resolved (live) | Edit, Preview, **View public**, Archive | live |
| paused | Edit, Resume, Archive | paused |
| flagged (staff) | Edit, Archive | suspended_moderation |
| removed (archived) | (none) | removed |

#### Busco

| Status (fixture) | Owner sees | Reason chip |
|---|---|---|
| pending | Edit, Archive | in_review |
| active | Edit, Preview, **View public**, Pause, Archive | live |
| sold / resolved (live) | Edit, Preview, **View public**, Archive | live |
| paused | Edit, Resume, Archive | paused |
| flagged (staff) | Edit, Archive | suspended_moderation |
| removed (archived) | (none) | removed |

#### Mascotas y Perdidos

| Status (fixture) | Owner sees | Reason chip |
|---|---|---|
| pending | Edit, Archive | in_review |
| active | Edit, Preview, **View public**, Pause, Archive | live |
| sold / resolved (live) | Edit, Preview, **View public**, Archive | live |
| paused | Edit, Resume, Archive | paused |
| flagged (staff) | Edit, Archive | suspended_moderation |
| removed (archived) | (none) | removed |

#### Autos (`autos_classifieds_listings`; Privado = one-time 30 days, Negocios = dealer subscription)

| Status (fixture) | Owner sees | Reason chip |
|---|---|---|
| Privado draft | Edit, Draft preview, **Complete payment** | payment_pending |
| Privado pending_payment | Edit, Draft preview, **Complete payment** | payment_pending |
| Privado payment_failed | Edit, Draft preview, **Complete payment** | payment_failed |
| Privado active, term running | Edit, Draft preview, **View public**, Archive | live |
| Privado active, term ELAPSED | Edit, Draft preview, Renew, Archive | expired (term elapsed) |
| Privado removed (owner unpublish) | Edit, Draft preview, Resume | removed |
| Privado removed (staff, `suspended_reason`) | Edit, Draft preview | suspended_moderation |
| Privado cancelled | Draft preview | cancelled |
| Dealer main pending_payment | Edit, Draft preview | payment_pending |
| Dealer main active | Edit, Draft preview, **View public**, Archive | live |

#### Restaurantes

| Status (fixture) | Owner sees | Reason chip |
|---|---|---|
| pending_payment | Edit, Draft preview, **Complete payment** | payment_pending |
| published | Edit, Preview, **View public** | live |
| suspended (staff) | Edit | suspended_moderation |
| suspended (payment) | Edit | suspended_payment |
| archived | Edit | archived |

#### Servicios

| Status (fixture) | Owner sees | Reason chip |
|---|---|---|
| draft | Edit | draft |
| pending_payment | Edit, Draft preview, **Complete payment** | payment_pending |
| published | Edit, Preview, **View public**, Pause | live |
| paused_unpublished | Edit, Resume | paused |
| suspended | Edit | suspended |

#### Empleos

| Status (fixture) | Owner sees | Reason chip |
|---|---|---|
| draft, paid lane (quick/premium) | Edit, **Complete payment**, Archive | payment_pending |
| draft, Feria (free) | Edit, Resume, Archive | draft |
| pending_review | Edit, Archive | in_review |
| published | Edit, Preview, **View public**, Pause, Archive | live |
| paused by owner | Edit, Resume, Archive | paused |
| paused by staff (`moderation_reason`) | Edit, Archive | paused_staff_hold |
| rejected | Edit, Archive | rejected |
| archived, was live | Edit, Resume | archived |
| archived, never live | Edit | archived |
| archived, staff reason | Edit | archived_staff_hold |

#### Viajes (`viajes_staged_listings`; no payment product)

| Status (fixture) | Owner sees | Reason chip |
|---|---|---|
| draft | Edit, Draft preview, Resubmit | draft |
| submitted / in_review | Edit, Draft preview | in_review |
| changes_requested | Edit, Draft preview, Resubmit | changes_requested |
| rejected | Edit, Draft preview, Resubmit | rejected |
| approved + public | Edit, Draft preview, **View public**, Unpublish | live |
| approved, not public | Edit, Draft preview | not_public |
| expired | Edit, Draft preview | expired |
| unpublished | Edit, Draft preview, Resubmit | archived |

#### Comida Local (`comida_local_public_listings`; monthly subscription)

| Status (fixture) | Owner sees | Reason chip |
|---|---|---|
| draft | Edit | draft |
| pending_payment | Edit, Draft preview, **Complete payment** | payment_pending |
| published | Edit, Preview, **View public**, Pause | live |
| paused by owner | Edit, Resume | paused |
| paused by staff (marker in `suspended_reason`) | Edit | paused_staff_hold |
| suspended (staff) | Edit | suspended_moderation |
| suspended (payment) | Edit | suspended_payment |

Reading notes
* Rentas "paused, term elapsed": the owner can Edit / Archive only - a paused row with an elapsed term must be renewed by a paid renewal, and the
  `Renew` button is offered on the `active` / `expired` term-elapsed row (never a free relist into a dead row).
* BR Negocio: no base-checkout button exists in the dashboard (monthly subscription; the recurring-billing consent lives in the publish
  flow's checkout checkpoint). An unpaid Negocio row shows "Pending - not published" and Edit.
* Autos dealer main `pending_payment`: same reason (subscription consent) - Edit / Draft preview only. Autos Privado has the Revenue OS doorway.
* Comida Local `suspended` is never owner-resumable; a `paused` row with a `suspended_reason` marker is a STAFF hold (see 4, item 8).
* Restaurantes / Servicios `pending_payment` resume into the category's own checkout checkpoint (consent) for the SAME row; the Empleos /
  Rentas / FSBO / Clases / Autos Privado doorways call Revenue OS with the row's own `listingId`.

## 3. Defects fixed (all reported items)

| # | Defect | Fix (file : function) |
|---|---|---|
| 1 | Comida Local "View public" shown for paused / suspended / unknown rows (deny-list); Comida dashboard also faked a "Published" date on unpaid rows and collapsed `suspended` into "Paused" | `comidaLocalPaymentResume.ts : comidaLocalRowHasPublicPage` (allow-list `published`), new `comidaLocalOwnerActionPlan` / `comidaLocalOwnerReasonNote`; `ComidaLocalDashboardListings.tsx` uses the plan (public link, Pause, Resume, chip, reason note, no Published date for payment_pending / draft) |
| 2 | Shared listing cards offered "View public" from `status` alone (paused / expired / term-elapsed / removed / flagged / rented) | `mis-anuncios/page.tsx` (generic card `genericPublicLinkOk`), `LeonixRealEstateListingManageCard.tsx` (`liveState.linkResolves`, "Expired" / "Active, not public" chips, FSBO preview), `EnVentaListingManageCard.tsx` + `AutosClassifiedListingManageCard.tsx` (`publicViewAllowed`), `mis-anuncios/[id]/page.tsx` (`wsViewPublic`, BR child parent read), `AutosDealerInventoryDashboardSection.tsx` (Privado term, dealer-child parent gate) |
| 3 | Bienes child "Ver publica" and the group's "View main listing" always linked | `BrNegocioListingInventoryActions.tsx : childPublicOk` (active + published child AND active published same-owner main parent), `BrPropertyInventoryDashboardSection.tsx : mainPublicOk` |
| 4 | Viajes inventory "Preview" opened a stage-less preview | `dashboardInventory.ts : viajesStagedPreviewHref` (`?stagedId=<row id>`) |
| 5-7 | Rentas / FSBO / Clases rows whose term elapsed (status still `active`) counted as Active and hidden from Expired | `dashboardListingStateMachine.ts : dashboardListingsRowBucket` used by `passesTab`; `dashboardCountLiveListingRows` used by `ownerEngagementListingKeys.ts : countOwnerActiveListingsAcrossSources` (also Autos Privado term); `dashboardLiveListingRows` used by `derivedDashboardFeed.ts` so a term-elapsed row is not nudged with "No views yet" as if it were live |
| 8 | Comida archive marker | reader side: `comidaLocalOwnerActionPlan` (a `paused` row with a `suspended_reason` marker is a staff hold, not owner-resumable) + `suspended_reason` now selected. Writer side = RESIDUAL (section 4) |
| 9 | Empleos archive: dead Reactivate on staff holds / never-live archives; refusals swallowed | `dashboardEmpleosOwnerTransitions` (calls the server `resolveEmpleosOwnerTransition`; stricter for archived + staff reason), list card + both Empleos pages + `buildInventoryListingActions`, refusal codes shown (`dashboardEmpleosTransitionErrorMessage`) |
| 10 | Comida edit-context marker (one global localStorage key, never cleared on abandon) hijacked the next NEW application preview | `comidaLocalListingEditContext.ts : resolveComidaLocalPreviewEditTarget` (owner-scoped, `pending_payment` only) + `ComidaLocalPreviewClient.tsx` (clears a stale marker) |
| 11 | Cards calling a row Public / Active solely from `status` | see 2 + `dashboardInventoryRowIsPubliclyLive` (Autos Privado term), `listingsRowIsPublicLive` for legacy autos rows, chips "Expired" / "Active, not public" |
| 12 | Complete-payment doorways: a blank id could post a listing-less checkout; a Comida resume could pay a different row | `dashboardResumePaymentClient.ts : startDashboardResumePayment` (refuses a blank id), `ComidaLocalPreviewClient.tsx` (aborts before checkout if the pending save returned a different row) |
| R | Read errors rendered as "no listings" | `mis-anuncios/page.tsx` (`readOwner*` results, `loadFailed` / `countsFailed` / `categoryLoadError` -> error card + retry, failed category not cached), `dashboardInventory.ts : readOwner*`, `comidaLocalDashboardQueries.ts : listUserComidaLocalListingsResult`, `dashboardMisAnunciosCategoryLoadPlan.ts : fetchDedicatedCategoryCountsChecked`, `dashboard/empleos` (list + detail), `dashboard/servicios`, `dashboard/ofertas-locales`, `AutosDealerInventoryDashboardSection.tsx` |
| X | "Republish" on a non-live BR / Rentas row was a dead button (`renewListingsTableRepublish` refuses non-live rows) | only "Move to top" (live rows) is offered |

## 4. Verified NOT defects

* Ofertas Locales owner list: the public link already comes from `operationalStatus.publicLinkAllowed` (server-side, term-aware).
* Restaurantes dashboard: public "View" only when `published`, read error already an error; Servicios page already hid the public link for non-published rows.
* Viajes dashboard page: a failed read already shows the error; the public link is already `approved AND is_public`; the list and the tab count agree.
* Viajes `editHref` (`/dashboard/viajes?stagedId=`) is the intended "Manage submission" doorway (the page lists the row; the editor is `/publicar/viajes/{lane}?stagedId=`).
* Ordinary edit never creates a new listing: Comida edit is `edit=1&listingId=` (`fetchOwnerComidaLocalListingForEdit` forces the row's own `draft_listing_id`); Autos / Bienes / Rentas / Restaurantes edit safety is pinned by `verify-closeout2-edit-safety.ts`.
* En Venta `sold` keeps its direct-URL "View public" (documented state; `isListingRowPublicDetailEligible`), it is simply not counted as live.

## 5. Residual (documented, not fixable inside this scope)

* Comida Local staff `archive` writes `status = paused` with no marker (`comidaLocalAdminModeration.ts`, Admin scope), and the owner lifecycle route
  (`app/api/clasificados/comida-local/lifecycle/route.ts`) resumes any `paused` row. Needed: staff archive writes `suspended_reason = 'staff_archived'`
  (any non-empty value already reads as a staff hold in the dashboard), and the owner resume adds `.is('suspended_reason', null)` to its CAS. Until then a
  legacy / unmarked staff archive looks like an owner pause.
* Empleos staff `archive` (`adminEmpleosStaffActions.ts`) writes no `moderation_reason`, and `resolveEmpleosOwnerTransition` only treats paused /
  pending_review / rejected as staff holds. Needed: staff archive stamps a marker (e.g. `staff_archived`) and `archived` joins the staff-hold set in the
  policy. The dashboard already refuses to offer Reactivate for `archived` + a `moderation_reason`, and never offers a never-live reopen.
* The generic `listings` soft-archive (`status = removed`) is written by both owner and staff; no marker distinguishes them (the dashboard shows "Removed").
* `countOwnerActiveListingsAcrossSources` still does not count Comida Local (published rows) or Ofertas, and Viajes counts `is_public` only (Gate 2A pins the
  six-table `Promise.all`); its Servicios degraded-schema fallback still counts every row.
* Owner "active" count falls back to the status-only upper bound only when no row tier of `listings` is readable (degraded schema).
* Autos privado "Preview" label / `Draft preview` naming differs per surface (presentation only).

## 6. Verification

* `scripts/verify-final-dashboard-state-machine.ts` - matrices for every category x status (public-link predicate, action availability), tabs / counts, Empleos
  never looser than the server policy, read-failure reporting with fake Supabase clients, Comida marker + payment-resume id, and source guards.
* Re-run unchanged: `verify-closeout2-dashboard.ts`, `verify-category-circuit-closeout.ts`, `verify-closeout2-edit-safety.ts`, `verify-comida-local-gate1-lifecycle.ts`.
* Legacy pins updated (`verify-closeout2-dashboard.ts`): the Viajes list-select guard now reads `readOwnerViajesListings` (the select moved there; the old name is a
  thin wrapper), and the Empleos "only Feria drafts may resume" literal now asserts `dashboardEmpleosOwnerTransitions` / `empleosTransitions.resume` (superset of the same rule).
