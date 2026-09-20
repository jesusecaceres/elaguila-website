# LEONIX REPOSITORY RECOVERY AUDIT

Audit date: 2026-09-20. Discovery roots: `C:\projects` (the currently opened VS Code workspace folder), `C:\Users\chuy\Desktop` (resolved Windows Desktop), and `C:\project` only if present. `C:\project` was absent. The active workspace folder itself was not a Git repository; repositories below it were inspected.

## Executive Summary

Found 1 canonical Git repositories and 45 accessible worktrees. 16 worktrees are dirty, 2 stash entries were found, and 10 local-only commits were found. This report contains metadata and path classifications only; secret-bearing values and full diffs were excluded.

## Repositories Found

- **C:\projects\elaguila-website** - remote: https://github.com/jesusecaceres/elaguila-website.git; branch: main; HEAD: d1b2994d36b1e78f1fb91a6d3f801638156b9119

## Worktree Inventory

- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website; branch main; HEAD d1b2994d36b1e78f1fb91a6d3f801638156b9119; **DIRTY**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website/.claude/worktrees/zen-northcutt-84724c; branch ; HEAD 7cd5f524da65be74bd81003329acdff44f72b081; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-ad-branding-studio; branch integration/ad-branding-studio-foundation-2026-08; HEAD b3086746d6ba9aadc73076200376058388003734; **DIRTY**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-address-foundation; branch feature/global-address-verification-foundation; HEAD b045763bac5300651308bfee54b5a12a507f5845; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-admin-live-qa; branch integration/category-circuit-closeout-2026-09; HEAD a4a1749b45bf66d6c736aad8e4c1d4f3f428a823; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-autos-dealership; branch autos-dealership; HEAD 8500a26e4b8d92aa9759544b906d7d3d2d4cbc06; **DIRTY**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-autos-privados-preview; branch integration/autos-dealer-golden-2026-09-15; HEAD 6b21387fe325ebabc933cd4e4c90473653563047; **DIRTY**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-br-rentas-forward-port; branch release/br-rentas-forward-port-2026-09-17; HEAD 29b31239cc16dd5cb1fb039018c35e9e3fdc359e; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-business-applications-final; branch integration/business-apps-source-red-burndown-2026-08; HEAD cbad30f4f4473ea28a7db3de263a76d1ba094608; **DIRTY**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-business-profile-sales-pipeline; branch fix/business-information-live-save-2026-09-17; HEAD 0cb9f00b27390da803a0dd2c4ee8f5d5f9b15e81; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-business-shared-primitives; branch feature/business-shared-primitives; HEAD 47838256390f898d49541ab43def8fe53a364829; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-comida-local-category-fixes; branch feature/comida-local-category-fixes; HEAD 0c0a878c91e2c0b2afd37200beb6753711f3f806; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-community-final-audit; branch audit/community-final-owner-ledger-2026-08; HEAD a2977915a3a256ff95b8c3475b7a85dafe428d14; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-concierge; branch feature/business-concierge-systemic-repair-2026-09; HEAD 36a65adf15cdea925e28b618e0294b55fb78f484; **DIRTY**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-digital-contact; branch feature/executive-hub-staff-flow-final; HEAD 0314ca6b2ab42d2fb37cd7e083943ade40349939; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-final-audit-fixes; branch qa/community-final-owner-qa-2026-08; HEAD 5c63e05ea611625fba5ea1d2329c473406f55856; **DIRTY**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-final-audit-reconcile; branch ; HEAD a8c4c08cd09e06452fc0b18a8964022105d5917a; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-global-qa-foundation; branch feature/global-qa-foundation-2026-08; HEAD fc55a50fffde3420334795b15a7477398ad825af; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-globalization-final-closeout; branch fix/globalization-final-closeout-2026-09; HEAD e3956df893f5041ca22371c999038f297d536eae; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-globalization-reconcile; branch globalization-release-reconcile-2026-08-14; HEAD c0912a71bc7f35caec2a9646628d6290f0d59643; **DIRTY**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-hotfix-es-en; branch hotfix/es-en-launch-gateway-2026-08; HEAD 3fae3e8d6db22353dccdbe36b94bb941a2a76227; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-launch-lifecycle; branch completion/launch-lifecycle-2026-09-09; HEAD b3d0e157e4de1e85bf1c0f802eaa08031c51f702; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-learning-center; branch integration/learning-center-i1-release-2026-09-19; HEAD ce486bd1d615ebf33cbc6fc67d5c9d32c609706c; **DIRTY**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-leo; branch integration/leo-executive-operating-intelligence-2026-08; HEAD 093d21ed1e40b3c05c74a72fa45a8bf78e4e16d6; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-leo-final; branch integration/leo-final-closeout-2026-08; HEAD dfdcab7dfeb9d6523948173e44aaa93ba14ad1a4; **DIRTY**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-leo-release-temp; branch ; HEAD 66f208b1c7a1def81ffc88084fb42b075a5de5b1; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-newsletter-v2; branch feature/newsletter-engine-v2; HEAD cd52ffd2c5afb039223f8c511a281427a5f648a4; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-noticias-n2; branch noticias-n2-front-page-finish-2026-09-02; HEAD 0496ef39cf7cb20e656aea8e6d2553f84ea73f09; **DIRTY**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-noticias-n3; branch noticias-n3-editorial-quality-2026-09-03; HEAD d09d979c1bdba40002ac5e985d6971ce6a87bb0f; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-noticias-n4; branch noticias-n4-final-production-seal-2026-09-03; HEAD 807cd3fd105902ab7313945ec0f3a014d63cf8c0; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-noticias-owner-qa; branch noticias-owner-qa-final-composition-2026-09-03; HEAD 66fa8de1590d2f7d991f07ad06052d095b40d83f; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-ofertas; branch integration/ofertas-locales-2026-07; HEAD a8dfed7deeb5d91db95f4f2284e5dcddb9faf179; **DIRTY**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-ofertas-owner-reconcile; branch integration/ofertas-owner-command-center-reconcile-2026-09; HEAD 70e68ff6cc10b6371126c1e68b45e0029c403b24; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-owner-command-center; branch integration/owner-command-center-globalization-2026-08; HEAD 994f7a25b4d1b9a5f2b8ef8afb7f9cf944922707; **DIRTY**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-recursos; branch feature/recursos-community-hub; HEAD b55eab25c79892c23dbd98d610fc6aa3c2a273ae; **DIRTY**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-remove-coming-soon-gate; branch fix/remove-coming-soon-gate-2026-08; HEAD 942b14e532aca0170857b2d8c1aab5161dd7cdab; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-restaurantes-category-fixes; branch feature/restaurantes-category-fixes; HEAD 9ff33293e15163cb6ffb03f155868b28f97d79ad; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-revenue-entitlement-guard; branch feature/revenue-active-entitlement-edit-guard; HEAD a6727e1a20fd89ab24fb39333da6043c1802fd1a; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-revista; branch feature/revista-compact-hub-2026-09-19; HEAD 52bdce381dd928a18fcf7cac43bff1c7f1f6c7fa; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-saved-search-global; branch global-final-production-closeout-2026-08; HEAD 90d0bd2dccad642e5049beb44a9cb476bd253593; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-servicios-category-fixes; branch feature/servicios-category-fixes; HEAD ee65dae4245e22779d0eb4b01adf124e2073c95d; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-servicios-final-application; branch fix/servicios-application-final-qa-2026-08; HEAD 64a8018766d24c3cd128efbc6c22444e255751a9; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-viajes; branch integration/viajes-launch-qa-2026-08; HEAD f563cdf336173625138c8f427d57754f92dc592f; **DIRTY**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-virtual-front-desk; branch feature/virtual-front-desk; HEAD 72c2daa171d0a2d2598ecf7b038c872eb8c179d3; **CLEAN**
- Repository C:\projects\elaguila-website; path C:/projects/elaguila-website-website; branch integration/home-release-2026-09-19; HEAD 5e72ad9def69fc6eebdf6008da2d99e3705a3685; **DIRTY**

## Dirty Working Trees

- C:/projects/elaguila-website - staged: 0, unstaged: 0, untracked: 45
- C:/projects/elaguila-website-ad-branding-studio - staged: 0, unstaged: 0, untracked: 1
- C:/projects/elaguila-website-autos-dealership - staged: 0, unstaged: 0, untracked: 1
- C:/projects/elaguila-website-autos-privados-preview - staged: 0, unstaged: 0, untracked: 1
- C:/projects/elaguila-website-business-applications-final - staged: 0, unstaged: 0, untracked: 1
- C:/projects/elaguila-website-concierge - staged: 0, unstaged: 1, untracked: 42
- C:/projects/elaguila-website-final-audit-fixes - staged: 0, unstaged: 0, untracked: 111
- C:/projects/elaguila-website-globalization-reconcile - staged: 0, unstaged: 0, untracked: 1
- C:/projects/elaguila-website-learning-center - staged: 0, unstaged: 0, untracked: 6
- C:/projects/elaguila-website-leo-final - staged: 0, unstaged: 8, untracked: 15
- C:/projects/elaguila-website-noticias-n2 - staged: 0, unstaged: 0, untracked: 1
- C:/projects/elaguila-website-ofertas - staged: 0, unstaged: 0, untracked: 1
- C:/projects/elaguila-website-owner-command-center - staged: 0, unstaged: 0, untracked: 1
- C:/projects/elaguila-website-recursos - staged: 0, unstaged: 1, untracked: 5
- C:/projects/elaguila-website-viajes - staged: 0, unstaged: 46, untracked: 49
- C:/projects/elaguila-website-website - staged: 0, unstaged: 0, untracked: 6

## Staged Work

None found.

## Unstaged Work

- C:/projects/elaguila-website-concierge [feature/business-concierge-systemic-repair-2026-09]
- supabase/.temp/cli-latest
- C:/projects/elaguila-website-leo-final [integration/leo-final-closeout-2026-08]
- app/admin/(dashboard)/leo/_components/LeoActionBar.tsx
- app/leo/_lib/leoExecutiveActions.ts
- app/leo/_lib/leoGoogleWorkspaceConfig.ts
- app/leo/_lib/leoToolCatalog.ts
- app/leo/_lib/leoToolRegistry.ts
- app/leo/_lib/leoTypes.ts
- scripts/LEO_GOOGLE_OAUTH_SETUP.md
- scripts/leo-google-oauth-offline.mjs
- C:/projects/elaguila-website-recursos [feature/recursos-community-hub]
- scripts/recursos/seed-verified-resources.ts
- C:/projects/elaguila-website-viajes [integration/viajes-launch-qa-2026-08]
- app/(site)/clasificados/viajes/components/ViajesAudienceBuckets.tsx
- app/(site)/clasificados/viajes/components/ViajesDestinations.tsx
- app/(site)/clasificados/viajes/components/ViajesHero.tsx
- app/(site)/clasificados/viajes/components/ViajesLandingPage.tsx
- app/(site)/clasificados/viajes/components/ViajesLocalDepartures.tsx
- app/(site)/clasificados/viajes/components/ViajesLowerSections.tsx
- app/(site)/clasificados/viajes/components/ViajesMobilitySection.tsx
- app/(site)/clasificados/viajes/components/ViajesNearbyEscapes.tsx
- app/(site)/clasificados/viajes/components/ViajesNegocioProfileLayout.tsx
- app/(site)/clasificados/viajes/components/ViajesOfferDetailGallery.tsx
- app/(site)/clasificados/viajes/components/ViajesOfferDetailLayout.tsx
- app/(site)/clasificados/viajes/components/ViajesOfferHeroBackdrop.tsx
- app/(site)/clasificados/viajes/components/ViajesOfferInquiryHub.tsx
- app/(site)/clasificados/viajes/components/ViajesOfferModuleCards.tsx
- app/(site)/clasificados/viajes/components/ViajesOfferRelatedRails.tsx
- app/(site)/clasificados/viajes/components/ViajesResultsAffiliateCard.tsx
- app/(site)/clasificados/viajes/components/ViajesResultsBusinessCard.tsx
- app/(site)/clasificados/viajes/components/ViajesResultsEditorialCard.tsx
- app/(site)/clasificados/viajes/components/ViajesResultsShell.tsx
- app/(site)/clasificados/viajes/components/ViajesStaySection.tsx
- app/(site)/clasificados/viajes/components/ViajesTopOfferCard.tsx
- app/(site)/clasificados/viajes/components/ViajesTopOffers.tsx
- app/(site)/clasificados/viajes/data/viajesHomeFeedSelectors.ts
- app/(site)/clasificados/viajes/data/viajesLandingSampleData.ts
- app/(site)/clasificados/viajes/data/viajesNegocioProfileSampleData.ts
- app/(site)/clasificados/viajes/lib/resolveViajesOfferDetailFromStagedServer.ts
- app/(site)/clasificados/viajes/lib/resolveViajesProviderProfileFromStagedServer.ts
- app/(site)/clasificados/viajes/lib/v2/mapViajesOfferV2ToBrowseResult.ts
- app/(site)/clasificados/viajes/lib/v2/mapViajesOfferV2ToDetailModel.ts
- app/(site)/clasificados/viajes/lib/viajesCtaHref.ts
- app/(site)/clasificados/viajes/lib/viajesDiscoveryRanking.ts
- app/(site)/clasificados/viajes/lib/viajesOfferDetailRelatedServer.ts
- app/(site)/clasificados/viajes/lib/viajesOfferHeroFallbacks.ts
- app/(site)/clasificados/viajes/lib/viajesProviderMatch.ts
- app/(site)/clasificados/viajes/lib/viajesPublicBrowseRowsServer.ts
- app/(site)/clasificados/viajes/lib/viajesPublicInventory.ts
- app/(site)/clasificados/viajes/negocio/[slug]/page.tsx
- app/(site)/clasificados/viajes/oferta/[slug]/page.tsx
- app/(site)/clasificados/viajes/page.tsx
- app/(site)/clasificados/viajes/resultados/page.tsx
- app/(site)/publicar/viajes/components/modules/ViajesModuleAccommodationEditor.tsx
- app/(site)/publicar/viajes/components/modules/ViajesModuleItineraryEditor.tsx
- app/(site)/publicar/viajes/components/modules/viajesModuleListEditor.tsx
- app/(site)/publicar/viajes/negocios/components/ViajesNegociosStepInclusions.tsx
- app/(site)/publicar/viajes/negocios/data/publicarViajesNegociosCopy.ts
- e2e/viajes-runtime-qa.spec.ts

