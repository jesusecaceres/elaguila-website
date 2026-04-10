import Link from "next/link";
import { IconBath, IconBed, IconRuler } from "@/app/clasificados/bienes-raices/resultados/cards/cardIcons";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import type { RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { rentasCardSurfaceClass, rentasLinkSupportClass } from "@/app/clasificados/rentas/rentasLandingTheme";
import type { RentasResultsDemoListing } from "@/app/clasificados/rentas/results/rentasResultsDemoData";
import { rentasListingResultsHandoff } from "./rentasListingResultsHandoff";

function SellerBadge({ branch, copy }: { branch: "privado" | "negocio"; copy: RentasLandingCopy["card"] }) {
  if (branch === "privado") {
    return (
      <span className="rounded-full border border-[#5B7C99]/25 bg-[#E8EEF4]/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2C3E4D]">
        {copy.sellerPrivado}
      </span>
    );
  }
  return (
    <span className="rounded-full border border-[#D4A84B]/45 bg-[#FFF8E8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6B4E1D]">
      {copy.sellerNegocio}
    </span>
  );
}

function PromoBadges({ listing, copy }: { listing: RentasResultsDemoListing; copy: RentasLandingCopy["card"] }) {
  const showDestacada = listing.badges.includes("destacada") || listing.promoted;
  if (!showDestacada) return null;
  return (
    <span className="rounded-md border border-[#E8A849]/40 bg-[#FFF4E0]/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#7A4A12] shadow-sm">
      {copy.destacada}
    </span>
  );
}

type Props = {
  listing: RentasResultsDemoListing;
  layout?: "vertical" | "horizontal";
  copy: RentasLandingCopy;
  lang: RentasLandingLang;
};

export function RentasLandingCard({ listing, layout = "vertical", copy, lang }: Props) {
  const href = rentasListingResultsHandoff(listing, lang);
  const horizontal = layout === "horizontal";

  if (horizontal) {
    return (
      <article className={`group overflow-hidden ${rentasCardSurfaceClass} ring-1 ring-[#D4C4A8]/32`}>
        <div className="flex flex-col sm:flex-row sm:items-stretch">
          <div className="relative shrink-0 sm:w-[42%] sm:max-w-[min(100%,300px)]">
            <div className="relative aspect-[16/10] sm:aspect-auto sm:h-full sm:min-h-[200px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={listing.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:brightness-[1.03]" />
              <div className="absolute left-2 top-2 z-[2] flex flex-wrap gap-1">
                <PromoBadges listing={listing} copy={copy.card} />
              </div>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col p-4 sm:py-4 sm:pl-5 sm:pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold tracking-tight text-[#B8893C] sm:text-xl">{listing.rentDisplay}</p>
              <SellerBadge branch={listing.branch} copy={copy.card} />
            </div>
            <Link
              href={href}
              className="mt-1 font-serif text-lg font-semibold leading-snug text-[#1E1810] decoration-[#5B7C99]/35 underline-offset-2 hover:underline"
            >
              {listing.title}
            </Link>
            <p className="mt-1 text-sm text-[#5C5346]">{listing.addressLine}</p>
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
            <Link href={href} className={`mt-3 text-sm font-semibold ${rentasLinkSupportClass}`}>
              {copy.card.verResultados}
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`group flex h-full min-h-0 flex-col overflow-hidden ${rentasCardSurfaceClass} ring-1 ring-[#D4C4A8]/32`}>
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#E8E0D4]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.imageUrl}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:brightness-[1.03]"
        />
        <div className="absolute left-2 top-2 z-[2] flex flex-wrap items-center gap-1">
          <PromoBadges listing={listing} copy={copy.card} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xl font-bold tracking-tight text-[#B8893C]">{listing.rentDisplay}</p>
          <SellerBadge branch={listing.branch} copy={copy.card} />
        </div>
        <Link
          href={href}
          className="mt-1 font-serif text-lg font-semibold leading-snug text-[#1E1810] decoration-[#5B7C99]/35 underline-offset-2 hover:underline"
        >
          {listing.title}
        </Link>
        <p className="mt-1 text-sm text-[#5C5346]">{listing.addressLine}</p>
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
        <Link href={href} className={`mt-auto pt-4 text-sm font-semibold ${rentasLinkSupportClass}`}>
          {copy.card.verResultados}
        </Link>
      </div>
    </article>
  );
}
