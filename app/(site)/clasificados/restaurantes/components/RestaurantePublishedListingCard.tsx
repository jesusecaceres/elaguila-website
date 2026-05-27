"use client";

import Link from "next/link";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import {
  buildRestaurantesResultsHref,
  restaurantesDiscoveryParamsForRowDeepLink,
  type RestaurantesDiscoveryLang,
} from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import { getRestaurantesPublicMonetizationBadges } from "@/app/clasificados/restaurantes/lib/restaurantesDestacados";
import { RestaurantePreviewCard } from "@/app/clasificados/restaurantes/shell/RestaurantePreviewCard";

const ACCENT = "#D4A574";

/**
 * Public restaurant row: same horizontal `RestaurantePreviewCard` contract as
 * `/clasificados/restaurantes/resultados` (image left, content right on desktop).
 */
export function RestaurantePublishedListingCard({
  row,
  lang,
  badge,
  cta,
  narrowLabel,
}: {
  row: RestaurantesPublicBlueprintRow;
  lang: RestaurantesDiscoveryLang | Lang;
  badge?: string;
  cta: string;
  narrowLabel: string;
}) {
  const narrowHref = buildRestaurantesResultsHref(lang as RestaurantesDiscoveryLang, {
    ...restaurantesDiscoveryParamsForRowDeepLink({
      name: row.name,
      city: row.city,
      zip: row.zip,
      primaryCuisineKey: row.primaryCuisineKey,
      neighborhood: row.neighborhood,
    }),
  });
  const slug = row.slug?.trim();
  const primaryHref = slug
    ? appendLangToPath(`/clasificados/restaurantes/${encodeURIComponent(slug)}`, lang as Lang)
    : "";

  const shell = row.previewShellData;
  const monetizationBadges = getRestaurantesPublicMonetizationBadges(row, lang as "es" | "en").slice(0, 3);
  const displayBadge = badge ?? monetizationBadges.find((b) => b.key === "patrocinado" || b.key === "destacado")?.label;

  if (!shell) {
    return (
      <article className="rounded-[20px] border border-dashed border-amber-500/50 bg-amber-50/40 p-4 text-sm text-amber-950">
        <p className="font-semibold">{row.name}</p>
        <p className="mt-1 text-xs opacity-80">
          {lang === "es"
            ? "Este listado no tiene datos de ficha para la vista aprobada."
            : "This listing has no approved card shell data."}
        </p>
        {primaryHref ? (
          <Link href={primaryHref} className="mt-3 inline-flex min-h-[44px] items-center font-semibold text-amber-900 underline">
            {cta}
          </Link>
        ) : null}
      </article>
    );
  }

  return (
    <article className="relative min-w-0 w-full max-w-none">
      {monetizationBadges.length > 0 ? (
        <div className="pointer-events-none absolute left-5 top-5 z-20 flex max-w-[calc(100%-2.5rem)] flex-wrap gap-1">
          {monetizationBadges.map((b) => (
            <span
              key={b.key}
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-[#FFFCF7] shadow-sm ${
                b.key === "destacado" || b.key === "patrocinado"
                  ? ""
                  : b.key === "verificado_leonix"
                    ? "border border-sky-400/80 bg-sky-50/95 text-sky-950"
                    : "bg-[#1a3352]/90"
              }`}
              style={
                b.key === "destacado" || b.key === "patrocinado"
                  ? { background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }
                  : undefined
              }
            >
              {b.label}
            </span>
          ))}
        </div>
      ) : displayBadge ? (
        <span
          className="pointer-events-none absolute left-5 top-5 z-20 rounded-full px-3 py-1 text-[11px] font-bold text-[#FFFCF7] shadow-sm"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
        >
          {displayBadge}
        </span>
      ) : null}
      <RestaurantePreviewCard
        data={shell}
        lang={lang}
        presentation="public_discovery"
        likesCount={row.likesCount}
        publicDetailHref={primaryHref || undefined}
        publicDetailLabel={cta}
        discoveryRefineHref={slug ? narrowHref : undefined}
        discoveryRefineLabel={slug ? narrowLabel : undefined}
        className={displayBadge || monetizationBadges.length || row.promoted ? "pt-9" : ""}
      />
    </article>
  );
}
