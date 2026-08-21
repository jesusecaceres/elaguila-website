import type {
  AdBrandBackgroundId,
  AdBrandShadeId,
  AdBrandThemeId,
  LogoPresentationId,
} from "@/app/lib/adBranding";
import type { RestauranteAppUiLang } from "./restauranteApplicationFormCopy";

/**
 * Bilingual, restaurant-owner-facing copy for the Ad Branding panel (Gate 3D).
 * Presentation only — labels and descriptors, never new ids/colors. The global
 * `app/lib/adBranding` contract remains the sole source of theme/shade/background/logo ids.
 */

export function restauranteAdBrandingPanelTitle(lang: RestauranteAppUiLang): string {
  return lang === "en" ? "Personalize your restaurant's style" : "Personaliza el estilo de tu restaurante";
}

export function restauranteAdBrandingPanelIntro(lang: RestauranteAppUiLang): string {
  return lang === "en"
    ? "Choose a Leonix style that complements your logo and your business personality."
    : "Elige un estilo Leonix que complemente tu logo y la personalidad de tu negocio.";
}

export const RESTAURANTE_AD_BRAND_DEFAULT_OPTION_COPY: Record<RestauranteAppUiLang, { label: string; descriptor: string }> = {
  es: { label: "Leonix estándar", descriptor: "El estilo Leonix actual, sin cambios" },
  en: { label: "Standard Leonix", descriptor: "The current Leonix look, unchanged" },
};

export const RESTAURANTE_AD_BRAND_THEME_COPY: Record<AdBrandThemeId, Record<RestauranteAppUiLang, { label: string; descriptor: string }>> = {
  "lion-heritage": {
    es: { label: "Lion Heritage", descriptor: "Elegante · establecido" },
    en: { label: "Lion Heritage", descriptor: "Elegant · established" },
  },
  "savannah-trust": {
    es: { label: "Savannah Trust", descriptor: "Natural · acogedor · confiable" },
    en: { label: "Savannah Trust", descriptor: "Natural · welcoming · trustworthy" },
  },
  "sunset-comunidad": {
    es: { label: "Sunset Comunidad", descriptor: "Cálido · animado · local" },
    en: { label: "Sunset Comunidad", descriptor: "Warm · lively · local" },
  },
  "black-lion-premium": {
    es: { label: "Black Lion Premium", descriptor: "Moderno · refinado" },
    en: { label: "Black Lion Premium", descriptor: "Modern · refined" },
  },
};

export const RESTAURANTE_AD_BRAND_SHADE_COPY: Record<AdBrandShadeId, Record<RestauranteAppUiLang, string>> = {
  light: { es: "Claro", en: "Light" },
  standard: { es: "Clásico", en: "Classic" },
  deep: { es: "Profundo", en: "Deep" },
};

export const RESTAURANTE_AD_BRAND_BACKGROUND_COPY: Record<AdBrandBackgroundId, Record<RestauranteAppUiLang, string>> = {
  cream: { es: "Marfil cálido", en: "Warm ivory" },
  charcoal: { es: "Carbón oscuro", en: "Dark charcoal" },
  photo: { es: "Foto de tu restaurante", en: "Your restaurant's photo" },
};

export const RESTAURANTE_AD_BRAND_LOGO_PRESENTATION_COPY: Record<LogoPresentationId, Record<RestauranteAppUiLang, string>> = {
  boxed: { es: "Cuadro", en: "Boxed" },
  circular: { es: "Circular", en: "Circular" },
  banner: { es: "Horizontal", en: "Banner" },
};

export const RESTAURANTE_AD_BRANDING_SECTION_LABELS: Record<
  RestauranteAppUiLang,
  { theme: string; shade: string; background: string; logoPresentation: string }
> = {
  es: {
    theme: "Estilo",
    shade: "Intensidad",
    background: "Fondo",
    logoPresentation: "Presentación del logo",
  },
  en: {
    theme: "Style",
    shade: "Intensity",
    background: "Background",
    logoPresentation: "Logo presentation",
  },
};
