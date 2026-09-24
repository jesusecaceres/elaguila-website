# LEONIX QUICK — SIMPLE VS FULL FINAL PROOF MATRIX

**Gate 13.** One row per feature, recording what each commercial shape gets, where that truth
lives, where it is enforced on the server, where it is enforced in the UI, where the customer
actually lands, which verifier holds it, and its status.

```
REPAIR_REQUIRED = 0
BLOCKED         = 0
```

No advertised Simple or Full capability is BLOCKED. Three items that were at risk of being
advertised-but-blocked were repaired during this gate rather than recorded as BLOCKED; they are
listed in §4.

## Legend

| Token | Meaning |
|---|---|
| **Y** / **N** | included / not included at that level |
| **CAT** | the canonical category product decides, identically at both access levels |
| **SEP** | a separate entitlement dimension; this column does not confer it |
| **PROVEN** | the behaviour exists, is enforced, and a verifier asserts it |
| **PROVEN_NA** | the claim is proven correct *and* there is nothing further to enforce, because no customer-facing product exists for it today. The capability is reserved and already denied at SIMPLE, so the day a surface ships it is gated by default |

Verifier keys: **V1** `verify-quick-business-access-level-01.ts` · **V2**
`verify-quick-print-bundle-access-02.ts` · **V3** `verify-quick-simple-dashboard-03.ts` ·
**V4** `verify-quick-full-gates-04.ts` · **V5** `verify-quick-upgrade-contract-05.ts` ·
**VC** `verify-quick-business-core-01.ts`

---

## 1. Proof matrix

