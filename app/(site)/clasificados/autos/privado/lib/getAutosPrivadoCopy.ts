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
      empty: {
        ...base.preview.empty,
        body: isEs
          ? "Los campos vacíos no se muestran al comprador: galería, especificaciones y datos de contacto aparecerán aquí conforme los vayas añadiendo."
          : "Empty fields stay hidden for buyers—gallery, specs, and contact details will appear here as you add them.",
      },
      analytics: {
        ...base.preview.analytics,
        footnote: isEs
          ? "Cifras de ejemplo en borrador. Tras publicar, conectaremos métricas reales desde tu panel."
          : "Sample figures while drafting. After publish, we’ll wire real metrics from your dashboard.",
      },
      description: {
        title: isEs ? "Descripción" : "Description",
        byline: (seller) =>
          isEs ? `Resumen proporcionado por ${seller}` : `Summary provided by ${seller}`,
      },
    },
    app: {
      ...base.app,
      sections: {
        ...base.app.sections,
        badges: isEs ? "Destacados y equipamiento" : "Highlights & equipment",
        dealer: isEs ? "Vendedor / contacto" : "Seller / contact",
      },
      labels: {
        ...base.app.labels,
        phoneOffice: isEs ? "Teléfono" : "Phone",
        dealerName: isEs ? "Nombre del vendedor" : "Seller name",
        sellerEmail: isEs ? "Correo electrónico (opcional)" : "Email (optional)",
        siteMessageCta: isEs ? "Mostrar botón “Mensaje” (Leonix) en la vista previa" : "Show “Message” (Leonix) on preview",
        siteMessageCtaHint: isEs
          ? "Abre el formulario de contacto de Leonix con un mensaje sugerido sobre este auto."
          : "Opens Leonix’s contact form with a suggested note about this vehicle.",
      },
    },
  };
}
