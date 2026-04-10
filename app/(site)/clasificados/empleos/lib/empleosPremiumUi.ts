/**
 * Shared visual tokens for Empleos premium polish (Tailwind class fragments).
 * Keeps landing / results / detail feeling like one category system.
 */

/** Form controls — 44px min touch target, warm field surface. */
export const EMPLEOS_FIELD =
  "min-h-[44px] w-full rounded-xl border border-[#E5DCCD] bg-[#FFFBF7] px-3 text-sm text-[#2A2826] outline-none transition focus:border-[#D9A23A]/75 focus:ring-4 focus:ring-[#D9A23A]/14";

/** Primary gold CTA — single hierarchy for conversion actions. */
export const EMPLEOS_CTA_PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[#E8A54B] via-[#D9A23A] to-[#C9942E] px-5 text-sm font-bold text-[#2A2826] shadow-[0_10px_28px_rgba(201,148,46,0.28)] transition hover:brightness-[1.04] active:scale-[0.99]";

/** Secondary / charcoal action (filters, clear). */
export const EMPLEOS_CTA_SECONDARY =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#2F3438] px-5 text-sm font-bold text-[#FFFBF5] shadow-[0_8px_22px_rgba(47,52,56,0.2)] transition hover:bg-[#252a2e] active:scale-[0.99]";

/** Muted text link (tertiary navigation). */
export const EMPLEOS_LINK_MUTED = "text-sm font-semibold text-[#4F6B82] underline-offset-2 transition hover:text-[#2A2826] hover:underline";

/** Standard job card shell. */
export const EMPLEOS_CARD_STANDARD =
  "rounded-2xl border border-[#E8DFD0] bg-white shadow-[0_10px_34px_rgba(42,40,38,0.06)] transition hover:border-[#D9A23A]/35 hover:shadow-[0_14px_42px_rgba(42,40,38,0.09)]";

/** Featured tier — subtle gold ring, no loud borders. */
export const EMPLEOS_CARD_FEATURED =
  "rounded-2xl border border-[#E8DFD0] bg-white ring-1 ring-[#E8C56A]/45 shadow-[0_14px_42px_rgba(42,40,38,0.085)] transition hover:ring-[#D9A23A]/55 hover:shadow-[0_18px_48px_rgba(42,40,38,0.1)]";

/** Promoted / plus visibility — slightly richer emphasis than featured. */
export const EMPLEOS_CARD_PROMOTED =
  "rounded-2xl border border-[#E5D4B8] bg-white ring-1 ring-amber-300/55 shadow-[0_16px_46px_rgba(180,130,40,0.11)] transition hover:ring-amber-400/45 hover:shadow-[0_20px_52px_rgba(180,130,40,0.13)]";

/** Trust: verified employer (restrained green). */
export const EMPLEOS_BADGE_VERIFIED =
  "rounded-full border border-emerald-200/80 bg-[#F0FAF3] px-2.5 py-1 text-[11px] font-semibold text-[#166534]";

/** Trust: premium business (warm gold, not blue). */
export const EMPLEOS_BADGE_PREMIUM =
  "rounded-full border border-amber-200/90 bg-[#FFF8ED] px-2.5 py-1 text-[11px] font-semibold text-[#7A5210]";

/** Quick apply — muted blue accent, single use case. */
export const EMPLEOS_BADGE_QUICK =
  "rounded-full border border-sky-200/80 bg-[#F4F9FC] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#3D5A73]";
