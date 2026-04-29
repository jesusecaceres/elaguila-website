import Link from "next/link";
import { FiMapPin, FiHome, FiCalendar } from "react-icons/fi";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import type { RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { rentasListingResultsHandoff } from "@/app/clasificados/rentas/landing/rentasListingResultsHandoff";
import { IconBath, IconBed, IconRuler } from "@/app/clasificados/bienes-raices/resultados/cards/cardIcons";
import {
  rentasCardSurfaceClass,
  rentasLinkSupportClass,
  rentasResultCardPromotedClass,
} from "@/app/clasificados/rentas/rentasLandingTheme";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";

function badgeLabel(b: string, copy: RentasLandingCopy["card"]) {
  if (b === "destacada") return copy.destacada;
  if (b === "promo") return "PROMO";
  if (b === "privado") return copy.sellerPrivado;
  if (b === "negocio") return copy.sellerNegocio;
  if (b === "comercial") return copy.sellerNegocio;
  return b;
}

function BadgeRow({ listing, copy }: { listing: RentasPublicListing; copy: RentasLandingCopy["card"] }) {
  if (!listing.badges.length) return null;
  return (
    <div className="absolute left-2 top-2 z-[2] flex flex-wrap gap-1">
      {listing.badges.map((b) => (
        <span
          key={b}
          className={
            "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow-sm " +
            (b === "destacada"
              ? "border border-[#E8A849]/45 bg-[#FFF4E0]/95 text-[#7A4A12]"
              : b === "privado"
                ? "border border-[#5B7C99]/30 bg-[#E8EEF4]/95 text-[#2C3E4D]"
                : b === "promo"
                  ? "bg-[#8B6914]/95 text-[#FFFCF7]"
                  : b === "negocio" || b === "comercial"
                    ? "border border-[#D4A84B]/40 bg-[#FFF8E8]/95 text-[#6B4E1D]"
                    : "bg-[#2A2620]/92 text-[#FAF7F2]")
          }
        >
          {badgeLabel(b, copy)}
        </span>
      ))}
    </div>
  );
}

function FactsRow({ listing }: { listing: RentasPublicListing }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5C5346]">
      <span className="inline-flex items-center gap-1">
        <IconBed className="shrink-0 text-[#5B7C99]" />
        {listing.beds}
      </span>
      <span className="h-3 w-px bg-[#E4D9C8]" aria-hidden />
      <span className="inline-flex items-center gap-1">
        <IconBath className="shrink-0 text-[#5B7C99]" />
        {listing.baths}
      </span>
      <span className="h-3 w-px bg-[#E4D9C8]" aria-hidden />
      <span className="inline-flex items-center gap-1">
        <IconRuler className="shrink-0 text-[#5B7C99]" />
        {listing.sqft}
      </span>
    </div>
  );
}

function categoriaLabel(listing: RentasPublicListing, copy: RentasLandingCopy): string {
  const c = listing.categoriaPropiedad;
  if (c === "residencial") return copy.quickExplore.chipResidencial;
  if (c === "comercial") return copy.quickExplore.chipComercial;
  return copy.quickExplore.chipTerreno;
}

type Props = {
  listing: RentasPublicListing;
  copy: RentasLandingCopy;
  lang: RentasLandingLang;
};

export function RentasResultCard({ listing, copy, lang }: Props) {
  const href = rentasListingResultsHandoff(listing, lang);
  const horizontal = listing.layout === "horizontal";
  const seller = listing.branch === "privado" ? copy.card.sellerPrivado : copy.card.sellerNegocio;
  const cat = categoriaLabel(listing, copy);
  const elevated = listing.promoted === true || listing.badges.includes("destacada");
  const cardRing = elevated
    ? "rounded-3xl border border-[#D4A574]/30 bg-[#FFFAF0] shadow-[0_12px_48px_-20px_rgba(212,165,116,0.15)] overflow-hidden"
    : "rounded-3xl border border-[#D4A574]/20 bg-[#FFFAF0] shadow-[0_8px_32px_rgba(212,165,116,0.1)] overflow-hidden";

  if (horizontal) {
    return (
      <article className={`group overflow-hidden ${cardRing}`}>
        <div className="flex flex-col sm:flex-row sm:items-stretch">
          <div className="relative sm:w-[42%] sm:max-w-[320px]">
            <div className="relative aspect-[16/10] sm:aspect-auto sm:h-full sm:min-h-[200px]">
              <img
                src={listing.imageUrl}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:brightness-[1.04]"
              />
              <BadgeRow listing={listing} copy={copy.card} />
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col p-4 sm:py-4 sm:pl-5 sm:pr-4">
            <p className="text-xl font-bold text-[#2A7F3E] leading-tight sm:text-2xl">{listing.rentDisplay}</p>
            <Link
              href={href}
              className="mt-2 text-xl font-bold text-[#1A1A1A] leading-tight hover:text-[#D4A574] transition-colors"
            >
              {listing.title}
            </Link>
            <div className="mt-2 flex items-center gap-2 text-sm text-[#4A4A4A]">
              <FiMapPin className="w-4 h-4 text-[#D4A574]" />
              {listing.addressLine}
            </div>
            <FactsRow listing={listing} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full px-3 py-1 text-xs font-medium bg-[#D4A574]/10 text-[#D4A574] border border-[#D4A574]/20">
                {seller}
              </span>
              <span className="text-xs font-medium text-[#7A7A7A] uppercase tracking-wide">{cat}</span>
            </div>
            <Link href={href} className="mt-auto pt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 border border-[#D4A574]/30 bg-white text-[#1A1A1A] hover:bg-[#FFFAF0] hover:border-[#D4A574]">
              Ver detalles
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`group flex h-full flex-col overflow-hidden ${cardRing}`}>
      <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/10]">
        <img
          src={listing.imageUrl}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:brightness-[1.04]"
        />
        <BadgeRow listing={listing} copy={copy.card} />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-2xl font-bold text-[#2A7F3E] leading-tight">{listing.rentDisplay}</p>
        <Link
          href={href}
          className="mt-2 text-xl font-bold text-[#1A1A1A] leading-tight hover:text-[#D4A574] transition-colors"
        >
          {listing.title}
        </Link>
        <div className="mt-2 flex items-center gap-2 text-sm text-[#4A4A4A]">
          <FiMapPin className="w-4 h-4 text-[#D4A574]" />
          {listing.addressLine}
        </div>
        <FactsRow listing={listing} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full px-3 py-1 text-xs font-medium bg-[#D4A574]/10 text-[#D4A574] border border-[#D4A574]/20">
            {seller}
          </span>
          <span className="text-xs font-medium text-[#7A7A7A] uppercase tracking-wide">{cat}</span>
        </div>
        <Link href={href} className="mt-auto pt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 border border-[#D4A574]/30 bg-white text-[#1A1A1A] hover:bg-[#FFFAF0] hover:border-[#D4A574]">
          Ver detalles
        </Link>
      </div>
    </article>
  );
}
