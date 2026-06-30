import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { FiCalendar, FiDollarSign, FiMapPin } from "react-icons/fi";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import type { RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { rentasListingResultsHandoff } from "@/app/clasificados/rentas/landing/rentasListingResultsHandoff";
import { IconBath, IconBed, IconRuler } from "@/app/clasificados/bienes-raices/resultados/cards/cardIcons";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import { trackRentasResultCardClick } from "@/app/clasificados/rentas/analytics/rentasAnalytics";
import {
  buildRentasResultsCardSummaryEs,
  type RentasPublicListingFlowSlice,
} from "@/app/clasificados/rentas/shared/rentasRentalTypeApply";

function browseLocationLine(listing: RentasPublicListing): string {
  const r = listing.resultBrowseLocation?.trim();
  if (r) return r;
  const city = listing.city?.trim();
  const st = listing.stateRegion?.trim();
  const z = listing.postalCode?.trim();
  if (city && st) return `${city}, ${st}`;
  if (city && z) return `${city} · ${z}`;
  if (city) return city;
  const a = listing.addressLine?.trim() ?? "";
  if (a && !/^\d+\s/.test(a)) return a;
  return a || "—";
}

function photoCount(listing: RentasPublicListing): number {
  const g = listing.galleryUrls?.length ?? 0;
  if (g > 0) return g;
  return listing.imageUrl?.trim() ? 1 : 0;
}

function extraPromoBadges(listing: RentasPublicListing): string[] {
  return listing.badges.filter((b) => b !== "privado" && b !== "negocio" && b !== "comercial");
}

function badgeLabel(b: string, copy: RentasLandingCopy["card"]) {
  if (b === "destacada") return copy.destacada;
  if (b === "promo") return "PROMO";
  if (b === "privado") return copy.sellerPrivado;
  if (b === "negocio") return copy.sellerNegocio;
  if (b === "comercial") return copy.sellerNegocio;
  return b;
}

function availabilityLabel(
  code: RentasPublicListing["rentasListingAvailability"],
  lang: RentasLandingLang,
): string | null {
  if (!code) return null;
  const m: Record<string, { es: string; en: string }> = {
    disponible: { es: "Disponible", en: "Available" },
    pendiente: { es: "Pendiente", en: "Pending" },
    bajo_contrato: { es: "Bajo contrato", en: "Under lease" },
    rentado: { es: "Rentado", en: "Rented" },
  };
  return m[code]?.[lang] ?? null;
}

function categoriaLabel(listing: RentasPublicListing, copy: RentasLandingCopy): string {
  const c = listing.categoriaPropiedad;
  if (c === "residencial") return copy.quickExplore.chipResidencial;
  if (c === "comercial") return copy.quickExplore.chipComercial;
  return copy.quickExplore.chipTerreno;
}

function isMissingFact(s: string): boolean {
  const t = (s ?? "").trim();
  return !t || t === "—" || t === "-";
}

type MediaOverlaysProps = {
  listing: RentasPublicListing;
  copy: RentasLandingCopy;
  lang: RentasLandingLang;
};

function MediaOverlays({ listing, copy, lang }: MediaOverlaysProps) {
  const branch = lang === "es" ? "ANUNCIANTE" : "ADVERTISER";
  const n = photoCount(listing);
  const photoLabel = lang === "es" ? `${n} ${n === 1 ? "foto" : "fotos"}` : `${n} ${n === 1 ? "photo" : "photos"}`;
  const statusRaw = availabilityLabel(listing.rentasListingAvailability, lang);
  const extras = extraPromoBadges(listing);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex items-start justify-between gap-2 p-2 sm:p-2.5">
        <div className="flex min-w-0 flex-col items-start gap-1">
          <span className="rounded-md border border-[#5B7C99]/35 bg-[#E8EEF4]/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#2C3E4D] shadow-sm">
            {branch}
          </span>
          {extras.map((b) => (
            <span
              key={b}
              className={
                "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow-sm " +
                (b === "destacada"
                  ? "border border-[#E8A849]/45 bg-[#FFF4E0]/95 text-[#7A4A12]"
                  : "border border-[#D4A84B]/40 bg-[#FFF8E8]/95 text-[#6B4E1D]")
              }
            >
              {badgeLabel(b, copy.card)}
            </span>
          ))}
          {statusRaw ? (
            <span className="rounded-md border border-[#2C5F2D]/35 bg-[#E8F5E9]/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#1E4620] shadow-sm">
              {statusRaw}
            </span>
          ) : null}
        </div>
        {n > 0 ? (
          <span className="shrink-0 rounded-md border border-[#2A2620]/20 bg-[#2A2620]/88 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#FAF7F2] shadow-sm">
            {photoLabel}
          </span>
        ) : null}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-1/3 bg-gradient-to-t from-[#1E1810]/45 to-transparent" aria-hidden />
    </>
  );
}

type BodyProps = {
  listing: RentasPublicListing;
  copy: RentasLandingCopy;
  lang: RentasLandingLang;
};

function CardContentBody({ listing, copy, lang }: BodyProps) {
  const loc = browseLocationLine(listing);
  const cat = categoriaLabel(listing, copy);
  const code = listing.rentasListingAvailability;
  const note = listing.availabilityNote?.trim();
  const baseAvail = availabilityLabel(code, lang);
  const hasDeposit = typeof listing.depositUsd === "number" && listing.depositUsd > 0;
  const hasAvailDetail =
    (code === "disponible" && !!note) || (code != null && code !== "disponible");
  const showSecondary = hasDeposit || hasAvailDetail;

  let availabilityText: string | null = null;
  if (hasAvailDetail) {
    if (code === "disponible" && note) {
      availabilityText = lang === "es" ? `Disponible ${note}` : `Available ${note}`;
    } else if (baseAvail) {
      availabilityText = baseAvail;
    }
  }

  const depositFmt =
    typeof listing.depositUsd === "number" && listing.depositUsd > 0
      ? new Intl.NumberFormat(lang === "es" ? "es-MX" : "en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(listing.depositUsd)
      : null;

  const flowSummaryLine =
    lang === "es" && String(listing.rentalTypeCode ?? "").trim()
      ? buildRentasResultsCardSummaryEs(listing as RentasPublicListingFlowSlice)
      : "";

  const factBits: { key: string; node: ReactNode }[] = [];
  if (!flowSummaryLine) {
    if (!isMissingFact(listing.beds)) {
      factBits.push({
        key: "beds",
        node: (
          <span className="inline-flex items-center gap-0.5">
            <IconBed className="h-3.5 w-3.5 shrink-0 text-[#5B7C99]" aria-hidden />
            <span className="font-medium">
              {listing.beds} {lang === "es" ? "rec" : "beds"}
            </span>
          </span>
        ),
      });
    }
    if (!isMissingFact(listing.baths)) {
      factBits.push({
        key: "baths",
        node: (
          <span className="inline-flex items-center gap-0.5">
            <IconBath className="h-3.5 w-3.5 shrink-0 text-[#5B7C99]" aria-hidden />
            <span className="font-medium">
              {listing.baths} {lang === "es" ? "baños" : "baths"}
            </span>
          </span>
        ),
      });
    }
    if (!isMissingFact(listing.sqft)) {
      factBits.push({
        key: "sqft",
        node: (
          <span className="inline-flex items-center gap-0.5">
            <IconRuler className="h-3.5 w-3.5 shrink-0 text-[#5B7C99]" aria-hidden />
            <span className="font-medium">{listing.sqft}</span>
          </span>
        ),
      });
    }
  }

  const chips: string[] = [];
  if (listing.mascotasPermitidas === true) chips.push(copy.quickExplore.chipMascotas);
  if (listing.amueblado === true) chips.push(copy.quickExplore.chipAmueblado);
  chips.push(cat);
  const chipsShown = chips.slice(0, 3);

  const detailCue = lang === "es" ? "Ver detalles →" : "View details →";

  return (
    <>
      <p className="text-xl font-bold leading-none tracking-tight text-[#2A7F3E] sm:text-[1.35rem]">{listing.rentDisplay}</p>
      <h2 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-[#1A1A1A] sm:text-[1.05rem]">{listing.title}</h2>
      {loc && loc !== "—" ? (
        <p className="mt-1.5 line-clamp-1 text-sm font-medium text-[#4A4A4A]">
          <span className="inline-flex min-w-0 items-center gap-1">
            <FiMapPin className="h-3.5 w-3.5 shrink-0 text-[#D4A574]" aria-hidden />
            <span className="min-w-0 truncate">{loc}</span>
          </span>
        </p>
      ) : null}

      {flowSummaryLine ? (
        <p className="mt-2.5 line-clamp-2 text-[13px] font-medium leading-snug text-[#5C5346]">{flowSummaryLine}</p>
      ) : factBits.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-snug text-[#5C5346]">
          {factBits.map((b, i) => (
            <Fragment key={b.key}>
              {i > 0 ? (
                <span className="select-none text-[#D4C4A8]" aria-hidden>
                  ·
                </span>
              ) : null}
              {b.node}
            </Fragment>
          ))}
        </div>
      ) : null}

      {showSecondary ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-snug text-[#6B6258]">
          {availabilityText ? (
            <span className="inline-flex items-center gap-1">
              <FiCalendar className="h-3.5 w-3.5 shrink-0 text-[#5B7C99]" aria-hidden />
              <span className="font-medium">{availabilityText}</span>
            </span>
          ) : null}
          {availabilityText && depositFmt ? <span className="text-[#D4C4A8]" aria-hidden>·</span> : null}
          {depositFmt ? (
            <span className="inline-flex items-center gap-1">
              <FiDollarSign className="h-3.5 w-3.5 shrink-0 text-[#5B7C99]" aria-hidden />
              <span className="font-medium">{lang === "es" ? "Depósito " : "Deposit "}</span>
              <span className="font-semibold text-[#4A4338]">{depositFmt}</span>
            </span>
          ) : null}
        </div>
      ) : null}

      {chipsShown.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {chipsShown.map((c) => (
            <span
              key={c}
              className="inline-flex max-w-full truncate rounded-full border border-[#E8DFD0] bg-[#FAF7F2] px-2 py-0.5 text-[11px] font-semibold text-[#4A4338]"
            >
              {c}
            </span>
          ))}
        </div>
      ) : null}

      <p className="mt-2 text-sm font-semibold text-[#B8893C] underline-offset-2 group-hover:underline">{detailCue}</p>
    </>
  );
}

type Props = {
  listing: RentasPublicListing;
  copy: RentasLandingCopy;
  lang: RentasLandingLang;
};

export function RentasResultCard({ listing, copy, lang }: Props) {
  const href = rentasListingResultsHandoff(listing, lang);
  const horizontal = listing.layout === "horizontal";
  const elevated = listing.promoted === true || listing.badges.includes("destacada");
  const cardRing = elevated
    ? "rounded-2xl border border-[#D4A574]/30 bg-[#FFFAF0] shadow-[0_10px_36px_-18px_rgba(212,165,116,0.22)]"
    : "rounded-2xl border border-[#D4A574]/18 bg-[#FFFAF0] shadow-[0_6px_24px_-16px_rgba(44,36,28,0.12)]";

  const aria = `${listing.title}. ${listing.rentDisplay}. ${lang === "es" ? "Ver anuncio" : "View listing"}`;
  const trackOpen = () => trackRentasResultCardClick({ listingUuid: listing.id, leonixAdId: listing.leonixAdId });

  if (horizontal) {
    return (
      <Link href={href} className={`group block w-full overflow-hidden ${cardRing}`} aria-label={aria} onClick={trackOpen}>
        <article className="overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-stretch">
            <div className="relative w-full shrink-0 sm:w-[220px] lg:w-[240px]">
              <div className="relative h-36 w-full overflow-hidden bg-[#E8E0D4] sm:h-full sm:min-h-[150px]">
                <img
                  src={listing.imageUrl}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:brightness-[1.04]"
                />
                <MediaOverlays listing={listing} copy={copy} lang={lang} />
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col px-3.5 py-3.5 sm:px-4 sm:py-4">
              <CardContentBody listing={listing} copy={copy} lang={lang} />
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={href} className={`group block h-full w-full overflow-hidden ${cardRing}`} aria-label={aria} onClick={trackOpen}>
      <article className="flex h-full flex-col overflow-hidden">
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#E8E0D4]">
          <img
            src={listing.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:brightness-[1.04]"
          />
          <MediaOverlays listing={listing} copy={copy} lang={lang} />
        </div>
        <div className="flex min-h-0 flex-col px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-4 sm:pt-3.5">
          <CardContentBody listing={listing} copy={copy} lang={lang} />
        </div>
      </article>
    </Link>
  );
}
