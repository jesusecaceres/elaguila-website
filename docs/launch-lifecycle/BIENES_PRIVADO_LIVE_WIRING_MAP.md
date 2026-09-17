# BIENES RAÍCES PRIVADO / FSBO — LIVE WIRING MAP (AUTHORITATIVE)

Gate Zero + live-wiring MRI. Traced from runtime-consumed source only. File existence was never
accepted as proof of live. **No fixes implemented. Nothing deleted. No migration applied. No branch
merged.**

Classification vocabulary (Launch Lifecycle master §14): `LIVE` · `LIVE-SHARED` ·
`BUILT-NOT-WIRED` · `DUPLICATE-REFERENCED` · `DEAD-ZERO-CONSUMER` · `HISTORICAL` · `UNKNOWN`.
Admin controls use the Admin OS Book §7 vocabulary; Owner capabilities the OCC Bible §34 vocabulary.

Servicios, Restaurantes, Comida Local and **Bienes Raíces Negocio** are SOURCE-LOCKED and were not
reopened.

---

## 0. GATE STATUS

| Gate | Scope | Status |
|---|---|---|
| **BIENES-PRIVADO-0** | Gate Zero + live wiring MRI | **COMPLETE (this document)** |
| **BIENES-PRIVADO-1** | Fixed-term lifecycle + private-seller safety | **COMPLETE (see §14)** |
| **BIENES-PRIVADO-2** | Related Listings, discovery continuity, Owner/Admin truth | **COMPLETE (see §15)** |

---

## 1. WORKTREE TRUTH

| Field | Value |
|---|---|
| Worktree | `C:\projects\elaguila-website-launch-lifecycle` |
| Branch | `completion/launch-lifecycle-2026-09-09` |
| HEAD | `6372aa22` (Gate BIENES-NEGOCIO-2) |
| Accepted below it | `56f0af77` · `9c73afee` · `51b7a941` · `451cda64` · `9d9753a0` · `2d28624c` · `849b45ea` · `a0a47839` (`origin/main`) |
| Working tree at trace time | clean |
| Contract branches | OCC `ea99e57c` and the Admin OS pass are still **NOT** in this branch (§1.1 of the Negocio map) — read as contracts only |

---

## 2. PATH: CLEAN — and much smaller than Negocio

**~20 Privado-specific files**, against Negocio's 235-file footprint. Privado is a thin lane on top
of shared BR infrastructure. No competing application, no competing preview, no competing detail
renderer, no second publish path.

| Tree | Role |
|---|---|
| `publicar/bienes-raices/privado/` | application, form, schema, draft/media utils, NorCal zones |
| `bienes-raices/preview/privado/` | preview page/view/client + FSBO checkout helper |
| `bienes-raices/listing/BienesRaicesPrivadoLiveDetailShell.tsx` + `mapBrListingRowToPrivadoPreviewVm.ts` | public detail |
| `/publicar/bienes-raices/privado` | public entry alias rendering the same application |

### 2.1 Shared vs Negocio-only vs Privado-only — the distinction this gate had to make

| Layer | Shared BR | Negocio-only | Privado-only |
|---|---|---|---|
| listing table + `detail_pairs` contract | ✅ `listings`, `leonixRealEstateListingContract` | — | — |
| canonical detail route | ✅ `/clasificados/anuncio/[id]` | — | — |
| publish core | ✅ `leonixPublishRealEstateListingCore` | — | — |
| **published→form-state parser** | ❌ | ✅ `parseBienesAgenteResidencialPublishedState` (Gate BN-1) | ✅ *none* — see §4 |
| edit route | ❌ | ✅ `/api/clasificados/bienes-raices/listing-edit` (**rejects Privado**, §4.1) | ✅ generic dashboard editor |
| lifecycle service | ❌ | ✅ `brListingLifecycleService` (**rejects Privado**, §5.2) | ✅ client-side patches |
| capacity RPC | ❌ | ✅ `br_negocio_activate_listing` | ✅ **none — and none needed** |
| fulfillment | ❌ | `revenueBienesNegocioFulfillment` | `revenueBienesFsboFulfillment` |
| parent/child model | ❌ | ✅ | ✅ **absent, correctly** |
| detail shell | ❌ | `…NegocioLiveDetailShell` | `…PrivadoLiveDetailShell` |
| JSON-LD + sitemap (Gate BN-2) | ✅ **and it really does cover Privado** — §7 | | |
| Saved Search / Related | ✅ engine shared; Related is group-keyed so FSBO gets none — §7 | | |

**The single most important consequence:** Bienes Negocio's P0 (the unapplied capacity RPC) does
**not** touch Privado at all. FSBO activation is a plain compare-and-set update with no RPC. Privado
is not blocked by that migration.

### 2.2 DEAD-ZERO-CONSUMER — 6 Privado modules (re-proved, NOT deleted)

Re-checked specifically for **Privado** consumers, as instructed:

| Module | Consumers | Note |
|---|---|---|
| `privadoPreviewMapStub.ts` | 0 | scaffolding |
| `privadoFormStub.ts` | 0 | scaffolding |
| `privadoDraftStub.ts` | 0 | scaffolding |
| `sections/PrivadoApplicationNotice.tsx` | 0 | scaffolding |
| `preview/privado/components/BrPrivadoGalleryLightbox.tsx` | 0 | superseded |
| `preview/privado/model/buildBienesRaicesPrivadoTemplateVm.ts` | **0 real** | its only mention is a *comment inside `privadoPreviewMapStub.ts`* — a dead file referenced by a dead file's prose |

**Special attention, as instructed — none of the four risk classes is present, with one caveat:**

| Risk | Finding |
|---|---|
| hardcodes exact-address visibility | **YES — `buildBienesRaicesPrivadoTemplateVm.ts` sets `mostrarDireccionExacta: true`.** It is dead (0 consumers), so it is harmless today, and this is a concrete reason **never to revive it**. Recorded, not deleted. |
| bypasses Revenue OS | none among the Privado dead modules. (The BR-wide dead `brPublishCheckoutClient.ts` posting to the legacy `/api/clasificados/leonix/stripe/checkout` was already recorded in the Negocio map; it is BR-generic, not Privado-specific, and must stay dead.) |
| creates a second publish path | none — every Privado publish goes through `publishLeonixListingFromBienesRaicesPrivadoDraft` → the shared core |
| stale fixed-term pricing/duration | none — the live checkout helper reads price **and** duration from the Revenue OS matrix, with `?? 45` / `?? 0` only as a null-guard |

Nothing revived. Nothing deleted.

---

## 3. EXACT LIVE END-TO-END PATH

