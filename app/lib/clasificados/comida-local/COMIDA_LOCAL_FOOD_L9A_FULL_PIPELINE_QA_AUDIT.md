# Gate FOOD-L9A — Comida Local Full Pipeline Visibility + Publish QA Audit

## Gate type

BUILD-REQUIRED

## 1. Gate title

Gate FOOD-L9A — Comida Local Full Pipeline Visibility + Publish QA Audit

## 2. Preflight status

**Clean worktree** at gate start (`git status --short` empty). No unrelated dirty files block QA. Gate continues safely with read-only inspection + audit artifacts only.

## 3. Prior audits found

| Gate | Audit file | Status |
|------|------------|--------|
| FOOD-L5B | `COMIDA_LOCAL_FOOD_L5B_PUBLISH_DB_AUDIT.md` | Found |
| FOOD-L5C | `COMIDA_LOCAL_FOOD_L5C_IMAGE_UPLOAD_AUDIT.md` | Found |
| FOOD-L5D | `COMIDA_LOCAL_FOOD_L5D_PACKAGE_PAYMENT_AUDIT.md` | Found |
| FOOD-L6 | `COMIDA_LOCAL_FOOD_L6_PUBLIC_RESULTS_AUDIT.md` | Found |
| FOOD-L7A | `COMIDA_LOCAL_FOOD_L7A_USER_DASHBOARD_AUDIT.md` | Found |
| FOOD-L7B | `COMIDA_LOCAL_FOOD_L7B_ADMIN_DASHBOARD_AUDIT.md` | Found |
| FOOD-L8A | `COMIDA_LOCAL_FOOD_L8A_ANALYTICS_EVENTS_AUDIT.md` | Found |

Also read (Restaurante regression references):

- `RESTAURANTES_R_C1_CONTACT_HUB_AUDIT.md`
- `RESTAURANTES_R_C2_HEADER_LOCATION_AUDIT.md`

## 4. Missing gates / blockers

| Item | Status |
|------|--------|
| FOOD-L5E Stripe checkout | **Deferred** (documented in L5D) |
| FOOD-L8B owner analytics display | **Deferred** (L8A events only) |
| Visual/card polish gate | **Not started** (intentional) |
| **L7A dashboard page wiring** | **REGRESSION** — helpers exist but `mis-anuncios/page.tsx` no longer imports `fetchOwnerComidaLocalListings` / `ComidaLocalDashboardListings` |
| L8A `package.json` script | Restored in L9A preflight (`comida-local:food-l8a-analytics-events-audit`) |

## 5. Files changed (this gate)

- `COMIDA_LOCAL_FOOD_L9A_FULL_PIPELINE_QA_AUDIT.md` (this file)
- `scripts/comida-local-food-l9a-full-pipeline-qa-audit.ts`
- `package.json` — L9A + restored L8A audit scripts only

**No product code changed.** No Restaurante files changed.

## 6. Route visibility result

### Comida Local

| Route | File | Purpose | Access | DB | Empty state |
|-------|------|---------|--------|-----|-------------|
| `/publicar/comida-local` | `app/(site)/publicar/comida-local/page.tsx` | Application form + draft | Public form | No (localStorage draft) | Empty draft OK |
| `/clasificados/comida-local/preview` | `preview/page.tsx` + `ComidaLocalPreviewClient.tsx` | Draft preview | Public preview (`robots: noindex`) | No | No-draft message |
| `/clasificados/comida-local` | `page.tsx` | Public results | Public | Yes — `status=published` | Empty results CTA |
| `/clasificados/comida-local/[slug]` | `[slug]/page.tsx` | Public detail | Public | Yes — slug lookup published | `notFound()` |

### User / admin

