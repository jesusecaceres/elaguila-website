# W10 — Legal, Policy, Safety, Payment Disclosure, and Trust Audit

**Audit date:** 2026-05-27  
**References:** W1–W9 audits, C6 Stripe readiness, `docs/pricing-promo-code-sales-model.md`, `docs/package-entitlement-model.md`  
**Scope:** Legal/policy routes, contact disclosures, payment/package truth, marketplace rules, auth/privacy alignment, analytics honesty, tienda/magazine trust, production safety scan. Not legal advice; not Stripe implementation.

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Code/content proves behavior is real and safe |
| FALSE | Broken policy, fake payment claims, wrong pricing, or misleading guarantees |
| DEFERRED_INTENTIONAL | Safely hidden, contact-based, or documented pending |
| NOT_APPLICABLE | Out of scope |

---

## 1. Main audit table

| Area | Route/file | Required trust behavior | Current implementation | User/business impact | Payment/legal impact | Status | Notes |
|---|---|---|---|---|---|---|---|
| Legal hub | `/legal` | Production-safe index to policies | **W10:** `legal/layout.tsx` metadata + links to privacy/terms/data-deletion/reglas/contact | Users find policies | Reduces “empty legal” risk | TRUE | W10 fix |
| Privacy | `/privacy` | Real policy, no placeholders | `PolicyPageShell` + May 2026 copy; lists account/listing/usage data | Trust + compliance baseline | Mentions payments “when applicable” | TRUE | W10 aligned account fields with W3 |
| Terms | `/terms` | Real ToS, honest paid features | Listing/content rules; **W10:** paid section notes checkout may not be live | Advertisers know platform role | No fake refund portal | TRUE | W10 |
| Data deletion | `/data-deletion` | Reachable instructions | Email workflow to `chuy@leonixmedia.com` | Users can request deletion | GDPR-style process documented | TRUE | |
| Footer legal links | `Footer.tsx` | Link to policies | **W10:** Legal / Privacy / Terms / Data deletion | Discoverability | Reduces support confusion | TRUE | W10 fix |
| Contact | `/contacto`, `leonixGlobalContact.ts` | Correct phone/email | `info@leonixmedia.com`, `(408) 360-6500`, forms route to API | Support works | N/A | TRUE | W2 verified |
| Policy contact email | privacy/terms/data-deletion | Consistent contact | `chuy@leonixmedia.com` on policy pages; `info@` on general contact | Two inboxes (ops vs privacy) | Document dual use | DEFERRED_INTENTIONAL | Not merged in W10 — intentional split possible |
| Clasificados reglas | `/clasificados/reglas` | Family-safe marketplace rules | `leonixMarketplaceRulesCopy` — no payment promises | Publish gate context | Aligns with en-venta moderation copy | TRUE | Linked from legal hub W10 |
| Auth privacy | `/login`, W3 | No Apple if deferred | Google + Facebook + email/password + magic link only | No false OAuth claim | N/A | TRUE | |
| Billing portal | `/dashboard/perfil` | No fake Stripe portal | CTA disabled unless `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL` set; honest unavailable copy | Users not sent to broken billing | No fake portal | TRUE | |
| Autos publish Stripe | `autosPublishFlowCopy.ts` | Honest when paused | Production errors say Stripe paused; test bypass env-only | Devs can test; prod not misled | No silent free premium | TRUE | |
| BR inventory upgrade | `leonixBrPropertyInventoryPolicy.ts` | $99.99 add-on, contact CTA | Constants 99.99; mailto **W10 → info@leonixmedia.com**; payment note on drawer | Correct upgrade price | No in-app charge | TRUE | W10 email fix |
| Autos inventory boost | `autosDealerInventoryCopy.ts` | $129.99 add-on | `INVENTORY_BOOST_MONTHLY_USD = 129.99`; mailto **W10 → info@leonixmedia.com**; payment note | Correct boost price | No in-app charge | TRUE | W10 email fix |
| Old $89.99 BR add-on | codebase | Must not appear in active UI | Only in historical audit markdown; active code uses **99.99** | No wrong price | Trust | TRUE | BR13D |
| NN print tier public prices | marketing surfaces | Match business rules when shown | Full tier grid in `docs/` + admin; **not** on most public category pages | Sales via media kit / contact | Admin grants entitlements | DEFERRED_INTENTIONAL | Public site uses contact/media kit, not full price grid |
| Entitlement badges | public/dashboard | No fake Destacado | W6/W7 entitlement-backed only | Honest placement | C6 aligned | TRUE | |
| Analytics dashboard | `/dashboard/*` | Honest counts | Copy: real events or zero; degraded banner if table missing | No inflated metrics | N/A | TRUE | |
| Tienda | `/tienda` | No fake checkout | `TiendaServiceSplit`: “Sin checkout aún”; order via contact/email MVP | Clear fulfillment path | No Stripe checkout claim | TRUE | |
| Magazine | `/magazine` | No false purchase | Editorial/read routes; no checkout (W1) | N/A | N/A | TRUE | |
| Share safety | `ctaDataHelpers.ts` | No admin/preview URLs | Blocks `/dashboard`, `/preview`, `/publicar`, `/admin` | Safe sharing | N/A | TRUE | W9 |
| Legacy servicios | `/servicios/perfil/[slug]` | Not production | W9 redirect/404 | N/A | N/A | TRUE | W9 |

