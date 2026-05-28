# W8 — Final Publish Flow End-to-End Test Data Audit

**Audit date:** 2026-05-27  
**References:** C1–C6 clasificados gates, W1–W7 website audits, `CLASIFICADOS_C5A_PUBLISH_PIPELINE_NO_LEAK_AUDIT.md`  
**Scope:** Prove (in code) that a real authenticated user can complete publish → persistence → public discovery → user dashboard → admin user/client dashboard → honest saved/analytics/package behavior for all 12 Clasificados categories. No Stripe implementation, no fake seeding, no fake analytics or package claims, no UI redesign.

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Code proves the end-to-end contract is real |
| FALSE | Publish flow drops owner, category, fields, business identity, Leonix Ad ID, dashboard visibility, admin visibility, or public visibility |
| DEFERRED_INTENTIONAL | Safely hidden, honestly empty, or bounded deferral (documented) |
| NOT_APPLICABLE | Category does not use this pipeline area |

---

## 1. Main audit table (publish flow × category)

| Category | Publish entry | Form save | Owner attached | Leonix Ad ID | Admin queue | Public result/detail | User dashboard | Admin user detail | Analytics/saved | Package truth | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Autos | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | DEFERRED_INTENTIONAL | Chooser → `/publicar/autos`; confirm step redirects logged-out users to `/clasificados/login?redirect=…` (`AutosPublishConfirmCore.tsx`). Negocio lane uses `autos_classifieds_listings.owner_user_id`. Package tiers in model; Stripe not wired (C6). |
| Bienes Raíces | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | DEFERRED_INTENTIONAL | Chooser + `/clasificados/publicar/bienes-raices` (privado/negocio/agente). Save via `leonixPublishRealEstateListingCore.ts` → `listings.owner_id`. Admin BR workspace + generic listing edit. NN print entitlements admin-grant only. |
| En Venta | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | DEFERRED_INTENTIONAL | `/clasificados/publicar/en-venta` (free/pro/storefront lanes). `enVentaPublishFromDraft` → `listings`. W6: Destacado badge entitlement-backed on `mis-anuncios`. Pro/featured not Stripe-active. |
| Empleos | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | DEFERRED_INTENTIONAL | `/clasificados/publicar/empleos` → empleos publish stack → `empleos_public_listings.owner_user_id`. Public `/clasificados/empleos/[slug]`. Premium/feria lanes separate from NN print V1. |
| Rentas | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | DEFERRED_INTENTIONAL | Chooser → `RENTAS_PUBLICAR_HUB` (privado vs negocio). Shares BR/listings contract + `rentas` category key. Results + detail under `/clasificados/rentas`. |
| Servicios | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | DEFERRED_INTENTIONAL | DEFERRED_INTENTIONAL | Production vitrina `/clasificados/servicios/[slug]` from DB `profile_json`. CTA analytics → `servicios_analytics_events` (W7); saves → `saved_listings`. Unified `listing_analytics` rollup partial for servicios-only events. NN/Destacado entitlement-backed (W6). |
| Restaurantes | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | DEFERRED_INTENTIONAL | `/publicar/restaurantes` → `restaurantes_public_listings`. W7: contact hub CTAs → `listing_analytics`. W6: Destacado on `/dashboard/restaurantes` entitlement-backed. |
| Clases | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | NOT_APPLICABLE | TRUE | `/publicar/clases/quick` + legacy redirect from `/clasificados/publicar/clases`. `publishCommunityQuickToListings` → `listings` (`category: clases`, `owner_id`). Paid-class publish blocked with honest error (`shouldBlockClasesPaidPublish`). DB trigger `listings_leonix_ad_id_bi` + prefix map; dashboard also shows `formatLeonixAdId` chip for quick lane. |
| Comunidad | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | NOT_APPLICABLE | TRUE | `/publicar/comunidad/quick`; same community publish path with `category: comunidad`. Event expiration on discovery (C5A). Free community listings; no NN package surface. |
| Mascotas y Perdidos | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | NOT_APPLICABLE | TRUE | `/publicar/mascotas-y-perdidos/quick`; `publishMascotasPerdidosQuickToListings` → `listings` (`category: mascotas-y-perdidos`). Leonix prefix `PET` (migration). Admin queue page added W5. |
| Busco | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | NOT_APPLICABLE | TRUE | `/publicar/busco/quick`; `publishBuscoQuickToListings` → `listings` (`category: busco`). Leonix prefix `BUSCO`. Results filter by busco lane fields in `detail_pairs`. |
| Viajes | TRUE | TRUE | TRUE | TRUE | TRUE | DEFERRED_INTENTIONAL | TRUE | TRUE | DEFERRED_INTENTIONAL | DEFERRED_INTENTIONAL | TRUE | `/publicar/viajes`; `POST /api/clasificados/viajes/submit` → `viajes_staged_listings.owner_user_id`. Public `/clasificados/viajes/oferta/[slug]` only when approved + `is_public` (staged moderation — intentional). W6: admin command center Viajes group. Limited unified CTA analytics vs `listing_analytics`; admin ROI panel labeled mock (W7). |

