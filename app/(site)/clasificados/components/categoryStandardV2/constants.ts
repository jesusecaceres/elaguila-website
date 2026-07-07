/**
 * Leonix Category Standard V2 - Visual Constants
 *
 * EXACT classes extracted from Rentas/Bienes Raíces visual system.
 * DO NOT modify these classes - they are the source of truth for the global template.
 *
 * Source files:
 * - app/(site)/clasificados/rentas/shared/rentasLeonixPublicUi.ts
 * - app/(site)/clasificados/bienes-raices/shared/bienesRaicesLeonixPublicUi.ts
 */

// ============================================================================
// PAGE SHELL
// ============================================================================

/** Safe top spacing below global navbar */
export const LEONIX_HEADER_SAFE_TOP =
  "pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-12 lg:pt-14";

/** Landing content lane - centered, max-width */
export const LEONIX_LANDING_LANE = "mx-auto w-full min-w-0 max-w-[1280px]";

/** Results/shell lane with safe top */
export const LEONIX_RESULTS_SHELL =
  "relative mx-auto w-full min-w-0 max-w-[1280px] px-3.5 pb-12 sm:px-4 lg:px-5 pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-12 lg:pt-14";

/** Landing page background color */
export const LEONIX_LANDING_BG = "bg-[#F3EBDD]";

/** Results page background color */
export const LEONIX_RESULTS_BG = "bg-[#FAF6EE]";

/** Primary text color */
export const LEONIX_TEXT_PRIMARY = "text-[#1F241C]";

// ============================================================================
// BACKGROUND TEXTURES
// ============================================================================

/** Radial gradient texture for landing/results */
export const LEONIX_RADIAL_TEXTURE =
  "bg-[radial-gradient(ellipse_110%_75%_at_50%_-8%,rgba(201,168,74,0.22),transparent_52%),radial-gradient(ellipse_65%_45%_at_100%_0%,rgba(85,107,62,0.1),transparent_48%),radial-gradient(ellipse_60%_40%_at_0%_25%,rgba(122,30,44,0.06),transparent_42%)]";

/** Subtle grid pattern texture */
export const LEONIX_GRID_TEXTURE =
  "opacity-[0.045] bg-[repeating-linear-gradient(90deg,#2A4536_0px,#2A4536_1px,transparent_1px,transparent_52px),repeating-linear-gradient(0deg,#2A4536_0px,#2A4536_1px,transparent_1px,transparent_52px)]";

// ============================================================================
// HERO GATEWAY
// ============================================================================

/** Gateway panel - landing */
export const LEONIX_LANDING_GATEWAY_PANEL =
  "relative w-full overflow-hidden rounded-xl border border-[#C9A84A]/40 bg-[#FFFDF7]/88 shadow-[0_16px_48px_-24px_rgba(42,36,22,0.28)] backdrop-blur-[2px] sm:rounded-2xl";

/** Gateway panel padding */
export const LEONIX_LANDING_GATEWAY_PAD = "px-4 py-6 sm:px-7 sm:py-7";

/** Icon wrapper in gateway */
export const LEONIX_GATEWAY_ICON =
  "inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#C9A84A]/45 bg-white/90 text-[#2A4536] shadow-[0_8px_28px_-10px_rgba(201,168,74,0.45)]";

/** Eyebrow text */
export const LEONIX_EYEBROW = "text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]";

/** Hero title */
export const LEONIX_HERO_TITLE =
  "mt-2 font-serif text-[2.1rem] font-bold leading-[1.1] text-[#2A4536] sm:text-[2.5rem] lg:text-[2.65rem]";

/** Hero tagline */
export const LEONIX_HERO_TAGLINE = "mt-2 font-serif text-lg font-semibold italic text-[#7A1E2C] sm:text-xl";

/** Hero intro text */
export const LEONIX_HERO_INTRO = "mt-3 max-w-3xl text-[0.9375rem] leading-relaxed text-[#3D3428] sm:text-base";

/** Hero secondary intro */
export const LEONIX_HERO_INTRO_SECONDARY = "mt-1.5 max-w-3xl text-sm leading-relaxed text-[#5C5346]";

// ============================================================================
// SEARCH CANVAS
// ============================================================================

/** Hero search shell inside gateway */
export const LEONIX_HERO_SEARCH_SHELL =
  "relative w-full rounded-xl bg-white/96 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_28px_-16px_rgba(42,36,22,0.18)] ring-1 ring-[#C9A84A]/30 sm:p-4 sm:rounded-2xl";

/** Hero search glow */
export const LEONIX_HERO_SEARCH_GLOW =
  "pointer-events-none absolute -inset-px rounded-xl bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(201,168,74,0.2),transparent_60%)] sm:rounded-2xl";

