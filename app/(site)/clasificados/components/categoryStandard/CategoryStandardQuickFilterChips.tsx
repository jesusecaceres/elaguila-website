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
          className="inline-flex min-h-[2.25rem] shrink-0 snap-start items-center rounded-full border border-[#D6C7AD] bg-[#FAF6EE] px-3.5 py-1.5 text-xs font-medium text-[#1F241C] transition hover:border-[#C9A84A]/55 hover:bg-[#FBF7EF] sm:shrink"
        >
          {chip}
        </Link>
      ))}
    </CategoryLandingChipsRail>
  );
}
