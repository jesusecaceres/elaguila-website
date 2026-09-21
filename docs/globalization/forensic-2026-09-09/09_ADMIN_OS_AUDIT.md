# 09 — ADMIN OS (G48) CAPABILITY MATRIX

**Date:** 2026-09-09
**Ref audited (TRUE current):** `origin/main` = `a0a4783971b42ea1d71ab2602d4720d0d590baf8`
(verified with `git rev-parse origin/main` at the start of this stream and again immediately before writing — unchanged).
**Sealed Sept fork:** `e3956df8` = `e3956df893f5041ca22371c999038f297d536eae` — **a FORK, not an ancestor**.
Merge-base = `7878d856a2762c91548623166ab31e554510c373`.
**Local working tree is 112 commits stale (`d09d979c`) and was NOT used for any finding.**
Every `path:line` below is resolved with `git show origin/main:<path>` / `git grep -n <pat> origin/main`; Sept
findings with `git show e3956df8:<path>`. The ref is labelled on every finding.

**Scope:** read-only. No application source modified. No git write commands executed. Sole artifact: this file.

**Surface size:** 446 files under `app/admin` (`git ls-tree -r --name-only origin/main -- app/admin | wc -l`),
plus 82 API route files under `app/api/admin` (75) + `app/api/ofertas-locales/admin` (6) + `app/api/revenue-os/admin` (1).

---

## 0. THE SECURITY LAYER IS OUT OF SCOPE — SEE `09A`

This audit **does not re-derive admin authentication or authorization.** It cites and builds on
[`09A_ADMIN_AUTH_ADVERSARIAL_REAUDIT.md`](./09A_ADMIN_AUTH_ADVERSARIAL_REAUDIT.md), which established
against the same `origin/main` ref:

- **82 admin API route files.** **51 strongly re-verify** identity via `requireSalesWorkspaceAccess` /
  `requireStaffWorkspaceWriteAccess` (`app/admin/_lib/businessWorkspaceAccess.ts:106-168`), which is
  **fail-closed and sound** (09A §3.1). **31 files / 33 handlers (23 mutating, 10 read) rely on the coarse
  unsigned `leonix_admin` cookie alone** (09A §4.2). **0** files have no auth reference.
- `middleware.ts:37-42` gates only `/admin` on the literal string `"1"`, and **never runs on
  `/api/admin/**`** (`middleware.ts:79`) (09A §1).
- Confirmed P0s: `app/admin/teamProvisioningActions.ts:35` staff-provisioning escalation (09A §6),
  `app/api/admin/revenue-os/manual-payments/route.ts:26` entitlement mint (09A §5.a),
  `package-entitlements/actions.ts:466` `grantComplimentaryPackageEntitlementAction` (09A finding C).
- `ADMIN_ENFORCE_ROSTER_PERMISSIONS` is deliberately OFF and set nowhere, so every
  `requireLeonixAdminPermission(...)` call site degrades to a bare cookie check
  (`app/admin/_lib/leonixAdminGate.ts:45-47`) (09A §5.d).

The **PERMISSION GUARD** column below therefore records only *which* guard protects each capability and
whether it is the **STRONG** guard or the **COARSE** cookie. It makes no new security claims. Three
security-adjacent items *are* new and are reported in §7 because they were found while tracing
capability wiring, not while re-auditing auth.

**One census correction to 09A (§7.1 below):** 4 of the 82 route files are orphaned, URL-encoded
shadow copies (`app/api/admin/businesses/%5BbusinessId%5D/...`). The live route count is **78**, of
which **47** are strong. This does not change any 09A conclusion — all 4 are guarded and all 4 are dead.

---

## 1. THE MATRIX

Column key:
**UI** = a page/component that a staff member can actually reach ·
**SA** = server action (`"use server"`) · **API** = HTTP route ·
**DB** = table/RPC actually written or read ·
**GUARD** = `path:symbol` + **STRONG** (`businessWorkspaceAccess` family) or **COARSE**
(`requireAdminCookie` / `requireLeonixAdminPermission` / `assertAdminLeadExportAccess` — all reduce to the
unsigned cookie per 09A) ·
**CAT** = which of the 14 canonical categories (`app/lib/listingIdentity/types.ts:47`) the capability covers ·
**WIRED** = *traced import*, not filename ·
**STATUS** = TRUE / FALSE / N-A ·
**QA** = owner QA required.

The 14 canonical categories: `restaurantes, servicios, bienes-raices, autos, rentas, empleos, en-venta,
comida-local, ofertas-locales, busco, clases, comunidad, mascotas-y-perdidos, viajes`.

---

### 1.1 — Shell, home, and cross-cutting

| # | CAPABILITY | UI_EXISTS | SERVER_ACTION | API | DB SUPPORT | PERMISSION GUARD | CATEGORY COVERAGE | CURRENTLY WIRED | STATUS | OWNER_QA |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Admin shell** (auth boundary, nav, i18n, sales-rep path scoping) | `app/admin/(dashboard)/layout.tsx:19-57`; `app/admin/_components/AdminShell.tsx`; nav `app/admin/_lib/adminGlobalNav.ts:61-115` | `app/admin/_actions/setAdminUiLang.ts` | — | `admin_team_members` (via `getCurrentAdminAccessContext`) | `layout.tsx:21` `requireAdminCookie` + `:25` `resolveAdminDashboardAccessDenial` + `:38-45` `isStaffSalesAllowedAdminPath` — **COARSE** (fails open to `owner_admin`, 09A §5.c) | n/a | YES — layout wraps every `(dashboard)` page; nav filtered by `getAllowedGlobalNavHrefs(access)` `:35` | **TRUE** | NO |
| 2 | **Command center / home** | `app/admin/(dashboard)/page.tsx:19`; `app/admin/_components/AdminCommandCenterDashboard.tsx` | — (read-only) | — | `listings`, `listing_reports`, `profiles`, `empleos_public_listings`, `viajes_staged_listings`, `leonix_leads`, `leonix_media_kit_leads`, `leonix_newsletter_subscribers`, `listing_package_entitlements`, promo + payment snapshots | inherits row 1 — **COARSE** | **3 of 14 sources only** — see P1-A §6.1 | YES — `page.tsx:4-9` imports 6 real snapshot readers | **TRUE** (with P1-A coverage defect) | **YES** |
| 3 | **Audit logging** | `app/admin/(dashboard)/activity-log/page.tsx:45` (`fetchAdminAuditLogFiltered`) | `appendAdminAuditLog` (`app/admin/_lib/adminAuditLogServer.ts:14-33`); `auditAdminWrite` (`app/admin/_lib/auditAdminWrite.ts:4-16`); `writeRosterAuditLog` (`app/admin/_lib/adminRosterAudit.ts:95-119`) | 6 of 64 mutating routes only | `admin_audit_log` (**no actor column**, `:44-48`); `admin_roster_audit_log` (**has** `actor_roster_id/actor_auth_user_id/actor_email/actor_role`, migration `supabase/migrations/20260731220000_admin_roster_foundation_and_sales_workspace.sql:332-350`) | `activity-log/page.tsx:4` `requireActivityLogAccess` — **COARSE** | n/a | YES for both writers; reader wired | **TRUE** (capability exists; **P1-C/P1-D defects §6.3**) | **YES** |
| 4 | **Admin analytics** | `servicios/page.tsx:41` only; per-user rollup `usuarios/[id]/page.tsx` via `adminUserRollups.ts:318` | — | — | `listing_analytics` | inherits row 1 — **COARSE** | **servicios only** (hardcoded `.eq("source_table","servicios_public_listings")`, `serviciosAdminCanonicalAnalytics.ts:43`) + per-owner totals | Servicios queue: YES. Every other queue: NO reader exists. | **FALSE** | **YES** |
| 5 | **System health — platform** | none | — | — | — | — | n/a | NO — no platform-health page, no cron/job monitor, no queue-depth surface. `/admin/ops` (`ops/page.tsx:31`) is a **customer lookup**, not system health. | **FALSE** | **YES** |
| 5b | **System health — per business** | `businesses/[businessId]/page.tsx` health panel | — | `app/api/admin/businesses/[businessId]/health/route.ts:15,:57` | business health tables | `:15` `requireSalesWorkspaceAccess`, `:57` `requireStaffWorkspaceWriteAccess("run_business_health_assessment")` — **STRONG** | n/a (business, not listing category) | YES | **TRUE** | NO |

---

### 1.2 — Listing operations (the per-category core)