| FEATURE | SIMPLE | FULL | PRINT QUARTER | PRINT HALF | PRINT FULL | PRINT PREMIUM | SOURCE | SERVER ENFORCEMENT | UI ENFORCEMENT | CUSTOMER DESTINATION | VERIFIER | STATUS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PUBLIC LISTING | Y | Y | Y | Y | Y | Y | `public_listing` capability | canonical category publisher (unchanged) | canonical public detail page | category public detail page | V1, VC | PROVEN |
| CONTACT CTA CALL | Y | Y | Y | Y | Y | Y | `contact_ctas` | canonical publisher persists the phone | canonical CTA action sheet | public detail page | V1 | PROVEN |
| CONTACT CTA SMS | Y | Y | Y | Y | Y | Y | `contact_ctas` | canonical publisher | CTA sheet, where the category supports it | public detail page | V1 | PROVEN |
| CONTACT CTA WHATSAPP | Y | Y | Y | Y | Y | Y | `contact_ctas` | canonical publisher + number validation | CTA sheet, where the category supports it | public detail page | V1 | PROVEN |
| CONTACT CTA EMAIL | Y | Y | Y | Y | Y | Y | `contact_ctas` | canonical publisher | CTA sheet, where the category supports it | public detail page | V1 | PROVEN |
| WEBSITE | Y | Y | Y | Y | Y | Y | `contact_ctas` | canonical publisher | canonical public detail page | public detail page | V1 | PROVEN |
| DIRECTIONS | Y | Y | Y | Y | Y | Y | `contact_ctas` | canonical publisher + address-privacy rule | canonical public detail page | public detail page | V1 | PROVEN |
| IMAGE ALLOWANCE | capped | CAT | capped | CAT | CAT | CAT | `QUICK_BUSINESS_DEFINITIONS[].media` | Quick media API + canonical publisher | Quick intake uploader cap | Quick intake | VC | PROVEN |
| VIDEO | CAT | CAT | CAT | CAT | CAT | CAT | canonical category media contract | canonical publisher | category application | category application | VC | PROVEN_NA — no access-level dimension; identical at both levels |
| EDIT | Y | Y | Y | Y | Y | Y | `simple_management` | existing category owner surface | doorway links `manage.dashboardHref` | `/dashboard/{category}` | V3 | PROVEN |
| PAUSE | CAT | CAT | CAT | CAT | CAT | CAT | canonical lifecycle | existing owner surface | doorway `manage.endNote` | `/dashboard/{category}` | V3 | PROVEN |
| REACTIVATE | CAT | CAT | CAT | CAT | CAT | CAT | canonical lifecycle | existing owner surface | doorway `manage.endNote` | `/dashboard/{category}` | V3 | PROVEN |
| END/CANCEL | CAT | CAT | CAT | CAT | CAT | CAT | canonical lifecycle + `subscriptionLifecycle.ts` | existing owner surface | doorway `manage.endNote` | `/dashboard/{category}` | V3 | PROVEN |
| RENEW | CAT | CAT | CAT | CAT | CAT | CAT | canonical lifecycle | Revenue OS / Stripe subscription renewal | doorway `manage.billingNote` | `/dashboard/{category}` | V3 | PROVEN_NA — monthly subscriptions renew themselves; no customer action to gate |
| HELP | Y | Y | Y | Y | Y | Y | `simple_management` | n/a (public page) | doorway help card | `/contact` | V3 | PROVEN |
| UPGRADE | Y | n/a | Y | n/a | n/a | n/a | `upgrade_to_full` + `upgradeTargetPackageKey()` | `validateRevenueCheckoutRequest` on the Full key; `revenueActiveEntitlementGuard` prevents a double charge | doorway upgrade card, stating the destination | `/dashboard/{category}` → existing application → preview → Full checkout, same listing id | V5, V3 | PROVEN |
| BUSINESS HUB | **N** | Y | **N** | Y | Y | Y | `business_hub` (FULL-only) | `resolveFullOnlyFeatureGate` | n/a | none today | V4 | PROVEN_NA — no customer-facing Hub product exists; reserved and denied at SIMPLE |
| ANALYTICS | **N** | Y | **N** | Y | Y | Y | `analytics` (FULL-only) | `api/dashboard/analytics/listing/route.ts` → **403 `upgrade_required`** | doorway omits the module | listing analytics in the dashboard | V4 | PROVEN |
| LEADS | **N** | Y | **N** | Y | Y | Y | `leads` (FULL-only) | `resolveFullOnlyFeatureGate` | n/a | none today | V4 | PROVEN_NA — no leads product implemented |
| BUSINESS TOOLS | **N** | **N** | **N** | **N** | **N** | **N** | Business Identity pilot flag `business_identity_flags` | `app/lib/business/access.ts` (membership, never package entitlement) | unchanged | `/dashboard/business-tools` (pilot) | V3 | PROVEN_NA — orthogonal flagged product, sold in no package, and now explicitly absent from the Full pitch (§4) |
| BUSINESS CONCIERGE | **N** | **N** | preview only | Y | Y | Y | Three separate notions, listed in §6.2 | `resolveDiyAccess` → pilot flag + exact business membership + `resolveConciergeEntitlement`, which reads `listing_package_entitlements.package_tier` | flag-gated pilot UI | `/dashboard/business-tools/concierge` (pilot) | V4, V2 | PROVEN — the shipped gate reads the print tier only, so it grants nothing to a digital-only package at either access level, and its quarter vs half+ split independently matches the owner print lock (§6.2) |
| COUPONS/OFFERS | **N** | CAT | SEP | SEP | SEP | SEP | `RevenuePackageDefinition.capabilities` (`coupons_offers`) | `resolveBusinessToolsAccess` (`categoryCommercialPlan.ts`) | dashboard category page | `/dashboard/servicios`, `/dashboard/restaurantes` | V1 | PROVEN — included in the Servicios/Restaurantes Full packages only; every Quick package declares `capabilities: []` |
| INVENTORY | 1 item | package allowance | SEP | SEP | SEP | SEP | `includedInventory` / `addOnInventory` on the package | capacity activation RPC | dashboard inventory section | `/dashboard/mis-anuncios` | V1 | PROVEN — Quick dealer 1 vehicle vs Full 10; Quick agent 1 property vs Full package + pack; Quick has no `addOnInventory` |
| ADVANCED MEDIA | **N** | CAT | **N** | CAT | CAT | CAT | `advanced_media` (FULL-only) | `resolveFullOnlyFeatureGate` | n/a | none today | V4 | PROVEN_NA — no capability-gated advanced-media surface exists |
| REPUBLISH | SEP* | SEP* | Y | Y | Y | **N** | `getPackageEntitlementBenefits().republish_access` | print/visibility model (untouched) | dashboard | `/dashboard/mis-anuncios` | V2 | PROVEN |
| BOOST | SEP* | SEP* | **N** | Y | Y | **N** | `.boost_access` | print/visibility model (untouched) | dashboard | `/dashboard/mis-anuncios` | V2 | PROVEN |
| AUTO REFRESH | SEP* | SEP* | **N** | **N** | **N** | **N** | `.auto_refresh_access` | print/visibility model (untouched) | dashboard | `/dashboard/mis-anuncios` | V2 | PROVEN |
| PRINT BADGE | **N** | **N** | Y | Y | Y | Y | `.print_advertiser_badge` | print/visibility model (untouched) | public card / detail | public detail page | V2 | PROVEN — a digital package never confers a print badge |
| PRINT PRIORITY | **N** | **N** | **N** | **N** | Y | **N** | `eligibleForResultsPriority` | results ranking (untouched) | category results | category results page | V2 | PROVEN — full page only |
| DESTACADOS | **N** | **N** | **N** | **N** | **N** | Y | `eligibleForDestacadosModule` | destacados module (untouched) | destacados module | destacados surfaces | V2 | PROVEN — premium only |

