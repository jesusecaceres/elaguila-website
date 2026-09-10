# RENTAS NEGOCIO — LIVE WIRING MAP (AUTHORITATIVE)

Gate Zero + live-wiring MRI. Traced from runtime-consumed source only. File existence was never
accepted as proof of live. **No fixes implemented. Nothing deleted. Nothing revived. No migration
applied. No branch merged. No Owner Command Center or Admin OS worktree opened.**

Classification vocabulary (Launch Lifecycle master §14): `LIVE` · `LIVE-SHARED` ·
`BUILT-NOT-WIRED` · `DUPLICATE-REFERENCED` · `DEAD-ZERO-CONSUMER` · `HISTORICAL` · `UNKNOWN`.
Admin controls use the Admin OS Book §7 vocabulary; Owner capabilities the OCC Bible §12/§34
vocabulary.

Servicios, Restaurantes, Comida Local, **Bienes Raíces Negocio** and **Bienes Raíces Privado** are
SOURCE-LOCKED and were not reopened.

---

## 0. GATE STATUS

| Gate | Scope | Status |
|---|---|---|
| **RENTAS-NEGOCIO-0** | Gate Zero + live wiring MRI | **COMPLETE (this document)** |
| **RENTAS-NEGOCIO-1** | Activation boundary, hydration, country, WhatsApp, media | **COMPLETE (see §17)** |

---

## 1. WORKTREE TRUTH

| Field | Value |
|---|---|
| Worktree | `C:\projects\elaguila-website-launch-lifecycle` |
| Branch | `completion/launch-lifecycle-2026-09-09` |
| HEAD | `61f72be55679ca1c4307e608b73712039d9b99ee` |
| origin/main | `a0a4783971b42ea1d71ab2602d4720d0d590baf8` |
| Working tree | clean at trace start |
| Sealed Globalization | `fix/globalization-final-closeout-2026-09` @ `e3956df8` — **not an ancestor of HEAD** |
| `67919479` (Rentas Negocio dashboard-edit repair) | **VERIFIED NOT AN ANCESTOR OF HEAD** — `git merge-base --is-ancestor 67919479 HEAD` fails |

---

## 2. PATH: CLEAN — with two duplicate-referenced entry routes

Rentas is a large surface (60+ directories), but runtime ownership is unambiguous. Unlike Bienes
Raíces, Rentas owns its **own** public detail shell rather than the shared `/clasificados/anuncio`
route, and that ownership is consistent across every discovery surface.

### 2.1 The two entry routes are the same component

| Route | File | Renders | Classification |
|---|---|---|---|
| `/clasificados/publicar/rentas/negocio` | `.../publicar/rentas/negocio/page.tsx` | `RentasNegocioApplication` | **LIVE** — the checkpoint CTA target (`RENTAS_PUBLICAR_NEGOCIO`) |
| `/publicar/rentas/negocio` | `app/(site)/publicar/rentas/negocio/page.tsx` | `RentasNegocioApplication` (same component, aliased import) | **DUPLICATE-REFERENCED** — a second live URL for one application; `RENTAS_PUBLICAR_NEGOCIO_PUBLIC_ENTRY` names it and `RentasNegocioForm.tsx:1568` renders it as help text |

Both are genuinely reachable. This is a canonical-URL duplication, not dead code, and it is *not*
the alias-trap case: these are two real `page.tsx` files, not one file reached through two
`tsconfig` aliases.

### 2.2 The detail alias is a clean single-hop redirect

`/clasificados/rentas/anuncio/[id]` → `redirect(rentasListingPublicPath(id))` →
`/clasificados/rentas/listing/[id]`, preserving every incoming query param verbatim (Gate I.5.4D).
**LIVE, correct, and not a duplicate detail renderer.**

### 2.3 Runtime ownership proved for every "publish/mapping" folder that looked stale

| Path | Consumers | Classification |
|---|---|---|
| `rentas/negocio/publish/RentasNegocioPublishShell.tsx` | 2 (`RentasNegocioApplication`, `RentasPublishTrackStep`) | **LIVE** |
| `rentas/privado/publish/RentasPrivadoPublishShell.tsx` | 2 | **LIVE** |
| `rentas/publish/computeRentasPublishMetaOk.ts` | 1 (`clasificados/lib/publishRequirements.ts`) | **LIVE-SHARED** |
| `rentas/negocio/mapping/buildRentasNegocioPreviewListingData.ts` | 1 (`buildFullPreviewListingData.ts`) | **LIVE-SHARED** |
| `rentas/negocio/mapping/rentasNegocioDetailsTierToDb.ts` | 1 | **LIVE** |
| `rentas/preview/privado/model/buildRentasPrivadoTemplateVm.ts` | 1 (`RentasPrivadoPreviewClient`) | **LIVE** (Privado lane — carries a hardcoded demo `wa.me/15551234567`; out of scope here, flag for Rentas Privado gate) |
| `rentas/results/rentasResultsDemoData.ts` | 5 | **LIVE** (demo pool, `browseActive: true` hardcoded — see §7.4) |

**No dead Rentas Negocio module was found.** Nothing to delete, nothing to revive.

---

## 3. EXACT LIVE END-TO-END PATH

```
/clasificados/publicar/rentas                    RentasPublicarHubClient          LIVE
  └─ card: getRentasNegocioCheckpointCard(lang, RENTAS_PUBLICAR_NEGOCIO)          LIVE-SHARED
/clasificados/publicar/rentas/negocio            RentasNegocioApplication         LIVE
  └─ RentasNegocioForm.tsx                       RentasNegocioFormState (~103 fields)
  └─ draft: `rentas-negocio-draft-v1` (session) + IndexedDB inline                LIVE
/clasificados/rentas/preview/negocio             RentasNegocioPreviewClient       LIVE
  └─ publishLeonixListingFromRentasNegocioDraft(..., activationMode:"pending_payment")
       → buildRentasNegocioListingParams  →  listings row, status="pending", is_published=false
  └─ startRevenueCategoryCheckout({ ...RENTAS_CATEGORY_CHECKOUT })                LIVE-SHARED
/api/revenue-os/checkout                         server-owned price               LIVE-SHARED
Stripe → /api/revenue-os/webhook
  └─ activatePaidRentasListingFromRevenueOs      revenueRentasFulfillment.ts      LIVE
       → status=active, is_published=true, published_at, **expires_at (+30d)**, listing_json
       → triggerRentasSavedSearchMatchBestEffort("rentas_publish_activation")
/clasificados/rentas/results                     RentasResultsClient              LIVE
/clasificados/rentas                             landing                          LIVE
/clasificados/rentas/listing/[id]                RentasListingDetailPage          LIVE  ← canonical
/clasificados/rentas/anuncio/[id]                single-hop redirect → above      LIVE
/dashboard/mis-anuncios                          LeonixRealEstateListingManageCard LIVE-SHARED
/dashboard/mis-anuncios/[id]                     OwnerEntityWorkspace             LIVE-SHARED
/admin/workspace/clasificados/rentas             ListingsCategoryOpsQueuePage     LIVE-SHARED
/admin/workspace/clasificados/rentas/[id]        AdminRentasListingInspectorPage  LIVE
edit → RentasNegocioForm (edit context) → POST /api/clasificados/rentas/listing-edit   LIVE
renewal → startFixedTermRenewal → /api/revenue-os/checkout (operation renew_listing)  LIVE
```

