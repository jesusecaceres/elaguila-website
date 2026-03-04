"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

type Lang = "es" | "en";

const CATEGORY = "comunidad";

const COPY = {
  es: {
    title: "Comunidad",
    subtitle: "Eventos, avisos y anuncios de la comunidad.",
    searchPlaceholder: "Buscar: evento, ayuda, anuncio…",
    buttonView: "Ver anuncios",
    buttonPost: "Publicar anuncio",
  },
  en: {
    title: "Community",
    subtitle: "Events, notices and community announcements.",
    searchPlaceholder: "Search: event, help, notice…",
    buttonView: "View listings",
    buttonPost: "Post listing",
  },
} as const;

export default function Page() {
  const sp = useSearchParams();

  const lang = useMemo<Lang>(() => {
    const v = sp?.get("lang");
    return v === "en" ? "en" : "es";
  }, [sp]);

  const listaHref = useMemo(() => `/clasificados/lista?cat=${CATEGORY}&lang=${lang}`, [lang]);
  const postHref = useMemo(() => `/clasificados/publicar?cat=${CATEGORY}&lang=${lang}`, [lang]);

  const t = COPY[lang];

  return (
    <div className="min-h-screen bg-[#D9D9D9] text-[#111111] px-4 pt-24 pb-12">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 tracking-tight">
          {t.title}
        </h1>
        <p className="mt-2 text-[#111111] text-base">
          {t.subtitle}
        </p>

        <section className="mt-6 rounded-2xl border border-[#C9B46A]/25 bg-[#F5F5F5] shadow-sm p-4 ring-1 ring-[#C9B46A]/10">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#111111]/50 text-lg" aria-hidden="true">⌕</span>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className="w-full rounded-xl border border-[#C9B46A]/30 bg-[#F5F5F5] py-3 pl-10 pr-4 text-sm text-[#111111] outline-none placeholder:text-[#111111]/70 focus:border-[#A98C2A]/60 focus:ring-1 focus:ring-[#A98C2A]/20"
              aria-label={t.searchPlaceholder}
              readOnly
              onFocus={(e) => e.target.blur()}
            />
          </div>
          <p className="mt-2 text-xs text-[#111111]/70">
            {lang === "es" ? "Usa el botón para ver resultados con filtros." : "Use the button below to see results with filters."}
          </p>
        </section>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href={listaHref}
            className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-black hover:bg-yellow-300 transition"
          >
            {t.buttonView}
          </Link>
          <Link
            href={postHref}
            className="inline-flex items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] px-5 py-3 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition"
          >
            {t.buttonPost}
          </Link>
        </div>
      </div>
    </div>
  );
}
