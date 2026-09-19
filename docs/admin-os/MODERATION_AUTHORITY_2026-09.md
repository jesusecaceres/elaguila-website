# Gate 10 — Moderation / trust authority in Clasificados (2026-09-19)

Question: can AI or automated analysis silently change publication state (`status`, `is_published`, `lifecycle_status`, `listing_status`,
`is_public`, `published_at`, `expires_at`) of a Clasificados listing?

**Verdict.** No AI or scanner code path writes publication state. Every AI / scanner output is stored as evidence (`listing_moderation_reviews`,
`oferta_local_items` with `needs_review` + inactive, `listing_reports`) and a human acts. The only automatic publication writers are
**deterministic payment / subscription** policies (no AI, no uncertainty). One real authority defect was found in the *human* path: the staff
publication routes are authorised by an **unsigned** `leonix_admin=1` cookie (§5). Iglesias is a separate system with its own AI auto-publish
(OWNER REVIEW, untouched).

Executable proof: `scripts/verify-final-parity-moderation.ts` (Gate 10 checks) + existing `scripts/verify-admin-ai-moderation-engine.mjs`,
`verify-admin-ai-moderation-policy.mjs`, `ofertas-locales-scan-persist-publish-separation-audit.ts` (all pass).

Legend. **ADVISORY** = produces evidence/recommendation, cannot change state. **HUMAN_REQUIRED** = state changes only by a staff or owner action.
**AUTOMATIC** = writes state without a human in the loop (each one is listed with why it is safe).

## 1. Classification