**\* SEP, and equal at both access levels.** Every Revenue OS digital grant — Quick and Full
alike — is written with `package_tier: "digital_only"`
(`revenueEntitlementFulfillment.ts`), and the `digital_only` tier independently carries
`republish_access`, `boost_access` and `auto_refresh_access`. So a Simple customer and a Full
customer receive exactly the same benefit here. The access level neither adds nor removes it,
which is precisely what "orthogonal dimension" means. Nothing in this mission changed it.

---

## 2. The one intended behaviour change for an existing customer

A business advertiser holding **only** a quarter-page print package now resolves to SIMPLE and is
therefore denied the FULL-only capabilities. Today that is exactly one live consequence: the
per-listing analytics route returns `403 upgrade_required`.

This follows directly from the owner lock `QUARTER_PAGE = SIMPLE`. It is intended. A quarter-page
advertiser who also holds a Full digital package is unaffected, because the resolver always takes
the highest live grant.

## 3. Combination truth table

| Holding | Resolves to | Why |
|---|---|---|
| Quick digital only | SIMPLE | `servicios_quick_monthly` etc. declare `businessAccessLevel: "simple"` |
| Full digital only | FULL | the $399 base packages declare `"full"` |
| Quarter page only | SIMPLE | print bridge |
| Half / full / premium page only | FULL | print bridge |
| Quarter page **with a stamped Full `package_key`** | **SIMPLE** | per-row rule: the tier wins on a print row (§4) |
| Quarter page + Quick digital | SIMPLE | highest of simple, simple |
| Quarter page + Full digital | **FULL** | highest of simple, full |
| Half page + Quick digital | **FULL** | highest of full, simple |
| Expired row, or suspended subscription | NONE | `isRowCurrentlyLive` / `subscriptionOverride` |

## 4. Repairs made during this gate (why REPAIR_REQUIRED is 0 rather than 3)

Three items would have been recorded as REPAIR_REQUIRED. Each was fixed instead.

