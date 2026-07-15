/**
 * Category Standard V2 Visual Constants
 * 
 * These constants are exact copies from the Rentas/Bienes visual system.
 * They preserve the literal CSS classes to ensure visual consistency across categories.
 * 
 * Source: app/(site)/clasificados/rentas/shared/rentasLeonixPublicUi.ts
 * Source: app/(site)/clasificados/bienes-raices/shared/bienesRaicesLeonixPublicUi.ts
 */

// ============================================================================
// PAGE SHELL
// ============================================================================

/** Safe top spacing below global navbar */
export const LEONIX_HEADER_SAFE_TOP =
  "pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-12 lg:pt-14";

/** Landing page content lane (width only) */
export const LEONIX_LANDING_LANE = "mx-auto w-full min-w-0 max-w-[1280px]";

/** Landing page content lane with horizontal padding */
export const LEONIX_LANDING_SHELL =
  "relative mx-auto w-full min-w-0 max-w-[1280px] px-3.5 pb-14 sm:px-5 lg:px-6";

/** Results page shell lane — matches Rentas/Bienes safe centered lane */
export const LEONIX_RESULTS_SHELL =
  "relative mx-auto w-full min-w-0 max-w-[1280px] px-3.5 pb-12 sm:px-5 lg:px-6";

/** Results page background */
export const LEONIX_RESULTS_PAGE_BG =
  "min-h-screen overflow-x-hidden bg-[#FAF6EE] pb-20 text-[#1F241C]";

/** Landing page background with texture */
export const LEONIX_LANDING_BG = "bg-[#F3EBDD] text-[#1F241C]";

/** Radial gradient texture layer */
export const LEONIX_TEXTURE_RADIAL =
  "bg-[radial-gradient(ellipse_110%_75%_at_50%_-8%,rgba(201,168,74,0.22),transparent_52%),radial-gradient(ellipse_65%_45%_at_100%_0%,rgba(85,107,62,0.1),transparent_48%),radial-gradient(ellipse_60%_40%_at_0%_25%,rgba(122,30,44,0.06),transparent_42%)]";

/** Subtle grid texture layer */
export const LEONIX_TEXTURE_GRID = "opacity-[0.045]";

// ============================================================================
// HERO GATEWAY
// ============================================================================

/** Gateway panel padding */
export const LEONIX_GATEWAY_PAD = "px-4 py-6 sm:px-7 sm:py-7";

/** Gateway panel - integrated hero/search/tiles composition */
export const LEONIX_GATEWAY_PANEL =
  "relative w-full overflow-hidden rounded-xl border border-[#C9A84A]/40 bg-[#FFFDF7]/88 shadow-[0_16px_48px_-24px_rgba(42,36,22,0.28)] backdrop-blur-[2px] sm:rounded-2xl";

/** Icon wrapper in gateway */
export const LEONIX_GATEWAY_ICON =
  "inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#C9A84A]/45 bg-white/90 text-[#2A4536] shadow-[0_8px_28px_-10px_rgba(201,168,74,0.45)]";

/** Eyebrow text */
export const LEONIX_EYEBROW =
  "text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]";

/** H1 title */
export const LEONIX_H1 =
  "mt-2 font-serif text-[2.1rem] font-bold leading-[1.1] text-[#2A4536] sm:text-[2.5rem] lg:text-[2.65rem]";

/** Tagline */
export const LEONIX_TAGLINE =
  "mt-2 font-serif text-lg font-semibold italic text-[#7A1E2C] sm:text-xl";

/** Intro paragraph */
export const LEONIX_INTRO =
  "mt-3 max-w-3xl text-[0.9375rem] leading-relaxed text-[#3D3428] sm:text-base";

/** Secondary intro paragraph */
export const LEONIX_INTRO_SECONDARY =
  "mt-1.5 max-w-3xl text-sm leading-relaxed text-[#5C5346]";

/** Search slot container */
export const LEONIX_SEARCH_SLOT = "relative mt-5 min-w-0 sm:mt-6";

// ============================================================================
// SEARCH CANVAS
// ============================================================================

/** Shared search shell - landing + results DNA */
export const LEONIX_SEARCH_SHELL =
  "relative overflow-hidden rounded-xl border border-[#C9A84A]/35 bg-[#FFFDF7] p-3 shadow-[0_12px_36px_-18px_rgba(42,36,22,0.22),inset_0_1px_0_rgba(255,255,255,0.95)] sm:p-3.5";

