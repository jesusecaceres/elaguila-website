# BIENES RAÍCES NEGOCIO — LIVE WIRING MAP (AUTHORITATIVE)

Gate Zero + live-wiring MRI. Traced from runtime-consumed source only. File existence was never
accepted as proof of live. **No fixes implemented. Nothing deleted. No branch merged.**

Classification vocabulary (Launch Lifecycle master §14): `LIVE` · `LIVE-SHARED` ·
`BUILT-NOT-WIRED` · `DUPLICATE-REFERENCED` · `DEAD-ZERO-CONSUMER` · `HISTORICAL` · `UNKNOWN`.
Owner capabilities additionally use the Owner Command Center Bible §34 vocabulary; Admin controls
use the Admin OS Book §7 vocabulary (`WORKS` · `PARTIAL` · `BROKEN` · `WRONG_DESTINATION` ·
`DUPLICATE` · `HONESTLY_DISABLED` · `NEEDS_PROVIDER` · `NEEDS_DATA`).

Servicios, Restaurantes and Comida Local are **SOURCE-LOCKED** and were not reopened.

---

## 0. GATE STATUS

| Gate | Scope | Status |
|---|---|---|
| **BIENES-NEGOCIO-0** | Gate Zero + live wiring MRI | **COMPLETE (this document)** |
| **BIENES-NEGOCIO-1** | Identity / hydration / owner-truth repairs | **COMPLETE — see §16** |
| **BIENES-NEGOCIO-2** | Discovery (JSON-LD, sitemap) + Admin operational truth | **COMPLETE — see §17** |

---

## 1. WORKTREE TRUTH

| Field | Value |
|---|---|
| Worktree | `C:\projects\elaguila-website-launch-lifecycle` |
| Branch | `completion/launch-lifecycle-2026-09-09` |
| HEAD | `9c73afee` (Gate COMIDA-LOCAL-2) |
| Accepted below it | `51b7a941` · `451cda64` · `9d9753a0` · `2d28624c` · `849b45ea` · `a0a47839` (`origin/main`) |
| Working tree at trace time | clean |
| `origin/main` | `a0a47839` — untouched |

### 1.1 Contract branches are NOT in this tree — a delta that matters

| Contract | Its own worktree/branch | In THIS branch? |
|---|---|---|
| Owner Command Center Bible §33.1 checkpoint `ea99e57c` | `elaguila-website-owner-command-center` @ `integration/owner-command-center-globalization-2026-08` | **NO** — verified `ea99e57c` is **not an ancestor of HEAD** |
| Admin OS Book §12 pass | `.claude/worktrees/admin-os+canonical-truth-2026-09` (base `a0a47839`, uncommitted work) | **NO** |

Both were read as **contracts**, exactly as instructed. Nothing was copied. Consequence for this
MRI: every Owner/Admin classification below describes **this** branch's runtime, which is
`origin/main` + the six launch-lifecycle gates — not the OCC certified checkpoint. Where the Bible
records a capability as certified there (e.g. multi-group specialized tools, Business Tools group
on the Bienes Negocio workspace, `externalReputation` wiring), that capability may be absent here.
Those are recorded as **branch delta**, never as Bienes defects.

---

## 2. PATH: TANGLED — footprint and the duplicate map

**235 TS/TSX files across 7 trees, plus 35 historical audit `.md` files inside the source tree.**
Roughly 3× Comida Local's footprint, and unlike Comida Local (zero dead modules) this category
carries **26 zero-consumer modules**.

| Tree | Role |
|---|---|
| `app/(site)/clasificados/bienes-raices/` | landing, results, preview, live-detail shells, dashboard sections, lib |
| `app/(site)/clasificados/publicar/bienes-raices/` | checkpoint hub, Negocio + Privado applications |
| `app/(site)/publicar/bienes-raices/` | public entry URLs (selector + aliases) |
| `app/lib/clasificados/bienes-raices/` | lifecycle, payment, analytics, location, Stripe config |
| `app/api/clasificados/bienes-raices/` | `listing-edit`, `listing-lifecycle`, `public/entitlement-overlay` |
| `app/lib/saved-search/bienes-raices/` | full 7-file Saved Search adapter set |
| `app/admin/(dashboard)/workspace/clasificados/bienes-raices/` | 9-line delegate to the generic ops queue |

### 2.1 Import-alias trap (resolved — NOT a duplicate)

`tsconfig.json` maps `@/app/clasificados/*` → `./app/(site)/clasificados/*`. BR files import
through **both** `@/app/(site)/clasificados/...` and `@/app/clasificados/...`. These resolve to the
same physical files. Anyone auditing this category must know this before declaring a duplicate.

### 2.2 Route duplicates — all three are intentional aliases, none is a competing implementation

`app/(site)/clasificados/bienes-raices/shared/constants/brPublishRoutes.ts` is an authoritative,
maintained route map. Verified against it:

| Path | Truth | Classification |
|---|---|---|
| `/clasificados/bienes-raices/results` | `page.tsx` is a one-line `export { default } from "../resultados/page"`, **and** `next.config.ts` permanently redirects it to `/resultados` | **DUPLICATE-REFERENCED** — unreachable but harmless; the redirect wins |
| `/clasificados/bienes-raices/anuncio/[id]` | pure `redirect()` to `leonixLiveAnuncioPath(id)` | **LIVE alias** |
| `/publicar/bienes-raices/negocios` | pure `redirect()` to `/publicar/bienes-raices` | **LIVE alias** |

**No competing application, preview, results or detail implementation exists.** The folder-name
confusion is real but the runtime is single-owner.

### 2.3 The naming trap that WILL cause a wrong edit

`/clasificados/publicar/bienes-raices/negocio/page.tsx` renders
**`agente-individual/application/AgenteIndividualResidencialApplication`**. That folder name reads
like a narrow "individual agent, residential" sub-lane; it is in fact **the entire Negocio
application for all advertiser types and all three property categories**. The sibling
`negocio/application/` folder holds supporting inventory/mapping/schema modules, **not** a second
application. Editing `negocio/application/` expecting to change the form is the mistake this
section exists to prevent.

### 2.4 DEAD-ZERO-CONSUMER — 26 modules (recorded, NOT deleted)

Proved by walking every `ts/tsx` under all seven trees and matching real import specifiers
(both alias forms), excluding Next.js route conventions.

| Module | Note |
|---|---|
| `app/lib/clasificados/bienes-raices/bienesChildPropertyInventory.ts` | **The most dangerous one.** Self-describes as "canonical child property inventory helpers". Its ONLY reference anywhere is `scripts/bienes-br-july1-inventory-analytics-os-01-audit.ts`, which asserts *the file exists*. A test that proves a file exists proves nothing about runtime (master §23: "treat tests as evidence, not product definition"). **BUILT-NOT-WIRED facade.** |
| `app/lib/clasificados/bienes-raices/brPublishCheckoutClient.ts` | Legacy `startBrNegocioCheckout` posting to `/api/clasificados/leonix/stripe/checkout`. The live path is Revenue OS. **Must never be revived.** |
| `app/(site)/clasificados/bienes-raices/shell/BienesRaicesPreviewCard.tsx` | the `shell/` trap again — here it really is dead |
| `.../resultados/components/` × 8 | `BienesRaicesCategoryNav`, `FeaturedSection`, `FilterChips`, `NegociosSpotlightBand`, `PropiedadFilterChips`, `ResultsHero`, `ResultsTopBar`, `map/BienesRaicesMapToggle` — a whole unused results UI band |
| `.../preview/privado/model/buildBienesRaicesPrivadoTemplateVm.ts` | hardcodes `mostrarDireccionExacta: true`. Dead, therefore harmless — **and a concrete reason not to revive it** |
| `agente-individual/mock/` × 2 | `filledShellAgenteIndividualResidencial`, `mockAgenteIndividualResidencialListing` |
| `privado/application/{mapping,schema,utils}/*Stub.ts` × 3 + `PrivadoApplicationNotice.tsx` | scaffolding stubs |
| `.../negocio/application/mapping/brNegocioInputToPreviewMap.ts` | superseded mapper |
| `.../agente-individual/{application/utils/brAgenteResMuxLifecycle, lib/…FieldSlotAudit}` | 2 |
| `bienes-raices/{components/BienesRaicesBrConsentStrip, landing/bienesRaicesLandingSample, preview/*/components/*GalleryLightbox × 2, shared/brPublishDiscoveryReadiness}` | 5 |

**Nothing deleted. No routing decision taken.** Recorded only.

---

## 3. EXACT LIVE END-TO-END PATH

