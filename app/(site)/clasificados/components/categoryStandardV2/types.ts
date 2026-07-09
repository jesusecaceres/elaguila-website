/**
 * Category Standard V2 Types
 * 
 * These types define the contracts for the global Leonix category landing/results UI template.
 * They are extracted from the working Rentas/Bienes visual system.
 */

export type Lang = "es" | "en";

export type Surface = "landing" | "results";

export type CtaVariant = "primary" | "secondary" | "ghost";

export type ChipVariant = "budget" | "practical" | "default";

export type CardAccent = "burgundy" | "green" | "gold";

export type ViewMode = "grid" | "list";

/**
 * CTA button props
 */
export interface LeonixCategoryCtaProps {
  variant?: CtaVariant;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  children: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
}

/**
 * Hero gateway props
 */
export interface LeonixCategoryHeroGatewayProps {
  lang: Lang;
  surface: Surface;
  title: string;
  tagline: string;
  intro: string;
  introSecondary: string;
  searchSlot: React.ReactNode;
  tilesSlot?: React.ReactNode;
  eyebrow?: string;
}

/**
 * Search canvas props
 *
 * Landing rule: if publishHref + publishLabel exist, the primary CTA renders by
 * default. Results never show publish by default. preservePrimarySlot keeps the
 * Rentas/Bienes second-row grid from collapsing when action data is missing.
 */
export interface LeonixCategorySearchCanvasProps {
  lang: Lang;
  surface: Surface;
  query: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  onQuery: (v: string) => void;
  onCity: (v: string) => void;
  onState: (v: string) => void;
  onZip: (v: string) => void;
  onCountry: (v: string) => void;
  onSearch: () => void;
  onOpenFilters: () => void;
  browseAllHref?: string;
  browseAllLabel?: string;
  queryPlaceholder?: string;
  searchButtonLabel: string;
  filtersButtonLabel: string;
  publishHref?: string;
  publishLabel?: string;
  fallbackPrimaryHref?: string;
  fallbackPrimaryLabel?: string;
  preservePrimarySlot?: boolean;
  disabledPrimarySlotLabel?: string;
  extraSecondRowSlot?: React.ReactNode;
  showBrowseAll?: boolean;
  showPublish?: boolean;
  formId?: string;
  action?: string;
  method?: "get" | "post";
}

/**
 * Partner section props
 */
export interface LeonixCategoryPartnerSectionProps {
  enabled: boolean;
  lang: Lang;
  surface: Surface;
  eyebrow: string;
  title: string;
  body: string;
  supportingLine?: string;
  chips?: string[];
  primaryCta?: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
}

/**
 * Discovery grid item
 */
export interface DiscoveryGridItem {
  id: string;
  label: string;
  hint?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Discovery grid props
 */
export interface LeonixCategoryDiscoveryGridProps {
  lang: Lang;
  surface: Surface;
  heading: string;
  subtitle: string;
  items: DiscoveryGridItem[];
}

/**
 * Shortcut chip item
 */
export interface ShortcutChipItem {
  id: string;
  label: string;
  href: string;
  variant?: ChipVariant;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Shortcut section props
 */
export interface LeonixCategoryShortcutSectionProps {
  lang: Lang;
  surface: Surface;
  title: string;
  subtitle: string;
  chips: ShortcutChipItem[];
  variant?: ChipVariant;
}

/**
 * Visibility strip props
 */
export interface LeonixCategoryVisibilityStripProps {
  lang: Lang;
  surface: Surface;
  allowOnResults?: boolean;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}

/**
 * Active filter chip
 */
export interface ActiveFilterChip {
  id: string;
  label: string;
  onClear?: () => void;
  href?: string;
}

/**
 * Active filters props
 */
export interface LeonixCategoryActiveFiltersProps {
  label: string;
  chips: ActiveFilterChip[];
  clearAllLabel: string;
  onClearAll: () => void;
}

/**
 * Results toolbar props
 */
export interface LeonixCategoryResultsToolbarProps {
  lang: Lang;
  countText: string;
  resultCount: number;
  showingFrom: number;
  showingTo: number;
  sortLabel: string;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: { value: string; label: string }[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filtersButtonLabel?: string;
  onOpenFilters?: () => void;
  perPageLabel?: string;
  perPageValue: number;
  onPerPageChange?: (value: number) => void;
  perPageOptions?: number[];
  clearAllLabel?: string;
  onClearAll?: () => void;
}

/**
 * Compact empty state props
 */
export interface LeonixCategoryCompactEmptyStateProps {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * Results shell props
 *
 * Results order is fixed: hero/search, active filters, toolbar, cards or empty
 * state, pagination, and explicit lower visibility. This API intentionally does
 * not expose landing-only named props such as partnerSection, discoveryGrid,
 * shortcutSections, randomCtaRows, or sponsorSection.
 */
export interface LeonixCategoryResultsShellProps {
  surface: "results"; // Must be "results" - hard rule
  hero: React.ReactNode;
  activeFilters?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  emptyState?: React.ReactNode;
  pagination?: React.ReactNode;
  lowerVisibility?: React.ReactNode;
  allowResultsVisibilityStrip?: boolean;
  hasResults: boolean;
}

/**
 * Page shell props
 */
export interface LeonixCategoryPageShellProps {
  surface: Surface;
  children: React.ReactNode;
  topSlot?: React.ReactNode;
  className?: string;
}