**Every step resolves to exactly one live file.** Gate Zero is not ambiguous.

---

## 4. COMMERCIAL / FIXED-TERM TRUTH

### 4.1 What is genuinely proven

| Requirement | Evidence | Status |
|---|---|---|
| canonical package key | `RENTAS_CATEGORY_CHECKOUT = { category: "rentas", packageKey: "rentas_30d" }` — **the Negocio lane uses the SAME key as Privado** | **PROVEN** |
| $24.99 server-owned price | `revenuePricingMatrix` `rentas_30d` → `priceCents: 2499`, `billingMode: "one_time"`; the checkout route resolves price from the matrix, never from the client | **PROVEN** |
| 30-day duration | matrix `durationDays: 30` | **PROVEN** |
| webhook authority | activation happens only in `activatePaidRentasListingFromRevenueOs`, called from the Revenue OS webhook fulfillment; preview publishes as `pending`/unpublished | **PROVEN** |
| entitlement write | shared `revenueEntitlementFulfillment` → `listing_package_entitlements` | **PROVEN (LIVE-SHARED)** |
| `listings.expires_at` write | `revenueRentasFulfillment.ts` — `expires_at: expiresAt` via the shared `computeFixedDayRenewalExpiresAt` | **PROVEN** |
| public expiry enforcement | see §4.3 — genuinely shared and genuinely enforced | **PROVEN** |
| same-row renewal | `paymentRecordIsRenewal` + `renewal_applied_at` idempotency + `.in("status",["active","expired"])` compare-and-set on the same id | **PROVEN** |
| no duplicate listing | `revenueRentasFulfillment.ts` contains no `.insert(` — renewal patches the same row | **PROVEN** |
| no business-subscription semantics | `rentas_30d` is `one_time`; Rentas is absent from `REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS`; there is no Rentas inventory pack, no capacity RPC, no parent/child column usage | **PROVEN — no leakage** |

**This is the healthiest fixed-term lane traced so far.** Rentas already has, at HEAD, both halves
that Bienes Privado was missing before Gate BIENES-PRIVADO-1: the `expires_at` write AND public
enforcement.

### 4.2 No parent/child capacity model — confirmed by runtime

`buildRentasNegocioListingParams` writes `sellerType: "business"`, `businessName`,
`businessMetaJson` — and **never** `inventory_role`, `br_inventory_group_id` or
`br_inventory_parent_listing_id`. No Rentas code calls `br_negocio_activate_listing` or
`countActiveBrInventory`. The Negocio lane is a **flat, per-listing $24.99/30-day product with a
business identity attached** — exactly the owner truth. No false parent/child assumption exists in
source.

### 4.3 Public expiry enforcement — one shared rule, genuinely consumed

`mapListingRowToRentasPublicListing.ts:279` calls `resolveListingLifecycle(...)` with
`RENTAS_LISTING_LIFECYCLE_CONFIG` and derives:

```ts
const browseActive = lifecycle.isPubliclyVisible && rentasCatalogEligibleFromMachineStatus(rx.listingStatus);
```

`browseActive` is then **enforced**, not merely exposed:

| Surface | File | Enforcement |
|---|---|---|
| browse inventory | `useRentasPublicBrowseInventory.ts:93` | `if (m && m.browseActive !== false) mapped.push(m)` |
| browse fetch | `fetchRentasPublicListingsForBrowse.ts:63` | same |
| **public detail** | `fetchRentasListingForPublicDetail.ts:30` | `if (!mapped \|\| mapped.browseActive === false) return null` → `notFound()` |
| landing/results sections | `rentasSectionSelectors.ts:32,73,105,111` | `.filter((l) => l.browseActive !== false)` |
| Saved Search | `rentasPublicEligibleListing.ts:39` | `if (mapped.browseActive !== true) return null` |

One mapper, five consumers, direct-URL access closed. **PROVEN.**

### 4.4 THREE REAL COMMERCIAL DEFECTS

#### P0 — a second, TERM-BLIND activation path exists and is reachable

`brListingPaymentService.tryActivateBrListingAfterPayment`'s generic branch (lines ~263-292)
activates **any** `listings` row — explicitly including `category === "rentas"`, which it
name-checks at line 289 to dispatch the Rentas Saved Search trigger:

```ts
.update({ status: "active", is_published: true, published_at: existing.published_at ?? now, updated_at: now })
```

**It never writes `expires_at`.** A Rentas row activated through this path becomes permanently
publicly visible, because `resolveListingLifecycle` with `expirationRequired: true` and a null
`expires_at` returns `unknown` → `isPubliclyVisible: false`… *unless* the row is treated as
termless. Either way the row's commercial truth is destroyed.

Reachability, traced precisely:

| Caller | Guard | Rentas reachable? |
|---|---|---|
| `/api/clasificados/leonix/stripe/webhook` | ignores `leonix_*` metadata (canonical Revenue OS) **and** requires `session.metadata.category === "bienes-raices"` | **NO — double-guarded** |
| `/api/clasificados/leonix/stripe/checkout` | legacy BR checkout creator | NO (BR-only creation) |
| `revenueBienesNegocioFulfillment.ts` | BR Negocio only | NO |
| **`/api/clasificados/leonix/stripe/checkout/verify` (GET)** | **NO category guard. NO Revenue-OS-session guard.** Requires only `payment_status === "paid"` and reads `listing_id` from session metadata | **YES — LATENT** |

A canonical Revenue OS Rentas checkout session **is** `paid` and **does** carry `listing_id`. Passing
its `session_id` to that GET endpoint activates the Rentas row with no term. The write requires
`status="pending"` + `is_published=false`, so in practice it races the canonical webhook — but it is
a genuine unguarded endpoint, not a theoretical one. The only live caller today is
`BrPagoExitoClient.tsx:97` (the **BR** success page), so no live Rentas client reaches it.

**Classification: BUILT-NOT-WIRED for Rentas, but REACHABLE.** The sibling webhook already carries
exactly the guard this route lacks.

#### P2 — duration and renewal price are hardcoded literals, not matrix-derived

`listingLifecycleConfig.ts`:

```ts
export const RENTAS_LIFECYCLE_DURATION_DAYS = 30;
...
renewalPriceCents: 2499,
```

Both duplicate values the Revenue OS matrix already owns for `rentas_30d`. `revenueRentasFulfillment`
passes `RENTAS_LIFECYCLE_DURATION_DAYS` into `computeFixedDayRenewalExpiresAt`. If the owner ever
re-terms or re-prices Rentas in the matrix, the **term written to the row and the renewal price shown
to the owner would silently disagree with the price actually charged.**

Bienes Privado solved exactly this in Gate BIENES-PRIVADO-1 with `bienesFsboDurationDays()` reading
`getRevenuePackageDefinition("br_fsbo_45d")?.durationDays`. The same one-line pattern applies here.
Not currently wrong — currently 30 and 2499 both match the matrix — but it is unguarded drift.

#### P3 — no `expires_at` write on the pre-payment publish

Correct and intended (the term must start at payment), recorded only so it is not mistaken for a gap.

---

## 5. IDENTITY / HYDRATION — **THE P0 OF THIS CATEGORY**

### 5.1 What is solid

