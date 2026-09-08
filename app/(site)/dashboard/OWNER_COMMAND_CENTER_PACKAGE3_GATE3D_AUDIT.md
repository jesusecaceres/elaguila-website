# Owner Command Center — Package 3, Gate 3D Audit

Staged + Campaign Owner Systems Migration — Viajes Negocios / Privado, Ofertas Locales
flyer / coupon, and Ofertas AI scan / review.

## Controlling document

`LEONIX_OWNER_COMMAND_CENTER_SINGLE_SOURCE_CONSTRUCTION_BIBLE.md`

```
CONTROLLING BIBLE READ: YES
ACTIVE GATE: PACKAGE 3 — GATE 3D
SPECIALIZED WORKFLOW DOES NOT MEAN SPECIALIZED PRODUCT IDENTITY: YES
VIAJES MAY RETAIN STAGED-REVIEW SEMANTICS: YES
OFERTAS LOCALES MAY RETAIN CAMPAIGN/AUTHORING SEMANTICS: YES
CATEGORY-SPECIFIC OWNER DASHBOARD GRAMMAR ALLOWED: NO
```

```
WORKTREE: C:\projects\elaguila-website-owner-command-center
BRANCH:   integration/owner-command-center-globalization-2026-08
HEAD:     7cf69d6c8abc970305e6b384322821134e14700d (unchanged)
```

Do-not-touch systems left untouched: Viajes review/moderation backend, Ofertas campaign
state machine, AI provider execution, clip/product backend, Stripe/payment writers,
analytics writers, Community Trust writers, app/admin, Recursos, Business Concierge,
Iglesias, Ad Branding. No migrations.

## VIAJES NEGOCIOS

- **CURRENT OWNER ROUTE:** `/dashboard/viajes`
- **TARGET OWNER ROUTE:** same; Layers A+B+C
- **PARENT ENTITY:** n/a (single staged listing)
- **CHILD ENTITY:** n/a
- **IDENTITY KEY:** `viajes_staged_listings.id`; public `slug`
- **PUBLIC ROUTE:** `/clasificados/viajes/oferta/{slug}` when approved and public
- **RESULTS ROUTE:** `/clasificados/viajes/resultados`
- **EDIT ROUTE:** `/publicar/viajes/negocios?stagedId={id}`
- **PREVIEW:** `/clasificados/viajes/preview/negocios?stagedId={id}`
- **ANALYTICS:** unsupported (no owner metrics strip)
- **REVIEW/LIFECYCLE STATE:** staged vocabulary preserved, not flattened to pause/archive
- **ACTIVITY:** omitted (inquiries not rendered on this owner surface)
- **SPECIALIZED MODULE:** none
- **COMMERCIAL / ENTITLEMENT TRUTH:** Leonix does not sell the trip or process payment here
- **CAPABILITY STATES:** publicView/results supported; preview/edit specialized; analytics/activity unsupported
- **SHARED COMPONENTS:** LeonixDashboardShell, OwnerProductPageFrame, OwnerEntityWorkspace
- **LEGACY UI REMOVED:** desktop table island + mobile island cards
- **RESPONSIVE STATUS:** shared workspace
- **ES/EN STATUS:** bilingual
- **DEFERRED ITEMS:** authenticated pixel QA; owner inquiry feed

## VIAJES PRIVADO

- **CURRENT OWNER ROUTE:** `/dashboard/viajes` (same collection)
- **TARGET OWNER ROUTE:** same Layers A+B+C; lane badge + privado hrefs
- **PARENT ENTITY:** n/a (single staged listing)
- **CHILD ENTITY:** n/a
- **IDENTITY KEY:** `viajes_staged_listings.id`; `lane=private`
- **PUBLIC ROUTE:** `/clasificados/viajes/oferta/{slug}`
- **RESULTS ROUTE:** `/clasificados/viajes/resultados`
- **EDIT ROUTE:** `/publicar/viajes/privado?stagedId={id}`
- **PREVIEW:** `/clasificados/viajes/preview/privado?stagedId={id}`
- **ANALYTICS:** unsupported
- **REVIEW/LIFECYCLE STATE:** same staged vocabulary
- **ACTIVITY:** omitted
- **SPECIALIZED MODULE:** none
- **COMMERCIAL / ENTITLEMENT TRUTH:** same non-payment disclaimer; private lane may be disabled
- **CAPABILITY STATES:** shared `viajes` row; adapter payload differs by lane
- **SHARED COMPONENTS:** same as Negocios
- **LEGACY UI REMOVED:** no Privado-specific dashboard island
- **RESPONSIVE STATUS:** shared workspace
- **ES/EN STATUS:** bilingual
- **DEFERRED ITEMS:** authenticated pixel QA

## OFERTAS FLYER

