# 12 — AUTOS / BIENES PARENT-CHILD AUDIT (MASTER)
Systems **G40** (Autos) and **G41** (Bienes Raíces). Ref: `origin/main` = `a0a47839`.
Detail: `12A_BIENES_PARENT_CHILD_AUDIT.md` · `12B_AUTOS_PARENT_CHILD_AUDIT.md`.

---

## 1. HEADLINE — AUTOS IS THE REFERENCE, BIENES IS THE ADOPTER THAT FELL BEHIND

| System | Score | Verdict |
|---|---|---|
| **G40 Autos** | **18/18 TRUE, 0 FALSE** | **The strongest parent/child implementation in the platform** |
| **G41 Bienes** | **13 TRUE / 4 PARTIAL / 1 FALSE** | Sound core, two real holes |

This **reverses the usual direction** of the audit's reference-implementation rule: for parent/child,
**Autos is the model and BR should adopt from it**, not the other way round.

---

## 2. THE PARENT-VISIBILITY GATE — THE LOAD-BEARING PROTECTION

Both systems answer the same question: *if a dealer/agent parent goes inactive, do their child
listings stay publicly visible?*

### AUTOS — 3 enforcement points + saved search
`app/lib/clasificados/autos/autosPublicChildParentVisibility.ts:40-62`
(self-documented as a port of the BR gate), enforced at:
- `autosClassifiedsListingService.ts:204-205` — results pool
- `autosClassifiedsListingService.ts:493-494` — dealer group
- `autosClassifiedsListingService.ts:786-791` — direct detail
- `app/lib/saved-search/autos/autosPublicEligibleListing.ts:28` — saved-search eligibility

### BIENES — 2 enforcement points + saved search, and **2 readers bypass it**
`app/(site)/clasificados/lib/brPublicChildParentVisibility.ts:51-74` — parent must be
`category === "bienes-raices" && seller_type === "business" && inventory_role === "main"`, same
`owner_id`, active and published. Enforced at:
- `fetchBrPublishedListingsBrowser.ts:86-99` — results pool
- `anuncio/[id]/page.tsx:621-647` (`isBrChildParentGateSatisfied` `:642`) — direct detail
- `app/lib/saved-search/bienes-raices/bienesRaicesPublicEligibleListing.ts:44-59` — saved search
  *(a third adopted consumer, found during the audit)*

**BYPASSED BY (GAP-058):**
- `fetchBrRelatedInventoryListingsBrowser.ts:60`
- `fetchBrSimilarOtherClientListingsBrowser.ts:99`

→ **An orphaned BR child can still surface through the related-listings rails.**
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: Autos' 3-point enforcement ·
**ACTION: ADOPT EXISTING.**

### BOTH — the gate is APP-LAYER ONLY
`supabase/migrations/…listings_enable_rls_full_policies.sql:29/:63` (SELECT) and `:74-78` (INSERT —
`owner_id = auth.uid()` only) carry **no parent predicate**. Autos' equivalent
(`20260409120000_….sql:39-42`) likewise.
**Autos' exposure is lower in practice** — no browser-side anon query exists against
`autos_classifieds_listings` — whereas BR is queried **from the browser**
(`fetchBrPublishedListingsBrowser.ts:46`). **BR therefore carries the real risk.**

---

## 3. THE 18-ITEM MATRIX

