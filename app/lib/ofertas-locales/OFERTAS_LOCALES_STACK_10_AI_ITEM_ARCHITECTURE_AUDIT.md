# Stack 10 — AI Item Architecture Audit

**Date:** Stack 10 completion  
**Script:** `npm run ofertas-locales:stack-10-ai-item-architecture-audit`

## Scope

Architecture, types, docs, and audit only. No APIs, migrations, SDKs, or shopping/route implementation.

## Artifacts

| Artifact | Path |
|----------|------|
| Gate A plan | `OFERTAS_LOCALES_STACK_10_AI_ITEM_ARCHITECTURE_PLAN.md` |
| Architecture | `OFERTAS_LOCALES_AI_EXTRACTION_CLICKABLE_ITEMS_ARCHITECTURE.md` |
| Types | `ofertasLocalesTypes.ts` |
| Helpers | `ofertasLocalesAiArchitecture.ts` |
| Constants | `ofertasLocalesConstants.ts` |

## Tool decisions

- Scanner: Google Document AI
- Normalizer: Leonix AI Normalizer
- Public rule: business verification + `canOfertaLocalItemGoPublic`

## Forbidden (verified by script)

- No `app/api/ofertas-locales/scan/**` or `items/**`
- No Google/OpenAI/Gemini SDK in lib changes
- No Supabase migrations
- No admin/dashboard/header/nav changes
