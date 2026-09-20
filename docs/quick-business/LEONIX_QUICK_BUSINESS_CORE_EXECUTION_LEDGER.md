# LEONIX QUICK BUSINESS CORE — EXECUTION LEDGER (build mission + Dealer/Bienes closeout, 2026-09-20)

Branch `claude/quick-business-core-build-2026-09` (from certified Quick Classifieds HEAD `7555fb6456dff1797a7ca8d5716f99abdc511cce`; `origin/main` `fd9094994aa2a63fdcea49f24b2435300a7b49a4`, never merged).
Statuses are SOURCE-level only. No runtime / browser / human proof is claimed here (deferred to the integration gate and owner QA).

Allowed status: `BUILT_PROOF_PENDING` · `PROVEN_SOURCE` · `BLOCKED_EXISTING_CONTRACT` · `REPAIR_REQUIRED`.

Closeout evidence (commit after `426deab168dcb0aeecd2bf0429272b3ca4b52a55`): `QB1` re-run OK with the Dealer / Bienes assertions (§1 four live, §2 wiring + canonical destinations + gate-before-store for both, §3 vehicle / property media shape + truthful media wording, §4 four adapters, §7 vehicle fields only in the Dealer adapter / property fields only in the Bienes adapter, no bundled inventory, no fabricated facts) · `TSC-SCOPED-2` = `tsc --noEmit` over the closeout tree (16 Quick Business files in the program, 0 errors) · `LINT-2` clean · focused Dealer / Bienes / Servicios / Restaurantes / Revenue OS verifiers listed in the closeout run table at the end.

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
| QUICK ROUTE | `/publicar/negocio-rapido/autos-dealer` → `autosDealerQuickBusinessAdapter.ts` ("Tu negocio + tu primer vehículo" / "Your dealership + your first vehicle") |
| QUESTION COUNT | 16 visible (7 dealership · 9 first vehicle) — MATRIX §6 |
| REQUIRED FIELD COUNT | 7 + ≥ 1 contact (business name, city, ZIP, year, make, model, price) + ≥ 1 real vehicle photo — canonical `getAutosPreviewCompletenessIssues("negocios")` keys media / title / price / location / dealerIdentity all satisfied from customer answers |
| FIELD WIRING | QB1 §2: 16/16 declared keys read, 0 phantom reads, 22 canonical destination strings asserted |
| MEDIA | `mediaImages: MediaImageEntry[]` (`sourceType: "file"`, first = primary) + `heroImages` — the existing VEHICLE media shape; wording "foto real del vehículo" (registry `mediaIntro` + `media.note`, QB1 §1 label guard); uploaded by the existing preview's `resolveAutosDraftPhotosForPublish` |
| CANONICAL DRAFT | `AutosNegociosDraftV1` via `saveAutosNegociosDraftResolved(ns, …)` + `rememberAutosDraftNamespaceHint("negocios", ns)` — identical write to the Full flush (`useAutoDealerDraft.ts:388-428`) |
| VALIDATOR | `getAutosPreviewCompletenessIssues("negocios", listing)` runs BEFORE the store write (QB1 §2 regex) |
| PREVIEW | existing `/clasificados/autos/negocios/preview` (`loadAutosNegociosCanonicalActiveDraft` → mode `draft`) |
| PAYMENT | existing `AUTOS_DEALER_CHECKOUT` → `autos_dealer_monthly` (server price); one vehicle ⇒ no inventory-pack add-on — MATRIX §5 |
| PUBLIC / ROW | existing `POST /api/clasificados/autos/listings` lane `negocios` → `autos_dealer_activate_listing` → `promoteNegociosMainInventoryListing`: the first vehicle IS the canonical main row (`inventory_role = main`, `dealer_inventory_group_id = row.id`) → `/clasificados/autos/vehiculo/[id]` |
| ADMIN / BUSINESS HUB / EDIT / LIFECYCLE | existing — untouched (`/dashboard/mis-anuncios?cat=autos`, `/admin/workspace/clasificados/autos`, unpublish / restore) |
| STRUCTURED SUBSYSTEM PRESERVATION | `additionalInventoryVehicles: []`, no `inventoryBoostSelected` / `inventory_role` / group id / limits in Quick (QB1 §7); VIN optional and never fabricated; mileage / condition / price only from customer input; included count + `+10` pack untouched |
| OWNERSHIP / SECURITY | Quick writes no owner id, calls no API, uploads nothing (QB1 §5); owner = bearer user at the existing preview's pending-row creation |
| FOCUSED VERIFIERS | QB1 §1/§2/§3/§4/§7; `verify-autos-dealer-hours-status-01`, `verify-autos-dealer-gate1-2-…`, `gate3-4-6-7-8-9-…`, `gate10-11-…`, `gate12-16-…`, `gate15-17-…`, `gate-i11a-…`, `gate-i11b-…`, `autos-privado-qa-polish-audit`, `gate-i5-8-bienes-autos-parent-child-action-protection-selftest`, `verify-revenue-os-autos-dealer-inventory-entitlement-parity-01`, `verify-autos-dealer-inventory-addon-parity-01`, `verify-autos-privado-revenue-os-checkout` — all OK |
| STATUS | PROVEN_SOURCE |
| BLOCKER | none (the former BLOCKED_EXISTING_CONTRACT is resolved by the PM decision to ask for the REAL first vehicle) |

