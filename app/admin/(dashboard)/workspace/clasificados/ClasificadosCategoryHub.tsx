import { ClasificadosCategoryCommandCenter } from "./ClasificadosCategoryCommandCenter";
import type { AdminCategoriesHubEntry } from "@/app/admin/_lib/adminCategoriesHubEntries";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";

/** Leonix category command center — drawer selector + selected category panel. */
export function ClasificadosCategoryHub({
  registry,
  lang,
  showRegistryLink = true,
}: {
  registry: AdminCategoriesHubEntry[];
  lang: AdminLang;
  showRegistryLink?: boolean;
}) {
  return <ClasificadosCategoryCommandCenter registry={registry} lang={lang} showRegistryLink={showRegistryLink} />;
}
