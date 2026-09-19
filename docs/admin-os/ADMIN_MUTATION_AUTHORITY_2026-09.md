# Admin mutation authority - Gate 5 (2026-09)

Branch `integration/category-circuit-closeout-2026-09`. Follows `CATEGORY_CIRCUIT_CLOSEOUT_2026-09.md` section 6.
Executable proof: `scripts/verify-final-admin-authority.ts` (pure decision modules, the real Comida Local mover against a fake
client, the read-only hold loaders, plus source guards for routes / server actions / the Admin table).

## Doctrine

Admin is never a second payment, entitlement or subscription authority. Every Admin write is one of:
1. a **moderation** decision (suspend, reject, archive, review, approve a moderation queue item);
2. a **reversal of a moderation decision** (restore / republish) that is allowed only for a row that WAS live, whose paid term / entitlement / payment
   hold does not forbid it, through the SAME id (`.eq("id", id)` on every write; no Admin lane route inserts or upserts a listing row);
3. a **trust flag** (feature = `admin_promoted` / `promoted` / `featured`, verify = `leonix_verified`) that never touches a publication column.

Payment truth is written only by Revenue OS (verified webhook, cleared manual payment through `requireRevenueProtectedWriteAccess`,
permission-gated complimentary grants). Admin lane routes only READ payment / entitlement / subscription evidence, and a failed read fails CLOSED.

## Defects fixed in this gate

