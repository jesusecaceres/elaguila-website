/**
 * Structural map: where a listing lives after publish (live vs preview stays on publish routes).
 * Stripe / paid gates are out of scope here — this file is the handoff anchor for URLs only.
 */

/** Live detail (moderated listing). */
export const CLASIFICADOS_ANUNCIO_LIVE = "/clasificados/anuncio";

/** BR exploratory entry (landing). */
export const BR_LANDING = "/clasificados/bienes-raices";
/** BR filtered grid (separate from preview + from anuncio detail). */
export const BR_RESULTS = "/clasificados/bienes-raices/results";

/** Rentas exploratory entry. */
export const RENTAS_LANDING = "/clasificados/rentas";
/** Rentas filtered grid (separate from preview). */
export const RENTAS_RESULTS = "/clasificados/rentas/results";

/** In-flow previews (not live). */
export const BR_PREVIEW_PRIVADO = "/clasificados/bienes-raices/preview/privado";
export const BR_PREVIEW_NEGOCIO = "/clasificados/bienes-raices/preview/negocio";
export const RENTAS_PREVIEW_PRIVADO = "/clasificados/rentas/preview/privado";
export const RENTAS_PREVIEW_NEGOCIO = "/clasificados/rentas/preview/negocio";
