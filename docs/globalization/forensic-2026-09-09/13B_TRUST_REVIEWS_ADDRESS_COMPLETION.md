# 13B — TRUST / REVIEWS / ADDRESS COMPLETION
### Completes `13_BUSINESS_HUB_CONNECTION_TRUST_ADDRESS_AUDIT.md` Parts C and D, and finishes Part B (G16)

**Source-of-truth ref: `origin/main` = `a0a4783971b42ea1d71ab2602d4720d0d590baf8`** (verified at the
start of this batch and re-verified immediately before writing). Sealed September branch =
`e3956df8`. The primary working tree (`d09d979c`) is **112 commits stale and was not used as
evidence.** Every finding was read via `git grep -n … origin/main --` / `git show origin/main:<path>`.

Systems closed here: **G20** Community Trust · **G21** Google/Yelp · **G22** Trust Admin ·
**G23** Address Verifier · **G24** Location Privacy/Directions · **G16** CTA completion.

> **RULE APPLIED THROUGHOUT: a global engine existing is NOT category adoption.** ENGINE and ADOPTION
> are reported as separate columns.

---

# PART C-1 — COMMUNITY TRUST (G20)

## C1.1 HEADLINE — **G20 IS THE HEALTHIEST SYSTEM IN THIS AUDIT**

Unlike every other engine examined in Batches 5–6, the Leonix Community Trust engine is **built,
wired, mounted on the public page, persisted, guarded, and instrumented for all 5 registered
categories.** The prior audit's pessimism was unwarranted here. **G20 public mount: 5/5 TRUE.**

## C1.2 ENGINE — `app/lib/leonixCommunityTrust/` (6 files, `origin/main`)

| File | Exported symbols (line) |
|---|---|
| `leonixEndorsementRegistry.ts` | `LeonixEndorsementCategory:19` · `LeonixEndorsementDefinition:26` · `LEONIX_ENDORSEMENT_REGISTRY:42` · `getLeonixEndorsementDefinitions:85` · `isValidLeonixEndorsementKey:100` · `isLeonixEndorsementCategory:105` · `LeonixEndorsementTargetType:109` · `leonixEndorsementTargetTypeForCategory:120` · `isLeonixEndorsementCategoryLive:145` |
| `leonixEndorsementServer.ts` | `LeonixEndorsementSummaryEntry:24` · `getLeonixEndorsementSummary:34` · `LeonixEndorsementToggleResult:58` · `toggleLeonixEndorsementVote:77` |
| `leonixEndorsementClient.ts` | `hasLeonixEndorsementSession:17` · `LeonixEndorsementSummaryEntry:21` · `fetchLeonixEndorsementSummary:29` · `LeonixEndorsementToggleClientResult:46` · `toggleLeonixEndorsementVoteClient:50` |
| `leonixEndorsementAnalytics.ts` | `trackLeonixEndorsementToggle:25` |
| `leonixProfessionalIdentityServer.ts` | `BrRentasCommunityTrustCategory:13` · `resolveLeonixProfessionalIdentityId:15` |
| `leonixProfessionalIdentityClient.ts` | `fetchLeonixProfessionalIdentityId:4` |

**Correction to `13` Part C:** `LEONIX_ENDORSEMENT_CATEGORIES` at `leonixEndorsementRegistry.ts:90`
is a **module-private `const`, not an export**. The exported surface is the two type-guards
(`:105`, `:145`). The 5-category list itself is correct.

**Live gate:** `leonixEndorsementRegistry.ts:137-143` — `LEONIX_ENDORSEMENT_CATEGORY_LIVE` is `true`
for **all 5**.

**Renderers (3):**
- `app/components/leonixCommunityTrust/LeonixCommunityTrust.tsx:45` — the real public widget (fetch + toggle + analytics)
- `app/(site)/clasificados/lib/BrRentasCommunityTrustSection.tsx:20` — BR/Rentas wrapper; resolves the durable identity id, then renders the widget at `:54`
- `app/(site)/dashboard/components/OwnerEntityCommunityTrust.tsx:22` — read-only owner display

## C1.3 G20 PER-CATEGORY MATRIX

| Category | ENGINE | **PUBLIC MOUNT** | VOTE PERSIST | OWNER DASH | ADMIN MOD | ANALYTICS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| **servicios** | ✅ | **TRUE** | TRUE | **TRUE** | TRUE | TRUE |
| **restaurantes** | ✅ | **TRUE** | TRUE | **TRUE** | TRUE | TRUE |
| **comida-local** | ✅ | **TRUE** ⚠ | TRUE ⚠ | **FALSE** | TRUE | TRUE |
| **bienes_raices_negocio** | ✅ | **TRUE** ⚠ | TRUE | **FALSE** | TRUE | TRUE |
| **rentas_negocio** | ✅ | **TRUE** ⚠ | TRUE | **FALSE** | TRUE | TRUE |
| *autos · empleos · ofertas · clases · en-venta · busco · mascotas · comunidad · viajes · BR-privado · rentas-privado* | — | **N-A** | — | — | — | — |

**N-A justification:** `leonixEndorsementRegistry.ts:19-23` scopes the registry deliberately to
business-profile lanes. Endorsement of a private-party listing (one car, one apartment, one lost pet)
is not a coherent concept — the target is a transient listing, not a durable business identity. This
is **INTENTIONAL_NA, not a gap.** Confirmed by the DB `target_type` CHECK
(`20260819210000_leonix_endorsement_votes.sql:25`) accepting only the 5 lanes.

### Public-mount import chains (all verified on `origin/main`)

| Category | Chain |
|---|---|
| **servicios** | `clasificados/servicios/[slug]/page.tsx:213` → `ServiciosProfessionalProfileShell.tsx:29,:262` (alt `:220` → `ServiciosProfileView.tsx:23,:209`) → `servicios/components/ServiciosBusinessHubContactCard.tsx:609-616` (`surface="servicios_hub"`). Props real: page `:171 listingSourceId: row.id`, `:173 engagementOwnerUserId: row.owner_user_id` |
| **restaurantes** | `clasificados/restaurantes/[slug]/page.tsx:134` → `RestauranteAdStoryPreview.tsx:16,:253` → `RestaurantContactHub.tsx:35,:517-524` (`surface="restaurantes_hub"`) |
| **comida-local** | `comida-local/[slug]/page.tsx:16,:89` → `ComidaLocalPublicDetailClient.tsx:12,:43-48` (`surface="comida_local_detail"`) — mounted as a **sibling** of `ComidaLocalDetailShell`, not inside it |
| **BR negocio** | `clasificados/anuncio/[id]/page.tsx:1473` → `BienesRaicesNegocioLiveDetailShell.tsx:20,:473` → `AgenteIndividualResidencialPreviewPage.tsx:47,:796` → `BrAgenteResContactSidebar.tsx:47,:483-489` (`surface="br_negocio_contact_sidebar"`) |
| **rentas negocio** | `clasificados/anuncio/[id]/page.tsx:66,:2189` → `RentasNegocioDesktopBusinessRail.tsx:15,:265-271` (`surface="rentas_negocio_business_rail"`). Second live surface: `EnVentaAnuncioLayout.tsx:49,:981` |

⚠ **Mount caveats.** BR/Rentas gate hardest: `BrRentasCommunityTrustSection.tsx:51` returns `null`
until an async `fetchLeonixProfessionalIdentityId` round-trip resolves; if
`/api/leonix-professional-identity` returns `not_yet_live` (503, `route.ts:35`) or `ownerId` is null
(`:39-40`), **nothing paints**. Rentas is additionally lane-gated at `anuncio/[id]/page.tsx:2188`
(`category === "rentas" && isBusiness && rentasNegocioDisplay`) — Rentas Privado correctly gets
nothing.

## C1.4 VOTE PERSISTENCE — TRUE, and correctly guarded

- **Write:** `app/api/leonix-endorsements/route.ts:36` `POST`; auth mandatory (`:37-40`, 401 without bearer) → `leonixEndorsementServer.ts:77` → RPC `toggle_leonix_endorsement_vote` (`:95`). Client: `leonixEndorsementClient.ts:59`.
- **Read:** same file `:16` `GET` (public; bearer optional, only for `userVoted`).
- **Table:** `public.leonix_endorsement_votes` — `supabase/migrations/20260819210000_leonix_endorsement_votes.sql:18-36`. RLS enabled with **zero policies** (`:55`) → service-role only. Correct.
- **One-vote-per-user: TRUE** — `leonix_endorsement_votes_dedupe_uidx` UNIQUE `(user_id, target_type, target_id, endorsement_key)` at `:44-45`, re-enforced by `ON CONFLICT … DO NOTHING` at `:116`. Toggle is atomic DELETE-then-INSERT (`:106-117`).
- **Target-existence guard:** RPC `:94-104` raises `leonix_endorsement_target_not_found` → mapped to `invalid_target` at `leonixEndorsementServer.ts:108-110`.
- **Category widening:** `20260826120000_…_comida_local.sql`; `20260827180000_leonix_professional_identities_br_rentas_community_trust.sql:30,:41,:46`; `20260827190000_…_reconcile.sql:15-35,:59`.

### 🟠 P1 — GAP-060 · COMIDA LOCAL'S SELF-VOTE BLOCK IS DEAD

`leonixEndorsementServer.ts:67-69` (`isSelfVote`) + `:91-93` → 403 at `route.ts:74-75` is
**best-effort: it depends entirely on the caller supplying `ownerUserId`.**
`ComidaLocalPublicDetailClient.tsx:43-48` **omits the prop.** A Comida Local owner can therefore
endorse their own listing, inflating their own trust score.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE CATEGORY: **Restaurantes / Servicios** ·
REFERENCE PATH: `RestaurantContactHub.tsx:521`, `ServiciosBusinessHubContactCard.tsx:614` ·
TARGET PATH: `ComidaLocalPublicDetailClient.tsx:43-48` ·
DIFFERENCE: one prop, already available on the page · **ACTION: FIX REGRESSION.**

