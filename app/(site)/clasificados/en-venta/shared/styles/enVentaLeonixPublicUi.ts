/** Leonix public browse UI tokens — En Venta landing + results only. */
export const EV_PUBLIC_SHELL =
  "relative mx-auto w-full min-w-0 max-w-[1080px] px-3.5 pb-12 sm:px-4 sm:pt-3 lg:px-5 lg:pt-4";

export const EV_SEARCH_CANVAS =
  "overflow-hidden rounded-xl border border-[#D6C7AD]/90 bg-[#FFFDF7] shadow-[0_6px_22px_-16px_rgba(31,36,28,0.16)]";

export const EV_SEARCH_INPUT =
  "min-h-[2.625rem] min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-[#1F241C] outline-none placeholder:text-[#3D3428]/45";

export const EV_SEARCH_CELL =
  "flex min-h-[2.625rem] min-w-0 items-center border-[#D6C7AD]/80";

export const EV_BTN_PRIMARY =
  "inline-flex min-h-[2.625rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45";

export const EV_BTN_SECONDARY =
  "inline-flex min-h-[2.625rem] items-center justify-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3.5 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/35";

export const EV_CHIP =
  "inline-flex h-[30px] max-w-full shrink-0 snap-start items-center justify-center rounded-md border border-[#C9A84A]/45 bg-[#FBF7EF] px-2.5 text-[11px] font-semibold leading-none text-[#3D3428] transition hover:border-[#C9A84A]/70 hover:bg-[#FFFDF7] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/40 sm:text-xs";

export const EV_CHIP_FEATURED =
  "inline-flex h-[30px] max-w-full shrink-0 snap-start items-center gap-1 rounded-md border border-[#C9A84A]/50 bg-[#FFFDF7] px-2.5 text-[11px] font-semibold leading-none text-[#8A6B1F] shadow-sm transition hover:border-[#C9A84A]/70 focus-visible:ring-2 focus-visible:ring-[#C9A84A]/40 sm:text-xs";

export const EV_ACTIVE_FILTER_CHIP =
  "inline-flex h-[30px] max-w-full shrink-0 snap-start items-center gap-1 rounded-md border border-[#C9A84A]/40 bg-[#FBF7EF] px-2.5 text-[11px] font-semibold text-[#3D3428] hover:border-[#C9A84A]/60 focus-visible:ring-2 focus-visible:ring-[#C9A84A]/40 sm:text-xs";

export function enVentaBrowseSearchPlaceholder(lang: "es" | "en"): string {
  return lang === "es"
    ? "Buscar título, descripción, categoría…"
    : "Search title, description, category…";
}