```
CHECKPOINT      /clasificados/publicar/bienes-raices
                page.tsx -> BienesRaicesPublicarHubClient
                -> getBienesRaicesCheckpointCards(lang, privadoHref, BR_PUBLICAR_NEGOCIO_SELECTOR)
                price  monthlyPrice("br_agent_monthly","bienes-raices") -> matrix-derived   LIVE-SHARED
  |
SELECTOR        /publicar/bienes-raices  (BR_PUBLICAR_NEGOCIO_SELECTOR)
                PublicarBienesRaicesNegocioSelectorClient
                seller type + property category (residencial | comercial | terreno_lote)
                ALSO the child re-entry point (inventory-child mode, see §5)              LIVE
  |
APPLICATION     /clasificados/publicar/bienes-raices/negocio  (BR_PUBLICAR_NEGOCIO)
                -> AgenteIndividualResidencialApplication  (see §2.3)                     LIVE
                leave guard mounted; ~150-field form state
  |
DRAFT           per-listing edit workspace keys
                bienes:listing-edit:<parentId>:parent
                bienes:listing-edit:<parentId>:child:<childId>                            LIVE
                media: IDB durable refs (brAgenteResDraftMedia), never object URLs
  |
PREVIEW         /clasificados/bienes-raices/preview/negocio  (BR_PREVIEW_NEGOCIO)
                + agente-individual/preview/AgenteIndividualResidencialPreviewClient      LIVE
  |
PAGAR           startRevenueCategoryCheckout({...BIENES_RAICES_NEGOCIO_CHECKOUT})
                category "bienes-raices" / packageKey "br_agent_monthly"                  LIVE-SHARED
                checkout metadata carries inventory_child_count + inventory_pack_selected
  |
REVENUE OS      revenuePricingMatrix br_agent_monthly = 39900 monthly_subscription
                br_inventory_pack_monthly = 9900 monthly_subscription                     LIVE-SHARED
                NO-RECHARGE GUARD: br_agent_monthly IS in
                REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS; the pack is deliberately
                EXCLUDED and guarded by validateBienesInventoryAddonOwnership instead     PROVEN
  |
STRIPE/WEBHOOK  /api/revenue-os/webhook -> stripeEventLedger -> revenueEntitlementFulfillment
                -> tryActivateBienesNegocioListingAfterEntitlement                        LIVE-SHARED
  |
ACTIVATION      activatePaidBienesNegocioListingFromRevenueOs
                -> tryActivateBrListingAfterPayment
                -> activateBrNegocioListingAtomic  (RPC br_negocio_activate_listing)
                *** RPC MIGRATION NOT APPLIED — see §7.1, P0 ***                          BUILT-NOT-WIRED
  |
PARENT ROW      public.listings  (SHARED table with Rentas/En Venta/etc.)
                identity = listings.id ; branch/lifecycle/facets in detail_pairs JSON     LIVE
                inventory_role='main', br_inventory_group_id = own id
  |
CHILD ROWS      public.listings, inventory_role='inventory_property',
                br_inventory_parent_listing_id = parent UUID, same br_inventory_group_id  LIVE
  |
RESULTS         /clasificados/bienes-raices/resultados  (BR_RESULTS)
                BienesRaicesResultsClient -> fetchBrPublishedListingsBrowser (BROWSER/RLS)
                + collectBrChildParentIds + filterBrRowsByActiveParent                    LIVE
                SavedSearchButton mounted with live filter state                          LIVE-SHARED
  |
PUBLIC DETAIL   /clasificados/anuncio/[id]   (canonical, shared with En Venta/Rentas)
                -> BienesRaicesNegocioLiveDetailShell (Negocio lane)                      LIVE
                parent gate re-applied per row at line 642                                PROVEN
                Related rail: RelatedBrAgentProperties / BrRelatedAgentPropertiesSection  LIVE
                Translate Ad + Connection Hub mounted here                                LIVE-SHARED
  |
DASHBOARD       /dashboard/mis-anuncios
                BrPropertyInventoryDashboardSection (capacity + add property)
                LeonixRealEstateListingManageCard (per-listing manage doorway)            LIVE
  |
ADMIN           /admin/workspace/clasificados/bienes-raices
                -> ListingsCategoryOpsQueuePage(categorySlug="bienes-raices")             LIVE (generic)
  |
EDIT PUBLISHED  application in dashboard listing-edit mode
                hydrateBienesListingForDashboardEdit
                -> bienesPublishedRowToAgenteApplicationDraft
                *** ~9 of ~150 fields restored — see §7.2, P0 ***                         LIVE (destructive)
  |
SAME-ROW SAVE   POST /api/clasificados/bienes-raices/listing-edit                          LIVE
                parent: .eq(id).eq(owner_id).eq(category)
                child:  + .eq(br_inventory_parent_listing_id)
                patch contains NO status / is_published / published_at / expires_at /
                owner_id / leonix_ad_id / inventory columns                               PROVEN
  |
LIFECYCLE       POST /api/clasificados/bienes-raices/listing-lifecycle
                brListingLifecycleService (pause/resume/reactivate)                       LIVE
                resume/reactivate route through the same unapplied RPC                    BUILT-NOT-WIRED
  |
ANALYTICS       bienesRaicesGlobalAnalytics + BrLiveDetailAnalyticsMount + BrEngagementRow LIVE
```

---

## 4. PARENT TRUTH

| Question | Answer |
|---|---|
| **What is the parent?** | A row in `public.listings` with `category='bienes-raices'`, `seller_type='business'`, `inventory_role='main'`. **There is no separate parent business table.** The parent IS a listing. |
| **CANONICAL PARENT ID** | `listings.id` (uuid). `br_inventory_group_id` is set to that same id after insert (`mainListingInventoryPatchAfterInsert`), so the group key and the parent id are the same value by construction. |
| Public identifier | `listings.leonix_ad_id` — protected on edit by an explicit `leonix_id_mismatch` 409 |
| Branch discriminator | `detail_pairs["Leonix:branch"] = "bienes_raices_negocio"` **or** `seller_type='business'` — `isBrNegocioListing` accepts either |
| Business identity storage | `listings.business_name` + `listings.business_meta` (JSON), derived at publish from the advertiser-type identity block (`identityAgente` / `identityEquipo` / `identityOficina` / `identityConstructor`) |
| Business Hub / Connection Hub | **LIVE-SHARED** — `SharedConnectionHubReviewButton` + `dispatchConnectionHubCta` on the preview contact sidebar and the canonical detail page |
| Canonical Concierge business (`public.businesses.id`) | **NOT LINKED.** `listings.business_name`/`business_meta` is listing-scoped identity; no column ties a BR parent to a `businesses` row. Business Tools (OCC Bible §28) authorizes on `(businessId, userId)` — so a BR Negocio parent has no proven path into Business Tools. **UNKNOWN → recorded as a real cable gap (Admin OS Book §9).** |

**PARENT MODEL: PROVEN** as a listing-row parent. **PARTIAL** as a business identity: it owns
name/meta/hub CTAs, but has no canonical `businesses` linkage.

---

## 5. CHILD TRUTH

| Question | Answer |
|---|---|
| **CANONICAL CHILD ID** | `listings.id` (uuid) — its own row, its own `leonix_ad_id`, its own media, its own analytics |
| Parent link | `br_inventory_parent_listing_id` (real UUID FK) + `br_inventory_group_id` + `inventory_role='inventory_property'` |
| FK behavior | `references listings(id) ON DELETE SET NULL` — deleting a parent **orphans** children, never cascade-deletes them |
| Draft-side child id | `br-db-child-<uuid>` prefix; a draft id without that prefix is a NEW child and is **not** editable through the edit route |
| Creation path | selector in inventory-child mode (`brNegocioInventoryChildContext`) → child application (`BrNegocioChildInventoryFullApplication`, leave guard mounted) → queue → publish |
| Parent-identity inheritance | `BrNegocioChildInventoryInheritedHubPanel` — the professional hub renders **read-only** on the child; contact destinations inherited read-only. Child owns only property-specific data (`pickChildPropertySlice`) |
| Child media | `brNegocioChildMediaCanonical.ts` — one canonical collection per child, `durableRef` (IDB/http) for persistence, `url` only for display, `blob:` explicitly rejected as durable |

### 5.1 Sibling preservation — **PROVEN**

`listing-edit/route.ts` reads every child in the group, then iterates **only the drafts submitted**:
- a draft with no `br-db-child-` id → pushed to `skippedNewChildren`, **never created**
- a draft whose id resolves to no DB row → `continue`, **never created**
- a DB child absent from the draft → **untouched** (no delete, no archive, no status change)

