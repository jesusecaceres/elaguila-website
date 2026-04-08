"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { labelForCuisine } from "@/app/clasificados/restaurantes/application/restauranteTaxonomy";
import type { RestaurantePublicResultsRow } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import { isFavoriteRestaurant, toggleFavoriteRestaurant } from "@/app/clasificados/restaurantes/shared/utils/restaurantR3Storage";

type Lang = "es" | "en";

function favKey(id: string) {
  return `rpub:${id}`;
}

function lab(lang: Lang, es: string, en: string) {
  return lang === "es" ? es : en;
}

function TeaserCard({ row, lang }: { row: RestaurantePublicResultsRow; lang: Lang }) {
  const [fav, setFav] = useState(false);
  const key = favKey(row.id);

  useEffect(() => {
    setFav(isFavoriteRestaurant(key));
  }, [key]);

  const href = `/clasificados/restaurantes/${encodeURIComponent(row.slug)}`;
  const cuisineLine = [
    row.primaryCuisineKey ? labelForCuisine(row.primaryCuisineKey) : null,
    row.secondaryCuisineKey ? labelForCuisine(row.secondaryCuisineKey) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-2xl border border-yellow-500/25 bg-white/9 p-5 text-left shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Link href={href} className="min-w-0 flex-1">
          <div className="relative mb-3 aspect-[16/10] w-full overflow-hidden rounded-xl bg-black/20">
            {row.heroImageUrl ? (
              <Image
                src={row.heroImageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 50vw"
                unoptimized={row.heroImageUrl.startsWith("data:")}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#2a2620] to-[#4a4034]" aria-hidden />
            )}
            {row.sponsored ? (
              <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {lab(lang, "Destacado", "Featured")}
              </span>
            ) : null}
            {row.leonixVerified ? (
              <span className="absolute right-2 top-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                {lab(lang, "Leonix", "Leonix")}
              </span>
            ) : null}
          </div>
          <h3 className="text-lg font-semibold text-white hover:underline">{row.businessName}</h3>
          <p className="mt-1 text-sm text-white/85">{cuisineLine || row.cityCanonical}</p>
          <p className="mt-1 text-xs text-white/60">{row.cityCanonical}</p>
          {row.summaryShort ? (
            <p className="mt-2 line-clamp-2 text-sm text-white/75">{row.summaryShort}</p>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={() => setFav(toggleFavoriteRestaurant(key))}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/7 text-sm text-white hover:bg-white/10 transition"
          aria-label={fav ? lab(lang, "Quitar de guardados", "Remove from saved") : lab(lang, "Guardar", "Save")}
        >
          <span aria-hidden>{fav ? "★" : "☆"}</span>
        </button>
      </div>
      <div className="mt-4">
        <Link
          href={href}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-yellow-500/45 bg-yellow-500/15 px-4 py-2.5 text-sm font-semibold text-yellow-100 hover:bg-yellow-500/25 transition"
        >
          {lab(lang, "Ver anuncio", "View listing")}
        </Link>
      </div>
    </div>
  );
}

export function RestauranteLandingPublishedTeasers({
  lang,
  promoted,
  recent,
  totalPublished,
}: {
  lang: Lang;
  promoted: RestaurantePublicResultsRow[];
  recent: RestaurantePublicResultsRow[];
  totalPublished: number;
}) {
  const hasAny = promoted.length > 0 || recent.length > 0;

  if (!hasAny) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Placeholder lang={lang} />
        <Placeholder lang={lang} />
        <Placeholder lang={lang} />
        <Placeholder lang={lang} />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {totalPublished > 0 ? (
        <p className="text-sm text-[#111111]/80">
          {lab(lang, `${totalPublished} restaurante(s) publicado(s) en Leonix.`, `${totalPublished} published restaurant(s) on Leonix.`)}
        </p>
      ) : null}
      {promoted.length > 0 ? (
        <section aria-label={lab(lang, "Destacados", "Featured")}>
          <h3 className="text-lg font-bold text-yellow-300">{lab(lang, "Destacados", "Featured")}</h3>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            {promoted.map((r) => (
              <TeaserCard key={r.id} row={r} lang={lang} />
            ))}
          </div>
        </section>
      ) : null}
      {recent.length > 0 ? (
        <section aria-label={lab(lang, "Recientes", "Recent")}>
          <h3 className="text-lg font-bold text-yellow-300">{lab(lang, "Recién publicados", "Recently published")}</h3>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            {recent.map((r) => (
              <TeaserCard key={r.id} row={r} lang={lang} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Placeholder({ lang }: { lang: Lang }) {
  return (
    <div className="rounded-2xl border border-yellow-400/15 bg-black/30 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 w-48 rounded bg-white/10" />
        <div className="h-6 w-20 rounded-full border border-black/10 bg-[#F5F5F5]" />
      </div>
      <div className="mt-3 h-3 w-36 rounded bg-white/10" />
      <div className="mt-2 h-3 w-52 rounded bg-[#F5F5F5]" />

      <div className="mt-6 grid grid-cols-2 gap-2">
        <div className="h-9 rounded-xl border border-black/10 bg-[#F5F5F5]" />
        <div className="h-9 rounded-xl border border-black/10 bg-[#F5F5F5]" />
        <div className="h-9 rounded-xl border border-black/10 bg-[#F5F5F5]" />
        <div className="h-9 rounded-xl border border-black/10 bg-[#F5F5F5]" />
      </div>

      <div className="mt-6 h-3 w-44 rounded bg-white/10" />
      <div className="mt-2 h-3 w-40 rounded bg-[#F5F5F5]" />

      <div className="mt-6 rounded-xl border border-black/10 bg-[#F5F5F5] p-4">
        <div className="text-sm font-semibold text-[#111111]">
          {lang === "es" ? "Tu negocio puede estar aquí" : "Your business can be here"}
        </div>
        <div className="mt-2 h-3 w-52 rounded bg-white/10" />
      </div>
    </div>
  );
}
