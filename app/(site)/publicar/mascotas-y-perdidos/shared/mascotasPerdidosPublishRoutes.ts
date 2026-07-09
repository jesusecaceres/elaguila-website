import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { SupportedLang } from "@/app/lib/language";

export const MASCOTAS_PERDIDOS_QUICK_ROUTE = "/publicar/mascotas-y-perdidos/quick";

/** B4 will implement preview at this path. */
export const MASCOTAS_PERDIDOS_PREVIEW_ROUTE = "/publicar/mascotas-y-perdidos/quick/preview";

export function mascotasPerdidosQuickEditUrl(routeLang: SupportedLang): string {
  return appendLangToPath(MASCOTAS_PERDIDOS_QUICK_ROUTE, routeLang);
}

export function mascotasPerdidosHandoffPreviewUrl(routeLang: SupportedLang): string {
  return appendLangToPath(`${MASCOTAS_PERDIDOS_PREVIEW_ROUTE}?from=publicar`, routeLang);
}