### 🟠 P1 — GAP-061 · 3 OF 5 TRUST CATEGORIES HAVE NO OWNER-FACING SURFACE

Servicios (`dashboard/servicios/page.tsx:336,:441-443,:501-504`) and Restaurantes
(`dashboard/restaurantes/page.tsx:235,:494-497,:526-529`) fetch and render endorsement counts through
`OwnerEntityWorkspace.tsx:99-104` → `OwnerEntityCommunityTrust.tsx:22`.
**Comida Local, BR Negocio and Rentas Negocio have no dashboard route at all.**

```
git ls-tree -d --name-only "origin/main:app/(site)/dashboard/"
→ analiticas, analytics, borradores, business-tools, busquedas-guardadas, components, drafts,
  empleos, guardados, lib, mensajes, messages, mis-anuncios, notificaciones, notifications,
  ofertas-locales, perfil, restaurantes, seguridad, servicios, viajes, vistos-recientes
→ NO comida-local, NO bienes-raices, NO rentas
```
```
git grep -n "leonix-endorsements|LeonixCommunityTrust|communityTrust" origin/main -- \
  'app/(site)/dashboard/mis-anuncios/' 'app/(site)/dashboard/analiticas/' \
  'app/(site)/dashboard/analytics/' 'app/(site)/dashboard/business-tools/'
→ ZERO HITS (exit 1)
```
Codified: `app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts:85` defaults
`communityTrust: "unsupported"`; only `:142` (servicios) and `:157` (restaurantes) set `"supported"`.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: `dashboard/servicios/page.tsx:336,:441,:501` (labelled
"Gate 3A reference implementation #1" at registry `:140`) · **ACTION: ADOPT EXISTING.**

### 🟡 P2 — GAP-062 · Stale comments claim BR/Rentas trust is not live
`BrRentasCommunityTrustSection.tsx:10-12` and `BrAgenteResContactSidebar.tsx:216` say BR/Rentas are
"not yet live", while `leonixEndorsementRegistry.ts:140-141` sets both `true`. **Eighth instance of
prose contradicting code.** **ACTION: FIX REGRESSION (comment only).**

## C1.5 ANALYTICS — TRUE for all 5

`leonixEndorsementAnalytics.ts:25 trackLeonixEndorsementToggle`, called once from
`LeonixCommunityTrust.tsx:114-119`. Events `leonix_endorsement_add` / `leonix_endorsement_remove`
(`:34`), both added to the DB CHECK at `20260819210000_…sql:234-235`. `source_table` is per-category
(`:16-23`); `event_source` carries the `surface` string, so all 5 lanes are distinguishable.
Fire-and-forget; failures swallowed at `:41-43` and never block the vote — correct.

---

# PART C-2 — GOOGLE / YELP (G21)

## C2.1 HEADLINE — **THERE IS NO G21 SYSTEM**

There are **five independent, mutually incompatible implementations** — 4 field-naming conventions,
5 storage shapes, 3 render components — plus **10 categories with nothing at all**, **no eligibility
registry**, and **no database column anywhere**.

## C2.2 G21 PER-CATEGORY MATRIX

1 Input · 2 Draft · 3 Publish · 4 DB col · 5 Public render · 6 Business hub · 7 Dashboard · 8 Edit · 9 Republish · 10 Registry

| Category | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Servicios** | T | T | T | **F** | T ⚠ | T | **F** | T | T | **F** |
| **Restaurantes** | T | T | T | **F** | T | T | **F** | T | T | **F** |
| **BR Negocio** | T | T | T | **F** | T | T | **F** | T | T | **F** |
| **Autos Dealer** | T | T | T | **F** | T | T | **F** | T | T | **F** |
| **Ofertas Locales** | T | T | T | ⚠ ghost | T (raw `<a>`) | T (lite) | **T** ✅ | T | T | **F** |
| **Comida Local** | F | F | F | F | F | F | F | F | F | F |
| **Autos Privado** | F | F | F | F | F | F | F | F | F | F |
| **BR Privado** | F | F | F | F | F | F | F | F | F | F |
| **Rentas Negocio** | F | F | F | F | F | F | F | F | F | F |
| **Rentas Privado** | F | F | F | F | F | F | F | F | F | F |
| **En Venta** | F | F | F | F | F | F | F | F | F | F |
| **Empleos** | F | F | F | F | F | F | F | F | F | F |
| **Clases** | F | F | F | F | F | F | F | F | F | F |
| **Viajes** | F | F | F | F | F | F | F | F | F | F |
| **Mascotas / Comunidad** | F | F | F | F | F | F | F | F | F | F |

**Score: 5 of 15 categories have any G21 at all. The public half is TRUE for 5; the dashboard half is
TRUE for exactly 1 — and that 1 bypasses the shared component entirely.**

## C2.3 Stage 10 — ELIGIBILITY REGISTRY: **FALSE globally**

```
git grep -rniE "reviewEligib|googleEligib|yelpEligib|REVIEW_LINK_CATEGOR|externalReviewCategor|CATEGORIES_WITH_REVIEW|reviewLinksEnabled|supportsReviews" origin/main -- 'app/*' 'lib/*' | grep -v "\.md:"
→ only clasificados/config/categorySchema.ts:64,:66 (previewEligible / proPreviewEligible — the
  free/pro preview gate, semantically unrelated)
```
**PROVEN REFERENCE EXISTS: NO.** The nearest abstraction,
`sharedConnectionHubContactModel.ts:81 buildSharedConnectionHubContact` (handles `googleReviewUrl` at
`:104`, `yelpReviewUrl` at `:112`), has **zero callers** — confirming `13` GAP-015 from a second
angle. **ACTION: NET NEW** (or OWNER_POLICY_DECISION on whether a registry is wanted at all).

## C2.4 Stage 4 — DB COLUMN: **FALSE globally**

```
git grep -rn "google_review" origin/main -- '*.sql'   → (no output)
git grep -rn "social_links"  origin/main -- '*.sql'   → (no output)
```
All five implementations smuggle URLs through category-private JSONB: `profile_json` (Servicios,
`20260402160000_servicios_public_listings.sql:9`), `listing_json` (Restaurantes,
`20260408120000_…:4`), `listing_payload` (Autos, `20260409120000_…:12`), `listings.business_meta`
**as a JSON string** (BR Negocio), `metadata.socialLinks` (Ofertas). **No cross-category query, no
validation, no constraint is possible.**

The only SQL naming these platforms belongs to the *separate* Business Identity Onboarding product,
never joined to listings: `20260717120000_business_identity_global_expansion.sql:113`
(`business_digital_profiles.platform` CHECK includes `google_business`, `yelp`) and
`20260718120000_business_identity_contact_foundation_v3.sql:60,:79`.

### 🔴 P1 — GAP-063 · GHOST COLUMN `google_review_url` (Ofertas Locales)

`ofertasLocalesProductionRowAdapter.ts:73` **writes** `google_review_url`;
`ofertasLocalesOwnerHelpers.ts:341` **reads** `row.google_review_url`;
`ofertasLocalesOwnerUpdateMapper.ts:243` writes it again — and
`git grep -rn "google_review" origin/main -- '*.sql'` returns **nothing across all migrations.**
Either production schema has drifted from the migration history (undeclared column applied
out-of-band) or every write silently fails. **Both are serious.**
**PROVEN REFERENCE EXISTS: N/A** · **ACTION: OWNER_POLICY_DECISION + LIVE DB VERIFICATION** — this
cannot be adjudicated from source. **See Evidence Gaps.**

## C2.5 The five implementations (condensed evidence)

1. **SERVICIOS** — input `ClasificadosServiciosApplication.tsx:1697,:1698,:1681-1689` (validated `:713-715`) · draft `defaultClasificadosServiciosState.ts:117-119`, rehydrate `clasificadosServiciosApplicationNormalize.ts:496-498` · publish `buildServiciosPublishPayload.ts:134-136`, envelope `mapClasificadosServiciosApplicationToServiciosDraft.ts:332-342` · public `servicios/[slug]/page.tsx:106` → `resolveServiciosProfile.ts:144-147` → `mapServiciosProfileToBusinessHubContact.ts:65,:73` → `ServiciosBusinessHubContactCard.tsx:635-642` (shared button) · edit `serviciosPublishedToApplicationDraft.ts:426-428`.
   ⚠ **Structurally fragile:** three names for one field across the boundary — `reviewLinks.googleReviewsUrl` written at `mapServiciosApplicationDraftToBusinessProfile.ts:181`, read at `resolveServiciosProfile.ts:144` and re-keyed to `rev.google` (`:145`), with the resolved type declaring only `google`/`yelp` (`serviciosBusinessProfile.ts:403-406`) while the draft/profile types use the `*Url` suffix (`serviciosApplicationDraft.ts:83-85,:204-210`). The resolver *does* translate correctly, so it likely renders today — but any consumer bypassing `resolveServiciosProfile` gets `undefined`. **Marked ⚠, not FALSE.**
