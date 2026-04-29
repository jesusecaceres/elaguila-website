import { FiClock, FiMapPin } from "react-icons/fi";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { SV } from "./serviciosDesignTokens";

export function ServiciosHours({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const hours = profile.contact.hours;
  
  if (!hours) return null;

  return (
    <section
      className="rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <div className="flex items-center gap-2">
        <FiClock className="h-5 w-5 text-[#3B66AD]" aria-hidden />
        <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.hours}</h2>
        {hours.openNowLabel ? (
          <span 
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
            style={{
              borderColor: hours.openNowLabel.toLowerCase().includes('cerrado') ? SV.warmBorder : SV.greenBorder,
              backgroundColor: hours.openNowLabel.toLowerCase().includes('cerrado') ? SV.warmSoft : SV.greenSoft,
              color: hours.openNowLabel.toLowerCase().includes('cerrado') ? SV.warm : SV.green,
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'currentColor' }} aria-hidden />
            {hours.openNowLabel}
          </span>
        ) : null}
      </div>
      
      {hours.todayHoursLine ? (
        <p className="mt-4 text-sm font-medium text-[color:var(--lx-text)]">{hours.todayHoursLine}</p>
      ) : null}
      
      {hours.weeklyRows && hours.weeklyRows.length > 0 ? (
        <div className="mt-5 space-y-2">
          {hours.weeklyRows.map((row, index) => (
            <div 
              key={index}
              className="flex items-center justify-between rounded-lg border border-black/[0.06] bg-white/95 px-3 py-2 shadow-sm"
              style={{ borderColor: SV.warmBorder }}
            >
              <span className="text-sm font-medium text-[color:var(--lx-text)]">{row.dayLabel}</span>
              <span className="text-sm text-[color:var(--lx-text-2)]">{row.line}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
