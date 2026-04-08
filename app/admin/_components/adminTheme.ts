/** Leonix admin design tokens — light, warm operations HQ. */

export const adminPageBg =
  "min-h-screen bg-[#F7F0E4] text-[#2C2416] bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(201,180,106,0.18),transparent_55%),radial-gradient(ellipse_55%_40%_at_100%_30%,rgba(255,255,255,0.5),transparent_52%)]";

export const adminCardBase =
  "rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 shadow-[0_10px_36px_-14px_rgba(42,36,22,0.12)]";

export const adminCardMuted =
  "rounded-3xl border border-[#F0DCC8]/80 bg-gradient-to-br from-[#FFF8F3] to-[#FFFCF7] shadow-[0_8px_28px_-12px_rgba(180,140,100,0.15)]";

export const adminInputClass =
  "w-full rounded-2xl border border-[#E8DFD0] bg-white/95 px-4 py-2.5 text-sm text-[#1E1810] placeholder:text-[#9A9084] outline-none focus:border-[#C9B46A] focus:ring-2 focus:ring-[#D4BC6A]/50";

export const adminBtnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-4 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md transition hover:brightness-[1.03] active:scale-[0.99]";

export const adminBtnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8DFD0] bg-white px-4 py-2.5 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]";

export const adminBtnDark =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2A2620] px-4 py-2.5 text-sm font-semibold text-[#FAF7F2] shadow-md hover:bg-[#1a1814]";

/** Shared focus ring for chip-style admin links (warm offset matches cards). */
export const adminCtaFocusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B46A]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFCF7]";

/**
 * Primary admin CTA chip — dashboard “Website editing”, high-confidence shortcuts.
 * Aligned with Tienda stat-card actions: wax gradient, strong border, 44px min tap target on mobile.
 */
export const adminCtaChip =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-[#C9B46A]/55 bg-gradient-to-br from-[#FBF3DD] via-[#FFFCF7] to-[#F0DFB8] px-4 py-2.5 text-sm font-bold text-[#1E1810] shadow-[0_2px_10px_-3px_rgba(42,35,20,0.16)] transition hover:border-[#A68B3A]/75 hover:shadow-md active:scale-[0.99] sm:min-h-10 " +
  adminCtaFocusRing;

/** Secondary chip for shortcut strips and supporting actions (still bold, less visual weight than primary). */
export const adminCtaChipSecondary =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-[#E8DFD0] bg-white px-4 py-2.5 text-sm font-bold text-[#2C2416] shadow-sm transition hover:border-[#C9B46A]/45 hover:bg-[#FAF7F2] hover:shadow active:scale-[0.99] sm:min-h-10 " +
  adminCtaFocusRing;

/** Compact chip for dense groups (e.g. in-page nav, shortcut rows). */
export const adminCtaChipCompact =
  "inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-xl border border-[#DED4C4] bg-[#FFFCF7]/95 px-3 py-2 text-xs font-bold text-[#5C4E2E] shadow-sm transition hover:border-[#C9B46A]/55 hover:bg-[#FBF7EF] active:scale-[0.99] " +
  adminCtaFocusRing;

export const adminTableWrap =
  "max-w-full min-w-0 overflow-x-auto rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 [-webkit-overflow-scrolling:touch]";

/** Visible label for stubs / non-persisted / read-only surfaces (use next to headings or disabled controls). */
export const adminStubBadgeClass =
  "inline-flex items-center rounded-full border border-amber-300/90 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950";

export const adminReadOnlyBadgeClass =
  "inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-950";

export const adminLocalSimBadgeClass =
  "inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-950";

/** Mixed live + backlog surfaces (e.g. DB counts + code registry). */
export const adminPartialBadgeClass =
  "inline-flex items-center rounded-full border border-amber-200/90 bg-amber-50/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950";
