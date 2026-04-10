import Link from "next/link";
import {
  RENTAS_PUBLICAR_NEGOCIO,
  RENTAS_PUBLICAR_PRIVADO,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

export function RentasLandingCategoryHeader() {
  return (
    <header className="border-b border-[#E8DFD0]/80 pb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <nav className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5C5346]">
            <Link href="/clasificados" className="hover:text-[#B8954A]">
              Clasificados
            </Link>
            <span className="text-[#C9B46A]" aria-hidden>
              ›
            </span>
            <span className="text-[#1E1810]">Rentas</span>
          </nav>
          <h1 className="mt-4 font-serif text-[2.65rem] font-semibold leading-[1.08] tracking-tight text-[#1E1810] sm:text-[3.1rem]">
            Rentas
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[#5C5346]/92 sm:text-lg">
            Encuentra rentas residenciales, comerciales y terrenos. Explora con claridad; publica como particular o negocio cuando
            quieras listar.
          </p>
        </div>
        <div className="flex w-full flex-shrink-0 flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
          <Link
            href={RENTAS_PUBLICAR_PRIVADO}
            className="rounded-full bg-[#4A7C59] px-5 py-2.5 text-center text-sm font-semibold text-[#FAF7F2] shadow-sm transition hover:bg-[#3d6a4b]"
          >
            Publicar — Privado
          </Link>
          <Link
            href={RENTAS_PUBLICAR_NEGOCIO}
            className="rounded-full border border-[#D4C4A8]/90 bg-[#EDE6D8] px-5 py-2.5 text-center text-sm font-semibold text-[#1E1810] shadow-sm transition hover:border-[#C9B46A] hover:bg-[#E8DFD0]/80"
          >
            Publicar — Negocio
          </Link>
        </div>
      </div>
    </header>
  );
}
