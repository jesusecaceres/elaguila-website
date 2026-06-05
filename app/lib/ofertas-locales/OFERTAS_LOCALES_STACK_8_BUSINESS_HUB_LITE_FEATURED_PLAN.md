# Stack 8 — Ofertas Locales Business Hub Lite + Featured Placement Intent Plan

## 1. Existing Business Hub / Negocios Locales social fields found

| Source | Fields | Pattern |
|--------|--------|---------|
| **En Venta Storefront** (`BusinessLinksSection.tsx`) | `facebookUrl`, `instagramUrl`, `tiktokUrl`, `youtubeUrl` + `website` | Plain text inputs, optional |
| **Comida Local** (`ComidaLocalApplicationClient.tsx`) | `instagramUrl`, `facebookUrl`, `tiktokUrl` | Blur normalize via `normalizeComidaLocalSocialInput()` |
| **Viajes Negocios** (`ViajesNegociosApplicationShell.tsx`) | `socialFacebook`, `socialInstagram`, `socialTiktok`, `socialYoutube` | `https://…` placeholder |
| **Autos Negocios** (`mapAutosDealerToBusinessHubContact.ts`) | `dealerSocials.*` | `safeExternalHref()` + platform map for output |
| **Servicios** (`mapServiciosProfileToBusinessHubContact.ts`) | Profile social URLs | Same pushSocial + safeExternalHref pattern |

**Ofertas Locales today:** `websiteUrl` only — no dedicated social fields.

## 2. Existing social validation pattern found

| Helper | Location | Behavior |
|--------|----------|----------|
| `normalizeOfertaLocalUrlInput()` | `ofertasLocalesFormatting.ts` | http/https URL normalize — **reuse for Ofertas Locales socials** |
| `normalizeComidaLocalSocialInput()` | `comidaLocalFormatting.ts` | Platform-aware handle → URL expansion |
| `safeExternalHref()` | Autos `dealerDraftSanitize.ts` | Safe external link for output |
| `sanitizeOptionalUrl()` | `ofertasLocalesPublishMapper.ts` | Uses `normalizeOfertaLocalUrlInput` on publish |

**Recommendation:** Use existing `normalizeOfertaLocalUrlInput` on blur/persistence — no new global social system.

## 3. Existing destacado/featured placement patterns found

| Source | Pattern |
|--------|---------|
| **Ofertas Locales draft** | `isFeaturedRequested: boolean` (foundation, not in UI) |
| **Stack 7 migration** | `is_featured_requested boolean not null default false` |
| **Servicios** | `contact.isFeatured` in profile JSON for Destacados strip |
| **Restaurantes/Empleos** | `destacado` flags in sample/ranking data |
| **Admin entitlements** | `homepage` → "Homepage Destacados" label |

**Gap:** No `featuredPlacementScope` column in DB. Scope intent must use `internal_notes` metadata until a future migration.

## 4. Recommended Ofertas Locales social fields

Add to `OfertaLocalDraft`:

- `facebookUrl`
- `instagramUrl`
- `tiktokUrl`
- `youtubeUrl`
- `googleBusinessUrl`

Keep `websiteUrl` as-is (no duplicate website field).

All optional; validate URL when non-empty; do not block preview/publish when empty.

## 5. Recommended Featured Placement intent fields

Add to `OfertaLocalDraft`:

- `wantsFeaturedPlacement: boolean` (UI checkbox — maps to `is_featured_requested` on publish)
- `featuredPlacementScope: OfertaLocalFeaturedPlacementScope`

Scope values: `zip`, `city`, `category`, `homepage_or_section`, `newsletter`, `not_sure`, `none`.

Keep legacy `isFeaturedRequested` synced for backward compatibility with Stack 7 mapper.

## 6. DB/publish mapper compatibility status

| Field | DB column | Publish path |
|-------|-----------|--------------|
| Social URLs | **None** | Encode in `internal_notes` as `[ofertas_locales_metadata]{...}` JSON block |
| `wantsFeaturedPlacement` | `is_featured_requested` | **Supported** — existing column |
| `featuredPlacementScope` | **None** | Encode in `internal_notes` metadata |
| `websiteUrl` | `website_url` | Already mapped |

**No migration required for Stack 8.** Social + scope stored in review payload via `internal_notes` until Chuy approves column additions.

## 7. What can be safely implemented now

- Draft types, factory defaults, localStorage persistence with URL sanitization
- Compact optional application sections (social links + featured intent)
- Preview: “Síguenos / Follow us” social row (links only when present)
- Preview: internal featured-interest note (not shopper-facing “featured” badge)
- Publish mapper: `is_featured_requested` + metadata in `internal_notes`
- Stack 8 audit script

## 8. What must wait

- Public featured placement / Destacados module rendering
- Paid featured checkout
- Dedicated DB columns for social URLs and placement scope
- Full Business Hub profile, reviews, menus, booking CTAs
- NorCal city autocomplete for social section (N/A)
- Supabase migration apply (locked)

## 9. QA URLs

- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=en