```
CHECKPOINT     /clasificados/publicar/bienes-raices
               BienesRaicesPublicarHubClient -> getBienesRaicesCheckpointCards
               Privado card -> BR_PUBLICAR_PRIVADO                                    LIVE-SHARED
  |
APPLICATION    /clasificados/publicar/bienes-raices/privado                            LIVE
               (public entry alias /publicar/bienes-raices/privado renders the same)
               BienesRaicesPrivadoApplication -> BienesRaicesPrivadoForm
               exit guard: useLeonixPublishFlowExitClear                                LIVE-SHARED
  |
DRAFT          bienesRaicesPrivadoDraft + bienesRaicesPrivadoDraftMedia (IDB)           LIVE
               brPrivadoMediaCompress · brPrivadoNorCalZones
  |
PREVIEW        /clasificados/bienes-raices/preview/privado                              LIVE
               BienesRaicesPrivadoPreviewClient
  |
PAGAR          publishLeonixListingFromBienesRaicesPrivadoDraft(activationMode:
               "pending_payment")  -> listings row status="pending", is_published=false LIVE
               cached-pending reuse: a retry re-validates the existing pending row
               instead of inserting a second one                                        LIVE
               newsletter capture (CHECKOUT_NEWSLETTER_SOURCES.bienesFsbo)              LIVE-SHARED
               startRevenueCategoryCheckout({...BIENES_RAICES_FSBO_CHECKOUT})           LIVE-SHARED
  |
REVENUE OS     matrix br_fsbo_45d = 4999 cents, one_time, durationDays 45               LIVE-SHARED
               promo validated server-side (validateRevenuePromoForCheckout)
  |
WEBHOOK        /api/revenue-os/webhook -> stripeEventLedger -> entitlement
               -> activatePaidBienesFsboListingFromRevenueOs                            LIVE-SHARED
  |
ACTIVATION     listings.update({status:"active", is_published:true, published_at,
                 listing_json.br_publish.payment_status="paid"})
               .eq(id).eq(category).eq(seller_type "personal")
               .eq(status "pending").eq(is_published false)                             LIVE
               *** writes NO expires_at — see §5.1, P0 ***
  |
RESULTS        /clasificados/bienes-raices/resultados
               fetchBrPublishedListingsForBrowse (browser/RLS)                          LIVE
               SavedSearchButton mounted                                                LIVE-SHARED
  |
PUBLIC DETAIL  /clasificados/anuncio/[id]  -> resolveBrListingLane -> "privado"
               -> BienesRaicesPrivadoLiveDetailShell
                  -> mapBrListingRowToPrivadoPreviewVm                                  LIVE
               Translate Ad control mounted for BOTH lanes                              LIVE-SHARED
               JSON-LD + breadcrumb (Gate BN-2) emitted BEFORE the lane split            LIVE-SHARED
  |
DASHBOARD      /dashboard/mis-anuncios -> LeonixRealEstateListingManageCard
               FSBO edit -> /dashboard/mis-anuncios/[id]/editar  (id-scoped, real)       LIVE
               FSBO preview -> leonixLiveAnuncioPath(id)                                 LIVE
               ListingRenewalAction mounted — but never fires (§5.3)                     BUILT-NOT-WIRED
  |
ADMIN          /admin/workspace/clasificados/bienes-raices (generic ops queue)           LIVE
               AdminListingMonetizationSummary reads expires_at -> always empty (§8)      NEEDS_DATA
  |
EDIT/REPUBLISH generic editor -> applyOwnerListingPatch
               .eq(id).eq(owner_id) + zero-row detection                                 LIVE
  |
EXPIRATION     *** nothing expires an FSBO listing — §5.1 ***                            NOT WIRED
RENEWAL        *** no FSBO renewal path exists — §5.3 ***                                NOT WIRED
ANALYTICS      listingEngagementRecorder + selfEngagementGuard on the Privado shell      LIVE-SHARED
```

---

## 4. IDENTITY / HYDRATION TRUTH

**CANONICAL LISTING ID: `listings.id` (uuid)**, with `leonix_ad_id` as the public identifier. No
parent, no group, no child — FSBO is a single flat row, exactly as the product says.

### 4.1 The shared Gate BN-1 parser does NOT serve Privado — and that is not a defect here

`parseBienesAgenteResidencialPublishedState` has exactly two consumers, both Negocio
(`BienesRaicesNegocioLiveDetailShell`, `bienesPublishedToAgenteApplicationDraft`). Privado has its
own published-row mapper, `mapBrListingRowToPrivadoPreviewVm` — but that maps
**published row → public display VM**, never → form state.

`/api/clasificados/bienes-raices/listing-edit` explicitly rejects Privado:
`if (contract.branch !== "bienes_raices_negocio" && seller_type !== "business") → 422 lane_mismatch`.

**So there is no published→form-state reverse mapper for Privado at all.** The critical consequence:
the Gate BN-1 P0 — an empty form state overwriting `business_name` / `business_meta` /
`contact_phone` / `contact_email` — **structurally cannot occur in this lane**, because no
form→publish rebuild ever runs against a published FSBO row.

### 4.2 What the FSBO edit path actually is

`/dashboard/mis-anuncios/[id]/editar` — a real, id-scoped generic editor:

- loads with `select("*").eq("id", id).eq("owner_id", u.id)` — real row, ownership-scoped;
- saves through `applyOwnerListingPatch` → `.update(patch).eq("id").eq("owner_id").select("id")`
  with **explicit zero-row detection** (`listing_not_found_or_forbidden`) — a wrong id or another
  user's row can never look like success;
- patches only: `images`, `detail_pairs` (**upserted from the current row's real pairs**, never a
  partial replace), title/description/price via the category adapter, `status`, soft-archive;
- **never** patches `id`, `leonix_ad_id`, `owner_id`, `published_at`, `expires_at`, `category`,
  `seller_type`, or `is_published`.

**SAME-ROW REPUBLISH: PROVEN. NO-RECHARGE: PROVEN** — the editor contains no Stripe/Revenue-OS call
of any kind, and `br_fsbo_45d` is deliberately excluded from
`REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS` (that guard is for recurring base packages;
`revenueActiveEntitlementGuard.ts:53` names `br_fsbo_45d` among the fixed-term packages it must not
block, because a genuine renewal has to be able to charge again).

**PUBLISHED→EDIT HYDRATION: PARTIAL** — the *row* is fully loaded and the columns the editor exposes
round-trip correctly. What does **not** round-trip is the rich Privado form state (gate12d
HOA/community block, highlights, seller block, CTA preferences): those live in `detail_pairs` and
`listing_json`, are preserved by the upsert-merge, but are **not editable** after publish. The
Privado application form has no edit mode. That is a capability gap, not a data-loss defect.

---

## 5. COMMERCIAL / FIXED-TERM TRUTH

| Fact | Source | Status |
|---|---|---|
| package key `br_fsbo_45d` | `revenuePricingMatrix` + `BIENES_RAICES_FSBO_PACKAGE_KEY` (declared identically in the checkout helper and the fulfillment module) | **PROVEN** |
| **$49.99** server-owned | matrix `priceCents: 4999`, `billingMode: "one_time"`; the client sends only `{category, packageKey}` | **PROVEN** |
| **45-day** duration | matrix `durationDays: 45`; the checkout checkpoint reads it (`packageDef?.durationDays ?? 45`) and renders it in the line item | **PROVEN as configuration** |
| webhook authority | `activatePaidBienesFsboListingFromRevenueOs` behind `stripeEventLedger` idempotency | **PROVEN** |
| failed/cancelled checkout cannot publish | the row is inserted `status:"pending", is_published:false`; only the webhook flips it, behind a 5-predicate compare-and-set | **PROVEN** |
| correct entitlement | `listing_package_entitlements` row with `ends_at` from `computeEndsAt(startsAt, {billingMode:"one_time", durationDays:45})` → **+45 days** | **PROVEN** |
| **`expires_at` on the listing row** | **nothing writes it** | **NOT WIRED — §5.1** |
| expiration enforcement | none | **NOT WIRED — §5.1** |
| renewal/reactivation | none | **NOT WIRED — §5.3** |
| renewal creates no duplicate listing | n/a today; the pattern to adopt extends the same row (§5.4) | — |

### 5.1 P0 — THE 45-DAY TERM IS SOLD, PERSISTED IN THE ENTITLEMENT, AND NEVER ENFORCED

The term genuinely exists in `listing_package_entitlements.ends_at`. It never reaches the listing row
and is never enforced on any public surface:

- `activatePaidBienesFsboListingFromRevenueOs` patches `status`, `is_published`, `published_at`,
  `updated_at`, `listing_json` — **no `expires_at`**.
- A repo-wide search finds **no writer of `listings.expires_at`** in any BR path.
- `isListingRowActiveAndPublishedForBrowse` — the shared public rule used by browse, the sitemap
  reader and Saved Search eligibility — reads **only** `status` and `is_published`. It has no term
  concept at all.

**Net effect: a paid 45-day FSBO listing stays publicly live forever.** This is the mirror image of
the Negocio P0: Negocio fails **closed** (nothing activates), Privado fails **open** (nothing
expires). Both are launch-blocking; this one is a revenue-integrity problem rather than a
functionality one.

### 5.2 One missing write collapses four surfaces at once

Everything downstream of `expires_at` is **already built and already wired** — and inert only
because the value is always null:

| Surface | Consumes `expires_at` | Behavior today |
|---|---|---|
| owner dashboard lifecycle | `resolveListingLifecycle` | resolves to the "no expiry" branch |
| owner renewal CTA | `ListingRenewalAction`, already mounted on the BR manage card | never renders |
| Admin monetization | `AdminListingMonetizationSummary` (mounted in `AdminListingsTable`) | always blank |
| public browse | would be gated by the sealed `isBrRowWithinTerm` (§10) | no-op |

So this is **one missing write**, not four missing features.

### 5.3 Renewal / reactivation — absent, but the engine exists