| # | Defect | Fix (file:function) |
|---|---|---|
| 1 | **Payment suspension override.** A `public.listings` row the payment engine suspended (`status='suspended'`, `suspended_reason='payment'`: grace expired / canceled subscription / chargeback) could be flipped live by Admin `unsuspend` / a reactivating `republish` (FSBO passed `decideBrFsboAdminRestore` whenever its term had not elapsed; Negocio went through the capacity RPC). Staff `suspend` overwrote the engine state with `flagged`, stranding the engine's compare-and-swap lift. Staff Edit's free-text status could rewrite it. | `adminPaymentSuspensionPolicy.ts:decideAdminReactivationHold` / `decideAdminSuspendOverPaymentHold`; `adminPaymentSuspensionPolicyServer.ts:evaluateAdminReactivationHold`; `adminBrFsboRestorePolicy.ts:decideBrFsboAdminRestore` (`payment_suspended`); `api/admin/clasificados/listings/[id]/route.ts` (hold before any write, `suspended_reason <> 'payment'` compare-and-set on the unsuspend and republish writes, suspend refused over an engine suspension); `adminStaffCoreFieldGuard.ts:guardStaffCoreFieldLifecycle` (`lifecycle_change_ignored_payment_suspension`); `actions.ts:setListingPublishedAction` (show-public = `active` rows only, never a payment hold). Owner relist / resume already refuse `suspended` / `flagged` / `removed` (`brFsboOwnerStatusAuthority.ts`, now asserted). |
| 1b | Same hole on every other lane that carries the payment marker: Servicios, Restaurantes, Autos, Comida Local Republish. Servicios / Restaurantes / Autos-negocios / Negocio could also be restored after their base entitlement expired or was canceled. | The same hold (payment reason + **lapsed base entitlement**: an entitlement is on record and none is live) wired into `api/admin/{servicios,restaurantes,autos}/listings/[id]/route.ts`, the Negocio path of the generic route and `comidaLocalAdminQueries.ts:applyAdminComidaLocalAction`. |
| 1c | Legacy Servicios status FORM (`ServiciosAdminOpsListingCard` -> `updateServiciosPublicListingStatusAction`) was a raw status setter: any status except `pending_payment` -> `published`, including `draft`, `preview_ready`, `publish_ready`, payment-held `suspended`, lapsed `paused_unpublished`. | `adminPrePublishActionPolicy.ts:decideServiciosStatusFormChange` + hold + status compare-and-set + audit (`servicios/actions.ts`). Refusals save the moderation notes only. |
| 1d | Elapsed paid term: Admin Restore / Republish flipped a Rentas / Clases / Autos-Privado row `active` with an elapsed `expires_at` (never re-granted, so an expired term was reported live). | `adminReactivationPolicy.ts:decideAdminReactivation` and `adminAutosReactivationPolicy.ts:decideAutosAdminReactivation` -> `renewal_required` (FSBO already had it). |
| 1e | `setListingPublishedAction(true)` wrote `is_published=true` on ANY status (pending / removed / suspended) - and on a pending FSBO row it defeats the fulfilment compare-and-set (`is_published=false`), so a real payment would never activate. | `adminReactivationPolicy.ts:decideAdminShowPublic` + `.eq("status","active")`. |
| 1f | Empleos: a once-live paid post under chargeback could be restored. | `adminEmpleosStaffActions.ts:empleosStaffActionNeedsReversalCheck` / `payment_reversed` (disputed only; a refund is a separate audited admin decision). |
| 1g | Ofertas: archive -> restore -> approve re-stamped `published_at` / `expires_at` = a fresh full term with no payment. | `ofertasLocalesAdminReviewMutations.ts:decideOfertaApprovalTerm` (`preserve` a running bought term, `term_elapsed_renewal_required` otherwise; first activation unchanged). |
| 2 | Viajes staged moderate route nulled `review_notes` / `moderation_reason` whenever the caller omitted them (`typeof x === "string" ? ... : null`), wrote no audit row, and treated an unknown action as `submitted`. | `api/admin/viajes/staged-listings/moderate/route.ts`: `noteField` (blank / absent PRESERVES), strict action allow-list, 404 for a missing row, awaited `appendAdminAuditLog` (`viajes_staged_admin_<action>`, from/to state, note-updated flags). |
| 3 | Comida Local: a silent fallback select (`..._NO_REASON`) let a queue row lose its `suspended_reason`; the mover guessed `null`; a raw DB message was returned on a failed write. | Fallback removed (`comidaLocalAdminQueries.ts`); `applyAdminComidaLocalAction` requires the reason (`suspended_reason_read`), read error -> 500 `lookup_failed`, missing key -> 500 `suspension_reason_unreadable`, entitlement unreadable -> 500, update error -> safe message; every refusal is BEFORE the single compare-and-set update, so there is never a partial write. Restore AND Republish now carry the `suspended_reason IS NULL OR = 'moderation'` CAS and refuse every payment-owned reason. |
| 4 | Production Next redacts the message of an Error thrown from a server action; `deleteListingAction` threw `code: message`. | `actions.ts`: `deleteListingAction` / `setListingPublishedAction` RETURN `AdminListingActionResult = { ok: true } | { ok: false, code, message }`; bulk soft / permanent delete return per-row `code: message` (from `adminDeleteGuardMessage`, fixed safe strings) and a whole-batch `error`; no `throw` remains on the guard paths. `AdminListingsTable.tsx` renders `result.message` (single delete, bulk soft, bulk permanent, show / hide). Success shape and every guard are unchanged. |
| 5 | Ofertas legacy review route mapped business refusals to HTTP 500 with no message. | `api/ofertas-locales/admin/[id]/review/route.ts` uses `ofertaReviewErrorHttpStatus` / `ofertaReviewErrorMessage`. |

Role-guard 403s on the generic and Autos routes now carry `message` (the row-action component renders `message ?? error`).

## Invariants and where each is proven

