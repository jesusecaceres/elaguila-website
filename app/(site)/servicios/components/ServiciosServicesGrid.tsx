"use client";

import { useState } from "react";
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

function variantSurface(v: ServiciosServiceVisualVariant | undefined): { gradient: string; Icon: typeof FiTool; glyph: string } {
  switch (v ?? "default") {
    case "instalacion":
      return {
        gradient: "linear-gradient(145deg, #1e3a5f 0%, #3B66AD 48%, #5a8fd4 100%)",
        Icon: FiLayers,
        glyph: "◇",
      };
    case "mantenimiento":
      return {
        gradient: "linear-gradient(145deg, #2d4a3e 0%, #3d6b55 50%, #5a9a7a 100%)",
        Icon: FiSettings,
        glyph: "◆",
      };
    case "reparacion":
      return {
        gradient: "linear-gradient(145deg, #4a3020 0%, #8b5a2b 45%, #c9a84a 100%)",
        Icon: FiTool,
        glyph: "▸",
      };
    case "consulta":
      return {
        gradient: "linear-gradient(145deg, #2a2f45 0%, #4a5685 50%, #6b7fb8 100%)",
        Icon: FiMessageCircle,
        glyph: "◎",
      };
    case "emergencia":
      return {
        gradient: "linear-gradient(145deg, #5c1f1f 0%, #a83232 50%, #d94a4a 100%)",
        Icon: FiZap,
        glyph: "!",
      };
    default:
      return {
        gradient: "linear-gradient(145deg, #2d528d 0%, #4a6fa5 50%, #7a9bc9 100%)",
        Icon: FiBriefcase,
        glyph: "◆",
      };
  }
}

function featuredGridClass(count: number): string {
  if (count === 1) return "grid grid-cols-1 gap-4 max-w-xl mx-auto w-full";
  if (count === 2) return "grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-4xl mx-auto w-full";
  return "grid grid-cols-1 gap-4 sm:grid-cols-2 w-full";
}

export function ServiciosServicesGrid({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const items = profile.services;
  const [expanded, setExpanded] = useState(false);
  if (!items.length) return null;

  const featured = items.slice(0, 4);
  const rest = items.slice(4);
  const showMore = rest.length > 0 && !expanded;
  const visibleExtra = expanded ? rest : [];

  return (
    <section
      className="rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.services}</h2>
        {rest.length > 0 ? (
          <p className="text-xs font-medium text-[color:var(--lx-muted)]">
            {lang === "en" ? `${items.length} services` : `${items.length} servicios`}
          </p>
        ) : null}
      </div>

      <div className={`mt-6 ${featuredGridClass(featured.length)}`}>
        {featured.map((s) => {
          const hasPhoto = Boolean(s.imageUrl);
          const variant = s.visualVariant ?? "default";
          const { gradient, Icon, glyph } = variantSurface(variant);

          return (
            <article
              key={s.id}
              className="group overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_8px_30px_rgba(30,24,16,0.06)] transition hover:shadow-[0_12px_36px_rgba(45,82,141,0.12)]"
            >
              <div
                className={[
                  "relative w-full overflow-hidden",
                  featured.length <= 2 ? "aspect-[4/3] sm:aspect-[5/3]" : "aspect-[4/3] sm:aspect-[16/10]",
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
                      className="absolute inset-x-0 bottom-0 px-3 py-3 sm:px-4 sm:py-3.5"
                      style={{
                        background: `linear-gradient(to top, rgba(45,82,141,0.96) 0%, rgba(45,82,141,0.35) 55%, transparent 100%)`,
                      }}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/90" aria-hidden>
                        {glyph}
                      </span>
                      <h3 className="mt-1 text-sm font-bold leading-snug text-white drop-shadow-sm sm:text-[15px]">{s.title}</h3>
                      {s.secondaryLine.trim() ? (
                        <p className="mt-0.5 text-xs font-medium text-white/90">{s.secondaryLine}</p>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5" style={{ background: gradient }}>
                    <div
                      className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10"
                      aria-hidden
                    />
                    <span className="relative z-[1] text-xs font-bold uppercase tracking-wider text-white/85" aria-hidden>
                      {glyph}
                    </span>
                    <Icon className="relative z-[1] mb-2 mt-2 h-7 w-7 text-white/90 drop-shadow sm:h-8 sm:w-8" aria-hidden />
                    <h3 className="relative z-[1] text-sm font-bold leading-snug text-white drop-shadow-sm sm:text-[15px]">{s.title}</h3>
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

      {showMore ? (
        <button
          type="button"
          className="mt-6 w-full rounded-xl border border-black/[0.1] bg-white py-3 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[#3B66AD]/35"
          onClick={() => setExpanded(true)}
        >
          {L.showMoreServices}
        </button>
      ) : null}

      {visibleExtra.length > 0 ? (
        <div className="mt-6 border-t border-black/[0.06] pt-6">
          <div className={`${featuredGridClass(Math.min(visibleExtra.length, 4))}`}>
            {visibleExtra.map((s) => {
              const hasPhoto = Boolean(s.imageUrl);
              const variant = s.visualVariant ?? "default";
              const { gradient, Icon, glyph } = variantSurface(variant);
              return (
                <article
                  key={s.id}
                  className="group overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className={["relative w-full overflow-hidden", "aspect-[4/3]"].join(" ")}>
                    {hasPhoto && s.imageUrl ? (
                      <>
                        <Image
                          src={s.imageUrl}
                          alt={s.imageAlt}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 50vw"
                          unoptimized={serviciosImageUnoptimized(s.imageUrl)}
                        />
                        <div
                          className="absolute inset-x-0 bottom-0 px-3 py-2.5"
                          style={{
                            background: `linear-gradient(to top, rgba(45,82,141,0.95) 0%, transparent 100%)`,
                          }}
                        >
                          <span className="text-[10px] font-bold text-white/90" aria-hidden>
                            {glyph}
                          </span>
                          <h3 className="mt-0.5 text-sm font-bold text-white">{s.title}</h3>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col justify-end p-4" style={{ background: gradient }}>
                        <span className="text-xs font-bold text-white/85" aria-hidden>
                          {glyph}
                        </span>
                        <Icon className="mb-2 mt-1 h-6 w-6 text-white/90" aria-hidden />
                        <h3 className="text-sm font-bold text-white">{s.title}</h3>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <button
            type="button"
            className="mt-4 w-full rounded-xl border border-transparent py-2 text-sm font-semibold text-[color:var(--lx-muted)] hover:text-[#3B66AD]"
            onClick={() => setExpanded(false)}
          >
            {L.showLessServices}
          </button>
        </div>
      ) : null}
    </section>
  );
}