2. **RESTAURANTES** — cleanest chain; singular `googleReviewUrl`. Input `RestauranteApplicationClient.tsx:1675-1677,:1684-1686` · draft `createEmptyRestauranteDraft.ts:142-143`, `useRestauranteDraft.ts:65-66` · publish `buildRestaurantePublishPayload.ts:181-182` · public `restaurantes/[slug]/page.tsx:57` → `buildRestaurantContactHub.ts:302-321` → `RestaurantContactHub.tsx:535-558` (`:543` maps `"google-reviews"→"google"`) · edit `dashboard/restaurantes/page.tsx:287-296` · republish `api/…/restaurantes/publish/route.ts:326,:348`.
3. **BR NEGOCIO** — input `sections/steps04-09.tsx:894,:897,:900` · draft `bienesRaicesNegocioFormState.ts:670-672`, merge-preserve `:854-858` · publish `mapAgenteResidencialFormStateToNegocioForPublish.ts:361-363` → `leonixNegocioBusinessMetaFromFormState.ts:139-143` → `leonixPublishRealEstateFromDraftState.ts:395,:544` · public `anuncio/[id]/page.tsx:1473` → `BienesRaicesNegocioLiveDetailShell.tsx:275-277` → `AgenteIndividualResidencialPreviewPage.tsx:796` → `BrAgenteResContactSidebar.tsx:465,:472` (shared button; gate `:459`).
   Redundant second path: `anuncio/[id]/page.tsx:758-766` `pushMetaLink` renders the same three URLs as plain "useful links", hard-gated at `:750` to `category === "bienes-raices" && sellerType === "business"` — **which is precisely why Rentas and En Venta get nothing from the shared detail page even in principle.**
4. **AUTOS DEALER** — input `publicar/autos/negocios/components/AutosNegociosApplication.tsx:550-555,:559-564` (note: `app/(site)/clasificados/publicar/autos/` holds only `page.tsx`; the real form is under `app/(site)/publicar/autos/`) · draft `autoDealerDraftDefaults.ts:125-127,:190-191,:206-208` · publish inside `listing_payload`, type `autoDealerListing.ts:262-266`, inherited to children `autosDealerInventoryAddFlow.ts:105` · public `AutosLiveVehicleClient.tsx:203` → `AutosNegociosDealershipPreviewPage.tsx:313` → `PreviewDealerBusinessStack.tsx:636` → **its own** `AutosNegociosHubReviewLinkButton.tsx:31` · hub mapper `mapAutosDealerToBusinessHubContact.ts:92,:100-105,:110`, presence gate `autoDealerPresence.ts:94-96`.
5. **OFERTAS LOCALES** — input `OfertasLocalesApplicationClient.tsx:1360` (`:907` field union) · draft `createEmptyOfertaLocalDraft.ts:41`, `ofertasLocalesDraftPersistence.ts:230` · publish `ofertasLocalesPublishMapper.ts:130-136` → `metadata.socialLinks.googleReviewUrl`/`.yelpUrl` · public `OfertasLocalesPublicDetailView.tsx:494-513` — **bare `<a href>`, no shared component** (gate `:321-322`) · hub lite `OfertasLocalesBusinessHubLiteCard.tsx:78-79` · **dashboard `dashboard/ofertas-locales/[id]/page.tsx:294-295,:627-628`** · admin `admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx:317`.

## C2.6 The 10 empty categories — absence proof

```
for d in comida-local autos/privado rentas en-venta empleos clases viajes mascotas comunidad; do
  git grep -niE "yelp|googleReview|google_review|googleBusiness" origin/main -- \
    "app/(site)/clasificados/$d/" "app/(site)/publicar/$d/" "app/(site)/clasificados/publicar/$d/" \
    | grep -v "\.md:" | wc -l
done
→ comida-local 0 · autos/privado 0 · rentas 0 · en-venta 0 · empleos 0
→ clases 0 · viajes 0 · mascotas 0 · comunidad 0
```
Directories verified non-empty (so the zeros are real, not path typos): comida-local 6/13,
autos/privado 5/22, rentas 2/129/24, en-venta 1/139/28, empleos 53/106/1, clases 15/11/1,
viajes 22/95/0, comunidad 12/13/1. **Mascotas has no directory at all.**
**BR Privado:** `BienesRaicesPrivadoLiveDetailShell.tsx` contains zero review references — all 100 BR
hits resolve to the `negocio`/`agente-individual` subtrees.

### 🟠 P1 — GAP-064 · RENTAS NEGOCIO IS ONE FIELD-LIST AWAY AND WAS SKIPPED

`leonixNegocioBusinessMetaFromFormState.ts:124` defines
`buildGate12cNegocioMetaOverlayFromRentasNegocio` — **nine lines above** the Google/Yelp block at
`:139-143`. The Rentas overlay carries `negocioSitioWeb` and `negocioBio` but **not** the review URLs;
the Google/Yelp block reads from the BR-Negocio state `s`, whose only caller is
`leonixPublishRealEstateFromDraftState.ts:30`.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE CATEGORY: **BR Negocio** · REFERENCE PATH:
`leonixNegocioBusinessMetaFromFormState.ts:139-143` · TARGET PATH: same file, `:124` overlay ·
DIFFERENCE: three field names in one existing overlay builder · **ACTION: ADOPT EXISTING.**

### Reference dispositions for the remaining FALSEs

| Missing | Reference | Action |
|---|---|---|
| **Comida Local** | **Restaurantes** — closest domain twin (`buildRestaurantContactHub.ts:302-321` + `RestaurantContactHub.tsx:535-558`) | **ADOPT EXISTING** |
| **BR Privado, Autos Privado** | BR Negocio `BrAgenteResContactSidebar.tsx:465,:472` / Autos Dealer `mapAutosDealerToBusinessHubContact.ts:92-105` | **OWNER_POLICY_DECISION** — a private seller is a person, not a business; review links may be incoherent |
| **En Venta, Empleos, Clases, Viajes, Comunidad, Mascotas, Rentas Privado** | **NO domain-appropriate reference.** No stub, dead field or TODO exists in any of them | **OWNER_POLICY_DECISION** — likely correctly N-A |
| **Dashboard for Servicios / Restaurantes / BR Negocio / Autos Dealer** | **Ofertas Locales** — `dashboard/ofertas-locales/[id]/page.tsx:294-295,:627-628`, the only proven-working owner review surface in the repo | **ADOPT EXISTING** |

## C2.7 GAP-032 CONFIRMED FROM THE OTHER SIDE

`13`/`17` GAP-032 established that `OwnerEntityExternalReputation.tsx:12` never renders because
`externalReputation` is passed by zero pages. **This audit confirms it independently by exhaustion:**
the one category that *does* ship an owner-facing Google/Yelp surface (Ofertas Locales) reaches it
through a **completely bespoke path** (`dashboard/ofertas-locales/[id]/page.tsx:294-295,:627-628`)
that never touches `OwnerEntityWorkspace` or `OwnerEntityExternalReputation`. **No category routes
through the dead prop.** GAP-032 stands.

## C2.8 🟠 P1 — GAP-065 · FOUR FIELD-NAME CONVENTIONS FOR ONE CONCEPT

| Convention | Users |
|---|---|
| `googleReviewsUrl` / `yelpReviewsUrl` | Servicios, BR Negocio, Autos Dealer |
| `googleReviewUrl` / `yelpReviewUrl` | Restaurantes, Ofertas Locales (input), the dead shared model |
| `google` / `yelp` | Servicios **resolved** type (`serviciosBusinessProfile.ts:403-406`) |
| `googleReviewUrl` / `yelpUrl` | Ofertas Locales **storage** (`ofertasLocalesPublishMapper.ts:131,:133`) |

**Ofertas Locales alone uses two different conventions on either side of its own publish boundary.**
Ofertas' public view even carries a self-documenting scar at
`OfertasLocalesPublicDetailView.tsx:329` — *"Reviews/Yelp were detected but never rendered"* — a
previously-fixed instance of exactly this bug class.
**ACTION: OWNER_POLICY_DECISION** (normalise on one convention, or accept the forks).

**Three render components for one visual:** `SharedConnectionHubReviewButton.tsx:44` (3 adopters) ·
`AutosNegociosHubReviewLinkButton.tsx:31` (2 adopters, duplicated brand marks `:19-26,:41,:51-56`) ·
raw `<a>` in Ofertas — **plus 2 fully orphaned** (`ServiciosHubReviewLinkButton.tsx:29`,
`RestaurantHubReviewLinkButton.tsx:29`), confirming `13` A.4.

---

# PART C-3 — TRUST ADMIN (G22)

## C3.1 🔴 HEADLINE — G22 IS COMPLETE, CORRECT, AND **HAS NO ENTRY POINT**

The moderation capability is fully built, permission-gated and audit-logged — and **nothing in the
product can call it.** Independently verified:

```
git grep -rn "leonixEndorsementAdminActions|removeLeonixEndorsementVoteAction|inspectLeonixEndorsementAggregateAction" origin/main
→ app/admin/_lib/leonixEndorsementAdminActions.ts:17   (definition)
→ app/admin/_lib/leonixEndorsementAdminActions.ts:47   (definition)
→ scripts/verify-globalization-business-hub-trust-03.ts:53   (a STRING constant, not an import)
```

**Two definition lines and one string literal. Zero importers, zero call sites, repo-wide.** The sole
reference is a verifier that reads the file with `fs.readFileSync` (`ADMIN_ACTIONS_PATH` at `:53`,
`read(...)` at `:69`) — it never imports the module.

```
git grep -rin "endorsement" origin/main -- app/admin/
→ app/admin/(dashboard)/businesses/[businessId]/OpportunityActions.tsx:141  (prose about editorial
   endorsement — unrelated)
→ app/admin/_lib/leonixEndorsementAdminActions.ts  (the file itself)
```
**No admin page, route, component or client under `app/admin/(dashboard)/` renders, imports or
invokes endorsement moderation.**

This is the **fifth** fully-built zero-consumer artifact recorded in this programme, and the first
that is a *security-relevant admin capability* rather than a rendering helper.

## C3.2 G22 CAPABILITY MATRIX

