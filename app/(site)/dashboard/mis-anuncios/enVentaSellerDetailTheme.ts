/**
 * Leonix Varios — seller listing workspace visual tokens (detail page only).
 * Maps Coming Soon / En Venta public palette to dashboard panels.
 */
export const EV_SELLER_DETAIL = {
  panel:
    "rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-6 shadow-[0_14px_40px_-18px_rgba(31,36,28,0.14)] ring-1 ring-[#C9A84A]/10 sm:p-7",
  panelAccent:
    "rounded-2xl border border-[#C9A84A]/35 bg-gradient-to-br from-[#FFFDF7] via-[#FFFCF7] to-[#FBF7EF] p-6 shadow-[0_14px_40px_-18px_rgba(201,168,74,0.1)] ring-1 ring-[#C9A84A]/15 sm:p-7",
  sectionLabel: "text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A6B1F]",
  contextLabel: "text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6B1F]/90",
  title: "font-serif text-[1.65rem] font-semibold leading-tight tracking-tight text-[#1F241C] sm:text-[1.85rem]",
  metaChip:
    "inline-flex items-center rounded-md border border-[#D6C7AD]/70 bg-[#FBF7EF]/90 px-2 py-0.5 font-mono text-[10px] text-[#5C5346]",
  categoryChip:
    "inline-flex items-center rounded-md border border-[#C9A84A]/45 bg-[#FBF7EF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8A6B1F]",
  btnPrimary:
    "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#7A1E2C]/15 bg-[#7A1E2C] px-5 py-2.5 text-sm font-semibold text-[#FFFCF7] shadow-[0_8px_20px_-6px_rgba(122,30,44,0.38)] transition hover:bg-[#5e1721] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C]",
  btnSecondary:
    "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#C9A84A]/55 bg-[#FFFDF7] px-5 py-2.5 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84A]/60",
  tabBar: "mt-8 flex flex-wrap gap-1 border-b border-[#D6C7AD]/65 pb-4",
  tabActive:
    "rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF7] px-3.5 py-2 text-xs font-semibold text-[#1F241C] shadow-[0_2px_10px_-3px_rgba(31,36,28,0.1)] ring-1 ring-[#C9A84A]/18 sm:px-4 sm:text-sm",
  tabInactive:
    "rounded-lg px-3.5 py-2 text-xs font-semibold text-[#5C5346] transition hover:bg-[#FBF7EF]/90 hover:text-[#3D3428] sm:px-4 sm:text-sm",
  metricCard:
    "rounded-xl border border-[#D6C7AD]/65 bg-[#FBF7EF]/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-[#C9A84A]/8 transition hover:border-[#C9A84A]/35",
  metricLabel: "text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A6B1F]",
  metricValue: "mt-2 font-serif text-[1.65rem] font-semibold tabular-nums leading-none text-[#1F241C]",
  dlRow:
    "grid gap-1 border-b border-[#D6C7AD]/45 py-3.5 last:border-0 sm:grid-cols-[minmax(0,42%)_1fr] sm:items-baseline sm:gap-4",
  dlLabel: "text-xs font-medium text-[#5C5346]",
  dlValue: "text-sm font-semibold text-[#1F241C] sm:text-right",
  refreshBtn:
    "mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#7A1E2C]/15 bg-[#7A1E2C] px-6 py-2.5 text-sm font-semibold text-[#FFFCF7] shadow-[0_8px_20px_-6px_rgba(122,30,44,0.38)] transition hover:bg-[#5e1721] disabled:opacity-50 sm:w-auto",
  helperBox:
    "mt-5 rounded-xl border border-[#D6C7AD]/70 bg-[#FBF7EF]/90 px-4 py-3.5 text-sm leading-relaxed text-[#5C5346]",
  lifecycleWrap: "rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-5 ring-1 ring-[#C9A84A]/8",
  lifecycleBtn:
    "rounded-xl border border-[#D6C7AD]/70 bg-[#FFFDF7] px-4 py-2.5 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A]/45 hover:bg-[#FBF7EF] disabled:opacity-50",
  lifecycleBtnPrimary:
    "rounded-xl border border-[#2A4536]/25 bg-[#2A4536]/[0.07] px-4 py-2.5 text-sm font-semibold text-[#2A4536] transition hover:bg-[#2A4536]/[0.12] disabled:opacity-50",
  lifecycleBtnWarn:
    "rounded-xl border border-amber-200/90 bg-amber-50/80 px-4 py-2.5 text-sm font-semibold text-amber-950 transition hover:bg-amber-50 disabled:opacity-50",
  lifecycleBtnMuted:
    "rounded-xl border border-[#D6C7AD]/60 bg-[#FAF7F2] px-4 py-2.5 text-sm font-semibold text-[#5C5346] transition hover:bg-[#F3EBDD] disabled:opacity-50",
  backLink: "mt-10 inline-flex text-sm font-semibold text-[#7A1E2C] underline decoration-[#C9A84A]/40 underline-offset-4 hover:text-[#5e1721]",
} as const;

export function evDetailClass(isEnVenta: boolean, vario: string, fallback: string): string {
  return isEnVenta ? vario : fallback;
}
