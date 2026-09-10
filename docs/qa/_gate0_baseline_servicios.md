# Gate 0 Baseline Audit — Servicios Business Application

Read-only source-code audit of the Servicios classifieds ad-posting flow against 116 requirements
(S-001..S-116). Branch: `fix/business-applications-final-polish-2026-08`.

Entry point: `app/(site)/publicar/servicios/page.tsx` → `ClasificadosServiciosApplication` at
`app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx` (3732 lines),
backed by `app/(site)/clasificados/publicar/servicios/lib/*` and the shared public-profile rendering layer
under `app/(site)/servicios/*` (path-aliased as `@/app/servicios/*`).

Evidence doctrine: TRUE requires exact file:line code proof. UNKNOWN = FALSE. Anything provable only by
live browser interaction (typing/spacebar, hard refresh, Preview↔Edit round trip, visual clipping) is
marked RUNTIME-REQUIRED, never TRUE from source alone.

## Header / shell

| ID | Requirement (short) | Status | Evidence file:line | Notes |
|---|---|---|---|---|
| S-001 | "LEONIX CLASIFICADOS" eyebrow fully visible below fixed header | FALSE | `app/components/Navbar.tsx:341`; `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx:965,967` | Navbar is `fixed top-0 z-50`; page `<main>` only applies `pt-6 sm:pt-8` (24–32px) vs. `pt-24`+ used by sibling flows to clear the same fixed nav — concrete under-clearance. |
| S-002 | Top spacing doesn't clip/crowd title at 100% zoom | FALSE | same as S-001 | Same insufficient clearance risks crowding the `h1` immediately after the eyebrow. |
| S-003 | Title/intro aligned/readable | RUNTIME-REQUIRED | `ClasificadosServiciosApplication.tsx:967-969` | JSX well-formed, no structural defect found; visual readability needs a browser check. |
| S-004 | ES/EN switch accessible | TRUE | `ClasificadosServiciosApplication.tsx:1026-1031` | Real `<Link>` toggling `?lang=es/en` with visible text. |
| S-005 | Steps 1-8 directly clickable when prerequisites allow | TRUE | `ClasificadosServiciosApplication.tsx:1108-1148,280-285` | All step-nav buttons call `goToStep(i)`; no `disabled` attribute present. |
| S-006 | Disabled steps explain why | FALSE | `ClasificadosServiciosApplication.tsx:1108-1148` | No disabled-step concept exists at all, so no explanation is ever rendered. |
| S-007 | Direct step nav preserves draft | TRUE | `ClasificadosServiciosApplication.tsx:280-285` | `goToStep` spreads `...s`, only touches `applicationStepIndex`. |
| S-008 | Back/Next preserves draft | TRUE | `ClasificadosServiciosApplication.tsx:3492-3510,3630-3633` | Both handlers spread state; Next additionally flushes pending custom-input text (not a reset). |

## Business type / presets, custom "Otro servicio"

