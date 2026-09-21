# 04 — CATEGORY FULL-CYCLE CERTIFICATION (MASTER)
Ref: `origin/main` = `a0a47839`. **All 22 category/lanes certified.** Per-family detail lives in the
companion documents; this file is the cross-category master view.

| Family | Detail document |
|---|---|
| Servicios · Restaurantes · Comida Local | `04A_SERVICIOS_RESTAURANTES_COMIDA_FULL_CYCLE.md` |
| Bienes Raíces · Rentas (5 lanes) | `04B_BIENES_RENTAS_FULL_CYCLE.md` |
| Autos · Empleos (6 lanes) | `04C_AUTOS_EMPLEOS_FULL_CYCLE.md` |
| Comunidad · Clases · Busco · Mascotas · En Venta · Viajes | `04D_COMMUNITY_LANES_VIAJES_FULL_CYCLE.md` |
| Data round-trip / destructive-edit sweep (all lanes) | `06_DATA_ROUND_TRIP_FIELD_AUDIT.md` |

---

## 1. ROUTE + STORAGE MASTER MAP

| Lane | Primary table | Owner field | Public detail route | Edit → same row? |
|---|---|---|---|---|
| servicios | `servicios_public_listings` | `owner_user_id` | `/clasificados/servicios/[slug]` | ⚠ slug-matched via `sessionStorage` |
| restaurantes | `restaurantes_public_listings` | `owner_user_id` | `/clasificados/restaurantes/[slug]` | ✅ |
| comida-local | `comida_local_public_listings` | `owner_user_id` | `/clasificados/comida-local/[slug]` | ✅ |
| bienes-raices ×3 | `listings` | `owner_id` | `/clasificados/anuncio/[id]` (:1431) | ✅ |
| rentas ×2 | `listings` | `owner_id` | `/clasificados/rentas/listing/[id]` | ✅ |
| autos ×3 | `autos_classifieds_listings` | `owner_user_id` | `/clasificados/autos/vehiculo/[id]` | ✅ parent · ⚠ child inherits · ❌ privado none |
| empleos ×3 | `empleos_public_listings` | `owner_user_id` | `/clasificados/empleos/[slug]` | ❌ **inserts a new row** |
| ofertas-locales ×2 | `ofertas_locales` | `owner_id` | `/clasificados/ofertas-locales/[id]` | ✅ |
| comunidad · clases · busco · mascotas · en-venta | `listings` | `owner_id` | `/clasificados/anuncio/[id]` (early returns :1359–:1479) | ✅ |
| viajes | `viajes_staged_listings` | `owner_user_id` | `/clasificados/viajes/negocio/[slug]` | ✅ (route 404s in prod) |

**`autos` UUID is the permalink; `empleos` uses a slug; `leonix_ad_id` prefixes are `AUTO` / `JOB`
(and `COMM` vs `COM` drift exists — GAP-073).**

---

## 2. ADOPTION SCORES

| Category | TRUE | PARTIAL | FALSE | N-A | Scored |
|---|---|---|---|---|---|
| Restaurantes | **32** | 4 | 6 | 1 | 43 |
| Servicios | 29 | 5 | 8 | 1 | 43 |
| En Venta / Varios | **26** | — | 5 | 5 | 36 |
| Comunidad | 22 | — | 8 | 6 | 36 |
| Clases | 21 | — | 9 | 6 | 36 |
| Busco | 20 | — | 10 | 6 | 36 |
| Comida Local | 19 | 4 | **19** | 1 | 43 |
| Mascotas / Perdidos | 19 | — | 11 | 6 | 36 |
| Viajes | 16 | — | **19** | 1 | 36 |
| Bienes Raíces (5 lanes incl. Rentas) | see `04B` — G41 13 TRUE / 4 PARTIAL / 1 FALSE | | | | |
| Autos (3 lanes) | see `04C` — **G40 18/18 TRUE** | | | | |

**Restaurantes is the strongest category; Comida Local and Viajes are the weakest.**

---

## 3. THE FULL-CYCLE CONTRACT, SCORED PLATFORM-WIDE

| Hop | Status | Note |
|---|---|---|
| Landing → Results | ✅ mostly | comida-local has **no results route** (landing is results) |
| Checkpoint / Ver Más | ⚠️ | **Servicios and Restaurantes skip it** (GAP-049); empleos checkpoint is dead code |
| Application → Draft | ⚠️ | Forked: IndexedDB / localStorage / sessionStorage. No shared engine |
| Hard refresh | ⚠️ | BR privado loses draft media (BR branch fix unmerged) |
| Unsaved guard | ❌ | Shared guard has **3 consumers**; all 5 BR/Rentas lanes lack it; no `beforeunload` under `publicar/` |
| Preview → Edit | ✅ | Shared contract `b60801e2` is in main |
| Checkout → Stripe → Webhook | ✅ | **Signature + two-layer idempotency verified correct** |
| Promo | ⚠️ | 4 promo-eligible categories unscopeable from Admin; Ofertas field permanently dead |
| Published row | ⚠️ | **Empleos inserts a new row** |
| Results / Search | ⚠️ | **No payment gate anywhere; no expiration gate except rentas** |
| Public detail | ✅ mostly | Ofertas flyer severely degraded vs preview |
| Media | ❌ | `droppedUnpersistable` ignored by 11/11; **Empleos discards 100% of photos** |
| CTA / Connection Hub | ⚠️ | 3 importers; unreachable for all 5 community lanes |
| Translate | ⚠️ | Detail-only, never on results; no analytics event exists |
| Trust | ✅ | **Public mount 5/5 — the healthiest system** |
| Google / Yelp | ❌ | 5 of 15; no registry, no DB column; owner panel never renders |
| Address / Privacy | ❌ | **Engine route-unreachable; 4 exact-address leaks** |
| Save / Like / Share / Report | ⚠️ | Self-engagement is UI-only; Save missing on 2; Report missing on BR + mascotas |
| Analytics | ⚠️ | Server pipeline sound; legacy client writer trusts `owner_user_id`; **BR records no views** |
| Business Hub | ❌ | Shared engine **never finished**; every category forked |
| Dashboard | ⚠️ | Dedicated-table categories SHARED; generic-`listings` categories SILO at list level |
| Active Edit → Republish | ❌ | **8 lanes destructive; Sept fixes 2** |
| Same row / No recharge | ⚠️ | 11 of 12 correct; **Empleos forks and double-charges** |
| Admin | ⚠️ | 28 TRUE / 10 FALSE; 14/14 queues; 31 routes on the coarse cookie |
| Saved Search | ⚠️ | 3 of 14 categories; **no retry trigger** |
| SEO | ❌ | Hub JSON-LD 1/14; **hreflang 0/14** |
| Mobile / PWA | ⚠️ | Installable **staff-only**; two conflicting manifests |
| Security / RLS | ❌ | 134 tables RLS-on/zero-policy; servicios anon SELECT ungated; `public.listings` has no schema |

---

## 4. CERTIFICATION VERDICT
**No category is fully TRUE across the whole contract.** Three (Restaurantes, En Venta, Busco) are
safe to exercise end-to-end today. The dominant failure mode is **uneven adoption of engines that
already exist**, not missing construction — see `03_GLOBAL_ENGINE_SOURCE_MAP_G01_G53.md §Summary`.
Per-lane QA verdicts: `18_OWNER_QA_READY_MATRIX.md`.
