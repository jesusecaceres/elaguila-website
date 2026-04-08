# Viajes UX audit (Phase 1) — internal direction

**Scope:** Current implementation vs strong travel/discovery category patterns. No web research; judgment from product truth and codebase review.

## What already aligns well

- **Hero + discovery:** Image-led hero, stacked search (destination, origin, trip type, budget), clear primary CTA to results.
- **Destination-led browsing:** Category carousel, destination grids, local departures, audience buckets link into filtered results.
- **Trust:** Trust strip + footer (MoR disclaimer, contact/legal); offer cards carry short affiliate/business disclosure lines where modeled.
- **Price/duration:** Surfaced on home cards, results cards, and offer hero.
- **Hybrid inventory:** Visual differentiation (affiliate vs business vs editorial) on top offers and results.
- **Return flow:** `back` query on offers; business profile featured offers append back to profile; `lang` merged on resolved back URLs.
- **Mobile:** Touch targets, filter drawer on results, responsive grids.

## Gaps informing Phases 2–8

1. **Bilingual:** Long **publicar/viajes/negocios** form body remains Spanish-only — complete dictionary (Phase 2).
2. **CTA consistency:** Offer detail **secondary** internal links from sample data omit `lang` — normalize with `setLangOnHref` (Phase 3).
3. **Offer detail:** First section heading **“Qué incluye”** hardcoded in EN sessions; should use `ui.offerDetail.includes`. Add compact **value/highlights** row (duration, departure, tags) with labeled EN copy (Phases 3–4).
4. **Business profile:** Stronger visual hierarchy and CTA band for small agencies (Phase 5).
5. **Landing feeds:** Slightly clearer section subtitles/card hierarchy without redesign (Phase 6).
6. **Affiliate readiness:** Tighten reviewer-facing copy on trust strip/footer; remove any stale mixed labels (Phase 7).

## Non-goals (unchanged)

- No checkout, APIs, or MoR logic.
- No route changes; `/clasificados/travel` → `/clasificados/viajes` preserved.