| ID | Requirement (short) | Status | Evidence file:line | Notes |
|---|---|---|---|---|
| S-009 | Business-type dropdown alphabetical (ES) | FALSE | `ClasificadosServiciosApplication.tsx:1197-1201`; `lib/businessTypePresets.ts:32-1638` | Rendered via `BUSINESS_TYPE_PRESETS.filter().map()` with no `.sort()`; order is category-grouped declaration order, not alphabetical. |
| S-010 | Business-type dropdown alphabetical (EN) | FALSE | same as S-009 | Same unsorted array reused for EN labels; identical non-alphabetical order. |
| S-011 | Sorting doesn't change stored canonical IDs | TRUE | `ClasificadosServiciosApplication.tsx:1198,645-647` | `<option value={p.id}>` stores the stable preset id, independent of display order. |
| S-012 | Every selectable type has a matching preset | TRUE | `ClasificadosServiciosApplication.tsx:1197`; `lib/businessTypePresets.ts:1641-1643` | Dropdown options are generated directly from `BUSINESS_TYPE_PRESETS`; every id has a preset entry by construction. |
| S-013 | Trade presets differ from professional presets | TRUE | `lib/businessTypePresets.ts:34-55` (plomería) vs `:758-792` (abogado) | Fully distinct suggested-services arrays; no shared generic content. |
| S-014 | llantas_neumaticos shows tire-specific services | TRUE | `lib/businessTypePresets.ts:318-337` | Tire sales/installation/balancing/alignment — tire-specific. |
| S-015 | Lawyer preset shows legal content, not tire copy | TRUE | `lib/businessTypePresets.ts:758-792` | Immigration/personal injury/family law/criminal defense — no tire overlap. |
| S-016 | Suggested services change by business type | TRUE | `lib/businessTypePresets.ts:32-1638` | ~50 presets each with a unique `suggestedServices` array. |
| S-017 | "Por qué elegirnos" suggestions change by type | TRUE | `ClasificadosServiciosApplication.tsx:2126-2130`; `lib/businessTypePresets.ts` (`reasonsToChoose` per preset) | Distinct reasons per type confirmed. |
| S-018 | Quick facts change by type | TRUE | `ClasificadosServiciosApplication.tsx:2349-2353` | `preset.quickFacts` differs per type (e.g. "Disponible 24/7" vs "Aceptando pacientes nuevos"). |
| S-019 | CTA choices fit profession/trade | FALSE | `lib/clasificadosServiciosApplicationTypes.ts:230-233`; `lib/presetStateMerge.ts:8,31-32` | `primaryCtaId`/`secondaryCtaIds` are `@deprecated`; per-type `primaryCtaOptions`/`secondaryCtaOptions` in presets are defined but never referenced/rendered anywhere (dead data) — shell uses a fixed contact priority instead. |
| S-020 | Weak/generic presets improved, not silently falling back | TRUE | `lib/businessTypePresets.ts` (full file) | No empty/TODO/placeholder preset entries found across all ~50 types. |
| S-021 | Selection survives hard refresh | RUNTIME-REQUIRED | `lib/clasificadosServiciosStorage.ts:12,37-73` | Persistence (sessionStorage + legacy localStorage migration) code exists; live restore must be confirmed in-browser. |
| S-022 | "¿No ves tu categoría?" functional or removed | TRUE | `ClasificadosServiciosApplication.tsx:1182-1185,1204-1216` | Actual copy is "¿No encuentras tu categoría?"; selecting `servicio_otro_generico` reveals a real bound "Describe tu servicio" input. |
| S-023 | "Otro servicio" truthful fallback | TRUE | `lib/businessTypePresets.ts:1619-1638`; `lib/presetStateMerge.ts:34` | Honest generic-labeled preset, not mislabeled as another trade; `customServiceDescription` preserved only for this type. |
| S-024 | "Otro servicio" custom input: type/space/backspace/paste/Add/remove/save/refresh/Preview/Edit | PARTIAL — RUNTIME-REQUIRED (typing/refresh/Preview round trip) / TRUE (Add/remove wiring) | `ClasificadosServiciosApplication.tsx:2052-2119`; `lib/serviciosCustomServicesOffered.ts:38-55` | No space-stripping regex found (typing claims remain RUNTIME-REQUIRED); Add appends via `[...prev.customServicesOffered, r.label]`, remove uses index filter — both structurally correct. |

## Address

| ID | Requirement (short) | Status | Evidence file:line | Notes |
|---|---|---|---|---|
| S-025 | Physical-address fields usable | TRUE | `ClasificadosServiciosApplication.tsx:1342-1420` | Street/suite/city/region/country/postal inputs bound to `state.physical*`. |
| S-026 | City canonicalization doesn't break existing free-text city data | TRUE | `app/components/CityAutocomplete.tsx:114-126`; `ClasificadosServiciosApplication.tsx:1251-1259` | `freeText` mode used; canonicalization only runs `!freeText`, so typed text is never rewritten. |
| S-027 | True verified-address UI, real provider, no fake verified state | FALSE | `ClasificadosServiciosApplication.tsx:1347-1417` | Plain `<input>`s with only browser `autoComplete` hints; no geocoding/Places provider wired in, and no `addressVerified`-style flag exists anywhere in the servicios tree — feature is simply absent (not faked, but not implemented). |
| S-028 | Directions/public address use real usable location data | TRUE | `app/(site)/servicios/lib/resolveServiciosProfile.ts:73-90` | `mapsSearchHref` built from the full structured address, not a raw free-text/city-only string. |

## Media — photos & videos

