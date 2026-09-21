# 02 — GLOBALIZATION COMMIT LINEAGE, 2026-07-14 → CURRENT
Audit 2026-09-09 · READ-ONLY · All counts from `git log --all --since="2026-07-14"`.

---

## 1. VOLUME

```
git log --all --since="2026-07-14" --date=short --pretty=format:"%h|%ad|%s"
```

| Period | Commits |
|---|---|
| 2026-07 (from the 14th) | 113 |
| 2026-08 | 414 |
| 2026-09 (through the 9th) | 88 |
| **TOTAL, ALL REFS** | **614** |

**Reverts in window: 0.** A single keyword match (`70e68ff6` "fix(ofertas): reconcile owner lifecycle
with command center") is a false positive — its body states "No command-center abstractions were
reverted or duplicated." No work was undone by revert in this period.

---

## 2. REF DRIFT DURING THE AUDIT

`origin/main` moved **twice** while this audit ran — both times by local push, not fetch
(`.git/FETCH_HEAD` is dated 2026-09-03):

| Observation | SHA | Subject |
|---|---|---|
| Audit brief pinned | `2dcf5c70` | feat(classifieds): complete landing page image system |
| Mid-audit | `056a1486` | Release Business Concierge systemic repair |
| Current | `a0a47839` | feat(classifieds): install final owner-approved landing imagery |

**Consequence:** two bodies of work moved from "unintegrated" to "integrated" during the audit —
the Business Concierge actor-safety repair (incl. `94bd78c2` "fix(admin): sign the bootstrap session
token") and the 113-file landing-imagery commit. Doc `01 §5 R4` is superseded: `a0a47839` is now in
`origin/main`.

Containment re-checked at each move: the drift intersects the globalization audit surface
(`listingPlans`, `packageEntitlement`, `clasificados/publicar`, `revenuePricingMatrix`, analytics,
savedSearch) in **0 files**. All prior findings remain valid.

---

## 3. SEMANTIC FAMILY BUCKETS

Commits may match multiple families (subject regex, case-insensitive).

| Family | Count | Dominant work |
|---|---|---|
| F01 globalization / global / foundation / lifecycle / canonical | **149** | The Sept Wave 1–4 series (`e3956df8`, `bd2ee01e`, `3eacdec9`, `9ae1a0f2`, `67919479`, `733408dd`) |
| F18 empleos / ofertas / community / eventos / clases / varios | **109** | Community classifieds globalization — largest single bucket |
| F08 contact / correo / email / phone / sms / whatsapp / share / save / like / report / lead | **73** | Sept 1 "adopt Save/Like/Share/Report" wave |
| F14 verification / placement / ranking / republish / preview / draft / publish | **70** | Wave 4 P0 dashboard-edit-destroys-published-listing fixes |
| F12 reviews / google / yelp / trust / endorsement | **65** | Trust / preview / checkout wording |
| F16 bienes / real estate / rentas | **64** | Wave 4 reverse-mapper fixes (`16f45c77`, `67919479`, `733408dd`) |
| F15 autos / dealer / inventory / parent / child | **56** | Autos Dealer globalization (`b32ff613`, `db688c04`) |
| F02 identity / ownership / owner | **55** | Owner QA closeouts (noticias, servicios, business-concierge) |
| F09 media / gallery / image / photo / video / flyer / pdf / coupon | **48** | Classifieds landing image system (`a0a47839`, `2dcf5c70`, `ff6f935b`) |
| F17 servicios / restaurantes / comida | **37** | Servicios P0 integration pass (`69818522`, `80d4dbcb`) |
| F13 stripe / checkout / payment / revenue / entitlement / billing | **36** | Ofertas checkout rebuild, revenue lifecycle (`8b867eaf`) |
| F03 dashboard / command center / workspace | **35** | Ofertas + Owner Command Center rebuild (`a8dfed7d`, `4518a5e6`) |
| F05 analytics / engagement / events / tracking | **32** | Analytics hardening (`605dd9ed`, `2f1db59d`) |
| F11 privacy / location / map / address / verified | **26** | G23 address verifier adoption (`3c23e875`, `88d844e1`) |
| F06 saved search / search / results / filter / related | **21** | Saved Search 02/06 series (`1de8cdaf`, `1000d3db`) |
| F10 translation / i18n / es-en / seo / schema | **21** | Build 04 lifecycle + translation + SEO (`d21efda3`, `6766c0bf`) |
| F19 newsletter / pwa / mobile / a11y / security / rls | **18** | Newsletter v2, PWA shell, a11y audit (`cbc4cec1`) |
| F04 admin / admin os | **14** | LEO Admin OS (`94bd78c2`, `9e7e3d9a`) |
| F07 business hub / negocios / connection hub | **10** | Global Business Hub OS (`4aeb0f5a`, `11ca9e39`) |

**Reading:** F07 at 10 commits is the smallest bucket — consistent with the independently-proven
finding that the shared Business Hub engine was never actually built (doc `17` GAP-015). F04 at 14
is also thin relative to the size of the Admin surface (446 files).

---

## 4. THE MAIN ↔ SEPT RECONCILIATION SURFACE

| Measure | Value |
|---|---|
| Merge base | `7878d856` (2026-09-08) |
| Sept-only commits | **51** |
| Main-only commits | **62** |
| Files touched by Sept-only | 264 |
| Files touched by main-only | 436 |
| **INTERSECTION** | **0 files** |

Verified two independent ways (net `git diff --name-only` intersection, and per-commit filename
union intersection). Both return zero.

The 62 main-only commits are a single self-contained **LEO Admin / Executive-Intelligence +
Business-Concierge** programme (`feat(leo)`, `LEO-13A`…`LEO-19A`, Gmail/Google workspace integration,
executive reporting, admin bootstrap) that never touches the business-listing surfaces the Sept
branch modified. The Sept branch's three `Merge remote-tracking branch 'origin/main'` commits
(`2d1a9337`, `85cc86f7`, `ac0f8a08`) already absorbed the shared ancestry.

**The merge is mechanically clean.**

---

## 5. THE 51 SEPT-ONLY COMMITS (full list, newest first)

```
e3956df8 docs(globalization): record Wave 3 G09/G10 and G26 fixes as done
bd2ee01e fix(globalization): Wave 3 G09/G10 — surface silently-dropped unpersistable media
3eacdec9 fix(globalization): Wave 3 G26 — close self-engagement gaps (save/like/report own listing)
ed0c5582 docs(globalization): record Wave 3 audit (G09-G12, G25-G30) + G12 fix
9ae1a0f2 fix(globalization): Wave 3 G12 — stop silently truncating international phone numbers
16f45c77 docs(globalization): record Wave 4 P0 completion (Bienes/Rentas Negocio reverse mappers)
67919479 fix(globalization): Wave 4 P0 — stop Rentas Negocio dashboard-edit destroying published listings
733408dd fix(globalization): Wave 4 P0 — stop Bienes Negocio dashboard-edit destroying published listings
beb5ea77 docs(globalization): record Wave 2 findings + expand Wave 4 carry-forward scope
652e2556 fix(globalization): Wave 2 — repair 6 real owner-critical global defects
6c9ce20f docs(globalization): record Wave 1 G23 adoption + create master matrix
3c23e875 feat(globalization): adopt G23 address verifier across 5 commercial categories
69818522 docs(globalization): record Servicios P0 integration pass + honest scope statement
80d4dbcb fix(servicios): repair 3 real owner-visible P0 gaps found by rigorous adoption trace
adc23e6e docs(globalization): record Staging privilege fix + commercial term engine audit
14a78d46 fix(globalization): grant service_role DML on all pre-Concierge Staging tables
2d1a9337 Merge remote-tracking branch 'origin/main'
db688c04 feat(globalization): complete business reputation adoption — Autos Dealer + Rentas Negocio
85cc86f7 Merge remote-tracking branch 'origin/main'
05761912 docs(globalization): G30 Business Hub final integrity check — resolved to TRUE_SOURCE
88d844e1 fix(globalization): red burn-down — G23 address verifier, G29 related listings, ledger
03d65ea6 docs(globalization): Gate 6C.3 runtime proof + final closeout ledger
ac0f8a08 Merge remote-tracking branch 'origin/main'
10618f41 fix(capacity): exclude commercial parents from inventory limits
b3473f89 fix(globalization): reconcile autos staging schema and ad identity
5ddf6f79 fix(globalization): harden lifecycle visibility truth
605dd9ed fix(globalization): harden analytics and capability truth
651abd4e fix(globalization): protect child listing identity integrity
2f1db59d fix(globalization): close targeted analytics publish and whatsapp gaps
02ae19cc fix(ofertas): reconcile staging runtime schema
18d18f02 merge: reconcile globalization closeout with main
21b80981 feat: complete business profile globalization adoption
245a70f1 feat: complete community classifieds globalization adoption
13b0d172 feat: complete Empleos and Ofertas globalization adoption
b32ff613 feat: complete Autos globalization adoption
40e093ac merge: bring in autos-dealership before Family-3 globalization sweep
da25bc92 fix: preserve Bienes drafts and edit hydration
4f676ef8 feat: finish Bienes and Rentas globalization adoption
5e6303d2 fix(bienes-rentas): WhatsApp international bug + Like button on generic anuncio page
433c12ad fix: reconcile globalization adoption blockers
5c79308e fix: close shared globalization adoption blockers
0e2f9b17 fix: close residual WhatsApp international-digit gap; consolidate Report on anuncio page
f67ee268 feat: adopt Recently Viewed + Report on Rentas; reclassify Bienes Raices cells
b9a9f3f7 feat: adopt shared Admin monetization summary on Servicios
50d1cd40 feat: adopt Save/Like/Share on Servicios and Comida Local
14c1e9b5 feat: adopt Recently Viewed + Report on Servicios/Restaurantes/Comida Local
8b867eaf fix: close global revenue lifecycle gaps
a1a0aaa9 fix: reconcile global reputation and trust
cddc34fa fix: persist Ofertas address privacy
68d45c6c fix: adopt shared address privacy contract (Servicios)
c6519f30 fix: close shared globalization primitive gaps
```

### 5.1 WHAT MAIN LOSES BY NOT MERGING — proven, per commit
| Sept SHA | What production lacks today |
|---|---|
| `733408dd`, `67919479`, `16f45c77` | **P0** Bienes/Rentas Negocio dashboard edit destroys published listings |
| `8b867eaf` | **P0** Comida Local `LANE_SUSPENSION` — non-payment never unpublishes a $129/mo listing |
| (Sept file) `activePaidEditCheckoutOwnership.ts` | **P1** anti-double-charge guard for autos_privado / br_fsbo / empleos_job_post |
| `cddc34fa` + migration `20260901120000` | **P1** Ofertas exact street address + derived directions leak publicly |
| `3eacdec9` | **P1** self-engagement: Rentas self-save/self-like, self-report via both implementations |
| `9ae1a0f2` | **P1** international phone numbers silently truncated |
| `bd2ee01e` | **P1** silently-dropped unpersistable media is not surfaced |
| `3c23e875`, `88d844e1` | G23 address verifier adoption across 5 commercial categories; G29 related listings |
| `db688c04`, `a1a0aaa9` | Business reputation adoption — Autos Dealer + Rentas Negocio |
| `10618f41` | Commercial parents excluded from inventory capacity limits |
| `651abd4e` | Child listing identity integrity protection |
| `14a78d46` | `service_role` DML grants on pre-Concierge Staging tables |
| `605dd9ed`, `2f1db59d` | Analytics/capability truth hardening; WhatsApp + publish analytics gaps |

---

## 6. THE 132 COMMITS UNREACHABLE FROM `origin/main`

`git log --all --since="2026-07-14" --pretty=… --not origin/main` → **132**, across 11 branches.
Each maps 1:1 to exactly one branch (plus its `origin/*` mirror where pushed) — verified with
`git branch -a --contains`; no cross-contamination.

| Branch | Commits | Pushed? | Nature |
|---|---|---|---|
| `fix/globalization-final-closeout-2026-09` | 50–51 | YES | The Wave 1–4 programme (§5) |
| `fix/br-negocio-inventory-hub-media-hydration-2026-08-27` | 32 | YES | BR/Rentas feature + data-loss fixes (§7) |
| `feature/digital-contact-platform` | 5–6 | YES | Digital Contact / Executive Hub v1, 59 files |
| `globalization-release-reconcile-2026-08-14` | 5 | YES | Revenue OS free Viajes/Cupones catalog |
| `fix/business-applications-final-polish-2026-08` | 4 | YES | 3 unique + superseded twin `a6ab8410` |
| `integration/leo-final-closeout-2026-08` | 3 | **NO** | LEO connected actions + **uncommitted migration** |
| `autos-dealership-before-main-sync` | 2 | **NO** | Dealership preview, dealer structured address |
| `autos-location-readiness-micro-patches` | 2 | YES | Privado/dealer location defaults |
| `autos-privados-preview` | 2 | YES | Package F2 launch security/SEO, autos JSON-LD |
| `integration/leo-executive-operating-intelligence-2026-08` | 2–3 | YES | LEO neural voice, admin nav registry |
| `integration/viajes-launch-qa-2026-08` | 1 | **NO** | Viajes publisher public experience |

Plus nine `global-*` feeder branches (2026-08-17/19) whose work is *probably* captured downstream —
**not proven** (doc `01 §5 R11`). **EVIDENCE GAP — do not delete.**

---

## 7. THE THIRD LINE OF WORK — `fix/br-negocio-inventory-hub-media-hydration-2026-08-27`

32 commits, 92 files, merge-base `03584cc5` (2026-08-27), **in neither main nor Sept**.
Contains data-loss-class fixes: `b3d85dc1` harden draft-media hydration against reload data loss ·
`5d3f27cf` preserve inherited parent hub in inventory child · `42d68aa8` wire multi-video + custom
highlights through publish to the live listing · `2d0f63cd` HOA/Open House to published Privado ·
`0d80e891` restore production build (BR results static-prerender opt-out) · `8d14de69` BR `tel:` not
E.164 · `522b97f8` streamed Suspense reveal never fires with `lang` param · `629c5a46` adopt global
application leave guard.

**Conflict surface with the Sept seal: 20 files** — including the exact Wave-4 P0 reverse-mapper
files (`mapAgenteResidencialFormStateToNegocioForPublish.ts`, `rentasDashboardEditHydration.ts`).
Conflict surface with the 62 main-only commits: **0 files**.
**Merge order is therefore load-bearing** — see doc `22`.

---

## 8. PROVENANCE CLASSIFICATION SUMMARY

| Class | Instances |
|---|---|
| HISTORICALLY_BUILT_CURRENTLY_PRESENT | Bulk of the 614 (Builds 03/05 `390b939c`, `6b155cf3` both in main and Sept) |
| **NEWER_GLOBALIZATION_IMPLEMENTATION — PENDING MAIN INTEGRATION** | **51 commits** (§5) |
| **OTHER_BRANCH_HAS_BEST_IMPLEMENTATION** | 32 (BR branch) + 5 (revenue reconcile) + 6 (digital contact) + 4 (business apps) + 6 (autos) |
| **LOCAL_ONLY_IMPLEMENTATION** | 3 branches never pushed: leo-final, viajes-launch-qa, autos-dealership-before-main-sync |
| HISTORICALLY_BUILT_SUPERSEDED | `a6ab8410` (twin of `cbad30f4`) |
| HISTORICALLY_BUILT_REGRESSED | None proven by revert; regressions here are **non-integration**, not undo |
| STALE_DOCUMENT | `categoryRouteRegistry.ts:1086-1087`; Business Hub "TRUE_SOURCE" claim in `05761912`; admin `NO_WRITE_ROUTE_PIPELINES` comida-local declaration; 4 verifier scripts asserting orphaned component names |
| HISTORICAL_CLAIM_NOT_PROVABLE | The nine `global-*` feeder branches |

**Note on `05761912`** — "G30 Business Hub final integrity check — resolved to TRUE_SOURCE" is
contradicted by current source: `buildSharedConnectionHubContact` has **zero app importers**
(doc `17` GAP-015). Classified **STALE_DOCUMENT**; current source wins per the audit's source-authority
order.

---

**SOURCE / MAIN / REFS / DATABASE / PRODUCTION MODIFIED: NO**
