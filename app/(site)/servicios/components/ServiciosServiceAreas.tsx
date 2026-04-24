import { FiHome, FiMapPin } from "react-icons/fi";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { hasMainColumnServiceAreasResolved } from "../lib/serviciosProfilePresence";
import { SV } from "./serviciosDesignTokens";

/** Main column: city / area list when no map image (map + list use action panel). */
export function ServiciosServiceAreas({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  if (!hasMainColumnServiceAreasResolved(profile)) return null;

  const areas = profile.serviceAreas.items;

  return (
    <section
      className="rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.serviceAreas}</h2>

      <div className="mt-5 flex flex-wrap gap-2">
        {areas.map((a) => (
          <div
            key={a.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#3B66AD]/20 bg-[#3B66AD]/[0.06] px-3 py-1.5 text-xs font-medium text-[color:var(--lx-text)]"
          >
            {a.kind === "neighborhood" ? (
              <FiHome className="h-3.5 w-3.5 text-[#3B66AD]" aria-hidden />
            ) : (
              <FiMapPin className="h-3.5 w-3.5 text-[#3B66AD]" aria-hidden />
            )}
            {a.label}
          </div>
        ))}
      </div>
    </section>
  );
}
