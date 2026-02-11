"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Lang = "es" | "en";

type EmpleosFilters = {
  jobType: string;
  minPay: string;
  maxPay: string;
  remote: string;
  industry: string;
};

const DEFAULT_FILTERS: EmpleosFilters = {
  jobType: "",
  minPay: "",
  maxPay: "",
  remote: "",
  industry: "",
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

function buildParams(f: EmpleosFilters) {
  const p = new URLSearchParams();
  if (f.jobType) p.set("jtype", f.jobType);
  if (f.minPay) p.set("jpmin", f.minPay);
  if (f.maxPay) p.set("jpmax", f.maxPay);
  if (f.remote) p.set("jremote", f.remote);
  if (f.industry.trim()) p.set("jindustry", f.industry.trim());
  return p;
}

export default function Page() {
  const sp = useSearchParams(); // Next 15: possibly null
  const router = useRouter();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const [filters, setFilters] = useState<EmpleosFilters>(DEFAULT_FILTERS);

  const t = {
    es: {
      title: "Empleos",
      subtitle: "Encuentra trabajo. Filtra por tipo, pago y remoto/presencial.",
      view: "Ver resultados",
      exploreAll: "Explorar todas las categorías",
      reset: "Restablecer",
      quick: "Filtros rápidos",
      jobType: "Tipo de trabajo",
      minPay: "Pago mín.",
      maxPay: "Pago máx.",
      remote: "Modalidad",
      industry: "Industria",
      any: "Cualquiera",
    },
    en: {
      title: "Jobs",
      subtitle: "Find jobs. Filter by type, pay, and remote/on-site.",
      view: "See results",
      exploreAll: "Explore all categories",
      reset: "Reset",
      quick: "Quick filters",
      jobType: "Job type",
      minPay: "Min pay",
      maxPay: "Max pay",
      remote: "Work mode",
      industry: "Industry",
      any: "Any",
    },
  }[lang];

  const goToListaHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("cat", "empleos");
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
            <Label>{t.jobType}</Label>
            <Select value={filters.jobType} onChange={(v) => setFilters((p) => ({ ...p, jobType: v }))}>
              <option value="">{t.any}</option>
              <option value="full-time">{lang === "es" ? "Tiempo completo" : "Full-time"}</option>
              <option value="part-time">{lang === "es" ? "Medio tiempo" : "Part-time"}</option>
              <option value="contract">{lang === "es" ? "Contrato" : "Contract"}</option>
              <option value="gig">{lang === "es" ? "Temporal" : "Gig"}</option>
            </Select>
          </div>

          <div>
            <Label>{t.minPay}</Label>
            <Input value={filters.minPay} onChange={(v) => setFilters((p) => ({ ...p, minPay: v }))} placeholder="0" inputMode="numeric" />
          </div>
          <div>
            <Label>{t.maxPay}</Label>
            <Input value={filters.maxPay} onChange={(v) => setFilters((p) => ({ ...p, maxPay: v }))} placeholder="40" inputMode="numeric" />
          </div>

          <div>
            <Label>{t.remote}</Label>
            <Select value={filters.remote} onChange={(v) => setFilters((p) => ({ ...p, remote: v }))}>
              <option value="">{t.any}</option>
              <option value="onsite">{lang === "es" ? "Presencial" : "On-site"}</option>
              <option value="remote">{lang === "es" ? "Remoto" : "Remote"}</option>
              <option value="hybrid">{lang === "es" ? "Híbrido" : "Hybrid"}</option>
            </Select>
          </div>

          <div>
            <Label>{t.industry}</Label>
            <Input
              value={filters.industry}
              onChange={(v) => setFilters((p) => ({ ...p, industry: v }))}
              placeholder={lang === "es" ? "Ej: construcción, restaurante…" : "e.g. construction, restaurant…"}
            />
          </div>
        </div>

        <div className="mt-3 text-[11px] text-gray-400">
          {lang === "es"
            ? "Tip: anuncios con teléfono y email cierran más rápido. Toca para llamar o escribir."
            : "Tip: listings with phone and email close faster. Tap to call or email."}
        </div>
      </div>
    </div>
  );
}
