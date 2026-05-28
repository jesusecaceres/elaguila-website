# W11 — Final Production Launch QA: Full-Site Green Lock

**Audit date:** 2026-05-27  
**References:** C1–C6 clasificados gates, W1–W10 website audits, `CLASIFICADOS_C6_STRIPE_READINESS_ACTIVATION_CONTRACT.md`  
**Scope:** Final cross-stack production launch lock — public site, Clasificados (12 categories), publish, auth, dashboards, admin, business CTAs, analytics, SEO/social, legal/payment trust. No new features, no Stripe, no fake data.

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Code/content proves launch-safe behavior |
| FALSE | Broken, fake, unsafe, or launch-blocking |
| DEFERRED_INTENTIONAL | Safely hidden, noindexed, contact-based, or documented without misleading users |
| NOT_APPLICABLE | Out of scope |

---

## Executive summary

| Verdict | Detail |
|---|---|
| **Launch lock** | **GREEN** — no open FALSE blockers after W1–W10 fixes |
| **Build** | `npm run build` PASS (2026-05-27, ~164s) |
| **Code changes in W11** | Audit document only (synthesis gate) |
| **Stripe** | Intentionally not live; contact/admin entitlement model (C6) |

---

## 1. Main audit table (full-site lock)

| Area | Route/file/system | Required launch behavior | Current implementation | Launch risk | Status | Notes |
|---|---|---|---|---|---|---|
| Build / deploy | `npm run build` | Green production build | PASS `exit_code: 0` | None | TRUE | W11 gate |
| Public routes | W1 inventory | No broken nav/footer/category 404s | W1 TRUE; chooser + category landings verified in code | Low | TRUE | Re-verify URLs in staging smoke |
| Homepage → Clasificados | `/home`, `/clasificados` | Safe journey | W2 TRUE; hub metadata + chooser | Low | TRUE | |
| Publish → auth | `/login`, `/clasificados/login` | Redirect preserves publish intent | W3 `safeInternalRedirect`, `mode=post` | Medium if broken | TRUE | |
| Publish flows | `/publicar/*`, `/clasificados/publicar/*` | Owner attached; no orphan listings | W8 TRUE all 12 categories | High | TRUE | |
| User dashboard | `/dashboard/*` | Auth required; owner-only data | W4/W5/W6; `owner_id !== user.id` guard | High | TRUE | |
| Admin | `/admin/*` | Cookie gate; not in public nav | `requireAdminCookie`; `robots` disallow `/admin` | High | TRUE | |
| Saved ads | `/dashboard/guardados` | Per-user `saved_listings` | W8 TRUE | Medium | TRUE | |
| Analytics | `listing_analytics`, dashboards | Real or honest zero | W6 degraded banner; no fake inflation | Medium | TRUE | |
| Package badges | `mis-anuncios`, restaurantes | Entitlement-backed Destacado | W6 fixes; not raw `promoted` alone | High | TRUE | |
| Business CTAs | Servicios/Restaurantes public | Real hrefs + tracking where wired | W7 TRUE; Servicios analytics separate store | Low | TRUE | |
| Legacy servicios perfil | `/servicios/perfil/[slug]` | No demo SEO | **W9 fix:** redirect → `/clasificados/servicios/[slug]` or 404 | Was High | TRUE | W8 listed FALSE; resolved W9 |
| SEO metadata | public + anuncio detail | Safe titles/OG; missing → noindex | W9 anuncio `fetchListingHeadMetadata` | Medium | TRUE | |
| Private routes | dashboard/admin/preview | noindex + robots | W9 layouts + expanded `robots.ts` | Medium | TRUE | |
| Legal / trust | policies + footer | Linked, honest payment copy | W10 footer + legal hub + mailto fix | Medium | TRUE | |
| Payment / Stripe | public surfaces | No live checkout claims | C6 + W10; Autos paused copy; Tienda contact-only | High | TRUE | |
| Production scan | app/(site) code | No $89.99, no user TODO/lorem | W11 scan clean in live TS/TSX | Medium | TRUE | See §7 |

---

## 2. Public journey verification (code-backed)

| Journey | Steps | Status | Evidence |
|---|---|---|---|
| Visitor → home → Clasificados | `/` → `/home` → `/clasificados` | TRUE | W1/W2; hub chooser `PublicarPageClient.tsx` |
| Visitor → category → results | e.g. `/clasificados/empleos` → `…/resultados` | TRUE | Category routes exist (W1); metadata on key hubs (W9) |
| Visitor → result/detail | slug/id detail pages | TRUE | W8 matrix; `notFound()` when missing (restaurantes, empleos, etc.) |
| Visitor → publish CTA → login | Navbar/chooser → `/login?mode=post&redirect=…` | TRUE | W3 |
| User → publish → submit | Per-category publish modules + `owner_id` / `owner_user_id` | TRUE | W8 |
| User → `mis-anuncios` | Listings by owner; category chips | TRUE | W4/W6 |
| Buyer → save → guardados | `LeonixSaveButton` + `saved_listings` | TRUE | W8/C5A |
| Admin → user detail → listings | `fetchAdminUserAdsForUser` + rollups | TRUE | W5/W6 (incl. Viajes) |
| Admin → category queue | `/admin/workspace/clasificados/*` | TRUE | W5 mascotas queue fixed; W1 inventory |

