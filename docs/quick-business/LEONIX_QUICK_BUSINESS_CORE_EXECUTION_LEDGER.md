# LEONIX QUICK BUSINESS CORE — EXECUTION LEDGER (build mission, 2026-09-20)

Branch `claude/quick-business-core-build-2026-09` (from certified Quick Classifieds HEAD `7555fb6456dff1797a7ca8d5716f99abdc511cce`; `origin/main` `fd9094994aa2a63fdcea49f24b2435300a7b49a4`, never merged).
Statuses are SOURCE-level only. No runtime / browser / human proof is claimed here (deferred to the integration gate and owner QA).

Allowed status: `BUILT_PROOF_PENDING` · `PROVEN_SOURCE` · `BLOCKED_EXISTING_CONTRACT` · `REPAIR_REQUIRED`.

Evidence shorthand: `QB1` = `scripts/verify-quick-business-core-01.ts` (OK) · `V1` = `verify-quick-classifieds-onramp-01` (OK, one documented additive-path exception) · `V2`/`V3` = Quick Classifieds interaction / proof-matrix verifiers (OK) · `GUARDS` = 8 staff/gateway guard verifiers (OK) · `TSC-SCOPED` = `tsc --noEmit` over the 17 new/modified files (126 program files loaded, 0 errors) · `LINT` = `eslint --max-warnings 0` on the new tree (clean; the gateway's pre-existing unused import `replaceLangInHref` is untouched, as in the certified branch) · `MATRIX` = `LEONIX_QUICK_BUSINESS_CORE_ARCHITECTURE_MATRIX.md`.

## SERVICIOS

| Item | Value |
| --- | --- |
| QUICK ROUTE | `/publicar/negocio-rapido/servicios` (under `/publicar/layout.tsx` = `PublishAuthGateLayout`) |
| QUESTION COUNT | 12 visible (type, custom-type when "Otro", name, services chips, other services, about, city, days, opens, closes, phone/WhatsApp/email/website = contact step counts 4) — 3 steps + photos + review |
| REQUIRED FIELD COUNT | 9 canonical-required (type, name, ≥ 1 service, about, city, hours days+times, ≥ 1 contact, ≥ 1 photo, 3 confirmations) |
| FIELD WIRING | QB1 §2: every declared key read by `serviciosQuickBusinessAdapter.buildAndWriteCanonicalDraft`; no phantom read; 18 canonical destination keys asserted by name; detector self-tested |
| MEDIA | ≥ 1 real image (`validateQuickMedia`, review button disabled) → `coverUrl` = first image, `gallery[]` (`GalleryItem{ id, url, source: "file" }`), `featuredGalleryIds` → existing `resolveServiciosDraftMediaToRemoteUrls` inside `saveServiciosPendingBeforeCheckout` (Vercel Blob) at the existing preview checkout |
| CANONICAL DRAFT | `createDefaultClasificadosServiciosState()` + Quick values → `persistServiciosDraftForPreviewNavigation(state)` (same dual write the Full application performs before opening preview) |
| CANONICAL VALIDATOR | `evaluateServiciosPublishReadiness(state, lang)` (readiness labels returned verbatim as issues) |
| PREVIEW | existing `/clasificados/publicar/servicios/preview` (`ClasificadosServiciosPreviewClient` loads the same session draft; `previewReadiness` / `publishReadiness` gates) |
| PAYMENT | existing `servicios_base_monthly` via `SERVICIOS_BASE_CHECKOUT` → `/api/revenue-os/checkout` (server price); Quick shows the amount only through `getRevenuePackagePriceCents` |
| PUBLIC OUTPUT | existing `/clasificados/servicios/[slug]` after payment activation (`revenueServiciosFulfillment.ts`) |
| ADMIN | existing `/admin/workspace/clasificados/servicios` |
| BUSINESS HUB | existing `/dashboard/servicios` (linked from the intake footer and the chooser "manage" row) + Business Hub |
| EDIT | existing listing-edit through `/publicar/servicios` (dashboard) |
| LIFECYCLE | existing pause / resume (`POST /api/clasificados/servicios/manage`), monthly subscription |
| STRUCTURED SUBSYSTEM PRESERVATION | coupons / promotions / credentials / payment methods / amenities untouched and never fabricated (QB1 §7 regex) |
| OWNERSHIP | owner = bearer at the existing publish route; Quick writes no owner id (QB1 §5); assisted save/publish-for-client remains the existing Servicios-only server path (cookie + `business_listing_links`) |
| SECURITY | no auth / privileged / API / storage code in the Quick tree (QB1 §5); no fake image fallback (QB1 §3) |
| FOCUSED VERIFIER | QB1 OK · `servicios-public-listing-schema-smoke` OK · `gate-i5-4b-servicios-professional-hours-parity-selftest` OK · `smoke-servicios-global-checkout-standard-parity-01` OK · `smoke-servicios-edit-route-restaurantes-parity-hard-fix-01` OK · `smoke-servicios-business-presets` FAIL (pre-existing preset icon keyword rule on untouched `businessTypePresets.ts`; its imports ∩ branch diff = ∅) |
| STATUS | PROVEN_SOURCE |
| BLOCKER | none |

## RESTAURANTES

| Item | Value |
| --- | --- |
| QUICK ROUTE | `/publicar/negocio-rapido/restaurantes` |
| QUESTION COUNT | 11 visible (name, type, custom type when "Otro", cuisine, custom cuisine when "Otro", short description, service modes, city, days, opens, closes + contact step 4) |
| REQUIRED FIELD COUNT | 7 canonical-required (name, type, cuisine, city, hours signal, ≥ 1 contact, ≥ 1 photo) |
| FIELD WIRING | QB1 §2: every declared key read by `restaurantesQuickBusinessAdapter`; 16 canonical destination keys asserted |
| MEDIA | ≥ 1 real image → `heroImage` = first, `galleryImages[]` = rest (data URLs accepted by `auditRestaurantePublishReadiness(draft, "draft")`) → existing `restauranteDraftPublishPrepare` upload at the preview checkout (`saveRestaurantePendingBeforeCheckout`) |
| CANONICAL DRAFT | `createEmptyRestauranteDraft()` + Quick values → `saveRestauranteDraftToStorageResolved(draft)` (sessionStorage `restaurantes-draft` + IndexedDB) |
| CANONICAL VALIDATOR | `auditRestaurantePublishReadiness(draft, "draft")` → `missingFields` returned as issues |
| PREVIEW | existing `/clasificados/restaurantes/preview` (`RestaurantePreviewClient` re-audits, checkout checkpoint carries `RESTAURANTES_CHECKPOINT_CONFIRMATIONS`) |
| PAYMENT | existing `restaurantes_base_monthly` via `RESTAURANTES_BASE_CHECKOUT` (server price) |
| PUBLIC OUTPUT | existing `/clasificados/restaurantes/[slug]` (`listing_json` → same `mapRestauranteDraftToShellData` as preview) |
| ADMIN | existing `/admin/workspace/clasificados/restaurantes` |
| BUSINESS HUB | existing `/dashboard/restaurantes` + Business Hub |
| EDIT | existing `/publicar/restaurantes?source=dashboard&mode=listing-edit&listingId=…` |
| LIFECYCLE | existing dashboard pause / resume, monthly subscription |
| STRUCTURED SUBSYSTEM PRESERVATION | menu (link/file/dishes), coupons, flyers, stacks never written (QB1 §7 regex); `productType` = canonical default `established_restaurant` |
| OWNERSHIP | owner server-verified at `restaurantes/publish` ("client-supplied owner_user_id is never trusted") |
| SECURITY | as Servicios (QB1 §3/§5) |
| FOCUSED VERIFIER | QB1 OK · `restaurante-preview-readiness-smoke` OK · `gate-g3-1-restaurantes-lifecycle-adapter-selftest` OK · `gate-i5-7e-restaurantes-edit-route-correction-selftest` OK · `restaurantes-launch-selftest` NOT RUN TO COMPLETION (its DB phase needs `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, absent in this container; imports ∩ branch diff = ∅) |
| STATUS | PROVEN_SOURCE |
| BLOCKER | none |

## AUTOS DEALER

| Item | Value |
| --- | --- |
| QUICK ROUTE | none built — `/publicar/negocio-rapido/autos-dealer` renders the honest "full application" card; chooser + launchpad link `/publicar/autos/negocios` directly |
| QUESTION COUNT | 0 (Quick) — the existing vehicle-first application |
| REQUIRED FIELD COUNT | canonical: vehicle title (year+make+model), price, location, media, dealer identity (`getAutosPreviewCompletenessIssues("negocios")`) |
| FIELD WIRING | n/a (no Quick fields) |
| MEDIA | existing dealer application (real vehicle photos) |
| CANONICAL DRAFT / VALIDATOR / PREVIEW / PAYMENT / PUBLIC | existing (`autos_dealer_monthly`, `/clasificados/autos/negocios/preview`, `/clasificados/autos/vehiculo/[id]`) — untouched |
| ADMIN / BUSINESS HUB / EDIT / LIFECYCLE | existing — untouched |
| STRUCTURED SUBSYSTEM PRESERVATION | VIN / inventory tables / included count / +10 pack / dealer vehicle cards / inventory management untouched; QB1 §7 proves the Quick tree references no vehicle/inventory type or field |
| OWNERSHIP / SECURITY | existing — untouched |
| FOCUSED VERIFIER | QB1 §1 (direct reason `REQUIRES_VEHICLE_INVENTORY`), §7 |
| STATUS | BLOCKED_EXISTING_CONTRACT |
| BLOCKER | The canonical Dealer product cannot publish a dealership without at least one real vehicle: the main row is a vehicle listing (`inventory_role = main`, public route is a vehicle page, API title derived from year/make/model). A profile-only Quick would require fabricated inventory (forbidden). Exact dependency recorded in MATRIX §3-C. |

## BIENES RAÍCES NEGOCIO / AGENT

| Item | Value |
| --- | --- |
| QUICK ROUTE | none built — `/publicar/negocio-rapido/bienes-negocio` renders the honest card; chooser + launchpad link `/publicar/bienes-raices` (existing selector) directly |
| QUESTION COUNT | 0 (Quick) |
| REQUIRED FIELD COUNT | canonical: advertiserType, publicationType, titulo, precio, ciudad/dirección, ≥ 1 photo, petsAllowed (`gateBienesRaicesNegocioPreview`) — a PROPERTY |
| FIELD WIRING | n/a |
| MEDIA / DRAFT / VALIDATOR / PREVIEW / PAYMENT / PUBLIC | existing (`br_agent_monthly`, agente-individual preview, `/clasificados/anuncio/[id]`) — untouched |
| ADMIN / BUSINESS HUB / EDIT / LIFECYCLE | existing — untouched |
| STRUCTURED SUBSYSTEM PRESERVATION | included active-property allowance / +3 pack / property tables / lifecycle / FSBO / public property cards untouched; QB1 §7 proves the Quick tree references no property field |
| OWNERSHIP / SECURITY | existing — untouched |
| FOCUSED VERIFIER | QB1 §1 (direct reason `REQUIRES_PROPERTY_INVENTORY`), §7 |
| STATUS | BLOCKED_EXISTING_CONTRACT |
| BLOCKER | The canonical agent/business product cannot publish without at least one real property (agent application maps into the negocio publish shape with titulo/precio/photos; public route is a property page). Fabricating a property is forbidden. Exact dependency recorded in MATRIX §3-D. |

## SHARED QUICK BUSINESS LAYER

| Item | Value |
| --- | --- |
| Files | `app/lib/quickBusiness/{quickBusinessTypes,quickBusinessRegistry,quickBusinessRoutes,quickBusinessCopy}.ts` · `app/(site)/publicar/negocio-rapido/{page,[category]/page}.tsx` · `_components/{QuickBusinessChooser,QuickBusinessIntakeClient,QuickBusinessReviewStep}.tsx`, `_components/quickBusinessDraftStore.ts` · `_adapters/{quickBusinessAdapterShared,serviciosQuickBusinessAdapter,restaurantesQuickBusinessAdapter,index}.ts` |
| Reused certified primitives (unmodified) | `QuickFieldRenderer`, `QuickMediaStep`, `QuickShell`, pure validation, framework types, shared ES/EN copy, `cityField` / `resolveCity`, existing `ListingRulesConfirmationSection subject="servicios"` |
| Interaction contract | identical to the certified intake: raw keystrokes, one-key spread patches, Back/Next move only `stepIndex`, tab-scoped persistence (sessionStorage + heavy-media IndexedDB), prefills never overwrite typed text, normalization only in adapters (`quickStr`, `splitFreeTextList`, `readBusinessHours`) |
| Certified Quick Classifieds tree | byte-identical to `7555fb64` (`app/(site)/publicar/rapido`, `app/lib/quickClassifieds`) — QB1 §7; V1/V2/V3 OK |
| STATUS | PROVEN_SOURCE |

## STAFF PWA

| Item | Value |
| --- | --- |
| Change | additive "Negocios Rápidos / Quick Business" section inside the existing `QuickApplicationsLaunchpad` (below the classifieds grids, above the footer): Send business link · Manage business (existing classifieds queue) · four priority cards (Servicios, Restaurantes, Autos Dealer, Bienes) with Open / Copy / Share; Full Business Profile stays the header verb |
| Custody truth | Servicios card states the existing Create-for-Client save/publish-for-client capability; Restaurantes / Dealer / Bienes say the customer publishes in their own name; direct cards say "Abrir aplicación completa" |
| One PWA | `app/manifest.ts` only (QB1 §8, V1 §1) |
| Verifiers | V1 §1, `verify-staff-command-center-gate1-01`, `verify-bilingual-staff-experience-01`, `verify-staff-operating-system-01`, `verify-concierge-assisted-publishing-01`, p0 ×3, `gate-i5-2-publish-gateway-selftest` — all OK |
| STATUS | PROVEN_SOURCE |

## Customer control (Gate 10)

| Category | VIEW / EDIT / MANAGE | PAUSE-END | BILLING | Classification |
| --- | --- | --- | --- | --- |
| Servicios | `/dashboard/servicios` (list, preview, edit via `/publicar/servicios?…`) + Business Hub `/dashboard/business-tools/business/[businessId]` | pause / resume (`/api/clasificados/servicios/manage`) | Stripe subscription via Revenue OS | FUNCTIONAL_EXISTING_DESTINATION (category-specific dashboard; linked from the intake footer + chooser) |
| Restaurantes | `/dashboard/restaurantes` (list, listing-edit, coupon-edit) + Business Hub | pause / resume | subscription | FUNCTIONAL_EXISTING_DESTINATION |
| Autos Dealer | `/dashboard/mis-anuncios?cat=autos` (manage card + inventory sections) | unpublish / restore | subscription + pack | FUNCTIONAL_EXISTING_DESTINATION (generic dashboard; not redesigned) |
| Bienes negocio | `/dashboard/mis-anuncios?cat=bienes-raices` (manage card + inventory drawer) | pause / resume / discontinue | subscription + pack | FUNCTIONAL_EXISTING_DESTINATION |

## Focused validation run (this mission)

| Check | Result |
| --- | --- |
| `verify-quick-business-core-01` (new; self-tested detector) | OK |
| `verify-quick-classifieds-onramp-01` / `-interaction-02` / `-proof-matrix-03` | OK / OK / OK |
| 8 guard verifiers | OK |
| Restaurantes: `restaurante-preview-readiness-smoke`, `gate-g3-1-…lifecycle-adapter`, `gate-i5-7e-…edit-route` | OK |
| Servicios: `servicios-public-listing-schema-smoke`, `gate-i5-4b-…hours-parity`, `smoke-servicios-global-checkout-standard-parity-01`, `smoke-servicios-edit-route-restaurantes-parity-hard-fix-01` | OK |
| `restaurantes-launch-selftest` | needs Supabase service-role env (DB phase) — not runnable here; imports ∩ diff = ∅ |
| `smoke-servicios-business-presets` | FAIL on untouched `businessTypePresets.ts` icon keyword rule — pre-existing (imports ∩ diff = ∅) |
| ESLint (`--max-warnings 0`) on the new tree + both verifiers | clean; gateway keeps its pre-existing unused import |
| Scoped `tsc --noEmit` (17 files, 126 program files) | 0 errors |
| FEATURE-CAUSED REGRESSIONS | 0 |
