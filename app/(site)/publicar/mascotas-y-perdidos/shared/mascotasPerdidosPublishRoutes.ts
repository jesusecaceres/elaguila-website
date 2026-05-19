import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

export const MASCOTAS_PERDIDOS_QUICK_ROUTE = "/publicar/mascotas-y-perdidos/quick";

/** B4 will implement preview at this path. */
export const MASCOTAS_PERDIDOS_PREVIEW_ROUTE = "/publicar/mascotas-y-perdidos/quick/preview";

export function mascotasPerdidosQuickEditUrl(lang: Lang): string {
  return appendLangToPath(MASCOTAS_PERDIDOS_QUICK_ROUTE, lang);
}

export function mascotasPerdidosHandoffPreviewUrl(lang: Lang): string {
  return appendLangToPath(`${MASCOTAS_PERDIDOS_PREVIEW_ROUTE}?from=publicar`, lang);
}
