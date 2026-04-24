"use client";

import Link from "next/link";
import { useState } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import {
  brLuxuryBodyMutedClass,
  brLuxuryBtnPrimaryClass,
  brLuxuryBtnSecondaryClass,
  brLuxuryCardHoverClass,
  brLuxuryHeroPanelClass,
  brLuxuryOverlineClass,
  brLuxurySerifHeadingClass,
} from "@/app/clasificados/bienes-raices/shared/brResultsTheme";
import type { BrNegocioListing } from "./listingTypes";
import { BadgeStack } from "./BadgeStack";
import { IconBath, IconBed, IconCalendar, IconHeart, IconMapPin, IconRuler } from "./cardIcons";

function sellerKindUi(listing: BrNegocioListing): "privado" | "negocio" {
  if (listing.sellerKind) return listing.sellerKind;
  return listing.badges.includes("negocio") ? "negocio" : "privado";
}

function operationKind(listing: BrNegocioListing): "venta" | "renta" | null {
  if (listing.operationLabel === "Renta") return "renta";
  if (listing.operationLabel === "Venta") return "venta";
  return null;
}

export function BienesRaicesNegocioFeaturedCard({
  listing,
  titleAsLink = true,
  className,
  sellerKindLabels,
  lang,
}: {
  listing: BrNegocioListing;
  titleAsLink?: boolean;
  className?: string;
  sellerKindLabels?: { privado: string; negocio: string };
  lang?: Lang;
}) {
  const priv = sellerKindLabels?.privado ?? "Privado";
  const neg = sellerKindLabels?.negocio ?? "Negocio";
  const lane = sellerKindUi(listing);
  const op = operationKind(listing);
  const [fav, setFav] = useState(false);
  const detailHref = lang
    ? appendLangToPath(`/clasificados/bienes-raices/anuncio/${listing.id}`, lang)
    : `/clasificados/bienes-raices/anuncio/${listing.id}`;

  const surface = `group relative overflow-hidden rounded-[24px] border border-[#D4C4A8]/45 ${brLuxuryHeroPanelClass} ${brLuxuryCardHoverClass}`;
  return (
    <article className={className ? `${surface} ${className}` : surface}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-90" />
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="relative lg:w-[54%]">
          <div className="relative aspect-[16/11] overflow-hidden lg:aspect-auto lg:min-h-[300px] lg:h-full">
            <img
              src={listing.imageUrl}
              alt=""
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1E1810]/35 via-transparent to-transparent" />
            <BadgeStack badges={listing.badges} operation={op} lane={lane} />
            <button
              type="button"
              aria-pressed={fav}
              aria-label={lang === "en" ? "Save listing" : "Guardar anuncio"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setFav((v) => !v);
              }}
              className="pointer-events-auto absolute right-4 top-4 z-[3] flex h-11 w-11 items-center justify-center rounded-full border border-white/75 bg-[#FFFCF7]/92 text-[#8A6F3A] shadow-lg backdrop-blur-sm transition hover:bg-white"
            >
              <IconHeart className="h-5 w-5" filled={fav} />
            </button>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-[#E8DFD0]/70 bg-[#FFFCF7]/95 px-5 py-4">
            <p className="text-2xl font-bold tracking-tight text-[#B8954A] sm:text-3xl">{listing.price}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[#3D3630]/88">
              <span className="inline-flex items-center gap-1.5">
                <IconBed className="text-[#B8954A]" />
                {listing.beds}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconBath className="text-[#B8954A]" />
                {listing.baths}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconRuler className="text-[#B8954A]" />
                {listing.sqft}
              </span>
              {listing.year ? (
                <span className="inline-flex items-center gap-1.5">
                  <IconCalendar className="text-[#B8954A]" />
                  {listing.year}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between border-t border-[#E8DFD0]/60 bg-[#FDFBF7]/98 p-6 lg:min-h-[300px] lg:border-l lg:border-t-0 lg:p-8">
          <div>
            <p className={brLuxuryOverlineClass}>{lang === "en" ? "Featured property" : "Propiedad destacada"}</p>
            {titleAsLink ? (
              <Link
                href={detailHref}
                className={`mt-3 block ${brLuxurySerifHeadingClass} text-2xl leading-tight hover:text-[#8A6F3A] sm:text-[1.85rem]`}
              >
                {listing.title}
              </Link>
            ) : (
              <p className={`mt-3 ${brLuxurySerifHeadingClass} text-2xl leading-tight sm:text-[1.85rem]`}>{listing.title}</p>
            )}
            <p className={`mt-3 flex items-start gap-2 ${brLuxuryBodyMutedClass}`}>
              <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#B8954A]" />
              <span>{listing.addressLine}</span>
            </p>
            {listing.metaLines?.length ? (
              <ul className="mt-4 space-y-1.5 text-sm text-[#5C5346]/85">
                {listing.metaLines.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#C5A059]" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="mt-8 space-y-5 border-t border-[#E8DFD0]/65 pt-6">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md ring-2 ring-[#E8DFD0]/80">
                {listing.advertiser.photoUrl ? (
                  <img src={listing.advertiser.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-bold text-[#B8954A]">
                    {listing.advertiser.name.slice(0, 1)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-[#1E1810]">{listing.advertiser.name}</p>
                  <span
                    className={
                      lane === "negocio"
                        ? "rounded-full border border-[#C9B46A]/45 bg-[#FFF8E8] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6E5418]"
                        : "rounded-full border border-[#E8DFD0] bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5C5346]"
                    }
                  >
                    {lane === "negocio" ? neg : priv}
                  </span>
                  {listing.operationLabel ? (
                    <span className="rounded-full bg-[#4A7C59]/12 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2F5239]">
                      {listing.operationLabel}
                    </span>
                  ) : null}
                </div>
                {listing.advertiser.subtitle ? (
                  <p className="truncate text-xs text-[#5C5346]/78">{listing.advertiser.subtitle}</p>
                ) : null}
                {listing.trustChip ? (
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#8A6F3A]">{listing.trustChip}</p>
                ) : null}
                {listing.licenseLine ? (
                  <p className="mt-0.5 text-[11px] text-[#5C5346]/65">{listing.licenseLine}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href={detailHref} className={`${brLuxuryBtnPrimaryClass} flex-1 px-6 py-3 text-[15px]`}>
                {lang === "en" ? "View property" : "Ver propiedad"}
              </Link>
              <Link href={detailHref} className={`${brLuxuryBtnSecondaryClass} flex-1 px-6 py-3 text-[15px]`}>
                {lang === "en" ? "Contact" : "Contactar"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
