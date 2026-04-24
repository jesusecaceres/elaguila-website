import Image from "next/image";
import { FiMapPin } from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { resolveServiciosQuoteDestination } from "../lib/serviciosContactActions";
import { ServiciosStarRating } from "./ServiciosStarRating";
import { ServiciosHeroActions } from "./ServiciosHeroActions";
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
  const about = profile.about;
  const heroFacts = profile.quickFacts.slice(0, 3);

  const quoteDestination = resolveServiciosQuoteDestination(profile, lang);
  
  const handleQuoteClick = () => {
    if (!quoteDestination) return;
    
    const message = lang === "en" 
      ? "Hi, I saw your profile on Leonix and would like to request a quote."
      : "Hola, vi tu perfil en Leonix y quiero pedir una cotización.";
    
    if (quoteDestination.kind === "whatsapp") {
      const encodedMessage = encodeURIComponent(message);
      window.open(`${quoteDestination.href}?text=${encodedMessage}`, "_blank", "noopener noreferrer");
    } else {
      window.open(quoteDestination.href, "_blank", "noopener noreferrer");
    }
  };

  const headlineSub =
    hero.categoryLine && hero.locationSummary
      ? `${hero.categoryLine} · ${hero.locationSummary}`
      : hero.categoryLine || hero.locationSummary || null;

  return (
    <section className="relative w-full overflow-hidden rounded-xl shadow-[0_20px_60px_rgba(30,24,16,0.12)] sm:rounded-2xl md:rounded-3xl">
      <div className="relative aspect-[5/4] w-full min-h-[200px] sm:aspect-[21/9] sm:min-h-[240px] md:aspect-[2.4/1] md:min-h-[320px]">
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
              background: `linear-gradient(135deg, ${SV.warm} 0%, ${SV.gold} 45%, ${SV.beige} 100%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" aria-hidden />

        <div className="absolute inset-0 flex flex-col justify-end p-3 pb-4 sm:p-4 sm:pb-6 md:p-8 lg:flex-row lg:items-end lg:justify-start">
          <div
            className="w-full max-w-2xl rounded-xl border p-4 shadow-xl sm:rounded-2xl sm:p-5 md:max-w-2xl md:p-7"
            style={{
              backgroundColor: "rgba(255,255,255,0.98)",
              borderColor: SV.goldBorder,
              boxShadow: SV.shadowPremium,
            }}
          >
            <div className="flex gap-4">
              {hero.logoUrl ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-sm sm:h-24 sm:w-24">
                  <Image
                    src={hero.logoUrl}
                    alt={hero.logoAlt || identity.businessName}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized={serviciosImageUnoptimized(hero.logoUrl)}
                  />
                </div>
              ) : (
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-[#3B66AD]/20 text-2xl font-bold text-white shadow-sm sm:h-24 sm:w-24"
                  style={{ background: SV.blue }}
                  aria-hidden
                >
                  {(identity.businessName.trim().charAt(0) || "?").toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-[color:var(--lx-text)] sm:text-3xl md:text-[1.8rem]">
                  {identity.businessName}
                </h1>
                {headlineSub ? (
                  <p className="mt-2 text-sm font-medium text-[color:var(--lx-muted)] sm:text-base">{headlineSub}</p>
                ) : null}

                {about?.specialtiesLine ? (
                  <p className="mt-2 text-base font-semibold leading-snug text-[#2d528d] sm:text-lg">{about.specialtiesLine}</p>
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
                  <ul className="mt-3 flex flex-wrap gap-2">
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

                {heroFacts.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {heroFacts.map((f) => (
                      <li
                        key={`${f.kind}-${f.label}`}
                        className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border border-[#3B66AD]/20 bg-[#3B66AD]/[0.06] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--lx-text)] sm:text-xs"
                      >
                        <span className="text-[#3B66AD]" aria-hidden>
                          ✓
                        </span>
                        <span className="min-w-0 break-words leading-snug">{f.label}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {quoteDestination ? (
                  <ServiciosHeroActions 
                    profile={profile} 
                    lang={lang} 
                    onQuoteClick={handleQuoteClick}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