| ID | Requirement (short) | Status | Evidence file:line | Notes |
|---|---|---|---|---|
| S-029 | Max 4 highlighted/featured photos concept exists | TRUE | `ClasificadosServiciosApplication.tsx:826,829,842,862,865`; `ServiciosPublishSortableGallery.tsx:35` | `featuredGalleryIds` capped at 4 throughout add/toggle/reorder handlers. |
| S-030 | Owner can explicitly select which 4 | TRUE | `ServiciosPublishSortableGallery.tsx:107-124`; `ClasificadosServiciosApplication.tsx:857-867` | Star button per tile calls `onToggleFeatured(g.id)`. |
| S-031 | Explicit stable order for the 4 | TRUE | `ServiciosPublishSortableGallery.tsx:33-36`; `ClasificadosServiciosApplication.tsx:857-867` | `featuredGalleryIds` is a persisted ordered array, resynced on drag. |
| S-032 | No numbering defects (1/4,2/4,4/4,3/4) | FALSE | `ServiciosPublishSortableGallery.tsx:82-83,125-129` | Badge index = `featuredGalleryIds.indexOf(g.id)+1` computed against selection order while tiles render in gallery (visual) order — two independently-ordered arrays produce exactly the reported out-of-sequence badge defect until the next drag resync. |
| S-033 | **CRITICAL** — 4 featured photos render in their OWN dedicated section, separate from the rest (edit form) | **FALSE** | `ServiciosPublishSortableGallery.tsx:77-138` | Single `<ul>`/`.map()` over the entire `gallery` array in one grid; featured items are only distinguished by a gold `FiStar` badge overlay — exactly the "single mixed grid with gold stars" the owner complaint describes. No second container exists in the edit form. |
| S-034 | Same requirement, verified across form AND preview | FALSE on form, TRUE on preview (diverges) | Form: `ServiciosPublishSortableGallery.tsx:77-138` (fails). Preview: `preview/ServiciosProfessionalPreviewShell.tsx:171,184`; `app/(site)/servicios/components/ServiciosVisualProofRow.tsx:21,52-111`; `ServiciosGalleryWithTabs.tsx` | The public/preview side genuinely has two separate sections (`ServiciosVisualProofRow` = featured-only "quick visual preview", fully separate from the full-gallery tabs component) — but the **editing** UI (what the owner interacts with) still fails S-033. |
| S-035 | Existing images hydrate without re-upload | TRUE | `lib/serviciosPublishedToApplicationDraft.ts:171-183`; `lib/serviciosDraftPublishPrepare.ts:180` | Existing gallery entries mapped as `source:"url"`; publish-prep skips upload when already a publishable remote URL. |
| S-036 | Existing media survives hard refresh | RUNTIME-REQUIRED | `lib/clasificadosServiciosDraftMediaIdb.ts` (whole file); `lib/clasificadosServiciosDraftMedia.ts:102-183` | IndexedDB-backed persistence exists structurally; live hard-refresh behavior needs browser confirmation. |
| S-037 | Video limit is 8 (not 4) | TRUE | `lib/clasificadosServiciosApplicationTypes.ts:65`; `app/(site)/servicios/lib/serviciosGalleryVideoCaps.ts:4` | `SERVICIOS_MAX_VIDEO_URLS = 8`, mirrored by `MAX_SERVICIOS_PUBLIC_GALLERY_VIDEOS = 8`. |
| S-038 | Copy/validation reflects 8 videos | **FALSE** | `lib/clasificadosServiciosApplicationCopy.ts:542,544,852,854` | `videosCountLine: "{n} / 4 videos agregados"` and `videosLimitHint: "Límite de 4 videos alcanzado."` (and EN equivalents) are hardcoded to the stale "4" even though the enforced cap is 8 — visible user-facing copy mismatch. |
| S-039 | Preview/public gallery doesn't truncate to stale 4-video logic | TRUE | `lib/clasificadosServiciosPreviewHandoff.ts:20-21`; `serviciosGalleryVideoCaps.ts:4` | Preview/public paths both cap at 8, no stray `.slice(0,4)` found near video code. |
| S-040 | Photos stay visually more important than videos | RUNTIME-REQUIRED | `app/(site)/servicios/components/ServiciosVisualProofRow.tsx` (photos-only, first section); `ServiciosGalleryWithTabs.tsx:82-84,153,169,181,234-255` | Photos get an exclusive top section and default tab (favors photos), but combined-layout video tiles can use fewer grid columns (larger tiles) — mixed signal, needs on-screen confirmation. |
| S-041 | Photo upload/accepted status truthful | TRUE | `ClasificadosServiciosApplication.tsx:795-807`; `ServiciosPublishSortableGallery.tsx:101-103` | "Accepted" badge only renders for items already pushed into `gallery`, after `readFileAsDataUrl` resolves. |
| S-042 | Video upload/status truthful (Mux "ready" not faked) | TRUE | `lib/serviciosMuxVideoClient.ts:119-205` | Real XHR PUT + polling `/api/mux/upload-status`; resolves `ok:true` only once `muxStatus === "ready"`; explicit `ok:false` on error/timeout. |

## About / services / highlights

