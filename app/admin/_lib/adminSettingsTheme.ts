/**
 * Future admin-driven site theme presets. Frontend would map these to CSS variables / data-theme.
 * No runtime switch applied site-wide yet — scaffolding only.
 */

export type SiteThemePresetId = "default" | "celebration" | "holiday" | "premium-gold" | "custom";

export type SiteThemePreset = {
  id: SiteThemePresetId;
  label: string;
  description: string;
};

export const SITE_THEME_PRESETS: SiteThemePreset[] = [
  { id: "default", label: "Default Leonix", description: "Current production palette and typography." },
  { id: "celebration", label: "Celebration", description: "Brighter golds and confetti-friendly accents." },
  { id: "holiday", label: "Holiday", description: "Seasonal warmth — pair with promo modules." },
  { id: "premium-gold", label: "Premium gold", description: "Deeper gold emphasis for launches." },
  { id: "custom", label: "Custom (future)", description: "Token overrides from admin — requires design system hookup." },
];
