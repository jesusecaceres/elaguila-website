import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

export const BUSCO_QUICK_ROUTE = "/publicar/busco/quick";
export const BUSCO_PREVIEW_ROUTE = "/publicar/busco/quick/preview";

export function buscoHandoffPreviewUrl(lang: Lang): string {
  return appendLangToPath(`${BUSCO_PREVIEW_ROUTE}?from=publicar`, lang);
}

export function buscoQuickEditUrl(lang: Lang): string {
  return appendLangToPath(BUSCO_QUICK_ROUTE, lang);
}