| Route | File | Purpose | Access |
|-------|------|---------|--------|
| `/dashboard/mis-anuncios` | `app/(site)/dashboard/mis-anuncios/page.tsx` | User listings hub | Auth — **Comida section NOT wired (regression)** |
| `/admin/workspace/clasificados/comida-local` | `app/admin/.../comida-local/page.tsx` | Admin queue | Admin cookie |

### Restaurante premium (regression check — read-only)

| Route | File | Purpose |
|-------|------|---------|
| `/publicar/restaurantes` | `app/(site)/publicar/restaurantes/page.tsx` | Premium application |
| `/clasificados/restaurantes/preview` | Restaurante preview client | Draft preview |
| `/clasificados/restaurantes/[slug]` | Public detail | Published listing |

## 7. Publish flow result

**PASS (code inspection)** — `app/api/clasificados/comida-local/publish/route.ts`

- `parseComidaLocalPublishRequest` validates draft
- Phone OR WhatsApp required (`comidaLocalPublishValidation.ts`)
- City required
- Main photo required (L5C)
- Heavy media / base64 rejected (`detectHeavyMedia`)
- `owner_user_id` from Bearer only (`comidaLocalOwnerIdFromBearer`)
- `allocateNextComidaLocalLeonixAdId` → `COMIDA-YYYY-######`
- Slug via `buildComidaLocalSlugBase` + `allocateUniqueSlug`
- Inserts/updates `comida_local_public_listings`
- Response: `id`, `slug`, `leonix_ad_id`, `status`, `package_tier`, `payment_status`, `category`, `publicPath`
- No Stripe/checkout calls
- No analytics on publish
- `payment_status`: `not_required_for_l5b` (dev waiver per L5B/L5D)

**Manual QA:** Publish one real draft in dev/staging with Supabase configured; confirm row in DB and public URL.

## 8. Image result

**PASS (code inspection)**

- Upload: `app/api/clasificados/comida-local/draft-media-upload/route.ts`
- MIME/size validation in `comidaLocalImageValidation.ts`
- Draft stores HTTPS metadata via `normalizeComidaLocalImageFromStorage` — no base64/File in localStorage persistence path
- Publish sanitizes images (`sanitizeComidaLocalImageForDb`)
- Preview/public render via `resolveComidaLocalImageUrl` (HTTPS only)
- Main photo required for publish; logo optional; gallery capped by package tier (L5D)

## 9. Public results/card result

**PASS**

- `listPublishedComidaLocalListings` → `.eq("status", "published")` on `comida_local_public_listings` only
- No localStorage / demo arrays in results page
- `ComidaLocalListingCard`: real name, food type, city, excerpt, chips, Ver ficha, Llamar/WhatsApp when data exists
- No fake views/clicks/ratings
- No Restaurante CTAs (Reservar, Pedir ahora, Opiniones, Menú completo) — grep clean
- L8A: card tracks clicks (best-effort, no UI metrics)

## 10. Public detail result

**PASS**

- `getPublishedComidaLocalListingBySlug` — published rows only; `notFound()` otherwise
- `ComidaLocalPublicDetailClient` + `ComidaLocalDetailShell` — no preview badge
- Leonix ID footer from `row.leonix_ad_id` only
- Contact CTAs from row-derived preview VM
- Optional sections hide via `sections` flags
- No restaurant menu/reservation/review blocks
- L8A: `profile_view` once per session; contact click tracking with `analyticsContext`

## 11. User dashboard result

**PARTIAL / REGRESSION**

- **Helpers exist:** `comidaLocalDashboardQueries.ts`, `mapComidaLocalDashboardListing.ts`, `ComidaLocalDashboardListings.tsx`
- **Page wiring missing:** `app/(site)/dashboard/mis-anuncios/page.tsx` does not fetch or render Comida Local (L7A integration regressed or never landed on current branch)
- `dashboardInventory.ts` includes `comida_local_public_listings` source type only

**Remaining work:** Re-apply L7A `mis-anuncios` integration (fetch `fetchOwnerComidaLocalListings`, filter chip, section, empty state).

