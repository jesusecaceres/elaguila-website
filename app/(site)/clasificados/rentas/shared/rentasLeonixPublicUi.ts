/** Leonix public browse UI — Rentas landing + results only. */

export const RENTAS_PUBLIC_SHELL =
  "relative mx-auto w-full min-w-0 max-w-[1080px] px-3.5 pb-12 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-4 sm:pt-4 lg:px-5";

export const RENTAS_LANDING_LANE = "mx-auto w-full min-w-0 max-w-[1080px]";

/** Shared search shell — landing + results DNA. */
export const RENTAS_SEARCH_SHELL =
  "relative overflow-hidden rounded-xl border border-[#C9A84A]/30 bg-[#FFFDF7]/98 p-2 shadow-[0_10px_32px_-18px_rgba(42,36,22,0.2),inset_0_1px_0_rgba(255,255,255,0.85)] sm:p-2.5";

export const RENTAS_SEARCH_SHELL_GLOW =
  "pointer-events-none absolute -inset-px rounded-xl bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(201,168,74,0.14),transparent_65%)]";

export const RENTAS_LANDING_SECTION =
  "rounded-xl border border-[#D6C7AD]/55 bg-[#FFFDF7]/95 shadow-[0_6px_24px_-18px_rgba(42,36,22,0.14)]";

export const RENTAS_LANDING_SECTION_PAD = "px-4 py-4 sm:px-5 sm:py-5";

/** @deprecated use RENTAS_SEARCH_SHELL */
export const RENTAS_SEARCH_CANVAS = RENTAS_SEARCH_SHELL;

/** @deprecated use RENTAS_SEARCH_SHELL */
export const RENTAS_LANDING_SEARCH_CANVAS = RENTAS_SEARCH_SHELL;

export const RENTAS_SEARCH_FIELD =
  "flex min-h-[2.75rem] min-w-0 items-center rounded-lg border border-[#D6C7AD]/70 bg-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]";

/** @deprecated use RENTAS_SEARCH_FIELD */
export const RENTAS_LANDING_FIELD = RENTAS_SEARCH_FIELD;

export const RENTAS_SEARCH_INPUT =
  "min-h-[2.75rem] min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-[#1F241C] outline-none placeholder:text-[#3D3428]/45 focus-visible:ring-0";

export const RENTAS_BTN_PRIMARY =
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] shadow-[0_4px_14px_-6px_rgba(122,30,44,0.35)] transition hover:bg-[#5e1721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45";

export const RENTAS_BTN_SECONDARY =
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3.5 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/35";

export const RENTAS_LANDING_CHIP =
  "inline-flex h-[34px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536] transition hover:border-[#C9A84A]/65 hover:from-[#FFFDF7] hover:to-[#FFF9F0] hover:shadow-[0_4px_14px_-8px_rgba(122,30,44,0.18)]";

export const RENTAS_BUDGET_CHIP =
  "inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#C9A84A]/50 bg-gradient-to-br from-[#FFF9F0] via-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-bold text-[#2A4536] shadow-[0_2px_8px_-4px_rgba(201,168,74,0.25)] transition hover:border-[#C9A84A]/75 hover:shadow-[0_4px_16px_-6px_rgba(201,168,74,0.35)]";

export const RENTAS_PRACTICAL_CHIP =
  "inline-flex h-[34px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#556B3E]/25 bg-gradient-to-b from-[#F8FAF6] to-[#FFFDF7] px-3.5 text-xs font-semibold text-[#2A4536] transition hover:border-[#556B3E]/40 hover:shadow-[0_4px_12px_-8px_rgba(85,107,62,0.2)]";

export const RENTAS_CHIP = RENTAS_LANDING_CHIP;

export const RENTAS_FIELD =
  "mt-1 w-full min-h-[2.625rem] rounded-lg border border-[#D6C7AD]/90 bg-white px-3 text-sm text-[#1F241C] outline-none focus:border-[#C9A84A]/70 focus:ring-2 focus:ring-[#C9A84A]/20";

export function rentasBrowseSearchPlaceholder(lang: "es" | "en"): string {
  return lang === "es"
    ? "Buscar cuarto, garage, estudio, apartamento…"
    : "Search room, garage, studio, apartment…";
}