| # | Automation / signal | Trigger | Writes | Class | Evidence (file:function) |
|---|---|---|---|---|---|
| 1 | Listing AI moderation review (single + bulk ≤ 15) | staff click; **no** auto-backfill | one INSERT into `listing_moderation_reviews` + `admin_audit_log` row; never `listings` | **ADVISORY** | `app/admin/_lib/listingAiModerationService.ts:runListingAiReviewForId`, `:runBulkListingAiReview`; `listingModerationReviewsDb.ts:insertListingModerationReview`; routes `api/admin/clasificados/listings/[id]/ai-review` ("Does not change listing status"), `…/ai-review/bulk`; engine prompt: "recommended_action is advisory only… NEVER recommend auto-delete, auto-hide, auto-archive" (`listingAiModerationEngine.ts:buildSystemPrompt`) |
| 2 | Deterministic keyword / category policy scanner | called by #1 | none (pure, returns `PolicyScannerResult`) | **ADVISORY** | `listingModerationPolicy.ts:runListingModerationPolicyScan` |
| 3 | AI uncertainty handling | inside #1 | none — `needs_review` for uncertainty; "if scanner risk is critical but you would approve, use needs_review" | **ADVISORY** | `listingAiModerationEngine.ts:buildSystemPrompt` rules; `normalizeRecommendedAction` |
| 4 | Owner-facing moderation reason | dashboard | read-only projection of #1 (decision, reason) for listings the caller owns | **ADVISORY** | `api/dashboard/listing-moderation-reasons/route.ts:POST` |
| 5 | Reports / complaints | anyone (public button) | INSERT `listing_reports` (`status:'pending'`) + high-severity email alert; no listing write; DB has no report-count trigger | **ADVISORY** | `en-venta/report/submitEnVentaListingReport.ts:submitEnVentaListingReport`; `app/admin/actions.ts:submitListingReportAction`; `supabase/migrations/20250312000001_listing_reports.sql` |
| 6 | Report triage | staff | `listing_reports.status` only (`pending/reviewed/dismissed`); permission `can_manage_reports` | **HUMAN_REQUIRED** | `app/admin/actions.ts:updateListingReportStatusAction` |
| 7 | Review queues / moderation notes | staff | `moderation_notes` (Servicios), review-queue status via staff actions | **HUMAN_REQUIRED** | `app/admin/(dashboard)/workspace/clasificados/servicios/actions.ts` (status form, CAS on `listing_status`); `adminPrePublishActionPolicy.ts`; `adminReactivationPolicy.ts` |
| 8 | Staff lifecycle actions (suspend / archive / restore / republish / approve / reject) | staff | `status` / `lifecycle_status` / `listing_status` / `is_published` with payment-hold + pre-publish policies | **HUMAN_REQUIRED** (authority defect §5) | `api/admin/clasificados/listings/[id]/route.ts:PATCH`, `api/admin/{autos,servicios,restaurantes,comida-local,empleos,viajes}/…`, `ofertasLocalesAdminReviewMutations.ts:mutateOfertaLocalAdminReview` (via `ofertasLocalesAdminReviewService.ts:runOfertaLocalAdminReview`) |
| 9 | Verification badge `leonix_verified` | staff toggle | `leonix_verified` (no visibility effect) | **HUMAN_REQUIRED** | `…/servicios/actions.ts` (`update({ leonix_verified })`) |
| 10 | Featured / promoted (`admin_promoted`) | staff toggle | `admin_promoted` (ranking only) | **HUMAN_REQUIRED** | `api/admin/clasificados/listings/[id]/route.ts` (`patch.admin_promoted`), `adminEmpleosStaffActions.ts`, `api/admin/viajes/listings/[id]/route.ts` |
| 11 | Entitlement-derived "featured" | every read | **none** — computed in memory from active `listing_package_entitlements` when mapping rows | **AUTOMATIC (read-time, no write)** | `api/clasificados/autos/public/listings/route.ts`, `rentas/lib/fetchRentasPublicListingsForBrowse.ts` |
| 12 | Ofertas AI scan (flyer → items) | owner action (`scan-prep`, scan API) | INSERT `oferta_local_items` forced `review_status:'needs_review'`, `is_active:false`, `is_sponsored:false`; parent gets only `ai_scan_status` / `ai_last_scan_job_id` / `last_scan_error` | **ADVISORY** | `ofertasLocalesScanApiHandler.ts` (item insert + 3 parent updates); `ofertasLocalesAiDbMapper.ts:mapOfertaLocalSearchableItemDraftToDbInsert`; audit `scripts/ofertas-locales-scan-persist-publish-separation-audit.ts` |
| 13 | Ofertas item review (approve / reject scanned items) | owner (or staff) | `oferta_local_items.review_status`; parent unaffected | **HUMAN_REQUIRED** | `api/ofertas-locales/items/[itemId]/route.ts:PATCH` (`resolveOfertasLocalesOwnerOrAdminAuth` — see §5 caveat) |
| 14 | Ofertas parent approve / reject / archive / restore | staff | `ofertas_locales.status`, term stamps on first approval; approve refused while items are `pending/needs_review`, source version not ready, or no approved item | **HUMAN_REQUIRED** | `ofertasLocalesAdminReviewMutations.ts:mutateOfertaLocalAdminReview` (`assertNoUnresolvedItemsBeforeApproval`, `assertSourceVersionReadyBeforeApproval`) |
| 15 | Ofertas auto-activation after payment | payment webhook | calls the **same** approve mutation as #14 (same gates); term stamped by `decideOfertaApprovalTerm` | **AUTOMATIC — deterministic payment policy, no AI** | `ofertasLocalesAdminReviewMutations.ts:tryAutoActivateOfertaLocalAfterPayment` ← `app/lib/listingPlans/revenueFulfillment.ts` (only caller; verifier asserts this) |
| 16 | Ofertas manual-coupon item sync | owner saves coupons | INSERT/UPSERT items `approved` + `is_active:true` from owner-typed coupon fields; parent must still be `approved` for anything to be public (`canOfertaLocalItemBePubliclyEligible`) | **AUTOMATIC — deterministic, owner-authored, parent-gated** | `ofertasLocalesCouponItemSync.ts:buildOfertaLocalCouponItemInsertRow`; `api/ofertas-locales/coupons/sync/route.ts` |
| 17 | Paid-listing activators (Rentas, FSBO, Clases, Autos Dealer/Privado, Servicios, Restaurantes, Comida Local, Empleos, BR Negocio) | verified payment | `pending`/`pending_payment` → live + term stamp | **AUTOMATIC — deterministic payment authority** | `app/lib/listingPlans/revenue*Fulfillment.ts`, `revenueFulfillment.ts`, `autosClassifiedsListingService.ts:tryActivateAutosListingAfterPayment` |
| 18 | Subscription grace / suspension sweep | daily cron `vercel.json` → `/api/revenue-os/admin/subscription-sweep` (CRON_SECRET / sweep key / super_admin) | suspends (`suspended` / `payment_failed`, marker `suspended_reason='payment'`) and restores payment-suspended lanes | **AUTOMATIC — deterministic payment safety policy** | `app/lib/listingPlans/subscriptionLifecycle.ts:applyPaymentSuspension / liftPaymentSuspension / sweepDueSubscriptionTransitions`, `subscriptionLifecyclePolicy.ts:decideSubscriptionTransition` |
| 19 | Term expiry (Rentas 30 d, Clases paid 30 d, FSBO 45 d, Autos Privado 30 d, Ofertas 30 d) | every read | **none** — expiry is a read-time predicate; `status` is never rewritten | **AUTOMATIC (read-time, no write)** | `resolveListingLifecycle.ts`, `enforcedTermReadPredicate.ts`, `bienesFsboLifecycle.ts:isBrFsboRowWithinTerm`, `isOfertaLocalPublicTermActive` |
| 20 | Publish-on-submit, no pre-moderation (En Venta / Busco / Comunidad / Mascotas free lanes; Empleos unless `EMPLEOS_REQUIRE_LISTING_REVIEW=1`; Servicios by owner-save policy) | owner submit | initial live status by deterministic policy; not AI | **AUTOMATIC (owner-initiated, deterministic)** — product decision: post-publication moderation | `en-venta/publish/enVentaPublishFromDraft.ts:publishEnVentaFromDraft`, `publish*QuickToListings.ts`, `empleosPublicListingsDbServer.ts:publishLifecycleForInsert`, `serviciosOwnerMutationPolicy.ts:decideServiciosOwnerSaveStatus` |
| 21 | En Venta family-safety text guard | owner publish (client-side) | none — **refuses** to publish on `needs_review`/`blocked`; no state write, not authoritative (client code) | **AUTOMATIC block (deterministic policy)** | `en-venta/moderation/enVentaFamilySafety.ts`, `enVentaPublishFromDraft.ts:publishEnVentaFromDraft` |
| 22 | Leo executive AI | operator chat | reads only; action proposals need explicit human approval; writes only Leo tables (verifier asserts no publication-table write anywhere under `app/leo`, `app/api/leo`) | **ADVISORY / HUMAN_REQUIRED** | `app/leo/_lib/leoReasonChain.ts` (read of `listings`), `leoActionProposalService.ts` |
| 23 | Translate Ad, Creative Studio, Growth analyst | owner / staff | content or proposals only, no publication column | **ADVISORY** | `app/api/translate-ad`, `app/lib/business/creativeStudio/*`, `growthEngine/analyst/*` |
| 24 | **Iglesias** church intake + prayer safety | church application / prayer submit | AI + deterministic `AUTO_PUBLISH` / `BLOCK` / `HUMAN_REVIEW`; prayer routing sets `status` / `moderation_status` | **OWNER REVIEW — separate system, not changed** (authoritative AI: high-confidence AUTO_PUBLISH) | `app/lib/iglesias/churchIntakeDecide.ts:finalizeChurchIntakeDecision` (`AUTO_PUBLISH_MIN_CONFIDENCE/IDENTITY/SAFETY`), `prayerSafetyAdapter.ts`, `prayerService.ts`, `prayerNetworkRouting.ts` |
| 25 | Recursos intake AI (community resources, not Clasificados) | staff intake | proposal objects; no publish call in the orchestrator | out of scope — not audited further | `app/lib/recursos/intake/*` |

