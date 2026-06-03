import Link from "next/link";
import {
  getRestaurantesPublicMonetizationBadges,
  restaurantesListingDetailHref,
  type RestaurantesDestacadoDisplayMode,
} from "../lib/restaurantesDestacados";
import type { RestaurantesPublicBlueprintRow } from "../data/restaurantesPublicBlueprintData";
import { RestaurantePreviewCard } from "../shell/RestaurantePreviewCard";

export function RestaurantesDestacadoCard({
  row,
  lang,
  displayMode,
}: {
  row: RestaurantesPublicBlueprintRow;
  lang: "es" | "en";
  displayMode: RestaurantesDestacadoDisplayMode;
}) {
  const href = restaurantesListingDetailHref(row, lang);
  const badges = getRestaurantesPublicMonetizationBadges(row, lang).slice(0, 4);
  const isHero = displayMode === "hero";
  const shell = row.previewShellData;

  if (!shell) {
    return (
      <article className={`rounded-2xl border border-[#D4A574]/35 bg-[#FFFCF7] p-5 ${isHero ? "mx-auto max-w-2xl" : ""}`}>
        <p className="font-bold text-[#142a42]">{row.name}</p>
        <Link href={href} className="mt-3 inline-flex text-sm font-semibold text-[#3B66AD] underline">
          {lang === "en" ? "View restaurant" : "Ver restaurante"}
        </Link>
      </article>
    );
  }

  return (
    <article className={`relative min-w-0 ${isHero ? "mx-auto max-w-3xl" : ""}`}>
      {badges.length > 0 ? (
        <div className="pointer-events-none absolute left-4 top-4 z-20 flex max-w-[calc(100%-2rem)] flex-wrap gap-1">
          {badges.map((b) => (
            <span
              key={b.key}
              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow-sm md:text-[10px] ${
                b.key === "destacado" || b.key === "patrocinado"
                  ? "bg-gradient-to-r from-[#D4AF37] to-[#9A7329] text-white"
                  : b.key === "leonix_advertiser"
                    ? "bg-[#1a3352]/90 text-white"
                    : b.key === "verificado_leonix"
                      ? "bg-emerald-700/90 text-white"
                      : "bg-white/95 text-[#5a4630]"
              }`}
            >
              {b.label}
            </span>
          ))}
        </div>
      ) : null}
      <RestaurantePreviewCard
        data={shell}
        lang={lang}
        presentation="public_discovery"
        likesCount={row.likesCount}
        publicDetailHref={href}
        publicDetailLabel={lang === "en" ? "View restaurant" : "Ver restaurante"}
        listingSourceId={row.id}
        listingSlug={row.slug}
        leonixAdId={row.leonixAdId}
        className={badges.length ? "pt-9" : ""}
      />
    </article>
  );
}
