import type { ClasificadosUiLang } from "@/app/lib/clasificados/clasificadosUiChromeCopy";
import type { RestauranteServiceMode } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import {
  labelForBusinessType,
  labelForCuisine,
  labelForHighlight,
  labelForLanguage,
  labelForPriceLevel,
  labelForServiceMode,
} from "@/app/clasificados/restaurantes/application/restauranteTaxonomy";
import type { RestauranteFormServiceOption } from "@/app/lib/clasificados/restaurantes/restauranteFormCleanupConfig";

export type RestauranteAppUiLang = ClasificadosUiLang;

const SECTION_TITLES: Record<string, { es: string; en: string }> = {
  a: { es: "Identidad del negocio", en: "Business identity" },
  b: { es: "Modelo de operación", en: "Operating model" },
  c: { es: "Horarios", en: "Hours" },
  d: { es: "Contacto y CTAs", en: "Contact & CTAs" },
  e: { es: "Ubicación del establecimiento", en: "Venue location" },
  f: { es: "Platos destacados", en: "Featured dishes" },
  g: { es: "Cupones y ofertas", en: "Coupons & offers" },
  h: { es: "Galería y medios", en: "Gallery & media" },
  i: { es: "Destacados del lugar", en: "Place highlights" },
  j: { es: "Amenidades y más", en: "Amenities & more" },
  k: { es: "Catering y eventos", en: "Catering & events" },
  final: { es: "Confirmación", en: "Confirmation" },
};

const DAY_LABELS: Record<string, { es: string; en: string }> = {
  monday: { es: "Lunes", en: "Monday" },
  tuesday: { es: "Martes", en: "Tuesday" },
  wednesday: { es: "Miércoles", en: "Wednesday" },
  thursday: { es: "Jueves", en: "Thursday" },
  friday: { es: "Viernes", en: "Friday" },
  saturday: { es: "Sábado", en: "Saturday" },
  sunday: { es: "Domingo", en: "Sunday" },
};

const EVENT_SIZE_EN: Record<string, string> = {
  "10-25": "10 – 25 people",
  "25-75": "25 – 75 people",
  "75-150": "75 – 150 people",
  "150+": "150+ people",
};

const FORM_SERVICE_FLAG_EN: Record<string, string> = {
  pickupAvailable: "Pickup",
  reservationsAvailable: "Reservations",
};

export function restauranteSectionShortTitle(sectionKey: string, lang: RestauranteAppUiLang): string {
  const row = SECTION_TITLES[sectionKey];
  if (!row) return sectionKey;
  return lang === "en" ? row.en : row.es;
}

export function restauranteDayLabel(dayKey: string, lang: RestauranteAppUiLang): string {
  const row = DAY_LABELS[dayKey];
  if (!row) return dayKey;
  return lang === "en" ? row.en : row.es;
}

export function restauranteEventSizeLabel(key: string, labelEs: string, lang: RestauranteAppUiLang): string {
  if (lang === "es") return labelEs;
  return EVENT_SIZE_EN[key] ?? labelEs;
}

export function restauranteFormServiceOptionLabel(opt: RestauranteFormServiceOption, lang: RestauranteAppUiLang): string {
  if (opt.kind === "mode") return labelForServiceMode(opt.key as RestauranteServiceMode, lang);
  if (lang === "en") return FORM_SERVICE_FLAG_EN[opt.key] ?? opt.labelEs;
  return opt.labelEs;
}

export function restauranteApplicationNavCopy(lang: RestauranteAppUiLang) {
  return lang === "en"
    ? {
        jumpToSection: "Jump to section",
        formSections: "Form sections",
        sections: "Sections",
      }
    : {
        jumpToSection: "Ir a sección",
        formSections: "Secciones del formulario",
        sections: "Secciones",
      };
}

