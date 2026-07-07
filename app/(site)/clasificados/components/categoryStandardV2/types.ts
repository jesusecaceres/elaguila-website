/**
 * Leonix Category Standard V2 - Type Definitions
 *
 * Extracted from Rentas/Bienes Raíces visual system.
 * These types support the reusable category landing/results template.
 */

export type Lang = "es" | "en";

export type Surface = "landing" | "results";

export type CtaVariant = "primary" | "secondary" | "ghost";

export type ChipVariant = "budget" | "practical" | "default";

export interface CtaProps {
  /** Button text */
  label: string;
  /** Link href (renders as Link if provided) */
  href?: string;
  /** onClick handler (renders as button if provided) */
  onClick?: () => void;
  /** Button type */
  type?: "button" | "submit" | "reset";
  /** CTA variant */
  variant?: CtaVariant;
  /** Full width */
  fullWidth?: boolean;
  /** Additional className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export interface DiscoveryCard {
  id: string;
  label: string;
  hint?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ShortcutChip {
  id: string;
  label: string;
  href: string;
  variant?: ChipVariant;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface PartnerSectionProps {
  /** Enable/disable section */
  enabled?: boolean;
  /** Language */
  lang: Lang;
  /** Surface type */
  surface: Surface;
  /** Eyebrow text */
  eyebrow: string;
  /** Section title */
  title: string;
  /** Body text */
  body: string;
  /** Supporting line text */
  supportingLine?: string;
  /** Chips to display */
  chips?: string[];
  /** Primary CTA */
  primaryCta?: {
    label: string;
    href: string;
  };
  /** Secondary CTA */
  secondaryCta?: {
    label: string;
    href: string;
  };
}

export interface DiscoveryGridProps {
  /** Section heading */
  heading: string;
  /** Section subtitle */
  subtitle?: string;
  /** Discovery cards */
  items: DiscoveryCard[];
  /** Surface type */
  surface: Surface;
}

export interface ShortcutSectionProps {
  /** Section title */
  title: string;
  /** Section subtitle */
  subtitle?: string;
  /** Shortcut chips */
  chips: ShortcutChip[];
  /** Surface type */
  surface: Surface;
}

export interface VisibilityStripProps {
  /** Language */
  lang: Lang;
  /** Surface type */
  surface: Surface;
  /** Allow on results (default false) */
  allowOnResults?: boolean;
  /** Eyebrow text */
  eyebrow?: string;
  /** Title text */
  title?: string;
  /** Body text */
  body?: string;
  /** CTA label */
  ctaLabel?: string;
  /** CTA href */
  ctaHref?: string;
}

export interface ActiveFilterChip {
  id: string;
  label: string;
  onClear?: () => void;
  href?: string;
}

export interface ActiveFiltersProps {
  /** Label for active filters section */
  label: string;
  /** Active filter chips */
  chips: ActiveFilterChip[];
  /** Clear all button label */
  clearAllLabel?: string;
  /** Clear all handler */
  onClearAll?: () => void;
}

export interface ResultsToolbarProps {
  /** Result count text */
  countText: string;
  /** Result count number */
  resultCount: number;
  /** Sort select slot */
  sortSlot?: React.ReactNode;
  /** View toggle slot */
  viewToggleSlot?: React.ReactNode;
  /** Per page slot */
  perPageSlot?: React.ReactNode;
  /** Filters button slot */
  filtersButtonSlot?: React.ReactNode;
  /** Clear all button slot */
  clearAllButtonSlot?: React.ReactNode;
}

export interface CompactEmptyStateProps {
  /** Empty state title */
  title: string;
  /** Empty state body */
  body?: string;
  /** CTA label (max one) */
  ctaLabel?: string;
  /** CTA href */
  ctaHref?: string;
  /** CTA onClick */
  ctaOnClick?: () => void;
}