**A quarter-page row could resolve to FULL.** Package C Build 3 stamps the category base (Full)
package key onto print-tier admin grants in Restaurantes and Servicios so the pre-existing
capability resolver can find the catalog entry by exact key. Business access originally took the
maximum of the tier and the key on a single row, which handed every quarter-page advertiser in
those two categories FULL access off a bookkeeping field — silently breaking the owner lock.
Fixed in `businessAccessGrantForRow`: one row is one purchase, so it yields one grant, and the
print tier is authoritative on a print row. Locked by V2 → "a stamped Full package_key never
upgrades a quarter-page row to FULL" and its mirror "a stamped package_key still cannot downgrade
a half-page row".

**Full advertised "business tools", which no package grants.** `/dashboard/business-tools` is the
flagged Business Identity pilot with its own membership model that explicitly excludes package
entitlements. Selling it in the Full pitch would have made an advertised Full capability BLOCKED.
Removed from `FULL_ADDS` and from `FULL_BODY`; the two remaining category-dependent lines
(coupons/offers, inventory room) now carry an explicit category qualifier so neither reads as
universal. Locked by V3 → "Full is never advertised as granting a product no package actually
grants".

**Staff could not tell a Quick row from a Full row.** Both are written with
`package_tier: "digital_only"`, so the admin entitlement tracker showed them identically. Added
the derived access badge, the Revenue OS SKU the writer already stores, and the customer name the
business-name headline was hiding. The badge names the print tier, so the six commercial shapes
read distinctly (`QUICK / SIMPLE`, `FULL`, `PRINT QUARTER + SIMPLE`, `PRINT HALF + FULL`,
`PRINT FULL PAGE + FULL`, `PRINT PREMIUM + FULL`) — see §7.4. Locked by V1 → "the entitlement
tracker shows staff every commercial fact about a row".

## 5. Deferred, with the owner decision named

| Item | State | What is missing |
|---|---|---|
| Comida Local tier split | Deferred; $129/mo product untouched and mechanically locked | The Simple price, what happens to existing $129 customers, and what a Comida Local Full would contain. Full audit: `LEONIX_COMIDA_LOCAL_COMMERCIAL_CLASSIFICATION.md` |
| Business Hub / Leads / advanced media surfaces | Capability reserved, denied at SIMPLE, no product to gate | These are product decisions, not access decisions. When a surface ships it calls `resolveFullOnlyFeatureGate` and is correct by default |
| Whether a digital package should ever reach the DIY Concierge | Unchanged; the pilot keeps its own print-tier gate | Today the Concierge is bought with print, not with a digital package (§6.2). Whether $399 Full should include it is a commercial decision, and this mission does not hold it |
| Account-level analytics summary | Deliberately ungated | `api/dashboard/analytics/summary/route.ts` serves every seller including free classified users. Gating it would remove access from customers who never bought a business package — out of scope and not an owner decision this mission holds |

## 6. Adjacent surfaces audited at closeout

### 6.1 The public autos counter is not the analytics product

`api/clasificados/autos/listing/[id]/analytics-summary/route.ts` returns five aggregate numbers
(views, unique views, saves, shares, contacts) for any listing id with no authentication at all. It
is not an owner surface and not a leak in the SIMPLE gate: it feeds `AutosAnuncioAnalyticsStrip` on
the **public** detail page `/clasificados/anuncio/[id]`, where every anonymous visitor already sees
the same counts, and it returns only rolled-up totals, never a row or a `user_id`.

Gating it by access level would hide a public social-proof element from visitors based on what the
advertiser pays, and would protect nothing, because the numbers are public by construction. It is
therefore deliberately untouched. The sold analytics product is the owner-scoped per-listing route,
which is gated. Anyone tempted to "fix" this route should read the P0 note in its header first.

There is no Servicios analytics route; the canonical owner path is the `api/dashboard/analytics/*`
pair alone.

### 6.2 The DIY Concierge already implements this mission's print bridge

"Concierge" names three unrelated things in this repository, which is why the earlier draft of this
matrix recorded the row as unimplemented. They are:

