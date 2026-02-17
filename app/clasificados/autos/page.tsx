"use client";

import Image from "next/image";
import type React from "react";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import newLogo from "../../../public/logo.png";

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
      className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500"
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

function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-3xl border border-white/10 bg-[#0B0B0B] p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-bold text-white">{title}</div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/10"
          >
            ✕
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

export default function Page() {
  const sp = useSearchParams(); // Next 15: possibly null
  const router = useRouter();

  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const [filters, setFilters] = useState<AutosFilters>(DEFAULT_AUTOS_FILTERS);
  const [moreOpen, setMoreOpen] = useState(false);

  const t = {
    es: {
      title: "Autos",
      subtitle: "Encuentra tu próximo auto. Filtros rápidos arriba; filtros profundos en el panel lateral.",
      view: "Ver autos disponibles",
      exploreAll: "Explorar todas las categorías",
      reset: "Restablecer",
      quick: "Filtros rápidos",
      more: "Más filtros",
      sidebar: "Filtros",
      price: "Precio",
      min: "Mín",
      max: "Máx",
      year: "Año",
      make: "Marca",
      model: "Modelo",
      hintMake: "Ej: Toyota, Honda, Chevrolet…",
      hintModel: "Camry, Civic, Silverado…",
      note:
        "Nota: si un anuncio aún no tiene año/marca/modelo, no se oculta por esos filtros.",
    },
    en: {
      title: "Autos",
      subtitle: "Find your next car. Quick filters on top; deeper filters in the side panel.",
      view: "Browse cars",
      exploreAll: "Explore all categories",
      reset: "Reset",
      quick: "Quick filters",
      more: "More filters",
      sidebar: "Filters",
      price: "Price",
      min: "Min",
      max: "Max",
      year: "Year",
      make: "Make",
      model: "Model",
      hintMake: "e.g. Toyota, Honda, Chevrolet…",
      hintModel: "Camry, Civic, Silverado…",
      note: "Note: if a listing doesn’t have year/make/model yet, it won’t be hidden by those filters.",
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

  const SidebarContent = (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
      <div className="text-sm font-semibold text-yellow-200">{t.sidebar}</div>

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
            placeholder={t.hintMake}
          />
        </div>

        <div className="col-span-2">
          <Label>{t.model}</Label>
          <Input
            value={filters.model}
            onChange={(v) => setFilters((p) => ({ ...p, model: v }))}
            placeholder={t.hintModel}
          />
        </div>
      </div>

      <div className="mt-3 text-[11px] text-gray-400">{t.note}</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-20 pb-10">
          <div className="flex flex-col items-center text-center">
            <Image
              src={newLogo}
              alt="LEONIX"
              width={92}
              height={92}
              className="h-20 w-20 sm:h-24 sm:w-24"
              priority
            />
            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#d4af37]">
              {t.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/80">{t.subtitle}</p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => router.push(goToListaHref)}
                className="rounded-xl bg-[#d4af37] px-5 py-2.5 text-sm font-semibold text-black hover:brightness-95"
              >
                {t.view}
              </button>

              <a
                href={`/clasificados?lang=${lang}`}
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                {t.exploreAll}
              </a>

              {hasAnyFilter ? (
                <button
                  onClick={() => setFilters(DEFAULT_AUTOS_FILTERS)}
                  className="text-sm text-white/70 hover:text-white underline underline-offset-4"
                >
                  {t.reset}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        {/* LAYOUT: sidebar (desktop) + main */}
        <div className="grid gap-4 md:grid-cols-[320px_1fr]">
          {/* Sidebar desktop */}
          <aside className="hidden md:block">{SidebarContent}</aside>

          <div>
            {/* Quick bar (always compact) */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-yellow-200">{t.quick}</div>

              {/* Mobile opens drawer */}
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="md:hidden rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/10"
              >
                {t.more}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label>{t.price} {t.min}</Label>
                <Input
                  value={filters.minPrice}
                  onChange={(v) => setFilters((p) => ({ ...p, minPrice: v }))}
                  placeholder="0"
                  inputMode="numeric"
                />
              </div>
              <div>
                <Label>{t.price} {t.max}</Label>
                <Input
                  value={filters.maxPrice}
                  onChange={(v) => setFilters((p) => ({ ...p, maxPrice: v }))}
                  placeholder="50000"
                  inputMode="numeric"
                />
              </div>
              <div>
                <Label>{t.year} {t.min}</Label>
                <Input
                  value={filters.yearMin}
                  onChange={(v) => setFilters((p) => ({ ...p, yearMin: v }))}
                  placeholder="2005"
                  inputMode="numeric"
                />
              </div>
              <div>
                <Label>{t.year} {t.max}</Label>
                <Input
                  value={filters.yearMax}
                  onChange={(v) => setFilters((p) => ({ ...p, yearMax: v }))}
                  placeholder="2025"
                  inputMode="numeric"
                />
              </div>

              <div className="col-span-2 sm:col-span-2">
                <Label>{t.make}</Label>
                <Input
                  value={filters.make}
                  onChange={(v) => setFilters((p) => ({ ...p, make: v }))}
                  placeholder={t.hintMake}
                />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <Label>{t.model}</Label>
                <Input
                  value={filters.model}
                  onChange={(v) => setFilters((p) => ({ ...p, model: v }))}
                  placeholder={t.hintModel}
                />
              </div>
            </div>
          </div>

          {/* Guidance */}
          <div className="mt-3 text-[11px] text-gray-400">{t.note}</div>
          </div>
        </div>
      </section>

      <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title={t.sidebar}>
        {SidebarContent}
      </Drawer>
    </main>
  );
}
