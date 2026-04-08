import type { ViajesUi } from "../data/viajesUiCopy";

/** Compact disclosure line for category pages (affiliate readiness). */
export function ViajesTrustStrip({ ui }: { ui: ViajesUi }) {
  return (
    <aside className="mx-auto mt-8 max-w-7xl rounded-2xl border border-[color:var(--lx-gold-border)]/60 bg-[color:var(--lx-section)]/80 px-4 py-3 text-center text-xs leading-relaxed text-[color:var(--lx-text-2)] sm:px-6 sm:text-left">
      {ui.trustStrip}
    </aside>
  );
}