/** Search field (landing variant) */
export const LEONIX_SEARCH_FIELD_LANDING =
  "flex min-h-[3rem] min-w-0 items-center rounded-xl border border-[#D6C7AD]/75 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_2px_8px_-6px_rgba(42,36,22,0.12)] sm:min-h-[3.125rem]";

/** Search input (landing variant) */
export const LEONIX_SEARCH_INPUT_LANDING =
  "min-h-[3rem] min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[0.9375rem] text-[#1F241C] outline-none placeholder:text-[#3D3428]/50 focus-visible:ring-0 sm:min-h-[3.125rem] sm:text-base";

/** Grid gap for search canvas */
export const LEONIX_SEARCH_GRID_GAP = "gap-2.5 sm:gap-3";

// ============================================================================
// CTA BUTTONS
// ============================================================================

/** Primary CTA (landing) */
export const LEONIX_BTN_PRIMARY_LANDING =
  "inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[#7A1E2C] px-5 text-sm font-bold text-[#FFFDF7] shadow-[0_6px_20px_-8px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 sm:min-h-[3.125rem] sm:text-[0.9375rem]";

/** Secondary CTA (landing) */
export const LEONIX_BTN_SECONDARY_LANDING =
  "inline-flex min-h-[3rem] items-center justify-center gap-1.5 rounded-xl border border-[#C9A84A]/60 bg-[#FFFDF7] px-4 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/35 sm:min-h-[3.125rem]";

/** Primary CTA (compact/results) */
export const LEONIX_BTN_PRIMARY =
  "inline-flex min-h-[2.875rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] shadow-[0_4px_14px_-6px_rgba(122,30,44,0.35)] transition hover:bg-[#5e1721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45";

/** Secondary CTA (compact/results) */
export const LEONIX_BTN_SECONDARY =
  "inline-flex min-h-[2.875rem] items-center justify-center gap-1.5 rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3.5 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/35";

// ============================================================================
// LANDING SECTIONS
// ============================================================================

/** Landing section wrapper */
export const LEONIX_LANDING_SECTION =
  "rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)]";

/** Landing section padding */
export const LEONIX_LANDING_SECTION_PAD = "px-4 py-5 sm:px-6 sm:py-6";

/** Section heading */
export const LEONIX_SECTION_HEADING = "font-serif text-base font-bold text-[#2A4536] sm:text-lg";

/** Section subtitle */
export const LEONIX_SECTION_SUBTITLE = "mt-1 text-xs text-[#5C5346]/85";

// ============================================================================
// CHIPS
// ============================================================================

/** Default landing chip */
export const LEONIX_LANDING_CHIP =
  "inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536] transition hover:border-[#C9A84A]/65 hover:from-[#FFFDF7] hover:to-[#FFF9F0] hover:shadow-[0_4px_14px_-8px_rgba(122,30,44,0.18)]";

/** Budget chip (gold) */
export const LEONIX_BUDGET_CHIP =
  "inline-flex h-[38px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#C9A84A]/55 bg-gradient-to-br from-[#FFF9F0] via-[#FFFDF7] to-[#FBF7EF] px-4 text-xs font-bold text-[#2A4536] shadow-[0_3px_10px_-4px_rgba(201,168,74,0.3)] transition hover:border-[#C9A84A]/80 hover:shadow-[0_6px_18px_-6px_rgba(201,168,74,0.38)]";

/** Practical chip (olive) */
export const LEONIX_PRACTICAL_CHIP =
  "inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#556B3E]/30 bg-gradient-to-b from-[#F8FAF6] to-[#FFFDF7] px-4 text-xs font-semibold text-[#2A4536] transition hover:border-[#556B3E]/45 hover:shadow-[0_4px_12px_-8px_rgba(85,107,62,0.22)]";

// ============================================================================
// DISCOVERY GRID
// ============================================================================

/** Discovery grid layout */
export const LEONIX_DISCOVERY_GRID = "mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4";

/** Discovery card */
export const LEONIX_DISCOVERY_CARD =
  "group flex min-h-[4.75rem] flex-col rounded-xl border bg-gradient-to-br p-3 shadow-[0_4px_18px_-12px_rgba(42,36,22,0.18)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 sm:min-h-[5rem]";

/** Discovery card icon wrapper */
export const LEONIX_DISCOVERY_ICON =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 transition sm:h-9 sm:w-9";

/** Discovery card label */
export const LEONIX_DISCOVERY_LABEL = "mt-2.5 font-serif text-sm font-bold leading-tight text-[#2A4536] group-hover:text-[#7A1E2C]";

/** Discovery card hint */
export const LEONIX_DISCOVERY_HINT = "mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#5C5346]/85 sm:text-[11px]";