| ID | Requirement (short) | Status | Evidence file:line | Notes |
|---|---|---|---|---|
| S-043 | Preserve About Us | TRUE | `ClasificadosServiciosApplication.tsx:1984-1989`; `lib/clasificadosServiciosApplicationCopy.ts:393` | `aboutText` field wired to a textarea. |
| S-044 | Preserve slogan | TRUE | `ClasificadosServiciosApplication.tsx:1990-1997`; `lib/clasificadosServiciosApplicationCopy.ts:394` | Ships as `businessFocus` label bound to `state.specialtiesLine`. |
| S-045 | Remove fake AI-helper wording if none exists | TRUE | Grep of servicios tree: only hit `lib/serviciosPublishSuccessCopy.ts:66` ("nuestro asistente de seguridad") | Unrelated moderation notice, not an AI content-generation claim; nothing to remove — trivially satisfied. |
| S-046 | Suggested services type-specific | TRUE | `lib/businessTypePresets.ts:39-45` vs `:1034-1036` | Plomería vs tutoría arrays fully distinct. |
| S-047 | Multiple custom services addable without overwrite | TRUE | `ClasificadosServiciosApplication.tsx:2069-2079` | `customServicesOffered: [...prev.customServicesOffered, r.label]` — appends, doesn't replace. |
| S-048 | Duplicates prevented/handled | TRUE | `lib/serviciosCustomServicesOffered.ts:48-53` | Case/accent-insensitive dedupe against existing customs and preset labels before add. |
| S-049 | "Por qué elegirte" uses better horizontal space (~3x2/3x3 grid) | **FALSE** | `ClasificadosServiciosApplication.tsx:2129` | Markup is `flex gap-2 overflow-x-auto ... sm:flex-wrap` — a horizontally-scrolling/flex-wrap chip strip, no `grid-cols-*` layout at all. |
| S-050 | Avoid orphaned tiny chips | RUNTIME-REQUIRED | `ClasificadosServiciosApplication.tsx:2129,2238` | Same flex-wrap markup as S-049; visual outcome needs live check. |
| S-051 | Selection caps only where real downstream capacity requires | FALSE | `lib/serviciosSelectionCaps.ts:36-41`; `lib/serviciosHighlightCaps.ts:1-4` | Caps (`MAX_SERVICES_SELECTION=24`, `MAX_REASONS_SELECTION=6`, `MAX_QUICK_FACTS_SELECTION=5`, etc.) are commented as "generous"/"headroom" round numbers with no reference to any real display-slot limit. |
| S-052 | Grid responsiveness across breakpoints | FALSE | grep for `grid-cols` in `ClasificadosServiciosApplication.tsx` shows matches only in basic-info/coupons sections, none in the reasons/highlights/quick-facts sections (~2126-2458) | No `sm:/md:/lg:grid-cols-*` classes in the chip sections; flex/flex-wrap only. |
| S-053 | Helper examples generic, not tire-specific for unrelated types | TRUE | `lib/clasificadosServiciosApplicationCopy.ts:467,470,488` | Static, generic placeholders ("marcos a medida", "Consulta gratis", "Financiamiento disponible"); no hardcoded tire examples found. |

## Quick Facts — CRITICAL OWNER COMPLAINT

| ID | Requirement (short) | Status | Evidence file:line | Notes |
|---|---|---|---|---|
| S-054 | Quick Facts NOT artificially limited to 2 | TRUE | `lib/serviciosSelectionCaps.ts:41` | `MAX_QUICK_FACTS_SELECTION = 5` — allows 5 preset picks, not 2. |
| S-055 | **CRITICAL** — multiple custom Quick Facts addable | **FALSE** | `lib/clasificadosServiciosApplicationTypes.ts:213-215`; render at `ClasificadosServiciosApplication.tsx:2372-2387` | `customQuickFactLabel: string` / `customQuickFactIncluded: boolean` are **singular fields, not an array**. Render is a single conditional chip (`{state.customQuickFactIncluded && ... ? <Chip>...` ), not a `.map()` over a list. The data shape structurally cannot hold more than one custom quick fact — exactly the "one lonely custom slot" owner complaint. |
| S-056 | New custom Quick Fact creates a separate chip | **FALSE** | `ClasificadosServiciosApplication.tsx:2437-2452` | Add handler sets the single `customQuickFactLabel` field; no array push exists, so a "new" fact cannot create an additional chip. |
| S-057 | Adding a 2nd doesn't overwrite the 1st | **FALSE** | `ClasificadosServiciosApplication.tsx:2447-2451` | `customQuickFactLabel: t.slice(...)` directly replaces the single string field — typing a 2nd custom quick fact literally overwrites/discards the 1st. |
| S-058 | Survives save/refresh/Preview/Edit | RUNTIME-REQUIRED | `lib/clasificadosServiciosApplicationNormalize.ts:315-319`; `lib/buildServiciosPublishPayload.ts:123`; `lib/mapClasificadosServiciosApplicationToServiciosDraft.ts:151-158` | Serialization code preserves the one existing custom field; live round-trip needs browser confirmation (and is moot since only one slot exists at all). |
| S-059 | Preview reads/displays quick facts end-to-end | TRUE (wiring only) | `lib/mapClasificadosServiciosApplicationToServiciosDraft.ts:140-158,418` | Both preset-selected facts and the one custom fact are combined into `draft.quickFacts` for Preview. |
| S-060 | Avoid duplicating facts shown elsewhere | **FALSE** | `lib/serviciosContactVisibility.ts:8-12` | The only "duplicate" safeguard is a hardcoded junk-placeholder filter (`isJunkServiciosQuickFactLabel`); no cross-reference exists against amenities/services labels. |

