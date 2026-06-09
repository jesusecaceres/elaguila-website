# Stack FINAL-AI-1 Audit Results

Run: `npm run ofertas-locales:final-ai-1-audit`

## Gate coverage

- Gate A: Plan doc + env/table readiness documented
- Gate B: Scan API with owner/admin auth, Document AI env, job lifecycle
- Gate C: Review UI + approve/reject with parent-gated activation
- Gate D: Public search with triple gate (parent approved, item approved, active)
- Gate E: Item detail drawer with flyer context
- Gate F: Shopping list V1 localStorage
- Gate G: Open Map V1 Google Maps dir URL (not Routes API)
- Gate H: Public safety filters in public-search API
- Gate I: This audit script + build

## Document AI env

Verified via `isOfertaLocalDocumentAiConfigured()` — missing vars listed at runtime if unset.

## DB apply lock

No `supabase db push` — apply `20260606120000_create_oferta_local_ai_scan_items.sql` manually if tables missing.
