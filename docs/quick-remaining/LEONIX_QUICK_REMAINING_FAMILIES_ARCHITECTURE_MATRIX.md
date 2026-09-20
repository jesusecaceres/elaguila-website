# LEONIX QUICK — Remaining Family Coverage: Architecture Matrix

Cold-map of the six lower-priority Leonix families **not yet covered** by Quick Classifieds (Gate 0-5,
Tier-1 Gates 0-10) or Quick Business Core (b66322ba, certified): **Comida Local, Ofertas Locales,
Negocios Locales, Viajes, Iglesias, Recursos**.

Doctrine: this is intake simplification into EXISTING ads / EXISTING Leonix destinations, never a new
simplified-ad product. Each family below was cold-mapped against its real, current architecture — no
family was assumed to be a conventional paid classified ad.

Columns condensed to what actually differs per family; `—` means not applicable to that product.

## 1. Comida Local

| Field | Value |
|---|---|
| PRODUCT TYPE | Owner-locked business profile (food business), monthly subscription |
| PUBLIC ENTRY | `/comida-local` directory + city pages |
| PUBLIC DESTINATION | `app/(site)/clasificados/comida-local/[slug]` detail page |
| CURRENT SUBMISSION ROUTE | `/publicar/comida-local` (Full, ~39-field `ComidaLocalDraft`) |
| AUTH REQUIREMENT | Customer signs in on the existing `/publicar/**` gate (`PublishAuthGateLayout`) |
| OWNER IDENTITY | Customer's own account; `customerType: "food_business"` |
| CANONICAL DRAFT | `ComidaLocalDraft` (`app/lib/clasificados/comida-local/comidaLocalTypes.ts`) |
| VALIDATOR | `validateComidaLocalDraftForFuturePublish` (strict), `...ForPreview` (gentle) |
| PREVIEW | `ComidaLocalPreviewClient` reads `loadComidaLocalDraftFromStorage() ?? createEmptyComidaLocalDraft()` |
| PAYMENT | `comida_local_base_monthly`, $129/mo (`revenuePricingMatrix.ts`) |
| DATABASE | Existing `comida_local` tables via `/api/clasificados/comida-local/publish` |
| MEDIA | Eager client-side upload (`uploadComidaLocalDraftImage` → `/api/.../draft-media-upload`) — publish route's `detectHeavyMedia` rejects `data:`/`blob:`/oversized strings, so no deferred/inline media path exists |
| STAFF ENTRY | New: Quick Applications launchpad "Más Opciones" card |
| CUSTOMER MANAGEMENT | `/dashboard/mis-anuncios?cat=comida-local` (existing) |
| CURRENT QUESTION COUNT | ~39 fields (Full) |
| QUICK_FIT | YES — narrow essential subset (name, food type, city, description, contact, 1+ photo) maps 1:1 onto real draft fields; existing preview/validator/payment/publish untouched |
| RECOMMENDED ACTION | **A. QUICK_INTAKE_BUILT** — `/publicar/comida-local/rapido` (built, this mission) |

## 2. Ofertas Locales

| Field | Value |
|---|---|
| PRODUCT TYPE | Two lanes under one entry: (a) interactive flyer, (b) coupon |
| PUBLIC ENTRY | `/ofertas-locales` |
| CURRENT SUBMISSION ROUTE | `/publicar/ofertas-locales` (single existing form, lane picked inside it) |
| PAYMENT — flyer | `ofertas_locales_flyer_30d`, $399 one-time / 30 days |
| PAYMENT — coupon | `ofertas_locales_coupons_30d` declared $199 in `revenuePricingMatrix.ts`, but `OFERTAS_LOCALES_COUPONS_PRICE_CENTS = 0` in `ofertasLocalesConstants.ts`, and checkout consent copy hardcodes "$399" — **live 3-way pricing inconsistency, pre-existing, unrelated to this mission** (flagged separately, not fixed here) |
| FLYER STRATEGY | Flyer submission runs through **AI review** before publish — this step cannot be shortened or bypassed by a Quick wrapper without changing product behavior |
| COUPON STRATEGY | Coupon lane shares the same form/route as the flyer lane; no standalone short form exists to wrap, and the price is not currently trustworthy enough to surface in a fresh Quick price badge |
| QUICK_FIT | NO — both lanes are already inside one existing paid, AI-reviewed or price-ambiguous flow; wrapping either would either strip the AI review step or amplify a live pricing bug |
| RECOMMENDED ACTION | **C. DIRECT_CANONICAL_LINK** — staff opens `/publicar/ofertas-locales` directly with the customer |

## 3. Negocios Locales