There is no delete, no upsert and no replace anywhere in the path. A child cannot silently become
a different child, and an edit cannot destroy a sibling.

### 5.2 Child visibility gating — **PROVEN**

`app/(site)/clasificados/lib/brPublicChildParentVisibility.ts` (`isBrChildParentGateSatisfied`) is a
pure predicate requiring the parent to be resolved **by real UUID** and to be
`category='bienes-raices'` + `seller_type='business'` + `inventory_role='main'` + same `owner_id` +
`status='active'` + `is_published!==false`. Applied at **all three** public surfaces:

| Surface | Call site |
|---|---|
| public browse | `fetchBrPublishedListingsBrowser.ts:86,99` |
| public detail | `app/(site)/clasificados/anuncio/[id]/page.tsx:642` |
| Saved Search eligibility | `bienesRaicesPublicEligibleListing.ts:52` |

A suspended/paused/unpublished parent therefore hides its children **without deleting anything** —
exactly the owner-contract requirement. Autos Dealer's own gate is documented as a copy of this one.

**CHILD MODEL: PROVEN.**

---

## 6. CAPACITY TRUTH

| Fact | Source | Status |
|---|---|---|
| Base **$399/month** | `revenuePricingMatrix` `br_agent_monthly` `priceCents: 39900`, `monthly_subscription` | **PROVEN** |
| Base includes **1** active property | `publishCheckoutCheckpoint.BR_BASE_INCLUDED_PROPERTIES = 1` | **PROVEN** |
| Boost **+$99/month** | matrix `br_inventory_pack_monthly` `priceCents: 9900` (and `BR_INVENTORY_PACK_PRICE_CENTS = 9900`) | **PROVEN** |
| Boost adds **+3** | `BR_INVENTORY_PACK_MAX_CHILDREN = 3` — comment: "owner-locked: the pack adds THREE properties (base 1 + pack 3 = 4 max)" | **PROVEN** |
| Max **4** | `BR_TOTAL_ACTIVE_PROPERTY_LIMIT = BR_BASE_INCLUDED_PROPERTIES + BR_INVENTORY_PACK_MAX_CHILDREN` — **derived, never a literal** | **PROVEN** |

`leonixBrPropertyInventoryPolicy.ts` explicitly aliases all three counts to that single authority
and documents why: a locked literal there once drifted ($99.99 vs $99.00) and produced a real
display-vs-charge mismatch. The total monthly price is likewise derived, not written.

### 6.1 Enforcement — three layers, one of them not applied

| Layer | Where | Status |
|---|---|---|
| UX preflight | `commercialWriteGuard.assertCommercialCapacityForWrite` — called by `listing-edit` | **LIVE**, explicitly documented as UX-only, never financial authority |
| Dashboard presentation | `computeBrPropertyInventoryCounts` with `upgradeActive` from the shared per-parent entitlement API, **failing closed to inactive** | **LIVE** |
| **Financial authority** | Postgres `br_negocio_activate_listing` — advisory-locked per group, re-derives owner/parent/group from locked rows, derives the limit from `listing_package_entitlements`, and independently enforces the grace/suspended/canceled subscription rule | **BUILT-NOT-WIRED — migration unapplied (§7.1)** |

The design is correct and genuinely closes the SELECT-count-then-write race. It simply is not
callable yet.

**CAPACITY ENFORCEMENT: PARTIAL** — the authority exists and every write path already routes
through it, but the function does not exist in any database.

### 6.2 A dev-only capacity flag with a production floor

`isBrInventoryUpgradeActive()` returns `true` for `localStorage.LEONIX_BR_INVENTORY_UPGRADE === "1"`
or `NEXT_PUBLIC_LEONIX_BR_INVENTORY_UPGRADE === "1"` — but **only when `NODE_ENV !== "production"`**.
Both remaining call sites invoke it with no argument. In production it is therefore always `false`
unless a caller passes real `entitlementActive`. Fails closed. Recorded, not a defect.

---

## 7. PAYMENT / ENTITLEMENT TRUTH

Server-owned pricing: **PROVEN** — the client never names a price; `startRevenueCategoryCheckout`
sends `{category, packageKey}` and the matrix resolves cents server-side.

Webhook is paid truth: **PROVEN** — `stripeEventLedger` idempotency → entitlement →
`tryActivateBienesNegocioListingAfterEntitlement`, with `revenue_webhook_ignored` /
`revenue_webhook_validation_failed` audit rows on every non-happy path.

No-recharge: **PROVEN** — `br_agent_monthly` is guarded by
`REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS`; the inventory pack is deliberately excluded (an
add-on must remain independently billable) and has its own `validateBienesInventoryAddonOwnership`
with an `addon_already_active` rejection. **No ordinary parent or child edit touches Stripe**: the
edit route writes only content columns (§8.2), and the boost checkout is a separate, explicit
dashboard action.

### 7.1 P0 — THE CAPACITY RPC MIGRATION IS NOT APPLIED

`supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql` states in its own
header: *"AUTHORED ONLY. NOT APPLIED to any database"*, and the TS wrapper repeats it.

Every BR Negocio activation path funnels through it:

| Path | Behavior with the function missing |
|---|---|
| paid webhook activation (`tryActivateBrListingAfterPayment`) | `rpcResult.ok === false` → logs, returns `{ok:false}` → **the paid $399 listing never goes live** |
| owner resume (`brListingLifecycleService:326`) | same |
| owner reactivate (`brListingLifecycleService:372`) | same |
| admin republish-reactivate (`/api/admin/clasificados/listings/[id]:129`) | returns `capacity_rpc_unavailable`, HTTP 500 |
| admin route second site (`:198`) | same |

It **fails closed** — no free activation, no capacity bypass — but the product is non-functional
end to end. This is the single largest launch blocker in this category and it is an *operational*
step, not a code change.

The grouping/column migration it depends on
(`20260518130600_br_property_inventory_grouping.sql`) is an ordinary applied-era migration and is
not in question.

### 7.2 P0 — PUBLISHED→EDIT HYDRATION IS DESTRUCTIVE

`bienesPublishedRowToAgenteApplicationDraft` starts from `createEmptyAgenteIndividualResidencialState()`
and restores **9** things: `categoriaPropiedad`, `titulo`, `descripcionPrincipal`, `precio`,
`ciudad`, `fotosDataUrls`, `fotoPortadaIndex`, `additionalInventoryProperties`, plus confirmation
booleans.

The form state has ~150 fields. Everything else resets to empty, including:
`direccionLinea1/2`, `direccionEstado`, `direccionCodigoPostal`, `direccionPais`,
`mostrarDireccionExacta`, `estadoAnuncio`, all property-subtype/comercial/terreno blocks,
`recamaras`/`banos`/`tamanoInteriorSqft`/`tamanoLoteSqft`/`estacionamientos`/`anoConstruccion`,
`hasHoa`/`hoaFee`/`hoaFrequency`/`hoaIncludes`, `communityRules`/`petRules`/`rentalRestrictions`/
`parkingRules`, all `destacados*`, `notasAdicionales`, video/tour/brochure, and the **entire agent
identity block** (`agenteNombre`, `agenteTitulo`, `agenteLicencia`, `telefonoPrincipal`,
`agenteTelefonoPersonal/Oficina`, `agenteWhatsapp`, `agenteSitioWeb`).

The row SELECT already fetches `business_name`, `business_meta`, `contact_json` and `listing_json`
— **the mapper simply never reads them.**

Why it is destructive rather than merely lossy, traced to the write:
- `buildEditablePatch` writes `business_name: params.businessName ?? null` and
  `business_meta: params.businessMetaJson ?? null` **unconditionally**;
- with an empty identity block, `negocioContactAndBusinessName` falls through to
  `businessName: trim(s.titulo)` and `phone: null, email: null`;
- so an ordinary owner edit **replaces the brokerage/office/team name with the property title** and
  **nulls `contact_phone` and `contact_email`** on the published row.

Partial mitigation: `mergeDetailPairs(existing, next)` preserves prior `detail_pairs` not present
in the new set, so facts stored as detail pairs survive. Nothing protects the four real columns.

Because children inherit the parent hub read-only, a parent edited this way then propagates an
empty hub to any child re-saved in the same request. **This is the mechanism by which
PARENT IDENTITY INHERITANCE degrades.**

Independently confirmed by the sealed branch — see §11.

### 7.3 Fixed-term / expiry / suspension

