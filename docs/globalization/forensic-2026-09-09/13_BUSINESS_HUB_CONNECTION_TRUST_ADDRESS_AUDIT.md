# 13 — BUSINESS HUB / CONNECTION HUB / TRUST / REVIEWS / ADDRESS
Systems: G30 Business Hub · G16 Connection Hub/CTA · G20 Community Trust · G21 Google/Yelp ·
G22 Trust Admin · G23 Address Verifier · G24 Location Privacy/Directions.
Ref: `origin/main`. Stream status: **G30 COMPLETE** · G16 partial · **G20–G24 PENDING BATCH 6**
(sections marked below).

---

# PART A — BUSINESS HUB (G30) — **COMPLETE**

## A.1 VERDICT: THE ENGINE WAS NEVER BUILT

The prior September audit's suspicion of "multiple parallel category implementations" is **confirmed
and worse than claimed.** The "Global Business Hub OS" is a **contract plus two leaf primitives**,
not an engine.

`docs/global-business-hub/ADOPTION_PLAYBOOK.md` states it outright:
- `:55-58` — `FullBusinessHubCard.tsx` and `ListingContactCard.tsx` **were not built**.
  Confirmed: `git ls-tree -r origin/main | grep -E "FullBusinessHubCard|ListingContactCard"` → **nothing**.
- `:22-33` — pilot categories (Servicios, Restaurantes, Autos Dealer, Autos Privado, BR Privado,
  BR Negocio) were **all classified B or C — none adopted a shared renderer**.
- `:59-68` "What was actually built" — only 3 shared artifacts:
  `SharedConnectionHubReviewButton.tsx`, `sharedConnectionHubLocationHelpers.ts`, `copyToClipboard()`.

**Sept commit `05761912` "G30 Business Hub final integrity check — resolved to TRUE_SOURCE" is
contradicted by current source. Classified STALE_DOCUMENT** — current source wins per the audit's
source-authority order.

## A.2 THE SHARED LAYER AND ITS CONSUMERS

| File | Exported symbols | App importers |
|---|---|---|
| `app/components/contact/connectionHub/sharedConnectionHubContactTypes.ts` | 13 types incl. `SharedConnectionHubContactViewModel`, `SharedConnectionHubMode`, `SharedConnectionHubLocation`, `SharedConnectionHubHours`, `SharedConnectionHubTrustCue`, `sharedConnectionHubHasVisibleContent` | **ONE type-only import** — `restaurantes/shell/RestaurantContactHub.tsx:34` (`import type { SharedConnectionHubReviewLink }`) + `SharedConnectionHubReviewButton.tsx:4`. `sharedConnectionHubHasVisibleContent`: **0** |
| `app/components/contact/connectionHub/sharedConnectionHubContactModel.ts:81` | **`buildSharedConnectionHubContact`**, `isSafeExternalHref` | **ZERO app importers** |
| `app/components/contact/connectionHub/renderers/SharedConnectionHubReviewButton.tsx:44` | `SharedConnectionHubReviewButton` | **3** — the only shared renderer actually adopted |
| `app/(site)/clasificados/shared/constants/sharedConnectionHubLocationHelpers.ts` | `buildSharedConnectionHubMapEmbedSrc:13`, `buildSharedConnectionHubDirectionsHref:20`, `isCoarseLocationLine:28` | only the first is imported (2 sites); the other two: **0** |
| `app/lib/analytics/client/connectionHubCtaDispatch.ts:58` | `dispatchConnectionHubCta` | 3 |
| `app/components/cta/ctaLaunchers.ts` | `copyToClipboard` | 8 |

### 🟠 P1 — GAP-015: THE CENTRAL SHARED MODEL IS TEST-ONLY CODE
```
git grep -n "buildSharedConnectionHubContact|sharedConnectionHubContactModel" origin/main
→ the file itself
→ docs/globalization/package-d/D2_..._CLOSURE.md:40,60
→ scripts/globalizationCurrentPackageDiff.ts:447
→ scripts/verify-global-business-hub-os-01.mjs:45
→ scripts/verify-package-d-d2-global-core-unification.ts:21-23,156,161,189
→ ZERO app/ importers
```
**The one shared model the entire programme was built around is referenced only by documentation and
verifier scripts.** 11 of 13 exported types have zero app consumers. `SharedConnectionHubMode`
(`"full_hub" | "listing_card"`) is a discriminator for renderers that were never built.
`SharedConnectionHubReviewLink.rating`/`.reviewCount` are documented as "reserved for a future gate"
and `SharedConnectionHubReviewButton.tsx:9-15` explicitly never reads them.
`SharedConnectionHubLocation.isApproximate` is never read by any renderer.