/** Landing variant - warmer, larger presence */
export const LEONIX_SEARCH_SHELL_LANDING =
  "relative overflow-hidden rounded-2xl border-2 border-[#C9A84A]/50 bg-[#FFFDF7] p-3.5 shadow-[0_20px_56px_-22px_rgba(42,36,22,0.32),0_0_0_1px_rgba(201,168,74,0.18),inset_0_1px_0_rgba(255,255,255,0.98)] sm:p-5";

/** Search shell glow */
export const LEONIX_SEARCH_SHELL_GLOW =
  "pointer-events-none absolute -inset-px rounded-xl bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(201,168,74,0.14),transparent_65%)]";

/** Landing search shell glow */
export const LEONIX_SEARCH_SHELL_GLOW_LANDING =
  "pointer-events-none absolute -inset-px rounded-2xl bg-[radial-gradient(ellipse_100%_70%_at_50%_0%,rgba(201,168,74,0.28),transparent_58%)]";

/** Hero search anchor inside gateway panel */
export const LEONIX_HERO_SEARCH_SHELL =
  "relative w-full rounded-xl bg-white/96 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_28px_-16px_rgba(42,36,22,0.18)] ring-1 ring-[#C9A84A]/30 sm:p-4 sm:rounded-2xl";

/** Hero search glow */
export const LEONIX_HERO_SEARCH_GLOW =
  "pointer-events-none absolute -inset-px rounded-xl bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(201,168,74,0.2),transparent_60%)] sm:rounded-2xl";

/** Results refine panel */
export const LEONIX_RESULTS_REFINE_PANEL =
  "rounded-2xl border border-[#C9A84A]/40 bg-[#FFFDF7]/88 p-4 shadow-[0_16px_48px_-24px_rgba(42,36,22,0.22)] sm:p-5";

/** Search field */
export const LEONIX_SEARCH_FIELD =
  "flex min-h-[2.875rem] min-w-0 items-center rounded-lg border border-[#D6C7AD]/70 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]";

/** Landing search field */
export const LEONIX_SEARCH_FIELD_LANDING =
  "flex min-h-[3rem] min-w-0 items-center rounded-xl border border-[#D6C7AD]/75 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_2px_8px_-6px_rgba(42,36,22,0.12)] sm:min-h-[3.125rem]";

/** Search input */
export const LEONIX_SEARCH_INPUT =
  "min-h-[2.875rem] min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-[#1F241C] outline-none placeholder:text-[#3D3428]/45 focus-visible:ring-0";

/** Landing search input */
export const LEONIX_SEARCH_INPUT_LANDING =
  "min-h-[3rem] min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[0.9375rem] text-[#1F241C] outline-none placeholder:text-[#3D3428]/50 focus-visible:ring-0 sm:min-h-[3.125rem] sm:text-base";

// ============================================================================
// CTA BUTTONS
// ============================================================================

/** Primary CTA button */
export const LEONIX_BTN_PRIMARY =
  "inline-flex min-h-[2.875rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] shadow-[0_4px_14px_-6px_rgba(122,30,44,0.35)] transition hover:bg-[#5e1721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45";

/** Landing primary CTA button */
export const LEONIX_BTN_PRIMARY_LANDING =
  "inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[#7A1E2C] px-5 text-sm font-bold text-[#FFFDF7] shadow-[0_12px_24px_-16px_rgba(122,30,44,0.65)] transition hover:bg-[#5e1721] hover:shadow-[0_16px_28px_-16px_rgba(122,30,44,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 sm:min-h-[3.125rem]";

/** Secondary CTA button */
export const LEONIX_BTN_SECONDARY =
  "inline-flex min-h-[2.875rem] items-center justify-center gap-1.5 rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3.5 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/35";

/** Landing secondary CTA button */
export const LEONIX_BTN_SECONDARY_LANDING =
  "inline-flex min-h-[3rem] items-center justify-center gap-1.5 rounded-xl border border-[#C9A84A]/60 bg-[#FFFDF7] px-4 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/35 sm:min-h-[3.125rem]";

/** Disabled placeholder that preserves the landing primary CTA slot */
export const LEONIX_BTN_PRIMARY_PLACEHOLDER =
  "inline-flex min-h-[3rem] items-center justify-center rounded-xl border border-dashed border-[#C9A84A]/55 bg-[#FFFDF7]/70 px-5 text-sm font-bold text-[#5C5346]/65 sm:min-h-[3.125rem]";

// ============================================================================
// LANDING SECTIONS
// ============================================================================

/** Landing section wrapper */
export const LEONIX_LANDING_SECTION =
  "rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)]";

/** Landing section padding */
export const LEONIX_LANDING_SECTION_PAD = "px-4 py-5 sm:px-6 sm:py-6";

/** Intent tiles zone inside gateway */
export const LEONIX_LANDING_TILES_INTEGRATED = "relative pt-5 sm:pt-6";