## Untracked Work

- C:/projects/elaguila-website [main]
- .release-qa/church-clean-qa.json
- .release-qa/church-public-en.html
- .release-qa/church-public-es.html
- .release-qa/church-qa.json
- .release-qa/prayer-qa.json
- .release-qa/prayer-submit.out
- .release-qa/test-logo.gif
- .release-qa/test-logo.png
- .release-qa/test-oversize.png
- docs/globalization/forensic-2026-09-09/00_EXECUTIVE_CERTIFICATION.md
- docs/globalization/forensic-2026-09-09/01_REPOSITORY_AND_WORKTREE_INVENTORY.md
- docs/globalization/forensic-2026-09-09/02_GLOBALIZATION_COMMIT_LINEAGE_JUL14_TO_CURRENT.md
- docs/globalization/forensic-2026-09-09/03B_NEWSLETTER_SEO_A11Y_PWA_SECURITY.md
- docs/globalization/forensic-2026-09-09/03_GLOBAL_ENGINE_SOURCE_MAP_G01_G53.md
- docs/globalization/forensic-2026-09-09/04A_SERVICIOS_RESTAURANTES_COMIDA_FULL_CYCLE.md
- docs/globalization/forensic-2026-09-09/04B_BIENES_RENTAS_FULL_CYCLE.md
- docs/globalization/forensic-2026-09-09/04C_AUTOS_EMPLEOS_FULL_CYCLE.md
- docs/globalization/forensic-2026-09-09/04D_COMMUNITY_LANES_VIAJES_FULL_CYCLE.md
- docs/globalization/forensic-2026-09-09/04_CATEGORY_FULL_CYCLE_CERTIFICATION.md
- docs/globalization/forensic-2026-09-09/05A_SERVICIOS_RESTAURANTES_COMIDA_PATHWAYS.md
- docs/globalization/forensic-2026-09-09/05B_COMMUNITY_LANES_VIAJES_PATHWAYS.md
- docs/globalization/forensic-2026-09-09/05_CATEGORY_EXACT_CODE_PATHWAYS.md
- docs/globalization/forensic-2026-09-09/06_DATA_ROUND_TRIP_FIELD_AUDIT.md
- docs/globalization/forensic-2026-09-09/07_CATEGORY_REGISTRY_CONSISTENCY_AUDIT.md
- docs/globalization/forensic-2026-09-09/08_USER_DASHBOARD_OWNER_COMMAND_CENTER_AUDIT.md
- docs/globalization/forensic-2026-09-09/09A_ADMIN_AUTH_ADVERSARIAL_REAUDIT.md
- docs/globalization/forensic-2026-09-09/09_ADMIN_OS_AUDIT.md
- docs/globalization/forensic-2026-09-09/10_ANALYTICS_EVENT_COVERAGE.md
- docs/globalization/forensic-2026-09-09/11_REVENUE_STRIPE_PROMO_ENTITLEMENT_AUDIT.md
- docs/globalization/forensic-2026-09-09/12A_BIENES_PARENT_CHILD_AUDIT.md
- docs/globalization/forensic-2026-09-09/12B_AUTOS_PARENT_CHILD_AUDIT.md
- docs/globalization/forensic-2026-09-09/12_AUTOS_BIENES_PARENT_CHILD_AUDIT.md
- docs/globalization/forensic-2026-09-09/13B_TRUST_REVIEWS_ADDRESS_COMPLETION.md
- docs/globalization/forensic-2026-09-09/13_BUSINESS_HUB_CONNECTION_TRUST_ADDRESS_AUDIT.md
- docs/globalization/forensic-2026-09-09/14_SEARCH_RESULTS_RELATED_SAVED_SEARCH_AUDIT.md
- docs/globalization/forensic-2026-09-09/15_MEDIA_FLYER_PDF_AUDIT.md
- docs/globalization/forensic-2026-09-09/16_ORPHANED_DUPLICATE_UNINTEGRATED_WORK.md
- docs/globalization/forensic-2026-09-09/17_ACTIVATION_GAP_LEDGER.md
- docs/globalization/forensic-2026-09-09/18_OWNER_QA_READY_MATRIX.md
- docs/globalization/forensic-2026-09-09/19_OWNER_QA_PLAYBOOK.md
- docs/globalization/forensic-2026-09-09/20_REPOSITORY_ORGANIZATION_MAP.md
- docs/globalization/forensic-2026-09-09/21_FINAL_TRUE_FALSE_MATRIX.md
- docs/globalization/forensic-2026-09-09/22_FINAL_RECONCILIATION_PLAN.md
- docs/globalization/forensic-2026-09-09/AUDIT_COVERAGE_AND_REMAINING_WORK.md
- docs/globalization/forensic-2026-09-09/globalization-certification.json
- C:/projects/elaguila-website-ad-branding-studio [integration/ad-branding-studio-foundation-2026-08]
- .claude/launch.json
- C:/projects/elaguila-website-autos-dealership [autos-dealership]
- .claude/launch.json
- C:/projects/elaguila-website-autos-privados-preview [integration/autos-dealer-golden-2026-09-15]
- .claude/launch.json
- C:/projects/elaguila-website-business-applications-final [integration/business-apps-source-red-burndown-2026-08]
- .claude/launch.json
- C:/projects/elaguila-website-concierge [feature/business-concierge-systemic-repair-2026-09]
- .claude/launch.json
- .devin/config.local.json
- stop
- supabase/.temp/build_output.txt
- supabase/.temp/gotrue-version
- supabase/.temp/linked-project.json
- supabase/.temp/pooler-url
- supabase/.temp/postgres-version
- supabase/.temp/project-ref
- supabase/.temp/rest-version
- supabase/.temp/s1_schema_check.sql
- supabase/.temp/s1a_tables_rls.sql
- supabase/.temp/s1b_constraints.sql
- supabase/.temp/s1c_fks.sql
- supabase/.temp/s1d_grants.sql
- supabase/.temp/s1e_policies.sql
- supabase/.temp/s2_fixtures_v4.sql
- supabase/.temp/s2a_biz_schema.sql
- supabase/.temp/s2b_roster_schema.sql
- supabase/.temp/s2c_biz_checks.sql
- supabase/.temp/s2c_constraints.sql
- supabase/.temp/s2d_auth_user.sql
- supabase/.temp/s2e_get_auth.sql
- supabase/.temp/s2f_roster_check.sql
- supabase/.temp/s2g_existing_roster.sql
- supabase/.temp/s2h_unique_check.sql
- supabase/.temp/s2i_indexes.sql
- supabase/.temp/s2j_owners_schema.sql
- supabase/.temp/s2j_owners_schema2.sql
- supabase/.temp/s3_verify_positive.sql
- supabase/.temp/s4a_lifecycle.sql
- supabase/.temp/s4b_crossbiz.sql
- supabase/.temp/s4c_truth.sql
- supabase/.temp/s4d_appendonly.sql
- supabase/.temp/s5_security.sql
- supabase/.temp/s6_doctrine.sql
- supabase/.temp/s6_doctrine_v2.sql
- supabase/.temp/s6_doctrine_v3.sql
- supabase/.temp/s9_cleanup_v4.sql
- supabase/.temp/s9_verify_residue.sql
- supabase/.temp/storage-migration
- supabase/.temp/storage-version
- C:/projects/elaguila-website-final-audit-fixes [qa/community-final-owner-qa-2026-08]
- .claude/launch.json
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-casas.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-comerciales.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-departamentos.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-multifamiliar.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-proyecto-nuevo.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-renta.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-terrenos.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-venta.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-bodega.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-oficina.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-oficios.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-restaurante.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-salud.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-tecnologia.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-transporte.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-ventas.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-abogados-legal.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-contadores.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-dentistas-salud.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-electricista.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-jardineria.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-limpieza.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-mecanica-reparacion-auto.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-plomeria.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-bebes-ninos.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-deportes-aire-libre.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-electronica-tecnologia.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-herramientas-materiales.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-hogar-cocina-electrodomesticos.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-muebles.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-otros-articulos.jpg
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-ropa-zapatos-accesorios.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-bajo-millaje.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-camioneta.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-hibrido-electrico.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-menos-10k.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-privado.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-recien-publicado.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-sedan.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-suv.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/README.txt
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-articulo.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-ayuda.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-grupo-actividad.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-recurso-comunitario.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-servicio.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-trabajo-extra.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-transporte-ride.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-voluntarios.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-baile-danza.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-cocina.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-espanol.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-fitness.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-ingles.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-musica.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-tutoria.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-yoga.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/README.txt
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-bajo-millaje.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-camionetas.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-dealers.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-financiamiento.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-nuevos.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-san-jose.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-suv.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-usados.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-ciudad.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-distribucion-comida.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-familiar.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-feria.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-festival.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-iglesia-comunidad.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-otro-tipo.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-taller-abierto.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/README.txt
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-autos.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-bienes-raices.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-busco-se-busca.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-clases.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-comida-local.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-comunidad-eventos.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-dealers-de-autos.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-empleos.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-mascotas-perdidos.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-rentas.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-restaurantes.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-servicios.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-varios.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-viajes.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_mascotas_generated_images/mascotas-adopcion-de-mascota.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_mascotas_generated_images/mascotas-mascota-encontrada.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_mascotas_generated_images/mascotas-mascota-perdida.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_mascotas_generated_images/mascotas-objeto-encontrado.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_mascotas_generated_images/mascotas-objeto-perdido.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-catering.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-china.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-food-truck.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-hamburguesas.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-italiana.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-mexicana.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-pizza.jpg
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-postres.jpg
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-adu-casita.jpg
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-apartamento.jpg
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-casa-movil.jpg
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-cuarto.jpg
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-estudio.jpg
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-garage.jpg
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-para-familia.jpg
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-sala-espacio.jpg
- C:/projects/elaguila-website-globalization-reconcile [globalization-release-reconcile-2026-08-14]
- .devin/config.local.json
- C:/projects/elaguila-website-learning-center [integration/learning-center-i1-release-2026-09-19]
- .claude/LEARNING_I1A1_APPLY_EVIDENCE_2026-09-18.md
- .claude/LEARNING_I1A_APPLY_EVIDENCE_2026-09-18.md
- .claude/LEARNING_I1A_BEFORE_SNAPSHOT_2026-09-18.json
- .claude/LEARNING_I1B_APPLY_EVIDENCE_2026-09-19.md
- .claude/LEARNING_I1B_BEFORE_SNAPSHOT_2026-09-19.md
- .claude/launch.json
- C:/projects/elaguila-website-leo-final [integration/leo-final-closeout-2026-08]
- app/api/leo/action/execute/route.ts
- app/leo/_lib/leoActionExecutionService.ts
- app/leo/_lib/leoActionProposalFingerprint.ts
- app/leo/_lib/leoActionProposalRepository.ts
- app/leo/_lib/leoCalendarWriteAdapter.ts
- app/leo/_lib/leoConnectedActionPreparationService.ts
- app/leo/_lib/leoGmailWriteAdapter.ts
- app/leo/_lib/leoPeopleAdapter.ts
- leo-runtime-audit.txt
- scripts/verify-leo-final02-calendar-write-contract.ts
- scripts/verify-leo-final02-confirmation-execution.ts
- scripts/verify-leo-final02-contacts-resolution.ts
- scripts/verify-leo-final02-gmail-write-contract.ts
- scripts/verify-leo-final02-provider-truth.ts
- supabase/migrations/20260819223000_leo_final02_connected_action_truth.sql
- C:/projects/elaguila-website-noticias-n2 [noticias-n2-front-page-finish-2026-09-02]
- .claude/launch.json
- C:/projects/elaguila-website-ofertas [integration/ofertas-locales-2026-07]
- app/lib/ofertas-locales/OFERTAS_QA_UX_BATCH_PLAN.md
- C:/projects/elaguila-website-owner-command-center [integration/owner-command-center-globalization-2026-08]
- .claude/launch.json
- C:/projects/elaguila-website-recursos [feature/recursos-community-hub]
- .claude/launch.json
- data/recursos/verified/production-promotion-2026-08-25/00-preflight.sql
- data/recursos/verified/production-promotion-2026-08-25/01-insert-19-approved-resources.sql
- data/recursos/verified/production-promotion-2026-08-25/99-postflight.sql
- data/recursos/verified/production-promotion-2026-08-25/README.md
- C:/projects/elaguila-website-viajes [integration/viajes-launch-qa-2026-08]
- app/(site)/clasificados/viajes/components/ViajesSafeImage.tsx
- app/(site)/clasificados/viajes/lib/viajesLocalSeo.ts
- app/(site)/clasificados/viajes/lib/viajesPriceDisplay.ts
- app/(site)/clasificados/viajes/lib/viajesPublicDateDisplay.ts
- app/(site)/clasificados/viajes/lib/viajesPublicOfferTitle.ts
- app/(site)/clasificados/viajes/qa/launch-qa/OWNER-QA.md
- app/(site)/clasificados/viajes/qa/launch-qa/README.md
- app/(site)/clasificados/viajes/qa/launch-qa/build-remediation.log
- app/(site)/clasificados/viajes/qa/launch-qa/build-remediation2.log
- app/(site)/clasificados/viajes/qa/launch-qa/build-remediation3.log
- app/(site)/clasificados/viajes/qa/launch-qa/build-remediation4.log
- app/(site)/clasificados/viajes/qa/launch-qa/build-remediation5.log
- app/(site)/clasificados/viajes/qa/launch-qa/build.log
- app/(site)/clasificados/viajes/qa/launch-qa/business-publisher-review-1440.png
- app/(site)/clasificados/viajes/qa/launch-qa/business-publisher-step1-390.png
- app/(site)/clasificados/viajes/qa/launch-qa/capture-screenshots.mjs
- app/(site)/clasificados/viajes/qa/launch-qa/fixtures.ts
- app/(site)/clasificados/viajes/qa/launch-qa/landing-1440.png
- app/(site)/clasificados/viajes/qa/launch-qa/landing-390.png
- app/(site)/clasificados/viajes/qa/launch-qa/landing-768.png
- app/(site)/clasificados/viajes/qa/launch-qa/offer-detail-full-1440.png
- app/(site)/clasificados/viajes/qa/launch-qa/offer-detail-full-390.png
- app/(site)/clasificados/viajes/qa/launch-qa/offer-detail-minimal-1440.png
- app/(site)/clasificados/viajes/qa/launch-qa/offer-detail-minimal-390.png
- app/(site)/clasificados/viajes/qa/launch-qa/playwright-remediation.log
- app/(site)/clasificados/viajes/qa/launch-qa/playwright-remediation5.log
- app/(site)/clasificados/viajes/qa/launch-qa/playwright.log
- app/(site)/clasificados/viajes/qa/launch-qa/[sensitive-file-redacted]
- app/(site)/clasificados/viajes/qa/launch-qa/[sensitive-file-redacted]
- app/(site)/clasificados/viajes/qa/launch-qa/probe-db-row.mjs
- app/(site)/clasificados/viajes/qa/launch-qa/probe-results-visibility.mjs
- app/(site)/clasificados/viajes/qa/launch-qa/provider-1440.png
- app/(site)/clasificados/viajes/qa/launch-qa/provider-390.png
- app/(site)/clasificados/viajes/qa/launch-qa/results-default-1440.png
- app/(site)/clasificados/viajes/qa/launch-qa/results-default-390.png
- app/(site)/clasificados/viajes/qa/launch-qa/results-default-768.png
- app/(site)/clasificados/viajes/qa/launch-qa/results-empty-1440.png
- app/(site)/clasificados/viajes/qa/launch-qa/results-empty-390.png
- app/(site)/clasificados/viajes/qa/launch-qa/results-filtered-1440.png
- app/(site)/clasificados/viajes/qa/launch-qa/results-filtered-390.png
- app/(site)/clasificados/viajes/qa/launch-qa/results-sorted-1440.png
- app/(site)/clasificados/viajes/qa/launch-qa/results-sorted-390.png
- app/(site)/clasificados/viajes/qa/launch-qa/screenshots.log
- app/(site)/clasificados/viajes/qa/launch-qa/smoke-3103.log
- app/(site)/clasificados/viajes/qa/launch-qa/smoke-3103.mjs
- app/(site)/clasificados/viajes/qa/launch-qa/smoke.log
- app/(site)/clasificados/viajes/qa/launch-qa/typecheck.log
- app/(site)/publicar/viajes/components/modules/viajesModuleEditorCopy.ts
- scripts/viajes-launch-qa-selftest.ts
- C:/projects/elaguila-website-website [integration/home-release-2026-09-19]
- .claude/BR_RENTAS_OWNER_CHANGE_LEDGER_AUDITED.md
- .claude/BR_RENTAS_OWNER_LIVE_QA_RUNBOOK.md
- .claude/BR_RENTAS_OWNER_RUNTIME_QA.md
- .claude/BR_RENTAS_OWNER_VISUAL_QA_CHECKLIST.md
- .claude/BR_RENTAS_REQUIREMENTS_RECONCILIATION.md
- .claude/launch.json

