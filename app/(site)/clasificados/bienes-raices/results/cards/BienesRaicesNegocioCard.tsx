import Link from "next/link";
import type { BrNegocioListing } from "./listingTypes";
import { BadgeStack } from "./BadgeStack";
import { IconBath, IconBed, IconCalendar, IconRuler } from "./cardIcons";

function FactsRow({ listing }: { listing: BrNegocioListing }) {
  return (
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
      {listing.year ? (
        <>
          <span className="h-3 w-px bg-[#E8DFD0]" aria-hidden />
          <span className="inline-flex items-center gap-1">
            <IconCalendar className="shrink-0 text-[#B8954A]" />
            {listing.year}
          </span>
        </>
      ) : null}
    </div>
  );
}

function IdentityRow({ listing }: { listing: BrNegocioListing }) {
  return (
    <div className="mt-3 flex items-center gap-2.5 border-t border-[#E8DFD0]/70 pt-3">
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#E8DFD0] bg-[#FFFCF7]">
        {listing.advertiser.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.advertiser.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-[#B8954A]">
            {listing.advertiser.name.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#1E1810]">{listing.advertiser.name}</p>
        {listing.advertiser.subtitle ? (
          <p className="truncate text-[11px] text-[#5C5346]/75">{listing.advertiser.subtitle}</p>
        ) : null}
      </div>
      {listing.trustChip ? (
        <span className="shrink-0 rounded-md border border-[#E8DFD0] bg-[#FFFCF7] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#6E5418]">
          {listing.trustChip}
        </span>
      ) : null}
    </div>
  );
}

export function BienesRaicesNegocioCard({ listing }: { listing: BrNegocioListing }) {
  const horizontal = listing.layout === "horizontal";

  if (horizontal) {
    return (
      <article className="group overflow-hidden rounded-2xl border border-[#E8DFD0]/95 bg-[#FDFBF7] shadow-[0_10px_36px_-16px_rgba(42,36,22,0.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_44px_-14px_rgba(42,36,22,0.28)]">
        <div className="flex flex-col sm:flex-row sm:items-stretch">
          <div className="relative sm:w-[42%] sm:max-w-[320px]">
            <div className="relative aspect-[16/10] sm:aspect-auto sm:h-full sm:min-h-[200px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={listing.imageUrl}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:brightness-[1.04]"
              />
              <BadgeStack badges={listing.badges} />
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col p-4 sm:py-4 sm:pl-5 sm:pr-4">
            <p className="text-lg font-bold tracking-tight text-[#B8954A] sm:text-xl">{listing.price}</p>
            <Link
              href={`/clasificados/bienes-raices/anuncio/${listing.id}`}
              className="mt-1 font-serif text-lg font-semibold leading-snug text-[#1E1810] decoration-[#C9B46A]/45 underline-offset-2 hover:underline"
            >
              {listing.title}
            </Link>
            <p className="mt-1 text-sm text-[#5C5346]">{listing.addressLine}</p>
            <FactsRow listing={listing} />
            {listing.openHouse ? (
              <p className="mt-2 text-[11px] font-medium text-[#4A7C59]">{listing.openHouse}</p>
            ) : null}
            {listing.metaLines?.length ? (
              <p className="mt-1 text-[11px] text-[#5C5346]/75">{listing.metaLines[0]}</p>
            ) : null}
            <div className="mt-auto pt-3">
              <IdentityRow listing={listing} />
            </div>
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
        <BadgeStack badges={listing.badges} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xl font-bold tracking-tight text-[#B8954A]">{listing.price}</p>
        <Link
          href={`/clasificados/bienes-raices/anuncio/${listing.id}`}
          className="mt-1 font-serif text-lg font-semibold leading-snug text-[#1E1810] decoration-[#C9B46A]/45 underline-offset-2 hover:underline"
        >
          {listing.title}
        </Link>
        <p className="mt-1 text-sm text-[#5C5346]">{listing.addressLine}</p>
        <FactsRow listing={listing} />
        {listing.openHouse ? (
          <p className="mt-2 text-[11px] font-medium text-[#4A7C59]">{listing.openHouse}</p>
        ) : null}
        {listing.metaLines?.length ? (
          <p className="mt-1 text-[11px] text-[#5C5346]/75">{listing.metaLines[0]}</p>
        ) : null}
        <div className="mt-auto pt-3">
          <IdentityRow listing={listing} />
        </div>
      </div>
    </article>
  );
}
