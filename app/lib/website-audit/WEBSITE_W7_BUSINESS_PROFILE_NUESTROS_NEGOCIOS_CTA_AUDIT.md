# W7 — Business Profile / Nuestros Negocios CTA Audit

**Audit date:** 2026-05-27  
**References:** W1–W6 audits, C5A, C6 Stripe readiness, `packageEntitlements.ts`, `clasificadosAnalytics.ts`  
**Scope:** Business-category identity, public CTAs, analytics honesty, dashboard/admin visibility, entitlement-backed Nuestros Negocios / Destacado claims. No redesign, no Stripe, no fake data.

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Code proves real, safe behavior |
| FALSE | Fake identity/CTAs, untracked when claimed, or unsafe package claims |
| DEFERRED_INTENTIONAL | Honest empty, labeled mock, or separate analytics store documented |
| NOT_APPLICABLE | Not a business-profile category surface |

---

## 1. Main audit table (by category × surface)

| Category | Surface | Required behavior | Current implementation | CTA/analytics impact | Dashboard impact | Admin impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Servicios | Public `/clasificados/servicios/[slug]` | DB `profile_json` business identity | `getServiciosPublicListingBySlugForDiscovery`; `resolveServiciosProfile`; 404 if missing | CTAs via `ServiciosHorizontalResultCard` + `trackServiciosListingCta` → `servicios_analytics_events` | `/dashboard/servicios`; entitlement badges (W6) | Admin queue + user command center | TRUE | |
| Servicios | Legacy `/servicios/perfil/[slug]` | Real business or redirect | **Demo** `getServiciosProfileBySlug` sample data | N/A | Misleading if linked publicly | N/A | FALSE | Use clasificados slug route only; do not link legacy demo perfil in prod nav |
| Servicios | Landing Destacados | Entitlement-backed featured | `overlayActiveEntitlements` + `isServiciosRowDestacadoEligible` (not raw `promoted`) | N/A | W6 entitlement API on dashboard | Monetization summary in admin | TRUE | |
| Restaurantes | Public `/clasificados/restaurantes/[slug]` | Business name, contact hub | `listing_json` → `buildRestaurantContactHub`; buttons only if href present | **W7 fix:** `RestaurantContactHub` → `trackRestaurantesCtaClick` → `listing_analytics` | `/dashboard/restaurantes`; entitlement Destacado (W6) | Admin queue + command center | TRUE | |
| Restaurantes | Contact hub CTAs | Real tel/wa/email/maps/social/review | `pushUniqueButton` skips empty hrefs | Wired W7 when `listingId` passed | Rolls into owner `listing_analytics` rollup | Same | TRUE | |
| Viajes | Public staged offers | Provider identity + contact | `viajes_staged_listings`; `/clasificados/viajes/oferta/[slug]` when approved | Staged ops; limited unified CTA analytics vs `listing_analytics` | `/dashboard/viajes` | W6 command center viajes group | TRUE | Admin ROI panel = labeled mock |
| Bienes Raíces | Agent/broker contact | Phone/WA/email/maps sheet | `useBrContactCtaSheet` + `CtaActionSheet`; hrefs from listing contract | BR uses contact sheet; not all paths emit `listing_analytics` | Generic `mis-anuncios` + BR listings | Admin BR queue + owner trace | DEFERRED_INTENTIONAL | CTA real; analytics partial on BR detail |
| Autos | Dealership / vehicle | Dealer band from live inventory | `autos_classifieds_listings`; dealer pages; `trackAutosListingEvent` on cards | Category-specific event types in `autos_classifieds_analytics_events` | Autos section in mis-anuncios | Autos admin queue | TRUE | Unified dashboard rollup uses `listing_analytics` keys where mapped |
| Empleos | Employer identity | Company name, apply CTAs | `empleos_public_listings`; premium/quick detail components | `trackEmpleosCtaClick` / `trackEmpleosApplication` defined; **sparse UI wiring** | `/dashboard/empleos` | Empleos admin queue | DEFERRED_INTENTIONAL | Apply CTAs real; extend analytics wiring in W8 |
| Rentas | Landlord/manager | Inquiry contact | Rentas detail client + theme CTAs | Listing-scoped; BR-style contact patterns | `mis-anuncios` rentas rows | Rentas admin queue | DEFERRED_INTENTIONAL | Identity in listing contract |
| Clases | School/instructor | Org identity in listing | Generic `listings` + publish flow | Standard listing analytics when instrumented | `mis-anuncios` | Generic listings group | TRUE | No separate business_profiles table |
| Nuestros Negocios hub | Dedicated directory route | Entitlement-gated business directory | **No standalone `/nuestros-negocios` product route** in app router; marketing card on splash only | N/A | `includesNuestrosNegocios` on entitlement API only (not public UI badge yet) | Package tracker | DEFERRED_INTENTIONAL | Benefits enforced via `classified_listing` on tiers, not fake hub |

