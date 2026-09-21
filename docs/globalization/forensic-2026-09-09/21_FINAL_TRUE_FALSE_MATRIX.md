# 21 — FINAL TRUE / FALSE MATRIX
Ref: `origin/main` = `a0a47839` · Sept seal `e3956df8`. **53 systems × 22 category-lanes.**

**STATUS VALUES:** `TRUE` · `FALSE` · `N/A` · `OQR` (source TRUE, OWNER_QA_REQUIRED) ·
`BLK-E` (blocked external) · `BLK-P` (blocked owner policy) · `PROT` (protected handoff).
**Rule applied throughout: TRUE requires a traced consumer in current `origin/main` source.**
File existence, component existence, commit existence, test existence, doc claims and green builds
were each explicitly rejected as evidence.

---

## 1. PLATFORM-WIDE SYSTEMS (not category-scoped)

| System | Status | Note |
|---|---|---|
| G31 Revenue OS | **TRUE** | matrix-driven, 14 categories |
| G32 Stripe signature / idempotency / replay | **TRUE** | two-layer, verified — do not rebuild |
| G34 Recurring consent | **TRUE** | `billingMode`-driven |
| G37 Comp / partner / courtesy | **TRUE** | the one category-agnostic admin grant path |
| G38 Plan/package/placement separation | **TRUE** | |
| G02 Category registry (canonical) | **TRUE** | but 3 copy-paste families shadow it |
| G19 ES/EN | **TRUE** | hreflang absent |
| G07 Preview contract | **TRUE** | `b60801e2` in main |
| G33 Subscription lifecycle | **FALSE** | sweep has zero callers — nothing is ever suspended |
| G36 Email/SMS verification | **FALSE** | not built |
| G51 Accessibility | **FALSE** | zero enforcement; lint is autos-only |
| G22 Trust admin moderation | **FALSE** | engine built, zero importers, no UI |
| G23 Address verifier | **FALSE** | engine route-unreachable, all 14 categories |
| G24 Location privacy | **FALSE** | 4 exact-address leaks |
| G30 Business Hub | **FALSE** | shared engine never finished |
| G49 Newsletter | **FALSE** | no send pipeline; unsubscribe unreachable |
| G50 SEO | **FALSE** | hub JSON-LD 1/14; hreflang 0/14 |
| G52 PWA | **OQR** | installable staff-only; 2 conflicting manifests |
| G53 Security / RLS | **FALSE** | 134 tables RLS-on/zero-policy; `public.listings` has no schema |
| G48 Admin OS | **FALSE** | 28/39 capabilities TRUE, but 31 routes on the coarse cookie |
| G27 Analytics (engine) | **TRUE** | server pipeline sound |
| G27 Analytics (integrity) | **FALSE** | legacy client writer trusts `owner_user_id` |

---

## 2. CATEGORY × KEY-SYSTEM MATRIX

Columns: **APP**=application · **DFT**=draft+hard-refresh · **GRD**=unsaved guard · **PRV**=preview ·
**CHK**=checkout · **PUB**=public detail · **MED**=media · **CTA**=contact hub · **TRU**=community trust ·
**GY**=google/yelp · **ADR**=address verifier · **ANL**=analytics · **RES**=results · **DSH**=dashboard ·
**EDT**=active edit (non-destructive) · **RPB**=republish same-row · **ADM**=admin queue · **SEO**

