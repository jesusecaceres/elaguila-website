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
the derived access badge (QUICK / SIMPLE, FULL, PRINT + SIMPLE, PRINT + FULL), the Revenue OS SKU
the writer already stores, and the customer name the business-name headline was hiding. Locked by
V1 → "the entitlement tracker shows staff every commercial fact about a row".

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
rather than silently producing two contradictory definitions of what a quarter page buys.
