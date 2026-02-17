"use client";

import Image from "next/image";
import type React from "react";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_RENTAS_FILTERS, type RentasFilters } from "./rentasFilters";
import Navbar from "../../components/Navbar";
import newLogo from "../../../public/logo.png";

type Lang = "es" | "en";

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
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />
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

function RentasMoreFilters({
  lang,
  value,
  onChange,
}: {
  lang: Lang;
  value: RentasFilters;
  onChange: (next: RentasFilters) => void;
}) {
  const t = {
    es: {
      min: "Mín",
      max: "Máx",
      beds: "Recámaras",
      baths: "Baños",
      type: "Tipo",
      pets: "Mascotas",
      parking: "Estacionamiento",
      furnished: "Amueblado",
      utils: "Utilidades",
      availability: "Disponibilidad",
      sqft: "Tamaño (sqft)",
      lease: "Contrato",
      any: "Cualquiera",
      included: "Incluidas",
      now: "Disponible ahora",
      in30: "≤ 30 días",
      monthToMonth: "Mes a mes",
    },
    en: {
      min: "Min",
      max: "Max",
      beds: "Bedrooms",
      baths: "Bathrooms",
      type: "Property type",
      pets: "Pets",
      parking: "Parking",
      furnished: "Furnished",
      utils: "Utilities",
      availability: "Availability",
      sqft: "Size (sqft)",
      lease: "Lease",
      any: "Any",
      included: "Included",
      now: "Available now",
      in30: "≤ 30 days",
      monthToMonth: "Month-to-month",
    },
  }[lang];

  const set = (patch: Partial<RentasFilters>) => onChange({ ...value, ...patch });

  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
      <div className="text-sm font-semibold text-yellow-200">
        {lang === "es" ? "Más filtros" : "More filters"}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <Label>{lang === "es" ? "Precio mín. ($)" : "Min price ($)"}</Label>
          <Input value={value.minRent} onChange={(v) => set({ minRent: v })} placeholder="0" inputMode="numeric" />
        </div>
        <div>
          <Label>{lang === "es" ? "Precio máx. ($)" : "Max price ($)"}</Label>
          <Input value={value.maxRent} onChange={(v) => set({ maxRent: v })} placeholder="5000" inputMode="numeric" />
        </div>

        <div>
          <Label>{t.beds}</Label>
          <Select value={value.beds} onChange={(v) => set({ beds: v })}>
            <option value="">{t.any}</option>
            <option value="room">{lang === "es" ? "Cuarto" : "Room"}</option>
            <option value="studio">{lang === "es" ? "Estudio" : "Studio"}</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4+">4+</option>
          </Select>
        </div>

        <div>
          <Label>{t.baths}</Label>
          <Select value={value.baths} onChange={(v) => set({ baths: v })}>
            <option value="">{t.any}</option>
            <option value="1">1+</option>
            <option value="1.5">1.5+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4+">4+</option>
          </Select>
        </div>

        <div className="col-span-2">
          <Label>{t.type}</Label>
          <Select value={value.propertyType} onChange={(v) => set({ propertyType: v })}>
            <option value="">{t.any}</option>
            <option value="apartment">{lang === "es" ? "Apartamento" : "Apartment"}</option>
            <option value="house">{lang === "es" ? "Casa" : "House"}</option>
            <option value="townhouse">Townhouse</option>
            <option value="condo">{lang === "es" ? "Condominio" : "Condo"}</option>
            <option value="duplex">Duplex / Triplex</option>
            <option value="adu">ADU / In-law</option>
            <option value="mobile">{lang === "es" ? "Casa móvil" : "Mobile home"}</option>
          </Select>
        </div>

        <div>
          <Label>{t.pets}</Label>
          <Select value={value.pets} onChange={(v) => set({ pets: v as any })}>
            <option value="any">{t.any}</option>
            <option value="dogs">{lang === "es" ? "Perros" : "Dogs"}</option>
            <option value="cats">{lang === "es" ? "Gatos" : "Cats"}</option>
            <option value="none">{lang === "es" ? "Sin mascotas" : "No pets"}</option>
          </Select>
        </div>

        <div>
          <Label>{t.parking}</Label>
          <Select value={value.parking} onChange={(v) => set({ parking: v })}>
            <option value="">{t.any}</option>
            <option value="garage">{lang === "es" ? "Garaje" : "Garage"}</option>
            <option value="assigned">{lang === "es" ? "Asignado" : "Assigned"}</option>
            <option value="street">{lang === "es" ? "Calle" : "Street"}</option>
            <option value="none">{lang === "es" ? "Sin estacionamiento" : "No parking"}</option>
          </Select>
        </div>

        <div>
          <Label>{t.furnished}</Label>
          <Select value={value.furnished} onChange={(v) => set({ furnished: v as any })}>
            <option value="any">{t.any}</option>
            <option value="yes">{lang === "es" ? "Sí" : "Yes"}</option>
            <option value="no">{lang === "es" ? "No" : "No"}</option>
          </Select>
        </div>

        <div>
          <Label>{t.utils}</Label>
          <Select value={value.utilities} onChange={(v) => set({ utilities: v as any })}>
            <option value="any">{t.any}</option>
            <option value="included">{t.included}</option>
          </Select>
        </div>

        <div className="col-span-2">
          <Label>{t.availability}</Label>
          <Select value={value.availability} onChange={(v) => set({ availability: v as any })}>
            <option value="any">{t.any}</option>
            <option value="now">{t.now}</option>
            <option value="30">{t.in30}</option>
          </Select>
        </div>

        <div>
          <Label>
            {t.sqft} {t.min}
          </Label>
          <Input value={value.sqftMin} onChange={(v) => set({ sqftMin: v })} placeholder="0" inputMode="numeric" />
        </div>
        <div>
          <Label>
            {t.sqft} {t.max}
          </Label>
          <Input value={value.sqftMax} onChange={(v) => set({ sqftMax: v })} placeholder="2500" inputMode="numeric" />
        </div>

        <div className="col-span-2">
          <Label>{t.lease}</Label>
          <Select value={value.leaseTerm} onChange={(v) => set({ leaseTerm: v })}>
            <option value="">{t.any}</option>
            <option value="month-to-month">{t.monthToMonth}</option>
            <option value="6">6 {lang === "es" ? "meses" : "months"}</option>
            <option value="12">12 {lang === "es" ? "meses" : "months"}</option>
          </Select>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-gray-400">
        {lang === "es"
          ? "Nota: algunos anuncios antiguos no incluyen todos los campos. En esos casos, no se ocultan por estos filtros."
          : "Note: some older listings may not have all fields. In those cases, they are not hidden by these filters."}
      </div>
    </div>
  );
}

