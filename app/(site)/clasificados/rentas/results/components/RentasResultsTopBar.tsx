import Image from "next/image";
import Link from "next/link";
import { RENTAS_LANDING } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

export function RentasResultsTopBar() {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-[#E8DFD0]/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <Link href="/clasificados" className="shrink-0 rounded-full ring-2 ring-[#E8DFD0]/80 ring-offset-2 ring-offset-[#F4EFE6]">
          <Image src="/logo.png" alt="Leonix" width={40} height={40} className="h-10 w-10 rounded-full object-cover" priority />
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5C5346]">
          <Link href={RENTAS_LANDING} className="hover:text-[#B8954A]">
            Rentas
          </Link>
          <span className="text-[#C9B46A]" aria-hidden>
            ›
          </span>
          <span className="text-[#5C5346]">Resultados</span>
        </nav>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/login"
          className="rounded-full border border-[#E8DFD0] bg-[#FDFBF7] px-4 py-2 font-semibold text-[#3D3630] shadow-sm hover:border-[#C9B46A]/45"
        >
          Crear cuenta
        </Link>
      </div>
    </header>
  );
}
