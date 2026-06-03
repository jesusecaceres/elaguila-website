# Gate FOOD-L1 — Comida Local Pipeline Architecture Audit

**Status:** Audit-only — no implementation in this gate.  
**Date:** 2026-06-03  
**Preflight:** Working tree clean; no unrelated dirty files; no code changes except this document.

---

## 1. Preflight status

| Class | Result |
|---|---|
| RELATED_ALLOWED | `app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L1_ARCHITECTURE_AUDIT.md` (this file) |
| RELATED_BLOCKING | None |
| UNRELATED_PARALLEL_WORK | None |

Commands run: `git status --short`, `git diff --name-only` — both empty before write.

---

## 2. Files inspected (read-only)

### Restaurantes (reference only — not modified)

- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `app/(site)/publicar/restaurantes/page.tsx`
- `app/(site)/clasificados/restaurantes/application/*` (draft, publish payload, contact hub, shell mapping)
- `app/(site)/clasificados/restaurantes/shell/RestauranteProfileHeader.tsx`, `RestaurantContactHub.tsx`
- `app/(site)/clasificados/restaurantes/lib/restaurantesLeonixAdId.ts`
- `app/api/clasificados/restaurantes/publish/route.ts`
- `app/(site)/dashboard/restaurantes/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/restaurantes/page.tsx`
- `app/(site)/clasificados/restaurantes/analytics/restaurantesAnalytics.ts`

### En Venta / Varios (simple pipeline reference)