**PROVEN REFERENCE EXISTS: NO** — there is no working shared hub to adopt.
**ACTION: OWNER_POLICY_DECISION** — build the shared renderer for real, or formally accept
per-category hubs and archive the orphaned shared layer. **Do not design it during this audit.**

## A.3 PER-CATEGORY ADOPTION — WHAT ACTUALLY RENDERS

| Category | Public detail entry | Business-hub component ACTUALLY rendered | Shared adoption |
|---|---|---|---|
| **Servicios** | `clasificados/servicios/[slug]/page.tsx:213` → `ServiciosProfessionalProfileShell` (template branch) OR `:220` → `ServiciosProfileView` | `app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx` (**757 lines**) | **PARTIAL** — own fork model (`serviciosBusinessHubContactTypes.ts` + `mapServiciosProfileToBusinessHubContact.ts:28`). Shared: review button (`:50,:636`), `copyToClipboard` (`:53,:147`), map embed via re-export (`serviciosBusinessHubMapEmbed.ts:6`) |
| **Restaurantes** | `restaurantes/[slug]/page.tsx:8,:134` → `RestauranteAdStoryPreview.tsx:16,:253` | `restaurantes/shell/RestaurantContactHub.tsx` (**637 lines**) | **PARTIAL** — own model `buildRestaurantContactHub.ts:174`. Shared: review button (`:33,:548`), map embed (`:31,:446,:450`), clipboard (`:32,:100`), one shared *type* (`:34`) |
| **Comida Local** | `comida-local/[slug]/page.tsx:16,:89` → `ComidaLocalPublicDetailClient.tsx:9,:36` → `ComidaLocalDetailShell.tsx:120` | `comida-local/components/ComidaLocalContactActions.tsx:23` (rendered `:178`) | **FULL FORK — zero shared imports** |
| **Autos dealer** | `autos/vehiculo/[id]/page.tsx` → `AutosLiveVehicleClient.tsx:8,:203` → `AutosNegociosDealershipPreviewPage.tsx:22,:313` | **`PreviewDealerBusinessStack.tsx` (793 lines)** — NOT `DealerBusinessStack.tsx` | **FULL FORK — zero shared imports**. Own `AutosNegociosHubReviewLinkButton` (`:636`), own map embed |
| **BR negocio** | `clasificados/anuncio/[id]/page.tsx:54,:1473` → `BienesRaicesNegocioLiveDetailShell.tsx:20,:473` → `AgenteIndividualResidencialPreviewPage.tsx:47,:796` | `publicar/bienes-raices/negocio/agente-individual/preview/BrAgenteResContactSidebar.tsx` (**688 lines**) | **PARTIAL** — shared review button (`:46,:453,:465,:472`), `dispatchConnectionHubCta` (`:45,:237`). No shared model, no shared map helper |
| **Rentas negocio** | `anuncio/[id]/page.tsx:66,:2189` → `RentasNegocioDesktopBusinessRail.tsx:29` | same | **FULL FORK.** Uses `businessListingContract.parseBusinessMeta` + `buildLeonixBusinessLiveDisplay`. **NAMED BLOCKER:** the canonical route `rentas/listing/[id]` renders **no business section at all** |
| **Ofertas Locales** | `ofertas-locales/[id]/page.tsx:56` → `OfertasLocalesPublicDetailView.tsx` | that view — **NOT** `OfertasLocalesBusinessHubLiteCard.tsx` | **ORPHAN + partial.** The named "hub" card has zero callers. Own map-embed formula (`ofertasLocalesPreviewHelpers.ts:243`) |
| **En Venta** | `anuncio/[id]/page.tsx:72,:1495` → `EnVentaAnuncioLayout.tsx:219` | `EnVentaAnuncioLayout.tsx:981` renders **Rentas'** `RentasNegocioDesktopBusinessRail` (imported `:49`) | **FULL FORK, borrowed from Rentas.** A publish-side storefront lane exists with **no corresponding public hub renderer** |
| **Viajes** | `viajes/negocio/[slug]/page.tsx:9,:60` → `ViajesNegocioProfileLayout.tsx:14` → `ViajesNegocioContactBlock.tsx:28` | that block + `ViajesContactChannelsRow.tsx:41` | **FULL FORK, and production-dead** — `page.tsx:42` `if (!viajesAllowCuratedDemoCatalog()) notFound();`. Data source is `viajesNegocioProfileSampleData.ts` |

## A.4 DUPLICATE ENGINES — EXACT COUNTS

