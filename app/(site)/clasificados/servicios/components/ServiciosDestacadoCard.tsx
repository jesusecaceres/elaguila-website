import Image from "next/image";
import Link from "next/link";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import { serviciosImageUnoptimized } from "@/app/servicios/lib/serviciosMediaUrl";
import {
  getServiciosPublicMonetizationBadges,
  serviciosListingDetailHref,
  type ServiciosDestacadoDisplayMode,
} from "../lib/serviciosDestacados";
import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";

export function ServiciosDestacadoCard({
  row,
  lang,
  displayMode,
}: {
  row: ServiciosPublicListingRow;
  lang: "es" | "en";
  displayMode: ServiciosDestacadoDisplayMode;
}) {
  const wire = { ...row.profile_json };
  wire.identity = { ...wire.identity, leonixVerified: row.leonix_verified === true };
  const profile = resolveServiciosProfile(wire, lang);
  const href = serviciosListingDetailHref(row, lang);
  const badges = getServiciosPublicMonetizationBadges(row, lang).slice(0, 4);

  const logoUrl = (profile.hero.logoUrl || "").trim();
  const coverUrl = (profile.hero.coverImageUrl || "").trim();
  const galleryUrl = (profile.gallery[0]?.url || "").trim();
  const imageUrl = coverUrl || (galleryUrl && galleryUrl !== logoUrl ? galleryUrl : "") || logoUrl;
  const imageAlt = profile.identity.businessName;
  const categoryLine = (profile.hero.categoryLine || row.internal_group || "").trim();
  const locationLine = (profile.hero.locationSummary || row.city || "").trim();

  const isHero = displayMode === "hero";
  const isCompact = displayMode === "compact";

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-[#FFFCF7] shadow-[0_18px_48px_-28px_rgba(122,98,32,0.45)] ring-1 ring-[#C9A84A]/15 transition hover:border-[#C9A84A]/50 hover:shadow-[0_22px_56px_-26px_rgba(122,98,32,0.5)] ${
        isHero ? "mx-auto max-w-md" : ""
      }`}
    >
      <div
        className={`relative w-full overflow-hidden bg-[#EFE7DA] ${
          isHero ? "aspect-[16/7] max-h-[150px]" : isCompact ? "aspect-[16/9] max-h-[135px]" : "aspect-[16/9] sm:aspect-[2/1]"
        }`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes={isHero ? "(max-width: 768px) 100vw, 672px" : "(max-width: 768px) 92vw, 400px"}
            unoptimized={serviciosImageUnoptimized(imageUrl)}
          />
        ) : (
          <div className="flex h-full min-h-[96px] items-center justify-center bg-gradient-to-br from-[#FFFDF9] to-[#F4EBE3] text-sm font-semibold text-[#8B7E70]">
            {lang === "en" ? "Leonix showcase" : "Vitrina Leonix"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2f4a]/35 via-transparent to-transparent" aria-hidden />
        {badges.length > 0 ? (
          <div className="absolute left-2 top-2 z-[2] flex max-w-[calc(100%-1rem)] flex-wrap gap-1 md:left-3 md:top-3">
            {badges.map((b) => (
              <span
                key={b.key}
                className={`rounded-full border border-white/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow-sm md:text-[10px] ${
                  b.key === "destacado" || b.key === "patrocinado"
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#9A7329] text-white"
                    : b.key === "leonix_advertiser"
                      ? "bg-[#1a3352]/85 text-white"
                      : "bg-white/95 text-[#5a4630]"
                }`}
              >
                {b.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className={`flex flex-1 flex-col ${isHero ? "p-4" : isCompact ? "p-3" : "p-4 sm:p-5"}`}>
        {categoryLine ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5a6b7c] sm:text-[11px]">
            {categoryLine}
          </p>
        ) : null}
        <h3
          className={`mt-1 font-bold leading-snug tracking-tight text-[#142a42] ${
            isHero ? "text-lg" : isCompact ? "text-base" : "text-lg"
          }`}
        >
          {profile.identity.businessName}
        </h3>
        {locationLine ? (
          <p className="mt-1.5 line-clamp-1 text-[13px] leading-snug text-[#4a5d6e] sm:text-sm">{locationLine}</p>
        ) : null}
        <div className="mt-auto pt-3">
          <Link
            href={href}
            className="inline-flex min-h-[38px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7A1E2C] to-[#5C1622] px-4 text-xs font-bold text-white shadow-md transition hover:brightness-[1.04] sm:w-auto sm:min-w-[8rem]"
          >
            {lang === "en" ? "View showcase" : "Ver vitrina"}
          </Link>
        </div>
      </div>
    </article>
  );
}
