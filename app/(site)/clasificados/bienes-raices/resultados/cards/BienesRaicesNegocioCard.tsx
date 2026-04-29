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
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
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

const cardShell = `group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#D4A574]/30 bg-[#FFFAF0] shadow-[0_12px_48px_-20px_rgba(212,165,116,0.15)] transition hover:border-[#D4A574]/45 hover:shadow-[0_16px_56px_-18px_rgba(212,165,116,0.2)]`;

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
    <div className="relative overflow-hidden bg-[#F5F0E8]">
      <img
        src={listing.imageUrl}
        alt=""
        className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/15 via-transparent to-[#1A1A1A]/5 opacity-60 transition group-hover:opacity-80" />
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
        className="pointer-events-auto absolute right-3 top-3 z-[3] flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-[#FFFAF0]/90 text-[#D4A574] shadow-md backdrop-blur-sm transition hover:bg-white hover:text-[#C19A6B]"
      >
        <IconHeart className="h-[1.15rem] w-[1.15rem]" filled={fav} />
      </button>
    </div>
  );

  const bodyLower = (
    <>
      {listing.openHouse ? (
        <p className="mt-2 rounded-lg bg-[#D4A574]/10 px-2.5 py-1.5 text-xs font-semibold text-[#7A7A7A]">
          {listing.openHouse}
        </p>
      ) : null}
      {listing.metaLines?.length ? (
        <p className="mt-2 line-clamp-2 text-sm text-[#4A4A4A]">{listing.metaLines[0]}</p>
      ) : null}
      <IdentityRow listing={listing} sellerKindLabels={sellerKindLabels} />
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={href} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 border bg-[#D4A574] text-white border-[#D4A574] hover:bg-[#C19A6B]">
          {lang === "en" ? "View property" : "Ver propiedad"}
        </Link>
        <Link href={href} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 border bg-white text-[#1A1A1A] border-[#E5E5E5] hover:bg-[#FFFAF0] hover:border-[#D4A574]">
          {lang === "en" ? "Contact" : "Contactar"}
        </Link>
      </div>

      {/* Engagement Section */}
      <div className="mt-6 pt-6 border-t border-[#E5E5E5]/50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">
            Interacción
          </h4>
        </div>
        
        {/* Engagement Actions */}
        <div className="flex items-center gap-3 mb-4">
          <LeonixLikeButton
            listingId={listing.id}
            ownerUserId={listing.id}
            variant="small"
            lang={lang === "en" ? "en" : "es"}
          />
          <LeonixSaveButton
            listingId={listing.id}
            ownerUserId={listing.id}
            variant="small"
            lang={lang === "en" ? "en" : "es"}
          />
          <LeonixShareButton
            listingId={listing.id}
            ownerUserId={listing.id}
            listingTitle={listing.title}
            listingUrl={typeof window !== "undefined" ? window.location.origin + href : ""}
            variant="small"
            lang={lang === "en" ? "en" : "es"}
          />
        </div>

        {/* Note about real metrics */}
        <div className="text-xs text-[#7A7A7A] italic">
          Las métricas de engagement se mostrarán cuando estén disponibles
        </div>
      </div>
    </>
  );

  if (horizontal) {
    return (
      <article className={articleClass}>
        <div className="flex flex-col sm:flex-row sm:items-stretch">
          <div className="relative sm:w-[44%] sm:max-w-[340px]">
            <div className="relative aspect-[16/10] sm:aspect-auto sm:h-full sm:min-h-[220px]">{imageBlock}</div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col p-6 sm:py-6 sm:pl-6 sm:pr-6">
            <p className="text-2xl font-bold text-[#2A7F3E] leading-tight sm:text-[1.65rem]">{listing.price}</p>
            <Link href={href} className="mt-2 block text-xl font-bold text-[#1A1A1A] leading-tight hover:text-[#D4A574] transition-colors sm:text-2xl">
              {listing.title}
            </Link>
            <p className="mt-2 flex items-start gap-2 text-sm text-[#4A4A4A]">
              <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A574]" />
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
      <div className="relative aspect-[16/10]">{imageBlock}</div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-2xl font-bold text-[#2A7F3E] leading-tight">{listing.price}</p>
        <Link href={href} className="mt-2 block text-xl font-bold text-[#1A1A1A] leading-tight hover:text-[#D4A574] transition-colors sm:text-2xl">
          {listing.title}
        </Link>
        <p className="mt-2 flex items-start gap-2 text-sm text-[#4A4A4A]">
          <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A574]" />
          <span className="line-clamp-2">{listing.addressLine}</span>
        </p>
        <FactsRow listing={listing} />
        <div className="mt-auto">{bodyLower}</div>
      </div>
    </article>
  );
}