| # | CAPABILITY | UI_EXISTS | SERVER_ACTION | API | DB SUPPORT | PERMISSION GUARD | CATEGORY COVERAGE | CURRENTLY WIRED | STATUS | OWNER_QA |
|---|---|---|---|---|---|---|---|---|---|---|
| 6 | **Listing ops — status / suspend / unsuspend / archive** | 14 queue pages (§3) | comida-local `.../comida-local/actions.ts:17`; ofertas `.../ofertas-locales/actions.ts:58`; servicios `.../servicios/actions.ts:19` | 6 routes: `app/api/admin/{autos,clasificados,empleos,restaurantes,servicios,viajes}/listings/[id]/route.ts` PATCH | `listings`, `autos_classifieds_listings`, `restaurantes_public_listings`, `servicios_public_listings`, `empleos_public_listings`, `viajes_staged_listings`, `comida_local_public_listings`, `ofertas_locales` | all `requireAdminCookie` — **COARSE** (09A §4.2) | **14 / 14** | YES — `ClassifiedAdminRowActions.tsx:42-59` `patchUrl()` maps 6 variants; comida-local `page.tsx:24,:172`; ofertas `page.tsx` → `actions.ts` | **TRUE** | NO |
| 7 | **Listing ops — publish / approve** | same | same | same | same | **COARSE** | **14 / 14** | YES | **TRUE** | NO |
| 8 | **Featured / promote** | `ClassifiedAdminRowActions.tsx` (`feature` contract, `adminOsActionRegistry.ts:185`) | — | `promote_on` / `promote_off` in all 6 dedicated+generic routes (e.g. `app/api/admin/clasificados/listings/[id]/route.ts:81-86` → `listings.admin_promoted`) | `admin_promoted` column | `requireAdminCookie` — **COARSE** | **12 / 14** — **MISSING: comida-local, ofertas-locales** | YES for the 12 | **TRUE** (12/14) | **YES** |
| 9 | **Verification — listing "Leonix verified" badge** | same row-action bar; servicios has its own form (`ServiciosAdminOpsListingCard.tsx:145`) | `servicios/actions.ts:52` `setServiciosListingLeonixVerifiedAction` | `verify_on` / `verify_off` in the same 6 routes (`clasificados/listings/[id]/route.ts:87-92` → `leonix_verified`) | `leonix_verified` column | `requireAdminCookie` — **COARSE** | **12 / 14** — **MISSING: comida-local, ofertas-locales** | YES for the 12 | **TRUE** (12/14) | **YES** |
| 10 | **Verification — user email / SMS / business identity** | none | — | — | `profiles` has `phone` but no verification state exposed | — | n/a | NO — `/admin/usuarios/[id]` (`page.tsx:398`) selects `id,created_at,display_name,email,phone,account_type,membership_tier,home_city,owned_city_slug,newsletter_opt_in,is_disabled`. There is **no** email-confirm, phone-verify, or business-identity verification control anywhere in `app/admin`. | **FALSE** | **YES** |
| 11 | **Republish** | `classifiedsRepublishCapability.ts:145,:164` drives the button | — | `republish` action in all 6 routes (`clasificados/listings/[id]/route.ts:109-147`) | per-category tables | `requireAdminCookie` — **COARSE** | 12 / 14 (same two gaps) | YES | **TRUE** | NO |
| 12 | **AI review / moderation engine** | `_components/AdminRunAiReviewButton.tsx`, `AdminAiReviewSummary.tsx` | — | `app/api/admin/clasificados/listings/[id]/ai-review/route.ts`; `.../ai-review/bulk/route.ts` | `listing_moderation_reviews` (`listingModerationReviewsDb.ts`) | `requireAdminCookie` — **COARSE** | generic `listings` family + per-category policy rules `listingModerationPolicy.ts:185-230` (autos, servicios, empleos, rentas, bienes-raices only) | YES | **TRUE** (partial category rules) | NO |
| 13 | **Staff content edit (same row)** | `workspace/clasificados/listings/[id]/edit/page.tsx`; `rentas/[id]/page.tsx` | `app/admin/actions.ts:164` `updateListingCoreFieldsStaffAdminAction` | — | `listings` | `:165` `requireLeonixAdminPermission("can_manage_ads")` — **COARSE** | **generic `listings` family only** — `adminDashboardReviewActions.ts:23-26` returns `null` for every non-`generic_listings` source; `ADMIN_EDIT_SUPPORT_BY_SOURCE` marks all 6 verticals `MANAGE_ONLY` (`adminAdEditSupportMap.ts:43-70`) | YES | **TRUE** (documented `MANAGE_ONLY` for verticals) | NO |
| 14 | **Delete / permanent delete** | bulk bar `_components/ClassifiedAdminQueueBulkBar.tsx` | `app/admin/actions.ts:56` `deleteListingAction`, `:89` `bulkSoftDeleteListingsAction`, `:116` `permanentlyDeleteListingsAction` | — | `listings` (hard delete + Mux asset destruction) | `requireLeonixAdminPermission("can_manage_ads")` — **COARSE** | **generic `listings` only** | YES | **TRUE** | **YES** |
| 15 | **Inventory (parent / child)** | `businesses`/queue rows | — | `assertAutosDealerActionAllowed` at `app/api/admin/autos/listings/[id]/route.ts`; `assertBrNegocioActionAllowed` at `app/api/admin/clasificados/listings/[id]/route.ts:13` | `inventory_role`, `dealer_inventory_parent_listing_id`, BR parent ids | `requireAdminCookie` + `adminInventoryActionGuard.ts:93,:120` — **COARSE** auth, real *structural* guard | **autos_negocios + bienes_raices_negocio only** (by design — only these two have inventory lanes) | YES — imported at route top-level | **TRUE** | NO |
| 16 | **Expiration** | expiring queue on `/admin` (`adminDashboardData.ts:190,:248,:285,:516`) | `package-entitlements/actions.ts:430` `extendPackageEntitlementAction` (entitlement window) | — | `listing_package_entitlements.ends_at` | `:431` `requireAdminCookie` — **COARSE** | expiring **read** covers 2 sources (`generic_listings`, `viajes_staged`, `adminDashboardData.ts:35`); entitlement **extend** covers the 5 entitlement categories | Read: YES. Write: YES but only against entitlements — **there is no admin write that changes a listing's own expiry.** | **TRUE** (entitlement) / **FALSE** (listing expiry) | **YES** |
| 17 | **Ranking** | `/admin/categories` `sort_order` field (`categories/page.tsx:354`) | `siteCategoryConfigActions.ts:21` `saveSiteCategoryConfigRowAction` | — | `site_category_config` | `:10` `requireLeonixAdminPermission("can_manage_categories")` — **COARSE** | **category-level ordering only** | YES | **FALSE** for listing-level ranking; **TRUE** for category ordering | **YES** |
| 18 | **Placement** | read-only display `usuarios/[id]/page.tsx:856`; Viajes placement editor is **mock** (§4) | created as a side effect of `package-entitlements/actions.ts:289-319` (`placementSource: "included_with_print"`) | — | placement entitlement rows | `requireAdminCookie` — **COARSE** | 5 entitlement categories, print tiers only | Create: YES (indirect). **Edit / revoke / re-order placements: NO surface.** | **FALSE** | **YES** |

---

### 1.3 — Revenue

