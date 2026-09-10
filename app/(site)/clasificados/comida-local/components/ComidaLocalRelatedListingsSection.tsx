import Link from "next/link";

import { mapComidaLocalRowToCardVm } from "@/app/lib/clasificados/comida-local/mapComidaLocalPublicListing";
import type { ComidaLocalPublicListingRow } from "@/app/lib/clasificados/comida-local/comidaLocalPublicTypes";
import { ComidaLocalListingCard } from "./ComidaLocalListingCard";
import { CL_PANEL, CL_SECTION_TITLE } from "./comidaLocalCustomerStyles";

/**
 * Gate COMIDA-LOCAL-2 — Related Listings rail for the Comida Local public vitrina.
 *
 * Renders real published listings supplied by `listRelatedComidaLocalListings` using the EXISTING
 * `ComidaLocalListingCard` — the same card the results page renders — reached through the existing
 * `mapComidaLocalRowToCardVm`. No new card, no new row shape, no new VM.
 *
 * When nothing genuinely relates, this falls back to a real browse link into the category's own
 * results rather than rendering an empty section. It never fabricates filler listings.
 */
export function ComidaLocalRelatedListingsSection({
  rows,
  matchedByFood,
  lang,
  browseHref,
}: {
  rows: ComidaLocalPublicListingRow[];
  matchedByFood: boolean;
  lang: "es" | "en";
  /** Real results URL to fall back to / continue browsing with. */
  browseHref: string;
}) {
  const en = lang === "en";
  const title = en ? "Related local food" : "Comida local relacionada";
  const subtitle = matchedByFood
    ? en
      ? "Other published sellers offering similar food."
      : "Otros vendedores publicados con comida similar."
    : en
      ? "Other published sellers nearby with the same service options."
      : "Otros vendedores publicados cerca con las mismas opciones de servicio.";

  return (
    <section aria-labelledby="comida-local-related-heading" className={`${CL_PANEL} mt-6 px-4 py-5 sm:px-5`}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h2 id="comida-local-related-heading" className={CL_SECTION_TITLE}>
            {title}
          </h2>
          {rows.length > 0 ? (
            <p className="mt-1 text-xs text-[#1E1814]/55">{subtitle}</p>
          ) : null}
        </div>
        <Link href={browseHref} className="text-sm font-semibold text-[#7A1E2C] hover:underline">
          {en ? "Browse all local food" : "Ver toda la comida local"}
        </Link>
      </div>

      {rows.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <li key={row.id} className="min-w-0">
              <ComidaLocalListingCard card={mapComidaLocalRowToCardVm(row)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-relaxed text-[#1E1814]/70">
          {en
            ? "No related sellers published yet. Browse the full Comida Local directory to keep looking."
            : "Aún no hay vendedores relacionados publicados. Explora el directorio completo de Comida Local para seguir buscando."}
        </p>
      )}
    </section>
  );
}
