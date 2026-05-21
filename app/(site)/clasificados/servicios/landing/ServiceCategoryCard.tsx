import Link from "next/link";
import type { ServiciosLandingExploreCategory } from "./serviciosLandingSampleData";

export function ServiceCategoryCard({
  lang,
  cat,
}: {
  lang: "es" | "en";
  cat: ServiciosLandingExploreCategory;
}) {
  const qRaw = (lang === "en" ? cat.resultsQueryEn : cat.resultsQueryEs)?.trim() ?? "";
  const href = cat.resultsGroup
    ? `/clasificados/servicios/resultados?lang=${lang}&group=${encodeURIComponent(cat.resultsGroup)}`
    : qRaw
      ? `/clasificados/servicios/resultados?lang=${lang}&q=${encodeURIComponent(qRaw)}`
      : `/clasificados/servicios/resultados?lang=${lang}`;

  return (
    <Link
      href={href}
      className="group flex h-full min-h-[118px] flex-col items-center justify-center rounded-[14px] border border-[#e8e1d6] bg-white p-3 text-center shadow-[0_10px_28px_-22px_rgba(20,38,58,0.38)] ring-1 ring-[#1e3a5f]/[0.04] transition duration-200 hover:-translate-y-0.5 hover:border-[#c9d6e8]/90 hover:shadow-[0_20px_44px_-28px_rgba(20,38,58,0.42)] active:scale-[0.99] sm:min-h-[156px] sm:rounded-[18px] sm:p-5"
    >
      <div className="flex h-[3.35rem] w-[3.35rem] items-center justify-center rounded-xl bg-gradient-to-b from-[#eef4fb] to-[#dfe9f4] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-[#1e3a5f]/[0.07] sm:h-[4.5rem] sm:w-[4.5rem] sm:rounded-2xl">
        <span className="text-[1.75rem] leading-none transition duration-200 group-hover:scale-105 sm:text-[2.25rem]" aria-hidden>
          {cat.icon}
        </span>
      </div>
      <span className="mt-2.5 max-w-[9rem] text-[12px] font-bold leading-snug text-[#142a42] sm:mt-3.5 sm:text-[14px]">
        {lang === "en" ? cat.labelEn : cat.labelEs}
      </span>
    </Link>
  );
}
