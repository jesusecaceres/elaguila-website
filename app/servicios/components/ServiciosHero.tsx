import Image from "next/image";
import { FiMapPin } from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { ServiciosStarRating } from "./ServiciosStarRating";
import { SV } from "./serviciosDesignTokens";

function badgeStyle(kind: string) {
  if (kind === "verified") return "border-[#3B66AD]/35 bg-[#3B66AD]/10 text-[#2d528d]";
  return "border-black/[0.08] bg-white/90 text-[color:var(--lx-text-2)]";
}

export function ServiciosHero({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const { identity, hero } = profile;
  const rating = hero.rating;
  const reviewCount = hero.reviewCount;

  return (
    <section className="relative w-full overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(30,24,16,0.12)] md:rounded-3xl">
      <div className="relative aspect-[21/9] min-h-[220px] w-full sm:min-h-[280px] md:aspect-[2.4/1] md:min-h-[320px]">
        {hero.coverImageUrl ? (
          <Image
            src={hero.coverImageUrl}
            alt={hero.coverImageAlt || ""}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority
            unoptimized={serviciosImageUnoptimized(hero.coverImageUrl)}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${SV.blue} 0%, #6b8cc4 45%, #8fa8d4 100%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" aria-hidden />

        <div className="absolute inset-0 flex flex-col justify-end p-4 pb-6 md:p-8 lg:flex-row lg:items-end lg:justify-start">
          <div
            className="w-full max-w-xl rounded-2xl border p-5 shadow-xl md:p-7"
            style={{
              backgroundColor: "rgba(255,255,255,0.97)",
              borderColor: SV.border,
              boxShadow: SV.shadow,
            }}
          >
            <div className="flex gap-4">
              {hero.logoUrl ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-sm sm:h-[72px] sm:w-[72px]">
                  <Image
                    src={hero.logoUrl}
                    alt={hero.logoAlt || identity.businessName}
                    fill
                    className="object-cover"
                    sizes="72px"
                    unoptimized={serviciosImageUnoptimized(hero.logoUrl)}
                  />
                </div>
              ) : (
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#3B66AD]/20 text-xl font-bold text-white shadow-sm sm:h-[72px] sm:w-[72px]"
                  style={{ background: SV.blue }}
                  aria-hidden
                >
                  {(identity.businessName.trim().charAt(0) || "?").toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold leading-tight tracking-tight text-[color:var(--lx-text)] sm:text-2xl md:text-[1.65rem]">
                  {identity.businessName}
                </h1>
                {hero.categoryLine ? (
                  <p className="mt-1 text-sm text-[color:var(--lx-muted)] sm:text-[15px]">{hero.categoryLine}</p>
                ) : null}

                {rating != null && reviewCount != null ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <ServiciosStarRating value={rating} />
                    <span className="text-sm font-semibold tabular-nums text-[color:var(--lx-text)]">{rating.toFixed(1)}</span>
                    <span className="text-sm text-[color:var(--lx-muted)]">{L.reviewsSuffix(reviewCount)}</span>
                  </div>
                ) : rating != null ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <ServiciosStarRating value={rating} />
                    <span className="text-sm font-semibold tabular-nums">{rating.toFixed(1)}</span>
                  </div>
                ) : null}

                {hero.badges.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {hero.badges.map((b) => (
                      <li
                        key={`${b.kind}-${b.label}`}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:text-xs ${badgeStyle(b.kind)}`}
                      >
                        {b.kind === "verified" ? (
                          <FaCheckCircle className="h-3.5 w-3.5 shrink-0 text-[#3B66AD]" aria-hidden />
                        ) : null}
                        {b.label}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {hero.locationSummary ? (
                  <p className="mt-4 flex items-start gap-2 text-sm text-[color:var(--lx-text-2)]">
                    <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#3B66AD]" aria-hidden />
                    <span>{hero.locationSummary}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