There is no FSBO renewal or reactivation path anywhere (search for FSBO + renew/reactivate returns
nothing). `ListingRenewalAction` is mounted but unreachable for the reason above.

### 5.4 The proven pattern is already on this branch — this is an ADOPT, not new work

`computeFixedDayRenewalExpiresAt` lives in `app/lib/listingLifecycle/resolveListingLifecycle.ts` and
is **already consumed by two sibling fixed-term lanes**: `revenueRentasFulfillment` ($24.99/30d) and
`revenueClasesFulfillment` ($24.99/30d). Rentas' fulfillment shows the whole shape FSBO needs — set
`expires_at` at activation, and on a renewal **extend from the current expiry on the same row**
rather than inserting a new listing. BR FSBO is the third fixed-term lane and simply never adopted
it.

### 5.5 Owner-side status write has no server authority — P2

`brListingLifecycleService` (the server-authorized BR lifecycle) requires `seller_type === "business"`,
so **Privado is excluded from it**. FSBO lifecycle is client-side `applyOwnerListingPatch` only. In
particular `markStatus("active" | "sold")` writes `status` with **no from-status validation and no
server-side authority** — so an unpaid `pending` FSBO row (which does reach the owner's editor, since
it loads by id+owner with no status filter) can be set to `status:"active"`.

**It is not currently a payment bypass**, because `markStatus` does not touch `is_published` and the
public rule requires `is_published !== false`. That is defense-in-depth by accident, not by design:
the moment any code derives `is_published` from `status`, it becomes a live bypass. Recorded as a
real risk, not a live defect.

---

## 6. PRIVATE SELLER SAFETY

| Item | Finding |
|---|---|
| seller identity | `state.seller.{nombre, correo, telefono}` — personal, no business identity, no `business_meta` written for this lane |
| **no business capabilities leak** | **PROVEN.** No parent/child, no inventory tools, no capacity RPC, no Business Hub/Business Tools assumption. The Negocio ops panel filters `inventory_role === "main"`, so FSBO rows are correctly excluded from it. The FSBO checkout copy states "no inventory / no brokerage, office or agent inventory is included" |
| **exact-address privacy** | **PROVEN today — for a reason worth stating precisely (§6.1)** |
| directions/maps | `mapsUrl` = the persisted `Leonix:br:map_url` when present, else `googleMapsSearchUrl(humanLocation)` where `humanLocation` resolves to **city** (§6.1) |
| phone/email | `contact_phone` / `contact_email`; `mailtoHref` validates the address before emitting |
| **WhatsApp** | **PARTIAL — a real defect, §6.2** |

### 6.1 Address privacy — safe, but by absence rather than by a gate

`mapBrListingRowToPrivadoPreviewVm` computes
`showExact = detail_pairs["Leonix:br:show_exact_address"] === "true"` and exposes it as
`vm.mostrarDireccionExacta`. But:

1. **Nothing reads that VM field.** A repo-wide search finds `mostrarDireccionExacta` only in *form*
   controls (Privado form, Negocio step, Rentas form) — **no public renderer consumes it**.
   BUILT-NOT-WIRED on the Privado public surface. (Same class as the Restaurantes defect repaired in
   Gate RESTAURANTES-1: a reachable control that changes nothing.)
2. `humanLocation = detail_pairs["Ubicación"] ?? listing.city` is read **unconditionally**, and feeds
   the public maps link.

The reason there is no leak today: **no publish path writes a detail pair labelled `"Ubicación"`** —
verified repo-wide. So `humanLocation` always falls back to `listing.city`, and city-only is the
category's declared public set.

**Verdict: PROVEN today, structurally fragile.** The owner's privacy toggle is honoured only because
street text never reaches the reader — not because the reader gates on it. If any future publish path
writes a street-level `"Ubicación"` pair, this reader leaks it regardless of the toggle.

### 6.2 WhatsApp — P1, the same defect repaired in three other categories

```ts
function waHref(phoneDigits: string): string | null {
  const d = digitsOnly(phoneDigits);
  return d.length >= 10 ? `https://wa.me/${d}` : null;
}
```

A bare digit strip with **no country code and no E.164 ceiling**. A US number entered as
`(408) 555-1234` becomes `https://wa.me/4085551234` — missing the `1`, i.e. a public WhatsApp CTA
that does not reach the seller. `app/lib/whatsapp/internationalWhatsApp.ts` (ported in Gate
SERVICIOS-1, adopted by Comida Local in Gate COMIDA-LOCAL-1) has **zero references** in this lane.

---

## 7. DISCOVERY TRUTH — what Gate BIENES-NEGOCIO-2 really covers

Proven by consumption, not assumed:

| Tool | Covers Privado? | Evidence |
|---|---|---|
| **JSON-LD** | **YES — PROVEN** | the BR branch computes `brJsonLd` at line ~1490, **before** the `brLane === "privado"` split at ~1542, so both lanes emit it. The builder omits business seller fields when absent, which is exactly right for FSBO |
| **Sitemap** | **YES — PROVEN** | `brPublishedListingsServer` filters on category + `is_published` + `status` and applies the parent gate, which passes any non-child row unconditionally. **No `seller_type` filter** → FSBO rows are included |
| canonical detail URL | YES | one `leonixLiveAnuncioPath` shared by JSON-LD, sitemap and Saved Search delivery |
| **Saved Search** | **PARTIAL** | the engine is shared and the CTA is mounted on the shared results page; the adapter even carries a real `sellerType: "privado" \| "negocio"` facet. But `certifyBienesRaicesPublicEligibleListing` mirrors the browse rule — which has **no term check** — so an expired FSBO listing would still match and notify (§5.1) |
| **Related Listings** | **PARTIAL — absent for FSBO, and honestly so** | `RelatedBrAgentProperties` is mounted only by the **Negocio** shell; the Privado shell mounts none. The reader is keyed on `br_inventory_group_id` / `br_inventory_parent_listing_id`, which an FSBO row does not have. So there is no "related agent portfolio" for a private seller — which is correct — but there is also **no city/type-based FSBO rail**, which is a genuine (P3) gap |
| results filters | LIVE-SHARED | shared BR results client |
| **expiry consistency across surfaces** | **CONSISTENT — consistently wrong.** Results, detail, Saved Search and sitemap all use the same term-blind rule, so none of them hides an expired FSBO listing. One shared repair fixes all four |

---

## 8. OWNER COMMAND CENTER TRUTH (Bible as contract)

Classified against **this** branch. The OCC certified checkpoint is not merged here (§1).

| Bible requirement (§12 BR Privado/FSBO) | This branch | Class |
|---|---|---|
| one canonical manage doorway | `LeonixRealEstateListingManageCard` → `/dashboard/mis-anuncios/[id]/editar` | **LIVE** |
| edit | real, id-scoped, ownership-scoped, zero-row-checked | **LIVE** (capability-partial, §4.2) |
| public view | `leonixLiveAnuncioPath(id)` | **LIVE** |
| analytics | engagement recorder + self-engagement guard on the Privado shell | **LIVE-SHARED** |
| lifecycle | client-side patches only; no server authority for this lane | **PARTIAL** (§5.5) |
| **expiration / renewal** | UI mounted, data never written | **BUILT-NOT-WIRED** (§5.2) |
| payment/entitlement truth | entitlement rows exist; the card shows no FSBO term or paid state | **PARTIAL** |
| **no business/dealer inventory tools** | **PROVEN absent** — correct for this lane | **LIVE** |
| same-row / no-recharge | §4.2 | **PROVEN** |

**OWNER COMMAND CENTER: PARTIAL.**

---

## 9. ADMIN TRUTH (Admin OS Book as contract)

`/admin/workspace/clasificados/bienes-raices` is the generic `ListingsCategoryOpsQueuePage`, which
filters by category only — so it lists **both** lanes.

| Admin capability | Class (Book §7) | Evidence |
|---|---|---|
| see FSBO listings; filter q/status/owner/live-scope | **WORKS** | shared `fetchListingsForAdminWorkspaceFiltered` |
| canonical id + Leonix ad id | **WORKS** | selected and rendered |
| edit/control destination | **WORKS** | `/admin/workspace/clasificados/listings/[id]/edit` |
| **45-day expiration visibility** | **NEEDS_DATA** | `AdminListingMonetizationSummary` is mounted and reads `expires_at` — the column is simply never written (§5.1). The control is right; the data is missing |
| payment / entitlement state | **NEEDS_DATA** | the Gate BN-2 ops panel is scoped to `inventory_role === "main"`, so FSBO is correctly excluded from it — and nothing else surfaces FSBO entitlement |
| moderation / report | **PARTIAL** | shared `listings` moderation applies; nothing FSBO-specific |
| analytics | **NEEDS_DATA** | not surfaced in the queue |
| lifecycle/status | **PARTIAL** | admin status controls exist; the FSBO term is invisible |

