import Link from "next/link";
import { CategoryLandingChipsRail } from "@/app/(site)/clasificados/components/categoryLanding/CategoryLandingChipsRail";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  buildCategoryResultsUrl,
  type CatStdAllSlug,
} from "./categoryStandardRoutes";
import { categoryStandardQuickFilters } from "./categoryStandardTheme";

type Props = {
  category: CatStdAllSlug;
  lang: Lang;
  label?: string;
};

export function CategoryStandardQuickFilterChips({ category, lang, label }: Props) {
  const chips = categoryStandardQuickFilters(category, lang);
  const railLabel = label ?? (lang === "es" ? "Filtros rápidos" : "Quick filters");

  return (
    <CategoryLandingChipsRail label={railLabel}>
      {chips.map((chip) => (
        <Link
          key={chip}
          href={buildCategoryResultsUrl(category, lang, { q: chip })}
          className="inline-flex h-[30px] max-w-full shrink-0 snap-start items-center rounded-md border border-[#C9A84A]/45 bg-[#FBF7EF] px-2.5 text-[11px] font-semibold leading-none text-[#3D3428] transition hover:border-[#C9A84A]/70 hover:bg-[#FFFDF7] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/40 sm:text-xs"
        >
          {chip}
        </Link>
      ))}
    </CategoryLandingChipsRail>
  );
}