1. `concierge_eligible` — a print-package **benefit flag**, premium tier only, in the untouched
   print/visibility model (`getPackageEntitlementBenefits`).
2. `business_concierge` — the FULL-only **capability** reserved by this mission in
   `businessAccessLevel.ts`. Nothing calls it yet, and no copy sells it.
3. The **DIY Concierge**, a real customer-facing pilot at `/dashboard/business-tools/concierge`,
   part of the same flagged Business Identity product as `/dashboard/business-tools`.

The third is shipped and server-gated, so the row is PROVEN rather than PROVEN_NA. `resolveDiyAccess`
requires the pilot flag and an exact active business membership, then `resolveConciergeEntitlement`
resolves a tier by joining verified `business_listing_links` against active
`listing_package_entitlements` rows.

That gate accepts print tiers only. `quarter_page` yields `quarter_preview` with
`personalizedAccess: false`; `half_page`, `full_page` and `premium` yield
`personalized_access_active`. A `digital_only` row — every Quick and every Full digital grant alike
— is not a known tier, so it resolves to `pending_entitlement_linkage` and grants nothing. Hence
**N** for both SIMPLE and FULL in the row above: today the Concierge is bought with print, not with
a digital package.

The useful finding is that this pre-existing module, written independently and before this mission,
splits the print ladder at exactly the same place the owner lock does: quarter page is the lesser
tier, half page and above is the full one. The print bridge in `businessAccessLevelForPrintTier` is
therefore not a new policy invented here — it restates policy the repository already enforced. V2
now asserts the two resolvers agree, so a future edit that moves the split in one of them fails
rather than silently producing two contradictory definitions of what a quarter page buys. V2 also
pins the two outcomes the pilot ships, so the agreement stays meaningful only while the Concierge
still acts on that split.

### 6.3 The two remaining ways Simple could have become Full

Both were audited at closeout, found already correct, and are now locked by assertion rather than
left to convention.

**Checkout add-ons.** `CHECKOUT_ADDON_ALLOWLIST` in `revenueCheckout.ts` is keyed to each
category's FULL base package key, so a Quick base key matches no entry and every add-on is refused
with `add_ons_not_supported`. This is what keeps a $99 dealer from buying the Full inventory pack.
Nothing stated that intent before, so adding a Quick key to the allowlist would have looked like an
ordinary product change. V1 now sells every add-on package in the matrix against every Quick base
key and requires all four to be refused.

**Capability activation.** `api/dashboard/enable-included-capability/route.ts` is the only
customer-reachable mutation that switches a Full capability on. Ownership is not sufficient
authority here — a Simple owner does own their listing — so the route re-resolves real commercial
capability with `resolveBusinessToolsAccess()` before writing. Quick packages declare no
capabilities, so a Simple owner is refused. V4 now asserts the capability check exists and precedes
the write.

---

## 7. Product-operational closeout

§1–§6 prove what each level *is*. This section proves the product *operates*: that a Quick
customer can buy, publish, upgrade, be found by staff, and that nothing else moved.

### 7.1 Publish pipeline

Each of the four categories runs the one canonical circuit. Quick changes which package is
charged, and nothing else.

```
QUICK INTAKE → canonical draft → canonical preview → QUICK $99 PACKAGE
             → /api/revenue-os/checkout → Stripe webhook → canonical publisher
             → canonical listing row → canonical public detail page
```

| Category | Quick package charged | Full package preserved | Status |
|---|---|---|---|
| Servicios | `servicios_quick_monthly` | `servicios_base_monthly` $399 | PROVEN |
| Restaurantes | `restaurantes_quick_monthly` | `restaurantes_base_monthly` $399 | PROVEN |
| Autos dealer | `autos_dealer_quick_monthly` | `autos_dealer_monthly` $399 | PROVEN |
| Bienes negocio / agent | `br_agent_quick_monthly` | `br_agent_monthly` $399 | PROVEN |