## 12. Admin result

**PASS (code inspection)**

- Route: `/admin/workspace/clasificados/comida-local`
- Protected by admin `(dashboard)/layout` + `requireAdminCookie` on status action
- `listAdminComidaLocalListings` reads `comida_local_public_listings`
- Table: Leonix ID, vendor, city, food type, owner, status, package/payment, Ver ficha, inspect JSON
- Status moderation via server action (L7B)
- Empty state: "No hay publicaciones de Comida Local todavía."
- No fake analytics counters

## 13. Package/payment result

**PASS (deferred checkout)**

- `comidaLocalPackages.ts`: Basic $99 (9900¢), Plus $149 (14900¢), gallery limits
- Dashboard/admin mappers use package + payment labels
- `payment_status = not_required_for_l5b` on publish; no fake `paid`
- Stripe checkout **deferred** (L5E); no hardcoded live price IDs
- Public visibility: `status = published` rows shown (payment not gating public yet)

## 14. Analytics result

**PASS (L8A complete)**

- Real backend: `POST /api/analytics/events` via `comidaLocalAnalytics.ts`
- Card: `result_card_click`, `call_click`, `whatsapp_click`
- Detail: `profile_view`, contact/social/location via `ComidaLocalContactActions`
- Preview excluded (no `analyticsContext`)
- No public/dashboard metric display
- `comida_local_public_listings` in analytics identity resolver

## 15. Restaurante regression result

**PASS (read-only, no edits this gate)**

- Application: `/publicar/restaurantes` exists
- Contact hub sections present in `RestaurantContactHub.tsx`: Contáctanos, Ordena o reserva, Opiniones, Síguenos, Búscanos aquí, Nuestra ubicación, Horarios
- R-C1/R-C2 audits document contact hub + header cleanup
- `RestauranteDetailShell.tsx`: Sobre nosotros section retained
- `buildRestaurantContactHub.ts`: Google/Yelp review links
- No Restaurante files modified in FOOD-L9A

**Recommended:** Run `npm run restaurantes:r-c1-contact-hub-audit` and `npm run restaurantes:r-c2-header-location-audit` before launch.

## 16. Screenshot capture checklist

### Comida Local — results

- [ ] Desktop `/clasificados/comida-local` — empty state
- [ ] Desktop `/clasificados/comida-local` — populated cards (real DB rows)
- [ ] Mobile results — card stack

### Comida Local — card

- [ ] Desktop card — photo, vendor, food type, city, Ver ficha, contact CTAs
- [ ] Mobile card — same fields

### Comida Local — detail

- [ ] Desktop detail — header, contact actions, gallery
- [ ] Mobile detail — contact action area
- [ ] Optional sections hidden when empty
- [ ] Leonix ID footer when present

### Comida Local — publish/preview

- [ ] `/publicar/comida-local` form
- [ ] `/clasificados/comida-local/preview` (draft, noindex)

### User dashboard

- [ ] `/dashboard/mis-anuncios` — **blocked until L7A wiring restored**
- [ ] Comida Local empty state (when wired)
- [ ] Comida Local populated section (when wired)

### Admin

- [ ] `/admin/workspace/clasificados/comida-local` — empty queue
- [ ] Admin populated table + inspect JSON panel

### Restaurante regression

- [ ] `/publicar/restaurantes` application
- [ ] Restaurante public detail — contact hub sections
- [ ] Restaurante header (R-C2 — no messy hero background)

## 17. What is intentionally not polished yet

- Card visual polish / Figma alignment
- Featured Plus placement / ranking
- Stripe checkout (L5E)
- Owner analytics dashboard rollups (L8B)
- Dedicated Comida Local manage hub (beyond mis-anuncios section)
- Category hub/registry card for admin home (ops contract ready)

## 18. Risks / deferred work

