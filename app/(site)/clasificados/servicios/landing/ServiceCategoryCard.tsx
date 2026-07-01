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
      className="group flex h-full min-h-[72px] flex-col items-center justify-center rounded-lg border border-[#D6C7AD]/80 bg-[#FFFDF7] p-2 text-center transition hover:border-[#C9A84A]/55 sm:min-h-[80px]"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#FBF7EF] text-[#7A1E2C] sm:h-9 sm:w-9">
        <ServiceCategoryGlyph
          id={cat.id}
          className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
        />
      </div>
      <span className="mt-1.5 max-w-[9rem] text-[11px] font-semibold leading-snug text-[#2A4536] sm:text-xs">
        {lang === "en" ? cat.labelEn : cat.labelEs}
      </span>
    </Link>
  );
}
