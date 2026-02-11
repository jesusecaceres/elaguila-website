"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Lang = "es" | "en";

type ServiciosFilters = {
  serviceType: string;
  onsite: string;
  pricing: string;
  availability: string;
};

const DEFAULT_FILTERS: ServiciosFilters = {
  serviceType: "",
  onsite: "",
  pricing: "",
  availability: "",
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
      className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500"
    />
  );
}

function buildParams(f: ServiciosFilters) {
  const p = new URLSearchParams();
  if (f.serviceType.trim()) p.set("stype", f.serviceType.trim());
  if (f.availability) p.set("savail", f.availability);
  if (f.pricing) p.set("spricing", f.pricing);
  if (f.onsite) p.set("sonsite", f.onsite);
  return p;
}

export default function Page() {
  const sp = useSearchParams(); // Next 15: possibly null
  const router = useRouter();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const [filters, setFilters] = useState<ServiciosFilters>(DEFAULT_FILTERS);

  const t = {
    es: {
      title: "Servicios",
      subtitle:
        "Encuentra profesionales y servicios locales. Filtros simples para ayudarte a contactar más rápido.",
      view: "Ver resultados",
      exploreAll: "Explorar todas las categorías",
      reset: "Restablecer",
      quick: "Filtros rápidos",
      stype: "Tipo de servicio",
      onsite: "Modalidad",
      pricing: "Precio",
      availability: "Disponibilidad",
      any: "Cualquiera",
    },
    en: {
      title: "Services",
      subtitle:
        "Find local pros and services. Simple filters to help you contact faster.",
      view: "See results",
      exploreAll: "Explore all categories",
      reset: "Reset",
      quick: "Quick filters",
      stype: "Service type",
      onsite: "Mode",
      pricing: "Pricing",
      availability: "Availability",
      any: "Any",
    },
  }[lang];

  const goToListaHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("cat", "servicios");
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

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>{t.stype}</Label>
            <Input
              value={filters.serviceType}
              onChange={(v) => setFilters((p) => ({ ...p, serviceType: v }))}
              placeholder={lang === "es" ? "Ej: plomería, limpieza, jardinería…" : "e.g. plumbing, cleaning, landscaping…"}
            />
          </div>

          <div>
            <Label>{t.onsite}</Label>
            <Select value={filters.onsite} onChange={(v) => setFilters((p) => ({ ...p, onsite: v }))}>
              <option value="">{t.any}</option>
              <option value="onsite">{lang === "es" ? "A domicilio" : "On-site"}</option>
              <option value="remote">{lang === "es" ? "Remoto" : "Remote"}</option>
              <option value="either">{lang === "es" ? "Cualquiera" : "Either"}</option>
            </Select>
          </div>

          <div>
            <Label>{t.pricing}</Label>
            <Select value={filters.pricing} onChange={(v) => setFilters((p) => ({ ...p, pricing: v }))}>
              <option value="">{t.any}</option>
              <option value="free-estimate">{lang === "es" ? "Estimación gratis" : "Free estimate"}</option>
              <option value="hourly">{lang === "es" ? "Por hora" : "Hourly"}</option>
              <option value="fixed">{lang === "es" ? "Precio fijo" : "Fixed"}</option>
            </Select>
          </div>

          <div className="col-span-2">
            <Label>{t.availability}</Label>
            <Select value={filters.availability} onChange={(v) => setFilters((p) => ({ ...p, availability: v }))}>
              <option value="">{t.any}</option>
              <option value="today">{lang === "es" ? "Hoy" : "Today"}</option>
              <option value="week">{lang === "es" ? "Esta semana" : "This week"}</option>
              <option value="weekend">{lang === "es" ? "Fin de semana" : "Weekend"}</option>
            </Select>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-gray-400">
          {lang === "es"
            ? "Tip: toca el botón de llamar o email en el anuncio para cerrar más rápido."
            : "Tip: use tap-to-call or email actions in listings to close faster."}
        </div>
      </div>
    </div>
  );
}