- **CURRENT OWNER ROUTE:** `/dashboard/ofertas-locales` + `/dashboard/ofertas-locales/[id]`
- **TARGET OWNER ROUTE:** collection A+B+C; detail A+C + specialized children
- **PARENT ENTITY:** campaign `ofertas_locales` row
- **CHILD ENTITY:** n/a (flyer is a lane on the same campaign entity, not a child listing)
- **IDENTITY KEY:** `ofertas_locales.id`; display `leonix_ad_id`
- **PUBLIC ROUTE:** `/clasificados/ofertas-locales` when `publicResultsHref` allowed
- **RESULTS ROUTE:** `/clasificados/ofertas-locales/results`
- **EDIT ROUTE:** `/publicar/ofertas-locales` plus owner PATCH on `[id]`
- **PREVIEW:** publish-time `/publicar/ofertas-locales/preview`; not fabricated on collection
- **ANALYTICS:** real owner detail metrics when not unavailable
- **REVIEW/LIFECYCLE STATE:** parent draft/submitted/pending_review/approved/rejected/archived/expired
- **ACTIVITY:** omitted
- **SPECIALIZED MODULE:** campaign tools + renewal
- **COMMERCIAL / ENTITLEMENT TRUTH:** flyer package `ofertas_locales_flyer_30d` labels already on VM
- **CAPABILITY STATES:** edit/campaign/aiScan specialized; analytics supported; renew specialized
- **SHARED COMPONENTS:** LeonixDashboardShell, OwnerProductPageFrame, OwnerEntityWorkspace
- **LEGACY UI REMOVED:** collection table + gold-gradient publish button
- **RESPONSIVE STATUS:** shared workspace
- **ES/EN STATUS:** bilingual
- **DEFERRED ITEMS:** authenticated pixel QA

## OFERTAS COUPON

- **CURRENT OWNER ROUTE:** same campaign entity as flyer
- **TARGET OWNER ROUTE:** same global grammar; coupon lane badge
- **PARENT ENTITY:** same campaign `ofertas_locales` row as flyer
- **CHILD ENTITY:** n/a (coupon is a lane on the same campaign entity)
- **IDENTITY KEY:** same UUID + leonix_ad_id
- **PUBLIC ROUTE:** same ofertas public path; `/cupones` public surface unchanged
- **RESULTS ROUTE:** `/clasificados/ofertas-locales/results`
- **EDIT ROUTE:** same owner detail + publicar
- **PREVIEW:** same as flyer
- **ANALYTICS:** same real owner metrics path
- **REVIEW/LIFECYCLE STATE:** same parent statuses
- **ACTIVITY:** omitted
- **SPECIALIZED MODULE:** same campaign/AI children
- **COMMERCIAL / ENTITLEMENT TRUTH:** coupon package `ofertas_locales_coupons_30d`
- **CAPABILITY STATES:** same `ofertas-locales` row
- **SHARED COMPONENTS:** same
- **LEGACY UI REMOVED:** no coupon-specific dashboard island
- **RESPONSIVE STATUS:** shared workspace
- **ES/EN STATUS:** bilingual
- **DEFERRED ITEMS:** authenticated pixel QA

## OFERTAS AI SCAN / REVIEW

- **CURRENT OWNER ROUTE:** internals on `/dashboard/ofertas-locales/[id]` and publicar authoring
- **TARGET OWNER ROUTE:** same internals under OwnerEntitySpecializedTools
- **PARENT ENTITY:** campaign `ofertas_locales.id`
- **CHILD ENTITY:** existing scan job / item ids (not a separate owner dashboard route)
- **IDENTITY KEY:** parent offer id + existing scan job/item ids
- **PUBLIC ROUTE:** n/a until existing approval path
- **RESULTS ROUTE:** n/a
- **EDIT ROUTE:** existing item review panel APIs
- **PREVIEW:** existing clip inspector, not rewritten
- **ANALYTICS:** n/a
- **REVIEW/LIFECYCLE STATE:** existing scan/item statuses unchanged
- **ACTIVITY:** n/a
- **SPECIALIZED MODULE:** OfertasLocalesOwnerAiManageSection preserved
- **COMMERCIAL / ENTITLEMENT TRUTH:** AI included on paid packages; not fabricated as free
- **CAPABILITY STATES:** aiScan specialized
- **SHARED COMPONENTS:** gold specialized slot only
- **LEGACY UI REMOVED:** none of the scan internals rewritten
- **RESPONSIVE STATUS:** stacked specialized children
- **ES/EN STATUS:** bilingual existing copy
- **DEFERRED ITEMS:** authenticated pixel QA of live scan jobs

## Viajes review-state map

| Status | Owner label ES | Public | Owner action |
|---|---|---|---|
| draft | Borrador | no | Edit and resubmit |
| submitted | Enviado (en cola) | no | Wait |
| in_review | En revisión | no | Wait |
| changes_requested | Cambios solicitados | no | Edit and resubmit (amber) |
| approved | Aprobado | yes if is_public | Public view; unpublish |
| rejected | Rechazado | no | Edit and resubmit |
| unpublished | Oculto | no | Resubmit |
| expired | Expirado | no | none invented |

Mutation: POST `/api/clasificados/viajes/staged-owner` (`resubmit` / `unpublish`).

## Ofertas campaign-state map

Parent `ofertas_locales.status` (not flattened to a 14-state owner model):

| Status | Public | Primary owner action |
|---|---|---|
| draft | no | Review campaign / edit |
| submitted | no | Wait |
| pending_review | no | Wait / AI review if allowed |
| approved | yes if term active | Public view; renewal if eligible |
| rejected | no | Edit and resubmit |
| archived | no | Contact Leonix |
| expired | no | Renewal if eligible |

Operational next-action copy comes from existing `ownerNextActionEs/En`. TRUE/FALSE machine flags were removed from owner UI.

## AI truth boundary

Scan runs only through `submitOfertaLocalAiScan`. Owner UI does not claim success unless `result.ok`. Provider/backend files were not modified.

## Capability registry reconciliation

| Key | Change | Evidence |
|---|---|---|
| specialized.aiScan field | added | Ofertas AI scan/review is real |
| ofertas-locales.aiScan | specialized | OwnerAiManageSection |
| ofertas-locales.coupons | specialized | same entity, coupon lane |
| viajes.activity | unsupported | owner dashboard does not render inquiries |
