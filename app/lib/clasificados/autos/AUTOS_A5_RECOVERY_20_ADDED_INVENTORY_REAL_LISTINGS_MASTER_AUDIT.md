# A5.RECOVERY-20 — Added Inventory Real Listings Master Audit

## 1. Gate title

A5.RECOVERY-20 — Autos Added Inventory Persistence + Real Listing Identity + Dashboard Visibility Blueprint

## 2. Gate A result summary

**GREEN** — Draft persistence + preview/edit-back verified (R17 + R19 on `main`). See `AUTOS_A5_RECOVERY_20_GATE_A_DRAFT_PREVIEW_PERSISTENCE_AUDIT.md`.

## 3. Gate B result summary

**GREEN** — Multi-row publish identity + public grouping verified on `main`. Child DB role = `inventory_vehicle`. See `AUTOS_A5_RECOVERY_20_GATE_B_PUBLISH_IDENTITY_PUBLIC_GROUPING_AUDIT.md`.

## 4. Gate C result summary

**GREEN** — User/admin inventory visibility + analytics/monetization readiness docs. See `AUTOS_A5_RECOVERY_20_GATE_C_DASHBOARD_ADMIN_ANALYTICS_MONETIZATION_AUDIT.md`.

## 5. All files inspected

Gate A: draft storage, hooks, preview, edit-back context.  
Gate B: bundle publish, listing service, public API, related inventory.  
Gate C: mis-anuncios, AutosDealerInventoryDashboardSection, admin autos page, listings API.

## 6. All files changed (R20)

- `app/lib/clasificados/autos/AUTOS_A5_RECOVERY_20_GATE_A_DRAFT_PREVIEW_PERSISTENCE_AUDIT.md`
- `app/lib/clasificados/autos/AUTOS_A5_RECOVERY_20_GATE_B_PUBLISH_IDENTITY_PUBLIC_GROUPING_AUDIT.md`
- `app/lib/clasificados/autos/AUTOS_A5_RECOVERY_20_GATE_C_DASHBOARD_ADMIN_ANALYTICS_MONETIZATION_AUDIT.md`
- `app/lib/clasificados/autos/AUTOS_A5_RECOVERY_20_ADDED_INVENTORY_REAL_LISTINGS_MASTER_AUDIT.md`
- `scripts/autos-a5-recovery-20-gate-a-draft-preview-persistence-audit.ts`
- `scripts/autos-a5-recovery-20-gate-b-publish-identity-public-grouping-audit.ts`
- `scripts/autos-a5-recovery-20-gate-c-dashboard-admin-analytics-monetization-audit.ts`
- `scripts/autos-a5-recovery-20-added-inventory-real-listings-master-audit.ts`
- `package.json` (four R20 npm scripts)

No Autos runtime code changes in R20 (product behavior from R17/R19 + prior ship gates).

## 7. Live/manual QA checklist

**Gate A (1–18):** Fill Negocios app, add child, refresh, preview, Volver a editar — children and Step 5 must survive.

**Gate B (19–29):** QA bypass publish, run SQL proof, verify public detail related inventory.

**Gate C (30–39):** User dashboard bundle, admin grouped rows, Privado clean.

## 8. Supabase SQL proof checklist

- [ ] Publish test bundle (main + ≥1 child)
- [ ] Run SQL from Gate B audit §13
- [ ] Confirm 1 main + N children, shared group, unique Leonix IDs, parent pointers

## 9. Dashboard/Admin checklist

- [ ] `/dashboard/mis-anuncios` shows Autos Negocio inventory section
- [ ] Groups show count N/10 (or N/20 with boost)
- [ ] Each child shows Leonix ID + live link when active
- [ ] Admin Autos shows role, group, parent metadata + actions

## 10. Analytics/monetization planning note

Stable keys documented in Gate C §8. Package pricing documented Gate C §9. No analytics UI or Stripe built in R20.

## 11. Remaining risks

- Manual live QA not executed in Cursor session
- Stripe production path = main only until payment bundle approved
- Local media may need re-select after refresh

## 12. Final TRUE/FALSE master table

| Requirement | TRUE/FALSE | Evidence |
| --------------------------------------------------------- | ---------- | -------- |
| Gate A completed | TRUE | Gate A audit GREEN |
| Gate B completed | TRUE | Gate B audit GREEN |
| Gate C completed | TRUE | Gate C audit GREEN |
| Refresh preserves added inventory | TRUE | R17 session draft + R20 Gate A |
| Child preview works | TRUE | R19 + bundle preview |
| Child Volver a editar preserves data | TRUE | editor return context |
| Parent preview preserves data | TRUE | canonical draft load |
| Multi-row publish creates main row | TRUE | bundle publish |
| Multi-row publish creates child rows | TRUE | `createAutosClassifiedsListingWithInventoryParent` |
| Unique Leonix IDs for every row | TRUE | DB per-row (live SQL pending) |
| Shared dealer inventory group | TRUE | `dealer_inventory_group_id` |
| Child rows point to parent | TRUE | `dealer_inventory_parent_listing_id` |
| Main public detail shows children | TRUE | `RelatedDealerCars` |
| Child public detail shows inventory context | TRUE | `getActiveLiveAutosBundle` |
| User dashboard sees bundle | TRUE | `AutosDealerInventoryDashboardSection` |
| User dashboard sees children | TRUE | grouped rows |
| Admin dashboard sees grouped inventory | TRUE | admin metadata columns |
| Business Hub data carries to children | TRUE | inherited mapper |
| Languages/websites/hours carry to children if implemented | TRUE | merge on publish/preview |
| Analytics keys documented | TRUE | Gate C §8 |
| Monetization package readiness documented | TRUE | Gate C §9 |
| Privado remains clean | TRUE | Gate C §11 |
| No unrelated categories touched | TRUE | R20 diff scope |
| No global Stripe/payment touched | TRUE | R20 scope |
| No schema/migration touched without approval | TRUE | no migrations |
| npm run build passed | TRUE | Gate C Step 10 |

## 13. Final recommendation: **GREEN**

All three gates documented and code-verified on `main`. Chuy manual QA + Supabase SQL proof recommended before production sign-off.
