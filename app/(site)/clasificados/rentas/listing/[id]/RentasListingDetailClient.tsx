"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FiChevronLeft, FiMapPin } from "react-icons/fi";
import { IconBath, IconBed, IconRuler } from "@/app/clasificados/bienes-raices/resultados/cards/cardIcons";
import { EnVentaCorreoModal } from "@/app/clasificados/en-venta/preview/EnVentaCorreoModal";
import { trackRentasContactClick, trackRentasListingView, trackRentasMessageSent } from "@/app/clasificados/rentas/analytics/rentasAnalytics";
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
import { parseNegocioRedesSocialLinks } from "@/app/clasificados/rentas/listing/utils/negocioRedesSocialLinks";
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

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
}

function formatLeaseCode(code: string | null | undefined, lang: "es" | "en"): string {
  const c = (code ?? "").trim();
  if (!c) return "";
  const labels: Record<string, { es: string; en: string }> = {
    "mes-a-mes": { es: "Mes a mes", en: "Month-to-month" },
    "6-meses": { es: "6 meses", en: "6 months" },
    "12-meses": { es: "12 meses", en: "12 months" },
    "1-ano": { es: "1 año", en: "1 year" },
    "2-anos": { es: "2 años", en: "2 years" },
  };
  return labels[c]?.[lang] ?? c;
}

function triYesNo(
  v: boolean | undefined,
  copy: { yes: string; no: string; unknown: string },
): string {
  if (v === true) return copy.yes;
  if (v === false) return copy.no;
  return copy.unknown;
}

function rentasAvailabilityLabel(
  code: RentasPublicListing["rentasListingAvailability"],
  lang: "es" | "en",
  unknown: string,
): string {
  const c = (code ?? "").trim().toLowerCase();
  const m: Record<string, { es: string; en: string }> = {
    disponible: { es: "Disponible", en: "Available" },
    pendiente: { es: "Pendiente / próximamente", en: "Pending / coming soon" },
    bajo_contrato: { es: "Bajo contrato", en: "Under lease" },
    rentado: { es: "Rentado / no disponible", en: "Rented / off market" },
  };
  return m[c]?.[lang] ?? unknown;
}

function formatPostedDate(iso: string | undefined, lang: "es" | "en", unknown: string): string {
  if (!iso?.trim()) return unknown;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return unknown;
  try {
    return new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
    }).format(t);
  } catch {
    return unknown;
  }
}

