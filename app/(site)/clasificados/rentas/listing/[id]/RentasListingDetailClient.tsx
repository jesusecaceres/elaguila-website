"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FiChevronLeft } from "react-icons/fi";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { EnVentaCorreoModal } from "@/app/clasificados/en-venta/preview/EnVentaCorreoModal";
import { BienesRaicesNegocioPreviewView } from "@/app/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView";
import { BienesRaicesPrivadoPreviewView } from "@/app/clasificados/bienes-raices/preview/privado/BienesRaicesPrivadoPreviewView";
import { trackRentasContactClick, trackRentasListingView, trackRentasMessageSent } from "@/app/clasificados/rentas/analytics/rentasAnalytics";
import { useRentasLandingLang } from "@/app/clasificados/rentas/hooks/useRentasLandingLang";
import type { RentasListingDetailExtra } from "@/app/clasificados/rentas/listing/rentasListingDetailModel";
import {
  mapRentasListingToNegocioPreviewVm,
  mapRentasListingToPrivadoPreviewVm,
} from "@/app/clasificados/rentas/listing/mapRentasListingLiveToPreviewVm";
import {
  rentasCtaSecondaryClass,
  rentasLandingContainerClass,
  rentasLandingPaperBgClass,
  rentasSectionHeaderActionClass,
} from "@/app/clasificados/rentas/rentasLandingTheme";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import { RENTAS_RESULTS, rentasListingPublicPath } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";

const ENGAGEMENT_LABELS = {
  es: {
    title: "Interacción",
    metricsNote: "Las métricas de engagement se mostrarán cuando estén disponibles",
  },
  en: {
    title: "Engagement",
    metricsNote: "Engagement metrics will appear when available.",
  },
} as const;

type Props = {
  listing: RentasPublicListing;
  extra: RentasListingDetailExtra;
};

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
}

export function RentasListingDetailClient({ listing, extra }: Props) {
  const { lang, copy } = useRentasLandingLang();
  const searchParams = useSearchParams();
  const showPublishedBanner = searchParams?.get("published") === "1";
  const [correoOpen, setCorreoOpen] = useState(false);

  const resultsHref = useMemo(() => withRentasLandingLang(RENTAS_RESULTS, lang), [lang]);
  const dashboardHref = useMemo(() => withRentasLandingLang("/dashboard/mis-anuncios", lang), [lang]);
  const listingDetailHref = useMemo(
    () => withRentasLandingLang(rentasListingPublicPath(listing.id), lang),
    [listing.id, lang],
  );
  const shareListingUrl =
    typeof window !== "undefined" ? `${window.location.origin}${listingDetailHref}` : listingDetailHref;
  const eg = ENGAGEMENT_LABELS[lang];

  const sellerLine = lang === "en" ? extra.sellerDisplayEn : extra.sellerDisplayEs;
  const listingUuid = isUuid(listing.id);

  const vmPrivado = useMemo(
    () => mapRentasListingToPrivadoPreviewVm(listing, extra, lang),
    [listing, extra, lang],
  );
  const vmNegocio = useMemo(
    () => mapRentasListingToNegocioPreviewVm(listing, extra, lang),
    [listing, extra, lang],
  );

  const onContactLinkClick = () => void trackRentasContactClick(listing.id, null);

  useEffect(() => {
    void trackRentasListingView(listing.id, null);
  }, [listing.id]);

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

        {showPublishedBanner ? (
          <div
            className="mt-5 rounded-2xl border border-[#2C5F2D]/30 bg-[#F4FAF2] px-4 py-3 text-sm text-[#1E3D1F] shadow-sm sm:px-5"
            role="status"
          >
            <p className="font-semibold">{copy.detail.publishedLiveTitle}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#2C4A2E]/95">{copy.detail.publishedLiveBody}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={dashboardHref} className={rentasSectionHeaderActionClass}>
                {lang === "es" ? "Ir a Mis anuncios" : "Go to My Listings"}
              </Link>
              <Link
                href={resultsHref}
                className={rentasCtaSecondaryClass + " inline-flex items-center justify-center px-4 py-2 text-xs font-bold"}
              >
                {lang === "es" ? "Ver en resultados" : "Browse results"}
              </Link>
            </div>
          </div>
        ) : null}

        {listing.branch === "privado" ? (
          <BienesRaicesPrivadoPreviewView vm={vmPrivado} onContactLinkClick={onContactLinkClick} lang={lang} />
        ) : (
          <BienesRaicesNegocioPreviewView
            vm={vmNegocio}
            rentasPolishedDuplexLayout
            onContactLinkClick={onContactLinkClick}
            lang={lang}
          />
        )}

        {listingUuid ? (
          <div className="mx-auto mt-8 max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <div className="border-t border-[#C9D4E0]/55 pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#1E1810]">{eg.title}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <LeonixLikeButton listingId={listing.id} category="rentas" variant="small" lang={lang} />
                <LeonixSaveButton listingId={listing.id} category="rentas" variant="small" lang={lang} />
                <LeonixShareButton
                  listingId={listing.id}
                  category="rentas"
                  listingTitle={listing.title}
                  listingUrl={shareListingUrl}
                  variant="small"
                  lang={lang}
                />
              </div>
              <p className="mt-3 text-xs italic text-[#5C5346]/88">{eg.metricsNote}</p>
            </div>
            <button
              type="button"
              onClick={() => setCorreoOpen(true)}
              className={
                rentasCtaSecondaryClass +
                " mt-6 inline-flex min-h-[48px] w-full max-w-md items-center justify-center px-5 py-3 text-sm font-bold sm:w-auto"
              }
            >
              {copy.detail.ctaLeonixInquiry}
            </button>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-[#5C5346]/88">{copy.detail.trustNote}</p>
          </div>
        ) : null}

        <section className="mx-auto mt-10 max-w-[1240px] rounded-[1.2rem] border border-[#C9D4E0]/55 bg-gradient-to-b from-[#F8FAFC]/95 to-[#FFFCF7]/90 p-6 text-center shadow-sm sm:p-8">
          <h2 className="font-serif text-lg font-semibold text-[#1E1810]">{copy.detail.relatedTitle}</h2>
          <p className="mt-2 text-sm text-[#5C5346]/88">{copy.detail.relatedBody}</p>
          <div className="mt-5 flex justify-center">
            <Link href={resultsHref} className={rentasSectionHeaderActionClass}>
              {copy.trust.ctaResults}
            </Link>
          </div>
        </section>
      </div>

      <EnVentaCorreoModal
        open={correoOpen}
        onClose={() => setCorreoOpen(false)}
        lang={lang}
        sellerName={sellerLine}
        sellerEmail={extra.contactEmail ?? ""}
        listingTitle={listing.title}
        listingId={listingUuid ? listing.id : null}
        listingIdDisplay={listing.id}
        inquiryApiPath="/api/clasificados/rentas/inquiry"
        onMessageSentAnalytics={(lid, uid) => void trackRentasMessageSent(lid ?? listing.id, uid)}
      />
    </div>
  );
}
