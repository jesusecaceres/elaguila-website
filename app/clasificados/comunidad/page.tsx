"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Lang = "es" | "en";

type ComunidadFilters = {
  ctype: string;
};

const DEFAULT_FILTERS: ComunidadFilters = {
  ctype: "",
};

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-300">{children}</label>;
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
    >
      {children}
    </select>
  );
}

function buildParams(f: ComunidadFilters) {
  const p = new URLSearchParams();
  if (f.ctype) p.set("ctype", f.ctype);
  return p;
}

export default function Page() {
  const sp = useSearchParams(); // Next 15: possibly null
  const router = useRouter();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const [filters, setFilters] = useState<ComunidadFilters>(DEFAULT_FILTERS);

  const t = {
    es: {
      title: "Comunidad",
      subtitle:
        "Anuncios comunitarios, actividades, voluntariado y más. Ligero, familiar y accesible.",
      view: "Ver resultados",
      exploreAll: "Explorar todas las categorías",
      reset: "Restablecer",
      quick: "Filtros",
      type: "Tipo",
      any: "Cualquiera",
    },
    en: {
      title: "Community",
      subtitle:
        "Community posts, activities, volunteering and more. Lightweight, family-friendly and accessible.",
      view: "See results",
      exploreAll: "Explore all categories",
      reset: "Reset",
      quick: "Filters",
      type: "Type",
      any: "Any",
    },
  }[lang];

  const goToListaHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("cat", "comunidad");
    params.set("lang", lang);

    const keep = ["q", "city", "zip", "r", "sort", "view"];
    for (const k of keep) {
      const v = sp?.get(k);
      if (v) params.set(k, v);
    }

    const extra = buildParams(filters);
    extra.forEach((v, k) => params.set(k, v));

    return `/clasificados/lista?${params.toString()}`;
  }, [filters, lang, sp]);

  const hasAnyFilter = useMemo(() => JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS), [filters]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-20 md:pt-24 pb-14">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-yellow-300">{t.title}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-300">{t.subtitle}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => router.push(goToListaHref)}
            className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            {t.view}
          </button>

          <a
            href={`/clasificados?lang=${lang}`}
            className="rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold text-white hover:bg-black/60"
          >
            {t.exploreAll}
          </a>

          {hasAnyFilter ? (
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-xs font-semibold text-gray-300 underline underline-offset-4 hover:text-white"
            >
              {t.reset}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-7 rounded-2xl border border-white/10 bg-black/50 p-4">
        <div className="text-sm font-semibold text-yellow-200">{t.quick}</div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <div>
            <Label>{t.type}</Label>
            <Select value={filters.ctype} onChange={(v) => setFilters({ ctype: v })}>
              <option value="">{t.any}</option>
              <option value="announcement">{lang === "es" ? "Anuncio" : "Announcement"}</option>
              <option value="meetup">{lang === "es" ? "Reunión" : "Meetup"}</option>
              <option value="volunteer">{lang === "es" ? "Voluntariado" : "Volunteer"}</option>
              <option value="community-event">{lang === "es" ? "Actividad" : "Activity"}</option>
              <option value="lost-found">{lang === "es" ? "Perdido y encontrado" : "Lost & found"}</option>
            </Select>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-gray-400">
          {lang === "es"
            ? "Este espacio es comunitario. Mantén el anuncio claro y familiar."
            : "This is a community space. Keep posts clear and family-friendly."}
        </div>
      </div>
    </div>
  );
}
