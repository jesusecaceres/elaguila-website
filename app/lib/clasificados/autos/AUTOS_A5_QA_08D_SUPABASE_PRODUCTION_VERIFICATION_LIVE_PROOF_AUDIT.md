# A5.QA-08D — Autos Supabase Production Verification + Live Inventory Publish Proof Audit

**Gate type:** Production/staging Supabase verification + live publish proof readiness (no visual polish).

**Platform:** Cursor with Claude Sonnet

---

## 1. Repo/source confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD (gate run) | `342535663fed8b4ae945c0a35fe06a3e42174958` |

---

## 2. Initial git status/diff

**Working tree:** clean at gate start.

Gate deliverables only: this audit, manual Supabase checklist, audit script, `package.json` npm entry.

---

## 3. Autos audits inspected

- `AUTOS_A5_QA_08C_SUPABASE_INVENTORY_BACKING_OUTPUT_PROOF_AUDIT.md`
- `AUTOS_A5_QA_08B_QA_PUBLISH_MULTI_LISTING_RESULTS_AUDIT.md`
- `AUTOS_A5_QA_08P_PRIVADO_CROSS_IMPACT_AUDIT.md`
- `AUTOS_SHARED_IMPACT_POLICY.md`
- `AUTOS_A5_QA_08A2_VEHICLE_ONLY_INVENTORY_DRAWER_AUDIT.md`
- `AUTOS_A5_QA_08A3_FINANCE_IMAGE_UPLOAD_URL_AUDIT.md`
- `AUTOS_A4_0_DEALER_INVENTORY_SQL_CONTRACT_AUDIT.md`

---

## 4. Supabase schema/migration result

| Required backing | Repo support | Migration in repo | Applied/live proof? | Action needed |
|---|---|---|---|---|
| Autos listing table | Yes | `20260409120000_autos_classifieds_listings.sql` | **Not verified live** | Chuy runs checklist §3 |
| Listing ID | Yes | `id uuid PK` | Pending live QA | — |
| Leonix Ad ID | Yes | `20260506150000_leonix_ad_id_all_classifieds.sql` | Pending live QA | — |
| Detail URL/route | Yes | `/clasificados/autos/vehiculo/[id]` (UUID) | Pending live QA | No slug column |
| Owner/seller ID | Yes | `owner_user_id` | Pending live QA | — |
| Dealer inventory group ID | Yes | `20260518124700_autos_dealer_inventory_grouping.sql` | **Not verified live** | Chuy applies if missing |
| Parent listing ID | Yes | `dealer_inventory_parent_listing_id` | Pending live QA | — |
| Inventory role main/additional | Yes | `inventory_role` (`main`, `inventory_vehicle`) | Pending live QA | — |
| Media/gallery per listing | Yes | `listing_payload.mediaImages` | Pending live QA | — |
| Active/pending status | Yes | `status` enum + RLS active policy | Pending live QA | — |

**Supabase CLI:** not linked in this workspace (`supabase link` not configured). **No live DB query executed by this gate.**

---

## 5. Whether migration is needed

**FALSE — no new migration needed.**

Repo already contains backward-compatible, nullable inventory columns. If Supabase project predates A4.0, Chuy applies existing migration file via Dashboard (see manual checklist §2, §15).

---

## 6. Migration applied status

**Unknown — requires manual Supabase verification.**

Evidence that cannot be confirmed without Dashboard access:

- Column existence (`information_schema` query)
- Trigger on `leonix_ad_id`
- Live bundle rows after QA publish

**Action:** Chuy completes `AUTOS_A5_QA_08D_SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md` on staging first.

---

## 7. Manual Supabase checklist result

**Created:** `AUTOS_A5_QA_08D_SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md`

Includes:

- Environment selection (staging vs production)
- Migration file list
- Safe SELECT verification SQL (columns, Leonix, grouping, roles, parent/child)
- Post-publish bundle proof query
- RLS/read-path notes
- Screenshot list for gate close

Also references `scripts/autos-a4-0-dealer-inventory-verification.sql`.

---

## 8. QA publish path result

**PASS (source verified)** — unchanged from QA-08B/08C:

- `AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS=1` / `AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true`
- Blocked when `VERCEL_ENV === production`
- Requires authenticated owner JWT
- No fake Stripe session/payment record
- Stripe path blocks bundle (`bundle_requires_qa_bypass`)
- UI: **Modo QA: pago omitido** / **QA mode: payment skipped**
- Success: **Publicado en modo QA — pago omitido**

---

## 9. Live publish row proof readiness/result

**Readiness: PASS** — code path supports manual test:

1. Main + 2 inventory vehicles in draft
2. QA publish → `publishNegociosBundleAdditionalVehicles`
3. 3 rows in `autos_classifieds_listings`, shared `dealer_inventory_group_id`

**Live result: PENDING** — not executed in this gate (no Supabase credentials / linked CLI). Chuy must run checklist §14 after staging QA publish.

---

## 10. Results page real-data result

**PASS (source)** — `GET /api/clasificados/autos/public/listings` → `listActiveAutosClassifiedsRows()` (Supabase active rows only).

**Live browser proof:** pending Chuy manual QA.

---

## 11. Detail page real-data result

**PASS (source)** — `GET /api/clasificados/autos/public/listings/[id]` → `getActiveLiveAutosBundle`; related pool by `dealer_inventory_group_id`; **Más vehículos de este dealer** / **More vehicles from this dealer**.

