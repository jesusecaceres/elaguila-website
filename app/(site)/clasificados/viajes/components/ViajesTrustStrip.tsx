import type { ViajesUi } from "../data/viajesUiCopy";

const POINT_ICONS = ["◇", "◆", "◇"] as const;

/** Mid-page reassurance: disclosure + scannable trust points (affiliate / screenshot readiness). */
export function ViajesTrustStrip({ ui, className = "" }: { ui: ViajesUi; className?: string }) {
  const w = ui.trustWhy;
  const points = ui.trustLandingPoints;
  return (
    <aside
      className={`rounded-2xl border border-[color:var(--lx-gold-border)] bg-[#fffdf9]/96 px-4 py-5 shadow-[0_12px_36px_-20px_rgba(30,50,70,0.12)] sm:rounded-3xl sm:px-7 sm:py-6 ${className}`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-10">
        <div className="lg:max-w-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-900/80">{w.title}</p>
          <p className="mt-2 text-sm font-semibold leading-snug text-[color:var(--lx-text)]">{w.body}</p>
        </div>
        <ul className="grid flex-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {points.map((line, i) => (
            <li
              key={i}
              className="flex gap-2.5 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/90 px-3 py-3 text-xs leading-relaxed text-[color:var(--lx-text-2)] shadow-[inset_0_1px_0_rgba(255,252,247,0.85)]"
            >
              <span className="select-none font-serif text-sky-800/90" aria-hidden>
                {POINT_ICONS[i % POINT_ICONS.length]}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-5 border-t border-dashed border-[color:var(--lx-gold-border)]/60 pt-4 text-xs leading-relaxed text-[color:var(--lx-text-2)]">{ui.trustStrip}</p>
    </aside>
  );
}
