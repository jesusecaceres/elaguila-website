/**
 * Leonix Owner Command Center — shared dashboard visual tokens.
 * Cream / burgundy / gold palette aligned with Varios seller workspace.
 *
 * Package 1 (Owner Command Center globalization) — this is the single canonical
 * dashboard theme layer. Do not create a second theme file; add missing roles/helpers
 * here instead. Semantic color roles (do not deviate): burgundy = primary owner
 * action, gold/bronze = premium/category tool, cream/neutral = secondary/view,
 * green = positive/resume/reactivate, amber = pause/caution, red = destructive only.
 */
export const LX_DASH = {
  eyebrow: "text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6B1F]",
  pageHero:
    "rounded-2xl border border-[#D6C7AD]/85 bg-gradient-to-br from-[#FFFDF7] via-[#FFFCF7] to-[#FBF7EF] p-6 shadow-[0_14px_40px_-18px_rgba(31,36,28,0.12)] ring-1 ring-[#C9A84A]/12 sm:p-8",
  panel:
    "rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-6 shadow-[0_14px_40px_-18px_rgba(31,36,28,0.1)] ring-1 ring-[#C9A84A]/10 sm:p-7",
  sectionTitle: "font-serif text-xl font-semibold tracking-tight text-[#1F241C] sm:text-[1.35rem]",
  pageTitle: "font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-[#1F241C] sm:text-[2rem]",
  contextLabel: "text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6B1F]",
  bodyMuted: "text-sm leading-relaxed text-[#5C5346]",
  metricCard:
    "group flex h-full min-h-[8.75rem] flex-col rounded-2xl border border-[#D6C7AD]/80 bg-[#FFFDF7] p-5 shadow-[0_10px_32px_-14px_rgba(31,36,28,0.12)] ring-1 ring-[#C9A84A]/8 transition hover:border-[#C9A84A]/40 hover:shadow-[0_14px_40px_-12px_rgba(31,36,28,0.14)]",
  metricLabel: "text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A6B1F]",
  metricValue: "mt-auto font-serif text-[1.85rem] font-semibold tabular-nums leading-none text-[#1F241C] sm:text-[2rem]",
  metricHint: "mt-2 text-[11px] leading-snug text-[#7A7164]",
  categoryCardReady:
    "flex h-full flex-col rounded-2xl border border-[#C9A84A]/35 bg-gradient-to-br from-[#FFFDF7] to-[#FAF4EA] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-[#C9A84A]/12",
  categoryCardSoon:
    "flex h-full flex-col rounded-2xl border border-[#D6C7AD]/55 bg-[#FAF7F2]/80 p-4 opacity-90",
  badgeReady:
    "inline-flex shrink-0 items-center rounded-full border border-[#2A4536]/20 bg-[#2A4536]/[0.08] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2A4536]",
  badgeSoon:
    "inline-flex shrink-0 items-center rounded-full border border-[#D6C7AD]/70 bg-[#F3EBDD]/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]",
  btnPrimary:
    "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#7A1E2C]/15 bg-[#7A1E2C] px-4 py-2 text-xs font-semibold text-[#FFFCF7] shadow-[0_6px_16px_-4px_rgba(122,30,44,0.35)] transition hover:bg-[#5e1721]",
  btnSecondary:
    "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#C9A84A]/55 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]",
  btnManage:
    "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#D6C7AD]/70 bg-[#FBF7EF] px-4 py-2 text-xs font-semibold text-[#3D3428] transition hover:border-[#C9A84A]/45",
  /** Premium/category/add-on tool action (inventory, coupons, offers) — gold role. */
  btnPremium:
    "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#C9A84A]/70 bg-gradient-to-br from-[#FBF7EF] to-[#F3EBDD] px-4 py-2 text-xs font-semibold text-[#5C4A16] shadow-[0_6px_16px_-6px_rgba(201,168,74,0.45)] transition hover:border-[#C9A84A]",
  /** Positive/resume/reactivate action — green role. */
  btnPositive:
    "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#2A4536]/25 bg-[#2A4536] px-4 py-2 text-xs font-semibold text-[#F8F4EA] shadow-[0_6px_16px_-6px_rgba(42,69,54,0.4)] transition hover:bg-[#1F3327]",
  /** Pause/caution action — amber role. */
  btnWarning:
    "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-100",
  /** Destructive/archive/delete-only action — red role. */
  btnDanger:
    "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-red-300/70 bg-red-50 px-4 py-2 text-xs font-semibold text-red-800 transition hover:border-red-400 hover:bg-red-100",
  /** Compact readable input — canonical dashboard form control. */
  input:
    "w-full min-h-[44px] rounded-xl border border-[#D6C7AD]/85 bg-[#FFFDF7] px-3.5 py-2.5 text-sm text-[#1F241C] placeholder:text-[#7A7164] transition focus:border-[#C9A84A] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/25",
  /** Empty-state panel — used when a list/section has no real data yet. */
  emptyState:
    "rounded-2xl border border-dashed border-[#D6C7AD]/85 bg-[#FBF7EF]/60 p-8 text-center text-sm text-[#5C5346] sm:p-10",
  /** Subtle informational badge (not a status chip — for counts/labels). */
  subtleBadge:
    "inline-flex shrink-0 items-center rounded-full border border-[#D6C7AD]/70 bg-[#FBF7EF] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5C5346]",
  quickActionCard:
    "flex h-full min-h-[5.75rem] items-start gap-3 rounded-2xl border border-[#D6C7AD]/75 bg-[#FFFDF7] p-4 shadow-[0_8px_24px_-12px_rgba(31,36,28,0.1)] ring-1 ring-[#C9A84A]/8 transition hover:border-[#C9A84A]/35 hover:bg-[#FFFCF7]",
  quickActionIcon:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C9A84A]/35 bg-gradient-to-br from-[#FBF7EF] to-[#F3EBDD] text-base",
  notice:
    "rounded-xl border border-[#C9A84A]/30 bg-[#FBF7EF]/90 px-4 py-3 text-sm leading-relaxed text-[#3D3428]",
  filterBar:
    "rounded-2xl border border-[#D6C7AD]/75 bg-[#FFFDF7]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-[#C9A84A]/8",
  chipActive:
    "rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF7] px-3.5 py-2 text-sm font-semibold text-[#1F241C] shadow-[0_2px_8px_-3px_rgba(31,36,28,0.08)] ring-1 ring-[#C9A84A]/15",
  chipInactive:
    "rounded-lg px-3.5 py-2 text-sm font-semibold text-[#5C5346] transition hover:bg-[#FBF7EF]/90",
  disabledPanel:
    "rounded-2xl border border-[#D6C7AD]/85 bg-gradient-to-br from-[#FFFCF7] to-[#FBF7EF] p-8 text-center shadow-[0_14px_40px_-18px_rgba(31,36,28,0.1)] ring-1 ring-[#C9A84A]/10 sm:p-10",
  /** Mis anuncios workbench — compact panel, full width within grid column */
  panelCompact:
    "rounded-xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-4 shadow-[0_10px_32px_-16px_rgba(31,36,28,0.1)] ring-1 ring-[#C9A84A]/10 sm:p-5",
  workbenchCanvas: "w-full min-w-0 max-w-none",
  filterBarCompact:
    "rounded-xl border border-[#D6C7AD]/75 bg-[#FFFDF7]/95 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-[#C9A84A]/8",
} as const;

/**
 * Canonical dashboard status-tone → class map (Package 1 consolidation).
 * Replaces the previously independent tone maps in DashboardCategoryListingCard
 * and ListingLifecycleStatusCard, which used different shades for the same
 * neutral/positive/warn/danger meanings. Presentation only — does not change
 * which tone a caller resolves for a given listing status.
 */
export type DashboardStatusTone = "neutral" | "positive" | "warn" | "danger";

export const LX_DASH_STATUS_TONE: Record<DashboardStatusTone, string> = {
  neutral: "border-[#D6C7AD]/70 bg-[#FBF7EF] text-[#5C5346]",
  positive: "border-[#2A4536]/20 bg-[#2A4536]/[0.08] text-[#2A4536]",
  warn: "border-amber-300/70 bg-amber-50 text-amber-900",
  danger: "border-red-300/70 bg-red-50 text-red-800",
};

/** Pill-shaped status chip class for a given dashboard status tone. */
export function lxDashStatusChipClass(tone: DashboardStatusTone): string {
  return `inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${LX_DASH_STATUS_TONE[tone]}`;
}