**5 parallel contact-model implementations:**
1. `sharedConnectionHubContactTypes.ts` + `sharedConnectionHubContactModel.ts` — **0 consumers of the builder**
2. `app/(site)/servicios/lib/serviciosBusinessHubContactTypes.ts` + `mapServiciosProfileToBusinessHubContact.ts:28`
3. `autos/negocios/lib/autosNegociosBusinessHubContactTypes.ts` + `mapAutosDealerToBusinessHubContact.ts:55`
4. `restaurantes/application/buildRestaurantContactHub.ts:56,:174`
5. `clasificados/config/businessListingContract.ts:14,:73` + `clasificados/lib/leonixBusinessLiveDisplay.ts:17` (BR/Rentas/EnVenta lane)

The shared model's own header (`sharedConnectionHubContactTypes.ts:5-8`) admits it is a re-copy of (2).

**4 review-link buttons:** `SharedConnectionHubReviewButton.tsx:44` (LIVE, 3 adopters) ·
`ServiciosHubReviewLinkButton.tsx:29` (**ORPHAN**) · `RestaurantHubReviewLinkButton.tsx:29`
(**ORPHAN**) · `AutosNegociosHubReviewLinkButton.tsx:31` (LIVE, 2 adopters).
Plus an unrelated 5th in the owner dashboard: `OwnerEntityExternalReputation.tsx:12`.

**4 faux maps:** `ServiciosBusinessHubFauxMap.tsx:12` (LIVE) · `RestaurantContactHubFauxMap.tsx:13`
(LIVE) · `EnVentaLocationFauxMap.tsx:12` (LIVE; its header `:10` names Servicios as the visual
reference — a copy-by-eye fork) · `AutosNegociosBusinessHubFauxMap.tsx:10` (**ORPHAN** — the real
dealer stacks use `AutosNegociosBusinessHubMapPreview.tsx:10`).

**7 independent copies of the Google Maps `output=embed` formula:**
`sharedConnectionHubLocationHelpers.ts:16` (canonical) · `autosDealerStructuredAddress.ts:84` ·
`ofertasLocalesPreviewHelpers.ts:243` · `empleos/components/quickJob/QuickJobLocationCard.tsx:21` ·
`publicar/busco/components/BuscoQuickAdCanvas.tsx:155` ·
`publicar/community/shared/preview/CommunityContactCanvas.tsx:76` ·
`publicar/mascotas-y-perdidos/components/MascotasPerdidosQuickAdCanvas.tsx:161`.
**Only Restaurantes and Servicios route through the shared one.**

**4 social brand-icon engines** (Servicios, Restaurantes, Autos negocios, plus the BR/Rentas/EnVenta
string-parsing lane `negocioRedesSocialLinks.ts`). **No shared social-icon renderer exists**, despite
`SharedConnectionHubSocialPlatform` being defined in the shared types.

**Byte-identical design tokens under two prefixes:**
`restaurantes/shell/restaurantContactHubLeonix.ts` (`RCH_LX`, `RCH_HUB_CARD`, `RCH_CTA_PRIMARY`, …)
vs `servicios/lib/serviciosContactHubLeonix.ts` (`SCH_LX`, `SCH_HUB_CARD`, `SCH_CTA_PRIMARY`, …) —
identical Tailwind strings; each file's header says it is "aligned with" the other.

**Whole-component fork:** `DealerBusinessStack.tsx` (504 lines) vs
`preview/dealershipPreview/PreviewDealerBusinessStack.tsx` (793 lines) — two maintained copies of the
same dealer hub. **The public vehicle detail path renders the `Preview`-prefixed one.**
`DealerBusinessStack.tsx` is reached only via `AutoDealerPreviewPage.tsx:21,:291`, itself imported
only by `AutosNegociosChildInventoryPreviewOverlay.tsx:6` (a publish-flow overlay).

## A.5 ORPHANS — ZERO IMPORTERS (proven by exhaustive grep) · **DO NOT DELETE NOW**
`buildSharedConnectionHubContact` · `sharedConnectionHubHasVisibleContent` ·
`buildSharedConnectionHubDirectionsHref` · `isCoarseLocationLine` · 11 of 13 shared types ·
`ServiciosHubReviewLinkButton` · `RestaurantHubReviewLinkButton` · `AutosNegociosBusinessHubFauxMap` ·
`OfertasLocalesBusinessHubLiteCard` (self-declared ORPHANED at
`docs/globalization/package-d/D3_CATEGORY_ADOPTION_CLOSURE.md:79`) ·
`ListingView` default export (`clasificados/components/ListingView.tsx:136` — all 5 importers are
`import type`; `git grep "<ListingView"` → 0) · `BusinessListingIdentityRail` (transitively — its sole
importer is the dead `ListingView.tsx:9,:498`) · `buildFullPreviewListingData` (`:35`) ·
`RestauranteDetailShell.tsx:121` **plus a committed `RestauranteDetailShell.tsx.backup` file**.

