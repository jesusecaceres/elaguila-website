import Link from "next/link";
import type { ServiciosLandingExploreCategory } from "./serviciosLandingSampleData";
import { ServiceCategoryGlyph } from "./serviciosCategoryIcons";

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
      className="group flex h-full min-h-[92px] flex-col items-center justify-center rounded-[14px] border border-[#e8e1d6] bg-white p-2.5 text-center shadow-[0_10px_28px_-22px_rgba(20,38,58,0.38)] ring-1 ring-[#1e3a5f]/[0.04] transition duration-200 hover:-translate-y-0.5 hover:border-[#c9d6e8]/90 hover:shadow-[0_20px_44px_-28px_rgba(20,38,58,0.42)] active:scale-[0.99] sm:min-h-[116px] sm:rounded-[16px] sm:p-3.5"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-[#f7f1e6] to-[#efe5d2] text-[#7A1E2C] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-[#7A1E2C]/[0.08] sm:h-12 sm:w-12">
        <ServiceCategoryGlyph
          id={cat.id}
          className="h-5 w-5 transition duration-200 group-hover:scale-105 sm:h-6 sm:w-6"
        />
      </div>
      <span className="mt-2 max-w-[9rem] text-[12px] font-bold leading-snug text-[#142a42] sm:text-[13px]">
        {lang === "en" ? cat.labelEn : cat.labelEs}
      </span>
    </Link>
  );
}
