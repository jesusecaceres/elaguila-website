# LEONIX QUICK CLASSIFIEDS — CATEGORY MATRIX

Cold-read against `origin/main` @ `fd909499` (2026-09-19). One block per in-scope category. Field classes:
`QUICK_REQUIRED` · `QUICK_OPTIONAL` · `FULL_ONLY` · `SYSTEM_DERIVED` · `NOT_APPLICABLE`.
Feasibility: `READY_BY_EXTRACTION` · `NEEDS_THIN_ADAPTER` · `CATEGORY_SPECIFIC_BLOCKER`.

Cross-cutting facts shared by every row live in the Blueprint (§1). Staff-assisted server-side publishing is
**not wired for any classified category** (Servicios only) — every row below therefore reads
"assisted mode: UI-gate only; publish under customer login" and the launchpad offers Copy/Share link + Prepare.

---

## 1. EN VENTA / VARIOS — `en-venta`

| Item | Current truth |
| --- | --- |
| Registry | `EN_VENTA_ADAPTER` `categoryRouteRegistry.ts:~915-990`, `sourceTable: "listings"`, `applicationRoute: /clasificados/publicar/en-venta/pro`, `checkpointRoute: /publicar/en-venta` |
| Checkpoint / hub | `/publicar/en-venta` → `QuickLaneCheckpointClient category="en-venta"` → `getEnVentaCheckpointCard` (`id: en_venta_free`) → CTA `/clasificados/publicar/en-venta/pro` |
| Full application | `app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx` (pro lane; free/storefront lanes exist as siblings) |
| Existing quick-like route | none (pro is the canonical lane) |
| Draft type / store | `EnVentaFreeApplicationState` (`…/en-venta/free/application/schema/enVentaFreeFormState.ts:28`); sessionStorage + IndexedDB via `enVentaPreviewDraft.ts` (`en-venta-preview-draft-pro`) |
| Media | `images: string[]` (data URLs) + `primaryImageIndex`; pro max 12 (`EN_VENTA_PREVIEW_MAX_PHOTOS.pro`), 4 external video URLs; publish tolerates 0 photos |
| Preview | `/clasificados/en-venta/preview?plan=pro` (`EnVentaPreviewPage.tsx`, reads `loadLatestEnVentaPreviewDraftAsync(plan)`) |
| Publish | existing preview → `enVentaPublishFromDraft.ts` (client publisher into `listings`) |
| Table / owner / status | `listings`, `owner_id`, `active`/`sold`/`removed` |
| Public | `/clasificados/anuncio/[id]` (`EnVentaAnuncioLayout`), results `/clasificados/en-venta/...` |
| Admin queue | `/admin/workspace/clasificados/en-venta` |
| Owner path | `/dashboard/mis-anuncios` (`EnVentaListingManageCard`), detail `/dashboard/mis-anuncios/[id]` |
| Auth gate | `PublishAuthGateLayout` via `/clasificados/publicar/layout.tsx` + preview layout |
| Staff-assisted | UI-gate only (assisted cookie); publish under customer login |
| Package / price | `en_venta_free_v1`, 0 ¢, `free`, no duration |
| Checkout / fulfillment | none (free) |
| Activation / expiration | active on publish; visibility refresh window via `republished_at` |
| Edit | generic editor `/dashboard/mis-anuncios/[id]/editar` (`en-venta` lifecycle adapter) |
| Sold / End | `markStatus("sold")` → `listings.status = sold` (detail page `[id]/page.tsx:489`) |
| Renewal / Republish | dashboard "refresh" (`republished_at`, `republish_count`) — same row; no paid renewal |
| Analytics | clasificados analytics (view/share) |
| Preview gate (core blockers) | `collectEnVentaCoreBlockers`: title, rama+itemType+condition, price or `priceIsFree`, location (city/zip/state/country), family-safety, description blockers |
| Renderer conditionals | pro/free lanes omit empty modules (videos, shipping notes, wear/accessories) — preview model built by `buildEnVentaPreviewModel` |

Quick mapping (→ `EnVentaFreeApplicationState`): `title→title` · `rama/itemType/condition→rama,itemType,condition`
(QUICK_REQUIRED, taxonomy from the existing option source) · `price|free→price,priceIsFree` · `description→description`
· `city,zip→city,zip` (state `CA`, country `United States` = SAFE default already used by the app) ·
`photos→images[] (data URLs), primaryImageIndex=0` (QUICK_REQUIRED ≥1 even though publish tolerates 0) ·
`name,phone,email,whatsapp→displayName,phone,email,whatsapp, contactMethod derived` · `seller_kind="individual"`
(SYSTEM_DERIVED lane identity). FULL_ONLY: brand/model/quantity/shipping/meetup notes/videos/Mux slots/wear notes.
Write: `persistEnVentaPreviewHandoffAsync("pro", mergePartial…)`; handoff `/clasificados/en-venta/preview?plan=pro`.
**Feasibility: READY_BY_EXTRACTION.**

---