function buildRentasParams(f: RentasFilters) {
  const p = new URLSearchParams();

  if (f.minRent) p.set("rpmin", f.minRent);
  if (f.maxRent) p.set("rpmax", f.maxRent);

  if (f.beds) p.set("rbeds", f.beds);
  if (f.baths) p.set("rbaths", f.baths);

  if (f.propertyType) p.set("rtype", f.propertyType);

  if (f.pets && f.pets !== "any") p.set("rpets", f.pets);
  if (f.parking) p.set("rparking", f.parking);

  if (f.furnished && f.furnished !== "any") p.set("rfurnished", f.furnished);
  if (f.utilities && f.utilities !== "any") p.set("rutilities", f.utilities);

  if (f.availability && f.availability !== "any") p.set("ravailable", f.availability);

  if (f.sqftMin) p.set("rsqmin", f.sqftMin);
  if (f.sqftMax) p.set("rsqmax", f.sqftMax);

  if (f.leaseTerm) p.set("rleaseterm", f.leaseTerm);

  return p;
}

export default function Page() {
  const sp = useSearchParams(); // Next 15 types: possibly null
  const router = useRouter();

  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const [filters, setFilters] = useState<RentasFilters>(DEFAULT_RENTAS_FILTERS);
  const [moreOpen, setMoreOpen] = useState(false);

  const goToListaHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("cat", "rentas");
    params.set("lang", lang);

    const keep = ["q", "city", "zip", "r", "sort", "view"];
    for (const k of keep) {
      const v = sp?.get(k);
      if (v) params.set(k, v);
    }

    const rentasParams = buildRentasParams(filters);
    rentasParams.forEach((v, k) => params.set(k, v));

    return `/clasificados/lista?${params.toString()}`;
  }, [filters, lang, sp]);

  const hasAnyFilter = useMemo(() => {
    return JSON.stringify(filters) !== JSON.stringify(DEFAULT_RENTAS_FILTERS);
  }, [filters]);

  const t = {
    es: {
      title: "Rentas",
      subtitle: "Departamentos, casas, estudios, cuartos y estancias flexibles (mes a mes).",
      view: "Ver rentas disponibles",
      exploreAll: "Explorar todas las categorías",
      reset: "Restablecer",
      quick: "Filtros rápidos",
      more: "Más filtros",
      sidebar: "Filtros",
      any: "Cualquiera",
      priceMin: "Precio mín.",
      priceMax: "Precio máx.",
      beds: "Recámaras",
      type: "Tipo",
      chipsTitle: "Atajos",
      chipRoom: "Cuartos",
      chipStudio: "Estudios",
      chipApt: "Apartamentos",
      chipHouse: "Casas",
      chipFlex: "Temporales",
    },
    en: {
      title: "Rentals",
      subtitle: "Apartments, houses, studios, rooms and flexible stays (month-to-month).",
      view: "Browse rentals",
      exploreAll: "Explore all categories",
      reset: "Reset",
      quick: "Quick filters",
      more: "More filters",
      sidebar: "Filters",
      any: "Any",
      priceMin: "Min price",
      priceMax: "Max price",
      beds: "Bedrooms",
      type: "Type",
      chipsTitle: "Shortcuts",
      chipRoom: "Rooms",
      chipStudio: "Studios",
      chipApt: "Apartments",
      chipHouse: "Houses",
      chipFlex: "Short-term",
    },
  }[lang];

  const set = (patch: Partial<RentasFilters>) => setFilters((p) => ({ ...p, ...patch }));

  const applyShortcut = (key: "room" | "studio" | "apartment" | "house" | "flex") => {
    if (key === "room") {
      setFilters((p) => ({ ...p, beds: "room" }));
      return;
    }
    if (key === "studio") {
      setFilters((p) => ({ ...p, beds: "studio" }));
      return;
    }
    if (key === "apartment") {
      setFilters((p) => ({ ...p, propertyType: "apartment" }));
      return;
    }
    if (key === "house") {
      setFilters((p) => ({ ...p, propertyType: "house" }));
      return;
    }
    // flex: month-to-month + furnished any (keeps fairness)
    setFilters((p) => ({ ...p, leaseTerm: "month-to-month" }));
  };

  const Sidebar = (
    <div className="space-y-3">
      <RentasMoreFilters lang={lang} value={filters} onChange={setFilters} />
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
                  onClick={() => setFilters(DEFAULT_RENTAS_FILTERS)}
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
      {/* LAYOUT */}
      <div className="mt-8 grid gap-4 md:grid-cols-[320px_1fr]">
        {/* Sidebar desktop */}
        <aside className="hidden md:block">{Sidebar}</aside>

        <div>
          {/* Shortcuts */}
          <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-yellow-200">{t.chipsTitle}</div>
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="md:hidden rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/10"
              >
                {t.more}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyShortcut("room")}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/10"
              >
                {t.chipRoom}
              </button>
              <button
                type="button"
                onClick={() => applyShortcut("studio")}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/10"
              >
                {t.chipStudio}
              </button>
              <button
                type="button"
                onClick={() => applyShortcut("apartment")}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/10"
              >
                {t.chipApt}
              </button>
              <button
                type="button"
                onClick={() => applyShortcut("house")}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/10"
              >
                {t.chipHouse}
              </button>
              <button
                type="button"
                onClick={() => applyShortcut("flex")}
                className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1.5 text-xs font-semibold text-yellow-200 hover:bg-yellow-400/15"
              >
                {t.chipFlex}
              </button>
            </div>
          </div>

          {/* Quick filters */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-4">
            <div className="text-sm font-semibold text-yellow-200">{t.quick}</div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label>{t.priceMin} ($)</Label>
                <Input value={filters.minRent} onChange={(v) => set({ minRent: v })} placeholder="0" inputMode="numeric" />
              </div>
              <div>
                <Label>{t.priceMax} ($)</Label>
                <Input value={filters.maxRent} onChange={(v) => set({ maxRent: v })} placeholder="5000" inputMode="numeric" />
              </div>

              <div>
                <Label>{t.beds}</Label>
                <Select value={filters.beds} onChange={(v) => set({ beds: v })}>
                  <option value="">{t.any}</option>
                  <option value="room">{lang === "es" ? "Cuarto" : "Room"}</option>
                  <option value="studio">{lang === "es" ? "Studio" : "Studio"}</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4+">4+</option>
                </Select>
              </div>

              <div>
                <Label>{t.type}</Label>
                <Select value={filters.propertyType} onChange={(v) => set({ propertyType: v })}>
                  <option value="">{t.any}</option>
                  <option value="apartment">{lang === "es" ? "Apartamento" : "Apartment"}</option>
                  <option value="house">{lang === "es" ? "Casa" : "House"}</option>
                  <option value="condo">{lang === "es" ? "Condo" : "Condo"}</option>
                  <option value="adu">ADU</option>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      </section>

      <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title={t.sidebar}>
        {Sidebar}
      </Drawer>
    </main>
  );
}
