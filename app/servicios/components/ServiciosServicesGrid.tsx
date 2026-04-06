import Image from "next/image";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { SV } from "./serviciosDesignTokens";

export function ServiciosServicesGrid({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const items = profile.services;
  if (!items.length) return null;

  return (
    <section
      className="rounded-2xl border p-6 shadow-sm md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.services}</h2>
      <div
        className={`mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 ${items.length <= 2 ? "lg:max-w-3xl lg:mx-auto" : "xl:grid-cols-4"}`}
      >
        {items.map((s) => (
          <article
            key={s.id}
            className="group overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden">
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
                <p className="mt-0.5 text-xs font-medium text-white/90">{s.secondaryLine}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