## Ignored Generated Artifacts

- C:/projects/elaguila-website [main]
- !! .magazine-proof-output/
- !! .next-en-venta-e2e/
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-ad-branding-studio [integration/ad-branding-studio-foundation-2026-08]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-address-foundation [feature/global-address-verification-foundation]
- !! node_modules/
- C:/projects/elaguila-website-admin-live-qa [integration/category-circuit-closeout-2026-09]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-autos-dealership [autos-dealership]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-autos-privados-preview [integration/autos-dealer-golden-2026-09-15]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-br-rentas-forward-port [release/br-rentas-forward-port-2026-09-17]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-business-applications-final [integration/business-apps-source-red-burndown-2026-08]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-business-profile-sales-pipeline [fix/business-information-live-save-2026-09-17]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-business-shared-primitives [feature/business-shared-primitives]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-comida-local-category-fixes [feature/comida-local-category-fixes]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-community-final-audit [audit/community-final-owner-ledger-2026-08]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-concierge [feature/business-concierge-systemic-repair-2026-09]
- ?? supabase/.temp/build_output.txt
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-digital-contact [feature/executive-hub-staff-flow-final]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-final-audit-fixes [qa/community-final-owner-qa-2026-08]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-final-audit-reconcile []
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-global-qa-foundation [feature/global-qa-foundation-2026-08]
- !! node_modules/
- C:/projects/elaguila-website-globalization-final-closeout [fix/globalization-final-closeout-2026-09]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-globalization-reconcile [globalization-release-reconcile-2026-08-14]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-hotfix-es-en [hotfix/es-en-launch-gateway-2026-08]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-launch-lifecycle [completion/launch-lifecycle-2026-09-09]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-learning-center [integration/learning-center-i1-release-2026-09-19]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-leo [integration/leo-executive-operating-intelligence-2026-08]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-leo-final [integration/leo-final-closeout-2026-08]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-leo-release-temp []
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-newsletter-v2 [feature/newsletter-engine-v2]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-noticias-n2 [noticias-n2-front-page-finish-2026-09-02]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-noticias-n3 [noticias-n3-editorial-quality-2026-09-03]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-noticias-n4 [noticias-n4-final-production-seal-2026-09-03]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-noticias-owner-qa [noticias-owner-qa-final-composition-2026-09-03]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-ofertas [integration/ofertas-locales-2026-07]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-ofertas-owner-reconcile [integration/ofertas-owner-command-center-reconcile-2026-09]
- !! node_modules/
- C:/projects/elaguila-website-owner-command-center [integration/owner-command-center-globalization-2026-08]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-recursos [feature/recursos-community-hub]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-remove-coming-soon-gate [fix/remove-coming-soon-gate-2026-08]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-restaurantes-category-fixes [feature/restaurantes-category-fixes]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-revenue-entitlement-guard [feature/revenue-active-entitlement-edit-guard]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-revista [feature/revista-compact-hub-2026-09-19]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-saved-search-global [global-final-production-closeout-2026-08]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-servicios-category-fixes [feature/servicios-category-fixes]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-servicios-final-application [fix/servicios-application-final-qa-2026-08]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-viajes [integration/viajes-launch-qa-2026-08]
-  M app/(site)/clasificados/viajes/components/ViajesNegocioProfileLayout.tsx
-  M app/(site)/clasificados/viajes/components/ViajesOfferDetailLayout.tsx
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-virtual-front-desk [feature/virtual-front-desk]
- !! .next/
- !! node_modules/
- C:/projects/elaguila-website-website [integration/home-release-2026-09-19]
- !! .next/
- !! node_modules/

## Stashes

- C:\projects\elaguila-website - stash@{Mon Aug 17 12:03:25 2026}: On integration/lifecycle-foundation-2026-07: epitaxy: pre-switch from integration/lifecycle-foundation-2026-07
- C:\projects\elaguila-website - stash@{Fri May 15 09:18:26 2026}: On main: gate10-unrelated-wip

## Unpushed Commits

- C:\projects\elaguila-website
- 25635f6c 2026-08-24 autos-dealership-before-main-sync feat(autos): polish dealership preview presentation
- dfdcab7d 2026-08-19 integration/leo-final-closeout-2026-08 LEO FINAL 01D: reconcile frozen current main and certify closeout foundation
- 14ca357a 2026-08-19  LEO FINAL 01C: reconcile LEO 14.10-15 and preserve closeout foundation
- fa9f6b02 2026-08-19  LEO FINAL 01: reconcile main and harden write safety foundation
- eece90c0 2026-08-13  fix(autos): recognize dealer structured address for preview readiness
- 9baf9c80 2026-01-10 magazine-archive-json commit and push
- 9e13b7b4 2026-01-10  commit and push
- a861e269 2026-01-10  commit and push
- e1c1333c 2026-01-10  commit and push
- 514a1582 2026-01-10  commit and push

## Reflog Recovery Candidates

- C:\projects\elaguila-website
- a4a1749b integration/category-circuit-closeout-2026-09@{2026-09-18} 2026-09-18 commit: docs: final source completion ledger (validation, open defects, prepared migrations)
- a4a1749b worktrees/elaguila-website-admin-live-qa/HEAD@{2026-09-18} 2026-09-18 commit: docs: final source completion ledger (validation, open defects, prepared migrations)
- cb8103da integration/category-circuit-closeout-2026-09@{2026-09-18} 2026-09-18 commit: verify: update four legacy pins to the intentional identity-verified admin session / canonical dealer capacity / frame error props
- cb8103da worktrees/elaguila-website-admin-live-qa/HEAD@{2026-09-18} 2026-09-18 commit: verify: update four legacy pins to the intentional identity-verified admin session / canonical dealer capacity / frame error props
- 1b9914d0 integration/category-circuit-closeout-2026-09@{2026-09-18} 2026-09-18 commit: docs+verify: final source completion ledgers, matrices, DB proposals and verifiers
- 1e80c024 integration/category-circuit-closeout-2026-09@{2026-09-18} 2026-09-18 commit: fix(circuit): final admin/publication OS source completion (gates 1-5, 9)
- 1b9914d0 worktrees/elaguila-website-admin-live-qa/HEAD@{2026-09-18} 2026-09-18 commit: docs+verify: final source completion ledgers, matrices, DB proposals and verifiers
- 1e80c024 worktrees/elaguila-website-admin-live-qa/HEAD@{2026-09-18} 2026-09-18 commit: fix(circuit): final admin/publication OS source completion (gates 1-5, 9)
- 52bdce38 feature/revista-compact-hub-2026-09-19@{2026-09-18} 2026-09-18 commit: feat(magazine): simplify revista hub and restore automatic archive
- 52bdce38 worktrees/elaguila-website-revista/HEAD@{2026-09-18} 2026-09-18 commit: feat(magazine): simplify revista hub and restore automatic archive
- fd909499 worktrees/elaguila-website-revista/HEAD@{2026-09-18} 2026-09-18 reset: moving to HEAD
- fd909499 feature/revista-compact-hub-2026-09-19@{2026-09-18} 2026-09-18 branch: Created from origin/main
- ce486bd1 worktrees/elaguila-website-learning-center/HEAD@{2026-09-18} 2026-09-18 checkout: moving from fd9094994aa2a63fdcea49f24b2435300a7b49a4 to integration/learning-center-i1-release-2026-09-19
- fd909499 worktrees/elaguila-website-learning-center/HEAD@{2026-09-18} 2026-09-18 merge integration/learning-center-i1-release-2026-09-19: Merge made by the 'ort' strategy.
- eac5b783 worktrees/elaguila-website-learning-center/HEAD@{2026-09-18} 2026-09-18 checkout: moving from integration/learning-center-i1-release-2026-09-19 to origin/main
- ce486bd1 integration/learning-center-i1-release-2026-09-19@{2026-09-18} 2026-09-18 commit: docs(learning): record i1b lesson publication execution
- ce486bd1 worktrees/elaguila-website-learning-center/HEAD@{2026-09-18} 2026-09-18 commit: docs(learning): record i1b lesson publication execution
- 9cb5a52f integration/category-circuit-closeout-2026-09@{2026-09-18} 2026-09-18 commit: fix(admin): Servicios/Restaurantes cannot publish or launder a pre-payment listing
- 9cb5a52f worktrees/elaguila-website-admin-live-qa/HEAD@{2026-09-18} 2026-09-18 commit: fix(admin): Servicios/Restaurantes cannot publish or launder a pre-payment listing
- 8b25d418 integration/category-circuit-closeout-2026-09@{2026-09-18} 2026-09-18 commit: fix(circuit): forensic closeout - close admin/owner/checkout publication-authority gaps
- 8b25d418 worktrees/elaguila-website-admin-live-qa/HEAD@{2026-09-18} 2026-09-18 commit: fix(circuit): forensic closeout - close admin/owner/checkout publication-authority gaps
- 28fa5cf9 worktrees/elaguila-website-learning-center/HEAD@{2026-09-18} 2026-09-18 checkout: moving from eac5b783bf08b3e56f51f66207990d627806b9da to integration/learning-center-i1-release-2026-09-19
- eac5b783 worktrees/elaguila-website-learning-center/HEAD@{2026-09-18} 2026-09-18 merge integration/learning-center-i1-release-2026-09-19: Merge made by the 'ort' strategy.
- 5348e37a worktrees/elaguila-website-learning-center/HEAD@{2026-09-18} 2026-09-18 checkout: moving from integration/learning-center-i1-release-2026-09-19 to origin/main
- 28fa5cf9 integration/learning-center-i1-release-2026-09-19@{2026-09-18} 2026-09-18 commit: fix(learning): hide the desktop checkpoint crumb on phones
- 28fa5cf9 worktrees/elaguila-website-learning-center/HEAD@{2026-09-18} 2026-09-18 commit: fix(learning): hide the desktop checkpoint crumb on phones
- 65c07eaf integration/learning-center-i1-release-2026-09-19@{2026-09-18} 2026-09-18 commit: feat(learning): prepare i1b lesson publication
- 65c07eaf worktrees/elaguila-website-learning-center/HEAD@{2026-09-18} 2026-09-18 commit: feat(learning): prepare i1b lesson publication
- 06dc3651 integration/learning-center-i1-release-2026-09-19@{2026-09-18} 2026-09-18 commit: fix(learning): type the legacy label set so the verify script passes the build typecheck
- 06dc3651 worktrees/elaguila-website-learning-center/HEAD@{2026-09-18} 2026-09-18 commit: fix(learning): type the legacy label set so the verify script passes the build typecheck

