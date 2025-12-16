import { Suspense } from "react";
import { categoryConfig, CategoryKey } from "./config/categoryConfig";
import CategoryTabs from "./components/CategoryTabs";
import FilterBar from "./components/FilterBar";
import ListingsGrid from "./components/ListingsGrid";
import { classifieds } from "@/app/data/classifieds";

type SearchParams = {
  category?: string;
  lang?: string;
};

export default async function ClasificadosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const lang: "es" | "en" = params.lang === "en" ? "en" : "es";

  const requestedCategory = params.category;
  const safeCategory: CategoryKey =
    requestedCategory &&
    requestedCategory in categoryConfig
      ? (requestedCategory as CategoryKey)
      : "servicios";

  const title = categoryConfig[safeCategory].label[lang];

  /**
   * IMPORTANT:
   * - classifieds.category is a STRING (by design)
   * - We safely compare strings here
   * - No forced casts, no data changes
   */
  const listings = classifieds.filter(
    (item) => item.category === safeCategory
  );

  return (
    <main className="relative z-10">
      {/* HERO */}
      <section className="pt-32 text-center">
        <h1 className="text-5xl font-serif font-bold text-gold">
          {title}
        </h1>
      </section>

      {/* CATEGORY TABS (always visible) */}
      <section className="mt-10">
        <CategoryTabs />
      </section>

      {/* FILTER BAR (foundation only – ZIP 5) */}
      <section className="max-w-7xl mx-auto px-6">
        <FilterBar category={safeCategory} lang={lang} />
      </section>

      {/* LISTINGS GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <Suspense>
          <ListingsGrid
            listings={listings}
            category={safeCategory}
            lang={lang}
          />
        </Suspense>
      </section>
    </main>
  );
}