| Invariant | Evidence |
|---|---|
| Unpaid cannot become public | Generic / FSBO: `decideAdminReactivation` + `decideBrFsboAdminRestore` (`payment_required`, never-live); Autos: `decideAutosAdminReactivation`; Servicios / Restaurantes: `decideAdminPrePublishAction` + `decideServiciosStatusFormChange`; Empleos: `decideEmpleosStaffAction` (`payment_required`, `unpaid_draft`); Comida: `comidaLocalRowHasPaymentProof`; Ofertas: approve gate (paid entitlement OR courtesy). Show-public: `decideAdminShowPublic`. Staff Edit: `guardStaffCoreFieldLifecycle`. |
| Expired entitlement cannot be treated active | `classifyAdminEntitlementRows` (active + future `ends_at` only) -> `entitlement_lapsed`; elapsed term -> `renewal_required` (Rentas, Clases, FSBO, Autos Privado); Ofertas `term_elapsed_renewal_required`. |
| `payment_failed` cannot become public (status laundering) | Autos: `AUTOS_PRE_PUBLISH_STATUSES` (archive refused, restore refused); Servicios / Restaurantes: `ADMIN_PRE_PUBLISH_STATUSES`; the engine's `payment_failed` (Autos) is not a restorable status (`not_removed_or_cancelled`). |
| Canceled cannot become public | Autos `cancelled` restore needs `published_at` (ever live) AND, for dealers, a live entitlement when one is on record; subscription canceled -> engine suspends -> payment hold (`payment_suspension_active`). |
| Removed cannot become public unless once-live | `decideAdminReactivation` / `decideAutosAdminReactivation` / `decideBrFsboAdminRestore` require `published_at` or `expires_at`; Servicios / Restaurantes pre-publish policy refuses suspend / archive of a never-published row so it can never become "restorable". |
| A staff moderation hold cannot be owner-restored | Autos: staff suspend writes `suspended_reason='moderation'` (owner restore refuses any reason); Empleos: `moderation_reason` marker; FSBO owner: `BR_FSBO_MODERATED_STATUSES`; generic owner activation: `dashboardOwnerMayActivateFromStatus`. **DB-level owner UPDATE remains residual R1.** |
| Parent / child rules cannot be bypassed | `assertBrNegocioActionAllowed` / `assertAutosDealerActionAllowed` on every route call; delete guard (`has_public_children`, `has_linked_children`, `child_role_unconfirmed`); Negocio / dealer reactivation only through the capacity RPCs. Autos: `suspend` / `unsuspend` are the moderation verbs and are child-allowed by design; the structural verbs `archive` / `remove_public` / `restore_active` are parent-only. |
| Term expiry cannot be bypassed | see `renewal_required` rows above; Admin never writes `expires_at` (verified: no lane route patch contains it). |
| Admin creates no payment / entitlement / subscription truth | Source guard: no lane route / mover writes `leonix_payment_records`, `listing_package_entitlements`, `leonix_subscription_records` or any `payment_status` / `entitlement_status` / `package_entitlement_id` / `payment_record_id` value. The hold loaders are SELECT-only. The sanctioned money paths are outside this matrix: `api/admin/revenue-os/manual-payments` (`requireRevenueProtectedWriteAccess`, verified cleared funds) and `workspace/package-entitlements/actions.ts` (`assertCanManageEntitlement`, complimentary / partner courtesy grants). They were not re-audited in depth here. |
| Same UUID always | Every Admin lane write is `.update(...).eq("id", id)`; none of the routes inserts or upserts a listing row. |

## Matrix

Verdicts: **PROVEN** = the guard exists in source and is asserted by an executable check; **N/A** = the lane has no Admin verb of that kind
(the row cannot be mutated that way); **NOT PROVEN** = a residual documented below. "R2" = a base-package row with no entitlement record.

### Generic listings (Rentas, Clases, En Venta, Comunidad, Mascotas y Perdidos, Busco) - `api/admin/clasificados/listings/[id]/route.ts` PATCH, `actions.ts`