## Branch and PR Map

- **C:\projects\elaguila-website**
  - Branches/upstreams: audit/community-final-owner-ledger-2026-08|origin/main|a2977915a3a256ff95b8c3475b7a85dafe428d14; auth-foundation-phase1|origin/auth-foundation-phase1|ba113cd7fdf6037585b8d2d362b99b9719508454; autos-dealership|origin/autos-dealership|8500a26e4b8d92aa9759544b906d7d3d2d4cbc06; autos-dealership-before-main-sync||25635f6cce452d8e27c1776e800895e89ba9c879; autos-location-readiness-micro-patches|origin/autos-location-readiness-micro-patches|f97d7141c6bc2f17a84969c55722f44225b5235f; autos-privados-preview|origin/autos-privados-preview|9d8404414073825a4507a6e3c23b48fd0f63cf60; backup/business-concierge-pre-reconcile-2026-09-08||2506f6168382994da9f8b078190563c5ed35e41d; claude/leo-0-architecture-plan-b7ef10||419d39d3071c7bab3e78a1720bc89c6f54a1c90a; claude/leonix-globalization-closeout-263b32||e43a238fb68d88cfaef77fd8f1fd86f6e5fad982; claude/leonix-leo0-arch-reconciliation-abfd68||419d39d3071c7bab3e78a1720bc89c6f54a1c90a; claude/verify-code-session-fde531||e43a238fb68d88cfaef77fd8f1fd86f6e5fad982; claude/zen-northcutt-84724c||7cd5f524da65be74bd81003329acdff44f72b081; completion/launch-lifecycle-2026-09-09|origin/completion/launch-lifecycle-2026-09-09|b3d0e157e4de1e85bf1c0f802eaa08031c51f702; feature/business-concierge-systemic-repair-2026-09|origin/feature/business-concierge-systemic-repair-2026-09|36a65adf15cdea925e28b618e0294b55fb78f484; feature/business-profile-sales-pipeline-2026-09|origin/feature/business-profile-sales-pipeline-2026-09|2aa450bee4c934e36ac0a470a1a2b5007446d743; feature/business-shared-primitives|origin/feature/business-shared-primitives|47838256390f898d49541ab43def8fe53a364829; feature/comida-local-category-fixes|origin/feature/comida-local-category-fixes|0c0a878c91e2c0b2afd37200beb6753711f3f806; feature/concierge-assisted-publishing-2026-09|origin/feature/concierge-assisted-publishing-2026-09|8b51b8c129ef42b72b46532d0c711c51438e2f29; feature/digital-contact-platform|origin/feature/digital-contact-platform|3f5e4057bb1ffe3971baaf1691c15726ac1add0a; feature/executive-contact-public-polish||091cc39140dec12bcf07fb0d951150432f10f414; feature/executive-hub-staff-flow-final||0314ca6b2ab42d2fb37cd7e083943ade40349939; feature/global-address-verification-foundation|origin/feature/global-address-verification-foundation|b045763bac5300651308bfee54b5a12a507f5845; feature/global-qa-foundation-2026-08|origin/feature/global-qa-foundation-2026-08|fc55a50fffde3420334795b15a7477398ad825af; feature/iglesias-community-faith-hub|origin/feature/iglesias-community-faith-hub|70963b183c24db9d60c6c80a4fc97c4862e25b25; feature/learning-center-flagship-2026-09-18||0b209b2970c727953ec5528f12cdd79f6ff51ee1; feature/newsletter-engine-v2|origin/feature/newsletter-engine-v2|cd52ffd2c5afb039223f8c511a281427a5f648a4; feature/recursos-community-hub|origin/feature/recursos-community-hub|b55eab25c79892c23dbd98d610fc6aa3c2a273ae; feature/restaurantes-category-fixes|origin/feature/restaurantes-category-fixes|9ff33293e15163cb6ffb03f155868b28f97d79ad; feature/revenue-active-entitlement-edit-guard|origin/feature/revenue-active-entitlement-edit-guard|a6727e1a20fd89ab24fb39333da6043c1802fd1a; feature/revista-compact-hub-2026-09-19|origin/feature/revista-compact-hub-2026-09-19|52bdce381dd928a18fcf7cac43bff1c7f1f6c7fa; feature/servicios-category-fixes|origin/feature/servicios-category-fixes|ee65dae4245e22779d0eb4b01adf124e2073c95d; feature/virtual-front-desk|origin/feature/virtual-front-desk|72c2daa171d0a2d2598ecf7b038c872eb8c179d3; fix/br-negocio-inventory-hub-media-hydration-2026-08-27|origin/fix/br-negocio-inventory-hub-media-hydration-2026-08-27|0d80e891a806eea9a44e50e1996c1dd1620d3aaf; fix/br-rentas-audit-f1-f7-2026-08-27|origin/fix/br-rentas-audit-f1-f7-2026-08-27|8c9719cb7eea9e56ab3b3c0bd51f58fcd0005194; fix/business-applications-final-polish-2026-08|origin/fix/business-applications-final-polish-2026-08|a6ab8410614b3a46ffc206f9d5bd5e4d89b094fc; fix/business-information-live-save-2026-09-17|origin/main|0cb9f00b27390da803a0dd2c4ee8f5d5f9b15e81; fix/clasificados-dedupe-a4.76||694ec5ad89fe6622c806723e625ddcbd3e4c0f42; fix/final-audit-defects-2026-08|origin/main|7cd5f524da65be74bd81003329acdff44f72b081; fix/globalization-final-closeout-2026-09|origin/main|e3956df893f5041ca22371c999038f297d536eae; fix/ofertas-checkout-standalone-presentation-2026-09|origin/main|00be6504e7182f1e07179ed00adf5fa843ed92a7; fix/ofertas-flyer-publish-routing-2026-09|origin/main|2149af385b7da4be0644a9b6395aa5e0fb3e92f6; fix/remove-coming-soon-gate-2026-08|origin/main|942b14e532aca0170857b2d8c1aab5161dd7cdab; fix/rentas-item13-taxonomy-sync-2026-08-27|origin/fix/rentas-item13-taxonomy-sync-2026-08-27|14917d40866a23136c61b6a7fa9dc583852b4046; fix/restaurantes-ad-story-preview||72a5c22da74e4c2297b8e878240eb42dcde07166; fix/servicios-application-final-qa-2026-08|origin/fix/servicios-application-final-qa-2026-08|64a8018766d24c3cd128efbc6c22444e255751a9; global-business-hub-os-2026-08|origin/global-business-hub-os-2026-08|4aeb0f5a4076509cb1fdab84ec8346c1cd1c209c; global-business-hub-trust-cta-media-2026-08|origin/global-business-hub-trust-cta-media-2026-08|e7c8ac424977c28d1b35e8999c3dff11db572606; global-final-production-closeout-2026-08|origin/global-final-production-closeout-2026-08|90d0bd2dccad642e5049beb44a9cb476bd253593; global-lifecycle-translate-seo-2026-08|origin/global-lifecycle-translate-seo-2026-08|6766c0bfdef40c374f2c1df74deca9cfe94918be; global-location-privacy-security-proof-2026-08|origin/main|4b3f17305d57e9adf2a162b40a24f682e6b3698d; global-saved-search-autos-matcher-2026-08|origin/main|1de8cdaff1468674e59fce01ba69a6f74878019b; global-saved-search-autos-outbox-2026-08|origin/global-saved-search-autos-outbox-2026-08|e6300e05521ef3486dde66333e36a87386b5251c; global-saved-search-autos-ui-2026-08|origin/main|b36499e6e5f83995ce4a71c9eeca8849dccfe717; global-saved-search-br-rentas-2026-08|origin/global-saved-search-br-rentas-2026-08|ca9a41ff6d44e1ce6f4b65598aef4153ab054836; global-saved-search-email-delivery-2026-08|origin/global-saved-search-email-delivery-2026-08|abff6b57f1ba95e41f094f50cbcf215e447129cf; global-saved-search-storage-rls-2026-08|origin/main|48cecca3a99252b3f661a0771f98e5f71d3d3490; global-saved-search-watchlist-architecture-2026-08|origin/main|fcb7058a0f77ad76fb93e7fc068f2683df4da500; globalization-release-reconcile-2026-08-14|origin/globalization-release-reconcile-2026-08-14|c0912a71bc7f35caec2a9646628d6290f0d59643; hotfix/es-en-launch-gateway-2026-08|origin/hotfix/es-en-launch-gateway-2026-08|3fae3e8d6db22353dccdbe36b94bb941a2a76227; hotfix/restaurantes-prueba-externa-label|origin/hotfix/restaurantes-prueba-externa-label|b3a8563b4af7332bd38ba5ca902a74587422d6e3; integration/accepted-state-and-amenidades-2026-08|origin/integration/accepted-state-and-amenidades-2026-08|139e118a53cb9e7e0337993954cbe9c3312159fc; integration/ad-branding-studio-foundation-2026-08|origin/integration/ad-branding-studio-foundation-2026-08|b3086746d6ba9aadc73076200376058388003734; integration/admin-os-live-qa-repair-2026-09|origin/integration/admin-os-live-qa-repair-2026-09|988f1a1aabeb83e83cc1b4443177fb9ce484270c; integration/autos-dealer-golden-2026-09-15|origin/main|6b21387fe325ebabc933cd4e4c90473653563047; integration/bienes-rentas-qa-2026-08|origin/integration/bienes-rentas-qa-2026-08|61e606b8ce21e4c12f4a039a16b375fc3a3e7ffd; integration/business-apps-source-red-burndown-2026-08|origin/main|cbad30f4f4473ea28a7db3de263a76d1ba094608; integration/business-concierge-foundation-2026-07|origin/integration/business-concierge-foundation-2026-07|3eedaf15ec51f2a8a13a876e6d010cd665ece412; integration/category-circuit-closeout-2026-09|origin/integration/category-circuit-closeout-2026-09|a4a1749b45bf66d6c736aad8e4c1d4f3f428a823; integration/home-release-2026-09-19|origin/integration/home-release-2026-09-19|5e72ad9def69fc6eebdf6008da2d99e3705a3685; integration/learning-center-i1-release-2026-09-19|origin/integration/learning-center-i1-release-2026-09-19|ce486bd1d615ebf33cbc6fc67d5c9d32c609706c; integration/leo-executive-operating-intelligence-2026-08|origin/integration/leo-executive-operating-intelligence-2026-08|093d21ed1e40b3c05c74a72fa45a8bf78e4e16d6; integration/leo-final-closeout-2026-08|origin/integration/leo-executive-operating-intelligence-2026-08|dfdcab7dfeb9d6523948173e44aaa93ba14ad1a4; integration/lifecycle-foundation-2026-07|origin/integration/lifecycle-foundation-2026-07|18bc2b5bc5d9d5783f948dcde9c08ad6ab9c08b3; integration/ofertas-locales-2026-07|origin/integration/ofertas-locales-2026-07|a8dfed7deeb5d91db95f4f2284e5dcddb9faf179; integration/ofertas-owner-command-center-reconcile-2026-09|origin/main|70e68ff6cc10b6371126c1e68b45e0029c403b24; integration/owner-command-center-globalization-2026-08|origin/integration/owner-command-center-globalization-2026-08|994f7a25b4d1b9a5f2b8ef8afb7f9cf944922707; integration/viajes-complete-2026-08|origin/integration/viajes-complete-2026-08|f563cdf336173625138c8f427d57754f92dc592f; integration/viajes-launch-qa-2026-08||f563cdf336173625138c8f427d57754f92dc592f; integration/website-public-experience-reset-2026-08|origin/integration/website-public-experience-reset-2026-08|e3e65e7da1a679d7f968b6b856412d18a12e12ed; magazine-archive-json|origin/magazine-archive-json|9baf9c8059b2030bf440313bb1aaa11bf05d8552; main|origin/main|d1b2994d36b1e78f1fb91a6d3f801638156b9119; noticias-editorial-polish|origin/noticias-editorial-polish|48f20c5e76c9b19e2b64b8fcdd173857d8cdf869; noticias-n2-front-page-finish-2026-09-02|origin/noticias-n2-front-page-finish-2026-09-02|0496ef39cf7cb20e656aea8e6d2553f84ea73f09; noticias-n3-editorial-quality-2026-09-03|origin/noticias-n3-editorial-quality-2026-09-03|d09d979c1bdba40002ac5e985d6971ce6a87bb0f; noticias-n4-final-production-seal-2026-09-03|origin/noticias-n4-final-production-seal-2026-09-03|807cd3fd105902ab7313945ec0f3a014d63cf8c0; noticias-owner-qa-final-composition-2026-09-03|origin/noticias-owner-qa-final-composition-2026-09-03|66fa8de1590d2f7d991f07ad06052d095b40d83f; occ/servicios-golden-intake-closure||4b402962a12c0daab9058911e7f806a6f86b74d5; qa/community-final-owner-qa-2026-08||5c63e05ea611625fba5ea1d2329c473406f55856; release/autos-privado-preview-live-2026-09-15|origin/release/autos-privado-preview-live-2026-09-15|c44dba67257b6efbe3a23da075f751bce59830c3; release/br-rentas-forward-port-2026-09-17|origin/release/br-rentas-forward-port-2026-09-17|29b31239cc16dd5cb1fb039018c35e9e3fdc359e; release/executive-contact-platform-v2|origin/main|15d5738f5cd423144c090f9c3269c26a24d78476; safety/ofertas-pre-main-sync-2026-08-17||0a87d6dcbaf1085d95d28b2b40614c4030fc8f8b; wip/stabilization-checkpoint||b51216ffc744a651690c68e575370c53b0c7a20b; worktree-admin-os+canonical-truth-2026-09|origin/worktree-admin-os+canonical-truth-2026-09|9fcadb4daf599e15fca62adcb647abbf96ce6bd8
  - Visible origin branches: origin|fd9094994aa2a63fdcea49f24b2435300a7b49a4; origin/auth-foundation-phase1|ba113cd7fdf6037585b8d2d362b99b9719508454; origin/autos-dealership|8500a26e4b8d92aa9759544b906d7d3d2d4cbc06; origin/autos-location-readiness-micro-patches|f97d7141c6bc2f17a84969c55722f44225b5235f; origin/autos-privados-preview|9d8404414073825a4507a6e3c23b48fd0f63cf60; origin/chore/remove-coming-soon-launch-lock-2026-08|7f941d5aec0d973451d5aed8c636a3e5fc440a18; origin/chore/remove-coming-soon-launch-lock-2026-08-v2|5cdf0ea2ec8a96589b456f6cebae005419b95536; origin/claude/quick-business-core-build-2026-09|b66322ba01482dcf433220de0a1855d6824f54c4; origin/claude/quick-classifieds-master-build-0j5p30|71e6fa059560e056103ec5707586c164ea8bd67d; origin/claude/quick-remaining-families-build-2026-09|fe248f22c40fb98407205813dd4e80bcd94bc51f; origin/completion/launch-lifecycle-2026-09-09|b3d0e157e4de1e85bf1c0f802eaa08031c51f702; origin/cursor/cloud-dev-env-setup-4104|07fd2e9f65babd90afc8c4b8061f4d2a94ad09fd; origin/cursor/quick-simple-vs-full-commercial-closeout-2026-09|883467d253e4c14d9d26c71ca9b35eacfe1054b7; origin/cursor/remaining-families-closeout-cb29|5699569c051e93f5ec03aac18294cbdf0888ce53; origin/feature/business-concierge-systemic-repair-2026-09|36a65adf15cdea925e28b618e0294b55fb78f484; origin/feature/business-profile-sales-pipeline-2026-09|fa80e243833ac94d695a9240101296a323ccbb12; origin/feature/business-shared-primitives|47838256390f898d49541ab43def8fe53a364829; origin/feature/comida-local-category-fixes|0c0a878c91e2c0b2afd37200beb6753711f3f806; origin/feature/concierge-assisted-publishing-2026-09|a9f45df3a2a33ff3360145e29a9c843fa4bcff83; origin/feature/digital-contact-platform|3f5e4057bb1ffe3971baaf1691c15726ac1add0a; origin/feature/executive-contact-public-polish|091cc39140dec12bcf07fb0d951150432f10f414; origin/feature/global-address-verification-foundation|b045763bac5300651308bfee54b5a12a507f5845; origin/feature/global-qa-foundation-2026-08|fc55a50fffde3420334795b15a7477398ad825af; origin/feature/iglesias-community-faith-hub|70963b183c24db9d60c6c80a4fc97c4862e25b25; origin/feature/learning-center-flagship-2026-09-18|0b209b2970c727953ec5528f12cdd79f6ff51ee1; origin/feature/newsletter-engine-v2|cd52ffd2c5afb039223f8c511a281427a5f648a4; origin/feature/recursos-community-hub|b55eab25c79892c23dbd98d610fc6aa3c2a273ae; origin/feature/restaurantes-category-fixes|9ff33293e15163cb6ffb03f155868b28f97d79ad; origin/feature/revenue-active-entitlement-edit-guard|a6727e1a20fd89ab24fb39333da6043c1802fd1a; origin/feature/revista-compact-hub-2026-09-19|52bdce381dd928a18fcf7cac43bff1c7f1f6c7fa; origin/feature/servicios-category-fixes|ee65dae4245e22779d0eb4b01adf124e2073c95d; origin/feature/virtual-front-desk|72c2daa171d0a2d2598ecf7b038c872eb8c179d3; origin/fix/br-negocio-inventory-hub-media-hydration-2026-08-27|29b31239cc16dd5cb1fb039018c35e9e3fdc359e; origin/fix/br-rentas-audit-f1-f7-2026-08-27|8c9719cb7eea9e56ab3b3c0bd51f58fcd0005194; origin/fix/business-applications-final-polish-2026-08|a6ab8410614b3a46ffc206f9d5bd5e4d89b094fc; origin/fix/final-audit-defects-2026-08|a8c4c08cd09e06452fc0b18a8964022105d5917a; origin/fix/globalization-final-closeout-2026-09|e3956df893f5041ca22371c999038f297d536eae; origin/fix/ofertas-checkout-standalone-presentation-2026-09|00be6504e7182f1e07179ed00adf5fa843ed92a7; origin/fix/ofertas-flyer-publish-routing-2026-09|2149af385b7da4be0644a9b6395aa5e0fb3e92f6; origin/fix/remove-coming-soon-gate-2026-08|942b14e532aca0170857b2d8c1aab5161dd7cdab; origin/fix/rentas-item13-taxonomy-sync-2026-08-27|14917d40866a23136c61b6a7fa9dc583852b4046; origin/fix/servicios-application-final-qa-2026-08|64a8018766d24c3cd128efbc6c22444e255751a9; origin/global-business-hub-os-2026-08|4aeb0f5a4076509cb1fdab84ec8346c1cd1c209c; origin/global-business-hub-trust-cta-media-2026-08|e7c8ac424977c28d1b35e8999c3dff11db572606; origin/global-final-production-closeout-2026-08|90d0bd2dccad642e5049beb44a9cb476bd253593; origin/global-lifecycle-translate-seo-2026-08|6766c0bfdef40c374f2c1df74deca9cfe94918be; origin/global-location-privacy-security-proof-2026-08|4b3f17305d57e9adf2a162b40a24f682e6b3698d; origin/global-saved-search-autos-matcher-2026-08|1de8cdaff1468674e59fce01ba69a6f74878019b; origin/global-saved-search-autos-outbox-2026-08|e6300e05521ef3486dde66333e36a87386b5251c; origin/global-saved-search-autos-ui-2026-08|b36499e6e5f83995ce4a71c9eeca8849dccfe717; origin/global-saved-search-br-rentas-2026-08|ca9a41ff6d44e1ce6f4b65598aef4153ab054836; origin/global-saved-search-email-delivery-2026-08|abff6b57f1ba95e41f094f50cbcf215e447129cf; origin/global-saved-search-storage-rls-2026-08|48cecca3a99252b3f661a0771f98e5f71d3d3490; origin/global-saved-search-watchlist-architecture-2026-08|fcb7058a0f77ad76fb93e7fc068f2683df4da500; origin/globalization-release-reconcile-2026-08-14|c0912a71bc7f35caec2a9646628d6290f0d59643; origin/hotfix/es-en-launch-gateway-2026-08|3fae3e8d6db22353dccdbe36b94bb941a2a76227; origin/hotfix/restaurantes-prueba-externa-label|b3a8563b4af7332bd38ba5ca902a74587422d6e3; origin/integration/accepted-state-and-amenidades-2026-08|139e118a53cb9e7e0337993954cbe9c3312159fc; origin/integration/ad-branding-studio-foundation-2026-08|b3086746d6ba9aadc73076200376058388003734; origin/integration/admin-os-live-qa-repair-2026-09|988f1a1aabeb83e83cc1b4443177fb9ce484270c; origin/integration/autos-dealer-golden-2026-09-15|cbd30d738130ab37f08a221f782926e804f3dc40; origin/integration/bienes-rentas-qa-2026-08|b1d97015b83ffb5bb0dbc32b3c8bb28f391427da; origin/integration/business-apps-source-red-burndown-2026-08|cbad30f4f4473ea28a7db3de263a76d1ba094608; origin/integration/business-concierge-foundation-2026-07|3eedaf15ec51f2a8a13a876e6d010cd665ece412; origin/integration/category-circuit-closeout-2026-09|a4a1749b45bf66d6c736aad8e4c1d4f3f428a823; origin/integration/coming-soon-home-magazine-2026-08|18bc2b5bc5d9d5783f948dcde9c08ad6ab9c08b3; origin/integration/home-release-2026-09-19|5e72ad9def69fc6eebdf6008da2d99e3705a3685; origin/integration/learning-center-i1-release-2026-09-19|ce486bd1d615ebf33cbc6fc67d5c9d32c609706c; origin/integration/leo-executive-operating-intelligence-2026-08|093d21ed1e40b3c05c74a72fa45a8bf78e4e16d6; origin/integration/lifecycle-foundation-2026-07|f4364cf87b2c2fbaf283b027a753f4ab92a7da26; origin/integration/ofertas-locales-2026-07|a8dfed7deeb5d91db95f4f2284e5dcddb9faf179; origin/integration/ofertas-owner-command-center-reconcile-2026-09|70e68ff6cc10b6371126c1e68b45e0029c403b24; origin/integration/owner-command-center-globalization-2026-08|994f7a25b4d1b9a5f2b8ef8afb7f9cf944922707; origin/integration/viajes-complete-2026-08|f563cdf336173625138c8f427d57754f92dc592f; origin/integration/website-public-experience-reset-2026-08|e3e65e7da1a679d7f968b6b856412d18a12e12ed; origin/main|fd9094994aa2a63fdcea49f24b2435300a7b49a4; origin/noticias-editorial-polish|48f20c5e76c9b19e2b64b8fcdd173857d8cdf869; origin/noticias-n2-front-page-finish-2026-09-02|0496ef39cf7cb20e656aea8e6d2553f84ea73f09; origin/noticias-n3-editorial-quality-2026-09-03|d09d979c1bdba40002ac5e985d6971ce6a87bb0f; origin/noticias-n4-final-production-seal-2026-09-03|807cd3fd105902ab7313945ec0f3a014d63cf8c0; origin/noticias-owner-qa-final-composition-2026-09-03|66fa8de1590d2f7d991f07ad06052d095b40d83f; origin/qa/community-final-owner-qa-2026-08|5c63e05ea611625fba5ea1d2329c473406f55856; origin/release/autos-privado-preview-live-2026-09-15|c44dba67257b6efbe3a23da075f751bce59830c3; origin/release/br-rentas-forward-port-2026-09-17|29b31239cc16dd5cb1fb039018c35e9e3fdc359e; origin/release/executive-contact-platform-v2|15d5738f5cd423144c090f9c3269c26a24d78476; origin/servicios-ux-1|993d409fc8b55b804b0fe235497dc481b4ef72ac; origin/worktree-admin-os+canonical-truth-2026-09|9fcadb4daf599e15fca62adcb647abbf96ce6bd8
  - Current upstream: origin/main; ahead/behind: 0	318
  - Requested PRs/branch patterns: no visible match or GitHub CLI unavailable.

