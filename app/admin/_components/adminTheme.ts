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

/** Main admin page content — full width on phone, capped on desktop, no horizontal bleed. */
export const adminContentArea =
  "mx-auto w-full max-w-7xl min-w-0 overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8 lg:py-10";

/** Desktop-only table block; pair with adminMobileCardList. */
export const adminDesktopTableOnly = "hidden md:block";

/** Phone/tablet card list; pair with adminDesktopTableOnly. */
export const adminMobileCardList = "md:hidden space-y-3";

/** Filter / search rows stack on phone, wrap on tablet+. */
export const adminFilterRow = "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end";

/** Warning / migration callouts — long filenames wrap safely. */
export const adminWarningCallout =
  "break-words rounded-3xl border border-amber-200/90 bg-amber-50/90 p-4 text-sm text-amber-950 [&_code]:break-all";

/** Horizontal scrollable pill tab strip (mobile command centers). */
export const adminResponsiveTabsOuter =
  "-mx-3 px-3 sm:-mx-0 sm:px-0";

export const adminResponsiveTabsScroll =
  "flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]";

/** Dashboard command center — semantic rectangular CTAs (MOBILE-01). */
export const adminDashboardCtaBase =
  "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold shadow-sm transition active:scale-[0.99] sm:min-h-[42px] " +
  adminCtaFocusRing;

/** Burgundy — primary / strongest action. */
export const adminDashboardCtaPrimary =
  adminDashboardCtaBase + " border border-[#6B1A26] bg-[#7A1E2C] text-white hover:bg-[#6B1A26]";

/** Army green — active / safe / positive admin ready. */
export const adminDashboardCtaActive =
  adminDashboardCtaBase + " border border-[#2A4536] bg-[#2A4536] text-[#FFFCF7] hover:bg-[#234036]";

/** Royal blue — view / inspect / navigation. */
export const adminDashboardCtaView =
  adminDashboardCtaBase + " border border-[#1E4A7A] bg-[#1E4A7A] text-white hover:bg-[#173A61]";

/** Orange — pending / review / warning. */
export const adminDashboardCtaWarning =
  adminDashboardCtaBase + " border border-[#C9782F] bg-[#E8943A] text-[#1E1810] hover:bg-[#D9852E]";

/** Cream / ivory — neutral utility surface. */
export const adminDashboardCtaNeutral =
  adminDashboardCtaBase +
  " border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text)] hover:bg-[color:var(--lx-section)]";

/** Gold/bronze accent chip border (counts / premium). */
export const adminDashboardMetricChip =
  "inline-flex items-center rounded-md border border-[#C9B46A]/60 bg-[#FFFCF7] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#5C4E2E]";

/** Red urgent marker — review / critical only. */
export const adminDashboardUrgentBadge =
  "inline-flex shrink-0 items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-900";

/** Zebra striping for admin tracking tables. */
/** Obvious warm zebra for admin queue tables (Phase 15). */
export const adminTableZebraRow =
  "border-b border-[#E8DFD0]/70 odd:bg-[#FFFCF7] even:bg-[#F8F0E3] hover:bg-[#F3E6D2]";

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