| Capability | T/F | Path:line |
|---|:-:|---|
| Admin **moderation queue UI** | **🔴 FALSE** | — (C3.1 proof) |
| Admin **action** — vote removal | **TRUE** | `app/admin/_lib/leonixEndorsementAdminActions.ts:17` |
| Admin **action** — aggregate inspect | **TRUE** | `…:47` → `rpc("get_leonix_endorsement_summary")` `:50-54` |
| **API route** for admin moderation | **FALSE** | `app/api/leonix-endorsements/route.ts` has only `GET:16` / `POST:36`. No `DELETE`, no `/api/admin/*` trust route |
| **Permission guard** | **TRUE** ⚠ over-broad | `…:18` and `…:48` → `requireLeonixAdminPermission("can_manage_ads")` (`app/admin/_lib/leonixAdminGate.ts`) |
| **Audit logging** | **TRUE** | `…:31-37` `auditAdminWrite("community_endorsement_vote_removed_by_admin", …)` |
| **Verifier coverage** | **TRUE — but shallow (string-match only)** | `scripts/verify-globalization-business-hub-trust-03.ts:271-274` |
| **Abuse / report** for endorsements | **FALSE** | C3.4 |
| User-side vote un-toggle (not admin) | **TRUE** | `leonixEndorsementClient.ts:50,:60` — the only way a vote is removed in production today |

## C3.3 VOTE REVERSAL — what it actually does

`removeLeonixEndorsementVoteAction(voteId, reason?)` (`:17`):
1. `:20-25` reads the row by `id` (`.maybeSingle()`); returns `{ok:false, error:"vote_not_found"}` if absent.
2. `:28` **HARD DELETE** — `supabase.from("leonix_endorsement_votes").delete().eq("id", voteId)` on the service-role client (`getAdminSupabase()`, `:19`). **No soft-delete, no tombstone, no `deleted_at`, no undo.**
3. `:31-37` `auditAdminWrite(…)` with the optional reason.

Counts are **derived, never stored** — header `:9-10`: *"There is no admin path to edit a count
directly; counts are always derived by counting real rows"*, enforced by the verifier at `:273`
(`assert.ok(!/\.update\(\s*\{\s*count/i.test(adminActionsSrc))`). **Deleting the row is therefore the
only reversal primitive, and the design is correct — it is simply not callable.**

### 🟠 P2 — GAP-069 · the verifier is why this passed CI
`scripts/verify-globalization-business-hub-trust-03.ts:271-274` asserts only that the *source text*
contains `"requireLeonixAdminPermission"`, `"auditAdminWrite"` and `".delete()"`, and does not match
`/\.update\(\s*\{\s*count/i`. **It never checks the action is imported or reachable.** A green CI
signal therefore coexists with a completely dead capability. Same false-positive class as the four
verifiers flagged in `13` A.5 and `15` Part E §4. **ACTION: NET NEW** — add an import-graph assertion.

## C3.4 ABUSE HANDLING — **NONE for endorsements**

```
git grep -rn "report" origin/main -- app/lib/leonixCommunityTrust/ app/api/leonix-endorsements/
→ (empty)
```
The repo-wide abuse mechanism is **listing-scoped and structurally cannot reach a vote**: submit via
`app/admin/actions.ts submitListingReportAction` (consumed `anuncio/[id]/page.tsx:47`), inline UI
`LeonixInlineListingReport.tsx`, En Venta variant `submitEnVentaListingReport.ts:78`; admin read
`app/admin/(dashboard)/reportes/page.tsx:57-58`. **`listing_reports` is keyed on `listing_id`
(`reportes/page.tsx:13,:35,:64`) with no polymorphic `target_type`/`target_id`** — a vote row can
never be the subject of a report. The page itself disclaims completeness at `:88`.

**Mitigating design note** (`leonixEndorsementAdminActions.ts:7-9`): endorsements are a fixed
controlled-label registry, never free text, so the abuse surface is genuinely smaller than a comments
system. That justifies **deferring** an abuse queue — it does not justify the action being unreachable.

## C3.5 🟠 P1 — GAP-070 · `can_manage_ads` IS OVER-BROAD FOR TRUST MODERATION

**Registry:** `app/admin/_lib/teamTypes.ts` — union `:19-33` `AdminPermissionKey`, runtime array
`:35-50` `ALL_ADMIN_PERMISSION_KEYS`, stored in `admin_team_members.permissions`
(migration `20260408183000_control_center_extensions.sql`). The **14 keys**:
`can_view_users:20` · `can_edit_users:21` · `can_reset_passwords:22` · **`can_manage_ads:23`** ·
`can_manage_reports:24` · `can_manage_categories:25` · `can_manage_magazine:26` ·
`can_manage_website_content:27` · `can_manage_prayer_wall:28` · `can_view_payments:29` ·
`can_manage_team:30` · `can_view_activity_logs:31` · `can_use_replica_mode:32` ·
`can_manage_recursos:33`.

```
git grep -rn "can_manage_ads" origin/main -- app/
→ app/admin/_lib/leonixAdminGate.ts:18          (doc: "can_manage_ads → deleteListingAction")
→ app/admin/actions.ts:43, :57, :90, :117, :165  (incl. :115 "Hard delete selected rows from public.listings")
→ app/admin/_lib/leonixEndorsementAdminActions.ts:18, :48
```

**🔴 Granting a trust moderator `can_manage_ads` today also grants them hard-delete on
`public.listings` (`app/admin/actions.ts:115-117`)** — a privilege footprint vastly exceeding "remove
one endorsement vote". The role `ads_moderator` (`teamTypes.ts:11`) reads as the intended holder;
nothing in the role set implies community-trust scope.

