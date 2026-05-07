import Image from "next/image";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { SV } from "./serviciosDesignTokens";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { resolveServiciosServiceVisual } from "@/app/(site)/clasificados/servicios/lib/serviciosServiceVisualCatalog";
import { buildServiciosHeroHoursPill } from "./serviciosHeroHoursStatus";

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
  engagementListingId = null,
  engagementOwnerUserId = null,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  engagementListingId?: string | null;
  engagementOwnerUserId?: string | null;
}) {
  const { identity, hero } = profile;
  const about = profile.about;
  const metadataLine = buildHeroMetadataLine(profile);
  const hoursPill = buildServiciosHeroHoursPill(profile.contact.hours, lang);
  const featuredServices = profile.services.slice(0, 3);

  const lxListingId = (engagementListingId ?? "").trim() || identity.slug;
  const lxOwner = (engagementOwnerUserId ?? "").trim() || undefined;
  const persistEngagement = Boolean((engagementListingId ?? "").trim());

  return (
    <section className="relative w-full overflow-hidden rounded-xl shadow-[0_20px_60px_rgba(30,24,16,0.12)] sm:rounded-2xl md:rounded-3xl">
      <div className="relative aspect-[16/10] w-full min-h-[200px] sm:aspect-[21/9] sm:min-h-[240px] md:aspect-[2.4/1] md:min-h-[320px]">
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

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25" aria-hidden />

        <div className="absolute top-4 right-4 z-20">
          <div className="flex flex-col gap-2">
            <div className="rounded-full bg-white/92 p-1 shadow-lg backdrop-blur-sm">
              <LeonixLikeButton
                listingId={lxListingId}
                ownerUserId={lxOwner}
                variant="small"
                lang={lang}
                category="servicios"
                className="border-0"
                persistEngagement={persistEngagement}
              />
            </div>
            <div className="rounded-full bg-white/92 p-1 shadow-lg backdrop-blur-sm">
              <LeonixSaveButton
                listingId={lxListingId}
                ownerUserId={lxOwner}
                variant="small"
                lang={lang}
                category="servicios"
                className="border-0"
                persistEngagement={persistEngagement}
              />
            </div>
            <div className="rounded-full bg-white/92 p-1 shadow-lg backdrop-blur-sm">
              <LeonixShareButton
                listingId={lxListingId}
                ownerUserId={lxOwner}
                listingTitle={identity.businessName}
                variant="small"
                lang={lang}
                category="servicios"
                className="border-0"
                persistEngagement={persistEngagement}
              />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 py-6 text-center text-white sm:px-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 sm:gap-4">
            {hero.logoUrl ? (
              <div className="flex justify-center">
                <div className="rounded-2xl border border-white/35 bg-black/20 p-2.5 shadow-lg shadow-black/20 backdrop-blur-[2px] sm:p-3">
                  <Image
                    src={hero.logoUrl}
                    alt={hero.logoAlt || identity.businessName}
                    width={192}
                    height={192}
                    className="h-36 w-36 object-contain sm:h-44 sm:w-44"
                    unoptimized={serviciosImageUnoptimized(hero.logoUrl)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div
                  className="flex h-36 w-36 items-center justify-center rounded-2xl border border-white/40 bg-black/25 shadow-lg backdrop-blur-sm sm:h-44 sm:w-44"
                  style={{ backgroundColor: `${SV.accent}cc` }}
                >
                  <span className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                    {(identity.businessName.trim().charAt(0) || "?").toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight drop-shadow-md sm:text-4xl md:text-5xl">
              {identity.businessName}
            </h1>

            {metadataLine ? (
              <p className="max-w-2xl text-pretty text-sm font-medium leading-snug text-white/95 drop-shadow sm:text-base md:text-lg">
                {metadataLine}
              </p>
            ) : null}

            {featuredServices.length > 0 ? (
              <div className="flex max-w-xl flex-wrap justify-center gap-1.5 sm:gap-2">
                {featuredServices.map((s) => {
                  const { emoji } = resolveServiciosServiceVisual({ id: s.id, label: s.title });
                  return (
                    <span
                      key={s.id}
                      className="inline-flex max-w-[10.5rem] items-center gap-1 rounded-full border border-white/30 bg-black/30 px-2.5 py-1 text-[0.7rem] font-medium text-white/95 backdrop-blur-sm sm:max-w-[12rem] sm:text-xs"
                    >
                      <span className="shrink-0 text-[0.72rem] leading-none sm:text-[0.8rem]" aria-hidden>
                        {emoji}
                      </span>
                      <span className="min-w-0 truncate">{s.title}</span>
                    </span>
                  );
                })}
              </div>
            ) : null}

            {about?.specialtiesLine ? (
              <p className="max-w-2xl text-pretty text-base font-medium leading-snug text-white/90 drop-shadow sm:text-lg">
                {about.specialtiesLine}
              </p>
            ) : null}

            {hoursPill ? (
              <span
                className={
                  hoursPill.variant === "open"
                    ? "inline-flex max-w-[min(100%,28rem)] items-center justify-center rounded-full border border-emerald-300/50 bg-emerald-950/35 px-3 py-2 text-xs font-semibold leading-snug text-white shadow-sm backdrop-blur-sm sm:px-4 sm:text-sm"
                    : hoursPill.variant === "closed"
                      ? "inline-flex max-w-[min(100%,28rem)] items-center justify-center rounded-full border border-white/25 bg-black/35 px-3 py-2 text-xs font-semibold leading-snug text-white shadow-sm backdrop-blur-sm sm:px-4 sm:text-sm"
                      : "inline-flex max-w-[min(100%,28rem)] items-center justify-center rounded-full border border-white/30 bg-white/15 px-3 py-2 text-xs font-semibold leading-snug text-white shadow-sm backdrop-blur-sm sm:px-4 sm:text-sm"
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
