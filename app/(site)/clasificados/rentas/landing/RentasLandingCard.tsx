import Link from "next/link";
import { IconBath, IconBed, IconRuler } from "@/app/clasificados/bienes-raices/resultados/cards/cardIcons";
import type { RentasResultsDemoListing } from "@/app/clasificados/rentas/results/rentasResultsDemoData";
import { rentasListingResultsHandoff } from "./rentasListingResultsHandoff";

function SellerBadge({ branch }: { branch: "privado" | "negocio" }) {
  if (branch === "privado") {
    return (
      <span className="rounded-full bg-[#D4C4A8]/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1E1810]">
        Privado
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#2A2620]/92 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#FAF7F2]">
      Negocio
    </span>
  );
}

function PromoBadges({ listing }: { listing: RentasResultsDemoListing }) {
  const showDestacada = listing.badges.includes("destacada") || listing.promoted;
  if (!showDestacada) return null;
  return (
    <span className="rounded-md bg-[#C9B46A]/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#1E1810] shadow-sm">
      Destacada
    </span>
  );
}

type Props = {
  listing: RentasResultsDemoListing;
  layout?: "vertical" | "horizontal";
};

export function RentasLandingCard({ listing, layout = "vertical" }: Props) {
  const href = rentasListingResultsHandoff(listing);
  const horizontal = layout === "horizontal";

  if (horizontal) {
    return (
      <article className="group overflow-hidden rounded-2xl border border-[#E8DFD0]/95 bg-[#FDFBF7] shadow-[0_10px_36px_-16px_rgba(42,36,22,0.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_44px_-14px_rgba(42,36,22,0.28)]">
        <div className="flex flex-col sm:flex-row sm:items-stretch">
          <div className="relative sm:w-[42%] sm:max-w-[300px]">
            <div className="relative aspect-[16/10] sm:aspect-auto sm:h-full sm:min-h-[180px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={listing.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:brightness-[1.04]" />
              <div className="absolute left-2 top-2 z-[2] flex flex-wrap gap-1">
                <PromoBadges listing={listing} />
              </div>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col p-4 sm:py-4 sm:pl-5 sm:pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold tracking-tight text-[#B8954A] sm:text-xl">{listing.rentDisplay}</p>
              <SellerBadge branch={listing.branch} />
            </div>
            <Link
              href={href}
              className="mt-1 font-serif text-lg font-semibold leading-snug text-[#1E1810] decoration-[#C9B46A]/45 underline-offset-2 hover:underline"
            >
              {listing.title}
            </Link>
            <p className="mt-1 text-sm text-[#5C5346]">{listing.addressLine}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5C5346]">
              <span className="inline-flex items-center gap-1">
                <IconBed className="shrink-0 text-[#B8954A]" />
                {listing.beds}
              </span>
              <span className="h-3 w-px bg-[#E8DFD0]" aria-hidden />
              <span className="inline-flex items-center gap-1">
                <IconBath className="shrink-0 text-[#B8954A]" />
                {listing.baths}
              </span>
              <span className="h-3 w-px bg-[#E8DFD0]" aria-hidden />
              <span className="inline-flex items-center gap-1">
                <IconRuler className="shrink-0 text-[#B8954A]" />
                {listing.sqft}
              </span>
            </div>
            <Link href={href} className="mt-3 text-sm font-semibold text-[#4A7C59] hover:underline">
              Ver en resultados
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E8DFD0]/95 bg-[#FDFBF7] shadow-[0_10px_36px_-16px_rgba(42,36,22,0.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_44px_-14px_rgba(42,36,22,0.28)]">
      <div className="relative aspect-[16/11] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.imageUrl}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:brightness-[1.04]"
        />
        <div className="absolute left-2 top-2 z-[2] flex flex-wrap items-center gap-1">
          <PromoBadges listing={listing} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xl font-bold tracking-tight text-[#B8954A]">{listing.rentDisplay}</p>
          <SellerBadge branch={listing.branch} />
        </div>
        <Link
          href={href}
          className="mt-1 font-serif text-lg font-semibold leading-snug text-[#1E1810] decoration-[#C9B46A]/45 underline-offset-2 hover:underline"
        >
          {listing.title}
        </Link>
        <p className="mt-1 text-sm text-[#5C5346]">{listing.addressLine}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5C5346]">
          <span className="inline-flex items-center gap-1">
            <IconBed className="shrink-0 text-[#B8954A]" />
            {listing.beds}
          </span>
          <span className="h-3 w-px bg-[#E8DFD0]" aria-hidden />
          <span className="inline-flex items-center gap-1">
            <IconBath className="shrink-0 text-[#B8954A]" />
            {listing.baths}
          </span>
          <span className="h-3 w-px bg-[#E8DFD0]" aria-hidden />
          <span className="inline-flex items-center gap-1">
            <IconRuler className="shrink-0 text-[#B8954A]" />
            {listing.sqft}
          </span>
        </div>
        <Link href={href} className="mt-auto pt-4 text-sm font-semibold text-[#4A7C59] hover:underline">
          Ver en resultados
        </Link>
      </div>
    </article>
  );
}
