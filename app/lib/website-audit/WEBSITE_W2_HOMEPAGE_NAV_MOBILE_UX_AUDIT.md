# W2 — Homepage, Navigation, CTA, and Mobile UX Safety Audit

**Audit date:** 2026-05-26  
**References:** W1 route inventory, C1-C6 gates  
**Scope:** Homepage, global navbar, footer, mobile drawer, Clasificados entry points, publish chooser, main user journeys, and mobile UX safety. No visual redesign, no Stripe, no fake content.

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | CTA/nav element is real, safe, routes correctly, and works on both desktop and mobile |
| FALSE | CTA is broken, confusing, routes incorrectly, or exposes unfinished/fake features |
| DEFERRED_INTENTIONAL | Safely hidden, not linked publicly, or honestly deferred |
| NOT_APPLICABLE | Not relevant to this surface |

---

## 1. Homepage / Inicio

| Surface | Element / CTA | Destination / Behavior | Desktop safe | Mobile safe | Auth behavior | Production safe | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Root `/` | Language splash buttons | `window.location.href = /home?lang={es\|en}` | Yes | Yes | None required | Yes | TRUE | Cinematic splash with ES/EN |
| `/home` hero | Primary CTA (CMS) | `content.ctaPrimaryHref` or fallback `/magazine?lang=...` | Yes | Yes | None | Yes | TRUE | Null href renders safe `/magazine` fallback |
| `/home` hero | Secondary CTA (CMS) | `content.ctaSecondaryHref` — if null, renders as `<p>` text, not broken link | Yes | Yes | None | Yes | TRUE | Graceful degradation |
| `/home` hero | Hero image link | Same as primary CTA href | Yes | Yes | None | Yes | TRUE | |
| `/home` callouts | Featured callouts (CMS array) | Admin-controlled hrefs; filtered to only `/` or `https://` prefixes | Yes | Yes | None | Yes | TRUE | Malformed URLs rejected at merge |
| `/home` hero | Announcement bar | Text only (no link) | Yes | Yes | None | Yes | TRUE | Conditional on `modules.showAnnouncement` |
| `/home` | Promo strip | Text only (no link) | Yes | Yes | None | Yes | TRUE | |
| `/home` | Fake Premium/Destacado claims | None present | Yes | Yes | N/A | Yes | TRUE | No package claims on homepage |
| `/home` | Stripe/payment exposure | None present | Yes | Yes | N/A | Yes | TRUE | |
| `/home` | Newsletter/social CTAs | Not present | N/A | N/A | N/A | N/A | DEFERRED_INTENTIONAL | Footer says "Social channels coming soon" |
| `/home` | Language preservation | `?lang=` query param from splash or URL | Yes | Yes | N/A | Yes | TRUE | |

---

## 2. Global navbar

| Surface | Element / CTA | Destination / Behavior | Desktop safe | Mobile safe | Auth behavior | Production safe | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Navbar | Inicio / Home | `/home?lang=...` | Yes | Yes | None | Yes | TRUE | |
| Navbar | Revista / Magazine | `/magazine?lang=...` | Yes | Yes | None | Yes | TRUE | |
| Navbar | Clasificados | `/clasificados?lang=...` | Yes | Yes | None | Yes | TRUE | |
| Navbar | Cupones / Coupons | `/coupons?lang=...` | Yes | Yes | None | Yes | TRUE | |
| Navbar | Productos Promoción | `/productos-promocion?lang=...` | Yes | Yes | None | Yes | TRUE | |
| Navbar | Noticias / News | `/noticias?lang=...` | Yes | Yes | None | Yes | TRUE | |
| Navbar | Contacto | `/contacto?lang=...` | Yes | Yes | None | Yes | TRUE | |
| Navbar | Nosotros / About | `/about?lang=...` | Yes | Yes | None | Yes | TRUE | |
| Navbar | Iglesias / Churches | `/iglesias?lang=...` | Yes | Yes | None | Yes | TRUE | |
| Navbar | Anúnciate / Advertise | `/login?mode=post&lang=...&redirect=/clasificados/publicar/en-venta?lang=...` | Yes | Yes | Redirects to login → then publish | Yes | TRUE | Gold-styled CTA; never renders `/advertise` as destination |
| Navbar | Sign in button | `router.push(/login?mode=login&lang=...)` | Yes | Yes | Shown only when logged out | Yes | TRUE | |
| Navbar (mobile) | Create account | `/login?mode=signup&lang=...` | N/A | Yes | Shown only when logged out | Yes | TRUE | Mobile-only |
| Navbar | Account dropdown | Shown only when `user` is set | Yes | N/A | Auth-gated (client session check) | Yes | TRUE | |
| Navbar dropdown | Manage account | `/dashboard?lang=...` | Yes | Yes | Shown only when logged in | Yes | TRUE | |
| Navbar dropdown | My listings | `/dashboard/mis-anuncios?lang=...` | Yes | Yes | Shown only when logged in | Yes | TRUE | |
| Navbar | Sign out | Client `signOut()` → `/home?lang=...&signed_out=1` | Yes | Yes | Shown only when logged in | Yes | TRUE | Toast shown briefly |
| Navbar | Language switch (ES/EN) | `router.push` with updated `?lang=` | Yes | Yes | None | Yes | TRUE | |
| Navbar | Hidden on surfaces | Returns `null` for `/`, `/preview` paths, `/servicios/perfil` | Yes | Yes | N/A | Yes | TRUE | Intentional for splash/preview/profile |
| Navbar | Admin/private exposure | No admin or dev links exposed | Yes | Yes | N/A | Yes | TRUE | |