## Project Ownership Map

- app/admin/(dashboard)/leo/_components/LeoActionBar.tsx - Admin OS; owner/user dashboard - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Unstaged
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-autos.jpg - Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-dealers-de-autos.jpg - Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-mecanica-reparacion-auto.jpg - Autos; Servicios - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- .claude/BR_RENTAS_REQUIREMENTS_RECONCILIATION.md - Bienes RaÃ­ces - C:\projects\elaguila-website / integration/home-release-2026-09-19 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-casas.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-comerciales.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-departamentos.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-multifamiliar.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-proyecto-nuevo.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-renta.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-terrenos.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-venta.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-bienes-raices.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-rentas.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-adu-casita.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-apartamento.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-casa-movil.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-cuarto.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-estudio.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-garage.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-para-familia.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-sala-espacio.jpg - Bienes RaÃ­ces - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-articulo.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-ayuda.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-grupo-actividad.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-trabajo-extra.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-transporte-ride.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-voluntarios.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/README.txt - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-baile-danza.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-cocina.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-espanol.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-fitness.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-ingles.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-musica.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-tutoria.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-yoga.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-ciudad.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-familiar.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-feria.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-festival.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-iglesia-comunidad.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-otro-tipo.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-taller-abierto.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_mascotas_generated_images/mascotas-adopcion-de-mascota.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_mascotas_generated_images/mascotas-mascota-encontrada.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_mascotas_generated_images/mascotas-mascota-perdida.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_mascotas_generated_images/mascotas-objeto-encontrado.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_mascotas_generated_images/mascotas-objeto-perdido.jpg - database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- supabase/.temp/build_output.txt - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/cli-latest - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Unstaged
- supabase/.temp/gotrue-version - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/linked-project.json - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/pooler-url - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/postgres-version - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/project-ref - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/rest-version - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s1a_tables_rls.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s1b_constraints.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s1c_fks.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s1d_grants.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s1e_policies.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s2_fixtures_v4.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s2c_biz_checks.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s2c_constraints.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s2f_roster_check.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s2g_existing_roster.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s2h_unique_check.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s2i_indexes.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s3_verify_positive.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s4a_lifecycle.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s4b_crossbiz.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s4c_truth.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s4d_appendonly.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s5_security.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s6_doctrine.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s6_doctrine_v2.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s6_doctrine_v3.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s9_cleanup_v4.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s9_verify_residue.sql - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/storage-migration - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/storage-version - database migrations and generated types - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/migrations/20260819223000_leo_final02_connected_action_truth.sql - database migrations and generated types - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-bajo-millaje.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-camioneta.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-hibrido-electrico.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-menos-10k.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-privado.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-recien-publicado.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-sedan.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-suv.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-bajo-millaje.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-camionetas.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-dealers.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-financiamiento.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-nuevos.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-san-jose.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-suv.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-usados.jpg - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/README.txt - database migrations and generated types; Autos - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-recurso-comunitario.jpg - database migrations and generated types; Learning Center - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- supabase/.temp/s2j_owners_schema.sql - database migrations and generated types; owner/user dashboard; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s2j_owners_schema2.sql - database migrations and generated types; owner/user dashboard; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-servicio.jpg - database migrations and generated types; Servicios - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- supabase/.temp/s1_schema_check.sql - database migrations and generated types; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s2a_biz_schema.sql - database migrations and generated types; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s2b_roster_schema.sql - database migrations and generated types; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s2d_auth_user.sql - database migrations and generated types; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- supabase/.temp/s2e_get_auth.sql - database migrations and generated types; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked
- app/(site)/clasificados/viajes/components/ViajesResultsBusinessCard.tsx - full business listings - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/qa/launch-qa/business-publisher-review-1440.png - full business listings - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/business-publisher-step1-390.png - full business listings - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/lib/ofertas-locales/OFERTAS_QA_UX_BATCH_PLAN.md - Globalization - C:\projects\elaguila-website / integration/ofertas-locales-2026-07 - Untracked
- docs/globalization/forensic-2026-09-09/00_EXECUTIVE_CERTIFICATION.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/01_REPOSITORY_AND_WORKTREE_INVENTORY.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/02_GLOBALIZATION_COMMIT_LINEAGE_JUL14_TO_CURRENT.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/03_GLOBAL_ENGINE_SOURCE_MAP_G01_G53.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/03B_NEWSLETTER_SEO_A11Y_PWA_SECURITY.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/04_CATEGORY_FULL_CYCLE_CERTIFICATION.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/04D_COMMUNITY_LANES_VIAJES_FULL_CYCLE.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/05_CATEGORY_EXACT_CODE_PATHWAYS.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/05B_COMMUNITY_LANES_VIAJES_PATHWAYS.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/06_DATA_ROUND_TRIP_FIELD_AUDIT.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/10_ANALYTICS_EVENT_COVERAGE.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/13B_TRUST_REVIEWS_ADDRESS_COMPLETION.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/14_SEARCH_RESULTS_RELATED_SAVED_SEARCH_AUDIT.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/15_MEDIA_FLYER_PDF_AUDIT.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/16_ORPHANED_DUPLICATE_UNINTEGRATED_WORK.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/20_REPOSITORY_ORGANIZATION_MAP.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/21_FINAL_TRUE_FALSE_MATRIX.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/22_FINAL_RECONCILIATION_PLAN.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/AUDIT_COVERAGE_AND_REMAINING_WORK.md - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/globalization-certification.json - Globalization - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/09_ADMIN_OS_AUDIT.md - Globalization; Admin OS - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/09A_ADMIN_AUTH_ADVERSARIAL_REAUDIT.md - Globalization; Admin OS; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/04C_AUTOS_EMPLEOS_FULL_CYCLE.md - Globalization; Autos - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/12B_AUTOS_PARENT_CHILD_AUDIT.md - Globalization; Autos - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/04B_BIENES_RENTAS_FULL_CYCLE.md - Globalization; Bienes RaÃ­ces - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/12A_BIENES_PARENT_CHILD_AUDIT.md - Globalization; Bienes RaÃ­ces - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/12_AUTOS_BIENES_PARENT_CHILD_AUDIT.md - Globalization; Bienes RaÃ­ces; Autos - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/13_BUSINESS_HUB_CONNECTION_TRUST_ADDRESS_AUDIT.md - Globalization; full business listings - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/08_USER_DASHBOARD_OWNER_COMMAND_CENTER_AUDIT.md - Globalization; owner/user dashboard - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/18_OWNER_QA_READY_MATRIX.md - Globalization; owner/user dashboard - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/19_OWNER_QA_PLAYBOOK.md - Globalization; owner/user dashboard - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/04A_SERVICIOS_RESTAURANTES_COMIDA_FULL_CYCLE.md - Globalization; Restaurantes; Servicios - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/05A_SERVICIOS_RESTAURANTES_COMIDA_PATHWAYS.md - Globalization; Restaurantes; Servicios - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/17_ACTIVATION_GAP_LEDGER.md - Globalization; Rewards/credits - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/07_CATEGORY_REGISTRY_CONSISTENCY_AUDIT.md - Globalization; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities - C:\projects\elaguila-website / main - Untracked
- docs/globalization/forensic-2026-09-09/11_REVENUE_STRIPE_PROMO_ENTITLEMENT_AUDIT.md - Globalization; Stripe/payments/subscriptions - C:\projects\elaguila-website / main - Untracked
- app/(site)/clasificados/viajes/data/viajesHomeFeedSelectors.ts - Homepage/marketing - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- .claude/LEARNING_I1A_APPLY_EVIDENCE_2026-09-18.md - Learning Center - C:\projects\elaguila-website / integration/learning-center-i1-release-2026-09-19 - Untracked
- .claude/LEARNING_I1A_BEFORE_SNAPSHOT_2026-09-18.json - Learning Center - C:\projects\elaguila-website / integration/learning-center-i1-release-2026-09-19 - Untracked
- .claude/LEARNING_I1A1_APPLY_EVIDENCE_2026-09-18.md - Learning Center - C:\projects\elaguila-website / integration/learning-center-i1-release-2026-09-19 - Untracked
- .claude/LEARNING_I1B_APPLY_EVIDENCE_2026-09-19.md - Learning Center - C:\projects\elaguila-website / integration/learning-center-i1-release-2026-09-19 - Untracked
- .claude/LEARNING_I1B_BEFORE_SNAPSHOT_2026-09-19.md - Learning Center - C:\projects\elaguila-website / integration/learning-center-i1-release-2026-09-19 - Untracked
- data/recursos/verified/production-promotion-2026-08-25/00-preflight.sql - Learning Center - C:\projects\elaguila-website / feature/recursos-community-hub - Untracked
- data/recursos/verified/production-promotion-2026-08-25/01-insert-19-approved-resources.sql - Learning Center - C:\projects\elaguila-website / feature/recursos-community-hub - Untracked
- data/recursos/verified/production-promotion-2026-08-25/99-postflight.sql - Learning Center - C:\projects\elaguila-website / feature/recursos-community-hub - Untracked
- data/recursos/verified/production-promotion-2026-08-25/README.md - Learning Center - C:\projects\elaguila-website / feature/recursos-community-hub - Untracked
- scripts/recursos/seed-verified-resources.ts - Learning Center - C:\projects\elaguila-website / feature/recursos-community-hub - Unstaged
- app/(site)/clasificados/viajes/qa/launch-qa/OWNER-QA.md - owner/user dashboard - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- .claude/BR_RENTAS_OWNER_LIVE_QA_RUNBOOK.md - owner/user dashboard; Bienes RaÃ­ces - C:\projects\elaguila-website / integration/home-release-2026-09-19 - Untracked
- .claude/BR_RENTAS_OWNER_RUNTIME_QA.md - owner/user dashboard; Bienes RaÃ­ces - C:\projects\elaguila-website / integration/home-release-2026-09-19 - Untracked
- .claude/BR_RENTAS_OWNER_VISUAL_QA_CHECKLIST.md - owner/user dashboard; Bienes RaÃ­ces - C:\projects\elaguila-website / integration/home-release-2026-09-19 - Untracked
- .claude/BR_RENTAS_OWNER_CHANGE_LEDGER_AUDITED.md - owner/user dashboard; Rewards/credits; Bienes RaÃ­ces - C:\projects\elaguila-website / integration/home-release-2026-09-19 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-restaurante.jpg - Restaurantes - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-comida-local.jpg - Restaurantes - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-restaurantes.jpg - Restaurantes - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-distribucion-comida.jpg - Restaurantes; database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-catering.jpg - Restaurantes; database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-china.jpg - Restaurantes; database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-food-truck.jpg - Restaurantes; database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-hamburguesas.jpg - Restaurantes; database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-italiana.jpg - Restaurantes; database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-mexicana.jpg - Restaurantes; database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-pizza.jpg - Restaurantes; database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-postres.jpg - Restaurantes; database migrations and generated types - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-servicios.jpg - Servicios - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-abogados-legal.jpg - Servicios - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-contadores.jpg - Servicios - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-dentistas-salud.jpg - Servicios - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-electricista.jpg - Servicios - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-jardineria.jpg - Servicios - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-limpieza.jpg - Servicios - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-plomeria.jpg - Servicios - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- app/api/leo/action/execute/route.ts - shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Untracked
- app/leo/_lib/leoToolRegistry.ts - shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Unstaged
- scripts/LEO_GOOGLE_OAUTH_SETUP.md - shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Unstaged
- scripts/leo-google-oauth-offline.mjs - shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Unstaged
- .claude/launch.json - unknown/other - C:\projects\elaguila-website / noticias-n2-front-page-finish-2026-09-02 - Untracked
- .devin/config.local.json - unknown/other - C:\projects\elaguila-website / globalization-release-reconcile-2026-08-14 - Untracked
- .release-qa/church-clean-qa.json - unknown/other - C:\projects\elaguila-website / main - Untracked
- .release-qa/church-public-en.html - unknown/other - C:\projects\elaguila-website / main - Untracked
- .release-qa/church-public-es.html - unknown/other - C:\projects\elaguila-website / main - Untracked
- .release-qa/church-qa.json - unknown/other - C:\projects\elaguila-website / main - Untracked
- .release-qa/prayer-qa.json - unknown/other - C:\projects\elaguila-website / main - Untracked
- .release-qa/prayer-submit.out - unknown/other - C:\projects\elaguila-website / main - Untracked
- .release-qa/test-logo.gif - unknown/other - C:\projects\elaguila-website / main - Untracked
- .release-qa/test-logo.png - unknown/other - C:\projects\elaguila-website / main - Untracked
- .release-qa/test-oversize.png - unknown/other - C:\projects\elaguila-website / main - Untracked
- app/(site)/clasificados/viajes/components/ViajesAudienceBuckets.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesDestinations.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesHero.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesLandingPage.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesLocalDepartures.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesLowerSections.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesMobilitySection.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesNearbyEscapes.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesNegocioProfileLayout.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesOfferDetailGallery.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesOfferDetailLayout.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesOfferHeroBackdrop.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesOfferInquiryHub.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesOfferModuleCards.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesOfferRelatedRails.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesResultsAffiliateCard.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesResultsEditorialCard.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesResultsShell.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesSafeImage.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/components/ViajesStaySection.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesTopOfferCard.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/components/ViajesTopOffers.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/data/viajesLandingSampleData.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/data/viajesNegocioProfileSampleData.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/lib/resolveViajesOfferDetailFromStagedServer.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/lib/resolveViajesProviderProfileFromStagedServer.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/lib/v2/mapViajesOfferV2ToBrowseResult.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/lib/v2/mapViajesOfferV2ToDetailModel.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/lib/viajesCtaHref.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/lib/viajesDiscoveryRanking.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/lib/viajesLocalSeo.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/lib/viajesOfferDetailRelatedServer.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/lib/viajesOfferHeroFallbacks.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/lib/viajesPriceDisplay.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/lib/viajesProviderMatch.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/lib/viajesPublicBrowseRowsServer.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/lib/viajesPublicDateDisplay.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/lib/viajesPublicInventory.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/lib/viajesPublicOfferTitle.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/negocio/[slug]/page.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/oferta/[slug]/page.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/page.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/clasificados/viajes/qa/launch-qa/[sensitive-file-redacted] - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/build.log - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/build-remediation.log - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/build-remediation2.log - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/build-remediation3.log - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/build-remediation4.log - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/build-remediation5.log - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/capture-screenshots.mjs - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/fixtures.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/landing-1440.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/landing-390.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/landing-768.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/offer-detail-full-1440.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/offer-detail-full-390.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/offer-detail-minimal-1440.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/offer-detail-minimal-390.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/playwright.log - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/playwright-remediation.log - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/playwright-remediation5.log - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/probe-db-row.mjs - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/probe-results-visibility.mjs - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/provider-1440.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/provider-390.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/README.md - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/results-default-1440.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/results-default-390.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/results-default-768.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/results-empty-1440.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/results-empty-390.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/results-filtered-1440.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/results-filtered-390.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/results-sorted-1440.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/results-sorted-390.png - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/screenshots.log - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/smoke.log - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/smoke-3103.log - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/smoke-3103.mjs - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/qa/launch-qa/typecheck.log - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/clasificados/viajes/resultados/page.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/publicar/viajes/components/modules/ViajesModuleAccommodationEditor.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/publicar/viajes/components/modules/viajesModuleEditorCopy.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- app/(site)/publicar/viajes/components/modules/ViajesModuleItineraryEditor.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/publicar/viajes/components/modules/viajesModuleListEditor.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/publicar/viajes/negocios/components/ViajesNegociosStepInclusions.tsx - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/(site)/publicar/viajes/negocios/data/publicarViajesNegociosCopy.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- app/leo/_lib/leoActionExecutionService.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Untracked
- app/leo/_lib/leoActionProposalFingerprint.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Untracked
- app/leo/_lib/leoActionProposalRepository.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Untracked
- app/leo/_lib/leoCalendarWriteAdapter.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Untracked
- app/leo/_lib/leoConnectedActionPreparationService.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Untracked
- app/leo/_lib/leoExecutiveActions.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Unstaged
- app/leo/_lib/leoGmailWriteAdapter.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Untracked
- app/leo/_lib/leoGoogleWorkspaceConfig.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Unstaged
- app/leo/_lib/leoPeopleAdapter.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Untracked
- app/leo/_lib/leoToolCatalog.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Unstaged
- app/leo/_lib/leoTypes.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Unstaged
- e2e/viajes-runtime-qa.spec.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Unstaged
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-bodega.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-oficina.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-oficios.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-salud.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-tecnologia.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-transporte.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-ventas.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-busco-se-busca.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-clases.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-comunidad-eventos.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-empleos.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-mascotas-perdidos.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-varios.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-viajes.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/README.txt - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-bebes-ninos.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-deportes-aire-libre.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-electronica-tecnologia.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-herramientas-materiales.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-hogar-cocina-electrodomesticos.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-muebles.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-otros-articulos.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-ropa-zapatos-accesorios.jpg - unknown/other - C:\projects\elaguila-website / qa/community-final-owner-qa-2026-08 - Untracked
- leo-runtime-audit.txt - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Untracked
- scripts/verify-leo-final02-calendar-write-contract.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Untracked
- scripts/verify-leo-final02-confirmation-execution.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Untracked
- scripts/verify-leo-final02-contacts-resolution.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Untracked
- scripts/verify-leo-final02-gmail-write-contract.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Untracked
- scripts/verify-leo-final02-provider-truth.ts - unknown/other - C:\projects\elaguila-website / integration/leo-final-closeout-2026-08 - Untracked
- scripts/viajes-launch-qa-selftest.ts - unknown/other - C:\projects\elaguila-website / integration/viajes-launch-qa-2026-08 - Untracked
- stop - unknown/other - C:\projects\elaguila-website / feature/business-concierge-systemic-repair-2026-09 - Untracked