// ============================================================================
// SHORTCUT SECTIONS
// ============================================================================

/** Shortcut sections container */
export const LEONIX_SHORTCUT_SECTIONS = "mt-6 space-y-5 sm:mt-7";

/** Shortcut section with left border accent */
export const LEONIX_SHORTCUT_SECTION_BORDER = "border-l-[3px]";

/** Gold accent border */
export const LEONIX_SHORTCUT_BORDER_GOLD = "border-[#C9A84A]/55";

/** Olive accent border */
export const LEONIX_SHORTCUT_BORDER_OLIVE = "border-[#556B3E]/40";

/** Shortcut chips row */
export const LEONIX_SHORTCUT_ROW =
  "flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:gap-2.5 [&::-webkit-scrollbar]:hidden";

// ============================================================================
// ACTIVE FILTERS
// ============================================================================

/** Active filters panel */
export const LEONIX_ACTIVE_FILTERS_PANEL =
  "flex flex-col gap-2 rounded-xl border border-[#C9A84A]/30 bg-[#FFFDF7]/90 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2 sm:px-5";

/** Active filter chip */
export const LEONIX_ACTIVE_FILTER_CHIP =
  "inline-flex max-w-full items-center rounded-full border border-[#D6C7AD]/70 bg-white px-3 py-1 text-xs font-semibold text-[#2A4536] shadow-sm";

/** Active filters label */
export const LEONIX_ACTIVE_FILTERS_LABEL = "shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#556B3E]";

// ============================================================================
// RESULTS TOOLBAR
// ============================================================================

/** Results toolbar container */
export const LEONIX_RESULTS_TOOLBAR = "mt-6 border-t border-[#D6C7AD]/50 pt-4";

/** Results toolbar inner */
export const LEONIX_RESULTS_TOOLBAR_INNER =
  "rounded-xl border border-[#D6C7AD]/45 bg-[#FFFDF7]/90 px-4 py-3 sm:px-5";

/** Results count text */
export const LEONIX_RESULTS_COUNT = "text-sm leading-snug text-[#4A4338]";

/** Results count badge */
export const LEONIX_RESULTS_COUNT_BADGE = "text-[10px] font-bold uppercase tracking-[0.12em] text-[#556B3E]";

/** Results count number */
export const LEONIX_RESULTS_COUNT_NUMBER = "font-semibold text-[#2A4536]";

// ============================================================================
// COMPACT EMPTY STATE
// ============================================================================

/** Compact empty state container */
export const LEONIX_COMPACT_EMPTY_STATE =
  "rounded-[20px] border border-dashed border-[color:var(--lx-border)]/50 bg-[color:var(--lx-section)] px-5 py-10 text-center sm:px-8 sm:py-14 md:px-10";

/** Empty state title */
export const LEONIX_EMPTY_TITLE = "font-serif text-lg font-semibold text-[color:var(--lx-text)]";

/** Empty state body */
export const LEONIX_EMPTY_BODY = "mx-auto mt-3 max-w-md text-sm leading-relaxed text-[color:var(--lx-muted)]";

/** Empty state CTA */
export const LEONIX_EMPTY_CTA =
  "mt-6 inline-flex min-h-[44px] items-center justify-center rounded-[14px] border border-[#D97706]/45 bg-[color:var(--lx-card)] px-6 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[#D97706]/65 hover:bg-[color:var(--lx-section)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/50";

// ============================================================================
// VISIBILITY STRIP
// ============================================================================

/** Visibility strip container */
export const LEONIX_VISIBILITY_STRIP = LEONIX_LANDING_SECTION;

/** Visibility strip gradient overlay */
export const LEONIX_VISIBILITY_GRADIENT =
  "bg-[linear-gradient(120deg,rgba(201,168,74,0.1)_0%,rgba(255,253,247,0.96)_50%,rgba(85,107,62,0.06)_100%)]";

/** Visibility strip icon */
export const LEONIX_VISIBILITY_ICON =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#C9A84A]/45 bg-[#FFF9F0] text-[#C9A84A] shadow-sm";

/** Visibility strip eyebrow */
export const LEONIX_VISIBILITY_EYEBROW = "text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A1E2C]";

/** Visibility strip title */
export const LEONIX_VISIBILITY_TITLE = "mt-1 font-serif text-base font-bold leading-snug text-[#2A4536] sm:text-lg";

/** Visibility strip body */
export const LEONIX_VISIBILITY_BODY = "mt-1 max-w-2xl text-xs leading-relaxed text-[#5C5346] sm:text-sm";

/** Visibility strip CTA */
export const LEONIX_VISIBILITY_CTA =
  "inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-xl border border-[#7A1E2C]/35 bg-[#7A1E2C] px-5 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:min-w-[13rem]";