## 2. RENTAS — private / classified lane — `rentas` (`rentas_privado`)

| Item | Current truth |
| --- | --- |
| Registry | `RENTAS_PRIVADO_ADAPTER` `categoryRouteRegistry.ts:763-800`; `listings`; `applicationRoute: /publicar/rentas/privado` (byte-identical alias of the nested route real traffic uses: `/clasificados/publicar/rentas/privado`); `hubRoute: /clasificados/publicar/rentas`; `previewRoute: /clasificados/rentas/preview/privado`; `publicRoute: /clasificados/rentas/listing/{id}`; `dashboardRoute: /dashboard/mis-anuncios` |
| Checkpoint / hub | `/clasificados/publicar/rentas` → `RentasPublicarHubClient` → `getRentasPrivadoCheckpointCard` (`rentas_privado`, paid, `oneTimePrice("rentas_30d")`, coupon-eligible) → CTA `/clasificados/publicar/rentas/privado` |
| Full application | `…/publicar/rentas/privado/application/RentasPrivadoForm.tsx` (1524 lines, single page, ~9 sections) |
| Existing quick-like route | none |
| Draft type / store | `RentasPrivadoFormState` (v4, `rentasPrivadoFormState.ts:44`); `saveRentasPrivadoDraft` (async; sessionStorage `rentas-privado-draft-v1` + LS fallback + IDB media offload `lx-rentas-privado-draft`) |
| Media | `media.photoDataUrls[]` (JPEG data URLs), `MAX_PHOTOS = 8`, `primaryImageIndex`, up to 4 external video URLs; ≥1 photo required by gate **and** by `buildRentasPrivadoListingParams`; publish-time upload bridge `resolveRentasPrivadoDraftMediaToRemoteUrls` → `POST /api/clasificados/rentas/draft-media-upload` (Vercel Blob) → mirrored into Supabase `listing-images` |
| Preview | `/clasificados/rentas/preview/privado?propiedad=<categoriaPropiedad>` (`RentasPrivadoPreviewClient` → `RentasVisualMatchPreviewView`, same renderer as public) — **preview owns publish + checkout** |
| Publish | `publishLeonixListingFromRentasPrivadoDraft(…, {activationMode:"pending_payment"})` → `publishLeonixRealEstateListingCore` → row `status: pending`, `is_published: false` |
| Table / owner / status | `listings`, `owner_id`, `pending → active` (paid), `paused`, `expired` (read-time), `removed` |
| Public | `/clasificados/rentas/listing/[id]`; results `/clasificados/rentas/results` |
| Admin queue | `/admin/workspace/clasificados/rentas` (+ `[id]`) |
| Owner path | `/dashboard/mis-anuncios` (`LeonixRealEstateListingManageCard`), edit re-enters the application with `?edit=1&source=dashboard&mode=listing-edit&listingId=…&lane=privado` |
| Auth gate | `PublishAuthGateLayout` (application + preview) |
| Staff-assisted | UI-gate only |
| Package / price | `rentas_30d`, 2499 ¢, one_time, 30 days (`revenuePricingMatrix.ts:184-199`; lifecycle mirror `listingLifecycleConfig.ts`) |
| Checkout / fulfillment | `startRevenueCategoryCheckout(RENTAS_CATEGORY_CHECKOUT)` → `POST /api/revenue-os/checkout` (Stripe) → webhook → `activatePaidRentasListingFromRevenueOs` |
| Activation / expiration | webhook sets `active`, `published_at`, `expires_at = +30d`; expiry resolved at read time (`resolveListingLifecycle`) |
| Edit | `POST /api/clasificados/rentas/listing-edit` (same row, bearer + owner + lane checks) |
| Rented / End | `markSold: unsupported` for rentas; "Ya se rentó" = `estadoAnuncio: "rentado"` detail-pair status saved through the edit API; pause / archive available |
| Renewal | `renew: specialized` — `startRentasRenewal` → `/api/revenue-os/checkout` `operation: renew_listing` → same row `expires_at` extended (same UUID, same Leonix Ad ID, same media) |
| Republish | registry `unsupported` (treat as product truth) |
| Analytics | `rentasAnalytics.ts` (view / message) |
| Preview gate | `gateRentasPrivadoPreview`: titulo, rentaMensual, tipoDeRenta, ciudad, direccionEstado, direccionCodigoPostal, a location line (street / cross-street / reference), ≥1 photo, seller.nombre, ≥1 contact; + 3 rule checkboxes (`confirmAll`) |
| Renderer conditionals | `RentasVisualMatchPreviewView` — every optional module `? … : null` (summary, address, type, status, quick facts, photos/videos, description, detail groups, features, services, open house, tour, location, each contact CTA) |

