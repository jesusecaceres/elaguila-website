import { getBusinessTypePreset } from "./businessTypePresets";
import { normalizeClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationNormalize";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import { hasServiciosValidContactData } from "./serviciosContactVisibility";
import { resolveServiciosPublicCategoryLabel } from "./resolveServiciosPublicCategoryLabel";

/** Step indices match `ClasificadosServiciosApplication` stepped UI (0-based). */
export type PublishReadinessMissingItem = { id: string; label: string; stepIndex: number };

export type ServiciosPublishReadinessResult = {
  ok: boolean;
  missing: PublishReadinessMissingItem[];
};

function hasContactMethod(state: ClasificadosServiciosApplicationState): boolean {
  return hasServiciosValidContactData(state);
}

function hasAtLeastOneService(state: ClasificadosServiciosApplicationState): boolean {
  if (state.selectedServiceIds.length > 0) return true;
  if (Array.isArray(state.customServicesOffered) && state.customServicesOffered.some((x) => typeof x === "string" && x.trim())) {
    return true;
  }
  if (state.customServiceIncluded && state.customServiceLabel.trim().length > 0) return true;
  return false;
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
  businessType: { es: "Completa la categoría o tipo de servicio.", en: "Add your service category or type." },
  customBusinessType: {
    es: "Describe tu tipo de servicio (categoría personalizada).",
    en: "Describe your service type (custom category).",
  },
  businessName: { es: "Agrega el nombre de tu negocio o servicio.", en: "Add your business or service name." },
  city: { es: "Agrega una ciudad, ZIP o área de servicio.", en: "Add a city, ZIP, or service area." },
  contact: {
    es: "Agrega al menos un método de contacto válido.",
    en: "Add at least one valid contact method.",
  },
  about: { es: "Agrega el texto “Sobre el negocio”.", en: "Add your “About the business” text." },
  services: { es: "Agrega al menos un servicio.", en: "Add at least one service." },
  media: {
    es: "Agrega portada o al menos una imagen destacada en la galería.",
    en: "Add a cover image or at least one featured gallery image.",
  },
  confirmAccurate: {
    es: "Confirma que la información del perfil es correcta.",
    en: "Confirm that your profile information is accurate.",
  },
  confirmPhotos: {
    es: "Confirma que las imágenes, videos o documentos representan tu servicio o negocio.",
    en: "Confirm that your images, videos, or documents represent your service or business.",
  },
  confirmRules: {
    es: "Confirma que el perfil cumple con las reglas de Leonix.",
    en: "Confirm that your profile follows Leonix rules.",
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
  confirm_accurate: 7,
  confirm_photos: 7,
  confirm_rules: 7,
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
  if (!resolveServiciosPublicCategoryLabel(normalized, lang)) {
    push("business_type", L("customBusinessType"));
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
  if (!normalized.confirmListingAccurate) {
    push("confirm_accurate", L("confirmAccurate"));
  }
  if (!normalized.confirmPhotosRepresentBusiness) {
    push("confirm_photos", L("confirmPhotos"));
  }
  if (!normalized.confirmCommunityRules) {
    push("confirm_rules", L("confirmRules"));
  }

  return { ok: missing.length === 0, missing };
}