## Options & Facilities — 5-group custom inputs — CRITICAL OWNER COMPLAINT

| ID | Requirement (short) | Status | Evidence file:line | Notes |
|---|---|---|---|---|
| S-061 | "Servicio" group gets its OWN custom input + Add | **FALSE** | `ClasificadosServiciosApplication.tsx:2580-2613` (group render, chips only, no per-group input); `:2615-2650` (single shared input+button) | Only one generic "Otra opción o facilidad" input exists after all 5 groups, bound to one flat `state.customAmenityOptions` array. |
| S-062 | "Disponibilidad" group gets its OWN custom input + Add | **FALSE** | same as S-061 | Same single shared block serves every group. |
| S-063 | "Clientes que atiende" group gets its OWN custom input + Add | **FALSE** | same as S-061 | No dedicated input/Add exists for this group. |
| S-064 | "Accesibilidad e idiomas" group gets its OWN custom input + Add | **FALSE** | same as S-061 | No dedicated input/Add exists for this group. |
| S-065 | "Descuentos y beneficios" group gets its OWN custom input + Add | **FALSE** | same as S-061 | No dedicated input/Add exists for this group. |
| S-066 | Existing legacy generic custom values preserved non-destructively | TRUE | `lib/clasificadosServiciosApplicationNormalize.ts:305-308` | Old `customAmenityOptions` array-filtered/passed through, no data dropped. |
| S-067 | Each group supports multiple custom entries | **FALSE** | `app/(site)/servicios/lib/serviciosAmenitiesCatalog.ts:45` (`MAX_CUSTOM_SERVICIOS_AMENITY_OPTIONS=24` global); `ClasificadosServiciosApplication.tsx:2615-2650` | Cap/storage is global/flat across all 5 groups combined — there is no per-group concept at all. |
| S-068 | Spacebar works in the custom input | RUNTIME-REQUIRED | `ClasificadosServiciosApplication.tsx:2622-2627` | No space-stripping found in code; only one generic input exists (not "every group"). |
| S-069 | Backspace/paste work in the custom input | RUNTIME-REQUIRED | `ClasificadosServiciosApplication.tsx:2617-2627` | Plain controlled input, no blocking logic found; live confirmation required. |
| S-070 | Add works in every group's custom input | **FALSE** | `ClasificadosServiciosApplication.tsx:2629-2650` | Only one shared Add handler exists; there is no "every group" input to wire. |
| S-071 | Remove works in every group's custom input | **FALSE** | `ClasificadosServiciosApplication.tsx:2660-2673` | Only one shared remove/filter exists on the single flat list. |

## Service areas

| ID | Requirement (short) | Status | Evidence file:line | Notes |
|---|---|---|---|---|
| S-072 | Multiple service areas addable | TRUE | `ClasificadosServiciosApplication.tsx:713-722` | `addServiceArea` appends to array, no cap, duplicate-guard only. |
| S-073 | Structured chips/entries, not ambiguous comma-parsing | **FALSE** | `ClasificadosServiciosApplication.tsx:709,717,726`; `lib/mapClasificadosServiciosApplicationToServiciosDraft.ts:217-220` | Comma is still an active delimiter in both the editor and the published-draft mapping — an area label containing a comma (e.g. "San Jose, CA") splits into two chips. |
| S-074 | Independently removable | TRUE | `ClasificadosServiciosApplication.tsx:724-729` | Index-based `removeServiceAreaAt`. |
| S-075 | Existing legacy service-area text/list hydrates | TRUE | `ClasificadosServiciosApplication.tsx:703-709`; `lib/clasificadosServiciosApplicationNormalize.ts:335` | Explicit legacy comma/newline-split compatibility documented and preserved. |
| S-076 | Broader service-radius description still possible | TRUE | `lib/clasificadosServiciosApplicationCopy.ts:556,866` | Free-text field explicitly inviting neighborhood/county/radius description. |

## Languages / hours / contact