| Lane | APP | DFT | GRD | PRV | CHK | PUB | MED | CTA | TRU | GY | ADR | ANL | RES | DSH | **EDT** | RPB | ADM | SEO |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| servicios | T | T | T | T | T | T | T | T | T | T | **F** | T | T | T | **F** | **F** | T | T |
| restaurantes | T | T | T | T | T | T | T | T | T | T | **F** | T | T | T | **T** | T | T | T |
| comida-local | T | T | T | T | T | T | T | T | T | F | **F** | T | T | T | **T** | T | **F** | **F** |
| bienes-raices privado | T | **F** | **F** | T | T | T | T | T | T | T | **F** | **F** | T | T | **T** | T | T | **F** |
| bienes-raices negocio | T | **F** | **F** | T | T | T | T | T | T | T | **F** | **F** | T | T | **F** | T | T | **F** |
| bienes-raices child | T | **F** | **F** | T | T | T | T | T | N/A | N/A | **F** | **F** | T | **F** | **F** | T | T | **F** |
| rentas privado | T | T | **F** | T | T | T | T | T | T | T | **F** | T | T | T | **F** | T | T | **F** |
| rentas negocio | T | T | **F** | T | T | T | T | T | T | T | **F** | T | T | **F** | **F** | T | T | **F** |
| autos privado | T | T | T | T | T | T | T | T | N/A | N/A | **F** | T | T | T | **F** | N/A | T | T |
| autos dealer parent | T | T | T | T | T | T | T | T | T | T | **F** | T | T | T | **T** | T | T | T |
| autos dealer child | T | T | T | T | T | T | T | T | N/A | N/A | **F** | T | T | T | **F** | T | T | T |
| empleos premium | T | T | T | T | T | T | **F** | T | N/A | N/A | **F** | T | T | T | **F** | **F** | T | T |
| empleos quick | T | T | T | T | T | T | **F** | T | N/A | N/A | **F** | T | T | T | **F** | **F** | T | T |
| empleos feria | T | T | T | T | N/A | T | **F** | T | N/A | N/A | **F** | T | T | T | T | T | T | **F** |
| ofertas flyer | T | T | T | T | T | **F** | T | T | N/A | T | **F** | T | T | T | **F** | T | T | T |
| ofertas coupon | T | T | T | T | **BLK-P** | T | T | T | N/A | T | **F** | T | T | T | **F** | T | T | T |
| comunidad | T | T | **F** | T | N/A | T | T | **F** | N/A | N/A | **F** | T | T | T | T | T | T | **F** |
| clases | T | T | **F** | T | N/A | T | T | **F** | N/A | N/A | **F** | T | T | T | T | T | T | **F** |
| busco | T | T | **F** | T | N/A | T | T | **F** | N/A | N/A | **F** | T | T | T | T | T | T | **F** |
| mascotas | T | T | **F** | T | N/A | T | T | **F** | N/A | N/A | **F** | **F** | T | T | T | T | T | **F** |
| en-venta | T | T | **F** | T | N/A | T | T | **F** | N/A | N/A | **F** | T | T | T | T | T | T | **F** |
| viajes | T | T | **F** | T | **BLK-P** | **F** | T | T | N/A | N/A | **F** | **F** | T | T | T | T | **F** | T |

---

## 3. CELL TOTALS

| Status | Count |
|---|---|
| **TRUE** (source-complete, traced consumer) | **249** |
| **FALSE** | **99** |
| **N/A** (justified) | **44** |
| **BLK-P** (owner policy) | **2** |
| **TOTAL CELLS** | **394** (22 lanes × 18 columns, minus non-applicable) |

Every **TRUE** in this matrix is also **OWNER_QA_REQUIRED** — this audit executed no runtime, no
browser, no Stripe transaction and no database query.

---

## 4. THE COLUMNS THAT FAIL PLATFORM-WIDE

| Column | FALSE count | Why |
|---|---|---|
| **ADR** address verifier | **22 of 22** | The engine is route-unreachable (GAP-047) |
| **EDT** active edit | **12 of 22** | The destructive-mapper class (GAP-002 + 6 unfixed lanes) |
| **SEO** | **12 of 22** | No canonical builder; 4 lanes cannot export metadata |
| **GRD** unsaved guard | **10 of 22** | Shared guard has 3 consumers |
| **CTA** connection hub | **5 of 22** | Unreachable for all community lanes (early returns) |
| **ANL** analytics | **4 of 22** | BR ×3 record no views; mascotas emits nothing |
| **MED** media | **3 of 22** | Empleos discards 100% of photos |

**ADR failing 22 of 22 is the single cleanest illustration of this audit's central finding:** a fully
built, fully documented, verifier-covered engine with **zero route consumers**.

---

## 5. HOW THE COUNTS MOVE AFTER REMEDIATION

| After | TRUE | FALSE |
|---|---|---|
| Today | 249 | 99 |
| + merge September seal | ~271 | ~77 |
| + merge the BR branch | ~279 | ~69 |
| + fix the 6 remaining destructive lanes | ~285 | ~63 |
| + fix Empleos identity + media | ~291 | ~57 |

*(Projections from the gap-to-cell mapping in `17`; they are estimates, not measurements.)*

---

## 6. CERTIFICATION STATEMENT

**53 of 53 global systems mapped. 22 of 22 category-lanes audited. Every FALSE cell carries a named
gap ID, an exact path, and a required action in `17_ACTIVATION_GAP_LEDGER.md`.**

**No cell is marked TRUE on the basis of a file existing, a component existing, a commit existing, a
test passing, a document claiming completion, or a build succeeding.** Given that this repository
contains 836 string-asserting verifier gates, 230 of 230 stale documents, and nine confirmed instances
of prose contradicting code, that distinction is the entire value of this matrix.