**Publish entry (cross-cutting):** `/clasificados/publicar` chooser (`PublicarPageClient.tsx`, `getPublishChooserCategoryKeys`) deep-links `?cat=` / `?categoria=` to the correct publish route. W3: `/clasificados/login` → `/login?mode=post&redirect=…` with `safeInternalRedirect`. Client publish modules gate on `supabase.auth.getUser()` when server redirect is absent.

**Form save (cross-cutting):** Canonical NorCal cities via `getCanonicalCityName` on community, busco, mascotas, and BR/rentas flows. Business identity on servicios/restaurantes/BR negocio/autos dealer lanes. Failed media upload marks listing `removed` / non-public (no orphan live row without images where required).

---

## 2. Publish-flow matrix

| Category | Publish route | Submit/API/storage path | Public route | Dashboard route | Admin route | Owner key | Listing key | Leonix Ad ID key | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Autos | `/publicar/autos` (+ negocio subflows) | Autos publish services → `autos_classifieds_listings` | `/clasificados/autos/vehiculo/[id]`, results | `/dashboard/mis-anuncios`, autos inventory sections | `/admin/workspace/clasificados/autos` | `owner_user_id` | `id` | `leonix_ad_id` (trigger/RPC) | TRUE | UUID URL; stable public key is `leonix_ad_id` |
| Bienes Raíces | `/clasificados/publicar/bienes-raices/*` | `leonixPublishRealEstateListingCore` → `listings` | `/clasificados/bienes-raices/resultados`, `/clasificados/anuncio/[id]` | `/dashboard/mis-anuncios` | `/admin/workspace/clasificados/bienes-raices` | `owner_id` | `id` | `listings.leonix_ad_id` | TRUE | BR contract in `detail_pairs` / `listing_json` |
| En Venta | `/clasificados/publicar/en-venta/*` | `enVentaPublishFromDraft` → `listings` | `/clasificados/en-venta/results`, `/clasificados/anuncio/[id]` | `/dashboard/mis-anuncios` | `/admin/workspace/clasificados/en-venta` | `owner_id` | `id` | `listings.leonix_ad_id` | TRUE | |
| Empleos | `/clasificados/publicar/empleos` | Empleos publish → `empleos_public_listings` | `/clasificados/empleos/[slug]` | `/dashboard/mis-anuncios`, `/dashboard/empleos` | `/admin/workspace/clasificados/empleos` | `owner_user_id` | `id`, `slug` | `empleos_public_listings.leonix_ad_id` | TRUE | |
| Rentas | `RENTAS_PUBLICAR_HUB` + privado/negocio | Rentas/BR publish → `listings` (`category` rentas) | `/clasificados/rentas/resultados`, detail | `/dashboard/mis-anuncios` | `/admin/workspace/clasificados/rentas` | `owner_id` | `id` | `listings.leonix_ad_id` | TRUE | |
| Servicios | `/clasificados/publicar/servicios` | Servicios application publish → `servicios_public_listings` | `/clasificados/servicios/[slug]` | `/dashboard/mis-anuncios`, `/dashboard/servicios` | `/admin/workspace/clasificados/servicios` | `owner_user_id` | `id`, `slug` | `servicios_public_listings.leonix_ad_id` | TRUE | Do not use legacy `/servicios/perfil/[slug]` |
| Restaurantes | `/publicar/restaurantes` | Restaurant application → `restaurantes_public_listings` | `/clasificados/restaurantes/[slug]` | `/dashboard/mis-anuncios`, `/dashboard/restaurantes` | `/admin/workspace/clasificados/restaurantes` | `owner_user_id` | `id`, `slug` | `restaurantes_public_listings.leonix_ad_id` (REST-) | TRUE | |
| Clases | `/publicar/clases/quick` | `publishCommunityQuickToListings` → `listings` | `/clasificados/clases/resultados`, `/clasificados/anuncio/[id]` | `/dashboard/mis-anuncios` | `/admin/workspace/clasificados/clases` | `owner_id` | `id` | `listings.leonix_ad_id` (+ UI `LNX-` chip) | TRUE | Paid class lane blocked at publish |
| Comunidad | `/publicar/comunidad/quick` | `publishCommunityQuickToListings` → `listings` | `/clasificados/comunidad/resultados`, `/clasificados/anuncio/[id]` | `/dashboard/mis-anuncios` | `/admin/workspace/clasificados/comunidad` | `owner_id` | `id` | `listings.leonix_ad_id` | TRUE | |
| Mascotas y Perdidos | `/publicar/mascotas-y-perdidos/quick` | `publishMascotasPerdidosQuickToListings` → `listings` | `/clasificados/mascotas-y-perdidos/resultados`, `/clasificados/anuncio/[id]` | `/dashboard/mis-anuncios` | `/admin/workspace/clasificados/mascotas-y-perdidos` | `owner_id` | `id` | `listings.leonix_ad_id` (PET-) | TRUE | |
| Busco | `/publicar/busco/quick` | `publishBuscoQuickToListings` → `listings` | `/clasificados/busco/resultados`, `/clasificados/anuncio/[id]` | `/dashboard/mis-anuncios` | `/admin/workspace/clasificados/busco` | `owner_id` | `id` | `listings.leonix_ad_id` (BUSCO-) | TRUE | |
| Viajes | `/publicar/viajes` | `POST /api/clasificados/viajes/submit` → `viajes_staged_listings` | `/clasificados/viajes/oferta/[slug]` when approved | `/dashboard/viajes` | `/admin/workspace/clasificados/travel` | `owner_user_id` | `id`, `slug` | `viajes_staged_listings.leonix_ad_id` (TRAV-) | TRUE | Pre-approval: staged only |

