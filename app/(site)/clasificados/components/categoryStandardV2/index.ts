/**
 * Leonix Category Standard V2 - Global Reusable Template
 *
 * Extracted from Rentas/Bienes Raíces visual system.
 * These components provide the exact visual standard for all category landing/results pages.
 *
 * SOURCE OF TRUTH:
 * - app/(site)/clasificados/rentas/landing/RentasLandingShell.tsx
 * - app/(site)/clasificados/rentas/landing/RentasLandingHeroGateway.tsx
 * - app/(site)/clasificados/rentas/components/RentasCompactSearchCanvas.tsx
 * - app/(site)/clasificados/rentas/shared/rentasLeonixPublicUi.ts
 * - app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingView.tsx
 * - app/(site)/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas.tsx
 * - app/(site)/clasificados/bienes-raices/shared/bienesRaicesLeonixPublicUi.ts
 *
 * MIGRATION GUIDE:
 * See README.md for detailed migration instructions.
 */

// Types
export type {
  Lang,
  Surface,
  CtaVariant,
  ChipVariant,
  CtaProps,
  DiscoveryCard,
  ShortcutChip,
  PartnerSectionProps,
  DiscoveryGridProps,
  ShortcutSectionProps,
  VisibilityStripProps,
  ActiveFilterChip,
  ActiveFiltersProps,
  ResultsToolbarProps,
  CompactEmptyStateProps,
} from "./types";

// Constants
export {
  LEONIX_HEADER_SAFE_TOP,
  LEONIX_LANDING_LANE,
  LEONIX_RESULTS_SHELL,
  LEONIX_LANDING_BG,
  LEONIX_RESULTS_BG,
  LEONIX_TEXT_PRIMARY,
  LEONIX_RADIAL_TEXTURE,
  LEONIX_GRID_TEXTURE,
  LEONIX_LANDING_GATEWAY_PANEL,
  LEONIX_LANDING_GATEWAY_PAD,
  LEONIX_GATEWAY_ICON,
  LEONIX_EYEBROW,
  LEONIX_HERO_TITLE,
  LEONIX_HERO_TAGLINE,
  LEONIX_HERO_INTRO,
  LEONIX_HERO_INTRO_SECONDARY,
  LEONIX_HERO_SEARCH_SHELL,
  LEONIX_HERO_SEARCH_GLOW,
  LEONIX_SEARCH_FIELD_LANDING,
  LEONIX_SEARCH_INPUT_LANDING,
  LEONIX_SEARCH_GRID_GAP,
  LEONIX_BTN_PRIMARY_LANDING,
  LEONIX_BTN_SECONDARY_LANDING,
  LEONIX_BTN_PRIMARY,
  LEONIX_BTN_SECONDARY,
  LEONIX_LANDING_SECTION,
  LEONIX_LANDING_SECTION_PAD,
  LEONIX_SECTION_HEADING,
  LEONIX_SECTION_SUBTITLE,
  LEONIX_LANDING_CHIP,
  LEONIX_BUDGET_CHIP,
  LEONIX_PRACTICAL_CHIP,
  LEONIX_DISCOVERY_GRID,
  LEONIX_DISCOVERY_CARD,
  LEONIX_DISCOVERY_ICON,
  LEONIX_DISCOVERY_LABEL,
  LEONIX_DISCOVERY_HINT,
  LEONIX_SHORTCUT_SECTIONS,
  LEONIX_SHORTCUT_SECTION_BORDER,
  LEONIX_SHORTCUT_BORDER_GOLD,
  LEONIX_SHORTCUT_BORDER_OLIVE,
  LEONIX_SHORTCUT_ROW,
  LEONIX_ACTIVE_FILTERS_PANEL,
  LEONIX_ACTIVE_FILTER_CHIP,
  LEONIX_ACTIVE_FILTERS_LABEL,
  LEONIX_RESULTS_TOOLBAR,
  LEONIX_RESULTS_TOOLBAR_INNER,
  LEONIX_RESULTS_COUNT,
  LEONIX_RESULTS_COUNT_BADGE,
  LEONIX_RESULTS_COUNT_NUMBER,
  LEONIX_VISIBILITY_STRIP,
  LEONIX_VISIBILITY_GRADIENT,
  LEONIX_VISIBILITY_ICON,
  LEONIX_VISIBILITY_EYEBROW,
  LEONIX_VISIBILITY_TITLE,
  LEONIX_VISIBILITY_BODY,
  LEONIX_VISIBILITY_CTA,
} from "./constants";

// Core Components
export { LeonixCategoryPageShell } from "./LeonixCategoryPageShell";
export { LeonixCategoryHeroGateway } from "./LeonixCategoryHeroGateway";
export { LeonixCategorySearchCanvas } from "./LeonixCategorySearchCanvas";
export { LeonixCategoryCta } from "./LeonixCategoryCta";

// Landing Sections
export { LeonixCategoryPartnerSection } from "./LeonixCategoryPartnerSection";
export { LeonixCategoryDiscoveryGrid } from "./LeonixCategoryDiscoveryGrid";
export { LeonixCategoryShortcutSection } from "./LeonixCategoryShortcutSection";
export { LeonixCategoryVisibilityStrip } from "./LeonixCategoryVisibilityStrip";

// Results Components
export { LeonixCategoryResultsShell } from "./LeonixCategoryResultsShell";
export { LeonixCategoryActiveFilters } from "./LeonixCategoryActiveFilters";
export { LeonixCategoryResultsToolbar } from "./LeonixCategoryResultsToolbar";
export { LeonixCategoryCompactEmptyState } from "./LeonixCategoryCompactEmptyState";
