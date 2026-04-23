import Link from "next/link";
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
    ? `${rentasCardSurfaceClass} ${rentasResultCardPromotedClass}`
    : `${rentasCardSurfaceClass} ring-1 ring-[#D4C4A8]/32`;

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
            <p className="text-lg font-bold tracking-tight text-[#B8893C] sm:text-xl">{listing.rentDisplay}</p>
            <Link
              href={href}
              className="mt-1 font-serif text-lg font-semibold leading-snug text-[#1E1810] decoration-[#5B7C99]/35 underline-offset-2 hover:underline"
            >
              {listing.title}
            </Link>
            <p className="mt-1 text-sm text-[#5C5346]">{listing.addressLine}</p>
            <FactsRow listing={listing} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={
                  "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide " +
                  (listing.branch === "privado"
                    ? "border-[#5B7C99]/28 bg-[#E8EEF4]/95 text-[#2C3E4D]"
                    : "border-[#D4A84B]/40 bg-[#FFF8E8]/95 text-[#6B4E1D]")
                }
              >
                {seller}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-[#5C5346]/75">{cat}</span>
            </div>
            <Link href={href} className={`mt-3 text-sm font-semibold ${rentasLinkSupportClass}`}>
              {copy.card.verResultados}
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
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xl font-bold tracking-tight text-[#B8893C]">{listing.rentDisplay}</p>
        <Link
          href={href}
          className="mt-1 font-serif text-lg font-semibold leading-snug text-[#1E1810] decoration-[#5B7C99]/35 underline-offset-2 hover:underline"
        >
          {listing.title}
        </Link>
        <p className="mt-1 text-sm text-[#5C5346]">{listing.addressLine}</p>
        <FactsRow listing={listing} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={
              "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide " +
              (listing.branch === "privado"
                ? "border-[#5B7C99]/28 bg-[#E8EEF4]/95 text-[#2C3E4D]"
                : "border-[#D4A84B]/40 bg-[#FFF8E8]/95 text-[#6B4E1D]")
            }
          >
            {seller}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-[#5C5346]/75">{cat}</span>
        </div>
        <Link href={href} className={`mt-auto pt-4 text-sm font-semibold ${rentasLinkSupportClass}`}>
          {copy.card.verResultados}
        </Link>
      </div>
    </article>
  );
}
