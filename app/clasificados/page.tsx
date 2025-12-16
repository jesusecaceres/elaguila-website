import { Suspense } from "react";
import { categoryConfig, CategoryKey } from "./config/categoryConfig";
import CategoryNav from "./components/CategoryNav";
import FilterBar from "./components/FilterBar";
import ListingsGrid from "./components/ListingsGrid";
import { classifieds } from "@/app/data/classifieds";

type SearchParams = {
  category?: string;
  lang?: string;
};

export default function ClasificadosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const lang: "es" | "en" = searchParams.lang === "en" ? "en" : "es";

  const category = (searchParams.category as CategoryKey) || "servicios";
  const safeCategory: CategoryKey =
    category in categoryConfig ? category : "servicios";

  const title = categoryConfig[safeCategory].label[lang];

  const listings = classifieds.filter(
    (item) => item.category === safeCategory
  );

  return (
    <main className="relative z-10">
      <section className="pt-32 text-center">
        <h1 className="text-5xl font-serif font-bold text-gold">{title}</h1>
      </section>

      <section className="mt-10">
        <CategoryNav active={safeCategory} lang={lang} />
      </section>

      <section className="max-w-7xl mx-auto px-6">
        <FilterBar category={safeCategory} lang={lang} />
      </section>

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