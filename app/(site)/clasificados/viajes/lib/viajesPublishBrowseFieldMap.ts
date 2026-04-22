/**
 * Viajes publish ↔ public browse mapping (single contract: `viajesBrowseContract.ts`).
 *
 * | URL / filter key | Fed by (approved staged rows) | Derivation |
 * |------------------|----------------------------------|------------|
 * | `dest`, `q`      | `destino`                        | `viajesDestSlugsFromDestinationLabel` + text haystack |
 * | `from`           | `ciudadSalida`                   | `viajesResultsMatch.departureMatches` (hub text) |
 * | `t`              | `offerType` + inclusion flags    | `negociosTripKeys` / `privadoTripKeys` + `viajesTripKeysFromNegociosLike` |
 * | `budget`         | `presupuestoTag`                 | `viajesBudgetBandFromTag` → `budgetBand` |
 * | `audience`       | familias/parejas/grupos (+ privado `numeroPersonas`) | `audienceKeys` on `ViajesBusinessResult` |
 * | `season`         | `fechaInicio`/`fechaFin`/`fechasNota` | `viajesSeasonKeysFromDraft` |
 * | `duration`       | `duracion` + structured dates    | `viajesDurationKeyFromDraft` → `durationKey` |
 * | `svcLang`        | `guiaEspanol` + `idiomaAtencion` | `viajesServiceLanguageKeysFromDraft` → `serviceLanguageKeys` |
 * | `sort`           | `publishedAt` / discovery scores | `sortViajesResultRows` |
 * | `q` (free text)  | title, destination, price text, includes | `viajesResultsMatch.textHaystack` |
 *
 * **Not in URL contract (detail / moderation / owner only):** full contact book, gallery/video file labels,
 * `politicaReserva` (private) except as detail copy, internal blob ids, `destinationsServed` / `languages` long text (detail only).
 *
 * Full per-field audit tables: `viajesCanonicalFieldInventory.ts`.
 *
 * Reserved (no list filter): `zip`, `radiusMiles`, `nearMe` — see browse contract.
 */

export { VIAJES_NEGOCIOS_FIELD_AUDIT, VIAJES_PRIVADO_FIELD_AUDIT } from "./viajesCanonicalFieldInventory";