Quick mapping (→ `mergePartialRentasPrivadoState(partial)`): `titulo`, `rentaMensual` (digits), `tipoDeRenta` (existing
taxonomy; `categoriaPropiedad` SYSTEM_DERIVED via `rentasCategoriaPropiedadForTipo`), `ciudad`, `direccionCodigoPostal`,
`direccionCruceCercano` (cross-street / reference — never a fabricated exact address; `mostrarDireccionExacta=false`),
`descripcion`, `media.photoDataUrls` (1..8), `seller.nombre`, `seller.telefono|whatsapp|correo|mensajesTexto` =
QUICK_REQUIRED. QUICK_OPTIONAL: `deposito`, `disponibilidad`, `amueblado`, `mascotas`. SAFE defaults already used by
the form: `direccionEstado="CA"`, `direccionPais="United States"`, `posterType="owner_private"`, `estadoAnuncio="disponible"`.
FULL_ONLY: services, requisitos, room/storage/commercial/land blocks, showings, virtual tour, videos, contactChannels.
Write: `await saveRentasPrivadoDraft(state)` **then** navigate (documented race) to
`/clasificados/rentas/preview/privado?propiedad=<cat>`; the customer ticks the 3 rules on the existing application
if not yet ticked → Quick therefore hands off to the existing application (`/clasificados/publicar/rentas/privado`)
pre-filled, whose "Ver anuncio" button is one tap away. **Feasibility: NEEDS_THIN_ADAPTER** (async save + derived
category + paid preview).

---

## 3. EMPLEOS — standard paid job post — `empleos` (lane `quick`)

| Item | Current truth |
| --- | --- |
| Registry | `EMPLEOS_ADAPTER` `categoryRouteRegistry.ts:819-891`; `sourceTable: empleos_public_listings`; `applicationRoute: /publicar/empleos` (hub); lane `empleos_quick` → `/publicar/empleos/quick` (**paid**, `empleos_job_post_paid`), preview `/clasificados/empleos/quick-preview`; `dashboardRoute: /dashboard/empleos` |
| Checkpoint / hub | `/clasificados/publicar/empleos` redirects to `/publicar/empleos` hub (`EmpleosPublicarHubClient`: `getEmpleosPaidCheckpointCard` → `/publicar/empleos/quick`, feria free card) |
| Application | `app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx` (7 sections, ~60 fields). The lane is named "quick" historically; it is **not** a minimal intake |
| Draft type / store | `EmpleosQuickDraft`; sessionStorage `leonix_empleos_quick_draft_v1`; `normalizeEmpleosQuickDraft`; `flushEmpleosDraftToSession` |
| Media | `images: EmpleosImageItem[]` (data URLs, uncapped), `logoUrl`, up to 4 video URLs. **No storage bucket and no upload route exist for Empleos.** `mapImagesForPublish` (`buildEmpleosPublishEnvelope.ts:41-52`) **silently drops every `data:`/`blob:` URL** — an uploaded photo passes the client gate but never reaches the published row; the public hero then shows a stock fallback image (`mapQuickDraftToShell.ts:20-25`) |
| Preview | `/clasificados/empleos/quick-preview?from=publicar` (not auth-gated at route level; checkout call enforces auth) |
| Publish | `POST /api/clasificados/empleos/listings` (bearer; `mode: draft` then Revenue OS checkout; `publish` on a paid lane → `payment_required`) |
| Table / owner / status | `empleos_public_listings`, `owner_user_id`, `lifecycle_status` (`draft, pending_review, published, paused, archived, rejected`) |
| Public | `/clasificados/empleos/[slug]` (`EmpleoQuickDetailPage`), results `/clasificados/empleos/resultados` |
| Admin queue | `/admin/workspace/clasificados/empleos` |
| Owner path | `/dashboard/empleos`, `/dashboard/empleos/[listingId]` |
| Staff-assisted | UI-gate only |
| Package / price | `empleos_job_post_paid`, 2499 ¢, one_time, 30 days |
| Checkout / fulfillment | preview → `saveEmpleosDraftAndStartPaidJobCheckout` → `/api/revenue-os/checkout` → webhook → `activatePaidEmpleosListingFromRevenueOs` (`draft → published`) |
| Activation / expiration | webhook; **no `expires_at`, no lifecycle config** (pre-existing) |
| Edit | `/publicar/empleos/quick?edit=<uuid>` (same row) |
| Filled / End | no `filled` status; owner `PATCH …/listings/{id}` `{lifecycle_status: "archived" | "paused"}` |
| Renewal | none (new paid listing per job) |
| Republish | staff-only admin action |
| Analytics | `view_count` / `apply_count` + CTA tracking |
| Preview gate | `gateEmpleosQuickPreview`: title, businessName, city, state, country, jobType(+custom), schedule, pay, description, ≥1 image (URL present), ≥1 contact |
| Renderer conditionals | schedule/videos/benefits/location/related omitted; **hero always renders (stock fallback)**; description/jobType/title/businessName use "—"/"Empleo"/"Empresa" placeholders |