| Action | Entry point (file:function) | Guards | Verdict |
|---|---|---|---|
| publish | no Admin verb; show-public `actions.ts:setListingPublishedAction`; Edit `updateListingCoreFieldsStaffAdminAction` | `decideAdminShowPublic` (active only, no payment hold), `guardStaffCoreFieldLifecycle`; activation only by Revenue OS fulfilment | PROVEN |
| approve | none (free lanes publish at submit; no Admin review queue) | - | N/A |
| restore | route `unsuspend` | `decideAdminReactivation` (never-live, elapsed term), hold, payment CAS | PROVEN |
| republish | route `republish` | `canRepublishListing`; a reactivating republish runs the same gates, a live row only updates bookkeeping | PROVEN |
| pause | none (owner action) | - | N/A |
| suspend | route `suspend` (-> `flagged`) | refused over an engine `suspended` row; role guard | PROVEN |
| review | `api/admin/clasificados/listings/[id]/ai-review` (+ bulk) | advisory: writes a review record + audit only (`verify-category-circuit-closeout`) | PROVEN |
| reject | none (staff uses archive) | - | N/A |
| archive | route `archive` (-> `removed`) | role guard; restore is gated | PROVEN |
| sold | none | - | N/A |
| delete | `actions.ts:deleteListingAction` | `evaluateAdminListingDeletes(soft)`, structured result | PROVEN |
| permanent delete | `actions.ts:permanentlyDeleteListingsAction` | public-live / paid / subscription / entitlement / children guards, fails closed | PROVEN |
| feature | route `promote_on` / `promote_off` | writes `admin_promoted` only | PROVEN |
| verify | route `verify_on` / `verify_off` | writes `leonix_verified` only | PROVEN |

### Bienes Raices FSBO (Privado) - same route + `adminBrFsboRestorePolicy.ts`

| Action | Entry point | Guards | Verdict |
|---|---|---|---|
| publish | none (Revenue OS `activatePaidBienesFsboListingFromRevenueOs`) | Edit / show-public cannot activate | PROVEN |
| approve | none | - | N/A |
| restore | route `unsuspend` | `decideBrFsboAdminRestore`: `payment_required`, `renewal_required`, **`payment_suspended`**; hold; status CAS + payment CAS | PROVEN |
| republish | route `republish` | same decision on a reactivating republish | PROVEN |
| pause | none (owner: `brFsboOwnerStatusAuthority`) | owner cannot leave moderated / suspended states | N/A |
| suspend | route `suspend` | refused over an engine suspension | PROVEN |
| review | AI review (advisory) | - | PROVEN |
| reject | none | - | N/A |
| archive | route `archive` | - | PROVEN |
| sold | none (owner) | - | N/A |
| delete | `deleteListingAction` | soft guard | PROVEN |
| permanent delete | `permanentlyDeleteListingsAction` | paid / entitled rows blocked until soft-removed; subscription always blocks | PROVEN |
| feature | `promote_on` / `promote_off` | - | PROVEN |
| verify | `verify_on` / `verify_off` | - | PROVEN |

### Bienes Raices Negocio (parent / inventory children) - same route

| Action | Entry point | Guards | Verdict |
|---|---|---|---|
| publish | none (capacity RPC via fulfilment) | Edit guard `activation_ignored_capacity_rpc_required` | PROVEN |
| approve | none | - | N/A |
| restore | route `unsuspend` -> `activateBrNegocioListingAtomic` | hold (payment reason / `suspended` + **lapsed `br_agent_monthly`**), capacity RPC, `decideAdminReactivation` | NOT PROVEN (R2 + RPC does not verify a subscription) |
| republish | route `republish` -> RPC | same | NOT PROVEN (R2) |
| pause | none | - | N/A |
| suspend | route `suspend` | role guard; refused over engine suspension | PROVEN |
| review | AI review (advisory) | - | PROVEN |
| reject | none | - | N/A |
| archive | route `archive` | parent-only (`assertBrNegocioActionAllowed`) | PROVEN |
| sold | none | - | N/A |
| delete | `deleteListingAction` | parent with public children refused | PROVEN |
| permanent delete | `permanentlyDeleteListingsAction` | `has_public_children`, `has_linked_children`, paid / entitled | PROVEN |
| feature | `promote_on` / `promote_off` | - | PROVEN |
| verify | `verify_on` / `verify_off` | - | PROVEN |

### Servicios - `api/admin/servicios/listings/[id]/route.ts`, `servicios/actions.ts`

