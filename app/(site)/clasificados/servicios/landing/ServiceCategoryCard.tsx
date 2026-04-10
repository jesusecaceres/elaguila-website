import Link from "next/link";
import type { ServiciosLandingExploreCategory } from "./serviciosLandingSampleData";

export function ServiceCategoryCard({
  lang,
  cat,
}: {
  lang: "es" | "en";
  cat: ServiciosLandingExploreCategory;
}) {
  const href = cat.resultsGroup
    ? `/clasificados/servicios/resultados?lang=${lang}&group=${encodeURIComponent(cat.resultsGroup)}`
    : `/clasificados/servicios/resultados?lang=${lang}`;

  return (
    <Link
      href={href}
      className="group flex h-full min-h-[148px] flex-col items-center justify-center rounded-[18px] border border-[#e8e1d6] bg-white p-4 text-center shadow-[0_14px_36px_-28px_rgba(20,38,58,0.38)] ring-1 ring-[#1e3a5f]/[0.04] transition duration-200 hover:-translate-y-0.5 hover:border-[#c9d6e8]/90 hover:shadow-[0_20px_44px_-28px_rgba(20,38,58,0.42)] active:scale-[0.99] sm:min-h-[156px] sm:p-5"
    >
      <div className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl bg-gradient-to-b from-[#eef4fb] to-[#dfe9f4] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-[#1e3a5f]/[0.07] sm:h-[4.5rem] sm:w-[4.5rem]">
        <span className="text-[2.1rem] leading-none transition duration-200 group-hover:scale-105 sm:text-[2.25rem]" aria-hidden>
          {cat.icon}
        </span>
      </div>
      <span className="mt-3.5 max-w-[9rem] text-[13px] font-bold leading-snug text-[#142a42] sm:text-[14px]">
        {cat.labelEs}
      </span>
    </Link>
  );
}
