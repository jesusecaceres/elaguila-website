# Viajes — Phase 1 affiliate readiness audit

Review surface: `/clasificados/viajes`, `/clasificados/viajes/resultados`, `/clasificados/viajes/oferta/[slug]`, `/clasificados/viajes/negocio/[slug]`.

## Questions

1. **Trustworthy discovery/referral?** Yes — trust strip and footer state Leonix is not the final seller; partner bookings occur off-site. **Tightened** copy to stress referral/discovery and price transparency cues.

2. **Affiliate vs business obvious?** Yes — cards use distinct pills (Partner / Business / Ideas) and affiliate cards show a short disclosure. **Tightened** partner label wording (“Socio comercial” in ES) and results subtitle.

3. **Trust/legal/contact paths?** Footer links Contact + Legal. **Added** same trust strip on results so reviewers see disclosure on the second key URL.

4. **What is Viajes clear?** Hero + top-offers subtitle explain curated mix. **Improved** hero and category framing in copy (no layout redesign).

5. **Real / reviewable?** Sample offers and profiles are populated; **no** wholesale redesign — copy and results trust surface only.

6. **Screenshot strength?** Strongest: home hero + top offers rail, offer detail, business profile. **Phase 2** adds “Why Leonix Viajes” block and EN affiliate card lines.

## Changes (Phase 1)

- `data/viajesUiCopy.ts` — reviewer-facing strings (trust strip, hero, top offers, results, offer detail, negocio trust).
- `components/ViajesResultsShell.tsx` — `ViajesTrustStrip` below results header.

Subsequent phases (2–8) extended the same surfaces: `trustWhy`, bilingual affiliate card disclosures, business posting workflow copy (`publicarViajesHubCopy`, `publicarViajesNegociosCopy`), and the negocios application shell (steps, trust, lifecycle placeholders). Final build verified after the full pass.