/** Intent tiles accent divider */
export const LEONIX_LANDING_TILES_ACCENT =
  "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A84A]/45 to-transparent";

// ============================================================================
// CHIPS
// ============================================================================

/** Default landing chip */
export const LEONIX_LANDING_CHIP =
  "inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536] transition hover:border-[#C9A84A]/65 hover:from-[#FFFDF7] hover:to-[#FFF9F0] hover:shadow-[0_4px_14px_-8px_rgba(122,30,44,0.18)]";

/** Budget/gold chip */
export const LEONIX_BUDGET_CHIP =
  "inline-flex h-[38px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#C9A84A]/55 bg-gradient-to-br from-[#FFF9F0] via-[#FFFDF7] to-[#FBF7EF] px-4 text-xs font-bold text-[#2A4536] shadow-[0_3px_10px_-4px_rgba(201,168,74,0.3)] transition hover:border-[#C9A84A]/80 hover:shadow-[0_6px_18px_-6px_rgba(201,168,74,0.38)]";

/** Practical/olive chip */
export const LEONIX_PRACTICAL_CHIP =
  "inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#556B3E]/30 bg-gradient-to-b from-[#F8FAF6] to-[#FFFDF7] px-4 text-xs font-semibold text-[#2A4536] transition hover:border-[#556B3E]/45 hover:shadow-[0_4px_12px_-8px_rgba(85,107,62,0.22)]";

// ============================================================================
// DISCOVERY GRID
// ============================================================================

/** Discovery grid */
export const LEONIX_DISCOVERY_GRID = "mt-4 grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4";

/** Discovery card */
export const LEONIX_DISCOVERY_CARD =
  "group flex min-h-[4.75rem] min-w-0 flex-col rounded-xl border bg-gradient-to-br p-3 shadow-[0_4px_18px_-12px_rgba(42,36,22,0.18)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 sm:min-h-[5rem]";

/** Discovery card icon */
export const LEONIX_DISCOVERY_ICON =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 transition sm:h-9 sm:w-9";

/** Discovery card label */
export const LEONIX_DISCOVERY_LABEL =
  "mt-2.5 font-serif text-sm font-bold leading-tight text-[#2A4536] group-hover:text-[#7A1E2C]";

/** Discovery card hint */
export const LEONIX_DISCOVERY_HINT =
  "mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#5C5346]/85 sm:text-[11px]";

// ============================================================================
// SHORTCUT SECTIONS
// ============================================================================

/** Shortcut sections wrapper */
export const LEONIX_SHORTCUT_SECTIONS = "mt-6 space-y-5 sm:mt-7";

/** Shortcut section heading */
export const LEONIX_SHORTCUT_HEADING =
  "font-serif text-base font-bold text-[#2A4536] sm:text-lg";

/** Shortcut section subtitle */
export const LEONIX_SHORTCUT_SUBTITLE = "mt-1 text-xs text-[#5C5346]/85";

/** Shortcut chips row */
export const LEONIX_SHORTCUT_ROW =
  "flex min-w-0 snap-x snap-mandatory flex-nowrap gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:gap-2.5 [&::-webkit-scrollbar]:hidden";

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
export const LEONIX_ACTIVE_FILTERS_LABEL =
  "shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#556B3E]";

// ============================================================================
// RESULTS TOOLBAR
// ============================================================================

/** Results toolbar wrapper */
export const LEONIX_RESULTS_TOOLBAR_WRAPPER =
  "mt-6 border-t border-[#D6C7AD]/50 pt-4";

/** Results toolbar inner */
export const LEONIX_RESULTS_TOOLBAR_INNER =
  "rounded-xl border border-[#D6C7AD]/45 bg-[#FFFDF7]/90 px-4 py-3 sm:px-5";

/** Results count text */
export const LEONIX_RESULTS_COUNT =
  "text-sm leading-snug text-[#4A4338]";

/** Results count label */
export const LEONIX_RESULTS_COUNT_LABEL =
  "text-[10px] font-bold uppercase tracking-[0.12em] text-[#556B3E]";

/** Results count number */
export const LEONIX_RESULTS_COUNT_NUMBER =
  "font-semibold text-[#2A4536]";

/** Sort select */
export const LEONIX_SORT_SELECT =
  "min-h-[44px] rounded-lg border border-[#C9A84A]/50 bg-white px-4 py-2 text-sm font-semibold text-[#2A4536] shadow-sm outline-none focus:border-[#7A1E2C]/35 focus:ring-2 focus:ring-[#C9A84A]/25 sm:min-h-0";

