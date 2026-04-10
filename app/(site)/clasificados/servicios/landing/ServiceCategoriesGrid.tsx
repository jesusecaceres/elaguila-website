import { ServiceCategoryCard } from "./ServiceCategoryCard";
import type { ServiciosLandingExploreCategory } from "./serviciosLandingSampleData";

export function ServiceCategoriesGrid({
  lang,
  categories,
}: {
  lang: "es" | "en";
  categories: ServiciosLandingExploreCategory[];
}) {
  return (
    <section className="relative" aria-labelledby="servicios-categorias-heading">
      <div className="mb-6">
        <h2 id="servicios-categorias-heading" className="text-2xl font-bold tracking-tight text-[#1a2f4a] sm:text-[1.65rem]">
          {lang === "en" ? "Explore all categories" : "Explora Todas las Categorías"}
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5b6b7b]">
          {lang === "en"
            ? "Jump into results with the same trade families your listing will use when published."
            : "Entra a resultados con las mismas familias de giro que usará tu anuncio al publicarse."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 lg:gap-5">
        {categories.map((c) => (
          <ServiceCategoryCard key={c.id} lang={lang} cat={c} />
        ))}
      </div>
    </section>
  );
}
