import Link from "next/link";
import { FiMapPin } from "react-icons/fi";
import { BR_NEGOCIO_Q_PROPIEDAD } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { IconBath, IconBed, IconRuler } from "@/app/clasificados/bienes-raices/resultados/cards/cardIcons";
import type { RentasResultsDemoListing } from "@/app/clasificados/rentas/results/rentasResultsDemoData";
import { RENTAS_RESULTS } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { buildRentasResultsUrl } from "@/app/clasificados/rentas/shared/utils/rentasResultsRoutes";
import { rentasListingResultsHandoff } from "./rentasListingResultsHandoff";

function SellerPill({ branch }: { branch: "privado" | "negocio" }) {
  if (branch === "privado") {
    return (
      <span className="rounded-full bg-[#D4C4A8]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1E1810]">
        Privado
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#2A2620]/92 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#FAF7F2]">
      Negocio
    </span>
  );
}

type Props = {
  primary: RentasResultsDemoListing;
  supporting?: RentasResultsDemoListing | null;
};

export function RentasLandingFeatured({ primary, supporting }: Props) {
  const primaryHref = rentasListingResultsHandoff(primary);
  const resultsSimilar = buildRentasResultsUrl({
    branch: primary.branch,
    [BR_NEGOCIO_Q_PROPIEDAD]: primary.categoriaPropiedad,
  });

  return (
    <section className="mt-14" aria-labelledby="rentas-landing-featured-heading">
      <h2 id="rentas-landing-featured-heading" className="font-serif text-2xl font-semibold tracking-tight text-[#1E1810] sm:text-[1.85rem]">
        Destacado
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-[#5C5346]/88">Inventario de ejemplo — las promociones reales llegarán con datos publicados.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch lg:gap-8">
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-[1.25rem] border border-[#E8DFD0]/95 bg-[#FDFBF7] shadow-[0_20px_56px_-24px_rgba(42,36,22,0.35)]">
            <div className="flex flex-col lg:flex-row lg:items-stretch">
              <div className="relative lg:w-[58%]">
                <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[340px] lg:h-full">
                  <span className="absolute left-3 top-3 z-[2] rounded-md bg-[#C9B46A]/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1E1810] shadow-sm">
                    Destacada
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={primary.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-5 p-6 sm:p-8">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[1.75rem] font-bold tracking-tight text-[#B8954A] sm:text-[2rem]">{primary.rentDisplay}</p>
                    <SellerPill branch={primary.branch} />
                  </div>
                  <p className="mt-2 font-serif text-xl font-semibold text-[#1E1810] sm:text-2xl">{primary.title}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#5C5346]">
                    <FiMapPin className="h-4 w-4 shrink-0 text-[#B8954A]" aria-hidden />
                    {primary.addressLine}
                  </p>
                </div>
                <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#3D3630]">
                  <li className="inline-flex items-center gap-1.5">
                    <IconBed className="text-[#B8954A]" />
                    <span className="text-[#5C5346]/80">Recámaras</span> {primary.beds}
                  </li>
                  <li className="inline-flex items-center gap-1.5">
                    <IconBath className="text-[#B8954A]" />
                    <span className="text-[#5C5346]/80">Baños</span> {primary.baths}
                  </li>
                  <li className="inline-flex items-center gap-1.5">
                    <IconRuler className="text-[#B8954A]" />
                    <span className="text-[#5C5346]/80">Superficie</span> {primary.sqft}
                  </li>
                </ul>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <Link
                    href={primaryHref}
                    className="rounded-full bg-[#4A7C59] px-6 py-2.5 text-center text-sm font-semibold text-[#FAF7F2] shadow-sm transition hover:bg-[#3d6a4b]"
                  >
                    Ver detalles en resultados
                  </Link>
                  <Link
                    href={resultsSimilar}
                    className="rounded-full border border-[#E8DFD0] bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#1E1810] transition hover:border-[#C9B46A]/55"
                  >
                    Ver similares
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8DFD0]/90 bg-[#FAF7F2]/90 px-4 py-3 sm:px-6">
              <p className="text-sm text-[#1E1810]">
                <span className="font-semibold">{primary.beds}</span> recámaras ·{" "}
                <span className="font-semibold">{primary.baths}</span> baños ·{" "}
                <span className="font-semibold">{primary.sqft}</span>
              </p>
              <SellerPill branch={primary.branch} />
            </div>
          </div>
        </div>

        {supporting ? (
          <aside className="flex flex-col justify-between gap-4 rounded-[1.15rem] border border-[#E8DFD0]/95 bg-[#FAF7F2]/90 p-5 shadow-[0_12px_40px_-22px_rgba(42,36,22,0.2)] lg:col-span-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]/75">También en Rentas</p>
              <p className="mt-2 font-serif text-lg font-semibold text-[#1E1810]">{supporting.title}</p>
              <p className="mt-1 text-sm text-[#5C5346]">{supporting.addressLine}</p>
              <p className="mt-3 text-lg font-bold text-[#B8954A]">{supporting.rentDisplay}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SellerPill branch={supporting.branch} />
            </div>
            <Link
              href={rentasListingResultsHandoff(supporting)}
              className="mt-2 inline-flex justify-center rounded-full border border-[#C9B46A]/50 bg-[#FDFBF7] px-4 py-2 text-sm font-semibold text-[#1E1810] hover:bg-white"
            >
              Ver en resultados
            </Link>
          </aside>
        ) : null}
      </div>

      <p className="mt-8 text-center text-sm text-[#5C5346]/85">
        <Link href={RENTAS_RESULTS} className="font-semibold text-[#B8954A] underline decoration-[#C9B46A]/50 underline-offset-4">
          Ver todos los resultados
        </Link>
      </p>
    </section>
  );
}
