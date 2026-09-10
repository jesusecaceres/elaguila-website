import Link from "next/link";

import { RestaurantePublishedListingCard } from "./RestaurantePublishedListingCard";
import { mapRestaurantesPublicListingDbRowToShellInventoryRow } from "../lib/restaurantesPublicListingMapper";
import type { RestaurantesPublicListingDbRow } from "../lib/restaurantesPublicListingsServer";
import type { RestaurantesDiscoveryLang } from "../lib/restaurantesDiscoveryContract";

/**
 * Gate RESTAURANTES-2 — Related Listings rail for the Restaurantes public vitrina.
 *
 * Renders real published listings supplied by `listRelatedRestaurantesListings` using the EXISTING
 * `RestaurantePublishedListingCard` — the same card the results page renders — and the existing
 * `mapRestaurantesPublicListingDbRowToShellInventoryRow` to reach that card's own public-listing
 * shape. No new card, no new row shape.
 *
 * When nothing genuinely relates, this falls back to a real browse link into the category's own
 * results rather than rendering an empty section. It never fabricates filler listings.
 */
export function RestaurantesRelatedListingsSection({
  rows,
  matchedByCuisine,
  lang,
  browseHref,
}: {
  rows: RestaurantesPublicListingDbRow[];
  matchedByCuisine: boolean;
  lang: RestaurantesDiscoveryLang;
  /** Real results URL to fall back to / continue browsing with. */
  browseHref: string;
}) {
  const title = lang === "en" ? "Related restaurants" : "Restaurantes relacionados";
  const subtitle = matchedByCuisine
    ? lang === "en"
      ? "Other published restaurants serving similar food nearby."
      : "Otros restaurantes publicados con comida similar cerca."
    : lang === "en"
      ? "Other published restaurants of the same kind in this city."
      : "Otros restaurantes publicados del mismo tipo en esta ciudad.";
  const browseLabel = lang === "en" ? "Browse all restaurants" : "Ver todos los restaurantes";
  const cta = lang === "en" ? "See more" : "Ver más";
  const narrowLabel = lang === "en" ? "Narrow in results" : "Afinar en resultados";

  return (
    <section
      aria-labelledby="restaurantes-related-heading"
      className="mx-auto w-full max-w-[1280px] px-4 pb-8 pt-2 md:px-5 lg:px-6"
    >
      <div className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card,#FFFDF7)] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div className="min-w-0">
            <h2 id="restaurantes-related-heading" className="text-base font-bold text-[color:var(--lx-text)]">
              {title}
            </h2>
            {rows.length > 0 ? (
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{subtitle}</p>
            ) : null}
          </div>
          <Link
            href={browseHref}
            className="text-sm font-semibold text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 hover:text-[color:var(--lx-gold)]"
          >
            {browseLabel}
          </Link>
        </div>

        {rows.length > 0 ? (
          <ul className="flex w-full min-w-0 list-none flex-col gap-3 sm:gap-4">
            {rows.map((row) => (
              <li key={row.id} className="min-w-0 w-full">
                <RestaurantePublishedListingCard
                  row={mapRestaurantesPublicListingDbRowToShellInventoryRow(row)}
                  lang={lang}
                  routeLang={lang}
                  cta={cta}
                  narrowLabel={narrowLabel}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-relaxed text-[color:var(--lx-muted)]">
            {lang === "en"
              ? "No related restaurants published yet. Browse the full Restaurantes directory to keep looking."
              : "Aún no hay restaurantes relacionados publicados. Explora el directorio completo de Restaurantes para seguir buscando."}
          </p>
        )}
      </div>
    </section>
  );
}