## Collision Matrix

| File or area | Repository | Branch/worktree | Existing project | Planned project | Classification | Risk | Preservation recommendation |
|---|---|---|---|---|---|---|---|
| .release-qa/church-clean-qa.json | C:\projects\elaguila-website | main / C:/projects/elaguila-website | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .release-qa/church-public-en.html | C:\projects\elaguila-website | main / C:/projects/elaguila-website | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .release-qa/church-public-es.html | C:\projects\elaguila-website | main / C:/projects/elaguila-website | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .release-qa/church-qa.json | C:\projects\elaguila-website | main / C:/projects/elaguila-website | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .release-qa/prayer-qa.json | C:\projects\elaguila-website | main / C:/projects/elaguila-website | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .release-qa/test-logo.gif | C:\projects\elaguila-website | main / C:/projects/elaguila-website | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .release-qa/test-logo.png | C:\projects\elaguila-website | main / C:/projects/elaguila-website | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .release-qa/test-oversize.png | C:\projects\elaguila-website | main / C:/projects/elaguila-website | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| docs/globalization/forensic-2026-09-09/00_EXECUTIVE_CERTIFICATION.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/01_REPOSITORY_AND_WORKTREE_INVENTORY.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/02_GLOBALIZATION_COMMIT_LINEAGE_JUL14_TO_CURRENT.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/03_GLOBAL_ENGINE_SOURCE_MAP_G01_G53.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/03B_NEWSLETTER_SEO_A11Y_PWA_SECURITY.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/04_CATEGORY_FULL_CYCLE_CERTIFICATION.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/04A_SERVICIOS_RESTAURANTES_COMIDA_FULL_CYCLE.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; Restaurantes; Servicios | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/04B_BIENES_RENTAS_FULL_CYCLE.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/04C_AUTOS_EMPLEOS_FULL_CYCLE.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/04D_COMMUNITY_LANES_VIAJES_FULL_CYCLE.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/05_CATEGORY_EXACT_CODE_PATHWAYS.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/05A_SERVICIOS_RESTAURANTES_COMIDA_PATHWAYS.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; Restaurantes; Servicios | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/05B_COMMUNITY_LANES_VIAJES_PATHWAYS.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/06_DATA_ROUND_TRIP_FIELD_AUDIT.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/07_CATEGORY_REGISTRY_CONSISTENCY_AUDIT.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/08_USER_DASHBOARD_OWNER_COMMAND_CENTER_AUDIT.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; owner/user dashboard | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/09_ADMIN_OS_AUDIT.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; Admin OS | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/09A_ADMIN_AUTH_ADVERSARIAL_REAUDIT.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; Admin OS; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/10_ANALYTICS_EVENT_COVERAGE.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/11_REVENUE_STRIPE_PROMO_ENTITLEMENT_AUDIT.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; Stripe/payments/subscriptions | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/12_AUTOS_BIENES_PARENT_CHILD_AUDIT.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; Bienes RaÃ­ces; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/12A_BIENES_PARENT_CHILD_AUDIT.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/12B_AUTOS_PARENT_CHILD_AUDIT.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/13_BUSINESS_HUB_CONNECTION_TRUST_ADDRESS_AUDIT.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; full business listings | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/13B_TRUST_REVIEWS_ADDRESS_COMPLETION.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/14_SEARCH_RESULTS_RELATED_SAVED_SEARCH_AUDIT.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/15_MEDIA_FLYER_PDF_AUDIT.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/16_ORPHANED_DUPLICATE_UNINTEGRATED_WORK.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/17_ACTIVATION_GAP_LEDGER.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; Rewards/credits | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/18_OWNER_QA_READY_MATRIX.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; owner/user dashboard | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/19_OWNER_QA_PLAYBOOK.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization; owner/user dashboard | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/20_REPOSITORY_ORGANIZATION_MAP.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/21_FINAL_TRUE_FALSE_MATRIX.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/22_FINAL_RECONCILIATION_PLAN.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/AUDIT_COVERAGE_AND_REMAINING_WORK.md | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| docs/globalization/forensic-2026-09-09/globalization-certification.json | C:\projects\elaguila-website | main / C:/projects/elaguila-website | Globalization | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| .claude/launch.json | C:\projects\elaguila-website | integration/ad-branding-studio-foundation-2026-08 / C:/projects/elaguila-website-ad-branding-studio | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .claude/launch.json | C:\projects\elaguila-website | autos-dealership / C:/projects/elaguila-website-autos-dealership | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .claude/launch.json | C:\projects\elaguila-website | integration/autos-dealer-golden-2026-09-15 / C:/projects/elaguila-website-autos-privados-preview | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .claude/launch.json | C:\projects\elaguila-website | integration/business-apps-source-red-burndown-2026-08 / C:/projects/elaguila-website-business-applications-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .claude/launch.json | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .devin/config.local.json | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| stop | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| supabase/.temp/build_output.txt | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/cli-latest | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/gotrue-version | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/linked-project.json | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/pooler-url | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/postgres-version | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/project-ref | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/rest-version | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s1_schema_check.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s1a_tables_rls.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s1b_constraints.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s1c_fks.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s1d_grants.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s1e_policies.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s2_fixtures_v4.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s2a_biz_schema.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s2b_roster_schema.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s2c_biz_checks.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s2c_constraints.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s2d_auth_user.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s2e_get_auth.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s2f_roster_check.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s2g_existing_roster.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s2h_unique_check.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s2i_indexes.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s2j_owners_schema.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types; owner/user dashboard; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s2j_owners_schema2.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types; owner/user dashboard; shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s3_verify_positive.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s4a_lifecycle.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s4b_crossbiz.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s4c_truth.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s4d_appendonly.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s5_security.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s6_doctrine.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s6_doctrine_v2.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s6_doctrine_v3.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s9_cleanup_v4.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/s9_verify_residue.sql | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/storage-migration | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| supabase/.temp/storage-version | C:\projects\elaguila-website | feature/business-concierge-systemic-repair-2026-09 / C:/projects/elaguila-website-concierge | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| .claude/launch.json | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-casas.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-comerciales.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-departamentos.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-multifamiliar.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-proyecto-nuevo.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-renta.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-terrenos.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Bienes_Raices/bienes-raices-venta.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-bodega.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-oficina.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-oficios.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-restaurante.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Restaurantes | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-salud.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-tecnologia.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-transporte.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Empleos/empleos-ventas.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-bajo-millaje.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-camioneta.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-hibrido-electrico.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-menos-10k.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-privado.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-recien-publicado.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-sedan.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_autos_generated_images/autos-suv.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-articulo.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-ayuda.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-grupo-actividad.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-recurso-comunitario.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Learning Center | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-servicio.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Servicios | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-trabajo-extra.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-transporte-ride.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_busco_generated_images/busco-voluntarios.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-baile-danza.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-cocina.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-espanol.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-fitness.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-ingles.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-musica.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-tutoria.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_clases_generated_images/clases-yoga.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-bajo-millaje.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-camionetas.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-dealers.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-financiamiento.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-nuevos.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-san-jose.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-suv.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/dealers-de-autos-usados.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_dealers_de_autos_generated_images/README.txt | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types; Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-ciudad.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-familiar.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-feria.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-festival.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-iglesia-comunidad.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-otro-tipo.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_eventos_generated_images/eventos-taller-abierto.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-autos.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-bienes-raices.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-busco-se-busca.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-clases.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-comida-local.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Restaurantes | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-comunidad-eventos.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-dealers-de-autos.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Autos | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-empleos.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-mascotas-perdidos.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-rentas.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-restaurantes.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Restaurantes | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-servicios.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Servicios | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-varios.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_landing_page_card_images/landing-viajes.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_mascotas_generated_images/mascotas-adopcion-de-mascota.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_mascotas_generated_images/mascotas-mascota-encontrada.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_mascotas_generated_images/mascotas-mascota-perdida.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_mascotas_generated_images/mascotas-objeto-encontrado.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_mascotas_generated_images/mascotas-objeto-perdido.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | database migrations and generated types | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-catering.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Restaurantes; database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-china.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Restaurantes; database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-food-truck.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Restaurantes; database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-hamburguesas.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Restaurantes; database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-italiana.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Restaurantes; database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-mexicana.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Restaurantes; database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-pizza.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Restaurantes; database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/leonix_restaurantes_generated_images/restaurantes-postres.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Restaurantes; database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-adu-casita.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-apartamento.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-casa-movil.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-cuarto.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-estudio.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-garage.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-para-familia.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/rentas/rentas-sala-espacio.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-abogados-legal.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Servicios | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-contadores.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Servicios | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-dentistas-salud.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Servicios | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-electricista.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Servicios | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-jardineria.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Servicios | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-limpieza.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Servicios | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-mecanica-reparacion-auto.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Autos; Servicios | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/Servicios/servicios-plomeria.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | Servicios | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-bebes-ninos.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-deportes-aire-libre.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-electronica-tecnologia.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-herramientas-materiales.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-hogar-cocina-electrodomesticos.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-muebles.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-otros-articulos.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| LEONIX_LANDING_IMAGE_INTAKE/Varios/varios-ropa-zapatos-accesorios.jpg | C:\projects\elaguila-website | qa/community-final-owner-qa-2026-08 / C:/projects/elaguila-website-final-audit-fixes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .devin/config.local.json | C:\projects\elaguila-website | globalization-release-reconcile-2026-08-14 / C:/projects/elaguila-website-globalization-reconcile | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .claude/launch.json | C:\projects\elaguila-website | integration/learning-center-i1-release-2026-09-19 / C:/projects/elaguila-website-learning-center | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .claude/LEARNING_I1A_APPLY_EVIDENCE_2026-09-18.md | C:\projects\elaguila-website | integration/learning-center-i1-release-2026-09-19 / C:/projects/elaguila-website-learning-center | Learning Center | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| .claude/LEARNING_I1A_BEFORE_SNAPSHOT_2026-09-18.json | C:\projects\elaguila-website | integration/learning-center-i1-release-2026-09-19 / C:/projects/elaguila-website-learning-center | Learning Center | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| .claude/LEARNING_I1A1_APPLY_EVIDENCE_2026-09-18.md | C:\projects\elaguila-website | integration/learning-center-i1-release-2026-09-19 / C:/projects/elaguila-website-learning-center | Learning Center | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| .claude/LEARNING_I1B_APPLY_EVIDENCE_2026-09-19.md | C:\projects\elaguila-website | integration/learning-center-i1-release-2026-09-19 / C:/projects/elaguila-website-learning-center | Learning Center | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| .claude/LEARNING_I1B_BEFORE_SNAPSHOT_2026-09-19.md | C:\projects\elaguila-website | integration/learning-center-i1-release-2026-09-19 / C:/projects/elaguila-website-learning-center | Learning Center | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| app/admin/(dashboard)/leo/_components/LeoActionBar.tsx | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | Admin OS; owner/user dashboard | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| app/leo/_lib/leoActionExecutionService.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/leo/_lib/leoActionProposalFingerprint.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/leo/_lib/leoActionProposalRepository.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/leo/_lib/leoCalendarWriteAdapter.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/leo/_lib/leoConnectedActionPreparationService.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/leo/_lib/leoExecutiveActions.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/leo/_lib/leoGmailWriteAdapter.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/leo/_lib/leoGoogleWorkspaceConfig.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/leo/_lib/leoPeopleAdapter.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/leo/_lib/leoToolCatalog.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/leo/_lib/leoToolRegistry.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| app/leo/_lib/leoTypes.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| scripts/LEO_GOOGLE_OAUTH_SETUP.md | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| scripts/leo-google-oauth-offline.mjs | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | shared authentication, authorization, middleware, navigation, schemas, registries, or API utilities | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| scripts/verify-leo-final02-calendar-write-contract.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| scripts/verify-leo-final02-confirmation-execution.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| scripts/verify-leo-final02-contacts-resolution.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| scripts/verify-leo-final02-gmail-write-contract.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| scripts/verify-leo-final02-provider-truth.ts | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| supabase/migrations/20260819223000_leo_final02_connected_action_truth.sql | C:\projects\elaguila-website | integration/leo-final-closeout-2026-08 / C:/projects/elaguila-website-leo-final | database migrations and generated types | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| .claude/launch.json | C:\projects\elaguila-website | noticias-n2-front-page-finish-2026-09-02 / C:/projects/elaguila-website-noticias-n2 | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .claude/launch.json | C:\projects\elaguila-website | integration/owner-command-center-globalization-2026-08 / C:/projects/elaguila-website-owner-command-center | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .claude/launch.json | C:\projects\elaguila-website | feature/recursos-community-hub / C:/projects/elaguila-website-recursos | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| data/recursos/verified/production-promotion-2026-08-25/00-preflight.sql | C:\projects\elaguila-website | feature/recursos-community-hub / C:/projects/elaguila-website-recursos | Learning Center | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| data/recursos/verified/production-promotion-2026-08-25/01-insert-19-approved-resources.sql | C:\projects\elaguila-website | feature/recursos-community-hub / C:/projects/elaguila-website-recursos | Learning Center | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| data/recursos/verified/production-promotion-2026-08-25/99-postflight.sql | C:\projects\elaguila-website | feature/recursos-community-hub / C:/projects/elaguila-website-recursos | Learning Center | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| scripts/recursos/seed-verified-resources.ts | C:\projects\elaguila-website | feature/recursos-community-hub / C:/projects/elaguila-website-recursos | Learning Center | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesAudienceBuckets.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesDestinations.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesHero.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesLandingPage.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesLocalDepartures.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesLowerSections.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesMobilitySection.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesNearbyEscapes.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesOfferDetailGallery.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesOfferHeroBackdrop.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesOfferInquiryHub.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesOfferModuleCards.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesOfferRelatedRails.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesResultsAffiliateCard.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesResultsBusinessCard.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | full business listings | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| app/(site)/clasificados/viajes/components/ViajesResultsEditorialCard.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesResultsShell.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesSafeImage.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesStaySection.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesTopOfferCard.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/components/ViajesTopOffers.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/data/viajesHomeFeedSelectors.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | Homepage/marketing | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/data/viajesLandingSampleData.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/data/viajesNegocioProfileSampleData.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/lib/resolveViajesOfferDetailFromStagedServer.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/lib/resolveViajesProviderProfileFromStagedServer.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/lib/v2/mapViajesOfferV2ToBrowseResult.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/lib/v2/mapViajesOfferV2ToDetailModel.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/lib/viajesCtaHref.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/lib/viajesDiscoveryRanking.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/lib/viajesLocalSeo.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/lib/viajesOfferDetailRelatedServer.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/lib/viajesOfferHeroFallbacks.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/lib/viajesPriceDisplay.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/lib/viajesProviderMatch.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/lib/viajesPublicBrowseRowsServer.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/lib/viajesPublicDateDisplay.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/lib/viajesPublicInventory.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/lib/viajesPublicOfferTitle.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/negocio/[slug]/page.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/oferta/[slug]/page.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/page.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/[sensitive-file-redacted] | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/business-publisher-review-1440.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | full business listings | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| app/(site)/clasificados/viajes/qa/launch-qa/business-publisher-step1-390.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | full business listings | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| app/(site)/clasificados/viajes/qa/launch-qa/capture-screenshots.mjs | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/fixtures.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/landing-1440.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/landing-390.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/landing-768.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/offer-detail-full-1440.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/offer-detail-full-390.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/offer-detail-minimal-1440.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/offer-detail-minimal-390.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/OWNER-QA.md | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | owner/user dashboard | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| app/(site)/clasificados/viajes/qa/launch-qa/playwright.log | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/playwright-remediation.log | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/playwright-remediation5.log | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/probe-db-row.mjs | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/probe-results-visibility.mjs | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/provider-1440.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/provider-390.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/results-default-1440.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/results-default-390.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/results-default-768.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/results-empty-1440.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/results-empty-390.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/results-filtered-1440.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/results-filtered-390.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/results-sorted-1440.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/results-sorted-390.png | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/screenshots.log | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/smoke.log | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/smoke-3103.log | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/smoke-3103.mjs | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/qa/launch-qa/typecheck.log | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/clasificados/viajes/resultados/page.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/publicar/viajes/components/modules/ViajesModuleAccommodationEditor.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/publicar/viajes/components/modules/viajesModuleEditorCopy.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/publicar/viajes/components/modules/ViajesModuleItineraryEditor.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/publicar/viajes/components/modules/viajesModuleListEditor.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/publicar/viajes/negocios/components/ViajesNegociosStepInclusions.tsx | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| app/(site)/publicar/viajes/negocios/data/publicarViajesNegociosCopy.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| e2e/viajes-runtime-qa.spec.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| scripts/viajes-launch-qa-selftest.ts | C:\projects\elaguila-website | integration/viajes-launch-qa-2026-08 / C:/projects/elaguila-website-viajes | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |
| .claude/BR_RENTAS_OWNER_CHANGE_LEDGER_AUDITED.md | C:\projects\elaguila-website | integration/home-release-2026-09-19 / C:/projects/elaguila-website-website | owner/user dashboard; Rewards/credits; Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| .claude/BR_RENTAS_OWNER_LIVE_QA_RUNBOOK.md | C:\projects\elaguila-website | integration/home-release-2026-09-19 / C:/projects/elaguila-website-website | owner/user dashboard; Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| .claude/BR_RENTAS_OWNER_RUNTIME_QA.md | C:\projects\elaguila-website | integration/home-release-2026-09-19 / C:/projects/elaguila-website-website | owner/user dashboard; Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| .claude/BR_RENTAS_OWNER_VISUAL_QA_CHECKLIST.md | C:\projects\elaguila-website | integration/home-release-2026-09-19 / C:/projects/elaguila-website-website | owner/user dashboard; Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| .claude/BR_RENTAS_REQUIREMENTS_RECONCILIATION.md | C:\projects\elaguila-website | integration/home-release-2026-09-19 / C:/projects/elaguila-website-website | Bienes RaÃ­ces | Quick Business + Leonix IX Rewards | SHARED | Integration order required | Preserve unchanged; compare and integrate deliberately. |
| .claude/launch.json | C:\projects\elaguila-website | integration/home-release-2026-09-19 / C:/projects/elaguila-website-website | unknown/other | Quick Business + Leonix IX Rewards | UNKNOWN | Needs owner review | Preserve unchanged; owner review before integration. |