Defect check: **AUTOMATIC writers that are driven by AI or a scanner result — none found.** No code needed changing for Gate 10 except one
public copy line: `anuncio/[id]/page.tsx` told visitors "the system may auto-hide listings if it detects spam or inappropriate content"; no
such path exists, so the ES/EN text now says Leonix reviews reports and nothing is hidden automatically by a system detection.

## 2. AI uncertainty rule
The listing AI engine is instructed to return `needs_review` for uncertainty/borderline/conflicting signals, `rejected` only for clearly
prohibited content, and never to recommend auto-hide/auto-archive; its `decision`/`recommended_action` are stored, displayed to staff
(`AdminAiReviewSummary`, `adminReviewFlagTruth.ts`) and to the owner (#4) and are consumed by nothing that writes `listings`. The verifier
asserts the engine/service/db modules contain no `.update(`, `.delete(`, `.upsert(` or `.rpc(`, and that the Ofertas scan handler never sets a
parent `status` / `published_at` / `expires_at`.

## 3. Deterministic safety policies that DO write (allowed: explicit, non-AI, auditable)
Payment-cleared activation (#15, #17), grace-expiry suspension and restoration (#18, guarded by `suspended_reason='payment'` so an admin
suspension is never lifted automatically and a payment suspension is never lifted by admin: `api/admin/clasificados/listings/[id]/route.ts`
"PAYMENT HOLD WINS"), and read-time term expiry (#19).

## 4. Where a human still decides
Publication after a scan: the owner reviews every scanned item; the flyer publishes on payment only if every item is resolved and a source
version is ready (#14/#15). Doctrine note for the owner: an Ofertas flyer therefore goes live with **no Leonix staff content review** (item
review is the seller's; AI scan is advisory). Post-publication controls are staff archive/reject (#8, #14) and reports (#5, #6).

## 5. "No unauthenticated / unauthorised publication writes" — surface found

**Defect (P0, not fixed here — Admin mutation routes belong to another lane; diff proposed).** The `leonix_admin` cookie is deliberately
*unsigned* (`app/lib/supabase/server.ts:requireAdminCookie` — comment "NOT signed", `app/lib/supabase/adminSession.ts` header). Middleware
(`middleware.ts`, only for paths starting `/admin`) and these API routes accept `leonix_admin=1` **alone** — any raw HTTP client can send
`Cookie: leonix_admin=1`. `/api/admin/**` is not matched by the middleware `/admin` check, so nothing else stands in front of them:

| Route (all mutate publication state, verified by `verify-final-parity-moderation.ts` scan) | Method | Effect with a forged cookie + a listing UUID (UUIDs are in public URLs) |
|---|---|---|
| `api/admin/clasificados/listings/[id]/route.ts` | PATCH | suspend / unsuspend / archive / republish / verify_on|off / promote_on|off any `listings` row (payment-hold + pre-publish policies still apply) |
| `api/admin/clasificados/listings/[id]/ai-review`, `…/ai-review/bulk` | POST | triggers paid OpenAI calls + `listing_moderation_reviews` inserts |
| `api/admin/autos/listings/[id]`, `servicios/listings/[id]`, `restaurantes/listings/[id]`, `comida-local/listings/[id]`, `empleos/listings/[id]`, `empleos/listings/moderate`, `viajes/listings/[id]`, `viajes/staged-listings/moderate`, `ofertas-locales/listings/[id]` | PATCH/POST | dedicated-table lifecycle changes (incl. Viajes / Ofertas approve) |
| `api/ofertas-locales/admin/[id]/review`, `…/renewals` | POST/PATCH | Ofertas approve / reject / renewal activation |
| `app/lib/ofertas-locales/ofertasLocalesReviewAuth.ts:resolveOfertasLocalesOwnerOrAdminAuth` (used by `api/ofertas-locales/items/[itemId]` PATCH and other Ofertas item/owner routes) | — | the cookie grants `isAdmin:true` (ownership bypass) → review/patch any offer's items |

Routes that are **safe** because identity is re-verified: the 85 `requireStaffWorkspaceWriteAccess(...)` and 47 `requireSalesWorkspaceAccess()`
routes (operator-email + auth-user-id cookies checked against Supabase Auth + live roster), revenue writes
(`requireRevenueProtectedWriteAccess`, bootstrap denied), the bootstrap session (HMAC-signed, `isAdminBootstrapSession`), cron
(`CRON_SECRET`, constant-time), Stripe webhooks (signature). Owner routes (`api/clasificados/**`, `api/ofertas-locales/owner/**`, publish) use
bearer-user identity with ownership checks. Other surfaces noted: `api/clasificados/en-venta/dev-seed-listing` (creates/deletes real `listings`
rows with no auth, disabled unless `EN_VENTA_DEV_PUBLISH=1` — must stay unset in production); public `listing_reports` INSERT is open by design.
Production DB: `listings_select_public USING (true)` (parity doc §5) and an owner UPDATE policy with no column limit (`PROPOSED_DB_HARDENING_2026-09.md` §1).

Proposed fix (lead applies; two independent layers):

1. **Sign the marker (central, ~40 lines).** In `app/lib/supabase/adminSession.ts` add
   `createAdminSessionToken()` → `"v1.<issuedAtMs>.<expiresAtMs>.<hmac-sha256>"` (secret `ADMIN_SESSION_SECRET`, falling back to
   `ADMIN_BOOTSTRAP_SESSION_SECRET`; fail closed when unset) and `isAdminSessionCookieValid(value)` (constant-time, expiry). Set the token
   instead of `"1"` in `applyLeonixAdminSessionCookies`; make `requireAdminCookie` return `isAdminSessionCookieValid(cookies.get("leonix_admin")?.value)`;
   replace the raw `=== "1"` reads (`api/admin/empleos/listings/route.ts`, `executive-hub/upload`, `magazine/upload`, `viajes/staged-listings*`,
   `middleware.ts` — Edge: verify with Web Crypto, make `middleware` async) with the same helper. Temporary escape hatch
   `ADMIN_ACCEPT_LEGACY_ADMIN_COOKIE=1` (default off) to avoid locking staff out during rollout; existing sessions must re-login.
2. **Re-verify identity on publication writes.** For the 15 routes above replace
   `if (!requireAdminCookie(jar)) return 401` with
   `const access = await requireSalesWorkspaceAccess(); if (!access.ok) return NextResponse.json({ok:false,error:"unauthorized"},{status: access.reason === … ? 403 : 401})`
   (or `requireStaffWorkspaceWriteAccess("<capability>")` where a capability exists, as the 85 other routes do) and pass `access.actor` to
   `appendAdminAuditLog` so the audit trail names the human. Decide separately whether the owner bootstrap session may moderate (the write helper
   currently denies bootstrap).

`node node_modules/tsx/dist/cli.mjs scripts/verify-final-parity-moderation.ts --strict-auth` turns the list into a failing check; the default run
prints it as `KNOWN DEFECTS` so shared runs stay green until the lead applies the fix.