The reuse was deliberate and documented (`leonixEndorsementAdminActions.ts:4-6`: *"Mirrors
`deleteListingAction`'s exact shape … No new logging/permission system invented"*) — a defensible
anti-sprawl call at the time, but wrong on least-privilege now that the capability is to be surfaced.

**PROVEN REFERENCE EXISTS: YES (adjacent)** · REFERENCE PATH: `teamTypes.ts:24`
**`can_manage_reports`** — already registered, already in `ALL_ADMIN_PERMISSION_KEYS:40`, already
labelled in both team UIs (`team/roster/page.tsx:40`, `team/users/new/page.tsx:33`) ·
TARGET PATH: `leonixEndorsementAdminActions.ts:18,:48` ·
**ACTION: ADOPT EXISTING** (swap to `can_manage_reports`). A dedicated `can_manage_community_trust`
would be **NET NEW** (type + array + 2 label maps + roster/seed migration).

## C3.6 G22 REMEDIATION LEDGER

| FALSE item | PROVEN REF EXISTS | REFERENCE PATH | ACTION |
|---|---|---|---|
| **Admin queue UI** | **YES** | `app/admin/(dashboard)/clasificados/viajes/business-offers/AdminViajesBusinessOffersModeration.tsx:44` + `page.tsx:5,:26` — a working server-page → client-table → reason-field → action pattern in the same admin app; list-read pattern at `reportes/page.tsx:57` | **ADOPT EXISTING** — the actions are done; only the page is missing. **Highest-leverage, lowest-cost fix in this batch.** |
| Admin API route | **YES** | `app/api/leonix-endorsements/route.ts:16,:36` | **ADOPT EXISTING** — or skip entirely: server actions need no route once a page imports them |
| Endorsement abuse/report | **PARTIAL (listing-only)** | `LeonixInlineListingReport.tsx`; `submitEnVentaListingReport.ts:78`; reader `reportes/page.tsx:57` | **NET NEW** — needs a `target_type`/`target_id` migration on `listing_reports` (or a sibling table); the current `listing_id`-only schema cannot express a vote target |
| Verifier reachability check | **NO** | `scripts/verify-globalization-business-hub-trust-03.ts:271-274` *is* the gap | **NET NEW** |

---

# PART D — ADDRESS VERIFIER (G23) + LOCATION PRIVACY / DIRECTIONS (G24)

## D.1 🔴 HEADLINE — GAP-047 IS **CONFIRMED**, AND THE PICTURE IS WORSE THAN RECORDED

**`app/lib/businessAddress/*` has ZERO app importers on `origin/main`. G23 and G24 are therefore
FALSE for every category on production source.** Independently verified three ways below.

**Additionally established here, and NOT previously recorded:** on `origin/main` there is **no
address-verifier React component at all**, **no suggestion API route**, **no provider**, and **no
`show_exact_address` column in any table.** The engine is six `.ts` files and one example.

## D.2 THE ENGINE — `app/lib/businessAddress/` (6 files, **zero `.tsx`**)

| File | Exports |
|---|---|
| `businessAddressContract.ts` | `BusinessAddressVerificationStatus:33` · `BusinessAddress:40` · `DEFAULT_BUSINESS_ADDRESS_COUNTRY:68` |
| `businessAddressDirections.ts` | `buildBusinessDirectionsHref:21` |
| `businessAddressNormalize.ts` | `normalizeCity:35` · `normalizeStateRegion:104` · `normalizePostalCode:119` · `normalizeCountry:148` · `buildFormattedAddress:158` |
| `businessAddressPrivacy.ts` | `BusinessAddressPublicView:19` · `resolveBusinessAddressPublicView:40` |
| `businessAddressProvider.ts` | `BusinessAddressProviderResult:23` · `BusinessAddressProvider:27` · `manualOnlyAddressProvider:39` |
| `examples/comidaLocalAddressMappingExample.ts` | `comidaLocalDraftToBusinessAddressExample:36` · `comidaLocalDraftToPublicViewExample:58` |

- **Canonical React component: DOES NOT EXIST on `origin/main`.** `git grep -n "BusinessAddressVerifiedInput" origin/main` → **zero matches repo-wide**. It is added only by Sept `88d844e1`.
- **Suggestion API route: DOES NOT EXIST.** `git ls-tree -r --name-only origin/main -- app/api/business-address/` → **empty**.
- **Provider: NONE.** `businessAddressProvider.ts:39-45` ships `manualOnlyAddressProvider`, whose `suggest()` unconditionally returns `{ ok:false, reason:"no_provider_configured" }`; header `:4-8` records that no Places/Smarty/USPS SDK exists in `package.json`. `git grep -n "googleAddressProvider|GOOGLE_MAPS_API_KEY" origin/main` → **zero matches**. (The only geocoding on main is unrelated keyless client-side reverse-geocode for "use my location": `AutosGeolocationButton.tsx:47`, `ServiciosUseMyLocationButton.tsx:40`, `empleosReverseGeocode.ts:65` — BigDataCloud.)
- **Normalized state shape** — `businessAddressContract.ts:40-66`: `{ street, unit?, city, region, postalCode, country, formattedAddress?, latitude?, longitude?, verificationStatus, provider?, providerPlaceId?, manualEntry }`, with `verificationStatus: "unverified" | "manual" | "user_confirmed" | "provider_suggested" | "verified"` (`:33-38`).
- **Privacy contract** — `businessAddressPrivacy.ts:40-44`:
  ```ts
  export function resolveBusinessAddressPublicView(input: {
    address: BusinessAddress | null; showExactAddress: boolean; cityOrServiceArea: string;
  }): BusinessAddressPublicView
  ```
  The gate at `:53` is `showExactAddress === true && hasPrivateAddress`; `exactAddressLine` is
  assignable only inside that branch (`:63`). **Correct by construction — and never called.**
- **Directions builder** — `businessAddressDirections.ts:21-27`: returns `null` unless
  `directionsAllowed && showExactAddress && exactAddressLine`. **The only privacy-aware directions
  builder in the repo. Zero callers.**

## D.3 GAP-047 — INDEPENDENT VERIFICATION: **CONFIRMED**

**(1) By path.**
```
git grep -n "lib/businessAddress" origin/main -- app/     → EXIT 1, no output
```
**(2) By alias.** `git show origin/main:tsconfig.json` — aliases are
`@/app/{about,auth,contact,contacto,coupons,cupones,dashboard,home,iglesias,legal,login,magazine,noticias,publicar,servicios,tienda,clasificados,admin}/*` plus catch-all `@/*`.
**No alias shortens `app/lib/businessAddress`** — any import must literally contain that string.

**(3) By bare symbol.** Every exported symbol was grepped across `app/`. Every hit resolves to a file
**inside `app/lib/businessAddress/` itself.** The apparent hits are coincidental substring or
name-collision matches, not adoption:

| Apparent hit | Reality |
|---|---|
| `ComidaLocalDetailShell.tsx:171`, `ComidaLocalApplicationClient.tsx:1273-1281`, `comidaLocalPreviewTypes.ts:56`, `mapComidaLocalDraftToPreviewVm.ts:333` | the identifier **`businessAddressLine`** / `showBusinessAddress` — a bespoke Comida Local plain-text draft field, **not the type** |
| `admin/_lib/promoCodeData.ts:76,:252,:587`, `promoCodeRecentCardMapper.ts:37,:213-214`, `PromoCodeRecentCodesPanel.tsx:346` | `businessAddressLine1` — unrelated promo-code attribution |
| `empleosResultsQuery.ts:89` (+ importers `EmpleosResultsView.tsx:28`, `HeroAndSearch.tsx:23`) | a **separate same-named bespoke `normalizePostalCode`** — name collision |
| `autoDealerDraftDefaults.ts:17`, `rentasLocationNormalize.ts:9` | `normalizeCityField` / `normalizeCityForBrowse` — **different functions** |

**Non-app references (all legitimate, none are adoption):** `scripts/verify-business-address-foundation.ts:10-21`
(the sole real importer — a read-only test script) · `docs/qa/BUSINESS_APPLICATION_FINAL_LIVE_LEDGER.md:201,:316`,
`docs/qa/ledger/00_shared.md:152,:155`, `docs/qa/_gate0_baseline_comida.md:106` — **which already
state this honestly** ("Foundation-only by design", "Own fields, not wired to shared contract") ·
`supabase/` → zero.

> **The most damning single artifact:** the engine ships
> `app/lib/businessAddress/examples/comidaLocalAddressMappingExample.ts` — a worked example of how
> Comida Local *would* adopt it — while Comida Local ships a plain `<input>` bound to a free-text
> `businessAddressLine` at `ComidaLocalApplicationClient.tsx:1276`. The adoption was designed,
> documented, exemplified, and never wired.

**VERDICT: CONFIRMED.** 1 test-script importer · 0 app importers · 0 components · 0 API routes.
This is the **third** fully-built zero-consumer global engine recorded in this programme (with
`buildSharedConnectionHubContact` / GAP-015 and `dashboardRoute` / GAP-034) — and Batch 6 adds a
**fourth**, `MediaUploader.tsx` (`15` GAP-059).

## D.4 THE SEPT COMMITS — **none are on `origin/main`**

```
git merge-base --is-ancestor <c> origin/main
3c23e875 → NO   88d844e1 → NO   68d45c6c → NO   cddc34fa → NO
git branch -a --contains 3c23e875
→ fix/globalization-final-closeout-2026-09  (and its remote) — identical for all four
```

**`3c23e875`** *"adopt G23 address verifier across 5 commercial categories"* — **the 5 categories,
named:**
1. **Restaurantes** — mounted over the plain `addressLine1` input in `RestauranteApplicationClient.tsx`; 3 verification fields added to the hard-coded allowlist in `buildRestaurantePublishPayload.ts`
2. **Comida Local** — mounted over the plain `businessAddressLine` input; fields threaded into `mergeComidaLocalDraftFromStorage()`
3. **Autos Dealer** — mounted over the Street Name input (Street Number left separate)
4. **Bienes Raíces Negocio** — agente-individual application; wired via `mapAgenteResidencialFormStateToNegocioForPublish.ts` + `buildBusinessMetaJsonFromBienesRaicesNegocioState`
5. **Rentas Negocio (+ Rentas Privado)** — shared `RentasAnuncioFormSection.tsx`; three chained merge allowlists fixed

Its own message records a **deferred defect**: *"Restaurantes' `showExactAddress` privacy toggle has
no UI control anywhere"* — **still true on `origin/main`** (D.6 §5).

**`88d844e1`** (8 files) built the engine's missing half: `app/api/business-address/suggest/route.ts`
(+47) · `app/lib/businessAddress/forms/BusinessAddressVerifiedInput.tsx` (+138) ·
`providers/googleAddressProvider.ts` (+136) · `providers/googleAddressProviderConfig.ts` (+30).
Google Geocoding, fails closed without `GOOGLE_MAPS_API_KEY`. (Also G29 En Venta.)
**`68d45c6c`** (12 files) — Servicios privacy contract only.
**`cddc34fa`** (13 files) — Ofertas only, incl. migration `20260901120000_ofertas_locales_address_privacy.sql` (+23) and the `ofertasLocalesPublicOfferHelpers.ts` fix.

### Which categories STILL LACK G23 even on the September branch

Canonical set — `app/lib/listingIdentity/types.ts:21-38` `CanonicalCategoryKey` (**17 keys**, matching
17 adapters at `categoryRouteRegistry.ts:174-1302`).

**Covered by Sept (union of all 4 commits): 8** — restaurantes · comida_local · autos_negocios ·
bienes_raices_negocio · rentas_negocio · rentas_privado · servicios · ofertas_locales *(G24 privacy
only — never the G23 verifier)*.

**🔴 STILL LACK G23 ON SEPT — 9 of 17:** `autos_privado` · `bienes_raices_privado` · `empleos` ·
`en_venta` · `busco` · `clases` · `comunidad` · `mascotas_y_perdidos` · `viajes`.
**Counting Ofertas (privacy but no verifier): 10 of 17 lack the verifier even on Sept.**

## D.5 G23/G24 PER-CATEGORY MATRIX — `origin/main`

Because D.3 proves zero app importers, **all 9 stages are FALSE for all 14 categories.** The proof is
one command, not 126:
```
git grep -n "lib/businessAddress" origin/main -- app/   → EXIT 1, no output
git grep -n "show_exact_address" origin/main -- supabase/  → NO MATCHES (no DB column either)
```

The load-bearing column is therefore **"bespoke fork"** — it distinguishes *no address feature at all*
from *an address feature that bypasses the shared engine*:

| Category | 9 shared-engine stages | Bespoke fork? | Fork path:line | Own privacy gate? |
|---|:-:|:-:|---|:-:|
| **Servicios** | all FALSE | YES | `serviciosApplicationDraft.ts:88` (`physicalStreet`); display `serviciosProfileSanitize.ts:405-426`; maps `:428-450`; `resolveServiciosProfile.ts:75,:84` | 🔴 **NO** |
| **Restaurantes** | all FALSE | YES | `restauranteListingApplicationModel.ts:369`; `createEmptyRestauranteDraft.ts:119-123`; publish `buildRestaurantePublishPayload.ts:120-121,:138`; render `mapRestauranteDraftToShell.ts:474-480`; hub `buildRestaurantContactHub.ts:406-413` | ⚠ partial — `restauranteContactHref.ts:101-106`, **no UI toggle** |
| **Comida Local** | all FALSE | YES | `comidaLocalTypes.ts:199-200`; input `ComidaLocalApplicationClient.tsx:1273-1290`; VM `mapComidaLocalDraftToPreviewVm.ts:291,:333`; render `ComidaLocalDetailShell.tsx:170-171` | ✅ **YES** (`showAddressPublicly`) — **best in repo** |
| **Autos Dealer** | all FALSE | YES | `autoDealerDraftDefaults.ts:112-119`; `autosDealerStructuredAddress.ts:10-118` | N/A (commercial by design) |
| **Autos Privado** | all FALSE | YES (input only) | `AutosPrivadoApplication.tsx:725-728` (`dealerAddress`) | ✅ suppressed at render — `PrivadoContactStrip.tsx:102,:111,:114` |
| **BR Negocio** | all FALSE | YES | `agenteIndividualResidencialFormState.ts:136,:607,:1153-1158`; UI `sections/steps01-03.tsx:483-488`; format `agenteResidencialPreviewFormat.ts:249,:267` | ✅ **YES** (`mostrarDireccionExacta`) |
| **BR Privado** | all FALSE | shares BR Negocio state shape | `brNegocioChildInventoryFormMapping.ts:44,:210` | inherited |
| **Rentas Negocio** | all FALSE | YES | `mapRentasNegocioStateToPreviewVm.ts:161-197`; UI `RentasAnuncioFormSection.tsx:377-385` | ✅ **YES** — detail-pair `Leonix:rent:show_exact_address` (`leonixRentasShowing.ts:9`), read `mapListingRowToRentasPublicListing.ts:330,:340` |
| **Rentas Privado** | all FALSE | shares `RentasAnuncioFormSection.tsx` | same | ✅ same |
| **En Venta** | all FALSE | **NO street-address field at all** (area/meetup only) | `enVentaFreeFormState.ts:59`; `FulfillmentSection.tsx:29`; `buildEnVentaPreviewModel.ts:50` | N/A — privacy by omission |
| **Empleos** | all FALSE | YES | `QuickJobLocationCard.tsx:35,:60-63`; `QuickJobLocationToast.tsx:27,:71-72`; `JobFairInfoSection.tsx:8-9,:51-52` | 🔴 **NO** |
| **Ofertas Locales** | all FALSE | YES | input `OfertasLocalesApplicationClient.tsx:1995-2014`; public `ofertasLocalesPublicOfferHelpers.ts:137,:167` | 🔴 **NO** — known-bad, confirmed |
| **Clases** | all FALSE | YES | `ClasesQuickApplication.tsx:839-846`; publish `clasesPublishPayload.ts:69`; rehydrate `clasesPublishedQuickToDraft.ts:134-135` | 🔴 **NO** |
| **Viajes** | all FALSE | **NO** — `git grep -niE "address\|direccion" origin/main -- ".../viajes/"` → **empty** | — | N/A |

**Uniform FALSE-state disposition (all 9 stages × 14 categories):**

| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **YES** |
| REFERENCE CATEGORY | **Comida Local** (privacy pattern, shipped & tested) + the unmerged Sept branch (full G23 stack) |
| REFERENCE PATH | `mapComidaLocalDraftToPreviewVm.ts:291` · `app/lib/businessAddress/businessAddressPrivacy.ts:40` · Sept: `businessAddress/forms/BusinessAddressVerifiedInput.tsx`, `app/api/business-address/suggest/route.ts`, `providers/googleAddressProvider.ts` |
| **ACTION** | **RECONCILE_MAIN_AND_GLOBALIZATION → then ADOPT EXISTING.** Merging the Sept seal resolves **8 of 17** categories at once. Only the remaining 9 are genuinely NET NEW — and En Venta / Viajes may correctly need nothing. |

**This materially changes GAP-047's recorded disposition.** `17` classified it
`OWNER_POLICY_DECISION` "**not** a simple ADOPT EXISTING, because there is nothing on main to copy
from." That is true of `origin/main` in isolation, but the work **exists, is committed, and is
stranded on `fix/globalization-final-closeout-2026-09`.** The correct classification is
**FIX REGRESSION (unmerged branch)** for 8 categories.

## D.6 G24 LOCATION PRIVACY — `show_exact_address` IS NOT A COLUMN ANYWHERE

```
git grep -n "show_exact_address" origin/main -- supabase/   → NO MATCHES
git grep -n "show_exact_address" origin/main -- app/
→ clasificados/lib/leonixRealEstateListingContract.ts:37  LEONIX_DP_BR_SHOW_EXACT_ADDRESS = "Leonix:br:show_exact_address"
→ clasificados/rentas/lib/leonixRentasShowing.ts:9        RENTAS_DP_SHOW_EXACT_ADDRESS   = "Leonix:rent:show_exact_address"
```
**Refines `13` Part D:** both hits are **detail-pair string labels** stored inside a
`listings.detail_pairs` JSON blob — a key convention, **not a column**. `13`'s statement that "Rentas
honours it in address construction" is correct as to behaviour
(`mapListingRowToRentasPublicListing.ts:330,:340-346`; also
`mapRentasListingLiveToPreviewVm.ts:352`) but the mechanism is JSON, not schema. **No table in any of
the 163 migrations has a `show_exact_address` column.** The migration that would have added the first
one (`20260901120000_ofertas_locales_address_privacy.sql`) is branch-only.

Three categories carry a camelCase in-memory flag never persisted as a column: Restaurantes
(`restauranteListingApplicationModel.ts:369`), BR Negocio (`brNegocioAdditionalInventoryDraft.ts:39`),
Comida Local (`showAddressPublicly`, `comidaLocalTypes.ts:200`).

### 🔴 P0 — GAP-066 · **FOUR CATEGORIES LEAK AN EXACT STREET ADDRESS PUBLICLY WITH NO GATE**
*(GAP-005 recorded one. There are four.)*

1. **Ofertas Locales — CONFIRMED (was GAP-005).** `ofertasLocalesPublicOfferHelpers.ts:137` reads `row.address` unconditionally, `:167` emits it into the public card, `:143-151` builds directions from it; duplicated at `ofertasLocalesPublicSearchHelpers.ts:287`. `git grep -niE "showExact|hideAddress|address_privacy|showAddress" origin/main -- "app/lib/ofertas-locales/" "app/(site)/publicar/ofertas-locales/"` → **empty.** Application copy at `ofertasLocalesApplicationCopy.ts:667` promises *"We will generate Directions from address, city…"* with **no opt-out offered.**
2. **🆕 Clases — NEW, previously unreported.** `app/(site)/publicar/clases/lib/clasesPublishPayload.ts:69` unconditionally appends `Dirección: <addressLine1>` **into the public description body**; round-trips via `clasesPublishedQuickToDraft.ts:134-135`. `git grep -niE "showExact|hideAddress|privacy|approx" origin/main -- "app/(site)/publicar/clases/"` → **empty.** Embedding the address in free text makes it un-gateable later without a data migration. **Clases is a category where a private individual teaches from home.**
3. **🆕 Empleos — NEW.** `QuickJobLocationCard.tsx:60-63` and `QuickJobLocationToast.tsx:71-72` render `addressLine1`/`addressLine2` verbatim; `:28`/`:86` build directions from them. Address grep returns only a geolocation-consent string at `EmpleosUseLocationButton.tsx:71`. **Zero address gate.**
4. **🆕 Servicios — NEW.** `serviciosProfileSanitize.ts:405-426` (`formatPhysicalAddressDisplay`) and `:428-450` (`buildGoogleMapsSearchHrefFromPhysical`) both consume `physicalStreet` with **no boolean gate**. **This is exactly what Sept `68d45c6c` was written to fix — and that fix is not on main.** Servicios is heavily home-based (individual tradespeople).

**PROVEN REFERENCE EXISTS: YES** · REFERENCE CATEGORY: **Comida Local** ·
REFERENCE PATH: `mapComidaLocalDraftToPreviewVm.ts:291` (a real boolean gate, shipped) ·
**ACTION: Ofertas + Servicios = RECONCILE_MAIN_AND_GLOBALIZATION** (`cddc34fa`, `68d45c6c` exist) ·
**Clases + Empleos = NET NEW** (no Sept fix exists for either).

### 🟠 P1 — GAP-067 · RESTAURANTES DEFAULTS TO PUBLIC WITH NO WAY TO OPT OUT

`restauranteContactHref.ts:101-106` *does* gate — but only on
`homeBasedBusiness && showExactAddress === false` or `locationPrivacyMode`. Meanwhile
`createEmptyRestauranteDraft.ts:123` defaults **`showExactAddress: true`**, and
```
git grep -n "showExactAddress" origin/main -- ".../RestauranteApplicationClient.tsx" "app/(site)/publicar/restaurantes/"
→ no UI control
```
**The owner cannot turn it off.** This is precisely the defect `3c23e875`'s own commit message flagged
as deferred — meaning it is **open on both `origin/main` and the September branch.**
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: **BR Negocio** `mostrarDireccionExacta` UI at
`sections/steps01-03.tsx:483-488` · **ACTION: NET NEW** (survives the merge).

**Categories that are safe:** Comida Local (gated), BR Negocio (`mostrarDireccionExacta`), Rentas ×2
(detail-pair gate), Autos Privado (suppressed at `PrivadoContactStrip.tsx:111-114`), En Venta (no
field), Viajes (no field).

## D.7 🟠 P1 — GAP-068 · DIRECTIONS BUILDERS: 1 CANONICAL (UNUSED) vs ~30 FORKS

**Canonical:** `app/lib/businessAddress/businessAddressDirections.ts:21-27` — **the only builder in
the repo that consults a privacy view before emitting a link. Zero callers.**

| Formula | Count | Sites (path:line) |
|---|:-:|---|
| `/maps/search/?api=1&query=` | **~24** | `RestaurantCard.tsx:55` · `QuickJobLocationToast.tsx:86` · `EnVentaAnuncioLayout.tsx:438` · `buildEnVentaPreviewModel.ts:203` · `leonixBrMachineFacetPairsFromFormState.ts:249,:349` · `AgenteIndividualResidencialPreviewPage.tsx:188` · `mapBienesRaicesNegocioStateToPreviewVm.ts:555` · `mapRentasListingLiveToPreviewVm.ts:475,:605` · `rentasPublishFormHelpers.ts:444` · `restauranteContactHref.ts:97` · `restaurantes/lib/urlNormalization.ts:78` · `RestaurantContactHub.tsx:265` · `RestaurantePreviewCard.tsx:64` · `sharedConnectionHubLocationHelpers.ts:24` · `communityContactCtas.ts:13` · `ServiciosActionPanel.tsx:527` · `ServiciosBusinessHubContactCard.tsx:732` · `serviciosProfileSanitize.ts:449` · `autosDealerStructuredAddress.ts:91` · `digitalContactAddress.ts:17` · `ofertasLocalesFormatting.ts:67` · `ofertasLocalesPublicOfferHelpers.ts:148` · `ofertasLocalesPublicSearchHelpers.ts:287` · `ctaLaunchers.ts:74` |
| `/maps/dir/?api=1&destination=` | **7** | `QuickJobLocationCard.tsx:28` · `BuscoQuickAdCanvas.tsx:157` · `CommunityContactCanvas.tsx:82` · `MascotasPerdidosQuickAdCanvas.tsx:162` · `serviciosDirectCta.ts:9` · `app/lib/iglesias/copy.ts:349` · `ofertasLocalesShoppingList.ts:356,:371,:379` |
| `?q=…&output=embed` | **7** | `QuickJobLocationCard.tsx:21` · `sharedConnectionHubLocationHelpers.ts:16` · `BuscoQuickAdCanvas.tsx:155` · `CommunityContactCanvas.tsx:76` · `MascotasPerdidosQuickAdCanvas.tsx:161` · `autosDealerStructuredAddress.ts:84` · `ofertasLocalesPreviewHelpers.ts:243` |

The nearest *live* shared helper is `sharedConnectionHubLocationHelpers.ts:16,:24`, but its own header
(`:4`) admits the formula was derived "independently", and **it carries no privacy check**.
`app/lib/digitalContact/digitalContactAddress.ts:17` is a **second competing shared helper**.
This extends `13` A.4's "7 independent copies of the embed formula" to **~38 directions/embed
builders across three formulas**, of which exactly **one** is privacy-aware and **zero** callers use
it. **ACTION: ADOPT EXISTING** (route all through `buildBusinessDirectionsHref` once G23 lands).

---

# PART B-2 — G16 CTA COMPLETION

**Evidence base:** `10_ANALYTICS_EVENT_COVERAGE.md §4` (lines 96-165) supplies the per-category
phone / sms / whatsapp / email / website / social / directions emitter matrix. **It is taken as given
and NOT rebuilt.** This section fills only the four gaps §4 cannot answer, traced to the rendering
component. Note §4 already records **`rich correo` = F for all 15 categories** — B2.1 explains why
that row is subtler than a flat F.

## B2.1 RICH CORREO — three tiers, and only ONE true composer exists

| Tier | Definition | Canonical path:line |
|---|---|---|
| **(a) bare mailto** | `<a href="mailto:…">` or a CTA sheet that opens one | `app/(site)/clasificados/components/ContactActions.tsx:150-156` |
| **(b) in-app form → API** | name/email/message form, `fetch()` POST, no webmail handoff | `ServiciosLeadInquiryForm.tsx:65` · `ViajesPublicInquiryForm.tsx:32` |
| **(c) true rich composer** | modal, editable body, auth-gated server-persisted send **plus** Gmail / Yahoo / default-mail / copy fallbacks, self-inquiry blocked | `app/(site)/clasificados/lib/LeonixCorreoLeadModal.tsx:105` (mailto `:217`, Gmail `:222`, Yahoo `:227`, `sendLeonix` POST `:249`) |

**Exactly one tier-(c) composer exists repo-wide, wired to 2 of 15 categories:**
```
git grep -n "LeonixCorreoLeadModal" origin/main -- app/
→ app/(site)/clasificados/lib/LeonixCorreoLeadModal.tsx:105              (definition)
→ app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx:19,:1431
→ app/(site)/clasificados/rentas/listing/[id]/RentasListingDetailClient.tsx:14,:220
```

**Caveats even on the best tier:** the subject is a **fixed constant**
(`LeonixCorreoLeadModal.tsx:39` / `:65`) — not owner- or sender-editable — and **no attachment
affordance exists anywhere** (`git grep -in "attach|FormData|input type=\"file\"" origin/main -- .../LeonixCorreoLeadModal.tsx` → empty). So even (c) is "rich body + webmail handoff", not a full composer.
**§4's flat `F` for rich correo is therefore defensible**, but the correct reading is
**2 categories have (c)-minus-attachments, 3 have (b), 10 have only (a) or nothing.**

### 🟠 P1 — GAP-071 · the rich composer is SUPPRESSED on premium Bienes Raíces
`EnVentaAnuncioLayout.tsx:1430` renders it only `{email && !premiumBr ? … }`. **Premium BR listings
routed through this shared layout lose the composer that free listings get** — a paid tier receiving
*less* contact capability than the free tier.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: non-premium En Venta, **same file, same line** ·
**ACTION: FIX REGRESSION.**

### 🟡 P2 — Ofertas Locales has NO email CTA at all — not even tier (a)
```
git grep -n "buildOfertaLocalMailtoHref" origin/main -- app/
→ app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts:216   (definition)
→ app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts:139       (re-export only)
```
**Zero render consumers.** Consistent with §4's `email = F` for OFL. (Ofertas source is PROTECTED —
read-only observation.)

