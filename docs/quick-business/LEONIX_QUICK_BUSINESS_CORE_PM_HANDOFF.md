# LEONIX QUICK BUSINESS CORE — PM HANDOFF (2026-09-20, updated by the Dealer + Bienes closeout)

SOURCE CERTIFIED CLASSIFIEDS SHA: `7555fb6456dff1797a7ca8d5716f99abdc511cce` (branch `claude/quick-classifieds-master-build-0j5p30`, not modified by this mission)
QUICK BUSINESS BRANCH: `claude/quick-business-core-build-2026-09`
START SHA: `7555fb6456dff1797a7ca8d5716f99abdc511cce`
BUILD MISSION SHA: `426deab168dcb0aeecd2bf0429272b3ca4b52a55` (Servicios + Restaurantes live; Dealer + Bienes were BLOCKED_EXISTING_CONTRACT)
CLOSEOUT SHA: the commit that updates this file (`git log -1 -- docs/quick-business/LEONIX_QUICK_BUSINESS_CORE_PM_HANDOFF.md`) — Dealer + Bienes closed out with the customer's REAL first vehicle / first property (PM decision)
ORIGIN MAIN: `fd9094994aa2a63fdcea49f24b2435300a7b49a4` (not merged)

FILES CHANGED (this mission)
- NEW `app/lib/quickBusiness/quickBusinessTypes.ts`, `quickBusinessRegistry.ts`, `quickBusinessRoutes.ts`, `quickBusinessCopy.ts`
- NEW `app/(site)/publicar/negocio-rapido/page.tsx`, `[category]/page.tsx`
- NEW `app/(site)/publicar/negocio-rapido/_components/QuickBusinessChooser.tsx`, `QuickBusinessIntakeClient.tsx`, `QuickBusinessReviewStep.tsx`, `quickBusinessDraftStore.ts`
- NEW `app/(site)/publicar/negocio-rapido/_adapters/quickBusinessAdapterShared.ts`, `serviciosQuickBusinessAdapter.ts`, `restaurantesQuickBusinessAdapter.ts`, `index.ts`
- CLOSEOUT NEW `_adapters/autosDealerQuickBusinessAdapter.ts`, `_adapters/bienesNegocioQuickBusinessAdapter.ts`; CLOSEOUT MODIFIED (Quick tree only) `quickBusinessTypes.ts` (`mediaIntro`, `property_agent` surface, `QuickBusinessConfirmations`), `quickBusinessRegistry.ts` (Dealer / Bienes → live, taglines, truthful media wording, question counts), `quickBusinessCopy.ts` (`firstItemNote`; generic media intro moved per category), `_components/{QuickBusinessIntakeClient,QuickBusinessReviewStep}.tsx`, `_components/quickBusinessDraftStore.ts`, `_adapters/index.ts`, launchpad ("Aplicación completa / Full application" link on business cards), `scripts/verify-quick-business-core-01.ts` (Dealer / Bienes assertions), the three docs
- MODIFIED (additive) `app/admin/(dashboard)/businesses/QuickApplicationsLaunchpad.tsx` (Quick Business section), `app/(site)/publicar/PublicarGatewayClient.tsx` (one "Negocio rápido" link + import)
- MODIFIED `scripts/verify-quick-classifieds-onramp-01.ts` (one documented protected-path exception for the additive `negocio-rapido/` tree — no assertion weakened), `package.json` (one npm script)
- NEW `scripts/verify-quick-business-core-01.ts`
- NEW docs: `LEONIX_QUICK_BUSINESS_CORE_ARCHITECTURE_MATRIX.md`, `LEONIX_QUICK_BUSINESS_CORE_EXECUTION_LEDGER.md`, this handoff
- NOT modified: any canonical application, preview, publisher, renderer, result card, registry, pricing matrix, Revenue OS, Stripe, lifecycle, analytics, admin queue, Business Hub, auth, API route, migration, manifest, or any file under the certified Quick Classifieds tree.

