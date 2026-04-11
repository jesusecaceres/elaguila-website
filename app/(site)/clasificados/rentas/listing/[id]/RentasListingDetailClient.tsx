"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FiChevronLeft, FiMapPin } from "react-icons/fi";
import { IconBath, IconBed, IconRuler } from "@/app/clasificados/bienes-raices/resultados/cards/cardIcons";
import { useRentasLandingLang } from "@/app/clasificados/rentas/hooks/useRentasLandingLang";
import type { RentasListingDetailExtra } from "@/app/clasificados/rentas/listing/rentasListingDetailModel";
import {
  rentasCtaPrimaryClass,
  rentasCtaSecondaryClass,
  rentasDetailConversionPanelClass,
  rentasLandingContainerClass,
  rentasLandingPaperBgClass,
  rentasSectionHeaderActionClass,
} from "@/app/clasificados/rentas/rentasLandingTheme";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import {
  RENTAS_PUBLICAR_NEGOCIO,
  RENTAS_PUBLICAR_PRIVADO,
  RENTAS_RESULTS,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";

type Props = {
  listing: RentasPublicListing;
  extra: RentasListingDetailExtra;
};

export function RentasListingDetailClient({ listing, extra }: Props) {
  const { lang, copy } = useRentasLandingLang();
  const [photoIx, setPhotoIx] = useState(0);
  const gallery = extra.gallery.length ? extra.gallery : [listing.imageUrl];
  const mainSrc = gallery[photoIx] ?? listing.imageUrl;

  const description = lang === "en" ? extra.descriptionEn : extra.descriptionEs;
  const sellerLine = lang === "en" ? extra.sellerDisplayEn : extra.sellerDisplayEs;

  const resultsHref = useMemo(() => withRentasLandingLang(RENTAS_RESULTS, lang), [lang]);
  const contactHref = useMemo(() => withRentasLandingLang("/contact", lang), [lang]);

  const publishPrivado = withRentasLandingLang(RENTAS_PUBLICAR_PRIVADO, lang);
  const publishNegocio = withRentasLandingLang(RENTAS_PUBLICAR_NEGOCIO, lang);

  return (
    <div className={"min-h-screen pb-16 pt-6 sm:pb-20 sm:pt-8 " + rentasLandingPaperBgClass}>
      <div className={rentasLandingContainerClass}>
        <Link
          href={resultsHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4A6680] transition hover:text-[#C45C26]"
        >
          <FiChevronLeft className="h-4 w-4" aria-hidden />
          {copy.detail.backToResults}
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-[1.45rem] border border-[#E2D5C4]/90 bg-[#FFFCF7] shadow-[0_28px_64px_-32px_rgba(44,36,28,0.28)] ring-2 ring-[#D4C4A8]/28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="relative aspect-[16/10] w-full bg-[#E8E0D4] sm:aspect-[16/9]">
                <div
                  className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-[#1E1810]/30 via-transparent to-[#F4EDE3]/28"
                  aria-hidden
                />
                <img src={mainSrc} alt="" className="relative z-0 h-full w-full object-cover" />
              </div>
              {gallery.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto border-t border-[#E4D9C8]/80 bg-[#FAF7F2]/95 p-3 sm:p-3.5">
                  {gallery.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setPhotoIx(i)}
                      className={
                        "relative h-[4.25rem] w-[6.5rem] shrink-0 overflow-hidden rounded-xl border-2 transition " +
                        (i === photoIx ? "border-[#C45C26] ring-2 ring-[#C45C26]/25" : "border-transparent opacity-85 hover:opacity-100")
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="flex flex-col gap-6 lg:sticky lg:top-28">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#5B7C99]/85">Leonix · {copy.breadcrumbRentas}</p>
                <h1 className="mt-2 border-b border-[#E8DFD0]/80 pb-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-[#1E1810] sm:text-[2.15rem]">
                  {listing.title}
                </h1>
                <p className="mt-4 inline-flex items-start gap-1.5 text-sm leading-snug text-[#4A4338]/92">
                  <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#5B7C99]" aria-hidden />
                  {listing.addressLine}
                </p>
                <div className="mt-6 rounded-2xl border border-[#D4A84B]/25 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA]/90 px-5 py-4 shadow-inner">
                  <p className="text-[1.9rem] font-bold leading-none tracking-tight text-[#B8893C] sm:text-[2.1rem]">{listing.rentDisplay}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#5C5346]/75">{copy.detail.rentLabel}</p>
                </div>
              </div>

              <div
                className={
                  "rounded-2xl border px-4 py-3.5 text-sm shadow-sm " +
                  (listing.branch === "privado"
                    ? "border-[#5B7C99]/28 bg-[#EEF3F7]/95 text-[#2C3E4D]"
                    : "border-[#D4A84B]/40 bg-[#FFF8E8]/95 text-[#6B4E1D]")
                }
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">{copy.detail.sellerTitle}</p>
                <p className="mt-1.5 font-medium leading-snug">{sellerLine}</p>
              </div>

              <div className={rentasDetailConversionPanelClass}>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href={contactHref}
                    className={`inline-flex items-center justify-center ${rentasCtaPrimaryClass} w-full sm:w-auto sm:min-w-[11rem]`}
                  >
                    {copy.detail.ctaContact}
                  </Link>
                  <Link
                    href={listing.branch === "privado" ? publishPrivado : publishNegocio}
                    className={`inline-flex items-center justify-center ${rentasCtaSecondaryClass} w-full sm:w-auto sm:min-w-[11rem]`}
                  >
                    {copy.detail.ctaPublish}
                  </Link>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-[#5C5346]/88">{copy.detail.trustNote}</p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12 rounded-[1.25rem] border border-[#E2D5C4]/90 bg-[#FFFCF7] p-6 shadow-sm sm:p-8">
          <h2 className="font-serif text-xl font-semibold text-[#1E1810]">{copy.detail.specsTitle}</h2>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#3D3630]">
            <li className="inline-flex items-center gap-2">
              <IconBed className="text-[#5B7C99]" />
              <span className="text-[#5C5346]/80">{copy.search.recs}</span> {listing.beds}
            </li>
            <li className="inline-flex items-center gap-2">
              <IconBath className="text-[#5B7C99]" />
              <span className="text-[#5C5346]/80">{copy.featured.baths}</span> {listing.baths}
            </li>
            <li className="inline-flex items-center gap-2">
              <IconRuler className="text-[#5B7C99]" />
              <span className="text-[#5C5346]/80">{copy.featured.sqft}</span> {listing.sqft}
            </li>
            <li>
              <span className="font-semibold text-[#1E1810]">{copy.detail.furnished}:</span>{" "}
              {listing.amueblado ? copy.detail.yes : copy.detail.no}
            </li>
            <li>
              <span className="font-semibold text-[#1E1810]">{copy.detail.pets}:</span>{" "}
              {listing.mascotasPermitidas ? copy.detail.yes : copy.detail.no}
            </li>
          </ul>

          <h2 className="mt-10 font-serif text-xl font-semibold text-[#1E1810]">{copy.detail.descriptionTitle}</h2>
          <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-[#4A4338]/95">{description}</p>
        </section>

        <section className="mt-10 rounded-[1.2rem] border border-[#C9D4E0]/55 bg-gradient-to-b from-[#F8FAFC]/95 to-[#FFFCF7]/90 p-6 text-center shadow-sm sm:p-8">
          <h2 className="font-serif text-lg font-semibold text-[#1E1810]">{copy.detail.relatedTitle}</h2>
          <p className="mt-2 text-sm text-[#5C5346]/88">{copy.detail.relatedBody}</p>
          <div className="mt-5 flex justify-center">
            <Link href={resultsHref} className={rentasSectionHeaderActionClass}>
              {copy.trust.ctaResults}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
