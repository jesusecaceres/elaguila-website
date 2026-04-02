import Image from "next/image";
import { FiMapPin } from "react-icons/fi";
import type { ServiciosBusinessProfile, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { hasItems, showSidebarServiceAreasMap } from "../lib/serviciosProfileVisibility";
import { SV } from "./serviciosDesignTokens";

/** Sidebar: map + compact city list (shown when a map image URL exists). */
export function ServiciosSidebarAreasMap({ profile, lang }: { profile: ServiciosBusinessProfile; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const areas = profile.serviceAreas;
  const mapUrl = profile.serviceAreaMapImageUrl;
  if (!showSidebarServiceAreasMap(profile)) return null;

  return (
    <div
      className="rounded-2xl border p-5 shadow-sm"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <h3 className="text-sm font-bold text-[color:var(--lx-text)]">{L.serviceAreas}</h3>
      {hasItems(areas) ? (
        <ul className="mt-3 space-y-1.5">
          {areas.slice(0, 6).map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-xs font-medium text-[color:var(--lx-text-2)]">
              <FiMapPin className="h-3.5 w-3.5 shrink-0 text-[#3B66AD]" aria-hidden />
              {a.label}
            </li>
          ))}
          {areas.length > 6 ? (
            <li className="text-xs text-[color:var(--lx-muted)]">
              {lang === "en" ? `+${areas.length - 6} more` : `+${areas.length - 6} más`}
            </li>
          ) : null}
        </ul>
      ) : null}
      <div className="relative mt-4 aspect-[16/10] w-full overflow-hidden rounded-xl border border-black/[0.06]">
        <Image src={mapUrl!} alt="" fill className="object-cover" sizes="360px" />
      </div>
    </div>
  );
}