## BIENES RAÍCES NEGOCIO / AGENT

| Item | Value |
| --- | --- |
| QUICK ROUTE | `/publicar/negocio-rapido/bienes-negocio` → `bienesNegocioQuickBusinessAdapter.ts` ("Tu perfil + tu primera propiedad" / "Your profile + your first property") |
| QUESTION COUNT | 19 visible on the residencial path (8 profile · 11 property); 17 for comercial / terreno — MATRIX §6 |
| REQUIRED FIELD COUNT | 8 + ≥ 1 contact (name, property category, type for that category, title, price, condition, city) + ≥ 1 real property photo + 4 confirmations — canonical `gateBienesRaicesNegocioPreview` (advertiserType, publicationType, titulo, precio, ciudad, ≥ 1 photo, petsAllowed) satisfied through the canonical mapping |
| FIELD WIRING | QB1 §2: 21/21 declared keys read (conditional selects included), 0 phantom reads, 28 canonical destination strings asserted |
| MEDIA | `fotosDataUrls` + `fotoPortadaIndex: 0` — the existing PROPERTY media shape (cap 40); wording "foto real de la propiedad" (QB1 §1 label guard); IDB offload by the canonical store; `listing-images` upload by the existing publisher |
| CANONICAL DRAFT | `AgenteIndividualResidencialFormState` via `mergePartialAgenteIndividualResidencial` → `persistAgenteResApplicationDraftResolved(state, { applicationInstanceId, writeReturn: true })` on a fresh `createBrAgenteResApplicationInstanceId()`; write verified by `readAgenteResPreviewDraftRawForApplication` |
| VALIDATOR | Full `confirmAll` (4 booleans) + `gateBienesRaicesNegocioPreview(mapAgenteResidencialFormStateToNegocioForPublish(state))` run BEFORE the store write (QB1 §2 regex) |
| PREVIEW | existing `…/negocio/agente-individual/preview?applicationInstanceId=…` (`ensureBrAgenteResApplicationInstanceId(searchParams)` → `loadAgenteResPreviewDraftResolved`) |
| PAYMENT | existing `BIENES_RAICES_NEGOCIO_CHECKOUT` → `br_agent_monthly` (server price); no children ⇒ no `br_inventory_pack_monthly` add-on — MATRIX §5 |
| PUBLIC / ROW | existing `publishLeonixListingFromAgenteResidencialDraft` (`activationMode: "pending_payment"`) → `publishLeonixRealEstateListingCore` (owner from `auth.getUser()`) → BR lifecycle activation → `/clasificados/anuncio/[id]`; the first property is the parent row under the existing included allowance |
| ADMIN / BUSINESS HUB / EDIT / LIFECYCLE | existing — untouched (`/dashboard/mis-anuncios?cat=bienes-raices`, `/admin/workspace/clasificados/bienes-raices`, pause / resume / discontinue / republish) |
| STRUCTURED SUBSYSTEM PRESERVATION | no `additionalInventoryProperties` / `inventoryPackAccepted` / inventory context in Quick (QB1 §7); license, brokerage, beds, baths, sqft, address, amenities never fabricated; condition ASKED (canonical default would otherwise render); `petsAllowed` and listing status are the canonical mapping's own behavior; included allowance + `+3` pack + FSBO untouched |
| OWNERSHIP / SECURITY | Quick writes no owner id, calls no API, uploads nothing (QB1 §5); owner resolved by the existing publisher at the preview |
| FOCUSED VERIFIERS | QB1 §1/§2/§3/§4/§7; `verify-bienes-negocio-gate1-identity`, `gate2-discovery`, `gate-p2-bienes-negocio-preview-edit-selftest`, `gate-i5-7a1-…`, `br-inv-wave1-gate1-2-4-5-selftest`, `br-inv-d1-…`, `gate-g2-2-…`, `gate-g2-3-1-…`, `br-draft-persist-01-audit`, `verify-bienes-application-pricing-checkpoints-inventory-pack-01`, `verify-bienes-agent-inventory-bundle-pending-row-creation-01`, `verify-stripe-revenue-os-bienes-raices-negocio-wiring-01` — all OK (pre-existing failures classified in the closeout run table) |
| STATUS | PROVEN_SOURCE |
| BLOCKER | none (the former BLOCKED_EXISTING_CONTRACT is resolved by the PM decision to ask for the REAL first property) |