export function RentasListingDetailClient({ listing, extra }: Props) {
  const { lang, copy } = useRentasLandingLang();
  const searchParams = useSearchParams();
  const showPublishedBanner = searchParams?.get("published") === "1";
  const [photoIx, setPhotoIx] = useState(0);
  const [correoOpen, setCorreoOpen] = useState(false);
  const gallery = extra.gallery.length ? extra.gallery : [listing.imageUrl];
  const mainSrc = gallery[photoIx] ?? listing.imageUrl;

  const description = lang === "en" ? extra.descriptionEn : extra.descriptionEs;
  const sellerLine = lang === "en" ? extra.sellerDisplayEn : extra.sellerDisplayEs;

  const resultsHref = useMemo(() => withRentasLandingLang(RENTAS_RESULTS, lang), [lang]);
  const dashboardHref = useMemo(() => withRentasLandingLang("/dashboard/mis-anuncios", lang), [lang]);
  const contactHref = useMemo(() => withRentasLandingLang("/contact", lang), [lang]);

  const negocioSocialLinks = useMemo(
    () => parseNegocioRedesSocialLinks(listing.businessSocial),
    [listing.businessSocial],
  );

  const publishPrivado = withRentasLandingLang(RENTAS_PUBLICAR_PRIVADO, lang);
  const publishNegocio = withRentasLandingLang(RENTAS_PUBLICAR_NEGOCIO, lang);

  const listingUuid = isUuid(listing.id);
  const depositFmt =
    typeof listing.depositUsd === "number" && listing.depositUsd > 0
      ? new Intl.NumberFormat(lang === "es" ? "es-MX" : "en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(listing.depositUsd)
      : null;

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
                {listing.publishedAt ? (
                  <p className="mt-2 text-xs font-medium text-[#7A7164]">
                    {copy.detail.postedOn}: {formatPostedDate(listing.publishedAt, lang, copy.detail.unknown)}
                  </p>
                ) : null}
                <div className="mt-6 rounded-2xl border border-[#D4A84B]/25 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA]/90 px-5 py-4 shadow-inner">
                  <p className="text-[1.9rem] font-bold leading-none tracking-tight text-[#B8893C] sm:text-[2.1rem]">{listing.rentDisplay}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#5C5346]/75">{copy.detail.rentLabel}</p>
                  {depositFmt ? (
                    <p className="mt-3 text-sm font-semibold text-[#4A4338]">
                      {lang === "es" ? "Depósito referido: " : "Deposit (listed): "}
                      {depositFmt}
                    </p>
                  ) : null}
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
                {listing.branch === "negocio" && listing.businessMarca?.trim() ? (
                  <p className="mt-2 text-xs text-[#5C5346]/90">
                    <span className="font-semibold text-[#1E1810]">{copy.detail.businessMarca}:</span> {listing.businessMarca.trim()}
                  </p>
                ) : null}
                {listing.branch === "negocio" && listing.businessAgentName?.trim() ? (
                  <p className="mt-1 text-xs text-[#5C5346]/90">
                    <span className="font-semibold text-[#1E1810]">{copy.detail.businessAgent}:</span> {listing.businessAgentName.trim()}
                  </p>
                ) : null}
                {listing.branch === "negocio" && listing.businessDescription?.trim() ? (
                  <p className="mt-3 border-t border-[#E8DFD0]/70 pt-3 text-xs leading-relaxed text-[#4A4338]/95">
                    {listing.businessDescription.trim()}
                  </p>
                ) : null}
                {listing.branch === "negocio" && (negocioSocialLinks?.length ?? 0) > 0 ? (
                  <div className="mt-3 border-t border-[#E8DFD0]/70 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">{copy.detail.socialHeading}</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {(negocioSocialLinks ?? []).map((l) => (
                        <li key={l.url}>
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-[#C45C26] underline"
                          >
                            {l.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div className={rentasDetailConversionPanelClass}>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {extra.contactPhone ? (
                    <a
                      href={`tel:${extra.contactPhone.replace(/\D/g, "")}`}
                      onClick={() => void trackRentasContactClick(listing.id, null)}
                      className={`inline-flex items-center justify-center ${rentasCtaPrimaryClass} w-full sm:w-auto sm:min-w-[11rem]`}
                    >
                      {lang === "es" ? "Llamar al anunciante" : "Call landlord"}
                    </a>
                  ) : (
                    <Link
                      href={contactHref}
                      className={`inline-flex items-center justify-center ${rentasCtaPrimaryClass} w-full sm:w-auto sm:min-w-[11rem]`}
                    >
                      {copy.detail.ctaContact}
                    </Link>
                  )}
                  {extra.contactEmail ? (
                    <a
                      href={`mailto:${encodeURIComponent(extra.contactEmail)}`}
                      onClick={() => void trackRentasContactClick(listing.id, null)}
                      className={`inline-flex items-center justify-center ${rentasCtaSecondaryClass} w-full sm:w-auto sm:min-w-[11rem]`}
                    >
                      {lang === "es" ? "Enviar correo" : "Send email"}
                    </a>
                  ) : null}
                  {listingUuid ? (
                    <button
                      type="button"
                      onClick={() => setCorreoOpen(true)}
                      className={`inline-flex items-center justify-center ${rentasCtaSecondaryClass} w-full sm:w-auto sm:min-w-[11rem]`}
                    >
                      {copy.detail.ctaLeonixInquiry}
                    </button>
                  ) : null}
                  {extra.contactPhone ? (
                    <Link
                      href={contactHref}
                      className={`inline-flex items-center justify-center ${rentasCtaSecondaryClass} w-full sm:w-auto sm:min-w-[11rem]`}
                    >
                      {copy.detail.ctaContact}
                    </Link>
                  ) : null}
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
            {typeof listing.halfBathsCount === "number" && listing.halfBathsCount > 0 ? (
              <li>
                <span className="font-semibold text-[#1E1810]">{copy.detail.halfBaths}:</span> {listing.halfBathsCount}
              </li>
            ) : null}
            <li className="inline-flex items-center gap-2">
              <IconRuler className="text-[#5B7C99]" />
              <span className="text-[#5C5346]/80">{copy.featured.sqft}</span> {listing.sqft}
            </li>
            {typeof listing.parkingSpots === "number" && listing.parkingSpots > 0 ? (
              <li>
                <span className="font-semibold text-[#1E1810]">{lang === "es" ? "Estacionamientos" : "Parking"}:</span>{" "}
                {listing.parkingSpots}
              </li>
            ) : null}
            {listing.pool === true ? (
              <li>
                <span className="font-semibold text-[#1E1810]">{lang === "es" ? "Alberca / piscina" : "Pool"}:</span> {copy.detail.yes}
              </li>
            ) : null}
            {listing.propertySubtype ? (
              <li>
                <span className="font-semibold text-[#1E1810]">{lang === "es" ? "Subtipo" : "Subtype"}:</span> {listing.propertySubtype}
              </li>
            ) : null}
            <li>
              <span className="font-semibold text-[#1E1810]">{copy.detail.furnished}:</span> {triYesNo(listing.amueblado, copy.detail)}
            </li>
            <li>
              <span className="font-semibold text-[#1E1810]">{copy.detail.pets}:</span>{" "}
              {triYesNo(listing.mascotasPermitidas, copy.detail)}
            </li>
          </ul>

          <h2 className="mt-10 font-serif text-xl font-semibold text-[#1E1810]">{copy.detail.sectionFees}</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#4A4338]/95">
            <li>
              {lang === "es" ? "Depósito (USD)" : "Deposit (USD)"}: {depositFmt ?? copy.detail.unknown}
            </li>
          </ul>

          <h2 className="mt-8 font-serif text-xl font-semibold text-[#1E1810]">{copy.detail.sectionLease}</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#4A4338]/95">
            <li>
              <span className="font-semibold text-[#1E1810]">{copy.detail.listingStatusHeading}:</span>{" "}
              {rentasAvailabilityLabel(listing.rentasListingAvailability, lang, copy.detail.unknown)}
            </li>
            <li>
              {lang === "es" ? "Plazo" : "Lease term"}:{" "}
              {listing.leaseTermCode ? formatLeaseCode(listing.leaseTermCode, lang) : copy.detail.unknown}
            </li>
            <li>
              {lang === "es" ? "Disponibilidad" : "Availability"}: {listing.availabilityNote?.trim() || copy.detail.unknown}
            </li>
          </ul>

          <h2 className="mt-8 font-serif text-xl font-semibold text-[#1E1810]">{copy.detail.sectionExtras}</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#4A4338]/95">
            <li>
              {lang === "es" ? "Servicios incluidos" : "Utilities / services included"}:{" "}
              {listing.servicesIncluded?.trim() || copy.detail.unknown}
            </li>
            <li>
              {lang === "es" ? "Requisitos" : "Requirements"}: {listing.requirements?.trim() || copy.detail.unknown}
            </li>
            {listing.branch === "negocio" ? (
              <>
                <li>
                  {lang === "es" ? "Licencia / registro (si aplica)" : "License (if stated)"}:{" "}
                  {listing.businessLicense?.trim() || copy.detail.unknown}
                </li>
                <li>
                  {lang === "es" ? "Sitio web" : "Website"}:{" "}
                  {listing.businessWebsite?.trim() ? (
                    <a
                      href={(() => {
                        const w = listing.businessWebsite!.trim();
                        return w.startsWith("http") ? w : `https://${w}`;
                      })()}
                      className="font-semibold text-[#C45C26] underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {listing.businessWebsite}
                    </a>
                  ) : (
                    copy.detail.unknown
                  )}
                </li>
              </>
            ) : null}
            {listing.mapUrl ? (
              <li>
                <a
                  href={listing.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#C45C26] underline"
                >
                  {copy.detail.mapLink}
                </a>
              </li>
            ) : null}
            {listing.videoUrl ? (
              <li>
                <a
                  href={listing.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#C45C26] underline"
                >
                  {copy.detail.videoLink}
                </a>
              </li>
            ) : null}
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

      <EnVentaCorreoModal
        open={correoOpen}
        onClose={() => setCorreoOpen(false)}
        lang={lang}
        sellerName={sellerLine}
        sellerEmail={extra.contactEmail ?? ""}
        listingTitle={listing.title}
        listingId={listingUuid ? listing.id : null}
        listingIdDisplay={listing.id}
        inquiryApiPath="/api/clasificados/en-venta/inquiry"
        onMessageSentAnalytics={(lid, uid) => void trackRentasMessageSent(lid ?? listing.id, uid)}
      />
    </div>
  );
}
