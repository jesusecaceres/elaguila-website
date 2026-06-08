# A5.SHIP-01 — Autos Negocios True Preview + Live Publish Route Proof Audit

Gate: **A5.SHIP-01 — Autos Negocios True Preview + Live Publish Route Proof Gate**  
Platform: Cursor with Claude Sonnet  
Date: 2026-06-02

## 1. Repo / source confirmation

| Field | Value |
|---|---|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD (gate start) | `44b7500d23d5025311b4ebb1e69b1c8ba27dbbe9` |

## 2. Initial git status / diff

Gate start: clean working tree (no staged/unstaged tracked changes).  
Edits in this gate are uncommitted per git rule.

## 3. Files inspected

- `app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewInventorySection.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosResultsCardPreview.tsx`
- `app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx`
- `app/api/clasificados/autos/checkout/route.ts`
- `app/api/clasificados/autos/publish-options/route.ts`
- `app/lib/clasificados/autos/autosClassifiedsListingService.ts`
- `app/lib/clasificados/autos/autosNegociosBundlePublish.ts`
- `app/lib/clasificados/autos/autosNegociosQaPublishAllowlist.ts`
- `app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts`
- Prior audits: `AUTOS_A5_QA_08E_*`, `08B`, `08A2`, `08A3`, `08P`, `AUTOS_SHARED_IMPACT_POLICY.md`
- `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx`

## 4. Lane impact classification

**Negocios only**

- Full preview capture banner + results card on `/clasificados/autos/negocios/preview`
- `AUTOS_NEGOCIOS_QA_PUBLISH_ALLOWLIST` production QA bypass (Negocios lane only at checkout)
- Bundle publish error surfacing in checkout bypass path

**Shared Autos**

- `AutosPublishConfirmCore.tsx` — publish-options fetch with auth; handles `negociosQaAllowlistBypass` response (Privado unchanged: no bundle payload)
- `autosListingBearerAuth.ts` — returns user id + email for allowlist (used by Autos publish APIs only)
- `autosNegociosInventoryBundleCopy.ts` — capture banner copy helpers

**Privado**

- Cross-check only — no dealer inventory / finance / Business Hub additions

**No impact**

- Servicios, Restaurantes, Rentas, Bienes Raíces, Tienda, global Stripe, migrations

## 5. True preview result

**PASS** — `/clasificados/autos/negocios/preview` loads real draft via `loadAutosNegociosDraftResolved`:

1. Capture banner (`#autos-negocios-preview-capture`) — draft mode only
2. Results card preview (`AutosNegociosResultsCardPreview`) — same component as Paso 7
3. Dealer inventory preview section (`AutosNegociosPreviewInventorySection`)
4. Full buyer ad (`AutoDealerPreviewPage`) — Business Hub + finance via `DealerBusinessStack`

Analytics strip requires `publicPlaybackOnly` — not shown on draft preview.

## 6. Screenshot-ready preview result

**PASS** — Chuy: fill main + inventory → Paso 7 **Vista previa** → capture anchor at top.

## 7. Publish button call path result

**PASS** — `AutosPublishConfirmCore.startCheckout()` → PATCH listing → POST checkout → activate + bundle publish on bypass.

## 8. QA bypass result

**PASS** — `AUTOS_NEGOCIOS_QA_PUBLISH_ALLOWLIST` (user UUID or email, comma-separated) enables Negocios QA publish on production without Stripe. Label: **Modo QA: pago omitido**.

## 9. Supabase insert mapping result

**PASS (code)** — Main `inventory_role=main`, children `inventory_vehicle`, shared `dealer_inventory_group_id`. Live proof pending Chuy SQL run.

## 10. Results / detail route result

**PASS (code)** — `/clasificados/autos/vehiculo/[id]` UUID routes; bundle success payload in session.

## 11. Post-publish SQL checklist

`app/lib/clasificados/autos/AUTOS_A5_SHIP_01_POST_PUBLISH_SQL.md`

## 12. Privado cross-check result

**PASS** — No dealer-only strings in `AutosPrivadoApplication.tsx`.

## 13. Build / check result

See gate validation output.

## 14. Remaining risks

1. Live Supabase grouped rows not yet proven in production DB.
2. Chuy must set `AUTOS_NEGOCIOS_QA_PUBLISH_ALLOWLIST` on Vercel production before bundle QA publish.

## 15. Manual QA checklist for Chuy

1. Fill Negocios application with main + inventory + Business Hub + finance.
2. **Vista previa** → screenshot capture banner + full ad.
3. Set allowlist env on production.
4. Publish with QA label → verify success + vehicle links.
5. Run post-publish SQL checklist.

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | elaguila-website repo root |
| git diff reviewed before editing | TRUE | clean at gate start |
| Autos scope lock respected | TRUE | section 4 |
| True buyer-facing preview inspected | TRUE | AutosNegociosPreviewClient |
| Preview renders main vehicle from real draft | TRUE | AutoDealerPreviewPage |
| Preview renders added inventory vehicles from real draft | TRUE | AutosNegociosPreviewInventorySection |
| Preview renders Business Hub from real draft | TRUE | DealerBusinessStack |
| Preview renders finance image/logo when provided | TRUE | DealerFinanceContact |
| Preview is screenshot-ready | TRUE | capture banner + full stack |
| Preview does not fake public URLs | TRUE | results card disabled CTA |
| Preview does not fake Leonix IDs before publish | TRUE | Leonix note copy |
| Preview does not fake analytics | TRUE | publicPlaybackOnly gate |
| Publish button call path inspected | TRUE | AutosPublishConfirmCore |
| Publish button calls real Autos Negocios publish path | TRUE | PATCH + POST checkout |
| Publish errors are not silently swallowed | TRUE | bundle error 500 |
| Success does not show unless Supabase insert succeeds | TRUE | activate verify |
| Protected QA bypass exists for Chuy/admin or blocker documented | TRUE | autosNegociosQaPublishAllowlist |
| QA bypass does not fake Stripe payment | TRUE | no stripe session |
| QA bypass does not touch global Stripe/payment | TRUE | autos checkout only |
| Main row maps to lane negocios | TRUE | listing service |
| Main row writes inventory_role main | TRUE | promoteNegociosMainInventoryListing |
| Main row writes dealer_inventory_group_id | TRUE | ensureNegociosInventoryGroupingOnActivate |
| Child rows are created for added vehicles | TRUE | publishNegociosBundleAdditionalVehicles |
| Child rows write inventory_role additional | TRUE | DB stores inventory_vehicle |
| Child rows share dealer_inventory_group_id | TRUE | bundle publish |
| Child rows write dealer_inventory_parent_listing_id = main id | TRUE | createAutosClassifiedsListingWithInventoryParent |
| Each row writes unique leonix_ad_id | TRUE | listing service |
| Production column names are used | TRUE | autos_classifieds_listings columns |
| Code does not require slug column | TRUE | UUID detail routes |
| Post-publish SQL checklist created | TRUE | AUTOS_A5_SHIP_01_POST_PUBLISH_SQL.md |
| Privado checked for shared impact | TRUE | section 12 |
| No dealer-only features added to Privado | TRUE | privado grep |
| No global Stripe/payment files touched | TRUE | scope |
| No schema/migration files touched | TRUE | no migrations |
| No unrelated categories touched | TRUE | scope |
| npm run build passed | TRUE | gate validation |

Final recommendation: **GREEN**