**⚠ 4 verifier scripts assert orphaned component *names* appear in source and now match only comments
or nothing — they are false-positive-prone:** `scripts/verify-servicios-shell-2d.mjs:51` ·
`scripts/restaurantes-polish1-audit.ts:92` · `scripts/restaurantes-r-c1-contact-hub-audit.ts:130` ·
`scripts/autos-a5-qa-01-business-hub-parity-audit.ts:113`.

**Zero-adopter abstraction, separate lane:** `app/admin/_components/executiveHub/businessHubAdapter.ts`
— `searchBusinessHub` / `getBusinessHubByReference` always return `available:false` / `null`
(deliberate inert seam, header `:1-21`). Wired to `ExecutiveHubForm.tsx:12-13` and
`executiveHubActions.ts:27`, so **not orphaned**, but a zero-value namespace collision.

**`app/lib/business/**` (~180 files)** — `repositories/businessesRepo.ts`, `digitalProfilesRepo.ts`,
`customLinksRepo.ts`, `contactsRepo.ts`, `services/finalizeBusinessV3.ts`. A full second "Business"
domain. `git grep -l "lib/business/repositories" origin/main -- "app/(site)/"` → **0 hits**: no public
surface reads it. Entirely dashboard/admin-scoped, sharing zero code with any Business Hub above.

## A.6 CONFLICTING BUSINESS IDENTITY LOGIC — 6 RESOLVERS
1. `clasificados/config/businessListingContract.ts:14-56` — `BUSINESS_META_KEYS` (`negocioNombre`,
   `negocioNombreCorreduria`, `negocioLogoUrl`, `negocioFotoAgenteUrl`), `parseBusinessMeta:73`
2. `clasificados/lib/leonixBusinessLiveDisplay.ts:17-46` — name precedence
   `listing.business_name ?? listing.businessName ?? businessMeta.negocioNombre ?? ""`, then a
   `"Negocio"/"Business"` literal fallback (`:31`). Used by BR/Rentas/EnVenta
3. `clasificados/components/BusinessListingIdentityRail.tsx:38-40` — a **conflicting duplicate**
   fallback chain. Orphaned, but the divergent logic is still in tree
4. `rentas/negocio/mapping/buildRentasNegocioPreviewListingData.ts:87` — a third parallel resolution,
   reachable only via the orphaned `buildFullPreviewListingData.ts:76`
5. `restaurantes/application/buildRestaurantContactHub.ts:57` — independent
6. Servicios — `profile.identity.businessName` via `app/(site)/servicios/lib/resolveServiciosProfile.ts`
Plus two non-clasificados systems claiming the term: `app/lib/listingIdentity/identityBuilders.ts` +
`businessProfileLifecycleAdapter.ts`, and the always-null `businessHubAdapter.ts`.

## A.7 EVIDENCE GAPS (Part A)
- Runtime reachability of `RestauranteAdStoryPreview` vs `RestauranteDetailShell` traced statically only.
- The `ServiciosProfileView` vs `ServiciosProfessionalProfileShell` split is gated at
  `clasificados/servicios/[slug]/page.tsx:212` by `isServiciosProfessionalTemplate(listingTemplate)` —
  which branch dominates in production data is not determinable from source.
- `app/(site)/clasificados/anuncio/[id]/page.tsx` is a ~2600-line monolith carrying BR/Rentas/EnVenta
  dispatch (`:1473`, `:1495`, `:2189`). The playbook (`:32`) asserts its `bienesBusinessMetaLinks`
  block (`:743-768`, `:1723-1737`, `:2619-2621`) is unreachable dead code; **that control-flow claim
  was not independently re-verified.**
- **Path correction for future runs:** `app/(site)/clasificados/servicios/components/ServiciosBusinessHubContactCard.tsx`
  does **not** exist. The real path is `app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx`,
  imported via the `@/app/servicios/...` alias. (`tsconfig.json:25` maps `@/app/clasificados/*` →
  `./app/(site)/clasificados/*`.)

---

# PART B — CONNECTION HUB / CTA (G16) — **PARTIAL**

Canonical CTA dispatcher: `app/lib/analytics/client/connectionHubCtaDispatch.ts:58`
`dispatchConnectionHubCta` — **3 importers only**: `clasificados/anuncio/[id]/page.tsx:38,:2560` ·
`ofertas-locales/OfertasLocalesPublicDetailView.tsx:29,:331` ·
`BrAgenteResContactSidebar.tsx:45,:237`.