| # | CAPABILITY | UI_EXISTS | SERVER_ACTION | API | DB SUPPORT | PERMISSION GUARD | CATEGORY COVERAGE | CURRENTLY WIRED | STATUS | OWNER_QA |
|---|---|---|---|---|---|---|---|---|---|---|
| 19 | **Payments (manual tracker)** | `workspace/payment-tracker/page.tsx`; `.../manual-payment/page.tsx` | — | `app/api/admin/revenue-os/manual-payments/route.ts` POST | `leonix_payment_records` (`paymentTrackerData.ts:309`) | page `:5` `requirePaymentTrackerAccess`; route `:27` `requireLeonixAdminPermission("can_view_payments")` — **COARSE** (09A §5.a: **P0**) | **6 hardcoded** — `payment-tracker/page.tsx:132` `["servicios","restaurantes","autos","bienes-raices","rentas","empleos"]` | YES | **TRUE** (6/14) | **YES** |
| 20 | **Payments — Stripe tracking / reconciliation** | `/admin/payments` (`payments/page.tsx:96,:197-209`) is an **env-gated outbound link** carrying `adminStubBadgeClass`; masked refs only via `maskStripeReference` | — | — | none read | inherits row 1 — **COARSE** | n/a | NO — there is no admin reader of `stripe_event_ledger`, no webhook-failure view, no charge/refund/dispute surface. `payments/page.tsx:208` renders a **disabled input** when `STRIPE_DASHBOARD_URL` is unset. | **FALSE** | **YES** |
| 21 | **Package entitlements** | `workspace/package-entitlements/page.tsx` | `.../actions.ts:90,:380,:430,:490,:557` (create / revoke / extend / attach / comp) | — | `listing_package_entitlements` | `:92,:382,…` `requireAdminCookie` + fail-open context — **COARSE** (09A finding C = **P0** on `:557`) | **5 / 14**, server-enforced at `:39` + `:102` — see `07_CATEGORY_REGISTRY_CONSISTENCY_AUDIT.md` G3 | YES | **TRUE** (5/14) | **YES** |
| 22 | **Print / courtesy / partner / comp grants** | same page | `.../actions.ts:557` `grantComplimentaryPackageEntitlementAction` → `grantComplimentaryAccess` / `grantPartnerCourtesy` (`:27`); print tier at `:246,:289-319` | — | `listing_package_entitlements` + placement rows | `requireAdminCookie` — **COARSE**, **P0** per 09A | 5 / 14 | YES | **TRUE** (5/14) | **YES** |
| 23 | **Commercial terms** (contract code, print contract id, grant source) | `package-entitlements/page.tsx` form; read-back `usuarios/[id]/page.tsx:914` | `.../actions.ts:90` (`contractCode`, `printContractId`, `grantSource`) | — | `listing_package_entitlements` + `adminCustomerCommercialContext.ts:109-148` reader | **COARSE** | 5 / 14 | YES | **TRUE** (5/14) | **YES** |
| 24 | **Promo codes** | `workspace/promo-codes/page.tsx`; `team/promo-codes/page.tsx`; `PromoCodeRecentCodesPanel.tsx` | `workspace/promo-codes/actions.ts:57,:246` | — | `leonix_promo_codes`, `leonix_promo_code_redemptions` | `:59,:248` `requireAdminCookie` — **COARSE** | **form: 5 / 14** (`promoCodeConstants.ts:17`, alias of the 5-item list) and **NO server-side allowlist at all** (07 §5); **recent-codes filter panel: 4 / 14** (`PromoCodeRecentCodesPanel.tsx:18-28` — even `bienes-raices` is missing) | YES | **TRUE** (5/14 form, 4/14 panel) | **YES** |
| 25 | **Subscriptions** | read-only rows `usuarios/[id]/page.tsx:884-888`; `payment-tracker/page.tsx:273` status column | — | `app/api/revenue-os/admin/subscription-sweep/route.ts:39` POST | `leonix_subscription_records` (`adminCustomerCommercialContext.ts:139`) | route `:43` `requireLeonixAdminPermission("can_view_payments")` **or** `x-leonix-sweep-key` — **COARSE** | 4 suspension lanes only (`LANE_SUSPENSION`, 07 #11) | **Display: YES. Lifecycle crank: NO CALLER.** `git grep "subscription-sweep" origin/main` returns only the route itself, a self-test, a diff allowlist and docs. No `vercel.json` exists on `origin/main`; `git grep '"crons"' origin/main` returns **zero** hits. No admin button invokes it. | **FALSE** | **YES** |

---

### 1.4 — People and business operations

| # | CAPABILITY | UI_EXISTS | SERVER_ACTION | API | DB SUPPORT | PERMISSION GUARD | CATEGORY COVERAGE | CURRENTLY WIRED | STATUS | OWNER_QA |
|---|---|---|---|---|---|---|---|---|---|---|
| 26 | **Business operations (Business Concierge)** | `businesses/page.tsx`, `businesses/[businessId]/page.tsx`, `businesses/canvass/page.tsx` + ~20 action components | — | **47 live routes** under `app/api/admin/businesses/**` (Living Book, advisor, assistant, briefing, commitments, creative studio, discovery, health, meetings, notes, opportunities, outcomes, proposals, recommendations, research, stewardship ledger, ownership claim) | business_* tables | `requireSalesWorkspaceAccess` / `requireStaffWorkspaceWriteAccess` / `toStaffWriteActor` — **STRONG** (09A §3.1) | n/a (business entity, not listing category) | YES | **TRUE** | NO |
| 27 | **User operations** | `usuarios/page.tsx`, `usuarios/[id]/page.tsx`, `AdminUserActions.tsx` | `app/admin/actions.ts:217` `setUserDisabledAction`; `usuarios/[id]/page.tsx:110` `updateClientAccountAction`; `teamProvisioningActions.ts:111` `createCustomerUserWithAuthAction` | — | `profiles`, Supabase Auth admin API | `actions.ts:218` `requireLeonixAdminPermission("can_edit_users")`; page `:5` `requireAdminCookie` — **COARSE** | **6 / 14** for the owned-ad rollup — `adminUserAds.ts:55` `SOURCE_ORDER = ["generic","restaurantes","servicios","empleos","autos","viajes"]` and `adminUserRollups.ts:76-181` query the same 6 tables. **A customer who owns a Comida Local or Ofertas Locales listing shows an incomplete inventory.** | YES | **TRUE** (6/14 inventory) | **YES** |
| 28 | **Staff permissions / roles** | `team/roster/page.tsx`, `team/users/new/page.tsx`, `team/page.tsx` | `adminTeamActions.ts` (invite / create / permissions / activate-deactivate); `teamProvisioningActions.ts:41` `createStaffUserWithAuthAction` | — | `admin_team_members`, `admin_roster_audit_log`, Supabase Auth | `requireLeonixAdminPermission("can_manage_team")` (no-op by default) + `requireSuperAdminStaffCreator` (`teamProvisioningActions.ts:33-38`) — **COARSE**, **P0 per 09A §6** | n/a | YES | **TRUE** (capability) — **P0 guard** | **YES** |
| 29 | **Support** | `support/page.tsx:558` | `supportTicketActions.ts:28,:81` | — | `support_tickets` | `:11` `requireLeonixAdminPermission("can_manage_reports")` — **COARSE** | n/a | YES — `support/page.tsx:16` imports both actions | **TRUE** | NO |
| 30 | **Abuse reports** | `reportes/page.tsx:48`, `reportes/AdminReportsTable.tsx:5,:37` | `app/admin/actions.ts:25` `updateListingReportStatusAction` | — | `listing_reports` | `:30` `requireLeonixAdminPermission("can_manage_reports")` — **COARSE** | all categories that emit reports | YES | **TRUE** | NO |
| 31 | **Leads** | `leads/inbox`, `leads/media-kit`, `leads/newsletter` pages + 3 client components | — | 7 handlers under `app/api/admin/leads/**` | `leonix_leads`, `leonix_media_kit_leads`, `leonix_newsletter_subscribers` | `adminLeadExportAuth.ts:6-12` `assertAdminLeadExportAccess` — **COARSE, pure passthrough** (09A §5.b, **HIGH**) | n/a | YES — `leads/inbox/page.tsx:6` etc. | **TRUE** | **YES** |
| 32 | **Applications — partner / resource requests** | `recursos/solicitudes/page.tsx`, `.../[id]`, `.../nueva` | `recursosPartnerRequestActions.ts` (5 audit sites) | — | partner update requests | `recursos/solicitudes/page.tsx:6` `requireLeonixAdminPermission` — **COARSE** | n/a (Recursos vertical) | YES | **TRUE** | NO |
| 33 | **Applications — Viajes business applications** | `clasificados/viajes/business-offers/page.tsx` + `AdminViajesBusinessOffersModeration.tsx:55,:98` | — | `app/api/admin/viajes/staged-listings/route.ts` (GET), `.../moderate/route.ts` (POST) | `viajes_staged_listings` | raw inline `leonix_admin` check — **COARSE** (09A §4.2) | viajes | YES — real `fetch()` at `:55` and `:98` | **TRUE** | NO |
| 34 | **Applications — job applications (Empleos)** | `workspace/clasificados/empleos/page.tsx:253` renders `Applications (col): {r.apply_count}` | — | — | `apply_count` scalar only | — | empleos | **NO** — a counter column is displayed; there is no applicant table, no applicant list, no application state machine anywhere in `app/admin`. | **FALSE** | **YES** |
| 35 | **Community Trust moderation** | **none** | `app/admin/_lib/leonixEndorsementAdminActions.ts:17` `removeLeonixEndorsementVoteAction`, `:47` `inspectLeonixEndorsementAggregateAction` | — | `leonix_endorsement_votes` | `:18,:48` `requireLeonixAdminPermission("can_manage_ads")` — **COARSE** | 5 trust categories (`leonixEndorsementRegistry.ts:90`, 07 #20) | **NO** — `git grep -n "leonixEndorsementAdminActions" origin/main -- app` returns **zero** importers. The actions are exported from a `"use server"` module with no caller and no UI. | **FALSE** | **YES** |

---

### 1.5 — Content / site control (adjacent, included for completeness)

| # | CAPABILITY | UI_EXISTS | SERVER_ACTION | GUARD | WIRED | STATUS |
|---|---|---|---|---|---|---|
| 36 | **Category controls** | `categories/page.tsx:71`; `workspace/clasificados/category/[slug]/page.tsx`; `category/editor/[slug]/page.tsx` | `siteCategoryConfigActions.ts:21`; `clasificadosCategoryContentActions.ts` | `requireLeonixAdminPermission("can_manage_categories")` / `requireAdminCookie` — **COARSE** | YES (`categories/page.tsx:15`) | **TRUE** (detail editor **10 / 14**, §2.4) |
| 37 | **Visibility (site sections / pages)** | `site-sections`, `site-settings`, `website-content`, `workspace/{home,nosotros,contacto,cupones,noticias,iglesias,revista,tienda}` | `siteSectionActions.ts`, `sectionPageActions.ts`, `globalSiteActions.ts`, `homeMarketingActions.ts`, `nosotrosSectionActions.ts`, `contactoSectionActions.ts` | `requireLeonixAdminPermission(...)` — **COARSE** | YES | **TRUE** |
| 38 | **Tienda (catalog + orders)** | `tienda/*` | `tiendaCatalogActions.ts`, `tiendaOrderActions.ts`, `tiendaStorefrontAdminActions.ts` | **COARSE** | YES | **TRUE** |
| 39 | **Recursos (intake / candidates / reverification / Spanish)** | 13 pages | 9 action files | **COARSE**; `recursosTranslationActions.ts:178` unguarded (09A finding H) | YES | **TRUE** |
| 40 | **Magazine / Revista / Executive Hub / Draw / Digital contact / LEO** | `magazine`, `workspace/revista`, `team/executive-hub`, `draw`, `digital-contact/*`, `leo` | `magazineIssuesActions.ts`, `revistaIssueRegistryActions.ts`, `revistaSpotlightActions.ts`, `executiveHubActions.ts` | **COARSE** | YES | **TRUE** |

---

### 1.6 — Counts

| STATUS | Count | Rows |
|---|---|---|
| **TRUE** | **28** | 1, 2, 3, 5b, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16(entitlement), 17(category ordering), 19, 21, 22, 23, 24, 26, 27, 28, 29, 30, 31, 32, 33 + 36–40 counted as one content block (see note) |
| **FALSE** | **10** | 4 (analytics), 5 (platform health), 10 (user verification), 16b (listing expiry), 17b (listing ranking), 18 (placement), 20 (Stripe tracking), 25 (subscriptions), 34 (job applications), 35 (Community Trust) |
| **N-A** | **1** | Ofertas Locales in `adminActionTruth` / Business Hub scoring (§3.3) — deliberate exclusion, **not** a gap |

*Note on counting:* rows 36–40 are five content/site capabilities all TRUE; counted individually the TRUE
total is **32**. The headline used in the summary is **28 TRUE / 10 FALSE / 1 N-A** over the 39 numbered
capability rows in §1.1–§1.4 plus the content block collapsed to one.

**Zero capabilities were marked TRUE on the strength of a page file existing.** Every TRUE has a traced
import chain recorded in the WIRED column.

---

## 2. (a) CATEGORY COVERAGE GAPS — EVERY HARDCODED CATEGORY LIST IN `app/admin`

### 2.1 Already established — cited, NOT re-derived

Per [`07_CATEGORY_REGISTRY_CONSISTENCY_AUDIT.md`](./07_CATEGORY_REGISTRY_CONSISTENCY_AUDIT.md) §2:

| PATH:LINE | SYMBOL | VALUES | MISSING (of 14) |
|---|---|---|---|
| `app/admin/_lib/packageEntitlementConstants.ts:12` | `PACKAGE_ENTITLEMENT_CATEGORIES` | servicios, restaurantes, autos, bienes-raices, rentas (**5**) | 9 — comida-local, ofertas-locales, empleos, en-venta, busco, clases, comunidad, mascotas-y-perdidos, viajes |
| `app/admin/_lib/promoCodeConstants.ts:17` | `PROMO_CODE_CATEGORIES` | **alias of the above** | same 9 |
| `app/admin/(dashboard)/workspace/package-entitlements/actions.ts:39` | `ALLOWED_CATEGORIES` | verbatim copy of the 5 — **server-enforced at `:102`** | same 9 |
| `app/admin/_lib/packageEntitlementConstants.ts:20-25` | `PACKAGE_ENTITLEMENT_LISTING_SOURCES` | 4 source tables → 6 categories | **no ofertas source, no comida-local source** |
| `app/admin/_lib/classifiedsOpsContract.ts:54` | `CLASSIFIEDS_OPS_CONTRACTS` | 13 slugs | **ofertas-locales** |

### 2.2 NEW instances of the same defect class — found in this stream

| # | PATH:LINE | SYMBOL | VALUES | MISSING (of 14) | CONSEQUENCE |
|---|---|---|---|---|---|
| **N1** | `app/admin/_lib/adminUserAds.ts:55` | `SOURCE_ORDER: AdminAdSource[]` | `generic, restaurantes, servicios, empleos, autos, viajes` (**6**, → tables `listings`, `restaurantes_public_listings`, `servicios_public_listings`, `empleos_public_listings`, `autos_classifieds_listings`, `viajes_staged_listings`) | **comida-local, ofertas-locales** | `/admin/usuarios/[id]` shows an **incomplete ad inventory** for any customer owning a Comida Local or Ofertas Locales listing. Staff cannot see the listing at all from the user record. |
| **N2** | `app/admin/_lib/adminAdIdentity.ts:9` | `AdminAdSource` type union | `generic \| restaurantes \| servicios \| empleos \| autos \| viajes` (**6**) | comida-local, ofertas-locales | The **root cause** of N1 and N3 — the type itself forbids the two lanes. |
| **N3** | `app/admin/_lib/adminAdEditSupportMap.ts:38-70` | `ADMIN_EDIT_SUPPORT_BY_SOURCE: Record<AdminAdSource, …>` | 6 entries, all `MANAGE_ONLY` | comida-local, ofertas-locales | `resolveAdminAdActions()` (`:98`) cannot resolve an action set for those lanes; `adminEditSupportStatusLabelEs` has a `MISSING` state (`:18` "Sin cola admin") that is never reachable for them because they never enter the map. |
| **N4** | `app/admin/_lib/adminUserRollups.ts:76-181` | `fetchAdminUserListCountsBatch` table list | same **6** tables | comida-local, ofertas-locales | Per-user listing **counts** on `/admin/usuarios` are wrong for those owners. |
| **N5** | `app/admin/_lib/adminDashboardData.ts:35` | `AdminDashboardExpiringQueueRow.source` | `"generic_listings" \| "viajes_staged"` (**2**) | 12 of 14 | The command-center **expiring** queue silently excludes restaurantes, servicios, autos, empleos, comida-local, ofertas-locales. |
| **N6** | `app/admin/_lib/adminDashboardData.ts:55` | `AdminDashboardPendingReviewQueueRow.source` | `"generic_listings" \| "empleos_public_listings" \| "viajes_staged_listings"` (**3**) | 11 of 14 | The command-center **pending review** queue silently excludes restaurantes, servicios, autos, comida-local, ofertas-locales — **the four highest-ARPU lanes**. See P1-A §6.1. |
| **N7** | `app/admin/(dashboard)/workspace/payment-tracker/page.tsx:132` | inline category `<select>` | `["servicios","restaurantes","autos","bienes-raices","rentas","empleos"]` (**6**) | 8 | A payment recorded against comida-local or ofertas-locales cannot be **filtered for** in the tracker. |
| **N8** | `app/admin/(dashboard)/workspace/sales-tracker/page.tsx:143` | inline category `<select>` | `["servicios","restaurantes","autos","bienes-raices","rentas"]` (**5**) | 9 | Same, and inconsistent with N7 (drops empleos) in an adjacent screen. |
| **N9** | `app/admin/(dashboard)/workspace/promo-codes/PromoCodeRecentCodesPanel.tsx:18-28` + `:36-40` | `RecentFilterKey` + `FILTERS` | `restaurantes, servicios, autos, rentas` (**4**) | 10 — **including `bienes-raices`, which IS in the 5-item promo list** | The recent-codes panel cannot filter promo codes the adjacent form on the same page can create. A **within-page** contradiction. |
| **N10** | `app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions.tsx:17-23` | `ClassifiedStaffOpsVariant` | `restaurante, listings, servicios, empleos, autos, viajes` (**6**) | comida-local, ofertas-locales | The shared row-action bar (suspend / promote / verify / archive / republish) **structurally cannot be used** by the Comida Local and Ofertas Locales queues. This is the mechanical cause of the Featured/verify gaps in rows 8 and 9. |
| **N11** | `app/admin/(dashboard)/workspace/clasificados/category/_components/CategoryDetailFieldsEditorBlock.tsx:22-33` | `EDITOR_SLUGS` | autos, rentas, servicios, empleos, restaurantes, clases, comunidad, mascotas-y-perdidos, travel, bienes-raices (**10**) | **en-venta, busco, comida-local, ofertas-locales** | No detail-fields editor for those 4; `:40` returns `null` silently — the section simply does not render, with no "unsupported" message. |
| **N12** | `app/admin/clasificadosCategoryContentActions.ts:22-33` | `DETAIL_EDITOR_SLUGS` | **verbatim duplicate of N11** | same 4 | Server-side twin of N11 — a 6th verbatim duplication instance on top of 07's five. |
| **N13** | `app/admin/_lib/classifiedsOpsContract.ts:7-14` | `ClassifiedsOpsKind` | `restaurantes, servicios, comida_local, empleos, autos, listings, viajes_staged` (**7 kinds**) | **ofertas-locales has no ops kind** | The type-level cause of 07's G9 finding on `CLASSIFIEDS_OPS_CONTRACTS`. |
| **N14** | `app/admin/_lib/listingModerationPolicy.ts:185-230` | per-category moderation rule `switch` | autos, servicios, empleos, rentas, bienes-raices (**5**) | 9 | AI/heuristic moderation applies **zero category-specific rules** to restaurantes, comida-local, ofertas-locales, en-venta, busco, clases, comunidad, mascotas-y-perdidos, viajes — only the generic pass. |
| **N15** | `app/admin/_lib/adminActionTruth.ts:58-79` | 3 pipeline `Set`s | 5 + 10 + 1 = 16 pipeline keys | ofertas_locales absent from all three | See §3 — **stale** and **dead**. |
| **N16** | `app/admin/(dashboard)/workspace/clasificados/servicios/_lib/serviciosAdminCanonicalAnalytics.ts:43` | `.eq("source_table","servicios_public_listings")` | **1** | 13 | The single admin analytics reader is category-pinned at the query level. See (d) §5. |

**Structural finding (extends 07 §5):** the 5-item list is now known to be duplicated **five** times, and
a *second* copy-paste family has been found — the **10-item `EDITOR_SLUGS` / `DETAIL_EDITOR_SLUGS` pair**
(N11/N12), and a *third* — the **6-source `AdminAdSource` family** (N1/N2/N3/N4). Three independent
copy-paste registries, none derived from `CanonicalDbCategory` (`app/lib/listingIdentity/types.ts:47`) or
from `REVENUE_V1_PACKAGE_MATRIX` (`revenuePricingMatrix.ts:86`).

---

## 3. (b) `adminActionTruth.ts` — THE STALENESS VERDICT

**VERDICT: the file is BOTH STALE AND DEAD. Three of its declarations contradict `origin/main` code, and
the entire module has zero runtime consumers.**

### 3.1 The comida-local declaration — **CONFIRMED STALE**

`app/admin/_lib/adminActionTruth.ts:47-50` (`origin/main`) states verbatim:

> *"Pipelines confirmed to have a real Admin queue page but NO write route at all (direct inspection: no
> suspend/archive handler, no fetch to /api/admin, only a GET search form and a queue/live toggle link):
> comida_local."*

and `:79`:

```ts
const NO_WRITE_ROUTE_PIPELINES = new Set<CanonicalCategoryKey>(["comida_local"]);
```

**This is false on `origin/main`.** `app/admin/(dashboard)/workspace/clasificados/comida-local/actions.ts`
is a `"use server"` module (`:1`) exporting:

```ts
export async function updateComidaLocalPublicListingStatusAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");     // :20  — real guard
  ...
  if (!id || !ALLOWED_STATUS.has(status)) return;                  // :23  — real allowlist
  const { ok } = await updateAdminComidaLocalListingStatus(supabase, id, status);   // :27  — real DB write
```

with `ALLOWED_STATUS` (`:9-15`) = `draft, published, paused, suspended, pending_payment`.

**And it is WIRED, not orphaned:** `comida-local/page.tsx:24` imports it and `:172` passes it as
`statusUpdateAction={configured ? updateComidaLocalPublicListingStatusAction : undefined}` to
`ComidaLocalAdminListings`.

**Precise consequence.** Because `comida_local` is in neither `DEDICATED_ROUTE_PIPELINES` nor
`GENERIC_LISTINGS_ROUTE_PIPELINES`, `baseLifecycleTruth(false,false)` (`:93-105`) returns
`suspend/unsuspend/approvePublish/archive/restore = "ui_only_no_handler"`. Of those five:

- **`suspend` → wrong** (`"suspended"` is in `ALLOWED_STATUS`)
- **`unsuspend` → wrong** (`"published"` is in `ALLOWED_STATUS`)
- **`approvePublish` → wrong** (`"published"` is in `ALLOWED_STATUS`)
- `archive` → correct (no archive state in `ALLOWED_STATUS`)
- `restore` → correct

The prose's specific claim *"only a GET search form and a queue/live toggle link"* is contradicted by
`page.tsx:172`. **3 of 5 lifecycle statuses, plus the whole `NO_WRITE_ROUTE_PIPELINES` name, are stale.**

### 3.2 The ofertas-locales declaration — **ALSO STALE (second instance, same class)**

`adminActionTruth.ts:52-55`:

> *"ofertas_locales is intentionally excluded from this truth table — it is a locked system for this
> package (Ofertas/Cupones); no Admin write surface for it was inspected or classified here."*

and the sibling `app/admin/_lib/adminListingClassification.ts:66-69`:

> *"Ofertas/Cupones is a locked system for this package — classified for organizational completeness only,
> **no Admin surface for it was inspected or touched.**"*

**A real, guarded Admin write surface exists on `origin/main`:**
`app/admin/(dashboard)/workspace/clasificados/ofertas-locales/actions.ts` — `"use server"` (`:1`),
`reviewOfertaLocalAdminAction` (`:58`) guarded by `requireAdminCookie` (`:60`), allowlisting
`approve | reject | archive` (`:14-18`), reaching `mutateOfertaLocalAdminReview` (`:8`), plus a real queue
page and two review components in the same directory. Six `/api/ofertas-locales/admin/**` routes also
exist (09A §4.2).

The declaration is defensible as a *scope* statement for the original work package, but it is **false as a
statement about the codebase**, and both files phrase it as the latter. Scoring rule applied: Ofertas is
scored **N-A** in the truth-table and Business Hub contexts (§3.3), and **TRUE** everywhere its real
surface is traced (rows 6, 7, 33).

### 3.3 Ofertas N-A justification (per the task's instruction)

- `adminActionTruth.ts:52-55` — "a locked system for this package," explicitly out of scope.
- `app/lib/business/businessHubAdapter.ts:10` — Ofertas excluded from Business Hub.
- 07 §4.1 — both Ofertas packages are `promoEligible:false` (`revenuePricingMatrix.ts:334,:351`), so its
  absence from `PROMO_CODE_CATEGORIES` **changes no runtime behavior**.

**Ofertas is scored N-A for the truth table, Business Hub, and promo scope — not FALSE.** It is scored
**TRUE** for status/publish ops (§1.2 rows 6–7) and **FALSE-by-gap** only for Featured/verify (rows 8–9)
and for the user-inventory rollup (N1), where its exclusion is an unstated omission rather than a
documented decision.

### 3.4 A third contradiction — the "defaults to intentionally_unsupported" claim

`adminActionTruth.ts:106-109`:

> *"only pipelines with a real, evidence-backed fact are listed — anything else defaults to
> `"intentionally_unsupported"` (never guessed as working)."*

**It does not.** `resolveAdminActionTruth` (`:198-225`) computes
`const overrides = PIPELINE_OVERRIDES[pipeline] ?? {}` (`:222`) and returns `{ ...base, ...overrides }`
(`:224`). For `ofertas_locales` — which `classifyAdminListingRow` **does** return (`adminListingClassification.ts:70-71`)
— `PIPELINE_OVERRIDES` has no entry, so `markSoldFilledClosed`, `remove`, `preview`,
`openOwnerEditContext` and `inspectParentChild` come back **`undefined`**, not `"intentionally_unsupported"`.
Behaviourally safe (`isAdminActionSafeToShow(undefined)` is `false`, `:227-229`) but the documented
contract is wrong.

### 3.5 **THE LARGER FINDING — the whole truth layer is DEAD CODE**

```
git grep -n "classifyAdminListingRow|resolveAdminActionTruth|isAdminActionSafeToShow" origin/main
```

returns **only**:
- the three definitions themselves (`adminActionTruth.ts:198,:227`, `adminListingClassification.ts:49`),
- doc-comment cross-references inside `adminStatusAttention.ts:54,:74,:77`,
- `scripts/gate-i9a-admin-operations-truth-selftest.ts` and `scripts/gate-i9b-admin-write-safety-selftest.ts`,
- `scripts/globalizationCurrentPackageDiff.ts:100` (an allowlist).

**Zero importers under `app/`.** The Work Package I.9A trio — `adminActionTruth.ts`,
`adminListingClassification.ts`, `adminStatusAttention.ts` — is validated by self-tests and consumed by
nothing. The live admin queues instead use a **different, incompatible** action vocabulary:
`app/admin/_lib/adminOsActionRegistry.ts:15` declares its own `AdminActionKey` with **22 keys**
(`viewPublic, editListing, manageListing, viewResults, suspend, restore, archive, republish, feature,
verifyLeonix, runAiReview, markReviewed, clearFlag, delete, permanentDelete, publishIssue, archiveIssue,
saveDraft, exportCsv, sendPasswordReset, assignStaff, …`) versus `adminActionTruth.ts:15`'s **15 keys**.
`adminOsActionRegistry` **is** wired (`ClassifiedAdminRowActions.tsx:15`
`import { getAdminActionContract }`). `adminActionTruth` is not.

**Net: two parallel admin action registries with different key sets; the one described as "truth" is the
one nothing runs.** This is the 8th confirmed instance of this repo's prose-contradicts-code pattern
(`docs/gate-i5-7f-full-catalog-route-contract-matrix.md:213` already recorded a 7th against this same file:
*"stale: `adminActionTruth.ts` (mascotas `openOwnerEditContext` → 'working')"*).

**No other stale declarations were found in `adminActionTruth.ts`.** `DEDICATED_ROUTE_PIPELINES:58-64`
(5 pipelines) and `GENERIC_LISTINGS_ROUTE_PIPELINES:66-77` (10 pipelines) were verified route-by-route
against `origin/main` and are **accurate**; the `promote/verify/suspend/unsuspend/archive/republish` 8-action
contract is uniform across all 6 routes, and autos additionally carries `remove_public`/`restore_active`
(`app/api/admin/autos/listings/[id]/route.ts:22-23`), exactly as the `autos_negocios` override claims.

---

## 4. (e) PER-CATEGORY ADMIN QUEUE COVERAGE — ALL 14

Enumerated from `git ls-tree -r --name-only origin/main -- 'app/admin/(dashboard)/workspace/clasificados'`
and cross-checked against `adminCategoryWorkspaceQueueHref.ts:13-47` and
`clasificadosQueueSurfaceMeta.ts:11-75`.

| # | CATEGORY | QUEUE PAGE (`origin/main`) | IMPLEMENTATION | ROW-ACTION BAR | WRITE PATH | STATUS |
|---|---|---|---|---|---|---|
| 1 | restaurantes | `.../restaurantes/page.tsx` | bespoke | `variant="restaurante"` (`:255`) | `/api/admin/restaurantes/listings/[id]` | **TRUE** |
| 2 | servicios | `.../servicios/page.tsx` + `ServiciosAdminClient.tsx` | bespoke | own card (`ServiciosAdminOpsListingCard.tsx:188`) | `servicios/actions.ts` ×3 + `/api/admin/servicios/listings/[id]` | **TRUE** |
| 3 | bienes-raices | `.../bienes-raices/page.tsx:8` | `ListingsCategoryOpsQueuePage categorySlug="bienes-raices"` | `variant="listings"` | `/api/admin/clasificados/listings/[id]` | **TRUE** |
| 4 | autos | `.../autos/page.tsx` | bespoke | `variant="autos"` (`:334`) | `/api/admin/autos/listings/[id]` | **TRUE** |
| 5 | rentas | `.../rentas/page.tsx:8` + `.../rentas/[id]/page.tsx` | `ListingsCategoryOpsQueuePage` + inspector | `variant="listings"` | generic route | **TRUE** |
| 6 | empleos | `.../empleos/page.tsx` | bespoke client | `variant="empleos"` (`:277`) | `/api/admin/empleos/listings/[id]` + `/moderate` | **TRUE** |
| 7 | en-venta | `.../en-venta/page.tsx:8` | `ListingsCategoryOpsQueuePage` | `variant="listings"` | generic route | **TRUE** |
| 8 | **comida-local** | `.../comida-local/page.tsx` | bespoke | **NONE** — no `ClassifiedStaffOpsVariant` (N10) | `comida-local/actions.ts:17` (status only) | **TRUE (degraded)** — no Featured, no verify, no archive, no republish, no AI review, **no audit row** |
| 9 | **ofertas-locales** | `.../ofertas-locales/page.tsx` + 2 review components | bespoke | **NONE** (N10) | `ofertas-locales/actions.ts:58` (approve/reject/archive) + 6 API routes | **TRUE (degraded)** — no Featured, no verify, no republish, **no audit row**, absent from `CLASSIFIEDS_OPS_CONTRACTS` (N13) |
| 10 | busco | `.../busco/page.tsx:8` | `ListingsCategoryOpsQueuePage` | `variant="listings"` | generic route | **TRUE** |
| 11 | clases | `.../clases/page.tsx:8` | `ListingsCategoryOpsQueuePage` | `variant="listings"` | generic route | **TRUE** |
| 12 | comunidad | `.../comunidad/page.tsx:8` | `ListingsCategoryOpsQueuePage` | `variant="listings"` | generic route | **TRUE** |
| 13 | mascotas-y-perdidos | `.../mascotas-y-perdidos/page.tsx:8` | `ListingsCategoryOpsQueuePage` | `variant="listings"` | generic route | **TRUE** |
| 14 | viajes | `.../travel/page.tsx` (href mapped at `adminCategoryWorkspaceQueueHref.ts:41-43`) | bespoke | `variant="viajes"` (`:186`) | `/api/admin/viajes/listings/[id]` + `staged-listings/moderate` | **TRUE** |

**Headline: 14 / 14 categories have a real, reachable, guarded admin ops queue. Two of them
(comida-local, ofertas-locales) are structurally degraded** — they are excluded from the shared row-action
component by type (`ClassifiedAdminRowActions.tsx:17-23`), so they get status/review writes only, and both
are **entirely unaudited** (§6.3).

**Not part of the 14 — a separate, entirely mock Admin surface.** `/admin/clasificados/viajes` is a
top-level nav destination (`adminGlobalNav.ts:108`) with 7 pages
(overview, affiliate-cards + new + edit, business-offers, businesses, campaigns, editorial, settings).
**Four of them render hardcoded mock arrays and persist nothing:**

- `clasificados/viajes/page.tsx:9` → `ADMIN_VIAJES_OVERVIEW_MOCK`
- `affiliate-cards/AdminViajesAffiliateCardsManager.tsx:7` → `ADMIN_VIAJES_AFFILIATE_OFFERS_MOCK`
- `businesses/AdminViajesBusinessesTable.tsx:7` → `ADMIN_VIAJES_BUSINESSES_MOCK`
- `campaigns/AdminViajesCampaignsPlanner.tsx:6` → `ADMIN_VIAJES_CAMPAIGNS_MOCK`
  (`adminViajesCampaignsMock.ts:1` says so in its own header: *"admin curation shell (no engine yet)"*)

`git grep "use server|getAdminSupabase" origin/main -- 'app/admin/(dashboard)/clasificados/viajes'` returns
**zero** hits. The only real I/O in the whole subtree is
`business-offers/AdminViajesBusinessOffersModeration.tsx:55,:98` fetching the staged-listings API. The
Placement / Featured-rank editor at `AdminViajesAffiliateOfferForm.tsx:35-39,:144-192` — with
`homepage_featured`, `top_offers_week`, `results_eligible`, `seasonal_campaign` toggles — writes to React
state and nothing else. **This is the substance of row 18 (Placement) = FALSE.**

---

## 5. (c) AUDIT LOGGING — CONFIRMATIONS AND EXTENSIONS

Established in 09A and **confirmed verbatim** here: `admin_audit_log` has **no actor column at all**
(`adminAuditLogServer.ts:44-48` says so in its own words); `auditAdminWrite.ts:10` is fire-and-forget and
error-swallowing; API-route coverage is 6 of 64 mutating routes.

**Extensions (new):**

**E1 — the 6 audited routes are exactly the 6 listing routes.**
`autos`, `clasificados`, `empleos`, `restaurantes`, `servicios`, `viajes` `listings/[id]/route.ts`. Every
other mutating route — `manual-payments`, `subscription-sweep`, all 3 `leads/**` PATCH, both upload routes,
`recursos/intake/pdf-upload`, all 6 `ofertas-locales/admin/**`, `empleos/listings/moderate`,
`viajes/staged-listings/moderate`, both `ai-review` routes — writes **nothing**.

**E2 — six admin server-action files have ZERO audit writes, and three of them are category moderation paths.**
Determined by grepping every `*Actions.ts` / `actions.ts` under `app/admin` on `origin/main`:

| FILE | WRITES | AUDIT |
|---|---|---|
| `app/admin/(dashboard)/workspace/clasificados/comida-local/actions.ts` | listing status | **0** |
| `app/admin/(dashboard)/workspace/clasificados/ofertas-locales/actions.ts` | approve/reject/archive | **0** |
| `app/admin/(dashboard)/workspace/clasificados/servicios/actions.ts` | status, `leonix_verified`, review moderation (3 exports) | **0** |
| `app/admin/executiveHubActions.ts` | executive hub content | **0** |
| `app/admin/recursosReverificationActions.ts` | reverification state | **0** |
| `app/admin/_lib/adminDashboardReviewActions.ts` | *(pure href helpers — correctly needs none)* | n/a |

Because Comida Local and Ofertas Locales have **no API route** either (§4), **every admin write against
those two categories is invisible in every audit surface.** Servicios is worse: its three server actions
are unaudited *while* its API route is audited, so the Servicios audit trail is silently partial.

**E3 — `auditAdminWrite.ts:14` hardcodes `source: "leonix_admin"`.** Even the free-form `meta` blob carries
a constant, not an operator. Combined with the missing actor column, **no `admin_audit_log` row in the
system can be attributed to a person.**

**E4 — a proven, attributed audit implementation already exists and is already used.**
`app/admin/_lib/adminRosterAudit.ts:95-119` `writeRosterAuditLog()` writes to `admin_roster_audit_log` with
`actor_roster_id`, `actor_auth_user_id`, `actor_email`, `actor_role` (`:100-108`), backed by a real
migration with FKs, indexes and RLS
(`supabase/migrations/20260731220000_admin_roster_foundation_and_sales_workspace.sql:332-352`). It is called
from `adminTeamActions.ts:120,:155,:198` and `teamProvisioningActions.ts:100`. **This is the ADOPT_EXISTING
reference for fixing the actor-less `admin_audit_log`.**

**E5 (new, security-adjacent) — the attributed log's actor is resolved from an unverified cookie.**
`adminRosterAudit.ts:28-48` `resolveActingRosterIdentity()` reads `leonix_admin_operator_email` and
`leonix_admin_auth_user_id` from the jar (`:30-31`) and then looks the roster row up **by email**
(`:38` `.eq("email", email)`) — with **no** `supabase.auth.admin.getUserById()` round-trip. This is exactly
the pattern `businessWorkspaceAccess.ts:139-142` forbids ("roster resolved **by `auth_user_id`**, never by
email"). An attacker holding the forged coarse cookie can therefore set both cookies to a real staff
member's values and have `admin_roster_audit_log` record **that staff member** as the actor for a roster
mutation. **Severity: MEDIUM (audit-trail poisoning / repudiation).** The `authUserId` written at `:104`
is the raw unverified cookie value.

**E6 (new) — literal-string attribution in the entitlement revoke path.**
`app/admin/(dashboard)/workspace/package-entitlements/actions.ts:409-410` writes
`revoked_by_name: "Admin", revoked_by_role: "admin"` — hardcoded constants, not the operator. Same class as
09A's finding that `ofertasLocalesReviewAuth.ts:19-22` synthesizes the literal actor id `"admin"`.

---

## 6. (d) ADMIN ANALYTICS — CONFIRMED, AND WHAT IS BLIND

`10_ANALYTICS_EVENT_COVERAGE.md:188-189` established there is **no cross-category admin analytics reader**.
**Confirmed on `origin/main`.** The exhaustive set of admin analytics readers is:

1. `app/admin/(dashboard)/workspace/clasificados/servicios/_lib/serviciosAdminCanonicalAnalytics.ts:40`
   — reads `listing_analytics` but **pins the category at the query level**:
   `:43 .eq("source_table", "servicios_public_listings")`. Imported only by `servicios/page.tsx:41`.
2. `app/admin/_lib/adminUserRollups.ts:318` `fetchAdminUserAnalyticsRollup` — a **per-owner** rollup,
   surfaced at `usuarios/[id]/page.tsx`. It works by importing the **owner dashboard's** reader
   (`:4 import { fetchOwnerAnalyticsTotals } from "@/app/(site)/dashboard/lib/dashboardAnalyticsSummary"`).

**Capabilities that are therefore analytically blind** (no admin can see performance data for them at all):

| Blind surface | Consequence |
|---|---|
| **13 of 14 category queues** (everything except servicios) | Staff moderating restaurantes, autos, bienes-raices, rentas, empleos, comida-local, ofertas-locales, en-venta, busco, clases, comunidad, mascotas, viajes cannot see views/CTA/leads on any row. |
| **Featured / promote (row 8)** | `admin_promoted` can be toggled with **no** before/after performance signal. Featuring is a blind decision. |
| **Placement (row 18)** | Print/placement grants have no impression or click readback. |
| **Package entitlements & comp grants (rows 21–22)** | No way to evaluate whether a granted package delivered value. |
| **Promo codes (row 24)** | Redemption counts exist in `paymentTrackerData.ts:177`, but no engagement/conversion analytics. |
| **Command center (row 2)** | No traffic, funnel, or conversion tile anywhere on `/admin`. |
| **Leads (row 31)** | Lead volume counts exist (`adminDashboardData.ts:549-565`); lead *source* attribution does not. |

**ADOPT_EXISTING is available and already half-done:** `fetchOwnerAnalyticsTotals`
(`app/(site)/dashboard/lib/dashboardAnalyticsSummary.ts`) is **category-agnostic** and **already imported by
admin code** (`adminUserRollups.ts:4`). Generalizing `serviciosAdminCanonicalAnalytics` by parameterizing
`source_table` — the canonical map already exists as `LISTING_ANALYTICS_SOURCE_TABLES`
(`app/lib/analytics/listingAnalyticsIdentity.ts:19`, 8 tables) and `LISTING_ANALYTICS_CATEGORIES` (`:25`,
**all 14, complete**, per 07 #18) — is a mechanical change, not new engineering.

---

## 7. NEW P0 / P1 / P2 FINDINGS (capability-side; auth findings belong to 09A)

### 7.1 — P2: four orphaned URL-encoded shadow routes (a correction to 09A's census)

`git ls-tree -r --name-only origin/main -- app/api/admin` lists **four directories literally named
`%5BbusinessId%5D`**:

```
app/api/admin/businesses/%5BbusinessId%5D/advisor/route.ts          (627 bytes)
app/api/admin/businesses/%5BbusinessId%5D/assistant/route.ts        (647 bytes)
app/api/admin/businesses/%5BbusinessId%5D/creative-studio/route.ts  (636 bytes)
app/api/admin/businesses/%5BbusinessId%5D/outcomes/route.ts         (644 bytes)
```

alongside the real `[businessId]` versions (1141 / 2409 / — / 1161 bytes). They are earlier, smaller copies
committed by `fb034bbb` and `ffb081a8` — a Windows shell escaped the brackets. Two proofs they are dead:

1. `%5BbusinessId%5D` is a **literal static segment** to the Next.js router, not a dynamic param — the only
   URL that reaches them is the literal `/api/admin/businesses/%5BbusinessId%5D/advisor`.
2. They use the **Next 14** handler signature `{ params }: { params: { businessId: string } }`
   (`.../advisor/route.ts:10`) while the live twins use Next 15's `Promise<{...}>`. `package.json` pins
   `next: ^15.5.7`.

They **are** guarded (`requireSalesWorkspaceAccess` at `:12`), so this is not a security hole. It is dead
code that inflates the route census. **Corrected counts: 78 live admin route files, 47 strong, 31 coarse.**
09A's conclusions are unaffected (all 4 removed files are strong-guarded).
**EVIDENCE GAP:** whether these produce a `next build` type error was not verified — that needs a build.

### 7.2 — P1-A: the Command Center is blind to the four highest-value lanes

`app/admin/_lib/adminDashboardData.ts:55` types the pending-review row source as exactly
`"generic_listings" | "empleos_public_listings" | "viajes_staged_listings"`, fed by three fetchers
(`:305 fetchListingsPendingReview`, `:374 fetchEmpleosPendingReview`, `:436 fetchViajesPendingReview`)
merged at `:497`. `:35` types the expiring row source as `"generic_listings" | "viajes_staged"`, fed by
`:190` and `:248`.

**Consequence:** a suspended/flagged Restaurantes, Servicios, Autos, Comida Local or Ofertas Locales listing
**never appears** on `/admin`. The admin home page — the first destination in the COMMAND nav group
(`adminGlobalNav.ts:62`) — silently understates the review backlog. Nothing in the UI says so.

### 7.3 — P1-B: the subscription lifecycle crank has no caller and no cron

`app/api/revenue-os/admin/subscription-sweep/route.ts:18` states in its own doc comment:
*"No cron exists in this build (vercel.json is locked until Package F) — an external pinger/CI may call
this with the signed machine secret."*

**Verified on `origin/main`:** `git show origin/main:vercel.json` → **file does not exist**.
`git grep -l '"crons"' origin/main` → **zero hits**. `git grep "subscription-sweep" origin/main` → only the
route, one self-test, one diff allowlist, and docs. **No admin UI button invokes it.**

**Consequence:** `sweepDueSubscriptionTransitions` and `reapStaleProcessingEvents` never run. Grace-expired
subscriptions are never suspended by the backstop, and stale event-ledger claims are never reaped, unless a
human manually issues the POST. Compounded by 07's **G1 (CRITICAL)** — comida-local has no
`LANE_SUSPENSION` entry at all — non-payment does not unpublish.

### 7.4 — P1-C: `admin_audit_log` cannot attribute any row to a person (see §5, E3/E4)

### 7.5 — P1-D: three category-moderation write paths are entirely unaudited (see §5, E2)

### 7.6 — P2-E: audit-trail actor is resolvable from an unverified email cookie (see §5, E5)

### 7.7 — P2-F: `adminActionTruth` / `adminListingClassification` / `adminStatusAttention` are dead code (see §3.5)

### 7.8 — P2-G: Community Trust moderation actions have no UI (row 35)

`app/admin/_lib/leonixEndorsementAdminActions.ts` is a `"use server"` module (`:1`) whose two exports
(`:17` `removeLeonixEndorsementVoteAction`, `:47` `inspectLeonixEndorsementAggregateAction`) have **zero
importers**. Note the 09A §5.g precedent: exports from a `"use server"` module are registered Server
Actions regardless of whether anything imports them — the same action-id discoverability question applies
here. **EVIDENCE GAP: identical to 09A finding H — requires a build artifact to settle.**

### 7.9 — P1-H: a *correct* staff-creation guard already exists and is not used

`app/admin/_lib/adminAuthBoundary.ts:44-46`:

```ts
export function canCreateStaffUsers(ctx: AdminAccessContext): boolean {
  return ctx.hasAdminCookie && isOwnerAdminRole(ctx.normalizedRole) && ctx.rosterResolved;
}
```

This **requires `rosterResolved` affirmatively** — precisely the fix 09A §9 prescribes for the P0 at
`teamProvisioningActions.ts:35` (`if (access.rosterResolved && access.rosterRole !== "super_admin")`, which
short-circuits to `false` under the minimal forgery). `git grep -n "canCreateStaffUsers" origin/main`
returns **the definition and nothing else**. The correct guard was written, exported, and never wired.
**This makes 09A's P0-A an ADOPT_EXISTING fix, not new engineering.**

---

## 8. (f) MAIN vs SEPT — ADMIN SURFACE

```
git diff --name-status 7878d856 e3956df8 -- app/admin app/api/admin app/api/ofertas-locales/admin app/api/revenue-os/admin
git diff --name-status 7878d856 origin/main -- (same paths)
```

| Measure | Sept `e3956df8` | main `a0a47839` |
|---|---|---|
| Admin-surface files | **499** | **528** |
| Files **added** since merge-base `7878d856` | **0** | **34** |
| Files **modified** since merge-base | **2** | (many) |

### 8.1 Files present on Sept and absent from main — **5**

All five are the same thing: `StrictSalesActor` → engine-actor adapters.

```
app/admin/_lib/diyConciergeActor.ts
app/admin/_lib/fieldDiscoveryActor.ts
app/admin/_lib/healthMapActor.ts
app/admin/_lib/livingBookActor.ts
app/admin/_lib/stewardshipActor.ts
```

**These are NOT a lost capability. They were deliberately removed.**
`app/admin/_lib/businessWorkspaceAccess.ts:198-215` on `origin/main` states the replacement policy verbatim:

> *"Locked PM policy (overrides/deprecates every prior 'map bootstrap to owner' pattern that used to live in
> this file as salesActorToCreativeActor / … / and in **livingBookActor.ts as salesActorToLivingBookActor**):
> owner_bootstrap may NEVER perform a Business Concierge write … there is exactly one way to obtain a
> writable staff actor: `requireStaffWorkspaceWriteAccess()` … Every other construction of a
> `{ type: "staff", … }` actor object on the admin surface is **forbidden** — see
> `scripts/verify-business-concierge-actor-safety-01.ts`."*

On Sept these 5 modules are imported by 19 Business Concierge routes; on main those routes call
`requireStaffWorkspaceWriteAccess` / `toStaffWriteActor` directly. **Main is strictly ahead.**

### 8.2 Files on main and absent from Sept — **34**

- The entire **LEO admin surface** (32 files): `app/admin/(dashboard)/leo/page.tsx` + 31 `_components`.
- `app/api/admin/businesses/[businessId]/ownership-claim/route.ts` +
  `app/admin/(dashboard)/businesses/[businessId]/OwnershipClaimPanel.tsx`.
- `app/admin/_components/AdminExecutiveReportsPanel.tsx`.

### 8.3 The two Sept-modified admin files — **ONE REAL UNMERGED FIX, ONE MINOR REGRESSION**

`git diff e3956df8 origin/main -- app/admin/actions.ts` shows main is **19 lines lighter**. Both deletions
are real:

**(1) — P1: the self-report guard exists on Sept and NOT on main.**
`e3956df8:app/admin/actions.ts` contains, inside `submitListingReportAction`:

```ts
import { isSelfEngagement } from "@/app/lib/analytics/selfEngagementGuard";
...
// Wave 3 G26 fix — this write previously accepted a report from anyone, including the
// listing's own owner, with no ownership check at all. Fails open (allows the report) only
// when the owner is genuinely unknown, matching isSelfEngagement's existing fail-open contract.
if (reporterId) {
  const { data: ownerRow } = await supabase.from("listings").select("owner_id").eq("id", listingId).maybeSingle();
  if (isSelfEngagement(reporterId, ownerRow?.owner_id ?? null)) {
    throw new Error("You cannot report your own listing.");
  }
}
```

**`origin/main` has none of it.** This bears directly on **09A finding I** (`actions.ts:13`
`submitListingReportAction` — spoofable `reporterId`, unauthenticated unbounded service-role insert,
severity MEDIUM). A partial fix — the ownership half — **already exists on the Sept fork and was never
merged.** 09A's remediation for finding I should be reclassified from "net new" to **FIX REGRESSION /
ADOPT EXISTING (`e3956df8`)**.

**(2) — P2: the Servicios admin queue lost its monetization column.**
`e3956df8:app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx` imports
`AdminListingMonetizationSummary` (`:8`) and renders a `Monetization` `<th>` plus a per-row
`<AdminListingMonetizationSummary category="servicios" source="servicios_public_listings" listing={r} />`
in the dev-publish-persistence table. `origin/main` deleted the import, the header cell and the cell body.
The component still exists on main (`.../_components/AdminListingMonetizationSummary.tsx`) and is used by
the autos/empleos/restaurantes/travel queues — so this is a **Servicios-only regression**, scoped to the
dev-publish rows.

### 8.4 Verdict on (f)

> **No Admin *capability* exists on Sept that does not exist on main.** The 5 Sept-only files are a
> superseded actor-mapping pattern that main deliberately replaced with a stricter one. **Two Sept-only
> *code behaviours* were lost:** the `submitListingReportAction` self-report guard (**P1, real security
> value, unmerged fix**) and the Servicios monetization column (**P2, cosmetic/inspection**).

---

## 9. REFERENCE-IMPLEMENTATION TABLE — MANDATORY FOR EVERY FALSE

| FALSE ROW | PROVEN REFERENCE EXISTS | REFERENCE CATEGORY / CAPABILITY | REFERENCE PATH | TARGET PATH | DIFFERENCE | ACTION |
|---|---|---|---|---|---|---|
| **4 — Admin analytics (cross-category)** | **YES** | Servicios admin analytics; owner-dashboard analytics | `app/admin/(dashboard)/workspace/clasificados/servicios/_lib/serviciosAdminCanonicalAnalytics.ts:40-46`; `app/(site)/dashboard/lib/dashboardAnalyticsSummary.ts` `fetchOwnerAnalyticsTotals` (already imported at `adminUserRollups.ts:4`) | all 13 other queue pages | Reference pins `.eq("source_table","servicios_public_listings")` at `:43`. The canonical map already exists: `listingAnalyticsIdentity.ts:19` `LISTING_ANALYTICS_SOURCE_TABLES` (8 tables) + `:25` `LISTING_ANALYTICS_CATEGORIES` (all 14). | **ADOPT EXISTING** — parameterize `source_table` from the canonical map |
| **5 — System health (platform)** | **NO** | — | — | — | Per-business health (`app/api/admin/businesses/[businessId]/health/route.ts`) is entity-scoped, not platform-scoped. No cron monitor, queue-depth, webhook-failure or error-rate surface exists anywhere. | **NET NEW** |
| **10 — User email/SMS/business verification** | **PARTIAL — YES for the pattern, NO for the domain** | Listing `leonix_verified` toggle | `app/api/admin/clasificados/listings/[id]/route.ts:87-92` (`verify_on`/`verify_off`); `servicios/actions.ts:52` | `app/admin/(dashboard)/usuarios/[id]/page.tsx` | Reference verifies a **listing badge**. There is no identity-verification state on `profiles` to toggle, and no Supabase Auth `email_confirmed_at` / phone-verify control in admin. | **NET NEW** |
| **16b — Listing expiry write** | **YES** | Entitlement expiry extension | `app/admin/(dashboard)/workspace/package-entitlements/actions.ts:430` `extendPackageEntitlementAction` | per-category listing tables | Reference extends `listing_package_entitlements.ends_at`; no equivalent writes a listing's own expiry column. | **ADOPT EXISTING** (extend the same form to the listing row) |
| **17b — Listing-level ranking** | **YES** | Category ordering | `app/admin/siteCategoryConfigActions.ts:21` → `site_category_config.sort_order` (`categories/page.tsx:354`) | per-listing rows | Reference orders **categories**. `admin_promoted` is boolean, not ordinal — there is no rank column or rank writer for listings. | **NET NEW** (adopt the form pattern; the column does not exist) |
| **18 — Placement management** | **YES** | Print-entitlement placement creation | `app/admin/(dashboard)/workspace/package-entitlements/actions.ts:289-319` (`placementSource: "included_with_print"`) | `app/admin/(dashboard)/clasificados/viajes/affiliate-cards/*` (currently mock) | Reference **creates** placement rows as a side effect of a print grant. Viajes' placement editor (`AdminViajesAffiliateOfferForm.tsx:35-39`) writes only React state. No edit/revoke/reorder path exists in either. | **FIX REGRESSION** for the Viajes mock (replace mocks with the real writer) + **NET NEW** for edit/revoke |
| **20 — Stripe tracking** | **YES** | Manual payment tracker | `app/admin/_lib/paymentTrackerData.ts:302` `fetchPaymentTrackerSnapshot` over `leonix_payment_records`; `app/lib/listingPlans/stripeEventLedger.ts` (idempotency ledger, exists and is written) | `app/admin/(dashboard)/payments/page.tsx` | Reference is a full filtered table over a real table. The Stripe page is an env-gated outbound `<a>` plus a disabled `<input>` (`:208-209`). `stripe_event_ledger` has **no admin reader at all**. | **ADOPT EXISTING** — clone `paymentTrackerData` against `stripe_event_ledger` |
| **25 — Subscriptions (lifecycle)** | **YES** | The sweep endpoint itself | `app/api/revenue-os/admin/subscription-sweep/route.ts:39` (a complete, guarded, idempotent, dry-run-capable implementation) | scheduler / admin trigger | The **handler is finished**; there is no cron config and no caller. `vercel.json` does not exist; `"crons"` appears nowhere in the repo. | **ADOPT EXISTING** — add a schedule and/or an admin trigger button; no new logic required |
| **34 — Job applications** | **YES** | Viajes business applications | `app/api/admin/viajes/staged-listings/route.ts` + `/moderate/route.ts`, driven by `AdminViajesBusinessOffersModeration.tsx:55,:98` | `app/admin/(dashboard)/workspace/clasificados/empleos/*` | Reference is a real list + moderate loop over an application-shaped table. Empleos exposes only `apply_count` (`empleos/page.tsx:253`) — no applicant rows are stored or read. | **NET NEW** (the applicant table does not exist) |
| **35 — Community Trust moderation UI** | **YES** | Abuse-reports moderation UI | `app/admin/(dashboard)/reportes/page.tsx` + `AdminReportsTable.tsx:5,:37` calling `updateListingReportStatusAction` | `app/admin/_lib/leonixEndorsementAdminActions.ts:17,:47` | Reference is an identical shape — server action + table + status buttons — and is wired. The endorsement actions are complete and have **no page**. | **ADOPT EXISTING** — clone `/admin/reportes` against `leonix_endorsement_votes` |
| **09A P0-A (staff provisioning)** | **YES** | `canCreateStaffUsers` | `app/admin/_lib/adminAuthBoundary.ts:44-46` (requires `ctx.rosterResolved`) | `app/admin/teamProvisioningActions.ts:35` | Target's `requireSuperAdminStaffCreator` short-circuits on `access.rosterResolved &&`; the reference **requires** it. Reference has zero call sites. | **ADOPT EXISTING** |
| **09A finding I (self-report)** | **YES** | Sept fork | `e3956df8:app/admin/actions.ts` (`isSelfEngagement` block, "Wave 3 G26 fix") | `origin/main:app/admin/actions.ts:13-23` | Main lacks the ownership check entirely. | **FIX REGRESSION** |
| **Audit actor column (P1-C)** | **YES** | Roster audit log | `app/admin/_lib/adminRosterAudit.ts:95-119`; migration `supabase/migrations/20260731220000_admin_roster_foundation_and_sales_workspace.sql:332-352` | `app/admin/_lib/adminAuditLogServer.ts:22-27` | Reference persists 4 actor columns with FKs + RLS; target persists none. | **ADOPT EXISTING** |
| **Featured/verify on comida-local & ofertas (rows 8, 9)** | **YES** | The 6 uniform listing routes | `app/api/admin/{autos,clasificados,empleos,restaurantes,servicios,viajes}/listings/[id]/route.ts` — identical 8-action contract | `.../comida-local/actions.ts`, `.../ofertas-locales/actions.ts` | Targets implement only status / review-state. The blocker is the type at `ClassifiedAdminRowActions.tsx:17-23`, which has no variant for either. | **ADOPT EXISTING** |
| **Command-center coverage (P1-A)** | **YES** | `fetchEmpleosPendingReview` / `fetchViajesPendingReview` | `app/admin/_lib/adminDashboardData.ts:374,:436` | same file, `:55` union + `:497` merge | Two per-vertical fetchers already prove the pattern; five more verticals need the same 40-line function each. | **ADOPT EXISTING** |
| **Viajes admin mocks (§4)** | **YES** | `AdminViajesBusinessOffersModeration.tsx:55,:98` — the one sibling page that fetches real data | `clasificados/viajes/{page,affiliate-cards,businesses,campaigns}` | Siblings render `ADMIN_VIAJES_*_MOCK` constants; no `getAdminSupabase` or `"use server"` anywhere in the subtree. | **NET NEW** (no affiliate/campaign tables were located — see EVIDENCE GAP 4) |

---

## 10. EVIDENCE GAPS

1. **No DB-level verification anywhere in this audit.** All findings are source-level. Column existence
   (`admin_promoted`, `leonix_verified`, `revoked_by_name`), RLS policies, and CHECK constraints were not
   confirmed against a live database. `admin_roster_audit_log`'s schema was read from the migration file,
   not from the deployed instance.
2. **Server Action id discoverability (row 35 / P2-G).** Whether
   `removeLeonixEndorsementVoteAction` — an export of a `"use server"` module with **no importer** — has a
   build-time action id emitted into any client bundle cannot be settled from source. This is the identical
   gap 09A recorded for finding H (`confirmOfficialSpanishCore`) and needs a production `.next/` artifact.
3. **`%5BbusinessId%5D` build behaviour (§7.1).** Whether the four orphaned routes' Next-14 `params`
   signature produces a `next build` type error, or is silently accepted because the segment is static, was
   not determined. Requires a build.
4. **Viajes affiliate/campaign persistence.** No `viajes_affiliate_offers` or `viajes_campaigns` table was
   located in `supabase/migrations`, but the migrations directory was not exhaustively enumerated. The
   REFERENCE row for §4 is therefore marked NET NEW on the assumption no table exists; a full migration
   sweep could downgrade it to ADOPT EXISTING.
5. **Runtime `ADMIN_ENFORCE_ROSTER_PERMISSIONS` value.** Inherited from 09A §5.d as OFF-by-default and not
   independently re-verified here. If it is set to `"1"` in a deployment environment not represented in the
   repo, every `requireLeonixAdminPermission` guard in this matrix hardens, and several COARSE labels in
   the GUARD column become real permission checks.
6. **`admin_audit_log` row volume.** E1/E2 establish which code paths *write* audit rows. Whether the table
   is actually receiving them (i.e. whether the migration was applied) is unverified —
   `fetchAdminAuditLogFiltered:81-83` handles a missing table by returning `mode: "unavailable"`, so the
   activity-log page would degrade silently.
7. **Sales-rep path scoping.** `staffSalesAllowedAdminPath.ts` / `isStaffSalesAllowedAdminPath`
   (`layout.tsx:40`) restricts `sales_rep` role navigation. The exact allowed-path list was not enumerated,
   so per-capability *role* coverage (as opposed to per-capability *existence*) is out of this matrix's
   scope.
8. **Category count of 446.** `git ls-tree` counts every file under `app/admin`, including 6 committed
   `.md` audit documents and mock/type files. The count of *reachable pages* is 126
   (`page.tsx`/`layout.tsx`), and of *server-action files* is 38.

---

*Read-only audit. No application source modified; no git write commands executed. Sole artifact written:
this file. All `origin/main` findings resolved against `a0a4783971b42ea1d71ab2602d4720d0d590baf8`; all Sept
findings against `e3956df893f5041ca22371c999038f297d536eae`; merge-base `7878d856a2762c91548623166ab31e554510c373`.*
