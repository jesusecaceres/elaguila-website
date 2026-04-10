import Link from "next/link";
import { FiShield } from "react-icons/fi";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import { withRentasLandingLang, type RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { rentasCtaPrimaryClass, rentasLinkSupportClass } from "@/app/clasificados/rentas/rentasLandingTheme";
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
    <footer className="mt-16 rounded-2xl border border-[#C9D4E0]/50 bg-gradient-to-br from-[#F0F4F8]/80 to-[#FFFCF7]/90 px-4 py-10 shadow-[0_12px_40px_-24px_rgba(44,36,28,0.15)] sm:px-8">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <FiShield className="h-8 w-8 text-[#5B7C99]/80" aria-hidden />
        <p className="mt-4 text-[13px] leading-relaxed text-[#4A5568]">
          {copy.trust.line}{" "}
          <Link href={contactHref} className={rentasLinkSupportClass}>
            {copy.trust.contact}
          </Link>
        </p>
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
          <Link href={resultsHref} className={rentasCtaPrimaryClass}>
            {copy.trust.ctaResults}
          </Link>
          <Link href={clasificadosHref} className={`text-sm ${rentasLinkSupportClass}`}>
            {copy.trust.backClasificados}
          </Link>
        </div>
      </div>
    </footer>
  );
}
