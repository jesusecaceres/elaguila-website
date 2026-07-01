/**
 * Shared visual tokens for Empleos premium polish (Tailwind class fragments).
 * Keeps landing / results / detail feeling like one category system.
 */

/** Form controls — 44px min touch target, warm field surface. */
export const EMPLEOS_FIELD =
  "min-h-[44px] w-full rounded-xl border border-[#E5DCCD] bg-[#FFFBF7] px-3 text-sm text-[#2A2826] outline-none transition focus:border-[#D9A23A]/75 focus:ring-4 focus:ring-[#D9A23A]/14";

/** Primary CTA — burgundy, matches detail page apply button. */
export const EMPLEOS_CTA_PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#7A1E2C]/15 bg-[#7A1E2C] px-5 text-sm font-bold text-[#FFFCF7] shadow-[0_8px_20px_-6px_rgba(122,30,44,0.38)] transition hover:bg-[#5e1721] active:scale-[0.99]";

/** Secondary / charcoal action (filters, clear). */
export const EMPLEOS_CTA_SECONDARY =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#2F3438] px-5 text-sm font-bold text-[#FFFBF5] shadow-[0_8px_22px_rgba(47,52,56,0.2)] transition hover:bg-[#252a2e] active:scale-[0.99]";

/** Muted text link (tertiary navigation). */
export const EMPLEOS_LINK_MUTED = "text-sm font-semibold text-[#4F6B82] underline-offset-2 transition hover:text-[#2A2826] hover:underline";

/** Standard job card shell. */
export const EMPLEOS_CARD_STANDARD =
  "rounded-xl border border-[#D6C7AD]/80 bg-[#FFFDF7] shadow-[0_10px_34px_-14px_rgba(31,36,28,0.18)] transition hover:border-[#C9A84A]/55 hover:shadow-[0_14px_42px_-12px_rgba(31,36,28,0.22)]";

/** Featured tier — subtle gold ring, cream surface. */
export const EMPLEOS_CARD_FEATURED =
  "rounded-xl border border-[#C9A84A]/55 bg-[#FFFDF7] ring-1 ring-[#C9A84A]/25 shadow-[0_14px_42px_-12px_rgba(31,36,28,0.2)] transition hover:ring-[#C9A84A]/55 hover:shadow-[0_18px_48px_-10px_rgba(31,36,28,0.24)]";

/** Promoted / plus visibility — gold ring emphasis, cream surface. */
export const EMPLEOS_CARD_PROMOTED =
  "rounded-xl border border-[#C9A84A]/70 bg-[#FFFDF7] ring-2 ring-[#C9A84A]/30 shadow-[0_16px_46px_-12px_rgba(122,30,44,0.12)] transition hover:ring-[#C9A84A]/55 hover:shadow-[0_20px_52px_-10px_rgba(122,30,44,0.15)]";

/** Trust: verified employer (restrained green). */
export const EMPLEOS_BADGE_VERIFIED =
  "rounded-full border border-emerald-200/80 bg-[#F0FAF3] px-2.5 py-1 text-[11px] font-semibold text-[#166534]";

/** Trust: premium business (warm gold, not blue). */
export const EMPLEOS_BADGE_PREMIUM =
  "rounded-full border border-amber-200/90 bg-[#FFF8ED] px-2.5 py-1 text-[11px] font-semibold text-[#7A5210]";

/** Quick apply — muted blue accent, single use case. */
export const EMPLEOS_BADGE_QUICK =
  "rounded-full border border-sky-200/80 bg-[#F4F9FC] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#3D5A73]";

/** Results page primary filter panel — matches landing card weight. */
export const EMPLEOS_RESULTS_FILTER_PANEL =
  "rounded-[1.5rem] border border-[#E8DFD0] bg-white p-5 shadow-[0_22px_60px_rgba(42,40,38,0.09)] ring-1 ring-[#D9A23A]/15 sm:p-7 lg:p-9";

/** Soft section grouping inside filter panel. */
export const EMPLEOS_RESULTS_GROUP =
  "rounded-2xl border border-[#F0E8DC]/90 bg-[#FFFBF7]/80 p-4 sm:p-5";
