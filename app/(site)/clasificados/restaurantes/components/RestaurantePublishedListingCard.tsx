"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import {
  buildRestaurantesResultsHref,
  restaurantesDiscoveryParamsForRowDeepLink,
  type RestaurantesDiscoveryLang,
} from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
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
  isSaved,
  onToggleSave,
}: {
  row: RestaurantesPublicBlueprintRow;
  lang: RestaurantesDiscoveryLang | Lang;
  badge?: string;
  cta: string;
  narrowLabel: string;
  isSaved?: boolean;
  onToggleSave?: () => void;
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

  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  const shareAbsolute = origin && primaryHref ? `${origin}${primaryHref}` : "";
  const shell = row.previewShellData;

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
      {badge ? (
        <span
          className="pointer-events-none absolute left-5 top-5 z-20 rounded-full px-3 py-1 text-[11px] font-bold text-[#FFFCF7] shadow-sm"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
        >
          {badge}
        </span>
      ) : row.promoted ? (
        <span
          className="pointer-events-none absolute left-5 top-5 z-20 rounded-full px-3 py-1 text-[11px] font-bold text-[#FFFCF7] shadow-sm"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
        >
          {lang === "es" ? "Patrocinado" : "Sponsored"}
        </span>
      ) : null}
      {row.leonixVerified ? (
        <span className="pointer-events-none absolute right-5 top-5 z-20 rounded-full border border-sky-400/80 bg-sky-50/95 px-2 py-0.5 text-[10px] font-bold text-sky-950 shadow-sm backdrop-blur-sm">
          {lang === "es" ? "Verificado" : "Verified"}
        </span>
      ) : null}
      <RestaurantePreviewCard
        data={shell}
        listingId={row.id}
        lang={lang}
        showEngagementMetrics
        analyticsOwnerUserId={row.ownerUserId}
        shareListingAbsoluteUrl={shareAbsolute}
        publicDetailHref={primaryHref || undefined}
        publicDetailLabel={cta}
        discoveryRefineHref={slug ? narrowHref : undefined}
        discoveryRefineLabel={slug ? narrowLabel : undefined}
        resultsSaved={onToggleSave ? isSaved : undefined}
        onResultsSavedToggle={onToggleSave}
        className={badge || row.promoted || row.leonixVerified ? "pt-9" : ""}
      />
    </article>
  );
}