- `app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx`
- `app/(site)/clasificados/publicar/en-venta/free/application/sections/*` (BasicInfo, Location, Photos, SellerContact)
- `app/(site)/clasificados/en-venta/shared/utils/enVentaPhoneDisplay.ts`, `enVentaContactActions.ts`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx`, `EnVentaListingHero.tsx`
- `app/(site)/clasificados/en-venta/preview/*`, `publish/*`
- `app/(site)/clasificados/en-venta/analytics/enVentaAnalyticsExtended.ts`
- `app/lib/clasificados/en-venta/*`

### Servicios (contact polish reference)

- `app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx`
- `app/(site)/servicios/lib/serviciosBusinessHubSocialBrand.tsx`
- `app/(site)/clasificados/servicios/analytics/serviciosAnalytics.ts`

### Community quick (lightweight multi-section reference)

- `app/(site)/publicar/community/shared/types/communityQuickDraft.ts`
- `app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx`

### Shared classified infrastructure

- `app/(site)/clasificados/config/categoryConfig.ts`
- `app/lib/clasificados/categoryChooserServer.ts`
- `app/components/CityAutocomplete.tsx`, `app/data/locations/norcal.ts`, `app/data/locations/californiaLocationHelpers.ts`
- `app/lib/clasificadosAnalytics.ts`
- `app/components/clasificados/analytics/LeonixLikeButton.tsx`, `LeonixShareButton.tsx`
- `app/lib/clasificados/clasificadosCategoryRegistry.ts` (via categoryChooserServer)
- Supabase pattern: `restaurantes_public_listings`, `listings` + `detail_pairs` (En Venta)

---

## 3. Existing pipeline findings

### Restaurantes — what to reuse vs avoid

| Area | Reuse safely | Do not copy |
|---|---|---|
| Phone/WhatsApp href builders | `restauranteContactHref.ts` patterns (`telHref`, `waHref`, digit normalization) | — |
| City | `CityAutocomplete` + `cityCanonical` + NorCal catalog | Free-text-only city without canonical |
| Contact output | R-C1 hub: burgundy call, WhatsApp green, platform socials, empty-hide | Full 7-section hub, reviews, menu/order/reserve |
| Header | `RestauranteProfileHeader` controlled gradient | 60vh food hero, trust blocks, amenities |
| Media | Publish image gate (transport URLs), gallery sequence concepts | Bucket taxonomy (interior/food/exterior), menu file, 4 platillos |
| Draft persistence | `restauranteDraftStorage` (localStorage + IDB media) | 15+ section mega-form |
| Leonix ID | `allocateNextRestauranteLeonixAdId` → `REST-YYYY-######` | Same prefix/table |
| Analytics | `trackRestaurantesCtaClick` → shared `clasificadosAnalytics` | Category string `restaurantes` |
| Publish | `restaurantes_public_listings` + `listing_json` blob | Same table or restaurantes category slug |

**Critical:** Restaurantes Premium is ~$399 positioning with `package_tier`, weekly hours grid, amenities, catering stacks, external reviews, and 23k+ line application client. Comida Local must **not** extend this form.

### En Venta / Varios — recommended primary scaffold

| Strength | Evidence |
|---|---|
| Short sectioned application | BasicInfo → Location → Photos → SellerContact |
| Phone auto-format while typing | `formatEnVentaPhoneInput` / `formatEnVentaPhoneDisplay` |
| Contact CTA styling | `EnVentaContactButtons` — burgundy call, WhatsApp green, cream secondary |
| Simple listing DTO | `EnVentaAnuncioDTO` — title, description, city, images, contact |
| Publish validation module | `enVentaPublishValidation.ts` |
| Detail layout stack | `EnVentaDetailContentStack`, compact hero |
| Audit script culture | `VARIOS_*`, `en-venta` gate markdown under `app/lib/clasificados/en-venta/` |

**Varios label in UI:** `categoryConfig` maps `en-venta` → "Varios" — Comida Local should **not** live inside `en-venta`; it is food-specific discovery.

### Servicios — contact polish only

- True platform colors in `serviciosBusinessHubSocialBrand.tsx`
- `trackCtaClick` with typed CTA (`phone`, `whatsapp`, `website`, `directions`)
- Location CTA from address or maps URL (see R-C2 `resolveRestaurantMapsHref` pattern in restaurantes — concept applies to optional `locationUrl`)

### Shared infrastructure

- **Category registry:** `CategoryKey` union in `categoryConfig.ts` — new key `comida-local` required in FOOD-L2+ (not this gate).
- **Publish chooser:** `getPublishChooserCategoryKeys()` merges DB `site_category_config` with defaults; must register Comida Local before public chooser shows it.
- **Analytics:** `app/lib/clasificadosAnalytics.ts` — category-agnostic `trackListingView`, `trackCtaClick`, like/save/share; extend `listingAnalyticsEventTypes` if new CTA types needed.
- **Engagement:** `LeonixLikeButton` / `LeonixSaveButton` accept `category` prop — wire `comida-local` in FOOD-L8.
- **Dashboard:** Per-category pages exist (`app/(site)/dashboard/restaurantes/page.tsx`) — mirror for `dashboard/comida-local`.
- **Admin:** `app/admin/(dashboard)/workspace/clasificados/restaurantes/page.tsx` — mirror moderation workspace.

---

## 4. Product boundary

### In scope (target customers)

- Taco stands, street food, weekend plate sellers, pop-ups, mobile food sellers
- Informal / small vendors, seasonal sellers, market/parking-lot/event vendors
- Home-based food sellers **where legally allowed** (display-only; no legal advice in form)
- Rotating-location vendors (location **note** + optional **URL de ubicación actual**, not permanent restaurant address)

### Out of scope (use Restaurantes Premium or other products)

- Full restaurants, cafés, bakeries needing full menus/galleries
- Reservations, Yelp/Google review modules, catering/event sizing
- Complex weekly hours, amenities, multi-cuisine taxonomy stacks
- Established food trucks needing premium brand story (optional upgrade path instead)

### Feature limits (Comida Local)

| Included | Excluded |
|---|---|
| Vendor identity, food type, qué vendes | Full menu upload module |
| Canonical city + optional zone note | Restaurant-style hours grid |
| Phone / WhatsApp / optional socials | Google/Yelp reviews |
| Simple availability text | Reservations, Pedir ahora, Opiniones |
| 1 main photo + small gallery (cap) | Large venue gallery buckets |
| Pickup / delivery / en persona chips | Catering, amenities, trust ratings display |
| Payment method **labels** (display only) | Stripe checkout in listing |
| Compact header + contact strip | Premium restaurant hero |

### Upgrade path (future — not implemented)

- **Comida Local → Restaurantes Premium:** map shared fields (`businessName`, `phone`, `whatsApp`, `cityCanonical`, `longDescription` from `queVendes`, hero image) into restaurant draft; vendor completes premium-only sections. Requires one-time migration tool and pricing credit policy (deferred).

---

## 5. Recommended product name

**Primary recommendation: Comida Local**

| Name | Pros | Cons |
|---|---|---|
| **Comida Local** | Clear, searchable, NorCal-friendly, distinct from Restaurantes | Slightly broad |
| Puestos y Pop-ups | Descriptive for mobile vendors | Long; weak SEO for "tacos" |
| Vendedores de comida | Accurate | Generic, administrative tone |
| Comida Casera y Pop-ups | Warm | Implies home-only; long |

**Why Comida Local wins:** Matches mission wording, works in chooser cards, separates mentally from `$399 Restaurantes`, supports food-type discovery ("tacos en San José") without claiming to be a restaurant directory.

---

## 6. Recommended routes

| Purpose | Route | Rationale |
|---|---|---|
| Application (publish) | `/publicar/comida-local` | Matches `/publicar/restaurantes`, `/publicar/en-venta` |
| Category hub + results | `/clasificados/comida-local` | Matches `/clasificados/restaurantes` |
| Listing detail | `/clasificados/comida-local/[slug]` | Same pattern as restaurantes `[slug]` |

**Preview:** `/clasificados/comida-local/preview` (session/draft query) — mirror restaurantes preview layout.

**Do not** nest under `/clasificados/restaurantes/*` — keeps filters, analytics, and admin category badges unambiguous.

---

## 7. Proposed required field model

| # | Field key | Spanish label | Required |
|---|---|---|---|
| 1 | `businessName` | Nombre del puesto / negocio | Yes |
| 2 | `foodType` | Tipo de comida | Yes (taxonomy + optional "Otro") |
| 3 | `cityCanonical` | Ciudad (NorCal) | Yes |
| 4 | `contactPath` | Al menos uno: teléfono, WhatsApp o enlace de contacto | Yes (validated) |
| 5 | `queVendes` | Qué vendes | Yes |
| 6 | `mainPhoto` | Foto principal | Yes at publish (recommended at preview); see open question |

**Contact path rule:** At least one of: `phoneNumber`, `whatsAppNumber`, or one valid social URL (if product approves social as contact — **recommended:** phone or WhatsApp required; socials optional).

---

## 8. Proposed optional field model

| Field key | Spanish label | Cap / notes |
|---|---|---|
| `zoneNote` | Zona / barrio (opcional) | Display only; not a filter substitute for city |
| `phoneNumber` | Teléfono | Auto-format US |
| `whatsAppNumber` | WhatsApp | Separate from phone |
| `instagramUrl` | Instagram | Max 3 socials active per package tier |
| `facebookUrl` | Facebook | Same |
| `tiktokUrl` | TikTok | Same |
| `availabilityNote` | Disponibilidad / horario simple | Free text; no weekly grid |
| `locationNote` | Ubicación actual / nota | e.g. "Sábados en San José" |
| `locationUrl` | URL de ubicación actual | Maps/social/link tree; optional |
| `servicePickup` | Recolección | Boolean chip |
| `serviceDelivery` | Entrega | Boolean |
| `serviceInPerson` | Solo en persona | Boolean |
| `paymentCash` | Efectivo | Display chips |
| `paymentZelle` | Zelle | Display |
| `paymentCashApp` | Cash App | Display |
| `paymentVenmo` | Venmo | Display |
| `paymentCard` | Tarjeta | Display |
| `paymentOther` | Otro (texto corto) | Display |
| `priceLevel` | Precio aproximado | `$` / `$$` / `$$$` |
| `languages` | Idiomas | español / inglés / bilingüe |
| `logoImage` | Logo (opcional) | 1 image |
| `galleryImages` | Fotos adicionales | Max 3 Basic / 5 Plus |

---

## 9. Field-by-field UX / validation / rendering table

| Field | Helper (ES) | Placeholder | Validation | Formatting | Preview card | Detail page | Search/filter | Dashboard | Admin | Analytics |
|---|---|---|---|---|---|---|---|---|---|---|
| businessName | Nombre con el que te encontrarán en resultados y en la ficha. | Ej. Tacos Don Pepe | min 2 chars | trim | Title | H1 header | Title search | Title column | Title | — |
| foodType | Elige la categoría principal de comida. | tacos | required slug | taxonomy label | Chip | Chips | `food_type` filter + keyword | Badge | Filter | — |
| foodTypeCustom | Solo si elegiste Otro. | pupusas salvadoreñas | if foodType=otro | trim | Chip | Chip | keyword | — | — | — |
| cityCanonical | Ciudad donde vendes o atiendes clientes. Aparece en resultados. | Busca tu ciudad | required; canonical via CityAutocomplete | `getCanonicalCityName` | City line | Header + contact | City filter | City | City | — |
| zoneNote | Barrio o zona opcional (no reemplaza la ciudad). | Ej. East San Jose | optional | trim | Subline | Location line | optional text search | — | — | — |
| queVendes | Cuéntales qué ofreces hoy o esta semana. | tacos, burritos, aguas frescas | min 20 chars | trim | 1-line clamp | Body section | full-text search | — | — | — |
| phoneNumber | Opcional si ya pusiste WhatsApp. Formato automático. | (408) 555-1234 | US 10-digit if present | `formatEnVentaPhoneInput` | — | Llamar + Mensaje | — | — | — | `cta_call`, `cta_quote_sms` |
| whatsAppNumber | Número de WhatsApp para pedidos o preguntas. | mismo formato | 8+ digits if present | wa.me href | — | WhatsApp CTA | — | — | — | `cta_whatsapp` |
| instagramUrl / facebook / tiktok | Enlace completo o usuario; solo se muestra si es válido. | @tu_cuenta o URL | `isValidExternalHttpUrl` | normalize handle→URL | — | Social chips | — | — | — | `cta_website` + platform meta |
| availabilityNote | Horario simple, no tabla semanal. | Viernes a domingo · 5 PM–9 PM | max 120 chars | — | — | Info block | — | — | — | — |
| locationNote | Para puestos móviles o pop-ups. | Hoy en mercado en... | max 160 | — | — | Location | — | — | — | — |
| locationUrl | Pin o publicación con tu ubicación de hoy. | maps.google.com/... | valid URL only | — | — | Ver ubicación CTA | — | — | — | `cta_maps` or `cta_website` |
| service* | Cómo pueden recibir la comida. | — | at least 0 | booleans | Chips | Chips | service filters | — | — | — |
| payment* | Métodos que aceptas (solo informativo). | — | — | chips | — | Payment row | — | — | — | — |
| priceLevel | Referencia rápida de precios. | — | enum | $/$$/$$$ | Chip | Chip | filter | — | — | — |
| languages | Idiomas en los que atiendes. | — | multi | labels | — | Meta | — | — | — | — |
| mainPhoto | Foto principal del puesto o comida. | — | required publish | image gate | Thumbnail | Header thumb | — | thumb | thumb | — |
| galleryImages | Fotos extra (límite según plan). | — | max count | same as EV media | — | Gallery | — | — | — | — |

---

## 10. Phone formatting requirements

**Reuse:** `app/(site)/clasificados/en-venta/shared/utils/enVentaPhoneDisplay.ts`

- Input: `formatEnVentaPhoneInput` → `(408) 555-1234` while typing
- Storage: raw string acceptable; publish normalizes digits internally (mirror En Venta `enVentaPhoneInputDigits`)
- Display: `formatEnVentaPhoneDisplay` on cards if needed
- **Llamar:** `tel:+1XXXXXXXXXX` for 10-digit US
- **Mensaje:** `sms:+1XXXXXXXXXX` when phone present (same as Restaurantes hub SMS rule)
- Do not show Llamar/Mensaje buttons when phone empty

---

## 11. Social URL normalization requirements

**Proposed rules (FOOD-L3):**

1. Trim; reject empty and `http://`/`https://` with host only.
2. If input looks like `@handle`, map per platform (instagram.com, facebook.com, tiktok.com/@).
3. Else prepend `https://` if missing scheme.
4. Validate with existing `isValidExternalHttpUrl` pattern from `restauranteContactHref` / En Venta normalizers.
5. **Never render** placeholder or invalid URLs.
6. **Output:** reuse brand styles from `restaurantContactHubSocialBrand.tsx` (copy to `comida-local` lib — do not import restaurantes shell into en-venta).

**Platforms v1:** Instagram, Facebook, TikTok only (matches optional model; LinkedIn omitted for vendor simplicity).

---

## 12. City / NorCal / search / filter impact

### Canonical city

- **Input:** `CityAutocomplete` (`app/components/CityAutocomplete.tsx`) backed by `CA_CITIES` / aliases in `app/data/locations/norcal.ts`
- **Normalize:** `getCanonicalCityName()` on blur/save (`californiaLocationHelpers.ts`)
- **Persist:** `city_canonical` column on `comida_local_public_listings` (proposed table)
- **Display:** card line = `cityCanonical` + optional `zoneNote`

### Filters (results page)

| Filter | Source field | Notes |
|---|---|---|
| Ciudad | `city_canonical` | Same pattern as `restaurantesDiscoveryContract` city filter |
| Tipo de comida | `food_type` | Taxonomy slugs: tacos, tamales, pupusas, postres, mariscos, vegano, otro, etc. |
| Servicio | `service_pickup`, `service_delivery`, `service_in_person` | Booleans |
| Precio | `price_level` | $ / $$ / $$$ |
| Abierto / disponible | optional future — only if `availabilityNote` parsing added later; **v1: no fake "open now"** |

### Search bar

- Search `businessName`, `queVendes`, `foodType` label, `foodTypeCustom`, `zoneNote` (substring)
- Plan keyword boosts for common foods in `food_type` labels

### Taxonomy placement

- **New category slug:** `comida-local` in `CategoryKey` + registry + sitemap
- **Cross-link:** Restaurantes hub may show teaser "¿Vendedor informal? Comida Local" — copy only, no shared listing table
- **Not** a filter inside Restaurantes results

### SEO / location pages

- If site has city landing pages for clasificados, add `comida-local` as secondary facet under city (FOOD-L6)

---

## 13. Contact / action behavior (output design)

### Section order (detail)

1. **Contáctanos** — Llamar (burgundy), Mensaje (cream), WhatsApp (green), optional Correo if email added later
2. **Síguenos** — IG / FB / TikTok brand chips (only if URLs)
3. **Dónde encontrarnos** — `locationNote` + optional **Ver ubicación** button (`locationUrl` or maps search from city+note only if product allows)
4. **Disponibilidad** — `availabilityNote` only
5. **Formas de pago** — chips (only if any selected)
6. **Servicio** — pickup / delivery / en persona chips
7. **Galería** — main + extras

### CTA rules

- No empty buttons; no disabled placeholders
- Rectangular buttons, `rounded-lg`, light radius
- Colors: burgundy primary, gold border cream cards, charcoal text, WhatsApp `#25D366`, platform colors on socials
- **Excluded:** Reservar, Pedir ahora, Menú, Opiniones Google/Yelp

---

## 14. Analytics impact

### Existing helpers

- Shared: `app/lib/clasificadosAnalytics.ts` (`trackListingView`, `trackCtaClick`, `trackListingLike`, `trackListingSave`, `trackListingShare`)
- Category wrappers: `restaurantesAnalytics.ts`, `enVentaAnalyticsExtended.ts` — **pattern for** `comidaLocalAnalytics.ts`

### Recommended events (FOOD-L8)

| Event | When |
|---|---|
| `listing_view` | Detail/preview view |
| `cta_call` | Llamar |
| `cta_whatsapp` | WhatsApp |
| `cta_quote_sms` or `cta_message` | Mensaje/SMS |
| `cta_website` | Social or location URL outbound |
| `cta_maps` | Ver ubicación (if maps/search link) |
| `listing_like` / `listing_save` / `listing_share` | If engagement enabled on preview/public |

**Metadata:** `listing_id`, `category: "comida-local"`, `owner_user_id`, `leonix_ad_id` when row exists (inject server-side on API like autos).

**Do not:** public view counts, fake engagement numbers, invented conversion rates.

**Dashboard:** Owner dashboard can query shared analytics tables filtered by `category` once events fire; mirror restaurantes dashboard CTA breakdown in FOOD-L7.

**Risk:** If analytics API hardcodes category allowlist, extend allowlist in FOOD-L8.

---

## 15. Dashboard impact

**Must support before launch:**

| Capability | Pattern source |
|---|---|
| List owner's listings | `dashboard/restaurantes/page.tsx` → `comida_local_public_listings` |
| Status draft/published/paused | `status` column |
| Edit link → application | `/publicar/comida-local?edit=` |
| Preview link | `/clasificados/comida-local/preview` |
| Package tier badge | `package_tier` |
| Leonix ID display | `leonix_ad_id` |
| Republish / renew | entitlement overlay pattern `restaurantesEntitlementOverlay.ts` |

**Card fields:** name, food type, city, status, dates, optional views from analytics (real only).

---

## 16. Admin impact

**Must support:**

| Capability | Pattern |
|---|---|
| Workspace list | `admin/.../restaurantes/page.tsx` |
| Moderation status | approve / pause / flag |
| View `listing_json` | raw draft blob |
| Category badge | Comida Local |
| Leonix ID search | `leonix_ad_id` |
| Owner link | `owner_user_id` |

**Do not** fold into restaurantes admin filter without explicit category filter.

---

## 17. Leonix ID impact

**Proposed format:** `COMIDA-2026-000001` (parallel `REST-YYYY-######` in `restaurantesLeonixAdId.ts`)

- Allocate on first publish only; preserve on republish
- Show on detail footer + admin + dashboard (mirror En Venta buyer-facing ID UX)
- Analytics metadata should include `leonix_ad_id` when present

**Implementation:** new `allocateNextComidaLocalLeonixAdId(supabase)` in FOOD-L5 — do not reuse REST prefix.

---

## 18. Pricing / package considerations (document only)

### Current system (observed)

- Restaurantes: `package_tier` on `restaurantes_public_listings`, publish route checks lane
- En Venta: free vs pro plan in `detail_pairs` / `Leonix:plan`
- Entitlements: `restaurantesEntitlementOverlay.ts`, package entitlement generator scripts in repo root `scripts/verify-package-*`

### Proposed packages (not implemented)

| Package | Price (target) | Limits |
|---|---|---|
| Comida Local Basic | $99 | 1 main photo + 2 gallery, 2 socials, 30–60 day listing (TBD) |
| Comida Local Plus | $149 | 1 main + 5 gallery, 3 socials, optional featured placement flag, renewal discount (TBD) |

**Clarify before FOOD-L5:** duration, renewal, featured/promoted rules, upgrade credit to Restaurantes, Stripe Product IDs (out of scope this gate).

---

## 19. Proposed file structure (FOOD-L2+ — not created now)

```
app/(site)/publicar/comida-local/
  page.tsx
  ComidaLocalApplicationClient.tsx
  sections/   # Identity, Food, Location, Contact, Media, Review
app/(site)/clasificados/comida-local/
  page.tsx                    # hub
  resultados/page.tsx
  [slug]/page.tsx             # detail
  preview/page.tsx
  components/
    ComidaLocalProfileHeader.tsx
    ComidaLocalContactStrip.tsx
    ComidaLocalPreviewCard.tsx
  lib/
    comidaLocalDraftStorage.ts
    comidaLocalContactActions.ts
    mapComidaLocalDraftToShell.ts
    buildComidaLocalPublishPayload.ts
  analytics/comidaLocalAnalytics.ts
app/lib/clasificados/comida-local/
  COMIDA_LOCAL_FOOD_L1_ARCHITECTURE_AUDIT.md  (this file)
  comidaLocalTaxonomy.ts
  comidaLocalPublishReadiness.ts
app/api/clasificados/comida-local/
  publish/route.ts
  draft-media-upload/route.ts   # if needed
scripts/
  comida-local-food-l2-scaffold-audit.ts  # per gate
supabase/migrations/
  YYYYMMDD_comida_local_public_listings.sql
```

---

## 20. UX/UI standard

### Borrow from

| Source | Use |
|---|---|
| En Venta | Sectioned form, photo upload UX, publish bar |
| Servicios / R-C1 | Contact strip colors, social brands |
| Restaurantes R-C2 | Compact header (no food photo background) |
| Leonix tokens | Cream `#FFFCF7`, burgundy `#7A1E2C`, gold border `#D4C4A8`, charcoal `#1E1814` |

### Application UX mandates

- Every field: label + helper + optional marker
- Phone fields: live US formatting
- City: autocomplete, no plain text city for filter core
- Collapsible optional sections: Social, Ubicación, Pago, Servicio
- Preview CTA: "Vista previa" with minimum field checklist (mirror `restaurantePreviewRequirements` length, simpler list)
- Mobile-first single column; max width ~42rem form column

---

## 21. Preview / detail output concept

### Results card

- Photo or logo placeholder
- `businessName`
- `foodType` chip + city
- One-line `queVendes` (clamp 2)
- Primary CTA: Llamar or WhatsApp (whichever is primary present)
- No stars, no "50 reviews", no open-now unless derived from real future data

### Detail page

- `ComidaLocalProfileHeader` (name, food type chips, city/zone, availability one-liner if present)
- **Qué vendes** section (body)
- `ComidaLocalContactStrip` (not full Restaurante hub)
- Optional gallery grid (max 5)
- Engagement row (like/save/share) if public listing
- Leonix ID footer

### Empty-state rules

| Missing data | Behavior |
|---|---|
| No socials | Hide Síguenos |
| No WhatsApp | Hide WhatsApp |
| No phone | Hide Llamar/Mensaje |
| No locationUrl | Hide Ver ubicación (still show locationNote text if any) |
| No availabilityNote | Hide Disponibilidad |
| No payment methods | Hide Formas de pago |
| No gallery extras | Show main only |

---

## 22. Implementation gates FOOD-L2 — FOOD-L9

### FOOD-L2 — Scaffold types/routes/form shell

- **Scope:** `CategoryKey` + registry entry; empty routes; draft types; empty application shell with section nav.
- **Files likely touched:** `categoryConfig.ts`, `categoryChooserServer.ts`, `publicar/comida-local/*`, `clasificados/comida-local/page.tsx` placeholders.
- **Do not touch:** `RestauranteApplicationClient.tsx`, Stripe, pricing tables.
- **Acceptance:** Routes resolve 200; no publish; build passes.
- **Audit script:** `comida-local-food-l2-scaffold-audit.ts`
- **QA:** Navigate chooser shows Comida Local (if visible flag on).

### FOOD-L3 — Field UX, validation, formatting, draft persistence

- **Scope:** Full form fields, helpers, phone format, social normalize, `localStorage` draft + hydration.
- **Files:** `comidaLocalDraftStorage.ts`, application sections, `comidaLocalPublishReadiness.ts`
- **Do not touch:** restaurantes application.
- **Acceptance:** Phone formats live; city canonicalizes; draft reload preserves fields.
- **QA:** Invalid URL rejected; empty contact blocked at publish preview gate.

### FOOD-L4 — Preview/detail shell and output mapping

- **Scope:** `mapComidaLocalDraftToShell`, preview page, detail page, contact strip component.
- **Acceptance:** Preview mirrors detail; empty fields hidden in output.
- **QA:** Mobile width 375px no overflow.

### FOOD-L5 — Publish flow + package hook planning

- **Scope:** API route, Supabase migration `comida_local_public_listings`, Leonix ID allocator, package_tier column, readiness checks.
- **Do not touch:** Stripe charge implementation unless separate payment gate approved.
- **Acceptance:** Publish creates row; `listing_json` round-trips to shell.
- **QA:** Republish keeps slug/leonix_ad_id.

### FOOD-L6 — Results/search/filter/city integration

- **Scope:** Results client, filters, discovery contract doc, hub teasers.
- **Acceptance:** Filter by city + food type works on seed data.
- **QA:** Search "tacos" finds seeded listing.

### FOOD-L7 — Dashboard/admin/Leonix ID integration

- **Scope:** `dashboard/comida-local`, admin workspace, entitlement overlay read path.
- **Acceptance:** Owner sees listing; admin can moderate.

### FOOD-L8 — Analytics tracking

- **Scope:** `comidaLocalAnalytics.ts`, wire CTAs + view on detail/preview.
- **Acceptance:** Events in DB with `category=comida-local`.
- **Do not:** show fake public metrics.

### FOOD-L9 — QA/audit/build hardening

- **Scope:** E2E smoke optional; audit markdown; `npm run build`; selftest script like `restaurantes-launch-selftest.ts` lite version.

---

## 23. Risks / deferred decisions

| Risk | Mitigation |
|---|---|
| Category proliferation in chooser | Phased visibility flag in `site_category_config` |
| Food search overlap with Restaurantes SEO | Separate URLs; clear cross-links only |
| Legal/home-kitchen compliance | Disclaimer in publish confirmations (mirror En Venta rules checkbox); no legal logic in code |
| Analytics allowlist | Audit `listingAnalyticsEventTypes` early in FOOD-L8 |
| Image storage costs | Reuse En Venta / restaurantes media upload patterns; strict count caps |
| Upgrade to Restaurantes data loss | Define explicit field mapping table in FOOD-L5 spec |

---

## 24. Open questions

1. **Main photo required at preview or only at publish?** Recommendation: required at publish; soft warning at preview.
2. **Is one social URL enough to satisfy "contact" if no phone?** Recommendation: require phone OR WhatsApp; socials never satisfy minimum alone (reduces scam listings).
3. **SMS/Mensaje without phone?** Recommendation: only when phone present.
4. **Email in v1?** Recommendation: defer to v1.1 unless needed for dashboard leads.
5. **Featured/promoted in Plus package?** Needs product decision before FOOD-L6.
6. **Separate Supabase table vs generic `listings`?** Recommendation: dedicated `comida_local_public_listings` for clarity (matches restaurantes).
7. **Translation:** Follow restaurantes `TranslateAdControl` later (FOOD-L9+).

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Restaurante was inspected but not modified | TRUE | Read-only inspection; git clean except this doc |
| En Venta/Varios simple pipeline was inspected | TRUE | §3 En Venta rows |
| Servicios contact standard was inspected | TRUE | §3 Servicios rows |
| Shared classified infrastructure was inspected | TRUE | §3 Shared rows |
| No implementation files were created except audit doc | TRUE | Only `COMIDA_LOCAL_FOOD_L1_ARCHITECTURE_AUDIT.md` created |
| No Restaurante fields were added | TRUE | Zero restaurante file edits |
| No Restaurante application files were edited | TRUE | Preflight + scope |
| Product boundary is clearly defined | TRUE | §4 |
| Comida Local is separate from Restaurante Premium | TRUE | §4–6 |
| Feature limits are clearly defined | TRUE | §4 table |
| Required field model is minimal | TRUE | §7 (6 fields) |
| Optional fields are included but controlled | TRUE | §8 with caps |
| Field helper copy is proposed | TRUE | §9 |
| Phone auto-formatting requirement is documented | TRUE | §10 |
| WhatsApp formatting/normalization is documented | TRUE | §10–11 |
| Social URL validation/normalization is documented | TRUE | §11 |
| City/NorCal integration is documented | TRUE | §12 |
| Search/filter impact is documented | TRUE | §12 |
| Dashboard impact is documented | TRUE | §15 |
| Admin impact is documented | TRUE | §16 |
| Leonix ID impact is documented | TRUE | §17 |
| Analytics impact is documented | TRUE | §14 |
| Pricing/package considerations are documented | TRUE | §18 |
| Route recommendation is documented | TRUE | §6 |
| File structure recommendation is documented | TRUE | §19 |
| Preview/detail output concept is documented | TRUE | §21 |
| Future implementation gates are documented | TRUE | §22 FOOD-L2–L9 |
| No Stripe/payment code was edited | TRUE | No code edits |
| No fake analytics/counters were added | TRUE | §14 rules |
| No unrelated categories were edited | TRUE | Preflight |
| UX/UI standards were preserved during audit | TRUE | §20 |
| npm run build was not required because this is audit-only | TRUE | No app code changed |

---

## Next recommended gate

**FOOD-L2 — Scaffold Comida Local types/routes/form shell** (add `comida-local` to category registry, stub routes, draft type definitions, empty application shell, scaffold audit script, `npm run build`).