| Requirement | Evidence | Status |
|---|---|---|
| canonical `listings.id` | one row per listing, created at pending-publish, never re-inserted | **PROVEN** |
| `leonix_ad_id` preservation | the edit route rejects a mismatch with **409 `leonix_id_mismatch`** | **PROVEN** |
| durable draft identity | `rentas-negocio-draft-v1` session draft + IndexedDB inline + `rentasListingEditWorkspace` anchored to the row's `updated_at` (draftWorkspaceContract Rule 3) | **PROVEN** |
| Preview → Edit | `editContext` + `loadRentasListingEditWorkspace({ listingId, lane:"negocio", merge })` | **PROVEN** |
| same-row republish | see §5.2 — structurally guaranteed | **PROVEN** |
| no recharge | see §5.2 | **PROVEN** |

### 5.2 The edit route is genuinely non-destructive — and that matters

`POST /api/clasificados/rentas/listing-edit` is a strong same-row route:

- id **+ owner_id + category** scoped on both read and write;
- **lane derived from the ROW** (`lx.branch === "rentas_negocio" || seller_type === "business"`),
  never trusted from the client, and mismatches rejected 422;
- `leonix_ad_id` mismatch rejected 409;
- `rejectUnsafeMedia` blocks `data:`/`blob:`/non-http media from reaching a published row;
- `mergeDetailPairs` **preserves** existing pairs whose labels are absent from the new set;
- `nextImages = built.params.imageSources.length ? ... : existing.images` — media survives an
  empty draft;
- **the patch never touches `status`, `is_published`, `published_at` or `expires_at`.**

That last line is the structural proof of **NO-RECHARGE and NO TERM RESET**: an ordinary edit
cannot republish, cannot reactivate, and cannot extend or restart the 30-day term. Nothing in the
edit path calls Revenue OS or Stripe.

### 5.3 P0 — `rentasDashboardEditHydration.ts` IS the destructive reverse mapper

The route is safe. **The hydration that feeds it is not.**

`rentasDashboardEditHydration.ts` is **134 lines** on this branch. `basePartialFromRow` restores
roughly 30 of `RentasNegocioFormState`'s ~103 fields, plus exactly three Negocio fields
(`negocioNombre`, `negocioTelDirecto`, `negocioEmail`).

Everything below is **never read back**, so a dashboard edit rebuilds it from `createEmpty…`
defaults:

| Group | Fields lost |
|---|---|
| business identity | `negocioMarca`, `negocioLogoDataUrl`, `negocioLicencia`, `negocioTelOficina`, `negocioWhatsapp`, `negocioMensajesTexto` (+ per `67919479`: `negocioSitioWeb`, `negocioRedes`, `negocioGoogleReviewsUrl`, `negocioYelpReviewsUrl`, `negocioBio`, `negocioIdiomas`) |
| address block | `direccionLinea1`, `direccionLinea2`, `direccionCruceCercano`, `direccionNumero`, `direccionCalle`, `ubicacionLinea`, `enlaceMapa`, **`mostrarDireccionExacta`**; `zonaVecindario` is explicitly set to `""` |
| structured utilities | `serviciosIncluidosKeys`, `serviciosIncluidosOtro` (only the legacy free-text string is restored) |
| lease | `plazoContratoOtro` |
| flow extensions | all 6 `rentasEspacio*`, all 6 `rentasAlmacen*`, all 5 `rentasComercial*`, all 4 `rentasLote*` |
| contact | `notaContacto` (hardcoded `""`) |
| media | `primaryImageIndex: 0` — the owner's chosen cover reverts to the first photo |
| country | `direccionPais: "United States"` — **hardcoded**, overwriting whatever the row held |

Why this is destructive rather than merely lossy:

1. **`business_meta` is a whole-column overwrite.** `buildRentasNegocioListingParams` builds
   `businessMetaJson` **entirely from `state`**
   (`rentasNegocioToBienesRaicesNegocioState(state)` + `buildGate12cNegocioMetaOverlayFromRentasNegocio(state)`),
   and the edit route writes `business_meta: built.params.businessMetaJson ?? null` unconditionally.
   `mergeDetailPairs` cannot protect a column. **An ordinary edit therefore replaces the published
   business identity with one rebuilt from a mostly-empty form.**
2. **`mergeDetailPairs` protects only *absent* labels.** When a rebuilt-from-default state causes a
   `Leonix:` pair to be emitted with an **empty value**, the merge treats it as a replacement and
   overwrites the real one. Whether each specific facet builder emits empty pairs is the one
   remaining thing Gate 1 must enumerate before writing the fix.
3. Partial protections that *do* hold: `business_name` survives via `negocioNombre`;
   `contact_phone` survives via `negocioTelDirecto`; `city`/`state`/`zip`/`price`/`title`/
   `description` all hydrate; the gallery survives (`photoDataUrls` from `row.images`).

**This is the same defect class as Bienes Negocio's Gate BN-1 P0, in the same shape, and it is
unrepaired on this branch.**

### 5.4 Sealed Globalization `67919479` — independent trace confirms it exactly

Inspected read-only **after** the current-runtime trace above, per instruction. Its message
independently names the identical field groups this trace found, plus six business fields not
enumerated here:

> "…nearly every business-identity field (negocioMarca, negocioLogoDataUrl, negocioLicencia,
> negocioTelOficina, negocioSitioWeb, negocioRedes, negocioGoogleReviewsUrl, negocioYelpReviewsUrl,
> negocioBio, negocioIdiomas) was never read back at all; the entire address block (line,
> exact-address toggle, zonaVecindario) had no read-back; and the structured
> residencial/comercial/terreno property facts plus the flow-specific extension blocks
> (room_shared/storage_parking/commercial_space/land_parcel) were completely absent."

It also records one defect this trace had not reached: WhatsApp/SMS digits **are** computed
correctly but are stranded on a `seller` partial key that `mergePartialRentasNegocioState` never
reads back (it maps only top-level `negocioWhatsapp`/`negocioMensajesTexto`) — visible in the
current file at lines 68-72, which write `seller: { whatsapp, mensajesTexto, … }` for a Negocio
state that has no `seller` slice.

| | |
|---|---|
| current file | **134 lines** |
| `67919479` version | **347 lines** (+225) |
| ancestor of HEAD | **NO** |
| touches | `rentasDashboardEditHydration.ts`, one verifier assertion; adds `scripts/verify-wave4-p0-rentas-negocio-hydration-2026-09-09.ts` |
| method it used | the **same reading primitives already proven on the live public page** — `parseRentasDetailMachineRead`, `readLeonixPropertyLocationFromRow`, `rentasShowExactAddressFromDetailPairs`, the shared BR Negocio `business_meta` key schema |
| known accepted limitation | `tipoCodigo`/`subtipo` reverse-label matching left at schema defaults, mirroring the accepted limitation in the proven Bienes Negocio parser |

