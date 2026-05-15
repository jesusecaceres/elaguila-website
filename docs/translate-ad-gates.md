# Translate Ad — rollout gates

## Gate 3A (foundation)

- Shared locale/types, masking helpers, session-only cache utilities, and `TranslateAdControl` client component live under `app/lib/translation/` and `app/components/translation/`.
- **No Supabase migration** and **no stored `listing_translations`** yet.
- **No production translation provider** or API route in this gate — pilots pass an optional `requestTranslation` callback later (typed as `TranslateAdProviderFn`).
- Translate Ad must remain **user-triggered** (no auto-translate on render).
- **Do not translate or ship raw contact fields** — emails, phones, URL/WhatsApp/map-like strings are masked before any future provider call; prices and legal copy stay out of the default picked fields.

## Next gates

1. **Servicios pilot** — first category wiring through an existing resolver boundary (`profile_json` / profile view).
2. **Stored `listing_translations`** — durable bilingual rows after product/schema decisions.

## Guardrails (manual review)

- Before implementing wiring: `git status --short` should be clean at session start; keep commits scoped (user commits manually).
- After changes: `npm run build` from a clean tree; if Windows `.next` rename/manifest errors occur, delete `.next` once and rebuild — **do not** patch unrelated app code for artifact issues.