---

## 2. Business profile matrix

| Category | Business identity | Public profile/card | CTAs real | Analytics trackable | User dashboard visible | Admin visible | Package truth safe | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Servicios | `profile_json` + `business_name` | `/clasificados/servicios/[slug]` | TRUE | `servicios_analytics_events` (category table) | TRUE | TRUE | Destacado = entitlement overlay | TRUE | |
| Restaurantes | `listing_json` draft fields | Ad story + contact hub | TRUE | `listing_analytics` (W7 hub wire) | TRUE | TRUE | Destacado = entitlement API (W6) | TRUE | |
| Viajes | `viajes_staged_listings` + JSON | Staged public when approved | TRUE | Partial / staged | TRUE | TRUE (W6) | Separate model per C6 | TRUE | |
| Bienes Raíces | Agent facets in `detail_pairs` | Anuncio + preview shells | TRUE | Partial | TRUE | TRUE | Entitlement on mis-anuncios API | TRUE | |
| Autos | Dealer + vehicle rows | Vehiculo + dealer inventory | TRUE | Autos events table + some listing_analytics | TRUE | TRUE | Paid lane separate from NN | TRUE | |
| Empleos | `company_name`, job fields | Job detail pages | TRUE | Helpers exist; UI wiring incomplete | TRUE | TRUE | No fake Destacado chip | TRUE | |
| Rentas | Listing + contract | Rentas detail | TRUE | Partial | TRUE | TRUE | Entitlement API for rentas | TRUE | |
| Clases | Listing content | `/clasificados/anuncio/[id]` | TRUE | Per listing when events fire | TRUE | TRUE | Plan labels honest | TRUE | |

---

## 3. CTA matrix

| CTA | Categories | Source field | Public behavior | Analytics event | Missing-data behavior | Status | Notes |
|---|---|---|---|---|---|---|---|
| Phone call | Servicios, Restaurantes, BR, Autos, Empleos | `phone`, `phoneNumber`, contact blocks | `tel:` or CtaActionSheet | `phone_click` / `cta_call_click` / category events | Hidden if no number | TRUE | |
| WhatsApp | Servicios, Restaurantes, BR, Viajes | `whatsApp`, `socialLinks.whatsapp` | wa.me / sheet | `whatsapp_click` / `cta_whatsapp_click` | Hidden if no digits | TRUE | |
| Email | Servicios, Restaurantes, BR | `email` | mailto / send_email intent | `cta_email_click` (servicios) / `cta_click` | Hidden if empty | TRUE | |
| Website | All business categories | `website`, `websiteHref` | `normalizeExternalUrl` / open tab | `website_click` / `cta_website_click` | Hidden if invalid URL | TRUE | |
| Directions / maps | Servicios, Restaurantes, BR | address + `mapsHref` | Google maps search or URL | `directions_click` / `cta_maps_click` | Hidden if no address/maps | TRUE | |
| Social links | Servicios, Restaurantes | `instagram`, `facebook`, etc. | External tab | Often untracked or `cta_click` general | Hidden if URL missing | DEFERRED_INTENTIONAL | Restaurantes social now emits general CTA via W7 |
| Review links | Restaurantes | Yelp/Google URLs in hub | External tab | `cta_click` general (W7) | Hidden if missing | TRUE | |
| Custom quote / contact | Servicios | profile contact actions | CtaActionSheet `get_quote` | `cta_quote_sms_click` etc. | Hidden if no channel | TRUE | |
| Apply / inquiry | Empleos, Rentas | apply URL, forms | External or in-app form | `apply_*`, `lead_created` | Hidden when not configured | DEFERRED_INTENTIONAL | Empleos: wire more call sites in W8 |
| Save / like / share | All with engagement | N/A | LeonixLike/Save/Share | `listing_*` events | Works when tables exist | TRUE | |