## B2.2 G16 COMPLETION MATRIX — per category, traced to the rendering component

| # | Category | Public render component (path:line) | RICH CORREO | ADD'L WEBSITES | CUSTOM LINKS | SOCIAL PLATFORMS | Social renderer |
|---|---|---|:-:|:-:|:-:|---|---|
| 1 | **Servicios** | `ServiciosBusinessHubContactCard.tsx:648-666` | **(b)** `ServiciosLeadInquiryForm.tsx:13,:65`; mounted `ServiciosProfileView.tsx:281`, `ServiciosProfessionalProfileShell.tsx:345` | **F** | **T** (max 2) `resolveServiciosProfile.ts:151-160` → `mapServiciosProfileToBusinessHubContact.ts:96` → `:684` | 9 | **Engine 1** `serviciosBusinessHubSocialBrand.tsx:24-39,:58-82` |
| 2 | **Restaurantes** | `RestaurantContactHub.tsx:572-587` | **(a)** `mapRestauranteDraftToShell.ts:338`; catering mailto `buildRestaurantContactHub.ts:383` → `RestauranteShellInteractiveCtas.tsx:174` | **T** (max 8) `RestauranteApplicationClient.tsx:1552-1593`, clamp `buildRestaurantePublishPayload.ts:137`, render `buildRestaurantContactHub.ts:274` | **F** | 8 (no pinterest) | **Engine 2** `restaurantContactHubSocialBrand.tsx:15-22,:58-79` |
| 3 | **Comida Local** | `ComidaLocalDetailShell.tsx` + `ComidaLocalContactActions.tsx:54` | **(a)** `:57` | **T** (max 6) `ComidaLocalApplicationClient.tsx:1055-1106` → `ComidaLocalDetailShell.tsx:328` | **F** | 3 | **Engine 5** (style only, no glyphs) `comidaLocalContactStyles.ts:16-24` |
| 4 | **Autos Dealer** | `DealerBusinessStack.tsx:412-429` | **(a)** `mapAutosDealerToBusinessHubContact.ts:80`, sheet `autosCtaSheet.ts:64`, link `AutosDirectContactLink.tsx:64` | **F** ⚠ the "hasta 2 websites" copy at `autosNegociosCopy.ts:453-468` is **customLinks relabelled** | **T** (max 2) `autoDealerListing.ts:268` → `mapAutosDealerToBusinessHubContact.ts:117` → `:363-369` | 9 | **Engine 3** `autosNegociosBusinessHubSocialBrand.tsx:26-41,:60-84` |
| 5 | **Autos Privado** | `PrivadoContactStrip.tsx:41-56` | **(a)** `privadoContactIntent.ts:86` | **F** — deliberate (`:26-28,:120`) | **F** — deliberate (`:108`) | 3 | **Engine 6** inline `PRIVADO_SOCIAL_META:34-36` |
| 6 | **BR Negocio** | `BienesRaicesNegocioLiveDetailShell.tsx:471-473` → `BrAgenteResContactSidebar.tsx:410-411` | **(a)** `:181`, `agenteResidencialPreviewFormat.ts:769` | **T** (max 2 labelled) `…LiveDetailShell.tsx:140,:278`; author `steps04-09.tsx:556-642`; persist `leonixNegocioBusinessMetaFromFormState.ts:135` | **T** — *same 2 slots* (labelled title+url) | 5 (string-sniffed from one `negocioRedes` blob) | **Engine 4-A** `…LiveDetailShell.tsx:133,:153,:270-274`; icons `BrAgenteResContactSidebar.tsx:410` |
| 7 | **BR Privado** | `anuncio/[id]/page.tsx:1495` → `EnVentaAnuncioLayout.tsx:219` | **(c)** `:1431` — **🔴 suppressed when `premiumBr` (`:1430`)**. Preview lane is (a) | **F** (single `website`, `leonixContactChannelsV1.ts:53`) | **F** | 4 | **Engine 7** `leonixContactChannelsV1.ts:157` → `leonixListingContactResolve.ts:42` → `EnVentaAnuncioLayout.tsx:630,:1155-1165` |
| 8 | **Rentas Negocio** | `RentasListingDetailClient.tsx:56` + `RentasNegocioDesktopBusinessRail.tsx:144-160` | **(c)** `:220` → `/api/clasificados/rentas/inquiry` | **F** (single `negocioSitioWeb`, `leonixBusinessLiveDisplay.ts:26`) | **F** for the rail | 4 + generic fallbacks | **Engine 4-B** `negocioRedesSocialLinks.ts:4-38` → `:28` → `:146` — **NO icons, text labels only** |
| 9 | **Rentas Privado** | `RentasListingDetailClient.tsx:56` | **(c)** `:220` | **F** | **F** | 4 | **Engine 7** + merged with 4-B at `mapRentasListingLiveToPreviewVm.ts:623` |
| 10 | **En Venta** | `EnVentaAnuncioLayout.tsx:219` | **(c)** `:1431`, endpoint `LeonixCorreoLeadModal.tsx:118` | **F** (one `website`, `BusinessLinksSection.tsx:45-49`) | **F** (the `other` slot `:86` is a fixed extra social URL) | 4 (+`other`) | **Engine 7** `:630,:1155-1165` |
| 11 | **Empleos** | `QuickJobCTACard.tsx:411` | **(a)** `empleosCtaTracking.ts:77` | **F** | **F** | 3 — ⚠ icons for linkedin/youtube/snapchat/x are **imported but unused** (`:4-5`) | **Engine 8** inline `:411+` |
| 12 | **Ofertas Locales** *(PROTECTED)* | `OfertasLocalesPublicDetailView.tsx` + `OfertasLocalesBusinessHubLiteCard.tsx:16` | **🔴 NONE** — not even (a) | **F** | **F** | 7 buttons (incl. googleBusiness/googleReview/yelp) | **Engine 9** inline text-label `:16,:73-79` |
| 13 | **Clases** | `CommunityQuickAnuncioDetail.tsx:179-195` | **(a)** `ContactActions.tsx:150` | **F** | **T** — 2 labelled (`clsCustom1/2Label/Url`, `:191-194`) + 12 fixed-purpose slots | 8 | **Engine 10** detail-pair `:147-155`, section `:318` |
| 14 | **Viajes** | `ViajesOfferDetailLayout.tsx:496` + `ViajesContactChannelsRow.tsx:17-27` | **(b)** `ViajesPublicInquiryForm.tsx:14,:32`; plus (a) `viajesCtaSheet.ts:17` | **F** | **F** | 4 | **Engine 11** inline switch `:17-27` |
| 15 | **Mascotas / Comunidad** | Mascotas `MascotasPerdidosPublishedDetailPage.tsx`; Comunidad `CommunityQuickAnuncioDetail.tsx` | **(a)** both, `ContactActions.tsx:150` | **F** both — Mascotas **by design** (`mascotasPerdidosShellCopy.ts:15-16` "Sin redes sociales · Sin sitio web") | Mascotas **F**; Comunidad **T** (2 labelled, `:173-176`) | Mascotas **0** (by design); Comunidad 8 | Comunidad **Engine 10** `:147-155` |

