import type { ViajesUi } from "../data/viajesUiCopy";

/** Compact disclosure + “why Viajes” for category pages (affiliate / screenshot readiness). */
export function ViajesTrustStrip({ ui, className = "" }: { ui: ViajesUi; className?: string }) {
  const w = ui.trustWhy;
  return (
    <aside
      className={`mx-auto mt-8 max-w-7xl rounded-2xl border border-[color:var(--lx-gold-border)]/60 bg-[color:var(--lx-section)]/80 px-4 py-3.5 text-center text-xs leading-relaxed text-[color:var(--lx-text-2)] sm:px-6 sm:text-left ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{w.title}</p>
      <p className="mt-2 font-medium text-[color:var(--lx-text)]">{w.body}</p>
      <p className="mt-3 border-t border-dashed border-[color:var(--lx-gold-border)]/50 pt-3 text-[color:var(--lx-text-2)]">{ui.trustStrip}</p>
    </aside>
  );
}
