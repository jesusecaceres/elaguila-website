/**
 * Category Standard V2 - Global Leonix Category UI Template
 * 
 * This package provides the global reusable category landing/results UI template
 * extracted from the exact working Rentas/Bienes visual system.
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
 * USAGE:
 * These components enforce the exact Rentas/Bienes visual system.
 * Do not use generic styling - use these components for category pages.
 * 
 * HARD RULES:
 * - Results pages cannot render landing-only sections (partner, discovery, shortcuts)
 * - CTA contract is enforced through LeonixCategoryCta
 * - Empty state allows at most one CTA
 * - No fake filters, sponsors, or listings
 */

// Types
export type {
  Lang,
  Surface,
  CtaVariant,
  ChipVariant,
  CardAccent,
  ViewMode,
  LeonixCategoryCtaProps,
  LeonixCategoryHeroGatewayProps,
  LeonixCategorySearchCanvasProps,
  LeonixCategoryPartnerSectionProps,
  DiscoveryGridItem,
  LeonixCategoryDiscoveryGridProps,
  ShortcutChipItem,
  LeonixCategoryShortcutSectionProps,
  LeonixCategoryVisibilityStripProps,
  ActiveFilterChip,
  LeonixCategoryActiveFiltersProps,
  LeonixCategoryResultsToolbarProps,
  LeonixCategoryCompactEmptyStateProps,
  LeonixCategoryResultsShellProps,
  LeonixCategoryPageShellProps,
} from "./types";

// Constants
export {
  // Page shell
  LEONIX_HEADER_SAFE_TOP,
  LEONIX_LANDING_LANE,
  LEONIX_RESULTS_SHELL,
  LEONIX_RESULTS_PAGE_BG,
  LEONIX_LANDING_BG,
  LEONIX_TEXTURE_RADIAL,
  LEONIX_TEXTURE_GRID,
  
  // Hero gateway
  LEONIX_GATEWAY_PAD,
  LEONIX_GATEWAY_PANEL,
  LEONIX_GATEWAY_ICON,
  LEONIX_EYEBROW,
  LEONIX_H1,
  LEONIX_TAGLINE,
  LEONIX_INTRO,
  LEONIX_INTRO_SECONDARY,
  LEONIX_SEARCH_SLOT,
  
  // Search canvas
  LEONIX_SEARCH_SHELL,
  LEONIX_SEARCH_SHELL_LANDING,
  LEONIX_SEARCH_SHELL_GLOW,
  LEONIX_SEARCH_SHELL_GLOW_LANDING,
  LEONIX_HERO_SEARCH_SHELL,
  LEONIX_HERO_SEARCH_GLOW,
  LEONIX_RESULTS_REFINE_PANEL,
  LEONIX_SEARCH_FIELD,
  LEONIX_SEARCH_FIELD_LANDING,
  LEONIX_SEARCH_INPUT,
  LEONIX_SEARCH_INPUT_LANDING,
  
  // CTA buttons
  LEONIX_BTN_PRIMARY,
  LEONIX_BTN_PRIMARY_LANDING,
  LEONIX_BTN_SECONDARY,
  LEONIX_BTN_SECONDARY_LANDING,
  
  // Landing sections
  LEONIX_LANDING_SECTION,
  LEONIX_LANDING_SECTION_PAD,
  LEONIX_LANDING_TILES_INTEGRATED,
  LEONIX_LANDING_TILES_ACCENT,
  
  // Chips
  LEONIX_LANDING_CHIP,
  LEONIX_BUDGET_CHIP,
  LEONIX_PRACTICAL_CHIP,
  
  // Discovery grid
  LEONIX_DISCOVERY_GRID,
  LEONIX_DISCOVERY_CARD,
  LEONIX_DISCOVERY_ICON,
  LEONIX_DISCOVERY_LABEL,
  LEONIX_DISCOVERY_HINT,
  
  // Shortcut sections
  LEONIX_SHORTCUT_SECTIONS,
  LEONIX_SHORTCUT_HEADING,
  LEONIX_SHORTCUT_SUBTITLE,
  LEONIX_SHORTCUT_ROW,
  
  // Active filters
  LEONIX_ACTIVE_FILTERS_PANEL,
  LEONIX_ACTIVE_FILTER_CHIP,
  LEONIX_ACTIVE_FILTERS_LABEL,
  
  // Results toolbar
  LEONIX_RESULTS_TOOLBAR_WRAPPER,
  LEONIX_RESULTS_TOOLBAR_INNER,
  LEONIX_RESULTS_COUNT,
  LEONIX_RESULTS_COUNT_LABEL,
  LEONIX_RESULTS_COUNT_NUMBER,
  LEONIX_SORT_SELECT,
  LEONIX_VIEW_TOGGLE_GROUP,
  LEONIX_VIEW_TOGGLE_BUTTON,
  LEONIX_VIEW_TOGGLE_BUTTON_ACTIVE,
  LEONIX_VIEW_TOGGLE_BUTTON_INACTIVE,
  
  // Compact empty state
  LEONIX_COMPACT_EMPTY_STATE,
  LEONIX_EMPTY_TITLE,
  LEONIX_EMPTY_BODY,
  LEONIX_EMPTY_CTA,
  
  // Visibility strip
  LEONIX_VISIBILITY_STRIP,
  LEONIX_VISIBILITY_GRADIENT,
  LEONIX_VISIBILITY_ICON,
  LEONIX_VISIBILITY_EYEBROW,
  LEONIX_VISIBILITY_TITLE,
  LEONIX_VISIBILITY_BODY,
  LEONIX_VISIBILITY_CTA,
  
  // Card accents
  LEONIX_ACCENT_BURGUNDY,
  LEONIX_ACCENT_GREEN,
  LEONIX_ACCENT_GOLD,
} from "./constants";

// Components
export { LeonixCategoryPageShell } from "./LeonixCategoryPageShell";
export { LeonixCategoryHeroGateway } from "./LeonixCategoryHeroGateway";
export { LeonixCategorySearchCanvas } from "./LeonixCategorySearchCanvas";
export { LeonixCategoryCta } from "./LeonixCategoryCta";
export { LeonixCategoryPartnerSection } from "./LeonixCategoryPartnerSection";
export { LeonixCategoryDiscoveryGrid } from "./LeonixCategoryDiscoveryGrid";
export { LeonixCategoryShortcutSection } from "./LeonixCategoryShortcutSection";
export { LeonixCategoryVisibilityStrip } from "./LeonixCategoryVisibilityStrip";
export { LeonixCategoryResultsShell } from "./LeonixCategoryResultsShell";
export { LeonixCategoryActiveFilters } from "./LeonixCategoryActiveFilters";
export { LeonixCategoryResultsToolbar } from "./LeonixCategoryResultsToolbar";
export { LeonixCategoryCompactEmptyState } from "./LeonixCategoryCompactEmptyState";