## B2.3 🟠 P1 — GAP-072 · **11 SOCIAL LANES, NOT 5** — `13` A.4 CONFIRMED AND UNDERSTATED

`13` A.4 recorded "4 social brand-icon engines … no shared social-icon renderer". **Confirmed, and
the true count is 11 distinct lanes:** 3 real brand-icon engines (Servicios, Restaurantes,
Autos-Negocios) · 1 two-lane string-sniffer (BR `firstSocialFor` + Rentas
`parseNegocioRedesSocialLinks`) · 1 shared *data* resolver with no shared renderer
(`leonixContactChannelsV1`) · **6 one-off inline implementations** (Autos Privado, Empleos, Ofertas,
Clases/Comunidad, Viajes, En Venta).

**The shared type exists; the renderer does not:**
```
git grep -n "SharedConnectionHubSocialPlatform" origin/main -- app/
→ sharedConnectionHubContactTypes.ts:15         (definition — 9 platforms)
→ sharedConnectionHubContactModel.ts:17,:33,:69
git ls-tree -r --name-only origin/main -- app/components/contact/
→ …/renderers/SharedConnectionHubReviewButton.tsx   ← the ONLY renderer, and it draws REVIEWS
→ …/sharedConnectionHubContactModel.ts
→ …/sharedConnectionHubContactTypes.ts
```
`SOCIAL_PLATFORMS` (`sharedConnectionHubContactModel.ts:69-79`) enumerates 9 platforms; only Servicios
and Autos Dealer independently reach all 9. **Third independent confirmation of `13` GAP-015.**