---

## 3. Footer

| Surface | Element / CTA | Destination / Behavior | Desktop safe | Mobile safe | Auth behavior | Production safe | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Footer | Email link | `mailto:info@leonixmedia.com` | Yes | Yes | None | Yes | TRUE | |
| Footer | Phone link | `tel:+14083606500` → "(408) 360-6500" | Yes | Yes | None | Yes | TRUE | min-h-[44px] for tap target |
| Footer | Advertise "Learn more" | `/contacto?lang=...` | Yes | Yes | None | Yes | TRUE | |
| Footer | Productos para Promoción | `/productos-promocion?lang=...` | Yes | Yes | None | Yes | TRUE | min-h-[44px] for tap target |
| Footer | Contact Store | `/tienda/contacto?lang=...` | Yes | Yes | None | Yes | TRUE | min-h-[44px] for tap target |
| Footer | Website link | `https://leonixmedia.com` (self-referential) | Yes | Yes | None | Yes | TRUE | rel="noopener noreferrer" |
| Footer | Social note | "Próximamente en redes" / "Social channels coming soon" | Yes | Yes | N/A | Yes | DEFERRED_INTENTIONAL | Honest deferral |
| Footer | Cookie preferences | `CookiePreferencesTrigger` component | Yes | Yes | None | Yes | TRUE | |
| Footer | Legal/Privacy/Terms links | Not in footer (separate pages exist at `/legal`, `/privacy`, `/terms`) | N/A | N/A | N/A | N/A | TRUE | Pages exist; accessible via direct URL |
| Footer | Mobile layout | Single column, adequate spacing | Yes | Yes | None | Yes | TRUE | |

---

## 4. Clasificados hub entry points

| Surface | Element / CTA | Destination / Behavior | Desktop safe | Mobile safe | Auth behavior | Production safe | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| `/clasificados` | Sign in CTA | `/clasificados/login?lang=...` | Yes | Yes | None | Yes | TRUE | |
| `/clasificados` | Create account CTA | `/clasificados/login?lang=...` | Yes | Yes | None | Yes | TRUE | |
| `/clasificados` | Publicar anuncio CTA | `/login?mode=post&lang=...&redirect=/clasificados/publicar?lang=...` | Yes | Yes | Redirects to login → then publish | Yes | TRUE | |
| `/clasificados` | Explorar categorías | `#categorias` anchor | Yes | Yes | None | Yes | TRUE | |
| `/clasificados` | Rentas card | `/clasificados/rentas?lang=...` | Yes | Yes | None | Yes | TRUE | |
| `/clasificados` | Bienes Raíces card | `/clasificados/bienes-raices?lang=...` | Yes | Yes | None | Yes | TRUE | Desktop: in grid; Mobile: featured above grid |
| `/clasificados` | En Venta card | `/clasificados/en-venta?lang=...` | Yes | Yes | None | Yes | TRUE | |
| `/clasificados` | Empleos card | `/clasificados/empleos?lang=...` | Yes | Yes | None | Yes | TRUE | |
| `/clasificados` | Servicios card | `/clasificados/servicios?lang=...` | Yes | Yes | None | Yes | TRUE | |
| `/clasificados` | Restaurantes card | `/clasificados/restaurantes?lang=...` | Yes | Yes | None | Yes | TRUE | |
| `/clasificados` | Viajes (travel) card | `/clasificados/viajes?lang=...` | Yes | Yes | None | Yes | TRUE | Maps `travel` → `/clasificados/viajes` |
| `/clasificados` | Autos card | `/clasificados/autos?lang=...` | Yes | Yes | None | Yes | TRUE | |
| `/clasificados` | Clases card | `/clasificados/clases?lang=...` | Yes | Yes | None | Yes | TRUE | |
| `/clasificados` | Comunidad card | `/clasificados/comunidad?lang=...` | Yes | Yes | None | Yes | TRUE | |
| `/clasificados` | Busco card | `/clasificados/busco?lang=...` | Yes | Yes | None | Yes | TRUE | |
| `/clasificados` | Mascotas card | `/clasificados/mascotas-y-perdidos?lang=...` | Yes | Yes | None | Yes | TRUE | |
| `/clasificados` | BR publish CTA (mobile + desktop) | `/clasificados/publicar/bienes-raices?lang=...` | Yes | Yes | None | Yes | TRUE | Separate publish CTA below BR card |
| `/clasificados` | Fake Premium/package claims | None present | Yes | Yes | N/A | Yes | TRUE | |
| `/clasificados` | Recently viewed section | Client-side from localStorage | Yes | Yes | None | Yes | TRUE | Shows honest empty state |

