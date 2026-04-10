import { FeaturedBusinessCard } from "./FeaturedBusinessCard";
import type { ServiciosLandingFeaturedBusiness } from "./serviciosLandingSampleData";

export function FeaturedBusinessSection({
  lang,
  items,
}: {
  lang: "es" | "en";
  items: ServiciosLandingFeaturedBusiness[];
}) {
  return (
    <section className="relative" aria-labelledby="servicios-destacados-heading">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="servicios-destacados-heading" className="text-2xl font-bold tracking-tight text-[#1a2f4a] sm:text-[1.65rem]">
            {lang === "en" ? "Featured businesses" : "Negocios Destacados"}
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5b6b7b]">
            {lang === "en"
              ? "Premium visibility for partners — structured profiles, not anonymous listings."
              : "Visibilidad premium para socios — perfiles estructurados, no listados anónimos."}
          </p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {items.map((row) => (
          <FeaturedBusinessCard key={row.id} row={row} lang={lang} />
        ))}
      </div>
    </section>
  );
}