| # | Item | G40 Autos | G41 Bienes |
|---|---|---|---|
| 1 | parent UUID | TRUE | TRUE |
| 2 | inventory group | TRUE | TRUE |
| 3 | inventory role | TRUE | TRUE |
| 4 | child UUID | TRUE | TRUE |
| 5 | capacity | TRUE | PARTIAL — parent eats a slot |
| 6 | included inventory | TRUE | TRUE |
| 7 | add-on capacity | TRUE | PARTIAL |
| 8 | checkout identity | TRUE | TRUE |
| 9 | entitlement | TRUE | TRUE |
| 10 | child creation | TRUE | TRUE (new children refused on the edit API) |
| 11 | child edit | **TRUE (route) / destructive (fields)** | **PARTIAL — suppressed, not fixed** |
| 12 | child preview | TRUE | TRUE (overlay on the parent's preview) |
| 13 | child public page | TRUE | TRUE |
| 14 | child analytics | TRUE | **FALSE — no view event fires at all** |
| 15 | parent-inactive cascade | TRUE | TRUE (`brListingLifecycleService.ts:173-268`) |
| 16 | wrong-owner prevention | TRUE | TRUE |
| 17 | dashboard inventory tools | TRUE | PARTIAL |
| 18 | admin | TRUE | TRUE |
| | **TOTALS** | **18 TRUE** | **13 TRUE / 4 PARTIAL / 1 FALSE** |

---

## 4. THE FOUR REAL DEFECTS

### 4.1 — P0 · THE PARENT ROW CONSUMES A PAID INVENTORY SLOT (BOTH SYSTEMS)
| System | Evidence | Net effect |
|---|---|---|
| **Bienes** | migration `20260810120000_….sql:276` · `commercialWriteGuard.ts:192-193` · `leonixBrPropertyInventoryPolicy.ts:123-129` — **three layers** | **Base plan = 0 addable properties. Pack = 3 of 4.** A paying agent cannot list what they bought |
| **Autos** | `autosDealerInventoryPolicy.ts:48-51` · `app/api/clasificados/autos/listings/route.ts:105` | **9 of 19, not 10 of 20** |
**FIX EXISTS:** Sept `10618f41` "exclude commercial parents from inventory limits" (Gate 6C.2),
confirmed **NOT in `origin/main`**. Its `inventory_role` capacity anchoring in `commercialWriteGuard.ts`
is likewise absent. **ACTION: ADOPT EXISTING (merge Sept).** *(GAP-055 / GAP-064 / GAP-021.)*

### 4.2 — P0 · CHILD EDIT CORRUPTS DATA (BOTH SYSTEMS, DIFFERENT MECHANISMS)
| System | Mechanism | Result |
|---|---|---|
| **Autos child** | the write is `{...parent, ...childSlice}` | Missing fields **inherit the PARENT's values** — `mpgCity`, `mpgHighway`, `doors`, `seats`, `titleStatus`, `features`, `customEquipment`, `otherEquipmentDetails`, `country`, `heroImages`, and **all 8 video/Mux keys**, so the child vehicle page **plays the parent dealership's video**. This is *wrong data*, not merely lost data |
| **Bienes child** | partial mapper + whole-column replace | `state` → NULL · `zip` → NULL · `direccionLinea1/2` · `direccion` · `mostrarDireccionExacta` · `direccionPais` · `subtipoPropiedad` · `videoUrl` · `tourUrl` · `brochureUrl` · `ctaUrlMls` · `listadoUrl` · `propertyForm` permanently null |
Sept's `733408dd` covers the BR **parent** only. **Neither child lane is fixed by any commit on any
branch.** *(GAP-041 / GAP-042.)*

### 4.3 — P1 · BR CHILD EDIT IS SUPPRESSED, NOT REPAIRED
`LeonixRealEstateListingManageCard.tsx:118-131` (Gate D.2.1) — the repo **self-documents** the generic
dashboard child-edit route as broken and **hides the control** rather than fixing it. *(GAP-059.)*

### 4.4 — P1 · NO CHILD IDENTITY-SUBSTITUTION GUARD
`autosChildIdentityGuard.ts` is **absent from `origin/main`** (BR's equivalent too). The update path
`autosClassifiedsListingService.ts:236-306` **accepts any payload**, so a child's identity can be
substituted wholesale. Sept `651abd4e` "protect child listing identity integrity" is the intended fix
and is unmerged. **ACTION: ADOPT EXISTING.** *(GAP-063.)*

---

## 5. HISTORICAL PROVENANCE — VERIFIED PRESENT, NOT MERELY COMMITTED
Per the audit's anti-hallucination rule, the protections were confirmed **in current `origin/main`
source**, not merely as commits that once existed. The BR gate was re-verified **byte-for-byte** at
the cited lines, and a third adopted consumer (saved search) was found that earlier passes missed.
Sept commits bearing on this system and **NOT** in main: `10618f41` · `651abd4e` · `b3473f89`
(autos staging schema + ad identity) · `b32ff613` · `db688c04`.

---

## 6. VERDICT

| Question | Answer |
|---|---|
| Is the parent/child architecture sound? | **YES** — cascade, wrong-owner prevention and capacity all exist and are traced |
| Is it evenly enforced? | **NO** — BR has 2 bypassing readers; both are app-layer only |
| Do paying customers get what they bought? | **NO** — both systems silently consume one paid slot |
| Is child editing safe? | **NO** — Autos inherits parent data; BR nulls address fields |
| Does merging September fix it? | **Partly** — capacity and identity-guard yes; **both child-edit defects no** |
| Reference implementation | **Autos `autosPublicChildParentVisibility.ts:40-62`** — BR should adopt from it |