---

## 2. Payment / package disclosure matrix

| Package/item | Expected price/status | Publicly exposed? | Disclosure accurate | Stripe-safe | Status | Notes |
|---|---:|---|---|---|---|---|
| Premium / Destacado | $1,999/mo | Admin + docs; not full grid on browse | Entitlement-backed Destacado only when active | No public Stripe checkout | DEFERRED_INTENTIONAL | Sales/contact model |
| Full Page | $1,199/mo | Docs/admin | Tier in `packageEntitlements` / admin tracker | No public checkout | DEFERRED_INTENTIONAL | |
| Half Page | $799/mo | Docs/admin | Same | No public checkout | DEFERRED_INTENTIONAL | |
| Quarter Page | $499/mo | Docs/admin | `classified_listing: false` default (C5B) | No public checkout | TRUE | |
| Nuestros Negocios Only | $399/mo (`classified_print`) | BR/Autos base copy uses $399 base | BR negocio + Autos negocio base lines | Contact/mailto upgrade | TRUE | |
| BR add-on +5 properties | $99.99/mo → 8 total | Dashboard/drawer copy | `BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE` | Mailto + payment note | TRUE | Not $89.99 |
| Autos add-on +10 vehicles | $129.99/mo → 20 total | Dealer dashboard/drawer | `INVENTORY_BOOST_MONTHLY_USD` | Mailto + payment note | TRUE | C5A aligned |
| Autos privado/negocio publish | Stripe lane | Publish confirm UI | Stripe paused message in prod; env bypass documented | No live prod Stripe without keys | TRUE | |
| Package entitlements (admin) | Manual grant | Admin workspace | `payment_status: null` on create (C6) | No fake paid flag | TRUE | |
| Tienda orders | Quote/contact | Tienda pages | Email MVP; no cart checkout | Honest | TRUE | |

---

## 3. Policy / safety scan matrix

| Scan item | Found? | Location | Production risk | Status | Notes |
|---|---:|---|---|---|---|
| `TODO` in user-visible UI | No | `CtaActionSheet.tsx` comment only (dev) | Low | TRUE | |
| `lorem ipsum` | No | — | — | TRUE | |
| `$89.99` in active app code | No | Only old audit `.md` files | — | TRUE | |
| `undefined` / `null` in policy pages | No | privacy/terms/data-deletion | — | TRUE | |
| Fake Stripe “Pay now” on public hubs | No | Tienda/BR/Autos use contact or paused copy | — | TRUE | |
| Fake refund guarantee | No | Terms defer to checkout/product terms | — | TRUE | |
| Wrong upgrade mailto domain | **Yes (fixed)** | `leonixBrPropertyInventoryCopy.ts`, `autosDealerInventoryCopy.ts` had `soporte@elaguila.com` | Medium | TRUE | W10 → `info@leonixmedia.com` |
| Footer missing legal links | **Yes (fixed)** | `Footer.tsx` | Medium | TRUE | W10 |
| `/legal` stub only | **Yes (fixed)** | `legal/page.tsx` | Medium | TRUE | W10 links + metadata |
| Admin URLs in public policy | No | — | — | TRUE | |
| Apple Login advertised | No | `/login` | — | TRUE | W3 |
| Billing portal without env | No | Disabled button + copy | — | TRUE | |

---

## 4. Auth / privacy / analytics (summary)