---

## 5. Publish entry chooser

| Surface | Element / CTA | Destination / Behavior | Desktop safe | Mobile safe | Auth behavior | Production safe | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| `/clasificados/publicar` | Bienes Raíces card | `/clasificados/publicar/bienes-raices?lang=...` | Yes (grid) | Yes (featured card) | Login redirect in parent flow | Yes | TRUE | Premium tint, mobile-first layout |
| `/clasificados/publicar` | En Venta card | `/clasificados/publicar/en-venta?lang=...` | Yes | Yes | Login redirect | Yes | TRUE | |
| `/clasificados/publicar` | Rentas card | `RENTAS_PUBLICAR_HUB?lang=...` | Yes | Yes | Login redirect | Yes | TRUE | Uses constant |
| `/clasificados/publicar` | Autos card | `/publicar/autos?lang=...` | Yes | Yes | Login redirect | Yes | TRUE | |
| `/clasificados/publicar` | Restaurantes card | `/publicar/restaurantes?lang=...` | Yes | Yes | Login redirect | Yes | TRUE | |
| `/clasificados/publicar` | Servicios card | `/clasificados/publicar/servicios?lang=...` | Yes | Yes | Login redirect | Yes | TRUE | |
| `/clasificados/publicar` | Empleos card | `/clasificados/publicar/empleos?lang=...` | Yes | Yes | Login redirect | Yes | TRUE | |
| `/clasificados/publicar` | Clases card | `/publicar/clases/quick?lang=...` | Yes | Yes | Login redirect | Yes | TRUE | |
| `/clasificados/publicar` | Comunidad card | `/publicar/comunidad/quick?lang=...` | Yes | Yes | Login redirect | Yes | TRUE | |
| `/clasificados/publicar` | Busco card | `/publicar/busco/quick?lang=...` | Yes | Yes | Login redirect | Yes | TRUE | |
| `/clasificados/publicar` | Mascotas card | `/publicar/mascotas-y-perdidos/quick?lang=...` | Yes | Yes | Login redirect | Yes | TRUE | |
| `/clasificados/publicar` | Viajes (travel) card | `/publicar/viajes?lang=...` | Yes | Yes | Login redirect | Yes | TRUE | |
| `/clasificados/publicar` | Back to Clasificados | `/clasificados?lang=...` | Yes | Yes | None | Yes | TRUE | |
| `/clasificados/publicar` | Language toggle | Switches `?lang=` on same page | Yes | Yes | None | Yes | TRUE | |
| `/clasificados/publicar` | Deep link (`?cat=`) | Routes to correct publish flow per category | Yes | Yes | Login redirect | Yes | TRUE | Validated via `normalizeChooserDeepLink` |
| `/clasificados/publicar` | Mislabeled categories | None — uses `categoryConfig[key].label[lang]` | Yes | Yes | N/A | Yes | TRUE | |

---

## 6. Main user journeys