- `expires_at` exists on the row and is read by the edit route's proof select.
- `LANE_SUSPENSION["bienes-raices"]` → `listings` / `status` / visible `["active"]` / suspended
  `"suspended"`, with `suspended_reason` present since `20260805090500`. **LIVE-SHARED.**
- The platform sweeper `/api/revenue-os/admin/subscription-sweep` still has **no caller** — the
  same P1 recorded for all three locked categories.

---

## 8. APPLICATION / PREVIEW TRUTH

| Tool | Status | Evidence |
|---|---|---|
| Durable draft identity | **LIVE** | per-listing workspace keys; new-ad and edit drafts never share a key |
| Preview → Edit | **LIVE** | `backToEditMode` preserves `listing-edit` / `inventory-edit` / `inventory-addon` |
| Unsaved-exit protection | **LIVE-SHARED** | mounted on both the parent application and the child inventory application |
| Media durability before checkout | **LIVE (partial)** | IDB `durableRef` model; `buildProposedFinalMediaSet` + `validateProposedFinalMediaSet` at 3 publish sites — but `droppedUnpersistable` is **never read** and `warnDroppedUnpersistableMedia` is not imported (§8.1) |
| Address / location | **LIVE** | worldwide location fields; `mostrarDireccionExacta` → `Leonix:br:show_exact_address`; both live detail mappers gate street text on it |
| HOA / community / pet / rental / parking rules | **LIVE** in the form and in `detail_pairs`; **destroyed on dashboard edit** (§7.2) |
| Open house | present in the form; sealed-branch commit lists it among the fields the reverse mapper drops |
| ES / EN | **LIVE** | `BrAgenteResidencialLocaleProvider`, `normalizeBrAgenteResidencialLang`, `resolveClasificadosPublishLangFromSearchParams` |
| Translate Ad | **LIVE-SHARED** | mounted on the canonical `/clasificados/anuncio/[id]` detail page |
| Connection Hub / CTAs | **LIVE-SHARED** | preview contact sidebar + detail page |

### 8.1 Media warning gap
Same defect class repaired in SERVICIOS-1, RESTAURANTES-1 and COMIDA-LOCAL-1: the shared contract
reports the URLs it could not persist, and this category computes and discards that report. An
owner whose gallery silently shrinks is never told. **P1, ADOPT.**

### 8.2 The same-row write boundary is the best on the platform
`buildEditablePatch` emits exactly: `title`, `description`, `city`, `state`, `zip`, `price`,
`business_name`, `business_meta`, `detail_pairs` (merged), `contact_phone`, `contact_email`,
`images`, `updated_at`. **No** `status`, `is_published`, `published_at`, `expires_at`, `owner_id`,
`leonix_ad_id`, or inventory column. An owner edit structurally cannot escalate status, reset the
term, re-parent a row, or move a Leonix ID. Combined with the `leonix_id_mismatch` 409 and the
triple `.eq()` scoping, **SAME-ROW CHILD REPUBLISH: PROVEN**.

---

## 9. OWNER DASHBOARD TRUTH (Owner Command Center Bible as contract)

Classified against **this** branch — see §1.1 for the branch delta.

| Bible requirement | This branch | Class |
|---|---|---|
| One canonical owner manage doorway | `LeonixRealEstateListingManageCard` in `/dashboard/mis-anuncios` | **LIVE** |
| Parent workspace vs child property workspace | One library surface; grouped inventory section renders parent + children together; per-row manage card | **PARTIAL** — grouping is real, but there is no distinct parent-workspace vs child-workspace page |
| Inventory management | `BrPropertyInventoryDashboardSection` + `BrNegocioListingInventoryActions` | **LIVE** |
| Add property | `leonixBrPropertyInventoryAddFlow` → selector in child mode with real `parentListingId`; synthetic dashboard group keys are explicitly prevented from leaking into the add context | **LIVE** |
| Capacity presentation | `{baseUsed}/{baseLimit}` always, `{additionalUsed}/{additionalLimit}` only when the boost is entitlement-active; `upgradeActive` sourced per canonical main parent from the shared entitlement API and **fails closed** | **LIVE** |
| Public view | canonical `leonixLiveAnuncioPath` | **LIVE** |
| Analytics | `bienesRaicesGlobalAnalytics` + detail mount + engagement row | **LIVE-SHARED** |
| Lifecycle (pause/resume/reactivate/archive) | `/api/clasificados/bienes-raices/listing-lifecycle` → `brListingLifecycleService` | **LIVE**, but resume/reactivate are **BUILT-NOT-WIRED** on the unapplied RPC (§7.1) |
| Payment / entitlement truth | shared dashboard entitlement badges, per canonical parent | **LIVE-SHARED** |
| Same-row child edit | §8.2 | **LIVE — PROVEN** |
| No recharge | §7 | **PROVEN** |
| Business Tools eligibility | requires a canonical `businesses.id`; no BR-parent → business linkage exists (§4) | **UNKNOWN / BUILT-NOT-WIRED** |
| Business Hub | Connection Hub CTAs live on preview + detail | **LIVE-SHARED** |
| Stale-conflict precedence | `sourceUpdatedAt` is captured into the workspace and the code says precedence "lands with Gate 5" | **BUILT-NOT-WIRED** |
| CTA semantics (Bible §10) | Bible §33.2 Gate 7 records the Archive/Mark-Sold red-palette repair as landed **on the OCC branch** | **branch delta — not present here** |

**OWNER COMMAND CENTER: PARTIAL** on this branch.

Two owner-truth gaps worth naming under the Bible's §7 attention contract:
1. `skippedNewChildren` is returned by the edit API but nothing was found rendering it — an owner
   who adds a property inside the *edit* form gets a silent no-op. **NEEDS_DATA → surface it.**
2. A capacity block surfaces as `capacity_reached`; with the RPC unapplied the owner instead gets a
   generic failure with no cause — precisely the "owner discovers an infrastructure problem through
   a raw failure" case the Bible §37 and Admin Book §7 forbid.

---

## 10. ADMIN TRUTH (Admin OS Book as contract)

`/admin/workspace/clasificados/bienes-raices` is a 9-line delegate to the generic
`ListingsCategoryOpsQueuePage`. Direction A ("where is its Admin wire?") — traced:

| Admin capability | Class (Book §7) | Evidence |
|---|---|---|
| See BR listings, filter by q / status / owner / live-scope | **WORKS** | `fetchListingsForAdminWorkspaceFiltered` on `listings` |
| Canonical parent/child IDs visible | **WORKS** | `AdminListingsTable` selects `br_inventory_group_id`, `br_inventory_parent_listing_id`, `inventory_role` and renders `inv-group` / `inv-parent` badges |
| Leonix ad id | **WORKS** | rendered from the stored value |
| Republish / reactivate a BR row | **BROKEN (runtime)** | correctly routed through `activateBrNegocioListingAtomic`; returns `capacity_rpc_unavailable` 500 while the migration is unapplied |
| Capacity visibility (used / limit / boost) | **NEEDS_DATA** | no capacity column, count or limit anywhere in the Admin queue |
| Payment / entitlement visibility | **NEEDS_DATA** | not surfaced in the BR queue |
| Parent→children navigation | **PARTIAL** | badges prove the relationship exists; there is no drill-through from a parent to its children |
| Moderation / report path | **PARTIAL** | shared listings moderation applies to `listings`; nothing BR- or parent/child-aware |
| Analytics | **NEEDS_DATA** | not surfaced in the BR queue |
| Edit/control destination | **WORKS** | admin listing detail route with real mutations + audit |

