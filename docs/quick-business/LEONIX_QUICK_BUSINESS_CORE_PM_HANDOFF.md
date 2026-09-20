# LEONIX QUICK BUSINESS CORE — PM HANDOFF (2026-09-20)

SOURCE CERTIFIED CLASSIFIEDS SHA: `7555fb6456dff1797a7ca8d5716f99abdc511cce` (branch `claude/quick-classifieds-master-build-0j5p30`, not modified by this mission)
QUICK BUSINESS BRANCH: `claude/quick-business-core-build-2026-09`
START SHA: `7555fb6456dff1797a7ca8d5716f99abdc511cce`
FINAL SHA: the commit that adds this file (`git log -1 -- docs/quick-business/LEONIX_QUICK_BUSINESS_CORE_PM_HANDOFF.md`)
ORIGIN MAIN: `fd9094994aa2a63fdcea49f24b2435300a7b49a4` (not merged)

FILES CHANGED (this mission)
- NEW `app/lib/quickBusiness/quickBusinessTypes.ts`, `quickBusinessRegistry.ts`, `quickBusinessRoutes.ts`, `quickBusinessCopy.ts`
- NEW `app/(site)/publicar/negocio-rapido/page.tsx`, `[category]/page.tsx`
- NEW `app/(site)/publicar/negocio-rapido/_components/QuickBusinessChooser.tsx`, `QuickBusinessIntakeClient.tsx`, `QuickBusinessReviewStep.tsx`, `quickBusinessDraftStore.ts`
- NEW `app/(site)/publicar/negocio-rapido/_adapters/quickBusinessAdapterShared.ts`, `serviciosQuickBusinessAdapter.ts`, `restaurantesQuickBusinessAdapter.ts`, `index.ts`
- MODIFIED (additive) `app/admin/(dashboard)/businesses/QuickApplicationsLaunchpad.tsx` (Quick Business section), `app/(site)/publicar/PublicarGatewayClient.tsx` (one "Negocio rápido" link + import)
- MODIFIED `scripts/verify-quick-classifieds-onramp-01.ts` (one documented protected-path exception for the additive `negocio-rapido/` tree — no assertion weakened), `package.json` (one npm script)
- NEW `scripts/verify-quick-business-core-01.ts`
- NEW docs: `LEONIX_QUICK_BUSINESS_CORE_ARCHITECTURE_MATRIX.md`, `LEONIX_QUICK_BUSINESS_CORE_EXECUTION_LEDGER.md`, this handoff
- NOT modified: any canonical application, preview, publisher, renderer, result card, registry, pricing matrix, Revenue OS, Stripe, lifecycle, analytics, admin queue, Business Hub, auth, API route, migration, manifest, or any file under the certified Quick Classifieds tree.

SERVICIOS STATUS: PROVEN_SOURCE — 12-question Quick intake → existing `ClasificadosServiciosApplicationState` (canonical default + normalizer + `evaluateServiciosPublishReadiness`) → `persistServiciosDraftForPreviewNavigation` → existing `/clasificados/publicar/servicios/preview` → existing `servicios_base_monthly` checkout → existing public `/clasificados/servicios/[slug]`; staff save/publish-for-client stays the existing Servicios server path.
RESTAURANTES STATUS: PROVEN_SOURCE — 11-question Quick intake → existing `RestauranteListingDraft` (`createEmptyRestauranteDraft` + `auditRestaurantePublishReadiness`) → `saveRestauranteDraftToStorageResolved` → existing `/clasificados/restaurantes/preview` → existing `restaurantes_base_monthly` checkout → existing public `/clasificados/restaurantes/[slug]`; no menu / coupon / hours fabricated (hours asked as days + open/close).
AUTOS DEALER STATUS: BLOCKED_EXISTING_CONTRACT — the canonical Dealer product requires at least one real vehicle (main row IS a vehicle listing; public route is a vehicle page). No Quick intake built; chooser + launchpad link the existing application directly with the reason shown. Inventory system untouched; no fake vehicles.
BIENES STATUS: BLOCKED_EXISTING_CONTRACT — the canonical agent/business product requires at least one real property (agent application publishes a titled, priced, photographed property). No Quick intake built; direct link to the existing selector with the reason shown. Property inventory + FSBO untouched; no fake properties.
SHARED QUICK BUSINESS STATUS: PROVEN_SOURCE — thin layer (registry, routes, copy, draft store, intake/review/chooser components, two adapters) reusing the certified Quick Classifieds renderer / media step / shell / validation / types unmodified.
STAFF PWA STATUS: PROVEN_SOURCE — one PWA; additive "Negocios Rápidos / Quick Business" section in the existing launchpad (Servicios → Restaurantes → Autos Dealer → Bienes; Send link; Manage; honest verbs per category); Quick Classifieds section and deeper Concierge preserved; no messaging infrastructure.
FIELD-WIRING STATUS: PROVEN_SOURCE — `verify-quick-business-core-01` §2: every visible field read by its adapter, no phantom reads, canonical destinations asserted; detector self-tested with synthetic broken mappings.
IMAGE STATUS: PROVEN_SOURCE — ≥ 1 real image enforced at Next, submit and review; first image = canonical cover / hero; existing category media uploaders run at the existing preview checkout; no fake fallback.
PAYMENT STATUS: PROVEN_SOURCE — only `servicios_base_monthly`, `restaurantes_base_monthly` (and `autos_dealer_monthly` / `br_agent_monthly` as display postures); server price authority; no Quick SKU; no amount literal in the Quick tree.
OWNERSHIP STATUS: PROVEN_SOURCE — Quick writes no owner id, calls no API, uploads nothing; ownership stays with the existing publish routes (bearer / server-verified); staff-as-customer never implied.
STRUCTURED INVENTORY/MENU PROTECTION STATUS: PROVEN_SOURCE — no vehicle, property, menu, coupon, credential, payment-method or specialty data is written by Quick (verifier §7 regexes); Dealer / Bienes not opened.
CLASSIFIEDS NO-REGRESSION STATUS: PROVEN_SOURCE — `git diff 7555fb64 HEAD -- app/(site)/publicar/rapido app/lib/quickClassifieds` = empty; V1 / V2 / V3 + 8 guards OK.

KNOWN BLOCKERS
- Autos Dealer profile-only Quick: BLOCKED_EXISTING_CONTRACT (needs a real vehicle) — see MATRIX §3-C.
- Bienes negocio/agent profile-only Quick: BLOCKED_EXISTING_CONTRACT (needs a real property) — see MATRIX §3-D.
- `restaurantes-launch-selftest` cannot run in this container (needs Supabase service-role env for its DB phase); `smoke-servicios-business-presets` fails on an untouched preset icon rule (pre-existing).
- Runtime proof (browser, Preview) not performed — deferred.

OWNER COMMERCIAL DECISIONS DEFERRED
- Whether a lower-priced Quick Business tier should exist (today Quick routes to the existing $399/month base packages; no SKU created).
- Whether "Quick Dealer" should exist as dealer identity + the dealer's FIRST REAL vehicle (truthful, not fabricated) — a product decision, since the canonical Dealer product is vehicle-first.
- Whether "Quick Agent" should exist as agent identity + the agent's FIRST REAL property — same reasoning.
- Whether Restaurantes should receive the Servicios-style server-side save/publish-for-client custody (`assistedListingCustody.ts` notes "Restaurantes next").

DEFERRED TO INTEGRATION GATE:
- full TypeScript
- full production build
- broad regression
- Preview
- forensic final proof
- owner QA