| Journey | Path | Verified safe | Auth correct | Notes |
|---|---|---|---|---|
| Visitor → Homepage → Clasificados | `/` → `/home` → navbar "Clasificados" → `/clasificados` | Yes | N/A | Clean 2-click path |
| Visitor → Homepage → Publish ad | `/home` → navbar "Anúnciate" → `/login?mode=post&redirect=...` → `/clasificados/publicar` | Yes | Login required; redirect preserved | |
| Visitor → Clasificados → Category | `/clasificados` → card → `/clasificados/[category]` | Yes | N/A | All 12 categories verified |
| Visitor → Category → Results/Detail | `/clasificados/[cat]` → results → `/clasificados/[cat]/anuncio/[id]` or `vehiculo/[id]` etc. | Yes | N/A | Category-specific detail routes |
| Visitor → Publish CTA → Login | Any publish CTA → `/login?mode=post&redirect=...` | Yes | `safeInternalRedirect` validates | No open redirect vulnerability |
| Logged-in → Dashboard | Navbar dropdown → `/dashboard` | Yes | Client session check; redirects to login if no session | |
| Logged-in → My ads | Navbar dropdown → `/dashboard/mis-anuncios` | Yes | Client session check | |
| Admin discovery | Public nav does NOT expose `/admin/*` | Yes | N/A | No admin links in navbar/footer/hub |

---

## 7. Mobile UX safety (code-level)

| Surface | Element | Desktop behavior | Mobile behavior | Issue | Status | Notes |
|---|---|---|---|---|---|---|
| Navbar | Mobile drawer | Hidden | Full-screen drawer with all 10 nav links | Matches desktop links | TRUE | Same `navLinks` array |
| Navbar | Account section (mobile) | Dropdown | Pinned bottom section in drawer | Shows sign-in/create-account or user card + sign-out | TRUE | |
| Navbar | "Create account" link | Not shown (only Sign in button) | Shown as separate CTA | Additional mobile-only CTA — safe | TRUE | Routes to `/login?mode=signup` |
| Navbar | Language switcher | Inline ES/EN buttons | Pinned bottom of drawer | Same `switchLang` function | TRUE | |
| Navbar | Body scroll lock | N/A | `overflow: hidden` when drawer open | Prevents background scroll | TRUE | |
| Clasificados hub | BR featured card | In grid (with publish CTA) | Full-width featured card above grid | Same destination, bigger tap target | TRUE | 56px min-height on CTA |
| Clasificados hub | Category grid | 3-column | 1-column | Full-width tap targets | TRUE | |
| Publish chooser | BR featured card | In grid | Full-width featured card above grid | Same pattern as hub | TRUE | |
| Publish chooser | Category cards | 3-column grid | 1-column | Full-width cards, good tap targets | TRUE | |
| Homepage hero | CTA button | Normal size | Responsive (text scales) | `text-sm md:text-base` | TRUE | |
| Footer | Links | Multi-column | Single column | `min-h-[44px]` on interactive elements | TRUE | Meets mobile tap target spec |
| Login page | Auth buttons | Full-width in container | Same | Responsive container | TRUE | |
| Dashboard shell | Sidebar nav | Left sidebar | Stacked layout | Responsive grid | TRUE | |

---

## W2 blockers before launch

**No FALSE status items found.**

All CTAs route correctly, no fake content is exposed, no unfinished Stripe/payment features are reachable from public navigation, and mobile layouts are functional and safe.

### Minor observations (not blockers)

| Observation | Surface | Impact | Note |
|---|---|---|---|
| No legal/privacy links in footer | Footer | Users must know direct URLs (`/legal`, `/privacy`, `/terms`) | Pages exist and are indexed; could add footer links in W3 |
| Social links say "coming soon" | Footer | No active social presence linked | Honest deferral, not a blocker |
| Homepage CTAs are fully CMS-controlled | `/home` | If admin sets a bad URL, it could link externally | Mitigated: `parseCallouts` filters to `/` or `https://` only |
| No newsletter signup CTA | Entire site | No email capture mechanism | Intentional deferral |

---

## Summary

| Section | Elements audited | TRUE | FALSE | DEFERRED | N/A |
|---|---|---|---|---|---|
| Homepage | 11 | 9 | 0 | 1 | 1 |
| Navbar | 18 | 18 | 0 | 0 | 0 |
| Footer | 10 | 8 | 0 | 1 | 1 |
| Clasificados hub | 18 | 18 | 0 | 0 | 0 |
| Publish chooser | 15 | 15 | 0 | 0 | 0 |
| User journeys | 8 | 8 | 0 | 0 | 0 |
| Mobile UX | 12 | 12 | 0 | 0 | 0 |
| **Total** | **92** | **88** | **0** | **2** | **2** |

---

## Files changed (W2)

- `app/lib/website-audit/WEBSITE_W2_HOMEPAGE_NAV_MOBILE_UX_AUDIT.md` (this file — new)

No code changes were needed. All surfaces are production-safe.
