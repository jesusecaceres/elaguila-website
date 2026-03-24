/**
 * BR publish: branch dispatch only. Structured row logic lives in `privado/mapping` and `negocio/mapping`.
 */

import { getBrNegocioPublishStructuredDetailPairs } from "@/app/clasificados/bienes-raices/negocio/mapping/brNegocioPublishStructuredPairs";
import { getBrPrivadoPublishStructuredDetailPairs } from "@/app/clasificados/bienes-raices/privado/mapping/brPrivadoPublishStructuredPairs";

export type PublishLang = "es" | "en";

export function getBienesRaicesPublishStructuredDetailPairs(
  lang: PublishLang,
  details: Record<string, string>,
  cityDisplay: string
): Array<{ label: string; value: string }> {
  const brBranch = (details.bienesRaicesBranch ?? "").trim().toLowerCase();
  if (brBranch === "negocio") {
    return getBrNegocioPublishStructuredDetailPairs(lang, details, cityDisplay);
  }
  return getBrPrivadoPublishStructuredDetailPairs(lang, details, cityDisplay);
}