**Feasibility: BLOCKED_BY_EXISTING_MEDIA_OUTPUT.** The Media Lock requires at least one *real* customer image
to reach the published ad. The existing Empleos pipeline has no image path for uploaded files (they are dropped
at envelope build and replaced by a stock photo on the public page); only a pasted `https://` image URL persists,
which low-tech Quick customers do not have. Fixing this means redesigning the Empleos media output (a bucket, an
upload route and the envelope mapper), which the Owner Lock forbids in this mission. Quick therefore does **not**
open an Empleos intake. The customer chooser and the staff launchpad still expose Empleos honestly as the existing
standard application (`/publicar/empleos`) with no fake Quick CTA and no "coming soon" placeholder.

---

## 4. AUTOS — private lane only — `autos` (`autos_privado`)

| Item | Current truth |
| --- | --- |
| Registry | `AUTOS_PRIVADO_ADAPTER` `categoryRouteRegistry.ts:~575-615`; `sourceTable: autos_classifieds_listings`; `applicationRoute: /publicar/autos/privado`; `hubRoute: /publicar/autos`; preview `/clasificados/autos/privado/preview`; `dashboardRoute: /dashboard/mis-anuncios` |
| Checkpoint / hub | `/publicar/autos` (`PublicarAutosBranchClient`) → `getAutosCheckpointCards` (`autos_privado` paid card) → `/publicar/autos/privado` |
| Full application | `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx` (7-step stepper, `AutosApplicationSteppedShell`) |
| Existing quick-like route | none |
| Draft type / store | `AutosPrivadoDraftV1 { v:1, vehicleTitleOverride, listing: AutoDealerListing, editorStep?, editorMaxReached? }`; namespace `u:<uid>` / `anon:<install>` (`resolveAutosPrivadoDraftNamespace`); sessionStorage primary + localStorage legacy + IndexedDB asset offload; `saveAutosPrivadoDraftResolved(ns, draft)`; preview finds the draft via `rememberAutosDraftNamespaceHint("privado", ns)` |
| Media | `mediaImages: MediaImageEntry[] {id,url,sourceType:"url"|"file",isPrimary,sortOrder}` + derived `heroImages`; no count cap; 8 video URLs; data URLs converted to Vercel Blob URLs by `resolveAutosDraftPhotosForPublish` inside `saveAutosPrivadoPendingBeforeCheckout` (`POST /api/clasificados/autos/media/draft-photo-upload`); server rejects `data:`/`blob:` transport |
| Preview | `/clasificados/autos/privado/preview` (mode `draft` via namespace hint → `AutoPrivadoPreviewPage`, same component as live) — checkout only in `draft` mode; auth-gated |
| Publish | `POST /api/clasificados/autos/listings` (bearer, `lane: "privado"`) — draft row created at checkout step |
| Table / owner / status | `autos_classifieds_listings`, `owner_user_id`, `draft/pending_payment/payment_failed → active`, `removed`, `expires_at` |
| Public | `/clasificados/autos/privado/[…]` (`AutoPrivadoPreviewPage` live), results `/clasificados/autos` |
| Admin queue | `/admin/workspace/clasificados/autos` |
| Owner path | `/dashboard/mis-anuncios` (`AutosClassifiedListingManageCard`); edit `/publicar/autos/privado?edit=1&source=dashboard&listingId=…` (only while unpaid) |
| Staff-assisted | UI-gate only |
| Package / price | `autos_privado_30d`, 2499 ¢, one_time, 30 days |
| Checkout / fulfillment | preview → `saveAutosPrivadoPendingBeforeCheckout` → `/api/revenue-os/checkout` → webhook → `activatePaidAutosPrivadoListingFromRevenueOs` |
| Activation / expiration | `active` + `published_at` + `expires_at = +30d`; expiry enforced by read-time filters |
| Edit | PATCH only while `draft/pending_payment/payment_failed` (active rows are not editable — pre-existing) |
| Sold / End | `POST /api/clasificados/autos/listings/{id}/unpublish` → `status = removed` ("Vehículo vendido"); `restore` reverses |
| Renewal | `startListingRenewalCheckout({category:"autos", packageKey:"autos_privado_30d"})` → same row `expires_at` extended |
| Republish | staff-only |
| Analytics | `POST /api/clasificados/autos/public/analytics/event`, owner summary endpoints |
| Preview gate | `getAutosPreviewCompletenessIssues("privado")`: media (image **or** video), title (vehicleTitle or year+make+model), finite USD price, city+ZIP (state defaults CA), ≥1 of phone/mobile/WhatsApp/email |
| Renderer conditionals | title/price/facts/gallery/specs/highlights/description/contact CTAs each `? … : null`; no placeholders |

