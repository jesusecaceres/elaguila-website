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
      className="rounded-2xl border p-6 shadow-sm md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.serviceAreas}</h2>

      <ul className="mt-5 flex flex-col gap-2">
        {areas.map((a) => (
          <li key={a.id} className="flex items-center gap-2 text-sm font-medium text-[color:var(--lx-text-2)]">
            {a.kind === "neighborhood" ? (
              <FiHome className="h-4 w-4 shrink-0 text-[#3B66AD]" aria-hidden />
            ) : (
              <FiMapPin className="h-4 w-4 shrink-0 text-[#3B66AD]" aria-hidden />
            )}
            {a.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