---

## 3. Final category matrix

| Category | Landing | Results | Publish | Detail | User dashboard | Admin | Search/filter | Package/payment safe | Overall |
|---|---|---|---|---|---|---|---|---|---|
| Autos | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE (C4) | TRUE (mailto boost $129.99) | **TRUE** |
| Bienes Raíces | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE (C4) | TRUE ($99.99 add-on contact) | **TRUE** |
| En Venta | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE (C4) | TRUE (entitlement Destacado W6) | **TRUE** |
| Empleos | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE (C4) | TRUE (seed omitted prod policy) | **TRUE** |
| Rentas | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | **TRUE** |
| Servicios | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE (NN/Destacado entitlement) | **TRUE** |
| Restaurantes | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE (W6/W7) | **TRUE** |
| Clases | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE (free; paid blocked) | **TRUE** |
| Comunidad | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE (free) | **TRUE** |
| Mascotas y Perdidos | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE (free) | **TRUE** |
| Busco | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE (free) | **TRUE** |
| Viajes | TRUE | TRUE | TRUE | DEFERRED_INTENTIONAL | TRUE | TRUE | TRUE | TRUE (staged; no Stripe) | **TRUE** |

**Viajes detail:** Public `/clasificados/viajes/oferta/[slug]` only when staged listing approved + `is_public` — intentional moderation, not a leak.

---

## 4. Dashboard / admin final lock

| Check | Status | Notes |
|---|---|---|
| Dashboard auth redirect | TRUE | W3/W4 pattern on pages |
| Dashboard `robots: noindex` | TRUE | W9 `dashboard/layout.tsx` |
| Owner guard on listing detail | TRUE | `mis-anuncios/[id]/page.tsx`: `listing.owner_id !== user.id` |
| Entitlement badges (en-venta, restaurantes) | TRUE | W6 `fetchDashboardListingPackageEntitlementBadges` |
| Admin cookie required | TRUE | `requireAdminCookie` on user list/detail and workspaces |
| Admin `robots: noindex` | TRUE | W9 `admin/layout.tsx` |
| Admin user command center | TRUE | W6 rollups; Viajes group |
| Admin payment display | TRUE | `payment_status: null` on manual grants (C6) |
| No fake Stripe in admin tracker | TRUE | C6 contract preserved |

---

## 5. Package / payment final safety

| Rule | Status | Evidence |
|---|---|---|
| No $89.99 in live app code | TRUE | W11 grep: none in `app/**/*.{ts,tsx}`; policy uses **99.99** |
| BR +5 @ $99.99/mo | TRUE | `leonixBrPropertyInventoryPolicy.ts` |
| Autos +10 @ $129.99/mo | TRUE | `autosDealerInventoryCopy.ts` |
| BR/Autos base $399 references | TRUE | Same files + copy |
| NN tier grid ($1,999–$399) on public browse | DEFERRED_INTENTIONAL | Documented in `docs/`; sales via media kit/contact — not fake on cards |
| Public Stripe checkout live | FALSE to implement | **DEFERRED_INTENTIONAL** — not claimed live (W10 terms, Tienda, Autos paused) |
| Upgrade CTAs contact-based | TRUE | `LEONIX_GLOBAL_MAILTO`; payment notes on drawers |
| Entitlements activate placement only when active | TRUE | C5B/C6 + W6 |
| Billing portal | DEFERRED_INTENTIONAL | Disabled unless `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL` (W10) |

---

## 6. SEO / legal / trust final lock

| Check | Status | Notes |
|---|---|---|
| Root `metadataBase` + OG | TRUE | `app/layout.tsx` |
| Dynamic anuncio metadata | TRUE | W9 `fetchListingHeadMetadata` |
| Preview/demo noindex | TRUE | W9 robots + preview layouts |
| Legal footer links | TRUE | W10 `Footer.tsx` |
| `/legal` policy index | TRUE | W10 |
| `/privacy`, `/terms`, `/data-deletion` | TRUE | W10 |
| Contact phone/email | TRUE | `(408) 360-6500`, `info@leonixmedia.com` |
| Policy contact `chuy@` | DEFERRED_INTENTIONAL | Documented dual inbox (W10) |
| Share URL safety | TRUE | W9 `getSafePublicAdUrl` |

---

## 7. Production safety scan (W11)