| ID | Requirement (short) | Status | Evidence file:line | Notes |
|---|---|---|---|---|
| S-077 | Servicios consumes the shared language standard | TRUE | `ClasificadosServiciosApplication.tsx:20`; `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx:25` | Both flows import the identical `LanguagesInput` shared component. |
| S-078 | >3 languages allowed where layout permits | TRUE | `ClasificadosServiciosApplication.tsx:1658-1676`; `app/components/forms/LanguagesInput.tsx:29-33,63-64,86` | No `customValuesMax` cap passed; chip list is `flex flex-wrap`, no hard visual limit. |
| S-079 | Custom languages work with spacebar/Add/remove | RUNTIME-REQUIRED (typing) / TRUE (wiring) | `ClasificadosServiciosApplication.tsx:685-701,1667-1668` | Add/remove wiring structurally correct; live typing needs browser confirmation. |
| S-080 | Servicios consumes the stronger Restaurant-style hours UX | TRUE | `ClasificadosServiciosApplication.tsx:21`; `RestauranteApplicationClient.tsx:26`; `app/components/forms/HoursEditor.tsx:4-7` | Same shared `HoursEditor` component, explicitly "generalized from Restaurantes' working day-row hours editor". |
| S-081 | Closed toggle works | TRUE | `app/components/forms/HoursEditor.tsx:50-59`; `ClasificadosServiciosApplication.tsx:938-939` | Checkbox wired to `schedule.closed` end-to-end. |
| S-082 | Special hours available | **FALSE** | `ClasificadosServiciosApplication.tsx:2915-2920` (no `specialHoursNote` prop passed); contrast `RestauranteApplicationClient.tsx:1362-1364` (passes it) | Shared component supports special hours, but Servicios never wires the prop in — zero matches for `specialHoursNote`/`specialHours` in the servicios tree. |
| S-083 | "Hoy/Open today until…" truth computable | TRUE (partial) | `lib/mapClasificadosServiciosApplicationToServiciosDraft.ts:233-244` | Real `new Date().getDay()`-based computation of today's hours/"Closed"; does not compute a live "until HH:MM" countdown, only today's range. |
| S-084 | Primary phone correct | TRUE | `lib/serviciosPhoneUi.ts:15-21,26-29` | Sound 10-digit US formatting/validation wired to `state.phone`. |
| S-085 | WhatsApp international-safe | **FALSE** | `lib/serviciosPhoneUi.ts:11-14` (comment: "Does not prepend country codes"); `ClasificadosServiciosApplication.tsx:1456-1457` | WhatsApp field reuses the US-only 10-digit formatter with no country-code handling. |
| S-086 | Correo uses rich shared modal | **FALSE** | grep: `Gate12cContactChannelsFields` 0 matches in servicios; `ClasificadosServiciosApplication.tsx:1493-1503` | Email is a bare `<input type="email">`; the shared "Gate12c" contact-channels component (which itself has no email field) is not used. |
| S-087 | Website/directions/booking use exact stored destinations | **FALSE** | `lib/socialAndUrlHelpers.ts:1-8`; `lib/mapClasificadosServiciosApplicationToServiciosDraft.ts:258-260`; `lib/serviciosContactVisibility.ts:56` | Website is scheme-normalized (non-lossy, but not "exact"); "directions" is just an address-based contact label, not a stored destination URL; no booking field/feature exists anywhere in servicios to evaluate. |

## Payments / reviews / trust

| ID | Requirement (short) | Status | Evidence file:line | Notes |
|---|---|---|---|---|
| S-088 | Payment methods plentiful for real service businesses | TRUE | `app/(site)/servicios/lib/serviciosPaymentMethodCatalog.ts:18-31` | 12 standard methods: cash, credit/debit card, check, Zelle, Venmo, Cash App, PayPal, bank transfer, financing available, payment plans, deposit required, invoice available. |
| S-089 | Recognizable provider logos (e.g. Affirm) available | **FALSE** | `app/(site)/servicios/lib/serviciosPaymentChipVisual.ts:23-52,81` | The 12 *standard* selectable methods only render emoji or a few brand pills (Zelle/Venmo/CashApp/PayPal); "Affirm" brand rendering only triggers if a user manually **types** the literal word "Affirm" into the custom-payment free-text field (line 81) — it is not one of the offered standard chips, so it isn't proactively "available". |
| S-090 | Payment selections persist | TRUE | `ClasificadosServiciosApplication.tsx:2478-2503`; normalize function reads `paymentMethodIds`/`customPaymentMethods` back | Standard + custom selections both array-based and normalized on load. |
| S-091 | Review submission doesn't fail with opaque unexplained HTTP 400 | TRUE | `app/api/clasificados/servicios/review/route.ts:9-33,57-68` | Every 400 branch (`invalid_slug`,`invalid_rating`,`invalid_author`,`invalid_body`) returns a specific localized `message`; code comment explicitly documents this was fixed so a 400 "now says exactly why instead of a bare error code". |
| S-092 | Validation feedback actionable | TRUE | `app/(site)/servicios/components/ServiciosReviewSubmitForm.tsx:56-64` | Client reads `j.message` from the API response and displays it via `errorMessage` state, not a generic error. |
| S-093 | Google/Yelp external sources present | TRUE | `ClasificadosServiciosApplication.tsx:660-662,1564-1581` | Real `googleBusinessUrl`/`googleReviewsUrl`/`yelpReviewsUrl` fields with URL validation, rendered as real outbound links downstream. |
| S-094 | Leonix trust uses lion + real counts | **FALSE** | `app/(site)/servicios/components/ServiciosTrustSection.tsx:1-29`; `ServiciosSmartTrustSummary.tsx:1-25` | No "lion" mascot/icon exists anywhere in the servicios component tree (grep confirms zero matches); trust sections use shield/star/clock/heart icons only. No lion-branded trust badge with real counts was found. |
| S-095 | Google/Yelp quick-view/drawer explicitly resolved (implemented or deferred) | FALSE | `ClasificadosServiciosApplication.tsx:1564-1581`; repo-wide grep for a Google/Yelp drawer/quick-view component in the servicios tree returns no matches | Only raw outbound URL fields exist; no quick-view/drawer UI for Google/Yelp reviews was found, and no copy anywhere states the idea was deliberately deferred — it appears silently dropped rather than explicitly resolved. |

