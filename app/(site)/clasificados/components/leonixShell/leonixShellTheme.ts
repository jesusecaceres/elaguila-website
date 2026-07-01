/** Leonix premium classified canvas — shared surfaces (En Venta / community / quick lanes). */
export const LEONIX_SHELL = {
  pageBg: "#F8F4EA",
  canvasCard:
    "rounded-xl border border-[#D6C7AD]/85 bg-[#FFFDF7] shadow-[0_14px_40px_-18px_rgba(31,36,28,0.18)] ring-1 ring-[#C9A84A]/10",
  sectionLabel: "text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A6B1F]",
  chip:
    "inline-flex max-w-full items-center rounded-full border border-[#C9A84A]/55 bg-[#FBF7EF] px-3 py-1 text-xs font-semibold text-[#3D3428] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
  burgundy: "#7A1E2C",
  gold: "#C9A84A",
} as const;

export const LEONIX_PAGE_BG_STYLE = {
  backgroundColor: LEONIX_SHELL.pageBg,
  backgroundImage: [
    "radial-gradient(ellipse 120% 70% at 50% -15%, rgba(201,168,74,0.13), transparent 58%)",
    "radial-gradient(ellipse 48% 38% at 100% 20%, rgba(255,253,247,0.60), transparent 50%)",
    "radial-gradient(ellipse 42% 32% at 0% 85%, rgba(122,30,44,0.04), transparent 52%)",
  ].join(","),
} as const;