**ADMIN OS: PARTIAL.** Nothing is orphaned or misrouted; the gaps are missing *commercial and
capacity* truth on a marketplace lane whose whole product is a capacity contract (Book §19: "all
category behavior must be mapped before claiming Marketplace Ops is launch-ready").

**The Admin OS worktree was not opened or modified.**

---

## 11. GLOBALIZATION FIXES AVAILABLE (sealed branch, read-only)

Inspected `fix/globalization-final-closeout-2026-09` **after** completing current-runtime tracing,
per instruction. **Nothing forward-ported.**

| Commit | What it does | Portability |
|---|---|---|
| **`733408dd`** | *"stop Bienes Negocio dashboard-edit from destroying published listings"* — its own body: the reverse mapper "silently dropp[ed] ~130 of ~150 form fields (address, business identity, agent/broker/co-agent, socials, Google/Yelp, business extra links, open house, CTAs, property-type sections) on every dashboard edit — **confirmed destructive on Republish**". Fix: extract the live public shell's `buildPublishedState()` into a new shared pure module `parseBienesAgenteResidencialPublishedState.ts` and wire **both** the public detail shell and the dashboard-edit mapper onto it, so exactly one module knows how to read a published row back into form state; the reverse mapper then merges only its inventory-pack-specific fields on top. Adds `contact_phone`/`contact_email` to the mapper's SELECT. Ships a dedicated verifier. | **HIGH — the right shape.** It independently confirms §7.2, which I traced first from current runtime. 5 files, +500/−348. Forward-port semantics in Gate 1 after re-proving the current shell's `buildPublishedState` still matches. |
| **`651abd4e`** | *"protect child listing identity integrity"* — new `app/lib/clasificados/bienes-raices/brChildIdentityGuard.ts` (73 lines) plus 28 lines of hardening in `listing-edit/route.ts`; Autos equivalent alongside; 188-line verifier. **`brChildIdentityGuard.ts` does not exist on HEAD.** | **HIGH.** Directly serves "no silent child replacement". Current route is already safe structurally (§5.1) — this adds an explicit guard rather than relying on the shape. |
| `5ddf6f79` | *"harden lifecycle visibility truth"* — fixed-term expiry truth in `fetchBrPublishedListingsBrowser` + the canonical anuncio page + `activePaidEditCheckoutOwnership`; 159-line verifier | **MEDIUM.** Relevant to §7.3. |
| `da25bc92` | *"preserve Bienes drafts and edit hydration"* — `useLeonixPublishFlowExitClear` + an additive 39 lines on the same reverse mapper | **MEDIUM.** Likely superseded in part by `733408dd`; re-trace before porting. |
| `67919479` | the identical Rentas Negocio repair | **N/A here** — Rentas is a later category |
| `3c23e875`, `652e2556`, `db688c04`, `a1a0aaa9`, `c6519f30`, `5e6303d2`, `0e2f9b17`, `f67ee268`, `4f676ef8` | address verifier adoption, Wave-2 owner-critical defects, business reputation, WhatsApp international, Recently Viewed/Report | **DEFER** — evaluate individually in a later gate; several are engagement/differentiator scope |

---

## 12. DISCOVERY TRUTH

| Tool | Status | Note |
|---|---|---|
| Results filters | **LIVE** | `BienesRaicesResultsClient` + browser fetch with the parent gate applied |
| Public detail | **LIVE** | canonical `/clasificados/anuncio/[id]` |
| **Saved Search** | **PROVEN — fully adopted** | complete 7-file adapter set; CTA mounted on results with live filter state; ledger CHECK already includes `bienes-raices`; delivery resolver registered |
| **Related Listings** | **PROVEN** | `RelatedBrAgentProperties` (same-agent portfolio, group-scoped) + `BrRelatedAgentPropertiesSection` on the shared anuncio layout; real published rows |
| **SEO / JSON-LD** | **PARTIAL** | the canonical detail page emits `@type: "ClassifiedAd"` with a **relative** `url` (`/clasificados/anuncio/${id}`) — the same unusable-entity-URL defect repaired for Servicios and Restaurantes. No `RealEstateListing`/`Residence` type, and none of the real structured facets (`Leonix:bedrooms_count`, `bathrooms_count`, `postal_code`, area) reach schema. No breadcrumb JSON-LD. |
| **Sitemap** | **NOT PROVEN** | `app/sitemap.ts` contains **zero** bienes entries. Recursos, Servicios, Restaurantes and Comida Local each have a DB-backed section; BR has none, not even a hub row for `/clasificados/bienes-raices/resultados` |
| Canonical URLs | **LIVE** | one canonical detail path with three intentional redirect aliases (§2.2) |

**SEO/SITEMAP: PARTIAL.**

---

## 13. GATE ZERO — RESOLVED

| Question | Answer |
|---|---|
| entry route | `/clasificados/publicar/bienes-raices` (checkpoint hub) |
| checkpoint | `getBienesRaicesCheckpointCards` — matrix-derived price |
| selector | `/publicar/bienes-raices` (`BR_PUBLICAR_NEGOCIO_SELECTOR`) — also the child re-entry |
| application | `/clasificados/publicar/bienes-raices/negocio` → `AgenteIndividualResidencialApplication` |
| draft identity | `bienes:listing-edit:<parentId>:{parent,child:<childId>}` + IDB media refs |
| preview | `/clasificados/bienes-raices/preview/negocio` |
| checkout | Preview → `startRevenueCategoryCheckout(BIENES_RAICES_NEGOCIO_CHECKOUT)` |
| publish action | Revenue OS webhook → `activatePaidBienesNegocioListingFromRevenueOs` → `br_negocio_activate_listing` RPC |
| parent row | `listings` `inventory_role='main'`, `br_inventory_group_id = id` |
| child row | `listings` `inventory_role='inventory_property'` + `br_inventory_parent_listing_id` |
| results | `/clasificados/bienes-raices/resultados` |
| public detail | `/clasificados/anuncio/[id]` |
| dashboard | `/dashboard/mis-anuncios` (`BrPropertyInventoryDashboardSection` + `LeonixRealEstateListingManageCard`) |
| admin | `/admin/workspace/clasificados/bienes-raices` |
| edit route | application in `mode=listing-edit` with `source=dashboard` |
| republish action | `POST /api/clasificados/bienes-raices/listing-edit` |
| lifecycle reader | `brListingLifecycleEligibility` / `brListingLifecycleService`; `LANE_SUSPENSION["bienes-raices"]` |
| analytics recorder | `bienesRaicesGlobalAnalytics.ts` |

**Gate Zero is clear — implementation may proceed in a later gate.**

---

## 14. PROTECTED / NO-TOUCH

- `agente-individual/application/AgenteIndividualResidencialApplication.tsx` and its
  `sections/`, `schema/`, `utils/`
- `negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx` and the
  inventory draft/session/queue modules
- `agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx`
- `app/(site)/clasificados/lib/leonixRealEstateListingContract.ts` — the `detail_pairs` contract is
  shared with **Rentas and En Venta**; a change here is cross-category
- `app/(site)/clasificados/lib/brPublicChildParentVisibility.ts` — the proven gate, reused verbatim
  by Saved Search and copied by Autos
- `app/(site)/clasificados/anuncio/[id]/page.tsx` (2,635 lines) — shared by multiple categories
- `app/lib/listingPlans/*` — shared Revenue OS
- the 26 zero-consumer modules (§2.4) — recorded, **not** to be edited or deleted in a repair gate

---

## 15. READY-TO-WIRE SUMMARY

**NEW ENGINE REQUIRED: NO.** Every gap is an operational step, an ADOPT of an existing engine, or a
forward-port of a proven sealed-branch fix.

| Priority | Item | Action |
|---|---|---|
| **P0** | capacity RPC migration unapplied — no BR Negocio listing can activate, resume, reactivate or admin-republish | **APPLY MIGRATION** (operational, owner-authorized) |
| **P0** | dashboard-edit destroys ~130/150 fields, nulls `contact_phone`/`contact_email`, replaces business name with the property title | **FORWARD-PORT `733408dd`** semantics |
| **P1** | `droppedUnpersistable` computed and discarded | **ADOPT** shared `warnDroppedUnpersistableMedia` |
| **P1** | no child identity guard on HEAD | **FORWARD-PORT `651abd4e`** |
| **P1** | no scheduler cranks the subscription sweep | platform-wide decision |
| **P2** | JSON-LD is `ClassifiedAd` with a relative URL; no real-estate type, no facets, no breadcrumb | **REPAIR + ADOPT** |
| **P2** | BR entirely absent from the sitemap | **ADOPT** the 4-section DB-backed pattern |
| **P2** | Admin queue shows no capacity / entitlement / payment truth | **ADOPT** existing entitlement readers |
| **P2** | no BR-parent → `businesses.id` linkage; Business Tools eligibility unprovable | **owner/product decision** |
| **P3** | `skippedNewChildren` never surfaced to the owner | **REPAIR** (owner truth) |
| **P3** | `sourceUpdatedAt` captured, precedence unwired | **ADOPT** when the per-lane save truth lands |
| **P4** | 26 dead modules + 35 historical audit `.md` in the source tree | cleanup gate, after integration |

---

**QUE RUJA EL LEÓN. HARD WORK. GOD FIRST.**

---

## 16. GATE BIENES-NEGOCIO-1 — IDENTITY / HYDRATION / OWNER TRUTH

One launch-critical gate. Verifier `scripts/verify-bienes-negocio-gate1-identity.ts` — **33/33 PASS**.
No migration applied. No JSON-LD/sitemap, Admin visibility, scheduler, cleanup or aesthetics work.
Servicios, Restaurantes and Comida Local were not reopened; all four of their verifiers still pass.

### 16.1 Published → edit hydration — P0 CLOSED

**The defect, restated from the write side.** `buildEditablePatch` writes `business_name`,
`business_meta`, `contact_phone` and `contact_email` unconditionally. The dashboard-edit reverse
mapper restored 9 of ~150 form fields and left the rest at their EMPTY-DRAFT default. With an empty
identity block, `negocioContactAndBusinessName` falls through to
`businessName: titulo, phone: null, email: null`. So an ordinary owner edit **replaced the
brokerage/office/team name with the property title and NULLED both contact destinations**, and
emptied address, HOA/community/pet/rental/parking rules, highlights, licence and every phone.

**The fix is structural, not a patch.** `buildPublishedState()` and its nine helpers were extracted
**VERBATIM** out of this branch's own live `BienesRaicesNegocioLiveDetailShell` into a new pure
module, `parseBienesAgenteResidencialPublishedState.ts`. The public detail shell and the
dashboard-edit reverse mapper now both call it. One module, one interpretation — the public page and
the owner's edit form can no longer disagree about what a published row means. The reverse mapper
merges only what is genuinely Bienes-inventory-specific (child properties, pack confirmation) on top.

This is the sealed `733408dd` architecture, **forward-ported as semantics, not cherry-picked**. Two
deltas were required and are recorded in the module header:

| Sealed version | This branch | Why |
|---|---|---|
| sets `direccionVerificationStatus` / `direccionProvider` / `direccionProviderPlaceId` | **omitted** | those fields arrived with the G23 address-verifier adoption (`3c23e875`), which is not on this branch. `AgenteIndividualResidencialFormState` has no such fields here — porting them would not compile |
| `agenteWhatsapp: identityMeta.negocioWhatsapp \|\| phone` | keeps `phone` | `leonixNegocioBusinessMetaFromFormState.ts` never writes a `negocioWhatsapp` key. Reading it would be reading a value that is never persisted |

**Two additions BEYOND the sealed commit**, because instruction 1 named them and both are provably
persisted but were read back by neither surface:

- **§HOA** — `hasHoa`, `hoaFee`, `hoaFrequency`, `hoaIncludes`, `communityRules`, `petRules`,
  `rentalRestrictions`, `shortTermRentalAllowed`, `parkingRules`. `leonixBrGate12d.ts` serializes
  all nine into `Leonix:br_gate12d_v1` under the same key names the form uses.
- **§HIGHLIGHTS** — residential `destacados` rebuilt from `Leonix:highlight_slugs` by **inverting**
  the existing `AGENTE_RES_TO_HIGHLIGHT_PRESET` map, which was exported from its own module rather
  than duplicated. Commercial and land `destacados` are deliberately **not** restored: the publish
  path converts them to free-text highlight LINES only, never to slugs, so there is nothing to
  invert — fabricating checkbox state from prose would be inventing data. Their text survives in
  `detail_pairs`, which the merge contract preserves.

**Non-destructive by construction, and asserted.** Every restored value falls back to the
empty-draft default (`base.*`), never to an invented one — a listing that genuinely never had an HOA
block round-trips as "no HOA block". The verifier proves both directions: a populated row hydrates
13 identity fields away from their empty defaults **and** the brokerage name never collapses into
the listing title; a bare row hydrates to honest emptiness with the privacy default still closed.
A third check proves the shared parser and the reverse mapper produce identical values for the same
row, so they cannot drift.

Also added to the mapper's SELECT: `contact_phone`, `contact_email`, `zip` — without them the
parser's fallback chains would legitimately read empty for older thin-`business_meta` listings and
the save would null the very columns this gate protects. (Same addition the sealed commit made.)

### 16.2 Child identity integrity — `651abd4e` semantics, extended

New pure `app/lib/clasificados/bienes-raices/brChildIdentityGuard.ts`. **No second child-identity
engine**: the route already owned the canonical `br-db-child-<uuid>` convention and the group-scoped
child read, so the guard only decides whether a (draft → row) pairing is legitimate. The route's
local id parser moved into the guard, so the convention lives beside the rules that depend on it.

Two protections:

1. **RESOLUTION** — `resolveBrChildIdentity` requires the row to exist in this parent's group, and
   to match owner, category and canonical parent. It also rejects a **duplicate claim**: two drafts
   pointing at one row in the same request, where the last writer would otherwise win invisibly.
   The route previously `continue`d silently on an unresolvable id — an owner could believe a
   property saved when nothing was written. It now **fails closed** with a named reason and
   bilingual owner-safe copy.
2. **SUBSTITUTION** — the ported two-of-three city/state/ZIP rule, applied to **both** the parent
   (itself a property) and every child, and checked **before** the write so a rejected edit changes
   nothing. A same-state cross-city move (San Jose → Santa Clara) trips it; a ZIP typo fix, a
   re-normalized state or a capitalization difference does not. Incomplete data fails **open**
   toward allow — blocking a legitimate correction is also a real harm.

The scope note was re-verified against **this** branch's `buildEditablePatch`: city/state/ZIP are
the only persisted identity-relevant fields this route can change, so that is exactly what the guard
covers.

### 16.3 Sibling preservation, media independence, same-row boundary — locked by verifier

These were already correct at Gate Zero; this gate adds regression coverage so a future hydration
change cannot weaken them:

- the edit patch is asserted to contain **none** of `status`, `is_published`, `published_at`,
  `expires_at`, `owner_id`, `leonix_ad_id`, `br_inventory_group_id`,
  `br_inventory_parent_listing_id`, `inventory_role` — and to still contain the content columns;
- the update is asserted scoped by row id + owner + category, and by parent for a child;
- the child loop is asserted to contain no `.delete(`, `.upsert(` or `.insert(`;
- the route is asserted to reference no Stripe/checkout/Revenue-OS symbol at all;
- commercial truth ($399 / 1 included / +$99 / +3 / max 4 derived) and the no-recharge guard
  membership (base guarded, add-on deliberately not) are re-asserted.

Child media independence is proven behaviorally: a child hydrates with its own `photoUrls` and its
own `br-db-child-<uuid>` draft id.

### 16.4 Media warning — shared pattern adopted

`buildProposedFinalMediaSet` + `warnDroppedUnpersistableMedia("bienes-negocio-listing-edit", …)` now
run at the live edit boundary in `resolvePublicImages`. The dropped list is carried out of
`updateOneListing`, collected from the parent **and every updated child**, deduped, and returned only
when non-empty. The application client renders it on the same non-blocking success channel as the
skipped-children note. No new media engine — the shared builder and the shared warn helper do the
work, exactly as in Servicios, Restaurantes and Comida Local.

### 16.5 Owner edit truth

**A. `skippedNewChildren` — Gate Zero correction.** My Gate Zero report said "nothing was found
rendering it". **That was wrong.** `AgenteIndividualResidencialApplication` has surfaced it since
Globalization Package B (Gate B4, ledger defect D2), bilingually, pointing the owner at "Add
property". I traced the API response consumers and missed the client branch. No repair was needed;
this gate only added the dropped-media note beside it and left the existing message intact.

**B. Capacity block.** New pure `brCapacityOwnerFeedback.ts` maps every real
`br_negocio_activate_listing` blocked reason — plus the RPC's own unavailability — into what
happened / why / the legitimate next action. To carry real numbers, `BrLifecycleMutationResult`
gained three **additive optional** fields (`capacityReason`, `activeCount`, `effectiveLimit`); the
service previously collapsed every distinct outcome into two opaque codes and threw the server's
counts away, which is precisely why a capacity block reached the owner as a generic failure.

Three rules the verifier enforces:
- it renders **only** numbers the server sent; with no counts it says so rather than inventing a
  limit (asserted: no digit appears in that copy);
- it **never infers entitlement** — the inventory-boost next step appears only when the caller
  passes proven `boostAvailable`, and the lifecycle route does not claim it, so it never upsells;
- it never leaks internals (asserted: the string "rpc" cannot appear in owner copy), and produces
  distinct language per reason class rather than one generic sentence.

### 16.6 Capacity source safety — unchanged, deliberately

`br_negocio_activate_listing` remains the **only** capacity authority. Nothing was replaced,
bypassed, or given a fallback. An unreachable RPC still **fails closed**; the only change is that it
now reports *why*. The feedback module is asserted to contain no Supabase client, no `from(`, no
`count(`, and not even a reference to `BR_TOTAL_ACTIVE_PROPERTY_LIMIT` — it cannot become a second
authority even by accident.

### 16.7 Parent identity / Business Hub — untouched

No `public.businesses.id` relationship was invented; the verifier asserts none of the four modules
this gate touched queries `businesses` or introduces a `businessId`. Connection Hub remains mounted
on the preview sidebar and the canonical detail page, asserted. The canonical business-link absence
stays recorded as a later integration/product gap (§4).

### 16.8 Migration readiness — INSPECTED, NOT EXECUTED

| Field | Value |
|---|---|
| **Filename** | `supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql` |
| **Status** | AUTHORED ONLY — its own header and the TS wrapper both say so. **Not applied. Not executed by this gate.** |
| **Function** | `public.br_negocio_activate_listing(uuid, uuid, text)` (plus the Autos sibling) |
| **Wrapper** | `app/lib/listingPlans/capacityActivationRpc.ts` → `activateBrNegocioListingAtomic` |

**Dependents (5 call sites, all re-verified against the source contract this gate):**

| Dependent | Path |
|---|---|
| paid webhook activation | `brListingPaymentService.tryActivateBrListingAfterPayment:209` |
| owner resume | `brListingLifecycleService:~326` |
| owner activate-pending | `brListingLifecycleService:~372` |
| admin republish-reactivate | `app/api/admin/clasificados/listings/[id]/route.ts:129` |
| admin second site | `app/api/admin/clasificados/listings/[id]/route.ts:198` |

**Expected failure mode BEFORE application (current):** the RPC call returns a Postgres
"function does not exist" error → `rpcResult.ok === false` → every path above refuses to activate.
Fails **closed**: no free activation, no capacity bypass, no partial write. The owner-facing
difference this gate makes is that the refusal is now explained
(`capacity_rpc_unavailable` → "we couldn't verify your inventory right now… you weren't charged and
nothing was lost") instead of a generic failure.

**Expected behavior AFTER application:** the function serializes per commercial group via a
transaction-scoped advisory lock, re-derives owner/parent/group from freshly locked rows, derives
the effective limit from `listing_package_entitlements` (base 1, +3 with an active
`br_inventory_pack_monthly`), independently enforces the grace/suspended/canceled subscription rule
against `leonix_subscription_records`, and returns `{activated, idempotent, blocked_reason,
active_count, effective_limit}`. Re-verified this gate: the migration still returns every
`blocked_reason` the owner-feedback module handles, and the wrapper still calls the same function
name. **Applying it remains an explicit, owner-authorized integration/runtime step.**

### 16.9 Validation

| Check | Result |
|---|---|
| `verify-bienes-negocio-gate1-identity.ts` (new) | **33/33 PASS** |
| `verify-comida-local-gate1` / `gate2` | 49/49 · 45/45 PASS |
| `verify-restaurantes-gate1` / `gate2` | PASS / PASS |
| `verify-servicios-gate1` / `gate2` | PASS / PASS |
| ESLint over the changed scope | **0 new errors.** One error in `brListingLifecycleService.ts` (`BR_LIFECYCLE_MUTATION_KEYS` imported and re-exported) was **proved pre-existing** by linting the HEAD version of that file in isolation — same error, line 34 — before this gate touched it |

**DEFERRED TO INTEGRATION GATE:** `npm run typecheck`, `npm run build`, owner-browser QA, and
**applying the capacity RPC migration** (§16.8).

### 16.10 Remaining Bienes Negocio source gaps after this gate

| Gap | Severity | Note |
|---|---|---|
| capacity RPC migration unapplied | **P0** | §16.8 — operational step; nothing in this lane activates until it runs |
| no scheduler cranks the subscription sweep | P1 | platform-wide, unchanged |
| JSON-LD is `ClassifiedAd` with a relative URL; no real-estate type, no facets, no breadcrumb | P2 | Gate 2 scope |
| BR entirely absent from the sitemap | P2 | Gate 2 scope |
| Admin shows no capacity / entitlement / payment truth | P2 | Gate 2 scope |
| no BR-parent → `public.businesses.id` linkage; Business Tools eligibility unprovable | P2 | owner/product decision, explicitly out of scope here |
| commercial/land `destacados` cannot round-trip (persisted as prose only) | P3 | §16.1 — needs a publish-side slug vocabulary before it can be restored honestly |
| `sourceUpdatedAt` captured, precedence unwired | P3 | unchanged |
| 26 dead modules + 35 historical audit `.md` in the source tree | P4 | cleanup gate, after integration |

---

## 17. GATE BIENES-NEGOCIO-2 — DISCOVERY + ADMIN OPERATIONAL TRUTH

One gate: real-estate structured data, the DB-backed sitemap section, and the Admin commercial/
capacity truth this lane was missing. Verifier
`scripts/verify-bienes-negocio-gate2-discovery.ts` — **38/38 PASS**. **No migration applied.**
Saved Search, Related Listings, pricing, the capacity authority and the Application/Preview surfaces
were not touched. Servicios, Restaurantes, Comida Local and BIENES-NEGOCIO-1 all still pass.

### 17.1 CORRECTION to the Gate-Zero MRI — BR emitted NO structured data at all

§12 of this document recorded: *"the canonical detail page emits `@type: "ClassifiedAd"` with a
relative `url`"*. Re-tracing for this gate shows that is **wrong**. The
`listing.category === "bienes-raices"` branch in `app/(site)/clasificados/anuncio/[id]/page.tsx`
**returns early**, before the generic `ClassifiedAd` block further down the same file. Bienes Raíces
therefore emitted **no JSON-LD whatsoever** — the `ClassifiedAd` block belongs to the fall-through
categories only.

The practical difference: this was not "weak schema to upgrade", it was "no schema to add". The
generic block is left untouched for the categories that do use it (asserted).

Worth recording for whoever fixes that generic block later: it hardcodes `addressRegion: "CA"` and
puts the **formatted price label** ("$850,000") in `price`, which must be a number. This gate's
builder repeats neither mistake, and the verifier asserts the builder contains no `"CA"` and no
`"US"` literal at all.

### 17.2 Real-estate JSON-LD — the honest structure, not the MRI's guess

The MRI named `RealEstateListing`. That type is real, **but it is a subtype of `WebPage`** — it
describes the listing PAGE and has no `numberOfBedrooms`, `numberOfBathroomsTotal` or `floorSize`.
Hanging those on it would be invalid vocabulary. So the emitted shape is two nodes:

```
RealEstateListing (the page)  --mainEntity-->  the property itself
```

The property node type comes from the category's OWN persisted `Leonix:results_property_kind`
facet, never from prose:

| Facet | Node type | Why |
|---|---|---|
| `casa` | `SingleFamilyResidence` | an `Accommodation` — bedrooms/bathrooms/floorSize are valid |
| `departamento` | `Apartment` | an `Accommodation` — same |
| `terreno` | `Place` | land is not an Accommodation |
| `comercial` | `Place` | schema.org has no commercial-property type, and `LocalBusiness` would assert an operating business that a for-sale building is not |
| absent | `Place` | no facet, no guess |

Because `Place` is not an `Accommodation`, room and floor-area properties are **omitted** for
terreno/comercial rather than emitted where the vocabulary does not define them — asserted.

**Price** lives on an `Offer` as a real number (from the row's numeric `price`, exposed this gate as
`Listing.priceNumber`), with `priceCurrency`, a `businessFunction` of Sell/LeaseOut from the real
`Leonix:operation` facet, and `availability` **only** for the two seller statuses that have an
honest schema.org equivalent — `disponible` → InStock, `vendido` → SoldOut. `bajo_contrato` and
`pendiente` are omitted rather than approximated. No price → no `Offer` node at all.

**Lot area** is expressed as a labelled `PropertyValue` in `additionalProperty`, because `lotSize`
is not schema.org vocabulary on `Accommodation`/`Place` — an invented field name would be worse
than an explicit one.

**Privacy — three rules, all asserted:**
1. `streetAddress` is emitted only when `Leonix:br:show_exact_address` is genuinely true; the page
   passes `brShowExactAddress ? gate12d.streetAddress : null`.
2. City, region, postal code and country are the category's own declared public set — the listing
   contract states verbatim that without the opt-in, public surfaces may still use "city / zona /
   CP". Region and country come from `Leonix:state` / `Leonix:country` and are **omitted when
   absent**, never hardcoded.
3. The seller node is business identity only (`RealEstateAgent` with name/telephone/url, the agent
   as `employee`), and only when a real name exists. No personal address, ever.

**No ratings, structurally** — the builder has no rating or review parameter at all, so no
owner-entered value can reach `aggregateRating` here or via a future caller.

`identifier` uses the real `leonix_ad_id`, falling back to the row id, and is omitted when neither
exists — never a generated identifier. Plus the shared `breadcrumbJsonLd`, ES/EN aware.

### 17.3 Sitemap — the fifth DB-backed section, with the parent gate

BR was entirely absent from `app/sitemap.ts`. It is now composed the same way as the Recursos,
Servicios, Restaurantes and Comida Local sections: in the route module, from a category reader,
never inside the pure `buildLeonixSitemap` contract and never a direct table query.

**Why a new server reader was needed** (and why it is not a second engine): unlike the other three
categories, BR's public browse is a **BROWSER** reader (`fetchBrPublishedListingsBrowser`,
RLS-scoped). A server route cannot call it. `brPublishedListingsServer.ts` therefore reads rows and
then applies the category's **existing shared predicates verbatim**:

- `isListingRowActiveAndPublishedForBrowse` — the shared row-level public rule;
- `collectBrChildParentIds` + `filterBrRowsByActiveParent` — the shared Gate G.2.3.4 parent-liveness
  gate, imported unchanged.

The verifier asserts the module contains **no re-expression** of the gate logic, and behaviorally
proves the gate itself: a live child is kept under a live parent and excluded when the parent is
suspended, paused, unpublished, differently-owned, wrongly-roled, or missing entirely.

Safety: a failed row read **or a failed parent read** returns `ok:false` → the section emits nothing
rather than a partial list that could advertise an orphan child; the whole section is
try/catch-isolated. URLs are the canonical `leonixLiveAnuncioPath(id)` — the same path the JSON-LD
`url`, the Saved Search delivery resolver and the `/clasificados/bienes-raices/anuncio/[id]` alias
all resolve to. Ceiling is an explicit `BR_SITEMAP_MAX = 2000`.

### 17.4 Admin ops — capacity, entitlement and payment truth

Gate Zero found the BR Admin queue showed rows but no commercial truth, on a lane whose entire
product is a capacity contract. New READ-ONLY projection `app/admin/_lib/bienesNegocioCommercialOps.ts`
plus an additive `BienesNegocioOpsPanel` on the **existing** queue.

**No second commercial model.** Every value comes from the same canonical readers the write path
uses — `hasActiveAddonEntitlement`, `loadSubscriptionStatusForParent`, `countActiveBrInventory`,
all three exported read-only from `commercialWriteGuard.ts` this gate (they were module-private).
The verifier asserts the projection **never queries `listing_package_entitlements` or
`leonix_subscription_records` itself**, never references the pricing matrix, and contains no
`.update(`/`.insert(`/`.upsert(`/`.delete(`.

Surfaced per parent: canonical listing id + Leonix ad id, inventory role, group id, parent
status/publication, **base entitlement** (`br_agent_monthly`), **boost entitlement**
(`br_inventory_pack_monthly`), **capacity** (active count / effective limit, with `incl 1 · pack +3`
and an explicit "at limit" flag), **subscription state**, and the child list.

**Truth states are real, and zero is never a stand-in.** Per Admin OS Book §6, every field carries
`REAL | PARTIAL | NEEDS_PROOF | BROKEN | UNAVAILABLE`. Asserted: `activeCount`, `active` and
`effectiveLimit` are all nullable and the panel renders a truth badge instead of a value when the
source is unproven — no `|| 0` anywhere. Two deliberate degradations worth naming:
- boost entitlement unproven → the **effective limit is `null`** and capacity renders `n / ?` with a
  PARTIAL badge, because a limit cannot be stated without knowing the boost;
- no subscription record linked → **PARTIAL** with "payment state cannot be proven from the listing
  alone", never "unpaid".

Paid state is never inferred from listing status, and entitlement never from pricing configuration —
both asserted.

### 17.5 Parent → child navigation

Children are resolved by canonical `br_inventory_parent_listing_id` + `inventory_role`, and each row
links to the **existing** `/admin/workspace/clasificados/listings/[id]/edit` destination. No new
child dashboard, no duplicate Admin route family — asserted. The href builder lives in a pure
`bienesNegocioAdminHrefs.ts` (a URL builder has no business being `server-only`), which the
projection re-exports so callers keep one import surface.

### 17.6 The unapplied capacity authority is surfaced, honestly

Admin must not imply the lane is healthy while activations cannot execute. The panel leads with a
**Capacity authority** banner whose state comes from a real probe: `br_negocio_activate_listing` is
called with an **all-zero UUID that can match no row**, so the only outcomes are "the function does
not exist" or "the function ran and found nothing". Nothing is read, locked, written, activated or
bypassed.

- function absent → **UNAVAILABLE**, with an operator-safe explanation that names the unapplied
  migration (`20260810120000`) and states the consequence: paid activation, owner resume/reactivate
  and Admin republish all refuse and **fail closed** — no listing activates, no capacity is
  bypassed, and no customer is charged for an activation that did not happen.
- The raw Postgres error is **never** shown (asserted: `error.message` does not appear in the probe).
- The write path still routes through the RPC (asserted) — this gate added no fallback.

### 17.7 Owner Command Center — contract verified, architecture untouched

No OCC file was modified. Verified only that the launch-lifecycle source still exposes the data the
Bible's §12/§18 Bienes Negocio contract depends on: inventory capacity (`computeBrPropertyInventoryCounts`
+ the entitlement-sourced `upgradeActive`), payment/entitlement (the same canonical readers this gate
now also projects into Admin), and same-row child management (the Gate-1 boundary, re-asserted here).

