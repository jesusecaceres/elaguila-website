"use client";

import Link from "next/link";

type Lang = "es" | "en";

type Mode = "no-data" | "no-results";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function ResultsEmptyState({
  lang,
  mode,
  title,
  subtitle,
  onReset,
  onClearSearch,
  primaryHref,
}: {
  lang: Lang;
  mode: Mode;
  title?: string;
  subtitle?: string;
  onReset?: () => void;
  onClearSearch?: () => void;
  primaryHref?: string;
}) {
  const isEs = lang === "es";

  const defaultTitle =
    mode === "no-data"
      ? isEs
        ? "No hay anuncios todavía"
        : "No listings yet"
      : isEs
        ? "No hay resultados"
        : "No results";

  const defaultSubtitle =
    mode === "no-data"
      ? isEs
        ? "Este espacio está listo. Sé de los primeros en publicar y ayuda a que la comunidad encuentre lo que necesita."
        : "This space is ready. Be one of the first to post and help the community find what it needs."
      : isEs
        ? "Tus filtros están muy cerrados. Prueba quitar filtros, limpiar la búsqueda, o ampliar tu ubicación."
        : "Your filters are too tight. Try clearing filters, clearing search, or widening your location.";

  const hrefAll = primaryHref ?? `/clasificados/lista?lang=${lang}`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 text-center">
      <div className="rounded-2xl border border-white/12 bg-white/6 p-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-100">
          {title ?? defaultTitle}
        </h2>
        <p className="mt-4 text-gray-300">{subtitle ?? defaultSubtitle}</p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={hrefAll}
            className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/8 px-5 py-2.5 text-sm font-semibold text-gray-100 hover:bg-white/12"
          >
            {isEs ? "Ver anuncios" : "View listings"}
          </Link>

          <Link
            href={`/clasificados/publicar?lang=${lang}`}
            className="inline-flex items-center justify-center rounded-xl border border-yellow-500/45 bg-yellow-500/12 px-5 py-2.5 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/18"
          >
            {isEs ? "Publicar anuncio" : "Post a listing"}
          </Link>

          <Link
            href="/clasificados#memberships"
            className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/7"
          >
            {isEs ? "Ver membresías" : "See memberships"}
          </Link>
        </div>

        {mode === "no-results" ? (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={onReset}
              className={cx(
                "inline-flex items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-semibold",
                "border-white/12 bg-white/8 text-gray-100 hover:bg-white/12",
                !onReset && "opacity-60 cursor-not-allowed"
              )}
              disabled={!onReset}
            >
              {isEs ? "Quitar filtros" : "Clear filters"}
            </button>
            <button
              type="button"
              onClick={onClearSearch}
              className={cx(
                "inline-flex items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-semibold",
                "border-white/12 bg-white/5 text-gray-200 hover:bg-white/7",
                !onClearSearch && "opacity-60 cursor-not-allowed"
              )}
              disabled={!onClearSearch}
            >
              {isEs ? "Limpiar búsqueda" : "Clear search"}
            </button>
          </div>
        ) : null}

        <p className="mt-6 text-xs text-gray-400">
          {isEs
            ? "Consejo: fotos claras + descripción honesta ayudan a vender más rápido. Protección anti‑spam activa."
            : "Tip: clear photos + honest descriptions sell faster. Anti‑spam protection is on."}
        </p>
      </div>
    </div>
  );
}
