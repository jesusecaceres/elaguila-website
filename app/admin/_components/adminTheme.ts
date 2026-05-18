/** Leonix admin design tokens — light, warm operations HQ. */

export const adminPageBg =
  "min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)] bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(201,120,47,0.07),transparent_55%),radial-gradient(ellipse_55%_40%_at_100%_30%,rgba(255,255,255,0.45),transparent_52%)]";

export const adminCardBase =
  "rounded-3xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] shadow-[0_10px_36px_-14px_rgba(42,36,22,0.10)]";

export const adminCardMuted =
  "rounded-3xl border border-[color:var(--lx-border)]/50 bg-[color:var(--lx-section)] shadow-[0_8px_28px_-12px_rgba(42,36,22,0.08)]";

export const adminInputClass =
  "w-full rounded-2xl border border-[color:var(--lx-border)] bg-white/95 px-4 py-2.5 text-sm text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] outline-none focus:border-[color:var(--lx-border)] focus:ring-2 focus:ring-[color:var(--lx-border)]/50";

export const adminBtnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--lx-cta-primary-bg)] px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-cta-primary-fg)] shadow-md transition hover:opacity-90 active:scale-[0.99]";

export const adminBtnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm hover:bg-[color:var(--lx-section)]";

export const adminBtnDark =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--lx-text)] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90";

/** Shared focus ring for chip-style admin links (warm offset matches cards). */
export const adminCtaFocusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lx-card)]";

/**
 * Primary admin CTA chip — dashboard “Website editing”, high-confidence shortcuts.
 * Aligned with Tienda stat-card actions: wax gradient, strong border, 44px min tap target on mobile.
 */
export const adminCtaChip =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] px-4 py-2.5 text-sm font-bold text-[color:var(--lx-text)] shadow-[0_2px_10px_-3px_rgba(42,35,20,0.10)] transition hover:bg-[color:var(--lx-section)] hover:shadow-md active:scale-[0.99] sm:min-h-10 " +
  adminCtaFocusRing;

/** Secondary chip for shortcut strips and supporting actions (still bold, less visual weight than primary). */
export const adminCtaChipSecondary =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-4 py-2.5 text-sm font-bold text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-border)] hover:bg-[color:var(--lx-canvas)] hover:shadow active:scale-[0.99] sm:min-h-10 " +
  adminCtaFocusRing;

/** Compact chip for dense groups (e.g. in-page nav, shortcut rows). */
export const adminCtaChipCompact =
  "inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] px-3 py-2 text-xs font-bold text-[color:var(--lx-text-2)] shadow-sm transition hover:border-[color:var(--lx-border)] hover:bg-[color:var(--lx-section)] active:scale-[0.99] " +
  adminCtaFocusRing;

export const adminTableWrap =
  "max-w-full min-w-0 overflow-x-auto rounded-2xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] [-webkit-overflow-scrolling:touch]";

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