Quick mapping (→ `createEmptyListing()` + `withPrivadoLocationDefaults` + `autosLane:"privado"`): `year, make, model`
(title SYSTEM_DERIVED via `buildVehicleTitle`), `price` (number), `mileage` (QUICK_OPTIONAL), `city, zip`
(state/country SAFE defaults `CA`/`United States` exactly as the form), `description`, `mediaImages[]` (≥1 file →
`{sourceType:"file", url:<data URL>, isPrimary: i===0, sortOrder:i}`; Quick rule: video alone is not enough),
`dealerPhoneMobile | dealerWhatsapp | dealerEmail` (QUICK_REQUIRED ≥1), `dealerName` (seller display name, optional).
FULL_ONLY: VIN/decode, trim/colors/body/drive/transmission/equipment, socials, meeting note, videos.
Write: `ns = await resolveAutosPrivadoDraftNamespace(); rememberAutosDraftNamespaceHint("privado", ns);
await saveAutosPrivadoDraftResolved(ns, {v:1, vehicleTitleOverride:false, listing, editorStep: AUTOS_PUBLISH_FINAL_STEP_INDEX})`;
handoff `/clasificados/autos/privado/preview`. **Feasibility: NEEDS_THIN_ADAPTER.**

---

## 5. BIENES RAÍCES — private / FSBO lane — `bienes-raices` (`bienes_raices_privado`)

| Item | Current truth |
| --- | --- |
| Registry | `BIENES_RAICES_PRIVADO_ADAPTER` `categoryRouteRegistry.ts:626-687`; `listings`; `applicationRoute: /publicar/bienes-raices/privado` (alias of `/clasificados/publicar/bienes-raices/privado`, same component); `hubRoute: /clasificados/publicar/bienes-raices`; preview `/clasificados/bienes-raices/preview/privado`; `dashboardRoute: /dashboard/mis-anuncios` |
| Checkpoint / hub | `/clasificados/publicar/bienes-raices` → `getBienesRaicesCheckpointCards` (`br_privado` paid card) |
| Full application | `…/publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx` (1463 lines, single page) |
| Existing quick-like route | none |
| Draft type / store | `BienesRaicesPrivadoFormState` (v3); `mergePartialBienesRaicesPrivadoState`; `saveBienesRaicesPrivadoDraft` (async; sessionStorage `br-privado-draft-v1` + LS fallback + IDB `lx-br-privado-draft`) |
| Media | `media.photoDataUrls[]` (JPEG data URLs via `compressImageFileToJpegDataUrl`), `MAX_PHOTOS = 8`, `primaryImageIndex`; 4 external video URLs; seller photo optional; bucket `listing-images` uploaded by the existing publisher; ≥1 photo required by the client gate (publisher only warns) |
| Preview | `/clasificados/bienes-raices/preview/privado?propiedad=<cat>` (`BienesRaicesPrivadoPreviewClient` → `BienesRaicesPrivadoPreviewView`, same as live) — preview owns pending insert + checkout |
| Publish | `publishLeonixListingFromBienesRaicesPrivadoDraft(…, {activationMode:"pending_payment"})` → `publishLeonixRealEstateListingCore` |
| Table / owner / status | `listings`, `owner_id`, `pending → active` (paid), `sold`, `paused`, `removed`, `expires_at` |
| Public | `/clasificados/anuncio/[id]` (`BienesRaicesPrivadoLiveDetailShell`), results `/clasificados/bienes-raices/resultados` |
| Admin queue | `/admin/workspace/clasificados/bienes-raices` |
| Owner path | `/dashboard/mis-anuncios` (`LeonixRealEstateListingManageCard`), generic editor `[id]/editar` |
| Staff-assisted | UI-gate only |
| Package / price | `br_fsbo_45d`, 4999 ¢, one_time, 45 days |
| Checkout / fulfillment | `savePendingFsboListing` → `/api/revenue-os/checkout` → webhook → `activatePaidBienesFsboListingFromRevenueOs` |
| Activation / expiration | `active` + `is_published` + `expires_at = +45d`; read-time term rule `isBrFsboRowWithinTerm` |
| Edit | generic editor (title/price/description/photos/status + seller photo) |
| Sold / End | `POST /api/clasificados/bienes-raices/privado-status` `{action:"mark_sold"}` → `status = sold, is_published=false` ("Ya se vendió"); `relist`, `pause`, `resume`, `archive` |
| Renewal | `startBienesFsboRenewal` → `/api/revenue-os/checkout` `renew_listing` → same row `expires_at` extended |
| Republish | generic `republished_at` bump when eligible |
| Analytics | `brGlobalAnalytics.ts` |
| Preview gate | `gateBienesRaicesPrivadoPreview`: titulo, precio, ciudad (or address/colonia), ≥1 photo, seller.nombre, ≥1 contact, `petsAllowed ∈ {yes,no}`; + 3 rule checkboxes; + 4 checkout confirmations on the preview |
| Renderer conditionals | every optional module omitted (gallery, seller aside, CTAs, description, HOA, open house, tour, fact groups, chips, footer) — no placeholders |