## SHARED QUICK BUSINESS LAYER

| Item | Value |
| --- | --- |
| Files | `app/lib/quickBusiness/{quickBusinessTypes,quickBusinessRegistry,quickBusinessRoutes,quickBusinessCopy}.ts` · `app/(site)/publicar/negocio-rapido/{page,[category]/page}.tsx` · `_components/{QuickBusinessChooser,QuickBusinessIntakeClient,QuickBusinessReviewStep}.tsx`, `_components/quickBusinessDraftStore.ts` · `_adapters/{quickBusinessAdapterShared,serviciosQuickBusinessAdapter,restaurantesQuickBusinessAdapter,autosDealerQuickBusinessAdapter,bienesNegocioQuickBusinessAdapter,index}.ts` |
| Reused certified primitives (unmodified) | `QuickFieldRenderer`, `QuickMediaStep`, `QuickShell`, pure validation, framework types, shared ES/EN copy, `cityField` / `resolveCity`, existing `ListingRulesConfirmationSection subject="servicios"` and `subject="property"`, existing `brAgenteApplicationPricingCopy().confirmPayment` copy |
| Interaction contract | identical to the certified intake: raw keystrokes, one-key spread patches, Back/Next move only `stepIndex`, tab-scoped persistence (sessionStorage + heavy-media IndexedDB), prefills never overwrite typed text, normalization only in adapters (`quickStr`, `splitFreeTextList`, `readBusinessHours`) |
| Certified Quick Classifieds tree | byte-identical to `7555fb64` (`app/(site)/publicar/rapido`, `app/lib/quickClassifieds`) — QB1 §7; V1/V2/V3 OK |
| STATUS | PROVEN_SOURCE |

## STAFF PWA

| Item | Value |
| --- | --- |
| Change | additive "Negocios Rápidos / Quick Business" section inside the existing `QuickApplicationsLaunchpad` (below the classifieds grids, above the footer): Send business link · Manage business (existing classifieds queue) · four priority cards (Servicios, Restaurantes, Autos Dealer, Bienes) with Open / Copy / Share; Full Business Profile stays the header verb |
| Custody truth | Servicios card states the existing Create-for-Client save/publish-for-client capability; Restaurantes / Dealer / Bienes say the customer signs in and publishes in their own name; every business card carries "Crear negocio rápido con el cliente" (Quick form) + Copy / Share (Quick link) + an "Aplicación completa / Full application" link to the EXISTING application (closeout: Dealer / Bienes no longer present as direct) |
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

## Closeout validation run (Dealer + Bienes, same day)

