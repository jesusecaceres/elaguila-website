import type { SupportedLang } from "@/app/lib/language";
import { getPublicCategoryCardCopy } from "@/app/lib/clasificados/publicCategoryCopyGuard";

export type DealersDeAutosHubCategoryCopy = {
  label: string;
  desc: string;
  explore: string;
  post: string;
};

/** @deprecated Prefer getPublicCategoryCardCopy("dealers-de-autos", lang) from publicCategoryCopyGuard. */
export function getDealersDeAutosHubCategoryCopy(routeLang: SupportedLang): DealersDeAutosHubCategoryCopy {
  return getPublicCategoryCardCopy("dealers-de-autos", routeLang);
}