| Action | Entry point | Guards | Verdict |
|---|---|---|---|
| publish | none (Revenue OS `activatePaidServiciosListingFromRevenueOs`); legacy status form `updateServiciosPublicListingStatusAction` | `decideServiciosStatusFormChange` + hold + status CAS | PROVEN |
| approve | route `unsuspend` from `pending_review`; status form | pre-publish policy + hold | PROVEN |
| restore | route `unsuspend` | `decideAdminPrePublishAction` (`payment_required`), hold (payment reason, lapsed `servicios_base_monthly`), payment CAS | PROVEN |
| republish | route `republish` | same on a reactivating republish | PROVEN |
| pause | none (owner) | Admin cannot flip an owner-paused row while payment holds / entitlement lapsed | PROVEN |
| suspend | route `suspend` | `not_published` for pre-publish rows | PROVEN |
| review | status form `pending_review` | pre-publish rows cannot be moved | PROVEN |
| reject | route `archive` (-> `rejected`) | `not_published` for pre-publish rows | PROVEN |
| archive | route `archive` | same | PROVEN |
| sold | none | - | N/A |
| delete | none (no Admin delete verb) | - | N/A |
| permanent delete | none | - | N/A |
| feature | `promote_on` / `promote_off` | writes `promoted` only | PROVEN |
| verify | `verify_on` / `verify_off`, `setServiciosListingLeonixVerifiedAction` | writes `leonix_verified` only | PROVEN |

### Restaurantes - `api/admin/restaurantes/listings/[id]/route.ts`

| Action | Entry point | Guards | Verdict |
|---|---|---|---|
| publish | none (free application / Revenue OS) | - | PROVEN |
| approve | none | - | N/A |
| restore | route `unsuspend` | `decideAdminPrePublishAction`, hold (payment reason, lapsed `restaurantes_base_monthly`), payment CAS | PROVEN |
| republish | route `republish` | same; `archived` refused | PROVEN |
| pause | none | - | N/A |
| suspend | route `suspend` | `not_published` for pre-publish rows | PROVEN |
| review | none | - | N/A |
| reject | none | - | N/A |
| archive | route `archive` | `not_published` for pre-publish rows | PROVEN |
| sold | none | - | N/A |
| delete | none | - | N/A |
| permanent delete | none | - | N/A |
| feature | `promote_on` / `promote_off` | writes `promoted` only | PROVEN |
| verify | `verify_on` / `verify_off` | writes `leonix_verified` only | PROVEN |

### Autos Dealer (negocios, parent / inventory vehicles) - `api/admin/autos/listings/[id]/route.ts`

| Action | Entry point | Guards | Verdict |
|---|---|---|---|
| publish | none (Revenue OS / capacity RPC) | - | PROVEN |
| approve | none | - | N/A |
| restore | `restore_active` / `unsuspend` (removed / cancelled only) | `decideAutosAdminReactivation` (ever-published), hold (payment reason, lapsed `autos_dealer_monthly`), capacity RPC | NOT PROVEN (R2 + RPC does not verify a subscription) |
| republish | `republish` | same on a reactivating republish | NOT PROVEN (R2) |
| pause | none | - | N/A |
| suspend | `suspend` / `remove_public` (active only) | writes `suspended_reason='moderation'` | PROVEN |
| review | none | - | N/A |
| reject | none | - | N/A |
| archive | `archive` | `AUTOS_PRE_PUBLISH_STATUSES` refused; parent-only | PROVEN |
| sold | none | - | N/A |
| delete | none (Autos rows are not in `listings`) | - | N/A |
| permanent delete | none | - | N/A |
| feature | `promote_on` / `promote_off` | writes `featured` only | PROVEN |
| verify | `verify_on` / `verify_off` | writes `leonix_verified` only | PROVEN |

### Autos Privado - same route

