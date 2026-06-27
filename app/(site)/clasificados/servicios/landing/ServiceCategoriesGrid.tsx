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
      <div className="mb-4 sm:mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3d5a73]/85">
          {lang === "en" ? "Browse by category" : "Explora por categoría"}
        </p>
        <h2
          id="servicios-categorias-heading"
          className="mt-1 text-xl font-bold leading-tight tracking-tight text-[#142a42] sm:text-2xl"
        >
          {lang === "en" ? "Explore categories" : "Explora por categoría"}
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[#4a5d6e] sm:text-sm">
          {lang === "en"
            ? "Jump into results with real service categories supported by the publish form."
            : "Entra a resultados con categorías reales que ya existen en el formulario de publicación."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {categories.map((c) => (
          <ServiceCategoryCard key={c.id} lang={lang} cat={c} />
        ))}
      </div>
    </section>
  );
}
