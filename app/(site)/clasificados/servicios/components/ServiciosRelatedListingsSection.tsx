import Link from "next/link";

import { ServiciosHorizontalResultCard } from "./ServiciosHorizontalResultCard";
import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";

/**
 * Gate SERVICIOS-2 — Related Listings rail for the Servicios public vitrina.
 *
 * Renders real published listings supplied by `listRelatedServiciosListings` using the EXISTING
 * `ServiciosHorizontalResultCard` — the same card the results page renders, deliberately not a new
 * card design (Gate 2 explicitly does not redesign result cards).
 *
 * When nothing genuinely relates, this falls back to a real browse link into the category's own
 * results rather than rendering an empty section — the same never-a-broken-promise shape the
 * En Venta related rail established. It never fabricates filler listings.
 */
export function ServiciosRelatedListingsSection({
  rows,
  matchedByTrade,
  lang,
  browseHref,
}: {
  rows: ServiciosPublicListingRow[];
  matchedByTrade: boolean;
  lang: ServiciosLang;
  /** Real results URL to fall back to / continue browsing with. */
  browseHref: string;
}) {
  const title = lang === "en" ? "Related services" : "Servicios relacionados";
  const subtitle = matchedByTrade
    ? lang === "en"
      ? "Other published providers in the same trade and area."
      : "Otros proveedores publicados del mismo giro y zona."
    : lang === "en"
      ? "Other published providers in this area."
      : "Otros proveedores publicados en esta zona.";
  const browseLabel = lang === "en" ? "Browse all services" : "Ver todos los servicios";

  return (
    <section
      aria-labelledby="servicios-related-heading"
      className="mx-auto mt-8 w-full max-w-[1100px] px-4 pb-10 md:px-6"
    >
      <div className="rounded-2xl border border-[#D6C7AD]/70 bg-[#FFFDF7] p-4 shadow-[0_4px_18px_-14px_rgba(31,36,28,0.1)] sm:p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div className="min-w-0">
            <h2 id="servicios-related-heading" className="text-base font-bold text-[#1E1810]">
              {title}
            </h2>
            {rows.length > 0 ? <p className="mt-1 text-xs text-[#5C5346]">{subtitle}</p> : null}
          </div>
          <Link href={browseHref} className="text-sm font-bold text-[#3B66AD] underline">
            {browseLabel}
          </Link>
        </div>

        {rows.length > 0 ? (
          <ul className="grid list-none grid-cols-1 gap-3">
            {rows.map((row) => (
              <li key={row.slug} className="min-w-0">
                <ServiciosHorizontalResultCard row={row} lang={lang} density="compact" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-relaxed text-[#5C5346]">
            {lang === "en"
              ? "No related services published yet. Browse the full Servicios directory to keep looking."
              : "Aún no hay servicios relacionados publicados. Explora el directorio completo de Servicios para seguir buscando."}
          </p>
        )}
      </div>
    </section>
  );
}
