"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Lang = "es" | "en";

type EnVentaFilters = {
  minPrice: string;
  maxPrice: string;
  condition: string;
  itemType: string;
};

const DEFAULT_FILTERS: EnVentaFilters = {
  minPrice: "",
  maxPrice: "",
  condition: "",
  itemType: "",
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

function buildParams(f: EnVentaFilters) {
  const p = new URLSearchParams();
  if (f.minPrice) p.set("pmin", f.minPrice);
  if (f.maxPrice) p.set("pmax", f.maxPrice);
  if (f.condition) p.set("cond", f.condition);
  if (f.itemType.trim()) p.set("itype", f.itemType.trim());
  return p;
}

export default function Page() {
  const sp = useSearchParams(); // Next 15: possibly null
  const router = useRouter();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const [filters, setFilters] = useState<EnVentaFilters>(DEFAULT_FILTERS);

  const t = {
    es: {
      title: "En Venta",
      subtitle: "Compra y vende cosas. Filtra por precio, condición y tipo de artículo.",
      view: "Ver resultados",
      exploreAll: "Explorar todas las categorías",
      reset: "Restablecer",
      quick: "Filtros rápidos",
      min: "Precio mín. ($)",
      max: "Precio máx. ($)",
      condition: "Condición",
      type: "Tipo de artículo",
      any: "Cualquiera",
    },
    en: {
      title: "For Sale",
      subtitle: "Buy and sell items. Filter by price, condition, and item type.",
      view: "See results",
      exploreAll: "Explore all categories",
      reset: "Reset",
      quick: "Quick filters",
      min: "Min price ($)",
      max: "Max price ($)",
      condition: "Condition",
      type: "Item type",
      any: "Any",
    },
  }[lang];

  const goToListaHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("cat", "en-venta");
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
          <div>
            <Label>{t.min}</Label>
            <Input value={filters.minPrice} onChange={(v) => setFilters((p) => ({ ...p, minPrice: v }))} placeholder="0" inputMode="numeric" />
          </div>
          <div>
            <Label>{t.max}</Label>
            <Input value={filters.maxPrice} onChange={(v) => setFilters((p) => ({ ...p, maxPrice: v }))} placeholder="500" inputMode="numeric" />
          </div>

          <div>
            <Label>{t.condition}</Label>
            <Select value={filters.condition} onChange={(v) => setFilters((p) => ({ ...p, condition: v }))}>
              <option value="">{t.any}</option>
              <option value="new">{lang === "es" ? "Nuevo" : "New"}</option>
              <option value="like-new">{lang === "es" ? "Como nuevo" : "Like new"}</option>
              <option value="good">{lang === "es" ? "Buen estado" : "Good"}</option>
              <option value="fair">{lang === "es" ? "Usado" : "Fair"}</option>
              <option value="parts">{lang === "es" ? "Para partes" : "For parts"}</option>
            </Select>
          </div>

          <div>
            <Label>{t.type}</Label>
            <Input
              value={filters.itemType}
              onChange={(v) => setFilters((p) => ({ ...p, itemType: v }))}
              placeholder={lang === "es" ? "Ej: muebles, electrónicos…" : "e.g. furniture, electronics…"}
            />
          </div>
        </div>

        <div className="mt-3 text-[11px] text-gray-400">
          {lang === "es"
            ? "Tip: si un anuncio no tiene precio o condición todavía, no se oculta por esos filtros."
            : "Tip: if a listing doesn’t have price/condition yet, it won’t be hidden by those filters."}
        </div>
      </div>
    </div>
  );
}
