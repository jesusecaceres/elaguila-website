# BR-INV-FIX-01A-REVISED — Hub Card + Step 8 Audit

**Gate:** BR-INV-FIX-01A-REVISED  
**Title:** Main Agent Hub Card Polish + Data-Driven Step 8, With BR/Rentas Regression Audit

## 1. Gate name

BR-INV-FIX-01A-REVISED

## 2. Files inspected

- `BR_INV_D_INVENTORY_PREVIEW_CARDS_AUDIT.md`, `BR_INV_E_FAST_REAL_PUBLISH_QUEUE_AUDIT.md`, `MEDIA_DESC_HUB_03_AUDIT.md`
- `agente-individual/preview/AgenteIndividualResidencialPreviewPage.tsx`
- `agente-individual/preview/BrAgenteResContactSidebar.tsx` (new)
- `agente-individual/lib/agenteResidencialPreviewFormat.ts`
- `agente-individual/lib/agenteResidencialDetectedActions.ts` (new)
- `agente-individual/sections/steps04-09.tsx` (Step 7/8)
- `agente-individual/schema/agenteIndividualResidencialFormState.ts`
- `bienes-raices/preview/BienesRaicesNegocioPreviewView.tsx` (regression read)
- BR Privado / Rentas preview paths (regression read only)

## 3. Files changed

- `agente-individual/schema/agenteIndividualResidencialFormState.ts` — LinkedIn, Snapchat, Google/Yelp URL fields
- `agente-individual/lib/agenteResidencialPreviewFormat.ts` — data-driven `buildContactModel`, `buildMainAgentBusinessHub`
- `agente-individual/lib/agenteResidencialDetectedActions.ts` (new)
- `agente-individual/preview/BrAgenteResContactSidebar.tsx` (new)
- `agente-individual/preview/AgenteIndividualResidencialPreviewPage.tsx` — sidebar + financing layout
- `agente-individual/sections/steps04-09.tsx` — Step 7 fields, Step 8 detected summary
- `agente-individual/application/brAgenteResidencialCopy.es.ts` / `.en.ts`
- `bienes-raices/BR_INV_FIX_01A_REVISED_HUB_CARD_STEP8_AUDIT.md`
- `scripts/br-inv-fix-01a-revised-hub-card-step8-audit.ts` (optional)
- `package.json` — audit script only

## 4. Screenshot blockers addressed

| Blocker | Fix |
|--------|-----|
| Main agent contact in loose block | Contact inside labeled Main Agent card |
| Duplicate social rows | Single hub row inside main agent card; removed separate strip |
| Missing Google/Yelp | New URL fields + review cards when valid |
| Incomplete Business Hub | Adaptive socials + reviews + website in main card |
| Step 8 checkbox wall | Read-only detected actions summary |
| Financing layout messy | Horizontal stack (photo left, info right) on sm+ |
| Card hierarchy confusing | Office → Main agent → Second agent → Quick actions |

## 5. Business Hub blueprint usage

Data-driven rendering: show icon/card only when valid URL exists; empty/invalid hides; no raw URL labels; no fake reviews.

## 6. Leonix brand system usage

Cream/ivory card surfaces, soft gold borders/labels, charcoal text, burgundy primary call CTA, platform colors on social icons, WhatsApp green only on WhatsApp button. No global theme changes; existing sidebar canvas preserved.

## 7. Card organization

Existing aside canvas kept. Internal hierarchy: Office/Broker → Main agent (emphasis) → Second agent (limited) → Quick actions.

## 8. Main agent adaptive Business Hub

Facebook, Instagram, TikTok, YouTube, LinkedIn, X, Snapchat, Google reviews, Yelp reviews, website — each renders only when valid.

## 9. Second agent limitations

Photo, name, title, license, phone, email, limited socials only. No Google/Yelp, no website hub, no WhatsApp hub.

## 10. Financing limitations and layout

Name, title, license, phone, email, website, disclaimer. No socials/reviews/hub. Layout: image left / info stacked right (mobile stacks).

## 11. Step 8 data-driven behavior

`detectAgenteResBuyerActions` derives visible CTAs from valid fields. Step 8 shows read-only detected list (ES/EN). Legacy `permitir*` fields retained in state for old drafts but no longer gate visibility.

## 12. Duplicate row cleanup

Removed loose primary contact strip and duplicate main-agent social row from preview sidebar.

## 13. Preview/public parity

Preview uses `BrAgenteResContactSidebar` + data-driven `buildContactModel`. Published live detail for Agente listings still flows through existing Negocio publish contract; new social/review fields are form/preview-first until publish mapper extends (documented risk).

## 14. Regression audit

| Lane | Touched? | Result |
|------|----------|--------|
| BR Privado regression audit | FALSE | Simple seller card unchanged |
| Rentas Privado regression audit | FALSE | Rental inquiry card unchanged |
| Rentas Negocio regression audit | FALSE | Property manager card unchanged |

No shared-helper regression found; no Privado/Rentas code edits.

## 15. Intentionally not touched

Child inventory drawer, child media persistence, child add-mode prefill, publish queue, DB/schema/migrations, Stripe/payment, analytics, Autos/Servicios/other categories.

## 16. Lane protection matrix

| Lane | Touched? |
|------|----------|
| BR Negocio / Agente | TRUE |
| BR Privado | FALSE |
| Rentas | FALSE |
| Other categories | FALSE |

## 17. Manual QA checklist

- [ ] Fill main agent phone/email/website/socials/reviews in Step 7
- [ ] Preview: main agent card owns contact info
- [ ] No loose unlabeled contact block
- [ ] Socials appear once when valid
- [ ] Google/Yelp cards when valid URLs
- [ ] Second agent limited
- [ ] Financing card organized + disclaimer
- [ ] Step 8 shows detected actions (no checkbox wall)
- [ ] BR Privado/Rentas unchanged
- [ ] Mobile sidebar does not overflow

## 18. No stage / commit / push

This gate did not stage, commit, or push.
