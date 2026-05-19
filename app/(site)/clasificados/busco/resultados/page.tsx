"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { BuscoShellLayout } from "../shared/BuscoShellLayout";
import { buscoLangFromSearchParams, buscoPathWithLang } from "../shared/buscoShellCopy";

const COPY = {
  es: {
    pageTitle: "Solicitudes publicadas",
    emptyTitle: "Aún no hay solicitudes para mostrar",
    emptyBody:
      "El listado y los filtros se activarán en la siguiente fase. Por ahora puedes publicar una solicitud cuando el formulario esté listo.",
    searchPlaceholder: "Buscar por título o descripción",
    typePlaceholder: "Tipo de búsqueda (próximamente)",
    cityPlaceholder: "Ciudad o zona (próximamente)",
    ctaPost: "Publicar solicitud",
    backLanding: "Volver a Busco / Se busca",
    filterNote: "Filtros de ejemplo — sin conexión a datos todavía.",
  },
  en: {
    pageTitle: "Published requests",
    emptyTitle: "No requests to show yet",
    emptyBody:
      "Listing and filters will go live in the next phase. For now you can post a request once the form is ready.",
    searchPlaceholder: "Search by title or description",
    typePlaceholder: "Request type (coming soon)",
    cityPlaceholder: "City or zone (coming soon)",
    ctaPost: "Post request",
    backLanding: "Back to Looking for / Wanted",
    filterNote: "Sample filters — not connected to data yet.",
  },
} as const;

function BuscoResultadosContent() {
  const sp = useSearchParams();
  const lang = buscoLangFromSearchParams(sp);
  const t = COPY[lang];
  const postHref = buscoPathWithLang("/publicar/busco/quick", lang);
  const landingHref = buscoPathWithLang("/clasificados/busco", lang);

  return (
    <BuscoShellLayout lang={lang} backHref={landingHref} backLabel={t.backLanding}>
      <div className="space-y-5">
        <h2 className="text-lg font-bold text-[#1E1810]">{t.pageTitle}</h2>

        <form
          className="space-y-3 rounded-2xl border border-[#B8C8EA]/30 bg-[#FFFCF7] p-4"
          action="/clasificados/busco/resultados"
          method="get"
          aria-label={lang === "es" ? "Filtros de solicitudes" : "Request filters"}
        >
          <input type="hidden" name="lang" value={lang} />
          <label className="block">
            <span className="sr-only">{t.searchPlaceholder}</span>
            <input
              type="search"
              name="q"
              placeholder={t.searchPlaceholder}
              disabled
              className="min-h-[44px] w-full rounded-xl border border-[#B8C8EA]/35 bg-white/80 px-3 text-sm text-[#111111] opacity-70"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              name="tipo"
              placeholder={t.typePlaceholder}
              disabled
              className="min-h-[44px] w-full rounded-xl border border-[#B8C8EA]/35 bg-white/80 px-3 text-sm opacity-70"
            />
            <input
              type="text"
              name="city"
              placeholder={t.cityPlaceholder}
              disabled
              className="min-h-[44px] w-full rounded-xl border border-[#B8C8EA]/35 bg-white/80 px-3 text-sm opacity-70"
            />
          </div>
          <p className="text-[11px] text-[#5C5346]/80">{t.filterNote}</p>
        </form>

        <section
          className="rounded-2xl border border-dashed border-[#B8C8EA]/45 bg-[#F8FAFF]/90 px-4 py-10 text-center"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-[#1E1810]">{t.emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#5C5346]/90">{t.emptyBody}</p>
          <Link
            href={postHref}
            className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-[#F5F5F5] transition hover:opacity-95"
          >
            {t.ctaPost}
          </Link>
        </section>
      </div>
    </BuscoShellLayout>
  );
}

export default function BuscoResultadosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4EFE6] pt-28 text-center text-sm text-[#5C564E]">…</div>
      }
    >
      <BuscoResultadosContent />
    </Suspense>
  );
}

