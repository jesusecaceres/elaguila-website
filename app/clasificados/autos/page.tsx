"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Lang = "es" | "en";

type AutosFilters = {
  minPrice: string;
  maxPrice: string;
  yearMin: string;
  yearMax: string;
  make: string;
  model: string;
};

const DEFAULT_AUTOS_FILTERS: AutosFilters = {
  minPrice: "",
  maxPrice: "",
  yearMin: "",
  yearMax: "",
  make: "",
  model: "",
};

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-300">{children}</label>;
}

function Input({
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500"
    />
  );
}

function buildAutosParams(f: AutosFilters) {
  const p = new URLSearchParams();

  if (f.minPrice) p.set("apmin", f.minPrice);
  if (f.maxPrice) p.set("apmax", f.maxPrice);

  if (f.yearMin) p.set("aymin", f.yearMin);
  if (f.yearMax) p.set("aymax", f.yearMax);

  if (f.make.trim()) p.set("amake", f.make.trim());
  if (f.model.trim()) p.set("amodel", f.model.trim());

  return p;
}

export default function Page() {
  const sp = useSearchParams(); // Next 15: possibly null
  const router = useRouter();

  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const [filters, setFilters] = useState<AutosFilters>(DEFAULT_AUTOS_FILTERS);

  const t = {
    es: {
      title: "Autos",
      subtitle:
        "Encuentra tu próximo auto. Usa filtros rápidos (precio, año, marca, modelo) y luego refina en resultados.",
      view: "Ver autos disponibles",
      exploreAll: "Explorar todas las categorías",
      reset: "Restablecer",
      price: "Precio",
      min: "Mín",
      max: "Máx",
      year: "Año",
      make: "Marca",
      model: "Modelo",
      hint: "Ej: Toyota, Honda, Chevrolet…",
      more: "Más filtros (pronto)",
    },
    en: {
      title: "Autos",
      subtitle:
        "Find your next car. Use quick filters (price, year, make, model) then refine in results.",
      view: "Browse cars",
      exploreAll: "Explore all categories",
      reset: "Reset",
      price: "Price",
      min: "Min",
      max: "Max",
      year: "Year",
      make: "Make",
      model: "Model",
      hint: "e.g. Toyota, Honda, Chevrolet…",
      more: "More filters (soon)",
    },
  }[lang];

  const goToListaHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("cat", "autos");
    params.set("lang", lang);

    // preserve any existing global params the user may already have
    const keep = ["q", "city", "zip", "r", "sort", "view"];
    for (const k of keep) {
      const v = sp?.get(k);
      if (v) params.set(k, v);
    }

    const autosParams = buildAutosParams(filters);
    autosParams.forEach((v, k) => params.set(k, v));

    return `/clasificados/lista?${params.toString()}`;
  }, [filters, lang, sp]);

  const hasAnyFilter = useMemo(() => {
    return Object.values(filters).some((v) => String(v ?? "").trim().length > 0);
  }, [filters]);

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
              onClick={() => setFilters(DEFAULT_AUTOS_FILTERS)}
              className="text-xs font-semibold text-gray-300 underline underline-offset-4 hover:text-white"
            >
              {t.reset}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-black/45 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-yellow-200">
            {lang === "es" ? "Filtros rápidos" : "Quick filters"}
          </div>
          <button
            type="button"
            disabled
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-gray-300 opacity-60"
            title={lang === "es" ? "Próximamente" : "Coming soon"}
          >
            {t.more}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <Label>
              {t.price} {t.min} ($)
            </Label>
            <Input
              value={filters.minPrice}
              onChange={(v) => setFilters((p) => ({ ...p, minPrice: v }))}
              placeholder="0"
              inputMode="numeric"
            />
          </div>
          <div>
            <Label>
              {t.price} {t.max} ($)
            </Label>
            <Input
              value={filters.maxPrice}
              onChange={(v) => setFilters((p) => ({ ...p, maxPrice: v }))}
              placeholder="50000"
              inputMode="numeric"
            />
          </div>

          <div>
            <Label>
              {t.year} {t.min}
            </Label>
            <Input
              value={filters.yearMin}
              onChange={(v) => setFilters((p) => ({ ...p, yearMin: v }))}
              placeholder="2005"
              inputMode="numeric"
            />
          </div>
          <div>
            <Label>
              {t.year} {t.max}
            </Label>
            <Input
              value={filters.yearMax}
              onChange={(v) => setFilters((p) => ({ ...p, yearMax: v }))}
              placeholder="2025"
              inputMode="numeric"
            />
          </div>

          <div className="col-span-2">
            <Label>{t.make}</Label>
            <Input
              value={filters.make}
              onChange={(v) => setFilters((p) => ({ ...p, make: v }))}
              placeholder={t.hint}
            />
          </div>

          <div className="col-span-2">
            <Label>{t.model}</Label>
            <Input
              value={filters.model}
              onChange={(v) => setFilters((p) => ({ ...p, model: v }))}
              placeholder="Camry, Civic, Silverado…"
            />
          </div>
        </div>

        <div className="mt-3 text-[11px] text-gray-400">
          {lang === "es"
            ? "Nota: si un anuncio no tiene año/marca/modelo aún, no se oculta por esos filtros."
            : "Note: if a listing doesn’t have year/make/model yet, it won’t be hidden by those filters."}
        </div>
      </div>
    </div>
  );
}
