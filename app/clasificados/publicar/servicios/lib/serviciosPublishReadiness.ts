import { getBusinessTypePreset } from "./businessTypePresets";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import { isProbablyValidWebUrl } from "./socialAndUrlHelpers";

export type PublishReadinessMissingItem = { id: string; label: string };

export type ServiciosPublishReadinessResult = {
  ok: boolean;
  missing: PublishReadinessMissingItem[];
};

function hasContactMethod(state: ClasificadosServiciosApplicationState): boolean {
  if (state.enableCall && state.phone.trim().replace(/\D/g, "").length >= 8) return true;
  if (state.enableWebsite && state.website.trim() && isProbablyValidWebUrl(state.website)) return true;
  if (state.enableWhatsapp && state.whatsapp.replace(/\D/g, "").length >= 8) return true;
  return false;
}

function hasAtLeastOneService(state: ClasificadosServiciosApplicationState): boolean {
  if (state.customServiceLabel.trim().length > 0) return true;
  return state.selectedServiceIds.length > 0;
}

/** At least one hero/gallery image: cover, or any gallery item (featured strip derives from these). */
function hasFeaturedVisual(state: ClasificadosServiciosApplicationState): boolean {
  if (state.coverUrl.trim().length > 0) return true;
  return state.gallery.length > 0;
}

const LABELS = {
  businessType: { es: "Tipo de negocio", en: "Business type" },
  businessName: { es: "Nombre del negocio", en: "Business name" },
  city: { es: "Ciudad principal", en: "Main city" },
  contact: { es: "Al menos un método de contacto (teléfono, sitio o WhatsApp)", en: "At least one contact method (phone, website, or WhatsApp)" },
  about: { es: "Texto “Sobre el negocio”", en: "“About the business” text" },
  services: { es: "Al menos un servicio", en: "At least one service" },
  media: { es: "Al menos una imagen (portada o galería)", en: "At least one image (cover or gallery)" },
} as const;

/**
 * Minimum fields required before the transitional publish path may proceed.
 */
export function evaluateServiciosPublishReadiness(
  state: ClasificadosServiciosApplicationState,
  lang: "es" | "en",
): ServiciosPublishReadinessResult {
  const L = (id: keyof typeof LABELS) => LABELS[id][lang];
  const missing: PublishReadinessMissingItem[] = [];

  if (!state.businessTypeId.trim() || !getBusinessTypePreset(state.businessTypeId)) {
    missing.push({ id: "business_type", label: L("businessType") });
  }
  if (state.businessName.trim().length < 2) {
    missing.push({ id: "business_name", label: L("businessName") });
  }
  if (state.city.trim().length < 2) {
    missing.push({ id: "city", label: L("city") });
  }
  if (!hasContactMethod(state)) {
    missing.push({ id: "contact", label: L("contact") });
  }
  if (state.aboutText.trim().length < 8) {
    missing.push({ id: "about", label: L("about") });
  }
  if (!hasAtLeastOneService(state)) {
    missing.push({ id: "services", label: L("services") });
  }
  if (!hasFeaturedVisual(state)) {
    missing.push({ id: "media", label: L("media") });
  }

  return { ok: missing.length === 0, missing };
}
