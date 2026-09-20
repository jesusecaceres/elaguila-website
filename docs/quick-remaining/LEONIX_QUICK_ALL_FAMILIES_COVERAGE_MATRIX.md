# LEONIX QUICK — All-Family Coverage Matrix

Every current Leonix family, across Classifieds and Business, and its final Quick entry strategy. No
family is missing. This supersedes no prior certification — Tier-1/community/Quick Business Core rows
restate what was already certified on the branches noted; only the six "Remaining" rows are new work
from this mission.

## Classifieds families

| Family | Entry Strategy | Ownership | Payment | Media | Management | Technical Status | Proof Artifact |
|---|---|---|---|---|---|---|---|
| En Venta | A. QUICK_INTAKE_BUILT (Tier-1) | Customer account | Existing paid package | Existing Quick media step | `/dashboard/mis-anuncios` | Certified | `verify-quick-classifieds-proof-matrix-03.ts` |
| Rentas | A. QUICK_INTAKE_BUILT (Tier-1) | Customer account | Existing paid package | Existing Quick media step | `/dashboard/mis-anuncios` | Certified | `verify-quick-classifieds-proof-matrix-03.ts` |
| Empleos | A. QUICK_INTAKE_BUILT (Tier-1) | Customer account | Existing paid package | Existing Quick media step (narrow media repair, Tier-1 Gate 5) | `/dashboard/mis-anuncios` | Certified | `verify-quick-classifieds-proof-matrix-03.ts` |
| Autos Privado | A. QUICK_INTAKE_BUILT (Tier-1) | Customer account | Existing paid package | Existing Quick media step | `/dashboard/mis-anuncios` | Certified | `verify-quick-classifieds-proof-matrix-03.ts` |
| Bienes FSBO | A. QUICK_INTAKE_BUILT (Quick Classifieds Gate 2) | Customer account | Existing paid package | Existing Quick media step | `/dashboard/mis-anuncios` | Certified | `verify-quick-classifieds-proof-matrix-03.ts` |
| Clases | B. EXISTING_SHORT_FLOW_REUSED (community) | Customer account | Existing (free/paid per category) | Existing form's own media | `/dashboard/mis-anuncios` | Certified | `verify-quick-classifieds-proof-matrix-03.ts` |
| Comunidad | B. EXISTING_SHORT_FLOW_REUSED (community) | Customer account | Existing | Existing form's own media | `/dashboard/mis-anuncios` | Certified | `verify-quick-classifieds-proof-matrix-03.ts` |
| Busco | B. EXISTING_SHORT_FLOW_REUSED (community) | Customer account | Existing | Existing form's own media | `/dashboard/mis-anuncios` | Certified | `verify-quick-classifieds-proof-matrix-03.ts` |
| Mascotas | B. EXISTING_SHORT_FLOW_REUSED (community) | Customer account | Existing | Existing form's own media | `/dashboard/mis-anuncios` | Certified | `verify-quick-classifieds-proof-matrix-03.ts` |

## Business families

| Family | Entry Strategy | Ownership | Payment | Media | Management | Technical Status | Proof Artifact |
|---|---|---|---|---|---|---|---|
| Servicios | A. QUICK_INTAKE_BUILT (Quick Business Core) | Customer account | `servicios_base_monthly` | Existing Quick media step | `/dashboard/mis-anuncios` | Certified | `verify-quick-business-proof-matrix-02.ts` |
| Restaurantes | A. QUICK_INTAKE_BUILT (Quick Business Core) | Customer account | `restaurantes_base_monthly` | Existing Quick media step | `/dashboard/mis-anuncios` | Certified | `verify-quick-business-proof-matrix-02.ts` |
| Autos Dealer | A. QUICK_INTAKE_BUILT (Quick Business Core) | Customer account | `autos_dealer_monthly` | Existing Quick media step | `/dashboard/mis-anuncios` | Certified | `verify-quick-business-proof-matrix-02.ts` |
| Bienes Negocio/Agent | A. QUICK_INTAKE_BUILT (Quick Business Core) | Customer account | `br_agent_monthly` | Existing Quick media step | `/dashboard/mis-anuncios` | Certified | `verify-quick-business-proof-matrix-02.ts` |
| **Comida Local** | **A. QUICK_INTAKE_BUILT (this mission)** | Customer account | `comida_local_base_monthly` ($129/mo) | Real upload at submit (documented media exception) | `/dashboard/mis-anuncios?cat=comida-local` | New, this mission | `scripts/verify-quick-remaining-families-01.ts`, focused Comida Local verifiers (all green) |
| **Ofertas Locales** | **C. DIRECT_CANONICAL_LINK (this mission)** | Customer account | Flyer `ofertas_locales_flyer_30d` $399 / 30 days; coupon `ofertas_locales_coupons_30d` $199 / 30 days (client $0 + consent $399 **CLOSED** in Cursor closeout) | Existing form's own media/AI review | `/dashboard/ofertas-locales` | Classified; coupon pricing repaired to server package | `scripts/verify-quick-remaining-families-01.ts` §4, §7; `scripts/verify-ofertas-pricing-consistency-01.ts` |
| **Negocios Locales** | **D. NOT_AN_AD_PRODUCT_NO_QUICK_FORM (this mission)** | n/a (directory) | n/a | n/a | n/a | Classified, not modified | `scripts/verify-quick-remaining-families-01.ts` §4 |
| **Viajes** | **C. DIRECT_CANONICAL_LINK (this mission)** | Customer account | `viajes_business_monthly` owner-unresolved; `viajes_affiliate` free | Existing form's own media | `/dashboard/viajes` | Classified, not modified | `scripts/verify-quick-remaining-families-01.ts` §5 |
| **Iglesias** | **C. DIRECT_CANONICAL_LINK (this mission)** | Team-moderated, free | None | Existing form's own media | none (no owner dashboard) | Classified, not modified | `scripts/verify-quick-remaining-families-01.ts` §5 |
| **Recursos** | **D. NOT_AN_AD_PRODUCT_NO_QUICK_FORM (this mission)** | Leonix team editorial | n/a | n/a | n/a | Classified, not modified | `scripts/verify-quick-remaining-families-01.ts` §6 |

All 19 Leonix families (9 Classifieds + 10 Business, counting the six remaining families as part of
Business) now have an explicit, source-grounded Quick entry strategy. No family is left undecided.
