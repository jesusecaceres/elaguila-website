import Image from "next/image";
import type {
  ServiciosProfileResolved,
  ServiciosLang,
  ServiciosServiceVisualVariant,
} from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { SV } from "./serviciosDesignTokens";
import { FiBriefcase, FiLayers, FiMessageCircle, FiSettings, FiTool, FiZap } from "react-icons/fi";

function variantSurface(v: ServiciosServiceVisualVariant | undefined): { gradient: string; Icon: typeof FiTool } {
  switch (v ?? "default") {
    case "instalacion":
      return {
        gradient: "linear-gradient(145deg, #1e3a5f 0%, #3B66AD 48%, #5a8fd4 100%)",
        Icon: FiLayers,
      };
    case "mantenimiento":
      return {
        gradient: "linear-gradient(145deg, #2d4a3e 0%, #3d6b55 50%, #5a9a7a 100%)",
        Icon: FiSettings,
      };
    case "reparacion":
      return {
        gradient: "linear-gradient(145deg, #4a3020 0%, #8b5a2b 45%, #c9a84a 100%)",
        Icon: FiTool,
      };
    case "consulta":
      return {
        gradient: "linear-gradient(145deg, #2a2f45 0%, #4a5685 50%, #6b7fb8 100%)",
        Icon: FiMessageCircle,
      };
    case "emergencia":
      return {
        gradient: "linear-gradient(145deg, #5c1f1f 0%, #a83232 50%, #d94a4a 100%)",
        Icon: FiZap,
      };
    default:
      return {
        gradient: "linear-gradient(145deg, #2d528d 0%, #4a6fa5 50%, #7a9bc9 100%)",
        Icon: FiBriefcase,
      };
  }
}

function gridClass(count: number): string {
  if (count === 1) return "grid grid-cols-1 gap-4 max-w-2xl mx-auto w-full";
  if (count === 2) return "grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-4xl mx-auto w-full sm:max-w-5xl";
  if (count === 3) return "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full";
  return "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 w-full";
}

export function ServiciosServicesGrid({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const items = profile.services;
  if (!items.length) return null;

  return (
    <section
      className="rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.services}</h2>
      <div className={`mt-6 ${gridClass(items.length)}`}>
        {items.map((s) => {
          const hasPhoto = Boolean(s.imageUrl);
          const variant = s.visualVariant ?? "default";
          const { gradient, Icon } = variantSurface(variant);

          return (
            <article
              key={s.id}
              className="group overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-sm transition hover:shadow-md"
            >
              <div
                className={[
                  "relative w-full overflow-hidden",
                  items.length <= 2 ? "aspect-[4/3] sm:aspect-[5/3]" : "aspect-[4/3]",
                ].join(" ")}
              >
                {hasPhoto && s.imageUrl ? (
                  <>
                    <Image
                      src={s.imageUrl}
                      alt={s.imageAlt}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      unoptimized={serviciosImageUnoptimized(s.imageUrl)}
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 px-3 py-3"
                      style={{
                        background: `linear-gradient(to top, rgba(45,82,141,0.95) 0%, rgba(45,82,141,0.4) 55%, transparent 100%)`,
                      }}
                    >
                      <h3 className="text-sm font-bold leading-snug text-white drop-shadow-sm">{s.title}</h3>
                      {s.secondaryLine.trim() ? (
                        <p className="mt-0.5 text-xs font-medium text-white/90">{s.secondaryLine}</p>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div
                    className="absolute inset-0 flex flex-col justify-end p-4"
                    style={{ background: gradient }}
                  >
                    <div
                      className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10"
                      aria-hidden
                    />
                    <Icon className="relative z-[1] mb-3 h-8 w-8 text-white/90 drop-shadow" aria-hidden />
                    <h3 className="relative z-[1] text-sm font-bold leading-snug text-white drop-shadow-sm">{s.title}</h3>
                    {s.secondaryLine.trim() ? (
                      <p className="relative z-[1] mt-1 text-xs font-medium text-white/85">{s.secondaryLine}</p>
                    ) : null}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
