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
    <header className="mb-4 flex flex-col gap-3 border-b border-[#D6C7AD]/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <nav className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#556B3E]" aria-label="Breadcrumb">
        <Link href={clasificadosHref} className="hover:text-[#7A1E2C]">
          {lang === "es" ? "Clasificados" : "Classifieds"}
        </Link>
        <span aria-hidden>/</span>
        <Link href={rentasHref} className="hover:text-[#7A1E2C]">
          {copy.breadcrumbRentas}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-[#3D3428]">{copy.results.topBarResults}</span>
      </nav>
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
