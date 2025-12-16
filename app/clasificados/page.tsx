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

  const category = (params.category as CategoryKey) || "servicios";
  const safeCategory: CategoryKey =
    category in categoryConfig ? category : "servicios";

  const title = categoryConfig[safeCategory].label[lang];

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
        <CategoryTabs activeCategory={safeCategory} lang={lang} />
      </section>

      {/* FILTER BAR (foundation only) */}
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
