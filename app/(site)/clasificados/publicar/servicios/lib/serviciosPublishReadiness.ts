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
  if (state.enableWhatsapp && String(state.whatsapp ?? "").replace(/\D/g, "").length >= 8) return true;
  return false;
}

function hasAtLeastOneService(state: ClasificadosServiciosApplicationState): boolean {
  if (state.customServiceLabel.trim().length > 0) return true;
  return state.selectedServiceIds.length > 0;
}

/**
 * Cover satisfies hero visuals; otherwise require at least one gallery image marked for the main strip
 * (`featuredGalleryIds` intersecting `gallery`).
 */
function hasFeaturedVisual(state: ClasificadosServiciosApplicationState): boolean {
  if (state.coverUrl.trim().length > 0) return true;
  if (state.gallery.length === 0) return false;
  const galleryIds = new Set(state.gallery.map((g) => g.id));
  const featured = state.featuredGalleryIds.filter((id) => galleryIds.has(id));
  return featured.length >= 1;
}

const LABELS = {
  businessType: { es: "Tipo de negocio", en: "Business type" },
  businessName: { es: "Nombre del negocio", en: "Business name" },
  city: { es: "Ciudad principal", en: "Main city" },
  contact: { es: "Al menos un método de contacto (teléfono, sitio o WhatsApp)", en: "At least one contact method (phone, website, or WhatsApp)" },
  about: { es: "Texto “Sobre el negocio”", en: "“About the business” text" },
  services: { es: "Al menos un servicio", en: "At least one service" },
  media: {
    es: "Portada o al menos una imagen destacada en la galería principal",
    en: "Cover image or at least one image in the main gallery strip",
  },
  primaryCta: {
    es: "Acción principal del botón destacado",
    en: "Primary highlighted button action",
  },
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

  const presetForCta = getBusinessTypePreset(state.businessTypeId);
  if (presetForCta && presetForCta.primaryCtaOptions.length > 0) {
    const validPrimary = presetForCta.primaryCtaOptions.some((c) => c.id === state.primaryCtaId);
    if (!validPrimary) {
      missing.push({ id: "primary_cta", label: L("primaryCta") });
    }
  }

  return { ok: missing.length === 0, missing };
}
