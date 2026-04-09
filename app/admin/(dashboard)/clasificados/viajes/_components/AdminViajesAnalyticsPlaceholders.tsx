import { adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";

/**
 * Structured placeholders for clicks / leads / ROI — sample numbers are explicitly labeled mock.
 */
export function AdminViajesAnalyticsPlaceholders() {
  return (
    <div className={`${adminCardBase} mb-6 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Analytics & ROI (staged)</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E1810]">Directional metrics — not live data</h2>
          <p className="mt-2 max-w-3xl text-sm text-[#5C5346]">
            The values below are <strong>labeled samples</strong> for stakeholder conversations. Real click and lead ingestion will replace this panel when tracking endpoints exist.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-amber-950">Mock sample</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/90 p-4">
          <p className="text-[10px] font-bold uppercase text-[#7A7164]">Outbound clicks (7d)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#1E1810]">1,284</p>
          <p className="mt-1 text-[10px] text-[#7A7164]">Sample only</p>
        </div>
        <div className="rounded-xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/90 p-4">
          <p className="text-[10px] font-bold uppercase text-[#7A7164]">Lead forms / WA taps</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#1E1810]">186</p>
          <p className="mt-1 text-[10px] text-[#7A7164]">Sample only</p>
        </div>
        <div className="rounded-xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/90 p-4">
          <p className="text-[10px] font-bold uppercase text-[#7A7164]">Blended CTR (mock)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#1E1810]">3.2%</p>
          <p className="mt-1 text-[10px] text-[#7A7164]">Not measured in prod</p>
        </div>
        <div className="rounded-xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/90 p-4">
          <p className="text-[10px] font-bold uppercase text-[#7A7164]">Offers expiring (14d)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#1E1810]">7</p>
          <p className="mt-1 text-[10px] text-[#7A7164]">Queue placeholder</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-[#E8DFD0]/90 bg-white/90 p-4 text-sm text-[#5C5346]">
          <p className="text-xs font-bold text-[#1E1810]">Top-performing offers (mock ranking)</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-xs">
            <li>Cancún resort rail · affiliate</li>
            <li>Último minuto Manuel Antonio · business (sample)</li>
            <li>Crucero del mes · affiliate</li>
          </ol>
        </div>
        <div className="rounded-xl border border-[#E8DFD0]/90 bg-white/90 p-4 text-sm text-[#5C5346]">
          <p className="text-xs font-bold text-[#1E1810]">Next instrumentation steps</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
            <li>Outbound click events on /oferta/[slug] CTAs (affiliate vs business).</li>
            <li>Lead attribution keyed by offer id + lane.</li>
            <li>Campaign id dimensions for seasonal reporting.</li>
          </ul>
          <button type="button" className={`${adminCtaChipSecondary} mt-3`} disabled title="Staged">
            Open full report (staged)
          </button>
        </div>
      </div>
    </div>
  );
}