## Coupons / flyer

| ID | Requirement (short) | Status | Evidence file:line | Notes |
|---|---|---|---|---|
| S-096 | **CRITICAL** — coupons/offers included in $399, no active +$99 path | **TRUE** (current code; contradicts a stale audit doc) | `ClasificadosServiciosApplication.tsx:3333-3338` ("Included with your plan" / "No extra cost"); `:3358-3363` (`couponsAddOn: true, couponsMonthlyPrice: 0`); `:3438` (addon price line only renders if `couponsMonthlyPrice > 0`, never true); `:3286-3323` (dashboard-edit path explicitly "no Stripe checkout") | The repo also contains `lib/SERVICIOS_COUPON_RESTAURANTE_PARITY_AUDIT.md`, a **stale** historical audit describing a "+$99/month" decision card — that description does **not** match the current code, which sets the coupon price to `0` and shows "included" copy throughout. A dead unused fallback string at line 259 still contains literal "+$99/month" text but is never rendered (no call site references `couponDecisionBody`). |
| S-097 | Existing coupon title/description/code/expiration/instructions hydrate | TRUE | `lib/clasificadosServiciosApplicationNormalize.ts:115-139` | All coupon row fields explicitly parsed/defaulted from stored data on load. |
| S-098 | Flyer asset separate from external "more offers" URL | TRUE | `app/(site)/servicios/components/ServiciosCouponsCard.tsx:104-219` | `couponFlyer.imageUrl` and `couponMoreOffers.url` are distinct props rendered as two separate CTA buttons. |
| S-099 | Flyer opens in canonical Leonix viewer | **FALSE** | `ServiciosCouponsCard.tsx:196-207` vs `:37-49,119-121,144-158` | Individual coupon images open in the component's own in-page lightbox (`onImageOpen`/`lightboxSrc`) — the "canonical" viewer used elsewhere on the same page — but the flyer link at 196-207 is a plain `<a href=... target="_blank">` that opens the raw image in a new browser tab, bypassing that same lightbox entirely. |
| S-100 | External "Ver más cupones" is separate outbound action | TRUE | `ServiciosCouponsCard.tsx:208-219` | `couponMoreOffers.url` rendered as its own `target="_blank"` link, distinct from the flyer button. |
| S-101 | Active listing can edit coupons while active without new Stripe purchase | TRUE | `ClasificadosServiciosApplication.tsx:318-359,3286-3323` | `startDashboardOffersAddonCheckout` comment + code: "repurposed... only verifies real capability server-side (no Stripe checkout)", then routes to the offers-edit mode for the same listing. |
| S-102 | No payment gate re-triggers when only editing coupon content on an active listing | TRUE | same as S-101 | Same capability-check-only path confirmed; no checkout call in this branch. |

## Final review / Preview handoff