The plan travels as a URL marker stamped by the intake adapter (`businessQuickPlanSignal.ts`), so
the preview reads one token rather than four ad-hoc booleans, and anything that is not the exact
token falls back to Full. For a listing that already exists the marker is not trusted at all: the
preview asks `/api/revenue-os/business-base-plan`, so a Quick customer who abandoned Stripe and
came back through their dashboard is re-offered the $99 package instead of the $399 one.

Activation had to widen with it. Every webhook guard previously compared the paid package against
the exact Full key and skipped anything else, which would have left a paying Quick customer
unpublished. All four now ask `isBusinessBasePackageKey(category, key)`. Locked by V1 → "a paid
Quick purchase publishes through the same webhook as Full".

No new public detail page, no second business table, no migration, no parallel checkout. Price is
server-side throughout: V1 walks every file under `app/` and fails on any `priceCents: 9900`
outside the matrix.

**Inventory does not leak.** Quick dealer includes 1 active vehicle against Full's 10; Quick agent
includes 1 active property. Neither Quick package declares `addOnInventory`, the Quick checkouts
attach no inventory pack row, and `CHECKOUT_ADDON_ALLOWLIST` is keyed to the Full base keys, so the
server refuses the pack even if a client asked for it (§6.3).

### 7.2 Simple media

The Simple cap is one number per category in `QUICK_BUSINESS_DEFINITIONS[].media`, restated
against the canonical lane contract in both directions by V1 → "the Simple media contract restates
the canonical lane": the Quick cap may never exceed what the canonical lane accepts, and the lane's
own minimum must still be met.

| Category | Minimum | Simple allowance | Full |
|---|---|---|---|
| Servicios | 1 real image | capped | canonical lane |
| Restaurantes | 1 real image | capped | canonical lane |
| Autos dealer | 1 real vehicle image | capped | canonical lane |
| Bienes negocio | 1 real property image | capped | canonical lane |

The required image is the customer's own upload, mapped 1:1 onto the canonical vehicle / property
media field. No stock host, no placeholder service, no data-URI SVG and no built-in asset path may
appear in any Quick adapter — V1 → "the Quick photo is a real photo of the thing being sold". Video
is untouched: it is a category property, identical at both levels, so no access-level dimension
exists to gate.

### 7.3 Simple → Full upgrade

Purchasable today on all four owner surfaces — the Servicios and Restaurantes dashboards, the Autos
dealer inventory section, and the shared real-estate manage card — through one starter,
`startBusinessSimpleToFullUpgradeCheckout`.

Identity survives by construction rather than by care: the upgrade is shaped like the existing
dashboard add-on purchases. It buys a package for a listing that already exists, through the same
`/api/revenue-os/checkout`, with no content save, no status change and no republish. Nothing on the
path can write to the listing row, so the listing id, slug, media, owner and public URL cannot
change. V5 asserts the starter contains no `PATCH`, `publish`, `insert(`, `update(`, `status:` or
`slug`.

The caller never names the package: it comes from `upgradeTargetPackageKey(category)`, so an
upgrade can only land on the Full package the category already sells. Eligibility comes from the
server-resolved held package key, not from anything the page inferred.

One first-purchase behaviour had to be relaxed, narrowly. A live Simple listing buying Full would
otherwise have been pushed back to `pending_payment` and refused by a "not payable status"
pre-flight — taking a paying customer's ad offline in order to charge them more. The relaxation
fires only when the server resolves the listing as already holding Simple *and* the package is that
category's own Full target. The ownership check is untouched and still runs first.

Holding both packages during the switchover resolves to FULL, so an upgrade can never read as a
downgrade, and the pre-existing recharge guard covers both keys so it cannot double-charge.

### 7.4 Admin / staff commercial truth

The existing entitlement tracker was extended, not replaced. A row now reads: customer, business,
category, package SKU, derived business access level, print tier, effective status, start/end, and
sales attribution. The access badge is derived from the row's own two columns and names the print
tier, so all six shapes are one glance apart:

