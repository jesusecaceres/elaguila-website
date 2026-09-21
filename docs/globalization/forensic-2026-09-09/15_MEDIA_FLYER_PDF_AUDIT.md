# 15 — MEDIA / FLYER / PDF AUDIT (G09 · G10 · G11)

**Source-of-truth ref: `origin/main` = `a0a4783971b42ea1d71ab2602d4720d0d590baf8`** (verified at start
and re-verified immediately before writing). Sealed September branch = `e3956df8`. The primary
working tree (`d09d979c`) is **112 commits stale and was NOT used as evidence** — every finding below
was read via `git grep -n … origin/main --` / `git show origin/main:<path>` and is labelled with its
ref.

Batch 6 scope: (a) the shared media engine · (b) the `droppedUnpersistable` question · (c) per-category
media adoption · (d) Ofertas public-PDF vs preview parity.

---

# PART A — THE CANONICAL SHARED MEDIA ENGINE

## A.1 Engine location and exported surface — `origin/main`

`app/lib/media/listingMediaContract.ts` is the canonical shared media engine. **Complete exported
symbol list** (`git show origin/main:app/lib/media/listingMediaContract.ts | grep -n "^export"`):

| Line | Symbol | Kind |
|---|---|---|
| `:15` | `LocalUnsavedMedia` | type |
| `:23` | `UploadedHostedMedia` | type |
| `:29` | `ExistingDbMedia` | type |
| `:35` | `RemovedMediaRef` | type |
| `:41` | `ReplacementMedia` | type |
| `:48` | `ExternalVideoUrl` | type |
| `:53` | `ListingMediaState` | union type |
| `:60` | `isBlobOrObjectUrl` | fn |
| `:65` | `isDataUrl` | fn |
| `:75` | `isPersistableMediaUrl` | fn |
| `:84` | `withNormalizedMediaOrder` | fn |
| `:112` | `ProposedMediaOrigin` | type |
| `:114` | `ProposedMediaItem` | type |
| `:120` | `ProposedFinalMediaSet` | type (**carries `droppedUnpersistable` at `:132`**) |
| `:135` | **`buildProposedFinalMediaSet`** | fn — the engine core |
| `:205` | `ProposedMediaIssueCode` | union type |
| `:214` | `ProposedMediaIssue` | type |
| `:227` | `ProposedMediaLimits` | type |
| `:238` | `ProposedMediaValidation` | type |
| `:246` | **`validateProposedFinalMediaSet`** | fn |

**ENGINE: EXISTS AND IS GENUINELY WIRED** — unlike the Connection Hub model (`13` GAP-015) and the
address engine (GAP-047 / Part D of `13B`), this engine is *not* an orphan. It has **11 real call
sites across 7 files** on `origin/main`.

## A.2 GAP-050 CORRECTION — Comida Local **does** import the media contract

`17_ACTIVATION_GAP_LEDGER.md` GAP-050 states the contract "is imported by Servicios … and
Restaurantes … but **never by Comida Local**." **That is incorrect on `origin/main`.**

```
git grep -n "buildProposedFinalMediaSet" origin/main -- app/
→ app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts:28   (import)
→ app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts:219  (call)
```