**Analytics keys:** `collectOwnerListingKeysForAnalytics` unions `listings`, `servicios_public_listings`, `empleos_public_listings`, `autos_classifieds_listings`, `restaurantes_public_listings`, and `viajes_staged_listings` ids/slugs/`leonix_ad_id` values for owner rollups.

**Saved ads:** `saved_listings` + `LeonixSaveButton` on supported public cards; `/dashboard/guardados` reads per-user saves (auth redirect when logged out).

---

## 3. Legacy / demo / shell route safety (item 10)

| Route / surface | Risk | Status | Notes |
|---|---|---|---|
| `/servicios/perfil/[slug]` | Demo sample data via `getServiciosProfileBySlug` | FALSE | W7: not production source; production is `/clasificados/servicios/[slug]` |
| `*-preview`, `preview-mockup`, `feria-preview` under clasificados | Session/mock publish | DEFERRED_INTENTIONAL | Not linked from production chooser as live inventory; used for design QA |
| `/clasificados/publicar/[category]` unknown slug | Coming Soon | DEFERRED_INTENTIONAL | Dedicated categories use explicit redirects (`clases`, `comunidad`, `busco`, `mascotas-y-perdidos` pages forward to `/publicar/.../quick`) |
| Admin servicios sandbox | Staff-only | DEFERRED_INTENTIONAL | `/admin/workspace/clasificados/servicios/sandbox` |