**ADMIN OS: PARTIAL.** Nothing is orphaned or misrouted — the gaps are all downstream of the one
missing `expires_at` write. **The Admin OS worktree was not opened or modified.**

---

## 10. GLOBALIZATION FIXES AVAILABLE (sealed branch, read-only)

Inspected **after** current-runtime tracing, per instruction. **Nothing forward-ported.**

| Commit | What it does | Portability |
|---|---|---|
| **`5ddf6f79`** *"harden lifecycle visibility truth"* | adds `expires_at` to the BR browse select and a pure `isBrRowWithinTerm(row)` filter applied alongside `isListingRowActiveAndPublishedForBrowse`; parallel fixes on the anuncio page, the Autos service and `activePaidEditCheckoutOwnership`; ships a 159-line verifier. Its own comment reads: *"Bienes Raíces FSBO ($49.99/45d) is the only lane in this shared table with a real, populated `expires_at`"* | **HIGH value, but INSUFFICIENT ALONE — the critical finding of this gate.** It is the READ half. It presupposes a populated `expires_at`, and on this branch **nothing writes one**, so porting it verbatim would be a **no-op**: null → `isBrRowWithinTerm` returns true → nothing expires. It must be paired with the write half (§5.4) or it will look fixed and change nothing |
| `revenueRentasFulfillment` / `revenueClasesFulfillment` (already on HEAD, not sealed) | the WRITE half: `computeFixedDayRenewalExpiresAt` at activation, and renewal that **extends the same row's** expiry rather than inserting a new listing | **the pattern to adopt** — already in this branch, already proven by two sibling fixed-term lanes |
| `da25bc92` *"preserve Bienes drafts and edit hydration"* | touches `useLeonixPublishFlowExitClear` (the exit guard this lane uses) and `BienesRaicesPrivadoForm.tsx` | **MEDIUM** — re-trace against current runtime before porting; partly superseded |
| `651abd4e`, `733408dd` | Negocio child-identity and reverse-mapper repairs | **N/A** — Negocio-only; `733408dd`'s semantics already landed in Gate BN-1 |
| `3c23e875`, `652e2556`, `5e6303d2`, `0e2f9b17`, `c6519f30`, others | address verifier, Wave-2 owner-critical, WhatsApp international, Recently Viewed/Report | **DEFER** — evaluate individually; `5e6303d2`/`0e2f9b17` overlap §6.2 |

---

## 11. GATE ZERO — RESOLVED

| Question | Answer |
|---|---|
| entry route | `/clasificados/publicar/bienes-raices` (shared BR checkpoint) |
| application | `/clasificados/publicar/bienes-raices/privado` (+ `/publicar/bienes-raices/privado` alias) |
| draft identity | `bienesRaicesPrivadoDraft` + IDB media |
| preview | `/clasificados/bienes-raices/preview/privado` |
| checkout | `publishLeonixListingFromBienesRaicesPrivadoDraft(pending_payment)` → `startRevenueCategoryCheckout(BIENES_RAICES_FSBO_CHECKOUT)` |
| publish action | `activatePaidBienesFsboListingFromRevenueOs` (webhook only) |
| published row | `listings`, `category="bienes-raices"`, `seller_type="personal"`, `listing_json.br_publish.lane="privado"` |
| results | `/clasificados/bienes-raices/resultados` |
| public detail | `/clasificados/anuncio/[id]` → `BienesRaicesPrivadoLiveDetailShell` |
| dashboard | `/dashboard/mis-anuncios` → `/dashboard/mis-anuncios/[id]/editar` |
| admin | `/admin/workspace/clasificados/bienes-raices` |
| republish action | `applyOwnerListingPatch` (same row, id + owner scoped) |
| lifecycle reader | `resolveListingLifecycle` (inert — no `expires_at`) |
| analytics recorder | `listingEngagementRecorder` + `selfEngagementGuard` |

**Gate Zero is clear — implementation may proceed in a later gate.**

---

## 12. PROTECTED / NO-TOUCH

- `BienesRaicesPrivadoApplication.tsx` / `BienesRaicesPrivadoForm.tsx` and the Privado
  schema/mapping/utils
- `BienesRaicesPrivadoPreviewClient.tsx` and the FSBO checkout helper (matrix-derived, correct)
- `activatePaidBienesFsboListingFromRevenueOs` — the 5-predicate compare-and-set is exemplary; the
  fix it needs is **additive** (`expires_at`), not a rewrite
- shared, multi-category: `leonixRealEstateListingContract`, `leonixPublishRealEstateListingCore`,
  `listingPublicBrowseEligibility`, `resolveListingLifecycle`, `app/lib/listingPlans/*`
- the shared `/clasificados/anuncio/[id]` route (serves several categories)
- the 6 dead Privado modules (§2.2) — recorded, not to be revived or deleted in a repair gate

---

## 13. READY-TO-WIRE SUMMARY

**NEW ENGINE REQUIRED: NO.** Every gap is an ADOPT of an engine already in this branch, or a
forward-port paired with it.