Quick mapping (→ `mergePartialBienesRaicesPrivadoState(partial)`): `categoriaPropiedad` (QUICK_REQUIRED, 3 values),
`residencial.tipoCodigo` (QUICK_OPTIONAL when residencial, from `TIPO_PROPIEDAD_OPCIONES`), `titulo`, `precio`, `ciudad`,
`ubicacionLinea` (reference / cross-street, never a fabricated exact address), `descripcion`, `petsAllowed`,
`media.photoDataUrls` (1..8), `seller.nombre`, `seller.telefono|whatsapp|correo|mensajesTexto` = QUICK_REQUIRED.
QUICK_OPTIONAL: `residencial.recamaras/banos`. FULL_ONLY: everything else. Rule checkboxes are real canonical booleans
ticked by the customer in Quick's review step (same copy component `ListingRulesConfirmationSection`). Write:
`await saveBienesRaicesPrivadoDraft(state)` then handoff `/clasificados/bienes-raices/preview/privado?propiedad=<cat>`.
**Feasibility: NEEDS_THIN_ADAPTER.**

---

## 6. CLASES — `clases`

| Item | Current truth |
| --- | --- |
| Registry | `CLASES_ADAPTER` `categoryRouteRegistry.ts:~1160-1200`; `listings`; `applicationRoute: /publicar/clases/quick`; `checkpointRoute: /publicar/clases`; preview `/publicar/clases/quick/preview`; `dashboardRoute: null` |
| Checkpoint / hub | `/publicar/clases` → `getClasesCheckpointCard` (`clases_free`) → `/publicar/clases/quick` |
| Application | `app/(site)/publicar/clases/quick/ClasesQuickApplication.tsx`. **The `quick` route IS the canonical application; no full lane exists.** |
| Draft type / store | `ClasesQuickDraft`; sessionStorage `leonix_clases_quick_draft_v1`; `normalizeClasesQuickDraft` |
| Media | `images: EmpleosImageItem[]` (images + PDF flyer, uncapped, data URLs), `organizerLogoUrl`; ≥1 non-PDF image required by gate and publisher |
| Preview | `/publicar/clases/quick/preview?from=publicar` (`CommunityQuickPreviewClient kind="clases"`) |
| Publish | `publishCommunityQuickToListings({kind:"clases"})`; paid classes (`classCostType="pagada"`) are blocked by `shouldBlockClasesPaidPublish` (pre-existing) |
| Table / owner / status | `listings`, `owner_id`, `draft → active` |
| Public | `/clasificados/anuncio/[id]` → `ClasesQuickAdCanvas`; results `/clasificados/clases/resultados` |
| Admin queue | `/admin/workspace/clasificados/clases` |
| Owner path | `/dashboard/mis-anuncios?cat=clases`, `[id]`, `[id]/editar` (`clases` adapter) |
| Staff-assisted | UI-gate only |
| Package / price | `clases_free` 0 ¢ (paid `clases_paid_30d` exists but publish is blocked) |
| Checkout | none for free |
| Activation / expiration | active on publish; no expiration |
| Edit / End / Renew | generic editor; End = Archive; renew/republish unsupported |
| Analytics | `comunidadClasesBuscoGlobalAnalytics` (`clases`) |
| Preview gate | `gateClasesQuickPreview`: title, organizer, category(+custom), cost type (+price/frequency when paid), mode, audience, skillLevel, registrationRequired, schedule (`one_time` date+start+end **or** weekly rows), description, ≥1 image, ≥1 contact, canonical NorCal `publicCity` |
| Renderer conditionals | shared premium shell: chips filtered, info grid / text cards / schedule `return null` when empty; PDF hero placeholder is the only non-omitting case |

Quick mapping (→ `normalizeClasesQuickDraft`): every gate-required field QUICK_REQUIRED (Quick pins
`classCostType="gratis"` because the paid lane cannot publish today — SAFE, visible as a chip the customer can
change in the existing application); `scheduleMode="one_time"` + date/start/end is the Quick default question
("¿Cuándo?") with a "se repite cada semana" alternative that writes `weeklySchedule`. FULL_ONLY: classLinks,
socials, paymentMethods, materials/requirements, audiences[] beyond the first, start/end date range.
Write: `flushCommunityDraftToSession(COMMUNITY_SESSION_KEYS.clases, draft, normalizeClasesQuickDraft)`;
handoff `communityHandoffPreviewUrl("clases", lang)`. **Feasibility: READY_BY_EXTRACTION.**

---

## 7. COMUNIDAD / EVENTOS — `comunidad`

