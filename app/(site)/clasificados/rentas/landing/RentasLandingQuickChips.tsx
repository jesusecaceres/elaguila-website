import Link from "next/link";
import { FiHeart, FiHome, FiLayers, FiMap, FiUsers } from "react-icons/fi";
import { BR_NEGOCIO_Q_PROPIEDAD } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  RENTAS_QUERY_AMUEBLADO,
  RENTAS_QUERY_BRANCH,
  RENTAS_QUERY_MASCOTAS,
  RENTAS_QUERY_RECS,
} from "@/app/clasificados/rentas/shared/rentasResultsQueryKeys";
import { buildRentasResultsUrl } from "@/app/clasificados/rentas/shared/utils/rentasResultsRoutes";

const CHIP_CLASS =
  "inline-flex items-center gap-2 rounded-full border border-[#E8DFD0] bg-[#FDFBF7] px-3.5 py-2 text-sm font-semibold text-[#3D3630] shadow-sm transition hover:border-[#C9B46A]/55 hover:bg-[#FFFCF7] sm:px-4";

const CHIPS: { label: string; href: string; Icon: typeof FiHome }[] = [
  { label: "Residencial", href: buildRentasResultsUrl({ [BR_NEGOCIO_Q_PROPIEDAD]: "residencial" }), Icon: FiHome },
  { label: "Comercial", href: buildRentasResultsUrl({ [BR_NEGOCIO_Q_PROPIEDAD]: "comercial" }), Icon: FiLayers },
  { label: "Terreno / lote", href: buildRentasResultsUrl({ [BR_NEGOCIO_Q_PROPIEDAD]: "terreno_lote" }), Icon: FiMap },
  { label: "Privado", href: buildRentasResultsUrl({ [RENTAS_QUERY_BRANCH]: "privado" }), Icon: FiUsers },
  { label: "Negocio", href: buildRentasResultsUrl({ [RENTAS_QUERY_BRANCH]: "negocio" }), Icon: FiLayers },
  { label: "Amueblado", href: buildRentasResultsUrl({ [RENTAS_QUERY_AMUEBLADO]: "1" }), Icon: FiHome },
  { label: "Mascotas", href: buildRentasResultsUrl({ [RENTAS_QUERY_MASCOTAS]: "1" }), Icon: FiHeart },
  { label: "2+ recámaras", href: buildRentasResultsUrl({ [RENTAS_QUERY_RECS]: "2" }), Icon: FiHome },
];

export function RentasLandingQuickChips() {
  return (
    <section className="mt-10" aria-labelledby="rentas-quick-chips-heading">
      <h2 id="rentas-quick-chips-heading" className="font-serif text-2xl font-semibold tracking-tight text-[#1E1810] sm:text-[1.75rem]">
        Explorar rápido
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]/88">
        Atajos a la cuadrícula de resultados con filtros ya aplicados en la URL.
      </p>
      <div className="mt-5 flex flex-wrap gap-2 sm:gap-2.5">
        {CHIPS.map(({ label, href, Icon }) => (
          <Link key={label} href={href} className={CHIP_CLASS}>
            <Icon className="h-4 w-4 shrink-0 text-[#B8954A]" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