| Scan item | Found in user-facing code? | Location | Status |
|---|---|---|---|
| `$89.99` | No | — | TRUE |
| `lorem ipsum` | No | — | TRUE |
| User-visible `TODO` | No | Only dev comments in non-render paths | TRUE |
| `soporte@elaguila.com` | No (fixed W10) | — | TRUE |
| `undefined` / `null` in policies | No | — | TRUE |
| Fake Stripe “pay now” on hubs | No | — | TRUE |
| Demo servicios perfil as production | No | Redirect/404 W9 | TRUE |
| `getServiciosProfileBySlug` public route | No | Preview/dev only | TRUE |
| Admin in public Navbar | No | W1/W2 | TRUE |

---

## 8. Known deferred items (confirmed non-blocking)

| Item | Status | Launch impact |
|---|---|---|
| Stripe checkout / webhooks | DEFERRED_INTENTIONAL | Contact + admin entitlements; honest copy |
| BR/Autos inventory add-on via Stripe | DEFERRED_INTENTIONAL | Mailto until entitlement + C6 activation |
| Apple Sign-In | DEFERRED_INTENTIONAL | Not exposed (W3) |
| Billing portal without env | DEFERRED_INTENTIONAL | Disabled UI (W10) |
| Full NN price grid on marketing site | DEFERRED_INTENTIONAL | Media kit / sales process |
| Servicios CTA analytics → separate table | DEFERRED_INTENTIONAL | W7; CTAs real |
| Viajes curated demo catalog | DEFERRED_INTENTIONAL | `viajesAllowCuratedDemoCatalog()` off in prod |
| Empleos marketing seed catalog | DEFERRED_INTENTIONAL | `empleosOmitMarketingSeedCatalog()` in prod |
| Translation product track | NOT_APPLICABLE | Out of W11 scope |
| Sitemap dynamic listings | DEFERRED_INTENTIONAL | W9 minimal sitemap documented |
| Dashboard/admin visual polish | DEFERRED_INTENTIONAL | Post-launch |

---

## W11 blockers before launch

**None.** All prior FALSE items from W7–W10 are resolved or documented as safe deferrals.

| Prior FALSE | Resolution gate |
|---|---|
| Legacy `/servicios/perfil/[slug]` demo | W9 redirect/404 |
| Generic anuncio SEO | W9 dynamic metadata |
| Dashboard/admin indexable | W9 noindex + robots |
| Wrong upgrade mailto domain | W10 `info@leonixmedia.com` |
| Missing footer legal links | W10 |
| En Venta/Restaurantes fake Destacado | W6 entitlement badges |

---

## Final launch readiness summary

| Stack | Status | Notes |
|---|---|---|
| Public site | **TRUE** | W1/W2; build green |
| Clasificados categories | **TRUE** | All 12 locked (W8 + C1–C6) |
| Publish flow | **TRUE** | Owner/category/Leonix Ad ID contracts |
| Auth/profile | **TRUE** | W3 |
| User dashboard | **TRUE** | W4/W6 |
| Admin dashboard | **TRUE** | W5/W6 |
| Business profiles/CTAs | **TRUE** | W7 |
| Analytics | **TRUE** | Real or honest empty |
| Package/payment safety | **TRUE** | C6 + W10; Stripe deferred honestly |
| SEO/social | **TRUE** | W9 |
| Legal/trust | **TRUE** | W10 |
| Mobile/nav | **TRUE** | W2 |
| Build/deploy | **TRUE** | W11 `npm run build` PASS |

---

## W11 verification checklist

| # | Item | Result |
|---|---|---|
| 1 | Final routes/build | PASS (~164s) |
| 2 | Public journeys | Code-verified (§2) |
| 3 | All 12 categories | TRUE overall (§3) |
| 4 | Dashboard/admin | TRUE (§4) |
| 5 | Package/payment | TRUE + deferred Stripe (§5) |
| 6 | SEO/legal/trust | TRUE (§6) |
| 7 | Production safety scan | Clean (§7) |
| 8 | Deferred items | Non-blocking (§8) |
| 9 | Remaining blockers | **None** |
| 10 | Files changed | `WEBSITE_W11_FINAL_PRODUCTION_LAUNCH_QA.md` only |
| 11 | `npm run build` | PASS |

---

## Recommended post-launch smoke (manual, staging/prod)

Not required for W11 code lock; recommended for operators:

1. Click-test footer legal links and `/clasificados/publicar` chooser deep links.
2. Publish one free listing (e.g. Busco or Comunidad) and confirm public URL + `mis-anuncios`.
3. Confirm admin login + user command center shows the new listing.
4. Share a live listing URL in messaging app and verify OG preview.

---

## Build gate

```
npm run build
```

**Result:** PASS (`exit_code: 0`, 2026-05-27, ~164s).