| Item | Current truth |
| --- | --- |
| Registry | `COMUNIDAD_ADAPTER` `categoryRouteRegistry.ts:1208-1247`; `sourceTable: listings`; `applicationRoute: /publicar/comunidad/quick`; `checkpointRoute: /publicar/comunidad`; `previewRoute: /publicar/comunidad/quick/preview`; `dashboardRoute: null` |
| Checkpoint / hub | `/publicar/comunidad` → `QuickLaneCheckpointClient` → `getComunidadCheckpointCard` (`comunidad_free`) → CTA `/publicar/comunidad/quick` |
| Application | `app/(site)/publicar/comunidad/quick/ComunidadQuickApplication.tsx` (single page, 6 sections + confirmations). **The `quick` route IS the canonical application; no full lane exists.** |
| Draft type / store | `ComunidadQuickDraft` (`community/shared/types/communityQuickDraft.ts:196`); sessionStorage `leonix_comunidad_quick_draft_v1`; `normalizeComunidadQuickDraft` |
| Media | `images: EmpleosImageItem[]` (data URLs; images + PDF flyer); no cap; 0 videos; ≥1 non-PDF image required by gate **and** publisher; optional `organizerLogoUrl` |
| Preview | `/publicar/comunidad/quick/preview?from=publicar` (`CommunityQuickPreviewClient kind="comunidad"`) |
| Publish | `publishCommunityQuickToListings({kind:"comunidad", draft, lang})` (client module, RLS, `owner_id = auth.uid`), bucket `listing-images` |
| Table / owner / status | `listings`, `owner_id`, `draft → active` (`removed` on failure/archive) |
| Public | `/clasificados/anuncio/[id]` (dispatch line ~1438 → `ComunidadQuickAdCanvas`), results `/clasificados/comunidad/resultados` |
| Admin queue | `/admin/workspace/clasificados/comunidad` |
| Owner path | `/dashboard/mis-anuncios?cat=comunidad`, `[id]`, `[id]/editar` (`comunidad` adapter) |
| Auth gate | `PublishAuthGateLayout` (`/publicar/layout.tsx` + preview layout) |
| Staff-assisted | UI-gate only |
| Package / price | `comunidad_free`, 0 ¢, free |
| Checkout / fulfillment | none |
| Activation / expiration | `status=active,is_published=true`; no `expires_at`; discovery hides events past `Leonix:eventEndDate`/`eventDate` (`communityEventDiscoveryExpiration.ts`) |
| Edit | generic editor + `comunidad` adapter (no API route) |
| End | capability registry: `close/markSold: unsupported`; **Archive** (`status=removed`) is the only end action |
| Renewal / Republish | unsupported |
| Analytics | `comunidadClasesBuscoGlobalAnalytics` (`category: comunidad`) |
| Preview gate | `gateComunidadQuickPreview`: title, organizer, category(+custom), audience, registrationRequired, eventCost(+admissionNote when paid/donation), date, schedule (weekly rows or session start/end), description, ≥1 image, ≥1 contact (phone/whatsapp/email), canonical NorCal `publicCity` |
| Renderer conditionals | chips filtered; info grid `return null` when empty; text cards `return null`; schedule card `return null`; cost badge only when not free; PDF hero shows explicit placeholder block (only non-omitting case) |

Quick mapping (→ `ComunidadQuickDraft` via `normalizeComunidadQuickDraft`): every gate-required field is QUICK_REQUIRED
(they are the essentials of an event); QUICK_OPTIONAL: `venue`, `eventEndDate`, `whatsapp/smsPhone/email/website`;
FULL_ONLY: socialLinks, eventLinks, accessibilityKeys, bringNote/restrictionsNote, organizerLogoUrl, addressLine1/2, zip.
SAFE defaults: `state = COMMUNITY_DEFAULT_STATE`, `primaryCta` derived, `previewListingId` via `ensureCommunityPreviewListingId`.
Write: `flushCommunityDraftToSession(COMMUNITY_SESSION_KEYS.comunidad, draft, normalizeComunidadQuickDraft)`;
handoff `communityHandoffPreviewUrl("comunidad", lang)`. **Feasibility: READY_BY_EXTRACTION** (zero canonical code change).

---

## 8. BUSCO / SE BUSCA — `busco`

| Item | Current truth |
| --- | --- |
| Registry | `BUSCO_ADAPTER` `categoryRouteRegistry.ts:1110-1151`; `listings`; `applicationRoute: /publicar/busco/quick`; `checkpointRoute: /publicar/busco`; `dashboardRoute: /dashboard/mis-anuncios` |
| Checkpoint / hub | `/publicar/busco` → `getBuscoCheckpointCard` (`busco_free`) → `/publicar/busco/quick` |
| Application | `app/(site)/publicar/busco/quick/BuscoQuickFormClient.tsx` (single page, 7 sections). **Quick IS the only lane.** |
| Draft type / store | `BuscoQuickDraft` (`busco/shared/buscoQuickTypes.ts`); sessionStorage `leonix_busco_quick_draft_v2`; `normalizeBuscoQuickDraft` |
| Media | single optional image `imageDataUrl` + `imageFileName` (data URL); 0 videos; **not required** by gate or publisher (Quick enforces ≥1 for Quick only) |
| Preview | `/publicar/busco/quick/preview?from=publicar` (`BuscoQuickPreviewClient`) |
| Publish | `publishBuscoQuickToListings({draft, lang})` (re-runs gate; idempotency key) |
| Table / owner / status | `listings`, `owner_id`, `draft → active` |
| Public | `/clasificados/anuncio/[id]` (dispatch ~1391 → `BuscoQuickAdCanvas`), results `/clasificados/busco/resultados` |
| Admin queue | `/admin/workspace/clasificados/busco` |
| Owner path | `/dashboard/mis-anuncios?cat=busco`, `[id]`, `[id]/editar` (`busco` adapter) |
| Auth gate | `PublishAuthGateLayout` |
| Staff-assisted | UI-gate only |
| Package / price | `busco_free`, 0 ¢, free |
| Checkout | none |
| Activation / expiration | active on publish; no expiration |
| Edit / End / Renew | generic editor; End = Archive (`removed`); renew/republish unsupported |
| Analytics | `comunidadClasesBuscoGlobalAnalytics` (`busco`) |
| Preview gate | `gateBuscoQuickPreview`: buscoType(+custom), title, description, canonical city, ≥1 contact (10-digit phone/sms/wa or valid email), **3 confirmations** |
| Renderer conditionals | every optional module is a `? … : null` (urgency, chips, budget, contacts, socials, map) — omitted when empty |

