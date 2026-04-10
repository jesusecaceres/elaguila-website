import { RecentServiceCard } from "./RecentServiceCard";
import type { ServiciosLandingRecentListing } from "./serviciosLandingSampleData";

export function RecentServicesSection({
  lang,
  items,
}: {
  lang: "es" | "en";
  items: ServiciosLandingRecentListing[];
}) {
  return (
    <section className="relative" aria-labelledby="servicios-recientes-heading">
      <div className="mb-6">
        <h2 id="servicios-recientes-heading" className="text-2xl font-bold tracking-tight text-[#1a2f4a] sm:text-[1.65rem]">
          {lang === "en" ? "Recent services" : "Servicios Recientes"}
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5b6b7b]">
          {lang === "en"
            ? "New and updated showcases from local professionals."
            : "Vitrinas nuevas y actualizadas de profesionales locales."}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {items.map((row) => (
          <RecentServiceCard key={row.id} row={row} lang={lang} />
        ))}
      </div>
    </section>
  );
}
