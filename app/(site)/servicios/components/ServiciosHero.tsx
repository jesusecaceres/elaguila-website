import Image from "next/image";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { SV } from "./serviciosDesignTokens";
import { resolveServiciosServiceVisual } from "@/app/(site)/clasificados/servicios/lib/serviciosServiceVisualCatalog";
import { buildServiciosHeroHoursPill } from "./serviciosHeroHoursStatus";
import {
  LX_STANDARD_HERO_CHIP,
  LX_STANDARD_HERO_LOGO_WRAP,
  LX_STANDARD_HERO_TITLE,
  cleanProfessionalChipLabel,
  isWeakProfessionalChipLabel,
} from "./serviciosLeonixBrand";
import { ServiciosLanguageChipRow } from "./ServiciosLanguageChipRow";

function buildHeroMetadataLine(profile: ServiciosProfileResolved): string | null {
  const { hero } = profile;
  const parts: string[] = [];
  const cat = hero.categoryLine?.trim();
  if (cat) parts.push(cat);
  const loc = hero.locationSummary?.trim();
  if (loc) {
    const segments = loc.split(/\s*·\s*/).map((s) => s.trim()).filter(Boolean);
    parts.push(...segments);
  }
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

export function ServiciosHero({
  profile,
  lang,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
}) {
  const { identity, hero } = profile;
  const about = profile.about;
  const metadataLine = buildHeroMetadataLine(profile);
  const hoursPill = buildServiciosHeroHoursPill(profile.contact.hours, lang);
  const featuredChips = profile.services
    .map((s) => cleanProfessionalChipLabel(s.title))
    .filter((c) => c && !isWeakProfessionalChipLabel(c))
    .slice(0, 3);

  return (
    <section className="relative w-full rounded-xl shadow-[0_20px_60px_rgba(30,24,16,0.12)] sm:rounded-2xl md:rounded-3xl">
      {/*
        Responsive hero: min-height preserves presence without a fixed aspect ratio that clips
        stacked content at 100% zoom. `overflow-hidden` applies only to the background layer.
      */}
      <div className="relative isolate w-full min-h-[clamp(14.25rem,38vmin,31rem)] sm:min-h-[clamp(15.25rem,34vmin,28rem)] md:min-h-[clamp(16rem,30vmin,26rem)]">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]" aria-hidden>
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
                background: `linear-gradient(135deg, ${SV.warm} 0%, ${SV.gold} 45%, ${SV.card} 100%)`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25" />
        </div>

        <div className="relative z-10 flex w-full flex-col items-center px-3 pb-7 pt-8 text-center text-white sm:px-8 sm:pb-9 sm:pt-10 md:px-10 md:pb-10 md:pt-11">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-2.5 sm:gap-3 md:gap-4">
            {hero.logoUrl ? (
              <div className="flex w-full justify-center">
                <div className={LX_STANDARD_HERO_LOGO_WRAP}>
                  <Image
                    src={hero.logoUrl}
                    alt={hero.logoAlt || identity.businessName}
                    width={384}
                    height={384}
                    className="mx-auto h-28 w-28 max-h-[min(7.5rem,calc(100vw-8rem))] max-w-[min(7.5rem,calc(100vw-8rem))] object-contain sm:h-36 sm:w-36 md:h-40 md:w-40"
                    unoptimized={serviciosImageUnoptimized(hero.logoUrl)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div
                  className="flex h-[6.75rem] w-[6.75rem] items-center justify-center rounded-2xl border border-white/40 bg-black/25 shadow-lg backdrop-blur-sm sm:h-40 sm:w-40 md:h-44 md:w-44"
                  style={{ backgroundColor: `${SV.accent}cc` }}
                >
                  <span className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                    {(identity.businessName.trim().charAt(0) || "?").toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            <h1 className={LX_STANDARD_HERO_TITLE}>{identity.businessName}</h1>

            {metadataLine ? (
              <p className="max-w-2xl text-pretty text-xs font-medium leading-snug text-white/95 drop-shadow sm:text-sm md:text-base lg:text-lg">
                {metadataLine}
              </p>
            ) : null}

            <ServiciosLanguageChipRow
              profile={hero}
              lang={lang}
              maxVisible={3}
              chipClassName={`${LX_STANDARD_HERO_CHIP} shrink-0`}
              className="flex max-w-xl flex-wrap justify-center gap-1 sm:gap-1.5 md:gap-2"
            />

            {featuredChips.length > 0 ? (
              <div className="flex max-w-xl flex-wrap justify-center gap-1 sm:gap-1.5 md:gap-2">
                {profile.services
                  .filter((s) => {
                    const c = cleanProfessionalChipLabel(s.title);
                    return c && !isWeakProfessionalChipLabel(c) && featuredChips.includes(c);
                  })
                  .slice(0, 3)
                  .map((s) => {
                    const label = cleanProfessionalChipLabel(s.title);
                    const { emoji } = resolveServiciosServiceVisual({ id: s.id, label: s.title });
                    return (
                      <span key={s.id} className={`${LX_STANDARD_HERO_CHIP} gap-1`}>
                        <span className="shrink-0 text-[0.7rem] leading-none sm:text-[0.8rem]" aria-hidden>
                          {emoji}
                        </span>
                        <span className="min-w-0 truncate">{label}</span>
                      </span>
                    );
                  })}
              </div>
            ) : null}

            {about?.specialtiesLine ? (
              <p className="line-clamp-2 max-w-2xl text-pretty text-sm font-medium leading-snug text-white/90 drop-shadow sm:text-base">
                {about.specialtiesLine}
              </p>
            ) : null}

            {hoursPill ? (
              <span
                className={
                  hoursPill.variant === "open"
                    ? "inline-flex max-w-[min(100%,28rem)] items-center justify-center rounded-full border border-emerald-300/50 bg-emerald-950/35 px-3 py-1.5 text-[0.7rem] font-semibold leading-snug text-white shadow-sm backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm"
                    : hoursPill.variant === "closed"
                      ? "inline-flex max-w-[min(100%,28rem)] items-center justify-center rounded-full border border-white/25 bg-black/35 px-3 py-1.5 text-[0.7rem] font-semibold leading-snug text-white shadow-sm backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm"
                      : "inline-flex max-w-[min(100%,28rem)] items-center justify-center rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[0.7rem] font-semibold leading-snug text-white shadow-sm backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm"
                }
              >
                {hoursPill.text}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
