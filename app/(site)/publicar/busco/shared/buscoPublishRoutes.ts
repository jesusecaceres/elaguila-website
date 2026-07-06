import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { SupportedLang } from "@/app/lib/language";

export const BUSCO_QUICK_ROUTE = "/publicar/busco/quick";
export const BUSCO_PREVIEW_ROUTE = "/publicar/busco/quick/preview";

export function buscoHandoffPreviewUrl(routeLang: SupportedLang): string {
  return appendLangToPath(`${BUSCO_PREVIEW_ROUTE}?from=publicar`, routeLang);
}

export function buscoQuickEditUrl(routeLang: SupportedLang): string {
  return appendLangToPath(BUSCO_QUICK_ROUTE, routeLang);
}
