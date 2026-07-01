/** Leonix public browse UI — Rentas landing + results only. */
export const RENTAS_PUBLIC_SHELL =
  "relative mx-auto w-full min-w-0 max-w-[1080px] px-3.5 pb-12 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-4 sm:pt-4 lg:px-5";

/** Shared vertical rhythm for Rentas landing sections — one aligned lane. */
export const RENTAS_LANDING_LANE = "mx-auto w-full min-w-0 max-w-[1080px]";

export const RENTAS_LANDING_SECTION =
  "rounded-xl border border-[#D6C7AD]/55 bg-[#FFFDF7]/95 shadow-[0_6px_24px_-18px_rgba(42,36,22,0.14)]";

export const RENTAS_LANDING_SECTION_PAD = "px-4 py-4 sm:px-5 sm:py-5";

export const RENTAS_SEARCH_CANVAS =
  "overflow-hidden rounded-xl border border-[#D6C7AD]/90 bg-[#FFFDF7] shadow-[0_6px_22px_-16px_rgba(31,36,28,0.16)]";

export const RENTAS_LANDING_SEARCH_CANVAS =
  "overflow-hidden rounded-xl border border-[#C9A84A]/35 bg-[#FFFDF7]/98 p-2 shadow-[0_10px_32px_-20px_rgba(42,36,22,0.22)] sm:p-2.5";

export const RENTAS_SEARCH_INPUT =
  "min-h-[2.75rem] min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-[#1F241C] outline-none placeholder:text-[#3D3428]/45";

export const RENTAS_LANDING_FIELD =
  "flex min-h-[2.75rem] min-w-0 items-center rounded-lg border border-[#D6C7AD]/75 bg-white/90";

export const RENTAS_BTN_PRIMARY =
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45";

export const RENTAS_BTN_SECONDARY =
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3.5 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/35";

export const RENTAS_CHIP =
  "inline-flex h-[32px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#C9A84A]/45 bg-[#FBF7EF] px-3 text-[11px] font-semibold leading-none text-[#3D3428] transition hover:border-[#C9A84A]/70 hover:bg-[#FFFDF7] hover:shadow-[0_4px_12px_-8px_rgba(201,168,74,0.35)] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/40 sm:text-xs";

export const RENTAS_LANDING_CHIP =
  "inline-flex h-[34px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536] transition hover:border-[#C9A84A]/65 hover:from-[#FFFDF7] hover:to-[#FFF9F0] hover:shadow-[0_4px_14px_-8px_rgba(122,30,44,0.18)]";

export const RENTAS_FIELD =
  "mt-1 w-full min-h-[2.625rem] rounded-lg border border-[#D6C7AD]/90 bg-white px-3 text-sm text-[#1F241C] outline-none focus:border-[#C9A84A]/70 focus:ring-2 focus:ring-[#C9A84A]/20";

export function rentasBrowseSearchPlaceholder(lang: "es" | "en"): string {
  return lang === "es"
    ? "Buscar cuarto, garage, estudio, apartamento…"
    : "Search room, garage, studio, apartment…";
}