/** View toggle group */
export const LEONIX_VIEW_TOGGLE_GROUP =
  "flex rounded-lg border border-[#C9A84A]/45 bg-[#FAF6EE] p-1";

/** View toggle button */
export const LEONIX_VIEW_TOGGLE_BUTTON =
  "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-2 transition sm:min-h-0 sm:min-w-0";

/** View toggle button active */
export const LEONIX_VIEW_TOGGLE_BUTTON_ACTIVE =
  "bg-white text-[#2A4536] shadow-sm";

/** View toggle button inactive */
export const LEONIX_VIEW_TOGGLE_BUTTON_INACTIVE =
  "text-[#5C5346] hover:text-[#2A4536]";

// ============================================================================
// COMPACT EMPTY STATE
// ============================================================================

/** Compact empty state */
export const LEONIX_COMPACT_EMPTY_STATE =
  "rounded-2xl border border-dashed border-[#D6C7AD]/70 bg-[#FFFDF7]/90 px-5 py-10 text-center sm:px-8 sm:py-12";

/** Empty state title */
export const LEONIX_EMPTY_TITLE =
  "font-serif text-lg font-semibold text-[#2A4536]";

/** Empty state body */
export const LEONIX_EMPTY_BODY =
  "mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#5C5346]";

/** Empty state CTA */
export const LEONIX_EMPTY_CTA =
  "mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#C9A84A]/60 bg-[#FFFDF7] px-6 text-sm font-semibold text-[#3D3428] shadow-sm transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/35";

// ============================================================================
// VISIBILITY STRIP
// ============================================================================

/** Visibility strip */
export const LEONIX_VISIBILITY_STRIP =
  "relative overflow-hidden";

/** Visibility strip gradient */
export const LEONIX_VISIBILITY_GRADIENT =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(201,168,74,0.1)_0%,rgba(255,253,247,0.96)_50%,rgba(85,107,62,0.06)_100%)]";

/** Visibility strip icon */
export const LEONIX_VISIBILITY_ICON =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#C9A84A]/45 bg-[#FFF9F0] text-[#C9A84A] shadow-sm";

/** Visibility strip eyebrow */
export const LEONIX_VISIBILITY_EYEBROW =
  "text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A1E2C]";

/** Visibility strip title */
export const LEONIX_VISIBILITY_TITLE =
  "mt-1 font-serif text-base font-bold leading-snug text-[#2A4536] sm:text-lg";

/** Visibility strip body */
export const LEONIX_VISIBILITY_BODY =
  "mt-1 max-w-2xl text-xs leading-relaxed text-[#5C5346] sm:text-sm";

/** Visibility strip CTA */
export const LEONIX_VISIBILITY_CTA =
  "inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-xl border border-[#7A1E2C]/35 bg-[#7A1E2C] px-5 text-center text-sm font-bold text-[#FFFDF7] shadow-[0_12px_24px_-16px_rgba(122,30,44,0.65)] transition hover:bg-[#5e1721] hover:shadow-[0_16px_28px_-16px_rgba(122,30,44,0.75)] sm:min-w-[13rem]";

// ============================================================================
// CARD ACCENTS (for discovery grid)
// ============================================================================

/** Burgundy accent */
export const LEONIX_ACCENT_BURGUNDY = {
  card: "from-[#7A1E2C]/14 via-white/95 to-white/88 border-[#7A1E2C]/30 hover:border-[#7A1E2C]/55 hover:shadow-[0_12px_32px_-14px_rgba(122,30,44,0.28)]",
  icon: "bg-[#7A1E2C]/14 text-[#7A1E2C] ring-[#7A1E2C]/25",
  ring: "group-hover:ring-[#7A1E2C]/35",
} as const;

/** Green accent */
export const LEONIX_ACCENT_GREEN = {
  card: "from-[#556B3E]/14 via-white/95 to-white/88 border-[#556B3E]/30 hover:border-[#556B3E]/50 hover:shadow-[0_12px_32px_-14px_rgba(85,107,62,0.24)]",
  icon: "bg-[#556B3E]/14 text-[#556B3E] ring-[#556B3E]/22",
  ring: "group-hover:ring-[#556B3E]/32",
} as const;

/** Gold accent */
export const LEONIX_ACCENT_GOLD = {
  card: "from-[#C9A84A]/16 via-white/95 to-white/88 border-[#C9A84A]/40 hover:border-[#C9A84A]/65 hover:shadow-[0_12px_32px_-14px_rgba(201,168,74,0.3)]",
  icon: "bg-[#C9A84A]/16 text-[#B8954A] ring-[#C9A84A]/28",
  ring: "group-hover:ring-[#C9A84A]/40",
} as const;
