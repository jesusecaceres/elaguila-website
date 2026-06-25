/**
 * Leonix Owner Command Center — shared dashboard visual tokens.
 * Cream / burgundy / gold palette aligned with Varios seller workspace.
 */
export const LX_DASH = {
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
} as const;
