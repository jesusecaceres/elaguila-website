import Link from "next/link";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { BrNegocioListing } from "./listingTypes";
import { BadgeStack } from "./BadgeStack";
import { IconBath, IconBed, IconCalendar, IconRuler } from "./cardIcons";

function sellerKindUi(listing: BrNegocioListing): "privado" | "negocio" {
  if (listing.sellerKind) return listing.sellerKind;
  return listing.badges.includes("negocio") ? "negocio" : "privado";
}

export function BienesRaicesNegocioFeaturedCard({
  listing,
  titleAsLink = true,
  className,
  sellerKindLabels,
  lang,
}: {
  listing: BrNegocioListing;
  /** When false, title is plain text (e.g. landing hero before live detail routes). */
  titleAsLink?: boolean;
  className?: string;
  sellerKindLabels?: { privado: string; negocio: string };
  /** When `titleAsLink` and set, detail href preserves `?lang=`. */
  lang?: Lang;
}) {
  const priv = sellerKindLabels?.privado ?? "Privado";
  const neg = sellerKindLabels?.negocio ?? "Negocio";
  const surface =
    "group overflow-hidden rounded-2xl border border-[#E8DFD0]/95 bg-[#FDFBF7] shadow-[0_16px_48px_-20px_rgba(42,36,22,0.28)] transition duration-300 hover:shadow-[0_22px_56px_-18px_rgba(42,36,22,0.32)]";
  return (
    <article className={className ? `${surface} ${className}` : surface}>
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="relative lg:w-[52%]">
          <div className="relative aspect-[16/11] overflow-hidden lg:aspect-auto lg:min-h-[280px] lg:h-full">
            { }
            <img
              src={listing.imageUrl}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:brightness-[1.03]"
            />
            <BadgeStack badges={listing.badges} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#E8DFD0]/80 bg-[#FFFCF7] px-4 py-3 text-sm text-[#3D3630]">
            <p className="text-xl font-bold tracking-tight text-[#B8954A] sm:text-2xl">{listing.price}</p>
            <div className="flex flex-wrap items-center gap-3 text-[#5C5346]">
              <span className="inline-flex items-center gap-1">
                <IconBed className="text-[#B8954A]" />
                {listing.beds}
              </span>
              <span className="inline-flex items-center gap-1">
                <IconBath className="text-[#B8954A]" />
                {listing.baths}
              </span>
              <span className="inline-flex items-center gap-1">
                <IconRuler className="text-[#B8954A]" />
                {listing.sqft}
              </span>
              {listing.year ? (
                <span className="inline-flex items-center gap-1">
                  <IconCalendar className="text-[#B8954A]" />
                  {listing.year}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between border-t border-[#E8DFD0]/70 bg-[#FDFBF7] p-5 lg:border-l lg:border-t-0">
          <div>
            {titleAsLink ? (
              <Link
                href={
                  lang
                    ? appendLangToPath(`/clasificados/bienes-raices/anuncio/${listing.id}`, lang)
                    : `/clasificados/bienes-raices/anuncio/${listing.id}`
                }
                className="block font-serif text-2xl font-semibold leading-tight text-[#1E1810] decoration-[#C9B46A]/50 underline-offset-4 hover:underline"
              >
                {listing.title}
              </Link>
            ) : (
              <p className="font-serif text-2xl font-semibold leading-tight text-[#1E1810]">{listing.title}</p>
            )}
            <p className="mt-2 text-sm text-[#5C5346]">{listing.addressLine}</p>
            <p className="mt-3 text-lg font-semibold text-[#B8954A]">{listing.price}</p>
            {listing.metaLines?.length ? (
              <ul className="mt-3 space-y-1 text-xs text-[#5C5346]/85">
                {listing.metaLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="mt-6 flex items-center gap-3 border-t border-[#E8DFD0]/60 pt-4">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#E8DFD0] bg-[#FFFCF7]">
              {listing.advertiser.photoUrl ? (
                 
                <img src={listing.advertiser.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-bold text-[#B8954A]">
                  {listing.advertiser.name.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold text-[#1E1810]">{listing.advertiser.name}</p>
                <span
                  className={
                    sellerKindUi(listing) === "negocio"
                      ? "rounded-full border border-[#C9B46A]/45 bg-[#FFFCF7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8A6F3A]"
                      : "rounded-full border border-[#E8DFD0] bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5C5346]"
                  }
                >
                  {sellerKindUi(listing) === "negocio" ? neg : priv}
                </span>
                {listing.operationLabel ? (
                  <span className="rounded-full bg-[#4A7C59]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#4A7C59]">
                    {listing.operationLabel}
                  </span>
                ) : null}
              </div>
              {listing.advertiser.subtitle ? (
                <p className="truncate text-xs text-[#5C5346]/80">{listing.advertiser.subtitle}</p>
              ) : null}
              {listing.trustChip ? (
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#B8954A]">
                  {listing.trustChip}
                </p>
              ) : null}
              {listing.licenseLine ? (
                <p className="mt-0.5 text-[11px] text-[#5C5346]/70">{listing.licenseLine}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
