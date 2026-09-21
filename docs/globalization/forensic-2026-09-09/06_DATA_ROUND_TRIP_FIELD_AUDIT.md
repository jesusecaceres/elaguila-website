# 06 — DATA ROUND-TRIP FIELD AUDIT (THE DESTRUCTIVE-EDIT SWEEP)

**Audit date:** 2026-09-09 · **Mode:** read-only forensic · **Scope:** P0 data-destruction on dashboard edit → republish.

## Refs used (verified, not assumed)

| Label | SHA | How verified |
|---|---|---|
| **TRUE current / production** | `origin/main` = `a0a4783971b42ea1d71ab2602d4720d0d590baf8` | `git rev-parse origin/main` |
| Sealed September branch | `e3956df893f5041ca22371c999038f297d536eae` | `git rev-parse e3956df8` |
| Local primary worktree (**STALE**, 112 commits behind) | `d09d979c1bdba40002ac5e985d6971ce6a87bb0f` | `git rev-parse HEAD` |

Every code claim below was read via `git show origin/main:<path>` / `git grep -n … origin/main`, **never** from the stale working tree. `/c/projects/elaguila-website-final-audit-fixes` was not read. Where a Sept-only fix is quoted it is labelled `@e3956df8`.

**Ancestry (re-verified, `git merge-base --is-ancestor`):**

```
733408dd  NOT ancestor of origin/main   (Wave 4 P0 — Bienes Negocio reverse mapper)
67919479  NOT ancestor of origin/main   (Wave 4 P0 — Rentas Negocio hydration)
16f45c77  NOT ancestor of origin/main   (Wave 4 P0 completion record)
```

→ **Production still carries both proven defects, and (new finding, §3.2) a third lane the Sept commit message never named.**

---

# STEP 1 — THE DEFECT SIGNATURE

## 1.1 What the two Sept commits actually fixed

### `733408dd` — Bienes Negocio

`--stat`:

```
.../listing/BienesRaicesNegocioLiveDetailShell.tsx  | 289 +-----------------
.../bienesPublishedToAgenteApplicationDraft.ts      | 107 +++----
.../parseBienesAgenteResidencialPublishedState.ts   | 326 +++++++++++++++++++++   (NEW)
```

- **Partial mapper:** `bienesPublishedRowToAgenteApplicationDraft()` in
  `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft.ts`
  — it maintained **its own thin ~17-field reverse mapper** instead of reusing the already-correct public-page parser, dropping **~130 of ~150 form fields**.
- **Destroyed field groups:** address block, business identity, agent/broker/co-agent, socials, Google/Yelp review links, business extra links, open house, CTAs, and all property-type sections.
- **The fix shape ("reverse mapper"):** extract the public detail shell's private `buildPublishedState()` into a shared pure module `parseBienesAgenteResidencialPublishedState.ts`, then point **both** the public page and the dashboard reverse mapper at it — one place that knows how to read a published row back into form state. The reverse mapper then merges only its own Bienes-inventory-pack extras (child properties, pack pricing confirmation) on top. `contact_phone`/`contact_email`/`zip` added to the owner `SELECT` so the shared parser's fallback chain resolves.

### `67919479` — Rentas Negocio

`--stat`:

```
.../rentas/shared/rentasDashboardEditHydration.ts   | 225 ++++++++++++++++++-
scripts/verify-family2-bienes-rentas-full-sweep.ts  |   4 +-
```

- **Partial mapper:** `rentasDashboardEditHydration.ts`.
- **Destroyed:** WhatsApp/SMS digits computed but **stranded on a `seller` partial key** `mergePartialRentasNegocioState` never reads; the whole business-identity block; the whole address block; all structured residencial/comercial/terreno property facts; all four flow-extension blocks.
- **Fix shape:** restore each one using **the exact reading primitives already proven correct on the live public Rentas page** (`parseRentasDetailMachineRead`, `readLeonixPropertyLocationFromRow`, `rentasShowExactAddressFromDetailPairs`, the shared BR Negocio `business_meta` key schema).

## 1.2 The signature, stated precisely

A lane is **DESTRUCTIVE** when all three hold:

1. **Read side** — a dashboard edit hydration reconstructs form state by **hand-enumerating fields** from a published row (rather than restoring a whole persisted snapshot, or reusing the proven public-page parser).
2. **Write side** — the republish path performs a **whole-value replace** of a column or blob built entirely from that (incomplete) form state.
3. Therefore every field in (2) that is missing from (1) is written back as the schema default → **silently destroyed**.

### 1.3 The write-side smoking gun (identical in both proven lanes)

`app/api/clasificados/bienes-raices/listing-edit/route.ts:159-186` and
`app/api/clasificados/rentas/listing-edit/route.ts:122-138` build the *same* patch shape:

```
business_meta: input.params.businessMetaJson ?? null,          // ← FULL COLUMN REPLACE
detail_pairs:  mergeDetailPairs(existing.detail_pairs, …),     // ← label-merge (partial shield)
```

- **`business_meta` is an unconditional whole-column replace.** Every business-identity field lives there → destroyed with certainty.
- **`detail_pairs` is label-merged** (`rentas/listing-edit/route.ts:27-50`; `bienes-raices/listing-edit/route.ts:180`): a label absent from the new pair set survives. **But** `route.ts:38-40` pushes the replacement **unconditionally, even when its value is empty** — so any label the payload builder *always* emits is still overwritten with the blank default. The merge is a partial shield, never a rescue.

### 1.4 The proven working reference implementations

| Reference | Path | Availability |
|---|---|---|
| Bienes shared parser (extracted) | `.../agente-individual/application/utils/parseBienesAgenteResidencialPublishedState.ts` | **Sept-only** — `git cat-file -e origin/main:…` → *does not exist* |
| Same logic, still inline & private on prod | `app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx:187` (`buildPublishedState`), consumed only at `:462` | **on `origin/main`** |
| Rentas repaired hydration | `app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration.ts` (347 lines) | **Sept-only** (`origin/main` = 134 lines) |
| Whole-snapshot round trip (the architecturally immune pattern) | `restaurantesPublicListingMapper.ts:292` `listingJsonToDraft`; `comidaLocalListingEditContext.ts:112` | **on `origin/main`** |
| Narrow-patch owner editor (immune by construction) | `app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx:530-597` + `applyOwnerListingPatch` (`ownerListingsLifecycleClient.ts:36-50`) | **on `origin/main`** |

---

# STEP 2 — LANE-BY-LANE SWEEP AT `origin/main`

## 2.0 Verdict table

| # | Lane | Verdict |
|---|---|---|
| 1 | bienes-raices **PRIVADO / FSBO** | **SAFE** (patch editor; heavily field-limited) |
| 2 | bienes-raices **NEGOCIO** (parent) | **DESTRUCTIVE** ← proven, Sept-only fix |
| 3 | bienes-raices **inventory property child** | **DESTRUCTIVE** |
| 4 | rentas **NEGOCIO** | **DESTRUCTIVE** ← proven, Sept-only fix |
| 5 | rentas **PRIVADO** | **DESTRUCTIVE** ← **NEW: shared code path, never named in the Sept commit message** |
| 6 | autos **PRIVADO** | **NO_EDIT_PATH** for an active listing (safe round trip, but no reachable write) |
| 7 | autos **DEALER parent** | **SAFE** (whole-blob round trip) |
| 8 | autos **DEALER inventory child** | **DESTRUCTIVE** |
| 9 | **empleos PREMIUM / paid** | **DESTRUCTIVE** — field-complete, but republish **forks a duplicate row and re-charges** |
| 10 | **empleos QUICK** | **DESTRUCTIVE** (one field wiped + same identity fork) |
| 11 | **servicios** | **DESTRUCTIVE** (conditional; server safety-net covers part of it) |
| 12 | **restaurantes** | **SAFE** — the prior stream's lead is **FALSE**; see §2.12 for a latent trap |
| 13 | **comida-local** | **SAFE** (whole-snapshot round trip, fail-closed) |
| 14 | **ofertas-locales** | **DESTRUCTIVE** (pre-approval statuses only) |
| 15 | **en-venta / varios** | **SAFE** (patch editor) |
| 16 | **comunidad / eventos** | **SAFE** (patch editor) |
| 17 | **clases** | **SAFE** (patch editor) |
| 18 | **busco** | **SAFE** (patch editor) |
| 19 | **mascotas-y-perdidos** | **SAFE** (patch editor) |
| 20 | **viajes** | **SAFE** (whole-snapshot round trip) |