| Check | Result | Classification |
| --- | --- | --- |
| `verify-quick-business-core-01` (Dealer / Bienes assertions added; self-test retained) | OK | — |
| `verify-quick-classifieds-onramp-01` / `-interaction-02` / `-proof-matrix-03` | OK / OK / OK | — |
| 8 guards (`gate-i5-2-publish-gateway-selftest`, `verify-bilingual-staff-experience-01`, `verify-concierge-assisted-publishing-01`, `verify-p0-final-assisted-publishing-bridge-01`, `verify-p0-sales-ad-creation-flow-01`, `verify-p0-staff-assisted-category-access-01`, `verify-staff-command-center-gate1-01`, `verify-staff-operating-system-01`) | OK ×8 | — |
| Dealer: `verify-autos-dealer-hours-status-01`, `verify-autos-dealer-gate1-2-unified-media-gallery`, `…gate3-4-6-7-8-9-edit-save`, `…gate10-11-webhook-child-resume`, `…gate12-16-parity-and-regression`, `…gate15-17-status-truth-capacity-display`, `gate-i11a-autos-listing-edit-media-isolation-selftest`, `gate-i11b-autos-draft-upload-session-security-selftest`, `autos-privado-qa-polish-audit`, `gate-i5-8-bienes-autos-parent-child-action-protection-selftest` | OK ×10 | — |
| Dealer / Revenue OS: `verify-revenue-os-autos-dealer-inventory-entitlement-parity-01`, `verify-autos-dealer-inventory-addon-parity-01`, `verify-autos-privado-revenue-os-checkout` | OK ×3 | — |
| `autos-a5-1-negocios-draft-preview-persistence-audit` ("Must save before preview navigation") | FAIL | PREEXISTING — identical failure at `426deab1` with the closeout stashed; reads Full autos files untouched here |
| `autos-final-only-negocios-privado-readiness-audit` ("Negocios VIN decode required") | FAIL | PREEXISTING — identical at `426deab1`; Full autos files untouched |
| `autos-a5-qa-07-application-persistence-inventory-truth-audit` (missing copy "Varias URLs de imágenes…") | FAIL | PREEXISTING — identical at `426deab1`; Full autos copy untouched |
| `autos-a5-0-negocios-missing-publish-blockers-audit` ("changed file outside allowed scope: …negocio-rapido/…") | FAIL while uncommitted | STALE — a mission-scope lock over the UNCOMMITTED change set of an old Autos mission (`assertUnrelatedScope`); passes on a clean tree (OK at `426deab1`; re-run after the closeout commit recorded in the PM handoff) |
| Bienes: `verify-bienes-negocio-gate1-identity`, `verify-bienes-negocio-gate2-discovery`, `gate-p2-bienes-negocio-preview-edit-selftest`, `gate-i5-7a1-br-negocio-child-edit-preview-selftest`, `br-inv-wave1-gate1-2-4-5-selftest`, `br-inv-d1-parent-hydration-behavioral-selftest`, `gate-g2-2-br-lifecycle-adapter-selftest`, `gate-g2-3-1-br-lifecycle-mutation-selftest`, `br-draft-persist-01-audit` | OK ×9 | — |
| Bienes / Revenue OS: `verify-bienes-application-pricing-checkpoints-inventory-pack-01`, `verify-bienes-agent-inventory-bundle-pending-row-creation-01`, `verify-stripe-revenue-os-bienes-raices-negocio-wiring-01` | OK ×3 | — |
| `bienes-hydration-proof-01-core` ("return draft key saved") | FAIL | PREEXISTING — identical at `426deab1`; `previewDraft.ts` untouched |
| `bienes-active-application-refresh-persistence-audit` (17/18: "No Supabase imports in scoped files") | FAIL | PREEXISTING — identical at `426deab1`; scoped Full files untouched |
| `gate-i5-3a-br-gateway-fix-selftest` ("dashboard BR publish CTA must use BR_PUBLICAR_HUB again") | FAIL | PREEXISTING — identical at `426deab1`; dashboard untouched |
| `verify-revenue-os-br-inventory-pack-fulfillment-and-global-preview-safety-01` ("max children must be 4") | FAIL | STALE / PREEXISTING — identical at `426deab1`; asserts an old allowance constant (`BR_INVENTORY_PACK_MAX_CHILDREN` is 3 in source; allowance not changed here) |
| `verify-bienes-application-instance-isolation-01` ("new application clears memory only") | FAIL | PREEXISTING — identical at `426deab1`; `previewDraft.ts` untouched |
| `verify-bienes-autos-dealer-paid-readiness` ("Bienes agent must not wire onPromoApply…") | FAIL | PREEXISTING — identical at `426deab1`; agente preview untouched |
| Servicios / Restaurantes: `gate-g3-1-restaurantes-lifecycle-adapter-selftest`, `gate-i5-4b-servicios-professional-hours-parity-selftest`, `gate-i5-7e-restaurantes-edit-route-correction-selftest`, `restaurante-preview-readiness-smoke`, `servicios-public-listing-schema-smoke`, `smoke-servicios-edit-route-restaurantes-parity-hard-fix-01`, `smoke-servicios-global-checkout-standard-parity-01` | OK ×7 | — |
| Scoped `tsc --noEmit` (closeout tree, 16 Quick Business files in program) · ESLint on the closeout tree | 0 errors · clean | — |
| Classifieds no-regression: `git diff 7555fb64 HEAD -- "app/(site)/publicar/rapido" app/lib/quickClassifieds` | empty (QB1 §7) | — |
| FEATURE-CAUSED REGRESSIONS | **0** | — |