| ID | Requirement (short) | Status | Evidence file:line | Notes |
|---|---|---|---|---|
| S-103 | Step 8 keeps required confirmations | TRUE | `ClasificadosServiciosApplication.tsx:3408-3417`; `lib/serviciosPublishReadiness.ts:128-134` | `ListingRulesConfirmationSection` renders 3 checkboxes; readiness gate requires all 3 (`confirmListingAccurate`,`confirmPhotosRepresentBusiness`,`confirmCommunityRules`). |
| S-104 | Shows $399/month | TRUE | `ClasificadosServiciosApplication.tsx:413-414,3428-3436` | `baseMonthlyPrice: 399` set on entry, rendered as `${state.baseMonthlyPrice}/mes` in the final pricing summary. |
| S-105 | Shows coupons included | **FALSE** | `ClasificadosServiciosApplication.tsx:3418-3459` (full final-review render read) | The step-7 pricing summary only conditionally shows a "Coupons add-on" line when `couponsMonthlyPrice > 0` (never true, per S-096) — there is no explicit "Coupons: included" line in the final-review copy itself; inclusion is only implied by the absent line, and only stated explicitly back in the step-6 coupon decision card/drawer, not on the final review step. |
| S-106 | One clear Preview CTA, no duplicate | TRUE | `ClasificadosServiciosApplication.tsx:3461-3470` | Exactly one `{copy.previewCta}` button rendered in the step-7 actions block. |
| S-107 | No direct Publish bypass | TRUE | `ClasificadosServiciosApplication.tsx:3392-3487` (full step-7 read); grep confirms no `handlePublish`/publish call on this page | Step 7 only exposes the single Preview button and a "delete draft" link; the only Publish action found in the whole app lives on the Preview page. |
| S-108 | Preview receives same current draft/media | TRUE | `preview/ClasificadosServiciosPreviewClient.tsx:33-40` (`serviciosPublishedToApplicationDraft`, `postServiciosPublishApi` imports); `ClasificadosServiciosApplication.tsx:587` (`goStrictPreview`) | Preview navigation persists/loads the same application-state draft rather than mock/stale data. |
| S-109 | No duplicate Preview CTA anywhere on the final step | TRUE | same as S-106 (full step-7 JSX read, lines 3392-3487) | Confirmed only one Preview trigger exists in the whole step-7 render tree. |
| S-110 | No direct Publish bypass (2nd check — modal/alternate paths) | TRUE (with one caveat) | `components/ServiciosPublishModal.tsx` (whole file); repo-wide grep shows it is imported nowhere | `ServiciosPublishModal.tsx` contains its own `handlePublish`, but the component is **not imported anywhere else in the codebase** — it is orphaned/dead code, unreachable by any user flow, so it does not constitute a live bypass. The only reachable Publish action is in `ClasificadosServiciosPreviewClient.tsx:323-432,699-712`, gated behind Preview. |
| S-111 | Preview page's data-loading mechanism uses current draft/media | TRUE | `preview/ClasificadosServiciosPreviewClient.tsx:40,238-248` | Loads via `serviciosPublishedToApplicationDraft`/session-persisted draft, not a hardcoded/mock profile. |
| S-112 | "Volver a editar" returns to step 8/current final-review state preserving fields/media | RUNTIME-REQUIRED | `preview/ClasificadosServiciosPreviewClient.tsx:131-138` (code comment: "since the saved draft's own `applicationStepIndex` is already 7 ... landing back on this route rehydrates the same draft directly onto the final review step, not step 0" — documents a prior bug, Gate B11, that was fixed) | Source-level wiring targets the same draft/step by design (positive signal), but "preserving every field/media item" on an actual round trip is a live-behavior claim that must be confirmed in-browser per doctrine. |
| S-113 | Preview CTA sizes reduced/normalized while maintaining mobile tap targets | RUNTIME-REQUIRED | `ClasificadosServiciosApplication.tsx:3467` (`min-h-[48px]`) | Confirmed ≥44px mobile tap-target minimum from source; whether the size was specifically "reduced/normalized" is a visual/diff judgment against a prior version, not resolvable from a single source snapshot. |
| S-114 | Unnecessary "Ver todos los destacados"/collapse removed when content cleanly fits | TRUE | `app/(site)/servicios/components/ServiciosPagosBeneficiosSection.tsx:25,39-52,97-106` | Collapse button only renders when `highlightsGroup.items.length >= COLLAPSE_THRESHOLD (14)`; below that threshold all items render with no collapse UI at all — genuinely conditional, not a decorative always-on control. |
| S-115 | "Pagos y beneficios" stays open/visible when content fits | TRUE | `ServiciosPagosBeneficiosSection.tsx:56-109` | The section itself has no accordion/expand-collapse wrapper — only the inner "highlights" sub-group can collapse; the whole section always renders fully open. |
| S-116 | Existing filled Servicios ad requires no refill | RUNTIME-REQUIRED | `ClasificadosServiciosApplication.tsx:420-424` (`editRequested` effect fetches and hydrates existing listing state); `lib/serviciosPublishedToApplicationDraft.ts` (whole file, maps every published field back to draft shape) | Edit-hydration effect and mapping function exist and cover gallery/coupons/etc. (per S-035, S-097) — a positive signal — but full field-by-field "no refill needed" completeness in a live edit session must be confirmed in-browser. |

## Summary counts

- TRUE: 67
- FALSE: 36
- RUNTIME-REQUIRED: 13

(116 total. A few rows carry a mixed source-wiring-vs-live-behavior finding — see Notes — and are counted here under their dominant/most-conservative classification per the evidence doctrine.)
