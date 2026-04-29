import Image from "next/image";
import Link from "next/link";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import { withRentasLandingLang, type RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { RENTAS_LANDING } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

type Props = {
  copy: Pick<RentasLandingCopy, "breadcrumbRentas" | "results">;
  lang: RentasLandingLang;
};

export function RentasResultsTopBar({ copy, lang }: Props) {
  const clasificadosHref = withRentasLandingLang("/clasificados", lang);
  const rentasHref = withRentasLandingLang(RENTAS_LANDING, lang);
  const loginHref = withRentasLandingLang("/login", lang);

  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-[#D4A574]/20 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <Link href={clasificadosHref} className="shrink-0 rounded-full ring-2 ring-[#D4A574]/30 ring-offset-2 ring-offset-[#FFFAF0]">
          <Image src="/logo.png" alt="Leonix" width={40} height={40} className="h-10 w-10 rounded-full object-cover" priority />
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7A7A7A]">
          <Link href={rentasHref} className="hover:text-[#D4A574] transition-colors">
            {copy.breadcrumbRentas}
          </Link>
          <span className="text-[#D4A574]" aria-hidden>
            ›
          </span>
          <span className="text-[#7A7A7A]">{copy.results.topBarResults}</span>
        </nav>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href={loginHref}
          className="rounded-full border border-[#D4A574]/30 bg-white px-4 py-2 font-semibold text-[#1A1A1A] shadow-sm hover:bg-[#FFFAF0] hover:border-[#D4A574] transition-all"
        >
          {copy.results.createAccount}
        </Link>
      </div>
    </header>
  );
}