**Forward-ported nothing.** This is the single highest-value Gate 1 action for this category, and it
must be re-derived against current source rather than cherry-picked blindly — the file has diverged
(this branch's version already carries `updated_at` in its SELECT and the workspace anchoring the
sealed commit's message does not mention).

---

## 6. RENTAS-SPECIFIC DATA

All persisted through `Leonix:` machine pairs read by `parseRentasDetailMachineRead` — **one
reader**, used by the public mapper, the Admin inspector and the edit hydration alike.

| Datum | Machine field | Written | Public read | Edit read-back |
|---|---|---|---|---|
| availability / `estadoAnuncio` | `listingStatus` | ✅ | ✅ (gates `browseActive`) | ✅ |
| requirements | `requirements` | ✅ | ✅ | ✅ |
| services/utilities (structured) | `serviciosIncluidosKeys` | ✅ | ✅ | ❌ **lost** |
| services/utilities (legacy text) | `servicesIncluded` | ✅ | ✅ | ✅ |
| bedrooms / bathrooms | BR machine facets | ✅ | ✅ | ❌ **lost** (structured property facts) |
| rent | `listings.price` column | ✅ | ✅ | ✅ |
| deposit | `depositUsdDigits` | ✅ | ✅ | ✅ |
| lease term | `leaseTermCode` | ✅ | ✅ | ✅ (`plazoContratoOtro` ❌) |
| lease conditions | `leaseConditions` | ✅ | ✅ | ✅ |
| pets | `petsCode` | ✅ | ✅ | ✅ |
| furnished | `furnishedCode` | ✅ | ✅ | ✅ |
| parking / amenities | BR machine facets + highlight slugs | ✅ | ✅ | ❌ **lost** |
| rental type | `rentalTypeCode` / `rentalTypeCustom` | ✅ | ✅ | ✅ |
| property type | `categoriaPropiedad`, re-derived from `tipoDeRenta` at publish (Item 13 fix) | ✅ | ✅ | ✅ |
| showing / schedule | `showingByAppointment`, `showingAvailability`, `showingInstructions` | ✅ | ✅ | ✅ |
| virtual tour | `virtualTourUrl` | ✅ | ✅ | ✅ |
| flow extensions (room_shared / storage_parking / commercial_space / land_parcel) | 21 `rentas*` fields | ✅ | ✅ | ❌ **all lost** |
| contact / inquiry | `/api/clasificados/rentas/inquiry` | **LIVE** | — | — |

The write and public-read halves are complete and consistent. **Every gap in this table is the same
single hydration defect from §5.3.**

---

## 7. ADDRESS / PRIVACY / COUNTRY

### 7.1 Exact-address preference — enforced BY CONSTRUCTION at write time

`leonixBrMachineFacetPairsFromFormState.ts:143`:

```ts
state.mostrarDireccionExacta === true ? buildRentasStreetLine(state) : state.direccionCruceCercano.trim()
```

The street line is only ever composed when the owner opted in; otherwise the cross-street is
persisted instead. Because the exact address is never written without opt-in, no public reader can
leak it. **This is stronger than the read-time gating Bienes Privado needed repaired.**
**PROVEN.**

Consequence of §5.3 worth stating plainly: because `mostrarDireccionExacta` is not hydrated, a
dashboard edit rebuilds it at its default and the address **tightens** rather than leaks. Real data
loss, but the failure direction is safe.

### 7.2 City / state / ZIP — real columns, real normalization

`city` (via `rentasPublishCity`), `state`, `zip` (via `zipFromRentasDraft`) are all persisted as
first-class `listings` columns and are read back by hydration. Maps/directions come from the shared
`enlaceMapa` / Google Maps query path. **PROVEN.**

### 7.3 P1 — hardcoded country

`rentasDashboardEditHydration.ts` sets `direccionPais: "United States"` unconditionally. There is no
country column read, no fallback to the row's persisted country, and no locale awareness. Any
Rentas listing whose country was ever anything else silently becomes "United States" on the owner's
next edit.

### 7.4 `browseActive` polarity asymmetry (P3)

Browse and section selectors use `browseActive !== false`; Saved Search uses `browseActive !== true`.
A row where the field is `undefined` therefore **appears in browse but never matches a Saved
Search**. For DB-backed rows the mapper always sets it, so this only bites the demo pool
(`rentasResultsDemoData.ts`, which hardcodes `browseActive: true`). Recorded, low risk, but the two
predicates should agree.

### 7.5 Shared `businessAddress` / address-provider work

`app/lib/businessAddress/` and `app/components/forms/BusinessAddressVerifiedInput.tsx` exist on this
branch. **No Rentas file imports either.** For Rentas Negocio this is **UNNECESSARY, not a gap**:
the category never claims external street verification, and the master's own address rule forbids
claiming verification without a real provider. Classification: **BUILT-NOT-WIRED (correctly so, for
this category).**

---

## 8. MEDIA

| Requirement | Evidence | Status |
|---|---|---|
| durable before checkout | the Negocio preview uploads photos/logo before `publishLeonixListingFromRentasNegocioDraft`, and surfaces a real upload error (naming `BLOB_READ_WRITE_TOKEN`) rather than publishing broken refs | **PROVEN** |
| shared media contract consumed | `buildProposedFinalMediaSet` + `validateProposedFinalMediaSet` in `buildRentasNegocioListingParams` (max 8, `logoAllowed:false`, `maxExternalVideos:0`) | **PROVEN (LIVE-SHARED)** |
| no `data:`/`blob:` on a published row | `rejectUnsafeMedia` in the edit route | **PROVEN** |
| edit hydration | gallery restored from `row.images`, http(s)-filtered | **PROVEN** |
| republish persistence | `nextImages` falls back to `existing.images` | **PROVEN** |
| **cover / order** | hydration hardcodes `primaryImageIndex: 0` | **PARTIAL — cover choice lost on edit** |
| **`droppedUnpersistable` owner warning** | **zero matches for `droppedUnpersistable` or `warnDroppedUnpersistableMedia` anywhere under Rentas.** The media set is built and validated, but its `droppedUnpersistable` list is computed and discarded | **NOT PROVEN — the exact gap Gate BIENES-PRIVADO-1 closed for FSBO** |

---

## 9. BILINGUAL / CTA

| Tool | Rentas Negocio consumer | Status |
|---|---|---|
| ES/EN | `resolveClasificadosPublishLang` + per-copy `es ? … : …` throughout | **LIVE-SHARED** |
| Translate Ad | registry declares `translateAd: "supported"` for `rentas-negocio` | **LIVE-SHARED** |
| unsaved-exit protection | `suspendExitClearRef` pattern present in the preview clients | **LIVE** |
| Call / SMS / Correo | `mapRentasListingLiveToPreviewVm` builds real `tel:` / `sms:` / `mailto:` with E.164 | **LIVE** |
| newsletter | `captureCheckoutNewsletterSubscriber({ source: CHECKOUT_NEWSLETTER_SOURCES.rentas, interests: RENTAS_NEWSLETTER_INTERESTS.negocio })` | **LIVE but `void`** — see P1 below |
| one-time price cadence | `getRentasNegocioCheckpointCard` uses the shared `oneTimePrice(…, lang, 30)` repaired in Gate BIENES-PRIVADO-2 — ES `días` / EN `days` | **PROVEN** |

### 9.1 P1 — WhatsApp: three different rules, none of them the shared contract

| Builder | Behavior | Classification |
|---|---|---|
| `mapRentasListingLiveToPreviewVm.ts:76` (**live public detail**) | prefixes `1` for a 10-digit US number — correct | **LIVE but a local copy of the rule** |
| `mapRentasNegocioStateToPreviewVm.ts:70` (**Negocio Preview**) | `https://wa.me/${d}` with **no country code** → an unroutable link for a 10-digit US number | **BROKEN (pre-Preview)** |
| `mapRentasPrivadoStateToPreviewVm.ts:61` | same bare-digit bug (Privado lane, next gate) | BROKEN |

None consumes `app/lib/whatsapp/internationalWhatsApp.ts`. The concrete Negocio consequence: **the
Preview shows the owner a WhatsApp link that does not work, while the published page shows one that
does.** The Negocio preview also hardcodes `RENTAS_LEAD_MESSAGE_ES` regardless of `lang`, where the
live mapper correctly uses `rentasLeadSmsBody(lang)`.

### 9.2 P2 — newsletter capture is fire-and-forget

`RentasNegocioPreviewClient.tsx:185` — `void captureCheckoutNewsletterSubscriber({...})`. The shared
engine returns a usable `{ status: "FAILED"; reason }`, but `void` makes it structurally
unreachable, so a failed capture is silent. Identical to the defect Gate BIENES-PRIVADO-2 repaired
for FSBO, and Rentas has the same non-blocking surfacing options.

---

## 10. DISCOVERY

| Surface | Status | Evidence |
|---|---|---|
| results filters | **LIVE** | `RentasResultsClient` + `rentas/shared/filters` |
| **Saved Search** | **LIVE — fully wired end to end** | 6-file adapter set; `SavedSearchButton` mounted at `RentasResultsClient.tsx:410`; `rentasFilterStateToSavedSearch` normalizes filters; ledger CHECK migration `20260819150000_saved_search_match_events_br_rentas.sql` already accepts `'rentas'`; `triggerRentasSavedSearchMatchBestEffort` fires from the **real fulfillment** on both `rentas_publish_activation` and `rentas_renewal_activation` |
| canonical public URL | **LIVE** | `rentasListingPublicPath` — one builder, used by the alias redirect, the dashboard card, the Saved Search delivery resolver and metadata `alternates.canonical` |
| fixed-term eligibility consistency | **PROVEN** | §4.3 — one mapper, five consumers, including direct-URL detail |
| **Related Listings** | **ABSENT** | no related/similar rail on `RentasListingDetailClient`. `RentasLandingFeatured` is a landing section, not a detail rail. Rentas has no inventory-group relationship, so the FSBO approach from Gate BIENES-PRIVADO-2 (city / property type / operation / price / beds-baths, shared reader, shared expiry rule) is the direct precedent |
| **JSON-LD** | **ABSENT** | zero `application/ld+json` anywhere under `app/(site)/clasificados/rentas`. The detail page sets `title`/`description`/`alternates.canonical`/`openGraph` (Package F Build F2 Gate 7) but emits **no structured data**. Rentas is a rental marketplace — `RealEstateListing --mainEntity--> Apartment/House` with an `Offer` carrying `businessFunction: LeaseOut` is the natural shape, mirroring `bienesRaicesJsonLd.ts` |
| **Sitemap** | **ABSENT** | `app/sitemap.ts` contains **zero** `rentas` matches. Servicios, Restaurantes, Comida Local and Bienes Raíces each have a DB-backed section; Rentas has none |

---

## 11. OWNER COMMAND CENTER (Bible as contract only — worktree not opened)

| Bible §12 (Rentas) expectation | This branch | Class |
|---|---|---|
| canonical manage doorway | `LeonixRealEstateListingManageCard` + `/dashboard/mis-anuncios/[id]` | **LIVE** |
| edit | `RentasNegocioForm` edit context → the same-row route (§5.2) | **LIVE** (hydration-destructive, §5.3) |
| public | `rentasListingPublicPath` (`withRentasLandingLang`) | **LIVE** |
| analytics | `rentasAnalytics.ts` consumed by the live detail client, the shared preview view and the result card | **LIVE** |
| lifecycle | pause/resume/archive via the shared owner client | **LIVE-SHARED** |
| expiration | `row.expires_at` → `listingExpireIso` + days chip on the entity workspace | **LIVE** |
| renewal | `startFixedTermRenewal` on the Mis Anuncios **card** | **PARTIAL** — see 11.2 |
| payment/entitlement truth | generic entitlement-badge route receives Rentas items | **PARTIAL / unproven** |
| **real category-specific tools** | none registered | **NEEDS_DATA** |
| **no fake business inventory tools** | `inventory` unset → `unsupported` | **PROVEN correct** |
| same-row / no-recharge | §5.2 | **PROVEN** |

**OWNER COMMAND CENTER: PARTIAL.**

### 11.1 P2 — the `rentas-negocio` capability row is effectively DEAD-ZERO-CONSUMER, and contradicts its own comment

`mis-anuncios/[id]/page.tsx:652` states:

> "Rentas Privado and Rentas Negocio carry identical lifecycle/analytics capability shapes in the
> registry, so a `rentas` row resolves to `rentas-privado` regardless of actual branch."

**The comment is false.** In `ownerEntityCapabilityRegistry.ts`:

- `rentas-privado` → `identity.analytics: "supported"`
- `rentas-negocio` → `identity.analytics: "unsupported"`

They are not identical. Because the page always resolves `rentas-privado`, the `rentas-negocio` row
is never read there — so Negocio analytics render today **only because the wrong row is consulted**.
Correcting the branch resolution without first fixing the row would silently delete Negocio
analytics. Rentas analytics are demonstrably live (§11 table), so `unsupported` is simply wrong.

`rentas-negocio` also declares no `specialized` and no `commercial` block, so both default to fully
unsupported — the same understatement class corrected for `bienes-raices-privado` in Gate
BIENES-PRIVADO-2.

### 11.2 P2 — the canonical workspace has no renewal action for Rentas

`canRenew` on `/dashboard/mis-anuncios/[id]` is FSBO-gated
(`capabilities?.lifecycle.renew === "supported" && fsboLifecycle?.isRenewalEligible`). Both Rentas
rows declare `renew: "specialized"`, and `fsboLifecycle` is null for a Rentas row. So an owner who
opens their Rentas listing's own workspace sees the expiration date with **no way to act on it**,
and must navigate back to the list — the exact gap Gate BIENES-PRIVADO-2 closed for FSBO, with the
same shared reader and shared checkout already available.

---

## 12. ADMIN OS (Book as contract only — worktree not opened)

`/admin/workspace/clasificados/rentas` is the generic `ListingsCategoryOpsQueuePage`
(`categorySlug="rentas"`); `/admin/workspace/clasificados/rentas/[id]` is a **dedicated Rentas
inspector** — richer than what Bienes Raíces has.

| Admin capability | Class (Book §7) | Evidence |
|---|---|---|
| see Rentas listings; q/status/owner/live-scope filters | **WORKS** | shared `fetchListingsForAdminWorkspaceFiltered` |
| canonical id + Leonix ad id | **WORKS** | selected and rendered |
| status · is_published | **WORKS** | queue columns |
| **`expires_at`** | **WORKS** | selected by `LISTINGS_ADMIN_CORE`; the dedicated inspector selects it explicitly in **both** column tiers; `AdminListingMonetizationSummary` renders `exp <date>` — and Rentas genuinely writes the column |
| **seller lane (Negocio vs Privado)** | **NEEDS_DATA** | the queue's BR bits line gained `lane:` in Gate BIENES-PRIVADO-2 for `bienes-raices` only. For `rentas` no lane marker is rendered, though `seller_type` is already selected and `parseLeonixListingContract(...).branch` already distinguishes `rentas_negocio` |
| **current term state / renewal eligibility** | **NEEDS_DATA** | same shape as the BR gap closed in Gate BIENES-PRIVADO-2: the data exists (`expires_at` + `RENTAS_LISTING_LIFECYCLE_CONFIG`), the surface does not derive it |
| payment / entitlement | **PARTIAL** | the shared monetization column reads the real entitlement source; nothing Rentas-specific, nothing inferred from status |
| moderation / report | **WORKS** | shared `ClassifiedAdminQueueRowActionsPanel` + `AdminListingFlagTruthBlock` |
| analytics | **NEEDS_DATA** | not surfaced in the queue |
| edit / control destination | **WORKS** | `/admin/workspace/clasificados/listings/[id]/edit` + the dedicated Rentas inspector |

**ADMIN OS: PARTIAL.** Nothing is orphaned, misrouted or duplicated. Every gap is a
read-registration of data the source already selects. **The Admin OS worktree was not opened or
modified.**

---

## 13. GLOBALIZATION FIXES AVAILABLE (sealed branch, read-only)

Inspected **after** current-runtime tracing. **Nothing forward-ported.**

| Commit | Relevance to Rentas Negocio | Portability |
|---|---|---|
| **`67919479`** | **THE P0.** Rentas Negocio dashboard-edit destruction (§5.4). 225 lines to the exact file that is unrepaired here | **HIGH — re-derive against current source, do not cherry-pick blindly** (this branch's file already diverged: it carries `updated_at` in the SELECT for workspace anchoring) |
| `9ae1a0f2` | international phone repair — directly addresses §9.1's three divergent WhatsApp builders | **HIGH** |
| `bd2ee01e` | unpersistable-media warning — directly addresses §8's missing `droppedUnpersistable` surfacing | **HIGH** (the FSBO adoption in Gate BIENES-PRIVADO-1 is the closer, already-on-branch precedent) |
| `3c23e875` | address-source adoption — relevant to §7.3's hardcoded country | **MEDIUM — verify necessity first**; Rentas may not need the provider at all (§7.5) |
| `3eacdec9` | self-engagement repair | **VERIFY** — check whether the Rentas detail client already carries `isSelfEngagement` |
| `733408dd` | Bienes Negocio dashboard-edit repair | reference only — already forward-ported for BR in Gate BIENES-NEGOCIO-1; its **method** (one shared published-row→form-state parser) is the model for `67919479` |

---

## 14. GATE ZERO — RESOLVED

| Gate Zero item | Answer |
|---|---|
| entry route | `/clasificados/publicar/rentas/negocio` (+ duplicate `/publicar/rentas/negocio`) |
| checkpoint | `RentasPublicarHubClient` → `getRentasNegocioCheckpointCard` |
| application | `RentasNegocioApplication` → `RentasNegocioForm` |
| draft identity | `rentas-negocio-draft-v1` (session) + IndexedDB + `rentasListingEditWorkspace` anchored to `updated_at` |
| preview | `/clasificados/rentas/preview/negocio` → `RentasNegocioPreviewClient` |
| checkout | `startRevenueCategoryCheckout({ ...RENTAS_CATEGORY_CHECKOUT })` → `/api/revenue-os/checkout` |
| publish action | `publishLeonixListingFromRentasNegocioDraft(..., "pending_payment")` |
| activation | `activatePaidRentasListingFromRevenueOs` (Revenue OS webhook) |
| results | `/clasificados/rentas/results` → `RentasResultsClient` |
| public detail | `/clasificados/rentas/listing/[id]` (category-owned, **not** `/clasificados/anuncio`) |
| dashboard | `/dashboard/mis-anuncios` card + `/dashboard/mis-anuncios/[id]` workspace |
| admin | generic ops queue + dedicated `/admin/workspace/clasificados/rentas/[id]` inspector |
| edit route | `POST /api/clasificados/rentas/listing-edit` |
| republish action | same-row patch (never touches status/publish/term) |
| lifecycle reader | `resolveListingLifecycle` + `RENTAS_LISTING_LIFECYCLE_CONFIG` via `mapListingRowToRentasPublicListing` |
| analytics recorder | `rentas/analytics/rentasAnalytics.ts` |

**Gate Zero is CLEAR. Implementation may proceed.**

---

## 15. PROTECTED / NO-TOUCH

- `RentasNegocioForm.tsx` and the whole pre-Preview application UX
- `RentasNegocioPreviewClient` / `RentasVisualMatchPreviewView` layout and visual contract
- the Saved Search 6-file adapter set (LIVE and complete — do not rebuild)
- `mapListingRowToRentasPublicListing` (the single shared public mapper — extend, never fork)
- `POST /api/clasificados/rentas/listing-edit` (the non-destructive same-row route)
- the Bienes Raíces capacity RPC and every Bienes/Servicios/Restaurantes/Comida locked path
- the legacy `/api/clasificados/leonix/stripe/*` routes — **must stay dead for Rentas**; guard, do
  not revive, do not delete

---

## 16. READY-TO-WIRE SUMMARY

**NEW ENGINE REQUIRED: NO.** Every gap is an ADOPT of an engine already on this branch, a REPAIR of
a broken wire, or a small forward-port whose semantics are already proven in a locked category.

| Priority | Item | Action |
|---|---|---|
| **P0** | `rentasDashboardEditHydration.ts` destroys business identity, the address block, structured utilities and all 21 flow-extension fields on every dashboard edit | **REPAIR** — re-derive `67919479`'s semantics against current source, using the same live-page reading primitives; model it on the Gate BN-1 single-shared-parser method |
| **P0** | `/api/clasificados/leonix/stripe/checkout/verify` can activate a Rentas row with no `expires_at` (no category guard, no Revenue-OS-session guard) | **REPAIR** — add the same two guards its sibling webhook already has |
| **P1** | WhatsApp: Negocio Preview emits a country-code-less `wa.me` link; three divergent local rules; shared contract unused | **ADOPT** `internationalWhatsApp` |
| **P1** | `direccionPais` hardcoded `"United States"` in hydration | **REPAIR** — falls out of the P0 hydration work |
| **P1** | `droppedUnpersistable` computed and discarded; no owner warning | **ADOPT** the shared `warnDroppedUnpersistableMedia` pattern (FSBO precedent already on branch) |
| **P2** | duration `30` and renewal price `2499` are hardcoded literals, not matrix-derived | **REPAIR** — mirror `bienesFsboDurationDays()` |
| **P2** | newsletter capture is `void` — failure unreachable | **ADOPT** the FSBO/Comida Local pattern |
| **P2** | `rentas-negocio` capability row wrong (`analytics: "unsupported"`) and effectively unread; page comment asserts a false equivalence | **REPAIR** — read registration + correct the comment |
| **P2** | no renewal action on the canonical owner workspace | **ADOPT** the Gate BIENES-PRIVADO-2 wiring |
| **P2** | Admin shows no Rentas lane / term state / renewal eligibility | **ADOPT** the Gate BIENES-PRIVADO-2 read registration |
| **P2** | cover photo reverts to index 0 on edit | **REPAIR** — part of the P0 hydration work |
| **P2** | no JSON-LD anywhere in Rentas | **NEW CODE** — mirror `bienesRaicesJsonLd.ts` (`LeaseOut` offer) |
| **P2** | Rentas entirely absent from `app/sitemap.ts` | **NEW CODE** — the 6th DB-backed section, mirroring the BR reader |
| **P3** | no Related Listings rail on Rentas detail | **NEW CODE** — the FSBO lane switch from Gate BIENES-PRIVADO-2 is the direct precedent |
| **P3** | `browseActive` polarity differs between browse (`!== false`) and Saved Search (`!== true`) | **REPAIR** — make the two predicates agree |
| **P3** | two live URLs for one publish application | **DECIDE** — canonicalize or redirect; do not delete blindly |

---

## 17. GATE RENTAS-NEGOCIO-1 — WHAT WAS BUILT (evidence)

Gate status: **RENTAS-NEGOCIO-1 COMPLETE.** One commit, 12 files. No migration applied. No database
row touched. Nothing deleted. The Application form and the Preview view component were not
redesigned. No Owner Command Center or Admin OS worktree opened.

Verifier: `scripts/verify-rentas-negocio-gate1-stabilization.ts` — **161/161 PASS**. All eleven
other locked verifiers pass. ESLint over the changed scope: **0 new errors** (two pre-existing
unused-const errors in `verify-saved-search-br-rentas-06.ts` proved pre-existing by linting the HEAD
revision). Targeted `tsc --noEmit` across all nine changed modules: **0 errors**.

### 17.1 The centrepiece: a real published → edit → publish round trip

The most important thing in this gate is not a source assertion. It is a **behavioral** test that
seeds a fully-populated Rentas Negocio form state, publishes it to params, synthesizes the
`listings` row exactly as the edit route persists it, hydrates that row back, re-publishes, and
compares the two parameter sets field by field.

That is the only honest way to prove *"a no-op edit preserves the published listing"* — a grep
cannot. It compares every column the edit route writes, `business_meta` byte-for-byte, the gallery
and its cover, and **every `detail_pairs` label**, failing if any label loses its value.

**It immediately found two real defects that source review had missed**, both of which are repaired
below (§17.4, §17.5). Without the round trip this gate would have shipped a hydration that still
corrupted addresses on every edit.

### 17.2 P0 — the legacy activation bypass is CLOSED, permanently

§4.4 recorded that `tryActivateBrListingAfterPayment`'s generic branch flips any `listings` row to
active/published and **cannot** write `expires_at`, and that
`/api/clasificados/leonix/stripe/checkout/verify` reached it with no category guard and no
Revenue-OS-session guard.

Closed in two places, deliberately:

**(a) The boundary — `app/lib/listingLifecycle/fixedTermActivationGuard.ts` (new, pure).**
Guarding only the route would leave the hazard one new caller away. This module states the rule once
in lifecycle terms: a row whose lane carries a paid fixed term may only be activated by that lane's
own term-writing fulfillment. The generic branch now consults it and **fails closed with a typed
error before any write**.

It is deliberately narrow — it recognises only the two lanes that genuinely persist a term today
(Rentas `rentas_30d`, Bienes FSBO `br_fsbo_45d`) and returns "not required" for a subscription row,
an unmodelled category, or an unreadable row. **It can never block an activation it does not
positively understand.** Bienes Negocio, a subscription, is explicitly unaffected — proven
behaviorally.

Refusing here removes a bypass without removing a legitimate path: every fixed-term lane already has
its own dedicated fulfillment (`activatePaidRentasListingFromRevenueOs`,
`activatePaidBienesFsboListingFromRevenueOs`) and never reaches the generic branch in the canonical
flow. A side effect worth recording: the same boundary also closes the identical hazard for **Bienes
FSBO**, which Gate BIENES-PRIVADO-1 did not reach because it lived in this shared BR service rather
than in the Privado category source.

**(b) The endpoint.** The verify route now carries the two guards its sibling webhook has had since
Package C Build 1 — reject any session in the canonical `leonix_*` Revenue OS namespace, and accept
only `metadata.category === "bienes-raices"`. Both run before any activation call. The two halves of
the legacy lane finally agree. The route was **not deleted**: it has one proven runtime consumer
(`BrPagoExitoClient`, the BR success page), which only ever presents genuine legacy BR sessions.

**There is now exactly ONE paid activation authority for Rentas:**
`Revenue OS → Stripe → /api/revenue-os/webhook → activatePaidRentasListingFromRevenueOs`, which
writes the real 30-day `expires_at` through the shared fixed-term engine.

### 17.3 P0 — published → edit hydration, re-derived not cherry-picked

`rentasDashboardEditHydration.ts` was rewritten as THE canonical published-row → editable-state
interpretation, following the Gate BIENES-NEGOCIO-1 single-shared-parser method: one
`basePartialFromRow` shared by both lanes, with only business identity and flow extensions
lane-specific.

Re-derived from `67919479`'s **semantics**, and the re-derivation mattered — two things genuinely
differ on this branch:

1. **`leonixContactChannelsFormSliceFromPayload` does not exist here.** The payload → form-slice
   conversion is written locally against this branch's own shapes, inverting
   `buildLeonixContactChannelsV1PayloadFromFormSlice` exactly.
2. **`negocioGoogleReviewsUrl` / `negocioYelpReviewsUrl` do not exist** on this branch's
   `RentasNegocioFormState`. They are deliberately not restored — a blind cherry-pick would not have
   compiled and would have implied fields the owner cannot edit.

Now restored and **proven by round trip**: business brand, license, office phone, website, bio,
languages, business name and email; WhatsApp and SMS **at the top level the merge actually reads**
(the old version computed them correctly but stranded them on a `seller` key
`mergePartialRentasNegocioState` never reads); the whole address block including the exact-address
privacy toggle and the neighborhood; website/socials/call-SMS-WhatsApp preferences; structured
residencial/comercial/terreno property facts; deposit, lease term, pets, furnished, requirements,
availability, showing data, virtual tour, listing status, rental type; and all flow-extension
fields, with `room_shared` exercised end to end including a real `"no"` that must not degrade to
blank.

Rules the file obeys, each asserted: nothing is invented from prose (`tipoCodigo`/`subtipo` are left
at schema defaults rather than reverse-matched from translated labels — the same accepted limitation
as the proven Bienes Negocio parser); unknown legacy `detail_pairs` are never wiped, because this
mapper only reads and preservation stays with the edit route's untouched `mergeDetailPairs`; and an
unrecoverable value is left ABSENT so the form schema's own default applies rather than a guess.

### 17.4 Defect the round trip found: the composed address line

The first hydration draft read `direccionLinea1` from `pv("Ubicación") || pv("Dirección")`. But
`Dirección` is a **composed display line** — `"1234 Sebastopol Rd, Santa Rosa, CA 95407, Mexico"`.
Feeding it back into the raw street field and re-publishing would compose the city/state/ZIP a
second time, corrupting the address on **every** edit.

The street now comes from `Leonix:br_gate12d_v1`, the STRUCTURED payload the publisher itself
writes, which carries `streetAddress`, `neighborhood`, `state` and `zip` as the owner typed them.
The round trip is now stable, and the verifier fails if any `detail_pairs` label loses its value.

### 17.5 Defect the round trip found: Rentas Negocio was losing the country at PUBLISH

§7.3 recorded a hardcoded `direccionPais: "United States"` in hydration. The round trip proved the
problem was deeper: **the Negocio publish path never persisted the country at all.**

`buildRentasNegocioListingParams` converts to a Bienes Raíces Negocio state to reuse that lane's
facet builder, and `rentasNegocioToBienesRaicesNegocioState` carried `estado` and `codigoPostal` but
had **no country field**. The BR facet builder reads `state.pais`, found nothing, and fell back to
its own `"United States"` default. So a listing published with any other country had it silently
rewritten at publish, and no hydration fix could ever have recovered it. The Privado lane was never
affected because it does not go through that conversion.

Repaired with one field at the exact point of loss (`pais: trim(s.direccionPais)`), plus the
hydration fix: the persisted country is applied when it genuinely exists, and otherwise the field is
left blank so the form schema's own declared default applies — the literal is no longer repeated in
the hydrator. Proven both ways: `"Mexico"` survives a full round trip; a row with no persisted
country still yields `"United States"`.

### 17.6 WhatsApp — the shared contract adopted

| Builder | Before | Now |
|---|---|---|
| Negocio **Preview** | `wa.me/${digits}` with **no country code**, and `RENTAS_LEAD_MESSAGE_ES` hardcoded regardless of `lang` | `buildInternationalWhatsAppWaMeHrefWithText` + `rentasLeadSmsBody(lang)` |
| Live **public detail** | correct, but a third local copy of the rule | the same shared function |

The Negocio defect was concrete and customer-visible: the owner was shown a **dead** WhatsApp link
in Preview while the published page showed a working one, because the live mapper had its own
correct copy. Preview and public now resolve WhatsApp through the same function. The shared contract
additionally accepts legitimate 8- and 9-digit international numbers that the old `< 10 return null`
floor silently rejected, and enforces the 15-digit E.164 ceiling. All proven behaviorally. No new
phone engine; the existing ES/EN copy structure is reused.

*Remaining instance, out of scope:* `mapRentasPrivadoStateToPreviewVm.ts:61` has the identical
bare-digit bug. It belongs to the Rentas Privado lane and is recorded for that gate.

### 17.7 Media — cover proven correct; drop warning adopted

**Correction to this map's own §8.** It recorded "cover choice lost on edit" because hydration
hardcodes `primaryImageIndex: 0`. Re-tracing for this gate shows that is **not** a defect:
`orderedRentasGallerySourcesForPublish` rotates the gallery at publish so the chosen cover is stored
FIRST. The persisted order already encodes the cover, index 0 always points at it, and the round
trip is stable (hydrate `[cover, …]` at 0 → publish rotates by 0 → identical order). Proven
behaviorally with a cover at index 2: publish rotates it to index 0, and it is still the cover after
the round trip.

`warnDroppedUnpersistableMedia` is now adopted at both Rentas build boundaries — the shared engine
computed `droppedUnpersistable` on every call and discarded it, so a photo that failed to become a
durable URL simply vanished with nothing recorded. The build result carries the dropped list
(additive; every pre-existing caller is unaffected), and a concise bilingual warning is appended to
the core publish result's **existing** `warnings` channel — no new channel, no new engine.

The Negocio preview surfaces it as a **non-blocking** note with `role="status"`, deliberately
separate from `checkoutErr`: reusing the error channel would render a successful publish as a
failure. Asserted non-blocking by ordering — the note is set and checkout still proceeds.

### 17.8 Same-row / no-recharge — preserved, and untouched

The edit route was **not modified by this gate** (asserted). Its guarantees are now pinned by the
verifier so a future change cannot quietly weaken them: the patch never writes `status`,
`is_published`, `published_at`, `expires_at`, `owner_id`, `leonix_ad_id` or `id`; the write is id-,
owner- and category-scoped; a Leonix ad id mismatch is rejected; the lane is verified from the ROW;
`mergeDetailPairs` preserves unknown labels; unsafe media cannot reach a published row; and the path
contains no payment code at all.

### 17.9 Capability registry — the trap, deliberately NOT sprung

`"rentas-negocio"` is referenced **nowhere outside the registry** — zero consumers, proven by grep.
A rentas row always resolves through `rentas-privado`, where `analytics: "supported"`, which is why
Rentas analytics are live today.

Changing the row's `analytics: "unsupported"` would therefore be a no-op; changing the *routing* to
honor the branch would silently **delete** Negocio analytics unless both changed together. Per the
gate's own instruction the trap was recorded, not "fixed". **No capability regression is possible
because no capability behavior changed.** Pinned by assertions that the row is unchanged and that
neither dashboard surface names it.

Recorded for the later Owner Command Center reconciliation audit: the `rentas-negocio` row is
DEAD-ZERO-CONSUMER and contradicts both reality and the code comment at
`mis-anuncios/[id]/page.tsx:652`, which asserts the two Rentas rows are identical. They are not.

### 17.10 One assertion corrected in a previously locked verifier

`verify-saved-search-br-rentas-06.ts` asserted *"Rentas has TWO real publication hooks — legacy
shared-table branch AND Revenue OS branch"*. This gate retired the legacy one on purpose: that
branch can no longer activate a Rentas row, so its Saved Search dispatch was unreachable, and
leaving it would imply a live publication path that no longer exists.

The **assertion** was corrected, never the code — the same discipline applied in every prior gate.
It now asserts the stronger, true architecture: exactly ONE Rentas publication hook, on the only
path that can legitimately activate a Rentas listing, firing for both first publication and renewal,
with the Bienes Raíces dispatch on that same branch explicitly unaffected.

### 17.11 Test-data policy

No compatibility hack was added for current disposable QA listings, and **no database row was
deleted or touched**. The repaired hydration is designed for cleanly-created post-fix listings; it
degrades honestly on older rows (a value that was never persisted is left to the form's own default
rather than guessed).

### 17.12 Explicitly NOT done

JSON-LD, sitemap, Related Listings, broad Admin work, scheduler, browser QA, aesthetic cleanup,
migrations, and any change to the Application form or the Preview view component.

### 17.13 Remaining Rentas Negocio source gaps

| Priority | Item |
|---|---|
| P2 | duration `30` and renewal price `2499` are still hardcoded literals in `listingLifecycleConfig.ts` rather than matrix-derived (unguarded drift; `bienesFsboDurationDays()` is the pattern) |
| P2 | newsletter capture in the Negocio preview is still `void` — a FAILED result is unreachable |
| P2 | no renewal action on the canonical owner workspace for Rentas (list card only) |
| P2 | Admin surfaces no Rentas lane / term state / renewal eligibility, though it already selects the data |
| P2 | `rentas-negocio` capability row: DEAD-ZERO-CONSUMER and wrong — Owner Command Center reconciliation audit |
| P3 | `tipoCodigo`/`subtipo` are not reverse-matched from display labels (accepted limitation, shared with Bienes Negocio) |
| P3 | `browseActive` polarity differs between browse (`!== false`) and Saved Search (`!== true`) |
| P3 | two live URLs for one publish application |
| — | JSON-LD, sitemap and Related Listings: **RENTAS-NEGOCIO-2** |


---

**QUE RUJA EL LEÓN. HARD WORK. GOD FIRST.**