| Topic | Status | Notes |
|---|---|---|
| Data collected vs privacy copy | TRUE | W10: phone, city, Google/Facebook called out |
| Data deletion reachable | TRUE | `/data-deletion` + footer link |
| Saved ads / analytics events | DEFERRED_INTENTIONAL | Privacy could mention engagement analytics explicitly in W11 |
| Dashboard analytics honesty | TRUE | Real `listing_analytics` or zero + degraded message |
| Servicios separate analytics store | DEFERRED_INTENTIONAL | W7 — not merged into unified privacy section yet |

---

## 5. Store / magazine / promotional products

| Surface | Status | Notes |
|---|---|---|
| `/tienda` | TRUE | Contact-first; checkout placeholder honest |
| `/productos-promocion` | TRUE | Uses `info@leonixmedia.com` |
| `/magazine` | TRUE | Read/content; no payment claim (W1) |
| Media kit | TRUE | Request flow; no self-serve checkout |

---

## W10 blockers before launch

### Resolved in W10

| area | file path | issue | fix |
|---|---|---|---|
| Upgrade contact | `leonixBrPropertyInventoryCopy.ts`, `autosDealerInventoryCopy.ts` | Mailto to wrong domain `soporte@elaguila.com` | `LEONIX_GLOBAL_MAILTO` (`info@leonixmedia.com`) |
| Legal discoverability | `Footer.tsx`, `legal/page.tsx` | No policy links / thin legal hub | Footer nav + legal index links |
| Legal SEO metadata | `legal/layout.tsx` | Missing metadata (W9 carryover) | Added layout metadata |
| Terms payment honesty | `terms/page.tsx` | Implied checkout always available | Clarified contact when checkout not live |
| Privacy accuracy | `privacy/page.tsx` | Profile photo claim vs no avatar UI | Aligned with actual profile fields |

### Open for W11

| area | file path | issue | user impact | business/payment impact | production/legal risk | recommended fix | fixed in W10? |
|---|---|---|---|---|---|---|---|
| Dual contact emails | policies vs `leonixGlobalContact` | `chuy@` vs `info@` | Confusion which inbox to use | Low | Low | Unify or document roles on contact page | No |
| Public NN price grid | marketing | Full $1,999–$399 grid not on site | Sales must use media kit | Medium for sales | Low | Optional pricing page when legal approves | No |
| Privacy analytics section | `privacy/page.tsx` | No explicit listing analytics/saved ads | Minor transparency gap | Low | Low | Add short bullet in W11 | No |
| Autos publish UI copy | `autosPublishPlaceholderCopy.ts` | Still mentions Stripe checkout steps | Dev/staging may confuse | Medium if misread as live | Medium | Gate copy by env in W11 | No |

---

## 6. W10 verification checklist

| # | Item | Result |
|---|---|---|
| 1 | Legal/policy routes audited | `/legal`, `/privacy`, `/terms`, `/data-deletion`, `/clasificados/reglas` |
| 2 | Contact/support disclosures verified | `info@leonixmedia.com`, `(408) 360-6500`, `/contacto` |
| 3 | Payment/package disclosures verified | BR $99.99, Autos $129.99, $399 bases; no $89.99 in code |
| 4 | Clasificados rules verified | `reglas` + en-venta policy copy |
| 5 | Auth/privacy/account safety verified | W3 + W10 privacy/terms tweaks |
| 6 | Analytics disclosure verified | Dashboard honest; no fake guarantees |
| 7 | Store/magazine verified | Tienda contact-first; magazine no checkout |
| 8 | Production safety scan | See §3; wrong mailto fixed |
| 9 | Blockers | 5 fixed in W10; 4 documented for W11 |
| 10 | Files changed | See §7 |
| 11 | `npm run build` | PASS (`exit_code: 0`, 2026-05-27, ~112s) |

---

## 7. Files changed (W10)

| File | Change |
|---|---|
| `app/lib/website-audit/WEBSITE_W10_LEGAL_POLICY_PAYMENT_DISCLOSURE_AUDIT.md` | This audit |
| `app/(site)/legal/layout.tsx` | Metadata |
| `app/(site)/legal/page.tsx` | Policy index links |
| `app/components/Footer.tsx` | Legal footer links |
| `app/(site)/clasificados/lib/leonixBrPropertyInventoryCopy.ts` | Upgrade mailto → Leonix email |
| `app/lib/clasificados/autos/autosDealerInventoryCopy.ts` | Boost mailto → Leonix email |
| `app/(site)/privacy/page.tsx` | Profile fields accuracy |
| `app/(site)/terms/page.tsx` | Honest checkout deferral language |

---

## Build gate

```
npm run build
```

**Result:** PASS (`exit_code: 0`, 2026-05-27 local run, ~112s).