SERVICIOS STATUS: PROVEN_SOURCE — 12-question Quick intake → existing `ClasificadosServiciosApplicationState` (canonical default + normalizer + `evaluateServiciosPublishReadiness`) → `persistServiciosDraftForPreviewNavigation` → existing `/clasificados/publicar/servicios/preview` → existing `servicios_base_monthly` checkout → existing public `/clasificados/servicios/[slug]`; staff save/publish-for-client stays the existing Servicios server path.
RESTAURANTES STATUS: PROVEN_SOURCE — 11-question Quick intake → existing `RestauranteListingDraft` (`createEmptyRestauranteDraft` + `auditRestaurantePublishReadiness`) → `saveRestauranteDraftToStorageResolved` → existing `/clasificados/restaurantes/preview` → existing `restaurantes_base_monthly` checkout → existing public `/clasificados/restaurantes/[slug]`; no menu / coupon / hours fabricated (hours asked as days + open/close).
AUTOS DEALER STATUS: PROVEN_SOURCE — "Tu negocio + tu primer vehículo": 16-question Quick intake (dealer identity + the customer's REAL first vehicle + real vehicle photos) → existing `AutosNegociosDraftV1` (canonical empty listing + `syncDealerAddressFromStructured` + `getAutosPreviewCompletenessIssues("negocios")`) → `saveAutosNegociosDraftResolved` + namespace hint → existing `/clasificados/autos/negocios/preview` → existing `autos_dealer_monthly` checkout → existing pending row / `autos_dealer_activate_listing`; the first vehicle becomes the canonical main row; included allowance + inventory pack untouched; no fabricated mileage / VIN / price / condition (MATRIX §3-C, §5).
BIENES STATUS: PROVEN_SOURCE — "Tu perfil + tu primera propiedad": 19-question Quick intake (professional identity + the customer's REAL first property + real property photos + the Full application's four confirmations) → existing `AgenteIndividualResidencialFormState` (`mergePartialAgenteIndividualResidencial`, `gateBienesRaicesNegocioPreview` on the canonical publish mapping) → `persistAgenteResApplicationDraftResolved` on a fresh application instance → existing `…/agente-individual/preview?applicationInstanceId=…` → existing `br_agent_monthly` checkout → existing `publishLeonixListingFromAgenteResidencialDraft` pending row + BR lifecycle; the first property counts under the existing allowance; no fabricated license / beds / baths / sqft / address / condition (asked) (MATRIX §3-D, §5).
SHARED QUICK BUSINESS STATUS: PROVEN_SOURCE — thin layer (registry, routes, copy, draft store, intake/review/chooser components, four adapters; closeout added per-category truthful media wording and the `property_agent` confirmation surface built from EXISTING components / copy) reusing the certified Quick Classifieds renderer / media step / shell / validation / types unmodified.
STAFF PWA STATUS: PROVEN_SOURCE — one PWA; additive "Negocios Rápidos / Quick Business" section in the existing launchpad (Servicios → Restaurantes → Autos Dealer → Bienes; Send link; Manage; honest verbs per category; closeout: Dealer / Bienes cards now "Crear negocio rápido con el cliente" → Quick form, Send Quick Link → Quick form, plus an "Aplicación completa / Full application" link so the EXISTING application stays reachable); Quick Classifieds section and deeper Concierge preserved; no messaging infrastructure.
FIELD-WIRING STATUS: PROVEN_SOURCE — `verify-quick-business-core-01` §2: every visible field read by its adapter (all four), no phantom reads, canonical destinations asserted (Dealer 22, Bienes 28 strings), gate-before-store order asserted for all four; detector self-tested with synthetic broken mappings.
IMAGE STATUS: PROVEN_SOURCE — ≥ 1 real image enforced at Next, submit and review; first image = canonical cover / hero / primary vehicle image / property cover; Dealer images map to the existing VEHICLE media shape (`MediaImageEntry`) and Bienes images to the existing PROPERTY media shape (`fotosDataUrls`), labeled truthfully ("foto real del vehículo" / "foto real de la propiedad", never "foto del negocio" — QB1 §1 / §3 guards); existing category media uploaders run at the existing preview checkout; no fake fallback.
PAYMENT STATUS: PROVEN_SOURCE — only the four existing base packages (`servicios_base_monthly`, `restaurantes_base_monthly`, `autos_dealer_monthly`, `br_agent_monthly`); the existing previews own checkout; inventory packs (`autos_dealer_inventory_pack_monthly`, `br_inventory_pack_monthly`) unchanged and never selected by Quick (one vehicle / one property); server price authority; no Quick SKU; no amount literal in the Quick tree.
OWNERSHIP STATUS: PROVEN_SOURCE — Quick writes no owner id, calls no API, uploads nothing; ownership stays with the existing publish routes (bearer / server-verified); staff-as-customer never implied.
STRUCTURED INVENTORY/MENU PROTECTION STATUS: PROVEN_SOURCE — vehicle data lives ONLY in the Dealer adapter (one real first vehicle, `additionalInventoryVehicles: []`, no boost / role / group id), property data ONLY in the Bienes adapter (one real first property, no inventory children / pack acceptance); no menu, coupon, credential, payment-method or specialty data written by Quick (verifier §7 regexes + fabrication guards).
CLASSIFIEDS NO-REGRESSION STATUS: PROVEN_SOURCE — `git diff 7555fb64 HEAD -- app/(site)/publicar/rapido app/lib/quickClassifieds` = empty (re-proven at closeout); V1 / V2 / V3 + 8 guards OK.

REQUIRED QUICK BUSINESS BLOCKERS: 0

KNOWN NON-BLOCKING ITEMS
- Focused verifier failures at closeout are ALL pre-existing or stale (each reproduces byte-for-byte at `426deab1` with the closeout stashed; every one reads Full-application files this closeout did not touch): `autos-a5-1-negocios-draft-preview-persistence-audit`, `autos-final-only-negocios-privado-readiness-audit`, `autos-a5-qa-07-application-persistence-inventory-truth-audit`, `bienes-hydration-proof-01-core`, `bienes-active-application-refresh-persistence-audit`, `gate-i5-3a-br-gateway-fix-selftest`, `verify-revenue-os-br-inventory-pack-fulfillment-and-global-preview-safety-01` (asserts an old allowance constant), `verify-bienes-application-instance-isolation-01`, `verify-bienes-autos-dealer-paid-readiness`; `autos-a5-0-negocios-missing-publish-blockers-audit` is a scope lock over the uncommitted tree (passes on a clean tree). FEATURE_CAUSED = 0 (LEDGER closeout table).
- `restaurantes-launch-selftest` cannot run in this container (needs Supabase service-role env for its DB phase); `smoke-servicios-business-presets` fails on an untouched preset icon rule (pre-existing).
- Runtime proof (browser, Preview) not performed — deferred.

OWNER COMMERCIAL DECISIONS DEFERRED
- Whether a lower-priced Quick Business tier should exist (today Quick routes to the existing $399/month base packages; no SKU created).
- Whether Restaurantes should receive the Servicios-style server-side save/publish-for-client custody (`assistedListingCustody.ts` notes "Restaurantes next").
- (Resolved by this closeout: "Quick Dealer" = dealer identity + REAL first vehicle; "Quick Agent" = agent identity + REAL first property.)

DEFERRED TO INTEGRATION GATE:
- full TypeScript
- full production build
- broad regression
- Preview
- forensic final proof
- owner QA
