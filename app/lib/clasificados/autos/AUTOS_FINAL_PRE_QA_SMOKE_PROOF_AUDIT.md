# AUTOS FINAL PRE-QA SMOKE PROOF AUDIT

## Objective

Prove Autos Privado and Autos Negocios are ready for one real manual QA ad across form, draft persistence, preview, return-to-edit, confirm/publish readiness, success truth, public/results/dashboard/admin parity, and analytics identity truth, with Stripe and promo codes intentionally not wired in this gate.

## Preflight Dirty Classification

PRE-EXISTING UNRELATED DIRTY FILES:
- Non-Autos category/global/results work: Bienes Raices, Rentas, Servicios, Restaurantes, Empleos, En Venta, Viajes, Clasificados hub/categoryStandard files.
- Ofertas Locales and coming-soon work.
- Docs/workspace audit files outside Autos.

AUTOS FILES CURRENTLY DIRTY AT GATE START:
- `app/(site)/clasificados/autos/components/public/AutosPublicResultsShell.tsx` from prior Autos landing/results cross-nav work.

STAGED FILES:
- None.

## Files Inspected

- Privado flow: `/publicar/autos/privado`, `/publicar/autos/privado/confirm`, `AutosPrivadoApplication`, `useAutoPrivadoDraft`, `AutosPrivadoPublishConfirm`.
- Negocios flow: `/publicar/autos/negocios`, `/publicar/autos/negocios/confirm`, `AutosNegociosApplication`, `useAutoDealerDraft`, `AutosNegociosPublishConfirm`.
- Shared confirm/success/API: `AutosPublishConfirmCore`, `/api/clasificados/autos/listings`, `/api/clasificados/autos/listings/[id]`, `/clasificados/autos/pago/exito`.
- Backend truth: `autosClassifiedsListingService`, `autosListingPayloadPersistence`, public listings/detail APIs, dashboard/admin autos routes, analytics helpers.
- SQL/RLS/storage references: `20260409120000_autos_classifieds_listings.sql`, `20260506150000_leonix_ad_id_all_classifieds.sql`, `20260518124700_autos_dealer_inventory_grouping.sql`, Autos draft IDB/session storage helpers.

## Files Changed

- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts`
- `app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx`
- `app/(site)/clasificados/autos/pago/exito/AutosPagoExitoClient.tsx`
- `app/api/clasificados/autos/listings/[id]/route.ts`
- `app/lib/clasificados/autos/AUTOS_FINAL_PRE_QA_SMOKE_PROOF_AUDIT.md`
- `scripts/autos-final-pre-qa-smoke-proof-audit.ts`
- `package.json`

## What We Have vs What Is Left

| Lane | Item | Status | Evidence |
|---|---|---|---|
| Privado | Form route exists | HAVE | `/publicar/autos/privado` |
| Privado | Draft hook/storage exists | HAVE | `useAutoPrivadoDraft`, `autosPrivadoDraftStorage` |
| Privado | Preview route exists | HAVE | `/clasificados/autos/privado/preview` |
| Privado | Volver a editar route works by code path | HAVE | `withAutosEditorResumeFromPreview("/publicar/autos/privado", lang)` |
| Privado | Confirm route exists | HAVE | `/publicar/autos/privado/confirm` |
| Privado | Confirm can load valid draft | HAVE | confirm hydrates via `useAutoPrivadoDraft` and shared core |
| Privado | Confirm cannot hang forever | FIXED | hook catch fallback + shared 15s no-hang timeout/error UI |
| Privado | Create/update listing API exists | HAVE | `/api/clasificados/autos/listings`, `/listings/[id]` |
| Privado | Missing draft error exists | FIXED | empty draft detection renders actionable prepare error |
| Privado | API failure error exists | FIXED | create/update/checkout failures set error UI |
| Privado | Auth/session error exists | HAVE | login-required state and start action session guard |
| Privado | Persist warnings surface | HAVE | confirm renders `persistWarnings` |
| Privado | Success page exists | HAVE | `/clasificados/autos/pago/exito` |
| Privado | Success page shows Leonix ID if listing exists | FIXED | owner GET returns `leonix_ad_id`; success fetches and displays it when available |
| Privado | Public detail route can be generated | HAVE | `autosLiveVehiclePath(id)` |
| Privado | Results route can find listing if active/public | HAVE | public API reads active rows from `autos_classifieds_listings` |
| Privado | Dashboard owner lookup can find listing | HAVE | owner listings API and dashboard Autos section |
| Privado | Admin Autos lookup can find listing | HAVE | dedicated Autos admin queue |
| Privado | Analytics identity uses internal UUID/source truth | HAVE | analytics keys include row UUID and `autos_classifieds_listings:{id}` |
| Privado | Visible CTAs are real or hidden | HAVE | contact card and engagement rows use real hrefs/actions |
| Privado | URL-video-only policy preserved | HAVE | external `videoUrls`; local/Mux stripped before persistence |
| Privado | No dealer modules in Privado | HAVE | Privado contact card only |
| Privado | Stripe deferred and not wired here | HAVE | checkout read only; no Stripe/promo changes |
| Negocios | Form route exists | HAVE | `/publicar/autos/negocios` |
| Negocios | Draft hook/storage exists | HAVE | `useAutoDealerDraft`, `autosNegociosDraftStorage` |
| Negocios | Preview route exists | HAVE | `/clasificados/autos/negocios/preview` |
| Negocios | Volver a editar route works by code path | HAVE | resume/edit href helper |
| Negocios | Confirm route exists | HAVE | `/publicar/autos/negocios/confirm` |
| Negocios | Confirm can load valid draft | HAVE | confirm hydrates via `useAutoDealerDraft` and shared core |
| Negocios | Confirm cannot hang forever | FIXED | hook catch fallback + shared 15s no-hang timeout/error UI |
| Negocios | Create/update listing API exists | HAVE | same Autos listing APIs |
| Negocios | Missing draft error exists | FIXED | empty draft detection renders actionable prepare error |
| Negocios | API failure error exists | FIXED | create/update/checkout failures set error UI |
| Negocios | Auth/session error exists | HAVE | login-required state and start action session guard |
| Negocios | Persist warnings surface | HAVE | confirm renders `persistWarnings` |
| Negocios | Success page exists | HAVE | `/clasificados/autos/pago/exito` |
| Negocios | Success page shows Leonix ID if listing exists | FIXED | owner GET returns `leonix_ad_id`; bundle success already lists IDs |
| Negocios | Public detail route can be generated | HAVE | `autosLiveVehiclePath(id)` |
| Negocios | Results route can find listing if active/public | HAVE | public API reads active rows from `autos_classifieds_listings` |
| Negocios | Dashboard owner lookup can find listing | HAVE | owner listings API and Autos dashboard |
| Negocios | Admin Autos lookup can find listing | HAVE | dedicated Autos admin queue |
| Negocios | Analytics identity uses internal UUID/source truth | HAVE | analytics keys include row UUID and `autos_classifieds_listings:{id}` |
| Negocios | Visible CTAs are real or hidden | HAVE | Dealer Business Hub CTAs are populated/hidden by data |
| Negocios | URL-video-only policy preserved | HAVE | external `videoUrls`; local/Mux stripped before persistence |
| Negocios | Dealer modules preserved | HAVE | Negocios public/detail files untouched |
| Negocios | Stripe deferred and not wired here | HAVE | checkout read only; no Stripe/promo changes |

WHAT IS LEFT:
- LEFT_BLOCKED_AUTH_QA: Chuy still needs one authenticated browser QA pass to prove live session/storage behavior from the real device/browser.
- LOCKED_NOT_IN_SCOPE: Stripe and promo codes remain deferred to the admin Stripe chat.

## Route / Flow Map

### Privado

- Form: `/publicar/autos/privado` -> `AutosPrivadoApplication`.
- Draft hook/storage: `useAutoPrivadoDraft`, `autosPrivadoDraftStorage`, active draft session key namespace.
- Preview: `/clasificados/autos/privado/preview`.
- Return-to-edit: `withAutosEditorResumeFromPreview("/publicar/autos/privado", lang)`.
- Confirm: `/publicar/autos/privado/confirm` -> `AutosPrivadoPublishConfirm` -> `AutosPublishConfirmCore`.
- Create/update API: `POST /api/clasificados/autos/listings`, `PATCH /api/clasificados/autos/listings/[id]`.
- Payment handoff: existing `/api/clasificados/autos/checkout` read-only in this gate.
- Success: `/clasificados/autos/pago/exito`.

### Negocios

- Form: `/publicar/autos/negocios` -> `AutosNegociosApplication`.
- Draft hook/storage: `useAutoDealerDraft`, `autosNegociosDraftStorage`, active draft session key namespace.
- Preview: `/clasificados/autos/negocios/preview`.
- Return-to-edit: `withAutosEditorResumeFromPreview` and Negocios editor return context.
- Confirm: `/publicar/autos/negocios/confirm` -> `AutosNegociosPublishConfirm` -> `AutosPublishConfirmCore`.
- Create/update API: same Autos listing APIs; dealer inventory child rows use `createAutosClassifiedsListingWithInventoryParent`.
- Payment handoff: existing `/api/clasificados/autos/checkout` read-only in this gate.
- Success: `/clasificados/autos/pago/exito`.

### Shared Autos

- Confirm: `AutosPublishConfirmCore`.
- Payload normalization: `normalizeLoadedListing`, `safeNormalizeAutosDraftListing`.
- Persistence sanitizer: `sanitizeAutosListingPayloadForPersistence`.
- Media warnings: `persistWarnings`.
- Video validation: `dedupeAutosVideoUrls` / external `videoUrls`.
- Success client: `AutosPagoExitoClient`.
- Public API: `/api/clasificados/autos/public/listings`, `/public/listings/[id]`.
- Dashboard/admin: owner listing API and dedicated Autos admin queue.
- Analytics: `listing_analytics`, `user_liked_listings`, `recordAutosGlobalAnalytics`.

## Table / Schema / RLS / Storage Audit

SQL REQUIRED: NO

Reason:
- Core table exists in migration: `public.autos_classifieds_listings` with `id`, `owner_user_id`, `lane`, `status`, `lang`, `listing_payload`, Stripe session fields, `published_at`, `created_at`, `updated_at`.
- RLS enabled with owner select and public active select policies; writes are routed through service-role API routes.
- Leonix ID is generated by DB trigger/column in `20260506150000_leonix_ad_id_all_classifieds.sql`.
- Dealer inventory columns/indexes exist in `20260518124700_autos_dealer_inventory_grouping.sql`.
- Photos/local assets use browser draft storage/IndexedDB and JSON payload sanitizer; no storage bucket migration is needed for this no-Stripe smoke gate.
- Analytics reads existing `listing_analytics` and `user_liked_listings` truth; no fake metrics or new tables needed.

RLS/auth assumptions audited:
- Owner create/update is mediated by Bearer auth + service role in Next API.
- Owner read uses `assertAutosListingOwner`.
- Public active read uses active listing service/public API.
- Admin lookup uses service-role admin helper.

Storage/media assumptions audited:
- Draft files may live in session/local storage + IndexedDB until publish.
- Oversized/non-durable data URLs are pruned by sanitizer and surfaced as `persistWarnings`.
- No bucket or SQL change is required in this gate.

## Stripe / Promo Decision

STRIPE DEPENDENCY BLOCKER: NO

Stripe and promo code wiring were intentionally not changed. Existing checkout may return `stripe_not_configured` or `stripe_price_missing`; confirm now shows an actionable error instead of hanging. Payment mode for this gate is `DEFERRED_TO_STRIPE_GATE` unless existing QA bypass env is enabled.

## Root Cause

The stuck confirm root cause was code-side: lane draft hydration and confirm preparation awaited async storage/auth/network work without a catch/finally no-hang guard, and the shared confirm preparing state had no timeout. A rejected or stuck draft/storage/API promise could leave "Preparando tu anuncio..." visible forever.

## Fix Result

- Both draft hooks now catch hydration failures and set `hydrated=true` with an empty draft fallback.
- Shared confirm now detects empty/missing drafts and shows actionable error UI.
- Shared confirm now has a 15s no-hang guard for unhydrated/preparing states.
- Create/update/checkout API failures and request aborts now land in the same actionable error UI.
- Start action handles missing session instead of silently returning.
- Success verification now times out/errors instead of confirming forever.
- Owner listing GET returns `leonix_ad_id`; success displays Leonix/internal IDs when available.

## Public / Results / Dashboard / Admin Parity

Public detail route is generated from internal UUID using `autosLiveVehiclePath(id)`. Results and public detail read active rows from `autos_classifieds_listings`; dashboard owner lookup reads owner rows from `/api/clasificados/autos/listings`; dedicated Autos admin search reads the same paid Autos table. Leonix ID remains display/support identity only.

## Analytics Truth

Autos public/detail/dashboard analytics use real event rows where supported. Source truth keys include internal UUID, Leonix ID, and `autos_classifieds_listings:{id}` for compatibility. No fake messages, leads, saves, or dashboard counts were added.

## URL Video Truth

Autos remains URL-only for launch. External `videoUrls` are persisted; local file/Mux fields are stripped or warned by existing sanitizer/prepare code. This gate introduced no Mux/local upload copy.

## Preservation

Privado remains private-seller only; no dealer Business Hub, dealer inventory, reviews, or financing were added. Negocios dealer modules, inventory, contact/social/map/reviews, and Business Hub were not removed.

## Build Result

PASS — `npm run build` completed with exit code 0 and compiled successfully.

## Exact Remaining Items Before Chuy QA

- Chuy authenticated browser QA is still required for live session/storage proof from the actual browser.
- Stripe and promo codes remain deferred to the admin Stripe chat.

## Manual QA Checklist

1. Open `/publicar/autos/negocios/confirm?lang=es` only if you still have the stuck draft.
2. Confirm it no longer hangs forever.
3. Open `/publicar/autos/privado?lang=es`.
4. Create one Privado QA ad.
5. Preview.
6. Return to edit.
7. Confirm data/images/video URLs stayed.
8. Confirm publish/confirm does not hang.
9. Confirm success or truthful payment-deferred/no-Stripe state.
10. Confirm Leonix ID appears if listing is created.
11. Open public detail if available.
12. Confirm it appears in results if active/public.
13. Confirm it appears in dashboard.
14. Confirm analytics shows real zero/data only, no fake metrics.
15. Confirm CTAs work or are hidden.
16. Confirm no dealer Business Hub/inventory/reviews/financing appear in Privado.
17. Spot-check Negocios confirm still works or errors honestly.

## Requirement Table

| Requirement | HAVE/FIXED/BLOCKED/LOCKED | Evidence |
|---|---|---|
| Privado publish flow inspected | HAVE | Route/component map above. |
| Negocios publish flow inspected | HAVE | Route/component map above. |
| Shared confirm core inspected | HAVE | `AutosPublishConfirmCore`. |
| Required tables/columns audited | HAVE | Migrations listed above. |
| RLS/auth assumptions audited | HAVE | Owner/public policies and service-role API writes. |
| Storage/media assumptions audited | HAVE | Draft IDB/session storage + sanitizer. |
| SQL REQUIRED decision documented | HAVE | SQL REQUIRED: NO. |
| Stripe intentionally not wired | HAVE | No checkout/Stripe code edited. |
| Promo codes intentionally not wired | HAVE | No promo files touched. |
| Stuck confirm root cause identified | FIXED | Async hydration/preparing no catch/timeout. |
| Negocios confirm no longer hangs forever | FIXED | Hook catch + shared timeout/error UI. |
| Privado confirm no longer hangs forever | FIXED | Hook catch + shared timeout/error UI. |
| Missing draft shows actionable error | FIXED | Empty draft detection and prepare error UI. |
| API failure shows actionable error | FIXED | fetch timeout/catch paths. |
| Auth/session failure shows actionable error | HAVE | login-required/session guard. |
| Persist warnings are surfaced | HAVE | `persistWarnings` block. |
| URL-video-only policy preserved | HAVE | external URL sanitizer/stripper. |
| No Mux/local video copy added | HAVE | No forbidden copy added. |
| Success page shows truthful next step | FIXED | timeout/error, live/dashboard/results links. |
| Leonix ID display preserved | FIXED | owner GET returns and success displays `leonix_ad_id`. |
| Internal UUID DB truth preserved | HAVE | UUID routes/API remain source truth. |
| Public detail route can be generated | HAVE | `autosLiveVehiclePath(id)`. |
| Results/dashboard/admin lookup truth checked | HAVE | Shared paid Autos table. |
| Analytics identity truth checked | HAVE | UUID/source table keys. |
| Fake dashboard metrics absent | HAVE | No fake metrics added. |
| Visible CTAs work or are hidden | HAVE | Real href/actions only. |
| Payment deferred/no-Stripe truth preserved | HAVE | Existing checkout errors/QA bypass copy preserved. |
| Negocios preserved | HAVE | Negocios public/detail modules untouched. |
| Privado preserved | HAVE | Privado public/detail modules untouched. |
| No unrelated categories touched | HAVE | This gate touched Autos publish/success/API/audit only. |
| Build passed | HAVE | `npm run build` exit code 0. |
| No files staged | HAVE | No staging commands run. |
| No commit created | HAVE | No commit commands run. |
| No push attempted | HAVE | No push commands run. |

## Final Release Decision

READY TO COMMIT AND PUSH: YES
