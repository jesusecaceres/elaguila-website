/** Canonical publish + preview routes — Rentas (Leonix Clasificados). */

export const RENTAS_PUBLICAR_PRIVADO = "/clasificados/publicar/rentas/privado";
/** Same Privado entry as `RENTAS_PUBLICAR_PRIVADO`, under `/publicar`. */
export const RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY = "/publicar/rentas/privado";
/** Privado preview (ivory shell); reads `rentas-privado-draft-v1`. */
export const RENTAS_PREVIEW_PRIVADO = "/clasificados/rentas/preview/privado";

export const RENTAS_PUBLICAR_NEGOCIO = "/clasificados/publicar/rentas/negocio";
export const RENTAS_PUBLICAR_NEGOCIO_PUBLIC_ENTRY = "/publicar/rentas/negocio";
/** Negocio preview (BR Negocio shell); reads `rentas-negocio-draft-v1` (session). */
export const RENTAS_PREVIEW_NEGOCIO = "/clasificados/rentas/preview/negocio";

/** Category-owned results (grid); separate from preview/detail. */
export const RENTAS_RESULTS = "/clasificados/rentas/results";

/** Exploratory landing (not results). */
export const RENTAS_LANDING = "/clasificados/rentas";
