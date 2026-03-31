import Image from "next/image";
import Link from "next/link";
import { BR_CATEGORY_HOME } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";

function IconBriefcase({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="9" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 9V7a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BienesRaicesResultsTopBar() {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-[#E8DFD0]/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <Link href="/clasificados" className="shrink-0 rounded-full ring-2 ring-[#E8DFD0]/80 ring-offset-2 ring-offset-[#F4EFE6]">
          <Image src="/logo.png" alt="Leonix" width={40} height={40} className="h-10 w-10 rounded-full object-cover" priority />
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5C5346]">
          <Link href={BR_CATEGORY_HOME} className="hover:text-[#B8954A]">
            Bienes raíces
          </Link>
          <span className="text-[#C9B46A]" aria-hidden>
            ›
          </span>
          <span className="text-[#5C5346]">Resultados</span>
          <span className="text-[#C9B46A]" aria-hidden>
            ›
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2620]/15 bg-[#2A2620] px-3 py-1 text-[#FAF7F2] shadow-sm">
            <IconBriefcase className="text-[#C5A059]" />
            Negocio
          </span>
        </nav>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/login"
          className="rounded-full border border-[#E8DFD0] bg-[#FDFBF7] px-4 py-2 font-semibold text-[#3D3630] shadow-sm hover:border-[#C9B46A]/45"
        >
          Crear cuenta
        </Link>
        <span className="hidden items-center gap-1 rounded-full border border-[#E8DFD0]/90 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#5C5346] sm:inline-flex">
          <span className="text-[#B8954A]" aria-hidden>
            ◎
          </span>
          Radio 25 km
        </span>
      </div>
    </header>
  );
}