| Priority | Item | Action |
|---|---|---|
| **P0** | `expires_at` never written at FSBO activation → the 45-day term is unenforceable | **ADOPT** `computeFixedDayRenewalExpiresAt` in `revenueBienesFsboFulfillment`, mirroring `revenueRentasFulfillment` |
| **P0** | no public term enforcement (results, detail, Saved Search, sitemap) | **FORWARD-PORT `5ddf6f79`'s read half — only together with the write above**, and extend it to the Gate BN-2 sitemap reader and Saved Search eligibility so all four surfaces agree |
| **P1** | no renewal/reactivation path | **ADOPT** the Rentas renewal shape — extend the **same row**, never insert a duplicate |
| **P1** | WhatsApp drops the country code | **ADOPT** `internationalWhatsApp` |
| **P2** | `droppedUnpersistable` computed and discarded; no owner warning | **ADOPT** the shared `warnDroppedUnpersistableMedia` pattern |
| **P2** | `mostrarDireccionExacta` is BUILT-NOT-WIRED on the public surface, and `"Ubicación"` is read ungated | **REPAIR** — gate the read on the flag so the toggle is honoured by construction, not by absence |
| **P2** | owner status write has no server authority for this lane | **REPAIR** — extend the BR lifecycle service to the Privado lane, or add an equivalent server route |
| **P2** | Admin/Owner show no FSBO term or paid state | falls out of the P0 write; then surface it |
| **P3** | no Related Listings rail for FSBO | **NEW CODE** (a thin city/type reader, like Comida Local's) |
| **P4** | 6 dead Privado modules (one hardcoding `mostrarDireccionExacta: true`) | cleanup gate, after integration |

---

## 14. GATE BIENES-PRIVADO-1 — WHAT WAS BUILT (evidence)

Gate status: **BIENES-PRIVADO-1 COMPLETE.** One commit. No migration authored or applied. Nothing
deleted. No branch merged. Application/Preview untouched. Negocio capacity authority untouched.

Verifier: `scripts/verify-bienes-privado-gate1-lifecycle.ts` — **182/182 PASS**. All ten previously
locked verifiers re-run green (Servicios ×2, Restaurantes ×2, Comida Local ×2, Bienes Negocio ×2,
Saved Search BR/Rentas ×2). ESLint over the changed scope: 0 new errors (six pre-existing unused-var
errors in `mis-anuncios/page.tsx` and one in `mapBrListingRowToCard.ts` were proved pre-existing at
HEAD by linting the HEAD revision, and were left alone).

### 14.1 The P0, closed — both halves in one commit

§5.1 recorded the defect: the 45-day term was priced, sold and persisted in
`listing_package_entitlements.ends_at`, but `listings.expires_at` was never written and no public
surface had a term concept. §5.2 recorded why the sealed Globalization commit `5ddf6f79` could not
be forward-ported alone — it is the READ half, and on this branch it would have been a **no-op**.

Both halves landed together:

| Half | Where | What |
|---|---|---|
| WRITE | `app/lib/listingPlans/revenueBienesFsboFulfillment.ts` | `expires_at` is now written at webhook-authoritative activation, via `computeFixedDayRenewalExpiresAt` — the same shared engine Rentas uses. |
| READ | `app/lib/listingLifecycle/bienesFsboLifecycle.ts` | `isBrFsboRowWithinTerm` — ONE predicate, applied on five public surfaces. |

Duration is **not** a duplicated literal. `bienesFsboDurationDays()` reads `durationDays` from the
canonical Revenue OS matrix entry for `br_fsbo_45d`; the verifier asserts the config's duration
equals the matrix's, that at most one `45` literal exists in the module (a last-resort guard), and
that no `45` literal exists at the write site at all.

### 14.2 Why the FSBO lifecycle config is deliberately NOT registered

`getListingLifecycleConfig(category, packageKey)` matches on **category alone** when no package key
is supplied. `listings` holds two commercially opposite BR lanes — FSBO (one-time, 45 days) and
Negocio (a monthly subscription with no `expires_at` at all). Registering an FSBO config under
`bienes-raices` would let any keyless lookup hand a live, fully-paid Negocio row a config with
`expirationRequired: true`, reporting it as expired and not publicly visible.

So `BIENES_FSBO_LISTING_LIFECYCLE_CONFIG` is exposed only through
`resolveBrFsboLifecycleConfigForRow`, which requires a ROW and returns `null` for anything that is
not genuine FSBO. Callers pass it to `resolveListingLifecycle` explicitly — exactly as the five
existing lifecycle call sites already do for Rentas. Asserted three ways: the config is absent from
`LISTING_LIFECYCLE_CONFIGS`, `getListingLifecycleConfig("bienes-raices")` is still `null`, and the
Rentas lookup is unchanged.

`isBrFsboRow` requires `category === "bienes-raices"` **and** `seller_type === "personal"`, and
rejects an explicit `br_publish.lane === "negocio"`. It deliberately does **not** require
`listing_json`: not every public reader selects that column, and requiring it would silently exempt
rows from term enforcement — the wrong failure direction.

### 14.3 The one shared expiry rule — five surfaces, no drifting copies

| Surface | File |
|---|---|
| Browse results | `fetchBrPublishedListingsBrowser.ts` |
| Canonical public detail | `anuncio/[id]/page.tsx` |
| Saved Search delivery eligibility | `bienesRaicesPublicEligibleListing.ts` |
| Sitemap | `brPublishedListingsServer.ts` |
| Similar listings (other sellers) | `fetchBrSimilarOtherClientListingsBrowser.ts` |

Each **imports** the rule and applies it on top of the existing
`isListingRowActiveAndPublishedForBrowse`; the verifier asserts every one imports it, and that none
contains a hand-rolled `expires_at` vs `Date.now()` comparison.

A rule nothing can evaluate is worse than no rule, so the verifier also asserts every one of these
readers actually **selects** `expires_at` (and `category`/`seller_type` where the projection lacked
them). Five select lists were widened for exactly that reason. `BrListingDbRow` gained
`category` + `expires_at` — never rendered on a card.

The shared browse rule itself was **not** rewritten: `listingPublicBrowseEligibility.ts` still knows
nothing about terms or about Bienes Raíces (asserted). This gate is additive.

`mapDbRowToHubListing.ts` was traced and left alone — it is DEAD-ZERO-CONSUMER on this branch.
`fetchBrRelatedInventoryListingsBrowser.ts` (Negocio inventory children) was left alone: the
predicate would be a no-op there, and instruction 10 keeps FSBO Related Listings out of this gate.

The rule fails closed **only** for a real elapsed term. Not-FSBO → visible. Null, blank or
unparseable `expires_at` → visible. This matters for the legacy population: rows published before
this gate carry no term, and none was retroactively invented for them.

### 14.4 Renewal — same row, no recharge, no duplicate listing (Master §10)

Mirrors the Rentas shape exactly:

- **Renewal truth is server-side only.** It comes from the payment record's
  `operation: "renew_listing"` (`paymentRecordIsRenewal`), never from anything the client sent.
- **A replayed Stripe event is idempotent** — `renewal_applied_at` is stamped on the payment record
  only *after* the listing write commits, so a failed renewal leaves no stamp and no extension.
- **Same row.** The update is `.eq("id", listingId)` with the lane predicates re-asserted; the
  verifier asserts the module contains no `.insert(`. `listings.id`, `leonix_ad_id`, `owner_id`,
  media, analytics and content all survive; `published_at` is preserved (`row.published_at ?? now`)
  so the listing keeps its original publication date and age ordering.
- **Compare-and-set differs by operation.** A first activation may only move `pending` +
  unpublished → active. A renewal may only extend a row in `active`/`expired`
  (`BIENES_RAICES_FSBO_RENEWABLE_FROM_STATUSES`). Neither can resurrect a moderated row.
- **Fair arithmetic.** `computeFixedDayRenewalExpiresAt` starts from whichever is later, the current
  expiry or the payment moment: renewing early stacks the remaining days (nothing is burned),
  renewing late starts a clean 45 days. Both proved numerically.

Checkout: `validateBienesFsboRenewalCheckoutOwnership` (new, in the existing
`listingRenewalFulfillment.ts` beside the Rentas one) enforces auth → ownership → **lane**
(`isBrFsboRow`, so a Negocio row is refused `wrong_lane`) → eligibility resolved against the FSBO
config passed explicitly. `/api/revenue-os/checkout` gained `isBienesFsboRenewalEarly`, scoped to
the FSBO package key, and the two fixed-term lanes now share one `isFixedTermRenewal` concept for
`sourceTable`, `currentExpiresAt`, `returnContext` and the attempt key. The expiry the session is
built against is the server's, never the client's. `br_fsbo_45d` is not in
`REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS` (it is one-time, not a subscription), so a legitimate
renewal purchase is not blocked by the active-entitlement guard.

**A failed or cancelled checkout republishes nothing**: only the webhook fulfillment path can write
`expires_at`, and it is reached only after paid truth.

### 14.5 Owner and Admin term truth — existing readers, no new engine

Owner: `LeonixRealEstateListingManageCard` already had `lifecycle` and `onRenew` props wired for
Rentas. The dashboard's `rentasLifecycle` became `fixedTermLifecycle`, resolving the FSBO config
**only** for a row `isBrFsboRow` accepts; `startRentasRenewal` became `startFixedTermRenewal`,
choosing category/package from the ROW. The attention pass in the same file was extended the same
way. No new card, no new dashboard engine.

A legacy FSBO row with no `expires_at` reads `unknown` / `missing_expires_at` and shows no countdown
— honest, not fabricated. Asserted.

Admin: **no code change was needed, and none was made.** The ops queue select
(`listingsAdminSelect.ts`) already carries `expires_at` and `seller_type`, and the shared
`AdminListingMonetizationSummary` → `resolveExpirationRenewalTool` already reports term truth from
the row and raises `expires_at_missing` when it is absent. Once the P0 write lands, that surface
becomes truthful on its own. Asserted rather than rebuilt.

*Open, out of scope:* the Admin staff **edit** page (`workspace/clasificados/listings/[id]/edit`)
does not render the monetization summary at all and its select omits `expires_at`. Not a term-truth
regression — that surface never showed term truth for any category.

### 14.6 Privado status safety — the payment bypass, closed

§5.5 recorded that the owner status write had no server authority. Tracing `markStatus`'s real
consumers found three surfaces (`mis-anuncios`, `mis-anuncios/[id]`, `mis-anuncios/[id]/editar`),
all writing through `applyOwnerListingPatch` — an RLS-scoped `update … .eq(id).eq(owner_id)` with
**no from-status validation**. RLS was satisfied (the owner may write their own row); what was
missing was any rule about which transition is legal.

The consequence was concrete, not theoretical: `markStatus("active")` writes `status: "active"` and
`is_published: true` unconditionally, and an unpaid FSBO row sits at `status: "pending"` awaiting
the webhook. A never-paid listing could be pushed live from the dashboard — and having no
`expires_at`, the new term rule fails open on it, so it would stay live indefinitely.

**Privado was NOT forced through the Negocio service.** `applyBrLifecycleMutation` is the Negocio
*model*: it requires `seller_type === "business"`, resolves parent/child inventory, cascades pause
to canonical children, and routes activation through the `br_negocio_activate_listing` capacity RPC.
A private seller has no parent, no children, no capacity and no subscription. The models genuinely
differ, so Privado got its own smallest authority:

- `app/lib/clasificados/bienes-raices/brFsboOwnerStatusAuthority.ts` — **pure, zero imports**,
  modelled on `brListingLifecycleEligibility.ts`. Every rule is an allow-list of prior states.
  `relist` and `resume` refuse `pending`/`pending_payment`/`draft` with a distinct
  `payment_required` code; no owner action escapes `removed`/`flagged`/`suspended`; **no action
  touches `expires_at`** (a term is bought, not toggled — asserted).
- `app/api/clasificados/bienes-raices/privado-status/route.ts` — auth → owner → lane
  (`isBrFsboRow`, symmetric with the Negocio route's business check) → pure decision →
  compare-and-set `.in("status", decision.fromStatuses)`. A raw database error is never returned.
- `app/(site)/dashboard/lib/brFsboStatusClient.ts` — the client holds **no** rules and performs no
  listings write (asserted).

The patches are byte-identical to the existing constants (`OWNER_LISTING_PAUSE_PATCH`,
`OWNER_LISTING_SOFT_ARCHIVE_PATCH`, `ownerListingResumeFromPausePatch`), so nothing about the
resulting state changed — only which transitions are permitted. Archive stays a **soft** archive:
the row, its media, its analytics and its `leonix_ad_id` all survive.

Relisting a listing whose 45 days already elapsed restores `status: "active"` but the row stays
publicly hidden until the owner buys a renewal. That is the honest outcome, and the reason the
status policy does not need to know about expiry at all.

### 14.7 Address privacy, repaired BY CONSTRUCTION

§6.1 recorded that privacy held "by absence rather than by a gate". Reading the live mapper closely
showed it was worse than that: `addressLine: showExact ? humanLocation : humanLocation` had the
**same expression on both sides of the ternary**, so the opt-in flag changed nothing, and
`humanLocation` was the raw `"Ubicación"` pair — also fed to `cityStateZip` and to
`googleMapsSearchUrl`.

The repair is not a guard bolted on top. `mapBrListingRowToPrivadoPreviewVm` now composes its
location through `buildBrPublicLocationForLiveDetail` — the **same shared builder** the browse cards
and the Negocio live detail already use. That builder reads the opt-in flag itself, composes an
APPROXIMATE map query (neighborhood/city/state/zip) when the seller has not opted in, composes the
exact one only when they have, and runs the display line through `privacySafeLocation`. An exact
address now exists as its own value, populated in exactly one place, gated on the flag.

One trap worth recording: the builder needs the RESERVED rows (`"Ubicación"`, `"Dirección"`, the
zona/colonia variants) that `humanFactRows` deliberately strips to avoid duplicating them in the
facts list. Feeding it the filtered set would have silently blanked the location for every legacy
row predating `Leonix:br_gate12d_v1`. A separate `allHumanPairRows` feeds it the unfiltered set.

The dead Privado mapper that hardcodes `mostrarDireccionExacta: true` was **neither revived nor
deleted** (Master §15) — it simply is not what the live path uses.

### 14.8 WhatsApp and media (P1/P2 adopts)

WhatsApp: the mapper stripped to bare digits and appended them to `wa.me/`, so a 10-digit US number
produced an unroutable `wa.me/5551234567` — and private sellers are exactly the population most
likely to enter a plain local number. Now `buildInternationalWhatsAppWaMeHref` from the shared
`internationalWhatsApp` contract. The bare-digit construction is gone (asserted).

Media: the FSBO publish path passed its gallery straight through while both sibling lanes in the
same file already ran theirs through `buildProposedFinalMediaSet`. It now builds the set once and
calls the shared `warnDroppedUnpersistableMedia`. This is **observability, not a new gate**: the
list handed to the core publish path is byte-for-byte the same, so no publish that used to succeed
can now fail. Owner-visible surfacing of the dropped count would ride on the existing
`publishLeonixRealEstateListingCore` `warnings` channel (already banner-rendered by the Privado
preview client) and is left for a later gate rather than widened here.

### 14.9 Explicitly NOT done in this gate

- **No migration** authored or applied. This gate needed none: `listings.expires_at` already exists
  (Rentas reads and writes it on the same table).
- **FSBO Related Listings** — deferred to BIENES-PRIVADO-2 (instruction 10). Asserted absent.
- **Newsletter failure surfacing** — deferred. It is not identical to the Comida Local case here.
- **Nothing deleted.** The six dead Privado modules from §2.2 are untouched.
- **Negocio capacity authority, Application/Preview, browser QA, full typecheck/build, scheduler** —
  all untouched, per the gate's prohibitions.

### 14.10 Still open after this gate

| Priority | Item |
|---|---|
| P1 | FSBO Related Listings rail (BIENES-PRIVADO-2) |
| P2 | Owner-visible dropped-media count on the FSBO publish banner |
| P2 | Admin staff edit page renders no monetization summary (all categories) |
| P3 | Expiry-reminder delivery — `reminderScheduleDays` is declared but no scheduler exists (platform-wide, all fixed-term lanes) |
| P4 | Six dead Privado modules — cleanup gate, after integration |

Deferred to the final integration gate as standing items: `npm run typecheck`, `npm run build`,
owner-browser QA, and the four unapplied Saved Search / `suspended_reason` migrations plus the
Negocio capacity RPC (`20260810120000`, which needs explicit owner authorization).

---

## 15. GATE BIENES-PRIVADO-2 — WHAT WAS BUILT (evidence)

Gate status: **BIENES-PRIVADO-2 COMPLETE.** One commit, 14 files. No migration authored or applied.
Nothing deleted. No branch merged. No OCC or Admin OS worktree opened. Application/Preview view
components untouched. Negocio capacity authority and Negocio lifecycle service untouched.

Verifier: `scripts/verify-bienes-privado-gate2-discovery.ts` — **236/236 PASS**. All ten previously
locked verifiers re-run green, including Gate BIENES-PRIVADO-1 at 182/182. ESLint over the changed
scope: **0 new errors** (one pre-existing unused-var error in `AdminListingsTable.tsx` was proved
pre-existing by linting the HEAD revision — it sits at line 207 there and line 249 here, unchanged).
Targeted `tsc --noEmit` over the ten changed non-trivial modules and the four changed client
surfaces: **0 errors**. Full typecheck/build remain deferred per the resource contract.

### 15.1 Related Listings — FSBO, without a second engine

§7 recorded this as the one genuine (P3) gap: `RelatedBrAgentProperties` is mounted only by the
Negocio shell and is keyed on `br_inventory_group_id` / `br_inventory_parent_listing_id`, which an
FSBO row does not have. That reader was **not** reused — instruction and architecture agree it
cannot be.

What was reused instead is `fetchBrSimilarOtherClientListingsBrowser`, the OTHER-seller similarity
reader. It already scores exactly the persisted relationships a private property has, and already
applies both the shared public-eligibility rule and (since Gate 1) the shared FSBO term rule. So it
gained a `lane` switch rather than a sibling file:

| Concern | How it is satisfied |
|---|---|
| canonical published Privado rows only | `isBrFsboRow(row)` — the same shared lane predicate the webhook, the term rule and the renewal gate use |
| shared FSBO expiry rule applies | `isBrFsboRowWithinTerm(row)` — the same predicate as browse/detail/Saved Search/sitemap |
| exact current listing excluded | excluded twice: `.neq("id", …)` at the query and `row.id === currentListingId` in the filter |
| no expired rows | falls out of the shared term rule |
| no Negocio inventory assumptions | the privado branch is asserted to contain **no** reference to `br_inventory_group_id`, `br_inventory_parent_listing_id`, `getBrInventoryGroupId` or `isBrNegocioListing` |
| no promoted/paid ranking weight | asserted absent for `promoted`, `featured`, `placement`, `boost`, `sponsor` |
| no fake filler | the section renders `null` when there is no real match; asserted no `sample`/`placeholder`/`filler`/`demo` |
| no model/recommendation engine | asserted absent for `embedding`, `vector`, `recommend`, `model`, `cosine`, `tensor` |
| reuses existing shapes | `mapBrListingRowToNegocioCard` + `BrSimilarOtherClientProperties` — zero new components |

**Relationships used**, all from this listing's own persisted facets:

- **operation is a hard FILTER, not a score.** A property for sale must never be offered as
  "similar" to a rental. When the current listing's own operation cannot be read the filter is
  skipped entirely — the rail degrades to city/type/price rather than guessing.
- **city (40), property type (25), price proximity (30/15), recency (5)** — the existing scorer,
  unchanged. Price proximity was admissible because Gate BIENES-NEGOCIO-2 established a stable
  numeric contract (`Listing.priceNumber`, already used by the JSON-LD `Offer`); this gate threads
  that same number onto `BienesLiveListingLike` rather than re-parsing a formatted label.
- **bedrooms (±0 → 20, ±1 → 10) and bathrooms (±0 → 16, ±1 → 8)** — the facts a private buyer
  actually compares, read from the structured `Leonix:` machine facets. Added **only** in the
  privado lane and weighted below city, so it refines an ordering rather than becoming a new
  ranking model, and Negocio's score is byte-identical to what it has always been.

`lane` defaults to `"negocio"`, so the one pre-existing caller (`EnVentaAnuncioLayout`) is
unchanged — asserted by checking it passes no `lane` at all.

**Copy honesty:** the Negocio subtitle says "outside this inventory group", which would be
meaningless to an FSBO viewer and would imply a relationship that does not exist. The shared copy
helper gained a lane option using this file's own established pattern
(`brRelatedAgentPropertiesCopy(lang, { brokerage })`); the Privado subtitle reads "Other properties
from private owners on Leonix." Asserted: the two subtitles differ, the privado one never says
"inventory", the Negocio one still does, and the shared title is unchanged.

### 15.2 Discovery continuity — one FSBO circuit, proven

```
paid activation (webhook)  →  expires_at written on the SAME row
      →  browse/results        isBrFsboRowWithinTerm
      →  Saved Search          isBrFsboRowWithinTerm  (+ the G.2.3.4 parent gate, intact)
      →  public detail         isBrFsboRowWithinTerm  (fails closed to "not found")
      →  Related Listings      isBrFsboRowWithinTerm  ← NEW this gate
      →  JSON-LD               RealEstateListing --mainEntity--> property, url = leonixLiveAnuncioPath
      →  sitemap               isBrFsboRowWithinTerm  (+ the parent gate, intact)
      →  Owner Dashboard       row.expires_at → resolveListingLifecycle → renew action
      →  Admin                 lane:privado · term:<state> · d:<n> · renew:eligible · exp <date>
```

Held together by two structural proofs, both asserted:

1. **One expiry rule.** All five public surfaces `import` `isBrFsboRowWithinTerm` from
   `bienesFsboLifecycle` rather than re-expressing it.
2. **One canonical detail path.** `leonixLiveAnuncioPath` is the single builder behind the sitemap
   entry, the Saved Search delivery resolver, the related-listing card link, and the JSON-LD `url`.

A correction worth recording: the JSON-LD **builder** does not call `leonixLiveAnuncioPath` — it
takes `url` as an input and never hardcodes a detail path. That is better design, not a gap, so the
proof is asserted at the call site (`url: \`${LEONIX_SITE_ORIGIN}${leonixLiveAnuncioPath(listing.id)}\``)
plus a check that the builder contains no `/clasificados/anuncio/` literal of its own. The first
version of this gate's verifier asserted it in the wrong file; the **assertion** was corrected, never
the code.

Saved Search, JSON-LD and the sitemap were **not rewritten** — asserted by checking each still
carries its own prior contract and contains no reference to this gate's new symbols.

### 15.3 One real defect found while proving continuity — and repaired

Instruction 2 permits repair when proving continuity surfaces a genuine defect. It did.

`app/lib/listingLifecycle/listingRenewalCheckout.ts` still declared its parameters as the Rentas
literals (`category: "rentas"; packageKey: "rentas_30d"`), while Gate BIENES-PRIVADO-1's
`startFixedTermRenewal` passes `"bienes-raices"` / `"br_fsbo_45d"` into it. **That is a real
TypeScript assignability error that shipped in Gate 1.** ESLint does not check assignability and
full typecheck is deferred, so it survived that gate's validation.

Repaired by widening the parameters to an explicit `ListingRenewalCheckoutLane` union of the two
lanes that genuinely have a server-verified renewal gate behind them. The union is documentation and
a client-side guard, not authorization — the server gate remains the authority. Proven by a targeted
`tsc --noEmit` over the renewal chain and the four changed client surfaces: 0 errors.

### 15.4 Owner Command Center — LIVE (Bible as contract only)

No OCC file was copied and the OCC worktree was not opened. Re-classified against **this** branch,
superseding §8's Gate-Zero table:

| Bible §12 (BR Privado/FSBO) requirement | This branch | Class |
|---|---|---|
| one canonical manage doorway | `mis-anuncios` card + `/dashboard/mis-anuncios/[id]` workspace | **LIVE** |
| public view | `leonixLiveAnuncioPath(id)` | **LIVE** |
| same-row edit | id + owner scoped, zero-row checked | **LIVE** |
| analytics | engagement recorder + self-engagement guard | **LIVE-SHARED** |
| lifecycle state | server-authorized transitions (Gate 1) | **LIVE** |
| **expiration** | real `expires_at` → `listingExpireIso` + days chip | **LIVE** *(was BUILT-NOT-WIRED)* |
| **renewal action** | `startFsboRenewal` on the canonical workspace, `startFixedTermRenewal` on the card | **LIVE** *(was BUILT-NOT-WIRED)* |
| payment/entitlement presentation | real plan; entitlement badge path generic but unconfirmed | **PARTIAL — honestly** |
| no Negocio-only inventory tools | asserted absent | **LIVE** |
| no Business Tools for a private seller | asserted absent | **LIVE** |
| same-row / no-recharge | §4.2 + Gate 1 | **PROVEN** |

**OWNER COMMAND CENTER: LIVE.**

Two changes made this true, both minimal read-registrations rather than new architecture:

**(a) The capability registry told three lies.** `bienes-raices-privado` still declared
`renew: "unsupported"`, no `relatedListings` entry (defaulting to unsupported) and no `commercial`
block at all — understating what Gate 1 and this gate actually shipped, and instructing the shared
shell to hide real capabilities. Corrected to `renew: "supported"`,
`relatedListings: "supported"`, `commercial.plan: "supported"`.

`commercial.entitlement` was deliberately left **`unproven`**. The entitlement route is generic and
does receive FSBO items, but no source proof exists that an FSBO `listing_package_entitlements` row
renders a badge end to end, and owner-browser QA is deferred. Per the registry's own doctrine that
is exactly `unproven`; claiming `supported` would fabricate entitlement truth, which both master
contracts forbid. `businessTools`, `businessConcierge` and `inventory` stay `unsupported` and must:
a private seller has no business identity, no `businesses.id`, no parent/child inventory and no
Business Tools entitlement. Asserted, and the Negocio row is asserted unchanged.

**(b) The canonical workspace could display an expiry it could not act on.** Bible §9 makes
`/dashboard/mis-anuncios/[id]` the one canonical workspace with Lifecycle as a required section, but
Gate 1 wired renewal only onto the Mis Anuncios list card. An owner opening their own listing saw
the expiration date and had to navigate back to the list to do anything about it. A renewal action
was added there using the **same** shared lifecycle reader and the **same** shared renewal checkout —
no second renewal path, no price or payment authority on the client. It renders only when the shared
reader says the row is genuinely renewal-eligible, so a mid-term listing is never nudged toward an
early charge (proven behaviorally at 30 days out, 3 days out, expired, and termless).

### 15.4b `public.businesses` linkage — still absent, still not invented

Unchanged from the Negocio map: Business Tools authorizes on `(businessId, userId)` and no BR row
has such an id. For FSBO this is not even a gap — a private seller must never have Business Tools —
and nothing in this gate creates or implies one.

### 15.5 Admin truth — Admin OS Book as acceptance

The Admin OS worktree was **not opened or modified**. Re-classified, superseding §9:

| Admin capability | Class (Book §7) | Evidence |
|---|---|---|
| canonical listing id + Leonix ad id | **WORKS** | selected and rendered |
| **seller lane = Privado** | **WORKS** *(was invisible)* | `lane:privado` / `lane:negocio` from the shared `isBrFsboRow` |
| status · is_published | **WORKS** | existing queue columns |
| **expires_at** | **WORKS** *(was NEEDS_DATA)* | `AdminListingMonetizationSummary` renders `exp <date>`; the data now exists |
| **current term state** | **WORKS** *(new)* | `term:active` / `term:expiring_soon` / `term:expired` / `term:pending_payment` / `term:none`, plus `d:<days>` |
| **renewal eligibility** | **WORKS** *(new)* | `renew:eligible` |
| payment / entitlement state | **PARTIAL** | the existing monetization column reads the real entitlement source; nothing FSBO-specific was added, and nothing is inferred |
| moderation / report path | **WORKS** | existing `ClassifiedAdminQueueRowActionsPanel` + `AdminListingFlagTruthBlock`, untouched |
| edit / control destination | **WORKS** | existing `/admin/workspace/clasificados/listings/[id]/edit` |

**ADMIN OS: term truth PROVEN; payment/entitlement PARTIAL and honestly labelled.**

The whole repair was a **read registration**: `seller_type` and `expires_at` were ALREADY selected by
`fetchListingsForAdminWorkspaceFiltered` (`LISTINGS_ADMIN_CORE`), but the Admin row TYPE never
declared them, so no Admin control could consume them. Declaring them plus deriving lane and term
through the shared predicates is the entire change. This is precisely the case instruction 4
anticipated: the source has the data, the surface could not read it.

Three rules held, and asserted:
- **payment is never inferred from listing status** — the lane/term bits are asserted to contain no
  `paid`/`unpaid`/`payment`/`entitlement`/`subscription` token at all;
- **`term:none` means "no term persisted"** (a legacy row published before the `expires_at` write
  existed), never "unpaid" — and an actually-unpaid row reads `term:pending_payment`, proven
  behaviorally;
- **nothing unreadable collapses to zero** — asserted no `|| 0` in the changed scope.

Admin was **not redesigned**: no new page, route, panel or column. The Gate BN-2 Negocio ops panel is
untouched and still correctly scoped to `inventory_role === "main"`, which excludes FSBO.

### 15.6 Newsletter failure — IMPLEMENTED (was deferred)

The FSBO capture was `void captureCheckoutNewsletterSubscriber({…})` — fire-and-forget, so a real
`FAILED` result was structurally unreachable and the owner was told nothing.

The shared engine already returns a usable result (`{ status: "FAILED"; reason }`), so this was the
tiny adoption Comida Local proved, and it is implemented in the same spirit:

- the capture is **started** before the pending save (so it still overlaps and adds no checkout
  latency) and **awaited** after it (so its result is reachable);
- it is awaited strictly **after** the listing save has already succeeded, and a failure never
  returns early and never becomes a blocking publish error — asserted by ordering and by checking
  the failure block contains no `return;` and no `setPublishErr`;
- no second newsletter engine and no new transport — asserted;
- **no new persistence model.** The warning goes onto the EXISTING `lx_br_publish_warnings`
  `string[]` channel, which the published detail page already reads, joins and renders as its amber
  banner (Gate I.5.4A.1), and which the Negocio preview already merges multiple warning sources into.

That channel choice matters for this lane specifically: FSBO checkout **redirects to Stripe**, so a
note held in component state would be destroyed by the redirect and the owner would never see it.
`sessionStorage` survives the round trip, so the warning is delivered on the published page where
the owner actually lands.

### 15.7 ES/EN one-time cadence — a real cross-category customer-facing repair

`oneTimePrice` had **no `lang` parameter at all** and hardcoded the Spanish `días`, so the ENGLISH
checkpoint of every fixed-term category rendered e.g. `$49.99 / 45 días` at the decision point. The
same class of defect `monthlyPrice` carried before Gate COMIDA-LOCAL-1, in the one-time lane.

Five live cards across four categories, all proven behaviorally in both languages:

| Card | ES (unchanged) | EN (repaired) |
|---|---|---|
| Bienes Privado | `$49.99 / 45 días` | `$49.99 / 45 days` |
| Autos Privado | `$24.99 / 30 días` | `$24.99 / 30 days` |
| Rentas Privado | `$24.99 / 30 días` | `$24.99 / 30 days` |
| Empleos paid | `$24.99 / 30 días` | `$24.99 / 30 days` |
| Rentas Negocio matrix bullet | `(matriz: $24.99 / 30 días)` | `(matrix: $24.99 / 30 days)` |

Amount authority is preserved and **duration authority is improved**. Callers previously passed the
day count as a literal argument that could silently drift from the product; it is now read from the
same `revenuePricingMatrix` definition that supplies the price, with the caller's value kept only as
a last-resort fallback. Every current fallback was verified to equal the matrix value
(`autos_privado_30d` 30, `rentas_30d` 30, `br_fsbo_45d` 45, `empleos_job_post_paid` 30), which is why
the Spanish output is display-identical. The verifier asserts each English label carries the
matrix's own duration.

No dead copy was edited to simulate the fix: all four getters are asserted to be imported by real
rendered hub clients.

### 15.8 Cleanup prep — re-verified, untouched

All six dead Privado modules re-checked this gate. **All six still exist. None revived. None
deleted.**

| Module | Referencing files |
|---|---|
| `privadoPreviewMapStub.ts` | 0 |
| `privadoFormStub.ts` | 0 |
| `privadoDraftStub.ts` | 0 |
| `sections/PrivadoApplicationNotice.tsx` | 0 |
| `preview/privado/components/BrPrivadoGalleryLightbox.tsx` | 0 |
| `preview/privado/model/buildBienesRaicesPrivadoTemplateVm.ts` | **0 real** — its only mention is still a Spanish prose comment inside `privadoPreviewMapStub.ts`, a dead file referencing a dead file |

> **PRESERVED WARNING — DO NOT REVIVE.**
> `buildBienesRaicesPrivadoTemplateVm.ts` **still hardcodes `mostrarDireccionExacta: true`** (line 98,
> re-confirmed this gate). It is harmless only because it is dead. Reviving it would publish exact
> street addresses for private sellers who never opted in — the exact defect Gate BIENES-PRIVADO-1
> repaired by construction in the live mapper. The verifier asserts both that the file still exists
> (not deleted) and that the hardcode is still there (so the warning cannot silently go stale), and
> that neither the live Privado shell nor the canonical detail page imports it.

### 15.9 Explicitly NOT done in this gate

- **No migration** authored or applied; no schema change implied (asserted).
- **No scheduler** (asserted). Term enforcement is read-time, which is why none is needed.
- **Negocio capacity RPC** untouched; the Negocio lifecycle service and ops panel untouched
  (asserted).
- **No Business Hub / Business Tools** added to FSBO (asserted).
- **Application/Preview view components not redesigned** — only the preview client's newsletter
  handling changed, and the protected `BienesRaicesPrivadoPreviewView` was not touched.
- **Nothing deleted**; no push, no `main`, no production.
- No browser QA, no full typecheck, no full build.

### 15.10 Remaining Bienes Privado source gaps

| Priority | Item |
|---|---|
| P2 | `commercial.entitlement` for FSBO is `unproven` — needs one real end-to-end confirmation that an FSBO `listing_package_entitlements` row renders an owner badge (runtime, not source) |
| P2 | Owner-visible dropped-media count on the FSBO publish banner (the `lx_br_publish_warnings` channel now proven to work end to end would carry it) |
| P2 | Admin staff edit page (`workspace/clasificados/listings/[id]/edit`) renders no monetization summary and omits `expires_at` — affects every category, not just FSBO |
| P3 | Expiry-reminder delivery: `reminderScheduleDays` is declared for both fixed-term lanes but nothing sweeps expiries (platform-wide) |
| P4 | Six dead Privado modules — cleanup gate, after integration |

Standing deferrals to the final integration gate: `npm run typecheck`, `npm run build`,
owner-browser QA, and the four unapplied Saved Search / `suspended_reason` migrations plus the
Negocio capacity RPC `20260810120000` (which still needs explicit owner authorization).


---

**QUE RUJA EL LEÓN. HARD WORK. GOD FIRST.**