## Safe Base Candidates

- C:/projects/elaguila-website/.claude/worktrees/zen-northcutt-84724c -  at 7cd5f524da65be74bd81003329acdff44f72b081; clean worktree candidate.
- C:/projects/elaguila-website-address-foundation - feature/global-address-verification-foundation at b045763bac5300651308bfee54b5a12a507f5845; clean worktree candidate.
- C:/projects/elaguila-website-admin-live-qa - integration/category-circuit-closeout-2026-09 at a4a1749b45bf66d6c736aad8e4c1d4f3f428a823; clean worktree candidate.
- C:/projects/elaguila-website-br-rentas-forward-port - release/br-rentas-forward-port-2026-09-17 at 29b31239cc16dd5cb1fb039018c35e9e3fdc359e; clean worktree candidate.
- C:/projects/elaguila-website-business-profile-sales-pipeline - fix/business-information-live-save-2026-09-17 at 0cb9f00b27390da803a0dd2c4ee8f5d5f9b15e81; clean worktree candidate.
- C:/projects/elaguila-website-business-shared-primitives - feature/business-shared-primitives at 47838256390f898d49541ab43def8fe53a364829; clean worktree candidate.
- C:/projects/elaguila-website-comida-local-category-fixes - feature/comida-local-category-fixes at 0c0a878c91e2c0b2afd37200beb6753711f3f806; clean worktree candidate.
- C:/projects/elaguila-website-community-final-audit - audit/community-final-owner-ledger-2026-08 at a2977915a3a256ff95b8c3475b7a85dafe428d14; clean worktree candidate.
- C:/projects/elaguila-website-digital-contact - feature/executive-hub-staff-flow-final at 0314ca6b2ab42d2fb37cd7e083943ade40349939; clean worktree candidate.
- C:/projects/elaguila-website-final-audit-reconcile -  at a8c4c08cd09e06452fc0b18a8964022105d5917a; clean worktree candidate.
- C:/projects/elaguila-website-global-qa-foundation - feature/global-qa-foundation-2026-08 at fc55a50fffde3420334795b15a7477398ad825af; clean worktree candidate.
- C:/projects/elaguila-website-globalization-final-closeout - fix/globalization-final-closeout-2026-09 at e3956df893f5041ca22371c999038f297d536eae; clean worktree candidate.
- C:/projects/elaguila-website-hotfix-es-en - hotfix/es-en-launch-gateway-2026-08 at 3fae3e8d6db22353dccdbe36b94bb941a2a76227; clean worktree candidate.
- C:/projects/elaguila-website-launch-lifecycle - completion/launch-lifecycle-2026-09-09 at b3d0e157e4de1e85bf1c0f802eaa08031c51f702; clean worktree candidate.
- C:/projects/elaguila-website-leo - integration/leo-executive-operating-intelligence-2026-08 at 093d21ed1e40b3c05c74a72fa45a8bf78e4e16d6; clean worktree candidate.
- C:/projects/elaguila-website-leo-release-temp -  at 66f208b1c7a1def81ffc88084fb42b075a5de5b1; clean worktree candidate.
- C:/projects/elaguila-website-newsletter-v2 - feature/newsletter-engine-v2 at cd52ffd2c5afb039223f8c511a281427a5f648a4; clean worktree candidate.
- C:/projects/elaguila-website-noticias-n3 - noticias-n3-editorial-quality-2026-09-03 at d09d979c1bdba40002ac5e985d6971ce6a87bb0f; clean worktree candidate.
- C:/projects/elaguila-website-noticias-n4 - noticias-n4-final-production-seal-2026-09-03 at 807cd3fd105902ab7313945ec0f3a014d63cf8c0; clean worktree candidate.
- C:/projects/elaguila-website-noticias-owner-qa - noticias-owner-qa-final-composition-2026-09-03 at 66fa8de1590d2f7d991f07ad06052d095b40d83f; clean worktree candidate.
- C:/projects/elaguila-website-ofertas-owner-reconcile - integration/ofertas-owner-command-center-reconcile-2026-09 at 70e68ff6cc10b6371126c1e68b45e0029c403b24; clean worktree candidate.
- C:/projects/elaguila-website-remove-coming-soon-gate - fix/remove-coming-soon-gate-2026-08 at 942b14e532aca0170857b2d8c1aab5161dd7cdab; clean worktree candidate.
- C:/projects/elaguila-website-restaurantes-category-fixes - feature/restaurantes-category-fixes at 9ff33293e15163cb6ffb03f155868b28f97d79ad; clean worktree candidate.
- C:/projects/elaguila-website-revenue-entitlement-guard - feature/revenue-active-entitlement-edit-guard at a6727e1a20fd89ab24fb39333da6043c1802fd1a; clean worktree candidate.
- C:/projects/elaguila-website-revista - feature/revista-compact-hub-2026-09-19 at 52bdce381dd928a18fcf7cac43bff1c7f1f6c7fa; clean worktree candidate.
- C:/projects/elaguila-website-saved-search-global - global-final-production-closeout-2026-08 at 90d0bd2dccad642e5049beb44a9cb476bd253593; clean worktree candidate.
- C:/projects/elaguila-website-servicios-category-fixes - feature/servicios-category-fixes at ee65dae4245e22779d0eb4b01adf124e2073c95d; clean worktree candidate.
- C:/projects/elaguila-website-servicios-final-application - fix/servicios-application-final-qa-2026-08 at 64a8018766d24c3cd128efbc6c22444e255751a9; clean worktree candidate.
- C:/projects/elaguila-website-virtual-front-desk - feature/virtual-front-desk at 72c2daa171d0a2d2598ecf7b038c872eb8c179d3; clean worktree candidate.

