import type {
  AdBrandBackgroundId,
  AdBrandShadeId,
  AdBrandThemeId,
  LogoPresentationId,
} from "@/app/lib/adBranding";
import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";

/**
 * Bilingual, advertiser-facing copy for the Servicios Ad Branding panel (Gate 2D).
 * Presentation only — labels and descriptors, never new ids/colors. The global
 * `app/lib/adBranding` contract remains the sole source of theme/shade/background/logo ids.
 */

export const SERVICIOS_AD_BRANDING_PANEL_COPY: Record<ServiciosLang, { title: string; intro: string }> = {
  es: {
    title: "Personaliza tu anuncio",
    intro: "Elige un estilo Leonix que complemente la identidad de tu negocio.",
  },
  en: {
    title: "Personalize your ad",
    intro: "Choose a Leonix style that complements your business identity.",
  },
};

export const SERVICIOS_AD_BRAND_DEFAULT_OPTION_COPY: Record<ServiciosLang, { label: string; descriptor: string }> = {
  es: { label: "Leonix estándar", descriptor: "El estilo Leonix actual, sin cambios" },
  en: { label: "Standard Leonix", descriptor: "The current Leonix look, unchanged" },
};

export const SERVICIOS_AD_BRAND_THEME_COPY: Record<AdBrandThemeId, Record<ServiciosLang, { label: string; descriptor: string }>> = {
  "lion-heritage": {
    es: { label: "Lion Heritage", descriptor: "Premium · establecido" },
    en: { label: "Lion Heritage", descriptor: "Premium · established" },
  },
  "savannah-trust": {
    es: { label: "Savannah Trust", descriptor: "Confianza · comunidad" },
    en: { label: "Savannah Trust", descriptor: "Trust · community" },
  },
  "sunset-comunidad": {
    es: { label: "Sunset Comunidad", descriptor: "Cálido · cercano" },
    en: { label: "Sunset Comunidad", descriptor: "Warm · welcoming" },
  },
  "black-lion-premium": {
    es: { label: "Black Lion Premium", descriptor: "Moderno · refinado" },
    en: { label: "Black Lion Premium", descriptor: "Modern · refined" },
  },
};

export const SERVICIOS_AD_BRAND_SHADE_COPY: Record<AdBrandShadeId, Record<ServiciosLang, string>> = {
  light: { es: "Claro", en: "Light" },
  standard: { es: "Clásico", en: "Classic" },
  deep: { es: "Profundo", en: "Deep" },
};

export const SERVICIOS_AD_BRAND_BACKGROUND_COPY: Record<AdBrandBackgroundId, Record<ServiciosLang, string>> = {
  cream: { es: "Marfil cálido", en: "Warm ivory" },
  charcoal: { es: "Carbón oscuro", en: "Dark charcoal" },
  photo: { es: "Foto de tu negocio", en: "Your business photo" },
};

export const SERVICIOS_AD_BRAND_LOGO_PRESENTATION_COPY: Record<LogoPresentationId, Record<ServiciosLang, string>> = {
  boxed: { es: "Cuadro", en: "Boxed" },
  circular: { es: "Circular", en: "Circular" },
  banner: { es: "Horizontal", en: "Banner" },
};

export const SERVICIOS_AD_BRANDING_SECTION_LABELS: Record<
  ServiciosLang,
  { theme: string; shade: string; background: string; logoPresentation: string }
> = {
  es: {
    theme: "Estilo de marca",
    shade: "Tono",
    background: "Fondo",
    logoPresentation: "Presentación del logo",
  },
  en: {
    theme: "Brand style",
    shade: "Shade",
    background: "Background",
    logoPresentation: "Logo presentation",
  },
};