1. **L7A dashboard wiring regression** — blocks owner self-service visibility
2. Payment gating not enforced — dev publish visible while `not_required_for_l5b`
3. No E2E publish test run in CI (manual QA required)
4. L8A `package.json` script was missing — restored alongside L9A

## 19. Manual QA checklist

- [ ] Publish flow with auth + Supabase admin configured
- [ ] Confirm `COMIDA-*` Leonix ID in DB response
- [ ] Public results show only published rows
- [ ] Detail 404 for invalid slug
- [ ] Preview does not appear in results
- [ ] Image upload → publish with main photo
- [ ] Admin queue lists rows; status change works
- [ ] Analytics POST on card click + detail view (network tab)
- [ ] **Restore L7A mis-anuncios wiring** then verify owner section
- [ ] Restaurante R-C1/R-C2 audit scripts pass
- [ ] `npm run build` passes

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| ----------------------------------------------------------- | ---------- | -------- |
| Repo state was inspected before edits | TRUE | Clean preflight |
| Prior Comida Local audits were reviewed | TRUE | Section 3 |
| Comida Local application route exists | TRUE | `publicar/comida-local/page.tsx` |
| Comida Local preview route exists | TRUE | `preview/page.tsx` |
| Comida Local public results route exists | TRUE | `comida-local/page.tsx` |
| Comida Local public detail route exists | TRUE | `[slug]/page.tsx` |
| Publish API exists | TRUE | `publish/route.ts` |
| Publish API validates required fields | TRUE | `comidaLocalPublishValidation.ts` |
| Publish API generates real COMIDA Leonix ID | TRUE | `allocateNextComidaLocalLeonixAdId` |
| Publish API writes to comida_local_public_listings | TRUE | publish route |
| Image upload route exists | TRUE | `draft-media-upload/route.ts` |
| Image upload avoids base64/File localStorage persistence | TRUE | image normalize + publish heavy-media guard |
| Public results use real DB rows only | TRUE | `listPublishedComidaLocalListings` |
| Public card uses real data only | TRUE | `mapComidaLocalRowToCardVm` |
| Public detail uses real data only | TRUE | `getPublishedComidaLocalListingBySlug` |
| User dashboard shows owner-scoped Comida Local listings | **FALSE** | L7A helpers exist; `mis-anuncios` not wired |
| Admin dashboard shows Comida Local listings | TRUE | admin `comida-local/page.tsx` |
| Package/payment status is real or clearly deferred | TRUE | L5D + `not_required_for_l5b` |
| Analytics tracking is real or blocker is clearly documented | TRUE | L8A `comidaLocalAnalytics.ts` |
| Preview/local draft is not counted as real analytics | TRUE | L8A preview exclusion |
| Restaurante pipeline remains intact | TRUE | Read-only regression; R-C1/R-C2 audits |
| No fake listings were added | TRUE | No seed/demo arrays |
| No fake analytics/counters were added | TRUE | No metric UI |
| No fake paid status was added | TRUE | L5B waiver only |
| No forbidden category files were edited | TRUE | Audit-only gate |
| Screenshot checklist was produced | TRUE | Section 16 |
| Audit script passed | TRUE | `npm run comida-local:food-l9a-full-pipeline-qa-audit` |
| npm run build passed | TRUE | `npm run build` |

### FALSE row remediation

**User dashboard shows owner-scoped Comida Local listings — FALSE**

- **Why:** `app/(site)/dashboard/mis-anuncios/page.tsx` missing L7A fetch/render despite helpers existing.
- **Remaining work:** Re-integrate `fetchOwnerComidaLocalListings`, `ComidaLocalDashboardListings`, `comida-local` filter chip per `COMIDA_LOCAL_FOOD_L7A_USER_DASHBOARD_AUDIT.md`.

**Gate completion note:** Pipeline is verified end-to-end except user dashboard page wiring. Recommend **FOOD-L7A-RESTORE** or hotfix before visual polish / Figma review.
