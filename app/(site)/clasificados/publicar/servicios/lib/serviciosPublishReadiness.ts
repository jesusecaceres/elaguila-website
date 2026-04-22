import { getBusinessTypePreset } from "./businessTypePresets";
import { normalizeClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationNormalize";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import { isValidEmail } from "./leonixContactCtaPriority";
import { isProbablyValidWebUrl } from "./socialAndUrlHelpers";

/** Step indices match `ClasificadosServiciosApplication` stepped UI (0-based). */
export type PublishReadinessMissingItem = { id: string; label: string; stepIndex: number };

export type ServiciosPublishReadinessResult = {
  ok: boolean;
  missing: PublishReadinessMissingItem[];
};

function hasContactMethod(state: ClasificadosServiciosApplicationState): boolean {
  if (state.enableCall && state.phone.trim().replace(/\D/g, "").length >= 8) return true;
  if (state.enableWebsite && state.website.trim() && isProbablyValidWebUrl(state.website)) return true;
  if (state.enableWhatsapp && String(state.whatsapp ?? "").replace(/\D/g, "").length >= 8) return true;
  if (state.enableWhatsapp && state.whatsappBusinessUrl.trim() && isProbablyValidWebUrl(state.whatsappBusinessUrl)) return true;
  if (state.enableEmail && isValidEmail(state.email)) return true;
  return false;
}

function hasAtLeastOneService(state: ClasificadosServiciosApplicationState): boolean {
  if (state.customServiceIncluded && state.customServiceLabel.trim().length > 0) return true;
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
  contact: {
    es: "Al menos un método de contacto válido (teléfono, sitio, WhatsApp o correo)",
    en: "At least one valid contact method (phone, website, WhatsApp, or email)",
  },
  about: { es: "Texto “Sobre el negocio”", en: "“About the business” text" },
  services: { es: "Al menos un servicio", en: "At least one service" },
  media: {
    es: "Portada o al menos una imagen destacada en la galería principal",
    en: "Cover image or at least one image in the main gallery strip",
  },
  legal: {
    es: "Confirmaciones legales de publicación (exactitud, fotos y reglas)",
    en: "Legal publish confirmations (accuracy, photos, and community rules)",
  },
} as const;

const STEP = {
  business_type: 0,
  business_name: 1,
  city: 1,
  media: 2,
  about: 3,
  services: 4,
  /** Contact source fields live on step 2 (index 1) */
  contact: 1,
  /** Attestations live on final publish step (index 8) */
  legal_attest: 8,
} as const;

type ReadinessId = keyof typeof STEP;

/**
 * Minimum fields required before the transitional publish path may proceed.
 */
export function evaluateServiciosPublishReadiness(
  state: ClasificadosServiciosApplicationState,
  lang: "es" | "en",
): ServiciosPublishReadinessResult {
  /** Same normalization as session restore so featured-gallery inference matches storage/readiness. */
  const normalized = normalizeClasificadosServiciosApplicationState(state);
  const L = (id: keyof typeof LABELS) => LABELS[id][lang];
  const missing: PublishReadinessMissingItem[] = [];

  const push = (id: ReadinessId, label: string) => {
    missing.push({ id, label, stepIndex: STEP[id] });
  };

  if (!normalized.businessTypeId.trim() || !getBusinessTypePreset(normalized.businessTypeId)) {
    push("business_type", L("businessType"));
  }
  if (normalized.businessName.trim().length < 2) {
    push("business_name", L("businessName"));
  }
  if (normalized.city.trim().length < 2) {
    push("city", L("city"));
  }
  if (!hasContactMethod(normalized)) {
    push("contact", L("contact"));
  }
  if (normalized.aboutText.trim().length < 8) {
    push("about", L("about"));
  }
  if (!hasAtLeastOneService(normalized)) {
    push("services", L("services"));
  }
  if (!hasFeaturedVisual(normalized)) {
    push("media", L("media"));
  }
  if (
    !normalized.confirmListingAccurate ||
    !normalized.confirmPhotosRepresentBusiness ||
    !normalized.confirmCommunityRules
  ) {
    push("legal_attest", L("legal"));
  }

  return { ok: missing.length === 0, missing };
}
