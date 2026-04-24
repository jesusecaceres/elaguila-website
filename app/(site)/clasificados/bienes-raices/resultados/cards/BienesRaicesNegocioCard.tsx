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

function FactsRow({ listing }: { listing: BrNegocioListing }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-medium text-[#3D3630]/88">
      <span className="inline-flex items-center gap-1.5">
        <IconBed className="h-[1.05rem] w-[1.05rem] shrink-0 text-[#B8954A]" />
        <span>{listing.beds}</span>
      </span>
      <span className="hidden h-3.5 w-px bg-[#E8DFD0] sm:inline" aria-hidden />
      <span className="inline-flex items-center gap-1.5">
        <IconBath className="h-[1.05rem] w-[1.05rem] shrink-0 text-[#B8954A]" />
        <span>{listing.baths}</span>
      </span>
      <span className="hidden h-3.5 w-px bg-[#E8DFD0] sm:inline" aria-hidden />
      <span className="inline-flex items-center gap-1.5">
        <IconRuler className="h-[1.05rem] w-[1.05rem] shrink-0 text-[#B8954A]" />
        <span>{listing.sqft}</span>
      </span>
      {listing.year ? (
        <>
          <span className="hidden h-3.5 w-px bg-[#E8DFD0] sm:inline" aria-hidden />
          <span className="inline-flex items-center gap-1.5">
            <IconCalendar className="h-[1.05rem] w-[1.05rem] shrink-0 text-[#B8954A]" />
            <span>{listing.year}</span>
          </span>
        </>
      ) : null}
    </div>
  );
}

function IdentityRow({
  listing,
  sellerKindLabels,
}: {
  listing: BrNegocioListing;
  sellerKindLabels?: { privado: string; negocio: string };
}) {
  const priv = sellerKindLabels?.privado ?? "Privado";
  const neg = sellerKindLabels?.negocio ?? "Negocio";
  const lane = sellerKindUi(listing);
  return (
    <div className="mt-4 flex items-center gap-3 border-t border-[#E8DFD0]/70 pt-4">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#E8DFD0]/90 bg-[#FFFCF7] shadow-sm ring-2 ring-white">
        {listing.advertiser.photoUrl ? (
          <img src={listing.advertiser.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs font-bold text-[#B8954A]">
            {listing.advertiser.name.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#1E1810]">{listing.advertiser.name}</p>
        {listing.advertiser.subtitle ? (
          <p className="truncate text-xs text-[#5C5346]/78">{listing.advertiser.subtitle}</p>
        ) : null}
      </div>
      <span
        className={
          lane === "negocio"
            ? "shrink-0 rounded-full border border-[#C9B46A]/40 bg-[#FFF8E8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6E5418]"
            : "shrink-0 rounded-full border border-[#E8DFD0] bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5C5346]"
        }
      >
        {lane === "negocio" ? neg : priv}
      </span>
      {listing.trustChip ? (
        <span className="hidden shrink-0 rounded-full border border-[#4A7C59]/25 bg-[#4A7C59]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2F5239] sm:inline-flex">
          {listing.trustChip}
        </span>
      ) : null}
    </div>
  );
}

function listingDetailHref(id: string, lang?: Lang) {
  const base = `/clasificados/bienes-raices/anuncio/${id}`;
  return lang ? appendLangToPath(base, lang) : base;
}

const cardShell = `group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[#E8DFD0]/80 bg-[#FDFBF7]/[0.99] shadow-[0_18px_48px_-26px_rgba(42,36,22,0.26)] ${brLuxuryCardHoverClass}`;

export function BienesRaicesNegocioCard({
  listing,
  className,
  sellerKindLabels,
  lang,
}: {
  listing: BrNegocioListing;
  className?: string;
  sellerKindLabels?: { privado: string; negocio: string };
  lang?: Lang;
}) {
  const horizontal = listing.layout === "horizontal";
  const href = listingDetailHref(listing.id, lang);
  const [fav, setFav] = useState(false);
  const op = operationKind(listing);
  const lane = sellerKindUi(listing);
  const articleClass = className ? `${cardShell} ${className}` : cardShell;

  const imageBlock = (
    <div className="relative overflow-hidden bg-[#EDE6DC]">
      <img
        src={listing.imageUrl}
        alt=""
        className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1E1810]/25 via-transparent to-[#1E1810]/10 opacity-80 transition group-hover:opacity-95" />
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
        className="pointer-events-auto absolute right-3 top-3 z-[3] flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-[#FFFCF7]/90 text-[#8A6F3A] shadow-md backdrop-blur-sm transition hover:bg-white hover:text-[#C5A059]"
      >
        <IconHeart className="h-[1.15rem] w-[1.15rem]" filled={fav} />
      </button>
    </div>
  );

  const bodyLower = (
    <>
      {listing.openHouse ? (
        <p className="mt-2 rounded-lg bg-[#C17A3A]/10 px-2.5 py-1.5 text-xs font-semibold text-[#8B4E22]">
          {listing.openHouse}
        </p>
      ) : null}
      {listing.metaLines?.length ? (
        <p className={`mt-2 line-clamp-2 ${brLuxuryBodyMutedClass}`}>{listing.metaLines[0]}</p>
      ) : null}
      <IdentityRow listing={listing} sellerKindLabels={sellerKindLabels} />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Link href={href} className={`${brLuxuryBtnPrimaryClass} w-full flex-1 text-[13px] sm:w-auto`}>
          {lang === "en" ? "View property" : "Ver propiedad"}
        </Link>
        <Link href={href} className={`${brLuxuryBtnSecondaryClass} w-full flex-1 text-[13px] sm:w-auto`}>
          {lang === "en" ? "Contact" : "Contactar"}
        </Link>
      </div>
    </>
  );

  if (horizontal) {
    return (
      <article className={articleClass}>
        <div className="flex flex-col sm:flex-row sm:items-stretch">
          <div className="relative sm:w-[44%] sm:max-w-[340px]">
            <div className="relative aspect-[16/11] sm:aspect-auto sm:h-full sm:min-h-[220px]">{imageBlock}</div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col p-5 sm:py-5 sm:pl-6 sm:pr-5">
            <p className="text-2xl font-bold tracking-tight text-[#B8954A] sm:text-[1.65rem]">{listing.price}</p>
            <Link href={href} className={`mt-2 block ${brLuxurySerifHeadingClass} text-xl leading-snug hover:text-[#8A6F3A]`}>
              {listing.title}
            </Link>
            <p className={`mt-2 flex items-start gap-2 ${brLuxuryBodyMutedClass}`}>
              <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#B8954A]" />
              <span className="line-clamp-2">{listing.addressLine}</span>
            </p>
            <FactsRow listing={listing} />
            <div className="mt-auto">{bodyLower}</div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`${articleClass} flex h-full flex-col`}>
      <div className="relative aspect-[16/11]">{imageBlock}</div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-2xl font-bold tracking-tight text-[#B8954A]">{listing.price}</p>
        <Link href={href} className={`mt-2 block ${brLuxurySerifHeadingClass} text-lg leading-snug hover:text-[#8A6F3A] sm:text-xl`}>
          {listing.title}
        </Link>
        <p className={`mt-2 flex items-start gap-2 ${brLuxuryBodyMutedClass}`}>
          <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#B8954A]" />
          <span className="line-clamp-2">{listing.addressLine}</span>
        </p>
        <FactsRow listing={listing} />
        <div className="mt-auto">{bodyLower}</div>
      </div>
    </article>
  );
}
