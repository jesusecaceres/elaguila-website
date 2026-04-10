import Link from "next/link";
import { FiShield } from "react-icons/fi";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import { withRentasLandingLang, type RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import {
  rentasCtaPrimaryClass,
  rentasLinkSupportClass,
  rentasSectionHeaderActionClass,
  rentasTrustBandClass,
} from "@/app/clasificados/rentas/rentasLandingTheme";
import { RENTAS_RESULTS } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

type Props = {
  copy: RentasLandingCopy;
  lang: RentasLandingLang;
};

export function RentasLandingTrustFooter({ copy, lang }: Props) {
  const resultsHref = withRentasLandingLang(RENTAS_RESULTS, lang);
  const clasificadosHref = withRentasLandingLang("/clasificados", lang);
  const contactHref = withRentasLandingLang("/contact", lang);

  return (
    <footer className={rentasTrustBandClass}>
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C9D4E0]/50 bg-white/80 shadow-sm">
          <FiShield className="h-7 w-7 text-[#5B7C99]/85" aria-hidden />
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-[#4A5568]">
          {copy.trust.line}{" "}
          <Link href={contactHref} className={rentasLinkSupportClass}>
            {copy.trust.contact}
          </Link>
        </p>
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link href={resultsHref} className={`inline-flex items-center justify-center ${rentasCtaPrimaryClass} w-full min-w-[12rem] sm:w-auto`}>
            {copy.trust.ctaResults}
          </Link>
          <Link href={clasificadosHref} className={rentasSectionHeaderActionClass}>
            {copy.trust.backClasificados}
          </Link>
        </div>
      </div>
    </footer>
  );
}