## Recommended Preservation Order

1. Preserve current dirty worktrees exactly as found.
2. Preserve stashes, local-only commits, and reflog candidate SHAs before any integration.
3. Capture path-level snapshots or patches only under separately approved recovery procedures.
4. Resolve SHARED/UNKNOWN areas with their owners before combining branches.

## Recommended Integration Order

1. Select a verified clean base and document its exact SHA.
2. Integrate shared authentication, schemas, migrations, generated types, and registries first.
3. Integrate Admin OS and owner-dashboard shared navigation/permissions next.
4. Integrate Stripe/payments and listing lifecycle changes before Rewards wallet/ledger behavior.
5. Integrate Quick Business and Leonix IX Rewards only after collision review and focused tests.

## Owner Decisions Required

- Confirm ownership and preservation priority for each dirty worktree, stash, local-only commit, and reflog candidate.
- Decide integration order for every SHARED or UNKNOWN path in the Collision Matrix.
- Confirm whether visible PR #49, #50, #53, #54 and requested branch patterns are still authoritative.

## Safe to Begin Quick + Rewards

**NO**. Evidence: 16 dirty worktrees, 2 stashes, 10 local-only commits, and 325 SHARED/UNKNOWN path records require preservation and owner decisions before development continues.

## Audit Notes

- Normal `git fetch origin` was run for each discovered repository without pruning.
- No source files were modified, no branches were switched, and no changes were discarded or stashed.
- Ignored files are listed only when they match common generated-artifact directories.
- Full diffs and secret-bearing file contents were not read or included.