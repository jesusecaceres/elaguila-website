/** Canonical publish + preview routes — Bienes Raíces (Leonix Clasificados). */

export const BR_PUBLICAR_HUB = "/clasificados/publicar/bienes-raices";
export const BR_PUBLICAR_PRIVADO = "/clasificados/publicar/bienes-raices/privado";
/** Same Privado application as `BR_PUBLICAR_PRIVADO`, exposed under `/publicar` for a clear entry URL. */
export const BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY = "/publicar/bienes-raices/privado";
/** Negocio: seller + property category selector (then continues to `BR_PUBLICAR_NEGOCIO`). */
export const BR_PUBLICAR_NEGOCIO_SELECTOR = "/publicar/bienes-raices";
/** Public entry alias for Negocio publish (redirects into the Negocio selector flow). */
export const BR_PUBLICAR_NEGOCIOS_PUBLIC_ENTRY = "/publicar/bienes-raices/negocios";
export const BR_PUBLICAR_NEGOCIO = "/clasificados/publicar/bienes-raices/negocio";
/** Hub: elegir Negocio vs Privado */
export const BR_PREVIEW_HUB = "/clasificados/bienes-raices/preview";
/** Preview premium aprobado (borrador desde Publicar Negocio) */
export const BR_PREVIEW_NEGOCIO = "/clasificados/bienes-raices/preview/negocio";
export const BR_PREVIEW_PRIVADO = "/clasificados/bienes-raices/preview/privado";
export const BR_CATEGORY_HOME = "/clasificados/bienes-raices";
/** Category results: filtered browse (owned by Bienes Raíces, Spanish slug). */
export const BR_RESULTS = "/clasificados/bienes-raices/resultados";