---

## 4. Package / Nuestros Negocios truth

| Claim | Source | Public behavior | Status | Notes |
|---|---|---|---|---|
| Premium Destacado | `packageEntitlementGrantsDestacado` + active entitlement | Servicios destacados module uses `eligibleForDestacadosModule`; dashboard badges entitlement-backed (W6) | TRUE | |
| Full-page results priority | `packageEntitlementGrantsResultsPriority` | Ranking in servicios results after overlay | TRUE | |
| Nuestros Negocios / classified listing | `classified_listing` benefit on premium/full/half/classified_print | **Quarter page:** `classified_listing: false` in `getPackageEntitlementBenefits` | TRUE | C6 aligned |
| Quarter page NN profile | Must not get `classified_listing` | No default NN profile by tier definition | TRUE | |
| `includesNuestrosNegocios` dashboard field | Entitlement API only | Not yet a public “NN profile” badge | DEFERRED_INTENTIONAL | API ready; dedicated hub deferred |
| Stripe paid claims | C6 | No fake paid UI | TRUE | |

---

## 5. Analytics rollup honesty

| Store | Used by | Dashboard owner rollup | Status |
|---|---|---|---|
| `listing_analytics` | Restaurantes (W7), BR/rentas/en-venta when instrumented, likes/saves | `/dashboard/analytics`, admin user detail (W6) | TRUE |
| `servicios_analytics_events` | Servicios CTA pipeline | Not merged into `fetchOwnerAnalyticsTotals` today | DEFERRED_INTENTIONAL | Documented; honest zeros in unified rollup |
| `autos_classifieds_analytics_events` | Autos cards | Partial | DEFERRED_INTENTIONAL | |
| Viajes admin ROI placeholders | Admin viajes editorial | Labeled mock sample | DEFERRED_INTENTIONAL | |

---

## W7 blockers before launch

### Fixed in W7

| Category | Route/file | Issue | Impact | Fix |
|---|---|---|---|---|
| Restaurantes | `RestaurantContactHub.tsx` | CTA clicks not recorded | Owner/admin analytics under-count contacts | Wire `trackRestaurantesCtaClick` with `listingId` + `ownerUserId` |

### Remaining (W8 or product)

| Category | Route/file | Issue | User impact | Recommended fix | W7/W8 |
|---|---|---|---|---|---|
| Servicios | `/servicios/perfil/[slug]` | Demo sample profiles, not DB | Wrong business if linked | Remove from prod links or redirect to clasificados slug | W8 |
| Nuestros Negocios | (no route) | No dedicated NN directory | Marketing promise vs product | Build hub when ready; until then honest “coming soon” only | W8 |
| Servicios analytics | `servicios_analytics_events` | Not in unified owner rollup | Dashboard under-reports servicios CTAs | Bridge to `listing_analytics` or dual-read rollup | W8 |
| Empleos | Job detail CTAs | `trackEmpleosCtaClick` rarely called | Under-reported apply/contact | Call trackers from premium/quick detail actions | W8 |
| BR / Rentas | Contact sheets | Partial `listing_analytics` | Under-reported | Standardize on `trackCtaClick` per action | W8 |

---

## Completion checklist

1. Business categories audited — **Yes** (8 categories)
2. Business identity coverage — **Yes** (demo servicios perfil flagged FALSE)
3. CTA coverage — **Yes** (matrix above)
4. Analytics tracking coverage — **Yes** (with deferred bridges documented)
5. User dashboard business visibility — **Yes** (W4/W6; business-tools guidance)
6. Admin business visibility — **Yes** (W5/W6 command center)
7. Package/Nuestros Negocios truth — **Yes** (quarter page excluded; no fake NN hub)
8. Blockers — **1 fixed** (Restaurantes CTA analytics); remainder deferred
9. Files changed — see below
10. Build — `npm run build` (gate)

### Files changed in W7

- `app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx` (CTA analytics)
- `app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx` (pass listing/owner to hub)
- `app/lib/website-audit/WEBSITE_W7_BUSINESS_PROFILE_NUESTROS_NEGOCIOS_CTA_AUDIT.md` (this document)
