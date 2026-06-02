/** Leonix admin design tokens — light, warm operations HQ (Phase 13B). */

export const adminPageBg =
  "min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)] bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(201,120,47,0.07),transparent_55%),radial-gradient(ellipse_55%_40%_at_100%_30%,rgba(255,255,255,0.45),transparent_52%)]";

export const adminCardBase =
  "rounded-3xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] shadow-[0_10px_36px_-14px_rgba(42,36,22,0.10)]";

export const adminCardMuted =
  "rounded-3xl border border-[color:var(--lx-border)]/50 bg-[color:var(--lx-section)] shadow-[0_8px_28px_-12px_rgba(42,36,22,0.08)]";

export const adminInputClass =
  "w-full rounded-lg border border-[color:var(--lx-border)] bg-white/95 px-4 py-2.5 text-sm text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] outline-none focus:border-[#C9B46A]/70 focus:ring-2 focus:ring-[#C9B46A]/30";

/** Burgundy primary — Leonix admin actions (#7A1E2C). */
export const adminBtnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#6B1A26] active:scale-[0.99]";

export const adminBtnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm hover:bg-[color:var(--lx-section)]";

export const adminBtnDark =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--lx-text)] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90";

export const adminCtaFocusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B46A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lx-card)]";

export const adminCtaChip =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] px-4 py-2.5 text-sm font-bold text-[color:var(--lx-text)] shadow-[0_2px_10px_-3px_rgba(42,35,20,0.10)] transition hover:bg-[color:var(--lx-section)] hover:shadow-md active:scale-[0.99] sm:min-h-10 " +
  adminCtaFocusRing;

export const adminCtaChipSecondary =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-4 py-2.5 text-sm font-bold text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-border)] hover:bg-[color:var(--lx-canvas)] hover:shadow active:scale-[0.99] sm:min-h-10 " +
  adminCtaFocusRing;

export const adminCtaChipCompact =
  "inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] px-3 py-2 text-xs font-bold text-[color:var(--lx-text-2)] shadow-sm transition hover:border-[color:var(--lx-border)] hover:bg-[color:var(--lx-section)] active:scale-[0.99] " +
  adminCtaFocusRing;

export const adminTableWrap =
  "max-w-full min-w-0 overflow-x-auto rounded-lg border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] [-webkit-overflow-scrolling:touch]";

/** Zebra striping for admin tracking tables. */
export const adminTableZebraRow = "border-b border-[#E8DFD0]/60 odd:bg-[#FFFCF7]/90 even:bg-white/50";

export const adminLinkAccent = "font-semibold text-[#6B5B2E] underline decoration-[#C9B46A]/50 underline-offset-2";

/** Inline / toast action proof — success. */
export const adminActionProofOk =
  "rounded-lg border border-emerald-200/90 bg-emerald-50/95 px-4 py-3 text-sm font-semibold text-emerald-950";

/** Inline / toast action proof — error. */
export const adminActionProofErr =
  "rounded-lg border border-rose-200/90 bg-rose-50/95 px-4 py-3 text-sm font-semibold text-rose-950";

/** Informational callout (neutral warm — not sky/blue). */
export const adminInfoCallout =
  "rounded-lg border border-amber-200/80 bg-amber-50/90 p-3 text-sm text-amber-950";

export const adminStubBadgeClass =
  "inline-flex items-center rounded-md border border-amber-300/90 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950";

export const adminReadOnlyBadgeClass =
  "inline-flex items-center rounded-md border border-[#E8DFD0] bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5C5346]";

export const adminLocalSimBadgeClass =
  "inline-flex items-center rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-950";

export const adminPartialBadgeClass =
  "inline-flex items-center rounded-md border border-amber-200/90 bg-amber-50/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950";