Authoritative capability matrix cross-check: `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts:73-155` (`CATEGORY_LISTING_TOOL_TRUTH`).
Authoritative route map: `app/lib/listingIdentity/categoryRouteRegistry.ts` (per-adapter `editRoute`).

**Only four dashboard-edit hydration modules exist on `origin/main`** (exhaustive `git grep` for `PublishedToApplicationDraft|DashboardEditHydration|publishedRowTo|ToApplicationDraft|hydrate*ForDashboardEdit`):

```
app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft.ts
app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration.ts
app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts
app/(site)/publicar/autos/negocios/lib/autosPublishedToDealerApplicationDraft.ts
```

---

## 2.1 The shared narrow-patch owner editor — why six lanes are SAFE

**Route:** `/dashboard/mis-anuncios/{id}/editar`
**Shell:** `app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx`
**Save:** `page.tsx:530-597` builds an explicit allow-listed `payload` (`title`, `price`, conditional `is_free`, conditional `description`, plus the category adapter's own fields) and calls `applyOwnerListingPatch(supabase, id, userId, payload)` → `ownerListingsLifecycleClient.ts:36-50` `.update(patch)`.
**Adapters:** `app/(site)/dashboard/mis-anuncios/[id]/editar/categoryLifecycleAdapters.ts` — `upsertDetailPairs()` (`:63-72`) replaces only the labels the adapter owns and preserves *"every other pair (including ones no adapter here knows about) … untouched."*

**This architecture cannot exhibit the defect signature:** there is no form-state reconstruction, and no whole-column replace. Its real limitation is *scope*, not *safety* — most of each lane's field set is not editable at all, and the adapters document their frozen fields explicitly (`categoryLifecycleAdapters.ts:89-108`).

**Lanes routed here** (`categoryRouteRegistry.ts`): bienes-raices FSBO `:649`, en-venta `:932`, busco `:1121`, clases `:1172`, comunidad `:1213`, mascotas-y-perdidos `:1266`.
BR FSBO cross-confirmed at `app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx:343` (`fsboDashboardEditHref`) and `:345-347`.

**VERDICT (lanes 1, 15-19): SAFE.**

---

## 2.2 bienes-raices NEGOCIO (parent) — **DESTRUCTIVE**

- **(a) Hydration:** `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft.ts:105-160` (`bienesPublishedRowToAgenteApplicationDraft`), invoked by `hydrateBienesAgenteListingForDashboardEdit` at `:230`.
- **(b) Publish payload:** `app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts` → `app/api/clasificados/bienes-raices/listing-edit/route.ts:159-186` (`buildEditablePatch`).
- **(c) VERDICT: DESTRUCTIVE.** ~17 of ~150 fields restored. **Destroyed:** the full address block; every business-identity field in `business_meta` (whole-column replace at `route.ts:177`); agent / broker / co-agent identity; socials; Google & Yelp review URLs; business extra links; open house; CTAs; and every property-type section (residencial / comercial / terreno).
- On `origin/main` the mapper's `OWNER_LISTING_SELECT` also lacks `contact_phone`, `contact_email`, `zip` — so even the fallback chain cannot resolve for older rows.

---

## 2.3 bienes-raices inventory property CHILD — **DESTRUCTIVE**

- **(a) Entry:** `app/(site)/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx:195-199` → `bienesInventoryEditHref(...)+"&openChildDraftId=br-db-child-<id>"`; builder `app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts:98-101`. Second entry `app/(site)/dashboard/mis-anuncios/[id]/page.tsx:793`.
- **(b) Hydration:** `bienesPublishedToAgenteApplicationDraft.ts:68-102` (`mapChildListingRowToDraft`). Restores **only** `title, price, city, description, photoUrls, primaryPhotoIndex, mainPhotoUrl, propertyType, bedrooms, bathrooms, interiorSqft, lotSqft`. Everything else stays at `createEmptyBrNegocioAdditionalInventoryPropertyDraft` defaults (`brNegocioAdditionalInventoryDraft.ts:70-102`).
- **(c) Publish payload:** `brNegocioChildInventoryFormMapping.ts:520` → flat branch at `:560` (because `propertyForm` is `null`) → `brNegocioInventoryQueuePrefill.ts:32-102` → `leonixPublishRealEstateFromDraftState.ts:448` → patch at `app/api/clasificados/bienes-raices/listing-edit/route.ts:158-187`, child loop `:335-364`.
- **(d) VERDICT: DESTRUCTIVE — destroyed fields:**

| Field | Blanked at | Written as |
|---|---|---|
| `state` | `brNegocioInventoryQueuePrefill.ts:71` (`""`) | `listing-edit/route.ts:176` → column **NULL** |
| `zip` | `:72` (`""`) | `route.ts:177` → column **NULL** |
| `direccionLinea1` / `direccionLinea2` / `direccion` | `:73-75` | detail pairs blanked |
| `mostrarDireccionExacta` | `:76` (forced `false`) | — |
| `direccionPais` | `:70` (forced `"United States"`) | a non-US child's country is destroyed |
| `subtipoPropiedad` | `:85-87` | — |
| `videoUrl`, `tourUrl`, `brochureUrl`, `ctaUrlMls`, `listadoUrl` | `:96-100` | — |
| `propertyForm` (whole per-child form slice) | permanently `null` (`brNegocioAdditionalInventoryDraft.ts:49`) | richer branch `brNegocioChildInventoryFormMapping.ts:539-556` can never re-engage |

  `detail_pairs` label-merge and the `images` fallback (`route.ts:53-76`, `:121-125`) blunt part of this. **`state` and `zip` have no such guard.**

---

## 2.4 rentas NEGOCIO — **DESTRUCTIVE**

- **(a) Hydration:** `app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration.ts:87-96` (`mapOwnedRentasListingToNegocioFormState`) + shared `basePartialFromRow` `:29-78`. Callers `RentasNegocioForm.tsx:210, :235`.
- **(b) Publish payload:** `buildRentasNegocioListingParams` → `app/api/clasificados/rentas/listing-edit/route.ts:109-138`.
- **(c) VERDICT: DESTRUCTIVE.** On `origin/main` the owner `SELECT` (`rentasDashboardEditHydration.ts:119`) **does not even request `business_meta`**, while the write path replaces that whole column (`listing-edit/route.ts:131`).

**Destroyed (Negocio-specific), each restored by the Sept fix at the diff hunk noted:**

| Field | Why lost on `origin/main` |
|---|---|
| `negocioWhatsapp`, `negocioMensajesTexto` | digits computed but stranded on `seller.whatsapp` / `seller.mensajesTexto` (`:69-70`); `mergePartialRentasNegocioState` only reads the top-level keys |
| `negocioMarca` (`meta.negocioNombreCorreduria`) | `business_meta` never selected, never read |
| `negocioLogoDataUrl` (`meta.negocioFotoAgenteUrl`) | ″ |
| `negocioLicencia` | ″ |
| `negocioTelOficina` | ″ |
| `negocioSitioWeb` | ″ |
| `negocioRedes` | ″ |
| `negocioGoogleReviewsUrl` | ″ |
| `negocioYelpReviewsUrl` | ″ |
| `negocioBio` (`meta.negocioDescripcion`) | ″ |
| `negocioIdiomas` | ″ |
| `rentasEspacioTipoBano/TipoCocina/EntradaPrivada/Lavanderia/MaxOcupantes`, `rentasPreferenciasEspacioCompartido` | `room_shared` flow-extension block absent |
| `rentasAlmacenTamanoAprox/Acceso24h/Electricidad/Seguridad/UsoPermitido/Dimensiones` | `storage_parking` block absent |
| `rentasComercialUsoPermitido/TamanoFt2/BanoDisponible/HorarioAcceso/ContratoMinimo` | `commercial_space` block absent |
| `rentasLoteUsoPermitido/ServiciosDisponibles/Acceso/Zonificacion` | `land_parcel` block absent |

Plus everything in §2.5 (shared code path).

---

## 2.5 rentas PRIVADO — **DESTRUCTIVE (NEW FINDING)**

**This lane was never named in `67919479`'s commit message, but it is broken on `origin/main` and the Sept commit repairs it.**

> **Severity qualifier — read §2.5b before quoting the table below.** The table lists what the hydration fails to restore into **form state** (certain, both lanes). The Rentas write path has two independent empty-skip layers that stop most of these from reaching the database as blanks. The columns that *are* certainly destroyed in the DB are enumerated separately in §2.5b.

Proof: `basePartialFromRow` (`rentasDashboardEditHydration.ts:29-78`) is **shared** — `mapOwnedRentasListingToPrivadoFormState` (`:80-85`) and `mapOwnedRentasListingToNegocioFormState` (`:87-96`) both build on it, and the Sept diff's repairs land **inside `basePartialFromRow`**, i.e. they fix both lanes. Live Privado edit path: `RentasPrivadoForm.tsx:206, :231` → `hydrateRentasDashboardEditDraft({lane:"privado"})`; route from `categoryRouteRegistry.ts:769-783`.

**Destroyed on `origin/main` (both Rentas lanes):**

| Field | Evidence on `origin/main` | Sept repair `@e3956df8` |
|---|---|---|
| `zonaVecindario` | **hardcoded `""`** at `rentasDashboardEditHydration.ts:50` | `pv(detailPairs,"Zona o vecindario") \|\| pv(…,"Colonia")` |
| `direccionLinea1` | **absent entirely** | `pv(detailPairs,"Ubicación") \|\| pv(…,"Dirección")` |
| `mostrarDireccionExacta` | **absent entirely** | `rentasShowExactAddressFromDetailPairs(detailPairs)` |
| `direccionEstado` / `direccionCodigoPostal` / `direccionPais` | raw columns only (`:47-49`), `direccionPais` **hardcoded `"United States"`** | `readLeonixPropertyLocationFromRow(row)` |
| `plazoContratoOtro` | **absent entirely** | `rx.leaseTermCode==="otro" ? rx.leaseTermCustom : ""` |
| `contactChannels` (website, Instagram, Facebook, YouTube, TikTok, additional websites) | **absent entirely** | `leonixContactChannelsFormSliceFromPayload(parseLeonixContactChannelsV1FromDetailPairs(detailPairs))` |
| `residencial.{recamaras, banos, mediosBanos, interiorSqft, loteSqft, estacionamiento, ano, condicion}` | **absent entirely** | `structuredPropertyFactsFromDetailPairs()` |
| `comercial.{uso, interiorSqft, oficinas, banos, niveles, estacionamiento, zonificacion, condicion, accesoCarga}` | **absent entirely** | ″ |
| `terreno.{loteSqft, usoZonificacion, acceso, servicios, topografia, listoConstruir, cercado}` | **absent entirely** | ″ |
| legacy rows storing payload outside `detail_pairs` | `listing_json`/`contact_json` not selected, not augmented | `augmentLeonixDetailPairsFromStructuredColumns(...)` + widened `SELECT` |

## 2.5b Rentas — separating FORM-STATE loss from DB DESTRUCTION

Two independent empty-skip layers protect the `detail_pairs` side, and both were verified directly:

- **Machine facet pairs** — `app/(site)/clasificados/lib/leonixBrMachineFacetPairsFromFormState.ts:55-60`: `push()` returns early on `null`/`undefined`/empty-after-trim, so an unrestored field emits **no pair at all**.
- **Human property-fact rows** — `app/(site)/clasificados/rentas/shared/rentasResidencialPreviewRows.ts:25-29`: `row()` returns `null` for an empty value and the array is `.filter()`ed (`:53`).
- Combined with the label-preserving `mergeDetailPairs` (`app/api/clasificados/rentas/listing-edit/route.ts:27-49`), a field the hydration dropped emits nothing → its existing pair **survives**.

**Therefore, split the verdict:**

**(A) CERTAIN DB destruction on any republish**

| Column / pair | Mechanism | Lane |
|---|---|---|
| `business_meta` | whole-column replace `built.params.businessMetaJson ?? null` (`rentas/listing-edit/route.ts:132`). For **Privado**, `buildRentasPrivadoListingParams` (`leonixPublishRealEstateFromDraftState.ts:293-364`) never sets it → forced **`null`**. For **Negocio**, it *is* built — from a form state whose 10 identity fields the hydration never populated → replaced with a JSON of blanks. | both |
| `business_name` | `route.ts:131`, same builder never sets `businessName` → forced **`null`** | Privado |
| `Leonix:prop:country` | **not** an empty-skip push — an *unconditional* filter-and-replace at `leonixBrMachineFacetPairsFromFormState.ts:171`, using `normalizeLeonixLbCountry(state.direccionPais || "United States")`. The hydration hardcodes `direccionPais: "United States"` (`rentasDashboardEditHydration.ts:49`), so **any non-US listing's country is overwritten** | both |

**(B) CERTAIN form-state loss (severe, but not by itself a DB wipe)** — everything in the §2.5 table. The owner opens the edit form and sees the address block, the structured property facts, the contact channels and (Negocio) the whole business identity **blank**, on a listing whose public page still renders them correctly. Any field they then fill is written; any adjacent label they cause to be re-emitted with a changed value overwrites the stored one. This is the state the September fix exists to eliminate.

**(C) Not asserted.** `media.primaryImageIndex` hardcoded `0` (`rentasDashboardEditHydration.ts:~60`) and `estadoAnuncio` defaulting to `"disponible"` (`:52`) are re-emitted by publish and are plausible additional overwrites, but the exact emit path was not traced to a conclusion — treated as an evidence gap, not a finding.

---

## 2.6 autos PRIVADO — **NO_EDIT_PATH** (for an active listing)

- **(a) Entry:** `app/(site)/dashboard/lib/dashboardInventory.ts:263-265` / `app/(site)/dashboard/mis-anuncios/page.tsx:2101` → `/publicar/autos/privado?edit=1&source=dashboard&listingId=…`.
- **(b) Hydration:** `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx:114-159` — fetches `GET /api/clasificados/autos/listings/{id}` (route returns the whole `listing_payload` JSONB, `app/api/clasificados/autos/listings/[id]/route.ts:195`) and does `flushDraft({ listing: { ...json.listing, autosLane:"privado" } })` at `:183`. **The hydration itself is a whole-blob round trip and is not defective.**
- **(c) VERDICT: NO_EDIT_PATH.** The dashboard opens a fully-populated form that **cannot be saved**. Two independent blocks:
  1. **No save UI.** In edit mode the final CTA is `router.push(previewHref)` (`AutosPrivadoApplication.tsx:762`, href built `:174-186`). The preview resolves `mode: "dashboard_edit"` (`app/(site)/clasificados/autos/privado/preview/AutosPrivadoPreviewClient.tsx:80-84`) and gates the only persist widget behind `showSellerCheckout = mode === "draft"` (`:236`, rendered `:242`). No "Save changes" control exists in this lane's edit mode.
  2. **Server refuses regardless.** `app/lib/clasificados/autos/autosClassifiedsListingService.ts:249-252` — `recoverableStatus` is only `draft | payment_failed | pending_payment`, and `negociosActiveEditable` additionally requires `row.lane === "negocios"`. An **active `privado` row therefore returns `AUTOS_LISTING_STATUS_NOT_EDITABLE`**.
- **What the dashboard offers instead:** view public listing, archive, analytics — `dashboardMisAnunciosCategoryTools.ts:111` (`autos: { publicView, archive, analytics }`; note **no `edit` key**). Edits live only in the listing-scoped local draft namespace and never reach the DB.
- **Not destructive** — but the owner is shown a fully-populated, fully-editable form whose changes are silently discarded. For a `draft`/`payment_failed`/`pending_payment` row the write *is* permitted and, being a whole-blob round trip, is **SAFE**.

## 2.7 autos DEALER parent — **SAFE**

- **(b) Hydration:** `app/(site)/publicar/autos/negocios/lib/autosPublishedToDealerApplicationDraft.ts:212` — `const parentListing = normalizeLoadedListing(parentJson.listing)`, persisted whole at `:218-223`.
- **(c) VERDICT: SAFE.** Same whole-blob round trip.

## 2.8 autos DEALER inventory CHILD — **DESTRUCTIVE**

- **(a) Entry:** `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx:578` → `autosDealerInventoryEditHref(...)+"&editVehicleId=<childId>"` (builder `app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts:97-100`). Note `dashboardInventory.ts:258-266` gives non-`main` negocios rows **no** edit route at all — child edit exists only via the parent's inventory drawer.
- **(b) Hydration:** `autosPublishedToDealerApplicationDraft.ts:38-126` (`mapChildListingPayloadToDraft`) — hand-enumerated.
- **(c) Publish payload:** `autosAdditionalInventoryDraft.ts:318-322` → `autosInventoryInheritedPreview.ts:17-30` `{...parentPayload, ...childSlice}` → `autosClassifiedsListingService.ts:355-361` inside `syncDealerInventoryChildRowsFromParentPayload`.
- **(d) VERDICT: DESTRUCTIVE.** Because the write is `{...parent, ...childSlice}`, any child field the hydrator missed is **overwritten with the parent's value** — worse than blanking. Destroyed child-specific fields, each cross-checked against the module's own `AUTOS_INVENTORY_INHERITED_FIELD_GROUPS.childSpecific` contract (`autosInventoryInheritedPreview.ts:79-107`):

  `mpgCity`, `mpgHighway`, `doors`, `seats`, `titleStatus`, `titleStatusCustom`, `features`, `customEquipment`, `otherEquipmentDetails`, `country`, `heroImages`, and the entire video identity block — `videoUrl`, `videoSourceType`, `videoFileName`, `videoUploadStatus`, `muxAssetId`, `muxPlaybackId`, `muxThumbnailUrl`, `muxPlaybackUrl` (type declarations `autoDealerListing.ts:120, 184-215`).

  **Consequence worth stating plainly: the child vehicle's public page begins playing the parent vehicle's video.**
  Additionally lossy by filter: `mediaImages` keeps only `http(s)` entries (`autosPublishedToDealerApplicationDraft.ts:45-49`); `videoUrls` only absolute URLs (`:50-52`).

---

## 2.9 empleos PREMIUM / paid — **DESTRUCTIVE (identity fork + double charge)**

### ⚠ This is the highest-severity finding in this audit.

- **(a) Entry:** `app/(site)/dashboard/empleos/page.tsx:58-63` (`empleosEditHref`) → `/publicar/empleos/premium?edit={id}`. Also `dashboardInventory.ts:481` → `/dashboard/empleos/{id}`, pushed at `dashboardMisAnunciosCategoryTools.ts:534-542`.
- **(b) Hydration:** `app/(site)/publicar/empleos/premium/EmpleoPremiumApplicationClient.tsx:59-84` → `app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope.ts:89-123` (`hydratePremiumDraftFromEnvelope`).
- **(c) Publish payload:** `buildEmpleosPublishEnvelope.ts:167-204` (`buildPremiumPublishSnapshot`), envelope at `:281-296`.

**Field set: COMPLETE.** A mechanical key-set diff of the premium snapshot builder against the premium hydrator returns **∅**. `feria` (`:205` / `:125-157`) likewise round-trips. *This lane does not exhibit the §1.2 partial-mapper signature.*

**But it destroys the listing by a different mechanism — loss of row identity, which the mission's Step 4 exists to catch:**

1. Dashboard "Edit" → form hydrates correctly and records `setServerListingId(editId)` (`EmpleoPremiumApplicationClient.tsx:80`).
2. The form's publish CTA is `onPublicar={goPreview}` (`:451`) → `goPreview` (`:89-95`) flushes only the draft to sessionStorage. **`serverListingId` is dropped — it never leaves the form component.**
3. The preview rebuilds the envelope from the draft alone: `app/(site)/clasificados/empleos/premium-preview/EmpleoPremiumPreviewClient.tsx:147` `buildEmpleosPublishEnvelopeFromPremium(current, lang)`.
4. `envelopeBase` **hardcodes `listingId: null`** — `buildEmpleosPublishEnvelope.ts:250`:
   ```ts
   listingStatus: "ready_for_publish",
   listingId: null,          // ← identity discarded
   ownerId: null,
   ```
5. `saveEmpleosDraftAndStartPaidJobCheckout` (`app/(site)/publicar/empleos/shared/publish/empleosRevenueCheckout.ts:22-28`) POSTs that envelope to `/api/clasificados/empleos/listings`.
6. `upsertEmpleosListingFromEnvelope` (`app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts:148-154`): `candidateId = null` → `crypto.randomUUID()` → `existing` misses → **INSERT a new row** (`:227-231`).
7. `empleosRevenueCheckout.ts:60-68` then calls `startRevenueCategoryCheckout({ ...EMPLEOS_PAID_JOB_CHECKOUT, listingId: json.id })` → **Stripe checkout against the brand-new id**.

**Result of one dashboard edit + republish:** the original paid, published job is **orphaned** (still live, now duplicated), a second row is created, and **the employer is charged a second time**. Nothing blocks the charge — `empleos_job_post_paid` is not in `REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS` (§4.2) and `activePaidEditCheckoutOwnership.ts` does not exist on `origin/main`. Note that even the September guard would **not** catch this particular fork, because a *fresh* id is minted — the guard only rejects a checkout carrying an already-active `listingId`. **The identity must be preserved at step 4; this needs its own fix.**

The upsert layer itself is correct and defensive (`:144-158`): a supplied-but-unknown `listingId` fails closed rather than minting a row. It is never given the id.

**(d) Second, independent destruction — "Guardar borrador" unpublishes a live paid listing.** `EmpleoPremiumApplicationClient.tsx:455` renders the save-draft button (copy `empleosPublishSharedCopy.ts:28, :87`); `:467-473` posts `{ envelope: {...base, listingId: serverListingId}, mode: "draft" }`. That path **does** hit the correct row (`empleosPublicListingsDbServer.ts:217-224`), but `mapCanonicalToRow` then writes `lifecycle_status: "draft"` (`:100`), `published_at: null` (`:94`, `:121`), `moderation_reason: null` (`:101`), `review_notes: null` (`:102`) — taking a live, paid premium job off the public site. Quick does **not** expose this: `EmpleoQuickApplicationClient.tsx:711` passes `saveDraftCta={null}` and `EmpleosApplicationFinalStep.tsx:239` requires a truthy value to render the button.

## 2.10 empleos QUICK — **DESTRUCTIVE (single field)**

- **(b) Hydration:** `empleosDraftFromEnvelope.ts:14-88` (`hydrateQuickDraftFromEnvelope`).
- **(c) Publish payload:** `buildEmpleosPublishEnvelope.ts:68-166` (`buildQuickPublishSnapshot`).
- **(d) VERDICT: DESTRUCTIVE — destroyed field:**

  **`workModalityCustom`** — written to the envelope at `buildEmpleosPublishEnvelope.ts:103` (`workModalityCustom: d.workModalityCustom.trim() || undefined`), declared on the draft at `empleosQuickDraft.ts:42`, **and never read back** anywhere in `hydrateQuickDraftFromEnvelope` (`:32-88`). It is real, user-visible data: the public shell renders it via `mapQuickDraftToShell.ts:120` `workModalityLabel: modalityLabelEs(d.workModality, d.workModalityCustom)`. An employer who wrote a custom work-modality label ("Híbrido 3 días en sitio") loses it the moment they re-save from the dashboard.

  `scheduleRows` is **not** lost (restored at `empleosDraftFromEnvelope.ts:26-43, :44`). All other quick-snapshot fields (pay quartet, address quartet, 8 social links, images, videos, contact fields) are restored — `workModalityCustom` is the **only** true field wipe in this lane.
  Lossy but not a wipe: `jobTypeCustom` is hardcoded to `""` at `:63`; the publish mapper folds it into `jobType` (`buildEmpleosPublishEnvelope.ts:106`), so the employer's text survives while the `"otro"` sentinel does not (it round-trips as a literal custom string thereafter).

- **(e) SAME IDENTITY FORK AS PREMIUM.** `app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx:152` builds the envelope with no listing identity → `envelopeBase` `listingId: null` (`buildEmpleosPublishEnvelope.ts:250`) → **INSERT a new row** (`empleosPublicListingsDbServer.ts:227-231`). Quick is a free lane, so there is no double charge — but the original published job is still orphaned and duplicated. See §2.9 for the full trace.

---

## 2.11 servicios — **DESTRUCTIVE (conditional; partially net-caught server-side)**

- **(a) Hydration:** `app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts:334-470`, wired live at `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx:502` (and preview `ClasificadosServiciosPreviewClient.tsx:248`).
- **(b) Publish payload:** `buildServiciosPublishPayload.ts:45-176` (whole-state spread) → forward mapper `mapClasificadosServiciosApplicationToServiciosDraft.ts` → `mapServiciosApplicationDraftToBusinessProfile.ts` → `app/api/clasificados/servicios/publish/route.ts:314-350`.
- **(c) VERDICT: DESTRUCTIVE, with an important qualifier.**

**(i) Server safety net covers part of it.** `app/(site)/clasificados/servicios/lib/serviciosPublishOpsProfileMerge.ts:25-29`:

```ts
if (!nextWire.quickFacts?.length  && previous.quickFacts?.length)  merged.quickFacts  = previous.quickFacts;
if (!nextWire.trust?.length       && previous.trust?.length)       merged.trust       = previous.trust;
if (!nextWire.reviews?.length     && previous.reviews?.length)     merged.reviews     = previous.reviews;
if (!nextWire.promotions?.length  && previous.promotions?.length)  merged.promotions  = previous.promotions;
```

Because the hydration never reads these back, a *no-touch* republish sends empty arrays and the net restores them. **The net fails the moment the owner adds one item**: `nextWire.quickFacts` becomes non-empty, the guard does not fire, and the entire previously-published set is replaced by that single new item.

**Fields at risk under partial re-edit** (written by the forward mapper, never restored by the hydration — verified by targeted grep of `serviciosPublishedToApplicationDraft.ts`, zero occurrences of each):
`selectedQuickFactIds`, `customQuickFacts`, `customQuickFactLabel`, `customQuickFactIncluded` (written `mapClasificadosServiciosApplicationToServiciosDraft.ts:142-175, 445`);
`selectedReasonIds`, `customReasonLabel`, `customReasonIncluded` (written `:177-198, 451` as `trust`).

**(ii) Not covered by the net — unconditional loss.** `businessHighlights` has no safety-net line. The forward mapper writes prefixed ids `bh_preset_${hid}` / `bh_custom_${n}` (`:209, :218`) into `draft.highlights` → `profile.businessHighlights` (`mapServiciosApplicationDraftToBusinessProfile.ts:220, 260`). The hydration's `mapSelectedBusinessHighlightIds` (`serviciosPublishedToApplicationDraft.ts:306-318`) pushes `clean(item?.id)` **raw**, without stripping the prefix — unlike its sibling `mapSelectedServiceIds` (`:283-303`), which correctly strips `svc_`. Consequences on republish:

- **`selectedBusinessHighlightIds`** — every preset highlight comes back as an unmatchable `bh_preset_*` id and is dropped by the forward mapper's `preset.businessHighlights.find(...)` lookup.
- **Cross-contamination:** the same function also folds `profile.trust` (ids `trust_*`) into `selectedBusinessHighlightIds`, so the owner's "reasons to choose us" are mis-filed as highlights **and** are equally unmatchable.

**(iii) Never persisted (distinct defect, not destruction):** `primaryCtaId`, `secondaryCtaIds`, `customServiceLabel`, `customServiceDescription`, `customServiceIncluded`, `customBusinessHighlightLabel`, `customPaymentMethodLabel`, `serviceAreaNotes` round-trip only lossily. The forward mapper never emits `primaryCtaId`/`secondaryCtaIds` at all (only a derived `contact.primaryCtaLabel`, `:285`).

---

## 2.12 restaurantes — **SAFE** (the prior lead is FALSE)

**Prior stream's lead: *"Restaurantes has no published→draft mapper."* — verified and REFUTED.**

- The reverse mapper exists: `app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingMapper.ts:292` `export function listingJsonToDraft(listingJson) { return mergeRestauranteDraft(listingJson); }`, and the row builder writes the **whole draft** at `:288` `listing_json: d`. That is a symmetric whole-blob round trip.
- The dashboard **does** hydrate before navigating: `app/(site)/dashboard/restaurantes/page.tsx:270-315` (`loadIntoForm`) — owner-scoped `SELECT listing_json, draft_listing_id, leonix_ad_id … .eq("id", row.id).eq("owner_user_id", user.id)`, then `mergeRestauranteDraft(data.listing_json)`, then critically **pins `merged.draftListingId = data.draft_listing_id`** (`:299-302`) so republish lands on the same row, then navigates.
- A second proven hydrator exists for coupon edit: `app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts:175-260`, same shape.
- On `/dashboard/mis-anuncios` the Restaurantes primary action is **not** a raw edit link — `dashboardMisAnunciosCategoryTools.ts:448-455` routes to `/dashboard/restaurantes?lang=…`, i.e. into the hydrating panel.

**VERDICT: SAFE.**

### 2.12b Latent trap (real, currently unreachable — flagged, not counted as a defect)

`app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx` in `mode=listing-edit` performs **no DB fetch**: it uses `useRestauranteDraft()` (`useRestauranteDraft.ts:88-101`), which loads **only** from localStorage/IDB. Its save handler `saveExistingDashboardListing` (`:339-388`) posts `buildRestaurantePublishPayload(draftForSave, ownerUserId, undefined, lang)` — and **never sends `dashboardListingId`**. The API keys the row solely on `draft.draftListingId` (`app/api/clasificados/restaurantes/publish/route.ts:324-327, :465`), which is minted locally by `createEmptyRestauranteDraft.ts:57`.

Consequence **if that route is ever reached without prior hydration** (fresh browser, cleared storage, another device): the form renders empty *and* `existingByDraft` misses, so the route takes the **INSERT branch (`route.ts:512`) and creates a duplicate listing** rather than editing the published one.

Today the only builder producing that href is `restauranteListingEditHref` (`restaurantesDashboardCouponAddonCheckout.ts:276-292`), consumed at `dashboardInventory.ts:434` as `DashboardInventoryItem.editHref`. That value is **not** used by `buildInventoryListingActions` for restaurantes, and `dashboardAttentionItems` is only fed empleos/viajes/rentas rows (`mis-anuncios/page.tsx:455-482`). So the path is currently unreachable — but it is one careless `href={item.editHref}` away from being live.

---

## 2.13 comida-local — **SAFE**

- **(a) Entry:** `app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx:117` → `/publicar/comida-local?edit=1&listingId=<id>&source=dashboard`, wired `:164`, rendered from `mis-anuncios/page.tsx:1916-1919`. Registry mirror `categoryRouteRegistry.ts:1033-1037`.
- **(b) Hydration:** `ComidaLocalApplicationClient.tsx:360-437` → `app/lib/clasificados/comida-local/comidaLocalListingEditContext.ts:87` (`fetchOwnerComidaLocalListingForEdit`), restore at `:112-114` — `...mergeComidaLocalDraftFromStorage(row.listing_json)` + `draftListingId: rowDraftListingId`. Whole-snapshot.
- **(c) Publish:** `comidaLocalPublicListingMapper.ts:37` (`listing_json: ComidaLocalDraft`), route `app/api/clasificados/comida-local/publish/route.ts:171` / `:230`.
- **(d) VERDICT: SAFE.** Fails closed: a legacy row without `draft_listing_id` refuses to open the editor rather than risk a duplicate INSERT (`comidaLocalListingEditContext.ts:104`).
- **Minor footgun (not a defect today):** `buildComidaLocalDashboardInventoryItems` in `app/lib/clasificados/comida-local/mapComidaLocalDashboardListing.ts` sets `editHref: "/publicar/comida-local?lang=…"` with **no `edit=1`/`listingId`** — a blank new-ad wizard. The rendered card builds its own href, and the generic card is suppressed (`dashboardMisAnunciosCategoryTools.ts:59`, `openPanel:"hidden"`), so it is unreached.

## 2.14 ofertas-locales — **DESTRUCTIVE (pre-approval statuses only)**

- **(a) Two doorways.** (1) In-page narrow editor — `app/(site)/dashboard/ofertas-locales/[id]/page.tsx:415` `onClick: () => setEditMode(true)`, PATCHing an allow-list via `app/lib/ofertas-locales/ofertasLocalesOwnerUpdateMapper.ts` — **non-destructive**. (2) **Wizard re-entry — the risk:** `page.tsx:407-411` (`previewHref` → `/publicar/ofertas-locales?id=<id>&step=6|7&intent=continue`) and `OfertasLocalesOwnerAiManageSection.tsx:181-186`.
- **(b) Hydration (PARTIAL):** `OfertasLocalesApplicationClient.tsx:404-447` ← `app/api/ofertas-locales/owner/[id]/route.ts:56-58` ← `app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts:314-353` (`mapOfertaLocalAdminRowToDraftRecoveryPatch`).
- **(c) Publish payload:** `app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts:220` → `ofertasLocalesProductionRowAdapter.ts:47` → `app/api/ofertas-locales/publish/route.ts:439`.
- **(d) VERDICT: DESTRUCTIVE — destroyed fields:**
  - `digital_coupon_url` (`digitalCouponUrl`) — written `ofertasLocalesPublishMapper.ts:255`
  - `digital_coupon_note` (`digitalCouponNote`) — `:256`
  - `is_magazine_pickup_partner` (`isMagazinePickupPartner`) — `:257`
  - `internal_notes` and everything encoded inside it (`:102-168`): owner `internalNotes` free text, `metadata.contactEmail` (draft `email`), `businessLogoUrl`, and the socials **`linkedinUrl`, `xTwitterUrl`, `snapchatUrl`, `pinterestUrl`** (the other seven socials survive only because they are real columns rehydrated at `ofertasLocalesOwnerHelpers.ts:336-342`)
  - `draft_snapshot` sub-keys re-derived from unrestored draft fields (`ofertasLocalesProductionRowAdapter.ts:24-44`): `location.country`, `membershipCtaLabel`, `requiresMembershipForDeals`, `magazine.magazineDistributionStatus / magazineMonthlyDropEstimate / magazinePickupNotes`
  - `mergeOfertaLocalDraftSnapshot` (`app/lib/ofertas-locales/ofertasLocalesDbSchema.ts:167-181`) is a shallow `{...base, ...patch}` — the patch's explicit `null`s **overwrite** surviving base values, so it is not a rescue.
- **Scope limiter (do not overstate):** hydration returns `draftPatch: null` unless status ∈ `draft|submitted|pending_review|rejected` (`ofertasLocalesOwnerHelpers.ts:25-30`), and the same-row update branch requires parent status ∈ `draft|submitted|pending_review` (`publish/route.ts:50-54`, enforced `:312`). **An approved/published offer cannot be wiped through this path (409).** Live blast radius = a pre-approval row resubmitted from a storage-less context. Second independent vector: the recovery only fires when no local id is present (`OfertasLocalesApplicationClient.tsx:407-410`), so a stale/blank local draft overwrites too.

## 2.15 viajes — **SAFE**

- **(a) Entry:** `app/(site)/dashboard/viajes/page.tsx:263-273` → `/publicar/viajes/{negocios|privado}?stagedId=<id>`, wired `:341`. Generic mirror `dashboardInventory.ts:520` → `/dashboard/viajes?stagedId=…`. Registry deliberately returns `editRoute: () => null` (`categoryRouteRegistry.ts:1333`) because the lane isn't derivable from a `ListingIdentity` — an honest null, not a missing route.
- **(b) Hydration:** `ViajesNegociosApplicationShell.tsx:41-74` (fetch `:57` → `app/api/clasificados/viajes/staged-owner/route.ts:15-30`, owner-checked `:26`), applied `:66` `setDraft(mergeViajesNegociosDraftFromPartial(json.row.listing_json.negocios))`. Privado mirror `ViajesPrivadoApplicationShell.tsx:43-76`.
- **(c) Publish:** `app/api/clasificados/viajes/submit/route.ts:74` `listing_json = { version: 1, negocios: draft }` (privado `:128`).
- **(d) VERDICT: SAFE.** Symmetric. Two caveats that are **not** field loss: (i) resubmit forces `lifecycle_status:"submitted", is_public:false` (`:95-96`) — an approved public offer goes dark pending re-moderation, by design; (ii) if hydration fails, `ViajesNegociosApplicationShell.tsx:62-69` only shows a banner and leaves the local draft in place while Submit stays live — an error-path overwrite risk, not a mapper defect.

---

# STEP 3 — REFERENCE-IMPLEMENTATION RULE

| Lane | PROVEN REF? | REFERENCE CATEGORY | REFERENCE PATH | TARGET PATH | DIFFERENCE (exact missing wiring) | ACTION |
|---|---|---|---|---|---|---|
| bienes-raices NEGOCIO parent | **YES** | Bienes Negocio public detail page (same category) | `BienesRaicesNegocioLiveDetailShell.tsx:187` `buildPublishedState` (private/inline on `origin/main`); extracted form at `parseBienesAgenteResidencialPublishedState.ts` `@e3956df8` | `bienesPublishedToAgenteApplicationDraft.ts:105-160` | Extract `buildPublishedState` to a shared pure module; call it from the reverse mapper and merge only inventory-pack extras; widen `OWNER_LISTING_SELECT` with `contact_phone, contact_email, zip` | **ADOPT EXISTING** (cherry-pick `733408dd`) |
| bienes-raices inventory CHILD | **YES** | same-repo sibling — the (fixed) parent mapper + the richer child branch already present | `brNegocioChildInventoryFormMapping.ts:539-556` (the `propertyForm` branch) | `bienesPublishedToAgenteApplicationDraft.ts:68-102` `mapChildListingRowToDraft` | Hydrate the child's `propertyForm` slice from its own row so the flat `brNegocioInventoryQueuePrefill` branch is never taken; at minimum stop nulling `state`/`zip`/`direccionPais` | **NET NEW** (not covered by any Sept commit) |
| rentas NEGOCIO | **YES** | Rentas public listing page primitives | `parseRentasDetailMachineRead`, `readLeonixPropertyLocationFromRow`, `rentasShowExactAddressFromDetailPairs`, `leonixNegocioBusinessMetaFromFormState` — all on `origin/main`; assembled form at `rentasDashboardEditHydration.ts` `@e3956df8` | `rentasDashboardEditHydration.ts:87-96` | Add `business_meta, listing_json, contact_json` to the `SELECT`; move WhatsApp/SMS to top-level `negocioWhatsapp`/`negocioMensajesTexto`; add the 10 `business_meta` identity reads; add `flowExtensionFieldsFromDetailPairs` | **ADOPT EXISTING** (cherry-pick `67919479`) |
| rentas PRIVADO | **YES** | same commit — the repairs live in the **shared** `basePartialFromRow` | `rentasDashboardEditHydration.ts:185-260` `@e3956df8` | `rentasDashboardEditHydration.ts:29-78` | `zonaVecindario`, `direccionLinea1`, `mostrarDireccionExacta`, `readLeonixPropertyLocationFromRow`, `plazoContratoOtro`, `contactChannels`, `structuredPropertyFactsFromDetailPairs`, `augmentLeonixDetailPairsFromStructuredColumns` | **ADOPT EXISTING** (same cherry-pick; verify Privado explicitly — the commit message never named it) |
| autos DEALER inventory CHILD | **YES** | the module's own declared contract | `autosInventoryInheritedPreview.ts:79-107` `AUTOS_INVENTORY_INHERITED_FIELD_GROUPS.childSpecific` | `autosPublishedToDealerApplicationDraft.ts:38-126` | Iterate `childSpecific` rather than hand-listing; add `mpgCity/mpgHighway/doors/seats/titleStatus(+Custom)/features/customEquipment/otherEquipmentDetails/country/heroImages` and the 8 video/Mux keys | **NET NEW** |
| empleos QUICK (field wipe) | **YES** | the sibling lane in the same file | `hydratePremiumDraftFromEnvelope` (`empleosDraftFromEnvelope.ts:89-123`) — field-complete against its writer | `empleosDraftFromEnvelope.ts:32-88` | One line: `workModalityCustom: d.workModalityCustom ?? ""` | **NET NEW** (one-line) |
| **empleos PREMIUM + QUICK — identity fork (§2.9)** | **YES** | every other lane in this repo already does it | `dashboard/restaurantes/page.tsx:299-302` and `restaurantesDashboardCouponAddonCheckout.ts:242-246` — both pin the row's own persisted id onto the draft before navigating, so republish cannot fork | `buildEmpleosPublishEnvelope.ts:250` (`listingId: null`), consumed by `EmpleoPremiumPreviewClient.tsx:147` and `EmpleoQuickPreviewClient.tsx:152` | Carry `serverListingId` from the application client through the sessionStorage handoff into `envelopeBase`, so the upsert's already-correct existing-row branch (`empleosPublicListingsDbServer.ts:217-224`) is taken. The upsert layer needs no change — it is simply never given the id | **NET NEW** — *not* covered by any September commit; the Sept checkout guard would not catch it either, since a fresh id is minted |
| **empleos PREMIUM — save-draft unpublishes (§2.9d)** | NO | — | — | `EmpleoPremiumApplicationClient.tsx:455, :467-473` + `empleosPublicListingsDbServer.ts:94, :100-102, :121` | `mode:"draft"` must not demote an already-published row: preserve `lifecycle_status`/`published_at` when `existing.lifecycle_status === "published"`, mirroring the precedent already implemented for Servicios (`app/api/clasificados/servicios/publish/route.ts:452-456`, *"Never downgrade an already-published listing back to pending on re-save"*) | **ADOPT EXISTING** (port the Servicios no-downgrade rule) |
| servicios | **YES** | sibling function in the same file | `mapSelectedServiceIds` (`serviciosPublishedToApplicationDraft.ts:283-303`) — correctly strips its `svc_` prefix | `serviciosPublishedToApplicationDraft.ts:306-318` `mapSelectedBusinessHighlightIds` + the missing quickFacts/reasons readers | Strip `bh_preset_`/`bh_custom_` prefixes; stop folding `profile.trust` into highlights; add a `mapSelectedQuickFactIds`/`mapSelectedReasonIds` pair mirroring `mapSelectedServiceIds` (reading `profile.quickFacts` and `profile.trust` into `selectedQuickFactIds`/`customQuickFacts` and `selectedReasonIds`/`customReasonLabel`) | **FIX REGRESSION** + **NET NEW** |
| ofertas-locales | **YES** | its own sibling mapper, same category | `ofertasLocalesOwnerUpdateMapper.ts` (`buildOfertaLocalOwnerUpdatePayload`) — the allow-listed narrow PATCH used by the in-page editor | `ofertasLocalesOwnerHelpers.ts:314-353` | Add `digitalCouponUrl`, `digitalCouponNote`, `isMagazinePickupPartner`; decode `internal_notes` back (`internalNotes`, `metadata.contactEmail`, `linkedinUrl`, `xTwitterUrl`, `snapchatUrl`, `pinterestUrl`, `businessLogoUrl`); restore `country`, `membershipCtaLabel`, `requiresMembershipForDeals`, the three `magazine*` keys; make `mergeOfertaLocalDraftSnapshot` (`ofertasLocalesDbSchema.ts:167-181`) skip `null`-valued patch keys | **NET NEW** |
| restaurantes latent trap (§2.12b) | **YES** | same file, adjacent function | `hydrateRestauranteListingForCouponEdit` (`restaurantesDashboardCouponAddonCheckout.ts:175-260`) and `dashboard/restaurantes/page.tsx:270-315` | `RestauranteApplicationClient.tsx` `isDashboardListingEditMode` branch | Either make `mode=listing-edit` call the existing hydrator on mount, or make the route fail closed when `listingId` is present and `draftListingId` does not match | **ADOPT EXISTING** (preventive) |

---

# STEP 4 — SAME-ROW / NO-RECHARGE

## 4.1 Same-row writes (no accidental INSERT)

| Lane | Write site (`origin/main`) | Keyed on | Same row? |
|---|---|---|---|
| bienes-raices NEGOCIO + child | `app/api/clasificados/bienes-raices/listing-edit/route.ts:219-225` | `.eq("id", existing.id).eq("owner_id", …).eq("category","bienes-raices")` (+ `.eq("br_inventory_parent_listing_id", …)` for children) | **YES.** New children are refused, not inserted (`:337-340`) |
| rentas NEGOCIO + PRIVADO | `app/api/clasificados/rentas/listing-edit/route.ts:141-145` | `.eq("id", listingId).eq("owner_id", …).eq("category","rentas")` | **YES** |
| autos privado / dealer parent / dealer child | `app/lib/clasificados/autos/autosClassifiedsListingService.ts:266-276` (child loop `:355-361`); parent `:106-107` | `.eq("id", listingId).eq("owner_user_id", …)` | **YES.** Identity/lifecycle/Stripe columns never touched |
| servicios | `app/api/clasificados/servicios/publish/route.ts:459-469` | `.eq("slug", slug)`, slug primed by `primeServiciosExistingPublicSlug` (`ClasificadosServiciosApplication.tsx:507`) | **YES.** Also refuses cross-owner slug (`:442-449`) and never downgrades published→pending (`:452-456`) |
| restaurantes | `app/api/clasificados/restaurantes/publish/route.ts:461-466` | `.eq("draft_listing_id", …).eq("status", targetStatus)` — compare-and-set | **YES via the hydrating panel**, which pins `draftListingId` from the row (`dashboard/restaurantes/page.tsx:299-302`). **Conditional** on the §2.12b path, where a mismatch falls into the INSERT branch (`:512`) |
| comida-local | `app/api/clasificados/comida-local/publish/route.ts:192-194` | `.eq("draft_listing_id", draftListingId)`; id/slug/leonix/status/payment re-pinned `:171-188` | **YES**, fail-closed on legacy rows |
| **empleos (all lanes)** | `empleosPublicListingsDbServer.ts:217-224` (UPDATE) vs `:227-231` (INSERT) | `.eq("id", listingId)`; the upsert is correct and fails closed on an unknown supplied id (`:148-158`) | **NO — republish-via-preview INSERTS.** The preview discards the identity before the call (`buildEmpleosPublishEnvelope.ts:250` `listingId: null`), so the UPDATE branch is never reached. See §2.9. The identity-carrying UPDATE is reachable only from the Premium save-draft button — which demotes the row (§2.9d) — and is dead-coded in Quick |
| ofertas-locales | `app/api/ofertas-locales/publish/route.ts:445-451` `.update(updateRow).eq("id", …).eq("owner_id", …)`; narrow editor `app/api/ofertas-locales/owner/[id]/route.ts:165-171` | id + owner | **YES** |
| viajes | `app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts:196-208` `.eq("id", …).eq("owner_user_id", …)` | id + owner | **YES** (INSERT only when no `stagedListingId`, `:138-166`) |
| en-venta / busco / clases / comunidad / mascotas / BR FSBO | `app/(site)/dashboard/lib/ownerListingsLifecycleClient.ts:36-50` `.update(patch)` | owner-scoped by id | **YES** |

**Conclusion: eleven of twelve lane groups correctly update the same row.** Two exceptions:

1. **Empleos (both lanes) — LIVE and reachable.** Republish from the dashboard edit forks a duplicate row every time (§2.9). For the paid Premium lane this also triggers a second Stripe charge.
2. **Restaurantes `mode=listing-edit`** — would INSERT a duplicate, but is currently unreachable (§2.12b).

## 4.2 Base-package recharge guard

`app/lib/listingPlans/revenueActiveEntitlementGuard.ts:64-70` — **identical on `origin/main` and `@e3956df8`**, and deliberately narrow to five **monthly subscription** keys:

```
autos_dealer_monthly · br_agent_monthly · restaurantes_base_monthly · servicios_base_monthly · comida_local_base_monthly
```

Applied at `app/api/revenue-os/checkout/route.ts:482-483`, `app/api/clasificados/autos/checkout/route.ts:310`, `app/api/clasificados/leonix/stripe/checkout/route.ts:139`.
Its own header (`:44-63`) documents the exclusions: renewal/one-time packages and add-ons are out of scope by design and have their own validators.

**The gap on `origin/main`:** the three **one-time** paid lanes — `autos_privado_30d`, `br_fsbo_45d`, `empleos_job_post_paid` — have **neither** the subscription guard **nor** a dedicated ownership/expiry validator. Verified: `git grep -n "autos_privado_30d\|br_fsbo_45d\|empleos_job_post_paid" origin/main -- <the three checkout routes>` → **zero hits**; the only dedicated validators present on `origin/main` are `validateRentasRenewalCheckoutOwnership` and `validateOfertasLocalesCheckoutOwnership` (`app/api/revenue-os/checkout/route.ts`, `app/lib/listingLifecycle/listingRenewalFulfillment.ts`, `app/lib/ofertas-locales/ofertasLocalesCommercialServer.ts`).

**September's fix is absent from production:**

```
git cat-file -e origin/main:app/lib/listingLifecycle/activePaidEditCheckoutOwnership.ts
  → fatal: path … does not exist in 'origin/main'
git cat-file -e e3956df8:app/lib/listingLifecycle/activePaidEditCheckoutOwnership.ts
  → EXISTS
```

That module (Sept, "Globalization Build C (RED #14)") covers exactly those three lanes, modelled on the two existing validators, reusing the shared `resolveListingLifecycle()`. It computes expiry from `published_at + durationDays` for Autos Privado and Empleos (neither table has `expires_at`) and reads the real `expires_at` for BR FSBO. Its purpose, verbatim from its header: *"block a checkout call carrying a listingId that is ALREADY active/paid (no double charge)."* Callers on `@e3956df8`: `app/api/revenue-os/checkout/route.ts`, `app/lib/clasificados/autos/autosClassifiedsListingService.ts`, `app/(site)/dashboard/mis-anuncios/page.tsx`.

**Net effect on production:** an owner editing an already-active Autos Privado, BR FSBO, or paid Empleos listing can be charged a second time for the same live listing. **ACTION: ADOPT EXISTING** — port `activePaidEditCheckoutOwnership.ts` plus its three call sites.

**Caveat — porting the guard is necessary but not sufficient for Empleos.** The guard rejects a checkout whose `listingId` is already active. The Empleos republish path mints a **fresh** `listingId` before checkout (§2.9 step 6), so the guard would see an unknown-but-valid new row and allow the charge. **Empleos needs the identity fix (Step 3) *and* the guard; either alone leaves the double-charge open.** Of the three one-time lanes, only Autos Privado and BR FSBO are fully closed by the port alone — and Autos Privado is separately unreachable today (§2.6).

---

# EVIDENCE GAPS

1. **`empleosPublicListingsDbServer.ts` duplication.** `upsertEmpleosListingFromEnvelope` is exported from `app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts:134`, while `app/lib/clasificados/empleos/empleosPublicListingsDbServer.ts` is the path referenced by the Sept guard's header comment. Only the former was read. Whether the two files diverge was not verified — worth closing before acting on §2.9, since the fix touches this module's caller.
2. **Runtime confirmation.** Every verdict here is static: mapper-vs-writer field-set analysis plus the write-path column semantics. No listing was actually published, edited and republished against a live database. The two lanes marked *proven* (§2.2, §2.4) carry an independent runtime claim from the Sept commit messages ("confirmed destructive on Republish"); the other DESTRUCTIVE verdicts are static-only.
3. **Servicios conditional severity.** §2.11(i)'s "net fails on partial re-edit" is derived from reading `serviciosPublishOpsProfileMerge.ts:25-29` against the forward mapper; the precise UI sequence that produces a non-empty `nextWire.quickFacts` was not exercised.
4. **`tipoCodigo` / `subtipo` reverse-label matching** is left at schema defaults even in the September fixes — the commits label this an accepted pre-existing limitation shared with the Bienes parser, not a new gap. Not independently re-verified here.
5. **Restaurantes `mis-anuncios` reachability.** §2.12b's "currently unreachable" rests on reading `buildInventoryListingActions` (`dashboardMisAnunciosCategoryTools.ts:448-480`) and the attention-item feed (`mis-anuncios/page.tsx:455-482`). A generic card component consuming `item.editHref` for restaurantes was searched for and not found, but absence-of-evidence on a large `.tsx` surface is weaker than the positive findings elsewhere.
6. **Rentas `images` column shape.** `imagesFromRow` (`rentasDashboardEditHydration.ts:11-23`) flattens `{url|src}` objects to bare URL strings, so any per-image metadata would be lost on republish. No writer storing such metadata was found, so this is **not** asserted as a finding — but the column's full shape was not proven.
7. **Rentas `primaryImageIndex` / `estadoAnuncio`.** See §2.5b(C) — plausible additional overwrites, emit path not traced to a conclusion.
8. **Empleos double-charge, end to end.** §2.9's Stripe consequence is proven by code path (`empleosRevenueCheckout.ts:60-68` → `startRevenueCategoryCheckout` with the newly-minted id) plus the absence of any guard on `empleos_job_post_paid` (§4.2). No live checkout was executed to observe a second charge.

---

## Severity ordering for remediation

1. **§2.9 — Empleos Premium republish forks a row and re-charges.** Live, reachable, costs the customer money, and the September branch does not fix it. Needs a NET NEW identity fix *plus* the §4.2 guard port.
2. **§2.2 / §2.4 / §2.5 — Bienes Negocio, Rentas Negocio, Rentas Privado.** Proven destructive; fixes already exist and are cherry-pickable (`733408dd`, `67919479`). Rentas Privado must be explicitly verified — the commit message never named it.
3. **§4.2 — one-time-lane recharge guard absent.** Port `activePaidEditCheckoutOwnership.ts`.
4. **§2.3 / §2.8 — inventory children.** Silent, wide field loss; the Autos child additionally inherits the parent's video identity. NET NEW work.
5. **§2.11 / §2.14 / §2.10 — Servicios, Ofertas Locales, Empleos Quick.** Narrower or condition-gated losses.
6. **§2.12b / §2.6 — Restaurantes latent trap, Autos Privado dead-end edit.** Not currently destructive; fix before they become reachable.
