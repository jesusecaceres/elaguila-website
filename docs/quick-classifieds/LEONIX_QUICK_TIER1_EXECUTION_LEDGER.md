# LEONIX QUICK CLASSIFIEDS — TIER-1 EXECUTION LEDGER

Mission: Tier-1 Quick Classifieds completion (En Venta, Rentas Privado, Empleos standard post, Autos Privado).
Branch: `claude/quick-classifieds-master-build-0j5p30`. Rehydrated at `cc427dbb` (local fast-forwarded to the
remote's three docs-only commits; `origin/main` still `fd909499`, 0 behind).

Statuses are re-derived from current source in this mission, not carried over from prior documents.
Legend: PASS · REPAIR · BLOCKED · N/A.

## Gate 0 — cold audit (before this mission's repairs)

| Column | EN VENTA | RENTAS | EMPLEOS | AUTOS PRIVADO |
| --- | --- | --- | --- | --- |
| QUICK ROUTE | `/publicar/rapido/en-venta` | `/publicar/rapido/rentas` | `/publicar/rapido/empleos` (blocked card) | `/publicar/rapido/autos` |
| CURRENT QUICK STATUS | PASS (adapter live) | PASS (adapter live) | BLOCKED (no adapter; registry `status: "blocked"`) | PASS (adapter live) |
| TEXT INPUT WIRING | PASS — `QuickFieldRenderer` forwards raw `e.target.value`; trimming only in `quickStr` at adapter time | PASS (same) | N/A | PASS (same) |
| SELECT/CHIP WIRING | PASS — `select` writes value; `chips` single/multi write exact option values; dependent `itemType` options recomputed from `rama` without resetting other keys | PASS | N/A | PASS |
| MEDIA WIRING | PASS — JPEG data URLs → `state.images[]` (same format Full's `PhotosSection` writes via `readAsDataURL`) → publisher `fetchAsBlob(data:)` → `listing-images` (`enVentaPublishFromDraft.ts:510-520`) | PASS — `media.photoDataUrls[]` → `resolveRentasPrivadoDraftMediaToRemoteUrls` accepts `data:image/*` (`rentasDraftPublishPrepare.ts:45`) | REPAIR — `mapImagesForPublish` drops `data:`/`blob:` (`buildEmpleosPublishEnvelope.ts:41-52`); no upload step exists | PASS — `mediaImages[{sourceType:"file", url:data:}]` is exactly what `AutosNegociosMediaManager.addFiles` writes; `resolveAutosDraftPhotosForPublish` accepts `data:image/*` (`autosDraftPhotoPublishPrepare.ts:81`) |
| CANONICAL DRAFT | PASS — `EnVentaFreeApplicationState` via `createEmptyEnVentaFreeState` + `persistEnVentaPreviewHandoffAsync("pro")` | PASS — `mergePartialRentasPrivadoState` + `saveRentasPrivadoDraft` (awaited) | N/A | PASS — `AutosPrivadoDraftV1` via `saveAutosPrivadoDraftResolved(ns)` + `rememberAutosDraftNamespaceHint` |
| PREVIEW HANDOFF | PASS — `/clasificados/en-venta/preview?plan=pro` | PASS — `/clasificados/rentas/preview/privado?propiedad=…` (client loads draft, re-gates, uploads, publishes pending, checkout: `RentasPrivadoPreviewClient.tsx:141-207`) | N/A | PASS — `/clasificados/autos/privado/preview` (draft mode via hint) |
| PAYMENT | N/A (free `en_venta_free_v1`) | PASS — existing `rentas_30d` via `/api/revenue-os/checkout` from the existing preview | N/A | PASS — existing `autos_privado_30d` via existing preview |
| PUBLIC OUTPUT | PASS — `/clasificados/anuncio/[id]` (`EnVentaAnuncioLayout`) | PASS — `/clasificados/rentas/listing/[id]` | BLOCKED — stock `FALLBACK_IMG` when no https image | PASS — `AutoPrivadoPreviewPage` live |
| EDIT | PASS — generic owner editor | PASS — existing listing-edit route | N/A | N/A — active rows not editable (pre-existing) |
| END | PASS — `mark_sold` | PASS — `estadoAnuncio: rentado` via edit API; pause/archive | N/A | PASS — `unpublish` (removed) |
| RENEW | N/A (no renewal SKU; visibility refresh exists) | PASS — `startRentasRenewal` same row | N/A | PASS — `startListingRenewalCheckout` same row |
| KNOWN BLOCKER | none | none | BLOCKED_BY_EXISTING_MEDIA_OUTPUT | none |
| ACTION REQUIRED | trim: ZIP optional (canonical `validateEnVentaLocation` accepts empty ZIP) | trim: drop SMS question from Quick | narrow wiring repair (see Gate 5) + Quick adapter | none beyond audit |

Note: `docs/quick-classifieds/LEONIX_QUICK_CLASSIFIEDS_PM_CONTROL_MASTER.md` was absent from the local checkout at
start; it exists on the remote branch and was read after the fast-forward.

## Gate 1 — shared form interaction contract (source proof)

| Contract | Evidence | Status |
| --- | --- | --- |
| Text/number/phone/email/date/time inputs forward the raw keystroke | `QuickFieldRenderer.tsx` — every `<input>`/`<textarea>` does `onChange(field.key, e.target.value)`; no `trim/normalize/parse/replace` in any handler (verifier §8 scans every `onChange={…}`) | PASS |
| Spaces, apostrophes, hyphens, accents, ñ, multiline | same raw forwarding; `textarea` for descriptions; validation (`validateQuickStep`) runs only on Next/Review | PASS |
| City typing | existing `CityAutocomplete` forwards raw (`onChange(e.target.value)` L217); canonicalization only on blur/select (`handleBlur` L118-126) | PASS |
| Normalization boundary | `quickStr()` trims at adapter/validation time only; canonical gates run inside adapters | PASS |
| Field change never resets unrelated fields | `setDraft((d) => ({ ...d, values: { ...d.values, [key]: value } }))` | PASS |
| Back / Next keep values | `goTo()` changes `stepIndex` only; values + media + confirmations live in the same draft object | PASS |
| Refresh / same-tab login return | draft persisted (250 ms debounce) to sessionStorage + heavy-media IndexedDB (`quickIntakeDraftStore.ts`); `/publicar/**` gate redirects before the form renders, so nothing typed is ever lost; magic-link in a NEW tab starts clean (same limitation every canonical draft has) | PASS (N/A for cross-tab magic link, by existing architecture) |
| Chips / select / toggle / date write exact canonical values | `chips` writes option `value` (single → string, multi → string[]); `select` writes value; `toggle` boolean; dates `YYYY-MM-DD` | PASS |
| Visible prefills | NEW `defaultValue` (types) applied once after hydration only where the customer typed nothing (`values: { ...missing, ...d.values }`) | PASS |
| Image control | gallery + camera inputs, cover/remove, ≥1 enforced by `validateQuickMedia`; JPEG data URLs via the existing `compressImageFileToJpegDataUrl` | PASS |

Verifier coverage added: `scripts/verify-quick-classifieds-onramp-01.ts` §8.

## Gates 2–4 — Tier-1 chains (source proof)

| Chain link | EN VENTA | RENTAS PRIVADO | AUTOS PRIVADO |
| --- | --- | --- | --- |
| Quick field → Quick state | `QuickFieldRenderer` → `draft.values` | same | same |
| Adapter → canonical draft | `enVentaQuickAdapter.ts`: `createEmptyEnVentaFreeState()` + explicit keys (`rama,itemType,condition,title,priceIsFree,price,description,images,primaryImageIndex,city,zip,seller_kind,displayName,phone,email,whatsapp,contactMethod,confirm*`) | `rentasPrivadoQuickAdapter.ts`: `mergePartialRentasPrivadoState({...})` (`tipoDeRenta`, derived `categoriaPropiedad`, `titulo, rentaMensual, deposito, disponibilidad, descripcion, ciudad, direccionCodigoPostal, direccionCruceCercano, media.photoDataUrls, seller.*, confirm*`) | `autosPrivadoQuickAdapter.ts`: `createEmptyListing()` + `withPrivadoLocationDefaults` (`year, make, model, mileage, price, description, city, zip, dealerName, dealerPhoneMobile, dealerWhatsapp, dealerEmail, mediaImages, heroImages`) |
| Canonical gate | `collectEnVentaCoreBlockers` | `gateRentasPrivadoPreview` | `getAutosPreviewCompletenessIssues("privado")` |
| Canonical store | `persistEnVentaPreviewHandoffAsync("pro")` (session + IDB) | `await saveRentasPrivadoDraft` (session + LS fallback + IDB) | `await saveAutosPrivadoDraftResolved(ns)` + `rememberAutosDraftNamespaceHint` |
| Existing preview | `/clasificados/en-venta/preview?plan=pro` → `loadLatestEnVentaPreviewDraftAsync` | `/clasificados/rentas/preview/privado?propiedad=…` → `loadRentasPrivadoDraft` (`RentasPrivadoPreviewClient.tsx:141`) | `/clasificados/autos/privado/preview` (draft mode via hint, `AutosPrivadoPreviewClient.tsx:89-105`) |
| Image → publisher | `images[]` data URLs (identical to Full `PhotosSection` `readAsDataURL`) → `fetchAsBlob(src)` → `listing-images` upload (`enVentaPublishFromDraft.ts:510-520`) → `listings.images` | `photoDataUrls[]` → `resolveRentasPrivadoDraftMediaToRemoteUrls` (accepts `data:image/*`, `rentasDraftPublishPrepare.ts:45`) → Blob → mirrored to `listing-images` → `listings.images` | `mediaImages[{sourceType:"file", url:data:}]` (identical to Full `AutosNegociosMediaManager.addFiles`) → `resolveAutosDraftPhotosForPublish` (`data:image` accepted, `autosDraftPhotoPublishPrepare.ts:81`) → Vercel Blob → `listing_payload.mediaImages/heroImages` |
| Public output | `/clasificados/anuncio/[id]` `EnVentaAnuncioLayout` gallery from `listings.images` | `/clasificados/rentas/listing/[id]` `RentasVisualMatchPreviewView` (same as preview) | `AutoPrivadoPreviewPage` live (`hasHeroMedia`) |
| Payment | N/A free | existing `rentas_30d` from the existing preview (`startRevenueCategoryCheckout`) | existing `autos_privado_30d` from the existing preview |
| Edit / End / Renew | generic owner editor / `mark_sold` / N/A (visibility refresh only) | listing-edit route / `estadoAnuncio: rentado` via edit API + pause/archive / `startRentasRenewal` same row | N/A while active (pre-existing) / `unpublish` / `startListingRenewalCheckout` same row |
| Full application touched | NO | NO | NO (Dealer untouched) |
| Trim applied in this mission | ZIP now optional (canonical `validateEnVentaLocation` accepts empty ZIP) | SMS question removed from Quick (canonical gate accepts phone/WhatsApp/email) | none |

## Gate 5 — Empleos root cause and repair

Root cause (exact boundary): `app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts:41-52`
`mapImagesForPublish` — `if (u.startsWith("blob:") || u.startsWith("data:")) continue;`. The existing gallery editor
(`EmpleosImageGalleryEditor.tsx:130-141`) stores picked files as `data:` URLs in the session draft; no Empleos code
path uploaded them anywhere (no bucket use, no upload route: grep over `app/(site)/publicar/empleos`,
`app/(site)/clasificados/empleos`, `app/api/clasificados/empleos` = zero hits). The envelope therefore reached
`POST /api/clasificados/empleos/listings` with `images: []`, and the public shell
(`empleosPublishedLaneShell.ts:44-71`) substituted `FALLBACK_IMG`.

Storage truth (read-only SELECT on the live project's `pg_policies` / `storage.buckets`): bucket `listing-images`
is public, 10 MB, `image/jpeg|png|webp`; INSERT policy = any `authenticated` user on that bucket; SELECT/UPDATE/DELETE
own-folder by `auth.uid()`. No schema, policy or product decision is needed to host Empleos photos there under the
customer's own uid folder — the same bucket every other classified publisher already uses.

Repair (narrowest safe): NEW `app/(site)/publicar/empleos/shared/publish/empleosDraftMediaUpload.ts`
(`resolveEmpleosQuickDraftMediaForPublish`) uploads local `data:`/`blob:` gallery + logo refs with the customer's own
session to `listing-images/${uid}/empleos/${batch}/photo-NN.ext` and returns the draft with https URLs; fails closed
with a bilingual message. ONE call-site insertion in `EmpleoQuickPreviewClient.tsx` (checkout handler, after the
session check, before `buildEmpleosPublishEnvelopeFromQuick`); the hosted draft is flushed back to the session key so
the images persist if checkout is abandoned. The envelope mapper, the application UI, the API route, the public job
page and Feria are untouched. Premium lane shares the defect and was NOT repaired (out of Tier-1; documented).

Proven chain after repair: customer file → `EmpleosImageGalleryEditor` (data:) → `leonix_empleos_quick_draft_v1` →
existing preview (`mapQuickDraftToShell.pickMainImage` renders data:) → checkout: upload → https → envelope
`images[]` (mapper keeps https) → `POST …/listings` mode draft → Revenue OS checkout → webhook `published` →
`/clasificados/empleos/[slug]` (`mapPublishedQuickToShell` renders `images[0].url`; `FALLBACK_IMG` only when empty).
Edit hydration (`hydrateQuickDraftFromEnvelope.imagesFromRefs`) restores the https refs.

Empleos Quick adapter added (`empleosQuickAdapter.ts`): writes `EmpleosQuickDraft` under `EMPLEOS_SESSION_KEYS.quick`,
runs `gateEmpleosQuickPreview`, hands off to `/clasificados/empleos/quick-preview?from=publicar`. Registry status
`live`; `empleos_job_post_paid` posture unchanged.

## Gate 6 — two-minute experience (current source)

| Category | Visible questions (typical) | Required by canonical gate | Removed from Quick this mission |
| --- | --- | --- | --- |
| En Venta | 13 (9 item + 4 contact) | 9 (rama, itemType, condition, title, price-or-free, description, city, ≥1 contact, name) | ZIP → optional |
| Rentas | 13 (9 rental + 4 contact) | 9 (tipo, título, renta, descripción, ciudad, ZIP, referencia, nombre, ≥1 contact) | SMS question |
| Autos | 12 (8 vehicle + 4 contact) | 7 (year, make, model, price, city, ZIP, ≥1 contact) | none |
| Empleos | ≈12 typical (conditional fields hidden) | 11 (title, business, jobType, pay, schedule, description, city, state, country, ≥1 contact, ≥1 image) | new lane |

Every remaining question is ESSENTIAL or CANONICAL_REQUIRED except: deposit, availability (Rentas),
mileage, description, seller name (Autos), WhatsApp / email (all) = OPTIONAL_BUT_USEFUL. No FULL field removed.

## Gate 7 — launchpad Tier-1 alignment

`QuickApplicationsLaunchpad.tsx` now opens with four verbs (Create quick ad → Tier-1 grid; Send quick link →
share/copy chooser; Manage ad → existing `ADMIN_DASHBOARD_ROUTES.classifiedsQueue`; Full Business Profile →
existing `buildConciergeInventoryHref("business_profile")`), then the four Tier-1 lanes as large cards, then FSBO +
the community family as compact cards whose Open / Copy / Share use the DIRECT existing short application
(`/publicar/{busco,mascotas-y-perdidos,comunidad,clases}/quick`). The customer chooser applies the same rule.

## Gate 8 — lightweight management truth (`/publicar/rapido/mi-anuncio`)

Links only; no mutation; every verb maps to the registry lifecycle adapter (Gate 0 table). Ownership stays with
the existing dashboard/API guards (bearer + owner + category checks). Empleos → `/dashboard/empleos`. Staff
"Manage ad" → existing admin classifieds queue.

## Gate 9 — focused no-regression

| Check | Result |
| --- | --- |
| scoped `tsc` (Quick tree + launchpad + StaffCommandCenter + Empleos preview client + upload helper) | 0 errors |
| ESLint `--max-warnings 0` on all touched/new files | clean except one PRE-EXISTING unused `backLabel` (present at HEAD, not touched) in `EmpleoQuickPreviewClient.tsx` |
| `verify-quick-classifieds-onramp-01` (now with §8 interaction contract + Empleos repair asserts) | OK |
| 8 guard verifiers (staff command center, bilingual, staff OS, concierge, p0 ×3, gateway selftest) | all OK |
| `gate-i5-4c-empleos-lane-shell-fallback-safety`, `empleos-jobposting-schema-selftest`, `smoke-revenue-os-empleos-paid-publish-checkpoint-01`, `verify-empleos-final-qa-readiness` | all OK |
| `empleos-e3-master-paid-job-product-audit`, `gate-i5-8-empleos-autos-viajes-route-drift-selftest` | FAIL — reproduced identically on pristine HEAD; files not touched here |
| Out-of-scope families (Servicios, Restaurantes, Dealer, BR Negocio, Viajes, Iglesias, Recursos, Ofertas) | no file touched (verifier §2 protected-path scan) |