Comida Local reaches the contract through its **validation module** rather than directly from its
publish route — which is why a route-scoped grep missed it. The distinction that GAP-050 was reaching
for is real (Comida Local's *route* does not import it) but the conclusion ("bypasses the shared
media contract") is **REFUTED**. Comida Local consumes both `buildProposedFinalMediaSet` (`:219`) and
`validateProposedFinalMediaSet` (`:223`), and acts on the validation result at `:229-233`.

**GAP-050 should be reclassified from P1 to RESOLVED/INVALID.**

## A.3 The complete call-site census — `origin/main`

| # | File | Import | `buildProposedFinalMediaSet` call(s) |
|---|---|---|---|
| 1 | `app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts` | `:51` | `:310`, `:379`, `:518` |
| 2 | `app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx` | `:8` | `:335`, `:394`, `:412`, `:428` |
| 3 | `app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts` | `:16` | `:28` |
| 4 | `app/api/clasificados/restaurantes/publish/route.ts` | `:33` | `:281` |
| 5 | `app/api/clasificados/servicios/publish/route.ts` | `:30` | `:275` |
| 6 | `app/lib/clasificados/autos/autosListingPayloadPersistence.ts` | `:4` | `:123` |
| 7 | `app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts` | `:28` | `:219` |

**11 call sites · 7 files.**

---

# PART B — 🔴 **THE `droppedUnpersistable` QUESTION** (highest-value finding in this batch)

## B.1 The exact symbol and file

- **Field:** `ProposedFinalMediaSet.droppedUnpersistable: readonly string[]` —
  `app/lib/media/listingMediaContract.ts:132` (`origin/main`).
- **Populated at:** `:151-154` (gallery URLs failing `isPersistableMediaUrl`) and `:198` (a logo URL
  failing the same test). Returned at `:202`.
- **Its own docstring states the intent** (`:130-131`, `origin/main`):
  > `URLs that were provided but dropped as unpersistable (blob:/data:/malformed) — surfaced so callers can warn instead of silently losing intent.`

## B.2 EVERY caller on `origin/main`, and whether each checks it

Exhaustive proof of absence:

```
git grep -n "droppedUnpersistable" origin/main -- app/ scripts/
→ origin/main:app/lib/media/listingMediaContract.ts:132   (the type field declaration)
→ origin/main:app/lib/media/listingMediaContract.ts:202   (the return statement)
→ origin/main:scripts/gate-pkgB-media-contract-selftest.ts:84
→ origin/main:scripts/gate-pkgB-media-contract-selftest.ts:100
```

**Outside the engine file itself, the ONLY readers on `origin/main` are two assertions in a
self-test script. ZERO application code reads the field.**

| # | Caller (`origin/main`) | Call line(s) | Reads `droppedUnpersistable`? |
|---|---|---|:-:|
| 1 | `app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts` | `:310`, `:379`, `:518` | **NO** |
| 2 | `app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx` | `:335` (upload), `:394` (delete), `:412` (reorder), `:428` (replace) | **NO** ×4 |
| 3 | `app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts` | `:28` | **NO** |
| 4 | `app/api/clasificados/restaurantes/publish/route.ts` | `:281` | **NO** |
| 5 | `app/api/clasificados/servicios/publish/route.ts` | `:275` | **NO** |
| 6 | `app/lib/clasificados/autos/autosListingPayloadPersistence.ts` | `:123` | **NO** |
| 7 | `app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts` | `:219` | **NO** |

**11 of 11 call sites ignore the signal. Verdict: CONFIRMED — `origin/main` lacks the Sept fix.**

## B.3 🔴 **The contrast that proves this is an oversight, not an unbuilt feature**

Every one of these callers **does** consume the *other* return value from the same engine —
`validateProposedFinalMediaSet(...).ok` — and converts it into a user-facing failure:

| Caller | Validation consumed at | User-visible outcome |
|---|---|---|
| `servicios/publish/route.ts` | `:286` `if (!serviciosMediaValidation.ok)` | HTTP `{ ok:false, error:"media_invalid", issues }` (`:293`) |
| `restaurantes/publish/route.ts` | `:292` | HTTP `{ ok:false, error:"media_invalid", issues }` (`:294`) |
| `autosListingPayloadPersistence.ts` | `:134` | issues mapped to `shared_media_contract_*` codes (`:136`) |
| `comidaLocalPublishValidation.ts` | `:229` | issues returned to the caller (`:233`) |

**The same object is returned from the same function in the same statement. Callers read `.ok` and
ignore `.droppedUnpersistable`.** There is no design rationale for the asymmetry — it is a missed
wiring, and the fix pattern is already present in each file, three lines away.

## B.4 🔴 The concrete data-loss path

`buildProposedFinalMediaSet` drops silently and `validateProposedFinalMediaSet` **never inspects
`droppedUnpersistable`** (proven by B.2 — the field has no readers inside the engine either).
Combined with the limits every caller actually passes:

- `servicios/publish/route.ts:280` → `minImages: 0`
- `restaurantes/publish/route.ts:286` → `minImages: 0`
- `autosListingPayloadPersistence.ts:128` → `minImages: 0`
- `comidaLocalPublishValidation.ts:224` → `minImages: 0`
- `buildEmpleosPublishEnvelope.ts:29` → `minImages: 0`

**…the worst case is total, silent loss with a success response.** If every URL reaching
`buildProposedFinalMediaSet` is a `blob:`/`data:`/malformed URL, `images` is `[]`,
`droppedUnpersistable` holds all of them, `validate(...).ok` is `true` because `minImages` is `0`, and
the publish **succeeds** with an empty gallery. The owner is told the listing published. No warning is
emitted anywhere, at any level. The logo has the same path (`:198`).

## B.5 🔴🔴 **IS THE SEPT FIX USER-FACING? — NO. IT IS `console.warn` ONLY.**

Sept-only commit **`bd2ee01e`** *"fix(globalization): Wave 3 G09/G10 — surface silently-dropped
unpersistable media"* (`git show --stat bd2ee01e`: 10 files, +146 / −34) adds a shared helper and
wires it at all 11 call sites.

**The entire body of the fix** (`git show bd2ee01e:app/lib/media/listingMediaContract.ts`, `:216-222`):

```ts
export function warnDroppedUnpersistableMedia(context: string, set: ProposedFinalMediaSet): void {
  if (set.droppedUnpersistable.length === 0) return;
  console.warn(
    `[listingMediaContract] ${context}: dropped ${set.droppedUnpersistable.length} unpersistable media URL(s) — the owner's saved gallery has fewer items than they selected`,
    set.droppedUnpersistable,
  );
}
```

Each call site gains exactly one line, e.g. `dashboard/mis-anuncios/[id]/editar/page.tsx:336`:
```ts
warnDroppedUnpersistableMedia("dashboard-mis-anuncios-editar-upload", finalSet);
```

**The commit message states this itself, unambiguously:**
> *"This is a server/console-log-level fix only -- a category-level, user-facing toast/message is a
> separate, larger follow-up needing product copy per category, not attempted here."*

And the helper's own docstring (`bd2ee01e:app/lib/media/listingMediaContract.ts:207-214`) repeats it:
> *"…so the drop is at least visible in server logs (a category-level, user-facing warning is a
> separate, larger follow-up needing product copy per category — not attempted here)."*

### 🔴 P1 — GAP-052 · **USERS STILL SILENTLY LOSE UPLOADED MEDIA EVEN ON THE SEPTEMBER BRANCH**

| Field | Value |
|---|---|
| SYSTEM | G09 Media upload · G10 Gallery persistence |
| **EXACT FALSE** | No user-facing notice of dropped media exists on **either** `origin/main` **or** `e3956df8`. On `origin/main` the drop is invisible everywhere. On Sept it reaches `console.warn` — a server log the listing owner never sees. |
| CONSEQUENCE | An owner selects N photos, is told the listing published successfully, and gets N−1 (or zero). Identical end-user experience before and after the Sept fix. |
| **SURVIVES THE MERGE** | **YES.** Merging `e3956df8` improves *operator observability only*. It does **not** close the user-facing gap. |
| PROVEN REFERENCE EXISTS | **YES — partially.** The `media_invalid` path in the *same functions* already returns a structured, user-facing error (`servicios/publish/route.ts:293`, `restaurantes/publish/route.ts:294`). A `dropped_unpersistable_media` issue code routed through the identical channel reuses proven plumbing. |
| REFERENCE CATEGORY / PATH | Servicios — `app/api/clasificados/servicios/publish/route.ts:279-293` |
| TARGET PATH | `app/lib/media/listingMediaContract.ts` (`ProposedMediaIssueCode:205`, `validateProposedFinalMediaSet:246`) + all 11 call sites |
| DIFFERENCE | The engine must fold `droppedUnpersistable` into `ProposedMediaValidation.issues` (a new `ProposedMediaIssueCode` at `:205`) so existing `!ok` branches surface it automatically; then per-category copy. |
| **ACTION** | **NET NEW** — flagged as net-new work that the September merge does **not** deliver. |

### 🟠 P2 — GAP-053 · Empleos silences even its own dev warning in production

`app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts:31` (`origin/main`):
```ts
if (!result.ok && process.env.NODE_ENV === "development") {
  console.warn("[empleos publish envelope] shared media contract flagged", result.issues);
```
Empleos is the **only** caller that gates its media-contract diagnostics behind `NODE_ENV`. In
production Empleos discards `validateProposedFinalMediaSet` issues entirely — it does not fail the
publish, does not log, and does not warn. `bd2ee01e` adds `warnDroppedUnpersistableMedia` here too,
but this pre-existing `NODE_ENV` gate is untouched by it and applies to the `.ok` path.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: Servicios `publish/route.ts:286-293` ·
**ACTION: FIX REGRESSION.**

---

# PART C — PER-CATEGORY MEDIA ADOPTION

> **RULE APPLIED: ENGINE ≠ ADOPTION.** The two are reported as separate columns throughout.

## C.1 🔴 THE ENGINE IS A GATE, NOT A PERSISTENCE TRANSFORM

The most important structural finding in Part C: of the 11 call sites, **only one actually persists
what the engine computes.** The other six discard `finalSet.images` / `.heroIndex` and write the
category's own bespoke media shape.

| Call site (`origin/main`) | Uses `.images`/`.heroIndex` output? | Failure behaviour | Verdict |
|---|:-:|---|---|
| `dashboard/mis-anuncios/[id]/editar/page.tsx:335,:394,:412,:428` | **YES** — `finalSet.images.map(i => i.url)` → `persistImages` | n/a (pure transform) | **TRUE ADOPTION** |
| `servicios/publish/route.ts:275` | NO — discarded | 422 `media_invalid` | GATE ONLY |
| `restaurantes/publish/route.ts:281` | NO — discarded | 422 `media_invalid` | GATE ONLY |
| `comidaLocalPublishValidation.ts:219` | NO — discarded (returns the untouched `draft` at `:246-256`) | `media_invalid` | GATE ONLY |
| `leonixPublishRealEstateFromDraftState.ts:310,:379,:518` | NO — discarded | `{ok:false}` | GATE ONLY |
| `autosListingPayloadPersistence.ts:123` | NO — discarded | pushes a warning string; **publish continues** | GATE ONLY — non-blocking |
| `buildEmpleosPublishEnvelope.ts:28` | NO — discarded | `console.warn` gated to `NODE_ENV==="development"` | GATE ONLY — **no-op in prod** |

**Consequence for `droppedUnpersistable` (Part B):** because six of seven call sites throw away the
computed set, wiring a warning at those sites reports on a value that never reaches the database
anyway. The correct fix location is the *validation issue list* (B.5), not a side-channel log.

## C.2 GAP-050 — DEFINITIVE ADJUDICATION

The full Comida Local chain on `origin/main`:

1. `app/api/clasificados/comida-local/publish/route.ts:12` imports `parseComidaLocalPublishRequest`
2. `…/publish/route.ts:98` calls it
3. `comidaLocalPublishValidation.ts:185` defines it
4. `:219` `buildProposedFinalMediaSet({ existing: draft.galleryImages…, logoUrl: draft.logoImage?.url })`
5. `:223` `validateProposedFinalMediaSet(…)`
6. `:229` on failure returns `{ ok:false, error:"media_invalid" }` **before any DB write**
7. writes at `route.ts:192-193` (update) / `:258-259` (insert) are downstream of that parse

**Both halves of the truth:** the contract *is* genuinely on Comida Local's persistence path and can
block a publish (so GAP-050's "bypasses the shared media contract" is **REFUTED**); but at `:246-256`
the function returns the *original* `draft`, and `route.ts:230` inserts via
`draftToComidaLocalPublicListingInsert(draft, …)` — so the contract does **not** decide what is
stored. **GAP-050: RECLASSIFY to INVALID-AS-WRITTEN; the real issue is C.1, which affects six
categories, not one.**

## C.3 PER-CATEGORY MEDIA MATRIX — `origin/main`

`T`=TRUE · `F`=FALSE · `—`=n/a. Storage: **VB**=Vercel Blob · **SB**=Supabase Storage (`listing-images`).

| # | Category | SELECT | UPLOAD | DRAFT REFS | **REMOTE REFS** | PREVIEW | **PUBLISH** | GALLERY | COVER | ORDER | DELETE | VIDEO ext/Mux | FLYER | PDF | **ENGINE** |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 1 | **Servicios** | T | T **VB** | T | **T** | T | T | T | T | **T** | T | T / **T** | F | **T** | GATE |
| 2 | **Restaurantes** | T | T **VB** | T | T | T | T | T | T | **F** | T | T / F | F | F | GATE |
| 3 | **Comida Local** | T | T **VB** | T | T | T | T | T | T | **F** | T | **F / F** | F | F | GATE |
| 4 | **Autos Dealer** | T | T **VB** | T | T | T | T | T | T | T | T | T / T | F | F | GATE (warn) |
| 5 | **Autos Privado** | T | T **VB** | T | T | T | T | T | T | T | T | T / T | F | F | GATE (warn) |
| 6 | **BR Negocio** | T | T **SB** | T | **F** | T | T | T | T | T | T | F / **F dead** | F | T | GATE |
| 7 | **BR Privado** | T | T **SB** | T | **F** | T | T | T | T | T | T | F / F | F | F | **NONE** |
| 8 | **Rentas Negocio** | T | T **VB** | T | T | T | T | T | T | T | T | F / **F dead** | F | F | GATE |
| 9 | **Rentas Privado** | T | T **VB** | T | T | T | T | T | T | T | T | F / **F dead** | F | F | GATE |
| 10 | **En Venta** | T | T **SB** | T | **F** | T | T | T | T | T | T | T / T | F | F | **NONE** |
| 11 | 🔴 **Empleos** | T | **F** | T | **F** | T | **🔴 F** | T | T | T | T | T / F | T (render) | T | GATE (dev-only) |
| 12 | **Clases** | T | T **SB** | T | **F** | T | T | T | T | T | T | F / F | T (render) | F | **NONE** |
| 13 | 🔴 **Viajes** | T | **F** | T | **F** | T | **🔴 F** | F | T (col only) | F | F | F / F | F | F | **NONE** |
| 14 | **Mascotas / Comunidad** | T | T **SB** | T | **F** | T | T | T | T | T | T | F / F | T (render) | F | **NONE** |
| 15 | **Busco** | T | T **SB** | T | **F** | T | T | **F** (1 img) | — | F | T | F / F | F | F | **NONE** |

Key paths: Servicios `ClasificadosServiciosApplication.tsx:1903` / `api/…/servicios/draft-media-upload/route.ts:119` /
`serviciosDraftPublishPrepare.ts:112` / `ServiciosPublishSortableGallery.tsx:1989` /
`serviciosPromoPdfUi.ts:12` · Restaurantes `RestauranteUploadRow.tsx:43` /
`api/…/restaurantes/draft-media-upload/route.ts:76` · Comida Local `ComidaLocalImageUploadField.tsx:129` /
`api/…/comida-local/draft-media-upload/route.ts:95` · Autos `AutosNegociosMediaManager.tsx:252` /
`api/clasificados/autos/media/draft-photo-upload/route.ts:78` / `autosNegociosDraftIdbRefs.ts:16-18` ·
BR `leonixPublishRealEstateListingCore.ts:105,:661` · Rentas `api/clasificados/rentas/draft-media-upload/route.ts:95` ·
En Venta `PhotosSection.tsx:583,:729` / `enVentaPublishFromDraft.ts:513` ·
Community/Mascotas `publishCommunityQuickToListings.ts:357` / `publishMascotasPerdidosQuickToListings.ts:188`.

## C.4 🔴🔴 P0 — GAP-056 · **EMPLEOS ACCEPTS PHOTO UPLOADS AND DISCARDS 100% OF THEM AT PUBLISH**

| Field | Value |
|---|---|
| SYSTEM | G09 Media upload · G10 Gallery persistence |
| SEVERITY | **P0 — total, silent user data loss on a live category** |

**Proof chain, `origin/main`:**
1. The picker exists and works — `app/(site)/publicar/empleos/shared/media/EmpleosImageGalleryEditor.tsx:172` (gallery) and `EmpleosSingleImageField.tsx:64` (logo).
2. It produces **`data:` URLs only** — `EmpleosImageGalleryEditor.tsx:141` `r.readAsDataURL(file)`.
3. **No upload path exists anywhere in the Empleos publish tree:**
   ```
   git grep -rn "storage\.from|draft-media-upload|@vercel/blob|put\(" origin/main -- 'app/(site)/publicar/empleos/'
   → only EmpleosVideoDraftField.tsx setUrlInput() hits (a text input, not an upload)
   ```
4. Publish drops every one — `buildEmpleosPublishEnvelope.ts:46`:
   ```ts
   if (u.startsWith("blob:") || u.startsWith("data:")) continue;
   ```
5. The owner is shown no error. The job posts with zero images.

### 🔴 The compounding detail — **the September fix is a literal no-op for Empleos**

`mapImagesForPublish` (`:42-52`) strips `data:`/`blob:` **before** the media contract ever runs.
`auditEmpleosEnvelopeMedia` is invoked at `:272`, `:291`, `:307` with
`data.images.map((r) => r.url)` — i.e. the **already-sanitised output** of `mapImagesForPublish`
(`:69`, `:168`). The envelope's own header comment admits it (`:20-22`):

> *"…the final envelope's **already-sanitized** media references — mapImagesForPublish/mapVideoUrlsForPublish above **already strip blob:/data:** with their own logic…"*

Therefore `buildProposedFinalMediaSet` **always receives a clean list**, `droppedUnpersistable` is
**always empty**, and `warnDroppedUnpersistableMedia` — added by `bd2ee01e` at exactly this call site
— **will never fire.** The one category that loses 100% of its uploaded media is structurally
invisible to both the engine on `origin/main` **and** to the September fix.

| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **YES** |
| REFERENCE CATEGORY | **Clases / Comunidad / Mascotas — they use the *identical* `EmpleosImageGalleryEditor`** and upload the data URLs at publish |
| REFERENCE PATH | `app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts:357-370` · `publishMascotasPerdidosQuickToListings.ts:188-198` |
| TARGET PATH | `app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts:42-52` |
| DIFFERENCE | Empleos is the sole consumer of that shared editor with **no matching upload step**. Three sibling lanes already do it. |
| **ACTION** | **FIX REGRESSION** — not a missing feature; a wiring omission in one of four consumers of a working shared uploader. |

## C.5 🔴 P0 — GAP-057 · **VIAJES DOES THE SAME**

`app/api/clasificados/viajes/submit/route.ts:20-22` and `:29-31`:
```ts
function firstHeroUrlNegocios(d: ViajesNegociosDraft): string | null {
  const u = d.imagenPrincipal.trim();
  if (u.startsWith("http")) return u;      // data: URLs fall through
  …
  return null;
}
```
The five Viajes pickers (`ViajesNegociosApplicationShell.tsx:213,:237,:256`;
`ViajesPrivadoApplicationShell.tsx:207,:226`) all emit `readAsDataURL` output, and no upload exists:
```
git grep -rn "storage\.from|draft-media-upload|put\(" origin/main -- 'app/(site)/publicar/viajes/' 'app/api/clasificados/viajes/'
→ (no output)
```
**Every Viajes image the owner picks is discarded at submit.** The `hero_image_url` column already
exists (`viajesStagedListingsDbServer.ts:201`) and is never populated from the picker.

**Mitigating context:** Viajes is production-dead — `viajes/negocio/[slug]/page.tsx:42`
`if (!viajesAllowCuratedDemoCatalog()) notFound();` (per `13` A.3). **Real-world impact is therefore
near zero today, but the defect ships.** Severity **P0-by-class / P2-by-exposure.**
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: Mascotas (SB) `publishMascotasPerdidosQuickToListings.ts:188-198`
or Rentas (VB) `api/clasificados/rentas/draft-media-upload/route.ts:95` · **ACTION: ADOPT EXISTING.**

## C.6 🟠 P1 — GAP-058 · SEVEN CATEGORIES DEFER UPLOAD TO PUBLISH TIME

BR Negocio, BR Privado, En Venta, Clases, Comunidad, Mascotas and Busco hold `data:` URLs in the
draft and upload only *inside* the publish call (`leonixPublishRealEstateListingCore.ts:105,:661`;
`enVentaPublishFromDraft.ts:513`; `publishCommunityQuickToListings.ts:357`). **A publish failure —
or a closed tab mid-publish — loses every photo**, and large `data:` URLs bloat sessionStorage.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: **Servicios** —
`serviciosDraftPublishPrepare.ts:112` `uploadUrlIfNeeded` promotes to a hosted URL **at draft time**
(also Restaurantes, Comida Local, Rentas, Autos) · **ACTION: ADOPT EXISTING.**

## C.7 🟠 P1 — GAP-059 · `MediaUploader.tsx` IS A FULLY-BUILT ORPHAN; 13 FORKED UPLOADERS SHIP

```
git grep -n "MediaUploader" origin/main -- app/ | grep -v "\.md:"
→ app/(site)/clasificados/components/MediaUploader.tsx:40   (type)
→ app/(site)/clasificados/components/MediaUploader.tsx:152  (component)
→ ZERO importers
```
This is the **fourth** confirmed fully-built zero-consumer global engine, alongside
`buildSharedConnectionHubContact` (`13` GAP-015), `app/lib/businessAddress/*` (GAP-047) and
`dashboardRoute` (GAP-034).

Meanwhile **13 distinct uploaders** ship. The only real consolidation that happened was accidental:
`EmpleosImageGalleryEditor.tsx:54` is the **de-facto shared uploader for 4 categories** (Empleos,
Clases, Comunidad, Mascotas), and `AutosNegociosMediaManager.tsx:53` serves 2. Everything else is
inline per category (Servicios `:1903`, BR Negocio `steps01-03.tsx:290,:529`, BR Privado
`BienesRaicesPrivadoForm.tsx:608,:716`, Rentas ×2, En Venta `PhotosSection.tsx:583`, Viajes ×2,
Busco `BuscoQuickFormClient.tsx:193`, Restaurantes `RestauranteUploadRow.tsx:25`, Comida Local
`ComidaLocalImageUploadField.tsx:24`, dashboard editor `:831,:945`).

**Transport is forked 5 ways too** — five near-identical Vercel Blob routes (`servicios`,
`restaurantes`, `comida-local`, `rentas`, `autos/media`), each `put()` from `@vercel/blob` behind the
same `BLOB_READ_WRITE_TOKEN` 503 guard.

### 🟡 P2 — Two storage backends with no governing rule
**Vercel Blob** for the 5 draft-upload routes; **Supabase Storage `listing-images`** for
BR/Rentas-core, En Venta, Busco, Community, Mascotas and the dashboard editor. No registry, ADR or
comment states which a new category should use. **ACTION: OWNER_POLICY_DECISION.**

## C.8 MUX — INTEGRATED for 3 categories, VESTIGIAL for 2

**Real integration** — `package.json` `"@mux/mux-node": "^12.8.1"`; `app/lib/mux/server.ts:2,:71,:77`;
live routes `api/mux/direct-upload`, `api/mux/upload-status`, `api/mux/delete-assets` (called on
abandon via `sendBeacon`, `publishFlowLifecycleClient.ts:158,:161,:172`).

| Category | Mux | Evidence |
|---|:-:|---|
| Servicios | **LIVE** | `serviciosMuxVideoClient.ts:126,:160` |
| En Venta | **LIVE** | `PhotosSection.tsx:441,:494` |
| Autos | **LIVE (write), legacy-read** | `autosMuxVideoClient.ts:24` → `autosMuxPublishPrepare.ts:30` → `AutosPublishConfirmCore.tsx:531`; playback `anuncio/[id]/page.tsx:408-410`. But `autoDealerVideo.ts:10` states publish forms use external `videoUrls` only, and `autosNegociosDraftGuards.ts:7` `stripDraftMuxFields` **erases Mux IDs on every draft load/save** (`autosNegociosDraftStorage.ts:167,:173,:176,:194,:230,:256`) |
| **Rentas** | **VESTIGIAL** | `rentasMuxVideoClient.ts:24` exports `uploadRentasDraftVideoFileToMux` — **zero callers**; `rentasDraftVideoMuxSource.ts` **entirely unreferenced** |
| **BR Negocio** | **VESTIGIAL** | `brAgenteResMuxLifecycle.ts:10` literally declares `export type BrAgenteResMuxLifecyclePhase = "not_implemented";` — **zero importers** |

### 🟡 P2 — a debug endpoint ships on `main`
`app/api/debug/mux-env/route.ts` exposes `hasMuxEnv()` in production. Worth a security look
(it reports env presence, not values) — flagged, not adjudicated here.

## C.9 FLYER (G11) AND PDF — repo-wide

- **FLYER upload:** exists in **Ofertas Locales only.** Empleos (`JobFairFlyerCard.tsx`), Clases
  (`communityAnuncioHeroClasses.ts:1`, "flyer-first") and Comunidad (`anuncio/[id]/page.tsx:1259,:2612`)
  **render** something called a flyer, but it is an ordinary gallery image — there is no flyer
  *upload* concept. **PROVEN REFERENCE EXISTS: NO** (outside Ofertas) · **ACTION: NET NEW if wanted.**
- **PDF:** **Servicios** has a real promo-PDF lane (`serviciosPromoPdfUi.ts:12`,
  `serviciosDraftPublishPrepare.ts:82`); **Empleos** has an `allowPdf` prop
  (`EmpleosImageGalleryEditor.tsx:112`) — inert, since Empleos uploads nothing (C.4); **BR Negocio**
  has a brochure *URL* field, not an upload (`steps01-03.tsx:585`). Ofertas is covered in Part D.
  **PROVEN REFERENCE EXISTS: YES** — Servicios · **ACTION: ADOPT EXISTING if wanted.**

## C.10 🟡 P2 — the engine's own header contradicted reality on `origin/main`

`app/lib/media/listingMediaContract.ts:3` (`origin/main`) still reads *"Additive foundation only:
these types/predicates are **not wired into any existing category's** publish/draft pipeline."* —
false, given 11 call sites, one of which genuinely persists through it (C.1). `bd2ee01e` corrects
this comment. Until that merges, the header actively misleads.
This is the **same documentation-drift class** as `13` A.1 (`05761912`), A.6 and GAP-049.
**ACTION: RECONCILE_MAIN_AND_GLOBALIZATION** (resolved by merging the Sept seal).

---

# PART D — 🔴 OFERTAS: PUBLIC PDF vs PREVIEW PARITY

> Ofertas source is PROTECTED. Everything below is **read-only forensic evidence**; nothing was edited.

## D.1 VERDICT — **THE CLAIM IS TRUE, AND THE DEGRADATION IS WORSE THAN STATED**

**TRUE.** On `origin/main` the **public** Ofertas detail page renders a PDF flyer as a bare
*"Open PDF"* link and **disables tap-to-product overlays for PDFs by explicit condition**, while the
**preview** surface renders the same PDF inline to a `<canvas>` via `pdfjs-dist`, with real per-page
navigation and working bbox overlays.

The degradation is **not** a missing library or an unsolved problem: the PDF-rendering capability is
already implemented **three times** inside the Ofertas tree, all in the publish/preview lane.

## D.2 THE PUBLIC COMPONENT — `PublicFlyerViewer`

**`app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx`** (`origin/main`),
mounted at `:692` from the public route `ofertas-locales/[id]/page.tsx:56`.

| Concern | Evidence (path:line) |
|---|---|
| Component definition | `:127` `function PublicFlyerViewer({…})` |
| PDF detection | `:54-56` `isPdfAssetHref(href) { return href.toLowerCase().includes(".pdf"); }` |
| PDF flag | `:150` `const isPdf = href ? isPdfAssetHref(href) : false;` |
| **Overlays disabled for PDFs** | `:158-162` `items.filter((item) => item.sourceBbox && resolveItemPage(item) === currentPageNumber && `**`!isPdf`**`)` |
| **The degraded PDF branch** | `:209-215` — `{isPdf ? (` → a `<p>` with the asset label and `<a href={href} target="_blank">{c.openFlyerPdf}</a>`. **That is the entire PDF experience.** |
| The image branch (full-featured) | `:216-262` — `<img>` + measured surface + `mapOfertaLocalSourceBboxToDisplayRect` + absolutely-positioned overlay `<button>`s (`:245-259`) + `c.overlayHint` (`:265`) |
| Page navigation | `:268-287` — gated on **`assets.length > 1`**, i.e. the number of *uploaded files*, not PDF pages |
| Zoom | **absent** — `git grep -c -i "zoom" origin/main -- '…/OfertasLocalesPublicDetailView.tsx'` → **no output (zero hits)** |
| `pdfjs` import | **absent** — `git grep -n "pdfjs" origin/main -- app/` returns **zero hits anywhere under `app/(site)/clasificados/`** |

## D.3 THE PREVIEW COMPONENTS — full PDF rendering, three implementations

Entry: `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx` →
`OfertasLocalesPreviewCard.tsx` → hero + modal.

| Component (`origin/main`) | Capability |
|---|---|
| **`preview/ofertasLocalesPdfDocumentCache.ts`** | Shared pdfjs document/page cache — `:34` `import("pdfjs-dist/legacy/build/pdf.mjs")`, `:38-42` `acquireSharedPdfPage` / `releaseSharedPdfDocument`. Header `:8` explains it exists so a 127-item flyer does not re-open the document per item. |
| **`preview/OfertasLocalesFlyerViewerModal.tsx`** | The shopper-facing flyer modal. `:14` imports the cache · `:72` `canvasRef` · `:145-203` `renderPdfPage()` renders the PDF page to `<canvas>` at DPR-corrected scale · `:97` `effectivePageCount = heroAsset?.isPdf ? (pdfPageCount ?? 1) : 1` — **real page count read from the PDF** · `:355-366` true prev/next page navigation showing `Page {safePage}/{effectivePageCount}` · `:227-245` `overlayRects` / `visibleOverlays` → `:275-278` `renderOverlays()` → click calls `onOpenProductDetail(item)` |
| **`preview/OfertasLocalesPdfFlyerPreview.tsx`** | `:12` renders **PDF page 1 inline as the hero visual**; used by `OfertasLocalesPreviewHeroVisual.tsx:12,:102` |
| **`preview/OfertasPdfItemCropPreview.tsx`** | `:11` per-item PDF bbox crop rendering |
| **`OfertasClipReviewViewer.tsx`** (Step-5 review) | `:131-143` its own independent pdfjs render + `:271` page nav + `:320` PDF branch — a 4th copy of the pattern |
| Server-side | `app/lib/ofertas-locales/ofertasLocalesPdfPageImages.ts:205-274` rasterizes PDF pages to PNG via `pdfjs-dist` + `@napi-rs/canvas` (`renderMethod: "pdfjs_canvas_png"`) |

## D.4 🔴 EXACTLY WHAT THE PUBLIC USER DOES NOT GET

For an offer whose flyer is a **PDF**, the public shopper loses — versus the preview surface:

| # | Capability | Preview | Public | Public evidence |
|---|---|:-:|:-:|---|
| 1 | **Inline flyer rendering** | ✅ canvas | ❌ link only | `OfertasLocalesPublicDetailView.tsx:209-215` |
| 2 | **Tap-to-product bbox overlays** | ✅ | ❌ **explicitly disabled** | `:160` `&& !isPdf` |
| 3 | **Overlay → product detail drawer** | ✅ | ❌ unreachable via flyer | `:253` `onClick={() => onOpenProduct(item)}` sits inside the image-only branch |
| 4 | **Multi-page navigation** | ✅ real page count from pdfjs | ❌ **none at all** | `:268` gates nav on `assets.length > 1`; a single 12-page PDF is **1 asset** → zero navigation |
| 5 | Overlay hint copy | ✅ | ❌ | `:265` inside image branch only |
| 6 | Above-the-fold flyer visual | ✅ (`PdfFlyerPreview`) | ❌ | no pdfjs under `app/(site)/clasificados/` |
| 7 | Staying on-site | ✅ | ❌ leaves the site (`target="_blank"`) | `:211` |

**#4 is the sharpest quantification: a merchant who uploads one multi-page PDF weekly flyer — the
single most common real-world Ofertas artifact — gives the public shopper a link to page-1-through-N
in a new browser tab, with no in-page navigation, no product overlays, and no drawer.** The product
grid still lists items, so the items are *discoverable*; the **flyer-to-product spatial connection —
the feature Ofertas is built around — is entirely absent from the public surface for PDF flyers.**

## D.5 The in-tree audit doc mislabels the preview lane as "public"

`app/lib/ofertas-locales/OFERTAS_PUBLIC_FLYER_VIEWER_AUDIT.md` (`origin/main`) is titled
*"OFERTAS **PUBLIC** FLYER VIEWER V1 — Clickable Approved Item Overlays + Product Detail Drawer"*
and describes §5 *"Public viewer data path"* and §10 *"No fake overlay policy"*. **Every file it lists
in §2/§3 lives under `app/(site)/publicar/ofertas-locales/preview/`** — the *publish-flow preview*,
not the public route `app/(site)/clasificados/ofertas-locales/`. §7 even promises
*"PDF flyers: page navigation + overlays filtered by `sourcePage`"* — true of the preview modal,
**false of the public page.**

This is the **seventh** recorded instance in this audit programme of documentation asserting a
capability the shipped public surface does not have (cf. `13` A.1, A.6; GAP-049).

### 🔴 P1 — GAP-054 · PUBLIC OFERTAS PDF FLYER IS A LINK, NOT A VIEWER

| Field | Value |
|---|---|
| SYSTEM | G11 Flyer/PDF · G09 Media |
| **EXACT FALSE** | Public PDF flyer: no inline render, no overlays (`!isPdf` at `OfertasLocalesPublicDetailView.tsx:160`), no page navigation, no drawer entry. |
| PROVEN REFERENCE EXISTS | **YES** |
| REFERENCE CATEGORY | Ofertas Locales itself — the preview lane |
| REFERENCE PATH | `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesFlyerViewerModal.tsx:14,:72,:97,:145-203,:227-245,:355-366` + `preview/ofertasLocalesPdfDocumentCache.ts:34-42` |
| TARGET PATH | `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx:127-292` |
| DIFFERENCE | The public viewer never imports pdfjs. It needs the cache helper + canvas render path, then removal of the `!isPdf` overlay exclusion at `:160` and a page-count source other than `assets.length`. |
| **ACTION** | **ADOPT EXISTING** — a complete, working, in-tree implementation exists in the same category. This is a port, not a build. |
| ⚠ CONSTRAINT | Ofertas source is PROTECTED in this audit. **No edit was made.** |

### 🟡 P2 — GAP-055 · `isPdfAssetHref` is a naive substring test

`OfertasLocalesPublicDetailView.tsx:54-56` (`origin/main`):
```ts
function isPdfAssetHref(href: string): boolean {
  return href.toLowerCase().includes(".pdf");
}
```
`.includes()` matches **anywhere** in the URL — a query string, a folder segment, or a filename such
as `flyer.pdf.jpg`. Any of these sends a genuine **image** flyer down the degraded link-only branch,
losing overlays on an asset that would otherwise work. The preview lane does not share this bug: it
uses the persisted MIME type — `app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts:211`
`isPdf: mime === "application/pdf" || asset.fileName.toLowerCase().endsWith(".pdf")`.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: `ofertasLocalesPreviewHelpers.ts:211` ·
**ACTION: ADOPT EXISTING.**

### 🟡 P3 — Analytics fires for a flyer the user cannot see

`OfertasLocalesPublicDetailView.tsx:153-155` emits `onFlyerPageView(currentPageNumber, asset.id)`
in a `useEffect` **outside** the `isPdf` branch, so a `flyer_page_view` event
(`:698-699`) is recorded for a PDF flyer that rendered nothing but a link. Ofertas flyer-view metrics
therefore over-count PDF engagement.

## D.6 Storage confirmation

Ofertas assets are on **Vercel Blob** — upload route
`app/api/ofertas-locales/assets/upload/route.ts`; path scheme
`app/lib/ofertas-locales/ofertasLocalesStoragePaths.ts:28-38`
(`ofertas-locales/drafts/{owner}/{flyer|logo|coupon}/{assetId}`). Public asset hrefs are read from the
`flyer_assets` / `coupon_assets` JSONB columns (`ofertasLocalesAdminHelpers.ts:368-369`,
`:484-485`), which carry the **originally uploaded file** — a PDF upload stays a PDF on the public
surface. The server-side rasteriser (`ofertasLocalesPdfPageImages.ts`) feeds the AI scan pipeline; its
PNG output is **not** substituted into the public flyer href. Item rows are `oferta_local_items`.

---

# PART E — EVIDENCE GAPS (this report)

1. **Runtime branch dominance is not determinable from source.** Whether real production Ofertas
   flyers are predominantly PDF or image decides GAP-054's true blast radius. Static analysis cannot
   answer it; a `select` over `flyer_assets` MIME types would.
2. `bd2ee01e` was read as a diff against its parent, not applied and executed. The claim that it is
   log-only rests on the added source (B.5) and its own commit message — both unambiguous.
3. The four preview-lane pdfjs implementations were inventoried but not diffed against each other;
   whether they can be unified into one shared viewer is a design question, not an audit finding.
4. `scripts/verify-ofertas-public-flyer-viewer.mjs:82` asserts the *audit document* mentions
   `OfertasClipReviewViewer` — a documentation-text assertion, not a behavioural one. It passes while
   GAP-054 is open, and is **false-positive-prone** (same class as the four verifier scripts flagged
   in `13` A.5).
