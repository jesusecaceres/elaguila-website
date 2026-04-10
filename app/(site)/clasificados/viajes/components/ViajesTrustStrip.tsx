import type { ViajesUi } from "../data/viajesUiCopy";

const POINT_ICONS = ["◇", "◆", "◇"] as const;

/** Reassurance before publish CTA — concise on mobile (Phase 5–6). */
export function ViajesTrustStrip({ ui, className = "" }: { ui: ViajesUi; className?: string }) {
  const w = ui.trustWhy;
  const points = ui.trustLandingPoints;
  return (
    <aside
      className={`rounded-2xl border border-[color:var(--lx-gold-border)] bg-[#fffdf9]/96 px-4 py-4 shadow-[0_12px_36px_-20px_rgba(30,50,70,0.12)] sm:rounded-3xl sm:px-6 sm:py-5 ${className}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        <div className="lg:max-w-xs">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-900/80">{w.title}</p>
          <p className="mt-1.5 text-sm font-semibold leading-snug text-[color:var(--lx-text)]">{w.body}</p>
        </div>
        <ul className="grid flex-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
          {points.map((line, i) => (
            <li
              key={i}
              className="flex gap-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/90 px-2.5 py-2.5 text-[11px] leading-snug text-[color:var(--lx-text-2)] shadow-[inset_0_1px_0_rgba(255,252,247,0.85)] sm:text-xs"
            >
              <span className="select-none font-serif text-sky-800/90" aria-hidden>
                {POINT_ICONS[i % POINT_ICONS.length]}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 border-t border-dashed border-[color:var(--lx-gold-border)]/60 pt-3 text-[11px] leading-relaxed text-[color:var(--lx-text-2)] sm:text-xs">
        {ui.trustStrip}
      </p>
    </aside>
  );
}