## B2.4 🟠 P1 — GAP-073 · `customLinksRepo.ts` NEVER REACHES A PUBLIC PAGE

```
git grep -rn "customLinksRepo" origin/main
→ app/admin/_lib/businessWorkspaceData.ts:21
→ app/api/dashboard/business/summary/route.ts:6
→ app/lib/business/creativeStudio/researchPacketAssembler.ts:11
→ docs/business-identity-data-dictionary-01.md:97
```
**Zero importers under `app/(site)/`** — confirming `13` A.5's finding about `app/lib/business/**`
from a second angle. The canonical `BusinessCustomLink` store (author UI
`dashboard/business-tools/_components/businessIdentityCopy.ts:323-328`, summary
`dashboard/business-tools/business/[businessId]/page.tsx:36,:268`) is an **admin/dashboard-only silo
that never reaches any public clasificados detail page**, while **five categories each hand-rolled
their own 2-slot version** (Servicios, Autos Dealer, BR Negocio, Clases, Comunidad).

**Proven absence of custom links in four categories:**
```
git grep -in "customLink|extraLink|additionalWebsite" origin/main -- \
  ".../restaurantes/" ".../comida-local/" ".../ofertas-locales/" ".../empleos/" | grep -v "\.md:"
→ empty for customLink/extraLink in all four (only additionalWebsite hits in restaurantes/comida-local)
```

## B2.5 G16 REMEDIATION LEDGER

| Gap | Categories FALSE | PROVEN REF | REFERENCE PATH | ACTION |
|---|---|:-:|---|---|
| **Rich correo (c)** | 11 of 15 | **YES** | **En Venta + Rentas** — `LeonixCorreoLeadModal.tsx:105`, already props-parameterised for reuse (`inquiryApiPath`, `onMessageSentAnalytics`, `:114-118`) and already in a shared `clasificados/lib/` home | **ADOPT EXISTING** — needs one `/api/clasificados/<cat>/inquiry` route per category; **3 of 15 exist** (servicios, rentas, viajes, en-venta) |
| Rich correo — attachments / editable subject | **all 15** | **NO** | — | **NET NEW** |
| Rich correo — premium-BR suppression | BR Privado (premium) | **YES** | same file — `EnVentaAnuncioLayout.tsx:1430` | **FIX REGRESSION** |
| **Additional websites** | 12 of 15 | **YES** | **Restaurantes** (8) `RestauranteApplicationClient.tsx:1552-1593` + `buildRestaurantContactHub.ts:274`; Comida Local (6) | **ADOPT EXISTING** |
| **Custom links** | 10 of 15 | **YES** | **Autos Dealer** — richest (typed, normalized, rendered): `mapAutosDealerToBusinessHubContact.ts:117` → `DealerBusinessStack.tsx:363-369` | **ADOPT EXISTING** — but wiring the *canonical* `customLinksRepo.ts` to `app/(site)/` is **NET NEW plumbing** |
| **Shared social renderer** | **all 15** | **PARTIAL — type YES, renderer NO** | `sharedConnectionHubContactTypes.ts:15` + `sharedConnectionHubContactModel.ts:69` | **NET NEW** renderer (e.g. `renderers/SharedConnectionHubSocialRow.tsx`, beside the existing review button), then **ADOPT EXISTING** per category with `serviciosBusinessHubSocialBrand.tsx` as the icon/style donor |
| Socials at all | Mascotas | n/a — **intentional** (`mascotasPerdidosShellCopy.ts:15-16`) | — | **NO ACTION** |

## B2.6 CARRIED FORWARD FROM `13` PART B — still open on `origin/main`

Sept-only `9ae1a0f2` "stop silently truncating international phone numbers" is **not on `origin/main`**
— international phone numbers are truncated in production. Related Sept-only WhatsApp
international-digit fixes: `0e2f9b17`, `5e6303d2`. **ACTION: RECONCILE_MAIN_AND_GLOBALIZATION.**

---

# PART E — EVIDENCE GAPS (this report)

1. **🔴 The Ofertas `google_review_url` ghost column (GAP-063) cannot be adjudicated from source.**
   Code writes and reads a column declared in none of the 163 migrations. Resolving it requires
   inspecting the live schema (`information_schema.columns`). Until then it is either silent
   write-failure or undocumented schema drift — **both P1.**
2. **G20 BR/Rentas paint-time behaviour is runtime-dependent.** `BrRentasCommunityTrustSection.tsx:51`
   returns `null` until an async identity fetch resolves; whether
   `/api/leonix-professional-identity` returns `not_yet_live` (503) in production is not determinable
   from source. **Mounted = proven; painted = unproven.**
3. **Servicios G21 render (⚠ in C2.2) was traced statically, not executed.** The
   `googleReviewsUrl → rev.google` translation at `resolveServiciosProfile.ts:144-147` appears correct
   in isolation, so it likely renders today. The ⚠ marks **structural fragility** (three names for one
   field across one boundary), **not a confirmed break.** A runtime check on a live Servicios listing
   with a Google URL set would settle it definitively.
4. **The four September commits were read as diffs, not applied and executed.** Category lists in D.4
   come from the commit messages plus the touched file paths.
5. **`13` A.7's open control-flow question is still open** — whether the `bienesBusinessMetaLinks`
   block in the ~2600-line `anuncio/[id]/page.tsx` monolith is truly dead was not re-verified here.
   It is relevant to C2.5 §3 (the redundant BR "useful links" path at `:758-766`).
6. **No claim in this report rests on the stale primary working tree.**