**Live browser proof:** pending Chuy manual QA.

---

## 12. Dashboard/admin backing result

**PASS (inspected)** — `AutosDealerInventoryDashboardSection` reads real rows for count/limit/slots/CTAs; no fake counts added.

---

## 13. Privado cross-check result

**Privado checked — no shared impact.** No code changes. No dealer inventory, QA bypass, or related-dealer language in Privado publish.

---

## 14. Analytics readiness / no-fake-metrics result

**PASS** — no analytics implementation added; `AUTOS_INVENTORY_ANALYTICS_EVENTS` documented only; public API does not use localStorage for published listings.

---

## 15. Build/check result

| Check | Result |
|-------|--------|
| `npm run autos:a5-qa-08d-supabase-production-verification-live-proof-audit` | PASS (YELLOW) |
| `npm run autos:a5-qa-08c-supabase-inventory-backing-output-proof-audit` | PASS |
| `npm run autos:a5-qa-08b-qa-publish-multi-listing-results-audit` | PASS |
| `npm run autos:a5-qa-08p-privado-cross-impact-audit` | PASS |
| `npm run autos:a5-qa-08a3-finance-image-upload-url-audit` | PASS |
| `npm run autos:a5-qa-08a2-vehicle-only-inventory-drawer-audit` | PASS |
| `npm run autos:a5-qa-07-application-persistence-inventory-truth-audit` | PASS |
| `npm run autos:enforce-smoke` | PASS |
| `npm run build` | PASS (compiled successfully) |

---

## 16. Remaining risks

- Migration may not be applied on target Supabase project until Chuy runs Dashboard steps
- Live 3-vehicle bundle proof not executed in CI/agent environment
- Bundle publish not atomic — partial child failure possible (documented in 08C)
- Production must never enable QA bypass env vars

---

## 17. Manual QA checklist for Chuy

### Supabase (staging first)

See **`AUTOS_A5_QA_08D_SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md`** — full SQL + screenshots.

### Live publish (after columns confirmed)

- [ ] QA bypass env on staging/preview only
- [ ] Publish main + 2 inventory vehicles
- [ ] Success shows 3/10 + QA label
- [ ] SQL bundle proof: 3 active rows, shared group, distinct Leonix IDs
- [ ] Results: 3 cards; details load; related-dealer section works
- [ ] No owner inventory CTAs on public detail
- [ ] Send screenshots from checklist §13 → upgrade gate to full GREEN after manual proof

---

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | §1 |
| git diff reviewed before editing | TRUE | §2 |
| Autos scope lock respected | TRUE | Gate deliverables only |
| Latest Autos audits inspected | TRUE | §3 |
| Supabase schema/migrations inspected | TRUE | §4 |
| Required inventory fields identified | TRUE | §4 table |
| Migration need determined | TRUE | §5 — no new migration |
| Migration, if created, is minimal and backward-compatible | TRUE | §5 — none created |
| No destructive SQL created | TRUE | Checklist SELECT-only |
| Supabase manual verification checklist created | TRUE | §7 |
| Column verification SQL provided | TRUE | Checklist §3 |
| Inventory row proof SQL provided | TRUE | Checklist §5 |
| Dealer inventory group verification SQL provided | TRUE | Checklist §6 |
| Leonix Ad ID verification SQL provided | TRUE | Checklist §7 |
| Inventory role verification SQL provided | TRUE | Checklist §8 |
| QA publish path inspected | TRUE | §8 |
| QA bypass is protected or blocker documented | TRUE | §8 env + production block |
| QA bypass does not fake Stripe payment | TRUE | §8 |
| Production payment protection remains intact | TRUE | §8 |
| Publish path can create main listing or blocker documented | TRUE | §9 source ready |
| Publish path can create child listings or blocker documented | TRUE | §9 source ready |
| Every published vehicle can have own listing ID | TRUE | uuid PK |
| Every published vehicle can have own Leonix Ad ID | TRUE | trigger migration |
| Every published vehicle can have own detail URL/slug | TRUE | UUID vehiculo route |
| Published vehicles can share dealer inventory group | TRUE | grouping migration |
| Main/additional inventory role supported | TRUE | `main` / `inventory_vehicle` |
| Results page reads real published rows or blocker documented | TRUE | §10 — live proof pending |
| Detail page reads real published rows or blocker documented | TRUE | §11 — live proof pending |
| More vehicles from dealer section uses real group data or blocker documented | TRUE | `getActiveLiveAutosBundle` |
| Public buyer owner-only CTA separation checked | TRUE | §11 / 08P |
| Dashboard/admin backing inspected | TRUE | §12 |
| No fake dashboard counts added | TRUE | §12 |
| No fake analytics added | TRUE | §14 |
| Privado checked for shared impact | TRUE | §13 |
| No dealer-only features added to Privado | TRUE | §13 |
| No global Stripe/payment files touched | TRUE | §2 |
| No unrelated categories touched | TRUE | §2 |
| npm run build passed | TRUE | §15 |

---

## Final recommendation

Final recommendation: **YELLOW** — Repo schema, publish wiring, manual Supabase checklist, and verification SQL are complete. **Live Supabase migration-applied status and 3-row bundle publish proof require Chuy manual execution** on staging (checklist §14). Upgrade to full GREEN after Chuy confirms SQL + screenshots.