export function restaurantePreviewGateCopy(lang: RestauranteAppUiLang) {
  return lang === "en"
    ? {
        previewBlockedTitle: 'Preview is not available yet',
        previewBlockedBody:
          "Complete the minimum fields for a publishable preview: name, type, cuisine, city, main photo, at least one contact method, and a hours signal.",
        previewHint:
          "For a complete publishable preview: name, type, cuisine, city, main photo, at least one contact method, and a hours signal.",
        deleteConfirm:
          "Delete the entire application and start over? This cannot be undone.",
      }
    : {
        previewBlockedTitle: 'No se puede usar "Vista previa" todavía',
        previewBlockedBody:
          "Completa los campos mínimos requeridos para una vista previa publicable: nombre, tipo, cocina, ciudad, foto principal, al menos un contacto y señal de horario.",
        previewHint:
          "Para una vista previa publicable completa: nombre, tipo, cocina, ciudad, foto principal, al menos un contacto y señal de horario.",
        deleteConfirm:
          "¿Eliminar toda la solicitud y empezar de nuevo? Esta acción no se puede deshacer.",
      };
}

export function restaurantePreviewShellCopy(lang: RestauranteAppUiLang) {
  return lang === "en"
    ? {
        loading: "Loading preview…",
        emptyTitle: "No listing data yet",
        emptyBody:
          "Complete the publish form to see how your restaurant will look. Only fields you fill in appear on the page. Use Back to edit above.",
      }
    : {
        loading: "Cargando vista previa…",
        emptyTitle: "Aún no hay datos del anuncio",
        emptyBody:
          "Completa el formulario de publicación para ver cómo se verá tu restaurante. Solo los campos que llenes aparecerán en la página. Usa Volver a editar arriba.",
      };
}

export function restaurantePreviewPageCopy(lang: RestauranteAppUiLang) {
  return lang === "en"
    ? {
        backToEdit: "Back to edit",
        continueToPayment: "Continue to payment",
        sessionHelp: "Session help",
        draftIncomplete: "Draft incomplete for checkout.",
        missing: "Missing:",
        checkRequiredFields:
          "Check name, type, cuisine, city, image, contact, and hours.",
        draftReady: "Draft ready for secure checkout (minimum validation OK).",
        sessionNote:
          "Your draft stays in this browser session until you close the tab. Scroll to the bottom for the final checkout section.",
        cardPreviewTitle: "1. Card preview",
        cardPreviewBody: "How your listing will appear in results, search, and featured cards.",
        fullPreviewTitle: "2. Full listing preview",
        fullPreviewBody: "How your listing will look when someone opens the full page.",
        finalCheckoutTitle: "3. Final checkout",
        finalCheckoutBody:
          "Preview above does not require confirmations. Complete the plan summary and checkboxes below only when you are ready for secure payment.",
        draftNotReady:
          "Complete the required fields in the form before starting secure checkout.",
        photoPrepError: "We could not prepare photos. Check your connection and try again.",
        checkoutStartError:
          "We could not start secure payment. Please try again or contact Leonix.",
      }
    : {
        backToEdit: "Volver a editar",
        continueToPayment: "Continuar al pago",
        sessionHelp: "Ayuda de sesión",
        draftIncomplete: "Borrador incompleto para pago.",
        missing: "Falta:",
        checkRequiredFields:
          "Revisa nombre, tipo, cocina, ciudad, imagen, contacto y horario.",
        draftReady: "Listo para pago seguro (validación mínima OK).",
        sessionNote:
          "El borrador vive en esta sesión del navegador hasta que cierres la pestaña. Desplázate al final para el pago.",
        cardPreviewTitle: "1. Vista previa de la tarjeta",
        cardPreviewBody:
          "Así se verá tu anuncio en resultados, búsquedas y tarjetas destacadas.",
        fullPreviewTitle: "2. Vista previa completa del anuncio",
        fullPreviewBody:
          "Así se verá tu anuncio cuando una persona abra la publicación completa.",
        finalCheckoutTitle: "3. Pago final",
        finalCheckoutBody:
          "La vista previa no requiere confirmaciones. Completa el resumen y las casillas abajo solo cuando estés listo para el pago seguro.",
        draftNotReady:
          "Completa los campos requeridos en el formulario antes de iniciar el pago seguro.",
        photoPrepError:
          "No se pudieron preparar las fotos. Comprueba la conexión e intenta de nuevo.",
        checkoutStartError:
          "No pudimos iniciar el pago seguro. Intenta de nuevo o contacta a Leonix.",
      };
}

export {
  labelForBusinessType,
  labelForCuisine,
  labelForHighlight,
  labelForLanguage,
  labelForPriceLevel,
};
