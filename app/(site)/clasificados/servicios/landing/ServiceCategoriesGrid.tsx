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
      <div className="mb-3 sm:mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3d5a73]/85">
          {lang === "en" ? "Browse by category" : "Explora por categoría"}
        </p>
        <h2
          id="servicios-categorias-heading"
          className="mt-1 text-lg font-bold leading-tight tracking-tight text-[#142a42] sm:text-xl"
        >
          {lang === "en" ? "Explore categories" : "Explora por categoría"}
        </h2>
        <p className="mt-1 max-w-2xl text-[12px] leading-snug text-[#4a5d6e] sm:text-[13px]">
          {lang === "en"
            ? "Jump into results with real service categories supported by the publish form."
            : "Entra a resultados con categorías reales que ya existen en el formulario de publicación."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {categories.map((c) => (
          <ServiceCategoryCard key={c.id} lang={lang} cat={c} />
        ))}
      </div>
    </section>
  );
}