| Action | Entry point | Guards | Verdict |
|---|---|---|---|
| publish | none (Revenue OS) | - | PROVEN |
| approve | none | - | N/A |
| restore | `restore_active` / `unsuspend` | ever-published, **`renewal_required` when the term elapsed**, hold (payment reason) | PROVEN |
| republish | `republish` | same | PROVEN |
| pause | none | - | N/A |
| suspend | `suspend` | active only; `suspended_reason='moderation'` | PROVEN |
| review | none | - | N/A |
| reject | none | - | N/A |
| archive | `archive` | pre-publish refused | PROVEN |
| sold | none | - | N/A |
| delete | none | - | N/A |
| permanent delete | none | - | N/A |
| feature | `promote_on` / `promote_off` | - | PROVEN |
| verify | `verify_on` / `verify_off` | - | PROVEN |

### Empleos - `api/admin/empleos/listings/[id]` + `moderate` (shim) -> `adminEmpleosStaffActionsServer.ts:runEmpleosStaffAction`

| Action | Entry point | Guards | Verdict |
|---|---|---|---|
| publish | none (free-lane submit / Revenue OS) | - | PROVEN |
| approve | `send_to_review` then `unsuspend` | `decideEmpleosStaffAction` payment gate | PROVEN |
| restore | `unsuspend` | never-live paid lane needs a verified paid record (`payment_required`); once-live disputed -> `payment_reversed`; compare-and-set on `lifecycle_status` | PROVEN |
| republish | `republish` | same gate; `archived` refused | PROVEN |
| pause | `suspend` (-> `paused`) | `unpaid_draft` refused | PROVEN |
| suspend | `suspend` | same | PROVEN |
| review | `send_to_review` | `unpaid_draft` refused | PROVEN |
| reject | `reject` | terminal, reason marker | PROVEN |
| archive | `archive` | - | PROVEN |
| sold | none | - | N/A |
| delete | none | - | N/A |
| permanent delete | none | - | N/A |
| feature | `promote_on` / `promote_off` | patch keys asserted (`admin_promoted` only) | PROVEN |
| verify | `verify_on` / `verify_off` | `leonix_verified` + `verified_employer` only | PROVEN |

### Comida Local - `api/admin/comida-local/listings/[id]` -> `comidaLocalAdminQueries.ts:applyAdminComidaLocalAction`

| Action | Entry point | Guards | Verdict |
|---|---|---|---|
| publish | none (Revenue OS fulfilment) | - | PROVEN |
| approve | none | - | N/A |
| restore | `unsuspend` (suspended only) | payment proof, payment-owned reason blocks, reason REQUIRED (fail closed), lapsed `comida_local_base_monthly` blocks, `suspended_reason` CAS | PROVEN |
| republish | `republish` (paused only) | same, including the reason CAS | PROVEN |
| pause | `archive` (published -> paused) | - | PROVEN |
| suspend | `suspend` (-> suspended, reason `moderation`) | - | PROVEN |
| review | none | - | N/A |
| reject | none | - | N/A |
| archive | `archive` (the table has no archived status) | - | PROVEN |
| sold | none | - | N/A |
| delete | none | - | N/A |
| permanent delete | none | - | N/A |
| feature | none | - | N/A |
| verify | none | - | N/A |

### Ofertas Locales - `api/admin/ofertas-locales/listings/[id]` + `api/ofertas-locales/admin/[id]/review` -> `ofertasLocalesAdminReviewService.ts:runOfertaLocalAdminReview` -> `mutateOfertaLocalAdminReview`