Per-category CTA emitter coverage is documented in `10_ANALYTICS_EVENT_COVERAGE.md §4` (phone, sms,
whatsapp, email, website, social, directions rows) — that matrix is the current best evidence for
G16 adoption.

**KNOWN OPEN ITEM (from `11`/`17`):** Sept-only `9ae1a0f2` "stop silently truncating international
phone numbers" is **not in `origin/main`** — international phone numbers are truncated in production.
Related Sept-only WhatsApp international-digit fixes: `0e2f9b17`, `5e6303d2`.

**PENDING BATCH 6:** the full per-category CTA adoption matrix (rich correo, additional websites,
custom links, socials) traced to the rendering component.

---

# PART C — COMMUNITY TRUST (G20) / GOOGLE-YELP (G21) / TRUST ADMIN (G22) — **PENDING BATCH 6**

Established so far:
- Eligible-category registry: `app/lib/leonixCommunityTrust/leonixEndorsementRegistry.ts:90`
  `LEONIX_ENDORSEMENT_CATEGORIES` = **servicios, restaurantes, comida-local, bienes_raices_negocio,
  rentas_negocio** (5). The registry is deliberately scoped to business-profile lanes
  (`:19-23`) — autos, empleos, ofertas, clases, comida-local(non-profile), viajes are
  **INTENTIONAL_NA**.
- Vote storage migration: `supabase/migrations/20260819210000_leonix_endorsement_votes.sql`
  (also raises the `listing_analytics` event CHECK to 33).
- Admin moderation actions: `app/admin/_lib/leonixEndorsementAdminActions.ts:18,:48`, gated by
  `requireLeonixAdminPermission("can_manage_ads")`.
- Google/Yelp owner-dashboard renderer: `app/(site)/dashboard/components/OwnerEntityExternalReputation.tsx:12`.
- Professional-identity verification registry: `app/api/leonix-professional-identity/route.ts:10`
  `CATEGORIES` = bienes_raices_negocio, rentas_negocio (2).
- Sept-only and therefore **absent from production**: `db688c04` "complete business reputation
  adoption — Autos Dealer + Rentas Negocio"; `a1a0aaa9` "reconcile global reputation and trust".

**STILL REQUIRED:** public mount per category, vote persistence trace, per-category TRUE/FALSE for
Trust and Google/Yelp, and the Trust Admin moderation capability matrix.

---

# PART D — ADDRESS VERIFIER (G23) / LOCATION PRIVACY (G24) — **PENDING BATCH 6**

Established so far:
- Sept-only `3c23e875` "adopt G23 address verifier across **5 commercial categories**" and
  `88d844e1` (G23 + G29) are **NOT in `origin/main`** — that adoption is absent from production.
  **The 5 categories are not yet named.**
- Sept-only `cddc34fa` "persist Ofertas address privacy" is absent from main. Proven consequence
  (`17` GAP-005 / `15`): Ofertas emits exact street address + auto-derived Google Maps directions
  **unconditionally** on every public surface —
  `ofertasLocalesPublicOfferHelpers.ts:137,:150-155`, `ofertasLocalesPublicSearchHelpers.ts:280,:286-292`,
  `ofertasLocalesPreviewHelpers.ts:109-113,:231-236`. The fix adds
  `ofertas_locales.show_exact_address` via `supabase/migrations/20260901120000_ofertas_locales_address_privacy.sql`
  (absent from main) and gates all three surfaces through `resolveBusinessAddressPublicView`.
- Sept-only `68d45c6c` "adopt shared address privacy contract (Servicios)" — containment not yet
  re-verified.
- On `origin/main`, `show_exact_address` exists only for other verticals:
  `clasificados/lib/leonixRealEstateListingContract.ts`, `clasificados/rentas/lib/leonixRentasShowing.ts`.
  Rentas honours it in address construction (`mapListingRowToRentasPublicListing.ts:330,:340-346`).
- A verifier script documents the pre-fix state:
  `scripts/verify-business-address-foundation.ts` — *"Ofertas Locales — NOT adopted in this pass …
  no JSONB/metadata column exists"*.
- Worktree `C:\projects\elaguila-website-address-foundation`
  (`feature/global-address-verification-foundation`, `b045763b`) is **fully contained in origin/main**
  — no unintegrated address work there.

**STILL REQUIRED:** canonical component path + symbol, suggestion API route, provider, normalized
address state shape, and the per-category adoption matrix (application → draft → preview → publish →
DB → public → dashboard → edit → admin).
