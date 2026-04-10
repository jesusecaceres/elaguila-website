import Link from "next/link";
import { FiMapPin } from "react-icons/fi";
import { BR_NEGOCIO_Q_PROPIEDAD } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { IconBath, IconBed, IconRuler } from "@/app/clasificados/bienes-raices/resultados/cards/cardIcons";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import type { RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import {
  rentasCardSurfaceClass,
  rentasCtaSecondaryClass,
  rentasSectionHeadingClass,
  rentasSectionHeaderActionClass,
} from "@/app/clasificados/rentas/rentasLandingTheme";
import type { RentasResultsDemoListing } from "@/app/clasificados/rentas/results/rentasResultsDemoData";
import { RENTAS_RESULTS } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { buildRentasResultsUrl } from "@/app/clasificados/rentas/shared/utils/rentasResultsRoutes";
import { rentasListingResultsHandoff } from "./rentasListingResultsHandoff";

function SellerPill({
  branch,
  copy,
}: {
  branch: "privado" | "negocio";
  copy: RentasLandingCopy["card"];
}) {
  if (branch === "privado") {
    return (
      <span className="rounded-full border border-[#5B7C99]/25 bg-[#E8EEF4]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2C3E4D] shadow-sm">
        {copy.sellerPrivado}
      </span>
    );
  }
  return (
    <span className="rounded-full border border-[#D4A84B]/45 bg-[#FFF8E8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6B4E1D] shadow-sm">
      {copy.sellerNegocio}
    </span>
  );
}

type Props = {
  copy: RentasLandingCopy;
  lang: RentasLandingLang;
  primary: RentasResultsDemoListing;
  supporting?: RentasResultsDemoListing | null;
};

export function RentasLandingFeatured({ copy, lang, primary, supporting }: Props) {
  const primaryHref = rentasListingResultsHandoff(primary, lang);
  const resultsSimilar = buildRentasResultsUrl({
    branch: primary.branch,
    [BR_NEGOCIO_Q_PROPIEDAD]: primary.categoriaPropiedad,
    lang,
  });
  const resultsHref = withRentasLandingLang(RENTAS_RESULTS, lang);
  const fc = copy.featured;

  return (
    <section className="mt-14 sm:mt-[4.25rem]" aria-labelledby="rentas-landing-featured-heading">
      <h2 id="rentas-landing-featured-heading" className={rentasSectionHeadingClass}>
        {fc.title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4A4338]/90">{fc.subtitle}</p>

      <div className="mt-10 grid grid-cols-1 gap-7 md:grid-cols-12 md:items-stretch md:gap-8 lg:gap-10">
        <div className="md:col-span-12 lg:col-span-8">
          <div className={`overflow-hidden rounded-[1.35rem] ${rentasCardSurfaceClass} ring-1 ring-[#D4C4A8]/35`}>
            <div className="flex flex-col lg:flex-row lg:items-stretch">
              <div className="relative min-w-0 lg:w-[58%]">
                <div className="relative aspect-[16/10] bg-[#E8E0D4] lg:aspect-auto lg:h-full lg:min-h-[min(360px,50vh)]">
                  <span className="absolute left-3 top-3 z-[2] rounded-md border border-[#E8A849]/40 bg-[#FFF4E0]/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#7A4A12] shadow-sm">
                    {fc.badgeFeatured}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={primary.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-5 p-6 sm:p-8">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[1.75rem] font-bold tracking-tight text-[#B8893C] sm:text-[2rem]">{primary.rentDisplay}</p>
                    <SellerPill branch={primary.branch} copy={copy.card} />
                  </div>
                  <p className="mt-2 font-serif text-xl font-semibold text-[#1E1810] sm:text-2xl">{primary.title}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#5C5346]">
                    <FiMapPin className="h-4 w-4 shrink-0 text-[#5B7C99]" aria-hidden />
                    {primary.addressLine}
                  </p>
                </div>
                <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#3D3630]">
                  <li className="inline-flex items-center gap-1.5">
                    <IconBed className="text-[#5B7C99]" />
                    <span className="text-[#5C5346]/80">{fc.beds}</span> {primary.beds}
                  </li>
                  <li className="inline-flex items-center gap-1.5">
                    <IconBath className="text-[#5B7C99]" />
                    <span className="text-[#5C5346]/80">{fc.baths}</span> {primary.baths}
                  </li>
                  <li className="inline-flex items-center gap-1.5">
                    <IconRuler className="text-[#5B7C99]" />
                    <span className="text-[#5C5346]/80">{fc.sqft}</span> {primary.sqft}
                  </li>
                </ul>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <Link
                    href={primaryHref}
                    className="rounded-full bg-[#C45C26] px-6 py-2.5 text-center text-sm font-semibold text-[#FFFBF7] shadow-[0_8px_22px_-10px_rgba(196,92,38,0.55)] transition hover:bg-[#A84E20]"
                  >
                    {fc.ctaDetails}
                  </Link>
                  <Link href={resultsSimilar} className={rentasCtaSecondaryClass}>
                    {fc.ctaSimilar}
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4D9C8]/90 bg-[#FAF7F2]/95 px-4 py-3 sm:px-6">
              <p className="text-sm text-[#1E1810]">
                <span className="font-semibold">{primary.beds}</span> {fc.bedsShort} ·{" "}
                <span className="font-semibold">{primary.baths}</span> {fc.bathsShort} ·{" "}
                <span className="font-semibold">{primary.sqft}</span>
              </p>
              <SellerPill branch={primary.branch} copy={copy.card} />
            </div>
          </div>
        </div>

        {supporting ? (
          <aside
            className={`flex flex-col justify-between gap-4 rounded-[1.15rem] p-5 md:col-span-12 lg:col-span-4 ${rentasCardSurfaceClass} ring-1 ring-[#5B7C99]/15`}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/80">{fc.supportingEyebrow}</p>
              <p className="mt-2 font-serif text-lg font-semibold text-[#1E1810]">{supporting.title}</p>
              <p className="mt-1 text-sm text-[#5C5346]">{supporting.addressLine}</p>
              <p className="mt-3 text-lg font-bold text-[#B8893C]">{supporting.rentDisplay}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SellerPill branch={supporting.branch} copy={copy.card} />
            </div>
            <Link
              href={rentasListingResultsHandoff(supporting, lang)}
              className="mt-2 inline-flex justify-center rounded-full border border-[#C45C26]/35 bg-[#FFFCF7] px-4 py-2 text-sm font-semibold text-[#1E1810] transition hover:border-[#C45C26]/55 hover:bg-white"
            >
              {fc.ctaSupporting}
            </Link>
          </aside>
        ) : null}
      </div>

      <p className="mt-9 flex justify-center">
        <Link href={resultsHref} className={rentasSectionHeaderActionClass}>
          {fc.viewAllResults}
        </Link>
      </p>
    </section>
  );
}
