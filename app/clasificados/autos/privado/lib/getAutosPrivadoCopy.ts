import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import { getAutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

/**
 * Privado reuses Negocios copy for shared taxonomy/media strings; overrides meta + breadcrumb + seller section label.
 */
export function getAutosPrivadoCopy(lang: AutosNegociosLang): AutosNegociosCopy {
  const base = getAutosNegociosCopy(lang);
  const isEs = lang === "es";
  return {
    ...base,
    meta: {
      applicationTitle: isEs ? "Autos · Privado — Publicar" : "Autos · Private — Publish",
      previewTitle: isEs ? "Vista previa — Auto · Privado" : "Preview — Auto · Private",
    },
    preview: {
      ...base.preview,
      chrome: {
        ...base.preview.chrome,
        breadcrumbDealers: isEs ? "Privado" : "Private",
      },
    },
    app: {
      ...base.app,
      sections: {
        ...base.app.sections,
        dealer: isEs ? "Vendedor / contacto" : "Seller / contact",
      },
    },
  };
}
