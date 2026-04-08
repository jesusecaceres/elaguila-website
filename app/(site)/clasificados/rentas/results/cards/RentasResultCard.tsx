import Link from "next/link";
import type { RentasResultsDemoListing } from "../rentasResultsDemoData";
import { IconBath, IconBed, IconRuler } from "@/app/clasificados/bienes-raices/results/cards/cardIcons";

function BadgeRow({ listing }: { listing: RentasResultsDemoListing }) {
  if (!listing.badges.length) return null;
  return (
    <div className="absolute left-2 top-2 z-[2] flex flex-wrap gap-1">
      {listing.badges.map((b) => (
        <span
          key={b}
          className={
            "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow-sm " +
            (b === "privado"
              ? "bg-[#4A7C59]/90 text-white"
              : b === "promo"
                ? "bg-[#8B6914]/95 text-[#FFFCF7]"
                : "bg-[#2A2620]/92 text-[#FAF7F2]")
          }
        >
          {b === "promo" ? "PROMO" : b}
        </span>
      ))}
    </div>
  );
}

function FactsRow({ listing }: { listing: RentasResultsDemoListing }) {
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
    </div>
  );
}

export function RentasResultCard({ listing }: { listing: RentasResultsDemoListing }) {
  const href = `/clasificados/rentas/anuncio/${listing.id}`;
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
              <BadgeRow listing={listing} />
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col p-4 sm:py-4 sm:pl-5 sm:pr-4">
            <p className="text-lg font-bold tracking-tight text-[#B8954A] sm:text-xl">{listing.rentDisplay}</p>
            <Link
              href={href}
              className="mt-1 font-serif text-lg font-semibold leading-snug text-[#1E1810] decoration-[#C9B46A]/45 underline-offset-2 hover:underline"
            >
              {listing.title}
            </Link>
            <p className="mt-1 text-sm text-[#5C5346]">{listing.addressLine}</p>
            <FactsRow listing={listing} />
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[#5C5346]/70">
              {listing.branch === "privado" ? "Particular" : "Negocio"} · {listing.categoriaPropiedad.replace("_", " ")}
            </p>
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
        <BadgeRow listing={listing} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xl font-bold tracking-tight text-[#B8954A]">{listing.rentDisplay}</p>
        <Link
          href={href}
          className="mt-1 font-serif text-lg font-semibold leading-snug text-[#1E1810] decoration-[#C9B46A]/45 underline-offset-2 hover:underline"
        >
          {listing.title}
        </Link>
        <p className="mt-1 text-sm text-[#5C5346]">{listing.addressLine}</p>
        <FactsRow listing={listing} />
        <p className="mt-auto pt-3 text-[10px] font-medium uppercase tracking-wide text-[#5C5346]/70">
          {listing.branch === "privado" ? "Particular" : "Negocio"} · {listing.categoriaPropiedad.replace("_", " ")}
        </p>
      </div>
    </article>
  );
}
