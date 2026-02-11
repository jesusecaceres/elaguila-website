"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_RENTAS_FILTERS, type RentasFilters } from "./rentasFilters";

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
      price: "Precio (mensual)",
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
      price: "Price (monthly)",
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
    <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
      <div className="text-sm font-semibold text-yellow-200">
        {lang === "es" ? "Más filtros" : "More filters"}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <Label>{t.min} ($)</Label>
          <Input value={value.minRent} onChange={(v) => set({ minRent: v })} placeholder="0" inputMode="numeric" />
        </div>
        <div>
          <Label>{t.max} ($)</Label>
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
    // DEFAULT_RENTAS_FILTERS uses enums; quick check by comparing JSON strings is safe here.
    return JSON.stringify(filters) !== JSON.stringify(DEFAULT_RENTAS_FILTERS);
  }, [filters]);

  const t = {
    es: {
      title: "Rentas",
      subtitle:
        "Departamentos, casas, estudios y cuartos. Filtros reales para encontrar rápido.",
      view: "Ver rentas disponibles",
      exploreAll: "Explorar todas las categorías",
      reset: "Restablecer",
      quick: "Filtros rápidos",
      more: "Más filtros",
      priceMin: "Precio mín. ($)",
      priceMax: "Precio máx. ($)",
      beds: "Recámaras",
      type: "Tipo",
      any: "Cualquiera",
    },
    en: {
      title: "Rentals",
      subtitle:
        "Apartments, houses, studios and rooms. Real filters to find faster.",
      view: "Browse rentals",
      exploreAll: "Explore all categories",
      reset: "Reset",
      quick: "Quick filters",
      more: "More filters",
      priceMin: "Min price ($)",
      priceMax: "Max price ($)",
      beds: "Bedrooms",
      type: "Type",
      any: "Any",
    },
  }[lang];

  const set = (patch: Partial<RentasFilters>) => setFilters((p) => ({ ...p, ...patch }));

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
              onClick={() => setFilters(DEFAULT_RENTAS_FILTERS)}
              className="text-xs font-semibold text-gray-300 underline underline-offset-4 hover:text-white"
            >
              {t.reset}
            </button>
          ) : null}
        </div>
      </div>

      {/* QUICK FILTERS */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-black/45 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-yellow-200">{t.quick}</div>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/10"
          >
            {t.more}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <Label>{t.priceMin}</Label>
            <Input value={filters.minRent} onChange={(v) => set({ minRent: v })} placeholder="0" inputMode="numeric" />
          </div>
          <div>
            <Label>{t.priceMax}</Label>
            <Input value={filters.maxRent} onChange={(v) => set({ maxRent: v })} placeholder="5000" inputMode="numeric" />
          </div>

          <div>
            <Label>{t.beds}</Label>
            <Select value={filters.beds} onChange={(v) => set({ beds: v })}>
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
            <Label>{t.type}</Label>
            <Select value={filters.propertyType} onChange={(v) => set({ propertyType: v })}>
              <option value="">{t.any}</option>
              <option value="apartment">{lang === "es" ? "Apartamento" : "Apartment"}</option>
              <option value="house">{lang === "es" ? "Casa" : "House"}</option>
              <option value="condo">{lang === "es" ? "Condominio" : "Condo"}</option>
              <option value="adu">ADU / In-law</option>
            </Select>
          </div>
        </div>
      </div>

      {moreOpen ? (
        <div className="mt-4">
          <RentasMoreFilters lang={lang} value={filters} onChange={setFilters} />
        </div>
      ) : null}
    </div>
  );
}