| Field | Value |
|---|---|
| PRODUCT TYPE | Discovery directory by sector — NOT its own submission product |
| PUBLIC ENTRY / DESTINATION | `/negocios-locales` (sector index) |
| CURRENT SUBMISSION ROUTE | None of its own — each sector card links out to its own EXISTING category application (Servicios, Restaurantes, Comida Local, etc., already covered by Quick Business Core or this mission) |
| CANONICAL DRAFT / VALIDATOR / PREVIEW / PAYMENT | None — not a product; no `CategoryRouteAdapter` registered for it (confirmed in `categoryRouteRegistry.ts`, only a plain nav-link entry) |
| QUICK_FIT | NO — building a Quick form here would require inventing a new, generic business-listing table that does not exist and duplicates categories already handled elsewhere |
| RECOMMENDED ACTION | **D. NOT_AN_AD_PRODUCT_NO_QUICK_FORM** — correct staff action is open the directory + copy/share its URL; explicitly must NOT become a generic duplicate business-listing table |

## 4. Viajes

| Field | Value |
|---|---|
| PRODUCT TYPE | Travel agency profile or single trip listing, submitted for team review |
| PUBLIC ENTRY | `/viajes` |
| CURRENT SUBMISSION ROUTE | `/publicar/viajes` (existing) |
| PAYMENT | `viajes_business_monthly` priceCents $399/mo carries `unresolvedOwnerDecision: "Viajes business monthly pricing final lock"` (owner has not finalized pricing); `viajes_affiliate` priceCents 0 |
| LIFECYCLE | No online payment collection today — submissions go into a **team moderation/review queue**, not straight-to-live |
| QUICK_FIT | NO — pricing is explicitly unresolved at the owner level, and the review-queue lifecycle means there is no "instant paid publish" moment for a Quick form to shorten; building one now would either fabricate a price or promise instant publish that doesn't exist |
| RECOMMENDED ACTION | **C. DIRECT_CANONICAL_LINK** — staff opens `/publicar/viajes` directly; Viajes is explicitly NOT forced into classifieds |

## 5. Iglesias

| Field | Value |
|---|---|
| PRODUCT TYPE | Free church directory listing, team-moderated |
| PUBLIC ENTRY | `/iglesias` |
| CURRENT SUBMISSION ROUTE | `/iglesias/registrar` (existing registration form) |
| CANONICAL DRAFT / PREVIEW | Iglesias has its own dedicated CMS/submission architecture — no shared draft/preview/payment abstraction compatible with the certified Quick primitives |
| PAYMENT | None — free |
| QUICK_FIT | NO — Iglesias' submission has no draft/preview hand-off point for a Quick form to write into. Building one would require the Quick form to POST directly to `/api/iglesias/applications`, which violates the certified, verifier-enforced invariant that Quick code never inserts rows / calls `/api/` directly (`verify-quick-business-core-01.ts` §5), even though there is no payment risk here — the invariant is a blanket architectural rule, not scoped only to payment safety |
| RECOMMENDED ACTION | **C. DIRECT_CANONICAL_LINK** — staff opens `/iglesias/registrar` directly; must NOT be forced into generic classifieds, and no fake preview step is invented to route around the invariant |

## 6. Recursos (Recursos Comunitarios)

| Field | Value |
|---|---|
| PRODUCT TYPE | Editorial content directory maintained by the Leonix team |
| PUBLIC ENTRY / DESTINATION | `/recursos-comunitarios` |
| CURRENT SUBMISSION ROUTE | None — there is no user-facing submission/publish product for this family |
| QUICK_FIT | NO — there is nothing to shorten; it is not a create/submit surface at all |
| RECOMMENDED ACTION | **D. NOT_AN_AD_PRODUCT_NO_QUICK_FORM** — if there is no user-submission product, do not build a Quick form; correct staff action is open + copy/share the page URL |

## Final Decision Table (Gate 9)

| Family | Action | Route Quick Hands Off To | Pricing Surfaced | Manage Href |
|---|---|---|---|---|
| Comida Local | A. QUICK_INTAKE_BUILT | `/publicar/comida-local/rapido` → existing preview/publish | `comida_local_base_monthly` ($129/mo) | `/dashboard/mis-anuncios?cat=comida-local` |
| Ofertas Locales | C. DIRECT_CANONICAL_LINK | `/publicar/ofertas-locales` | none (pricing ambiguous, not surfaced) | `/dashboard/ofertas-locales` |
| Negocios Locales | D. NOT_AN_AD_PRODUCT_NO_QUICK_FORM | `/negocios-locales` (content) | — | — |
| Viajes | C. DIRECT_CANONICAL_LINK | `/publicar/viajes` | none (owner pricing unresolved) | `/dashboard/viajes` |
| Iglesias | C. DIRECT_CANONICAL_LINK | `/iglesias/registrar` | none (free) | — |
| Recursos | D. NOT_AN_AD_PRODUCT_NO_QUICK_FORM | `/recursos-comunitarios` (content) | — | — |

No family used **E. BLOCKED_REQUIRES_OWNER_PRODUCT_DECISION** — every family's correct action was
determinable from its existing, real architecture without a new owner product decision (the Ofertas
Locales coupon pricing defect is a pre-existing bug to fix separately, not a blocker to this mission's
classification work: DIRECT_CANONICAL_LINK is correct regardless of which of the three conflicting
numbers is eventually the real one).
