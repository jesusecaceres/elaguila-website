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
      className="group flex h-full min-h-[132px] flex-col items-center justify-center rounded-2xl border border-[#E8E2D8] bg-[#FFFCF7] p-5 text-center shadow-[0_10px_28px_-18px_rgba(30,52,78,0.28)] transition hover:-translate-y-0.5 hover:border-[#1e3a5f]/25 hover:shadow-[0_16px_36px_-16px_rgba(30,52,78,0.35)] active:scale-[0.99]"
    >
      <span className="text-4xl leading-none transition group-hover:scale-105" aria-hidden>
        {cat.icon}
      </span>
      <span className="mt-3 text-[14px] font-bold text-[#1a2f4a]">{cat.labelEs}</span>
    </Link>
  );
}
