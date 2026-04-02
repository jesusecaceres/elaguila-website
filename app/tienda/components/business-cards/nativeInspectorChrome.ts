/** Light “card” chrome in the right-column contextual inspector; dark chrome under Refinements. */
export function nativeInspectorChrome(variant: "default" | "contextual") {
  const light = variant === "contextual";
  if (light) {
    return {
      root: "space-y-3",
      title: "text-[11px] font-semibold text-[color:rgba(201,168,74,0.85)]",
      help: "mt-1 text-[10px] text-[color:rgba(61,52,40,0.55)] leading-snug",
      hiddenBanner:
        "rounded-lg border border-amber-200/90 bg-amber-50 px-2.5 py-2 text-[10px] leading-snug text-amber-950/90",
      btn: "rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[11px] font-semibold text-[color:#3d3428] touch-manipulation hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40",
      btnDanger:
        "rounded-lg border border-rose-200 bg-rose-50/90 px-2 py-1.5 text-[11px] font-semibold text-rose-900 hover:bg-rose-100",
      labelBlock: "block text-[10px] text-[color:rgba(61,52,40,0.55)]",
      labelGrid: "text-[10px] text-[color:rgba(61,52,40,0.55)]",
      input:
        "mt-0.5 w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs text-[color:var(--lx-text)] shadow-inner outline-none focus:border-[color:rgba(201,168,74,0.45)] focus:ring-1 focus:ring-[color:rgba(201,168,74,0.2)] disabled:cursor-not-allowed disabled:opacity-40",
      flexLabel: "flex items-center gap-2 text-[10px] text-[color:rgba(61,52,40,0.65)]",
      checkbox: "rounded border-black/20 text-[color:var(--lx-gold)] disabled:opacity-40",
      sectionTop: "space-y-2 border-t border-black/10 pt-3",
      sectionTitle: "text-[10px] font-semibold uppercase tracking-wide text-[color:rgba(61,52,40,0.5)]",
      sectionHelp: "text-[10px] text-[color:rgba(61,52,40,0.52)] leading-snug",
      colorInput: "h-9 w-14 cursor-pointer rounded-lg border border-black/15 bg-white shadow-inner disabled:cursor-not-allowed disabled:opacity-40",
      range: "mt-1 w-full disabled:opacity-40 accent-[#c9a84a]",
    };
  }
  return {
    root: "mt-4 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.2)] p-3 space-y-3",
    title: "text-[11px] font-medium text-[rgba(201,168,74,0.9)]",
    help: "mt-1 text-[10px] text-[rgba(255,255,255,0.38)] leading-snug",
    hiddenBanner:
      "rounded-lg border border-amber-500/35 bg-amber-950/40 px-2.5 py-2 text-[10px] leading-snug text-amber-100/90",
    btn: "rounded-md border border-[rgba(255,255,255,0.14)] px-2 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-40",
    btnDanger: "rounded-md border border-[rgba(220,80,80,0.45)] px-2 py-1 text-[11px] text-[rgba(255,200,200,0.95)]",
    labelBlock: "block text-[10px] text-[rgba(255,255,255,0.5)]",
    labelGrid: "text-[10px] text-[rgba(255,255,255,0.5)]",
    input:
      "mt-0.5 w-full rounded border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40",
    flexLabel: "flex items-center gap-2 text-[10px] text-[rgba(255,255,255,0.55)]",
    checkbox: "rounded border-[rgba(255,255,255,0.2)] disabled:opacity-40",
    sectionTop: "space-y-2 border-t border-[rgba(255,255,255,0.08)] pt-3",
    sectionTitle: "text-[10px] font-medium text-[rgba(255,255,255,0.45)]",
    sectionHelp: "text-[10px] text-[rgba(255,255,255,0.38)] leading-snug",
    colorInput: "h-9 w-14 cursor-pointer rounded border border-[rgba(255,255,255,0.2)] bg-transparent disabled:cursor-not-allowed disabled:opacity-40",
    range: "mt-1 w-full disabled:opacity-40",
  };
}

export type NativeInspectorChrome = ReturnType<typeof nativeInspectorChrome>;