| Action | Entry point | Guards | Verdict |
|---|---|---|---|
| publish | none (`tryAutoActivateOfertaLocalAfterPayment` calls the same approve mutation after a verified payment) | - | PROVEN |
| approve | `approve` | leonix ad id, resolved items, ready source, **paid entitlement OR partner courtesy** (`commercial_entitlement_required`); a once-live paid offer keeps its bought term (`decideOfertaApprovalTerm`); never writes a payment field | PROVEN |
| restore | `restore` (rejected / archived -> `pending_review`) | writes only `status` / `internal_notes` / `updated_at`; going live again needs approve | PROVEN |
| republish | none (renewal is owner-side, `ofertasLocalesRenewals.ts`) | - | N/A |
| pause | none | - | N/A |
| suspend | none (archive) | - | N/A |
| review | `approve` / `reject` queue | transition table | PROVEN |
| reject | `reject` | reason required | PROVEN |
| archive | `archive` | transition table | PROVEN |
| sold | none | - | N/A |
| delete | none | - | N/A |
| permanent delete | none | - | N/A |
| feature | none | - | N/A |
| verify | none | - | N/A |

### Viajes - `api/admin/viajes/listings/[id]`, `api/admin/viajes/staged-listings/moderate`

Viajes has no payment product (checkout is refused server-side): approval is a moderation decision, so there is no commercial authority to bypass.

| Action | Entry point | Guards | Verdict |
|---|---|---|---|
| publish | staged `approve` | moderation authority; audited | PROVEN |
| approve | staged `approve` | audited (`viajes_staged_admin_approve`) | PROVEN |
| restore | listings `unsuspend` (approved + hidden only) | - | PROVEN |
| republish | listings `republish` | `republishCapabilityReasonViajes` refuses draft / submitted / in_review / rejected / changes_requested / expired | PROVEN |
| pause | staged `unpublish` | - | PROVEN |
| suspend | listings `suspend` (approved + public only) | - | PROVEN |
| review | staged `in_review` / `request_edits` | notes preserved, audited | PROVEN |
| reject | staged `reject` | audited | PROVEN |
| archive | listings `archive` (-> unpublished) | - | PROVEN |
| sold | none | - | N/A |
| delete | none | - | N/A |
| permanent delete | none | - | N/A |
| feature | listings `promote_on` / `promote_off` | writes `admin_promoted` only | PROVEN |
| verify | listings `verify_on` / `verify_off` | writes `leonix_verified` only | PROVEN |

## Residual (not source-fixable here)

* **R1 - owner-side DB UPDATE.** `public.listings` owner UPDATE policy still lets an owner write `status` directly (`PROPOSED_DB_HARDENING_2026-09.md` section 1). Prod
  forensics (SALE-2026-000067, en-venta): staff-flagged -> staff-removed -> flipped `removed -> sold` by a non-admin write; `dashboardOwnerRelistPolicy` treats `sold` as
  relistable, so a staff removal can be laundered back to `active`. The proposed guard trigger must also block authenticated-owner transitions OUT OF `flagged` / `removed` /
  `suspended` / `pending` / `expired` / `rejected` (owners may move only among `active` / `paused` / `sold`), and must reject `sold -> active` when the row's history contains a staff
  `flagged` / `removed`. SQL + test plan belong to the DB agent (this gate is Admin routes only and writes no SQL).
* **R2 - no evidence.** A Negocio / Autos-dealer row with NO base entitlement record (legacy / manually activated) and no `suspended_reason` cannot be proven lapsed; Admin restore is
  allowed and `br_negocio_activate_listing` / `autos_dealer_activate_listing` do not verify a live subscription. Free / legacy Servicios / Restaurantes rows are intentionally not
  entitlement-gated.
* **R3 - payment marker vs archive.** Staff `archive` of an engine-suspended row is allowed (it is non-public anyway) and leaves the payment marker: Restore stays blocked and the
  engine's compare-and-swap lift (which needs status `suspended`) can no longer match. Resolution is a payment-system / DB reconciliation, by design (the payment suspension wins).
* **R4 - Servicios / Restaurantes staff suspend** does not stamp `suspended_reason='moderation'`; a legacy payment suspension written before the column existed is indistinguishable
  from a staff one (only `suspended_reason='payment'` is held).
* Refund on a non-live row is not a hold (partial refunds set `payment_status='refunded'`); the entitlement adjustment is a separate audited admin decision. Chargeback is a hold on
  subscription / suspension lanes (engine) and on Empleos (`payment_reversed`).