`QUICK / SIMPLE` · `FULL` · `PRINT QUARTER + SIMPLE` · `PRINT HALF + FULL` ·
`PRINT FULL PAGE + FULL` · `PRINT PREMIUM + FULL`

Reading a row and finding rows are different capabilities. The tier filter cannot separate Quick
from Full — both are `digital_only` — so `package_key` was added to the tracker's search haystack
and the search help names the SKU as the field that separates them. No second tracker, no redesign,
and no account-level Free/Pro vocabulary reintroduced as commercial truth.

### 7.5 Quick Classifieds and the remaining families

Not preserved by inspection — preserved because nothing touched them. No file under any private
classified category (En Venta, Rentas, Empleos, Autos privado, Bienes FSBO, Clases, Comunidad,
Busco, Mascotas) was modified by this mission, and `verify-quick-remaining-families-01` asserts the
certified Quick Classifieds tree is byte-unchanged against its certified SHA.

The access model cannot bleed into them either. Exactly eight packages declare
`businessAccessLevel` — the four Simple and four Full base subscriptions — and V1 asserts every
other package in the matrix, classified and add-on alike, resolves to `none`. Categories outside
`BUSINESS_CATEGORY_PACKAGE_PAIR` have no Simple/Full split at all, so `upgradeTargetPackageKey`
returns null for them.

| Family | State |
|---|---|
| Comida Local | $129/mo untouched; outside the split, mechanically locked (§5) |
| Ofertas | flyer $399 / coupon $199 unchanged; the matrix may only be added to, and no Ofertas line may change |
| Negocios Locales | discovery / aggregation; `content_link`, no product, no table |
| Viajes | unresolved owner price preserved; no price invented, no Quick wrapper |
| Iglesias | existing CMS submission; `direct_link`, no Quick form |
| Recursos | editorial / content; no submission route of any kind |

The revenue matrix diff against the certified SHA is additive only: four new $99 packages and an
optional `businessAccessLevel` field. No line was removed.

### 7.6 Security / authority

Audited as assertions (V1 §9), not as a claim. Zero unresolved violations.

| Vector | Finding |
|---|---|
| Client-supplied price | None. The checkout body builder carries no price field; every displayed amount is read from the server matrix; V1 fails on any `priceCents: 9900` outside it |
| Client-supplied entitlement / access level | None. No module in the access model accepts a level; the resolver derives it from `listing_package_entitlements` |
| Client-supplied owner id | None on the new path. `/api/revenue-os/business-base-plan` resolves the owner from a verified Bearer JWT and refuses an unauthenticated caller with 401 |
| Listing-ID-only mutation | None. The base-plan route is GET-only and exposes no mutating handler; the upgrade starter writes nothing |
| Direct Quick DB writes | None. No `insert`/`update`/`upsert`/`delete` and no mutating fetch exists in any access-model module |
| Staff-as-customer / fake actor | None. No `is_admin`, impersonation or synthetic-actor symbol appears in the access model |
| Auth bypass | None. Every read fails closed: an unverified owner, an unreadable table or an unknown category yields "nothing to sell", never an unguarded offer |
| Simple reaching a Full API | Refused server-side. The private analytics route calls `resolveFullOnlyFeatureGate` and returns `403 upgrade_required`; the deny is narrow, so only a resolved `simple` is refused and an unreadable state never strips existing access |
| Add-on granting Full | Impossible. No add-on or inventory pack declares `businessAccessLevel`, and the add-on allowlist is keyed to the Full base keys |
| Print metadata granting an unrelated capability | Blocked. A print row yields one grant from its tier and reports `packageKey: null`, so the Package C bookkeeping stamp cannot be read as a purchase; FULL never invents `coupons_offers` for a category whose package never declared it |

No auth was weakened to satisfy any of the above.
