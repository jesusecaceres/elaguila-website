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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3d5a73]/85">
            {lang === "en" ? "Premium placement" : "Espacio premium"}
          </p>
          <h2
            id="servicios-destacados-heading"
            className="mt-2 text-[1.65rem] font-bold leading-tight tracking-tight text-[#142a42] sm:text-[1.85rem] md:text-[2rem]"
          >
            {lang === "en" ? "Featured businesses" : "Negocios Destacados"}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#4a5d6e] sm:text-[16px]">
            {lang === "en"
              ? "Premium visibility for partners — structured profiles, not anonymous listings."
              : "Visibilidad premium para socios — perfiles estructurados, no listados anónimos."}
          </p>
        </div>
      </div>
      <div className="grid gap-7 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-9">
        {items.map((row) => (
          <FeaturedBusinessCard key={row.id} row={row} lang={lang} />
        ))}
      </div>
    </section>
  );
}