Quick mapping (→ `BuscoQuickDraft`): `buscoType(+custom), title, description, city, phone|whatsapp|email` QUICK_REQUIRED;
`image → imageDataUrl/imageFileName` QUICK_REQUIRED (Quick rule); QUICK_OPTIONAL: `zone`, `budgetMode/budgetAmount`,
`urgency`; FULL_ONLY: conditional detail fields, socials, otherContact. Confirmations are ticked on the existing
preview/application (never pre-ticked). Write: `sessionStorage[BUSCO_QUICK_DRAFT_KEY] = normalizeBuscoQuickDraft(…)`;
handoff `buscoHandoffPreviewUrl(lang)` — but because the gate requires the 3 confirmations, Quick hands off to the
existing application (`/publicar/busco/quick`) pre-filled so the customer ticks them there, one tap from preview.
**Feasibility: READY_BY_EXTRACTION.**

---

## 9. MASCOTAS Y PERDIDOS — `mascotas-y-perdidos`

| Item | Current truth |
| --- | --- |
| Registry | `MASCOTAS_Y_PERDIDOS_ADAPTER` `categoryRouteRegistry.ts:1250-1298`; `listings`; `applicationRoute: /publicar/mascotas-y-perdidos/quick`; `checkpointRoute: /publicar/mascotas-y-perdidos`; `dashboardRoute: null` |
| Checkpoint / hub | `/publicar/mascotas-y-perdidos` → `getMascotasCheckpointCard` (`mascotas_free`, "Hasta 4 fotos") |
| Application | `…/mascotas-y-perdidos/quick/MascotasPerdidosQuickFormClient.tsx` (single page, up to 10 sections keyed by `noticeType`). **Quick IS the only lane.** |
| Draft type / store | `MascotasPerdidosQuickDraft`; sessionStorage `leonix_mascotas_perdidos_quick_draft_v2`; `normalizeMascotasPerdidosQuickDraft` |
| Media | `images: EmpleosImageItem[]`, **max 4** (`MAX_MASCOTAS_PHOTOS`), ≥1 required by gate and publisher; 0 videos |
| Preview | `/publicar/mascotas-y-perdidos/quick/preview?from=publicar` |
| Publish | `publishMascotasPerdidosQuickToListings({draft, lang})` (re-runs gate; no idempotency key — pre-existing) |
| Table / owner / status | `listings`, `owner_id`, `draft → active` |
| Public | `/clasificados/anuncio/[id]` (dispatch ~1416 → `MascotasPerdidosQuickAdCanvas`), results `/clasificados/mascotas-y-perdidos/results` |
| Admin queue | `/admin/workspace/clasificados/mascotas-y-perdidos` |
| Owner path | `/dashboard/mis-anuncios?cat=mascotas`, `[id]`, `[id]/editar` (`mascotas-y-perdidos` adapter) |
| Auth gate | `PublishAuthGateLayout` |
| Staff-assisted | UI-gate only |
| Package / price | `mascotas_free`, 0 ¢, free |
| Checkout | none |
| Activation / expiration | active on publish; no expiration |
| Edit / End / Renew | generic editor; End = Archive; renew/republish unsupported |
| Analytics | recently-viewed only (`addListingView`); not in community analytics module (pre-existing gap) |
| Preview gate | `gateMascotasPerdidosQuickPreview`: noticeType, title, description, canonical city, lastSeenLocation, ≥1 photo, ≥1 contact, rewardAmount iff offersReward (lost types), 3 confirmations |
| Renderer conditionals | all optional modules omitted when empty (hero, badge, reward, gallery, date/location, marks, contacts, socials, map) |

Quick mapping (→ `MascotasPerdidosQuickDraft`): `noticeType, title, description, city, lastSeenLocation, photos(1-4),
phone|sms|whatsapp|email` QUICK_REQUIRED; QUICK_OPTIONAL: `petName, species, color` (pet types), `objectType`
(object types), `lastSeenDate/foundDate`; FULL_ONLY: breed/sex/age/size/marks/collar/microchip/reward/safety/
adoption/social. Confirmations ticked on the existing application → handoff to `/publicar/mascotas-y-perdidos/quick`
pre-filled (one tap to preview). **Feasibility: NEEDS_THIN_ADAPTER** (noticeType fan-out chooses which optional
prompts appear; ≥1 photo already canonical).
