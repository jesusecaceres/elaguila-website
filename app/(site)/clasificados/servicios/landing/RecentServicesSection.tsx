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
      <div className="mb-8 md:mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3d5a73]/85">
          {lang === "en" ? "Community" : "Comunidad"}
        </p>
        <h2
          id="servicios-recientes-heading"
          className="mt-2 text-[1.65rem] font-bold leading-tight tracking-tight text-[#142a42] sm:text-[1.85rem] md:text-[2rem]"
        >
          {lang === "en" ? "Recent services" : "Servicios Recientes"}
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#4a5d6e] sm:text-[16px]">
          {lang === "en"
            ? "New and updated showcases from local professionals."
            : "Vitrinas nuevas y actualizadas de profesionales locales."}
        </p>
      </div>
      <div className="grid gap-7 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-9">
        {items.map((row) => (
          <RecentServiceCard key={row.id} row={row} lang={lang} />
        ))}
      </div>
    </section>
  );
}