**`public.businesses.id` linkage: still absent, still NOT invented.** The verifier asserts none of
this gate's four new/changed modules queries `businesses` or introduces a `businessId`. It remains a
cross-workstream product gap: Business Tools authorizes on `(businessId, userId)` and a BR Negocio
parent has no such id, so Business Tools eligibility for this lane cannot be proven from source.

### 17.8 Discovery continuity — the connected circuit

Asserted end to end: paid/entitled parent → capacity truth (Admin projection from canonical
entitlement + count) → published child → the parent visibility gate → results/Saved Search → public
detail → Related Listings → canonical structured data → sitemap → the same canonical parent/child
ids on both the Owner and Admin surfaces.

Two structural proofs hold that circuit together:
- **one canonical detail path**: `leonixLiveAnuncioPath` is the single builder used by the JSON-LD
  `url`, the sitemap entry and the Saved Search delivery resolver;
- **one parent gate**: `isBrChildParentGateSatisfied` / `filterBrRowsByActiveParent` is asserted
  present on all **four** surfaces — browser browse, public detail, Saved Search eligibility, and
  the new sitemap reader.

Saved Search and Related Listings were **not rebuilt and not touched** — asserted by checking their
five modules contain no reference to this gate.

### 17.9 Cleanup prep — untouched

