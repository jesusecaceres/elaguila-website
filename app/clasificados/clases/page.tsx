"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Lang = "es" | "en";

type ClasesFilters = {
  subject: string;
  level: string;
  mode: string;
};

const DEFAULT_FILTERS: ClasesFilters = {
  subject: "",
  level: "",
  mode: "",
};

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-300">{children}</label>;
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500"
    />
  );
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
      className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
    >
      {children}
    </select>
  );
}

function buildParams(f: ClasesFilters) {
  const p = new URLSearchParams();
  if (f.subject.trim()) p.set("csubject", f.subject.trim());
  if (f.level) p.set("clevel", f.level);
  if (f.mode) p.set("cmode", f.mode);
  return p;
}

export default function Page() {
  const sp = useSearchParams(); // Next 15: possibly null
  const router = useRouter();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const [filters, setFilters] = useState<ClasesFilters>(DEFAULT_FILTERS);

  const t = {
    es: {
      title: "Clases",
      subtitle:
        "Aprende algo nuevo. Clases y talleres (en línea o en persona).",
      view: "Ver resultados",
      exploreAll: "Explorar todas las categorías",
      reset: "Restablecer",
      quick: "Filtros rápidos",
      subject: "Tema",
      level: "Nivel",
      mode: "Modalidad",
      any: "Cualquiera",
    },
    en: {
      title: "Classes",
      subtitle:
        "Learn something new. Classes and workshops (online or in person).",
      view: "See results",
      exploreAll: "Explore all categories",
      reset: "Reset",
      quick: "Quick filters",
      subject: "Subject",
      level: "Level",
      mode: "Mode",
      any: "Any",
    },
  }[lang];

  const goToListaHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("cat", "clases");
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
    <div className="mx-auto max-w-5xl px-6 pt-24 pb-14">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-yellow-300">{t.title}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-300">{t.subtitle}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => router.push(goToListaHref)}
            className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            {t.view}
          </button>

          <a
            href={`/clasificados?lang=${lang}`}
            className="rounded-full border border-white/15 bg-black/40 px-5 py-2 text-sm font-semibold text-white hover:bg-black/60"
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

      <div className="mt-8 rounded-2xl border border-white/10 bg-black/45 p-4">
        <div className="text-sm font-semibold text-yellow-200">{t.quick}</div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>{t.subject}</Label>
            <Input
              value={filters.subject}
              onChange={(v) => setFilters((p) => ({ ...p, subject: v }))}
              placeholder={lang === "es" ? "Ej: inglés, guitarra, computación…" : "e.g. English, guitar, coding…"}
            />
          </div>

          <div>
            <Label>{t.level}</Label>
            <Select value={filters.level} onChange={(v) => setFilters((p) => ({ ...p, level: v }))}>
              <option value="">{t.any}</option>
              <option value="beginner">{lang === "es" ? "Principiante" : "Beginner"}</option>
              <option value="intermediate">{lang === "es" ? "Intermedio" : "Intermediate"}</option>
              <option value="advanced">{lang === "es" ? "Avanzado" : "Advanced"}</option>
              <option value="kids">{lang === "es" ? "Niños" : "Kids"}</option>
            </Select>
          </div>

          <div>
            <Label>{t.mode}</Label>
            <Select value={filters.mode} onChange={(v) => setFilters((p) => ({ ...p, mode: v }))}>
              <option value="">{t.any}</option>
              <option value="in-person">{lang === "es" ? "En persona" : "In-person"}</option>
              <option value="online">{lang === "es" ? "En línea" : "Online"}</option>
              <option value="either">{lang === "es" ? "Cualquiera" : "Either"}</option>
            </Select>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-gray-400">
          {lang === "es"
            ? "Clases y Comunidad pueden ser gratis cuando sirven a familias. Publica con claridad para que te encuentren."
            : "Classes and Community can be free when serving families. Post clearly so people can find you."}
        </div>
      </div>
    </div>
  );
}
