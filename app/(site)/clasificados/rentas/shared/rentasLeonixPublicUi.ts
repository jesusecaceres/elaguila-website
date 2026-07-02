/** Leonix public browse UI — Rentas landing + results only. */

/** Below global `(site)/layout` Navbar — Rentas-only; do not edit global header. */
export const RENTAS_HEADER_SAFE_TOP =
  "pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-12 lg:pt-14";

/** Results / shared browse lane */
export const RENTAS_PUBLIC_SHELL =
  "relative mx-auto w-full min-w-0 max-w-[1280px] px-3.5 pb-12 sm:px-4 lg:px-5";

/** Landing gateway — wide premium canvas (v4: 1280px) */
export const RENTAS_LANDING_LANE = "mx-auto w-full min-w-0 max-w-[1280px]";

/** Results page shell lane — matches landing top breathing room */
export const RENTAS_RESULTS_SHELL =
  `${RENTAS_PUBLIC_SHELL} ${RENTAS_HEADER_SAFE_TOP}`;

export const RENTAS_RESULTS_PAGE_BG =
  "min-h-screen overflow-x-hidden bg-[#FAF6EE] pb-20 text-[#1F241C]";

/** Shared search shell — landing + results DNA */
export const RENTAS_SEARCH_SHELL =
  "relative overflow-hidden rounded-xl border border-[#C9A84A]/30 bg-[#FFFDF7]/98 p-2.5 shadow-[0_10px_32px_-18px_rgba(42,36,22,0.2),inset_0_1px_0_rgba(255,255,255,0.85)] sm:p-3";

/** Landing variant — warmer, larger presence */
export const RENTAS_SEARCH_SHELL_LANDING =
  "relative overflow-hidden rounded-2xl border-2 border-[#C9A84A]/50 bg-[#FFFDF7] p-3.5 shadow-[0_20px_56px_-22px_rgba(42,36,22,0.32),0_0_0_1px_rgba(201,168,74,0.18),inset_0_1px_0_rgba(255,255,255,0.98)] sm:p-5";

export const RENTAS_SEARCH_SHELL_GLOW =
  "pointer-events-none absolute -inset-px rounded-xl bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(201,168,74,0.14),transparent_65%)]";

export const RENTAS_SEARCH_SHELL_GLOW_LANDING =
  "pointer-events-none absolute -inset-px rounded-2xl bg-[radial-gradient(ellipse_100%_70%_at_50%_0%,rgba(201,168,74,0.28),transparent_58%)]";

export const RENTAS_LANDING_SECTION =
  "rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)]";

export const RENTAS_LANDING_SECTION_PAD = "px-4 py-5 sm:px-6 sm:py-6";

export const RENTAS_LANDING_GATEWAY_PAD = "px-4 py-6 sm:px-7 sm:py-7";

/** @deprecated use RENTAS_SEARCH_SHELL */
export const RENTAS_SEARCH_CANVAS = RENTAS_SEARCH_SHELL;

/** @deprecated use RENTAS_SEARCH_SHELL */
export const RENTAS_LANDING_SEARCH_CANVAS = RENTAS_SEARCH_SHELL;

export const RENTAS_SEARCH_FIELD =
  "flex min-h-[2.75rem] min-w-0 items-center rounded-lg border border-[#D6C7AD]/70 bg-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]";

export const RENTAS_SEARCH_FIELD_LANDING =
  "flex min-h-[3rem] min-w-0 items-center rounded-xl border border-[#D6C7AD]/75 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_2px_8px_-6px_rgba(42,36,22,0.12)] sm:min-h-[3.125rem]";

/** @deprecated use RENTAS_SEARCH_FIELD */
export const RENTAS_LANDING_FIELD = RENTAS_SEARCH_FIELD;

export const RENTAS_SEARCH_INPUT =
  "min-h-[2.75rem] min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-[#1F241C] outline-none placeholder:text-[#3D3428]/45 focus-visible:ring-0";

export const RENTAS_SEARCH_INPUT_LANDING =
  "min-h-[3rem] min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[0.9375rem] text-[#1F241C] outline-none placeholder:text-[#3D3428]/50 focus-visible:ring-0 sm:min-h-[3.125rem] sm:text-base";

export const RENTAS_BTN_PRIMARY =
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] shadow-[0_4px_14px_-6px_rgba(122,30,44,0.35)] transition hover:bg-[#5e1721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45";

export const RENTAS_BTN_PRIMARY_LANDING =
  "inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[#7A1E2C] px-5 text-sm font-bold text-[#FFFDF7] shadow-[0_6px_20px_-8px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 sm:min-h-[3.125rem] sm:text-[0.9375rem]";

export const RENTAS_BTN_SECONDARY =
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3.5 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/35";

export const RENTAS_BTN_SECONDARY_LANDING =
  "inline-flex min-h-[3rem] items-center justify-center rounded-xl border border-[#C9A84A]/60 bg-[#FFFDF7] px-4 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/35 sm:min-h-[3.125rem]";

export const RENTAS_LANDING_CHIP =
  "inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536] transition hover:border-[#C9A84A]/65 hover:from-[#FFFDF7] hover:to-[#FFF9F0] hover:shadow-[0_4px_14px_-8px_rgba(122,30,44,0.18)]";

export const RENTAS_BUDGET_CHIP =
  "inline-flex h-[38px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#C9A84A]/55 bg-gradient-to-br from-[#FFF9F0] via-[#FFFDF7] to-[#FBF7EF] px-4 text-xs font-bold text-[#2A4536] shadow-[0_3px_10px_-4px_rgba(201,168,74,0.3)] transition hover:border-[#C9A84A]/80 hover:shadow-[0_6px_18px_-6px_rgba(201,168,74,0.38)]";

export const RENTAS_PRACTICAL_CHIP =
  "inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#556B3E]/30 bg-gradient-to-b from-[#F8FAF6] to-[#FFFDF7] px-4 text-xs font-semibold text-[#2A4536] transition hover:border-[#556B3E]/45 hover:shadow-[0_4px_12px_-8px_rgba(85,107,62,0.22)]";

export const RENTAS_CHIP = RENTAS_LANDING_CHIP;

export const RENTAS_FIELD =
  "mt-1 w-full min-h-[2.625rem] rounded-lg border border-[#D6C7AD]/90 bg-white px-3 text-sm text-[#1F241C] outline-none focus:border-[#C9A84A]/70 focus:ring-2 focus:ring-[#C9A84A]/20";

export function rentasBrowseSearchPlaceholder(lang: "es" | "en"): string {
  return lang === "es"
    ? "Buscar cuarto, garage, estudio, apartamento…"
    : "Search room, garage, studio, apartment…";
}
