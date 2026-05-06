import Image from "next/image";
import { FiMapPin, FiStar, FiClock } from "react-icons/fi";
import { FaCheckCircle, FaHeart, FaBookmark, FaShare } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { ServiciosStarRating } from "./ServiciosStarRating";
import { SV } from "./serviciosDesignTokens";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { resolveServiciosServiceVisual } from "@/app/(site)/clasificados/servicios/lib/serviciosServiceVisualCatalog";

function badgeStyle(kind: string) {
  if (kind === "verified") return "border-[#3B66AD]/35 bg-[#3B66AD]/10 text-[#2d528d]";
  return "border-black/[0.08] bg-white/90 text-[color:var(--lx-text-2)]";
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
  const L = getServiciosProfileLabels(lang);
  const { identity, hero } = profile;
  const rating = hero.rating;
  const reviewCount = hero.reviewCount;
  const about = profile.about;
  const heroFacts = profile.quickFacts.slice(0, 3);

  const headlineSub =
    hero.categoryLine && hero.locationSummary
      ? `${hero.categoryLine} · ${hero.locationSummary}`
      : hero.categoryLine || hero.locationSummary || null;

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
              background: `linear-gradient(135deg, ${SV.warm} 0%, ${SV.gold} 45%, ${SV.beige} 100%)`,
            }}
          />
        )}
        
        {/* Premium dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" aria-hidden />
        
        {/* Top-right engagement actions */}
        <div className="absolute top-4 right-4 z-20">
          <div className="flex flex-col gap-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg">
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
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg">
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
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg">
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
        
        {/* Hero content - centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8 text-white text-center">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Business logo */}
            {hero.logoUrl ? (
              <div className="mb-8 flex justify-center">
                <Image
                  src={hero.logoUrl}
                  alt={hero.logoAlt || identity.businessName}
                  width={320}
                  height={320}
                  className="w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-white/20 p-6 object-contain shadow-xl"
                  unoptimized={serviciosImageUnoptimized(hero.logoUrl)}
                />
              </div>
            ) : (
              <div className="mb-8 flex justify-center">
                <div
                  className="w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-white/20 p-6 shadow-xl flex items-center justify-center"
                  style={{ background: SV.blue }}
                >
                  <span className="text-6xl font-bold text-white">
                    {(identity.businessName.trim().charAt(0) || "?").toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            
            {/* Business name */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-2xl">
              {identity.businessName}
            </h1>
            
            {/* Category and location */}
            {headlineSub && (
              <div className="flex flex-wrap justify-center gap-2 text-lg sm:text-xl font-medium drop-shadow">
                {headlineSub.split(' · ').map((item, index) => (
                  <span key={index} className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                    {item.trim()}
                  </span>
                ))}
              </div>
            )}

            {profile.services.length > 0 ? (
              <div className="mt-1 flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {profile.services.slice(0, 4).map((s) => {
                  const { emoji } = resolveServiciosServiceVisual({ id: s.id, label: s.title });
                  return (
                    <span
                      key={s.id}
                      className="inline-flex max-w-[11rem] items-center gap-1 rounded-full border border-white/25 bg-black/25 px-2.5 py-1 text-xs font-medium backdrop-blur-sm sm:max-w-[14rem] sm:text-sm"
                    >
                      <span className="shrink-0 text-[0.8rem] leading-none sm:text-[0.85rem]" aria-hidden>
                        {emoji}
                      </span>
                      <span className="min-w-0 truncate">{s.title}</span>
                    </span>
                  );
                })}
              </div>
            ) : null}
            
            {/* Specialties */}
            {about?.specialtiesLine && (
              <div className="text-xl sm:text-2xl font-medium drop-shadow">
                {about.specialtiesLine}
              </div>
            )}
            
            {/* Status, hours, service zones row */}
            <div className="flex flex-wrap justify-center items-center gap-3 text-sm sm:text-base">
              {/* Hours status */}
              {profile.contact.hours?.openNowLabel && (
                <span className="px-4 py-2 rounded-full font-semibold backdrop-blur-sm bg-green-500/30 text-white border border-green-400/50">
                  🟢 {profile.contact.hours.openNowLabel}
                </span>
              )}
              
              {/* Service zones */}
              {hero.locationSummary && (
                <span className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm flex items-center gap-1">
                  <FiMapPin className="w-4 h-4" />
                  {hero.locationSummary}
                </span>
              )}
              
              {/* Rating */}
              {rating != null && (
                <span className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm flex items-center gap-1">
                  <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{rating.toFixed(1)}</span>
                  {reviewCount != null && (
                    <span className="text-white/80">({reviewCount})</span>
                  )}
                </span>
              )}
            </div>
            
            {/* Full address */}
            {profile.contact.physicalAddressDisplay && (
              <div className="text-base sm:text-lg drop-shadow">
                <span className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm inline-block">
                  {profile.contact.physicalAddressDisplay}
                </span>
              </div>
            )}
            
                        
            {/* Quick facts chips */}
            {heroFacts.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                {heroFacts.map((f, index) => (
                  <span key={index} className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                    ✓ {f.label}
                  </span>
                ))}
              </div>
            )}
            
            {/* Badges */}
            {hero.badges.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                {hero.badges.map((b, index) => (
                  <span key={index} className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm flex items-center gap-1">
                    {b.kind === "verified" && <FaCheckCircle className="w-4 h-4" />}
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