The 26 dead modules and 35 historical audit `.md` files are unchanged; the verifier asserts three of
the most notable dead modules still exist. Nothing deleted, nothing moved.

### 17.10 Validation

| Check | Result |
|---|---|
| `verify-bienes-negocio-gate2-discovery.ts` (new) | **38/38 PASS** |
| `verify-bienes-negocio-gate1-identity.ts` | 33/33 PASS |
| `verify-comida-local-gate1` / `gate2` | 49/49 · 45/45 PASS |
| `verify-restaurantes-gate1` / `gate2` | PASS / PASS |
| `verify-servicios-gate1` / `gate2` | PASS / PASS |
| ESLint over the changed scope | **0 errors** |

**DEFERRED TO INTEGRATION GATE:** `npm run typecheck`, `npm run build`, owner-browser QA, and
**applying the capacity RPC migration** — still the single highest-value action for this category.

### 17.11 Remaining Bienes Negocio source gaps after this gate

| Gap | Severity | Note |
|---|---|---|
| capacity RPC migration unapplied | **P0** | operational; Admin now states this honestly instead of implying health |
| no scheduler cranks the subscription sweep | P1 | platform-wide, unchanged |
| no BR-parent → `public.businesses.id` linkage; Business Tools eligibility unprovable | P2 | cross-workstream product decision, deliberately not invented |
| the GENERIC `ClassifiedAd` block hardcodes `addressRegion: "CA"` and puts a formatted label in `price` | P2 | affects the fall-through categories, not BR — out of this gate's scope, recorded in §17.1 |
| commercial/land `destacados` cannot round-trip (persisted as prose only) | P3 | unchanged from Gate 1 |
| `sourceUpdatedAt` captured, precedence unwired | P3 | unchanged |
| Admin moderation is generic, not parent/child-aware | P3 | out of scope here |
| 26 dead modules + 35 historical audit `.md` in the source tree | P4 | cleanup gate, after integration |