---

## 4. Package / payment truth (all categories)

| Rule | Status | Evidence |
|---|---|---|
| Free/standard listings do not show Premium/Destacado without entitlement | TRUE | W6: `fetchDashboardListingPackageEntitlementBadges`; en-venta/restaurantes fixed |
| Pending/expired/revoked entitlements do not activate public claims | TRUE | `effectiveEntitlementStatus`, `overlayActiveEntitlements` |
| Stripe checkout not exposed as active | TRUE | C6 contract; admin create sets `payment_status: null` |
| Paid add-ons not active without payment/entitlement | TRUE | Autos inventory boost / BR slots env-gated until billing |
| Clases/Comunidad/Mascotas/Busco paid NN packages | NOT_APPLICABLE | Free or request lanes; clases paid publish blocked |

---

## W8 blockers before launch

### FALSE — must not link or treat as production inventory

| Field | Value |
|---|---|
| **category** | Servicios (legacy surface) |
| **route/file path** | `app/(site)/servicios/perfil/[slug]/page.tsx` — `getServiciosProfileBySlug` sample data |
| **issue** | Legacy demo business profile route serves non-DB sample content if linked |
| **user impact** | Misleading business identity and CTAs if URL is shared |
| **seller/business impact** | Wrong contact/branding vs real published servicios listing |
| **admin impact** | None (admin uses real queues) |
| **dashboard impact** | None |
| **production risk** | Medium if linked from marketing/nav |
| **recommended fix** | 301 to `/clasificados/servicios/[slug]`, or remove route; audit all internal links (W1/W7) |
| **fixed in W8?** | No — left for W9/W10 |

---

## 5. Intentional deferrals (not launch blockers)

| Item | Categories | Notes | Gate |
|---|---|---|---|
| Stripe checkout / billing | Autos, BR, NN print categories | Entitlement model + admin grants; C6 honest deferral | W9+ |
| Servicios CTA analytics in unified owner rollup | Servicios | Events in `servicios_analytics_events`; not all merged into `listing_analytics` | W9 |
| BR detail CTA → `listing_analytics` | Bienes Raíces | Contact sheet real; partial analytics (W7) | W9 |
| Viajes pre-approval public visibility | Viajes | Staged moderation before `/oferta/[slug]` | By design |
| Clases paid-class publish | Clases | `shouldBlockClasesPaidPublish` returns honest error | Product |
| Apple OAuth | Auth | Not configured (W3) | Optional |
| Dedicated Nuestros Negocios hub route | Marketing | NN is entitlement + category placement, not separate hub (W7) | Product |

---

## 6. W8 verification checklist

| # | Item | Result |
|---|---|---|
| 1 | Categories audited (12) | Autos, BR, En Venta, Empleos, Rentas, Servicios, Restaurantes, Clases, Comunidad, Mascotas y Perdidos, Busco, Viajes |
| 2 | Publish entries verified | Chooser + per-category routes + login redirect contract (W3) |
| 3 | Owner / category / Leonix Ad ID contracts verified | Per matrix; triggers/RPC on insert for supported tables |
| 4 | Public landing / results / detail verified | Category routes + `/clasificados/anuncio/[id]` for `listings` family |
| 5 | User dashboard visibility verified | `mis-anuncios` + category pages; owner guard W5/W6 |
| 6 | Admin user/client visibility verified | `fetchAdminUserAdsForUser` + category workspaces + W6 rollups |
| 7 | Saved / analytics / package truth verified | `saved_listings`, `listing_analytics` + documented servicios/viajes gaps |
| 8 | Blockers | 1 FALSE (legacy servicios perfil); 0 code fixes in W8 |
| 9 | Files changed | `app/lib/website-audit/WEBSITE_W8_FINAL_PUBLISH_FLOW_E2E_AUDIT.md` (this document) |
| 10 | `npm run build` | See build gate below |

---

## Build gate

```
npm run build
```

**Result:** PASS (`exit_code: 0`, 2026-05-27 local run, ~134s).
